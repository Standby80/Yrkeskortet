import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Navigation, 
  Utensils, 
  Car, 
  ChevronRight, 
  ShieldCheck, 
  Compass,
  Store,
  CreditCard,
  Lock
} from 'lucide-react';
import { Discount } from '../types';
import { getCategoryFallbackImage } from '../lib/supabase';

interface LocalViewProps {
  discounts: Discount[];
  onSelectDiscount: (discount: Discount) => void;
  onNavigateToCard: () => void;
  isVerified?: boolean;
}

export const LocalView: React.FC<LocalViewProps> = ({
  discounts,
  onSelectDiscount,
  onNavigateToCard,
  isVerified = false,
}) => {
  const [localCategory, setLocalCategory] = useState<string>('Alla');

  // Filter discounts where is_local === true
  const localDiscounts = useMemo(() => {
    const locals = discounts.filter((d) => d.is_local === true);
    if (localCategory === 'Alla') return locals;
    return locals.filter((d) => d.category.toLowerCase().includes(localCategory.toLowerCase()));
  }, [discounts, localCategory]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7 pt-4">
      {/* Workplace Location Radar Card - Responsive Banner */}
      <div className="rounded-3xl bg-white border border-slate-100 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-amber-600 font-extrabold uppercase tracking-wider">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span>Nära din arbetsplats / bygge</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
            Lunch & Biltvätt i närheten
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Dagens lunch, snabbmat, verktyg och fordonstvätt runt ditt byggprojekt.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-[#0F172A]">Industriområdet / Arbetsplatsen</span>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 rounded-full border border-emerald-200">
              GPS Aktiv
            </span>
          </div>
        </div>

        {/* Action card to open card */}
        <div 
          onClick={onNavigateToCard}
          className="bg-gradient-to-r from-amber-400/20 via-yellow-400/15 to-amber-100/40 border border-amber-300/50 rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer group shadow-sm hover:shadow transition-all shrink-0 w-full md:w-auto"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-yellow-400 flex items-center justify-center font-black shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-[#0F172A] group-hover:text-amber-700 transition-colors">
                Visa Yrkeskortet i kassan
              </p>
              <p className="text-[11px] text-slate-500">
                Klicka för att öppna ditt digitala kort
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Quick Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {[
          { id: 'Alla', label: 'Alla lokala', icon: Compass },
          { id: 'Lunch', label: 'Lunch & Mat', icon: Utensils },
          { id: 'Fordon', label: 'Biltvätt & Bilvård', icon: Car },
          { id: 'Verktyg', label: 'Lokal Butik', icon: Store },
        ].map((cat) => {
          const Icon = cat.icon;
          const isSelected = localCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setLocalCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#0F172A] text-white shadow-md shadow-slate-900/15'
                  : 'bg-white text-slate-600 hover:text-[#0F172A] border border-slate-200/70 shadow-sm'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-yellow-400' : 'text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Local Spots Responsive Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
          <span>Hittade lokala förmåner ({localDiscounts.length})</span>
          <span>Sorterat efter avstånd</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localDiscounts.length > 0 ? (
            localDiscounts.map((discount, idx) => {
              const cardImg = discount.image_url || getCategoryFallbackImage(discount.category, discount.company);

              return (
                <div
                  key={discount.id}
                  onClick={() => onSelectDiscount(discount)}
                  className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_16px_45px_rgb(0,0,0,0.12)] transition-all duration-300 cursor-pointer active:scale-[0.99] group flex flex-col justify-between"
                >
                  {/* Visual Cover Photo with Distance Badge */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={cardImg}
                      alt={discount.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

                    {/* Distance Pill (Top Left) */}
                    <div className="absolute top-3.5 left-3.5 z-10 bg-white/95 backdrop-blur-md text-[#0F172A] font-extrabold text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                      <span>{discount.distance || `${(idx + 1) * 350} m`}</span>
                    </div>

                    {/* Discount Badge (Top Right) */}
                    <div className="absolute top-3.5 right-3.5 z-10 bg-[#FACC15] text-[#0F172A] font-black text-xs px-3 py-1.5 rounded-full shadow-md">
                      {discount.discount_badge}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {discount.company}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {discount.location || 'Nära dig'}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-[#0F172A] group-hover:text-amber-600 transition-colors leading-snug mt-1">
                        {discount.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {discount.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 font-bold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Visa kortet i kassan</span>
                      </div>

                      {isVerified ? (
                        <button className="flex items-center gap-1.5 bg-[#0F172A] text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-sm group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                          <span>Visa deal</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button className="flex items-center gap-1.5 bg-slate-100 text-slate-700 font-bold text-xs px-3.5 py-1.5 rounded-full shadow-sm group-hover:bg-[#0F172A] group-hover:text-yellow-400 transition-colors border border-slate-200">
                          <Lock className="w-3 h-3 text-amber-500" />
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
            <div className="col-span-full text-center py-16 px-4 bg-white rounded-3xl shadow-sm border border-slate-100">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="font-extrabold text-[#0F172A] text-base">Inga lokala erbjudanden i denna kategori</h3>
              <p className="text-xs text-slate-500 mt-1">Välj "Alla lokala" för att se alla närliggande ställen.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
