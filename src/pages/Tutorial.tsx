import React from 'react';
import { Menu } from 'lucide-react';

const Tutorial: React.FC = () => {
  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* 左側選單 (Sidebar) */}
      <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto hidden md:block">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Menu className="w-4 h-4" /> 課程目錄
          </h3>
        </div>
        <div className="p-4 text-sm text-gray-500">
           (之後這裡會放入課程列表)
        </div>
      </div>

      {/* 右側內容 (Content) */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">歡迎來到專題教學</h2>
            <p className="text-gray-600">請從左側選擇一個單元開始學習。</p>
            <p className="text-gray-400 text-sm mt-4">(教學內容模組將在下一步驟開發)</p>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;