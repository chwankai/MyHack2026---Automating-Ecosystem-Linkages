import React from 'react';
import { X, Shield, Info, Activity, Database, Boxes } from 'lucide-react';
import { motion } from 'motion/react';
import { Program, Linkage, Actor } from '../types';

interface ProgramDetailsModalProps {
  program: Program | null;
  onClose: () => void;
  associatedLinkages: Linkage[];
  actors: Actor[];
}

export default function ProgramDetailsModal({ program, onClose, associatedLinkages, actors }: ProgramDetailsModalProps) {
  if (!program) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden rounded-2xl flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div>
            <h2 className="font-bold text-lg text-slate-800 tracking-tight">{program.title}</h2>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Blueprint Configuration Details</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-8">
          {/* Metadata Section */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Region</p>
              <p className="text-sm font-bold text-slate-700">{program.region}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${program.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {program.active ? 'Active' : 'Paused'}
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Entity Load</p>
              <p className="text-sm font-bold text-slate-700">{associatedLinkages.length} Nodes</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Info size={14} className="text-blue-500" /> Executive Summary
            </h3>
            <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl leading-relaxed border border-blue-100/50">
              {program.description}
            </p>
          </div>

          {/* Detailed Linkage Ledger */}
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Boxes size={14} className="text-blue-500" /> Structural Linkages
            </h3>
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase text-[9px]">
                  <tr>
                    <th className="px-4 py-3">Source Node</th>
                    <th className="px-4 py-3">Target Node</th>
                    <th className="px-4 py-3">Relationship</th>
                    <th className="px-4 py-3 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {associatedLinkages.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-slate-300 font-mono">No linkages attributed to this blueprint context</td>
                    </tr>
                  ) : (
                    associatedLinkages.map(link => {
                      const source = actors.find(a => a.id === link.sourceId);
                      const target = actors.find(a => a.id === link.targetId);
                      return (
                        <tr key={link.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-800">{source?.name}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{target?.name}</td>
                          <td className="px-4 py-3 opacity-60">{link.type}</td>
                          <td className="px-4 py-3 text-right font-mono text-blue-600">{(link.engagementScore || 0).toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Control Interface (Future) */}
          <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
            <Shield className="absolute -right-4 -top-4 text-white/10" size={100} />
            <h3 className="text-[10px] font-bold tracking-widest uppercase mb-4 text-blue-400">Blueprint Propagation</h3>
            <div className="flex gap-4">
              <button className="flex-1 bg-white/10 border border-white/20 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all">
                Export Topology
              </button>
              <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all">
                Update Rules
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            <Database size={12} />
            BP-{program.id.slice(0, 8)}
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            Close Matrix Details
          </button>
        </div>
      </motion.div>
    </div>
  );
}
