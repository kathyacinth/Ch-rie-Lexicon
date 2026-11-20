import { ArrowUpRight, Trash2 } from 'lucide-react';
import type { SavedWord } from '../types/lexicon';

interface WordbookSectionProps {
  savedWords: SavedWord[];
  onSelectWord: (word: string) => void;
  onRemoveWord: (word: string) => void;
}

export function WordbookSection({
  savedWords,
  onSelectWord,
  onRemoveWord,
}: WordbookSectionProps) {
  return (
    <section
      id="wordbook-section"
      aria-labelledby="wordbook-heading"
      className="bg-white border border-[#F1C6D6] rounded-2xl p-6 sm:p-8 shadow-[0_10px_30px_-18px_rgba(179,59,104,0.22)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#F7DCE6]">
        <div>
          <p className="text-xs font-medium tracking-wide text-[#B33B68] mb-1">
            Personal Lexicon
          </p>
          <h2
            id="wordbook-heading"
            className="font-editorial text-3xl font-semibold text-[#361C26] tracking-tight"
          >
            Saved Wordbook
          </h2>
          <p className="text-sm text-[#72505D] mt-1">
            Words you bookmark from the dictionary are stored privately in this browser for instant recall.
          </p>
        </div>
        <span className="font-mono text-xs text-[#987382] tabular-nums">
          {savedWords.length} {savedWords.length === 1 ? 'saved word' : 'saved words'}
        </span>
      </div>

      {savedWords.length === 0 ? (
        <div className="py-8 text-center">
          <p className="font-editorial italic text-xl text-[#72505D]">
            Your wordbook is empty — tap “Save Word” on any dictionary entry to collect favorite expressions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
          {savedWords.map((item) => (
            <div
              key={item.word}
              className="rounded-xl bg-[#FFF9FB] border border-[#F3D5E0] p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-editorial text-2xl font-semibold text-[#361C26]">
                      {item.word}
                    </h3>
                    <p className="text-xs text-[#987382] mt-0.5">
                      <span className="font-mono text-[#B33B68]">{item.phonetic}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="italic">{item.partOfSpeech}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveWord(item.word)}
                    aria-label={`Remove ${item.word} from wordbook`}
                    className="p-1.5 rounded-lg text-[#987382] hover:text-[#C9345A] hover:bg-[#FDEEF4] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
                <p className="text-xs text-[#4D2E3B] mt-2.5 leading-relaxed line-clamp-3">
                  {item.primaryDefinition}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onSelectWord(item.word)}
                className="self-start text-xs font-medium text-[#B33B68] hover:underline underline-offset-4 flex items-center gap-1 cursor-pointer"
              >
                <span>Open in Dictionary</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
