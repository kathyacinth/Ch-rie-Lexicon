import type { DictionaryEntry, SpellingIssue, GrammarIssue } from '../types/lexicon';

export const CURATED_ENTRIES: Record<string, DictionaryEntry> = {
  mellifluous: {
    word: 'mellifluous',
    phonetic: '/məˈlɪf.lu.əs/',
    syllables: 'mel·lif·lu·ous',
    etymology: 'Late Latin mellifluus, from mel ("honey") + fluere ("to flow").',
    register: 'Literary & Expressive',
    meanings: [
      {
        partOfSpeech: 'adjective',
        definitions: [
          {
            definition: 'Sweetly or smoothly flowing; pleasingly musical to the ear.',
            example:
              'Her mellifluous cadence turned an ordinary evening letter into something unforgettable.',
            nuanceNote:
              'Often describes voices, prose rhythm, or gentle melodies rather than physical sweetness.',
          },
          {
            definition: 'Filled with honey or gentle warmth in tone and expression.',
            example:
              'The poet favored mellifluous vowels that lingered softly at the end of every stanza.',
            nuanceNote: 'Carries an appreciative, romantic, or classicist sensibility.',
          },
        ],
        synonyms: ['dulcet', 'euphonious', 'lyrical', 'honeyed', 'silver-tongued'],
        antonyms: ['cacophonous', 'discordant', 'grating', 'harsh'],
      },
    ],
    collocations: [
      'mellifluous voice',
      'mellifluous prose',
      'mellifluous cadence',
      'mellifluous phrasing',
    ],
    writingTip:
      'Use "mellifluous" when "smooth" or "nice-sounding" feels too flat for a voice, melody, or passage of lyrical prose.',
  },
  sonder: {
    word: 'sonder',
    phonetic: '/ˈsɒn.dər/',
    syllables: 'son·der',
    etymology:
      'Coined in 2012 by John Koenig in The Dictionary of Obscure Sorrows, echoing French sonder ("to probe") and German sonder- ("special").',
    register: 'Contemporary Literary',
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition:
              'The profound realization that each passerby is living a life as vivid, intricate, and central as one’s own.',
            example:
              'Watching train windows glow at dusk filled her with quiet sonder for a hundred unseen stories.',
            nuanceNote:
              'Captures empathetic wonder rather than loneliness—an expansive awareness of shared humanity.',
          },
        ],
        synonyms: ['empathy', 'numinousness', 'fellow-feeling', 'reverie'],
        antonyms: ['solipsism', 'indifference', 'detachment'],
      },
    ],
    collocations: [
      'a wave of sonder',
      'quiet sonder',
      'moment of sonder',
    ],
    writingTip:
      'Best placed in reflective essays or personal journals where a brief city scene opens into emotional depth.',
  },
  halcyon: {
    word: 'halcyon',
    phonetic: '/ˈhæl.si.ən/',
    syllables: 'hal·cy·on',
    etymology:
      'Greek halkyōn, a mythical kingfisher said to calm winter seas while brooding on its floating nest.',
    register: 'Poetic & Elevated',
    meanings: [
      {
        partOfSpeech: 'adjective',
        definitions: [
          {
            definition: 'Denoting a past period of time that was idyllically happy, peaceful, and serene.',
            example:
              'They recalled the halcyon afternoons spent reading poetry beneath the blossoming pear tree.',
            nuanceNote:
              'Almost always paired with nostalgic memory—a golden stillness remembered fondly.',
          },
          {
            definition: 'Calm, tranquil, and untroubled (especially of weather or waters).',
            example:
              'A halcyon hush settled over the harbor just before dawn.',
            nuanceNote: 'Retains its classical maritime origin in descriptive prose.',
          },
        ],
        synonyms: ['idyllic', 'serene', 'bucolic', 'tranquil', 'blissful'],
        antonyms: ['turbulent', 'stormy', 'chaotic', 'tempestuous'],
      },
    ],
    collocations: [
      'halcyon days',
      'halcyon summer',
      'halcyon stillness',
    ],
    writingTip:
      'While "halcyon days" is classic, pairing "halcyon" with fresh nouns like "halcyon hush" or "halcyon morning" keeps it vivid.',
  },
  effervescent: {
    word: 'effervescent',
    phonetic: '/ˌef.əˈves.ənt/',
    syllables: 'ef·fer·ves·cent',
    etymology: 'Latin effervescere ("to boil up"), from ex- ("out") + fervere ("to glow or bubble").',
    register: 'Vibrant & Everyday Literary',
    meanings: [
      {
        partOfSpeech: 'adjective',
        definitions: [
          {
            definition: 'Vivacious, sparkling, and full of high-spirited enthusiasm.',
            example:
              'Her effervescent wit lifted the entire dinner table within minutes.',
            nuanceNote: 'Brighter and lighter than "energetic"—suggests effortless sparkle.',
          },
          {
            definition: 'Giving off fine bubbles; gently fizzing.',
            example:
              'Rosewater tonic arrived chilled and delicately effervescent in crystal flutes.',
            nuanceNote: 'Literal physical meaning used in culinary and sensory writing.',
          },
        ],
        synonyms: ['vivacious', 'sparkling', 'buoyant', 'spirited', 'ebullient'],
        antonyms: ['lackluster', 'subdued', 'flat', 'listless'],
      },
    ],
    collocations: [
      'effervescent charm',
      'effervescent laughter',
      'effervescent spirit',
    ],
    writingTip:
      'Ideal when upgrading tired phrases like "very bubbly" or "very happy personality".',
  },
};

