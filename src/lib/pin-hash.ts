const PIN_LENGTH = 6;
const PIN_HASH_KEY = 'panchang-pin-hash';

export { PIN_LENGTH };

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getStoredPinHash(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PIN_HASH_KEY);
}

export function storePinHash(hash: string): void {
  localStorage.setItem(PIN_HASH_KEY, hash);
}

export function clearStoredPinHash(): void {
  localStorage.removeItem(PIN_HASH_KEY);
}
