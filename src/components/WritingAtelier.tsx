import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  CheckCheck,
  Copy,
  Eye,
  Loader2,
  PenLine,
  Sparkles,
  SpellCheck,
  Trash2,
} from 'lucide-react';
import type {
  GrammarIssue,
  SpellingIssue,
  VocabularySuggestion,
  WritingAnalysisResult,
} from '../types/lexicon';
import { SAMPLE_DRAFTS, runInstantLocalChecks } from '../utils/quickChecks';

interface WritingAtelierProps {
  onDefineWord: (word: string) => void;
  editorRef: React.RefObject<HTMLTextAreaElement | null>;
}

type InspectorTab = 'all' | 'spelling' | 'grammar' | 'vocabulary';
type SheetMode = 'compose' | 'proof';

const TONE_GOALS = [
  'Poetic & Warm',
  'Academic & Refined',
  'Concise & Crisp',
  'Editorial & Persuasive',
];

interface HighlightSegment {
  text: string;
  kind: 'plain' | 'spelling' | 'grammar' | 'vocabulary';
  issueId?: string;
}

function buildHighlightedSegments(
  text: string,
  spelling: SpellingIssue[],
  grammar: GrammarIssue[],
  vocab: VocabularySuggestion[]
): HighlightSegment[] {
  type SpanItem = {
    start: number;
    end: number;
    kind: 'spelling' | 'grammar' | 'vocabulary';
    id: string;
    priority: number;
  };

  const candidates: SpanItem[] = [
    ...spelling
      .filter((s) => s.startIndex >= 0 && s.endIndex > s.startIndex && s.endIndex <= text.length)
      .map((s) => ({
        start: s.startIndex,
        end: s.endIndex,
        kind: 'spelling' as const,
        id: s.id,
        priority: 3,
      })),
    ...grammar
      .filter((g) => g.startIndex >= 0 && g.endIndex > g.startIndex && g.endIndex <= text.length)
      .map((g) => ({
        start: g.startIndex,
        end: g.endIndex,
        kind: 'grammar' as const,
        id: g.id,
        priority: 2,
      })),
    ...vocab
      .filter((v) => v.startIndex >= 0 && v.endIndex > v.startIndex && v.endIndex <= text.length)
      .map((v) => ({
        start: v.startIndex,
        end: v.endIndex,
        kind: 'vocabulary' as const,
        id: v.id,
        priority: 1,
      })),
  ];

  candidates.sort((a, b) => a.start - b.start || b.priority - a.priority);

  const nonOverlapping: SpanItem[] = [];
  for (const item of candidates) {
    const prev = nonOverlapping[nonOverlapping.length - 1];
    if (!prev || item.start >= prev.end) {
      nonOverlapping.push(item);
    }
  }

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const span of nonOverlapping) {
    if (span.start > cursor) {
      segments.push({ text: text.slice(cursor, span.start), kind: 'plain' });
    }
    segments.push({
      text: text.slice(span.start, span.end),
      kind: span.kind,
      issueId: span.id,
    });
    cursor = span.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), kind: 'plain' });
  }
  return segments;
}

