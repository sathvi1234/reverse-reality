import type { IncomingMessage, ServerResponse } from 'node:http';
import { readGallery, writeGallery } from '../server/ai.js';

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        resolve(null);
      }
    });
  });
}

export default async function handler(req: IncomingMessage & { method?: string }, res: ServerResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'GET') {
    const items = await readGallery();
    res.statusCode = 200;
    res.end(JSON.stringify({ items, persistence: 'server-file', note: 'On Vercel this file store is ephemeral until a database is connected.' }));
    return;
  }
  if (req.method === 'POST') {
    const body = await readBody(req);
    if (body == null || typeof body !== 'object') {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }
    const items = await readGallery();
    items.push({ ...(body as object), savedAt: new Date().toISOString() });
    await writeGallery(items);
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, count: items.length }));
    return;
  }
  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'GET or POST' }));
}
