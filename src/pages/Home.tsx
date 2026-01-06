import React from 'react';
import { Layout, ArrowRight, BookOpen, Cpu, Play } from 'lucide-react';
import { ViewState } from '../components/Navbar';

interface HomeProps {
  setView: (view: ViewState) => void;
}

const Home: React.FC<HomeProps> = ({ setView }) => {
  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Section */}
      <div className="bg-gray-900 text-white py-20 px-8 text-center relative overflow-hidden flex-1 flex flex-col justify-center items-center">
        {/* 背景裝飾 */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none flex justify-center items-center">
          <Layout className="w-[500px] h-[500px]" />
        </div>
        
        <h2 className="text-5xl font-extrabold mb-6 relative z-10 leading-tight">
          用拉的寫程式<br/>
          <span className="text-red-500">連接物聯網世界</span>
        </h2>
        
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto relative z-10">
          無需安裝繁雜環境，透過互動式教學與線上模擬器，從零開始掌握 Node-RED 自動化邏輯。
        </p>
        
        <button 
          onClick={() => setView('tutorial')}
          className="bg-[#8f0000] hover:bg-red-700 text-white font-bold py-4 px-10 rounded-lg text-lg transition shadow-xl relative z-10 flex items-center gap-2 transform hover:scale-105"
        >
          開始免費學習 <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Features Section */}
      <div className="py-20 px-8 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Feature 1 */}
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-center hover:shadow-lg transition duration-300">
            <div className="w-16 h-16 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">循序漸進的教學</h3>
            <p className="text-gray-600 leading-relaxed">從基礎節點到 MQTT 物聯網通訊，精心設計的九大專題關卡，帶你一步步通關。</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-center hover:shadow-lg transition duration-300">
            <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Cpu className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">免硬體實作</h3>
            <p className="text-gray-600 leading-relaxed">內建虛擬氣象站、智慧開關與 Line 通知模擬，不用買樹莓派也能學 IoT。</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-center hover:shadow-lg transition duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Play className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">瀏覽器模擬器</h3>
            <p className="text-gray-600 leading-relaxed">獨家開發的輕量級沙盒，直接在網頁上拖拉節點、連線並驗證邏輯。</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;