
import React, { useState, useRef, useEffect } from 'react';
import { getCiscoCommandInfo } from './services/geminiService';
import { ChatMessage, CiscoQueryResponse } from './types';
import ResultCard from './components/ResultCard';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userQuery = inputValue;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userQuery,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const result = await getCiscoCommandInfo(userQuery);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Detailed information for: ${userQuery}`,
        timestamp: Date.now(),
        metadata: result
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an error while retrieving the Cisco command details. Please ensure your query is specific and try again.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <i className="fas fa-network-wired text-xl"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Cisco CLI Expert</h1>
            <p className="text-xs text-slate-400">IOS / IOS XE / IOS XR Command Reference</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Gemini 3 Pro</span>
          <span className="text-slate-500">|</span>
          <a href="#" className="hover:text-blue-400">Documentation</a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col max-w-5xl mx-auto w-full">
        
        {/* Messages List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                <i className="fas fa-search text-4xl text-slate-400"></i>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">How can I help you today?</h2>
              <p className="text-slate-500 max-w-md mx-auto mb-8">
                Search for any Cisco IOS, XE, or XR command to get detailed syntax, usage contexts, and troubleshooting tips.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {['Assign static IP to interface', 'Configure OSPF on IOS XR', 'Show BGP summary details', 'Setup trunk on Layer 2 switch'].map(suggestion => (
                  <button 
                    key={suggestion}
                    onClick={() => setInputValue(suggestion)}
                    className="p-3 bg-white border border-slate-200 rounded-xl text-left text-sm hover:border-blue-400 hover:shadow-sm transition-all text-slate-600 flex items-center justify-between group"
                  >
                    {suggestion}
                    <i className="fas fa-arrow-right text-slate-300 group-hover:text-blue-500 transition-colors"></i>
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
              <div className={`max-w-[90%] sm:max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' : 'w-full'} p-4 shadow-sm`}>
                {msg.role === 'assistant' ? (
                   <div className="space-y-4">
                      {msg.metadata ? (
                        <ResultCard data={msg.metadata} />
                      ) : (
                        <p className="text-slate-800 bg-white p-4 rounded-xl border border-slate-200">{msg.content}</p>
                      )}
                   </div>
                ) : (
                  <p className="text-sm font-medium">{msg.content}</p>
                )}
                <div className={`mt-2 text-[10px] ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm w-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                    <i className="fas fa-spinner fa-spin text-slate-400"></i>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-32 bg-slate-200 rounded"></div>
                    <div className="h-2 w-48 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about a Cisco command (e.g., 'router ospf' or 'how to set hostname')..."
                className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
              />
              <i className="fas fa-terminal absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            </div>
            <button 
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              <span className="hidden sm:inline">Search</span>
              <i className="fas fa-search"></i>
            </button>
          </form>
          <div className="mt-2 text-[10px] text-center text-slate-400 flex items-center justify-center gap-4">
             <span>Press Enter to Search</span>
             <span className="flex items-center gap-1"><i className="fas fa-shield-alt"></i> Data verified for Cisco OS standards</span>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
