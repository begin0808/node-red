import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  Play, Square, Settings, Database, MessageSquare, Cloud, Command,
  Trash2, X, Maximize2, Minimize2, MoreVertical,
  MousePointer2, Hand, ZoomIn, ZoomOut, CheckCircle2,
  ChevronRight, ChevronDown, List, Copy, Search, SlidersHorizontal,
  CloudLightning, Smartphone, FileJson, Gauge, GitBranch, Upload,
  Cpu, Box, HelpCircle, ArrowRight, Sparkles, Code2, AlertTriangle,
  Clock, Edit3, Server, ArrowLeftRight, Bot, Eye, Mic, Smile, Image, Type, ToggleLeft, FormInput, PieChart
} from 'lucide-react';

// --- React Flow Imports (本機版已啟用) ---
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
  Handle,
  Position,
  MarkerType
} from '@xyflow/react';

// 分開引入型別定義
import type { Connection, Edge, Node } from '@xyflow/react';

// 引入 CSS
import '@xyflow/react/dist/style.css';

// --- 全域變數與型別 ---
const CYAN_GLOW = '0 0 10px rgba(34, 211, 238, 0.5)';

export type ViewState = 'home' | 'foundation' | 'projects' | 'ai' | 'simulator';
export type TutorialLevel = 'foundation' | 'beginner' | 'intermediate' | 'advanced' | 'ai';

interface TutorialData {
  id: string;
  title: string;
  level: TutorialLevel;
  description: string;
  content: string;
  solutionFlow: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  nodeName: string;
  payload: any;
}

// --- 模擬節點設定資料 ---
const NODE_CONFIGS: Record<string, { title: string, fields: { label: string, type: string, placeholder?: string, options?: string[] }[] }> = {
  // Common
  inject: { title: "Inject (注入)", fields: [{ label: "Payload", type: "select", options: ["timestamp", "string", "number", "boolean"] }, { label: "Topic", type: "text", placeholder: "" }, { label: "Repeat", type: "select", options: ["none", "interval", "at specific time"] }] },
  debug: { title: "Debug (除錯)", fields: [{ label: "Output", type: "select", options: ["msg.payload", "complete msg object"] }, { label: "To", type: "checkbox", placeholder: "debug window" }] },

  // Function
  function: { title: "Function (處理)", fields: [{ label: "Name", type: "text", placeholder: "my function" }, { label: "Code", type: "textarea", placeholder: "return msg;" }, { label: "Outputs", type: "number", placeholder: "1" }] },
  switch: { title: "Switch (判斷)", fields: [{ label: "Property", type: "text", placeholder: "msg.payload" }, { label: "Rule 1", type: "text", placeholder: "== val" }, { label: "Rule 2", type: "text", placeholder: "else" }] },
  change: { title: "Change (改變)", fields: [{ label: "Set", type: "text", placeholder: "msg.payload" }, { label: "To", type: "text", placeholder: "value" }] },
  delay: { title: "Delay (延遲)", fields: [{ label: "Delay", type: "number", placeholder: "5" }, { label: "Unit", type: "select", options: ["Seconds", "Minutes", "Hours"] }] },
  template: { title: "Template (模板)", fields: [{ label: "Format", type: "select", options: ["Mustache", "Plain Text"] }, { label: "Template", type: "textarea", placeholder: "<h1>{{payload}}</h1>" }] },

  // Network
  mqtt: { title: "MQTT In/Out", fields: [{ label: "Server", type: "text", placeholder: "broker.emqx.io:1883" }, { label: "Topic", type: "text", placeholder: "topic/path" }, { label: "QoS", type: "select", options: ["0", "1", "2"] }] },
  "mqtt in": { title: "MQTT In", fields: [{ label: "Server", type: "text", placeholder: "broker.emqx.io:1883" }, { label: "Topic", type: "text", placeholder: "topic/path" }, { label: "QoS", type: "select", options: ["0", "1", "2"] }] },
  "mqtt out": { title: "MQTT Out", fields: [{ label: "Server", type: "text", placeholder: "broker.emqx.io:1883" }, { label: "Topic", type: "text", placeholder: "topic/path" }, { label: "QoS", type: "select", options: ["0", "1", "2"] }] },
  http_req: { title: "HTTP Request", fields: [{ label: "Method", type: "select", options: ["GET", "POST", "PUT", "DELETE"] }, { label: "URL", type: "text", placeholder: "http://" }, { label: "Return", type: "select", options: ["a parsed JSON object", "a string"] }] },
  "http request": { title: "HTTP Request", fields: [{ label: "Method", type: "select", options: ["GET", "POST", "PUT", "DELETE"] }, { label: "URL", type: "text", placeholder: "http://" }, { label: "Return", type: "select", options: ["a parsed JSON object", "a string"] }] },
  http_in: { title: "HTTP In", fields: [{ label: "Method", type: "select", options: ["GET", "POST"] }, { label: "URL", type: "text", placeholder: "/api/endpoint" }] },
  http_res: { title: "HTTP Response", fields: [{ label: "Status Code", type: "number", placeholder: "200" }] },

  // Data & Social
  csv: { title: "CSV", fields: [{ label: "Columns", type: "text", placeholder: "a,b,c" }, { label: "Separator", type: "text", placeholder: "," }] },
  json: { title: "JSON", fields: [{ label: "Action", type: "select", options: ["Convert between JSON & Object", "Always parse", "Always stringify"] }] },
  email: { title: "Email", fields: [{ label: "To", type: "text", placeholder: "user@example.com" }, { label: "Server", type: "text", placeholder: "smtp.gmail.com" }] },
  line: { title: "LINE Bot", fields: [{ label: "Channel Token", type: "password", placeholder: "Access Token" }, { label: "Secret", type: "password", placeholder: "Channel Secret" }] },

  // AI
  chatgpt: { title: "ChatGPT", fields: [{ label: "API Key", type: "password", placeholder: "sk-..." }, { label: "Model", type: "select", options: ["gpt-3.5-turbo", "gpt-4"] }] },
  vision: { title: "Vision AI", fields: [{ label: "Service", type: "select", options: ["Google Vision", "Azure CV", "AWS Rekognition"] }] },
  stt: { title: "Voice STT", fields: [{ label: "Language", type: "select", options: ["zh-TW", "en-US"] }] },
  sentiment: { title: "Sentiment", fields: [{ label: "Engine", type: "select", options: ["TensorFlow.js", "Cloud NLP"] }] },
  dalle: { title: "DALL-E", fields: [{ label: "Size", type: "select", options: ["1024x1024", "512x512"] }] },

  // Dashboard
  ui_button: { title: "UI Button", fields: [{ label: "Group", type: "text", placeholder: "[Page] Group" }, { label: "Label", type: "text", placeholder: "Click Me" }] },
  ui_text: { title: "UI Text", fields: [{ label: "Group", type: "text", placeholder: "[Page] Group" }, { label: "Format", type: "text", placeholder: "{{msg.payload}}" }] },
  ui_gauge: { title: "UI Gauge", fields: [{ label: "Type", type: "select", options: ["Gauge", "Donut", "Compass"] }, { label: "Range", type: "text", placeholder: "0 - 10" }] },
  ui_switch: { title: "UI Switch", fields: [{ label: "On Payload", type: "text", placeholder: "true" }, { label: "Off Payload", type: "text", placeholder: "false" }] },
  ui_slider: { title: "UI Slider", fields: [{ label: "Min", type: "number", placeholder: "0" }, { label: "Max", type: "number", placeholder: "100" }] },
  ui_dropdown: { title: "UI Dropdown", fields: [{ label: "Options", type: "textarea", placeholder: "Option 1\nOption 2" }] },
  ui_text_input: { title: "UI Input", fields: [{ label: "Label", type: "text", placeholder: "Enter text..." }, { label: "Mode", type: "select", options: ["Text", "Email", "Password"] }] },
  ui_chart: { title: "UI Chart", fields: [{ label: "Type", type: "select", options: ["Line", "Bar", "Pie"] }, { label: "X-Axis", type: "text", placeholder: "Time" }] }
};

// --- 模擬圖片元件 ---
const MockWindow: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="my-6 border border-slate-700 rounded-lg overflow-hidden bg-slate-900 shadow-xl max-w-md mx-auto">
    <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex items-center gap-2">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
      </div>
      <span className="text-xs text-slate-400 ml-2 font-medium">{title}</span>
    </div>
    <div className="p-4 text-slate-300 text-sm font-mono relative">
      {children}
    </div>
  </div>
);

