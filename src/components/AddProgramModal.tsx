import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Actor, ActorType } from '../types';

interface AddProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  actors: Actor[];
}

export default function AddProgramModal({ isOpen, onClose, userId, actors }: AddProgramModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState('Global');
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const togglePartner = (name: string) => {
    setSelectedPartners(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const programData = {
        title: title.trim(),
        description: description.trim(),
        region: region.trim(),
        active: true,
        createdBy: userId,
      };

      await addDoc(collection(db, 'programs'), {
        ...programData,
        partnerNames: selectedPartners,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      onClose();
      setTitle('');
      setDescription('');
      setRegion('Global');
      setSelectedPartners([]);
    } catch (err) {
      console.error("Error adding program:", err);
      const errInfo = {
        error: err instanceof Error ? err.message : String(err),
        operationType: 'create',
        path: 'programs',
        authInfo: { userId }
      };
      console.error('Firestore Error Detailed:', JSON.stringify(errInfo));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden rounded-2xl max-h-[90vh] flex flex-col"
      >
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div>
            <h2 className="font-bold text-lg text-slate-800 tracking-tight">New Program Blueprint</h2>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Architectural Specification</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Program Title</label>
              <input 
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 text-sm focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all"
                placeholder="e.g. Nexus Accelerator 2024"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Geographic Focus</label>
              <input 
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 text-sm focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all"
                placeholder="e.g. Global, EMEA, SEA"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Program Scope & Objectives</label>
              <textarea 
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 text-sm focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all min-h-[120px] resize-none"
                placeholder="Define the primary goals and cohort parameters..."
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Assign Entities</label>
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
            </div>
          </div>

          <div className="p-6 pt-2 border-t border-slate-50 shrink-0">
            <button 
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 font-bold text-sm tracking-wide rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Initializing Blueprint...' : (
                <>
                  <Save size={18} /> Initialize Blueprint
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
