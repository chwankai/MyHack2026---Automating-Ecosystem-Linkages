import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ActorType } from '../types';
import { extractActorInfo } from '../services/gemini';

export default function AddActorModal({ isOpen, onClose, userId }: { isOpen: boolean, onClose: () => void, userId: string }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ActorType>(ActorType.COMPANY);
  const [sector, setSector] = useState('');
  const [region, setRegion] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const base64Data = base64.split(',')[1];
        
        const extracted = await extractActorInfo({
          data: base64Data,
          mimeType: file.type
        });

        if (extracted) {
          setName(extracted.name || '');
          setSector(extracted.sector || '');
          setRegion(extracted.region || '');
          setBio(extracted.bio || '');
          setType((extracted.type?.toLowerCase() as ActorType) || ActorType.COMPANY);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Extraction failed:", error);
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading || extracting) return;

    setLoading(true);
    setError(null);
    try {
      const actorData = {
        name: name.trim(),
        type,
        subType: sector.trim(),
        region: region.trim(),
        bio: bio.trim(),
        ownerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {}
      };

      await addDoc(collection(db, 'actors'), actorData);
      
      // Reset fields
      setName('');
      setSector('');
      setRegion('');
      setBio('');
      setType(ActorType.COMPANY);
      onClose();
    } catch (err) {
      console.error('Error adding actor:', err);
      setError('Failed to propagate node to matrix. Please verify authorization.');
      // Implementation of error handling as per guidelines
      const errInfo = {
        error: err instanceof Error ? err.message : String(err),
        operationType: 'create',
        path: 'actors',
        authInfo: {
          userId: userId,
        }
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
        className="bg-white max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden rounded-2xl"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="font-bold text-lg text-slate-800 tracking-tight">Register Node</h2>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Configuration Interface</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <X size={14} className="shrink-0" /> {error}
            </div>
          )}
          {/* Node Type First */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Node Type</label>
            <select 
              value={type}
              onChange={e => setType(e.target.value as ActorType)}
              className="w-full bg-slate-50 border border-slate-200 p-3 text-sm focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all appearance-none font-bold text-slate-700"
            >
              <option value={ActorType.COMPANY}>Company Entity</option>
              <option value={ActorType.MENTOR}>Mentor Node</option>
              <option value={ActorType.PARTNER}>Venture Partner</option>
            </select>
          </div>

          {/* AI Extraction Tool */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 flex items-center gap-1.5">
                <Sparkles size={12} /> AI Extraction Hub
              </span>
            </div>
            <button
              type="button"
              disabled={extracting}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 border-2 border-dashed border-blue-200 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-blue-100/50 transition-all text-blue-600 disabled:opacity-50"
            >
              {extracting ? (
                <div className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest animate-pulse">
                  Analyzing Signals...
                </div>
              ) : (
                <>
                  <Upload size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Propagate Document Data</span>
                </>
              )}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".pdf,.png,.jpg,.jpeg,.txt"
            />
            <p className="text-[8px] text-slate-400 mt-2 text-center uppercase tracking-tight">Upload pitch deck, profile, or technical brief to auto-fill matrix parameters.</p>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Node Identifier / Name</label>
            <input 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3 text-sm focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all"
              placeholder="e.g. Acme Fintech AI"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Sector Architecture</label>
              <input 
                value={sector}
                onChange={e => setSector(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 text-sm focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all"
                placeholder="e.g. Fintech"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Geographic Influence</label>
              <input 
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 text-sm focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all"
                placeholder="e.g. SEA, Europe"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Strategic Objective / Core Expertise</label>
            <textarea 
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3 text-sm focus:border-blue-600 focus:bg-white rounded-xl outline-none transition-all min-h-[100px] resize-none"
              placeholder="Outline mission-critical parameters..."
            />
          </div>

          <div className="pt-2">
            <button 
              disabled={loading || extracting}
              className="w-full bg-blue-600 text-white py-4 font-bold text-sm tracking-wide rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Propagating to Matrix...' : 'Commit Registration'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