export const SAMPLE_DRAFTS: Array<{ id: string; label: string; toneGoal: string; text: string }> = [
  {
    id: 'letter',
    label: 'Personal Letter',
    toneGoal: 'Poetic & Warm',
    text: `Dearest Camille,

I recieved your lovely postcard this morning, and i could not stop smiling. The cafe by the river sounds really nice, especially with the morning light coming threw the lace curtains. Yesterday I tryed to write back right away, however the rain was pouring so hard that the power went out.

I hope we can meet soon to share tea and talk about the books we are reading. Your letters always make my day feel very good.`,
  },
  {
    id: 'essay',
    label: 'Editorial Essay',
    toneGoal: 'Academic & Refined',
    text: `Modern digital correspondence often prioritize speed over deliberate phrasing. When writers rush through their drafts, subtle spelling mistakes like seperate or definately slip past quick glances, and repetitive words makes the argument feel weak.

Reading attentively allow us to choose words that carries exact nuance. Instead of saying an idea is "very important," a thoughtful writer selects language that show why it endures.`,
  },
  {
    id: 'journal',
    label: 'Morning Journal',
    toneGoal: 'Concise & Crisp',
    text: `Today started slowly with warm chamomile tea and a fresh notebook on my desk. I walked down to the bakery, where the air smelled sweet and the baker gave me a nice smile. Sometimes small quiet moments is all we need to reset our thoughts and begin writting again.`,
  },
];

const COMMON_TYPOS: Record<string, string[]> = {
  teh: ['the'],
  recieve: ['receive'],
  recieved: ['received'],
  seperate: ['separate'],
  seperated: ['separated'],
  definately: ['definitely'],
  definatly: ['definitely'],
  occured: ['occurred'],
  untill: ['until'],
  becuase: ['because'],
  beacuse: ['because'],
  writting: ['writing'],
  grammer: ['grammar'],
  alot: ['a lot'],
  tommorow: ['tomorrow'],
  tomorow: ['tomorrow'],
  accomodate: ['accommodate'],
  neccessary: ['necessary'],
  embarass: ['embarrass'],
  truely: ['truly'],
  wierd: ['weird'],
  freind: ['friend'],
  beleive: ['believe'],
  calender: ['calendar'],
  existance: ['existence'],
  independant: ['independent'],
  persistant: ['persistent'],
  recomend: ['recommend'],
  succesful: ['successful'],
  tendancy: ['tendency'],
  visable: ['visible'],
  speach: ['speech'],
  sentance: ['sentence'],
  tryed: ['tried'],
  threw: ['through'],
  langauge: ['language'],
  dictionery: ['dictionary'],
  beautifull: ['beautiful'],
};

export function runInstantLocalChecks(text: string): {
  spellingIssues: SpellingIssue[];
  grammarIssues: GrammarIssue[];
} {
  const spellingIssues: SpellingIssue[] = [];
  const grammarIssues: GrammarIssue[] = [];

  const wordRegex = /\b([A-Za-z']+)\b/g;
  let match: RegExpExecArray | null;
  while ((match = wordRegex.exec(text)) !== null) {
    const raw = match[1];
    const lower = raw.toLowerCase();
    const suggestions = COMMON_TYPOS[lower];
    if (suggestions) {
      const preservedCase = suggestions.map((s) =>
        raw[0] === raw[0].toUpperCase() ? s.charAt(0).toUpperCase() + s.slice(1) : s
      );
      spellingIssues.push({
        id: `local-spell-${match.index}`,
        original: raw,
        suggestions: preservedCase,
        reason: 'Common misspelling detected immediately.',
        startIndex: match.index,
        endIndex: match.index + raw.length,
      });
    } else if (raw === 'i') {
      grammarIssues.push({
        id: `local-cap-${match.index}`,
        original: 'i',
        replacement: 'I',
        category: 'Grammar',
        explanation: 'The first-person pronoun "I" is always capitalized.',
        startIndex: match.index,
        endIndex: match.index + 1,
      });
    }
  }

  const repeatRegex = /\b([A-Za-z]+)\s+\1\b/gi;
  while ((match = repeatRegex.exec(text)) !== null) {
    grammarIssues.push({
      id: `local-repeat-${match.index}`,
      original: match[0],
      replacement: match[1],
      category: 'Clarity',
      explanation: `Repeated word "${match[1]}" detected.`,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return { spellingIssues, grammarIssues };
}
