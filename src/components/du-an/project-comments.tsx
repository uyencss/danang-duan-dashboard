"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as Ably from "ably";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  MessageSquare,
  Trash2,
  Reply,
  Send,
  History,
  X,
  AtSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  createComment,
  deleteComment,
} from "@/app/(dashboard)/du-an/[id]/comment-actions";
import { toast } from "sonner";

interface Comment {
  id: number;
  content: string;
  createdAt: Date;
  parentId?: number | null;
  user: {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string | null;
  };
}

interface CurrentUser {
  id: string;
  name: string;
  role: string;
}

// ─── Mention Autocomplete ──────────────────────────────────────────
interface MentionDropdownProps {
  query: string;
  users: { id: string; name: string }[];
  onSelect: (user: { id: string; name: string }) => void;
  anchorRef: React.RefObject<HTMLTextAreaElement | null>;
}

function MentionDropdown({ query, users, onSelect, anchorRef }: MentionDropdownProps) {
  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(query.toLowerCase())
  );

  if (!filtered.length) return null;

  return (
    <div className="absolute z-50 mt-1 bg-white rounded-2xl shadow-2xl border border-[#eceef0] overflow-hidden w-56">
      {filtered.map((u) => (
        <button
          key={u.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(u);
          }}
          className="w-full text-left px-4 py-3 text-sm font-medium text-[#191c1e] hover:bg-[#f2f4f6] flex items-center gap-2 transition-colors"
        >
          <div className="size-6 rounded-full bg-[#0058bc]/10 text-[#0058bc] flex items-center justify-center text-[10px] font-black shrink-0">
            {u.name[0]}
          </div>
          {u.name}
        </button>
      ))}
    </div>
  );
}

// ─── Render content with @mention highlighting ───────────────────
function CommentContent({ content, allUsers }: { content: string, allUsers: { id: string; name: string }[] }) {
  // Normalize legacy markdown mentions "@[Name](id)" to just "@Name"
  const normalizedContent = content.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');

  const names = allUsers.map((u) => u.name).sort((a, b) => b.length - a.length);
  
  if (names.length === 0) {
    const parts = normalizedContent.split(/(@[\w\sÀ-ỹ]+?)(?=\s|$|[.,!?])/g);
    return (
      <p className="text-[#44474d] text-sm leading-relaxed whitespace-pre-wrap">
        {parts.map((part, i) => {
          if (part.startsWith("@")) {
             return (
              <span key={i} className="text-[#0058bc] font-bold bg-[#EBF3FF] px-1.5 py-0.5 rounded text-[13px] mr-1 mb-0.5 mt-0.5 inline-flex items-center">
                {part}
              </span>
            );
          }
          return part;
        })}
      </p>
    );
  }

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matchStr = names.map(n => `@${escapeRegExp(n)}`).join('|');
  const parts = normalizedContent.split(new RegExp(`(${matchStr})`, 'g'));

  return (
    <p className="text-[#44474d] text-sm leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (part.startsWith("@") && names.some(n => `@${n}` === part)) {
          return (
            <span
              key={i}
              className="text-[#0058bc] font-bold bg-[#EBF3FF] px-1.5 py-0.5 rounded text-[13px] mr-1 mb-0.5 mt-0.5 inline-flex items-center"
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </p>
  );
}

// ─── Comment Item ─────────────────────────────────────────────────
interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  replies: Comment[];
  currentUser: CurrentUser | null | undefined;
  allUsers: { id: string; name: string }[];
  onDelete: (id: number) => void;
  onReply: (comment: Comment) => void;
}

