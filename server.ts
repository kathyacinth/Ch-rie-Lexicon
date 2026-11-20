import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const MODEL_ID = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: unknown }).status)
          : 0;
      if (attempt < maxAttempts && (status >= 500 || status === 429 || status === 0)) {
        await new Promise((resolve) => setTimeout(resolve, 450 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

function formatApiError(err: unknown): { status: number; message: string } {
  const rawMessage =
    err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unexpected server error.';
  const status =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: unknown }).status)
      : 500;

  if (status === 400 || rawMessage.includes('API_KEY_INVALID')) {
    return {
      status: 400,
      message: 'The Gemini API key appears invalid. Please verify it in the Settings > Secrets panel.',
    };
  }
  if (status === 403 || rawMessage.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      message: 'Permission denied for Gemini API. Please check your API key in Settings > Secrets.',
    };
  }
  if (status === 429 || rawMessage.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'Request limit reached momentarily. Please wait a few seconds and try again.',
    };
  }
  return {
    status: status >= 400 && status < 600 ? status : 500,
    message: 'Unable to complete the request right now. Please try again in a moment.',
  };
}

interface SpanCandidate {
  original: string;
}

function resolveTextSpans<T extends SpanCandidate>(
  text: string,
  items: T[]
): Array<T & { startIndex: number; endIndex: number }> {
  const occupied: Array<[number, number]> = [];

  const isOccupied = (start: number, end: number): boolean =>
    occupied.some(([s, e]) => start < e && end > s);

  return items.map((item) => {
    const needle = (item.original ?? '').trim();
    if (!needle) {
      return { ...item, startIndex: -1, endIndex: -1 };
    }

    let searchFrom = 0;
    let foundStart = -1;
    while (searchFrom < text.length) {
      const idx = text.indexOf(needle, searchFrom);
      if (idx === -1) break;
      if (!isOccupied(idx, idx + needle.length)) {
        foundStart = idx;
        break;
      }
      searchFrom = idx + 1;
    }

    if (foundStart === -1) {
      const lowerText = text.toLowerCase();
      const lowerNeedle = needle.toLowerCase();
      let lowerFrom = 0;
      while (lowerFrom < lowerText.length) {
        const idx = lowerText.indexOf(lowerNeedle, lowerFrom);
        if (idx === -1) break;
        if (!isOccupied(idx, idx + needle.length)) {
          foundStart = idx;
          break;
        }
        lowerFrom = idx + 1;
      }
    }

    if (foundStart !== -1) {
      const end = foundStart + needle.length;
      occupied.push([foundStart, end]);
      return { ...item, startIndex: foundStart, endIndex: end };
    }

    return { ...item, startIndex: -1, endIndex: -1 };
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/dictionary', async (req: Request, res: Response) => {
    const word = typeof req.body?.word === 'string' ? req.body.word.trim() : '';
    if (!word) {
      res.status(400).json({ error: 'Please enter a word or phrase to look up.' });
      return;
    }
    if (word.length > 80) {
      res.status(400).json({ error: 'Please search a single word or short phrase under 80 characters.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Dictionary lookup requires a Gemini API key configured in Settings > Secrets.',
      });
      return;
    }

    try {
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_ID,
          contents: `Provide a thorough, scholarly yet accessible English dictionary entry for the word or phrase: "${word}". If the user misspelled the word slightly, normalize to the closest standard English headword and note it in etymology or writingTip.`,
          config: {
            systemInstruction:
              'You are a distinguished lexicographer. Return accurate IPA phonetics, syllable breakdown, concise etymology, register (e.g. Literary, Formal, Everyday, Poetic), meanings grouped by part of speech with vivid original example sentences, synonyms, antonyms, natural collocations, and one practical writing tip.',
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                phonetic: { type: Type.STRING },
                syllables: { type: Type.STRING },
                etymology: { type: Type.STRING },
                register: { type: Type.STRING },
                meanings: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      partOfSpeech: { type: Type.STRING },
                      definitions: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            definition: { type: Type.STRING },
                            example: { type: Type.STRING },
                            nuanceNote: { type: Type.STRING },
                          },
                          required: ['definition', 'example', 'nuanceNote'],
                        },
                      },
                      synonyms: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      antonyms: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                    },
                    required: ['partOfSpeech', 'definitions', 'synonyms', 'antonyms'],
                  },
                },
                collocations: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                writingTip: { type: Type.STRING },
              },
              required: [
                'word',
                'phonetic',
                'syllables',
                'etymology',
                'register',
                'meanings',
                'collocations',
                'writingTip',
              ],
            },
          },
        })
      );

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw);
      res.json(parsed);
    } catch (err: unknown) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/analyze', async (req: Request, res: Response) => {
    const text = typeof req.body?.text === 'string' ? req.body.text : '';
    const toneGoal = typeof req.body?.toneGoal === 'string' ? req.body.toneGoal : 'Refined & Clear';

    if (!text.trim()) {
      res.status(400).json({ error: 'Please write or paste some text to inspect.' });
      return;
    }
    if (text.length > 6000) {
      res.status(400).json({ error: 'Please keep drafts under 6,000 characters per check.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Full grammar and vocabulary analysis requires a Gemini API key in Settings > Secrets.',
      });
      return;
    }

    try {
      const response = await withRetry(() =>
        ai.models.generateContent({
          model: MODEL_ID,
          contents: `Target writing style: ${toneGoal}\n\nAnalyze the following text carefully for:\n1) Spelling errors (typos, misspellings, wrongly spelled homophones)\n2) Grammar, subject-verb agreement, tense consistency, punctuation, and sentence clarity issues\n3) Vocabulary upgrades: identify up to 6 ordinary, repetitive, vague, or weak words/phrases and suggest 3 richer context-fitting alternatives with tone tags and brief definitions.\n\nCRITICAL: In every item, "original" MUST match the EXACT substring as it appears in the user's text so it can be highlighted in place.\n\nUser text:\n"""\n${text}\n"""`,
          config: {
            systemInstruction:
              'You are a meticulous copy editor, spelling proofreader, and literary style coach. Only report genuine spelling or grammar errors. Keep explanations concise and helpful. Ensure every "original" field is an exact verbatim substring from the input text.',
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                spellingIssues: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      original: { type: Type.STRING },
                      suggestions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      reason: { type: Type.STRING },
                    },
                    required: ['original', 'suggestions', 'reason'],
                  },
                },
                grammarIssues: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      original: { type: Type.STRING },
                      replacement: { type: Type.STRING },
                      category: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                    },
                    required: ['original', 'replacement', 'category', 'explanation'],
                  },
                },
                vocabularySuggestions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      original: { type: Type.STRING },
                      reason: { type: Type.STRING },
                      alternatives: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            word: { type: Type.STRING },
                            tone: { type: Type.STRING },
                            nuance: { type: Type.STRING },
                            definition: { type: Type.STRING },
                          },
                          required: ['word', 'tone', 'nuance', 'definition'],
                        },
                      },
                    },
                    required: ['original', 'reason', 'alternatives'],
                  },
                },
                polishedExcerpt: { type: Type.STRING },
                readabilityLabel: { type: Type.STRING },
                toneSummary: { type: Type.STRING },
              },
              required: [
                'spellingIssues',
                'grammarIssues',
                'vocabularySuggestions',
                'polishedExcerpt',
                'readabilityLabel',
                'toneSummary',
              ],
            },
          },
        })
      );

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw) as {
        spellingIssues?: Array<{ original: string; suggestions: string[]; reason: string }>;
        grammarIssues?: Array<{
          original: string;
          replacement: string;
          category: string;
          explanation: string;
        }>;
        vocabularySuggestions?: Array<{
          original: string;
          reason: string;
          alternatives: Array<{ word: string; tone: string; nuance: string; definition: string }>;
        }>;
        polishedExcerpt?: string;
        readabilityLabel?: string;
        toneSummary?: string;
      };

      const rawSpelling = Array.isArray(parsed.spellingIssues) ? parsed.spellingIssues : [];
      const rawGrammar = Array.isArray(parsed.grammarIssues) ? parsed.grammarIssues : [];
      const rawVocab = Array.isArray(parsed.vocabularySuggestions)
        ? parsed.vocabularySuggestions
        : [];

      const spellingWithIds = resolveTextSpans(
        text,
        rawSpelling.map((item, index) => ({
          id: `spell-${index}-${Date.now()}`,
          original: item.original,
          suggestions: Array.isArray(item.suggestions) ? item.suggestions.slice(0, 4) : [],
          reason: item.reason || 'Possible spelling error.',
        }))
      ).filter((item) => item.startIndex !== -1 && item.suggestions.length > 0);

      const grammarWithIds = resolveTextSpans(
        text,
        rawGrammar.map((item, index) => ({
          id: `gram-${index}-${Date.now()}`,
          original: item.original,
          replacement: item.replacement,
          category: (['Grammar', 'Punctuation', 'Clarity', 'Agreement', 'Tense'].includes(
            item.category
          )
            ? item.category
            : 'Grammar') as 'Grammar' | 'Punctuation' | 'Clarity' | 'Agreement' | 'Tense',
          explanation: item.explanation || 'Suggested grammatical refinement.',
        }))
      ).filter((item) => item.startIndex !== -1 && item.replacement !== item.original);

      const vocabWithIds = resolveTextSpans(
        text,
        rawVocab.map((item, index) => ({
          id: `vocab-${index}-${Date.now()}`,
          original: item.original,
          reason: item.reason || 'A more evocative choice can elevate your prose.',
          alternatives: Array.isArray(item.alternatives) ? item.alternatives.slice(0, 3) : [],
        }))
      ).filter((item) => item.startIndex !== -1 && item.alternatives.length > 0);

      res.json({
        spellingIssues: spellingWithIds,
        grammarIssues: grammarWithIds,
        vocabularySuggestions: vocabWithIds,
        polishedExcerpt: parsed.polishedExcerpt || text,
        readabilityLabel: parsed.readabilityLabel || 'Clear & Flowing',
        toneSummary: parsed.toneSummary || 'Balanced editorial voice',
      });
    } catch (err: unknown) {
      const formatted = formatApiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Chérie Lexicon running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
