import React, { useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';

export const AdminBlacklist: React.FC = () => {
  const [keywords, setKeywords] = useState([
    { id: 1, word: 'súng', level: 'high' },
    { id: 2, word: 'ma túy', level: 'critical' },
    { id: 3, word: 'lừa đảo', level: 'medium' },
  ]);

  const getLevelBadge = (level: string) => {
    switch(level) {
      case 'critical': return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-bold">Nghiêm trọng (Khóa nick)</span>;
      case 'high': return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded font-bold">Cao (Xóa bài)</span>;
      case 'medium': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-bold">Trung bình (Cảnh cáo)</span>;
      default: return null;
    }
  };

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Form Thêm Từ Khóa */}
        <div className="col-span-1 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
          <h3 className="font-bold text-lg mb-4 dark:text-white flex items-center gap-2">
             <span className="material-symbols-outlined text-red-500">gavel</span> Thêm Từ Khóa Cấm
          </h3>
          <form className="space-y-4">
            <div>
              <label className="text-sm text-slate-500 mb-1 block">Từ khóa</label>
              <input type="text" className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 outline-none dark:text-white" placeholder="Nhập từ cần cấm..." />
            </div>
            <div>
              <label className="text-sm text-slate-500 mb-1 block">Mức độ vi phạm</label>
              <select className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 outline-none dark:text-white appearance-none">
                <option value="medium">Trung bình (Cảnh cáo)</option>
                <option value="high">Cao (Xóa sản phẩm)</option>
                <option value="critical">Nghiêm trọng (Khóa tài khoản)</option>
              </select>
            </div>
            <button type="button" className="w-full bg-red-500 text-white font-bold py-2 rounded-xl hover:bg-red-600 transition-colors">
              Đưa vào Blacklist
            </button>
          </form>
        </div>

        {/* Danh sách Từ khóa */}
        <div className="col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
              <tr>
                <th className="p-4 font-medium">Từ khóa</th>
                <th className="p-4 font-medium">Mức độ</th>
                <th className="p-4 font-medium text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {keywords.map((kw) => (
                <tr key={kw.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4 font-bold text-slate-800 dark:text-slate-200">"{kw.word}"</td>
                  <td className="p-4">{getLevelBadge(kw.level)}</td>
                  <td className="p-4 text-center">
                    <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Xóa">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </AdminLayout>
  );
};