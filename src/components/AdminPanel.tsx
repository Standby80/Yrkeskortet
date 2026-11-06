import React, { useState, useEffect } from 'react';
import { 
  X, 
  Tag, 
  Users, 
  Trash2, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Building2, 
  CreditCard, 
  RefreshCw,
  LogOut,
  MapPin,
  Image as ImageIcon
} from 'lucide-react';
import { Discount, Profile, AdminTabType } from '../types';
import { 
  createDiscountInSupabase, 
  deleteDiscountFromSupabase, 
  getProfilesFromSupabase, 
  updateProfileStatusInSupabase,
  getCategoryFallbackImage
} from '../lib/supabase';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  discounts: Discount[];
  onDiscountsUpdated: (updatedList: Discount[]) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  discounts,
  onDiscountsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTabType>('discounts');
  
  // Tab 1: Discounts Form State
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Lunch & Mat');
  const [discountBadge, setDiscountBadge] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLocal, setIsLocal] = useState(false);
  const [location, setLocation] = useState('Hela Sverige');
  const [isCreatingDiscount, setIsCreatingDiscount] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Tab 2: Members Profiles State (ONLY real data from Supabase)
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [memberFilter, setMemberFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load profiles strictly from Supabase profiles table
  const loadProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const supaProfiles = await getProfilesFromSupabase();
      setProfiles(supaProfiles || []);
    } catch (err) {
      console.warn('Profiles load error:', err);
      setProfiles([]);
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Clear out any old cached mock profiles from localStorage
      localStorage.removeItem('yrkeskortet_admin_members');
      loadProfiles();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Create Discount
  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingDiscount(true);
    setMessage(null);

    const finalImage = imageUrl.trim() || getCategoryFallbackImage(category, company);

    const newDiscountData = {
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
      const created = await createDiscountInSupabase(newDiscountData);
      const discountToAdd: Discount = created || {
        ...newDiscountData,
        id: 'local-' + Date.now(),
        created_at: new Date().toISOString(),
      };

      const updated = [discountToAdd, ...discounts];
      onDiscountsUpdated(updated);

      // Reset form
      setCompany('');
      setTitle('');
      setDescription('');
      setDiscountBadge('');
      setDiscountCode('');
      setImageUrl('');
      setIsLocal(false);
      setLocation('Hela Sverige');

      setMessage({
        type: 'success',
        text: `Rabatten för "${discountToAdd.company}" sparades i Supabase med bild!`,
      });
    } catch (err: any) {
      const fallbackDiscount: Discount = {
        ...newDiscountData,
        id: 'local-' + Date.now(),
        created_at: new Date().toISOString(),
      };
      onDiscountsUpdated([fallbackDiscount, ...discounts]);

      setMessage({
        type: 'success',
        text: `Rabatten lades till i appen!`,
      });
    } finally {
      setIsCreatingDiscount(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // Handle Delete Discount
  const handleDeleteDiscount = async (id: string, compName: string) => {
    if (!confirm(`Är du säker på att du vill ta bort rabatten från "${compName}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteDiscountFromSupabase(id);
      const remaining = discounts.filter((d) => d.id !== id);
      onDiscountsUpdated(remaining);
      setMessage({
        type: 'success',
        text: `Rabatt för "${compName}" har raderats från Supabase.`,
      });
    } catch (err) {
      const remaining = discounts.filter((d) => d.id !== id);
      onDiscountsUpdated(remaining);
      setMessage({
        type: 'success',
        text: `Rabatt togs bort från listan.`,
      });
    } finally {
      setDeletingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Handle Member Status Change (Godkänn / Neka)
  const handleUpdateMemberStatus = async (id: string, newStatus: 'verified' | 'rejected' | 'pending') => {
    const updated = profiles.map((p) => (p.id === id ? { ...p, id06_status: newStatus } : p));
    setProfiles(updated);

    await updateProfileStatusInSupabase(id, newStatus);

    setMessage({
      type: 'success',
      text: newStatus === 'verified' ? 'Medlemmen har godkänts med verifierat ID06!' : 'Medlemsansökan har nekats.',
    });
    setTimeout(() => setMessage(null), 3000);
  };

  // Filtered profiles for Tab 2
  const filteredProfiles = profiles.filter((p) => {
    if (memberFilter === 'all') return true;
    return (p.id06_status || 'pending') === memberFilter;
  });

  const pendingCount = profiles.filter((p) => (p.id06_status || 'pending') === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8 bg-slate-950/75 backdrop-blur-md animate-fade-in text-[#0F172A]">
      {/* REQUIREMENT 1: Full-width expanded dialog layout without max-w-lg mobile constraints */}
      <div className="relative w-full max-w-7xl bg-white sm:rounded-3xl shadow-2xl h-full sm:h-[94vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Top Gold Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 shrink-0" />

        {/* Admin Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#0F172A]">
                  YRKESKORTET <span className="text-amber-500">ADMIN</span>
                </h2>
                <span className="text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Portalkontroll
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direktkoppling mot Supabase <code className="font-mono text-slate-600 bg-slate-100 px-1 py-0.2 rounded text-[11px]">discounts</code> & <code className="font-mono text-slate-600 bg-slate-100 px-1 py-0.2 rounded text-[11px]">profiles</code>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:text-[#0F172A] hover:bg-slate-200 flex items-center justify-center transition-colors"
            aria-label="Stäng admin"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notification Toast */}
        {message && (
          <div className="px-6 pt-3 shrink-0">
            <div
              className={`p-3 rounded-2xl border flex items-center gap-2 text-xs font-semibold ${
                message.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex max-w-md gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('discounts')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'discounts'
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'text-slate-500 hover:text-[#0F172A]'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Hantera Rabatter ({discounts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all ${
                activeTab === 'members'
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'text-slate-500 hover:text-[#0F172A]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Medlemmar & ID06 ({profiles.length})</span>
              {pendingCount > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* TAB 1: HANTERA RABATTER (WIDE 2-COLUMN DASHBOARD LAYOUT) */}
          {activeTab === 'discounts' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: CREATE DISCOUNT FORM */}
              <div className="lg:col-span-5 xl:col-span-4 bg-slate-50 border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-extrabold text-[#0F172A]">
                      Skapa nytt erbjudande med bild
                    </h3>
                  </div>
                  <span className="text-[10px] text-amber-700 font-extrabold bg-amber-100/70 px-2 py-0.5 rounded-md">
                    Sparas i Supabase
                  </span>
                </div>

                <form onSubmit={handleCreateDiscount} className="space-y-3.5">
                  {/* Company & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Företagsnamn *
                      </label>
                      <input
                        type="text"
                        required
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="t.ex. Byggmax, Preem, Dagens Lunch..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Kategori *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                      >
                        <option value="Lunch & Mat">Lunch & Mat</option>
                        <option value="Verktyg & Kläder">Verktyg & Kläder</option>
                        <option value="Fordon & Drivmedel">Fordon & Drivmedel</option>
                        <option value="Mobil & Vardag">Mobil & Vardag</option>
                      </select>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Rubrik / Förmån *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="t.ex. 20% på alla Milwaukee-maskiner"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Beskrivning *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Villkor, giltighetstid och hur rabatten erhålls..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                    />
                  </div>

                  {/* Image URL Field */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span>Bild-länk (`image_url`)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Valfritt – auto-anpassas om tomt</span>
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    {/* Quick Image presets */}
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
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-600 hover:text-amber-600 font-medium shrink-0"
                        >
                          +{preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Discount Badge & Code */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Rabatt-badge *
                      </label>
                      <input
                        type="text"
                        required
                        value={discountBadge}
                        onChange={(e) => setDiscountBadge(e.target.value)}
                        placeholder="t.ex. 20% RABATT"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0F172A] font-extrabold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Rabattkod / Instruktion
                      </label>
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        placeholder="t.ex. YRKES20 el. VISA KORTET"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#0F172A] font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>
                  </div>

                  {/* Local checkbox & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200">
                      <input
                        type="checkbox"
                        id="isLocalCheckboxAdmin"
                        checked={isLocal}
                        onChange={(e) => {
                          setIsLocal(e.target.checked);
                          if (e.target.checked && location === 'Hela Sverige') {
                            setLocation('Industriområdet');
                          }
                        }}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-yellow-400"
                      />
                      <label htmlFor="isLocalCheckboxAdmin" className="text-xs font-bold text-slate-700 cursor-pointer">
                        Lokalt erbjudande
                      </label>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Plats, t.ex. Hantverksgatan 4"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isCreatingDiscount}
                    className="w-full mt-2 flex items-center justify-center gap-2 bg-[#FACC15] hover:bg-yellow-400 text-slate-950 font-black py-3 px-4 rounded-2xl shadow-sm active:scale-98 transition-all text-xs"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>{isCreatingDiscount ? 'Publicerar i Supabase...' : 'Publicera rabatt'}</span>
                  </button>
                </form>
              </div>

              {/* RIGHT COLUMN: EXISTING DISCOUNTS LIST */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                <div className="flex items-center justify-between text-xs px-1">
                  <div>
                    <h4 className="font-extrabold text-[#0F172A] text-sm">
                      Befintliga rabatter ({discounts.length} st)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Aktiva förmåner synliga i portalen
                    </p>
                  </div>
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" /> Klicka för att radera
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {discounts.map((discount) => {
                    const thumbImg = discount.image_url || getCategoryFallbackImage(discount.category, discount.company);

                    return (
                      <div
                        key={discount.id}
                        className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Thumbnail image */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                          <img
                            src={thumbImg}
                            alt={discount.company}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-xs text-[#0F172A] truncate">
                              {discount.company}
                            </span>
                            <span className="bg-amber-100 text-amber-800 font-extrabold text-[10px] px-1.5 py-0.2 rounded">
                              {discount.discount_badge}
                            </span>
                            {discount.is_local && (
                              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                                Lokal
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 font-medium truncate">
                            {discount.title}
                          </p>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{discount.category}</span>
                            <span>•</span>
                            <span>{discount.location || 'Hela Sverige'}</span>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteDiscount(discount.id, discount.company)}
                          disabled={deletingId === discount.id}
                          className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 flex items-center justify-center transition-all shrink-0 active:scale-95"
                          title="Ta bort rabatt"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEDLEMMAR & ID06 (ONLY REAL PROFILES FROM SUPABASE) */}
          {activeTab === 'members' && (
            <div className="space-y-5">
              {/* Controls bar: Filters & Reload */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['all', 'pending', 'verified', 'rejected'] as const).map((filter) => {
                    const count = filter === 'all' 
                      ? profiles.length 
                      : profiles.filter(p => (p.id06_status || 'pending') === filter).length;
                    const labels = {
                      all: 'Alla medlemmar',
                      pending: 'Väntar på beslut',
                      verified: 'Verifierade',
                      rejected: 'Nekade',
                    };
                    const isActive = memberFilter === filter;
                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setMemberFilter(filter)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-[#0F172A] text-white shadow-sm'
                            : 'bg-white hover:bg-slate-200/70 text-slate-600 border border-slate-200/70'
                        }`}
                      >
                        <span>{labels[filter]}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          isActive ? 'bg-yellow-400 text-slate-950' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={loadProfiles}
                    disabled={loadingProfiles}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors shadow-sm active:scale-95"
                    title="Ladda om från Supabase"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingProfiles ? 'animate-spin text-amber-500' : 'text-slate-500'}`} />
                    <span>{loadingProfiles ? 'Laddar...' : 'Uppdatera'}</span>
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {loadingProfiles && (
                <div className="py-16 text-center space-y-2">
                  <RefreshCw className="w-7 h-7 animate-spin text-amber-500 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">
                    Hämtar registrerade medlemmar från Supabase...
                  </p>
                </div>
              )}

              {/* REQUIREMENT 2: EMPTY STATE - EXACT TEXT: "Inga registrerade medlemmar hittades i databasen" */}
              {!loadingProfiles && filteredProfiles.length === 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-12 text-center space-y-3 my-4">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-sm">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-[#0F172A]">
                    Inga registrerade medlemmar hittades i databasen
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                    När hantverkare scannar sitt ID06 och sparar sitt medlemskap i appen dyker de upp här direkt.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={loadProfiles}
                      disabled={loadingProfiles}
                      className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-[#0F172A] border border-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all active:scale-95"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingProfiles ? 'animate-spin text-amber-500' : 'text-slate-600'}`} />
                      <span>Ladda om från Supabase</span>
                    </button>
                  </div>
                </div>
              )}

              {/* MEMBERS GRID (ONLY REAL PROFILES FROM SUPABASE) */}
              {!loadingProfiles && filteredProfiles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProfiles.map((member) => {
                    const status = member.id06_status || 'pending';

                    return (
                      <div
                        key={member.id}
                        className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3.5 flex flex-col justify-between hover:shadow-md transition-shadow"
                      >
                        <div className="space-y-3">
                          {/* Member Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h5 className="font-extrabold text-[#0F172A] text-sm">
                                  {member.full_name || 'Namnlös medlem'}
                                </h5>
                                {member.profession && (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.2 rounded-md font-bold">
                                    {member.profession}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{member.company_name || 'Inget företag angivet'}</span>
                              </p>
                            </div>

                            {/* Status Badge */}
                            {status === 'verified' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                                <CheckCircle className="w-3 h-3" />
                                Verifierad
                              </span>
                            ) : status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full shrink-0">
                                <XCircle className="w-3 h-3" />
                                Nekad
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full shrink-0 animate-pulse">
                                <Clock className="w-3 h-3" />
                                Väntar
                              </span>
                            )}
                          </div>

                          {/* ID06 number box */}
                          <div className="bg-slate-50 rounded-2xl p-2.5 flex items-center justify-between text-xs border border-slate-100">
                            <span className="text-slate-500 flex items-center gap-1">
                              <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                              ID06:
                            </span>
                            <span className="font-mono font-bold text-[#0F172A] tracking-wider">
                              {member.id06_number || 'Saknar ID06'}
                            </span>
                          </div>

                          {member.created_at && (
                            <div className="text-[10px] text-slate-400 flex items-center justify-between px-1">
                              <span>Registrerad:</span>
                              <span className="font-medium text-slate-500">
                                {new Date(member.created_at).toLocaleDateString('sv-SE', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Decision Buttons */}
                        <div className="pt-2 border-t border-slate-100">
                          {status === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateMemberStatus(member.id, 'verified')}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-3 rounded-xl text-xs transition-all shadow-sm active:scale-95"
                              >
                                <CheckCircle className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Godkänn ID06</span>
                              </button>

                              <button
                                onClick={() => handleUpdateMemberStatus(member.id, 'rejected')}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 font-bold py-2 px-3 rounded-xl text-xs transition-all active:scale-95"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Neka</span>
                              </button>
                            </div>
                          ) : (
                            <div className="w-full flex items-center justify-between">
                              <span className="text-[11px] text-slate-400">
                                Ändra status:
                              </span>
                              <div className="flex gap-1.5">
                                {status !== 'verified' && (
                                  <button
                                    onClick={() => handleUpdateMemberStatus(member.id, 'verified')}
                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-200 transition-colors"
                                  >
                                    Godkänn
                                  </button>
                                )}
                                {status !== 'rejected' && (
                                  <button
                                    onClick={() => handleUpdateMemberStatus(member.id, 'rejected')}
                                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[10px] font-bold border border-red-200 transition-colors"
                                  >
                                    Neka
                                  </button>
                                )}
                                <button
                                  onClick={() => handleUpdateMemberStatus(member.id, 'pending')}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-medium transition-colors"
                                >
                                  Återställ
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Inloggad som portaladministratör
          </span>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-slate-700 hover:text-slate-950 font-bold hover:underline transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Stäng admin</span>
          </button>
        </div>
      </div>
    </div>
  );
};
