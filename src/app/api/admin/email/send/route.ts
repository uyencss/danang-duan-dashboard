import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { withLogging } from "@/lib/logger/api-logger";
import { requireApiRole } from "@/lib/auth-utils";

export const POST = withLogging(async (request: Request) => {
  try {
    const authResult = await requireApiRole("ADMIN", "USER");
    if (authResult.error) return authResult.error;

    const body = await request.json();
    const { to, subject, message } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields (to, subject, message)" },
        { status: 400 }
      );
    }

    const result = await sendEmail({
      to,
      subject,
      html: message,
    });

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error("Error processing email request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
