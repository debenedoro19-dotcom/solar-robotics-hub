import React, { useState, useEffect } from 'react';
import Link from '@/components/SmartLink';
import { createClient } from '@/lib/supabase/client';
import { createEmptyPortfolio, getCurrentUser, isAdmin, type UserPortfolio, type Investment, type Transaction, type Alert, type ChartPoint, type AllocationItem,  } from '@/lib/portfolioStore';
import { checkIsAdmin } from '@/lib/adminAuth';
import { sendKYCApprovedEmail, sendKYCRejectedEmail, sendPortfolioModifiedEmail, sendReturnsUpdatedEmail, sendSupportTicketUpdatedEmail } from '@/lib/emailService';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';

type AdminView = 'users' | 'edit' | 'kyc' | 'analytics' | 'support';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketCategory = 'account' | 'investment' | 'withdrawal' | 'kyc' | 'technical' | 'other';

interface SupportTicket {
  id: string;
  user_id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: TicketCategory;
  ticket_status: TicketStatus;
  priority: string;
  admin_reply: string | null;
  admin_notes: string | null;
  user_email: string;
  user_name: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  user_profiles?: { email: string; full_name: string } | null;
}

const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: '#F59E0B' },
  in_progress: { label: 'In Progress', color: '#A1A1AA' },
  resolved: { label: 'Resolved', color: 'var(--fin-emerald)' },
  closed: { label: 'Closed', color: '#A1A1AA' },
};

const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  account: 'Account & Profile',
  investment: 'Investment & Portfolio',
  withdrawal: 'Withdrawals & Payouts',
  kyc: 'KYC Verification',
  technical: 'Technical Issue',
  other: 'Other',
};

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
  user_profiles?: { email: string; full_name: string } | null;
}

