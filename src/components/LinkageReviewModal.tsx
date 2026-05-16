import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  History, 
  TrendingUp, 
  Calendar, 
  Target, 
  Zap, 
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { Linkage, LinkageStatus, Actor, ReviewEntry } from '../types';

interface LinkageReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkage: Linkage;
  source: Actor | null;
  target: Actor | null;
  onUpdate: (updates: Partial<Linkage>, newReview?: ReviewEntry) => Promise<void>;
}

export default function LinkageReviewModal({ 
  isOpen, 
  onClose, 
  linkage, 
  source, 
  target, 
  onUpdate 
}: LinkageReviewModalProps) {
  const [status, setStatus] = useState<LinkageStatus>(linkage.status);
  const [e1Rating, setE1Rating] = useState(5);
  const [e1Text, setE1Text] = useState('');
  const [e2Rating, setE2Rating] = useState(5);
  const [e2Text, setE2Text] = useState('');
  
  const [adminRating, setAdminRating] = useState(5);

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !source || !target) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const newReview: ReviewEntry = {
      entity1Rating: e1Rating,
      entity1Text: e1Text,
      entity2Rating: e2Rating,
      entity2Text: e2Text,
      timestamp: new Date().toISOString()
    };

    const updates: any = { status };
    if (status === LinkageStatus.COMPLETED) {
      updates.adminEvaluation = adminRating;
    }

    try {
      await onUpdate(updates, newReview);
    } catch (err) {
      console.error('Failed to save linkage updates:', err);
      alert('Error: Failed to save updates. Check console for details.');
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  const renderStars = (rating: number, setRating: (r: number) => void, size: number = 18) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button 
          key={s} 
          onClick={() => setRating(s)}
          className={`transition-all ${s <= rating ? 'text-amber-400' : 'text-slate-200'} hover:scale-110`}
        >
          <Star size={size} fill={s <= rating ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/20"
        >
          {/* Header */}
          <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600">
                <TrendingUp size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Relationship Management</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {source.name} ⇌ {target.name}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="p-8 space-y-8">
              {/* Status Selector */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Relationship Status</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[LinkageStatus.ACTIVE, LinkageStatus.COMPLETED, LinkageStatus.CANCELLED].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      disabled={linkage.status === LinkageStatus.COMPLETED || linkage.status === LinkageStatus.CANCELLED}
                      className={`py-3 rounded-2xl border-2 font-bold text-[10px] uppercase tracking-wider transition-all ${
                        status === s 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Section */}
              {/* Review Section (Hidden if Finalized) */}
              {linkage.status !== LinkageStatus.COMPLETED && linkage.status !== LinkageStatus.CANCELLED ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">{source.name}</span>
                      {renderStars(e1Rating, setE1Rating)}
                    </div>
                    <textarea
                      placeholder={`Input feedback from ${source.name}...`}
                      className="w-full h-32 bg-white border border-slate-200 rounded-2xl p-4 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
                      value={e1Text}
                      onChange={(e) => setE1Text(e.target.value)}
                    />
                    <p className="text-[9px] text-slate-400 px-1 italic">
                      Tips: include important information including meeting frequency, feedback rating, goal completion, and responsiveness
                    </p>
                  </div>
                  <div className="space-y-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">{target.name}</span>
                      {renderStars(e2Rating, setE2Rating)}
                    </div>
                    <textarea
                      placeholder={`Input feedback from ${target.name}...`}
                      className="w-full h-32 bg-white border border-slate-200 rounded-2xl p-4 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
                      value={e2Text}
                      onChange={(e) => setE2Text(e.target.value)}
                    />
                    <p className="text-[9px] text-slate-400 px-1 italic">
                      Tips: include important information including meeting frequency, feedback rating, goal completion, and responsiveness
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-8 bg-slate-900 rounded-[32px] text-white relative overflow-hidden shadow-xl flex items-center justify-between">
                    <TrendingUp className="absolute -right-4 -top-4 opacity-10" size={120} />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-blue-300">Final Engagement Performance</h4>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-5xl font-black text-white">{( (linkage.engagementScore || 0) / 100 ).toFixed(2)}</span>
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Aggregate Score</span>
                      </div>
                    </div>
                    <div className="bg-white/10 p-6 rounded-[24px] backdrop-blur-md border border-white/10">
                      <div className="flex text-amber-400 gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={20} fill={s <= ((linkage.engagementScore || 0) / 20) ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-center text-blue-200 uppercase tracking-widest">AI Certified Record</p>
                    </div>
                  </div>
                  
                  <div className="p-8 bg-blue-50/50 rounded-[32px] border border-blue-100/50 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-4">
                      <Zap size={18} className="text-blue-600" />
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-800">AI Performance Synthesis</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed italic">
                      "{linkage.aiSummary || 'No performance summary generated.'}"
                    </p>
                  </div>
                </div>
              )}

              {/* Admin Evaluation (Visible on 'Completed', only if not already finalized) */}
              {status === LinkageStatus.COMPLETED && linkage.status !== LinkageStatus.COMPLETED && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 bg-blue-900 rounded-[32px] text-white relative overflow-hidden shadow-xl flex items-center justify-between"
                >
                  <ShieldCheck className="absolute -right-4 -top-4 opacity-10" size={120} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-blue-300">Admin Evaluation</h4>
                    <p className="text-[10px] text-blue-100/60 mt-1">Final qualitative score for this relationship.</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                    {renderStars(adminRating, setAdminRating, 24)}
                  </div>
                </motion.div>
              )}

              {/* History Section - Full Width Below */}
              <div className="pt-8 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                  <History size={16} className="text-slate-400" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Review History</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(linkage.reviews || []).slice().reverse().map((r, i) => (
                    <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                        <div className="flex items-center gap-2">
                          <Calendar size={10} />
                          <span>{new Date(r.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-blue-500">E1: {r.entity1Rating}★</span>
                          <span className="text-emerald-500">E2: {r.entity2Rating}★</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <p className="text-[10px] text-slate-600 italic border-l-2 border-blue-200 pl-2">"{r.entity1Text}"</p>
                        <p className="text-[10px] text-slate-600 italic border-l-2 border-emerald-200 pl-2">"{r.entity2Text}"</p>
                      </div>
                    </div>
                  ))}
                  {(!linkage.reviews || linkage.reviews.length === 0) && (
                    <div className="col-span-2 text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <MessageSquare size={32} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-xs text-slate-400">No history available.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 bg-white border-t border-slate-100 flex justify-end gap-3">
            {linkage.status !== LinkageStatus.COMPLETED && linkage.status !== LinkageStatus.CANCELLED ? (
              <>
                <button 
                  onClick={onClose}
                  className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-10 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {status === LinkageStatus.COMPLETED ? 'Complete & Score' : 'Save Updates'}
                </button>
              </>
            ) : (
              <button 
                onClick={onClose}
                className="px-10 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
              >
                Close Record
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
