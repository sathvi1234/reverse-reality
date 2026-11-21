/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAi, readGallery, writeGallery } from './server/ai';
import { iwsdkDev } from '@iwsdk/vite-plugin-dev';
import { defineConfig } from 'vite';

function loadLocalEnv(): void {
  try {
    const raw = readFileSync('.env', 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('#')) continue;
      const split = trimmed.indexOf('=');
      if (split < 1) continue;
      const key = trimmed.slice(0, split).trim();
      if (process.env[key] == null || process.env[key] === '') process.env[key] = trimmed.slice(split + 1).trim();
    }
  } catch {
    // Missing .env is expected until the developer adds keys.
  }
}

function readJson(req: IncomingMessage): Promise<unknown> {
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

function localApi() {
  return {
    name: 'reverse-reality-api',
    configureServer(server: { middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) {
      loadLocalEnv();
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        void (async () => {
          if (url.startsWith('/api/ai/')) {
            const action = url.slice('/api/ai/'.length).split('?')[0] ?? '';
            const body = await readJson(req);
            const result = body == null ? { status: 400, json: { error: 'Invalid JSON' } } : await handleAi(action, body, 'local');
            res.statusCode = result.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result.json));
            return;
          }
          if (url.startsWith('/api/gallery')) {
            res.setHeader('Content-Type', 'application/json');
            if (req.method === 'GET') {
              res.end(JSON.stringify({ items: await readGallery(), persistence: 'server-file' }));
              return;
            }
            if (req.method === 'POST') {
              const body = await readJson(req);
              const items = await readGallery();
              if (body != null && typeof body === 'object') items.push({ ...body, savedAt: new Date().toISOString() });
              await writeGallery(items);
              res.end(JSON.stringify({ ok: true, count: items.length }));
              return;
            }
          }
          next();
        })();
      });
    },
  };
}

export default defineConfig({
  plugins: [localApi(), iwsdkDev()],
  server: { host: '0.0.0.0', port: 8081, open: false },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    target: 'esnext',
    rollupOptions: { input: './index.html' },
  },
  esbuild: { target: 'esnext' },
  // @drawcall/uikitml otherwise pulls a second three/@pmndrs/uikit graph
  // (its own three vs the app's super-three alias). Duplicate Component classes break
  // instanceof checks → "Only pmndrs/uikit components can be added as children".
  resolve: {
    dedupe: [
      'three',
      '@pmndrs/uikit',
      '@pmndrs/uikit-horizon',
      '@pmndrs/uikit-lucide',
    ],
  },
  optimizeDeps: {
    exclude: ['@babylonjs/havok'],
    include: [
      'three',
      '@pmndrs/uikit',
      '@pmndrs/uikit-horizon',
      '@pmndrs/uikit-lucide',
      '@drawcall/uikitml',
    ],
    esbuildOptions: { target: 'esnext' },
  },
  publicDir: 'public',
  base: './',
});
