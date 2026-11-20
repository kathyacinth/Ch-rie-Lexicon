import { useCallback, useEffect, useRef, useState } from 'react';
import { TopBar } from './components/TopBar';
import { RibbonDivider, SatinBowIcon } from './components/CoquetteOrnaments';
import { DictionaryPanel } from './components/DictionaryPanel';
import { WritingAtelier } from './components/WritingAtelier';
import { WordbookSection } from './components/WordbookSection';
import type { DictionaryEntry, SavedWord } from './types/lexicon';
import { CURATED_ENTRIES } from './utils/quickChecks';

const WORDBOOK_STORAGE_KEY = 'cherie-lexicon-wordbook-v1';

function readSavedWords(): SavedWord[] {
  try {
    const raw = window.localStorage.getItem(WORDBOOK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedWords(words: SavedWord[]) {
  try {
    window.localStorage.setItem(WORDBOOK_STORAGE_KEY, JSON.stringify(words));
  } catch {
    // Ignore storage restriction errors in sandboxed frames
  }
}

export default function App() {
  const [dictQuery, setDictQuery] = useState('mellifluous');
  const [dictEntry, setDictEntry] = useState<DictionaryEntry>(CURATED_ENTRIES.mellifluous);
  const [dictLoading, setDictLoading] = useState(false);
  const [dictError, setDictError] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<SavedWord[]>(() => readSavedWords());

  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    writeSavedWords(savedWords);
  }, [savedWords]);

  const scrollToSection = useCallback((id: string) => {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleLookupWord = useCallback(async (rawWord: string) => {
    const cleaned = rawWord.trim();
    if (!cleaned) return;
    setDictQuery(cleaned);
    setDictError(null);

    const curated = CURATED_ENTRIES[cleaned.toLowerCase()];
    if (curated) {
      setDictEntry(curated);
      return;
    }

    setDictLoading(true);
    try {
      const res = await fetch('/api/dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Could not look up that word right now.');
      }
      setDictEntry(data as DictionaryEntry);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Dictionary request failed.';
      setDictError(msg);
    } finally {
      setDictLoading(false);
    }
  }, []);

  const handleDefineFromWriting = useCallback(
    (word: string) => {
      scrollToSection('dictionary-section');
      handleLookupWord(word);
    },
    [handleLookupWord, scrollToSection]
  );

  const isCurrentWordSaved = savedWords.some(
    (w) => w.word.toLowerCase() === dictEntry.word.toLowerCase()
  );

  const handleToggleSave = (entry: DictionaryEntry) => {
    setSavedWords((prev) => {
      const exists = prev.some(
        (item) => item.word.toLowerCase() === entry.word.toLowerCase()
      );
      if (exists) {
        return prev.filter(
          (item) => item.word.toLowerCase() !== entry.word.toLowerCase()
        );
      }
      const primaryPos = entry.meanings[0]?.partOfSpeech || 'word';
      const primaryDef =
        entry.meanings[0]?.definitions[0]?.definition || 'Saved dictionary entry.';
      const next: SavedWord = {
        word: entry.word,
        phonetic: entry.phonetic,
        partOfSpeech: primaryPos,
        primaryDefinition: primaryDef,
        savedAt: new Date().toISOString(),
      };
      return [next, ...prev];
    });
  };

  const handleRemoveSavedWord = (word: string) => {
    setSavedWords((prev) =>
      prev.filter((item) => item.word.toLowerCase() !== word.toLowerCase())
    );
  };

  const handleFocusWriting = () => {
    scrollToSection('writing-desk');
    window.setTimeout(() => {
      editorRef.current?.focus();
    }, 350);
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#FFF7FA] text-[#361C26]">
      <TopBar onNavigate={scrollToSection} onPrimaryAction={handleFocusWriting} />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-5 sm:px-8 py-8 sm:py-12 space-y-12">
        {/* Editorial Coquette Hero */}
        <section className="relative bg-[#FDEEF4]/80 border border-[#F1C6D6] rounded-3xl px-6 py-10 sm:px-12 sm:py-12 overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2.5 text-xs font-medium text-[#B33B68]">
              <SatinBowIcon className="w-6 h-4 text-[#D85A8A]" />
              <span>Dictionary · Grammar &amp; Spelling · Live Vocabulary Atelier</span>
            </div>

            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-[54px] font-semibold text-[#361C26] leading-[1.08] tracking-tight text-balance">
              Write with clarity, grace, and the exact right word.
            </h1>

            <p className="text-[15px] sm:text-base text-[#664451] leading-relaxed max-w-2xl">
              An intimate baby-pink writing studio pairing a rich etymological dictionary with real-time spelling checks, grammar refinements, and elevated vocabulary suggestions.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleFocusWriting}
                className="px-5 py-2.5 rounded-xl bg-[#D85A8A] hover:bg-[#B33B68] text-white text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Start Writing &amp; Checking
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('dictionary-section')}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#FFF9FB] border border-[#E5A9C0] text-[#361C26] text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Browse Dictionary
              </button>
            </div>
          </div>
        </section>

        <WritingAtelier onDefineWord={handleDefineFromWriting} editorRef={editorRef} />

        <RibbonDivider label="Lexicon &amp; Etymology" />

        <DictionaryPanel
          entry={dictEntry}
          loading={dictLoading}
          error={dictError}
          searchQuery={dictQuery}
          onSearchQueryChange={setDictQuery}
          onLookup={handleLookupWord}
          isSaved={isCurrentWordSaved}
          onToggleSave={handleToggleSave}
        />

        <WordbookSection
          savedWords={savedWords}
          onSelectWord={handleDefineFromWriting}
          onRemoveWord={handleRemoveSavedWord}
        />
      </main>

      <footer className="border-t border-[#F1C6D6] bg-[#FFF9FB] mt-8">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#72505D]">
          <div className="flex items-center gap-2">
            <SatinBowIcon className="w-5 h-3.5 text-[#D85A8A]" />
            <span className="font-editorial text-base font-semibold text-[#361C26]">
              Chérie Lexicon
            </span>
          </div>
          <p>
            Dictionary, spelling check, grammar proofing &amp; real-time vocabulary suggestions.
          </p>
        </div>
      </footer>
    </div>
  );
}