function CommentItem({
  comment,
  isReply = false,
  replies,
  currentUser,
  allUsers,
  onDelete,
  onReply,
}: CommentItemProps) {
  const initials = comment.user.name
    .split(" ")
    .map((n) => n[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className={cn(isReply ? "mt-2" : "mt-4 animate-in slide-in-from-bottom-1 duration-300")}>
      <div className="bg-white rounded-2xl border border-[#eceef0] shadow-sm group p-4 flex gap-4">
        {/* Avatar */}
        <Avatar className={cn("rounded-full border border-[#eceef0] shrink-0 mt-0.5", isReply ? "size-8" : "size-10")}>
          <AvatarImage src={comment.user.avatarUrl || ""} />
          <AvatarFallback className="bg-[#f7f9fb] text-[#0058bc] font-black text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Bubble */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-[#191c1e] text-sm">{comment.user.name}</span>
              {comment.user.role === "ADMIN" && (
                <Badge className="bg-[#0058bc]/10 text-[#0058bc] border-none px-1.5 text-[9px] h-4 uppercase font-black tracking-widest">
                  Admin
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#8a8d93] font-medium shrink-0">
              <span>
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: vi,
                })}
              </span>
              {(currentUser?.role === "ADMIN" || currentUser?.id === comment.user.id) && (
                <button
                  onClick={() => onDelete(comment.id)}
                  className="p-1 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <CommentContent content={comment.content} allUsers={allUsers} />
        </div>
      </div>

      {/* Reply button below bubble */}
      {!isReply && (
        <button
          onClick={() => onReply(comment)}
          className="mt-2 ml-14 text-[10px] font-black text-[#8a8d93] hover:text-[#0058bc] flex items-center gap-1.5 uppercase tracking-widest transition-colors"
        >
          <Reply className="size-3" /> Phản hồi
        </button>
      )}

      {/* Render replies indented */}
      {!isReply && replies.length > 0 && (
        <div className="mt-3 space-y-2 border-l border-[#eceef0] pl-4 ml-8">
          <p className="text-[9px] font-black uppercase tracking-widest text-[#8a8d93] mb-2 flex items-center gap-1.5 -ml-3">
            <Reply className="size-3" /> Phản hồi
          </p>
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                isReply
                replies={[]}
                currentUser={currentUser}
                allUsers={allUsers}
                onDelete={onDelete}
                onReply={onReply}
              />
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Comment Input with @mention ─────────────────────────────────
interface CommentInputProps {
  projectId: number;
  currentUser: CurrentUser | null | undefined;
  replyingTo: Comment | null;
  allUsers: { id: string; name: string }[];
  onCancelReply: () => void;
  onSubmit: (content: string, parentId?: number | null) => Promise<boolean>;
}

function CommentInput({
  projectId,
  currentUser,
  replyingTo,
  allUsers,
  onCancelReply,
  onSubmit,
}: CommentInputProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Auto-insert @username when reply starts
  useEffect(() => {
    if (replyingTo) {
      const mention = `@${replyingTo.user.name} `;
      setValue(mention);
      setTimeout(() => {
        textareaRef.current?.focus();
        const len = mention.length;
        textareaRef.current?.setSelectionRange(len, len);
      }, 50);
    } else {
      setValue("");
    }
  }, [replyingTo]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setValue(text);

    // Detect @ trigger
    const cursor = e.target.selectionStart;
    const textBefore = text.slice(0, cursor);
    const lastAt = textBefore.lastIndexOf("@");

    if (lastAt !== -1) {
      const segment = textBefore.slice(lastAt + 1);
      // Allow spaces but limit length to e.g. 50 characters to avoid infinite dropdown matching
      if (!segment.includes("\n") && !segment.includes("@") && segment.length <= 50) {
        setMentionQuery(segment);
        setMentionStart(lastAt);
        return;
      }
    }
    setMentionQuery(null);
    setMentionStart(-1);
  };

  const handleMentionSelect = (user: { id: string; name: string }) => {
    if (mentionStart === -1) return;
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + 1 + (mentionQuery?.length || 0));
    const mentionText = `@${user.name}`;
    const newVal = `${before}${mentionText} ${after}`;
    setValue(newVal);
    setMentionQuery(null);
    setMentionStart(-1);
    setTimeout(() => {
      textareaRef.current?.focus();
      const pos = (before + mentionText + " ").length;
      textareaRef.current?.setSelectionRange(pos, pos);
    }, 10);
  };

  const handleSubmit = async () => {
    if (!value.trim() || value.trim().length < 2) return;
    setLoading(true);
    const ok = await onSubmit(value.trim(), replyingTo?.id || null);
    if (ok) {
      setValue("");
      setMentionQuery(null);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
      return;
    }
    // Tab selects first mention if dropdown is open
    if (e.key === "Tab" && mentionQuery !== null) {
      e.preventDefault();
      const filtered = allUsers.filter((u) =>
        u.name.toLowerCase().includes((mentionQuery || "").toLowerCase())
      );
      if (filtered[0]) handleMentionSelect(filtered[0]);
    }
    if (e.key === "Escape") {
      setMentionQuery(null);
    }
  };


  return (
    <div className="bg-[#f7f9fb] p-6 rounded-2xl border border-[#eceef0] space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <History className="size-4 text-[#000719]" />
        <h3 className="text-sm font-black text-[#000719] uppercase tracking-widest">
          {replyingTo ? "Phản hồi bình luận" : "Trao đổi nội bộ"}
        </h3>
      </div>

      {/* Reply context banner */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-[#0058bc]/5 border border-[#0058bc]/15 px-4 py-2 rounded-xl text-[11px] font-bold text-[#0058bc]">
          <span className="flex items-center gap-2">
            <Reply className="size-3" /> Trả lời{" "}
            <strong>@{replyingTo.user.name}</strong>
          </span>
          <button
            onClick={onCancelReply}
            className="hover:text-[#8a8d93] transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Textarea wrapper with dropdown */}
      <div className="relative" ref={wrapperRef}>
        <textarea
          ref={textareaRef}
          id="comment-input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            replyingTo
              ? `Nhập phản hồi... (@ để tag người dùng)`
              : "Đặt câu hỏi hoặc cập nhật... (@ để tag người dùng)"
          }
          rows={3}
          className="w-full bg-white rounded-xl p-4 border border-[#eceef0] text-sm text-[#191c1e] placeholder:text-[#8a8d93] focus:outline-none focus:ring-2 focus:ring-[#0058bc]/20 resize-none transition-all"
        />
        {/* @ hint */}
        <div className="absolute bottom-3 left-4 text-[10px] text-[#8a8d93] flex items-center gap-1 select-none pointer-events-none">
          <AtSign className="size-3" />
          <span>Tag người dùng · Tab để chọn</span>
        </div>

        {/* Mention dropdown */}
        {mentionQuery !== null && (
          <div className="absolute left-4 bottom-full mb-1">
            <MentionDropdown
              query={mentionQuery}
              users={allUsers}
              onSelect={handleMentionSelect}
              anchorRef={textareaRef}
            />
          </div>
        )}

        {/* Send button */}
        <button
          type="button"
          disabled={loading || value.trim().length < 2}
          onClick={handleSubmit}
          className="absolute bottom-3 right-3 bg-[#000719] hover:bg-[#0d1f3c] disabled:opacity-40 disabled:cursor-not-allowed text-white h-9 px-5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
        >
          <Send className="size-3.5" />
          {loading ? "..." : "Gửi"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export function ProjectComments({
  projectId,
  comments = [],
  currentUser,
  allSystemUsers = [],
}: {
  projectId: number;
  comments: Comment[];
  currentUser: CurrentUser | null | undefined;
  allSystemUsers?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  // Build allUsers list from system users + commenters (for @mention)
  const allUsersMap = new Map(allSystemUsers.map((u) => [u.id, u]));
  comments.forEach((c) => {
    if (!allUsersMap.has(c.user.id)) {
      allUsersMap.set(c.user.id, { id: c.user.id, name: c.user.name });
    }
  });
  const allUsers = Array.from(allUsersMap.values());

  // Ably subscription for real-time updates
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_ABLY_KEY;
    if (!key || !key.includes(":")) return;

    const client = new Ably.Realtime({ key });
    const channel = client.channels.get(`project-${projectId}`);

    channel.subscribe("new_comment", (message) => {
      const data = message.data;
      if (currentUser && data.userName !== currentUser.name) {
        toast.info(
          `${data.userName} vừa bình luận: "${data.content.substring(0, 50)}${data.content.length > 50 ? "..." : ""}"`,
          { icon: <MessageSquare className="size-4" /> }
        );
        router.refresh();
      }
    });

    return () => {
      try {
        channel.unsubscribe();
        if (client.connection.state !== "closed") {
          const result = client.close() as any;
          if (result && typeof result.catch === 'function') {
            result.catch(() => {});
          }
        }
      } catch (e) {
        // Silently fail on unmount
      }
    };
  }, [projectId, router, currentUser]);

  const rootComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: number) =>
    comments.filter((c) => c.parentId === parentId);

  const handleSubmit = async (content: string, parentId?: number | null): Promise<boolean> => {
    const res = await createComment({ projectId, content, parentId });
    if (res.success) {
      toast.success(parentId ? "Đã gửi phản hồi!" : "Đã đăng bình luận!");
      setReplyingTo(null);
      return true;
    } else {
      toast.error(res.error);
      return false;
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    const res = await deleteComment(commentId, projectId);
    if (res.success) {
      toast.success("Bình luận đã được xóa");
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <CommentInput
        projectId={projectId}
        currentUser={currentUser}
        replyingTo={replyingTo}
        allUsers={allUsers}
        onCancelReply={() => setReplyingTo(null)}
        onSubmit={handleSubmit}
      />

      {/* Comments List */}
      <div className="space-y-5">
        {rootComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-14 text-[#8a8d93] bg-white rounded-2xl border border-[#eceef0] border-dashed">
            <MessageSquare className="size-10 mb-3 opacity-20" />
            <p className="font-bold text-sm">Chưa có trao đổi nào trên dự án này.</p>
            <p className="text-[10px] uppercase font-black opacity-40 mt-1">
              Hãy bắt đầu cuộc trò chuyện!
            </p>
          </div>
        ) : (
          rootComments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={getReplies(c.id)}
              currentUser={currentUser}
              allUsers={allUsers}
              onDelete={handleDelete}
              onReply={(comment) => {
                setReplyingTo(comment);
                const el = document.getElementById("comment-input");
                el?.focus();
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
