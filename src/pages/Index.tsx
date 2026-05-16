import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Shield, Search, Plus, AlertCircle, LogOut, LogIn, Lock,
  Users, Trash2, UserPlus, Activity, Database, Cpu, X, ChevronRight, Eye, EyeOff
} from 'lucide-react';
import { useMSMEStore } from '@/hooks/use-msme-store';
import { isValidGSTIN } from '@/lib/csv-store';
import { useAuthStore } from '@/hooks/use-auth';
import { login, fetchUsers, createUser, deleteUser, AppUser } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────
// Animated glow orbs used as 3D background
const Orb = ({ className }: { className: string }) => (
  <div className={`absolute rounded-full blur-[130px] pointer-events-none ${className}`} />
);

// ─────────────────────────────────────────────────────────
// Login Modal
const LoginModal = ({
  onClose,
  onLogin,
}: {
  onClose: () => void;
  onLogin: (username: string, password: string) => Promise<void>;
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await onLogin(username, password);
    } catch (e: any) {
      setErr(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative bg-[#0d1117] border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent rounded-t-3xl" />
        <button className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Lock size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Staff Login</h2>
            <p className="text-xs text-slate-500">Authenticate to manage MSME data</p>
          </div>
        </div>

        {err && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-sm text-red-400">
            <AlertCircle size={14} /> {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block tracking-wider uppercase">Username</label>
            <Input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white rounded-xl h-12 focus-visible:ring-violet-500/50 focus-visible:border-violet-500"
              placeholder="admin / analyst1 / viewer1"
            />
          </div>
          <div className="relative">
            <label className="text-xs text-slate-400 mb-1.5 block tracking-wider uppercase">Password</label>
            <Input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white rounded-xl h-12 pr-12 focus-visible:ring-violet-500/50 focus-visible:border-violet-500"
              placeholder="password123"
            />
            <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-[38px] text-slate-400 hover:text-white">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/20 transition-all"
          >
            {loading ? 'Authenticating...' : 'Sign In →'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Demo Accounts</p>
          {[
            { u: 'admin', r: 'Admin', color: 'text-violet-400' },
            { u: 'analyst1', r: 'Analyst', color: 'text-blue-400' },
            { u: 'viewer1', r: 'Viewer', color: 'text-emerald-400' },
          ].map(({ u, r, color }) => (
            <div key={u} className="flex justify-between text-xs">
              <span className="text-slate-400 font-mono">
                <span className="text-slate-300">{u}</span> / password123
              </span>
              <span className={`${color} font-semibold`}>{r}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────
// Admin Panel - User Management
const AdminPanel = ({ onClose, token }: { onClose: () => void; token: string | null }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'viewer' });
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => setErr('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setCreating(true);
    try {
      const u = await createUser(newUser.username, newUser.password, newUser.role);
      setUsers(prev => [...prev, u]);
      setNewUser({ username: '', password: '', role: 'viewer' });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (username: string) => {
    try {
      await deleteUser(username);
      setUsers(prev => prev.filter(u => u.username !== username));
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    analyst: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    viewer: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9 }}
        className="relative bg-[#0d1117] border border-slate-800 rounded-3xl p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent rounded-t-3xl" />
        <button className="absolute top-5 right-5 text-slate-500 hover:text-white" onClick={onClose}><X size={18} /></button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">User Management</h2>
            <p className="text-xs text-slate-500">Create, view and delete staff accounts</p>
          </div>
        </div>

        {err && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{err}</div>
        )}

        {/* Create User Form */}
        <form onSubmit={handleCreate} className="mb-8 p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <UserPlus size={14} /> Add New Account
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <Input
              value={newUser.username}
              onChange={(e) => setNewUser(p => ({ ...p, username: e.target.value }))}
              placeholder="Username"
              className="bg-slate-950 border-slate-800 text-white rounded-xl h-11"
            />
            <Input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser(p => ({ ...p, password: e.target.value }))}
              placeholder="Password"
              className="bg-slate-950 border-slate-800 text-white rounded-xl h-11"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser(p => ({ ...p, role: e.target.value }))}
              className="bg-slate-950 border border-slate-800 text-white rounded-xl h-11 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="viewer">Viewer</option>
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button
            type="submit"
            disabled={creating || !newUser.username || !newUser.password}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white text-sm h-10 px-6 rounded-xl"
          >
            {creating ? 'Creating...' : 'Create User'}
          </Button>
        </form>

        {/* User List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-slate-500 py-8">Loading users...</div>
          ) : users.map((u) => (
            <div key={u.username} className="flex items-center gap-4 p-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(u.full_name || u.username).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{u.full_name || u.username}</p>
                <p className="text-slate-500 text-xs font-mono">{u.username} · {u.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${roleColors[u.role] || 'bg-slate-700 text-slate-300'}`}>
                {u.role}
              </span>
              {u.username !== 'admin' && (
                <button
                  onClick={() => handleDelete(u.username)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────
// Main Index Page
const Index = () => {
  const navigate = useNavigate();
  const { find } = useMSMEStore();
  const { isAuthenticated, user, setAuth, logout, isAdmin } = useAuthStore();
  const [gstin, setGstin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const { token } = useAuthStore();

  const ROLE_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    admin: { label: 'Admin', color: 'text-violet-400 bg-violet-500/10 border-violet-500/30', dot: 'bg-violet-400' },
    analyst: { label: 'Analyst', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', dot: 'bg-blue-400' },
    viewer: { label: 'Viewer', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
  };

  const handleLogin = async (username: string, password: string) => {
    const data = await login(username, password);
    setAuth(data.access_token, { username: data.username, role: data.role });
    setShowLogin(false);
  };

  const handleCheckScore = async () => {
    setError(null);
    const trimmed = gstin.trim().toUpperCase();
    if (!trimmed) { setError('Please enter a GSTIN'); return; }
    if (!isValidGSTIN(trimmed)) { setError('Invalid GSTIN format. Must be 15 characters.'); return; }
    setIsSearching(true);
    const record = await find(trimmed);
    setIsSearching(false);
    if (record) {
      navigate(`/dashboard/${trimmed}`);
    } else {
      setError('No MSME record found for this GSTIN. Add it first.');
    }
  };

  const handleAddUpdate = async () => {
    setError(null);
    const trimmed = gstin.trim().toUpperCase();
    if (!trimmed) { navigate('/msme/new'); return; }
    if (!isValidGSTIN(trimmed)) { setError('Invalid GSTIN format.'); return; }
    const record = await find(trimmed);
    if (record) {
      navigate(`/msme/edit/${trimmed}`);
    } else {
      navigate(`/msme/new?gstin=${trimmed}`);
    }
  };

  const roleConf = user?.role ? ROLE_CONFIG[user.role] : null;

  const stats = [
    { icon: <Database size={18} />, label: 'Feature Store', value: 'SQLite + SQLAlchemy', color: 'text-violet-400' },
    { icon: <Cpu size={18} />, label: 'ML Engine', value: 'RandomForest + scikit-learn', color: 'text-blue-400' },
    { icon: <Activity size={18} />, label: 'Data Sources', value: 'AA + GSTN + Bureau', color: 'text-emerald-400' },
  ];

  return (
    <div className="min-h-screen bg-[#060b14] text-white font-sans overflow-x-hidden">
      {/* Background glow orbs */}
      <Orb className="w-[600px] h-[600px] bg-violet-600/15 top-[-200px] left-[-150px]" />
      <Orb className="w-[500px] h-[500px] bg-indigo-700/15 bottom-[-200px] right-[-100px]" />
      <Orb className="w-[300px] h-[300px] bg-blue-600/10 top-[40%] right-[10%]" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#060b14]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Shield size={17} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">CreditScore AI</span>
              <span className="ml-2 text-[10px] uppercase tracking-widest text-violet-400 font-semibold bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">ML-Powered</span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated() ? (
              <>
                {/* User chip */}
                <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/50 border border-slate-800 rounded-full">
                  <div className={`w-2 h-2 rounded-full ${roleConf?.dot}`}></div>
                  <span className="text-sm text-slate-300">{user?.username}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${roleConf?.color}`}>
                    {roleConf?.label}
                  </span>
                </div>
                {/* Admin panel button */}
                {isAdmin() && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAdmin(true)}
                    className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 rounded-xl h-9 gap-2"
                  >
                    <Users size={14} /> Users
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={logout}
                  className="text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl h-9 gap-2"
                >
                  <LogOut size={14} /> Logout
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => setShowLogin(true)}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white font-semibold rounded-xl h-9 gap-2 shadow-md shadow-violet-500/20"
              >
                <LogIn size={14} /> Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="max-w-5xl mx-auto px-6 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-sm font-medium mb-8">
            <Activity size={13} />
            Enterprise AI Scoring Engine · Real-World Fintech Architecture
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Invisible Risk,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400">
              Made Visible.
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-14 leading-relaxed">
            Machine-learning credit scoring for MSMEs — powered by Account Aggregator signals,
            GSTN compliance data, and a trained RandomForest model. No collateral. No paperwork.
          </p>

          {/* ── Search Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto max-w-xl"
          >
            {/* Glow behind card */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-violet-600/20 to-transparent blur-2xl -z-10 scale-110" />

            <div className="bg-[#0d1421]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <label className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3 block text-left">
                GSTIN Query
              </label>
              <div className="relative mb-5">
                <Input
                  type="text"
                  value={gstin}
                  onChange={(e) => { setGstin(e.target.value.toUpperCase()); setError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckScore()}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  maxLength={15}
                  className="h-14 text-base font-mono tracking-widest bg-slate-950 border-slate-800 text-white rounded-2xl pr-16 focus-visible:ring-violet-500/50 focus-visible:border-violet-500 placeholder:text-slate-700"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-mono">
                  {gstin.length}/15
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-5 text-sm text-red-300"
                  >
                    <AlertCircle size={14} className="flex-shrink-0" /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={handleCheckScore}
                  disabled={isSearching}
                  className="h-13 py-3.5 text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl shadow-lg shadow-violet-500/25 transition-all gap-2"
                >
                  {isSearching ? (
                    <span className="animate-pulse">Querying ML Engine...</span>
                  ) : (
                    <><Search size={16} /> Analyze Signals</>
                  )}
                </Button>

                {isAdmin() ? (
                  <Button
                    onClick={handleAddUpdate}
                    variant="outline"
                    className="h-13 py-3.5 text-sm font-semibold border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-200 rounded-2xl gap-2 transition-all"
                  >
                    <Plus size={16} /> Manage Entity
                  </Button>
                ) : (
                  <div className="relative group">
                    <Button
                      disabled
                      variant="outline"
                      className="w-full h-13 py-3.5 text-sm font-semibold border-slate-800 text-slate-600 rounded-2xl gap-2 cursor-not-allowed"
                    >
                      <Lock size={16} /> Admin Only
                    </Button>
                    {!isAuthenticated() && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Login as admin to edit
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-center text-xs text-slate-600 mt-4">
                Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 font-mono text-[10px]">Enter</kbd> to search · 15-character GSTIN required
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Architecture Stats ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {stats.map((s, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4, scale: 1.02 }}
              className="p-6 bg-[#0d1421]/60 border border-white/5 rounded-2xl backdrop-blur-md shadow-lg hover:border-white/10 transition-colors"
            >
              <div className={`mb-3 ${s.color}`}>{s.icon}</div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">{s.label}</p>
              <p className="text-white font-semibold text-sm">{s.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── How it Works Section ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-24"
        >
          <h2 className="text-center text-xs text-slate-500 uppercase tracking-widest font-semibold mb-10">
            Real-World Fintech Architecture
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {[
              { n: '01', title: 'Data Ingestion', desc: 'AA + GSTN + Bureau signals pulled via APIs' },
              { n: '02', title: 'Feature Engineering', desc: 'Raw signals → 11 normalized ML features in SQLite' },
              { n: '03', title: 'ML Inference', desc: 'RandomForest model predicts score (0-100) + confidence' },
              { n: '04', title: 'Decision Engine', desc: 'Score + policy rules → Lending readiness verdict' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="p-5 bg-[#0d1421]/60 border border-white/5 rounded-2xl text-center w-48">
                  <span className="text-xs font-mono text-violet-500 font-bold">{step.n}</span>
                  <h3 className="text-white font-semibold text-sm mt-1 mb-1">{step.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
                </div>
                {i < 3 && (
                  <ChevronRight size={16} className="text-slate-700 hidden sm:block flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 mt-4">
        <p className="text-center text-slate-600 text-xs">
          CreditScore AI · FastAPI ML Backend · SQLite Feature Store · RandomForestRegressor v1.0
        </p>
      </footer>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />}
        {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} token={token} />}
      </AnimatePresence>
    </div>
  );
};

export default Index;
