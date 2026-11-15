// Tells the Anwarz app (North Via Marketing) about a new order or sample request, so Ahmed's phone
// gets a 🛋 notification with its own sound. Same shared secret as /api/anwarz/* (ANWARZ_API_KEY).
// Never throws and gives up after 5 seconds: an alert must never slow down or break a checkout.

const URL_DEFAULT = 'https://www.northviamarketing.com/api/alerts/jl';

export async function notifyAnwarz(alert: { kind: 'order' | 'sample'; id: string; title: string; detail: string }) {
  const key = process.env.ANWARZ_API_KEY?.trim();
  if (!key || key.length < 32) return;
  try {
    const response = await fetch(process.env.ANWARZ_NOTIFY_URL || URL_DEFAULT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) console.error('Anwarz notification failed:', response.status);
  } catch (error) {
    console.error('Anwarz notification failed:', error);
  }
}
