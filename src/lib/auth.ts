import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import prisma from "@/lib/prisma";

const authBaseURL =
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : undefined);

export const auth = betterAuth({
    baseURL: authBaseURL,
    database: prismaAdapter(prisma, {
        provider: "sqlite",
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
        trustHost: true
    } as any
});
