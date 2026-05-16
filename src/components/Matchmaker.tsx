import React, { useState } from 'react';
import { Sparkles, Brain, ArrowRight, Check, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Actor, ActorType, LinkageStatus, Program } from '../types';
import { generateLinkageSuggestions } from '../services/gemini';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Matchmaker({ actors, programs, userId }: { actors: Actor[], programs: Program[], userId: string }) {
  const [selectedSource, setSelectedSource] = useState<Actor | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const findMatches = async (actor: Actor) => {
    setLoading(true);
    setSelectedSource(actor);
    const targetType = actor.type === ActorType.COMPANY ? ActorType.MENTOR : ActorType.COMPANY;
    const potentialTargets = actors.filter(a => a.type === targetType && a.id !== actor.id);
    
    const results = await generateLinkageSuggestions(actor, potentialTargets, `${actor.type.toUpperCase()}_TO_${targetType.toUpperCase()}`);
    setSuggestions(results);
    setLoading(false);
  };

  const createLinkage = async (targetId: string, justification: string, score: number) => {
    if (!selectedSource) return;
    setProcessingId(targetId);
    try {
      await addDoc(collection(db, 'linkages'), {
        sourceId: selectedSource.id,
        targetId,
        programId: selectedProgramId || null,
        type: `${selectedSource.type.toUpperCase()}_TO_${actors.find(a => a.id === targetId)?.type.toUpperCase()}`,
        status: LinkageStatus.PROPOSED,
        aiJustification: justification,
        engagementScore: score,
        createdById: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSuggestions(prev => prev.filter(s => s.targetId !== targetId));
    } catch (err) {
      console.error('Error creating linkage:', err);
      const errInfo = {
        error: err instanceof Error ? err.message : String(err),
        operationType: 'create',
        path: 'linkages',
        authInfo: { userId }
      };
      console.error('Firestore Error Detailed:', JSON.stringify(errInfo));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-6 flex items-center gap-2">
          <Brain size={14} className="text-blue-600" /> Relationship Blueprinting
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-2 px-1">Primary Node Analysis</label>
            <select 
              onChange={(e) => {
                const actor = actors.find(a => a.id === e.target.value);
                if (actor) findMatches(actor);
              }}
              className="w-full bg-slate-50 border border-slate-200 p-3 text-sm focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all appearance-none"
              defaultValue=""
            >
              <option value="" disabled>Select Target for Discovery...</option>
              {actors.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
              ))}
            </select>
          </div>
          
          <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Neural Status</span>
            <span className={`text-[10px] font-bold uppercase ${loading ? 'text-blue-600 animate-pulse' : 'text-emerald-500'}`}>
              {loading ? 'Propagating Signals...' : 'Operational'}
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-12 text-center bg-white/50 border border-slate-200 border-dashed rounded-2xl"
          >
            <Sparkles className="mx-auto text-blue-300 animate-pulse mb-4" size={32} />
            <p className="text-sm text-slate-500">Discovering optimal strategic linkages...</p>
          </motion.div>
        )}

        {suggestions.length > 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {suggestions.map((s, idx) => {
              const target = actors.find(a => a.id === s.targetId);
              return (
                <div key={s.targetId} className="bg-white border border-slate-200 p-6 rounded-2xl flex gap-6 items-start hover:border-blue-300 transition-all shadow-sm">
                  <div className="w-10 h-10 bg-slate-900 text-white flex-shrink-0 rounded-lg flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-slate-800 text-base tracking-tight">{target?.name}</h4>
                        <div className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Propensity Score: {(s.score * 100).toFixed(1)}%</div>
                      </div>
                      <button 
                        onClick={() => setSuggestions(prev => prev.filter(item => item.targetId !== s.targetId))}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-6 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      {s.justification}
                    </p>
                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                      <div className="flex gap-2 items-center">
                        <Info size={12} className="text-slate-300" />
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Programmable Proposal</span>
                      </div>
                      <button 
                        disabled={processingId === s.targetId}
                        onClick={() => createLinkage(s.targetId, s.justification, s.score)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
                      >
                        {processingId === s.targetId ? 'Propagating...' : 'Authorize Link'} <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
