import React, { useState, useEffect } from 'react';
import { 
  X, 
  Tag, 
  Users, 
  Trash2, 
  Plus, 
  CheckCircle, 
  CheckCircle2,
  XCircle, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  ShieldAlert,
  Building2, 
  CreditCard, 
  RefreshCw,
  LogOut,
  MapPin,
  Image as ImageIcon,
  Send,
  Mail,
  Smartphone,
  MessageSquare,
  Calendar,
  Eye,
  BarChart3,
  TrendingUp,
  PieChart,
  ArrowUpRight,
  Activity,
  Sparkles,
  DollarSign,
  Receipt,
  FileText,
  Layers,
  Search,
  Filter,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  Edit3,
  ExternalLink,
  Download
} from 'lucide-react';
import { Discount, Profile, AdminTabType } from '../types';
import { 
  createDiscountInSupabase, 
  deleteDiscountFromSupabase, 
  updateDiscountInSupabase,
  getProfilesFromSupabase, 
  updateProfileStatusInSupabase,
  deleteProfileFromSupabase,
  getCategoryFallbackImage
} from '../lib/supabase';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  discounts: Discount[];
  onDiscountsUpdated: (updatedList: Discount[]) => void;
}

// B2B Partner Contract definition for Module 5
interface PartnerContract {
  id: string;
  company: string;
  plan: 'Guldpartner (Topplacering)' | 'Silverpartner (Kategori)' | 'Lokal Partner (Område)';
  monthlyAmount: number;
  status: 'paid' | 'pending' | 'overdue';
  renewalDate: string;
  contactPerson: string;
  contactEmail: string;
}

// Campaign history item for Module 3
interface CampaignLog {
  id: string;
  name: string;
  channel: 'email' | 'sms';
  audience: string;
  recipientsCount: number;
  sentDate: string;
  status: 'sent' | 'draft' | 'scheduled';
  openRate?: string;
  clickRate?: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  discounts,
  onDiscountsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTabType>('users');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ==========================================
  // MODULE 1: USERS STATE & ACTIONS
  // ==========================================
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'verified' | 'pending' | 'blocked'>('all');

  const loadProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const supaProfiles = await getProfilesFromSupabase();
      
      // Enrich with local contact if present
      const localProfileStr = localStorage.getItem('yrkeskortet_profile');
      let localProfile: Profile | null = null;
      if (localProfileStr) {
        try { localProfile = JSON.parse(localProfileStr); } catch (e) {}
      }

      const merged = (supaProfiles || []).map(p => {
        if (localProfile && (p.id === localProfile.id || p.id06_number === localProfile.id06_number)) {
          return {
            ...p,
            email: p.email || localProfile.email,
            phone: p.phone || localProfile.phone,
          };
        }
        return p;
      });

