import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { withLogging } from "@/lib/logger/api-logger";

const handlers = toNextJsHandler(auth);

export const GET = withLogging(handlers.GET);
export const POST = withLogging(handlers.POST);
