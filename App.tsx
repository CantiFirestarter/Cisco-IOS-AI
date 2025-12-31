
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getCiscoCommandInfo, getDynamicSuggestions } from './services/geminiService';
import ResultCard from './components/ResultCard';

const MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', desc: 'Complex Reasoning & Search' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', desc: 'Speed Synthesis' },
  { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite', desc: 'Ultra-Low Latency' }
];

const STORAGE_KEY = 'cisco_cli_history';
const SUGGESTIONS_KEY = 'cisco_cli_suggestions';

const DEFAULT_SUGGESTIONS = [
  'BGP neighbor configuration', 
  'OSPF areas on IOS XR', 
  'VLAN interface setup', 
  'Show spanning-tree details'
];

export default function App() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history:", e);
      return [];
    }
  });

  // Controls whether we see the splash screen ('home') or the message list ('chat')
  const [view, setView] = useState(() => (messages.length === 0 ? 'home' : 'chat'));

  const [dynamicSuggestions, setDynamicSuggestions] = useState(() => {
    try {
      const saved = localStorage.getItem(SUGGESTIONS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SUGGESTIONS;
    } catch (e) {
      return DEFAULT_SUGGESTIONS;
    }
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [clearConfirmState, setClearConfirmState] = useState(false);
  
  const clearTimerRef = useRef(null);
  const scrollRef = useRef(null);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    if (view === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, view]);

  // Derived state to check if suggestions are AI-generated
  const isPredictive = useMemo(() => {
    return JSON.stringify(dynamicSuggestions) !== JSON.stringify(DEFAULT_SUGGESTIONS);
  }, [dynamicSuggestions]);

  // Update dynamic suggestions based on history
  useEffect(() => {
    const updateSuggestions = async () => {
      const userQueries = messages
        .filter(m => m.role === 'user' && m.content !== "Analyze attached image")
        .map(m => m.content)
        .slice(-5);
      
      if (userQueries.length > 0) {
        const newSuggestions = await getDynamicSuggestions(userQueries);
        setDynamicSuggestions(newSuggestions);
        localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(newSuggestions));
      } else {
        setDynamicSuggestions(DEFAULT_SUGGESTIONS);
        localStorage.removeItem(SUGGESTIONS_KEY);
      }
    };

    const timeout = setTimeout(updateSuggestions, 1500);
    return () => clearTimeout(timeout);
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAttachedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Navigates to home screen without deleting data
  const goHome = () => {
    setView('home');
  };

  // Destructive reset
  const hardReset = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SUGGESTIONS_KEY);
    setDynamicSuggestions(DEFAULT_SUGGESTIONS);
    setClearConfirmState(false);
    setView('home');
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
  };

  const handleClearHistory = () => {
    if (!clearConfirmState) {
      setClearConfirmState(true);
      clearTimerRef.current = setTimeout(() => {
        setClearConfirmState(false);
      }, 3000);
    } else {
      hardReset();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    // We don't submit automatically to allow user to tweak, 
    // but we could call handleSubmit here if desired.
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const trimmedValue = inputValue.trim();
    if ((!trimmedValue && !attachedImage) || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedValue || "Analyze attached image",
      timestamp: Date.now(),
      image: attachedImage
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setAttachedImage(null);
    setIsLoading(true);
    setView('chat'); // Ensure we are in chat view to see the result

    try {
      const result = await getCiscoCommandInfo(userMsg.content, userMsg.image, selectedModel.id);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Analysis for: ${userMsg.content}`,
        timestamp: Date.now(),
        metadata: result
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Network error during synthesis. Please check your connectivity or API project status.",
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const themeClasses = isDark ? { 
    bg: 'bg-slate-950 text-slate-100', 
    header: 'bg-black border-slate-800', 
    input: 'bg-slate-900 border-slate-800 text-slate-100', 
    util: 'bg-slate-900 border-slate-800 text-slate-400',
    emptyCard: 'bg-slate-900 border-slate-800',
    suggestion: 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:bg-slate-800'
  } : { 
    bg: 'bg-slate-50 text-slate-900', 
    header: 'bg-white border-slate-200', 
    input: 'bg-slate-100 border-slate-200 text-slate-900', 
    util: 'bg-slate-100 border-slate-200 text-slate-600',
    emptyCard: 'bg-white border-slate-200 shadow-sm',
    suggestion: 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
  };

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${themeClasses.bg}`}>
      <header className={`border-b p-4 flex items-center justify-between z-10 ${themeClasses.header}`}>
        <button 
          onClick={goHome}
          title="Return to Home Screen"
          className="flex items-center gap-3 group text-left transition-transform active:scale-95"
        >
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg group-hover:bg-blue-500 transition-colors group-hover:scale-105 transform">
            <i className="fas fa-network-wired text-xl text-white"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight group-hover:text-blue-500 transition-colors">Cisco CLI Expert</h1>
            <p className={`text-[10px] uppercase tracking-widest font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {isDark ? 'DARK INTELLIGENCE OPS' : 'ENTERPRISE LIGHT PROTOCOL'}
            </p>
          </div>
        </button>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleClearHistory} 
            title="Hard Reset: Clear All Data & Context"
            className={`px-3 h-10 rounded-xl border transition-all flex items-center gap-2 ${
              clearConfirmState 
                ? 'bg-rose-600 border-rose-500 text-white animate-pulse' 
                : `${themeClasses.util} hover:text-rose-500`
            }`}
          >
            <i className={`fas ${clearConfirmState ? 'fa-exclamation-triangle' : 'fa-trash-alt'}`}></i>
            {clearConfirmState && <span className="text-[10px] font-bold uppercase">Confirm Reset?</span>}
          </button>

          <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-xl border w-10 h-10 flex items-center justify-center ${themeClasses.util}`}>
            <i className={`fas ${isDark ? 'fa-sun text-amber-400' : 'fa-moon'}`}></i>
          </button>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`hidden sm:flex items-center gap-3 px-4 h-10 rounded-xl border ${themeClasses.util}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-semibold">{selectedModel.name.split(' ').slice(1).join(' ')}</span>
              <i className="fas fa-chevron-down text-[10px] opacity-40 ml-1"></i>
            </button>
            {isMenuOpen && (
              <div className={`absolute right-0 mt-2 w-64 rounded-xl border shadow-2xl z-50 animate-menuIn ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="p-2 space-y-1">
                  {MODELS.map((m) => (
                    <button key={m.id} onClick={() => { setSelectedModel(m); setIsMenuOpen(false); }} className={`w-full text-left p-3 rounded-lg ${selectedModel.id === m.id ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-opacity-10 hover:bg-slate-500 text-slate-400'}`}>
                      <div className="text-xs font-bold">{m.name}</div>
                      <div className="text-[10px] opacity-60">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex flex-col max-w-5xl mx-auto w-full">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
          {view === 'home' ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fadeIn">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-2xl transition-colors ${themeClasses.emptyCard}`}>
                <i className="fas fa-terminal text-3xl text-blue-500"></i>
              </div>
              <h2 className={`text-2xl font-bold mb-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Cisco Terminal Intelligence</h2>
              <p className={`max-w-md mx-auto mb-1 text-sm leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Real-time command synthesis with intelligent syntax auto-correction.
              </p>
              
              <div className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold mb-6 transition-all duration-500 ${isPredictive ? 'text-blue-400' : 'opacity-40'}`}>
                {isPredictive && <i className="fas fa-microchip animate-pulse"></i>}
                {isPredictive ? 'Predictive Intelligence' : 'Standard Protocols'}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {dynamicSuggestions.map((suggestion, idx) => (
                  <button 
                    key={`${suggestion}-${idx}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`p-3 border rounded-xl text-left text-sm transition-all flex items-center justify-between group animate-fadeIn ${themeClasses.suggestion}`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <span className="truncate pr-2">{suggestion}</span>
                    <i className="fas fa-chevron-right text-slate-300 group-hover:text-blue-500 transition-colors text-[10px] shrink-0"></i>
                  </button>
                ))}
              </div>

              {messages.length > 0 && (
                <button 
                  onClick={() => setView('chat')}
                  className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 hover:text-blue-400 flex items-center gap-2 transition-all opacity-60 hover:opacity-100"
                >
                  <i className="fas fa-history"></i> Return to active Session
                </button>
              )}
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                  <div className={`max-w-[95%] sm:max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none p-4 shadow-md' : 'w-full p-2'}`}>
                    {msg.image && <img src={msg.image} className="max-w-sm rounded-lg mb-3 border border-white/20 shadow-lg" alt="User upload" />}
                    {msg.role === 'assistant' ? (
                      msg.metadata ? <ResultCard data={msg.metadata} isDark={isDark} /> : <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>{msg.content}</div>
                    ) : <p className="text-sm font-medium">{msg.content}</p>}
                  </div>
                </div>
              ))}
            </>
          )}

          {isLoading && (
            <div className="flex justify-start animate-pulse p-4">
              <div className={`border p-6 rounded-xl shadow-xl w-full flex flex-col items-center justify-center gap-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.5s]"></div>
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">Synthesizing Network Intelligence...</span>
              </div>
            </div>
          )}
        </div>

        <div className={`p-4 border-t ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="max-w-4xl mx-auto">
            {attachedImage && (
              <div className="mb-3 flex items-center gap-2 animate-fadeIn">
                <div className="relative">
                  <img src={attachedImage} className="w-16 h-16 object-cover rounded-lg border-2 border-blue-500" alt="Preview" />
                  <button onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center shadow-lg"><i className="fas fa-times"></i></button>
                </div>
                <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Visual Asset Staged</div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              <button type="button" onClick={() => fileInputRef.current.click()} className={`p-3 rounded-xl border ${themeClasses.util} hover:bg-blue-500/10 hover:text-blue-500 transition-all shadow-sm`}>
                <i className="fas fa-camera"></i>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={attachedImage ? "Describe the issue in the image..." : "Query CLI command or architecture..."}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm ${themeClasses.input}`}
                />
              </div>
              <button type="submit" disabled={(!inputValue.trim() && !attachedImage) || isLoading} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 disabled:opacity-50 shadow-lg flex items-center gap-2 shrink-0 transition-all">
                <i className="fas fa-bolt"></i>
                <span className="hidden sm:inline">Analyze</span>
              </button>
            </form>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes menuIn { from { opacity: 0; transform: translateY(-4px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-menuIn { animation: menuIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? '#1e293b' : '#cbd5e1'}; border-radius: 10px; }
      `}</style>
    </div>
  );
}
