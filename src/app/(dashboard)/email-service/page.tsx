"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export default function AdminEmailPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, message }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gửi email thất bại");
      }

      setStatus("success");
      setTo("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Đã xảy ra lỗi");
    }
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gởi Broadcast Email</h1>
          <p className="text-gray-500 dark:text-gray-400">Gửi thông báo, cập nhật qua hộp thư đến người dùng</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <form onSubmit={handleSendEmail} className="space-y-6">
            {status === "success" && (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg">
                Gửi email thành công!
              </div>
            )}
            
            {status === "error" && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="to" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gửi đến (To)
              </label>
              <input
                id="to"
                type="text"
                placeholder="all@users.com hoặc x@domain.com, y@domain.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-transparent dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500">Cho phép cách nhau bằng dấu phẩy</p>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tiêu đề (Subject)
              </label>
              <input
                id="subject"
                type="text"
                placeholder="Thông báo: Cập nhật hệ thống..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-transparent dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nội dung Email (Message) <span className="text-xs text-gray-500 font-normal">(Hỗ trợ Rich Text)</span>
              </label>
              <RichTextEditor
                content={message}
                onChange={(html) => setMessage(html)}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                className="px-6 py-2 mr-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition font-medium flex items-center shadow-sm disabled:opacity-50"
              >
                {status === "loading" ? "Đang gửi..." : "Gởi Email"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