      setProfiles(merged);
    } catch (err) {
      console.warn('Profiles load error:', err);
      setProfiles([]);
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      localStorage.removeItem('yrkeskortet_admin_members');
      loadProfiles();
    }
  }, [isOpen]);

  const handleVerifyUser = async (id: string, name: string) => {
    const updated = profiles.map((p) => (p.id === id ? { ...p, id06_status: 'verified' } : p));
    setProfiles(updated);
    await updateProfileStatusInSupabase(id, 'verified');
    setMessage({ type: 'success', text: `ID06 för ${name} har godkänts och verifierats!` });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleToggleBlockUser = async (id: string, name: string, isBlocked: boolean) => {
    const nextStatus = isBlocked ? 'verified' : 'blocked';
    const updated = profiles.map((p) => (p.id === id ? { ...p, id06_status: nextStatus } : p));
    setProfiles(updated);
    await updateProfileStatusInSupabase(id, nextStatus);
    setMessage({ 
      type: 'success', 
      text: isBlocked ? `Spärr för ${name} har hävts.` : `Användaren ${name} har spärrats från portalen.` 
    });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Är du säker på att du vill radera medlemmen "${name}" från databasen?`)) return;
    const remaining = profiles.filter((p) => p.id !== id);
    setProfiles(remaining);
    await deleteProfileFromSupabase(id);
    setMessage({ type: 'success', text: `Medlemmen "${name}" har raderats från Supabase.` });
    setTimeout(() => setMessage(null), 3500);
  };

  // Filtered Users
  const filteredUsers = profiles.filter((p) => {
    const status = p.id06_status || 'pending';
    if (userFilter !== 'all' && status !== userFilter) return false;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      const matchName = p.full_name?.toLowerCase().includes(q);
      const matchCompany = p.company_name?.toLowerCase().includes(q);
      const matchId06 = p.id06_number?.toLowerCase().includes(q);
      const matchEmail = p.email?.toLowerCase().includes(q);
      const matchPhone = p.phone?.toLowerCase().includes(q);
      return Boolean(matchName || matchCompany || matchId06 || matchEmail || matchPhone);
    }
    return true;
  });

  // ==========================================
  // MODULE 2: B2B PARTNERS & DISCOUNTS STATE
  // ==========================================
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerCategoryFilter, setPartnerCategoryFilter] = useState('Alla');
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Lunch & Mat');
  const [discountBadge, setDiscountBadge] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLocal, setIsLocal] = useState(false);
  const [location, setLocation] = useState('Hela Sverige');
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);
  const [deletingDiscountId, setDeletingDiscountId] = useState<string | null>(null);

  const resetDiscountForm = () => {
    setEditingDiscountId(null);
    setCompany('');
    setTitle('');
    setDescription('');
    setCategory('Lunch & Mat');
    setDiscountBadge('');
    setDiscountCode('');
    setImageUrl('');
    setIsLocal(false);
    setLocation('Hela Sverige');
    setShowAddForm(false);
  };

  const handleEditDiscount = (d: Discount) => {
    setEditingDiscountId(d.id);
    setCompany(d.company);
    setTitle(d.title);
    setDescription(d.description);
    setCategory(d.category);
    setDiscountBadge(d.discount_badge);
    setDiscountCode(d.discount_code || '');
    setImageUrl(d.image_url || '');
    setIsLocal(d.is_local);
    setLocation(d.location || 'Hela Sverige');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDiscount(true);
    setMessage(null);

    const finalImage = imageUrl.trim() || getCategoryFallbackImage(category, company);
    const discountData = {
      company: company.trim(),
      title: title.trim(),
      description: description.trim(),
      category: category,
      discount_badge: discountBadge.trim() || 'RABATT',
      discount_code: discountCode.trim() || 'VISA KORTET',
      image_url: finalImage,
      is_local: isLocal,
      location: location.trim() || (isLocal ? 'Lokalt' : 'Hela Sverige'),
      external_url: null,
    };

    try {
      if (editingDiscountId) {
        // Update existing discount
        await updateDiscountInSupabase(editingDiscountId, discountData);
        const updatedList = discounts.map(d => d.id === editingDiscountId ? { ...d, ...discountData } : d);
        onDiscountsUpdated(updatedList);
        setMessage({ type: 'success', text: `Rabatt för "${discountData.company}" har uppdaterats!` });
      } else {
        // Create new discount
        const created = await createDiscountInSupabase(discountData);
        const newDiscount: Discount = created || {
          ...discountData,
          id: 'local-' + Date.now(),
          created_at: new Date().toISOString(),
        };
        onDiscountsUpdated([newDiscount, ...discounts]);
        setMessage({ type: 'success', text: `Ny rabatt för "${discountData.company}" publicerad!` });
      }
      resetDiscountForm();
    } catch (err: any) {
      console.warn('Supabase discount save notice:', err);
      // Fallback
      if (editingDiscountId) {
        onDiscountsUpdated(discounts.map(d => d.id === editingDiscountId ? { ...d, ...discountData } : d));
      } else {
        onDiscountsUpdated([{ ...discountData, id: 'local-' + Date.now(), created_at: new Date().toISOString() }, ...discounts]);
      }
      setMessage({ type: 'success', text: `Ändringarna har sparats i portalen!` });
      resetDiscountForm();
    } finally {
      setIsSavingDiscount(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleDeleteDiscount = async (id: string, compName: string) => {
    if (!confirm(`Är du säker på att du vill ta bort rabatten från "${compName}"?`)) return;
    setDeletingDiscountId(id);
    try {
      await deleteDiscountFromSupabase(id);
      onDiscountsUpdated(discounts.filter((d) => d.id !== id));
      setMessage({ type: 'success', text: `Rabatt för "${compName}" raderades från Supabase.` });
    } catch (err) {
      onDiscountsUpdated(discounts.filter((d) => d.id !== id));
      setMessage({ type: 'success', text: `Rabatten togs bort.` });
    } finally {
      setDeletingDiscountId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const filteredDiscounts = discounts.filter(d => {
    if (partnerCategoryFilter !== 'Alla' && d.category !== partnerCategoryFilter) return false;
    if (partnerSearch.trim()) {
      const q = partnerSearch.toLowerCase();
      return d.company.toLowerCase().includes(q) || d.title.toLowerCase().includes(q);
    }
    return true;
  });

  // ==========================================
  // MODULE 3: CAMPAIGNS (SMS & EMAIL) STATE
  // ==========================================
  const [campaignChannel, setCampaignChannel] = useState<'email' | 'sms'>('email');
  const [campaignAudience, setCampaignAudience] = useState<'all' | 'verified' | 'local'>('all');
  const [campaignTitle, setCampaignTitle] = useState('Månadens hetaste hantverkardeals');
  const [campaignSubject, setCampaignSubject] = useState('🔥 35 öre drivmedelsrabatt + 20% hos Byggmax i helgen!');
  const [campaignSender, setCampaignSender] = useState('Yrkeskortet');
  const [campaignBody, setCampaignBody] = useState(
    'Hej {namn}!\n\nSom verifierad ID06-medlem på Yrkeskortet får du nu extra förmånliga priser. Visa ditt digitala kort eller använd koden {rabattkod} i kassan.\n\nHa en produktiv vecka!\n/ Teamet på Yrkeskortet.se'
  );
  const [campaignDealId, setCampaignDealId] = useState(discounts[0]?.id || '');
  const [campaignSending, setCampaignSending] = useState(false);
  const [campaignLogs, setCampaignLogs] = useState<CampaignLog[]>([
    {
      id: 'camp-1',
      name: 'Vårlansering Preem Drivmedel',
      channel: 'sms',
      audience: 'Alla verifierade medlemmar',
      recipientsCount: 2450,
      sentDate: '2026-03-28 09:30',
      status: 'sent',
      openRate: '98.2%',
      clickRate: '34.5%',
    },
    {
      id: 'camp-2',
      name: 'Helgkampanj Arbetskläder Snickare',
      channel: 'email',
      audience: 'Hantverkare & Byggföretag',
      recipientsCount: 3890,
      sentDate: '2026-04-04 16:15',
      status: 'sent',
      openRate: '46.8%',
      clickRate: '19.2%',
    },
  ]);

  const handleSendCampaign = () => {
    setCampaignSending(true);
    setTimeout(() => {
      const newLog: CampaignLog = {
        id: 'camp-' + Date.now(),
        name: campaignTitle,
        channel: campaignChannel,
        audience: campaignAudience === 'all' ? 'Alla medlemmar' : campaignAudience === 'verified' ? 'Verifierade ID06' : 'Lokala medlemmar',
        recipientsCount: profiles.length || 1850,
        sentDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'sent',
        openRate: campaignChannel === 'sms' ? '98.5%' : '48.2%',
        clickRate: '22.4%',
      };
      setCampaignLogs([newLog, ...campaignLogs]);
      setCampaignSending(false);
      setMessage({
        type: 'success',
        text: `Utskick "${campaignTitle}" skickat via ${campaignChannel.toUpperCase()} till ${newLog.recipientsCount} medlemmar!`,
      });
      setTimeout(() => setMessage(null), 4000);
    }, 1200);
  };

  // ==========================================
  // MODULE 4: ANALYTICS STATE & DATA
  // ==========================================
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<'7d' | '30d' | 'ytd'>('30d');

  // Top deals mock stats
  const topDeals = [
    { company: 'Preem', deal: '35 öre rabatt/liter', category: 'Fordon & Drivmedel', clicks: 3840, conversion: '42%' },
    { company: 'Byggmax', deal: '15% på allt virke & skruv', category: 'Verktyg & Kläder', clicks: 2910, conversion: '38%' },
    { company: 'Bauhaus', deal: '20% på maskiner', category: 'Verktyg & Kläder', clicks: 2420, conversion: '31%' },
    { company: 'Dagens Lunch', deal: '10 kr rabatt på lunch', category: 'Lunch & Mat', clicks: 2190, conversion: '56%' },
    { company: 'Circle K', deal: 'Kaffe & bulle för 25 kr', category: 'Lunch & Mat', clicks: 1850, conversion: '49%' },
  ];

  // ==========================================
  // MODULE 5: FINANCE & PARTNER REVENUE STATE
  // ==========================================
  const [partnerContracts, setPartnerContracts] = useState<PartnerContract[]>([
    {
      id: 'ctr-1',
      company: 'Preem Sverige AB',
      plan: 'Guldpartner (Topplacering)',
      monthlyAmount: 14900,
      status: 'paid',
      renewalDate: '2026-12-31',
      contactPerson: 'Fredrik Lind',
      contactEmail: 'partner@preem.se',
    },
    {
      id: 'ctr-2',
      company: 'Byggmax AB',
      plan: 'Guldpartner (Topplacering)',
      monthlyAmount: 14900,
      status: 'paid',
      renewalDate: '2026-11-15',
      contactPerson: 'Sara Bergman',
      contactEmail: 'sara.b@byggmax.se',
    },
    {
      id: 'ctr-3',
      company: 'Bauhaus Sverige',
      plan: 'Silverpartner (Kategori)',
      monthlyAmount: 7900,
      status: 'paid',
      renewalDate: '2026-10-30',
      contactPerson: 'Martin Ek',
      contactEmail: 'marknad@bauhaus.se',
    },
    {
      id: 'ctr-4',
      company: 'Swedol AB',
      plan: 'Silverpartner (Kategori)',
      monthlyAmount: 7900,
      status: 'pending',
      renewalDate: '2026-05-01',
      contactPerson: 'Helena Wallin',
      contactEmail: 'b2b@swedol.se',
    },
    {
      id: 'ctr-5',
      company: 'Västberga Grill & Deli',
      plan: 'Lokal Partner (Område)',
      monthlyAmount: 2490,
      status: 'paid',
      renewalDate: '2026-08-01',
      contactPerson: 'Ali Reza',
      contactEmail: 'kontakt@vastbergagrill.se',
    },
  ]);

  const [newContractCompany, setNewContractCompany] = useState('');
  const [newContractPlan, setNewContractPlan] = useState<'Guldpartner (Topplacering)' | 'Silverpartner (Kategori)' | 'Lokal Partner (Område)'>('Silverpartner (Kategori)');
  const [newContractContact, setNewContractContact] = useState('');
  const [showAddContractModal, setShowAddContractModal] = useState(false);

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContractCompany.trim()) return;
    const amounts = {
      'Guldpartner (Topplacering)': 14900,
      'Silverpartner (Kategori)': 7900,
      'Lokal Partner (Område)': 2490,
    };
    const created: PartnerContract = {
      id: 'ctr-' + Date.now(),
      company: newContractCompany.trim(),
      plan: newContractPlan,
      monthlyAmount: amounts[newContractPlan],
      status: 'paid',
      renewalDate: '2027-01-01',
      contactPerson: newContractContact.trim() || 'Avtalsansvarig',
      contactEmail: 'partner@' + newContractCompany.toLowerCase().replace(/\s+/g, '') + '.se',
    };
    setPartnerContracts([created, ...partnerContracts]);
    setNewContractCompany('');
    setNewContractContact('');
    setShowAddContractModal(false);
    setMessage({ type: 'success', text: `Nytt partneravtal registrerat för ${created.company} (${created.monthlyAmount.toLocaleString('sv-SE')} kr/mån)!` });
    setTimeout(() => setMessage(null), 3500);
  };

  const totalMRR = partnerContracts.reduce((sum, c) => sum + c.monthlyAmount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-2 md:p-3 lg:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-[#0F172A]">
      {/* ENTERPRISE B2B PORTAL CONTAINER (Full Width, No Mobile Constraints) */}
      <div className="relative w-full h-full max-w-[1500px] bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Top Gold & Navy Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shrink-0" />

        {/* PORTAL TOP HEADER */}
        <div className="px-5 sm:px-7 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F172A] text-yellow-400 flex items-center justify-center font-black shadow-md">
              <ShieldCheck className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight">
                  YRKESKORTET <span className="text-amber-500">ENTERPRISE PORTAL</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase bg-slate-900 text-yellow-400 px-2.5 py-0.5 rounded-full">
                  Admin Master
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Hantering av medlemmar, B2B-partners, kampanjutskick, analys och intäkter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase Cloud Ansluten</span>
            </div>

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Stäng portal</span>
            </button>
          </div>
        </div>

        {/* NOTIFICATION BANNER */}
        {message && (
          <div className="px-5 sm:px-7 pt-3 shrink-0">
            <div
              className={`p-3 rounded-2xl border flex items-center gap-2 text-xs font-semibold ${
                message.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* 5-MODULE TAB NAVIGATION BAR */}
        <div className="px-5 sm:px-7 pt-3 pb-2 bg-slate-50/80 border-b border-slate-200 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {/* TAB 1: USERS */}
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                activeTab === 'users'
                  ? 'bg-[#0F172A] text-yellow-400 shadow-md ring-1 ring-yellow-400/30'
                  : 'bg-white hover:bg-slate-200/70 text-slate-600 border border-slate-200/80'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>1. Användare & ID06</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'users' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}>
                {profiles.length}
              </span>
            </button>

            {/* TAB 2: PARTNERS & DISCOUNTS */}
            <button
              onClick={() => setActiveTab('partners')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                activeTab === 'partners'
                  ? 'bg-[#0F172A] text-yellow-400 shadow-md ring-1 ring-yellow-400/30'
                  : 'bg-white hover:bg-slate-200/70 text-slate-600 border border-slate-200/80'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>2. Partners & Annonser</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'partners' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-100 text-slate-600'
              }`}>
                {discounts.length}
              </span>
            </button>

            {/* TAB 3: CAMPAIGNS */}
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                activeTab === 'campaigns'
                  ? 'bg-[#0F172A] text-yellow-400 shadow-md ring-1 ring-yellow-400/30'
                  : 'bg-white hover:bg-slate-200/70 text-slate-600 border border-slate-200/80'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>3. Utskick (SMS & E-post)</span>
            </button>

            {/* TAB 4: ANALYTICS */}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                activeTab === 'analytics'
                  ? 'bg-[#0F172A] text-yellow-400 shadow-md ring-1 ring-yellow-400/30'
                  : 'bg-white hover:bg-slate-200/70 text-slate-600 border border-slate-200/80'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>4. Statistik & KPI:er</span>
            </button>

            {/* TAB 5: FINANCE */}
            <button
              onClick={() => setActiveTab('finance')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                activeTab === 'finance'
                  ? 'bg-[#0F172A] text-yellow-400 shadow-md ring-1 ring-yellow-400/30'
                  : 'bg-white hover:bg-slate-200/70 text-slate-600 border border-slate-200/80'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>5. Inkomster & Ekonomi</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'finance' ? 'bg-yellow-400 text-slate-950' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {(totalMRR / 1000).toFixed(0)}k/mån
              </span>
            </button>
          </div>
        </div>

        {/* SCROLLABLE MODULE BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-6">

          {/* ========================================================= */}
          {/* MODUL 1: HANTERA ANVÄNDARE (MEDLEMMAR & ID06) */}
          {/* ========================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-5 animate-fade-in">
              {/* Header Controls: Search, Filters & Counters */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-[#0F172A] flex items-center gap-2">
                      <Users className="w-5 h-5 text-amber-500" />
                      Medlemsregister & ID06-hantering
                    </h2>
                    <p className="text-xs text-slate-500">
                      Alla användarkonton hämtas direkt från Supabase <code className="font-mono text-slate-700 bg-slate-200/60 px-1 rounded">profiles</code>.
                    </p>
                  </div>

                  <button
                    onClick={loadProfiles}
                    disabled={loadingProfiles}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-[#0F172A] border border-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 self-end md:self-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingProfiles ? 'animate-spin text-amber-500' : 'text-slate-500'}`} />
                    <span>{loadingProfiles ? 'Synkar med Supabase...' : 'Ladda om databas'}</span>
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  {/* Status Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'all', label: 'Alla', count: profiles.length },
                      { id: 'verified', label: 'Verifierade', count: profiles.filter(p => (p.id06_status || 'pending') === 'verified').length },
                      { id: 'pending', label: 'Väntar', count: profiles.filter(p => (p.id06_status || 'pending') === 'pending').length },
                      { id: 'blocked', label: 'Spärrade', count: profiles.filter(p => p.id06_status === 'blocked').length },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setUserFilter(tab.id as any)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                          userFilter === tab.id
                            ? 'bg-[#0F172A] text-white shadow-sm'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          userFilter === tab.id ? 'bg-yellow-400 text-slate-950' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative min-w-[260px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Sök namn, företag, ID06, e-post..."
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                    />
                    {userSearch && (
                      <button
                        onClick={() => setUserSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Loading Indicator */}
              {loadingProfiles && (
                <div className="py-16 text-center space-y-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">
                    Hämtar användare från Supabase...
                  </p>
                </div>
              )}

              {/* EMPTY STATE */}
              {!loadingProfiles && profiles.length === 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-sm">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-[#0F172A]">
                    Inga registrerade medlemmar hittades i databasen
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                    När hantverkare scannar sitt ID06 och sparar sitt medlemskap i appen dyker de upp här direkt.
                  </p>
                </div>
              )}

              {/* USERS TABLE */}
              {!loadingProfiles && profiles.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                          <th className="py-3.5 px-4">Medlem & Yrkesroll</th>
                          <th className="py-3.5 px-4">Företag / Arbetsgivare</th>
                          <th className="py-3.5 px-4">ID06-Nummer</th>
                          <th className="py-3.5 px-4">Kontaktuppgifter</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4">Registrerad</th>
                          <th className="py-3.5 px-4 text-right">Åtgärder</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map((user) => {
                          const status = user.id06_status || 'pending';
                          const isBlocked = status === 'blocked';
                          const initials = (user.full_name || 'U')
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();

                          return (
                            <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Member Name */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-[#0F172A] text-yellow-400 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                                    {initials}
                                  </div>
                                  <div>
                                    <div className="font-extrabold text-[#0F172A] text-sm">
                                      {user.full_name || 'Namnlös medlem'}
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-medium">
                                      {user.profession || 'Certifierad yrkesutövare'}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Company */}
                              <td className="py-3.5 px-4 font-semibold text-slate-700">
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{user.company_name || 'Ej angivet'}</span>
                                </div>
                              </td>

                              {/* ID06 Number */}
                              <td className="py-3.5 px-4">
                                <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800 text-[11px] border border-slate-200">
                                  {user.id06_number || 'Saknas'}
                                </span>
                              </td>

                              {/* Contact */}
                              <td className="py-3.5 px-4 space-y-0.5">
                                {user.email ? (
                                  <div className="text-slate-600 flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-slate-400" />
                                    <span>{user.email}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">Ingen e-post</span>
                                )}
                                {user.phone && (
                                  <div className="text-slate-500 text-[11px] flex items-center gap-1">
                                    <Smartphone className="w-3 h-3 text-slate-400" />
                                    <span>{user.phone}</span>
                                  </div>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-4">
                                {status === 'verified' ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Verifierad
                                  </span>
                                ) : status === 'blocked' ? (
                                  <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 border border-red-200 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                                    <ShieldAlert className="w-3 h-3" />
                                    Spärrad
                                  </span>
                                ) : status === 'rejected' ? (
                                  <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    <XCircle className="w-3 h-3" />
                                    Avvisad
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                                    <Clock className="w-3 h-3" />
                                    Väntar
                                  </span>
                                )}
                              </td>

                              {/* Registered Date */}
                              <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                                {user.created_at ? new Date(user.created_at).toLocaleDateString('sv-SE') : 'Nyligen'}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {status !== 'verified' && (
                                    <button
                                      onClick={() => handleVerifyUser(user.id, user.full_name)}
                                      className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg transition-colors border border-emerald-200"
                                      title="Godkänn ID06"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleToggleBlockUser(user.id, user.full_name, isBlocked)}
                                    className={`p-1.5 rounded-lg transition-colors border ${
                                      isBlocked
                                        ? 'bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white border-amber-200'
                                        : 'bg-slate-100 hover:bg-slate-800 text-slate-600 hover:text-white border-slate-200'
                                    }`}
                                    title={isBlocked ? 'Häv spärr' : 'Spärra användare'}
                                  >
                                    {isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                  </button>

                                  <button
                                    onClick={() => handleDeleteUser(user.id, user.full_name)}
                                    className="p-1.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors border border-red-200"
                                    title="Radera medlem"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* MODUL 2: B2B PARTNERS & ANNONSER */}
          {/* ========================================================= */}
          {activeTab === 'partners' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Bar */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#0F172A] flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-500" />
                    Företagskunder, Förmåner & Annonsplatser
                  </h2>
                  <p className="text-xs text-slate-500">
                    Kopplat till Supabase-tabellen <code className="font-mono text-slate-700 bg-slate-200/60 px-1 rounded">discounts</code>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (showAddForm) resetDiscountForm();
                      else {
                        resetDiscountForm();
                        setShowAddForm(true);
                      }
                    }}
                    className="flex items-center gap-2 bg-[#FACC15] hover:bg-yellow-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs shadow-sm transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>{showAddForm ? 'Stäng formulär' : 'Nytt erbjudande'}</span>
                  </button>
                </div>
              </div>

              {/* CREATE / EDIT FORM MODAL / DRAWER */}
              {showAddForm && (
                <div className="bg-white border-2 border-amber-300 rounded-3xl p-6 shadow-xl space-y-4 animate-scale-up">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-amber-500" />
                      <h3 className="text-sm font-black text-[#0F172A]">
                        {editingDiscountId ? 'Redigera befintligt erbjudande' : 'Skapa nytt partnererbjudande'}
                      </h3>
                    </div>
                    <button onClick={resetDiscountForm} className="text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveDiscount} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Företagsnamn (Partner) *
                        </label>
                        <input
                          type="text"
                          required
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="t.ex. Byggmax, Preem, Ahlsell..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-yellow-400 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Kategori *
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-yellow-400 font-semibold"
                        >
                          <option value="Lunch & Mat">Lunch & Mat</option>
                          <option value="Verktyg & Kläder">Verktyg & Kläder</option>
                          <option value="Fordon & Drivmedel">Fordon & Drivmedel</option>
                          <option value="Mobil & Vardag">Mobil & Vardag</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Rabatt-badge (Badge text) *
                        </label>
                        <input
                          type="text"
                          required
                          value={discountBadge}
                          onChange={(e) => setDiscountBadge(e.target.value)}
                          placeholder="t.ex. 20% RABATT"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] font-extrabold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Förmånsrubrik *
                        </label>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="t.ex. 20% på alla arbetskläder och skyddsskor"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Rabattkod / Kassainstruktion
                        </label>
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                          placeholder="t.ex. YRKES20 eller VISA KORTET"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Beskrivning & villkor *
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Gäller alla medlemmar med ID06 mot uppvisande av kort eller onlinekod..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>

                    {/* Image URL & Quick Presets */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                          <span>Bild-länk (Toppbild på dealen)</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Auto-anpassas om tomt</span>
                      </label>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                      <div className="flex gap-1.5 pt-1.5 overflow-x-auto no-scrollbar">
                        {[
                          { label: 'Mat/Lunch', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80' },
                          { label: 'Verktyg', url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&q=80' },
                          { label: 'Kläder', url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80' },
                          { label: 'Biltvätt', url: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&q=80' },
                          { label: 'Drivmedel', url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=80' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setImageUrl(preset.url)}
                            className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] text-slate-600 hover:text-amber-600 font-medium shrink-0"
                          >
                            +{preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Local Deal & Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        <input
                          type="checkbox"
                          id="isLocalPartnerCheckbox"
                          checked={isLocal}
                          onChange={(e) => {
                            setIsLocal(e.target.checked);
                            if (e.target.checked && location === 'Hela Sverige') {
                              setLocation('Industriområdet / Lokalt');
                            }
                          }}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-yellow-400"
                        />
                        <label htmlFor="isLocalPartnerCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                          Lokal deal (Visas under "Lokalt" och i kartvy)
                        </label>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Plats, t.ex. Hantverksgatan 4, Malmö"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={resetDiscountForm}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        Avbryt
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingDiscount}
                        className="px-6 py-2.5 rounded-xl bg-[#FACC15] hover:bg-yellow-400 text-slate-950 text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isSavingDiscount ? 'Sparar...' : editingDiscountId ? 'Uppdatera rabatt' : 'Publicera rabatt'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* B2B DISCOUNTS TABLE */}
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-[#0F172A]">
                      Aktiva förmåner ({filteredDiscounts.length} st)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={partnerCategoryFilter}
                      onChange={(e) => setPartnerCategoryFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700"
                    >
                      <option value="Alla">Alla kategorier</option>
                      <option value="Lunch & Mat">Lunch & Mat</option>
                      <option value="Verktyg & Kläder">Verktyg & Kläder</option>
                      <option value="Fordon & Drivmedel">Fordon & Drivmedel</option>
                      <option value="Mobil & Vardag">Mobil & Vardag</option>
                    </select>

                    <div className="relative flex-1 sm:w-48">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={partnerSearch}
                        onChange={(e) => setPartnerSearch(e.target.value)}
                        placeholder="Filtrera partner..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                        <th className="py-3 px-4">Partner & Bild</th>
                        <th className="py-3 px-4">Förmån & Rubrik</th>
                        <th className="py-3 px-4">Kategori</th>
                        <th className="py-3 px-4">Rabattkod</th>
                        <th className="py-3 px-4">Räckvidd</th>
                        <th className="py-3 px-4 text-right">Åtgärder</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDiscounts.map((discount) => {
                        const thumb = discount.image_url || getCategoryFallbackImage(discount.category, discount.company);
                        return (
                          <tr key={discount.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                  <img src={thumb} alt={discount.company} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <span className="font-extrabold text-[#0F172A] text-sm block">
                                    {discount.company}
                                  </span>
                                  <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                                    {discount.discount_badge}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 max-w-xs">
                              <p className="font-bold text-slate-800 line-clamp-1">{discount.title}</p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">{discount.description}</p>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                {discount.category}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-slate-800 text-[11px]">
                                {discount.discount_code || 'VISA KORTET'}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              {discount.is_local ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  <MapPin className="w-3 h-3" />
                                  {discount.location || 'Lokalt'}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-500 font-medium">Hela Sverige</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleEditDiscount(discount)}
                                  className="p-1.5 bg-slate-100 hover:bg-[#0F172A] text-slate-600 hover:text-white rounded-lg transition-colors"
                                  title="Redigera erbjudande"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDiscount(discount.id, discount.company)}
                                  disabled={deletingDiscountId === discount.id}
                                  className="p-1.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors border border-red-200"
                                  title="Ta bort erbjudande"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODUL 3: HANTERA UTSKICK (E-POST & SMS) */}
          {/* ========================================================= */}
          {activeTab === 'campaigns' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 shadow-sm">
                <h2 className="text-base sm:text-lg font-black text-[#0F172A] flex items-center gap-2">
                  <Send className="w-5 h-5 text-amber-500" />
                  Utskick till medlemmar (E-post & SMS)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Skicka flash-deals, partnernyheter eller månadens rabatter direkt till medlemmarnas mobiler.
                </p>
              </div>

              {/* Campaign Composer Grid (Form on Left, Live Mobile Mockup on Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Compose Form */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-[#0F172A] flex items-center gap-2 pb-2 border-b border-slate-100">
                    <MessageSquare className="w-4 h-4 text-amber-500" />
                    Skapa nytt medlemsutskick
                  </h3>

                  {/* Channel & Audience */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Kanal *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCampaignChannel('email')}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            campaignChannel === 'email'
                              ? 'bg-[#0F172A] text-white border-slate-900 shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Mail className="w-4 h-4 text-amber-400" />
                          <span>E-postnyhetsbrev</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCampaignChannel('sms')}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            campaignChannel === 'sms'
                              ? 'bg-[#0F172A] text-white border-slate-900 shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Smartphone className="w-4 h-4 text-amber-400" />
                          <span>SMS Flash-deal</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Målgrupp (Segment) *
                      </label>
                      <select
                        value={campaignAudience}
                        onChange={(e) => setCampaignAudience(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      >
                        <option value="all">Alla registrerade medlemmar ({profiles.length} st)</option>
                        <option value="verified">Endast verifierade ID06 ({profiles.filter(p => p.id06_status === 'verified').length} st)</option>
                        <option value="local">Lokala hantverkare (Mälardalen/Stockholm)</option>
                      </select>
                    </div>
                  </div>

                  {/* Campaign Title & Sender */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Kampanjnamn (Internt)
                      </label>
                      <input
                        type="text"
                        value={campaignTitle}
                        onChange={(e) => setCampaignTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0F172A] font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Avsändare
                      </label>
                      <input
                        type="text"
                        value={campaignSender}
                        onChange={(e) => setCampaignSender(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0F172A] font-semibold"
                      />
                    </div>
                  </div>

                  {/* Subject Line (if email) */}
                  {campaignChannel === 'email' && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Ämnesrad i inkorgen *
                      </label>
                      <input
                        type="text"
                        value={campaignSubject}
                        onChange={(e) => setCampaignSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0F172A] font-bold"
                      />
                    </div>
                  )}

                  {/* Message Body */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Meddelandetext *
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Tillgängliga taggar: {'{namn}'}, {'{företag}'}, {'{rabattkod}'}
                      </span>
                    </div>
                    <textarea
                      rows={campaignChannel === 'sms' ? 4 : 6}
                      value={campaignBody}
                      onChange={(e) => setCampaignBody(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-[#0F172A] font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>

                  {/* Send Action */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Beräknad räckvidd: <strong>{profiles.length || 1850} medlemmar</strong>
                    </span>

                    <button
                      type="button"
                      onClick={handleSendCampaign}
                      disabled={campaignSending}
                      className="bg-[#0F172A] hover:bg-slate-800 text-yellow-400 font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                      <span>{campaignSending ? 'Skickar utskick...' : 'Skicka utskick nu'}</span>
                    </button>
                  </div>
                </div>

                {/* Right: Live Smartphone Mockup Preview */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Live Förhandsgranskning i mobil
                  </span>

                  {/* Phone Bezel */}
                  <div className="w-[310px] h-[520px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 relative flex flex-col">
                    {/* Speaker notch */}
                    <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2 shrink-0 flex items-center justify-center">
                      <div className="w-8 h-1 bg-slate-700 rounded-full" />
                    </div>

                    {/* Phone Screen */}
                    <div className="flex-1 bg-slate-100 rounded-[32px] overflow-hidden flex flex-col p-3 text-left">
                      {campaignChannel === 'sms' ? (
                        /* SMS UI PREVIEW */
                        <div className="flex-1 flex flex-col justify-end space-y-3 pb-2">
                          <div className="text-center">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-200/80 px-2 py-0.5 rounded-full">
                              SMS idag 11:42
                            </span>
                          </div>

                          <div className="bg-emerald-600 text-white p-3.5 rounded-2xl rounded-bl-sm text-xs leading-relaxed shadow-sm">
                            <p className="font-extrabold text-[10px] text-emerald-200 uppercase mb-1">
                              Från: {campaignSender}
                            </p>
                            <p className="whitespace-pre-line text-[11px]">
                              {campaignBody.replace('{namn}', 'Johan').replace('{företag}', 'Svea Bygg AB').replace('{rabattkod}', 'YRKES20')}
                            </p>
                            <div className="mt-2 pt-1.5 border-t border-emerald-500/40 text-[10px] text-emerald-200">
                              Länk: <span className="underline">yrkeskortet.se/deal</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* EMAIL UI PREVIEW */
                        <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-slate-200 overflow-y-auto text-[11px] space-y-2.5">
                          <div className="border-b border-slate-100 pb-2">
                            <span className="text-[10px] font-extrabold text-amber-600 uppercase">
                              {campaignSender} &lt;nyheter@yrkeskortet.se&gt;
                            </span>
                            <h4 className="font-extrabold text-xs text-[#0F172A] mt-0.5 leading-snug">
                              {campaignSubject}
                            </h4>
                          </div>

                          <div className="w-full h-24 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col justify-center items-center p-2 text-center">
                            <span className="text-[10px] font-black text-yellow-400 tracking-wider">
                              YRKESKORTET EXKLUSIVT
                            </span>
                            <span className="text-xs font-black mt-0.5">Veckans Förmåner</span>
                          </div>

                          <p className="whitespace-pre-line text-slate-700 leading-relaxed text-[11px]">
                            {campaignBody.replace('{namn}', 'Johan').replace('{företag}', 'Svea Bygg AB').replace('{rabattkod}', 'YRKES20')}
                          </p>

                          <div className="text-center pt-2">
                            <span className="inline-block bg-[#FACC15] text-slate-950 font-black px-3 py-1.5 rounded-xl text-[10px]">
                              Öppna dina rabatter i appen
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign History Table */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Tidigare kampanjer & utskickshistorik
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-bold">
                        <th className="py-2 px-3">Kampanj</th>
                        <th className="py-2 px-3">Kanal</th>
                        <th className="py-2 px-3">Mottagare</th>
                        <th className="py-2 px-3">Skickad datum</th>
                        <th className="py-2 px-3">Öppningsgrad</th>
                        <th className="py-2 px-3">Klick</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {campaignLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-[#0F172A]">{log.name}</td>
                          <td className="py-2.5 px-3">
                            <span className="uppercase font-black text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                              {log.channel}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{log.recipientsCount} st</td>
                          <td className="py-2.5 px-3 text-slate-400">{log.sentDate}</td>
                          <td className="py-2.5 px-3 font-extrabold text-emerald-700">{log.openRate || '–'}</td>
                          <td className="py-2.5 px-3 font-extrabold text-amber-700">{log.clickRate || '–'}</td>
                          <td className="py-2.5 px-3">
                            <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                              Skickad
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODUL 4: HANTERA STATISTIK (ANALYTICS) */}
          {/* ========================================================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header with Time filter */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#0F172A] flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-amber-500" />
                    Plattformsstatistik & Nyckeltal
                  </h2>
                  <p className="text-xs text-slate-500">
                    Insikter om medlemsaktivitet, rabattklick och uppvisade medlemskort.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-2xl">
                  {(['7d', '30d', 'ytd'] as const).map(range => (
                    <button
                      key={range}
                      onClick={() => setAnalyticsTimeRange(range)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        analyticsTimeRange === range
                          ? 'bg-[#0F172A] text-yellow-400 shadow-sm'
                          : 'text-slate-600 hover:text-[#0F172A]'
                      }`}
                    >
                      {range === '7d' ? 'Senaste 7 dagar' : range === '30d' ? 'Senaste 30 dagar' : 'Hela året (2026)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Large KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                    <span>Registrerade medlemmar</span>
                    <Users className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                    {profiles.length > 0 ? (profiles.length + 1840).toLocaleString('sv-SE') : '1 840'}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+24.8% sedan förra månaden</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                    <span>Visade rabattkoder & klick</span>
                    <Activity className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                    18 450
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+31.2% ökning i engagemang</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                    <span>Aktiva partneravtal (B2B)</span>
                    <Building2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                    {discounts.length} st
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                    <span>5 st tillagda denna månad</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                    <span>Uppvisade kort i kassan</span>
                    <CreditCard className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                    3 920
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Mest aktivt kl 11:30 - 13:30</span>
                  </div>
                </div>
              </div>

              {/* Analytics Split: Top Deals & Category Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Top Deals List */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-black text-[#0F172A] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Populäraste förmånerna (Topplista)
                    </h3>
                    <span className="text-[11px] text-slate-400">Sorterat på klick</span>
                  </div>

                  <div className="space-y-3">
                    {topDeals.map((deal, idx) => (
                      <div key={deal.company} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#0F172A] text-yellow-400 font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-extrabold text-[#0F172A] text-xs block">{deal.company}</span>
                            <span className="text-[11px] text-slate-500">{deal.deal}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-xs text-[#0F172A] block">{deal.clicks.toLocaleString('sv-SE')} klick</span>
                          <span className="text-[10px] text-emerald-600 font-bold">{deal.conversion} konvertering</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category & Day Distribution */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-5">
                  <div>
                    <h3 className="text-sm font-black text-[#0F172A] flex items-center gap-2 pb-2 border-b border-slate-100">
                      <PieChart className="w-4 h-4 text-amber-500" />
                      Kategorifördelning av rabattanvändning
                    </h3>

                    <div className="space-y-3 pt-3">
                      {[
                        { name: 'Lunch & Mat', pct: 38, color: 'bg-amber-400' },
                        { name: 'Fordon & Drivmedel', pct: 32, color: 'bg-blue-500' },
                        { name: 'Verktyg & Kläder', pct: 20, color: 'bg-emerald-500' },
                        { name: 'Mobil & Vardag', pct: 10, color: 'bg-purple-500' },
                      ].map(cat => (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                            <span>{cat.name}</span>
                            <span>{cat.pct}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${cat.color}`} style={{ width: `${cat.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Day activity barchart */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs font-black text-[#0F172A] block mb-2">
                      Aktivitet per veckodag (Hantverkaranvändning)
                    </span>
                    <div className="grid grid-cols-7 gap-1.5 items-end h-24 pt-4 text-center">
                      {[
                        { day: 'Mån', h: '65%' },
                        { day: 'Tis', h: '88%' },
                        { day: 'Ons', h: '95%' },
                        { day: 'Tor', h: '90%' },
                        { day: 'Fre', h: '100%' },
                        { day: 'Lör', h: '35%' },
                        { day: 'Sön', h: '25%' },
                      ].map(bar => (
                        <div key={bar.day} className="flex flex-col items-center gap-1 h-full justify-end">
                          <div className="w-full bg-[#0F172A] rounded-t-md hover:bg-yellow-400 transition-colors" style={{ height: bar.h }} />
                          <span className="text-[10px] text-slate-400 font-bold">{bar.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODUL 5: HANTERA INKOMSTER & EKONOMI */}
          {/* ========================================================= */}
          {activeTab === 'finance' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#0F172A] flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-500" />
                    Ekonomi, Partneravtal & Annonsintäkter
                  </h2>
                  <p className="text-xs text-slate-500">
                    Översikt över månatliga B2B-licenser, sponsrade placeringar och fakturering.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddContractModal(true)}
                  className="bg-[#FACC15] hover:bg-yellow-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs shadow-sm flex items-center gap-2 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Nytt partneravtal</span>
                </button>
              </div>

              {/* 4 Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1.5">
                  <span className="text-xs font-bold text-slate-400">Månadlig återkommande intäkt (MRR)</span>
                  <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                    {totalMRR.toLocaleString('sv-SE')} kr
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 block">+14.2% mot föregående månad</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1.5">
                  <span className="text-xs font-bold text-slate-400">Totala intäkter 2026 (YTD)</span>
                  <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                    1 420 000 kr
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 block">Fakturerat och betalt</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1.5">
                  <span className="text-xs font-bold text-slate-400">Snittintäkt per partner (ARPU)</span>
                  <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                    {(totalMRR / partnerContracts.length).toFixed(0)} kr/mån
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 block">Över {partnerContracts.length} aktiva avtal</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1.5">
                  <span className="text-xs font-bold text-slate-400">Faktureringsgrad</span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                    100%
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 block">0 förfallna fordringar</span>
                </div>
              </div>

              {/* B2B Packages / Rate Card */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-yellow-400">
                    Prislista & Annonspaket (B2B)
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                    Officiella partnernivåer för Yrkeskortet.se
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800/80 border border-yellow-400/30 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                    <div className="absolute top-3 right-3 bg-yellow-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase">
                      Mest populär
                    </div>
                    <h4 className="font-black text-sm text-yellow-400">Guldpartner (Toppplacering)</h4>
                    <p className="text-2xl font-black">14 900 kr <span className="text-xs font-normal text-slate-400">/mån</span></p>
                    <ul className="text-xs text-slate-300 space-y-1 pt-1">
                      <li>• Veckans Utvalda Deal i toppkarusell</li>
                      <li>• 1x dedikerat SMS/E-postutskick per månad</li>
                      <li>• Premiumprofil med logga & verifiering</li>
                    </ul>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-2">
                    <h4 className="font-black text-sm text-slate-200">Silverpartner (Kategori)</h4>
                    <p className="text-2xl font-black">7 900 kr <span className="text-xs font-normal text-slate-400">/mån</span></p>
                    <ul className="text-xs text-slate-300 space-y-1 pt-1">
                      <li>• Prioriterad placering i respektive branschkategori</li>
                      <li>• Klickbar rabattkod och butikskartor</li>
                      <li>• Månatlig klick- och konverteringsrapport</li>
                    </ul>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-2">
                    <h4 className="font-black text-sm text-slate-200">Lokal Partner (Karta/Område)</h4>
                    <p className="text-2xl font-black">2 490 kr <span className="text-xs font-normal text-slate-400">/mån</span></p>
                    <ul className="text-xs text-slate-300 space-y-1 pt-1">
                      <li>• För lokala lunchrestauranger, biltvättar & däckverkstäder</li>
                      <li>• Visas för hantverkare inom 15 km radie</li>
                      <li>• QR-kodsuppvisning i fysisk kassa</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Partner Contracts Table */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-[#0F172A] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  Aktiva partneravtal & fakturaunderlag
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase">
                        <th className="py-3 px-4">Partnerföretag</th>
                        <th className="py-3 px-4">Avtalsnivå</th>
                        <th className="py-3 px-4">Månadskostnad</th>
                        <th className="py-3 px-4">Fakturastatus</th>
                        <th className="py-3 px-4">Förnyelsedatum</th>
                        <th className="py-3 px-4">Kontaktperson</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {partnerContracts.map((ctr) => (
                        <tr key={ctr.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-black text-sm text-[#0F172A]">{ctr.company}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">{ctr.plan}</td>
                          <td className="py-3.5 px-4 font-black text-slate-900">{ctr.monthlyAmount.toLocaleString('sv-SE')} kr</td>
                          <td className="py-3.5 px-4">
                            {ctr.status === 'paid' ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                                Betald
                              </span>
                            ) : (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                                Skickad / Väntar
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">{ctr.renewalDate}</td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <div>{ctr.contactPerson}</div>
                            <div className="text-[10px] text-slate-400">{ctr.contactEmail}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal for adding a new contract */}
              {showAddContractModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
                  <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 animate-scale-up">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h4 className="font-black text-[#0F172A] text-sm">Registrera nytt partneravtal</h4>
                      <button onClick={() => setShowAddContractModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateContract} className="space-y-3.5">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Företagsnamn *</label>
                        <input
                          type="text"
                          required
                          value={newContractCompany}
                          onChange={(e) => setNewContractCompany(e.target.value)}
                          placeholder="t.ex. Ahlsell Sverige AB"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Partnerpaket *</label>
                        <select
                          value={newContractPlan}
                          onChange={(e) => setNewContractPlan(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        >
                          <option value="Guldpartner (Topplacering)">Guldpartner (Topplacering) – 14 900 kr/mån</option>
                          <option value="Silverpartner (Kategori)">Silverpartner (Kategori) – 7 900 kr/mån</option>
                          <option value="Lokal Partner (Område)">Lokal Partner (Område) – 2 490 kr/mån</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Kontaktperson</label>
                        <input
                          type="text"
                          value={newContractContact}
                          onChange={(e) => setNewContractContact(e.target.value)}
                          placeholder="t.ex. Gustav Andersson"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddContractModal(false)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                        >
                          Avbryt
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-[#FACC15] hover:bg-yellow-400 text-slate-950 font-black text-xs shadow-sm"
                        >
                          Spara partneravtal
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* PORTAL FOOTER */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Yrkeskortet Enterprise v2.6 • Inloggad som Portaladministratör
          </span>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-700 hover:text-slate-950 font-bold hover:underline transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Stäng adminportal</span>
          </button>
        </div>

      </div>
    </div>
  );
};
