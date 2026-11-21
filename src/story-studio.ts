import { requestAi } from './ai-client.js';

const form = document.getElementById('story-form');
const status = document.getElementById('story-status');
const output = document.getElementById('story-output');

function field(id: string): string {
  const node = document.getElementById(id);
  if (node instanceof HTMLInputElement || node instanceof HTMLSelectElement) return node.value;
  return '';
}

function chapterText(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value
    .map((item) => {
      if (item == null || typeof item !== 'object') return '';
      const record = item as { title?: unknown; prose?: unknown };
      const title = typeof record.title === 'string' ? record.title : 'Chapter';
      const prose = typeof record.prose === 'string' ? record.prose : '';
      return `${title}: ${prose}`;
    })
    .filter((line) => line !== '')
    .join('\n\n');
}

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (status) status.textContent = 'Writing…';
  const payload = {
    geometric: field('story-geo'),
    organic: field('story-org'),
    genre: field('story-genre'),
    world: field('story-world'),
  };
  void requestAi('story', payload)
    .then(async (story) => {
      const character = await requestAi('character', payload);
      const title = typeof story.title === 'string' ? story.title : 'Untitled';
      const name = typeof character.name === 'string' ? character.name : 'Guide';
      const prose = chapterText(story.chapters);
      if (output) {
        output.hidden = false;
        output.textContent = `${title}\n\nCharacter: ${name}\n\n${prose}`;
      }
      if (status) status.textContent = story.source === 'qwen' ? 'Written by Qwen.' : 'Qwen is not configured. Showing the local fallback.';
      await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'story', title, character: name, ...payload }),
      });
    })
    .catch((error: unknown) => {
      if (status) status.textContent = error instanceof Error ? error.message : 'Story request failed.';
    });
});
