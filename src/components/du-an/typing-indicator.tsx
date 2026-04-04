"use client";

interface TypingIndicatorProps {
  users: string[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const label =
    users.length === 1
      ? `${users[0]} đang nhập`
      : users.length === 2
      ? `${users[0]} và ${users[1]} đang nhập`
      : `${users.length} người đang nhập`;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 animate-in fade-in duration-200">
      <div className="flex gap-0.5 items-center">
        <span
          className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span className="text-[11px] text-gray-400 font-medium italic">{label}...</span>
    </div>
  );
}
