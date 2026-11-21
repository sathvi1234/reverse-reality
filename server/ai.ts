import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type AiResult = { status: number; json: Record<string, unknown> };

const WINDOW_MS = 60_000;
const LIMIT = 12;
const hits = new Map<string, number[]>();

const actions = new Set([
  'masterpiece',
  'suggestions',
  'character',
  'story',
  'continue',
  'choice',
  'world',
  'assistant',
  'challenge',
]);

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function fallback(action: string, body: Record<string, unknown>): Record<string, unknown> {
  const geometric = text(body.geometric, 40) || 'Crystal';
  const organic = text(body.organic, 40) || 'Butterfly';
  const genre = text(body.genre, 40) || 'Fantasy';
  const title = `${geometric} ${organic}`;
  if (action === 'masterpiece') {
    return {
      source: 'fallback',
      name: title,
      description: `A ${geometric.toLowerCase()} grown through a ${organic.toLowerCase()}.`,
      interpretation: 'Cyan structure carrying violet life.',
      creativity: 62,
      rarity: 48,
      estimateNote: 'These scores are local estimates, not a model judgment.',
    };
  }
  if (action === 'character') {
    return {
      source: 'fallback',
      name: `${organic} Keeper`,
      personality: 'Curious and precise',
      role: 'Guide',
      powers: `Shapes ${geometric.toLowerCase()} light`,
      background: `Born where a ${geometric.toLowerCase()} met a ${organic.toLowerCase()}.`,
      motivations: 'Keep the fused world intact',
      relationships: 'Bound to the creator’s hands',
    };
  }
  if (action === 'story' || action === 'continue' || action === 'choice') {
    const ending = text(body.choice, 80) || 'They keep the light and walk on.';
    return {
      source: 'fallback',
      title: `${genre}: ${title}`,
      introduction: `${title} wakes inside a ${genre.toLowerCase()} world.`,
      chapters: [
        { id: 'begin', title: 'Beginning', prose: `The ${organic.toLowerCase()} opens around a ${geometric.toLowerCase()} heart.` },
        { id: 'middle', title: 'Middle', prose: 'A rift asks the maker to choose what the fusion becomes.' },
        { id: 'end', title: 'Ending', prose: ending },
      ],
      choices: [
        { id: 'keep', label: 'Keep the fusion whole' },
        { id: 'split', label: 'Let the two forms separate' },
      ],
      scene: {
        world: text(body.world, 40) || 'Dream World',
        accent: '#7ee7ff',
        secondary: '#c084fc',
        note: 'Scene colors only. This does not invent a new mesh.',
      },
    };
  }
  if (action === 'world') {
    const world = text(body.world, 40) || 'Dream World';
    return { source: 'fallback', world, accent: '#7ee7ff', secondary: '#c084fc', ambience: 'soft' };
  }
  if (action === 'challenge') {
    return { source: 'fallback', prompt: 'Fuse a crystal with a leaf and name the result without using the word crystal.' };
  }
  return {
    source: 'fallback',
    reply: `Try fusing ${geometric} with ${organic}, then ask for a ${genre.toLowerCase()} story.`,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

async function callQwen(action: string, body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const key = process.env.DASHSCOPE_API_KEY;
  const base = process.env.QWEN_BASE_URL;
  const model = process.env.QWEN_MODEL;
  if (key == null || key === '' || base == null || base === '' || model == null || model === '') return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 700,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Return one JSON object only. No markdown. Keep strings under 400 characters. Scores are estimates from 0 to 100.',
          },
          { role: 'user', content: JSON.stringify({ action, ...body }).slice(0, 4000) },
        ],
      }),
    });
    if (!response.ok) return null;
    const payload = asRecord(await response.json());
    const choices = payload?.choices;
    const first = Array.isArray(choices) ? asRecord(choices[0]) : null;
    const message = asRecord(first?.message);
    const content = text(message?.content, 6000);
    const parsed = asRecord(JSON.parse(content));
    if (parsed == null) return null;
    return { ...parsed, source: 'qwen' };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const galleryPath = path.join(process.cwd(), 'data', 'gallery.json');

export async function readGallery(): Promise<unknown[]> {
  try {
    const raw = await readFile(galleryPath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeGallery(items: unknown[]): Promise<void> {
  await mkdir(path.dirname(galleryPath), { recursive: true });
  await writeFile(galleryPath, JSON.stringify(items.slice(-200), null, 2));
}

export async function handleAi(action: string, body: unknown, ip: string): Promise<AiResult> {
  if (!actions.has(action)) return { status: 404, json: { error: 'Unknown action' } };
  if (limited(ip)) return { status: 429, json: { error: 'Too many requests. Wait a minute.' } };
  const record = asRecord(body) ?? {};
  const live = await callQwen(action, record);
  return { status: 200, json: live ?? fallback(action, record) };
}
