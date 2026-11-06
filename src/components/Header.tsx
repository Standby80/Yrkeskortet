import React from 'react';
import { 
  ShieldCheck, 
  HardHat, 
  Tag, 
  MapPin, 
  CreditCard, 
  User, 
  Lock,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Profile, TabType } from '../types';

interface HeaderProps {
  profile: Profile | null;
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenCardTab: () => void;
  onOpenAdmin: () => void;
  localCount?: number;
  isVerified?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeTab,
  onChangeTab,
  onOpenCardTab,
  onOpenAdmin,
  localCount = 0,
  isVerified = false,
}) => {
  const navTabs = [
    { id: 'discounts' as TabType, label: 'Rabatter', icon: Tag },
    { id: 'local' as TabType, label: 'Lokalt', icon: MapPin, badge: localCount > 0 ? localCount : undefined },
    { id: 'card' as TabType, label: 'Yrkeskortet', icon: CreditCard, highlight: true },
    { id: 'profile' as TabType, label: 'Profil / ID06', icon: User },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_2px_15px_rgb(0,0,0,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Left: Brand & Logo */}
        <div 
          onClick={() => onChangeTab('discounts')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-400/20 text-slate-950 font-black group-hover:scale-105 transition-transform">
            <HardHat className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight text-[#0F172A]">
                YRKES<span className="text-amber-500">KORTET</span>
              </span>
              <span className="text-[10px] uppercase font-black bg-amber-400/15 text-amber-700 border border-amber-400/30 px-1.5 py-0.5 rounded-md">
                .se
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Sveriges förmånsportal för alla med ID06
            </p>
          </div>
        </div>

        {/* Center: Desktop Navigation Links (Hidden on mobile < 768px) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/60 shadow-inner">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            if (tab.highlight) {
              return (
                <button
                  key={tab.id}
                  onClick={() => onChangeTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-extrabold text-xs transition-all ${
                    isActive
                      ? 'bg-[#0F172A] text-yellow-400 shadow-md ring-2 ring-yellow-400/40'
                      : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 shadow-sm'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.4]" />
                  <span>{tab.label}</span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all relative ${
                  isActive
                    ? 'bg-white text-[#0F172A] shadow-sm font-extrabold'
                    : 'text-slate-600 hover:text-[#0F172A] hover:bg-white/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0F172A]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions (Status, Admin, Profile) */}
        <div className="flex items-center gap-2.5">
          {/* Admin shortcut button (desktop & tablet) */}
          <button
            onClick={onOpenAdmin}
            className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#0F172A] bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-3 py-1.5 rounded-full transition-all font-semibold"
            title="Admin-portal (PIN: 0606)"
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Admin</span>
          </button>

          {/* Verified / Unverified Status Pill */}
          {isVerified ? (
            <button
              onClick={onOpenCardTab}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-800 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all group shadow-sm active:scale-95"
              title="Visa ditt digitala Yrkeskort"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="text-[11px] font-extrabold">
                {profile?.full_name ? profile.full_name.split(' ')[0] : 'ID06 Aktiv'}
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
            </button>
          ) : (
            <button
              onClick={() => onChangeTab('profile')}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full transition-all group shadow-sm active:scale-95"
              title="Logga in eller verifiera ID06 för att låsa upp rabatter"
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] font-extrabold">
                Lås upp ID06
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
