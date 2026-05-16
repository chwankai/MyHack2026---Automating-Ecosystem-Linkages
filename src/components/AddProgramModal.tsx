import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Actor, ActorType } from '../types';
import { suggestPartnersForProgram } from '../services/gemini';

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
  const [loading, setLoading] = useState(false);

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

      // Automatically suggest partners for this program
      const partners = actors.filter(a => a.type === ActorType.PARTNER);
      // Create clean version for AI
      const aiProgramData = {
        ...programData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      let suggestedPartnerNames: string[] = [];
      try {
        suggestedPartnerNames = await suggestPartnersForProgram(aiProgramData, partners);
      } catch (aiErr) {
        console.warn("Partner suggestion AI failed:", aiErr);
      }

      await addDoc(collection(db, 'programs'), {
        ...programData,
        partnerNames: suggestedPartnerNames,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      onClose();
      setTitle('');
      setDescription('');
      setRegion('Global');
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
