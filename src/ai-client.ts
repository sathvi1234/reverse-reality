export async function requestAi(action: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await fetch(`/api/ai/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'AI request failed');
  return data;
}