// --- 資料庫 (Tutorials) ---
const TUTORIALS: TutorialData[] = [
  // --- 1. 入門基礎 (Foundation) ---
  {
    id: 'f1',
    title: '1-1. 認識 Node-RED',
    level: 'foundation',
    description: '了解流程導向編程 (FBP) 的核心概念與優勢。',
    content: `# 什麼是 Node - RED？

Node - RED 是由 IBM 開發的視覺化開發工具，專為物聯網(IoT) 設計，但其應用已遠超於此。

![Concept](/tutorials/concept.png)

## 為什麼選擇 Node - RED？

我們將傳統程式開發與 Node - RED 進行比較：

| 特性 | 傳統編程(Python / JS) | Node - RED |
| : --- | : --- | : --- |
| ** 開發方式 ** | 撰寫文字代碼 | 拖拉節點與連線 |
| ** 學習曲線 ** | 較陡峭 | 平緩直觀 |
| ** 除錯難度 ** | 需檢視 Log | 可視化數據流 |
| ** 適合場景 ** | 複雜演算法 | 系統整合、API 串接 |

## 核心三要素

1. ** Nodes(節點) **：預先寫好的程式積木（如輸入、處理、輸出）。
2. ** Flows(流程) **：節點之間的連線，代表數據的流向。
3. ** Messages(訊息) **：在節點間傳遞的 JSON 物件(msg)。`,
    solutionFlow: `[]`
  },
  {
    id: 'f2',
    title: '1-2. 環境建置與安裝',
    level: 'foundation',
    description: 'Windows/Mac/Linux 安裝指南與環境設定。',
    content: `# Node - RED 安裝指南

本章節將引導您在個人電腦(Windows / Mac / Linux) 上建置開發環境。

## 1. 安裝 Node.js

Node - RED 需要 Node.js 執行環境。

* ** 官方下載 **：前往[Node.js 官網(nodejs.org)](https://nodejs.org/en/)
  * ** 建議版本 **：LTS(長期支援版)

## 2. 安裝 Node - RED

開啟終端機(Terminal) 輸入指令：

\`\`\`bash
# Windows
npm install -g --unsafe-perm node-red

# Mac/Linux
sudo npm install -g --unsafe-perm node-red
\`\`\`

## 3. 啟動服務

在終端機輸入 \`node-red\`，看到下方畫面即代表成功：

![Terminal](/tutorials/install.png)

打開瀏覽器訪問：**http://localhost:1880**

## 常見問題

| 問題 | 解決方案 |
| :--- | :--- |
| **Port 佔用** | 使用 \`node-red -p 1888\` 指定其他 Port |
| **權限錯誤** | Mac/Linux 請在指令前加 \`sudo\` |
| **語言設定** | 自動偵測瀏覽器，或修改 \`settings.js\` 強制中文 |\`,`,
    solutionFlow: `[]`
  },
  {
    id: 'f3',
    title: '1-3. 介面導覽與操作',
    level: 'foundation',
    description: '熟悉 Palette、Workspace、Sidebar 三大工作區塊。',
    content: `# 介面速覽

Node-RED 的編輯器主要分為三個區域：

![Interface](/tutorials/interface.png)

## 1. 左側面板 (Palette)
存放所有可用的節點，依功能分類（Common, Function, Network...）。

## 2. 中央畫布 (Workspace)
主要的開發區域，您可以在此拖曳節點並進行連線。

## 3. 右側邊欄 (Sidebar)
包含資訊 (Info)、除錯 (Debug)、儀表板 (Dashboard) 等分頁。

### 常用快捷鍵

* **Ctrl + Enter**：部署 (Deploy)
* **Ctrl + Click**：多選節點
* **Double Click**：編輯節點屬性\`,`,
    solutionFlow: `[]`
  },
  {
    id: 'f4',
    title: '1-4. 核心功能節點教學',
    level: 'foundation',
    description: 'Inject, Debug, Function, Switch 等基礎節點的詳細設定與應用。',
    content: `# 核心功能節點(Core & Function) \n\n這是 Node - RED 最常用的基礎積木，掌握它們就能解決 80 % 的問題。\n\n## 1. Inject(注入) \n ** 用途 **：流程的起點。可手動點擊觸發，或設定定時自動觸發。\n ** 設定重點 **：\n * \`Payload\`：發送的內容 (字串、數字、時間戳)。\n* \`Repeat\`：設定循環時間 (Interval) 或指定時間 (At a specific time)。\n\n[Config: Inject]\n\n## 2. Debug (除錯)\n**用途**：流程的終點。將接收到的訊息顯示在右側的 Debug 視窗。\n**設定重點**：\n* \`Output\`：預設顯示 \`msg.payload\`，也可改為 \`complete msg object\` 查看完整物件。\n\n[Config: Debug]\n\n## 3. Function (處理)\n**用途**：萬能節點。使用 JavaScript 撰寫自定義邏輯。\n**設定重點**：\n* 在代碼區塊中撰寫 JS，最後必須 \`return msg;\`。\n\n[Config: Function]\n\n## 4. Switch (判斷)\n**用途**：邏輯分流。類似程式的 \`if-else\`。\n**設定重點**：\n* 設定屬性 (Property) 通常是 \`msg.payload\`。\n* 新增規則 (Rules)：如 \`> 50\` 走通道 1，\`else\` 走通道 2。\n\n[Config: Switch]\n\n## 5. Change (改變)\n**用途**：修改訊息內容，無需寫程式。\n**設定重點**：\n* \`Set\`：設定屬性值。\n* \`Move\`：移動屬性。\n* \`Delete\`：刪除屬性。\n\n## 6. Delay (延遲)\n**用途**：暫停流程一段時間，或限制訊息通過的頻率 (Rate Limit)。\n**設定重點**：\n* \`Delay msg\`：固定延遲毫秒/秒數。\n* \`Rate Limit\`：限制每秒/每分通過的訊息數量。`,
    solutionFlow: `[]`
  },
  {
    id: 'f5',
    title: '1-5. 資料處理與格式節點',
    level: 'foundation',
    description: 'Template, JSON, CSV 等節點，負責資料的轉換與模板生成。',
    content: `# 資料處理節點 (Data Parsing)\n\n負責不同資料格式之間的轉換與呈現。\n\n## 1. Template (模板)\n**用途**：依照模板格式產生文字或 HTML。\n**設定重點**：\n* 使用 Mustache 語法 \`{{msg.payload}}\` 來嵌入變數。\n* Format 可選 Mustache 或 Plain Text。\n\n[Config: Template]\n\n## 2. JSON\n**用途**：處理 JSON 資料。\n* 輸入是 JSON 字串 -> 轉為 JavaScript 物件。\n* 輸入是 物件 -> 轉為 JSON 字串。\n**設定重點**：通常保持預設即可，它會自動判斷輸入類型進行轉換。\n\n## 3. CSV\n**用途**：處理逗號分隔資料。\n* 將 CSV 字串轉為陣列或物件。\n* 將陣列轉為 CSV 字串。\n**設定重點**：\n* \`Columns\`：定義欄位名稱 (如 \`name,age,city\`)。\n* \`Separator\`：分隔符號 (預設逗號)。`,
    solutionFlow: `[]`
  },
  {
    id: 'f6',
    title: '1-6. 網路與社群通訊節點',
    level: 'foundation',
    description: 'MQTT, HTTP, Email, LINE Bot 等連接外部世界的節點。',
    content: `# 網路與通訊節點 (Network)

連接外部世界，進行 API 呼叫與通訊。

## 1. HTTP Request (請求)
**用途**：主動向外部網站或 API 發送請求 (Client 端)。
**設定重點**：
* \`Method\`：GET, POST, PUT, DELETE。
* \`URL\`：目標網址。
* \`Return\`：建議設為 \`a parsed JSON object\` 自動解析回傳資料。

## 2. HTTP In / Response
**用途**：建立自己的 Web API (Server 端)。
* \`HTTP In\`：監聽特定 URL 路徑 (如 \`/hello\`)。
* \`HTTP Response\`：發送回應給瀏覽器。
**設定重點**：
* \`HTTP In\` 的 \`URL\` 需以此開頭 (如 \`/api/data\`)。
* 這兩個節點必須成對使用 (中間可夾 Function 處理邏輯)。

## 3. MQTT In / Out
**用途**：物聯網標準通訊協定。
* \`MQTT In\`：訂閱主題 (Subscribe)。
* \`MQTT Out\`：發布主題 (Publish)。
**設定重點**：
* \`Server\`：設定 Broker 地址 (如 \`broker.emqx.io\`)。
* \`Topic\`：設定通訊頻道 (如 \`home/livingroom/light\`)。

## 4. Email
**用途**：發送電子郵件通知。
**設定重點**：
* \`To\`：收件人。
* **Gmail 設定注意**：需啟用 [兩步驟驗證](https://myaccount.google.com/security) 並申請 [應用程式密碼](https://myaccount.google.com/apppasswords) 填入 Password 欄位。

## 5. LINE Bot
**用途**：與 LINE 使用者互動 (Messaging API)。
**設定重點**：
* 需搭配 HTTP In/Response (Webhook 模式) 或 Push API。
* **申請**: 前往 [LINE Developers](https://developers.line.biz/)。
* **費用**: 輕用量方案每月免費 200 則。`,
    solutionFlow: `[]`
  },
  {
    id: 'f7',
    title: '1-7. Dashboard 介面節點',
    level: 'foundation',
    description: 'UI Button, Text, Gauge, Switch, Slider 等視覺化儀表板元件。',
    content: `# 儀表板節點 (Dashboard)\n\n快速建立網頁監控介面，無需寫 HTML/CSS。\n\n## 1. UI Button (按鈕)\n**用途**：在網頁上建立按鈕，點擊後觸發流程。\n**設定**：設定 \`Payload\` 為點擊時要發送的內容。\n\n## 2. UI Switch (開關)\n**用途**：切換 ON/OFF 狀態。\n**設定**：定義 On Payload (如 true) 與 Off Payload (如 false)。\n\n[Config: Dashboard Switch]\n\n## 3. UI Slider (滑桿)\n**用途**：拖曳選擇數值區間。\n**設定**：設定 Min (最小) 與 Max (最大) 值。\n\n## 4. UI Dropdown (選單)\n**用途**：下拉選擇特定選項。\n**設定**：編輯 Options 列表 (Label 與 Value)。\n\n## 5. UI Text Input (輸入)\n**用途**：讓使用者輸入文字或數字。\n**設定**：可設定 Label 與 Delay (輸入後延遲多久發送)。\n\n## 6. UI Text (顯示)\n**用途**：顯示數值或文字。\n**設定**：\`Value format\` 可使用 \`{{msg.payload}}\` 格式化。\n\n## 7. UI Gauge (儀表)\n**用途**：以圖形化儀表顯示數值 (如溫度、濕度)。\n**設定**：\n* \`Type\`：圓錶、甜甜圈、指南針等。\n* \`Range\`：設定數值範圍與顏色區間。\n\n[Config: Dashboard Gauge]\n\n## 8. UI Chart (圖表)\n**用途**：繪製折線圖或長條圖。\n**設定**：需給定 \`msg.payload\` (數值) 與 \`msg.topic\` (數據分類)。`,
    solutionFlow: `[]`
  },

  // --- 2. 專題實作 - 初階 (Beginner) ---
  {
    id: 'p1-1',
    title: '2-1-1. Hello World',
    level: 'beginner',
    description: '實作您的第一個流程，學習 Inject 與 Debug 的用法。',
    content: `# 您的第一個流程

![Hello World Flow](/tutorials/p1-1_flow.png)

目標：手動觸發訊號，並在除錯視窗觀察結果。\n\n\n\n## 實作環境與材料\n\n* **硬體**：電腦 (PC/Mac/Linux)\n* **軟體**：Node-RED (預設安裝)\n* **所需節點**：\n    * \`Inject\` (輸入)\n    * \`Debug\` (輸出)\n\n
## 實作步驟

1.  從左側拖曳 \`inject\` 節點。
2.  拖曳 \`debug\` 節點。
3.  將兩者連線。
4.  點擊 Inject 按鈕觸發。
5.  觀察右側的 **Debug 視窗**。

> **提示**：您可以直接複製下方的代碼，點擊模擬器右上角的 **[Import]** 按鈕匯入執行。

## 數據結構\n\n| 屬性 | 說明 |\n| :--- | :--- |\n| **msg.payload** | 主要負載資料 (預設為時間戳記) |\n| **msg.topic** | 主題標籤 (可選) |`,
    solutionFlow: `[{"id":"n1","type":"inject","name":"發送訊息","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"Hello Node-RED","payloadType":"str","x":140,"y":100,"wires":[["n2"]]},{"id":"n2","type":"debug","name":"日誌輸出","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","statusVal":"","statusType":"auto","x":340,"y":100,"wires":[]}]`
  },
  {
    id: 'p1-2',
    title: '2-1-2. 簡易儀表板 (Dashboard)',
    level: 'beginner',
    description: '使用 node-red-dashboard 製作網頁按鈕與文字顯示。',
    content: `# 打造可視化控制台\n\nNode-RED 不只能跑後端，還能做 UI。\n\n\n\n## 實作環境與材料\n\n* **硬體**：電腦\n* **外掛套件**：\`node-red-dashboard\` (需額外安裝)\n    * *安裝方式*：右上角選單 -> Manage Palette -> Install -> 搜尋並安裝\n* **所需節點**：\n    * \`ui_button\`\n    * \`ui_text\`\n\n## 實作步驟\n\n1.  安裝 Dashboard 套件。\n2.  拖曳 \`ui_button\` 節點，設定 Group。\n\n\n\n3.  拖曳 \`ui_text\` 節點連接在後。\n4.  部署後，開啟 \`http://localhost:1880/ui\` 查看。\n\n> **注意**：線上模擬器僅模擬邏輯，無法顯示真實網頁。`,
    solutionFlow: `[{"id":"n_btn","type":"ui_button","group":"g1","name":"啟動按鈕","payload":"系統啟動","payloadType":"str","topic":"","topicType":"str","x":150,"y":160,"wires":[["n_txt"]]},{"id":"n_txt","type":"ui_text","group":"g1","order":0,"width":0,"height":0,"name":"","label":"當前狀態","format":"{{msg.payload}}","layout":"row-spread","x":350,"y":160,"wires":[]}]`
  },
  {
    id: 'p1-3',
    title: '2-1-3. 定時報時器',
    level: 'beginner',
    description: '掌握 Interval 定時觸發機制與 Template 字串處理。',
    content: `# 自動化排程\n\n學習如何讓程式固定時間執行任務，這是 IoT 監控的基礎。\n\n\n\n## 實作環境與材料\n\n* **硬體**：電腦\n* **核心概念**：週期性觸發 (Cron/Interval)\n* **所需節點**：\n    * \`Inject\` (設定 Repeat)\n    * \`Template\` (處理字串)\n\n## 實作步驟\n\n1.  設定 \`inject\` 節點 Repeat 為 "Interval" (每 5 秒)。\n\n\n\n2.  連接 \`template\` 節點，內容輸入 HTML 或純文字：\n    \`<h3>現在時間戳記：{{payload}}</h3>\`\n3.  連接 \`debug\` 查看結果。`,
    solutionFlow: `[{"id":"t3_1","type":"inject","name":"定時觸發器 (5s)","repeat":"5","crontab":"","once":false,"topic":"","payload":"","payloadType":"date","x":130,"y":220,"wires":[["t3_2"]]},{"id":"t3_2","type":"template","name":"訊息格式化","field":"payload","fieldType":"msg","format":"handlebars","template":"系統報告：目前時間戳記為 {{payload}}","output":"str","x":330,"y":220,"wires":[["t3_3"]]},{"id":"t3_3","type":"debug","name":"監控台","active":true,"console":false,"complete":"false","x":510,"y":220,"wires":[]}]`
  },

  // --- 3. 專題實作 - 中階 (Intermediate) ---
  {
    id: 'p2-1',
    title: '2-2-1. 模擬氣象站 API',
    level: 'intermediate',
    description: '串接 Open-Meteo API，獲取即時天氣資訊。',
    content: `# 串接真實數據 API

![Weather API](/tutorials/p2-1_weather.png)

IoT 裝置常需與雲端服務互動，例如上傳數據或獲取天氣。\n\n\n\n## 實作環境與材料\n\n* **環境**：需連接網際網路 (Internet)\n* **目標服務**：Open-Meteo (免費天氣 API)\n* **所需節點**：\n    * \`HTTP Request\`\n    * \`Debug\` (設定為 complete msg object)\n\n## API 資訊\n\n| 服務 | Open-Meteo |\n| :--- | :--- |\n| **Method** | GET |\n| **URL** | \`https://api.open-meteo.com/v1/forecast?latitude=25.03&longitude=121.56&current_weather=true\` |\n| **費用** | **免費** (非商業用途) |\n| **限制** | 無需 API Key，但建議每日呼叫次數 < 10,000 次。 |\n\n## 實作步驟\n\n1.  使用 \`inject\` 作為觸發。\n2.  連接 \`http request\`，貼上 API 網址，Return 設為 Object。\n3.  連接 \`debug\` 觀察 \`msg.payload\` 中的 JSON 物件。\n\n`,
    solutionFlow: `[{"id":"t4_1","type":"inject","name":"查詢天氣","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":150,"y":300,"wires":[["t4_2"]]},{"id":"t4_2","type":"http request","name":"GET Open-Meteo","method":"GET","ret":"obj","paytoqs":"ignore","url":"https://api.open-meteo.com/v1/forecast?latitude=25.03&longitude=121.56&current_weather=true","tls":"","persist":false,"proxy":"","authType":"","senderr":false,"headers":[],"x":350,"y":300,"wires":[["t4_3"]]},{"id":"t4_3","type":"debug","name":"天氣資訊","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","statusVal":"","statusType":"auto","x":550,"y":300,"wires":[]}]`
  },
  {
    id: 'p2-2',
    title: '2-2-2. 智慧開關邏輯',
    level: 'intermediate',
    description: '使用 Switch 節點進行溫度判斷與分流。',
    content: `# 賦予系統判斷能力\n\n模擬溫控：當溫度超過 30 度時自動開啟風扇，否則關閉。\n\n\n\n## 實作環境與材料\n\n* **模擬模式**：僅需電腦，使用 Inject 模擬溫度數值。\n* **真實硬體模式** (選配)：\n    * Raspberry Pi 或 ESP32 開發板\n    * **DHT11/DHT22** 溫濕度感測器\n    * **繼電器模組 (Relay)**\n    * **DC 風扇**\n\n## 實作步驟 (模擬)\n\n1.  使用 \`inject\` 模擬數值 (35 與 25)。\n2.  連接 \`switch\` 節點，設定規則：\n    * Port 1: \`> 30\` (高溫)\n    * Port 2: \`<= 30\` (正常)\n\n\n\n3.  分流至兩個 \`change\` 節點修改狀態文字。\n4.  匯總至 \`debug\`。`,
    solutionFlow: `[{"id":"t5_1","type":"inject","name":"溫度 35°C","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"35","payloadType":"num","x":140,"y":400,"wires":[["t5_sw"]]},{"id":"t5_2","type":"inject","name":"溫度 25°C","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"25","payloadType":"num","x":140,"y":460,"wires":[["t5_sw"]]},{"id":"t5_sw","type":"switch","name":"溫度判斷","property":"payload","propertyType":"msg","rules":[{"t":"gt","v":"30","vt":"num"},{"t":"lte","v":"30","vt":"num"}],"checkall":"true","repair":false,"outputs":2,"x":320,"y":430,"wires":[["t5_on"],["t5_off"]]},{"id":"t5_on","type":"change","name":"開啟風扇","rules":[{"t":"set","p":"payload","pt":"msg","to":"開啟風扇","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":500,"y":400,"wires":[["t5_debug"]]},{"id":"t5_off","type":"change","name":"關閉風扇","rules":[{"t":"set","p":"payload","pt":"msg","to":"關閉風扇","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":500,"y":460,"wires":[["t5_debug"]]},{"id":"t5_debug","type":"debug","name":"設備狀態","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","statusVal":"","statusType":"auto","x":680,"y":430,"wires":[]}]`
  },
  {
    id: 'p2-4',
    title: '2-2-3. LINE Bot 聊天機器人',
    level: 'intermediate',
    description: '使用 Messaging API 打造雙向互動機器人。',
    content: `# LINE Bot 雙向互動\n\n打造一個能與使用者對話的聊天機器人。由於 LINE Notify 服務已終止，現在我們全面使用功能更強大的 **Messaging API**。\n\n\n\n## 1. 申請 LINE Messaging API\n\n要開發 LINE Bot，必須先在 LINE Developers 平台建立頻道：\n\n1.  前往 [LINE Developers Console](https://developers.line.biz/console/) 並登入。\n2.  建立一個新的 **Provider** (提供者)。\n3.  在 Provider 下建立 **Create a new channel**，選擇 **Messaging API**。\n4.  填寫機器人名稱、敘述、類別等資訊。\n5.  建立完成後，進入 **Messaging API** 分頁：\n    * 掃描 QR Code 將機器人加為好友。\n    * 在下方找到 **Channel access token** (若無則點擊 Issue)，這串密鑰稍後 Node-RED 發送訊息時會用到。\n    * 啟用 **Use webhook** (稍後填入網址)。\n\n\n\n## 2. 實作架構 (Webhook)\n\nLINE Bot 的運作原理是「當有人傳訊息給機器人，LINE 伺服器會發送一個 POST 請求到你的伺服器 (Node-RED)」。\n\n\`\`\`text\n[LINE 伺服器] --(Webhook POST)--> [Node-RED (HTTP In)] -> [邏輯處理] -> [HTTP Request (Reply API)]\n\`\`\`\n\n## 3. 費用與限制 (參考)\n\n*   **輕用量方案 (免費)**: 每月 200 則訊息。\n*   **計費方式**: 根據官方政策，主動推播 (Push) 計算額度，被動回覆 (Reply) 目前通常不計費 (詳見官方公告)。\n\n## 4. 實作環境與材料\n\n* **軟體**：ngrok (用於將本機 localhost 暴露到公網，讓 LINE 能呼叫)\n* **節點**：\`http in\`, \`function\`, \`http request\`\n\n## 5. 實作步驟\n\n1.  **建立 Webhook 端點**：使用 \`http in\` 節點 (Method: POST, URL: /callback)。\n2.  **處理事件**：LINE 會傳送 JSON，訊息內容位於 \`msg.payload.events[0].message.text\`。\n3.  **回覆訊息**：呼叫 Reply API，將回應傳回給使用者。\n\n> **重要提示**：若您是在本機電腦執行 Node-RED，LINE 伺服器無法直接連線到 \`localhost\`。您必須使用 **ngrok** 等工具產生公開網址 (例如 \`https://xxxx.ngrok.io\`)，並將此網址填入 LINE Developers 後台的 Webhook URL 欄位 (例如 \`https://xxxx.ngrok.io/callback\`)。`,
    solutionFlow: `[{"id":"lb_in","type":"http in","name":"Webhook","url":"/callback","method":"post","x":150,"y":650,"wires":[["lb_func"]]},{"id":"lb_func","type":"function","name":"處理訊息","func":"var events = msg.payload.events;\\nif (events && events.length > 0) {\\n    var replyToken = events[0].replyToken;\\n    var userText = events[0].message.text;\\n    \\n    // 簡單的回覆邏輯\\n    msg.payload = {\\n        replyToken: replyToken,\\n        messages: [{ type: 'text', text: '收到：' + userText }]\\n    };\\n    // 設定 Header (需填入 Channel Access Token)\\n    msg.headers = {\\n        'Content-Type': 'application/json',\\n        'Authorization': 'Bearer YOUR_CHANNEL_ACCESS_TOKEN'\\n    };\\n    msg.url = 'https://api.line.me/v2/bot/message/reply';\\n    return msg;\\n}\\nreturn null;","x":350,"y":650,"wires":[["lb_req"]]},{"id":"lb_req","type":"http request","name":"Reply API","method":"POST","ret":"obj","url":"","x":550,"y":650,"wires":[]}]`
  },

  // --- 4. 專題實作 - 進階 (Advanced) ---
  {
    id: 'p3-1',
    title: '2-3-1. MQTT 通訊實戰',
    level: 'advanced',
    description: '建立 Publisher 與 Subscriber，體驗 IoT M2M 通訊。',
    content: `# 輕量級通訊標準 MQTT

體驗機器對機器 (M2M) 的對話，這是物聯網最核心的通訊協定。

## 1. 關於 Broker (伺服器)

*   **EMQX Public Interface (本次使用)**:
    *   **說明**: 公開測試伺服器，**數據完全公開**，任何人訂閱相同 Topic 都能收到。請勿傳輸隱私資料。
    *   **費用**: 免費。
*   **其他選擇**:
    *   **Mosquitto**: 可自行架設的開源 Broker。
    *   **HiveMQ Cloud**: 提供免費層級的雲端 Cluster。

## 2. 實作環境與材料

* **Broker**: \`broker.emqx.io\` (Port 1883)
* **Client A (發布者)**：Node-RED (或 ESP32 開發板)。
* **Client B (訂閱者)**：Node-RED (或手機 MQTT App)。

## 3. 實作步驟

1.  設定 \`mqtt out\` Topic 為 \`lab/switch\`。
2.  設定 \`mqtt in\` 訂閱相同 Topic。
3.  Inject 發送 "ON"，觀察訂閱端是否收到。`,
    solutionFlow: `[{"id":"t7_pub","type":"mqtt out","name":"發布者","topic":"lab/switch","qos":"","retain":"","broker":"mqtt_broker","x":380,"y":650,"wires":[]},{"id":"t7_inj","type":"inject","name":"發送 ON","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"ON","payloadType":"str","x":180,"y":650,"wires":[["t7_pub"]]},{"id":"t7_sub","type":"mqtt in","name":"訂閱者","topic":"lab/switch","qos":"2","datatype":"auto-detect","broker":"mqtt_broker","x":180,"y":720,"wires":[["t7_debug"]]},{"id":"t7_debug","type":"debug","name":"收到指令","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","statusVal":"","statusType":"auto","x":380,"y":720,"wires":[]},{"id":"mqtt_broker","type":"mqtt-broker","name":"EMQX Public","broker":"broker.emqx.io","port":"1883","clientid":"","autoConnect":true,"usetls":false,"protocolVersion":"4","keepalive":"60","cleansession":true,"autoUnsubscribe":true,"birthTopic":"","birthQos":"0","birthRetain":"false","birthPayload":"","closeTopic":"","closeQos":"0","closePayload":"","willTopic":"","willQos":"0","willPayload":""}]`
  },
  {
    id: 'p3-2',
    title: '2-3-2. REST API Server',
    level: 'advanced',
    description: '使用 Node-RED 架設 Web Server 接收 POST 請求。',
    content: `# 自建後端 API\n\n無需寫 code，快速架設 Web Server，適合用於接收 Webhook (如 GitHub、金流通知)。\n\n\n\n## 實作環境與材料\n\n* **環境**：Node-RED 伺服器 (本機或雲端)\n* **測試工具**：Postman 或 curl 指令\n\n## 實作步驟\n\n1.  **建立端點**：使用 \`http in\` (Method: POST, URL: /calc)。\n2.  **處理邏輯**：連接 \`function\` 進行計算 (例如輸入數字求平方)。\n3.  **回傳回應**：**務必**連接 \`http response\`，否則請求會超時。\n\n`,
    solutionFlow: `[{"id":"t8_in","type":"http in","name":"POST /calc","url":"/my-api/calc","method":"post","upload":false,"swaggerDoc":"","x":180,"y":820,"wires":[["t8_func"]]},{"id":"t8_func","type":"function","name":"計算平方","func":"var num = msg.payload.number || 0;\\nmsg.payload = { \"result\": num * num };\\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":380,"y":820,"wires":[["t8_res"]]},{"id":"t8_res","type":"http response","name":"回傳 JSON","statusCode":"200","headers":{},"x":580,"y":820,"wires":[]}]`
  },
  {
    id: 'p3-3',
    title: '2-3-3. CSV 數據處理',
    level: 'advanced',
    description: '讀取 CSV 檔案並轉換格式繪製圖表。',
    content: `# 數據 ETL (擷取、轉換、載入)\n\n處理傳統產業常見的 CSV 報表，將靜態檔案轉為動態圖表。\n\n\n\n## 實作環境與材料\n\n* **資料來源**：範例 .csv 檔案 (包含時間、數值等欄位)\n* **所需節點**：\n    * \`file in\` (讀取檔案)\n    * \`csv\` (解析格式)\n    * \`ui_chart\` (繪圖)\n\n## 實作步驟\n\n1.  使用 \`file in\` 或 Inject 模擬 CSV 字串。\n2.  使用 \`csv\` 節點解析為 JavaScript 物件。\n3.  使用 \`change\` 節點將欄位對應到圖表所需格式 (Topic/Payload)。\n4.  連接 Dashboard 圖表顯示。\n\n`,
    solutionFlow: `[{"id":"t9_inj","type":"inject","name":"模擬 CSV","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"Item,Value\\nA,10\\nB,20","payloadType":"str","x":180,"y":920,"wires":[["t9_csv"]]},{"id":"t9_csv","type":"csv","name":"解析 CSV","sep":",","hdrin":true,"hdrout":"none","multi":"one","ret":"\\n","temp":"","skip":"0","strings":true,"include_empty_strings":"","include_null_values":"","x":380,"y":920,"wires":[["t9_change"]]},{"id":"t9_change","type":"change","name":"格式轉換","rules":[{"t":"set","p":"topic","pt":"msg","to":"payload.Item","tot":"msg"},{"t":"set","p":"payload","pt":"msg","to":"payload.Item","tot":"msg"}],"action":"","property":"","from":"","to":"","reg":false,"x":560,"y":920,"wires":[["t9_chart"]]},{"id":"t9_chart","type":"ui_chart","name":"圖表","group":"g1","order":0,"width":0,"height":0,"label":"數據","chartType":"bar","legend":"false","xformat":"HH:mm:ss","interpolate":"linear","nodata":"","dot":false,"ymin":"","ymax":"","removeOlder":1,"removeOlderPoints":"","removeOlderUnit":"3600","cutout":0,"useOneColor":false,"useUTC":false,"colors":["#1f77b4"],"outputs":1,"useDifferentColor":false,"className":"","x":740,"y":920,"wires":[[]]}]`
  },

  // --- 5. AI 智慧應用 (AI Applications) ---
  {
    id: 'ai-1',
    title: '3-1. 串接 ChatGPT (OpenAI)',
    level: 'ai',
    description: '賦予 Node-RED 大腦！建立一個智慧問答機器人。',
    content: `# AI 智能整合：OpenAI API

將強大的 GPT 模型引入您的流程。

## 1. 什麼是 OpenAI API？

這是目前最強大的大型語言模型 (LLM) 介面，能理解並生成自然語言、程式碼，甚至進行角色扮演。Node-RED 可透過它實現智慧問答、翻譯或自動化客服。

## 2. 如何申請 API Key？

1.  前往 [OpenAI Platform](https://platform.openai.com) 並註冊帳號。
2.  點擊右上角個人頭像 -> **View API keys**。
3.  點擊 **Create new secret key**，複製這串 \`sk-...\` 開頭的密鑰 (遺失無法查看，需重新產生)。
4.  (重要) 前往 Billing 設定付款方式，新帳號通常有 5 美元免費額度，用完需綁卡。

## 3. 費用說明 (參考)

*   **GPT-3.5 Turbo**: 非常便宜，約 $0.50 USD / 100 萬個 Token (約 75 萬中文字)。
*   **GPT-4o**: 較貴但更聰明，約 $5.00 USD / 100 萬個 Token。
*   *價格可能變動，請以此官網為準。*

## 實作步驟

1.  **Inject**: 輸入問題 (如 "Node-RED 是什麼?")。
2.  **Function**: 設定 Header (Authorization) 與 Body (model: "gpt-3.5-turbo")。
3.  **HTTP Request**: POST 到 \`https://api.openai.com/v1/chat/completions\`。
4.  **Debug**: 查看 AI 回覆的 JSON。

`,
    solutionFlow: `[{"id":"ai_inj","type":"inject","name":"提問","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"請用像海盜一樣的口吻自我介紹","payloadType":"str","x":140,"y":1000,"wires":[["ai_func"]]},{"id":"ai_func","type":"function","name":"封裝 OpenAI 請求","func":"// 請填入您的 API Key\\nvar apiKey = \"Bearer sk-xxxxxxxx\";\\n\\nmsg.headers = {\\n    \"Content-Type\": \"application/json\",\\n    \"Authorization\": apiKey\\n};\\n\\nmsg.payload = {\\n    \"model\": \"gpt-3.5-turbo\",\\n    \"messages\": [\\n        {\"role\": \"user\", \"content\": msg.payload}\\n    ]\\n};\\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":340,"y":1000,"wires":[["ai_req"]]},{"id":"ai_req","type":"http request","name":"POST API","method":"POST","ret":"obj","paytoqs":"ignore","url":"https://api.openai.com/v1/chat/completions","tls":"","persist":false,"proxy":"","authType":"","senderr":false,"headers":[],"x":540,"y":1000,"wires":[["ai_debug"]]},{"id":"ai_debug","type":"debug","name":"AI 回覆","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload.choices[0].message.content","targetType":"msg","statusVal":"","statusType":"auto","x":740,"y":1000,"wires":[]}]`
  },
  {
    id: 'ai-2',
    title: '3-2. 電腦視覺與影像分析',
    level: 'ai',
    description: '模擬串接 Vision API，辨識圖片中的物件。',
    content: `# 讓系統「看見」世界

利用 AI 進行影像辨識。

## 1. 常用視覺 API

*   **Google Cloud Vision API**: Google 的強大視覺辨識服務。
*   **Microsoft Azure Computer Vision**: 微軟的視覺解決方案。

## 2. 如何申請 (以 Google 為例)？

1.  前往 [Google Cloud Console (GCP)](https://console.cloud.google.com)。
2.  建立一個新專案。
3.  在搜尋欄輸入 "Cloud Vision API" 並點擊 **啟用 (Enable)**。
4.  前往 **憑證 (Credentials)** -> **建立憑證** -> **API 金鑰**。
5.  複製這串 API Key。

## 3. 費用說明

*   **Google Cloud Vision**: 每月前 1,000 次呼叫免費。之後約 $1.50 USD / 1,000 次。
*   適合測試與小規模專案。

## 模擬實作

1.  **Inject**: 輸入圖片 URL。
2.  **HTTP Request**: 呼叫 Vision API。
3.  **Function**: 解析回傳的標籤 (Tags) 與信心分數 (Confidence)。`,
    solutionFlow: `[{"id":"vis_1","type":"inject","name":"圖片 URL","payload":"http://example.com/cat.jpg","x":150,"y":1100,"wires":[["vis_req"]]},{"id":"vis_req","type":"http request","name":"POST Vision API","method":"POST","url":"https://api.example.com/vision/analyze","x":350,"y":1100,"wires":[["vis_debug"]]},{"id":"vis_debug","type":"debug","name":"辨識結果","x":550,"y":1100,"wires":[]}]`
  },
  {
    id: 'ai-3',
    title: '3-3. 語音助理實作',
    level: 'ai',
    description: '模擬語音轉文字 (STT) 與意圖識別。',
    content: `# 打造語音控制介面

結合 Speech-to-Text (STT) 技術。

## 1. 語音辨識方案

*   **Web Speech API**: 瀏覽器內建，完全免費，但需在 HTTPS 環境下運作，且支援度不一。
*   **Google Cloud Speech-to-Text**: 辨識率高，支援多國語言。

## 2. 如何申請 Google STT？

1.  前往 GCP Console 啟用 **Cloud Speech-to-Text API**。
2.  建立 API Key (同視覺 API 步驟)。
3.  注意：Google STT 通常需要將音訊轉為 Base64 字串上傳。

## 3. 費用說明

*   **Web Speech API**: **免費**。
*   **Google STT**: 每月前 60 分鐘音訊處理免費。之後約 $0.006 USD / 15秒。

## 流程架構

1.  **麥克風輸入** (模擬為音訊檔)。
2.  **STT 轉換**：將音訊轉為文字指令 (如 "打開客廳電燈")。
3.  **語意分析**：解析關鍵字 ("打開", "客廳", "電燈")。
4.  **執行動作**：觸發對應的 MQTT 開關。`,
    solutionFlow: `[{"id":"stt_1","type":"inject","name":"模擬語音指令","payload":"打開客廳電燈","x":150,"y":1200,"wires":[["stt_switch"]]},{"id":"stt_switch","type":"switch","name":"意圖分析","property":"payload","rules":[{"t":"cont","v":"打開"},{"t":"cont","v":"關閉"}],"x":350,"y":1200,"wires":[["stt_on"],["stt_off"]]},{"id":"stt_on","type":"debug","name":"執行：開啟","x":550,"y":1180,"wires":[]},{"id":"stt_off","type":"debug","name":"執行：關閉","x":550,"y":1220,"wires":[]}]`
  },
  {
    id: 'ai-4',
    title: '3-4. AI 情感分析客服',
    level: 'ai',
    description: '利用 NLP 技術自動分析客戶留言情緒，進行智慧分流。',
    content: `# 智慧客服系統：情感分析

自動判讀客戶留言是「正面好評」還是「負面抱怨」，並自動通知相關部門。

## 1. 自然語言處理 (NLP) API

*   **Google Cloud Natural Language API**: 提供情感分析、實體辨識等功能。
*   **Azure Language Service**: 微軟的 NLP 解決方案。

## 2. 如何申請 (Google)？

1.  前往 GCP Console 啟用 **Cloud Natural Language API**。
2.  取得 API Key。

## 3. 費用說明

*   **Google NLP**: 每月前 5,000 單位 (Units) 免費。
*   對於一般測試與 Side Project 非常夠用。

## 實作步驟

1.  **輸入留言**：使用 \`ui_text_input\` 讓使用者輸入。
2.  **呼叫 API**：將文字傳送給 NLP 模型。
3.  **判斷分數**：
    * 分數 > 0.5 (正面)：自動回覆感謝。
    * 分數 < -0.5 (負面)：發送 LINE 通知給經理處理。
4.  **顯示結果**：在 Dashboard 顯示分析結果。`,
    solutionFlow: `[{"id":"nlp_in","type":"inject","name":"客戶留言","payload":"這產品太棒了，我很喜歡！","x":150,"y":1300,"wires":[["nlp_func"]]},{"id":"nlp_func","type":"function","name":"模擬 NLP 分析","func":"// 模擬 API 回傳\\nvar score = 0.8; // 正面\\nmsg.payload = { score: score, sentiment: 'positive' };\\nreturn msg;","x":350,"y":1300,"wires":[["nlp_switch"]]},{"id":"nlp_switch","type":"switch","name":"情緒分流","property":"payload.score","rules":[{"t":"gt","v":"0.5"},{"t":"lt","v":"-0.5"}],"x":550,"y":1300,"wires":[["nlp_pos"],["nlp_neg"]]},{"id":"nlp_pos","type":"debug","name":"回覆感謝","x":750,"y":1280,"wires":[]},{"id":"nlp_neg","type":"debug","name":"通知經理","x":750,"y":1320,"wires":[]}]`
  },
  {
    id: 'ai-5',
    title: '3-5. AI 繪圖生成器',
    level: 'ai',
    description: '串接 DALL-E 或 Stable Diffusion，透過文字描述生成圖片。',
    content: `# 文字轉圖片 (Text-to-Image)

輸入一段描述，讓 AI 自動產生對應的圖片。

## 1. 影像生成 API

*   **OpenAI DALL-E 3**: 目前主流且品質極高的生成模型。
*   **Stable Diffusion**: 開源模型，可自架 API (免費) 或使用 Stability AI (付費)。

## 2. 如何申請 (OpenAI)？

1.  與 ChatGPT 相同，使用 OpenAI Platform 帳號。
2.  確保 API Key 有效且有餘額。

## 3. 費用說明

*   **DALL-E 3 (Standard)**:
    *   1024x1024 解析度：**$0.040 USD / 張** (約台幣 1.2 元)。
    *   HD 高畫質版：**$0.080 USD / 張**。
*   **DALL-E 2**: 較便宜，約 $0.020 USD / 張。

## 實作步驟

1.  **輸入提示詞 (Prompt)**：例如 "一隻在太空騎腳踏車的貓"。
2.  **呼叫 API**：傳送 Prompt 至 DALL-E。
3.  **獲取 URL**：API 回傳圖片的網址。
4.  **顯示圖片**：使用 \`ui_template\` 將 URL 放入 \`<img src="...">\` 標籤中顯示。

`,
    solutionFlow: `[{"id":"img_in","type":"inject","name":"Prompt","payload":"A cyberpunk cat","x":150,"y":1400,"wires":[["img_req"]]},{"id":"img_req","type":"http request","name":"DALL-E API","method":"POST","url":"https://api.openai.com/v1/images/generations","x":350,"y":1400,"wires":[["img_show"]]},{"id":"img_show","type":"template","name":"顯示圖片","format":"handlebars","template":"<img src='{{payload.data[0].url}}' width='300'>","x":550,"y":1400,"wires":[]}]`
  }
];

