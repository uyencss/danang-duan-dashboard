"use client";

import { useState } from "react";
import { AppRole } from "@/lib/rbac";
import { updateRoleConfig } from "./actions";

export function EditRoleDialog({
  role,
  data,
  onClose,
}: {
  role: AppRole;
  data: { label: string; description: string; color: string };
  onClose: () => void;
}) {
  const [label, setLabel] = useState(data.label);
  const [description, setDescription] = useState(data.description);
  const [color, setColor] = useState(data.color);
  const [loading, setLoading] = useState(false);

  const colors = ["purple", "indigo", "blue", "emerald", "amber"];

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateRoleConfig(role, { label, description, color });
      alert("Cập nhật thành công!");
      onClose();
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center transition-opacity duration-300">
      <div className="bg-white w-[500px] rounded-3xl shadow-2xl overflow-hidden transform scale-100 transition-transform duration-300">
        <div className="bg-[#0D1F3C] p-8 text-white relative">
          <button
            className="absolute top-6 right-6 text-white/50 hover:text-white"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <span className="px-2.5 py-1 bg-purple-50/10 text-purple-200 text-[10px] font-black rounded-lg uppercase tracking-wider border border-white/10 mb-2 inline-block">
            Chỉnh sửa Vai trò
          </span>
          <h3 className="text-2xl font-black tracking-tight">Cấu hình: {role}</h3>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
              Tên hiển thị (Label)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/30 rounded-xl text-sm focus:ring-2 focus:ring-secondary focus:border-transparent text-gray-800"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
              Mô tả chi tiết
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-outline-variant/30 rounded-xl text-sm focus:ring-2 focus:ring-secondary focus:border-transparent text-gray-800"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
              Màu sắc định danh
            </label>
            <div className="flex gap-3">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 scale-110" : "hover:scale-110"}`}
                  style={{
                    backgroundColor: `var(--color-${c}-500, ${c})`,
                    borderColor: color === c ? "white" : "transparent",
                    borderWidth: "2px",
                    ['--tw-ring-color' as any]: `var(--color-${c}-500, ${c})`,
                  }}
                  // Using style directly for tailwind dynamic colors or default colors
                  aria-label={`Select color ${c}`}
                >
                  <div className={`w-full h-full rounded-full bg-${c}-500`} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-8 py-6 bg-slate-50 border-t border-outline-variant/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-white transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="px-8 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            {loading ? "Đang lưu..." : "Cập nhật"}
          </button>
        </div>
      </div>
    </div>
  );
}
