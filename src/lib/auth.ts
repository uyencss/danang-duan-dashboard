import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

const authBaseURL =
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : undefined);

console.log(`[BetterAuth] Base URL: ${authBaseURL || 'undefined (will use request host)'}`);

export const auth = betterAuth({
    baseURL: authBaseURL,
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    plugins: [admin()],
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 3,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "USER",
            },
            diaBan: {
                type: "string",
                required: false,
            }
        }
    },
    advanced: {
        trustHost: true,
        defaultCookieAttributes: {
            sameSite: "lax",
        }
    } as any,
    trustedOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],
});

// Monkey-patch to force all server-side session checks to loop back locally
// bypassing the slow BetterAuth external network requests over Cloudflare.
const originalGetSession = auth.api.getSession;
(auth.api as any).getSession = async (opts: any) => {
    try {
        const internalUrl = process.env.INTERNAL_APP_URL || "http://127.0.0.1:3000";
        let cookieHeader = "";

        if (opts?.headers) {
            if (typeof opts.headers.get === 'function') {
                cookieHeader = opts.headers.get("cookie") || "";
            } else {
                cookieHeader = opts.headers.cookie || "";
            }
        }

        if (cookieHeader) {
            const res = await fetch(`${internalUrl}/api/auth/get-session`, {
                headers: { cookie: cookieHeader },
                cache: "no-store",
            });

            if (res.ok) {
                return await res.json();
            }
        }

    } catch (e) {
        console.error("[auth] Local session fetch error:", e);
    }

    // Fallback to original implementation if fetch fails or no cookies 
    return originalGetSession(opts);
};