interface AnalyticsData {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  kycBreakdown: { name: string; value: number; color: string }[];
  countryBreakdown: { country: string; count: number }[];
  investorTypeBreakdown: { name: string; value: number }[];
  incomeBreakdown: { name: string; value: number }[];
  signupsOverTime: { month: string; signups: number }[];
  activeUsers: number;
  portfolioUsers: number;
}

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [view, setView] = useState<AdminView>('users');
  const [dashboardCategory, setDashboardCategory] = useState<'all' | 'finance' | 'catalog' | 'system'>('all');
  const [users, setUsers] = useState<UserPortfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<UserPortfolio | null>(null);
  const [activeSection, setActiveSection] = useState<'stats' | 'investments' | 'transactions' | 'alerts' | 'chart' | 'allocation'>('stats');
  const [saved, setSaved] = useState(false);

  // KYC state
  const [kycList, setKycList] = useState<KYCSubmission[]>([]);
  const [kycLoading, setKycLoading] = useState(false);
  const [selectedKyc, setSelectedKyc] = useState<KYCSubmission | null>(null);
  const [kycNotes, setKycNotes] = useState('');
  const [kycSaving, setKycSaving] = useState(false);
  const [kycSaved, setKycSaved] = useState(false);
  const [kycFilter, setKycFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>('all');

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Support tickets state
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketStatusUpdate, setTicketStatusUpdate] = useState<TicketStatus>('open');
  const [ticketSaving, setTicketSaving] = useState(false);
  const [ticketSaved, setTicketSaved] = useState(false);
  const [supportFilter, setSupportFilter] = useState<'all' | TicketStatus>('all');

  useEffect(() => {
    setMounted(true);
    const currentUser = getCurrentUser();
    void checkIsAdmin().then((ok) => { if (ok) setAuthorized(true); });
    {
      loadUsers();
    }
  }, []);

  async function loadUsers() {
    try {
      const supabase = createClient();
      const [profilesRes, portfoliosRes] = await Promise.all([
        supabase.from('user_profiles').select('id, email, full_name, role, created_at').order('created_at', { ascending: false }),
        supabase.from('user_portfolios').select('*'),
      ]);

      const profiles = profilesRes.data ?? [];
      const portfolioRows = portfoliosRes.data ?? [];

      const merged: UserPortfolio[] = profiles
        .filter((p) => p.role !== 'admin')
        .map((p) => {
          const row = portfolioRows.find((r) => r.user_id === p.id);
          if (row) {
            return {
              userId: p.id,
              userName: row.user_name || p.full_name || p.email,
              userEmail: p.email,
              stats: row.stats ?? createEmptyPortfolio(p.id, '', '').stats,
              chartData: row.chart_data ?? [],
              allocation: row.allocation ?? [],
              investments: row.investments ?? [],
              transactions: row.transactions ?? [],
              alerts: row.alerts ?? [],
              referrals: row.referrals ?? { total: 0, pending: 0, earnings: '$0', history: [] },
            };
          }
          return createEmptyPortfolio(p.id, p.full_name || p.email, p.email);
        });

      setUsers(merged);
    } catch (err) {
      console.error('Failed to load users from Supabase:', err);
    }
  }

  async function loadKYCSubmissions() {
    setKycLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select('*, user_profiles(email, full_name)')
        .order('submitted_at', { ascending: false });
      if (!error && data) setKycList(data as KYCSubmission[]);
    } catch (err) {
      console.error('Failed to load KYC submissions:', err);
    }
    setKycLoading(false);
  }

  async function loadAnalytics() {
    setAnalyticsLoading(true);
    try {
      const supabase = createClient();
      const { data: profiles } = await supabase.from('user_profiles').select('id, email, full_name, role, created_at');
      const { data: kyc } = await supabase.from('kyc_submissions').select('user_id, kyc_status, country, investor_type, annual_income, submitted_at');
      const { data: portfolios } = await supabase.from('user_portfolios').select('user_id, stats');
      const totalUsers = profiles?.length ?? 0;
      const kycStatusMap: Record<string, number> = { pending: 0, under_review: 0, approved: 0, rejected: 0, none: 0 };
      const kycUserIds = new Set((kyc ?? []).map((k) => k.user_id));
      (profiles ?? []).forEach((p) => { if (!kycUserIds.has(p.id)) kycStatusMap['none']++; });
      (kyc ?? []).forEach((k) => { kycStatusMap[k.kyc_status] = (kycStatusMap[k.kyc_status] ?? 0) + 1; });
      const kycBreakdown = [
        { name: 'Approved', value: kycStatusMap['approved'], color: '#5c5e62' },
        { name: 'Pending', value: kycStatusMap['pending'], color: '#F59E0B' },
        { name: 'Under Review', value: kycStatusMap['under_review'], color: '#A1A1AA' },
        { name: 'Rejected', value: kycStatusMap['rejected'], color: '#E82127' },
        { name: 'No KYC', value: kycStatusMap['none'], color: '#2A2D35' },
      ].filter((d) => d.value > 0);
      const countryMap: Record<string, number> = {};
      (kyc ?? []).forEach((k) => { if (k.country) countryMap[k.country] = (countryMap[k.country] ?? 0) + 1; });
      const countryBreakdown = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([country, count]) => ({ country, count }));
      const investorMap: Record<string, number> = {};
      (kyc ?? []).forEach((k) => { const t = k.investor_type || 'Unknown'; investorMap[t] = (investorMap[t] ?? 0) + 1; });
      const investorTypeBreakdown = Object.entries(investorMap).map(([name, value]) => ({ name, value }));
      const incomeMap: Record<string, number> = {};
      (kyc ?? []).forEach((k) => { const inc = k.annual_income || 'Not specified'; incomeMap[inc] = (incomeMap[inc] ?? 0) + 1; });
      const incomeBreakdown = Object.entries(incomeMap).map(([name, value]) => ({ name, value }));
      const monthMap: Record<string, number> = {};
      (profiles ?? []).forEach((p) => {
        if (p.created_at) {
          const d = new Date(p.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthMap[key] = (monthMap[key] ?? 0) + 1;
        }
      });
      const signupsOverTime = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0])).slice(-8).map(([key, signups]) => {
        const [year, month] = key.split('-');
        const label = new Date(Number(year), Number(month) - 1).toLocaleString('en-US', { month: 'short', year: '2-digit' });
        return { month: label, signups };
      });
      const portfolioUsers = portfolios?.length ?? 0;
      const activeUsers = (portfolios ?? []).filter((p) => {
        const stats = p.stats as { totalPortfolio?: string };
        return stats?.totalPortfolio && stats.totalPortfolio !== '$0';
      }).length;
      const verifiedUsers = kycStatusMap['approved'];
      const unverifiedUsers = totalUsers - verifiedUsers;
      setAnalyticsData({ totalUsers, verifiedUsers, unverifiedUsers, kycBreakdown, countryBreakdown, investorTypeBreakdown, incomeBreakdown, signupsOverTime, activeUsers, portfolioUsers });
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
    setAnalyticsLoading(false);
  }

  function openAnalyticsView() { setView('analytics'); loadAnalytics(); }
  function openKYCView() { setView('kyc'); setSelectedKyc(null); loadKYCSubmissions(); }
  function openSupportView() { setView('support'); setSelectedTicket(null); loadSupportTickets(); }

  async function loadSupportTickets() {
    setSupportLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('support_tickets').select('*, user_profiles(email, full_name)').order('created_at', { ascending: false });
      if (!error && data) setSupportTickets(data as SupportTicket[]);
    } catch (err) {
      console.error('Failed to load support tickets:', err);
    }
    setSupportLoading(false);
  }

  function openKYCDetail(kyc: KYCSubmission) {
    setSelectedKyc(kyc);
    setKycNotes(kyc.admin_notes || '');
    setKycSaved(false);
  }

  async function updateKYCStatus(status: KYCSubmission['kyc_status']) {
    if (!selectedKyc) return;
    setKycSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('kyc_submissions').update({ kyc_status: status, admin_notes: kycNotes, reviewed_at: new Date().toISOString() }).eq('id', selectedKyc.id);
      if (!error) {
        setSelectedKyc((prev) => prev ? { ...prev, kyc_status: status, admin_notes: kycNotes } : prev);
        setKycList((prev) => prev.map((k) => k.id === selectedKyc.id ? { ...k, kyc_status: status, admin_notes: kycNotes } : k));
        setKycSaved(true);
        setTimeout(() => setKycSaved(false), 2500);
        if (status === 'approved' && selectedKyc.user_profiles?.email) {
          sendKYCApprovedEmail(selectedKyc.user_profiles.email, selectedKyc.user_profiles.full_name || 'Investor', kycNotes || undefined).catch(console.error);
        } else if (status === 'rejected' && selectedKyc.user_profiles?.email) {
          sendKYCRejectedEmail(selectedKyc.user_profiles.email, selectedKyc.user_profiles.full_name || 'Investor', kycNotes || undefined).catch(console.error);
        }
      }
    } catch (err) { console.error('Failed to update KYC:', err); }
    setKycSaving(false);
  }

  async function updateTicketStatus() {
    if (!selectedTicket) return;
    setTicketSaving(true);
    try {
      const supabase = createClient();
      const updateData: Record<string, any> = { ticket_status: ticketStatusUpdate, updated_at: new Date().toISOString() };
      if (ticketReply.trim()) updateData.admin_reply = ticketReply.trim();
      if (['resolved', 'closed'].includes(ticketStatusUpdate)) updateData.resolved_at = new Date().toISOString();
      const { error } = await supabase.from('support_tickets').update(updateData).eq('id', selectedTicket.id);
      if (!error) {
        const updated = { ...selectedTicket, ticket_status: ticketStatusUpdate, admin_reply: ticketReply.trim() || selectedTicket.admin_reply };
        setSelectedTicket(updated);
        setSupportTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t));
        setTicketSaved(true);
        setTimeout(() => setTicketSaved(false), 2500);
        sendSupportTicketUpdatedEmail(selectedTicket.user_email, selectedTicket.user_name || selectedTicket.user_email, ticketStatusUpdate, ticketReply.trim() || undefined).catch(console.error);
      }
    } catch (err) { console.error('Failed to update ticket:', err); }
    setTicketSaving(false);
  }

  function openEdit(portfolio: UserPortfolio) {
    setSelectedPortfolio(JSON.parse(JSON.stringify(portfolio)));
    setView('edit');
    setActiveSection('stats');
    setSaved(false);
  }

  async function handleSave() {
    if (!selectedPortfolio) return;
    try {
      const supabase = createClient();
      const { error: upsertError } = await supabase.from('user_portfolios').upsert(
        {
          user_id: selectedPortfolio.userId,
          user_email: selectedPortfolio.userEmail,
          user_name: selectedPortfolio.userName,
          stats: selectedPortfolio.stats,
          chart_data: selectedPortfolio.chartData,
          allocation: selectedPortfolio.allocation,
          investments: selectedPortfolio.investments,
          transactions: selectedPortfolio.transactions,
          alerts: selectedPortfolio.alerts,
          referrals: selectedPortfolio.referrals,
        },
        { onConflict: 'user_id' }
      );
      if (upsertError) throw upsertError;

      // Update local list
      setUsers((prev) =>
        prev.map((u) => (u.userId === selectedPortfolio.userId ? { ...selectedPortfolio } : u))
      );

      sendPortfolioModifiedEmail(selectedPortfolio.userEmail, selectedPortfolio.userName).catch(console.error);
      if (selectedPortfolio.stats?.totalReturns) {
        sendReturnsUpdatedEmail(selectedPortfolio.userEmail, selectedPortfolio.userName).catch(console.error);
      }
    } catch (err) {
      console.error('Supabase portfolio sync error:', err);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function updateStats(key: keyof UserPortfolio['stats'], value: string | number) {
    if (!selectedPortfolio) return;
    setSelectedPortfolio((prev) => prev ? { ...prev, stats: { ...prev.stats, [key]: value } } : prev);
  }

  function addInvestment() {
    if (!selectedPortfolio) return;
    const newInv: Investment = { id: Date.now().toString(), name: 'New Package', invested: '$0', current: '$0', returnPct: '0%', status: 'Active', duration: '12 months', progress: 0 };
    setSelectedPortfolio((prev) => prev ? { ...prev, investments: [...prev.investments, newInv] } : prev);
  }

  function updateInvestment(id: string, key: keyof Investment, value: string | number) {
    if (!selectedPortfolio) return;
    setSelectedPortfolio((prev) => prev ? { ...prev, investments: prev.investments.map((inv) => inv.id === id ? { ...inv, [key]: value } : inv) } : prev);
  }

  function removeInvestment(id: string) {
    if (!selectedPortfolio) return;
    setSelectedPortfolio((prev) => prev ? { ...prev, investments: prev.investments.filter((inv) => inv.id !== id) } : prev);
  }

  function addTransaction() {
    if (!selectedPortfolio) return;
    const newTx: Transaction = { id: Date.now().toString(), type: 'Investment', asset: 'New Asset', amount: '+$0', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), status: 'Active', statusColor: 'text-success' };
    setSelectedPortfolio((prev) => prev ? { ...prev, transactions: [...prev.transactions, newTx] } : prev);
  }

  function updateTransaction(id: string, key: keyof Transaction, value: string) {
    if (!selectedPortfolio) return;
    setSelectedPortfolio((prev) => prev ? { ...prev, transactions: prev.transactions.map((tx) => tx.id === id ? { ...tx, [key]: value } : tx) } : prev);
  }

  function removeTransaction(id: string) {
    if (!selectedPortfolio) return;
    setSelectedPortfolio((prev) => prev ? { ...prev, transactions: prev.transactions.filter((tx) => tx.id !== id) } : prev);
  }

  function addAlert() {
    if (!selectedPortfolio) return;
    const newAlert: Alert = { id: Date.now().toString(), icon: '🔔', text: 'New notification message', time: 'Just now', unread: true };
    setSelectedPortfolio((prev) => prev ? { ...prev, alerts: [...prev.alerts, newAlert] } : prev);
  }

  function updateAlert(id: string, key: keyof Alert, value: string | boolean) {
    if (!selectedPortfolio) return;
    setSelectedPortfolio((prev) => prev ? { ...prev, alerts: prev.alerts.map((a) => (a.id === id ? { ...a, [key]: value } : a)) } : prev);
  }

  function removeAlert(id: string) {
    if (!selectedPortfolio) return;
    setSelectedPortfolio((prev) => prev ? { ...prev, alerts: prev.alerts.filter((a) => a.id !== id) } : prev);
  }

  function addChartPoint() {
    if (!selectedPortfolio) return;
    const newPoint: ChartPoint = { month: 'New', value: 0 };
    setSelectedPortfolio((prev) => prev ? { ...prev, chartData: [...prev.chartData, newPoint] } : prev);
  }

  function updateChartPoint(index: number, key: keyof ChartPoint, value: string | number) {
    if (!selectedPortfolio) return;
    setSelectedPortfolio((prev) => prev ? { ...prev, chartData: prev.chartData.map((pt, i) => i === index ? { ...pt, [key]: key === 'value' ? Number(value) : value } : pt) } : prev);
  }

  function removeChartPoint(index: number) {
    if (!selectedPortfolio) return;
    setSelectedPortfolio((prev) => prev ? { ...prev, chartData: prev.chartData.filter((_, i) => i !== index) } : prev);
  }

  const ALLOC_COLORS = ['#E82127', '#FF6B6B', '#B3181D', '#1E2027', '#FF4444', '#991111'];

  function addAllocation() {
    if (!selectedPortfolio) return;
    const newItem: AllocationItem = { name: 'New Asset', value: 0, color: ALLOC_COLORS[selectedPortfolio.allocation.length % ALLOC_COLORS.length] };
    setSelectedPortfolio((prev) => prev ? { ...prev, allocation: [...prev.allocation, newItem] } : prev);
  }

  function updateAllocation(index: number, key: keyof AllocationItem, value: string | number) {
    if (!selectedPortfolio) return;
    setSelectedPortfolio((prev) => prev ? { ...prev, allocation: prev.allocation.map((item, i) => i === index ? { ...item, [key]: key === 'value' ? Number(value) : value } : item) } : prev);
  }

  function removeAllocation(index: number) {
    if (!selectedPortfolio) return;
    setSelectedPortfolio((prev) => prev ? { ...prev, allocation: prev.allocation.filter((_, i) => i !== index) } : prev);
  }

  if (!mounted) return null;

  if (!authorized) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E82127" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Admin Access Required</h1>
          <p className="text-sm text-muted-foreground mb-6">You must be logged in as admin to view this page.</p>
          <Link href="/login" className="px-6 py-2.5 tesla-btn-primary rounded text-sm font-semibold">Sign In as Admin</Link>
        </div>
      </main>
    );
  }

  const kycStatusConfig = {
    pending: { label: 'Pending', color: 'text-warning', bg: 'bg-warning/10 border-warning/20' },
    under_review: { label: 'Under Review', color: 'text-zinc-300', bg: 'bg-zinc-300/10 border-zinc-300/20' },
    approved: { label: 'Approved', color: 'text-success', bg: 'bg-success/10 border-success/20' },
    rejected: { label: 'Rejected', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
  };

  const filteredKyc = kycFilter === 'all' ? kycList : kycList.filter((k) => k.kyc_status === kycFilter);

  const sections = [
    { id: 'stats', label: 'Stats' },
    { id: 'investments', label: 'Investments' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'chart', label: 'Chart Data' },
    { id: 'allocation', label: 'Allocation' },
  ] as const;

  const PIE_COLORS = ['#E82127', '#171A20', '#5C5E62', '#A1A1AA', '#71717A', '#B91C1C', '#D4D4D8', '#3F3F46'];

  const navBtnClass = (v: AdminView) =>
    `flex items-center gap-2 px-4 py-2 border text-xs font-bold rounded tracking-widest uppercase transition-all ${
      view === v
        ? 'bg-primary/20 border-primary/40 text-primary' :'bg-card hover:bg-muted border-border hover:border-border text-foreground/90 hover:text-foreground'
    }`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top Admin Navigation Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/tesla-mark.png"
                width={20}
                height={20}
                alt="Trade Tesla"
                className="text-primary object-contain"
              />
              <span className="text-foreground font-bold text-sm tracking-wider uppercase">
                Trade Tesla
              </span>
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
              Admin Command
            </span>
          </div>

          {/* Quick Nav Links on Header */}
          <nav className="hidden xl:flex items-center gap-1 text-xs">
            <button
              onClick={() => setView('users')}
              className={`px-3 py-1.5 rounded transition-colors font-medium ${
                view === 'users' ? 'bg-primary/20 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dashboard
            </button>
            <Link href="/admin/deposits" className="px-3 py-1.5 rounded text-muted-foreground hover:text-foreground transition-colors font-medium">
              Deposits
            </Link>
            <Link href="/admin/withdrawals" className="px-3 py-1.5 rounded text-muted-foreground hover:text-foreground transition-colors font-medium">
              Withdrawals
            </Link>
            <Link href="/admin/orders" className="px-3 py-1.5 rounded text-muted-foreground hover:text-foreground transition-colors font-medium">
              Orders
            </Link>
            <Link href="/admin/plans" className="px-3 py-1.5 rounded text-muted-foreground hover:text-foreground transition-colors font-medium">
              Packages
            </Link>
            <Link href="/admin/inventory" className="px-3 py-1.5 rounded text-muted-foreground hover:text-foreground transition-colors font-medium">
              Inventory
            </Link>
            <Link href="/admin/giveaways" className="px-3 py-1.5 rounded text-muted-foreground hover:text-foreground transition-colors font-medium">
              Giveaways
            </Link>
            <Link href="/admin/users" className="px-3 py-1.5 rounded text-muted-foreground hover:text-foreground transition-colors font-medium">
              Users
            </Link>
            <Link href="/admin/settings" className="px-3 py-1.5 rounded text-muted-foreground hover:text-foreground transition-colors font-medium">
              Settings
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {view !== 'users' && (
              <button
                onClick={() => { setView('users'); setSelectedKyc(null); setSelectedTicket(null); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-card"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Overview
              </button>
            )}
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-foreground transition-colors items-center gap-1"
            >
              Public Site ↗
            </Link>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Live</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-foreground">
              A
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Users List View */}
        {view === 'users' && (
          <>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E82127" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  </div>
                  <h1 className="text-2xl font-medium text-foreground tracking-tight">Admin Dashboard</h1>
                </div>
                <p className="text-sm text-muted-foreground">{users.length} registered user{users.length !== 1 ? 's' : ''}. Full platform control below.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Live</span>
                </div>
              </div>
            </div>

            {/* ── Platform KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              {[
                { label: 'Total Users', value: users.length, icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>, accent: '#A1A1AA', sub: 'Registered accounts' },
                { label: 'Active Portfolios', value: users.filter(u => u.stats.totalPortfolio !== '$0').length, icon: <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>, accent: '#71717A', sub: 'With portfolio data' },
                { label: 'KYC Pending', value: kycList.filter(k => k.kyc_status === 'pending').length, icon: <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>, accent: '#F59E0B', sub: 'Awaiting review' },
                { label: 'Open Tickets', value: supportTickets.filter(t => t.ticket_status === 'open').length, icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>, accent: '#E82127', sub: 'Support requests' },
              ].map((kpi) => (
                <div key={kpi.label} className="relative bg-card border border-border rounded p-5 overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5" style={{ background: kpi.accent, transform: 'translate(30%, -30%)' }} />
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{kpi.label}</div>
                    <div className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: `${kpi.accent}15` }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={kpi.accent} strokeWidth="2" aria-hidden="true">{kpi.icon}</svg>
                    </div>
                  </div>
                  <div className="text-3xl font-medium text-foreground mb-1" style={{ color: kpi.value > 0 && (kpi.label === 'KYC Pending' || kpi.label === 'Open Tickets') ? kpi.accent : undefined }}>{kpi.value}</div>
                  <div className="text-[10px] text-muted-foreground">{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* ── Operational Categories Navigation Tabs ── */}
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-3 overflow-x-auto">
              {[
                { id: 'all', label: 'All Operations' },
                { id: 'finance', label: 'Treasury & Settlement' },
                { id: 'catalog', label: 'Products & Catalog' },
                { id: 'system', label: 'Governance & Settings' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDashboardCategory(tab.id as any)}
                  className={`px-4 py-2 rounded text-xs font-semibold tracking-wider uppercase transition-all whitespace-nowrap ${
                    dashboardCategory === tab.id
                      ? 'bg-foreground text-background shadow-sm'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-card/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Grouped Authentic Command Cards ── */}
            <div className="space-y-8 mb-10">
              {/* Category 1: Treasury & Settlement */}
              {(dashboardCategory === 'all' || dashboardCategory === 'finance') && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Treasury & Settlement Operations
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Link
                      href="/admin/deposits"
                      className="bg-card border border-border hover:border-emerald-500/40 rounded p-5 text-left transition-all hover:bg-card/80 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1 group-hover:text-emerald-400 transition-colors">Deposits Ledger</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Confirm incoming wire & crypto deposits, credit user balances.</p>
                      </div>
                      <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider mt-4 inline-flex items-center gap-1">Manage Deposits &rarr;</span>
                    </Link>

                    <Link
                      href="/admin/withdrawals"
                      className="bg-card border border-border hover:border-destructive/40 rounded p-5 text-left transition-all hover:bg-card/80 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-8 h-8 rounded bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-3 group-hover:scale-105 transition-transform">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1 group-hover:text-destructive transition-colors">Withdrawal Approvals</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Review, authorize, or reject client settlement releases and payouts.</p>
                      </div>
                      <span className="text-[10px] text-destructive font-semibold uppercase tracking-wider mt-4 inline-flex items-center gap-1">Review Payouts &rarr;</span>
                    </Link>

                    <Link
                      href="/admin/orders"
                      className="bg-card border border-border hover:border-primary/40 rounded p-5 text-left transition-all hover:bg-card/80 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 group-hover:scale-105 transition-transform">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors">Orders & Enclosed Freight</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Fulfill vehicle checkouts, enclosed shipping, and hardware deliveries.</p>
                      </div>
                      <span className="text-[10px] text-primary font-semibold uppercase tracking-wider mt-4 inline-flex items-center gap-1">Track Shipments &rarr;</span>
                    </Link>

                    <Link
                      href="/admin/audit"
                      className="bg-card border border-border hover:border-zinc-400/40 rounded p-5 text-left transition-all hover:bg-card/80 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-8 h-8 rounded bg-muted border border-border flex items-center justify-center text-muted-foreground mb-3 group-hover:scale-105 transition-transform">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 15h6M9 11h6" /></svg>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1 group-hover:text-zinc-200 transition-colors">Settlement Audit Trail</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Immutable historical record of every balance transfer and credit event.</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-4 inline-flex items-center gap-1">View Audit Log &rarr;</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Category 2: Products & Catalog */}
              {(dashboardCategory === 'all' || dashboardCategory === 'catalog') && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Products & Commercial Offerings
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Link
                      href="/admin/plans"
                      className="bg-card border border-border hover:border-amber-500/40 rounded p-5 text-left transition-all hover:bg-card/80 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition-transform">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1 group-hover:text-amber-400 transition-colors">Investment Packages</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Sync proportional daily yields (15d 15% to 180d 180%), limits & terms.</p>
                      </div>
                      <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider mt-4 inline-flex items-center gap-1">Manage Yield Tiers &rarr;</span>
                    </Link>

                    <Link
                      href="/admin/inventory"
                      className="bg-card border border-border hover:border-amber-500/40 rounded p-5 text-left transition-all hover:bg-card/80 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition-transform">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 12l9 4 9-4"/><path d="M3 17l9 4 9-4"/></svg>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1 group-hover:text-amber-400 transition-colors">Vehicles & Hardware</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Live Tesla inventory, CPO specs, pricing, badges, and stock availability.</p>
                      </div>
                      <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider mt-4 inline-flex items-center gap-1">Edit Inventory &rarr;</span>
                    </Link>

                    <Link
                      href="/admin/giveaways"
                      className="bg-card border border-border hover:border-pink-500/40 rounded p-5 text-left transition-all hover:bg-card/80 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-8 h-8 rounded bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-3 group-hover:scale-105 transition-transform">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18"/></svg>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1 group-hover:text-pink-400 transition-colors">Verified Giveaways</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Manage authentic 2027 Model 3 & Cybertruck draws and verified entrants.</p>
                      </div>
                      <span className="text-[10px] text-pink-500 font-semibold uppercase tracking-wider mt-4 inline-flex items-center gap-1">Manage Campaigns &rarr;</span>
                    </Link>

                    <Link
                      href="/admin/sessions"
                      className="bg-card border border-border hover:border-zinc-400/40 rounded p-5 text-left transition-all hover:bg-card/80 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-8 h-8 rounded bg-muted border border-border flex items-center justify-center text-muted-foreground mb-3 group-hover:scale-105 transition-transform">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1 group-hover:text-zinc-200 transition-colors">Session Bookings</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Review private consultations, test drives, and advisory appointments.</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-4 inline-flex items-center gap-1">View Bookings &rarr;</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Category 3: Governance & Settings */}
              {(dashboardCategory === 'all' || dashboardCategory === 'system') && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Governance, Verification & Desk
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                    <Link
                      href="/admin/users"
                      className="bg-card border border-border hover:border-blue-500/40 rounded p-5 text-left transition-all hover:bg-card/80 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-105 transition-transform">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1 group-hover:text-blue-400 transition-colors">User Directory</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Accounts, balances, portfolios & credentials.</p>
                      </div>
                      <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider mt-4 inline-flex items-center gap-1">Open Directory &rarr;</span>
                    </Link>

                    <button
                      onClick={() => { setView('kyc'); setSelectedKyc(null); loadKYCSubmissions(); }}
                      className="relative bg-card border border-border hover:border-warning/40 rounded p-5 text-left transition-all hover:bg-card/80 group flex flex-col justify-between"
                    >
                      {kycList.filter(k => k.kyc_status === 'pending').length > 0 && (
                        <span className="absolute top-3 right-3 bg-warning text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {kycList.filter(k => k.kyc_status === 'pending').length}
                        </span>
                      )}
                      <div>
                        <div className="w-8 h-8 rounded bg-warning/10 border border-warning/20 flex items-center justify-center text-warning mb-3 group-hover:scale-105 transition-transform">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1 group-hover:text-warning transition-colors">KYC Verification</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Verify IDs, residential proof & accreditation.</p>
                      </div>
                      <span className="text-[10px] text-warning font-semibold uppercase tracking-wider mt-4 inline-flex items-center gap-1">Review Queue &rarr;</span>
                    </button>

                    <button
                      onClick={() => { setView('support'); setSelectedTicket(null); loadSupportTickets(); }}
                      className="relative bg-card border border-border hover:border-emerald-500/40 rounded p-5 text-left transition-all hover:bg-card/80 group flex flex-col justify-between"
                    >
                      {supportTickets.filter(t => t.ticket_status === 'open').length > 0 && (
                        <span className="absolute top-3 right-3 bg-emerald-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {supportTickets.filter(t => t.ticket_status === 'open').length}
                        </span>
                      )}
                      <div>
                        <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1 group-hover:text-emerald-400 transition-colors">Support Desk</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Respond to user tickets and email notifications.</p>
                      </div>
                      <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider mt-4 inline-flex items-center gap-1">Open Tickets &rarr;</span>
                    </button>

                    <button
                      onClick={() => { setView('analytics'); loadAnalytics(); }}
                      className="bg-card border border-border hover:border-blue-500/40 rounded p-5 text-left transition-all hover:bg-card/80 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-105 transition-transform">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1 group-hover:text-blue-400 transition-colors">Platform Telemetry</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Signups, geographic reach & investor adoption.</p>
                      </div>
                      <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider mt-4 inline-flex items-center gap-1">View Graphs &rarr;</span>
                    </button>

                    <Link
                      href="/admin/settings"
                      className="bg-card border border-border hover:border-cyan-500/40 rounded p-5 text-left transition-all hover:bg-card/80 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-105 transition-transform">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1 group-hover:text-cyan-400 transition-colors">Platform Settings</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Deposit wallets, fees, security & email configs.</p>
                      </div>
                      <span className="text-[10px] text-cyan-500 font-semibold uppercase tracking-wider mt-4 inline-flex items-center gap-1">Edit Config &rarr;</span>
                    </Link>

                    <Link
                      href="/admin/careers"
                      className="bg-card border border-border hover:border-zinc-400/40 rounded p-5 text-left transition-all hover:bg-card/80 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-8 h-8 rounded bg-muted border border-border flex items-center justify-center text-muted-foreground mb-3 group-hover:scale-105 transition-transform">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                        </div>
                        <p className="text-sm font-bold text-foreground mb-1 group-hover:text-zinc-200 transition-colors">Careers Pipeline</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Job listings & applicant submissions.</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-4 inline-flex items-center gap-1">View Candidates &rarr;</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ── User list ── */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Registered Users</h2>
              <span className="text-xs text-muted-foreground">{users.length} total</span>
            </div>
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24">
                <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <p className="text-sm text-muted-foreground">No users registered yet.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {users.map((u) => {
                  const hasData = u.investments.length > 0 || u.transactions.length > 0 || u.stats.totalPortfolio !== '$0';
                  const initials = u.userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <div key={u.userId} className="bg-card border border-border rounded p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border hover:bg-card transition-all duration-200 group">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">{initials}</div>
                          {hasData && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-border" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{u.userName}</p>
                          <p className="text-xs text-muted-foreground">{u.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-8">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Portfolio</p>
                          <p className="text-sm font-bold text-foreground">{u.stats.totalPortfolio}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Returns</p>
                          <p className="text-sm font-bold text-success">{u.stats.totalReturns || '$0'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Packages</p>
                          <p className="text-sm font-bold text-foreground">{u.investments.length}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Status</p>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${hasData ? 'bg-success/10 text-success border border-success/20' : 'bg-muted text-muted-foreground border border-border'}`}>{hasData ? 'Active' : 'Empty'}</span>
                        </div>
                        <button onClick={() => openEdit(u)} className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary text-xs font-bold rounded transition-all tracking-widest uppercase">Manage</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Analytics View ─────────────────────────────────────────────── */}
        {view === 'analytics' && (
          <>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-medium text-foreground tracking-tight mb-1">User Analytics</h1>
                <p className="text-sm text-muted-foreground">Demographics, geography, and platform activity — live from Supabase.</p>
              </div>
              <button onClick={loadAnalytics} disabled={analyticsLoading} className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground text-xs font-semibold rounded transition-all disabled:opacity-50 self-start sm:self-auto">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={analyticsLoading ? 'animate-spin' : ''} aria-hidden="true"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                Refresh
              </button>
            </div>
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : !analyticsData ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24"><p className="text-sm text-muted-foreground">No data available yet.</p></div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Users', value: analyticsData.totalUsers, icon: '👥', color: 'text-foreground' },
                    { label: 'KYC Approved', value: analyticsData.verifiedUsers, icon: '✅', color: 'text-success' },
                    { label: 'Active Portfolios', value: analyticsData.activeUsers, icon: '📈', color: 'text-primary' },
                    { label: 'Portfolio Rows', value: analyticsData.portfolioUsers, icon: '🗂️', color: 'text-zinc-300' },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-card border border-border rounded p-5">
                      <div className="flex items-center justify-between mb-3"><span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{kpi.label}</span><span className="text-lg">{kpi.icon}</span></div>
                      <p className={`text-3xl font-medium ${kpi.color}`}>{kpi.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-card border border-border rounded p-6">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-5">Signups Over Time</h3>
                  {analyticsData.signupsOverTime.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">No signup data available.</p> : (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={analyticsData.signupsOverTime} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12131A" />
                        <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: '#0D0E12', border: '1px solid #1E2027', borderRadius: 6, fontSize: 11 }} labelStyle={{ color: '#D4D4D8' }} itemStyle={{ color: '#E82127' }} />
                        <Line type="monotone" dataKey="signups" stroke="#E82127" strokeWidth={2} dot={{ fill: '#E82127', r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-card border border-border rounded p-6">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-5">KYC Status Breakdown</h3>
                    {analyticsData.kycBreakdown.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">No KYC data yet.</p> : (
                      <div className="flex items-center gap-6">
                        <ResponsiveContainer width={140} height={140}>
                          <PieChart>
                            <Pie data={analyticsData.kycBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                              {analyticsData.kycBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#0D0E12', border: '1px solid #1E2027', borderRadius: 6, fontSize: 11 }} itemStyle={{ color: '#FFFFFF' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-2">
                          {analyticsData.kycBreakdown.map((item) => (
                            <div key={item.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} /><span className="text-xs text-muted-foreground">{item.name}</span></div>
                              <span className="text-xs font-bold text-foreground">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-card border border-border rounded p-6">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-5">Top Countries (KYC)</h3>
                    {analyticsData.countryBreakdown.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">No country data yet.</p> : (
                      <div className="space-y-3">
                        {analyticsData.countryBreakdown.map((item, i) => {
                          const maxCount = analyticsData.countryBreakdown[0]?.count ?? 1;
                          const pct = Math.round((item.count / maxCount) * 100);
                          return (
                            <div key={item.country}>
                              <div className="flex items-center justify-between mb-1"><span className="text-xs text-foreground/90 font-semibold">{item.country}</span><span className="text-xs font-bold text-foreground">{item.count}</span></div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} /></div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-card border border-border rounded p-6">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-5">Investor Type</h3>
                    {analyticsData.investorTypeBreakdown.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">No investor type data yet.</p> : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={analyticsData.investorTypeBreakdown} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12131A" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: '#0D0E12', border: '1px solid #1E2027', borderRadius: 6, fontSize: 11 }} labelStyle={{ color: '#D4D4D8' }} itemStyle={{ color: '#E82127' }} />
                          <Bar dataKey="value" fill="#E82127" radius={[3, 3, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="bg-card border border-border rounded p-6">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-5">Annual Income Range</h3>
                    {analyticsData.incomeBreakdown.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">No income data yet.</p> : (
                      <div className="space-y-3">
                        {analyticsData.incomeBreakdown.map((item, i) => {
                          const total = analyticsData.incomeBreakdown.reduce((s, d) => s + d.value, 0);
                          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                          return (
                            <div key={item.name}>
                              <div className="flex items-center justify-between mb-1"><span className="text-xs text-foreground/90 font-semibold truncate max-w-[60%]">{item.name}</span><span className="text-xs font-bold text-foreground">{item.value} <span className="text-muted-foreground font-normal">({pct}%)</span></span></div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} /></div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-card border border-border rounded p-6">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-5">Platform Activity Summary</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Verification Rate', value: analyticsData.totalUsers > 0 ? `${Math.round((analyticsData.verifiedUsers / analyticsData.totalUsers) * 100)}%` : '0%', sub: `${analyticsData.verifiedUsers} of ${analyticsData.totalUsers} users`, color: 'text-success' },
                      { label: 'Portfolio Adoption', value: analyticsData.totalUsers > 0 ? `${Math.round((analyticsData.portfolioUsers / analyticsData.totalUsers) * 100)}%` : '0%', sub: `${analyticsData.portfolioUsers} have portfolios`, color: 'text-zinc-300' },
                      { label: 'Active Investors', value: analyticsData.totalUsers > 0 ? `${Math.round((analyticsData.activeUsers / analyticsData.totalUsers) * 100)}%` : '0%', sub: `${analyticsData.activeUsers} with funded portfolios`, color: 'text-primary' },
                      { label: 'Unverified Users', value: analyticsData.unverifiedUsers, sub: 'awaiting KYC approval', color: 'text-warning' },
                    ].map((stat) => (
                      <div key={stat.label} className="border border-border rounded p-4">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">{stat.label}</p>
                        <p className={`text-2xl font-medium mb-1 ${stat.color}`}>{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* KYC Review View */}
        {view === 'kyc' && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-medium text-foreground tracking-tight mb-1">KYC Review</h1>
              <p className="text-sm text-muted-foreground">Review and approve identity verification submissions.</p>
            </div>
            {selectedKyc ? (
              <div>
                <button onClick={() => setSelectedKyc(null)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                  Back to KYC List
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-card border border-border rounded p-5">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Applicant</h3>
                      <p className="text-sm font-bold text-foreground mb-1">{selectedKyc.user_profiles?.full_name || 'Unknown User'}</p>
                      <p className="text-xs text-muted-foreground mb-4">{selectedKyc.user_profiles?.email}</p>
                      <div className="space-y-2">
                        {[
                          { label: 'Submitted', value: selectedKyc.submitted_at ? new Date(selectedKyc.submitted_at).toLocaleDateString() : '—' },
                          { label: 'Country', value: selectedKyc.country || '—' },
                          { label: 'Investor Type', value: selectedKyc.investor_type || '—' },
                          { label: 'Income', value: selectedKyc.annual_income || '—' },
                          { label: 'Experience', value: selectedKyc.investment_experience || '—' },
                        ].map((item) => (
                          <div key={item.label} className="flex justify-between py-1.5 border-b border-border">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{item.label}</span>
                            <span className="text-xs font-semibold text-foreground">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-card border border-border rounded p-5">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Current Status</h3>
                      <span className={`inline-flex items-center px-3 py-1.5 rounded border text-xs font-bold uppercase tracking-widest ${kycStatusConfig[selectedKyc.kyc_status]?.bg} ${kycStatusConfig[selectedKyc.kyc_status]?.color}`}>{kycStatusConfig[selectedKyc.kyc_status]?.label}</span>
                    </div>
                    <div className="bg-card border border-border rounded p-5">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Admin Notes</h3>
                      <textarea value={kycNotes} onChange={(e) => setKycNotes(e.target.value)} placeholder="Add notes for the applicant (optional)..." rows={3} className="w-full px-3 py-2.5 rounded text-sm input-tesla resize-none" />
                    </div>
                    <div className="space-y-2">
                      <button onClick={() => updateKYCStatus('approved')} disabled={kycSaving || selectedKyc.kyc_status === 'approved'} className="w-full py-3 rounded text-xs font-bold uppercase tracking-widest transition-all bg-success/10 hover:bg-success/20 border border-success/20 hover:border-success/40 text-success disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {kycSaving ? <div className="w-3 h-3 border-2 border-success border-t-transparent rounded-full animate-spin" /> : '✓'} Approve KYC
                      </button>
                      <button onClick={() => updateKYCStatus('under_review')} disabled={kycSaving || selectedKyc.kyc_status === 'under_review'} className="w-full py-3 rounded text-xs font-bold uppercase tracking-widest transition-all bg-zinc-300/10 hover:bg-zinc-300/20 border border-zinc-300/20 hover:border-zinc-300/40 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed">Mark Under Review</button>
                      <button onClick={() => updateKYCStatus('rejected')} disabled={kycSaving || selectedKyc.kyc_status === 'rejected'} className="w-full py-3 rounded text-xs font-bold uppercase tracking-widest transition-all bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 hover:border-destructive/40 text-destructive disabled:opacity-40 disabled:cursor-not-allowed">Reject KYC</button>
                      {kycSaved && <p className="text-center text-xs text-success font-semibold">✓ Status updated</p>}
                    </div>
                  </div>
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-card border border-border rounded p-5">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Identity Documents</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { label: 'Government ID (Front)', url: selectedKyc.id_document_url, detail: `${selectedKyc.id_type?.replace('_', ' ')} · ${selectedKyc.id_number}` },
                          { label: 'Government ID (Back)', url: selectedKyc.id_document_back_url, detail: 'Back side' },
                          { label: 'Proof of Address', url: selectedKyc.address_proof_url, detail: `${selectedKyc.street_address}, ${selectedKyc.city}` },
                          { label: 'Income Verification', url: selectedKyc.income_document_url, detail: selectedKyc.annual_income || '' },
                        ].map((doc) => (
                          <div key={doc.label} className="border border-border rounded overflow-hidden">
                            <div className="p-3 border-b border-border">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{doc.label}</p>
                              {doc.detail && <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{doc.detail}</p>}
                            </div>
                            {doc.url ? (
                              <div className="p-3">
                                {doc.url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                                  <img src={doc.url} alt={`${doc.label} document`} className="w-full h-32 object-cover rounded" />
                                ) : (
                                  <div className="h-32 flex flex-col items-center justify-center gap-2 bg-background rounded">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                    <span className="text-[10px] text-muted-foreground">PDF Document</span>
                                  </div>
                                )}
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-primary hover:underline">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                  View Full Document
                                </a>
                              </div>
                            ) : (
                              <div className="p-3 h-32 flex items-center justify-center"><p className="text-[10px] text-[#333333]">Not uploaded</p></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-card border border-border rounded p-5">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Residential Address</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Street', value: selectedKyc.street_address },
                          { label: 'City', value: selectedKyc.city },
                          { label: 'ZIP / Postal', value: selectedKyc.zip_code },
                          { label: 'Country', value: selectedKyc.country },
                          { label: 'Date of Birth', value: selectedKyc.date_of_birth },
                        ].map((item) => (
                          <div key={item.label}>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                            <p className="text-xs font-semibold text-foreground">{item.value || '—'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
                  {(['all', 'pending', 'under_review', 'approved', 'rejected'] as const).map((f) => {
                    const count = f === 'all' ? kycList.length : kycList.filter((k) => k.kyc_status === f).length;
                    return (
                      <button key={f} onClick={() => setKycFilter(f)} className={`px-4 py-3 text-xs font-semibold tracking-widest uppercase transition-colors border-b-2 -mb-px whitespace-nowrap flex items-center gap-1.5 ${kycFilter === f ? 'text-foreground border-primary' : 'text-muted-foreground border-transparent hover:text-muted-foreground'}`}>
                        {f === 'under_review' ? 'Under Review' : f.charAt(0).toUpperCase() + f.slice(1)}
                        {count > 0 && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${kycFilter === f ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}>{count}</span>}
                      </button>
                    );
                  })}
                </div>
                {kycLoading ? (
                  <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                ) : filteredKyc.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-24">
                    <p className="text-sm text-muted-foreground">No KYC submissions found.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredKyc.map((kyc) => {
                      const cfg = kycStatusConfig[kyc.kyc_status];
                      return (
                        <div key={kyc.id} className="bg-card border border-border rounded p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">{(kyc.user_profiles?.full_name || 'U').charAt(0).toUpperCase()}</div>
                            <div>
                              <p className="text-sm font-bold text-foreground">{kyc.user_profiles?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{kyc.user_profiles?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 sm:gap-8">
                            <div className="text-center"><p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Country</p><p className="text-sm font-bold text-foreground">{kyc.country || '—'}</p></div>
                            <div className="text-center"><p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Submitted</p><p className="text-xs font-semibold text-foreground">{kyc.submitted_at ? new Date(kyc.submitted_at).toLocaleDateString() : '—'}</p></div>
                            <div className="text-center"><p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">Status</p><span className={`text-xs font-semibold px-2 py-0.5 rounded border ${cfg?.bg} ${cfg?.color}`}>{cfg?.label}</span></div>
                            <button onClick={() => openKYCDetail(kyc)} className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary text-xs font-semibold rounded transition-all">Review</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Support Tickets View ─────────────────────────────────────── */}
        {view === 'support' && (
          <>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-medium text-foreground tracking-tight mb-1">Support Tickets</h1>
                <p className="text-sm text-muted-foreground">Manage user support requests and send email updates.</p>
              </div>
              <div className="flex items-center gap-3">
                <select value={supportFilter} onChange={e => setSupportFilter(e.target.value as any)} className="bg-card border border-border text-foreground/90 text-xs rounded px-3 py-2 focus:outline-none focus:border-border">
                  <option value="all">All Tickets</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button onClick={loadSupportTickets} disabled={supportLoading} className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground text-xs font-semibold rounded transition-all disabled:opacity-50">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={supportLoading ? 'animate-spin' : ''} aria-hidden="true"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                  Refresh
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {(['open', 'in_progress', 'resolved', 'closed'] as TicketStatus[]).map(s => (
                <div key={s} className="bg-card border border-border rounded p-4">
                  <p className="text-2xl font-bold" style={{ color: TICKET_STATUS_CONFIG[s].color }}>{supportTickets.filter(t => t.ticket_status === s).length}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{TICKET_STATUS_CONFIG[s].label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 space-y-2">
                {supportLoading ? (
                  <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                  (supportFilter === 'all' ? supportTickets : supportTickets.filter(t => t.ticket_status === supportFilter)).map(ticket => (
                    <button key={ticket.id} onClick={() => { setSelectedTicket(ticket); setTicketReply(ticket.admin_reply || ''); setTicketStatusUpdate(ticket.ticket_status); setTicketSaved(false); }} className={`w-full text-left p-4 rounded border transition-all ${selectedTicket?.id === ticket.id ? 'bg-muted border-primary/40' : 'bg-card border-border hover:border-border'}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono text-muted-foreground">{ticket.ticket_number}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: TICKET_STATUS_CONFIG[ticket.ticket_status].color, background: `${TICKET_STATUS_CONFIG[ticket.ticket_status].color}15` }}>{TICKET_STATUS_CONFIG[ticket.ticket_status].label}</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{ticket.user_profiles?.email || ticket.user_email}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </button>
                  ))
                )}
                {!supportLoading && supportTickets.length === 0 && <div className="text-center py-16 text-muted-foreground text-sm">No support tickets yet.</div>}
              </div>
              <div className="lg:col-span-3">
                {!selectedTicket ? (
                  <div className="flex flex-col items-center justify-center h-64 bg-card border border-border rounded">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <p className="text-muted-foreground text-sm mt-3">Select a ticket to review</p>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded p-6 space-y-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{selectedTicket.ticket_number}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize" style={{ color: TICKET_STATUS_CONFIG[selectedTicket.ticket_status].color, background: `${TICKET_STATUS_CONFIG[selectedTicket.ticket_status].color}15` }}>{TICKET_STATUS_CONFIG[selectedTicket.ticket_status].label}</span>
                        <span className="text-xs text-muted-foreground capitalize">{selectedTicket.priority} priority</span>
                      </div>
                      <h2 className="text-lg font-bold text-foreground">{selectedTicket.subject}</h2>
                      <p className="text-xs text-muted-foreground mt-1">{selectedTicket.user_profiles?.full_name || selectedTicket.user_name || 'Unknown'} · {selectedTicket.user_profiles?.email || selectedTicket.user_email} · {TICKET_CATEGORY_LABELS[selectedTicket.category]}</p>
                    </div>
                    <div className="bg-background border border-border rounded p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">User Request</p>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                    </div>
                    {selectedTicket.admin_reply && (
                      <div className="bg-background border border-primary/20 rounded p-4">
                        <p className="text-xs text-primary uppercase tracking-widest mb-2">Previous Response</p>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedTicket.admin_reply}</p>
                      </div>
                    )}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2">Update Status</label>
                        <div className="grid grid-cols-4 gap-2">
                          {(['open', 'in_progress', 'resolved', 'closed'] as TicketStatus[]).map(s => (
                            <button key={s} type="button" onClick={() => setTicketStatusUpdate(s)} className={`py-2 rounded text-xs font-bold capitalize border transition-all ${ticketStatusUpdate === s ? 'border-current' : 'border-border text-muted-foreground hover:border-border'}`} style={ticketStatusUpdate === s ? { color: TICKET_STATUS_CONFIG[s].color, background: `${TICKET_STATUS_CONFIG[s].color}15` } : {}}>{TICKET_STATUS_CONFIG[s].label}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2">Reply to User (optional)</label>
                        <textarea rows={4} value={ticketReply} onChange={e => setTicketReply(e.target.value)} placeholder="Write a response that will be sent to the user via email and shown in their ticket…" className="w-full bg-background border border-border rounded px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border resize-none" />
                      </div>
                      <button onClick={updateTicketStatus} disabled={ticketSaving} className="w-full py-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary text-xs font-bold rounded tracking-widest uppercase transition-all disabled:opacity-50">
                        {ticketSaving ? 'Saving…' : ticketSaved ? '✓ Saved & Email Sent' : 'Update Ticket & Notify User'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Edit User Portfolio View */}
        {view === 'edit' && selectedPortfolio && (
          <>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-medium text-foreground tracking-tight mb-0.5">{selectedPortfolio.userName}</h1>
                <p className="text-xs text-muted-foreground">{selectedPortfolio.userEmail}</p>
              </div>
              <button onClick={handleSave} className="px-6 py-2.5 tesla-btn-primary rounded text-sm font-semibold flex items-center gap-2 self-start sm:self-auto">
                {saved ? (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>Saved!</>) : 'Save Changes'}
              </button>
            </div>
            <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
              {sections.map((s) => (
                <button key={s.id} onClick={() => setActiveSection(s.id)} className={`px-4 py-3 text-xs font-semibold tracking-widest uppercase transition-colors border-b-2 -mb-px whitespace-nowrap ${activeSection === s.id ? 'text-foreground border-primary' : 'text-muted-foreground border-transparent hover:text-muted-foreground'}`}>{s.label}</button>
              ))}
            </div>
            {activeSection === 'stats' && (
              <div className="bg-card border border-border rounded p-6">
                <h3 className="text-sm font-bold text-foreground mb-5">Portfolio Statistics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'totalPortfolio', label: 'Total Portfolio Value', placeholder: '$84,500' },
                    { key: 'activeInvestments', label: 'Active Investments Count', placeholder: '2' },
                    { key: 'totalReturns', label: 'Total Returns', placeholder: '$9,500' },
                    { key: 'referralEarnings', label: 'Referral Earnings', placeholder: '$320' },
                    { key: 'portfolioChange', label: 'Portfolio Change Label', placeholder: '+$12,500 (17.4%)' },
                    { key: 'returnsChange', label: 'Returns Change Label', placeholder: '+$1,240 this month' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">{field.label}</label>
                      <input type="text" value={String(selectedPortfolio.stats[field.key as keyof typeof selectedPortfolio.stats])} onChange={(e) => updateStats(field.key as keyof UserPortfolio['stats'], e.target.value)} placeholder={field.placeholder} className="w-full px-4 py-2.5 rounded text-sm input-tesla" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeSection === 'investments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{selectedPortfolio.investments.length} investment(s)</p>
                  <button onClick={addInvestment} className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-semibold rounded transition-all flex items-center gap-1.5"><span>+</span> Add Investment</button>
                </div>
                {selectedPortfolio.investments.length === 0 && <div className="bg-card border border-border rounded p-8 text-center"><p className="text-xs text-muted-foreground">No investments yet. Click &quot;Add Investment&quot; to create one.</p></div>}
                {selectedPortfolio.investments.map((inv) => (
                  <div key={inv.id} className="bg-card border border-border rounded p-5">
                    <div className="flex items-center justify-between mb-4"><span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Investment</span><button onClick={() => removeInvestment(inv.id)} className="text-xs text-muted-foreground hover:text-primary transition-colors">Remove</button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'name', label: 'Package Name', placeholder: 'Growth Portfolio' },
                        { key: 'invested', label: 'Amount Invested', placeholder: '$25,000' },
                        { key: 'current', label: 'Current Value', placeholder: '$28,500' },
                        { key: 'returnPct', label: 'Return %', placeholder: '+14.0%' },
                        { key: 'status', label: 'Status', placeholder: 'Active' },
                        { key: 'duration', label: 'Duration', placeholder: '24 months' },
                      ].map((f) => (
                        <div key={f.key}>
                          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">{f.label}</label>
                          <input type="text" value={String(inv[f.key as keyof Investment])} onChange={(e) => updateInvestment(inv.id, f.key as keyof Investment, e.target.value)} placeholder={f.placeholder} className="w-full px-3 py-2 rounded text-sm input-tesla" />
                        </div>
                      ))}
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Progress (0-100)</label>
                        <input type="number" min="0" max="100" value={inv.progress} onChange={(e) => updateInvestment(inv.id, 'progress', Number(e.target.value))} className="w-full px-3 py-2 rounded text-sm input-tesla" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeSection === 'transactions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{selectedPortfolio.transactions.length} transaction(s)</p>
                  <button onClick={addTransaction} className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-semibold rounded transition-all flex items-center gap-1.5"><span>+</span> Add Transaction</button>
                </div>
                {selectedPortfolio.transactions.length === 0 && <div className="bg-card border border-border rounded p-8 text-center"><p className="text-xs text-muted-foreground">No transactions yet.</p></div>}
                {selectedPortfolio.transactions.map((tx) => (
                  <div key={tx.id} className="bg-card border border-border rounded p-5">
                    <div className="flex items-center justify-between mb-4"><span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Transaction</span><button onClick={() => removeTransaction(tx.id)} className="text-xs text-muted-foreground hover:text-primary transition-colors">Remove</button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Type</label>
                        <select value={tx.type} onChange={(e) => updateTransaction(tx.id, 'type', e.target.value)} className="w-full px-3 py-2 rounded text-sm input-tesla">
                          <option value="Investment">Investment</option>
                          <option value="Return">Return</option>
                          <option value="Withdrawal">Withdrawal</option>
                        </select>
                      </div>
                      {[
                        { key: 'asset', label: 'Asset / Package', placeholder: 'Growth Portfolio' },
                        { key: 'amount', label: 'Amount', placeholder: '+$25,000' },
                        { key: 'date', label: 'Date', placeholder: 'Aug 10, 2026' },
                        { key: 'status', label: 'Status', placeholder: 'Active' },
                      ].map((f) => (
                        <div key={f.key}>
                          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">{f.label}</label>
                          <input type="text" value={String(tx[f.key as keyof Transaction])} onChange={(e) => updateTransaction(tx.id, f.key as keyof Transaction, e.target.value)} placeholder={f.placeholder} className="w-full px-3 py-2 rounded text-sm input-tesla" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeSection === 'alerts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{selectedPortfolio.alerts.length} alert(s)</p>
                  <button onClick={addAlert} className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-semibold rounded transition-all flex items-center gap-1.5"><span>+</span> Add Alert</button>
                </div>
                {selectedPortfolio.alerts.length === 0 && <div className="bg-card border border-border rounded p-8 text-center"><p className="text-xs text-muted-foreground">No alerts yet.</p></div>}
                {selectedPortfolio.alerts.map((alert) => (
                  <div key={alert.id} className="bg-card border border-border rounded p-5">
                    <div className="flex items-center justify-between mb-4"><span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Alert</span><button onClick={() => removeAlert(alert.id)} className="text-xs text-muted-foreground hover:text-primary transition-colors">Remove</button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'icon', label: 'Icon (emoji)', placeholder: '📈' },
                        { key: 'text', label: 'Message', placeholder: 'Portfolio gained $1,840 today' },
                        { key: 'time', label: 'Time Label', placeholder: '2h ago' },
                      ].map((f) => (
                        <div key={f.key}>
                          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">{f.label}</label>
                          <input type="text" value={String(alert[f.key as keyof Alert])} onChange={(e) => updateAlert(alert.id, f.key as keyof Alert, e.target.value)} placeholder={f.placeholder} className="w-full px-3 py-2 rounded text-sm input-tesla" />
                        </div>
                      ))}
                      <div className="flex items-center gap-3 pt-4">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Unread</label>
                        <button onClick={() => updateAlert(alert.id, 'unread', !alert.unread)} className={`relative w-10 h-5 rounded-full transition-colors ${alert.unread ? 'bg-primary' : 'bg-muted'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${alert.unread ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeSection === 'chart' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{selectedPortfolio.chartData.length} data point(s)</p>
                  <button onClick={addChartPoint} className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-semibold rounded transition-all flex items-center gap-1.5"><span>+</span> Add Point</button>
                </div>
                {selectedPortfolio.chartData.length === 0 && <div className="bg-card border border-border rounded p-8 text-center"><p className="text-xs text-muted-foreground">No chart data yet.</p></div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedPortfolio.chartData.map((pt, i) => (
                    <div key={i} className="bg-card border border-border rounded p-4">
                      <div className="flex items-center justify-between mb-3"><span className="text-[10px] text-muted-foreground uppercase tracking-widest">Point {i + 1}</span><button onClick={() => removeChartPoint(i)} className="text-[10px] text-muted-foreground hover:text-primary transition-colors">Remove</button></div>
                      <div className="space-y-2">
                        <div><label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Month</label><input type="text" value={pt.month} onChange={(e) => updateChartPoint(i, 'month', e.target.value)} placeholder="Jan" className="w-full px-3 py-2 rounded text-sm input-tesla" /></div>
                        <div><label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Value ($)</label><input type="number" value={pt.value} onChange={(e) => updateChartPoint(i, 'value', e.target.value)} placeholder="50000" className="w-full px-3 py-2 rounded text-sm input-tesla" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeSection === 'allocation' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{selectedPortfolio.allocation.length} allocation(s) — values should sum to 100%</p>
                  <button onClick={addAllocation} className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-semibold rounded transition-all flex items-center gap-1.5"><span>+</span> Add Allocation</button>
                </div>
                {selectedPortfolio.allocation.length === 0 && <div className="bg-card border border-border rounded p-8 text-center"><p className="text-xs text-muted-foreground">No allocation data yet.</p></div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedPortfolio.allocation.map((item, i) => (
                    <div key={i} className="bg-card border border-border rounded p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: item.color }} /><span className="text-[10px] text-muted-foreground uppercase tracking-widest">Slice {i + 1}</span></div>
                        <button onClick={() => removeAllocation(i)} className="text-[10px] text-muted-foreground hover:text-primary transition-colors">Remove</button>
                      </div>
                      <div className="space-y-2">
                        <div><label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Name</label><input type="text" value={item.name} onChange={(e) => updateAllocation(i, 'name', e.target.value)} placeholder="Vehicles" className="w-full px-3 py-2 rounded text-sm input-tesla" /></div>
                        <div><label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Value (%)</label><input type="number" min="0" max="100" value={item.value} onChange={(e) => updateAllocation(i, 'value', e.target.value)} placeholder="45" className="w-full px-3 py-2 rounded text-sm input-tesla" /></div>
                        <div>
                          <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Color</label>
                          <select value={item.color} onChange={(e) => updateAllocation(i, 'color', e.target.value)} className="w-full px-3 py-2 rounded text-sm input-tesla">
                            {ALLOC_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-8 pt-6 border-t border-border flex justify-end">
              <button onClick={handleSave} className="px-8 py-3 tesla-btn-primary rounded text-sm font-semibold flex items-center gap-2">
                {saved ? (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>Saved!</>) : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
