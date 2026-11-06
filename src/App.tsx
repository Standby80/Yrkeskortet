import React, { useState, useEffect } from 'react';
import { supabase, getDiscountsFromSupabase, FALLBACK_DISCOUNTS } from './lib/supabase';
import { Discount, Profile, TabType } from './types';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { DiscountsView } from './components/DiscountsView';
import { LocalView } from './components/LocalView';
import { YrkeskortetView } from './components/YrkeskortetView';
import { ProfileView } from './components/ProfileView';
import { DiscountModal } from './components/DiscountModal';
import { AdminPinModal } from './components/AdminPinModal';
import { AdminPanel } from './components/AdminPanel';

const DEFAULT_PROFILE: Profile = {
  id: 'guest-unverified',
  full_name: 'Gästmedlem',
  company_name: 'Ej ansluten',
  id06_number: '',
  profession: 'Besökare',
  id06_status: 'unverified',
};

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('discounts');
  const [discounts, setDiscounts] = useState<Discount[]>(FALLBACK_DISCOUNTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [isAdminPinOpen, setIsAdminPinOpen] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);

  // Initialize profile from localStorage or default unverified profile
  const [profile, setProfile] = useState<Profile>(() => {
    const saved = localStorage.getItem('yrkeskortet_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  });

  // Calculate whether current user has an active, verified ID06
  const isVerified = Boolean(
    profile &&
    profile.id !== 'logged-out' &&
    profile.id !== 'guest-unverified' &&
    profile.id06_status === 'verified'
  );

  // Load discounts from Supabase
  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const data = await getDiscountsFromSupabase();
      if (data && data.length > 0) {
        setDiscounts(data);
      }
    } catch (err) {
      console.error('Error loading discounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();

    // Check Supabase Auth session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              const loaded: Profile = {
                id: session.user.id,
                full_name: data.full_name || '',
                company_name: data.company_name || '',
                id06_number: data.id06_number || '',
                id06_status: (data.id06_status as any) || 'verified',
                email: session.user.email,
                phone: (session.user.user_metadata?.phone) || undefined,
              };
              setProfile(loaded);
              localStorage.setItem('yrkeskortet_profile', JSON.stringify(loaded));
            }
          });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        // keep profile or reset
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdateProfile = (newProfile: Profile) => {
    setProfile(newProfile);
    localStorage.setItem('yrkeskortet_profile', JSON.stringify(newProfile));
  };

  const localDiscountsCount = discounts.filter(d => d.is_local).length;

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col selection:bg-yellow-400 selection:text-slate-950">
      {/* Responsive Full-Width Header */}
      <Header
        profile={profile}
        activeTab={activeTab}
        isVerified={isVerified}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCardTab={() => {
          setActiveTab('card');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdmin={() => setIsAdminPinOpen(true)}
        localCount={localDiscountsCount}
      />

      {/* Main Responsive App Content Area */}
      <main className="flex-1 w-full pb-20 md:pb-12">
        {activeTab === 'discounts' && (
          <DiscountsView
            discounts={discounts}
            loading={loading}
            isVerified={isVerified}
            onSelectDiscount={(d) => setSelectedDiscount(d)}
            onRefresh={loadDiscounts}
          />
        )}

        {activeTab === 'local' && (
          <LocalView
            discounts={discounts}
            isVerified={isVerified}
            onSelectDiscount={(d) => setSelectedDiscount(d)}
            onNavigateToCard={() => {
              setActiveTab('card');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'card' && (
          <YrkeskortetView
            profile={profile}
            onNavigateToProfile={() => {
              setActiveTab('profile');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onNavigateToCard={() => {
              setActiveTab('card');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAdmin={() => setIsAdminPinOpen(true)}
          />
        )}
      </main>

      {/* Floating Bottom Navigation (Only visible on mobile screens < 768px) */}
      <BottomNavigation
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        localCount={localDiscountsCount}
      />

      {/* Discount Details Modal */}
      <DiscountModal
        discount={selectedDiscount}
        isVerified={isVerified}
        onClose={() => setSelectedDiscount(null)}
        onNavigateToCard={() => {
          setSelectedDiscount(null);
          setActiveTab('card');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToProfile={() => {
          setSelectedDiscount(null);
          setActiveTab('profile');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Admin PIN Authentication Modal */}
      <AdminPinModal
        isOpen={isAdminPinOpen}
        onClose={() => setIsAdminPinOpen(false)}
        onSuccess={() => {
          setIsAdminPinOpen(false);
          setIsAdminPanelOpen(true);
        }}
      />

      {/* Admin Management Panel */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        discounts={discounts}
        onDiscountsUpdated={(updated) => setDiscounts(updated)}
      />
    </div>
  );
}

export default App;
