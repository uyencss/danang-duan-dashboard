import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication | MobiFone",
  description: "Sign in to your project tracking account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        {children}
      </div>
    </main>
  );
}
