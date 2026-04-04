import Ably from 'ably';

// Only create a client if we're on the server AND a valid key is configured.
// Ably validates the key format at construction time (requires "appId.keyId:secret"),
// so we guard against placeholder/missing keys to avoid runtime crashes.
const isServer = typeof window === 'undefined';
const ablyKey = process.env.ABLY_API_KEY;
const hasValidKey = isServer && ablyKey && ablyKey.includes(':');

let ablyServerClient: Ably.Realtime | null = null;

if (hasValidKey) {
    ablyServerClient = new Ably.Realtime({ key: ablyKey });
}

export { ablyServerClient };

