import React, { useState, useEffect, useCallback } from 'react';
import Link from '@/components/SmartLink';
import { createClient } from '@/lib/supabase/client';
import { getCurrentUser, isAdmin } from '@/lib/portfolioStore';
import { checkIsAdmin } from '@/lib/adminAuth';
import { sendKYCApprovedEmail, sendKYCRejectedEmail } from '@/lib/emailService';

// ── Types ─────────────────────────────────────────────────────────────────────

type PageView = 'users' | 'kyc_detail' | 'balance';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface KYCSubmission {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  country: string | null;
  street_address: string | null;
  city: string | null;
  zip_code: string | null;
  id_type: string | null;
  id_number: string | null;
  id_document_url: string | null;
  id_document_back_url: string | null;
  address_proof_url: string | null;
  investor_type: string | null;
  annual_income: string | null;
  investment_experience: string | null;
  income_document_url: string | null;
  kyc_status: 'pending' | 'under_review' | 'approved' | 'rejected';
  admin_notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
}

interface UserPortfolioRow {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  stats: {
    totalPortfolio: string;
    activeInvestments: number;
    totalReturns: string;
    referralEarnings: string;
    portfolioChange: string;
    returnsChange: string;
  };
}

interface EnrichedUser {
  profile: UserProfile;
  kyc: KYCSubmission | null;
  portfolio: UserPortfolioRow | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const KYC_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', dot: 'bg-yellow-400' },
  under_review: { label: 'Under Review', color: 'text-zinc-300', bg: 'bg-zinc-300/10 border-zinc-300/20', dot: 'bg-zinc-300' },
  approved: { label: 'Approved', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20', dot: 'bg-green-400' },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', dot: 'bg-red-400' },
  none: { label: 'No KYC', color: 'text-[#6B7280]', bg: 'bg-[#12131A] border-[#1E2027]', dot: 'bg-[#52525B]' },
};

