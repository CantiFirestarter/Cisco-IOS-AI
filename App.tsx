
import React, { useState, useRef, useEffect } from 'react';
import { getCiscoCommandInfo } from './services/geminiService';
import ResultCard from './components/ResultCard';

const MODELS = [
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', desc: 'Ultra-Low Latency' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', desc: 'Speed Synthesis' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', desc: 'Complex Reasoning' }
];

const MAX_QUERY_LENGTH = 1000;

export default function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => setIsDark(!isDark);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();
    
    if (!trimmedValue || isLoading) return;
    
    if (trimmedValue.length > MAX_QUERY_LENGTH) {
      alert(`Query is too long. Please limit your request to ${MAX_QUERY_LENGTH} characters.`);
      return;
    }

    const userQuery = trimmedValue;
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userQuery,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const result = await getCiscoCommandInfo(userQuery, selectedModel.id);
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Details for: ${userQuery}`,
        timestamp: Date.now(),
        metadata: result
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an error. Please try again.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const bgClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';
  const headerClass = isDark ? 'bg-black border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';
  const inputContainerClass = isDark ? 'bg-slate-950 border-slate-800/50' : 'bg-white border-slate-200';
  const inputClass = isDark ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-600' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400';
  const emptyStateCardClass = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const suggestionBtnClass = isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50';
  const utilityComponentClass = isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600';

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${bgClass}`}>
      <header className={`border-b p-4 shadow-xl flex items-center justify-between z-10 transition-colors duration-300 ${headerClass}`}>
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
            <i className="fas fa-network-wired text-xl text-white"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">Cisco CLI Expert</h1>
            <p className={`text-[10px] uppercase tracking-widest font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {isDark ? 'Dark Intelligence Ops' : 'Enterprise Light Protocol'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center w-10 h-10 border ${utilityComponentClass} ${isDark ? 'text-amber-400 hover:bg-slate-800/80' : 'hover:bg-slate-200/80'}`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>

          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`hidden sm:flex items-center gap-3 px-4 h-10 rounded-xl border transition-all ${utilityComponentClass} ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-semibold">{selectedModel.name}</span>
              <i className={`fas fa-chevron-down text-[10px] transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {isMenuOpen && (
              <div className={`absolute right-0 mt-2 w-64 rounded-xl border shadow-2xl z-50 animate-menuIn ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="p-2 space-y-1">
                  {MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                        selectedModel.id === model.id 
                          ? (isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600')
                          : (isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-50 text-slate-600')
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{model.name}</div>
                        <div className="text-[10px] opacity-60 uppercase tracking-tighter">{model.desc}</div>
                      </div>
                      {selectedModel.id === model.id && <i className="fas fa-check text-xs"></i>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex flex-col max-w-5xl mx-auto w-full">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-2xl transition-colors ${emptyStateCardClass}`}>
                <i className="fas fa-terminal text-3xl text-blue-500"></i>
              </div>
              <h2 className={`text-2xl font-bold mb-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Cisco Terminal Intelligence</h2>
              <p className={`max-w-md mx-auto mb-8 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Real-time command synthesis with intelligent syntax auto-correction.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {[
                  'BGP neighbor configuration', 
                  'OSPF areas on IOS XR', 
                  'VLAN interface setup', 
                  'Show spanning-tree details'
                ].map(suggestion => (
                  <button 
                    key={suggestion}
                    onClick={() => setInputValue(suggestion)}
                    className={`p-3 border rounded-xl text-left text-sm transition-all flex items-center justify-between group ${suggestionBtnClass}`}
                  >
                    {suggestion}
                    <i className="fas fa-chevron-right text-slate-300 group-hover:text-blue-500 transition-colors text-[10px]"></i>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div className={`max-w-[95%] sm:max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none shadow-lg' : 'w-full'} p-4`}>
                {msg.role === 'assistant' ? (
                   <div className="space-y-4">
                      {msg.metadata ? (
                        <ResultCard data={msg.metadata} isDark={isDark} />
                      ) : (
                        <p className={`p-4 rounded-xl border shadow-xl transition-colors ${isDark ? 'text-slate-300 bg-slate-900 border-slate-800' : 'text-slate-700 bg-white border-slate-200'}`}>
                          {msg.content}
                        </p>
                      )}
                   </div>
                ) : (
                  <p className="text-sm font-medium">{msg.content}</p>
                )}
                <div className={`mt-2 text-[10px] ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-500'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className={`border p-6 rounded-xl shadow-xl w-full h-40 flex flex-col items-center justify-center gap-4 transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <i className="fas fa-circle-notch fa-spin text-blue-500 text-2xl"></i>
                <span className={`text-xs uppercase tracking-widest font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Analyzing Syntax & Logic...</span>
              </div>
            </div>
          )}
        </div>

        <div className={`p-4 border-t transition-colors ${inputContainerClass}`}>
          <div className="max-w-4xl mx-auto flex flex-col gap-3">
            <form onSubmit={handleSubmit} className="flex gap-2 relative items-end">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Query command or task..."
                  maxLength={MAX_QUERY_LENGTH}
                  spellCheck="true"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm ${inputClass}`}
                />
                <i className="fas fa-terminal absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                
                {inputValue.length > MAX_QUERY_LENGTH * 0.7 && (
                  <div className={`absolute -top-6 right-1 text-[10px] font-mono font-bold transition-colors ${
                    inputValue.length >= MAX_QUERY_LENGTH ? 'text-rose-500' : 'text-slate-500'
                  }`}>
                    {inputValue.length} / {MAX_QUERY_LENGTH}
                  </div>
                )}
              </div>
              <button 
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2 border border-blue-500/50 shrink-0"
              >
                <i className="fas fa-bolt"></i>
                <span className="hidden sm:inline">Analyze</span>
              </button>
            </form>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes menuIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounceSubtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-menuIn {
          animation: menuIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-bounce-subtle {
          animation: bounceSubtle 2s ease-in-out infinite;
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? '#1e293b' : '#e2e8f0'};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#334155' : '#cbd5e1'};
        }
      `}</style>
    </div>
  );
}
