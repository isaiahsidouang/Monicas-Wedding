export async function loadFromDb(key: string): Promise<unknown[] | null> {
  try {
    const res = await fetch(`/api/data?key=${encodeURIComponent(key)}`)
    if (!res.ok) return null
    const { value } = await res.json()
    return Array.isArray(value) ? value : null
  } catch {
    return null
  }
}

export function saveToDb(key: string, value: unknown): void {
  fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  }).catch(() => {})
}
