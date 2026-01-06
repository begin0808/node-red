import React from 'react';
import { Settings } from 'lucide-react';

const Simulator: React.FC = () => {
  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#e6e6e6]">
      {/* 節點面板 */}
      <div className="w-48 bg-white border-r border-gray-300 p-4">
        <h3 className="font-bold text-gray-700 mb-4">節點庫</h3>
        <div className="space-y-2">
            <div className="bg-[#a6bbcf] p-2 rounded border border-[#96aabf] text-sm text-center">inject</div>
            <div className="bg-[#87a980] p-2 rounded border border-[#779970] text-sm text-center">debug</div>
        </div>
      </div>

      {/* 畫布區域 */}
      <div className="flex-1 relative flex items-center justify-center">
        <div className="text-center">
            <p className="text-xl text-gray-500 font-bold mb-2">模擬器畫布區域</p>
            <p className="text-gray-400">我們稍後會將 React Flow 整合至此處</p>
        </div>
      </div>

      {/* 除錯面板 */}
      <div className="w-64 bg-white border-l border-gray-300 flex flex-col">
        <div className="p-2 bg-gray-100 border-b border-gray-300 font-bold text-xs text-gray-600 flex justify-between items-center">
            <span>Debug Messages</span>
            <Settings className="w-3 h-3" />
        </div>
        <div className="flex-1 p-2 text-xs text-gray-400 italic text-center pt-10">
            暫無訊息
        </div>
      </div>
    </div>
  );
};

export default Simulator;