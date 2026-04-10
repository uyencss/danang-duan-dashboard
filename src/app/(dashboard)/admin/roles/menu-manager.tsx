"use client";

import { useState } from "react";
import { updateMenuItems } from "./actions";
import { useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { useAlert } from "@/components/ui/use-alert";

export function MenuManager({ menuItems }: { menuItems: any[] }) {
  // state for local edits
  const [items, setItems] = useState<any[]>([...menuItems].sort((a,b) => a.sortOrder - b.sortOrder).map(m => ({ ...m })));
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlert();

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateMenuItems(items.map(item => ({
        id: item.id,
        label: item.label,
        sortOrder: Number(item.sortOrder) || 0,
        section: item.section,
        icon: item.icon,
        isActive: item.isActive,
      })));
      showAlert({
        title: "Thành công",
        description: "Cập nhật menu thành công!",
        type: "success",
        showCancel: false,
      });
      router.refresh();
    } catch (e: any) {
      showAlert({
        title: "Lỗi",
        description: "Có lỗi xảy ra: " + (e?.message || String(e)),
        type: "error",
        showCancel: false,
      });
    }
    setLoading(false);
  };

  const updateItem = (id: number, field: string, value: any) => {
    let newItems = items.map(item => item.id === id ? { ...item, [field]: value } : item);
    if (field === 'sortOrder') {
       newItems = newItems.sort((a,b) => a.sortOrder - b.sortOrder);
    }
    setItems(newItems);
  };

  const moveItem = (section: string, id: number, direction: 'up' | 'down') => {
    const sectionItems = items.filter(i => i.section === section).sort((a,b) => a.sortOrder - b.sortOrder);
    const currentIndex = sectionItems.findIndex(i => i.id === id);
    if (currentIndex === -1) return;

    const newItems = [...items];
    const targetItem = newItems.find(i => i.id === id);
    if (!targetItem) return;

    if (direction === 'up' && currentIndex > 0) {
      const swapItem = newItems.find(i => i.id === sectionItems[currentIndex - 1].id);
      if (swapItem) {
        const temp = targetItem.sortOrder;
        targetItem.sortOrder = swapItem.sortOrder;
        swapItem.sortOrder = temp;
      }
    } else if (direction === 'down' && currentIndex < sectionItems.length - 1) {
      const swapItem = newItems.find(i => i.id === sectionItems[currentIndex + 1].id);
      if (swapItem) {
        const temp = targetItem.sortOrder;
        targetItem.sortOrder = swapItem.sortOrder;
        swapItem.sortOrder = temp;
      }
    }
    setItems(newItems);
  };

  const renderSection = (sectionKey: string, sectionTitle: string) => {
    const sectionItems = items.filter(i => i.section === sectionKey).sort((a,b) => a.sortOrder - b.sortOrder);
    
    return (
      <>
        <tr className="bg-slate-100/80 border-y border-outline-variant/10">
          <td colSpan={5} className="px-6 py-2 text-xs font-black text-on-surface uppercase tracking-widest">
            {sectionTitle}
          </td>
        </tr>
        {sectionItems.map((item, index) => {
          const IconComp = (LucideIcons as any)[item.icon || "Folder"] || LucideIcons.Folder;
          return (
            <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${!item.isActive ? 'opacity-50 grayscale' : ''}`}>
              <td className="px-6 py-2 border-r border-outline-variant/5">
                <div className="flex items-center justify-center gap-2">
                   <span className="w-6 text-center font-bold text-sm text-slate-500 bg-slate-100 py-1 rounded">
                     {item.sortOrder}
                   </span>
                   <div className="flex gap-1">
                      <button onClick={() => moveItem(sectionKey, item.id, 'up')} disabled={index === 0} className="w-6 h-6 flex items-center justify-center rounded bg-slate-100/50 hover:bg-slate-200 text-slate-500 disabled:opacity-20 transition-colors"><LucideIcons.ChevronUp size={14} strokeWidth={3}/></button>
                      <button onClick={() => moveItem(sectionKey, item.id, 'down')} disabled={index === sectionItems.length - 1} className="w-6 h-6 flex items-center justify-center rounded bg-slate-100/50 hover:bg-slate-200 text-slate-500 disabled:opacity-20 transition-colors"><LucideIcons.ChevronDown size={14} strokeWidth={3}/></button>
                   </div>
                </div>
              </td>
              <td className="px-6 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-[#f0f7ff] flex justify-center items-center shrink-0">
                     <IconComp size={15} className="text-[#0058bc]" />
                  </div>
                  <input 
                    type="text"
                    value={item.label}
                    onChange={(e) => updateItem(item.id, 'label', e.target.value)}
                    className="font-bold text-sm text-on-surface w-full bg-transparent border-b border-transparent focus:border-primary focus:outline-none transition-colors py-1"
                  />
                </div>
              </td>
              <td className="px-6 py-2">
                 <select 
                   value={item.section}
                   onChange={(e) => updateItem(item.id, 'section', e.target.value)}
                   className="text-xs border border-slate-200 rounded px-2 py-1.5 bg-white uppercase font-bold text-slate-600 focus:outline-none focus:border-primary"
                 >
                    <option value="main">Main (Chính)</option>
                    <option value="admin">Admin (Quản trị)</option>
                 </select>
              </td>
              <td className="px-6 py-2 text-center border-l border-outline-variant/5">
                 <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 truncate max-w-[120px] inline-block">
                   {item.href}
                 </span>
              </td>
              <td className="px-6 py-2 text-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.isActive}
                    onChange={(e) => updateItem(item.id, 'isActive', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0058bc]"></div>
                  <span className="ml-2 text-[10px] font-bold text-slate-500 w-10 text-left">
                    {item.isActive ? "HIỆN" : "ẨN"}
                  </span>
                </label>
              </td>
            </tr>
          );
        })}
      </>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden col-span-12">
      <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-slate-50">
        <div>
          <h3 className="text-base font-bold text-on-surface">Cấu hình Menu hiển thị</h3>
          <p className="text-xs text-on-surface-variant">Sắp xếp, thay đổi tên hiển thị và ẩn/hiện các menu hệ thống.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-outline-variant/10">
              <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-on-surface-variant w-16 text-center">Thứ tự</th>
              <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-on-surface-variant">Menu</th>
              <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-on-surface-variant">Section</th>
              <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-on-surface-variant text-center border-l border-outline-variant/10 w-24">Link</th>
              <th className="px-6 py-4 text-[10px] font-black tracking-widest uppercase text-on-surface-variant text-center w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {renderSection('main', 'Menu Chính')}
            {renderSection('admin', 'Menu Quản Trị')}
          </tbody>
        </table>
      </div>
    </div>
  );
}
