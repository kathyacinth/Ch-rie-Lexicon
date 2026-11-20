import { SatinBowIcon } from './CoquetteOrnaments';

interface TopBarProps {
  onNavigate: (sectionId: string) => void;
  onPrimaryAction: () => void;
}

export function TopBar({ onNavigate, onPrimaryAction }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#FFF7FA]/92 backdrop-blur-md border-b border-[#F1C6D6]">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('top');
          }}
          className="flex items-center gap-2.5 text-[#361C26] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D85A8A] rounded"
        >
          <SatinBowIcon className="w-7 h-4 text-[#D85A8A] shrink-0" />
          <span className="font-editorial text-2xl font-semibold tracking-tight">
            Chérie Lexicon
          </span>
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#72505D]"
        >
          <button
            type="button"
            onClick={() => onNavigate('dictionary-section')}
            className="hover:text-[#B33B68] hover:underline underline-offset-4 decoration-[#E5A9C0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Dictionary
          </button>
          <button
            type="button"
            onClick={() => onNavigate('writing-desk')}
            className="hover:text-[#B33B68] hover:underline underline-offset-4 decoration-[#E5A9C0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Writing Desk
          </button>
          <button
            type="button"
            onClick={() => onNavigate('vocabulary-focus')}
            className="hover:text-[#B33B68] hover:underline underline-offset-4 decoration-[#E5A9C0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Vocabulary
          </button>
          <button
            type="button"
            onClick={() => onNavigate('wordbook-section')}
            className="hover:text-[#B33B68] hover:underline underline-offset-4 decoration-[#E5A9C0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Wordbook
          </button>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="px-4 py-2 rounded-lg bg-[#D85A8A] hover:bg-[#B33B68] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B33B68]"
          >
            Check Writing
          </button>
        </div>
      </div>
    </header>
  );
}
