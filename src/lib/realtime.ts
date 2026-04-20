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

// Browser-side singleton client
let ablyBrowserClient: Ably.Realtime | null = null;
export function getAblyBrowserClient() {
    if (isServer) return null;
    if (!ablyBrowserClient) {
        const key = process.env.NEXT_PUBLIC_ABLY_KEY;
        if (key && key !== "test_key") {
            ablyBrowserClient = new Ably.Realtime({ key, autoConnect: true });
        }
    }
    return ablyBrowserClient;
}

export { ablyServerClient };

