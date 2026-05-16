import React, { useState, useEffect } from 'react';
import { X, Shield, Info, Activity, Database, Boxes, Building2, Brain, Globe, Settings, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { Program, Linkage, Actor, ActorType } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ProgramDetailsModalProps {
  program: Program | null;
  onClose: () => void;
  associatedLinkages: Linkage[];
  actors: Actor[];
}

export default function ProgramDetailsModal({ program, onClose, associatedLinkages, actors }: ProgramDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPartners, setSelectedPartners] = useState<string[]>(program?.partnerNames || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleExportTopology = () => {
    if (!program) return;
    const topologyData = {
      programId: program.id,
      title: program.title,
      description: program.description,
      region: program.region,
      active: program.active,
      assignedEntities: program.partnerNames || [],
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(topologyData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blueprint-topology-${program.id.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpdateRules = () => {
    alert("Blueprint propagation rules updated successfully.");
  };

  useEffect(() => {
    if (program) {
      setSelectedPartners(program.partnerNames || []);
      setIsEditing(false);
    }
  }, [program]);

  const togglePartner = (name: string) => {
    setSelectedPartners(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const handleSave = async () => {
    if (!program) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'programs', program.id), {
        partnerNames: selectedPartners
      });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

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
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Entities</p>
              <p className="text-sm font-bold text-slate-700">{program.partnerNames?.length || 0} Registered</p>
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

          {/* Assigned Partners */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Shield size={14} className="text-blue-500" /> Assigned Entities
              </h3>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold text-blue-600 hover:underline uppercase">Edit Assignments</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => {setIsEditing(false); setSelectedPartners(program.partnerNames || [])}} className="text-[10px] font-bold text-slate-500 hover:underline uppercase">Cancel</button>
                  <button onClick={handleSave} disabled={isSaving} className="text-[10px] font-bold text-blue-600 hover:underline uppercase">{isSaving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              )}
            </div>

            {!isEditing ? (
              <div className="flex flex-wrap gap-2">
                {program.partnerNames && program.partnerNames.length > 0 ? program.partnerNames.map((name, i) => {
                  const actor = actors.find(a => a.name === name);
                  let colorClass = 'bg-slate-50 text-slate-600 border-slate-100';
                  let Icon = Users;
                  
                  if (actor?.type === ActorType.COMPANY) {
                    colorClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                    Icon = Building2;
                  } else if (actor?.type === ActorType.MENTOR) {
                    colorClass = 'bg-blue-50 text-blue-600 border-blue-100';
                    Icon = Brain;
                  } else if (actor?.type === ActorType.PARTNER) {
                    colorClass = 'bg-amber-50 text-amber-600 border-amber-100';
                    Icon = Globe;
                  } else if (actor?.type === ActorType.SERVICE_PROVIDER) {
                    colorClass = 'bg-purple-50 text-purple-600 border-purple-100';
                    Icon = Settings;
                  }

                  return (
                    <div key={i} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 border ${colorClass}`}>
                      <Icon size={10} /> {name}
                    </div>
                  );
                }) : <div className="text-sm text-slate-400">No entities assigned.</div>}
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto bg-slate-50">
                {[
                  { name: 'Companies', items: actors.filter(a => a.type === ActorType.COMPANY) },
                  { name: 'Mentors', items: actors.filter(a => a.type === ActorType.MENTOR) },
                  { name: 'Partners', items: actors.filter(a => a.type === ActorType.PARTNER) },
                  { name: 'Service Providers', items: actors.filter(a => a.type === ActorType.SERVICE_PROVIDER) },
                ].map(group => group.items.length > 0 && (
                  <div key={group.name}>
                    <div className="bg-slate-100 text-[10px] font-bold uppercase text-slate-500 px-3 py-1 border-b border-slate-200 sticky top-0 z-10">
                      {group.name}
                    </div>
                    {group.items.map(actor => (
                      <label key={actor.id} className="flex items-center gap-3 p-3 hover:bg-white border-b border-slate-100 cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={selectedPartners.includes(actor.name)}
                          onChange={() => togglePartner(actor.name)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-bold text-slate-800">{actor.name}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">{actor.type}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                ))}
                {actors.length === 0 && <div className="p-4 text-center text-xs text-slate-400">No entities available in matrix.</div>}
              </div>
            )}
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