// --- 元件：簡易 Markdown 渲染器 ---
const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.trim().split('\n');
  return (
    <div className="space-y-4 text-slate-300 leading-relaxed font-light">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('# ')) return <h1 key={index} className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mt-8 mb-4 border-b border-slate-700 pb-2">{trimmed.substring(2)}</h1>;
        if (trimmed.startsWith('## ')) return <h2 key={index} className="text-xl font-bold text-cyan-100 mt-6 mb-3 flex items-center gap-2"><CloudLightning className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {trimmed.substring(3)}</h2>;
        if (trimmed.startsWith('### ')) return <h3 key={index} className="text-lg font-bold text-white mt-4 mb-2 border-l-4 border-cyan-500 pl-2">{trimmed.substring(4)}</h3>;

        // 圖片佔位符處理 -> 升級為 MockWindow 視覺化元件
        const imgMatch = trimmed.match(/^\$/);
        if (imgMatch) {
          return (
            <div key={index} className="my-6 p-8 border-2 border-dashed border-slate-700 rounded-lg bg-slate-900/50 flex flex-col items-center justify-center text-slate-500 group hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all">
              <ImageIcon className="w-12 h-12 mb-3 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              <span className="text-sm font-mono">[ 示意圖：{imgMatch[1]} ]</span>
            </div>
          );
        }

        // 節點設定模擬視窗
        const configMatch = trimmed.match(/^\[Config: (.+)\]$/);
        if (configMatch) {
          return (
            <MockWindow key={index} title={`Edit ${configMatch[1]} node`}>
              <div className="space-y-3">
                <div className="flex gap-2 items-center"><span className="w-16 text-slate-500 text-xs">Name</span> <div className="flex-1 h-6 bg-slate-700 rounded"></div></div>
                <div className="flex gap-2 items-center"><span className="w-16 text-slate-500 text-xs">Property</span> <div className="flex-1 h-6 bg-slate-700 rounded border border-cyan-500/30"></div></div>
                <div className="h-20 bg-slate-800 rounded border border-slate-600 p-2 text-xs text-slate-500 font-mono">
                          // Configuration settings...
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <div className="w-16 h-6 bg-slate-700 rounded"></div>
                  <div className="w-16 h-6 bg-red-900 rounded text-red-200 text-center text-xs leading-6">Done</div>
                </div>
              </div>
            </MockWindow>
          );
        }

        // 簡易表格處理
        if (trimmed.startsWith('|')) {
          if (trimmed.includes('---')) return null;
          const cells = trimmed.split('|').filter(c => c.trim() !== '');
          const isHeader = index > 0 && lines[index - 1].startsWith('|') && !lines[index - 1].includes('---') && lines[index + 1]?.includes('---');
          return (
            <div key={index} className="grid grid-flow-col auto-cols-fr gap-2 border-b border-slate-700 py-2 first:border-t first:border-slate-600 hover:bg-slate-800/30">
              {cells.map((cell, i) => (
                <div key={i} className={`px-2 ${isHeader ? 'font-bold text-cyan-300' : 'text-slate-300'}`}>
                  {cell.trim().replace(/\*\*/g, '')}
                </div>
              ))}
            </div>
          );
        }

        if (trimmed.startsWith('```')) return null;
        if (trimmed.startsWith('+') || trimmed.startsWith('|') || (trimmed.startsWith('[') && trimmed.includes(']')) || trimmed.includes('-->')) return <pre key={index} className="font-mono text-cyan-300 text-xs md:text-sm bg-slate-900/50 p-2 rounded overflow-x-auto whitespace-pre border border-slate-800">{line}</pre>;
        if (trimmed.startsWith('1. ') || trimmed.startsWith('2. ') || trimmed.startsWith('3. ') || trimmed.startsWith('4. ')) return <div key={index} className="ml-4 pl-4 border-l-2 border-slate-700 py-1 hover:border-cyan-500 transition-colors">{trimmed}</div>;
        if (trimmed === '') return null;
        if (trimmed.startsWith('* ')) return <div key={index} className="ml-4 pl-4 flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0"></div><span>{trimmed.substring(2)}</span></div>
        if (trimmed.startsWith('> ')) return <div key={index} className="ml-4 pl-4 border-l-4 border-yellow-500 bg-yellow-500/10 p-2 text-yellow-200 text-sm italic">{trimmed.substring(2)}</div>;

        const parts = trimmed.split(/(\[[^\]]+\]\([^)]+\)|`[^`]+`)/g);
        return (
          <p key={index}>
            {parts.map((part, i) => {
              if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono text-sm mx-1 border border-slate-700 shadow-sm">{part.slice(1, -1)}</code>;
              }
              if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
                if (match) {
                  return <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/30 hover:decoration-cyan-400 transition-all">{match[1]}</a>;
                }
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
};

// --- Navbar ---
const Navbar: React.FC<{ currentView: ViewState; setView: (v: ViewState) => void }> = ({ currentView, setView }) => {
  const NavButton = ({ view, label, icon: Icon }: { view: ViewState, label: string, icon?: any }) => (
    <button
      onClick={() => setView(view)}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition font-medium ${currentView === view
        ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.1)]'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
        }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}</span>
    </button>
  );

  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 text-white p-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div
          className="flex items-center gap-3 cursor-pointer select-none group"
          onClick={() => setView('home')}
        >
          <div className="relative">
            <Square className="w-8 h-8 text-cyan-400 relative z-10" />
            <div className="absolute inset-0 bg-cyan-400 blur-lg opacity-50 group-hover:opacity-100 transition duration-500"></div>
          </div>
          <div className="flex flex-col md:flex-row md:items-end gap-0 md:gap-2">
            <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Node-RED <span className="text-white">LAB</span>
            </h1>
          </div>
        </div>

        <div className="flex gap-2 text-sm overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <NavButton view="foundation" label="入門學習" icon={Database} />
          <NavButton view="projects" label="專題教學" icon={MessageSquare} />
          <NavButton view="ai" label="AI智慧應用" icon={Cloud} />

          <button
            onClick={() => setView('simulator')}
            className={`flex items-center gap-1.5 ml-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-5 py-2 rounded-full hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition border border-cyan-500/30 font-bold whitespace-nowrap ${currentView === 'simulator' ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''}`}
          >
            <Play className="w-4 h-4 fill-current" /> 線上模擬
          </button>
        </div>
      </div>
    </nav>
  );
};

// --- Home ---
const Home: React.FC<{ setView: (v: ViewState) => void }> = ({ setView }) => {
  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-y-auto custom-scrollbar">
      <div className="relative flex-1 flex flex-col justify-center items-center py-20 px-8 min-h-[600px]">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 backdrop-blur-sm text-cyan-400 text-xs font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            NEXT GEN IOT LEARNING
          </div>
          <h2 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight tracking-tight">
            視覺化流程開發<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              驅動物聯網創新未來
            </span>
          </h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            告別繁瑣的代碼，擁抱高效的邏輯編排。透過沉浸式互動教學與線上模擬實驗室，從零開始建構企業級自動化解決方案。
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button onClick={() => setView('foundation')} className="group relative bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 px-10 rounded-xl text-lg transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] flex items-center justify-center gap-2">
              開始入門學習 <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => setView('simulator')} className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 backdrop-blur-md text-slate-200 font-bold py-4 px-10 rounded-xl text-lg transition-all duration-300 flex items-center justify-center gap-2">
              <Play className="w-5 h-5" /> 啟動模擬器
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 px-8 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-8 text-center flex items-center justify-center gap-2">
            <Command className="w-6 h-6 text-yellow-400" /> 常見問題 (FAQ)
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h4 className="font-bold text-cyan-400 mb-2">Q: Node-RED 需要付費嗎？</h4>
              <p className="text-slate-400 text-sm">A: 完全免費！Node-RED 是開源軟體 (Open Source)，您可以自由下載並安裝在任何電腦或伺服器上。</p>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h4 className="font-bold text-cyan-400 mb-2">Q: 沒有硬體也能學習嗎？</h4>
              <p className="text-slate-400 text-sm">A: 沒問題！本網站提供「線上模擬器」以及多個軟體模擬專題 (如 API 串接、Line Bot)，無需購買樹莓派也能學會邏輯。</p>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h4 className="font-bold text-cyan-400 mb-2">Q: 模擬器功能有限制嗎？</h4>
              <p className="text-slate-400 text-sm">A: 是的。線上模擬器主要用於練習節點邏輯與數據流向，無法真的發送 HTTP 請求到外部網站 (受限於瀏覽器安全政策)。若需完整功能，請安裝本機版 Node-RED。</p>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h4 className="font-bold text-cyan-400 mb-2">Q: 如何將練習的 Flow 匯出？</h4>
              <p className="text-slate-400 text-sm">A: 在本機版 Node-RED 中，選單 {'->'} Export {'->'} Current Flow，即可複製 JSON 代碼。這段代碼也可以貼到本網站的模擬器中使用喔！</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 py-10 text-center border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-cyan-900/20 rounded-full flex items-center justify-center mb-2 border border-cyan-500/20">
              <Cpu className="w-6 h-6 text-cyan-500" />
            </div>
            <h4 className="text-lg font-bold text-white tracking-wider">Node-RED 教學與實驗室</h4>
          </div>
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} Designed for IoT Education & Innovation.
          </p>
        </div>
      </footer>
    </div>
  );
};

// --- Tutorial ---
const Tutorial: React.FC<{ category: ViewState }> = ({ category }) => {
  // 根據分類預設選取第一個單元
  const availableTutorials = useMemo(() => {
    if (category === 'projects') {
      return TUTORIALS.filter(t => ['beginner', 'intermediate', 'advanced'].includes(t.level));
    }
    return TUTORIALS.filter(t => t.level === category);
  }, [category]);

  const [selectedTutorial, setSelectedTutorial] = useState<TutorialData>(availableTutorials[0] || TUTORIALS[0]);
  const [copied, setCopied] = useState(false);

  // 當分類改變時，重置選取的單元
  useEffect(() => {
    if (availableTutorials.length > 0) {
      setSelectedTutorial(availableTutorials[0]);
    }
  }, [category, availableTutorials]);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedTutorial.solutionFlow);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const SidebarItem = ({ t }: { t: TutorialData }) => (
    <button
      onClick={() => setSelectedTutorial(t)}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 flex items-center gap-3 transition-all duration-200 border ${selectedTutorial.id === t.id
        ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)]'
        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }`}
    >
      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${selectedTutorial.id === t.id ? 'opacity-100' : 'opacity-30'}`} />
      <span className="truncate">{t.title.split('. ')[1] || t.title}</span>
    </button>
  );

  return (
    <div className="flex h-[calc(100vh-73px)] bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 overflow-y-auto hidden md:block flex-shrink-0 custom-scrollbar">
        <div className="p-4 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <h3 className="font-bold text-slate-200 flex items-center gap-2">
            <List className="w-4 h-4 text-cyan-400" />
            {category === 'foundation' ? '入門學習目錄' : category === 'projects' ? '專題實作目錄' : 'AI 應用目錄'}
          </h3>
        </div>
        <div className="p-4">
          {category === 'foundation' && (
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase px-3 mb-2 tracking-wider text-green-400">基礎觀念</h4>
              {TUTORIALS.filter(t => t.level === 'foundation').map(t => <SidebarItem key={t.id} t={t} />)}
            </div>
          )}

          {category === 'projects' && (
            <>
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase px-3 mb-2 tracking-wider text-blue-400">初階專題</h4>
                {TUTORIALS.filter(t => t.level === 'beginner').map(t => <SidebarItem key={t.id} t={t} />)}
              </div>
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase px-3 mb-2 tracking-wider text-indigo-400">中階專題</h4>
                {TUTORIALS.filter(t => t.level === 'intermediate').map(t => <SidebarItem key={t.id} t={t} />)}
              </div>
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase px-3 mb-2 tracking-wider text-purple-400">進階專題</h4>
                {TUTORIALS.filter(t => t.level === 'advanced').map(t => <SidebarItem key={t.id} t={t} />)}
              </div>
            </>
          )}

          {category === 'ai' && (
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase px-3 mb-2 tracking-wider text-pink-400">AI 智慧應用</h4>
              {TUTORIALS.filter(t => t.level === 'ai').map(t => <SidebarItem key={t.id} t={t} />)}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-sm overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/50 relative">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Cpu className="w-32 h-32 text-white" /></div>
            <div className="flex items-center gap-2 text-sm font-bold mb-4 relative z-10">
              <span className={`px-2 py-0.5 rounded border ${selectedTutorial.level === 'foundation' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                selectedTutorial.level === 'beginner' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  selectedTutorial.level === 'intermediate' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    selectedTutorial.level === 'advanced' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      'bg-pink-500/10 text-pink-400 border-pink-500/20'
                }`}>
                {selectedTutorial.level === 'foundation' ? '入門基礎' :
                  selectedTutorial.level === 'beginner' ? '初階專題' :
                    selectedTutorial.level === 'intermediate' ? '中階專題' :
                      selectedTutorial.level === 'advanced' ? '進階專題' : 'AI 應用'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 relative z-10">{selectedTutorial.title}</h1>
            <p className="text-slate-400 text-lg relative z-10 border-l-4 border-cyan-500/50 pl-4">{selectedTutorial.description}</p>
          </div>
          <div className="p-8 min-h-[400px]">
            <div className="prose prose-invert max-w-none">
              <SimpleMarkdown content={selectedTutorial.content} />
            </div>

            {selectedTutorial.solutionFlow && selectedTutorial.solutionFlow !== '[]' && (
              <div className="mt-12 group rounded-xl overflow-hidden border border-slate-700 bg-black/40 shadow-inner">
                <div className="bg-slate-800/80 px-4 py-3 flex justify-between items-center border-b border-slate-700 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/80"></div><div className="w-3 h-3 rounded-full bg-yellow-500/80"></div><div className="w-3 h-3 rounded-full bg-green-500/80"></div></div>
                    <span className="text-slate-400 text-xs font-mono ml-2">solution.json</span>
                  </div>
                  <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 hover:bg-cyan-900/50 px-3 py-1.5 rounded-md transition border border-cyan-900">
                    {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? '已複製' : '複製代碼'}
                  </button>
                </div>
                <div className="p-4 overflow-x-auto custom-scrollbar bg-slate-950/50">
                  <code className="text-green-400 font-mono text-sm whitespace-pre-wrap break-all">
                    {selectedTutorial.solutionFlow}
                  </code>
                </div>
                <div className="bg-slate-900/50 px-4 py-2 text-slate-500 text-xs border-t border-slate-800/50 flex items-center gap-2">
                  <Command className="w-3 h-3" /> 提示：複製上方代碼，點擊模擬器右上角的 **[Import]** 按鈕匯入執行。
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Custom Node Components ---

// Explicit Tailwind class mapping to ensure JIT picks them up
const NODE_STYLES: Record<string, { bg: string, border: string, iconBg: string, handle: string }> = {
  cyan: { bg: 'bg-cyan-600', border: 'border-cyan-400', iconBg: 'bg-cyan-800', handle: '!bg-cyan-500' },
  green: { bg: 'bg-green-600', border: 'border-green-400', iconBg: 'bg-green-800', handle: '!bg-green-500' },
  yellow: { bg: 'bg-yellow-600', border: 'border-yellow-400', iconBg: 'bg-yellow-800', handle: '!bg-yellow-500' },
  blue: { bg: 'bg-blue-600', border: 'border-blue-400', iconBg: 'bg-blue-800', handle: '!bg-blue-500' },
  red: { bg: 'bg-red-600', border: 'border-red-400', iconBg: 'bg-red-800', handle: '!bg-red-500' },
  purple: { bg: 'bg-purple-600', border: 'border-purple-400', iconBg: 'bg-purple-800', handle: '!bg-purple-500' },
  slate: { bg: 'bg-slate-600', border: 'border-slate-400', iconBg: 'bg-slate-800', handle: '!bg-slate-500' },
  pink: { bg: 'bg-pink-600', border: 'border-pink-400', iconBg: 'bg-pink-800', handle: '!bg-pink-500' },
  orange: { bg: 'bg-orange-600', border: 'border-orange-400', iconBg: 'bg-orange-800', handle: '!bg-orange-500' },
};

const BaseNode = ({ label, icon: Icon, color = 'slate', isSource, isTarget, onInject, id, data }: any) => {
  const style = NODE_STYLES[color] || NODE_STYLES['slate'];

  return (
    <div className={`relative min-w-[100px] max-w-[160px] w-auto h-[30px] ${style.bg} border-2 ${style.border} rounded-md shadow-md flex items-center overflow-hidden transition-transform hover:scale-105 active:scale-95 pr-3`}>
      {/* Target Handle */}
      {isTarget && (
        <div className="absolute -left-2 flex items-center h-full z-20">
          <Handle type="target" position={Position.Left} className={`${style.handle} !w-3 !h-3 !border-2 !border-white`} />
        </div>
      )}

      {/* Icon Section */}
      {onInject ? (
        <div
          className={`h-full w-8 ${style.iconBg} flex-shrink-0 flex items-center justify-center cursor-pointer hover:brightness-110 z-10 border-r border-white/20`}
          onClick={(e) => { e.stopPropagation(); onInject(id, data); }}
          title="Click to Trigger"
        >
          <div className="w-3 h-3 bg-white rounded-sm shadow-sm animate-pulse"></div>
        </div>
      ) : (
        <div className={`h-full w-8 flex-shrink-0 flex items-center justify-center border-r border-white/20 ${style.iconBg}/50`}>
          {Icon && <Icon className="w-4 h-4 text-white" />}
        </div>
      )}

      {/* Label Section - Flexible width, no truncation, smaller font */}
      <div className="flex-1 px-2 flex items-center justify-start overflow-hidden">
        <span className="text-[9px] font-bold text-white font-mono leading-none whitespace-nowrap">
          {data.label || label}
        </span>
      </div>

      {/* Source Handle */}
      {isSource && (
        <div className="absolute -right-2 flex items-center h-full z-20">
          <Handle type="source" position={Position.Right} className={`${style.handle} !w-3 !h-3 !border-2 !border-white`} />
        </div>
      )}
    </div>
  );
};

// Common
const InjectNode = (props: any) => <BaseNode {...props} label="timestamp" color="blue" isSource={true} onInject={props.data.onInject} />;
const DebugNode = (props: any) => <BaseNode {...props} label="msg.payload" icon={Cpu} color="green" isTarget={true} />;
// Function
const FunctionNode = (props: any) => <BaseNode {...props} label="function" icon={Command} color="yellow" isSource={true} isTarget={true} />;
const DelayNode = (props: any) => <BaseNode {...props} label="delay 2s" icon={Clock} color="orange" isSource={true} isTarget={true} />;
const ChangeNode = (props: any) => <BaseNode {...props} label="change" icon={Edit3} color="yellow" isSource={true} isTarget={true} />;
const TemplateNode = (props: any) => <BaseNode {...props} label="template" icon={FileJson} color="slate" isSource={true} isTarget={true} />;
// Network
// Network
const MqttNode = (props: any) => <BaseNode {...props} label="mqtt out" icon={CloudLightning} color="red" isSource={true} isTarget={true} />;
const MqttInNode = (props: any) => <BaseNode {...props} label="mqtt in" icon={CloudLightning} color="blue" isSource={true} />;
const MqttOutNode = (props: any) => <BaseNode {...props} label="mqtt out" icon={CloudLightning} color="green" isTarget={true} />;
const HttpRequestNode = (props: any) => <BaseNode {...props} label="http req" icon={Cloud} color="slate" isSource={true} isTarget={true} />;
const HttpInNode = (props: any) => <BaseNode {...props} label="http in" icon={Server} color="slate" isSource={true} onInject={props.data.onInject} />;
const HttpResponseNode = (props: any) => <BaseNode {...props} label="http res" icon={ArrowLeftRight} color="slate" isTarget={true} />;
// Data
const CsvNode = (props: any) => <BaseNode {...props} label="csv" icon={FileJson} color="orange" isSource={true} isTarget={true} />;
const JsonNode = (props: any) => <BaseNode {...props} label="json" icon={FileJson} color="orange" isSource={true} isTarget={true} />;
// Social
const EmailNode = (props: any) => <BaseNode {...props} label="email" icon={Smartphone} color="pink" isTarget={true} />;
const LineNode = (props: any) => <BaseNode {...props} label="line bot" icon={MessageSquare} color="green" isTarget={true} />;
// AI (Updated: Pink/Purple mix)
const ChatGPTNode = (props: any) => <BaseNode {...props} label="chatgpt" icon={Bot} color="pink" isSource={true} isTarget={true} />;
const VisionNode = (props: any) => <BaseNode {...props} label="vision ai" icon={Eye} color="pink" isSource={true} isTarget={true} />;
const SttNode = (props: any) => <BaseNode {...props} label="voice stt" icon={Mic} color="pink" isSource={true} isTarget={true} />;
const SentimentNode = (props: any) => <BaseNode {...props} label="sentiment" icon={Smile} color="pink" isSource={true} isTarget={true} />;
const DalleNode = (props: any) => <BaseNode {...props} label="dall-e" icon={Image} color="pink" isSource={true} isTarget={true} />;

// Dashboard (Updated: Cyan/Blue)
const UiButtonNode = (props: any) => <BaseNode {...props} label="button" icon={MousePointer2} color="cyan" isSource={true} onInject={props.data.onInject} />;
const UiTextNode = (props: any) => <BaseNode {...props} label="text" icon={Type} color="cyan" isTarget={true} />;
const UiGaugeNode = (props: any) => <BaseNode {...props} label="gauge" icon={Gauge} color="cyan" isTarget={true} />;
const UiSwitchNode = (props: any) => <BaseNode {...props} label="switch" icon={ToggleLeft} color="cyan" isSource={true} onInject={props.data.onInject} />;
const UiSliderNode = (props: any) => <BaseNode {...props} label="slider" icon={SlidersHorizontal} color="cyan" isSource={true} onInject={props.data.onInject} />;
const UiDropdownNode = (props: any) => <BaseNode {...props} label="dropdown" icon={ChevronDown} color="cyan" isSource={true} onInject={props.data.onInject} />;
const UiInputNode = (props: any) => <BaseNode {...props} label="text input" icon={FormInput} color="cyan" isSource={true} onInject={props.data.onInject} />;
const UiChartNode = (props: any) => <BaseNode {...props} label="chart" icon={PieChart} color="cyan" isTarget={true} />;

// Special Switch Node (Standardized)
const SwitchNode = ({ data, id }: any) => {
  const style = NODE_STYLES['purple'];
  return (
    <div className={`relative min-w-[100px] max-w-[160px] w-auto h-[30px] ${style.bg} border-2 ${style.border} rounded-md shadow-md flex items-center overflow-hidden transition-transform hover:scale-105 active:scale-95 pr-3`}>
      {/* Target (Left) */}
      <div className="absolute -left-2 flex items-center h-full z-20">
        <Handle type="target" position={Position.Left} className={`${style.handle} !w-3 !h-3 !border-2 !border-white`} />
      </div>

      {/* Icon */}
      <div className={`h-full w-8 flex-shrink-0 flex items-center justify-center border-r border-white/20 ${style.iconBg}/50`}>
        <GitBranch className="w-4 h-4 text-white" />
      </div>

      {/* Label */}
      <div className="flex-1 px-2 flex items-center justify-start overflow-hidden">
        <span className="text-[9px] font-bold text-white font-mono leading-none whitespace-nowrap">
          {data.label || 'switch'}
        </span>
      </div>

      {/* Source Handles (Right) */}
      <div className="absolute -right-2 flex flex-col justify-center h-full z-20 -space-y-1">
        <div className="relative w-3 h-3 flex items-center">
          <Handle type="source" position={Position.Right} id="out-1" className={`${style.handle} !w-2.5 !h-2.5 !border-2 !border-white !relative !right-0`} title="True" />
        </div>
        <div className="relative w-3 h-3 flex items-center">
          <Handle type="source" position={Position.Right} id="out-2" className={`${NODE_STYLES['slate'].handle} !w-2.5 !h-2.5 !border-2 !border-white !relative !right-0`} title="False" />
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  inject: InjectNode,
  debug: DebugNode,
  function: FunctionNode,
  switch: SwitchNode,
  delay: DelayNode,
  change: ChangeNode,
  template: TemplateNode,
  mqtt: MqttNode,
  http_req: HttpRequestNode,
  http_in: HttpInNode,
  http_res: HttpResponseNode,
  csv: CsvNode,
  json: JsonNode,
  email: EmailNode,
  line: LineNode,
  chatgpt: ChatGPTNode,
  vision: VisionNode,
  stt: SttNode,
  sentiment: SentimentNode,
  dalle: DalleNode,
  ui_button: UiButtonNode,
  ui_text: UiTextNode,
  ui_gauge: UiGaugeNode,
  ui_switch: UiSwitchNode,
  ui_slider: UiSliderNode,
  ui_dropdown: UiDropdownNode,
  ui_text_input: UiInputNode,
  ui_chart: UiChartNode,
  // Aliases for Import
  "mqtt in": MqttInNode,
  "mqtt out": MqttOutNode,
  "http request": HttpRequestNode,
};


// --- RealSimulatorCanvas ---
const RealSimulatorCanvas = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [tab, setTab] = useState<'debug' | 'props'>('debug');
  // Import Feature State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const { screenToFlowPosition } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true, style: { stroke: '#06b6d4', strokeWidth: 2 } }, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Engine logic ref to avoid stale state in callbacks
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => { nodesRef.current = nodes; edgesRef.current = edges; }, [nodes, edges]);

  // Helper: Update Node Data
  const updateNodeData = (id: string, newData: any) => {
    setNodes((nds) => nds.map((n) => {
      if (n.id === id) {
        const updatedNode = { ...n, data: { ...n.data, ...newData } };
        if (selectedNode?.id === id) setSelectedNode(updatedNode); // Keep selected node in sync
        return updatedNode;
      }
      return n;
    }));
  };

  const executeFlow = useCallback((startNodeId: string, manualPayload?: any) => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    const startNode = currentNodes.find(n => n.id === startNodeId);
    if (!startNode) return;

    // Initialize Payload
    let initialMsg = {
      payload: manualPayload !== undefined ? manualPayload : Date.now(),
      topic: startNode.data.topic || "",
      _msgid: Math.random().toString(36).substr(2, 9)
    };

    // Node-specific initialization override
    const type = startNode.type;
    if (type === 'inject') {
      const pType = startNode.data['payload type'];
      const pVal = startNode.data['payload'];
      if (pVal !== undefined && pVal !== "") {
        initialMsg.payload = pVal;
        // Simple type conversion (mock)
        if (pVal === 'true') initialMsg.payload = true;
        if (pVal === 'false') initialMsg.payload = false;
        if (!isNaN(parseFloat(pVal)) && isFinite(pVal)) initialMsg.payload = parseFloat(pVal);
      }
    }
    else if (type === 'ui_button') {
      initialMsg.payload = startNode.data.payload || "按鈕已點擊";
    }
    else if (type === 'ui_switch') initialMsg.payload = true;
    else if (type === 'ui_slider') initialMsg.payload = 50;
    else if (type === 'ui_text_input') initialMsg.payload = "使用者輸入";


    const traverse = (currentNodeId: string, currentMsg: any) => {
      const outgoingEdges = currentEdges.filter(e => e.source === currentNodeId);

      outgoingEdges.forEach(edge => {
        const targetNode = currentNodes.find(n => n.id === edge.target);
        if (!targetNode) return;

        // Deep copy msg to prevent pollution between branches
        let nextMsg = JSON.parse(JSON.stringify(currentMsg));
        let shouldContinue = true;
        let delayTime = 100; // default tiny delay for visualization

        try {
          switch (targetNode.type) {
            case 'debug':
              setLogs(prev => [{
                id: Date.now().toString() + Math.random(),
                timestamp: new Date().toLocaleTimeString(),
                nodeName: targetNode.data.label || 'debug',
                payload: typeof nextMsg.payload === 'object' ? JSON.stringify(nextMsg.payload, null, 2) : String(nextMsg.payload)
              }, ...prev]);
              shouldContinue = false;
              break;

            case 'function':
              const userCode = targetNode.data.code;
              if (userCode) {
                try {
                  // Safe-ish eval: create a function with 'msg' argument
                  const func = new Function('msg', userCode + "\nreturn msg;");
                  const result = func(nextMsg);
                  if (result) nextMsg = result;
                  else shouldContinue = false; // if returns null
                } catch (err: any) {
                  setLogs(prev => [{ id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), nodeName: '函式錯誤', payload: err.message }, ...prev]);
                  shouldContinue = false;
                }
              } else {
                // Default behavior if no code
                nextMsg.payload = `${nextMsg.payload} [Processed]`;
              }
              break;

            case 'switch':
              // Dynamic Rule Check
              const prop = targetNode.data.property || "payload";
              const valToCheck = nextMsg[prop] !== undefined ? nextMsg[prop] : nextMsg.payload;

              // We support 2 rules in UI: Rule 1 -> out-1, Rule 2 -> out-2
              // Simple parser: "== val", "> val", "< val", "else"
              const checkRule = (ruleStr: string, val: any) => {
                if (!ruleStr || ruleStr === 'else') return true;

                let op, ruleValRaw;
                if (ruleStr.startsWith('==')) { op = '=='; ruleValRaw = ruleStr.substring(2); }
                else if (ruleStr.startsWith('!=')) { op = '!='; ruleValRaw = ruleStr.substring(2); }
                else if (ruleStr.startsWith('>=')) { op = '>='; ruleValRaw = ruleStr.substring(2); }
                else if (ruleStr.startsWith('<=')) { op = '<='; ruleValRaw = ruleStr.substring(2); }
                else if (ruleStr.startsWith('>')) { op = '>'; ruleValRaw = ruleStr.substring(1); }
                else if (ruleStr.startsWith('<')) { op = '<'; ruleValRaw = ruleStr.substring(1); }
                else { op = '=='; ruleValRaw = ruleStr; } // Default to equality if no op

                const ruleValClean = ruleValRaw.trim();
                const ruleVal = isNaN(parseFloat(ruleValClean)) ? ruleValClean : parseFloat(ruleValClean);

                if (op === '==') return val == ruleVal;
                if (op === '!=') return val != ruleVal;
                if (op === '>') return val > ruleVal;
                if (op === '<') return val < ruleVal;
                if (op === '>=') return val >= ruleVal;
                if (op === '<=') return val <= ruleVal;
                return false;
              };

              const rule1 = targetNode.data.rule_1 || targetNode.data['rule 1'];
              const rule2 = targetNode.data.rule_2 || targetNode.data['rule 2'];

              let match1 = false;
              let match2 = false;

              // If rules are empty, maybe default to pass everything on port 1?
              // Logic: if connected to out-1, apply rule 1.
              if (edge.sourceHandle === 'out-1') {
                if (rule1) match1 = checkRule(rule1, valToCheck);
                else match1 = true; // Default true if no rule? Or false? Usually switch blocks unless rule matches.
                if (!match1) shouldContinue = false;
              }
              if (edge.sourceHandle === 'out-2') {
                if (rule2) match2 = checkRule(rule2, valToCheck);
                else match2 = rule1 ? true : false; // 'else' logic usually.
                if (!match2) shouldContinue = false;
              }

              break;

            case 'change':
              const setProp = targetNode.data.set || "payload";
              const toVal = targetNode.data.to || "changed_value";
              nextMsg[setProp] = toVal;
              break;

            case 'delay':
              const dVal = parseFloat(targetNode.data.delay) || 2;
              delayTime = dVal * 1000;
              break;

            case 'template':
              let tmpl = targetNode.data.template || "<h1>{{payload}}</h1>";
              // Simple Mustache
              tmpl = tmpl.replace(/{{payload}}/g, nextMsg.payload);
              nextMsg.payload = tmpl;
              break;

            // --- Network Mocks ---
            case 'mqtt':
              const topic = targetNode.data.topic || "test/topic";
              setLogs(prev => [{ id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), nodeName: `MQTT Out [${topic}]`, payload: String(nextMsg.payload) }, ...prev]);

              const mqttInNodes = currentNodes.filter(n => n.type === 'mqtt' && n.data?.topic === topic && n.id !== targetNode.id);
              mqttInNodes.forEach(n => {
                setTimeout(() => executeFlow(n.id, nextMsg.payload), 100);
              });
              break;

            case 'http_req':
              nextMsg.payload = { status: 200, data: `Mock Response from ${targetNode.data.url || 'URL'}` };
              break;

            case 'http_res':
              setLogs(prev => [{ id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), nodeName: 'HTTP Response', payload: `Replied: 200 OK` }, ...prev]);
              shouldContinue = false;
              break;

            // --- AI Mocks ---
            case 'chatgpt':
              delayTime = 1000;
              const key = targetNode.data['api key'];
              if (!key) nextMsg.payload = "Error: Please set API Key";
              else nextMsg.payload = "AI: 我收到了 " + JSON.stringify(nextMsg.payload);
              break;

            // ... Keep other mocks simple for now ...
            case 'ui_text':
            case 'ui_gauge':
            case 'ui_chart':
              setLogs(prev => [{ id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), nodeName: 'Dashboard', payload: `Rendered: ${nextMsg.payload}` }, ...prev]);
              shouldContinue = false;
              break;
          }
        } catch (e: any) {
          console.error(e);
          shouldContinue = false;
        }

        if (shouldContinue) {
          setTimeout(() => traverse(targetNode.id, nextMsg), delayTime);
        }
      });
    };
    traverse(startNodeId, initialMsg);
  }, []);

  const runFlowEngine = (id: string, data: any) => executeFlow(id);

  // Handle Import JSON
  const handleImport = () => {
    try {
      const flows = JSON.parse(importJson);
      if (!Array.isArray(flows)) throw new Error('Invalid Node-RED Flow');

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      flows.forEach((n: any) => {
        if (!n.type || n.type === 'tab' || n.type === 'mqtt-broker' || n.type === 'ui_group' || n.type === 'ui_tab' || n.type === 'ui_base') return; // Skip config nodes

        // Map Node-RED type to React Flow type if needed
        let type = n.type;
        if (type === 'function') type = 'function'; // Ensure consistency

        // Create Node
        const newNode: Node = {
          id: n.id,
          type: type, // Ensure this type exists in nodeTypes
          position: { x: parseFloat(n.x) || 0, y: parseFloat(n.y) || 0 },
          data: {
            // @ts-ignore
            img: NODE_STYLES[type]?.img || '',
            ...n
          }
        };
        newNodes.push(newNode);

        // Create Edges (Wires)
        if (n.wires && Array.isArray(n.wires)) {
          n.wires.forEach((wireGroup: string[], outputIndex: number) => {
            wireGroup.forEach((targetId: string) => {
              newEdges.push({
                id: `e-${n.id}-${targetId}-${outputIndex}`,
                source: n.id,
                target: targetId,
              });
            });
          });
        }
      });

      setNodes(newNodes);
      setEdges(newEdges);
      setIsImportModalOpen(false);
      setImportJson('');
      setLogs(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        nodeName: 'System',
        payload: `Successfully imported ${newNodes.length} nodes.`
      }]);

    } catch (e) {
      alert('匯入失敗：請檢查 JSON 格式是否正確。');
    }
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      setNodes((nds) => {
        const typeCount = nds.filter(n => n.type === type).length + 1;
        const rawTitle = NODE_CONFIGS[type]?.title || type;
        // Fix: Use full title instead of only first word
        const label = `${rawTitle} ${typeCount}`;

        const newNode: Node = {
          id: `${type}-${Date.now()}`,
          type,
          position,
          data: { label: label, onInject: runFlowEngine },
        };
        return nds.concat(newNode);
      });
    },
    [screenToFlowPosition, setNodes, runFlowEngine],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setTab('props');
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);


  const clearCanvas = () => { setNodes([]); setEdges([]); setLogs([]); };

  return (
    <div className="flex h-full flex-1 min-w-0">
      <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-slate-950"
        >
          <Background color="#334155" gap={20} />
          <Controls className="bg-slate-800 border-slate-700 text-slate-200" />
          <MiniMap className="bg-slate-800 border-slate-700" nodeColor="#06b6d4" />
        </ReactFlow>
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-1 bg-cyan-900/80 hover:bg-cyan-800 text-white px-3 py-1.5 rounded-md text-xs backdrop-blur-sm border border-cyan-700 transition">
            <Upload className="w-3 h-3" /> Import
          </button>
          <button onClick={clearCanvas} className="flex items-center gap-1 bg-red-900/80 hover:bg-red-800 text-white px-3 py-1.5 rounded-md text-xs backdrop-blur-sm border border-red-700 transition">
            <Trash2 className="w-3 h-3" /> 清空畫布
          </button>
        </div>
      </div>
      <div className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col z-10 shadow-xl">
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setTab('debug')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 ${tab === 'debug' ? 'text-green-400 bg-slate-800 border-b-2 border-green-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Settings className="w-3 h-3" /> Debug
          </button>
          <button
            onClick={() => setTab('props')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 ${tab === 'props' ? 'text-cyan-400 bg-slate-800 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <List className="w-3 h-3" /> Properties
          </button>
        </div>

        <div className="flex-1 p-2 overflow-y-auto custom-scrollbar bg-slate-900">
          {tab === 'debug' ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2 pb-2 border-b border-slate-800 mb-2">
                <span className="text-[10px] text-slate-400">Debug Messages</span>
                <button onClick={() => setLogs([])} className="text-[10px] text-slate-500 hover:text-white">Clear</button>
              </div>
              {logs.length === 0 && <div className="text-center text-slate-600 text-xs italic mt-10">暫無訊息</div>}
              {logs.map((log) => (
                <div key={log.id} className="bg-slate-800 border-l-2 border-green-500 p-2 rounded shadow-sm text-xs font-mono animate-in slide-in-from-right-2 duration-300">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>{log.timestamp}</span>
                    <span className="text-green-400/70">{log.nodeName}</span>
                  </div>
                  <div className="text-slate-200 break-all">{log.payload}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 p-2">
              {!selectedNode ? (
                <div className="text-center text-slate-600 text-xs italic mt-10">
                  請點擊畫布上的節點<br />以檢視或編輯屬性
                </div>
              ) : (
                <>
                  <div className="border-b border-slate-800 pb-2 mb-2">
                    <div className="text-xs text-cyan-500 font-bold uppercase mb-1">Node Type</div>
                    <div className="text-lg text-white font-mono">{selectedNode.data.label || selectedNode.type}</div>
                    <div className="text-xs text-slate-500">ID: {selectedNode.id}</div>
                  </div>

                  {NODE_CONFIGS[selectedNode.type] ? (
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-cyan-400" /> {NODE_CONFIGS[selectedNode.type].title}
                      </h4>
                      {NODE_CONFIGS[selectedNode.type].fields.map((field, idx) => {
                        const key = field.label.toLowerCase();
                        return (
                          <div key={idx}>
                            <label className="block text-[10px] text-slate-400 uppercase mb-1">{field.label}</label>
                            {field.type === 'select' ? (
                              <select
                                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs p-2 rounded focus:border-cyan-500 outline-none"
                                value={selectedNode.data[key] || ''}
                                onChange={(e) => updateNodeData(selectedNode.id, { [key]: e.target.value })}
                              >
                                <option value="">Select...</option>
                                {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            ) : field.type === 'textarea' ? (
                              <textarea
                                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs p-2 rounded focus:border-cyan-500 outline-none h-24 font-mono"
                                placeholder={field.placeholder}
                                value={selectedNode.data[key] || ''}
                                onChange={(e) => updateNodeData(selectedNode.id, { [key]: e.target.value })}
                              ></textarea>
                            ) : (
                              <input
                                type={field.type}
                                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs p-2 rounded focus:border-cyan-500 outline-none"
                                placeholder={field.placeholder}
                                value={selectedNode.data[key] || ''}
                                onChange={(e) => updateNodeData(selectedNode.id, { [key]: e.target.value })}
                              />
                            )}
                          </div>
                        )
                      })}
                      {/* Name field as a common override */}
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-1">Node Name</label>
                        <input
                          type="text"
                          className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs p-2 rounded focus:border-cyan-500 outline-none"
                          placeholder="自定義名稱"
                          value={selectedNode.data.label || ''}
                          onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-xs">此節點暫無詳細設定選項 (模擬模式)</div>
                  )}

                  <button
                    onClick={() => {
                      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
                      setSelectedNode(null);
                    }}
                    className="w-full bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-700 py-2 rounded text-xs font-bold mt-8 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> 刪除此節點
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg shadow-2xl w-[500px] max-w-full">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4" /> Import Flow JSON
            </h3>
            <p className="text-xs text-slate-400 mb-2">請將 Node-RED 流程代碼 (JSON) 貼上至此處：</p>
            <textarea
              className="w-full h-64 bg-slate-900 text-slate-300 text-xs font-mono p-2 rounded border border-slate-700 outline-none focus:border-cyan-500 mb-4"
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              placeholder='[{"id":"...", "type":"...", ...}]'
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded transition shadow-lg shadow-cyan-900/20"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 元件：預覽用模擬器 (PreviewSimulatorCanvas) ---
const PreviewSimulatorCanvas = () => {
  const [showCodeHint, setShowCodeHint] = useState(false);

  return (
    <div className="flex h-full items-center justify-center bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}>
      </div>

      <div className="z-10 text-center max-w-md p-8 bg-slate-900/80 border border-slate-700 rounded-2xl backdrop-blur-md shadow-2xl">
        <div className="w-16 h-16 bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-cyan-500/30">
          <AlertTriangle className="w-8 h-8 text-cyan-400 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">本機開發模式</h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          為了在瀏覽器中提供最佳效能，線上預覽已暫時停用 React Flow 引擎。請在您的 VS Code 中執行以下步驟以啟用完整功能：
        </p>
        <div className="bg-black/50 p-4 rounded-lg text-left text-xs font-mono text-green-400 mb-6 border border-slate-800">
          <p className="text-slate-500 mb-2"># 1. 安裝套件</p>
          <p className="mb-4">npm install @xyflow/react</p>
          <p className="text-slate-500 mb-2"># 2. 解除 App.tsx 中的註解</p>
          <p>請參閱程式碼上方的說明區塊。</p>
        </div>
        <button
          onClick={() => setShowCodeHint(true)}
          className="text-cyan-400 text-sm font-bold hover:text-cyan-300 flex items-center gap-1 mx-auto"
        >
          查看詳細教學 <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {showCodeHint && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900">
              <h4 className="font-bold text-white flex items-center gap-2"><Code2 className="w-4 h-4 text-cyan-400" /> 如何啟用完整模擬器</h4>
              <button onClick={() => setShowCodeHint(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 overflow-y-auto bg-black/50 font-mono text-xs text-slate-300 leading-relaxed">
              <p className="text-slate-500 mb-2">// 1. 解除頂部的 Import 註解</p>
              <pre className="text-green-400 mb-4 bg-slate-800/50 p-2 rounded">
                {`import { 
  ReactFlow, 
  Background, 
  // ... 其他元件
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';`}
              </pre>

              <p className="text-slate-500 mb-2">// 2. 在 Simulator 元件中解除 Provider 註解，並切換 Canvas 元件</p>
              <pre className="text-green-400 mb-4 bg-slate-800/50 p-2 rounded">
                {`const Simulator = () => {
  return (
    <ReactFlowProvider>  // 解除這裡
       <div className="...">
         ...
         {/* 3. 切換為正式版 Canvas */}
         {/* <PreviewSimulatorCanvas />  <-- 移除或註解這個 */}
         <RealSimulatorCanvas />      {/* <-- 啟用這個 */}
       </div>
    </ReactFlowProvider> // 解除這裡
  );
};`}
              </pre>
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-900 text-right">
              <button onClick={() => setShowCodeHint(false)} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm font-bold">我知道了</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 元件：模擬器頁面 (Simulator) ---
const Simulator: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <ReactFlowProvider>
      <div className="flex h-[calc(100vh-69px)] bg-slate-950 text-slate-200 relative">
        <div className="w-48 bg-slate-900 border-r border-slate-800 p-4 flex flex-col z-10 shadow-xl overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider flex items-center gap-2">
              <Box className="w-3 h-3" /> Palette
            </h3>
            <button onClick={() => setShowHelp(true)} className="text-cyan-400 hover:text-white" title="使用說明">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Common */}
            <div>
              <div className="text-[10px] font-bold text-cyan-500 mb-2 uppercase tracking-wide">Common</div>
              <div className="space-y-2">
                <div className="bg-slate-800 p-2 rounded border border-cyan-900/50 text-sm text-center cursor-grab hover:border-cyan-500 hover:text-cyan-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'inject')} draggable><div className="w-2 h-2 bg-cyan-500 rounded-full"></div> Inject (注入)</div>
                <div className="bg-slate-800 p-2 rounded border border-green-900/50 text-sm text-center cursor-grab hover:border-green-500 hover:text-green-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'debug')} draggable><div className="w-2 h-2 bg-green-500 rounded-full"></div> Debug (除錯)</div>
              </div>
            </div>

            {/* Function */}
            <div>
              <div className="text-[10px] font-bold text-yellow-500 mb-2 uppercase tracking-wide">Function</div>
              <div className="space-y-2">
                <div className="bg-slate-800 p-2 rounded border border-yellow-900/50 text-sm text-center cursor-grab hover:border-yellow-500 hover:text-yellow-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'function')} draggable><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Function (處理)</div>
                <div className="bg-slate-800 p-2 rounded border border-purple-900/50 text-sm text-center cursor-grab hover:border-purple-500 hover:text-purple-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'switch')} draggable><div className="w-2 h-2 bg-purple-500 rounded-full"></div> Switch (判斷)</div>
                <div className="bg-slate-800 p-2 rounded border border-yellow-900/50 text-sm text-center cursor-grab hover:border-yellow-500 hover:text-yellow-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'change')} draggable><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Change (改變)</div>
                <div className="bg-slate-800 p-2 rounded border border-yellow-900/50 text-sm text-center cursor-grab hover:border-yellow-500 hover:text-yellow-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'delay')} draggable><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Delay (延遲)</div>
              </div>
            </div>

            {/* Network */}
            <div>
              <div className="text-[10px] font-bold text-blue-500 mb-2 uppercase tracking-wide">Network</div>
              <div className="space-y-2">
                <div className="bg-slate-800 p-2 rounded border border-blue-900/50 text-sm text-center cursor-grab hover:border-blue-500 hover:text-blue-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'mqtt')} draggable><div className="w-2 h-2 bg-blue-500 rounded-full"></div> MQTT In/Out</div>
                <div className="bg-slate-800 p-2 rounded border border-indigo-900/50 text-sm text-center cursor-grab hover:border-indigo-500 hover:text-indigo-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'http_req')} draggable><div className="w-2 h-2 bg-indigo-500 rounded-full"></div> HTTP Request</div>
                <div className="bg-slate-800 p-2 rounded border border-indigo-900/50 text-sm text-center cursor-grab hover:border-indigo-500 hover:text-indigo-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'http_in')} draggable><div className="w-2 h-2 bg-indigo-500 rounded-full"></div> HTTP In</div>
                <div className="bg-slate-800 p-2 rounded border border-indigo-900/50 text-sm text-center cursor-grab hover:border-indigo-500 hover:text-indigo-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'http_res')} draggable><div className="w-2 h-2 bg-indigo-500 rounded-full"></div> HTTP Response</div>
              </div>
            </div>

            {/* Data & Social */}
            <div>
              <div className="text-[10px] font-bold text-orange-500 mb-2 uppercase tracking-wide">Data & Social</div>
              <div className="space-y-2">
                <div className="bg-slate-800 p-2 rounded border border-orange-900/50 text-sm text-center cursor-grab hover:border-orange-500 hover:text-orange-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'csv')} draggable><div className="w-2 h-2 bg-orange-500 rounded-full"></div> CSV</div>
                <div className="bg-slate-800 p-2 rounded border border-orange-900/50 text-sm text-center cursor-grab hover:border-orange-500 hover:text-orange-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'json')} draggable><div className="w-2 h-2 bg-orange-500 rounded-full"></div> JSON</div>
                <div className="bg-slate-800 p-2 rounded border border-pink-900/50 text-sm text-center cursor-grab hover:border-pink-500 hover:text-pink-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'template')} draggable><div className="w-2 h-2 bg-pink-500 rounded-full"></div> Template</div>
                <div className="bg-slate-800 p-2 rounded border border-red-900/50 text-sm text-center cursor-grab hover:border-red-500 hover:text-red-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'email')} draggable><div className="w-2 h-2 bg-red-500 rounded-full"></div> Email</div>
                <div className="bg-slate-800 p-2 rounded border border-green-900/50 text-sm text-center cursor-grab hover:border-green-500 hover:text-green-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'line')} draggable><div className="w-2 h-2 bg-green-500 rounded-full"></div> LINE Bot</div>
              </div>
            </div>

            {/* AI Intelligence */}
            <div>
              <div className="text-[10px] font-bold text-purple-500 mb-2 uppercase tracking-wide">AI Intelligence</div>
              <div className="space-y-2">
                <div className="bg-slate-800 p-2 rounded border border-purple-900/50 text-sm text-center cursor-grab hover:border-purple-500 hover:text-purple-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'chatgpt')} draggable><div className="w-2 h-2 bg-purple-500 rounded-full"></div> ChatGPT</div>
                <div className="bg-slate-800 p-2 rounded border border-purple-900/50 text-sm text-center cursor-grab hover:border-purple-500 hover:text-purple-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'vision')} draggable><div className="w-2 h-2 bg-purple-500 rounded-full"></div> Vision AI</div>
                <div className="bg-slate-800 p-2 rounded border border-purple-900/50 text-sm text-center cursor-grab hover:border-purple-500 hover:text-purple-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'stt')} draggable><div className="w-2 h-2 bg-purple-500 rounded-full"></div> Voice STT</div>
                <div className="bg-slate-800 p-2 rounded border border-purple-900/50 text-sm text-center cursor-grab hover:border-purple-500 hover:text-purple-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'sentiment')} draggable><div className="w-2 h-2 bg-purple-500 rounded-full"></div> Sentiment</div>
                <div className="bg-slate-800 p-2 rounded border border-purple-900/50 text-sm text-center cursor-grab hover:border-purple-500 hover:text-purple-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'dalle')} draggable><div className="w-2 h-2 bg-purple-500 rounded-full"></div> DALL-E</div>
              </div>
            </div>

            {/* Dashboard */}
            <div>
              <div className="text-[10px] font-bold text-cyan-500 mb-2 uppercase tracking-wide">Dashboard</div>
              <div className="space-y-2">
                <div className="bg-slate-800 p-2 rounded border border-cyan-900/50 text-sm text-center cursor-grab hover:border-cyan-500 hover:text-cyan-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'ui_button')} draggable><div className="w-2 h-2 bg-cyan-500 rounded-full"></div> UI Button (按鈕)</div>
                <div className="bg-slate-800 p-2 rounded border border-cyan-900/50 text-sm text-center cursor-grab hover:border-cyan-500 hover:text-cyan-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'ui_switch')} draggable><div className="w-2 h-2 bg-cyan-500 rounded-full"></div> UI Switch (開關)</div>
                <div className="bg-slate-800 p-2 rounded border border-cyan-900/50 text-sm text-center cursor-grab hover:border-cyan-500 hover:text-cyan-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'ui_slider')} draggable><div className="w-2 h-2 bg-cyan-500 rounded-full"></div> UI Slider (滑桿)</div>
                <div className="bg-slate-800 p-2 rounded border border-cyan-900/50 text-sm text-center cursor-grab hover:border-cyan-500 hover:text-cyan-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'ui_dropdown')} draggable><div className="w-2 h-2 bg-cyan-500 rounded-full"></div> UI Dropdown (選單)</div>
                <div className="bg-slate-800 p-2 rounded border border-cyan-900/50 text-sm text-center cursor-grab hover:border-cyan-500 hover:text-cyan-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'ui_text_input')} draggable><div className="w-2 h-2 bg-cyan-500 rounded-full"></div> UI Input (輸入)</div>
                <div className="bg-slate-800 p-2 rounded border border-cyan-900/50 text-sm text-center cursor-grab hover:border-cyan-500 hover:text-cyan-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'ui_text')} draggable><div className="w-2 h-2 bg-cyan-500 rounded-full"></div> UI Text (顯示)</div>
                <div className="bg-slate-800 p-2 rounded border border-cyan-900/50 text-sm text-center cursor-grab hover:border-cyan-500 hover:text-cyan-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'ui_gauge')} draggable><div className="w-2 h-2 bg-cyan-500 rounded-full"></div> UI Gauge (儀表)</div>
                <div className="bg-slate-800 p-2 rounded border border-cyan-900/50 text-sm text-center cursor-grab hover:border-cyan-500 hover:text-cyan-400 transition-all shadow-sm select-none flex items-center gap-2" onDragStart={(e) => onDragStart(e, 'ui_chart')} draggable><div className="w-2 h-2 bg-cyan-500 rounded-full"></div> UI Chart (圖表)</div>
              </div>
            </div>
          </div>
        </div>

        {showHelp && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-400" /> 模擬器操作指南</h3>
                <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-700 rounded"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 overflow-y-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-cyan-400 font-bold mb-4 flex items-center gap-2"><MousePointer2 className="w-4 h-4" /> 基礎操作</h4>
                    <ul className="space-y-3 text-sm text-slate-300">
                      <li className="flex gap-3"><span className="bg-slate-800 px-2 rounded text-white font-mono">1</span> 從左側面板拖曳 (Drag) 節點至中央畫布。</li>
                      <li className="flex gap-3"><span className="bg-slate-800 px-2 rounded text-white font-mono">2</span> 點擊節點端口並拖曳連線 (Connect)。</li>
                      <li className="flex gap-3"><span className="bg-slate-800 px-2 rounded text-white font-mono">3</span> 點擊 <span className="text-cyan-400 font-bold">Inject</span> 或 <span className="text-blue-400 font-bold">Button</span> 節點左側按鈕觸發流程。</li>
                      <li className="flex gap-3"><span className="bg-slate-800 px-2 rounded text-white font-mono">4</span> 觀察右側 Debug 視窗的輸出結果。</li>
                    </ul>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <h4 className="text-green-400 font-bold mb-2 text-sm">💡 範例：Delay 延遲</h4>
                    <p className="text-xs text-slate-500 mb-2">試著串接 Inject {'->'} Delay {'->'} Debug，觀察時間差。</p>
                    <div className="flex items-center gap-2 justify-center py-4 text-xs font-mono text-slate-400">
                      <div className="border border-cyan-500/50 px-2 py-1 rounded bg-slate-800 text-cyan-300">Inject</div>
                      <ArrowRight className="w-4 h-4 text-slate-600" />
                      <div className="border border-yellow-500/50 px-2 py-1 rounded bg-slate-800 text-yellow-300">Delay</div>
                      <ArrowRight className="w-4 h-4 text-slate-600" />
                      <div className="border border-green-500/50 px-2 py-1 rounded bg-slate-800 text-green-300">Debug</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-800 bg-slate-900 text-center">
                <button onClick={() => setShowHelp(false)} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition transform hover:scale-105">開始模擬</button>
              </div>
            </div>
          </div>
        )}

        {/* 本機開發：請替換為 <RealSimulatorCanvas /> */}
        <RealSimulatorCanvas />
        {/* <RealSimulatorCanvas /> */}
      </div>
    </ReactFlowProvider>
  );
};

// --- 主程式 (App) ---
function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  return (
    <div className="h-screen flex flex-col font-sans bg-slate-950 text-slate-200 selection:bg-cyan-500/30 overflow-hidden">
      <Navbar currentView={currentView} setView={setCurrentView} />
      <main className="flex-1 relative overflow-hidden flex flex-col min-h-0">
        {currentView === 'home' && <Home setView={setCurrentView} />}
        {currentView === 'foundation' && <Tutorial category="foundation" />}
        {currentView === 'projects' && <Tutorial category="projects" />}
        {currentView === 'ai' && <Tutorial category="ai" />}
        {currentView === 'simulator' && <Simulator />}
      </main>
    </div>
  );
}


export default App;