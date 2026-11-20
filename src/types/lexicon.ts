export interface DictionaryDefinition {
  definition: string;
  example: string;
  nuanceNote: string;
}

export interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryEntry {
  word: string;
  phonetic: string;
  syllables: string;
  etymology: string;
  register: string;
  meanings: DictionaryMeaning[];
  collocations: string[];
  writingTip: string;
}

export interface SpellingIssue {
  id: string;
  original: string;
  suggestions: string[];
  reason: string;
  startIndex: number;
  endIndex: number;
}

export type GrammarCategory =
  | 'Grammar'
  | 'Punctuation'
  | 'Clarity'
  | 'Agreement'
  | 'Tense';

export interface GrammarIssue {
  id: string;
  original: string;
  replacement: string;
  category: GrammarCategory;
  explanation: string;
  startIndex: number;
  endIndex: number;
}

export interface VocabularyAlternative {
  word: string;
  tone: string;
  nuance: string;
  definition: string;
}

export interface VocabularySuggestion {
  id: string;
  original: string;
  reason: string;
  alternatives: VocabularyAlternative[];
  startIndex: number;
  endIndex: number;
}

export interface WritingAnalysisResult {
  spellingIssues: SpellingIssue[];
  grammarIssues: GrammarIssue[];
  vocabularySuggestions: VocabularySuggestion[];
  polishedExcerpt: string;
  readabilityLabel: string;
  toneSummary: string;
}

export interface SavedWord {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  primaryDefinition: string;
  savedAt: string;
}
