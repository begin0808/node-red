import React from 'react';
import { Box, Play, Layout, BookOpen } from 'lucide-react';

// 定義頁面切換的型別
export type ViewState = 'home' | 'tutorial' | 'simulator';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  return (
    <nav className="bg-[#8f0000] text-white p-4 shadow-md flex items-center justify-between sticky top-0 z-50">
      {/* Logo 區塊 */}
      <div 
        className="flex items-center gap-3 cursor-pointer select-none" 
        onClick={() => setView('home')}
      >
        <Box className="w-8 h-8" />
        <h1 className="text-xl font-bold tracking-tight">Node-RED 實戰學院</h1>
      </div>

      {/* 選單連結 */}
      <div className="flex gap-6 text-sm font-medium items-center">
        <button 
          onClick={() => setView('home')}
          className={`flex items-center gap-1 hover:text-red-200 transition ${currentView === 'home' ? 'border-b-2 border-white pb-0.5' : ''}`}
        >
          <Layout className="w-4 h-4" /> 首頁
        </button>
        
        <button 
          onClick={() => setView('tutorial')}
          className={`flex items-center gap-1 hover:text-red-200 transition ${currentView === 'tutorial' ? 'border-b-2 border-white pb-0.5' : ''}`}
        >
          <BookOpen className="w-4 h-4" /> 專題教學
        </button>
        
        <button 
          onClick={() => setView('simulator')}
          className={`flex items-center gap-1 bg-white text-[#8f0000] px-4 py-1.5 rounded-full hover:bg-gray-100 transition shadow-sm font-bold`}
        >
          <Play className="w-4 h-4" /> 線上模擬器
        </button>
      </div>
    </nav>
  );
};

export default Navbar;