type KYCFilterType = 'all' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'none';

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [view, setView] = useState<PageView>('users');

  // Users data
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [kycFilter, setKycFilter] = useState<KYCFilterType>('all');

  // Selected user
  const [selectedUser, setSelectedUser] = useState<EnrichedUser | null>(null);

  // KYC review state
  const [kycNotes, setKycNotes] = useState('');
  const [kycSaving, setKycSaving] = useState(false);
  const [kycSaved, setKycSaved] = useState(false);

  // Balance adjustment state
  const [balanceForm, setBalanceForm] = useState({
    totalPortfolio: '',
    totalReturns: '',
    referralEarnings: '',
    activeInvestments: '',
    portfolioChange: '',
    returnsChange: '',
  });
  const [balanceSaving, setBalanceSaving] = useState(false);
  const [balanceSaved, setBalanceSaved] = useState(false);
  const [balanceNote, setBalanceNote] = useState('');

  // Canonical wallet balance state
  const [currentWallet, setCurrentWallet] = useState(0);
  const [walletInput, setWalletInput] = useState('');
  const [walletSaving, setWalletSaving] = useState(false);
  const [walletMsg, setWalletMsg] = useState('');


  // ── Auth ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    setMounted(true);
    const currentUser = getCurrentUser();
    void checkIsAdmin().then((ok) => { if (ok) setAuthorized(true); });
    {
      loadUsers();
    }
  }, []);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const supabase = createClient();

      const [profilesRes, kycRes, portfoliosRes] = await Promise.all([
        supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('kyc_submissions').select('*').order('submitted_at', { ascending: false }),
        supabase.from('user_portfolios').select('id, user_id, user_email, user_name, stats'),
      ]);

      const profiles: UserProfile[] = profilesRes.data ?? [];
      const kycList: KYCSubmission[] = kycRes.data ?? [];
      const portfolios: UserPortfolioRow[] = portfoliosRes.data ?? [];

      const enriched: EnrichedUser[] = profiles.map((profile) => ({
        profile,
        kyc: kycList.find((k) => k.user_id === profile.id) ?? null,
        portfolio: portfolios.find((p) => p.user_id === profile.id) ?? null,
      }));

      setUsers(enriched);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    }
    setLoading(false);
  }, []);

  // ── KYC actions ─────────────────────────────────────────────────────────────

  async function updateKYCStatus(status: KYCSubmission['kyc_status']) {
    if (!selectedUser?.kyc) return;
    setKycSaving(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('kyc_submissions')
        .update({
          kyc_status: status,
          admin_notes: kycNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedUser.kyc.id);

      if (updateError) throw updateError;

      // Update local state
      const updatedKyc = { ...selectedUser.kyc, kyc_status: status, admin_notes: kycNotes };
      const updatedUser = { ...selectedUser, kyc: updatedKyc };
      setSelectedUser(updatedUser);
      setUsers((prev) =>
        prev.map((u) => (u.profile.id === selectedUser.profile.id ? updatedUser : u))
      );
      setKycSaved(true);
      setTimeout(() => setKycSaved(false), 3000);

      if (status === 'approved' && selectedUser.profile.email) {
        sendKYCApprovedEmail(
          selectedUser.profile.email,
          selectedUser.profile.full_name || 'Investor',
          kycNotes || undefined
        ).catch(console.error);
      } else if (status === 'rejected' && selectedUser.profile.email) {
        sendKYCRejectedEmail(
          selectedUser.profile.email,
          selectedUser.profile.full_name || 'Investor',
          kycNotes || undefined
        ).catch(console.error);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update KYC');
    }
    setKycSaving(false);
  }

  // ── Balance adjustment ───────────────────────────────────────────────────────

  function openBalanceView(user: EnrichedUser) {
    setSelectedUser(user);
    const stats = user.portfolio?.stats;
    setBalanceForm({
      totalPortfolio: stats?.totalPortfolio ?? '$0',
      totalReturns: stats?.totalReturns ?? '$0',
      referralEarnings: stats?.referralEarnings ?? '$0',
      activeInvestments: String(stats?.activeInvestments ?? 0),
      portfolioChange: stats?.portfolioChange ?? '$0 (0%)',
      returnsChange: stats?.returnsChange ?? '$0 this month',
    });
    setBalanceNote('');
    setBalanceSaved(false);
    setWalletMsg('');
    setCurrentWallet(0);
    setWalletInput('');
    setView('balance');
    void loadWallet(user.profile.id);
  }

  async function loadWallet(uid: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from('user_balance')
      .select('available_balance')
      .eq('user_id', uid)
      .maybeSingle();
    const bal = Number(data?.available_balance ?? 0);
    setCurrentWallet(bal);
    setWalletInput(String(bal));
  }

  async function saveWalletBalance() {
    if (!selectedUser) return;
    const next = Number(walletInput);
    if (!Number.isFinite(next) || next < 0) { setWalletMsg('Enter a valid balance'); return; }
    setWalletSaving(true);
    setWalletMsg('');
    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc('admin_set_wallet_balance', {
        _user_id: selectedUser.profile.id,
        _available: next,
        _note: balanceNote || null,
      });
      if (rpcError) throw rpcError;
      const res = data as { ok: boolean; error?: string; delta?: number } | null;
      if (!res?.ok) throw new Error(res?.error ?? 'Update failed');
      setCurrentWallet(next);
      setWalletMsg(`Wallet updated (${Number(res.delta ?? 0) >= 0 ? '+' : ''}${Number(res.delta ?? 0).toFixed(2)})`);
    } catch (err) {
      setWalletMsg(err instanceof Error ? err.message : 'Failed to update wallet');
    }
    setWalletSaving(false);
  }


  async function saveBalanceAdjustment() {
    if (!selectedUser) return;
    setBalanceSaving(true);
    try {
      const supabase = createClient();
      const newStats = {
        totalPortfolio: balanceForm.totalPortfolio,
        totalReturns: balanceForm.totalReturns,
        referralEarnings: balanceForm.referralEarnings,
        activeInvestments: Number(balanceForm.activeInvestments),
        portfolioChange: balanceForm.portfolioChange,
        returnsChange: balanceForm.returnsChange,
      };

      if (selectedUser.portfolio) {
        // Update existing portfolio
        const { error: updateError } = await supabase
          .from('user_portfolios')
          .update({ stats: newStats })
          .eq('user_id', selectedUser.profile.id);
        if (updateError) throw updateError;
      } else {
        // Create new portfolio row
        const { error: insertError } = await supabase.from('user_portfolios').insert({
          user_id: selectedUser.profile.id,
          user_email: selectedUser.profile.email,
          user_name: selectedUser.profile.full_name || selectedUser.profile.email,
          stats: newStats,
        });
        if (insertError) throw insertError;
      }

      // Update local state
      const updatedPortfolio: UserPortfolioRow = {
        id: selectedUser.portfolio?.id ?? '',
        user_id: selectedUser.profile.id,
        user_email: selectedUser.profile.email,
        user_name: selectedUser.profile.full_name,
        stats: newStats,
      };
      const updatedUser = { ...selectedUser, portfolio: updatedPortfolio };
      setSelectedUser(updatedUser);
      setUsers((prev) =>
        prev.map((u) => (u.profile.id === selectedUser.profile.id ? updatedUser : u))
      );
      setBalanceSaved(true);
      setTimeout(() => setBalanceSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save balance');
    }
    setBalanceSaving(false);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function openKYCDetail(user: EnrichedUser) {
    setSelectedUser(user);
    setKycNotes(user.kyc?.admin_notes ?? '');
    setKycSaved(false);
    setView('kyc_detail');
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getInitials(name: string, email: string) {
    const src = name || email;
    return src.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  }

  // ── Filtered users ───────────────────────────────────────────────────────────

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    if (q && !u.profile.email.toLowerCase().includes(q) && !u.profile.full_name.toLowerCase().includes(q)) {
      return false;
    }
    if (kycFilter !== 'all') {
      const kycStatus = u.kyc?.kyc_status ?? 'none';
      if (kycStatus !== kycFilter) return false;
    }
    return true;
  });

  const kycCounts = {
    all: users.length,
    pending: users.filter((u) => u.kyc?.kyc_status === 'pending').length,
    under_review: users.filter((u) => u.kyc?.kyc_status === 'under_review').length,
    approved: users.filter((u) => u.kyc?.kyc_status === 'approved').length,
    rejected: users.filter((u) => u.kyc?.kyc_status === 'rejected').length,
    none: users.filter((u) => !u.kyc).length,
  };

  // ── Render guards ────────────────────────────────────────────────────────────

  if (!mounted) return null;

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#050507] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E82127" strokeWidth="1.5" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Admin Access Required</h1>
          <p className="text-sm text-[#6B7280] mb-6">You must be logged in as admin to view this page.</p>
          <Link href="/login" className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
            Sign In as Admin
          </Link>
        </div>
      </main>
    );
  }

  // ── Top bar ──────────────────────────────────────────────────────────────────

  const topBar = (
    <div className="border-b border-[#12131A] bg-[#050507]/95 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/tesla-mark.png" width={18} height={18} alt="" aria-hidden="true" className="text-primary object-contain" />
            <span className="text-white font-bold text-sm tracking-widest uppercase">Trade Tesla</span>
          </Link>
          <span className="text-[#1E2027]">|</span>
          <span className="text-xs text-primary tracking-widest uppercase font-semibold">Admin Panel</span>
          <span className="text-[#1E2027]">|</span>
          <span className="text-xs text-[#71717A] tracking-widest uppercase">
            {view === 'users' ? 'User Management' : view === 'kyc_detail' ? 'KYC Review' : 'Balance Adjustment'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {view !== 'users' && (
            <button
              onClick={() => setView('users')}
              className="text-xs text-[#71717A] hover:text-white transition-colors flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              All Users
            </button>
          )}
          <Link
            href="/admin"
            className="text-xs text-[#71717A] hover:text-white transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Admin Home
          </Link>
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white">A</div>
        </div>
      </div>
    </div>
  );

  // ── KYC Detail View ──────────────────────────────────────────────────────────

  if (view === 'kyc_detail' && selectedUser) {
    const kyc = selectedUser.kyc;
    const kycCfg = kyc ? KYC_STATUS_CONFIG[kyc.kyc_status] : KYC_STATUS_CONFIG.none;

    return (
      <main className="min-h-screen bg-[#050507] text-white">
        {topBar}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">KYC Review</h1>
              <p className="text-sm text-[#71717A]">
                {selectedUser.profile.full_name || selectedUser.profile.email} — Identity Verification
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => openBalanceView(selectedUser)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0D0E12] hover:bg-[#12131A] border border-[#1E2027] hover:border-[#2A2D35] text-[#D4D4D8] hover:text-white text-xs font-bold rounded-xl tracking-widest uppercase transition-all"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                Adjust Balance
              </button>
            </div>
          </div>

          {!kyc ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24 bg-[#0D0E12] border border-[#12131A] rounded-xl">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.2" aria-hidden="true">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-sm text-[#6B7280]">This user has not submitted a KYC application yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left panel */}
              <div className="lg:col-span-1 space-y-4">
                {/* Applicant info */}
                <div className="bg-[#0D0E12] border border-[#12131A] rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-base font-bold text-primary shrink-0">
                      {getInitials(selectedUser.profile.full_name, selectedUser.profile.email)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{selectedUser.profile.full_name || 'Unknown'}</p>
                      <p className="text-xs text-[#6B7280]">{selectedUser.profile.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Submitted', value: formatDate(kyc.submitted_at) },
                      { label: 'Reviewed', value: formatDate(kyc.reviewed_at) },
                      { label: 'Country', value: kyc.country || '—' },
                      { label: 'Date of Birth', value: kyc.date_of_birth || '—' },
                      { label: 'Investor Type', value: kyc.investor_type || '—' },
                      { label: 'Annual Income', value: kyc.annual_income || '—' },
                      { label: 'Experience', value: kyc.investment_experience || '—' },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-[#12131A] last:border-0">
                        <span className="text-[10px] text-[#6B7280] uppercase tracking-widest">{item.label}</span>
                        <span className="text-xs font-semibold text-white capitalize">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current status */}
                <div className="bg-[#0D0E12] border border-[#12131A] rounded-xl p-5">
                  <h3 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-3">Current Status</h3>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-widest ${kycCfg.bg} ${kycCfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${kycCfg.dot}`} />
                    {kycCfg.label}
                  </span>
                </div>

                {/* Admin notes */}
                <div className="bg-[#0D0E12] border border-[#12131A] rounded-xl p-5">
                  <h3 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-3">Admin Notes</h3>
                  <textarea
                    value={kycNotes}
                    onChange={(e) => setKycNotes(e.target.value)}
                    placeholder="Add notes for the applicant (optional)…"
                    rows={4}
                    className="w-full px-3 py-2.5 bg-[#050507] border border-[#1E2027] rounded-xl text-sm text-white placeholder-[#52525B] focus:outline-none focus:border-[#2A2D35] resize-none"
                  />
                </div>

                {/* Action buttons */}
                <div className="space-y-2.5">
                  <button
                    onClick={() => updateKYCStatus('approved')}
                    disabled={kycSaving || kyc.kyc_status === 'approved'}
                    className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all bg-green-400/10 hover:bg-green-400/20 border border-green-400/20 hover:border-green-400/40 text-green-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {kycSaving ? (
                      <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                    Approve KYC
                  </button>
                  <button
                    onClick={() => updateKYCStatus('under_review')}
                    disabled={kycSaving || kyc.kyc_status === 'under_review'}
                    className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all bg-zinc-300/10 hover:bg-zinc-300/20 border border-zinc-300/20 hover:border-zinc-300/40 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    Mark Under Review
                  </button>
                  <button
                    onClick={() => updateKYCStatus('rejected')}
                    disabled={kycSaving || kyc.kyc_status === 'rejected'}
                    className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 hover:border-red-400/40 text-red-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    Reject KYC
                  </button>
                  {kycSaved && (
                    <div className="flex items-center justify-center gap-2 py-2 bg-green-400/10 border border-green-400/20 rounded-xl text-xs text-green-400 font-semibold">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                      Status updated successfully
                    </div>
                  )}
                  {error && (
                    <p className="text-xs text-red-400 text-center">{error}</p>
                  )}
                </div>
              </div>

              {/* Right panel — documents + address */}
              <div className="lg:col-span-2 space-y-5">
                {/* Identity documents */}
                <div className="bg-[#0D0E12] border border-[#12131A] rounded-xl p-5">
                  <h3 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-4">Identity Documents</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        label: 'Government ID (Front)',
                        url: kyc.id_document_url,
                        detail: `${(kyc.id_type || '').replace('_', ' ')} · ${kyc.id_number || '—'}`,
                      },
                      { label: 'Government ID (Back)', url: kyc.id_document_back_url, detail: 'Back side' },
                      {
                        label: 'Proof of Address',
                        url: kyc.address_proof_url,
                        detail: [kyc.street_address, kyc.city].filter(Boolean).join(', ') || '—',
                      },
                      { label: 'Income Verification', url: kyc.income_document_url, detail: kyc.annual_income || '—' },
                    ].map((doc) => (
                      <div key={doc.label} className="border border-[#12131A] rounded-xl overflow-hidden">
                        <div className="px-3 py-2.5 border-b border-[#12131A] bg-[#050507]">
                          <p className="text-[10px] font-bold text-[#71717A] uppercase tracking-widest">{doc.label}</p>
                          {doc.detail && <p className="text-[10px] text-[#52525B] mt-0.5 capitalize">{doc.detail}</p>}
                        </div>
                        {doc.url ? (
                          <div className="p-3">
                            {doc.url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                              <img
                                src={doc.url}
                                alt={`${doc.label} document preview`}
                                className="w-full h-32 object-cover rounded-xl"
                              />
                            ) : (
                              <div className="h-32 flex flex-col items-center justify-center gap-2 bg-[#050507] rounded-xl">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" aria-hidden="true">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span className="text-[10px] text-[#6B7280]">PDF Document</span>
                              </div>
                            )}
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-primary hover:underline"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                              View Full Document
                            </a>
                          </div>
                        ) : (
                          <div className="p-3 h-32 flex items-center justify-center">
                            <p className="text-[10px] text-[#333333]">Not uploaded</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Residential address */}
                <div className="bg-[#0D0E12] border border-[#12131A] rounded-xl p-5">
                  <h3 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-4">Residential Address</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Street', value: kyc.street_address },
                      { label: 'City', value: kyc.city },
                      { label: 'ZIP / Postal', value: kyc.zip_code },
                      { label: 'Country', value: kyc.country },
                      { label: 'Date of Birth', value: kyc.date_of_birth },
                    ].map((item) => (
                      <div key={item.label} className="bg-[#050507] rounded-xl p-3">
                        <p className="text-[9px] text-[#52525B] uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-xs font-semibold text-white">{item.value || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Previous admin notes */}
                {kyc.admin_notes && (
                  <div className="bg-[#0D0E12] border border-yellow-400/20 rounded-xl p-5">
                    <h3 className="text-[10px] font-bold text-yellow-400/70 uppercase tracking-widest mb-2">Previous Admin Notes</h3>
                    <p className="text-sm text-[#D4D4D8] leading-relaxed">{kyc.admin_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // ── Balance Adjustment View ───────────────────────────────────────────────────

  if (view === 'balance' && selectedUser) {
    return (
      <main className="min-h-screen bg-[#050507] text-white">
        {topBar}
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">Balance Adjustment</h1>
              <p className="text-sm text-[#71717A]">
                Manually adjust account balances for{' '}
                <span className="text-white font-semibold">
                  {selectedUser.profile.full_name || selectedUser.profile.email}
                </span>
              </p>
            </div>
            <button
              onClick={() => openKYCDetail(selectedUser)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0D0E12] hover:bg-[#12131A] border border-[#1E2027] hover:border-[#2A2D35] text-[#D4D4D8] hover:text-white text-xs font-bold rounded-xl tracking-widest uppercase transition-all self-start sm:self-auto"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              View KYC
            </button>
          </div>

          {/* User info card */}
          <div className="bg-[#0D0E12] border border-[#12131A] rounded-xl p-5 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-base font-bold text-primary shrink-0">
              {getInitials(selectedUser.profile.full_name, selectedUser.profile.email)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{selectedUser.profile.full_name || 'Unknown'}</p>
              <p className="text-xs text-[#6B7280]">{selectedUser.profile.email}</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedUser.kyc && (
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border ${KYC_STATUS_CONFIG[selectedUser.kyc.kyc_status].bg} ${KYC_STATUS_CONFIG[selectedUser.kyc.kyc_status].color}`}>
                  KYC: {KYC_STATUS_CONFIG[selectedUser.kyc.kyc_status].label}
                </span>
              )}
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-[#12131A] border border-[#1E2027] text-[#71717A]">
                Joined {formatDate(selectedUser.profile.created_at)}
              </span>
            </div>
          </div>

          {/* Live wallet balance (canonical) */}
          <div className="bg-[#0D0E12] border border-[#12131A] rounded-xl p-6 mb-6">
            <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-5">Wallet Balance (Live)</h2>
            <p className="text-3xl font-extrabold text-green-400 tabular-nums mb-5">
              ${Number(currentWallet).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-end">
              <div>
                <label htmlFor="wallet-new" className="block text-[10px] text-[#6B7280] uppercase tracking-widest mb-1.5">Set available balance (USD)</label>
                <input
                  id="wallet-new"
                  type="number"
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#050507] border border-[#1E2027] rounded-xl text-sm text-white focus:outline-none focus:border-[#2A2D35]"
                />
                <p className="text-[10px] text-[#52525B] mt-1">The difference is logged as an admin adjustment in the user ledger.</p>
              </div>
              <button
                onClick={saveWalletBalance}
                disabled={walletSaving}
                className="px-5 py-2.5 rounded-xl bg-green-500 text-black text-xs font-bold uppercase tracking-widest disabled:opacity-40"
              >
                {walletSaving ? 'Saving…' : 'Update Wallet Balance'}
              </button>
            </div>
            {walletMsg && <p className="text-xs text-[#A1A1AA] mt-3">{walletMsg}</p>}
          </div>

          {/* Balance form */}
          <div className="bg-[#0D0E12] border border-[#12131A] rounded-xl p-6 mb-6">
            <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-5">Portfolio Display Fields</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { key: 'totalPortfolio', label: 'Total Portfolio Value', placeholder: '$0', hint: 'e.g. $12,500.00' },
                { key: 'totalReturns', label: 'Total Returns', placeholder: '$0', hint: 'e.g. $1,250.00' },
                { key: 'referralEarnings', label: 'Referral Earnings', placeholder: '$0', hint: 'e.g. $250.00' },
                { key: 'activeInvestments', label: 'Active Investments Count', placeholder: '0', hint: 'Number of active investments' },
                { key: 'portfolioChange', label: 'Portfolio Change Label', placeholder: '$0 (0%)', hint: 'e.g. +$500 (+4.2%)' },
                { key: 'returnsChange', label: 'Returns Change Label', placeholder: '$0 this month', hint: 'e.g. +$120 this month' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-[10px] text-[#6B7280] uppercase tracking-widest mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={(balanceForm as any)[field.key]}
                    onChange={(e) => setBalanceForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 bg-[#050507] border border-[#1E2027] rounded-xl text-sm text-white placeholder-[#52525B] focus:outline-none focus:border-[#2A2D35] transition-colors"
                  />
                  <p className="text-[10px] text-[#52525B] mt-1">{field.hint}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Support note */}
          <div className="bg-[#0D0E12] border border-[#12131A] rounded-xl p-6 mb-6">
            <h2 className="text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-3">Internal Support Note</h2>
            <textarea
              value={balanceNote}
              onChange={(e) => setBalanceNote(e.target.value)}
              placeholder="Reason for balance adjustment (internal use only, not shown to user)…"
              rows={3}
              className="w-full px-3 py-2.5 bg-[#050507] border border-[#1E2027] rounded-xl text-sm text-white placeholder-[#52525B] focus:outline-none focus:border-[#2A2D35] resize-none"
            />
          </div>

          {/* Current values preview */}
          {selectedUser.portfolio && (
            <div className="bg-[#050507] border border-[#12131A] rounded-xl p-5 mb-6">
              <h3 className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest mb-3">Current Stored Values</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(selectedUser.portfolio.stats).map(([k, v]) => (
                  <div key={k} className="bg-[#0D0E12] rounded-xl p-3">
                    <p className="text-[9px] text-[#52525B] uppercase tracking-widest mb-1">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-xs font-bold text-[#A1A1AA]">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="flex items-center gap-4">
            <button
              onClick={saveBalanceAdjustment}
              disabled={balanceSaving}
              className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {balanceSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              )}
              Save Balance Adjustment
            </button>
            <button
              onClick={() => setView('users')}
              className="px-6 py-3 bg-[#0D0E12] hover:bg-[#12131A] border border-[#1E2027] text-[#A1A1AA] hover:text-white text-xs font-bold rounded-xl tracking-widest uppercase transition-all"
            >
              Cancel
            </button>
            {balanceSaved && (
              <div className="flex items-center gap-2 text-xs text-green-400 font-semibold">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Balance saved successfully
              </div>
            )}
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        </div>
      </main>
    );
  }

  // ── Users List View ──────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      {topBar}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">User Management</h1>
            <p className="text-sm text-[#71717A]">
              {users.length} registered user{users.length !== 1 ? 's' : ''} — review KYC, adjust balances, and manage accounts.
            </p>
          </div>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0D0E12] hover:bg-[#12131A] border border-[#1E2027] hover:border-[#2A2D35] text-[#D4D4D8] hover:text-white text-xs font-bold rounded-xl tracking-widest uppercase transition-all disabled:opacity-50 self-start sm:self-auto"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={loading ? 'animate-spin' : ''}
              aria-hidden="true"
            >
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* KPI summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {(
            [
              { label: 'Total Users', value: kycCounts.all, color: 'text-white', filter: 'all' as KYCFilterType },
              { label: 'KYC Pending', value: kycCounts.pending, color: 'text-yellow-400', filter: 'pending' as KYCFilterType },
              { label: 'Under Review', value: kycCounts.under_review, color: 'text-zinc-300', filter: 'under_review' as KYCFilterType },
              { label: 'KYC Approved', value: kycCounts.approved, color: 'text-green-400', filter: 'approved' as KYCFilterType },
              { label: 'KYC Rejected', value: kycCounts.rejected, color: 'text-red-400', filter: 'rejected' as KYCFilterType },
              { label: 'No KYC', value: kycCounts.none, color: 'text-[#6B7280]', filter: 'none' as KYCFilterType },
            ] as { label: string; value: number; color: string; filter: KYCFilterType }[]
          ).map((kpi) => (
            <button
              key={kpi.label}
              onClick={() => setKycFilter(kpi.filter)}
              className={`bg-[#0D0E12] border rounded-xl p-4 text-left transition-all hover:bg-[#0D0E12] ${
                kycFilter === kpi.filter ? 'border-primary/40' : 'border-[#12131A] hover:border-[#1E2027]'
              }`}
            >
              <p className={`text-2xl font-extrabold mb-1 ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-[#6B7280] uppercase tracking-widest leading-tight">{kpi.label}</p>
            </button>
          ))}
        </div>

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-4 py-2.5 bg-[#0D0E12] border border-[#1E2027] rounded-xl text-sm text-white placeholder-[#52525B] focus:outline-none focus:border-[#2A2D35] transition-colors"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {(
              [
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'under_review', label: 'Under Review' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'none', label: 'No KYC' },
              ] as { value: KYCFilterType; label: string }[]
            ).map((f) => (
              <button
                key={f.value}
                onClick={() => setKycFilter(f.value)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  kycFilter === f.value
                    ? 'bg-primary text-white' :'bg-[#0D0E12] border border-[#1E2027] text-[#A1A1AA] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-400/10 border border-red-400/20 rounded-xl text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Users table */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 bg-[#0D0E12] border border-[#12131A] rounded-xl">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.2" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p className="text-sm text-[#6B7280]">
              {searchQuery || kycFilter !== 'all' ? 'No users match your filters.' : 'No users registered yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-[#0D0E12] border border-[#12131A] rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 border-b border-[#12131A] text-[10px] text-[#6B7280] uppercase tracking-widest font-bold">
              <div className="col-span-3">User</div>
              <div className="col-span-2">KYC Status</div>
              <div className="col-span-2">Portfolio</div>
              <div className="col-span-2">Joined</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>

            {/* Table rows */}
            {filteredUsers.map((u, idx) => {
              const kycStatus = u.kyc?.kyc_status ?? 'none';
              const kycCfg = KYC_STATUS_CONFIG[kycStatus as keyof typeof KYC_STATUS_CONFIG] ?? KYC_STATUS_CONFIG.none;
              const portfolio = u.portfolio?.stats?.totalPortfolio ?? '$0';
              const initials = getInitials(u.profile.full_name, u.profile.email);

              return (
                <div
                  key={u.profile.id}
                  className={`flex flex-col lg:grid lg:grid-cols-12 gap-4 px-5 py-4 hover:bg-[#0D0E12] transition-colors ${
                    idx < filteredUsers.length - 1 ? 'border-b border-[#12131A]' : ''
                  }`}
                >
                  {/* User */}
                  <div className="lg:col-span-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {u.profile.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-[#6B7280] truncate">{u.profile.email}</p>
                    </div>
                  </div>

                  {/* KYC Status */}
                  <div className="lg:col-span-2 flex items-center">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-xl border ${kycCfg.bg} ${kycCfg.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${kycCfg.dot}`} />
                      {kycCfg.label}
                    </span>
                  </div>

                  {/* Portfolio */}
                  <div className="lg:col-span-2 flex items-center">
                    <div>
                      <p className="text-sm font-bold text-white">{portfolio}</p>
                      <p className="text-[10px] text-[#52525B]">
                        {u.portfolio ? `${u.portfolio.stats.activeInvestments} active` : 'No portfolio'}
                      </p>
                    </div>
                  </div>

                  {/* Joined */}
                  <div className="lg:col-span-2 flex items-center">
                    <p className="text-xs text-[#71717A]">{formatDate(u.profile.created_at)}</p>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-3 flex items-center justify-start lg:justify-end gap-2 flex-wrap">
                    {u.kyc && (
                      <button
                        onClick={() => openKYCDetail(u)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all uppercase tracking-widest ${
                          u.kyc.kyc_status === 'pending' || u.kyc.kyc_status === 'under_review' ?'bg-yellow-400/10 hover:bg-yellow-400/20 border-yellow-400/20 hover:border-yellow-400/40 text-yellow-400' :'bg-[#12131A] hover:bg-[#222222] border-[#1E2027] hover:border-[#2A2D35] text-[#A1A1AA] hover:text-white'
                        }`}
                      >
                        {u.kyc.kyc_status === 'pending' ? '⚠ Review KYC' : 'View KYC'}
                      </button>
                    )}
                    {!u.kyc && (
                      <span className="px-3 py-1.5 text-[10px] font-bold rounded-xl border bg-[#12131A] border-[#1E2027] text-[#52525B] uppercase tracking-widest">
                        No KYC
                      </span>
                    )}
                    <button
                      onClick={() => openBalanceView(u)}
                      className="px-3 py-1.5 text-[10px] font-bold rounded-xl border bg-primary/10 hover:bg-primary/20 border-primary/20 hover:border-primary/40 text-primary transition-all uppercase tracking-widest"
                    >
                      Adjust Balance
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Results count */}
        {!loading && filteredUsers.length > 0 && (
          <p className="text-xs text-[#52525B] mt-4 text-center">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        )}
      </div>
    </main>
  );
}
