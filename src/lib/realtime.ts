import Ably from 'ably';

// Only create a client if we're on the server
const isServer = typeof window === 'undefined';

let ablyServerClient: Ably.Realtime | null = null;

if (isServer) {
    ablyServerClient = new Ably.Realtime({
        key: process.env.ABLY_API_KEY || 'dummy_key_for_build',
    });
}

export { ablyServerClient };
