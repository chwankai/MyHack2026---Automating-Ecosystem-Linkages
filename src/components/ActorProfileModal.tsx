import React from 'react';
import { X, Building2, Globe, FileText, Database, Package, Link2, Users, TrendingUp, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Actor, ActorType, Linkage, Program } from '../types';

interface ActorProfileModalProps {
  actor: Actor | null;
  onClose: () => void;
  associatedLinkages: Linkage[];
  programs: Program[];
}

export default function ActorProfileModal({ actor, onClose, associatedLinkages, programs }: ActorProfileModalProps) {
  if (!actor) return null;

  const actorPrograms = programs.filter(p => p.partnerNames?.includes(actor.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden rounded-2xl flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm border ${
              actor.type === ActorType.COMPANY ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              actor.type === ActorType.MENTOR ? 'bg-blue-50 text-blue-600 border-blue-100' : 
              actor.type === ActorType.PARTNER ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-purple-50 text-purple-600 border-purple-100'
            }`}>
              {actor.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-xl text-slate-800 tracking-tight">{actor.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest bg-white border border-slate-200 px-2 py-0.5 rounded-full">{actor.type}</span>
                {actor.subType && <span className="text-[10px] text-slate-400 font-sans border-l border-slate-200 pl-2">{actor.subType}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-8">
          {/* Details Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
              <Globe className="text-blue-500" size={20} />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Region</p>
                <p className="text-sm font-bold text-slate-700">{actor.region}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
              <Link2 className="text-emerald-500" size={20} />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Linkages</p>
                <p className="text-sm font-bold text-slate-700">{associatedLinkages.length} Active</p>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileText size={14} className="text-blue-500" /> Biography / Summary
            </h3>
            <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl leading-relaxed border border-slate-100">
              {actor.bio}
            </p>
          </div>

          {/* Resources */}
          {actor.resources && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Package size={14} className="text-amber-500" /> Assets & Resources
              </h3>
              <div className="text-sm text-slate-600 bg-amber-50/50 p-4 rounded-xl leading-relaxed border border-amber-100">
                {actor.resources}
              </div>
            </div>
          )}

          {/* Associated Programs */}
          {actorPrograms.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Users size={14} className="text-purple-500" /> Associated Blueprints
              </h3>
              <div className="flex flex-col gap-2">
                {actorPrograms.map((p, i) => (
                  <div key={i} className="px-4 py-3 bg-purple-50/50 border border-purple-100 rounded-lg text-sm flex items-center justify-between">
                    <span className="font-bold text-purple-900">{p.title}</span>
                    <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{p.active ? 'Active' : 'Paused'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Engagement History */}
          {actor.engagementHistory && actor.engagementHistory.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <TrendingUp size={14} className="text-emerald-500" /> Engagement Record
              </h3>
              <div className="space-y-3">
                {actor.engagementHistory.slice().reverse().map((record, i) => (
                  <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold">
                          {(record.score / 100).toFixed(2)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={10} fill={s <= (record.score / 20) ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 italic">"{record.summary}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            <Database size={12} />
            ACT-{actor.id.slice(0, 8)}
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            Close Profile
          </button>
        </div>
      </motion.div>
    </div>
  );
}