export function WritingAtelier({ onDefineWord, editorRef }: WritingAtelierProps) {
  const [text, setText] = useState(SAMPLE_DRAFTS[0].text);
  const [toneGoal, setToneGoal] = useState(SAMPLE_DRAFTS[0].toneGoal);
  const [autoCheck, setAutoCheck] = useState(true);
  const [sheetMode, setSheetMode] = useState<SheetMode>('compose');
  const [activeTab, setActiveTab] = useState<InspectorTab>('all');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<WritingAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [copiedPolish, setCopiedPolish] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const lastAnalyzedRef = useRef<string>('');

  const runServerAnalysis = async (draftText: string, goal: string) => {
    const trimmed = draftText.trim();
    if (!trimmed) {
      setAnalysis(null);
      setAnalysisError(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: draftText, toneGoal: goal }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Could not analyze writing right now.');
      }
      lastAnalyzedRef.current = `${goal}::${draftText}`;
      setAnalysis(data as WritingAnalysisResult);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Unable to complete writing check.';
      setAnalysisError(msg);
    } finally {
      if (!controller.signal.aborted) {
        setAnalyzing(false);
      }
    }
  };

  // Real-time debounced analysis as the user types
  useEffect(() => {
    if (!autoCheck) return;
    if (!text.trim()) {
      setAnalysis(null);
      return;
    }
    const key = `${toneGoal}::${text}`;
    if (key === lastAnalyzedRef.current) return;

    const timer = window.setTimeout(() => {
      runServerAnalysis(text, toneGoal);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [text, toneGoal, autoCheck]);

  // Merge zero-latency local spelling/repetition checks with server analysis
  const localChecks = useMemo(() => runInstantLocalChecks(text), [text]);

  const mergedSpelling = useMemo(() => {
    const serverItems = (analysis?.spellingIssues ?? []).filter(
      (item) => text.slice(item.startIndex, item.endIndex) === item.original
    );
    const serverRanges = serverItems.map((s) => [s.startIndex, s.endIndex]);
    const extraLocal = localChecks.spellingIssues.filter(
      (l) => !serverRanges.some(([s, e]) => l.startIndex < e && l.endIndex > s)
    );
    return [...serverItems, ...extraLocal].sort((a, b) => a.startIndex - b.startIndex);
  }, [analysis, localChecks, text]);

  const mergedGrammar = useMemo(() => {
    const serverItems = (analysis?.grammarIssues ?? []).filter(
      (item) => text.slice(item.startIndex, item.endIndex) === item.original
    );
    const serverRanges = serverItems.map((g) => [g.startIndex, g.endIndex]);
    const extraLocal = localChecks.grammarIssues.filter(
      (l) => !serverRanges.some(([s, e]) => l.startIndex < e && l.endIndex > s)
    );
    return [...serverItems, ...extraLocal].sort((a, b) => a.startIndex - b.startIndex);
  }, [analysis, localChecks, text]);

  const activeVocab = useMemo(() => {
    return (analysis?.vocabularySuggestions ?? [])
      .filter((item) => text.slice(item.startIndex, item.endIndex) === item.original)
      .sort((a, b) => a.startIndex - b.startIndex);
  }, [analysis, text]);

  const segments = useMemo(
    () => buildHighlightedSegments(text, mergedSpelling, mergedGrammar, activeVocab),
    [text, mergedSpelling, mergedGrammar, activeVocab]
  );

  const replaceSpan = (startIndex: number, endIndex: number, replacement: string) => {
    setText((prev) => {
      if (startIndex < 0 || endIndex > prev.length) return prev;
      return prev.slice(0, startIndex) + replacement + prev.slice(endIndex);
    });
    setSelectedIssueId(null);
  };

  const applyAllSpellingFixes = () => {
    if (mergedSpelling.length === 0) return;
    let updated = text;
    // Apply from end to start so earlier indices remain valid
    const sortedDesc = [...mergedSpelling].sort((a, b) => b.startIndex - a.startIndex);
    for (const issue of sortedDesc) {
      const fix = issue.suggestions[0];
      if (!fix) continue;
      if (updated.slice(issue.startIndex, issue.endIndex) === issue.original) {
        updated = updated.slice(0, issue.startIndex) + fix + updated.slice(issue.endIndex);
      }
    }
    setText(updated);
    setSelectedIssueId(null);
  };

  const wordCount = useMemo(() => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [text]);

  const readingMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const totalFindings =
    mergedSpelling.length + mergedGrammar.length + activeVocab.length;

  const showSpelling = activeTab === 'all' || activeTab === 'spelling';
  const showGrammar = activeTab === 'all' || activeTab === 'grammar';
  const showVocab = activeTab === 'all' || activeTab === 'vocabulary';

  const handleSelectHighlight = (segment: HighlightSegment) => {
    if (!segment.issueId) return;
    setSelectedIssueId(segment.issueId);
    if (segment.kind === 'spelling') setActiveTab('spelling');
    else if (segment.kind === 'grammar') setActiveTab('grammar');
    else if (segment.kind === 'vocabulary') setActiveTab('vocabulary');
  };

  const handleCopyPolished = async () => {
    if (!analysis?.polishedExcerpt) return;
    try {
      await navigator.clipboard.writeText(analysis.polishedExcerpt);
      setCopiedPolish(true);
      window.setTimeout(() => setCopiedPolish(false), 1800);
    } catch {
      // Fallback ignored gracefully
    }
  };

  return (
    <section
      id="writing-desk"
      aria-labelledby="writing-desk-heading"
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-[#B33B68] mb-1">
            Grammar · Spelling · Vocabulary
          </p>
          <h2
            id="writing-desk-heading"
            className="font-editorial text-3xl sm:text-4xl font-semibold text-[#361C26] tracking-tight text-balance"
          >
            Writing &amp; Proofreading Desk
          </h2>
          <p className="text-sm text-[#72505D] mt-1">
            Compose naturally for real-time spelling corrections, grammar refinements, and elevated word choices.
          </p>
        </div>

        {/* Sample Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#987382] mr-1">Samples:</span>
          {SAMPLE_DRAFTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => {
                setText(sample.text);
                setToneGoal(sample.toneGoal);
                setSelectedIssueId(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#F1C6D6] hover:border-[#D85A8A] text-xs font-medium text-[#4D2E3B] hover:text-[#B33B68] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {sample.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setText('');
              setAnalysis(null);
              setAnalysisError(null);
              editorRef.current?.focus();
            }}
            aria-label="Clear writing canvas"
            className="px-3 py-1.5 rounded-lg bg-[#FFF7FA] border border-[#F1C6D6] hover:border-[#D85A8A] text-xs font-medium text-[#72505D] hover:text-[#B33B68] transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Stationery Writing Sheet */}
        <div className="lg:col-span-7 bg-white border border-[#F1C6D6] rounded-2xl shadow-[0_10px_30px_-18px_rgba(179,59,104,0.22)] flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="px-5 py-3.5 bg-[#FFF9FB] border-b border-[#F5D6E2] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-[#FDEEF4] rounded-xl border border-[#F1C6D6]">
              <button
                type="button"
                onClick={() => setSheetMode('compose')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  sheetMode === 'compose'
                    ? 'bg-white text-[#361C26] shadow-xs'
                    : 'text-[#72505D] hover:text-[#361C26]'
                }`}
              >
                <PenLine className="w-3.5 h-3.5 text-[#D85A8A]" aria-hidden="true" />
                <span>Edit Text</span>
              </button>
              <button
                type="button"
                onClick={() => setSheetMode('proof')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  sheetMode === 'proof'
                    ? 'bg-white text-[#361C26] shadow-xs'
                    : 'text-[#72505D] hover:text-[#361C26]'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-[#D85A8A]" aria-hidden="true" />
                <span>Annotated Proof</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-[#72505D]">
                <span>Voice:</span>
                <select
                  value={toneGoal}
                  onChange={(e) => setToneGoal(e.target.value)}
                  className="h-8 px-2.5 rounded-lg bg-white border border-[#ECC3D3] text-xs font-medium text-[#361C26] focus:outline-none focus:border-[#D85A8A]"
                >
                  {TONE_GOALS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-[#72505D] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoCheck}
                  onChange={(e) => setAutoCheck(e.target.checked)}
                  className="accent-[#D85A8A] rounded"
                />
                <span>Live check</span>
              </label>

              <button
                type="button"
                onClick={() => runServerAnalysis(text, toneGoal)}
                disabled={analyzing || !text.trim()}
                className="h-8 px-3.5 rounded-lg bg-[#D85A8A] hover:bg-[#B33B68] disabled:opacity-50 text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                {analyzing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <SpellCheck className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{analyzing ? 'Checking...' : 'Check Now'}</span>
              </button>
            </div>
          </div>

          {/* Main Sheet Surface */}
          <div className="flex-1 p-6 sm:p-7 min-h-[380px] flex flex-col">
            {sheetMode === 'compose' ? (
              <textarea
                ref={editorRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onDoubleClick={() => {
                  const selection = window.getSelection()?.toString().trim();
                  if (selection && /^[A-Za-z'-]{2,40}$/.test(selection)) {
                    onDefineWord(selection);
                  }
                }}
                placeholder="Begin writing your essay, letter, or note here. Double-click any word to open it in the dictionary..."
                aria-label="Writing editor"
                className="w-full flex-1 min-h-[330px] resize-y bg-transparent text-[16px] leading-[1.85] text-[#361C26] placeholder:text-[#B48E9D] focus:outline-none"
              />
            ) : (
              <div
                className="flex-1 min-h-[330px] text-[16px] leading-[1.85] text-[#361C26] whitespace-pre-wrap"
                aria-label="Annotated proofreading preview"
              >
                {text.trim() ? (
                  segments.map((seg, i) => {
                    if (seg.kind === 'plain') {
                      return <span key={i}>{seg.text}</span>;
                    }
                    const cls =
                      seg.kind === 'spelling'
                        ? 'proof-spelling'
                        : seg.kind === 'grammar'
                          ? 'proof-grammar'
                          : 'proof-vocabulary';
                    const isSelected = selectedIssueId === seg.issueId;
                    return (
                      <button
                        key={`${seg.issueId}-${i}`}
                        type="button"
                        onClick={() => handleSelectHighlight(seg)}
                        className={`${cls} inline text-left cursor-pointer transition-colors ${
                          isSelected ? 'ring-2 ring-[#D85A8A]' : ''
                        }`}
                      >
                        {seg.text}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-[#987382] italic">
                    Write a few sentences in Edit Text to inspect spelling, grammar, and vocabulary highlights here.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Legend & Tabular Word Metrics Footer */}
          <div className="px-5 py-3.5 bg-[#FFF9FB] border-t border-[#F5D6E2] flex flex-wrap items-center justify-between gap-3 text-xs text-[#72505D]">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="proof-spelling font-medium text-[#361C26]">Speling</span>
                <span>Spelling</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="proof-grammar font-medium text-[#361C26]">Grammar</span>
                <span>Grammar</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="proof-vocabulary font-medium text-[#361C26]">Nice</span>
                <span>Vocabulary</span>
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono tabular-nums text-[11px] text-[#72505D]">
              <span>{wordCount} words</span>
              <span aria-hidden="true">·</span>
              <span>{text.length} chars</span>
              <span aria-hidden="true">·</span>
              <span>{readingMinutes} min read</span>
            </div>
          </div>
        </div>

        {/* Right: Proofreading & Vocabulary Suggestion Inspector */}
        <div
          id="vocabulary-focus"
          className="lg:col-span-5 bg-white border border-[#F1C6D6] rounded-2xl shadow-[0_10px_30px_-18px_rgba(179,59,104,0.22)] flex flex-col overflow-hidden"
        >
          {/* Inspector Header & Filter Tabs */}
          <div className="px-5 py-3.5 bg-[#FFF9FB] border-b border-[#F5D6E2] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-[#72505D]">
                {analyzing ? (
                  <span className="text-[#B33B68] font-medium flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    Inspecting prose...
                  </span>
                ) : analysis ? (
                  <span>
                    <strong className="font-medium text-[#361C26]">
                      {analysis.readabilityLabel}
                    </strong>{' '}
                    · {analysis.toneSummary}
                  </span>
                ) : (
                  <span>Ready to inspect spelling, grammar &amp; style</span>
                )}
              </div>
              {mergedSpelling.length > 0 ? (
                <button
                  type="button"
                  onClick={applyAllSpellingFixes}
                  className="text-xs font-medium text-[#B33B68] hover:underline underline-offset-4 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Fix All Spelling</span>
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-4 gap-1 p-1 bg-[#FDEEF4] rounded-xl border border-[#F1C6D6]">
              {(
                [
                  { id: 'all', label: 'All', count: totalFindings },
                  { id: 'spelling', label: 'Spelling', count: mergedSpelling.length },
                  { id: 'grammar', label: 'Grammar', count: mergedGrammar.length },
                  { id: 'vocabulary', label: 'Vocab', count: activeVocab.length },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                    activeTab === tab.id
                      ? 'bg-white text-[#361C26] shadow-xs'
                      : 'text-[#72505D] hover:text-[#361C26]'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Suggestions Feed */}
          <div className="flex-1 p-5 space-y-4 max-h-[500px] overflow-y-auto">
            {analysisError ? (
              <div
                role="alert"
                className="rounded-xl bg-[#FFF2F6] border border-[#E9A8BE] p-3.5 text-xs text-[#8F284E] leading-relaxed"
              >
                {analysisError}
              </div>
            ) : null}

            {!text.trim() ? (
              <div className="py-12 text-center space-y-2">
                <p className="font-editorial italic text-2xl text-[#B33B68]">
                  A fresh sheet awaits
                </p>
                <p className="text-xs text-[#72505D] max-w-xs mx-auto leading-relaxed">
                  Type or choose a sample draft on the left to see real-time spelling checks, grammar fixes, and richer vocabulary choices.
                </p>
              </div>
            ) : totalFindings === 0 && !analyzing ? (
              <div className="py-10 text-center space-y-2 bg-[#FFF9FB] border border-[#F5D6E2] rounded-xl p-5">
                <Check className="w-6 h-6 text-[#B33B68] mx-auto" aria-hidden="true" />
                <p className="font-editorial text-2xl font-semibold text-[#361C26]">
                  Clean &amp; Graceful Prose
                </p>
                <p className="text-xs text-[#72505D] max-w-xs mx-auto leading-relaxed">
                  No spelling or grammar issues found in the current view. Keep writing or explore another tone target.
                </p>
              </div>
            ) : null}

            {/* Spelling Issues */}
            {showSpelling &&
              mergedSpelling.map((issue) => (
                <article
                  key={issue.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    selectedIssueId === issue.id
                      ? 'bg-[#FFF5F8] border-[#D85A8A]'
                      : 'bg-[#FFF9FB] border-[#F3D5E0]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <span className="font-semibold text-[#C9345A]">Spelling Check</span>
                    <span className="font-mono text-[#987382]">Misspelled word</span>
                  </div>
                  <p className="text-sm text-[#361C26] mb-2">
                    <span className="line-through text-[#C9345A] font-medium mr-2">
                      {issue.original}
                    </span>
                    <span className="text-xs text-[#72505D]">{issue.reason}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {issue.suggestions.map((sug) => (
                      <div key={sug} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => replaceSpan(issue.startIndex, issue.endIndex, sug)}
                          className="px-3 py-1 rounded-lg bg-[#D85A8A] hover:bg-[#B33B68] text-white text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Use “{sug}”
                        </button>
                        <button
                          type="button"
                          onClick={() => onDefineWord(sug)}
                          title={`Define ${sug}`}
                          aria-label={`Define ${sug}`}
                          className="p-1.5 rounded-lg border border-[#ECC3D3] bg-white hover:border-[#D85A8A] text-[#72505D] hover:text-[#B33B68] cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                </article>
              ))}

            {/* Grammar Issues */}
            {showGrammar &&
              mergedGrammar.map((issue) => (
                <article
                  key={issue.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    selectedIssueId === issue.id
                      ? 'bg-[#FFF5F8] border-[#D85A8A]'
                      : 'bg-[#FFF9FB] border-[#F3D5E0]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <span className="font-semibold text-[#9E3F7A]">{issue.category}</span>
                    <span className="text-[#987382]">Grammar refinement</span>
                  </div>
                  <div className="text-sm text-[#361C26] mb-2 space-y-1">
                    <div>
                      <span className="line-through text-[#987382] mr-2">{issue.original}</span>
                      <span className="font-medium text-[#361C26]">→ {issue.replacement}</span>
                    </div>
                    <p className="text-xs text-[#72505D] leading-relaxed">{issue.explanation}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      replaceSpan(issue.startIndex, issue.endIndex, issue.replacement)
                    }
                    className="px-3.5 py-1.5 rounded-lg bg-[#361C26] hover:bg-[#522B3A] text-white text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Apply Fix
                  </button>
                </article>
              ))}

            {/* Real-Time Vocabulary Upgrades */}
            {showVocab &&
              activeVocab.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    selectedIssueId === item.id
                      ? 'bg-[#FFF5F8] border-[#D85A8A]'
                      : 'bg-[#FFF9FB] border-[#F3D5E0]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <span className="font-semibold text-[#B33B68] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      Vocabulary Upgrade
                    </span>
                    <span className="font-editorial italic text-sm text-[#72505D]">
                      “{item.original}”
                    </span>
                  </div>
                  <p className="text-xs text-[#72505D] mb-3 leading-relaxed">{item.reason}</p>

                  <div className="space-y-2">
                    {item.alternatives.map((alt) => (
                      <div
                        key={alt.word}
                        className="bg-white border border-[#F1C6D6] rounded-lg p-2.5 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-baseline gap-2 text-xs">
                            <span className="font-editorial text-lg font-semibold text-[#361C26]">
                              {alt.word}
                            </span>
                            <span className="text-[#987382]">· {alt.tone}</span>
                          </div>
                          <p className="text-xs text-[#72505D] leading-snug">{alt.definition}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onDefineWord(alt.word)}
                            title={`Inspect ${alt.word} in dictionary`}
                            aria-label={`Inspect ${alt.word} in dictionary`}
                            className="p-1.5 rounded-lg border border-[#F1C6D6] hover:border-[#D85A8A] text-[#72505D] hover:text-[#B33B68] cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              replaceSpan(item.startIndex, item.endIndex, alt.word)
                            }
                            className="px-2.5 py-1 rounded-lg bg-[#FDEEF4] hover:bg-[#D85A8A] text-[#B33B68] hover:text-white border border-[#E5A9C0] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Swap
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}

            {/* Holistic Polished Rewrite Option */}
            {analysis?.polishedExcerpt &&
            analysis.polishedExcerpt.trim() !== text.trim() &&
            activeTab === 'all' ? (
              <div className="rounded-xl bg-[#FDEEF4]/70 border border-[#E5A9C0] p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#B33B68]">
                    Full Polished Edition ({toneGoal})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyPolished}
                      className="text-xs text-[#72505D] hover:text-[#361C26] flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{copiedPolish ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setText(analysis.polishedExcerpt)}
                      className="px-2.5 py-1 rounded-lg bg-[#D85A8A] hover:bg-[#B33B68] text-white text-xs font-medium transition-colors cursor-pointer"
                    >
                      Replace Draft
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#4D2E3B] leading-relaxed whitespace-pre-wrap">
                  {analysis.polishedExcerpt}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
