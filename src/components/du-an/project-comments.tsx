"use client";

import { useState, useEffect } from "react";
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
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { createComment, deleteComment } from "@/app/(dashboard)/du-an/[id]/comment-actions";
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

// ─── Extracted outside to avoid remount on every parent render ─────────────
interface CommentItemProps {
    comment: Comment;
    isReply?: boolean;
    replies: Comment[];
    currentUser: CurrentUser | null | undefined;
    onDelete: (id: number) => void;
    onReply: (comment: Comment) => void;
}

function CommentItem({ comment, isReply = false, replies, currentUser, onDelete, onReply }: CommentItemProps) {
    return (
        <div className={cn("flex gap-3", isReply ? "mt-4" : "mt-8 animate-in slide-in-from-left duration-300")}>
            <Avatar className={cn("rounded-xl border shadow-sm", isReply ? "size-8" : "size-10")}>
                <AvatarImage src={comment.user.avatarUrl || ""} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {comment.user.name.charAt(0)}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm shadow-gray-200/20 group relative">
                    <div className="flex items-center justify-between gap-4 mb-1">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-gray-800 text-sm">{comment.user.name}</span>
                            {comment.user.role === "ADMIN" && (
                                <Badge className="bg-blue-50 text-blue-600 border-none px-1 text-[8px] h-3 uppercase font-black">Admin</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                            
                            {(currentUser?.role === "ADMIN" || currentUser?.id === comment.user.id) && (
                                <button 
                                    onClick={() => onDelete(comment.id)} 
                                    className="p-1 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="size-3" />
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{comment.content}</p>

                    {!isReply && (
                        <button 
                            onClick={() => {
                                onReply(comment);
                                const el = document.getElementById('comment-input');
                                el?.focus();
                            }}
                            className="absolute -bottom-6 left-0 text-[10px] font-black text-primary hover:text-blue-700 flex items-center gap-1 uppercase"
                        >
                            <Reply className="size-3" /> Phản hồi
                        </button>
                    )}
                </div>

                {!isReply && replies.map(reply => (
                    <CommentItem
                        key={reply.id}
                        comment={reply}
                        isReply
                        replies={[]}
                        currentUser={currentUser}
                        onDelete={onDelete}
                        onReply={onReply}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────
export function ProjectComments({ 
    projectId, 
    comments = [], 
    currentUser 
}: { 
    projectId: number, 
    comments: Comment[], 
    currentUser: CurrentUser | null | undefined
}) {
    const router = useRouter();
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initialize Ably client-side instance — only if key is valid
        const key = process.env.NEXT_PUBLIC_ABLY_KEY;
        if (!key || !key.includes(':')) return; // skip if placeholder/missing key

        const client = new Ably.Realtime({ key });
        const channel = client.channels.get(`project-${projectId}`);

        channel.subscribe("new_comment", (message) => {
            const data = message.data;
            if (currentUser && data.userName !== currentUser.name) {
                toast.info(`${data.userName} vừa bình luận: "${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}"`, {
                    icon: <MessageSquare className="size-4" />
                });
                router.refresh();
            }
        });

        return () => {
            channel.unsubscribe();
            client.close();
        };
    }, [projectId, router, currentUser]);

    const rootComments = comments.filter(c => !c.parentId);
    const getReplies = (parentId: number) => comments.filter(c => c.parentId === parentId);

    const handleSubmit = async () => {
        if (!newComment.trim() || newComment.length < 2) return;
        setLoading(true);
        const res = await createComment({
            projectId,
            content: newComment,
            parentId: replyingTo?.id || null
        });

        if (res.success) {
            toast.success(replyingTo ? "Đã gửi phản hồi!" : "Đã đăng bình luận!");
            setNewComment("");
            setReplyingTo(null);
        } else {
            toast.error(res.error);
        }
        setLoading(false);
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
        <div className="space-y-12">
            {/* Input Section */}
            <div className="bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100/50 space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <History className="size-4 text-primary" />
                    <h3 className="text-sm font-black text-[#003466] uppercase tracking-widest">Trao đổi nội bộ</h3>
                </div>

                {replyingTo && (
                    <div className="flex items-center justify-between bg-blue-50/50 px-4 py-2 rounded-xl text-[11px] font-bold text-primary">
                        <span className="flex items-center gap-2">
                           <Reply className="size-3" /> Trả lời @{replyingTo.user.name}
                        </span>
                        <button onClick={() => setReplyingTo(null)} className="hover:text-gray-400">
                           <X className="size-3" />
                        </button>
                    </div>
                )}

                <div className="relative">
                    <Textarea 
                        id="comment-input"
                        placeholder={replyingTo ? "Nhập phản hồi..." : "Đặt câu hỏi hoặc cập nhật cho Admin..."} 
                        className="min-h-[100px] bg-white rounded-2xl p-4 border-gray-100 focus:ring-primary/20 shadow-sm"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button 
                        disabled={loading || newComment.length < 2}
                        onClick={handleSubmit}
                        className="absolute bottom-3 right-3 bg-primary h-10 px-6 rounded-xl font-black shadow-lg shadow-primary/20 gap-2"
                    >
                        {loading ? "..." : <><Send className="size-4" /> Gửi</>}
                    </Button>
                </div>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
                {rootComments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-gray-400 bg-white rounded-3xl border border-dotted border-gray-200">
                        <MessageSquare className="size-12 mb-3 opacity-10" />
                        <p className="font-bold text-sm">Chưa có trao đổi nào trên dự án này.</p>
                        <p className="text-[10px] uppercase font-black opacity-40 mt-1">HÃY BẮT ĐẦU CUỘC TRÒ CHUYỆN!</p>
                    </div>
                ) : (
                    rootComments.map(c => (
                        <CommentItem
                            key={c.id}
                            comment={c}
                            replies={getReplies(c.id)}
                            currentUser={currentUser}
                            onDelete={handleDelete}
                            onReply={setReplyingTo}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
