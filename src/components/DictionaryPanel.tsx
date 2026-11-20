import { useState } from 'react';
import { Bookmark, BookmarkCheck, Loader2, Search, Volume2, BookOpen } from 'lucide-react';
import type { DictionaryEntry } from '../types/lexicon';
import { CURATED_ENTRIES } from '../utils/quickChecks';

interface DictionaryPanelProps {
  entry: DictionaryEntry;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onLookup: (word: string) => void;
  isSaved: boolean;
  onToggleSave: (entry: DictionaryEntry) => void;
}

const FEATURED_WORDS = ['mellifluous', 'sonder', 'halcyon', 'effervescent'];

export function DictionaryPanel({
  entry,
  loading,
  error,
  searchQuery,
  onSearchQueryChange,
  onLookup,
  isSaved,
  onToggleSave,
}: DictionaryPanelProps) {
  const [speaking, setSpeaking] = useState(false);

  const handlePronounce = (word: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.92;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onLookup(searchQuery.trim());
    }
  };

  return (
    <section
      id="dictionary-section"
      aria-labelledby="dictionary-heading"
      className="bg-white border border-[#F1C6D6] rounded-2xl p-6 sm:p-8 shadow-[0_10px_30px_-18px_rgba(179,59,104,0.22)]"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#F7DCE6]">
        <div className="max-w-xl">
          <p className="text-xs font-medium tracking-wide text-[#B33B68] mb-1.5">
            Lexicon &amp; Etymology
          </p>
          <h2
            id="dictionary-heading"
            className="font-editorial text-3xl sm:text-4xl font-semibold text-[#361C26] tracking-tight text-balance"
          >
            Dictionary &amp; Word Nuance
          </h2>
          <p className="text-sm text-[#72505D] mt-1.5 leading-relaxed">
            Explore definitions, IPA pronunciation, literary origins, synonyms, and collocations for any word.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full lg:w-[440px] flex gap-2.5">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-[#987382] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search a word, e.g. serendipity..."
              aria-label="Search dictionary word"
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#FFF9FB] border border-[#ECC3D3] text-sm text-[#361C26] placeholder:text-[#987382] focus:outline-none focus:border-[#D85A8A] focus:ring-2 focus:ring-[#F9CFE0] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="h-11 px-5 rounded-xl bg-[#D85A8A] hover:bg-[#B33B68] disabled:opacity-50 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Look Up</span>
          </button>
        </form>
      </div>

      {/* Featured Curated Headword Tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-4 pb-6">
        <span className="text-xs text-[#987382] mr-1">Featured entries:</span>
        {FEATURED_WORDS.map((w) => {
          const active = entry.word.toLowerCase() === w;
          return (
            <button
              key={w}
              type="button"
              onClick={() => {
                onSearchQueryChange(w);
                onLookup(w);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#FDEEF4] text-[#B33B68] border border-[#E5A9C0]'
                  : 'text-[#72505D] hover:bg-[#FFF7FA] hover:text-[#361C26] border border-transparent'
              }`}
            >
              {CURATED_ENTRIES[w]?.word ?? w}
            </button>
          );
        })}
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-6 rounded-xl bg-[#FFF2F6] border border-[#E9A8BE] px-4 py-3 text-sm text-[#8F284E]"
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="py-10 space-y-5 animate-pulse" aria-live="polite">
          <div className="h-10 w-56 bg-[#FDEEF4] rounded-lg" />
          <div className="h-4 w-80 bg-[#FFF7FA] rounded" />
          <div className="space-y-3 pt-3">
            <div className="h-4 w-full bg-[#FFF7FA] rounded" />
            <div className="h-4 w-5/6 bg-[#FFF7FA] rounded" />
            <div className="h-4 w-2/3 bg-[#FFF7FA] rounded" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Primary Lexical Column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-baseline gap-3">
                  <h3 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#361C26] tracking-tight">
                    {entry.word}
                  </h3>
                  <span className="font-mono text-sm text-[#B33B68]">{entry.phonetic}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#72505D] mt-2">
                  <span>{entry.syllables}</span>
                  <span aria-hidden="true">·</span>
                  <span>{entry.register}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePronounce(entry.word)}
                  aria-label={`Pronounce ${entry.word}`}
                  className={`h-10 px-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    speaking
                      ? 'bg-[#FDEEF4] border-[#D85A8A] text-[#B33B68]'
                      : 'bg-[#FFF9FB] border-[#ECC3D3] text-[#361C26] hover:border-[#D85A8A]'
                  }`}
                >
                  <Volume2 className="w-4 h-4 text-[#D85A8A]" aria-hidden="true" />
                  <span>Listen</span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleSave(entry)}
                  aria-label={isSaved ? `Remove ${entry.word} from Wordbook` : `Save ${entry.word} to Wordbook`}
                  className={`h-10 px-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isSaved
                      ? 'bg-[#D85A8A] border-[#D85A8A] text-white'
                      : 'bg-[#FFF9FB] border-[#ECC3D3] text-[#361C26] hover:border-[#D85A8A]'
                  }`}
                >
                  {isSaved ? (
                    <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-[#D85A8A]" aria-hidden="true" />
                  )}
                  <span>{isSaved ? 'Saved' : 'Save Word'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-6 pt-2">
              {entry.meanings.map((meaning, mIdx) => (
                <div key={`${meaning.partOfSpeech}-${mIdx}`} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="font-editorial italic text-xl font-semibold text-[#B33B68]">
                      {meaning.partOfSpeech}
                    </span>
                    <div className="h-px flex-1 bg-[#F7DCE6]" />
                  </div>

                  <ol className="space-y-4">
                    {meaning.definitions.map((def, dIdx) => (
                      <li key={dIdx} className="flex gap-3.5">
                        <span className="font-mono text-xs text-[#987382] pt-1 tabular-nums shrink-0">
                          0{dIdx + 1}.
                        </span>
                        <div className="space-y-1.5">
                          <p className="text-[15px] text-[#361C26] leading-relaxed font-medium">
                            {def.definition}
                          </p>
                          {def.example ? (
                            <p className="font-editorial italic text-lg text-[#72505D] leading-snug">
                              “{def.example}”
                            </p>
                          ) : null}
                          {def.nuanceNote ? (
                            <p className="text-xs text-[#987382] leading-relaxed">
                              Nuance: {def.nuanceNote}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>

                  {(meaning.synonyms.length > 0 || meaning.antonyms.length > 0) && (
                    <div className="pt-2 space-y-2.5">
                      {meaning.synonyms.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
                          <span className="text-[#987382] font-medium mr-1">Synonyms:</span>
                          {meaning.synonyms.map((syn) => (
                            <button
                              key={syn}
                              type="button"
                              onClick={() => {
                                onSearchQueryChange(syn);
                                onLookup(syn);
                              }}
                              className="px-2.5 py-1 rounded-md bg-[#FFF7FA] hover:bg-[#FDEEF4] border border-[#F1C6D6] text-[#B33B68] transition-colors cursor-pointer"
                            >
                              {syn}
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {meaning.antonyms.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
                          <span className="text-[#987382] font-medium mr-1">Antonyms:</span>
                          {meaning.antonyms.map((ant) => (
                            <button
                              key={ant}
                              type="button"
                              onClick={() => {
                                onSearchQueryChange(ant);
                                onLookup(ant);
                              }}
                              className="px-2.5 py-1 rounded-md bg-[#FFF9FB] hover:bg-[#FDEEF4] border border-[#F3D5E0] text-[#72505D] hover:text-[#361C26] transition-colors cursor-pointer"
                            >
                              {ant}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Lexical Companion Notes */}
          <aside className="lg:col-span-4 space-y-5 bg-[#FFF7FA] border border-[#F3D5E0] rounded-xl p-5">
            <div>
              <h4 className="text-xs font-semibold text-[#B33B68] tracking-wide mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Origin &amp; Etymology</span>
              </h4>
              <p className="text-sm text-[#4D2E3B] leading-relaxed">{entry.etymology}</p>
            </div>

            {entry.collocations.length > 0 ? (
              <div className="pt-4 border-t border-[#F1C6D6]">
                <h4 className="text-xs font-semibold text-[#B33B68] tracking-wide mb-2">
                  Natural Pairings
                </h4>
                <ul className="space-y-1.5 text-sm text-[#4D2E3B]">
                  {entry.collocations.map((col) => (
                    <li key={col} className="font-editorial italic text-base">
                      · {col}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="pt-4 border-t border-[#F1C6D6]">
              <h4 className="text-xs font-semibold text-[#B33B68] tracking-wide mb-1.5">
                Writer’s Note
              </h4>
              <p className="text-sm text-[#4D2E3B] leading-relaxed">{entry.writingTip}</p>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
