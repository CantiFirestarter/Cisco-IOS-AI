
import React, { useState } from 'react';

const FormattedText = ({ text, isDark, className = "" }) => {
  if (!text) return null;

  const lines = text.split('\n');

  const renderInline = (input) => {
    const parts = input.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className={`italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className={`px-1.5 py-0.5 rounded font-mono text-[0.85em] border transition-colors ${isDark ? 'bg-slate-800 text-blue-400 border-slate-700' : 'bg-slate-100 text-blue-600 border-slate-200'}`}>
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className={`${className} flex flex-col gap-1`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');

        if (isBullet) {
          return (
            <div key={idx} className="flex gap-3 pl-1">
              <span className="text-blue-500 mt-1.5 text-[8px]">
                <i className="fas fa-circle"></i>
              </span>
              <span className={`flex-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {renderInline(trimmed.substring(2))}
              </span>
            </div>
          );
        }

        return line.trim() ? (
          <div key={idx} className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {renderInline(line)}
          </div>
        ) : (
          <div key={idx} className="h-1"></div>
        );
      })}
    </div>
  );
};

const Section = ({ 
  title, 
  icon, 
  content, 
  color, 
  isDark,
  isCode = false 
}) => (
  <div className="mb-6 last:mb-0">
    <div className={`flex items-center gap-2 mb-2 ${color}`}>
      <i className={`fas ${icon} text-[10px] opacity-80`}></i>
      <h3 className="font-bold uppercase text-[10px] tracking-widest">{title}</h3>
    </div>
    <div className={`
      p-4 rounded-xl border transition-all duration-300
      ${isCode 
        ? 'bg-black text-emerald-400 font-mono text-sm border-slate-800 shadow-inner' 
        : `${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} text-slate-300 hover:border-blue-500/30`
      }
    `}>
      {isCode ? (
        <div className="whitespace-pre-wrap leading-relaxed overflow-x-auto">{content}</div>
      ) : (
        <FormattedText text={content} isDark={isDark} className="text-sm" />
      )}
    </div>
  </div>
);

export default function ResultCard({ data, isDark }) {
  const [showReasoning, setShowReasoning] = useState(false);

  const getCategoryStyles = (category) => {
    switch (category) {
      case 'Switch':
        return {
          bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
          text: 'text-blue-500',
          border: 'border-blue-500/20',
          icon: 'fa-server'
        };
      case 'Router':
        return {
          bg: isDark ? 'bg-orange-500/10' : 'bg-orange-50',
          text: 'text-orange-500',
          border: 'border-orange-500/20',
          icon: 'fa-route'
        };
      default:
        return {
          bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
          text: 'text-emerald-500',
          border: 'border-emerald-500/20',
          icon: 'fa-globe'
        };
    }
  };

  const getModeStyles = (mode) => {
    const lowerMode = mode ? mode.toLowerCase() : "";
    const isConfig = lowerMode.includes('config');
    const isExec = lowerMode.includes('exec');
    
    if (isConfig) {
      return {
        bg: isDark ? 'bg-rose-500/10' : 'bg-rose-50',
        text: 'text-rose-500',
        border: 'border-rose-500/20',
        icon: 'fa-wrench'
      };
    }
    if (isExec) {
      return {
        bg: isDark ? 'bg-sky-500/10' : 'bg-sky-50',
        text: 'text-sky-500',
        border: 'border-sky-500/20',
        icon: 'fa-terminal'
      };
    }
    return {
      bg: isDark ? 'bg-slate-500/10' : 'bg-slate-100',
      text: isDark ? 'text-slate-400' : 'text-slate-600',
      border: 'border-slate-500/20',
      icon: 'fa-microchip'
    };
  };

  const catStyles = getCategoryStyles(data.deviceCategory);
  const modeStyles = getModeStyles(data.commandMode);

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {data.correction && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border animate-bounce-subtle ${isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
          <i className="fas fa-magic text-xs"></i>
          <div className="text-xs font-semibold">
            <span className="opacity-70">Syntactic Auto-Correction:</span> {data.correction}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${catStyles.bg} ${catStyles.text} ${catStyles.border}`}>
          <i className={`fas ${catStyles.icon}`}></i>
          {data.deviceCategory}
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${modeStyles.bg} ${modeStyles.text} ${modeStyles.border}`}>
          <i className={`fas ${modeStyles.icon}`}></i>
          {data.commandMode}
        </div>

        <div className="flex-1 flex justify-end">
          <div className={`rounded-xl overflow-hidden border transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
            <button 
              onClick={() => setShowReasoning(!showReasoning)}
              className={`flex items-center gap-2 px-4 py-1.5 transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-200'}`}
            >
              <span className={`text-[10px] font-bold uppercase flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <i className="fas fa-brain text-blue-500"></i> AI Logic
              </span>
              <i className={`fas fa-chevron-${showReasoning ? 'up' : 'down'} text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}></i>
            </button>
          </div>
        </div>
      </div>

      {showReasoning && (
        <div className={`px-4 py-3 rounded-xl border animate-menuIn transition-colors ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
          <FormattedText text={data.reasoning} isDark={isDark} className="text-xs italic opacity-70" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        <div className="col-span-1 md:col-span-2">
          <Section title="Syntax" icon="fa-terminal" content={data.syntax} color="text-blue-500" isDark={isDark} isCode={true} />
        </div>
        
        <Section title="Description" icon="fa-info-circle" content={data.description} color="text-indigo-500" isDark={isDark} />
        <Section title="Context" icon="fa-layer-group" content={data.usageContext} color="text-teal-500" isDark={isDark} />

        <div className="col-span-1 md:col-span-2">
          <Section title="Options" icon="fa-list-ul" content={data.options} color="text-amber-500" isDark={isDark} />
        </div>

        <div className="col-span-1 md:col-span-2">
          <Section title="Notes" icon="fa-exclamation-triangle" content={data.notes} color="text-rose-500" isDark={isDark} />
        </div>

        <div className="col-span-1 md:col-span-2">
          <Section title="Examples" icon="fa-code" content={data.examples} color="text-emerald-500" isDark={isDark} isCode={true} />
        </div>
      </div>
    </div>
  );
}
