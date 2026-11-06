import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Utensils, 
  Wrench, 
  Fuel, 
  Smartphone, 
  Layers, 
  ChevronRight, 
  MapPin, 
  Sparkles,
  RefreshCw,
  Flame,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Lock
} from 'lucide-react';
import { Discount } from '../types';
import { getCategoryFallbackImage } from '../lib/supabase';

interface DiscountsViewProps {
  discounts: Discount[];
  loading: boolean;
  onSelectDiscount: (discount: Discount) => void;
  onRefresh: () => void;
  isVerified?: boolean;
}

const CATEGORIES = [
  { id: 'Alla', label: 'Alla erbjudanden', icon: Layers },
  { id: 'Lunch & Mat', label: 'Lunch & Mat', icon: Utensils },
  { id: 'Verktyg & Kläder', label: 'Verktyg & Kläder', icon: Wrench },
  { id: 'Fordon & Drivmedel', label: 'Fordon & Drivmedel', icon: Fuel },
  { id: 'Mobil & Vardag', label: 'Mobil & Vardag', icon: Smartphone },
];

export const DiscountsView: React.FC<DiscountsViewProps> = ({
  discounts,
  loading,
  onSelectDiscount,
  onRefresh,
  isVerified = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Alla');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter discounts based on category and search query
  const filteredDiscounts = useMemo(() => {
    return discounts.filter((d) => {
      const matchesCategory =
        selectedCategory === 'Alla' ||
        d.category.toLowerCase() === selectedCategory.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        d.title.toLowerCase().includes(query) ||
        d.company.toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query) ||
        d.discount_badge.toLowerCase().includes(query) ||
        (d.location && d.location.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [discounts, selectedCategory, searchQuery]);

  // Featured "Veckans hetaste deals" (Top 4 discounts)
  const featuredDeals = useMemo(() => {
    return discounts.slice(0, 4);
  }, [discounts]);

  // Helper for generating an initials avatar
  const getCompanyInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7 pt-4">
      {/* Desktop & Mobile Hero Pitch Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-yellow-400/10 to-slate-100/60 border border-amber-300/40 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Sveriges Förmånsportal för ID06
          </span>
          <h1 className="text-xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
            Exklusiva rabatter för hantverkare & yrkesfolk
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Spara tusenlappar på elverktyg, drivmedel, arbetskläder, lunch och biltvätt – direkt med ditt ID06.
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-4 bg-white/80 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-sm shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Genomsnittlig besparing</span>
            <span className="text-lg font-black text-emerald-600">32 500 kr/år</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Input & Category Filter Container */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök bland butiker, verktyg, lunch, diesel..."
            className="w-full bg-white border border-slate-200/80 rounded-2xl pl-11 pr-10 py-3.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modern Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                  isSelected
                    ? 'bg-[#0F172A] text-white shadow-md shadow-slate-900/15 scale-[1.02]'
                    : 'bg-white text-slate-600 hover:text-[#0F172A] hover:bg-slate-50 border border-slate-200/70 shadow-sm'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#FACC15]' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* "Utvalda Deals" – Horisontell svep-karusell */}
      {!searchQuery && selectedCategory === 'Alla' && featuredDeals.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-600">
                <Flame className="w-4 h-4 fill-amber-500" />
              </span>
              <h2 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight">
                Veckans hetaste deals
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
              Svep för fler förmåner →
            </span>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
            {featuredDeals.map((deal) => {
              const bgImg = deal.image_url || getCategoryFallbackImage(deal.category, deal.company);

              return (
                <div
                  key={`featured-${deal.id}`}
                  onClick={() => onSelectDiscount(deal)}
                  className="relative w-[280px] sm:w-[320px] h-52 shrink-0 rounded-3xl overflow-hidden shadow-[0_8px_25px_rgb(0,0,0,0.08)] snap-start cursor-pointer group active:scale-[0.98] transition-transform"
                >
                  {/* Background Cover Image */}
                  <img
                    src={bgImg}
                    alt={deal.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/95 via-[#0F172A]/40 to-transparent" />

                  {/* Floating Discount Badge Top Right */}
                  <div className="absolute top-3.5 right-3.5 z-10 bg-[#FACC15] text-[#0F172A] font-black text-xs px-3 py-1.5 rounded-full shadow-md tracking-tight">
                    {deal.discount_badge}
                  </div>

                  {/* Content Bottom */}
                  <div className="absolute bottom-3.5 left-4 right-4 z-10 space-y-1">
                    <span className="text-[10px] uppercase font-extrabold text-yellow-400 tracking-wider block">
                      {deal.company}
                    </span>
                    <h3 className="text-white font-black text-sm sm:text-base leading-snug line-clamp-2 drop-shadow-sm">
                      {deal.title}
                    </h3>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-300 font-medium">
                        {deal.location || 'Hela Sverige'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-yellow-400 group-hover:translate-x-1 transition-transform">
                        {!isVerified && <Lock className="w-3 h-3 text-yellow-400" />}
                        <span>Se deal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Deals Feed Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight">
            {selectedCategory === 'Alla' ? 'Alla förmåner & rabatter' : selectedCategory}
          </h2>
          <span className="text-xs font-bold text-slate-500 bg-slate-200/60 px-2.5 py-0.5 rounded-full">
            {filteredDiscounts.length} st
          </span>
        </div>

        <button
          onClick={onRefresh}
          className="text-xs text-slate-500 hover:text-[#0F172A] flex items-center gap-1.5 transition-colors font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
          title="Uppdatera från Supabase"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          <span>Uppdatera</span>
        </button>
      </div>

      {/* Main Product Cards Responsive Grid (1 col on mobile, 2 cols on tablet, 3 cols on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && discounts.length === 0 ? (
          // Skeleton loading in grid
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] animate-pulse flex flex-col justify-between"
            >
              <div className="h-48 bg-slate-200 w-full" />
              <div className="p-5 space-y-3 flex-1">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-6 bg-slate-200 rounded w-4/5" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </div>
            </div>
          ))
        ) : filteredDiscounts.length > 0 ? (
          filteredDiscounts.map((discount) => {
            const cardImg = discount.image_url || getCategoryFallbackImage(discount.category, discount.company);
            const initials = getCompanyInitials(discount.company);

            return (
              <div
                key={discount.id}
                onClick={() => onSelectDiscount(discount)}
                className="group relative bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_16px_45px_rgb(0,0,0,0.12)] transition-all duration-300 cursor-pointer active:scale-[0.99] flex flex-col justify-between"
              >
                {/* Top Image (Edge-to-Edge) */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={cardImg}
                    alt={discount.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Gradient bottom shadow on image for contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10 pointer-events-none" />

                  {/* Floating Discount Badge (Top Right) */}
                  <div className="absolute top-3.5 right-3.5 z-10 bg-[#FACC15] text-[#0F172A] font-black text-xs px-3 py-1.5 rounded-full shadow-lg shadow-black/10 tracking-tight backdrop-blur-md">
                    {discount.discount_badge}
                  </div>

                  {/* Local Benefit indicator top left if local */}
                  {discount.is_local && (
                    <div className="absolute top-3.5 left-3.5 z-10 bg-emerald-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>Lokal förmån</span>
                    </div>
                  )}

                  {/* Overlapping Company Avatar/Icon (Bottom Left) */}
                  <div className="absolute -bottom-4 left-4 z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white p-0.5 shadow-md border-2 border-white flex items-center justify-center text-[#0F172A] font-black text-xs ring-1 ring-slate-100/60">
                      <div className="w-full h-full rounded-xl bg-gradient-to-br from-yellow-300 to-amber-400 flex items-center justify-center text-[#0F172A] font-black text-sm shadow-inner">
                        {initials}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Content Area Under Image */}
                <div className="p-5 pt-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {discount.company}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {discount.category}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base font-extrabold text-[#0F172A] group-hover:text-amber-600 transition-colors leading-snug line-clamp-2">
                      {discount.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {discount.description}
                    </p>
                  </div>

                  {/* Card Bottom Row: Location & "Hämta förmån" CTA */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate max-w-[150px]">{discount.location || 'Hela Sverige'}</span>
                    </span>

                    {isVerified ? (
                      <button className="flex items-center gap-1.5 bg-[#0F172A] group-hover:bg-amber-500 group-hover:text-slate-950 text-white font-bold text-xs px-4 py-2 rounded-full transition-all duration-200 shadow-sm shrink-0">
                        <span>Hämta förmån</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button className="flex items-center gap-1.5 bg-slate-100 group-hover:bg-[#0F172A] group-hover:text-yellow-400 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-full transition-all duration-200 shadow-sm shrink-0 border border-slate-200">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Lås upp</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* Empty state */
          <div className="col-span-full text-center py-16 px-4 bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-[#0F172A] text-base">Inga erbjudanden matchade sökningen</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Prova att söka på ett annat ord eller välj en annan kategori ovan.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('Alla');
                setSearchQuery('');
              }}
              className="mt-4 px-5 py-2.5 bg-yellow-400 text-slate-950 font-extrabold text-xs rounded-full hover:bg-yellow-300 transition-colors shadow-sm"
            >
              Återställ filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
