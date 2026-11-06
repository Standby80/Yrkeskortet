import React from 'react';
import { Tag, MapPin, CreditCard, User } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  localCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onChangeTab,
  localCount = 0,
}) => {
  const tabs = [
    {
      id: 'discounts' as TabType,
      label: 'Rabatter',
      icon: Tag,
    },
    {
      id: 'local' as TabType,
      label: 'Lokalt',
      icon: MapPin,
      badge: localCount > 0 ? localCount : undefined,
    },
    {
      id: 'card' as TabType,
      label: 'Yrkeskortet',
      icon: CreditCard,
      highlight: true,
    },
    {
      id: 'profile' as TabType,
      label: 'Profil / ID06',
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-3 left-0 right-0 z-40 max-w-md mx-auto px-4 pointer-events-none md:hidden">
      <nav className="pointer-events-auto backdrop-blur-2xl bg-white/90 border border-white/80 shadow-[0_12px_36px_rgba(15,23,42,0.12)] rounded-full px-2 py-1.5 flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.highlight) {
            return (
              <div key={tab.id} className="relative flex flex-col items-center px-1">
                <button
                  onClick={() => onChangeTab(tab.id)}
                  className={`relative -top-5 w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-xl transition-all duration-200 border-4 border-[#F8FAFC] active:scale-95 group ${
                    isActive
                      ? 'bg-gradient-to-tr from-[#0F172A] to-slate-800 text-yellow-400 shadow-slate-900/25 ring-2 ring-yellow-400/40'
                      : 'bg-gradient-to-tr from-yellow-400 to-amber-400 text-slate-950 hover:scale-105 shadow-yellow-500/30'
                  }`}
                  aria-label={tab.label}
                >
                  <Icon className="w-6 h-6 stroke-[2.4]" />
                </button>
                <span
                  className={`text-[10px] font-black -mt-4 transition-colors ${
                    isActive ? 'text-[#0F172A]' : 'text-slate-500'
                  }`}
                >
                  {tab.label}
                </span>
              </div>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center transition-all relative rounded-full ${
                isActive ? 'text-[#0F172A]' : 'text-slate-400 hover:text-slate-700'
              }`}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.5] text-[#0F172A]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-amber-400 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight transition-colors ${
                  isActive ? 'font-extrabold text-[#0F172A]' : 'font-semibold text-slate-500'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
