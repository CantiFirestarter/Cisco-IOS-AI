
import React, { useState } from 'react';
import { CiscoQueryResponse } from '../types';

interface ResultCardProps {
  data: CiscoQueryResponse;
}

const ResultCard: React.FC<ResultCardProps> = ({ data }) => {
  const [showReasoning, setShowReasoning] = useState(false);

  const Section = ({ title, icon, content, color }: { title: string, icon: string, content: string, color: string }) => (
    <div className="mb-6 last:mb-0">
      <div className={`flex items-center gap-2 mb-2 ${color}`}>
        <i className={`fas ${icon}`}></i>
        <h3 className="font-bold uppercase text-sm tracking-wider">{title}</h3>
      </div>
      <div className="prose prose-sm max-w-none text-slate-700 bg-white p-4 rounded-lg border border-slate-200 shadow-sm whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* Reasoning Toggle */}
      <div className="bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
        <button 
          onClick={() => setShowReasoning(!showReasoning)}
          className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-200 transition-colors"
        >
          <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
            <i className="fas fa-brain"></i> Reasoning Process
          </span>
          <i className={`fas fa-chevron-${showReasoning ? 'up' : 'down'} text-slate-400 text-xs`}></i>
        </button>
        {showReasoning && (
          <div className="px-4 py-3 text-sm text-slate-600 italic border-t border-slate-200">
            {data.reasoning}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1 md:col-span-2">
          <Section 
            title="Command Syntax" 
            icon="fa-terminal" 
            content={data.syntax} 
            color="text-blue-600"
          />
        </div>
        
        <Section 
          title="Description" 
          icon="fa-info-circle" 
          content={data.description} 
          color="text-indigo-600"
        />
        
        <Section 
          title="Usage Context" 
          icon="fa-layer-group" 
          content={data.usageContext} 
          color="text-teal-600"
        />

        <div className="col-span-1 md:col-span-2">
           <Section 
            title="Options & Parameters" 
            icon="fa-list-ul" 
            content={data.options} 
            color="text-amber-600"
          />
        </div>

        <div className="col-span-1 md:col-span-2">
           <Section 
            title="Notes & Caveats" 
            icon="fa-exclamation-triangle" 
            content={data.notes} 
            color="text-rose-600"
          />
        </div>

        <div className="col-span-1 md:col-span-2">
           <Section 
            title="Examples" 
            icon="fa-code" 
            content={data.examples} 
            color="text-emerald-600"
          />
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
