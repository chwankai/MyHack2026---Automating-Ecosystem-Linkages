import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Settings, 
  Link2, 
  LayoutDashboard, 
  Plus, 
  Search,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Globe,
  Building2,
  Mail,
  MoreVertical,
  Brain,
  Database,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, loginWithGoogle, logout, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, serverTimestamp, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { Actor, ActorType, Linkage, Program, LinkageStatus } from './types';
import { generateLinkageSuggestions } from './services/gemini';
import AddActorModal from './components/AddActorModal';
import AddProgramModal from './components/AddProgramModal';
import ProgramDetailsModal from './components/ProgramDetailsModal';
import ActorProfileModal from './components/ActorProfileModal';
import Matchmaker from './components/Matchmaker';

// --- Sub-components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-2 text-sm p-2 rounded cursor-pointer transition-colors border border-transparent ${
      active ? 'bg-slate-50 border-slate-200 text-slate-900 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:border-slate-200'
    }`}
  >
    <div className={`w-2 h-2 rounded ${active ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
    {label}
  </button>
);

const MetricCard = ({ label, value, trend, icon: Icon }: { label: string, value: string | number, trend?: string, icon: any }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
    <p className="text-xs text-slate-500 mb-1">{label}</p>
    <div className="flex items-end justify-between">
      <p className={`text-2xl font-bold ${trend?.includes('+') || trend === 'NEW' ? 'text-emerald-600' : 'text-slate-800'}`}>{value}</p>
      {trend && (
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trend}</span>
      )}
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'actors' | 'programs' | 'linkages'>('dashboard');
  const [actorTab, setActorTab] = useState<'all' | ActorType>('all');
  const [actors, setActors] = useState<Actor[]>([]);
  const [linkages, setLinkages] = useState<Linkage[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddActorModalOpen, setIsAddActorModalOpen] = useState(false);
  const [isAddProgramModalOpen, setIsAddProgramModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);

  const handleDeleteActor = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    const actor = actors.find(a => a.id === id);
    if (!actor) return;

    const isTiedToLinkage = linkages.some(l => l.sourceId === id || l.targetId === id);
    const isTiedToProgram = programs.some(p => p.partnerNames?.includes(actor.name));

    if (isTiedToLinkage || isTiedToProgram) {
      const reasons = [];
      if (isTiedToLinkage) reasons.push('a relationship linkage');
      if (isTiedToProgram) reasons.push('a programme blueprint');
      alert(`Cannot delete this entity. It is currently tied to ${reasons.join(' and ')}.`);
      return;
    }

    if (window.confirm('Are you sure you want to delete this entity?')) {
      await deleteDoc(doc(db, 'actors', id));
    }
  };

  const handleDeleteProgram = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this program?')) {
      await deleteDoc(doc(db, 'programs', id));
    }
  };

  const handleDeleteLinkage = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this linkage?')) {
      await deleteDoc(doc(db, 'linkages', id));
    }
  };

  const generateSampleData = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    
    const sampleActors = [
      { name: 'SkyNet AI', type: ActorType.COMPANY, subType: 'DeepTech', region: 'Silicon Valley', bio: 'Building the next gen of neural networks.' },
      { name: 'GreenFlow', type: ActorType.COMPANY, subType: 'CleanTech', region: 'Singapore', bio: 'Sustainable water management solutions.' },
      { name: 'Dr. Sarah Chen', type: ActorType.MENTOR, subType: 'Fintech', region: 'London', bio: 'Former VP at Goldman, 20y expertise.' },
      { name: 'James Wilson', type: ActorType.MENTOR, subType: 'DeepTech', region: 'Berlin', bio: 'Technical founder with 2 exits.' },
      { name: 'GovInvest', type: ActorType.PARTNER, subType: 'Venture', region: 'Global', bio: 'Strategic state-backed investment fund.', resources: '$500M Fund, Global Market Access, Regulatory Support' },
      { name: 'ScaleOps Services', type: ActorType.SERVICE_PROVIDER, subType: 'Legal/Compliance', region: 'New York', bio: 'Specialized regulatory advisory for SaaS.' }
    ];

    sampleActors.forEach(a => {
      const newDocRef = doc(collection(db, 'actors'));
      batch.set(newDocRef, {
        ...a,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {}
      });
    });

    const samplePrograms = [
      { title: 'Nexus Accelerator 2024', description: 'GTM for DeepTech companies', region: 'Global', active: true, createdBy: user.uid },
      { title: 'SEA Sustainability Cohort', description: 'Focused on SEA impact', region: 'SEA', active: true, createdBy: user.uid }
    ];

    samplePrograms.forEach(p => {
      const newDocRef = doc(collection(db, 'programs'));
      batch.set(newDocRef, p);
    });

    await batch.commit();
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;

    const handleSnapshotError = (error: any, path: string) => {
      console.error(`Firestore Snapshot Error (${path}):`, error);
      const errInfo = {
        error: error.message,
        operationType: 'list',
        path,
        authInfo: { userId: user.uid }
      };
      console.error('Detailed Error:', JSON.stringify(errInfo));
    };

    const unsubActors = onSnapshot(query(collection(db, 'actors')), 
      (snap) => {
        setActors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Actor)));
      },
      (error) => handleSnapshotError(error, 'actors')
    );
    
    const unsubLinkages = onSnapshot(query(collection(db, 'linkages')), 
      (snap) => {
        setLinkages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Linkage)));
      },
      (error) => handleSnapshotError(error, 'linkages')
    );
    
    const unsubPrograms = onSnapshot(query(collection(db, 'programs')), 
      (snap) => {
        setPrograms(snap.docs.map(d => ({ id: d.id, ...d.data() } as Program)));
      },
      (error) => handleSnapshotError(error, 'programs')
    );

    return () => {
      unsubActors();
      unsubLinkages();
      unsubPrograms();
    };
  }, [user]);

  if (loading) return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-blue-600 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">Initializing Core Database...</p>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen grid place-items-center bg-[#F3F4F6] font-sans">
      <div className="max-w-md w-full p-12 bg-white border border-slate-200 shadow-xl rounded-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white rounded-sm rotate-45"></div>
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-800">NexusCore</span>
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Ecosystem OS</h1>
        <p className="text-slate-50 mb-8 text-sm leading-relaxed">Automate relationship management at scale. Initialize your secure session to access the matrix.</p>
        <button 
          onClick={loginWithGoogle}
          className="w-full bg-blue-600 text-white py-4 font-bold text-sm tracking-wide rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          Initialize Access
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-[#F3F4F6] text-slate-900 font-sans overflow-hidden">
      {/* Sidebar - Now containing Logo and User controls */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 shrink-0">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-sm rotate-45"></div>
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800">
              NexusCore
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="px-3 py-1.5 border border-slate-100 rounded-lg text-[9px] font-bold uppercase bg-slate-50 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              System Live
            </div>
            
            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 overflow-hidden">
                <img src={user.photoURL || ''} className="w-6 h-6 rounded-full border border-slate-200 shrink-0" />
                <span className="text-[10px] font-bold text-slate-600 truncate">{user.displayName || 'User'}</span>
              </div>
              <button onClick={() => logout()} className="text-[8px] uppercase font-bold text-slate-400 hover:text-red-500 transition-colors">Out</button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">Active Context</h3>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm font-bold text-slate-800">Global Nexus Matrix</p>
            <p className="text-xs text-slate-500">{actors.length} Active Nodes</p>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">Workspace</h3>
          <div className="space-y-1">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
            <SidebarItem icon={Building2} label="Entity Library" active={view === 'actors'} onClick={() => setView('actors')} />
            <SidebarItem icon={Users} label="Programme Library" active={view === 'programs'} onClick={() => setView('programs')} />
            <SidebarItem icon={Link2} label="Relationship" active={view === 'linkages'} onClick={() => setView('linkages')} />
          </div>
        </div>

        <div className="mt-auto">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-[10px] font-bold text-blue-800 mb-1 uppercase underline decoration-blue-500/30">AI Efficiency Tip</p>
            <p className="text-[11px] leading-relaxed text-blue-600">Consider batching mentor matching for the new DeepTech cohort to optimize resource allocation.</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Workspace */}
        <main className="flex-1 p-10 overflow-auto flex flex-col gap-6">
          <AnimatePresence mode="wait">
              {view === 'dashboard' && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-end justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-800">Operational Overview</h1>
                      <p className="text-xs text-slate-500">Real-time propagation summary for regional ecosystem</p>
                    </div>
                    {/* Search and Quick Action */}
                    <div className="flex gap-3">
                       <button 
                        onClick={() => setIsAddActorModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
                      >
                        <Plus size={14} /> New Entity
                      </button>
                    </div>
                  </div>

                  {/* Top Stats */}
                  <div className="grid grid-cols-4 gap-4 shrink-0">
                    <MetricCard label="Total Entity" value={actors.length} trend="+12%" icon={Building2} />
                    <MetricCard label="Active Linkages" value={linkages.length} trend="89.4%" icon={Link2} />
                    <MetricCard label="Programs" value={programs.length} trend="Active" icon={Users} />
                    <MetricCard label="System Pending" value="0" trend="Clear" icon={Sparkles} />
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-6">
                      <div className="bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-tight">Recent Activity Log</h4>
                          <span className="text-[10px] text-slate-400">System latency: 42ms</span>
                        </div>
                        <div className="overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 uppercase font-bold">
                              <tr>
                                <th className="px-6 py-3">Linkage ID</th>
                                <th className="px-6 py-3">Source Role</th>
                                <th className="px-6 py-3">Relationship Type</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="text-[11px] text-slate-600 divide-y divide-slate-50">
                              {linkages.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-300 font-mono">No propagation events detected</td></tr>
                              ) : (
                                linkages.slice(0, 8).map(link => (
                                  <tr key={link.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-3 font-mono text-slate-400">#{link.id.slice(0, 8)}</td>
                                    <td className="px-6 py-3 text-slate-800 font-medium">{link.type.split('_')[0]}</td>
                                    <td className="px-6 py-3">{link.type}</td>
                                    <td className="px-6 py-3">
                                      <span className={`px-2 py-0.5 rounded-full font-bold ${link.status === LinkageStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {link.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                      <button onClick={(e) => handleDeleteLinkage(e, link.id)} className="text-slate-400 hover:text-red-500 transition-colors inline-flex">
                                        <Trash2 size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden group">
                        <Sparkles className="absolute -right-4 -top-4 text-white/10 group-hover:text-blue-500/20 transition-all duration-700" size={140} />
                        <h3 className="text-[10px] font-bold tracking-widest uppercase mb-4 text-blue-400">Nexus AI Engine</h3>
                        <p className="text-sm leading-relaxed mb-6 text-slate-300">
                          "Matching algorithms successfully updated to favor cross-regional technical mentorship patterns for Series A ventures."
                        </p>
                        <button onClick={() => setView('linkages')} className="w-full bg-white/10 border border-white/20 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all">
                          Optimize Linkages
                        </button>
                      </div>

                      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                        <h3 className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-4">Network Connectivity</h3>
                        <div className="h-6 flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden border border-slate-100 mb-3">
                          <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: '84%' }} />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                          <span>Health Score</span>
                          <span className="text-blue-600">84.2</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {view === 'actors' && (
                <motion.div 
                  key="actors"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <h1 className="text-2xl font-bold text-slate-800">Entity Library</h1>
                        <p className="text-xs text-slate-500">Managing first-class nodes in the global topology</p>
                      </div>
                      <div className="flex gap-2">
                        {actors.length === 0 && (
                          <button onClick={generateSampleData} className="px-4 py-2 border border-slate-200 bg-white text-xs font-bold rounded-lg hover:bg-slate-50">Populate Initial Matrix</button>
                        )}
                        <button onClick={() => setIsAddActorModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700">Register Node</button>
                      </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-1 border-b border-slate-200">
                      {[
                        { id: 'all', label: 'All Entities' },
                        { id: ActorType.MENTOR, label: 'Mentors' },
                        { id: ActorType.PARTNER, label: 'Partners' },
                        { id: ActorType.COMPANY, label: 'Companies' },
                        { id: ActorType.SERVICE_PROVIDER, label: 'Providers' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActorTab(tab.id as any)}
                          className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${
                            actorTab === tab.id 
                              ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="grid grid-cols-6 p-4 border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400">
                      <div className="col-span-2">Node Identifier</div>
                      <div>Configuration</div>
                      <div>Regional ID</div>
                      <div>Specialization</div>
                      <div className="text-right">Action</div>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {actors.filter(a => actorTab === 'all' || a.type === actorTab).length === 0 ? (
                        <div className="p-16 text-center text-slate-300 font-mono">Zero nodes matching filter in current topology</div>
                      ) : (
                        actors
                          .filter(a => actorTab === 'all' || a.type === actorTab)
                          .map(actor => (
                          <div key={actor.id} className="grid grid-cols-6 p-4 items-center hover:bg-slate-50/50 transition-colors">
                            <div className="col-span-2 flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                actor.type === ActorType.COMPANY ? 'bg-emerald-50 text-emerald-600' :
                                actor.type === ActorType.MENTOR ? 'bg-blue-50 text-blue-600' : 
                                actor.type === ActorType.PARTNER ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'
                              }`}>
                                {actor.name.charAt(0)}
                              </div>
                              <div>
                                <button onClick={() => setSelectedActor(actor)} className="text-sm font-bold text-slate-800 hover:text-blue-600 hover:underline text-left">{actor.name}</button>
                                <div className="text-[10px] text-slate-400 font-mono">#{actor.id.slice(0, 8)}</div>
                              </div>
                            </div>
                            <div className="text-[10px] uppercase font-bold text-slate-500">{actor.type}</div>
                            <div className="text-xs text-slate-600 flex items-center gap-1">
                              <Globe size={12} className="text-slate-300" /> {actor.region}
                            </div>
                            <div className="text-xs font-sans text-slate-500">
                              {actor.subType}
                              {actor.type === ActorType.PARTNER && actor.resources && (
                                <div className="mt-1 text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                                  Assets: {actor.resources.length > 30 ? actor.resources.slice(0, 30) + '...' : actor.resources}
                                </div>
                              )}
                            </div>
                            <div className="text-right flex items-center justify-end gap-3">
                               <button onClick={() => setView('linkages')} className="text-xs font-bold text-blue-600 hover:underline">Link</button>
                               <button onClick={(e) => handleDeleteActor(e, actor.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                 <Trash2 size={14} />
                               </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {view === 'programs' && (
                <motion.div 
                  key="programs"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-800">Program Registry</h1>
                      <p className="text-xs text-slate-500">Initiative blueprints for structured ecosystem growth</p>
                    </div>
                    <button 
                      onClick={() => setIsAddProgramModalOpen(true)}
                      className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
                    >
                      New Blueprint
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {programs.length === 0 ? (
                       <div className="col-span-3 p-20 text-center border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center">
                          <Users size={32} className="text-slate-200 mb-4" />
                          <p className="text-slate-400 text-sm font-sans mb-6">No program blueprints defined in matrix</p>
                          <button 
                            onClick={generateSampleData}
                            className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
                          >
                            Populate Sample Programs
                          </button>
                       </div>
                    ) : (
                      programs.map(p => {
                        return (
                          <div key={p.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col hover:border-blue-300 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                {p.active ? 'Running' : 'Paused'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="bg-slate-50 px-2 py-0.5 rounded text-[8px] font-bold text-slate-400">PTRS: {p.partnerNames?.length || 0}</span>
                                <span className="text-[10px] text-slate-400 uppercase font-bold">{p.region}</span>
                              </div>
                            </div>
                            <h3 className="font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{p.title}</h3>
                            <p className="text-xs text-slate-500 font-sans mb-6 leading-relaxed">
                              {p.description}
                            </p>
                            
                            {p.partnerNames && p.partnerNames.length > 0 && (
                              <div className="mb-6 space-y-2">
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1">Linked Partners</p>
                                <div className="flex flex-wrap gap-1">
                                  {p.partnerNames.map((name, i) => (
                                    <div key={i} className="text-[9px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold border border-blue-100">
                                      {name}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                              <span className="text-[10px] text-slate-400 font-mono">v1.2 Active</span>
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => setSelectedProgram(p)}
                                  className="text-[10px] font-bold text-blue-600 uppercase hover:underline"
                                >
                                  Configuration
                                </button>
                                <button onClick={(e) => handleDeleteProgram(e, p.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {view === 'linkages' && (
                <motion.div 
                  key="linkages"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="space-y-6 h-full flex flex-col"
                >
                  <div className="flex justify-between items-end shrink-0">
                    <div>
                      <h1 className="text-2xl font-bold text-slate-800">Relationship Architect</h1>
                      <p className="text-xs text-slate-500">Automated linkage discovery and ecosystem topology</p>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 flex gap-6">
                    <div className="w-1/3 overflow-auto pr-2 pb-8">
                        <Matchmaker actors={actors} programs={programs} userId={user.uid} />
                    </div>
                    <div className="w-2/3 overflow-auto pb-8">
                      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Linkage Propagation Ledger</h4>
                          <div className="flex gap-1">
                            {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />)}
                          </div>
                        </div>
                        <div className="flex-1 overflow-auto divide-y divide-slate-50">
                          {linkages.length === 0 ? (
                             <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                <Link2 size={32} className="text-slate-100 mb-4" />
                                <p className="text-slate-300 font-sans">Zero active linkages in current architect session</p>
                             </div>
                          ) : (
                            linkages.map(link => {
                              const source = actors.find(a => a.id === link.sourceId);
                              const target = actors.find(a => a.id === link.targetId);
                              const program = programs.find(p => p.id === link.programId);
                              return (
                                <div key={link.id} className="p-6 hover:bg-slate-50/50 transition-colors group">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className="px-2 py-1 bg-slate-900 text-white text-[9px] font-bold rounded uppercase">
                                        {source?.type}
                                      </div>
                                      <ArrowRight size={12} className="text-slate-300" />
                                      <div className="px-2 py-1 bg-blue-600 text-white text-[9px] font-bold rounded uppercase">
                                        {target?.type}
                                      </div>
                                      {program && (
                                        <>
                                           <div className="w-1 h-1 bg-slate-200 rounded-full mx-1" />
                                           <div className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-bold rounded uppercase flex items-center gap-1">
                                             <Users size={8} /> {program.title}
                                           </div>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${link.status === LinkageStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {link.status}
                                      </div>
                                      <button onClick={(e) => handleDeleteLinkage(e, link.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex gap-4 items-start">
                                    <div className="flex-1">
                                      <div className="text-sm font-bold text-slate-800 mb-1">{source?.name} ⇌ {target?.name}</div>
                                      <div className="text-[10px] font-mono text-slate-400 mb-4">{link.type} • Confidence: {link.engagementScore?.toFixed(2)}</div>
                                      <div className="text-xs font-sans text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 group-hover:bg-white transition-colors relative">
                                        <div className="absolute -left-2 top-4 w-1 h-8 bg-blue-500 opacity-20" />
                                        {link.aiJustification}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </main>

        {/* Footer Status Bar */}
        <footer className="h-8 bg-slate-900 text-white/50 px-8 flex items-center justify-between text-[10px] uppercase tracking-widest shrink-0 font-mono">
          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Topology: Stable
            </div>
            <span>Nodes: {actors.length}</span>
            <span>Active Linkages: {linkages.length}</span>
          </div>
          <div className="flex gap-6">
            <span className="text-slate-500">Session ID: <span className="text-slate-300">ADMIN-{user.uid.slice(0, 8)}</span></span>
            <span className="text-blue-400">v2.4.1-STABLE</span>
          </div>
        </footer>
      </div>

      <AddActorModal 
        isOpen={isAddActorModalOpen} 
        onClose={() => setIsAddActorModalOpen(false)} 
        userId={user.uid} 
        programs={programs}
      />

      <AddProgramModal
        isOpen={isAddProgramModalOpen}
        onClose={() => setIsAddProgramModalOpen(false)}
        userId={user.uid}
        actors={actors}
      />

      <ProgramDetailsModal
        program={selectedProgram}
        onClose={() => setSelectedProgram(null)}
        associatedLinkages={linkages.filter(l => l.programId === selectedProgram?.id)}
        actors={actors}
      />

      <ActorProfileModal
        actor={selectedActor}
        onClose={() => setSelectedActor(null)}
        associatedLinkages={linkages.filter(l => l.sourceId === selectedActor?.id || l.targetId === selectedActor?.id)}
        programs={programs}
      />
    </div>
  );
}
