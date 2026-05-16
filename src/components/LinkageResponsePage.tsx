import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, ArrowLeft, Shield, Users, Building2, Globe, Sparkles, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Actor, Linkage, Program, LinkageResponse, LinkageStatus } from '../types';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface LinkageResponsePageProps {
  linkageId: string;
  party: 'source' | 'target';
  linkages: Linkage[];
  actors: Actor[];
  programs: Program[];
  userId: string;
  autoDecision?: 'accepted' | 'rejected' | null;
}

export default function LinkageResponsePage({ linkageId, party, linkages, actors, programs, userId, autoDecision }: LinkageResponsePageProps) {
  const [responding, setResponding] = useState(false);
  const [responseSubmitted, setResponseSubmitted] = useState(false);
  const [submittedAction, setSubmittedAction] = useState<'accepted' | 'rejected' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const linkage = useMemo(() => linkages.find(l => l.id === linkageId), [linkages, linkageId]);
  const source = useMemo(() => linkage ? actors.find(a => a.id === linkage.sourceId) : null, [linkage, actors]);
  const target = useMemo(() => linkage ? actors.find(a => a.id === linkage.targetId) : null, [linkage, actors]);
  const program = useMemo(() => linkage?.programId ? programs.find(p => p.id === linkage.programId) : null, [linkage, programs]);
  
  const currentParty = party === 'source' ? source : target;
  const otherParty = party === 'source' ? target : source;
  const currentResponse = party === 'source' ? linkage?.sourceResponse : linkage?.targetResponse;
  const otherResponse = party === 'source' ? linkage?.targetResponse : linkage?.sourceResponse;

  const alreadyResponded = currentResponse && currentResponse !== LinkageResponse.PENDING;
  const isOwner = currentParty?.ownerId === userId;
  const isAdmin = linkage?.createdById === userId;
  const canRespond = isOwner || isAdmin;

  // Auto-submit if decision is provided via URL
  useEffect(() => {
    if (autoDecision && linkage && !alreadyResponded && !responding && !responseSubmitted) {
      if (!canRespond) {
        console.warn('Auto-decision bypassed: User is not the owner nor the admin.');
        return;
      }
      console.log(`Auto-submitting decision: ${autoDecision}`);
      handleResponse(autoDecision);
    }
  }, [autoDecision, linkage, canRespond, alreadyResponded]);

  const handleResponse = async (action: 'accepted' | 'rejected') => {
    if (!linkage || responding) return;
    
    if (!canRespond) {
      setError('Permission Denied: You are not authorized to respond for this entity. Please ensure you are logged in with the correct account.');
      return;
    }

    setResponding(true);
    setError(null);

    try {
      const linkageRef = doc(db, 'linkages', linkage.id);
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      if (party === 'source') {
        updateData.sourceResponse = action;
        updateData.sourceRespondedAt = new Date().toISOString();
      } else {
        updateData.targetResponse = action;
        updateData.targetRespondedAt = new Date().toISOString();
      }

      // Determine new overall status based on both responses
      const myResponse = action;
      const theirResponse = otherResponse || LinkageResponse.PENDING;

      if (myResponse === LinkageResponse.REJECTED || theirResponse === LinkageResponse.REJECTED) {
        updateData.status = LinkageStatus.REJECTED;
      } else if (myResponse === LinkageResponse.ACCEPTED && theirResponse === LinkageResponse.ACCEPTED) {
        updateData.status = LinkageStatus.ACTIVE;
      } else {
        updateData.status = LinkageStatus.PENDING_APPROVAL;
      }

      await updateDoc(linkageRef, updateData);
      setResponseSubmitted(true);
      setSubmittedAction(action);
    } catch (err: any) {
      console.error('Error submitting response:', err);
      setError(err.message || 'Failed to submit response. Please try again or contact the administrator.');
    } finally {
      setResponding(false);
    }
  };

  if (!linkage) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-12">
        <AlertTriangle size={48} className="text-slate-200 mb-6" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Linkage Not Found</h2>
        <p className="text-sm text-slate-500 mb-8">The linkage you're trying to respond to doesn't exist or has been removed.</p>
      </div>
    );
  }

  // Already responded
  if (alreadyResponded && !responseSubmitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-12">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
          currentResponse === LinkageResponse.ACCEPTED ? 'bg-emerald-100' : 'bg-red-100'
        }`}>
          {currentResponse === LinkageResponse.ACCEPTED ? (
            <CheckCircle size={32} className="text-emerald-600" />
          ) : (
            <XCircle size={32} className="text-red-600" />
          )}
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Already Responded</h2>
        <p className="text-sm text-slate-500 mb-2">
          You have already <span className={`font-bold ${currentResponse === LinkageResponse.ACCEPTED ? 'text-emerald-600' : 'text-red-600'}`}>
            {currentResponse}
          </span> this proposal.
        </p>
        <p className="text-xs text-slate-400 mb-8">
          Other party status: <span className="font-bold">{otherResponse || 'pending'}</span>
        </p>
      </div>
    );
  }

  // Response submitted successfully
  if (responseSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-[60vh] flex flex-col items-center justify-center text-center p-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, delay: 0.1 }}
          className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-8 shadow-lg ${
            submittedAction === 'accepted'
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/20'
              : 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20'
          }`}
        >
          {submittedAction === 'accepted' ? (
            <CheckCircle size={40} className="text-white" />
          ) : (
            <XCircle size={40} className="text-white" />
          )}
        </motion.div>

        <h2 className="text-2xl font-bold text-slate-800 mb-3">
          {submittedAction === 'accepted' ? 'Proposal Accepted!' : 'Proposal Rejected'}
        </h2>
        
        <p className="text-sm text-slate-500 mb-2 max-w-md leading-relaxed">
          {submittedAction === 'accepted' ? (
            otherResponse === LinkageResponse.ACCEPTED ? (
              'Both parties have accepted! The linkage is now ACTIVE.'
            ) : (
              'Your acceptance has been recorded. Waiting for the other party to respond.'
            )
          ) : (
            'The linkage has been rejected and the status has been updated.'
          )}
        </p>

        {submittedAction === 'accepted' && otherResponse === LinkageResponse.ACCEPTED && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 px-6 py-3 bg-emerald-50 border border-emerald-200 rounded-xl"
          >
            <div className="flex items-center gap-2 text-emerald-700 text-sm font-bold">
              <Sparkles size={16} />
              Linkage Activated Successfully
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Main response form
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Partnership Proposal</h1>
          <p className="text-xs text-slate-500">Review and respond to this ecosystem linkage proposal</p>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700 shadow-sm"
          >
            <AlertTriangle size={18} className="shrink-0" />
            <p className="text-xs font-bold">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 rounded-2xl text-white relative overflow-hidden">
        <Sparkles className="absolute -right-4 -top-4 text-white/10" size={100} />
        <div className="flex items-center gap-3 mb-2">
          <Shield size={18} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Action Required</span>
        </div>
        <p className="text-sm leading-relaxed text-blue-100">
          As <strong className="text-white">{currentParty?.name}</strong>, you have been proposed a partnership linkage.
          Please review the details below and accept or reject this proposal.
        </p>
      </div>

      {/* Party Details */}
      <div className="grid grid-cols-2 gap-4">
        {/* Source */}
        <div className={`bg-white border-2 rounded-2xl p-5 transition-all ${
          party === 'source' ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">
              Source Entity {party === 'source' && '(You)'}
            </span>
            {party === 'source' && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-bold rounded-full uppercase">Your Role</span>
            )}
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {source?.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{source?.name}</h3>
              <p className="text-[10px] text-slate-500">{source?.type.toUpperCase()}</p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Globe size={12} className="text-slate-300" />
              <span>{source?.region}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 size={12} className="text-slate-300" />
              <span>{source?.subType || 'N/A'}</span>
            </div>
            <p className="text-slate-500 leading-relaxed mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px]">
              {source?.bio}
            </p>
            {source?.resources && (
              <div className="mt-2 px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg">
                Resources: {source.resources}
              </div>
            )}
          </div>
        </div>

        {/* Target */}
        <div className={`bg-white border-2 rounded-2xl p-5 transition-all ${
          party === 'target' ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">
              Target Entity {party === 'target' && '(You)'}
            </span>
            {party === 'target' && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-bold rounded-full uppercase">Your Role</span>
            )}
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {target?.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{target?.name}</h3>
              <p className="text-[10px] text-slate-500">{target?.type.toUpperCase()}</p>
            </div>
          </div>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Globe size={12} className="text-slate-300" />
              <span>{target?.region}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 size={12} className="text-slate-300" />
              <span>{target?.subType || 'N/A'}</span>
            </div>
            <p className="text-slate-500 leading-relaxed mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px]">
              {target?.bio}
            </p>
            {target?.resources && (
              <div className="mt-2 px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg">
                Resources: {target.resources}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Justification */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-blue-600" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">AI Matching Justification</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
          {linkage.aiJustification}
        </p>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Confidence</span>
            <span className="text-[10px] font-bold text-blue-600">{(linkage.engagementScore * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Type</span>
            <span className="text-[10px] font-bold text-slate-600">{linkage.type}</span>
          </div>
          {program && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Programme</span>
              <span className="text-[10px] font-bold text-slate-600">{program.title}</span>
            </div>
          )}
        </div>
      </div>

      {/* Response Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Response Status</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Clock size={16} className={currentResponse === LinkageResponse.PENDING ? 'text-amber-500 animate-pulse' : currentResponse === LinkageResponse.ACCEPTED ? 'text-emerald-500' : 'text-red-500'} />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{party === 'source' ? 'Your Response' : 'Source Response'}</p>
              <p className={`text-xs font-bold ${
                currentResponse === LinkageResponse.PENDING ? 'text-amber-600' : 
                currentResponse === LinkageResponse.ACCEPTED ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {(currentResponse || 'pending').toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Clock size={16} className={!otherResponse || otherResponse === LinkageResponse.PENDING ? 'text-amber-500 animate-pulse' : otherResponse === LinkageResponse.ACCEPTED ? 'text-emerald-500' : 'text-red-500'} />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Other Party</p>
              <p className={`text-xs font-bold ${
                !otherResponse || otherResponse === LinkageResponse.PENDING ? 'text-amber-600' : 
                otherResponse === LinkageResponse.ACCEPTED ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {(otherResponse || 'pending').toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          disabled={responding}
          onClick={() => handleResponse('rejected')}
          className="flex-1 py-4 bg-white border-2 border-red-200 text-red-600 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          <XCircle size={20} />
          {responding ? 'Processing...' : 'Reject Proposal'}
        </button>
        <button
          disabled={responding}
          onClick={() => handleResponse('accepted')}
          className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 active:scale-[0.98]"
        >
          <CheckCircle size={20} />
          {responding ? 'Processing...' : 'Accept Proposal'}
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
        <p className="text-[10px] text-blue-600 leading-relaxed">
          <strong>Both parties must accept</strong> for the linkage to be activated.
          If either party rejects, the linkage will be marked as rejected.
        </p>
      </div>

      <div className="pt-6 text-center">
        <p className="text-[10px] text-slate-400 font-mono">
          Linkage ID: {linkage.id} • Debug UID: {userId || 'Not Logged In'}
        </p>
      </div>
    </motion.div>
  );
}
