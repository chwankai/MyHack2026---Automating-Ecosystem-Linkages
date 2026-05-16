import React, { useState, useMemo } from 'react';
import { X, Mail, Send, ArrowRight, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Actor, Linkage, Program, LinkageStatus, LinkageResponse } from '../types';
import { openMailtoForParty, getEmailPreview } from '../services/emailService';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkage: Linkage | null;
  source: Actor | null;
  target: Actor | null;
  program?: Program | null;
  adminEmail: string;
}

export default function SendEmailModal({ isOpen, onClose, linkage, source, target, program, adminEmail }: SendEmailModalProps) {
  const [previewParty, setPreviewParty] = useState<'source' | 'target'>('source');
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  const appUrl = window.location.origin + window.location.pathname;

  const emailCtx = useMemo(() => {
    if (!linkage || !source || !target) return null;
    return {
      linkage,
      source,
      target,
      program: program || undefined,
      adminEmail: adminEmail || 'admin@nexuscore.io',
      appUrl,
    };
  }, [linkage, source, target, program, adminEmail, appUrl]);

  const preview = useMemo(() => {
    if (!emailCtx) return null;
    return getEmailPreview(emailCtx, previewParty);
  }, [emailCtx, previewParty]);

  const handleSendToParty = async (party: 'source' | 'target') => {
    if (!emailCtx || !linkage) return;
    setSending(true);
    
    try {
      openMailtoForParty(emailCtx, party);
      
      // Mark as email sent in Firestore
      const linkageRef = doc(db, 'linkages', linkage.id);
      await updateDoc(linkageRef, {
        emailSent: true,
        emailSentAt: new Date().toISOString(),
        status: LinkageStatus.PENDING_APPROVAL,
        sourceResponse: linkage.sourceResponse || LinkageResponse.PENDING,
        targetResponse: linkage.targetResponse || LinkageResponse.PENDING,
        updatedAt: serverTimestamp(),
      });
      
      setSentTo(prev => new Set([...prev, party]));
    } catch (err) {
      console.error('Error updating linkage email status:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSendBoth = async () => {
    await handleSendToParty('source');
    setTimeout(() => handleSendToParty('target'), 600);
  };

  if (!isOpen || !linkage || !source || !target) return null;

  const sourceHasEmail = !!source.email;
  const targetHasEmail = !!target.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white max-w-2xl w-full border border-slate-200 shadow-2xl rounded-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Mail size={18} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800 tracking-tight">Send Proposal Email</h2>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Dual-Party Authorization Protocol</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-white/80 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Linkage Summary */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="px-2.5 py-1 bg-slate-900 text-white text-[9px] font-bold rounded-lg uppercase tracking-wider">
                {source.type}
              </div>
              <ArrowRight size={14} className="text-slate-300" />
              <div className="px-2.5 py-1 bg-blue-600 text-white text-[9px] font-bold rounded-lg uppercase tracking-wider">
                {target.type}
              </div>
              {program && (
                <div className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-lg uppercase">
                  {program.title}
                </div>
              )}
            </div>
            <div className="text-sm font-bold text-slate-800">{source.name} ⇌ {target.name}</div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">
              {linkage.type} • Confidence: {(linkage.engagementScore * 100).toFixed(1)}%
            </div>
          </div>

          {/* Two Party Cards */}
          <div className="px-6 py-5 grid grid-cols-2 gap-4">
            {/* Source Party */}
            <div className={`border rounded-xl p-4 transition-all ${sentTo.has('source') ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 hover:border-blue-200'}`}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Source Entity</span>
                {sentTo.has('source') && <CheckCircle size={14} className="text-emerald-500" />}
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">{source.name}</h4>
              <p className="text-[10px] text-slate-500 mb-1">{source.type.toUpperCase()} • {source.subType || 'N/A'}</p>
              <p className="text-[10px] text-slate-400 mb-3">{source.region}</p>
              
              <div className="flex items-center gap-1.5 mb-4">
                <Mail size={10} className={sourceHasEmail ? "text-blue-500" : "text-red-400"} />
                <span className={`text-[10px] font-medium ${sourceHasEmail ? 'text-slate-600' : 'text-red-500'}`}>
                  {source.email || 'No email set'}
                </span>
              </div>

              <button
                disabled={!sourceHasEmail || sending || sentTo.has('source')}
                onClick={() => handleSendToParty('source')}
                className={`w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  sentTo.has('source')
                    ? 'bg-emerald-100 text-emerald-700 cursor-default'
                    : !sourceHasEmail
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md active:scale-[0.98]'
                }`}
              >
                {sentTo.has('source') ? (
                  <><CheckCircle size={12} /> Email Opened</>
                ) : (
                  <><Send size={12} /> Send to Source</>
                )}
              </button>
            </div>

            {/* Target Party */}
            <div className={`border rounded-xl p-4 transition-all ${sentTo.has('target') ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 hover:border-blue-200'}`}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Target Entity</span>
                {sentTo.has('target') && <CheckCircle size={14} className="text-emerald-500" />}
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">{target.name}</h4>
              <p className="text-[10px] text-slate-500 mb-1">{target.type.toUpperCase()} • {target.subType || 'N/A'}</p>
              <p className="text-[10px] text-slate-400 mb-3">{target.region}</p>
              
              <div className="flex items-center gap-1.5 mb-4">
                <Mail size={10} className={targetHasEmail ? "text-blue-500" : "text-red-400"} />
                <span className={`text-[10px] font-medium ${targetHasEmail ? 'text-slate-600' : 'text-red-500'}`}>
                  {target.email || 'No email set'}
                </span>
              </div>

              <button
                disabled={!targetHasEmail || sending || sentTo.has('target')}
                onClick={() => handleSendToParty('target')}
                className={`w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  sentTo.has('target')
                    ? 'bg-emerald-100 text-emerald-700 cursor-default'
                    : !targetHasEmail
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md active:scale-[0.98]'
                }`}
              >
                {sentTo.has('target') ? (
                  <><CheckCircle size={12} /> Email Opened</>
                ) : (
                  <><Send size={12} /> Send to Target</>
                )}
              </button>
            </div>
          </div>

          {/* Email Preview Toggle */}
          <div className="px-6 pb-5">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Email Preview</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPreviewParty('source')}
                    className={`px-3 py-1 rounded text-[9px] font-bold uppercase transition-all ${
                      previewParty === 'source' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Source
                  </button>
                  <button
                    onClick={() => setPreviewParty('target')}
                    className={`px-3 py-1 rounded text-[9px] font-bold uppercase transition-all ${
                      previewParty === 'target' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Target
                  </button>
                </div>
              </div>
              {preview && (
                <div className="p-4 space-y-2">
                  <div className="flex gap-2 text-[10px]">
                    <span className="font-bold text-slate-400 uppercase w-12 shrink-0">To:</span>
                    <span className="text-slate-700 font-medium">{preview.to}</span>
                  </div>
                  <div className="flex gap-2 text-[10px]">
                    <span className="font-bold text-slate-400 uppercase w-12 shrink-0">Subj:</span>
                    <span className="text-slate-700 font-medium">{preview.subject}</span>
                  </div>
                  <div className="mt-3 bg-slate-50 border border-slate-100 rounded-lg p-3 max-h-48 overflow-auto">
                    <pre className="text-[10px] text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">{preview.body}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Warnings */}
          {(!sourceHasEmail || !targetHasEmail) && (
            <div className="px-6 pb-5">
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  {!sourceHasEmail && !targetHasEmail
                    ? 'Both entities are missing contact emails. Please update their profiles in the Entity Library before sending.'
                    : !sourceHasEmail
                    ? `Source entity "${source.name}" has no email. Please update the profile.`
                    : `Target entity "${target.name}" has no email. Please update the profile.`
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
          <p className="text-[9px] text-slate-400 uppercase tracking-widest">
            {linkage.emailSent ? '✓ Previously sent' : 'Ready to dispatch'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
            >
              Close
            </button>
            <button
              disabled={!sourceHasEmail || !targetHasEmail || sending}
              onClick={handleSendBoth}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-xs font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <Send size={14} />
              Send to Both Parties
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
