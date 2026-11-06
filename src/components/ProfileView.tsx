import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  Save, 
  LogOut, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Mail, 
  Zap, 
  HardHat, 
  ArrowRight, 
  Info 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { ID06AiScanner } from './ID06AiScanner';

interface ProfileViewProps {
  profile: Profile | null;
  onUpdateProfile: (newProfile: Profile) => void;
  onNavigateToCard: () => void;
  onOpenAdmin: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onUpdateProfile,
  onNavigateToCard,
  onOpenAdmin,
}) => {
  // Form state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [id06Number, setId06Number] = useState(profile?.id06_number || '');
  const [profession, setProfession] = useState(profile?.profession || 'Snickare / Träarbetare');

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state if prop changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setCompanyName(profile.company_name || '');
      setId06Number(profile.id06_number || '');
      if (profile.profession) setProfession(profile.profession);
    }
  }, [profile]);

  // Demo user trigger (No waiting for email confirmation)
  const handleQuickDemo = (persona?: { name: string; company: string; id06: string; profession: string }) => {
    const demoData: Profile = {
      id: profile?.id && profile.id !== 'logged-out' ? profile.id : 'demo-user-id06',
      full_name: persona?.name || 'Johan Lindqvist',
      company_name: persona?.company || 'Nordic Entreprenad AB',
      id06_number: persona?.id06 || '9820 4410 8821',
      profession: persona?.profession || 'Certifierad Elinstallatör',
      id06_status: 'verified',
    };

    onUpdateProfile(demoData);
    setFullName(demoData.full_name);
    setCompanyName(demoData.company_name);
    setId06Number(demoData.id06_number);
    setProfession(demoData.profession || '');

    setMessage({
      type: 'success',
      text: 'Verifierat ID06-medlemskap aktiverat! Alla rabattkoder och förmåner är nu upplåsta.',
    });

    setTimeout(() => {
      setMessage(null);
    }, 3500);
  };

  // Switch to guest / unverified mode to test locked discounts
  const handleSetGuestMode = () => {
    const guestData: Profile = {
      id: 'logged-out',
      full_name: 'Gästmedlem',
      company_name: 'Ej registrerad',
      id06_number: '',
      profession: 'Besökare',
      id06_status: 'unverified',
    };

    onUpdateProfile(guestData);
    setFullName('');
    setCompanyName('');
    setId06Number('');
    setProfession('Besökare');

    setMessage({
      type: 'success',
      text: 'Oinloggat / ej verifierat läge aktiverat. Rabattkoder är nu låsta för testning.',
    });

    setTimeout(() => {
      setMessage(null);
    }, 3500);
  };

  // Handle Save profile to Supabase
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setMessage(null);

    const updatedProfile: Profile = {
      id: profile?.id || 'demo-user-id06',
      full_name: fullName.trim(),
      company_name: companyName.trim(),
      id06_number: id06Number.trim(),
      profession: profession,
      id06_status: id06Number.trim().length >= 4 ? 'verified' : (profile?.id06_status || 'unverified'),
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { error } = await supabase.from('profiles').upsert({
          id: session.user.id,
          full_name: updatedProfile.full_name,
          company_name: updatedProfile.company_name,
          id06_number: updatedProfile.id06_number,
        });

        if (error) {
          console.warn('Could not save to Supabase profiles table, saving locally:', error.message);
        }
      }

      onUpdateProfile(updatedProfile);
      setMessage({
        type: 'success',
        text: 'Profil och ID06-uppgifter sparade! Ändringarna syns direkt på ditt kort.',
      });
    } catch (err: any) {
      console.error(err);
      onUpdateProfile(updatedProfile);
      setMessage({
        type: 'success',
        text: 'Sparat i appen! Kortet är uppdaterat.',
      });
    } finally {
      setSaveLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // Handle Supabase Auth (Sign in or Sign up)
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setMessage(null);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data.user) {
          setMessage({
            type: 'success',
            text: 'Konto skapat! Om bekräftelsemail krävs kan du använda demoläget nedan för att testa direkt.',
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        if (data.user) {
          const { data: pData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (pData) {
            onUpdateProfile({
              id: data.user.id,
              full_name: pData.full_name || '',
              company_name: pData.company_name || '',
              id06_number: pData.id06_number || '',
            });
          } else {
            onUpdateProfile({
              id: data.user.id,
              full_name: email.split('@')[0],
              company_name: 'Bygg & Montage AB',
              id06_number: '9840 2210 5519',
            });
          }

          setMessage({
            type: 'success',
            text: 'Inloggad framgångsrikt!',
          });
        }
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Ett fel uppstod vid inloggning.',
      });
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('yrkeskortet_profile');
    onUpdateProfile({
      id: 'logged-out',
      full_name: 'Gästmedlem',
      company_name: 'Ej ansluten',
      id06_number: '',
      profession: 'Besökare',
      id06_status: 'unverified',
    });
    setMessage({
      type: 'success',
      text: 'Du har loggats ut.',
    });
  };

  const isVerified = Boolean(
    profile &&
    profile.id !== 'logged-out' &&
    profile.id !== 'guest-unverified' &&
    profile.id06_status === 'verified'
  );
  const isDemoActive = profile && profile.id === 'demo-user-id06';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-4">
      {/* Top Banner / ID06 Overview */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          {isVerified ? (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ID06 Verifierat & Aktivt (Rabatter upplåsta)
            </span>
          ) : (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-600" />
              Ej verifierad – Rabattkoder är låsta
            </span>
          )}
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Profil & ID06-medlemskap
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Koppla ditt ID06-kortnummer med mobilkameran eller fyll i dina uppgifter manuellt.
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
          <HardHat className="w-7 h-7 text-amber-500" />
        </div>
      </div>

      {/* Notification Toast Banner */}
      {message && (
        <div className="animate-fade-in">
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 text-xs font-semibold ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            )}
            <div className="flex-1">{message.text}</div>
          </div>
        </div>
      )}

      {/* 2-Column Responsive Dashboard Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: AI CAMERA SCANNER & QUICK DEMO */}
        <div className="space-y-6">
          {/* AI ID06 CAMERA SCANNER SECTION */}
          <ID06AiScanner
            profile={profile}
            onVerificationComplete={(updated) => {
              onUpdateProfile(updated);
              setFullName(updated.full_name);
              setCompanyName(updated.company_name);
              setId06Number(updated.id06_number);
              setMessage({
                type: 'success',
                text: 'Ditt ID06-kort har verifierats av AI och ditt Yrkeskort är nu aktivt!',
              });
              setTimeout(() => setMessage(null), 4000);
            }}
            onNavigateToCard={onNavigateToCard}
          />

          {/* QUICK DEMO BANNER */}
          <div className="bg-gradient-to-br from-amber-50 via-yellow-50/40 to-white border-2 border-dashed border-amber-300 rounded-3xl p-6 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h3 className="text-xs font-black text-amber-800 uppercase tracking-wider">
                  Snabbtest / Demoläge
                </h3>
              </div>
              {isDemoActive && (
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                  Aktivt demoläge
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Testa direkt utan att vänta! Växla snabbt mellan verifierad medlem för att se upplåsta rabattkoder, och oinloggad/ej verifierad för att testa det låsta läget.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleQuickDemo()}
                className="w-full flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-yellow-400 font-extrabold py-3 px-4 rounded-2xl shadow-md active:scale-98 transition-all text-xs"
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Testa som verifierad medlem (1-klick)</span>
              </button>

              <button
                onClick={handleSetGuestMode}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-extrabold py-2.5 px-4 rounded-2xl shadow-sm active:scale-98 transition-all text-xs"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Testa som oinloggad / ej verifierad gäst (låser rabatter)</span>
              </button>
            </div>

            {/* Quick Persona presets */}
            <div className="pt-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
                Eller växla yrkesroll direkt:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  onClick={() =>
                    handleQuickDemo({
                      name: 'Sara Viklund',
                      company: 'Svea Bygg & Entreprenad AB',
                      id06: '9840 7712 3349',
                      profession: 'Platschef & Snickare',
                    })
                  }
                  className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-amber-200/80 text-left text-slate-700 transition-colors shadow-sm"
                >
                  <strong className="text-[#0F172A] block font-bold">Sara Viklund</strong>
                  <span className="text-[10px] text-amber-600 font-semibold">Snickare & Platschef</span>
                </button>

                <button
                  onClick={() =>
                    handleQuickDemo({
                      name: 'Marcus Ekström',
                      company: 'Mälardalens Rör & VVS AB',
                      id06: '9120 4455 8890',
                      profession: 'VVS- och Kyltekniker',
                    })
                  }
                  className="p-3 rounded-xl bg-white hover:bg-slate-50 border border-amber-200/80 text-left text-slate-700 transition-colors shadow-sm"
                >
                  <strong className="text-[#0F172A] block font-bold">Marcus Ekström</strong>
                  <span className="text-[10px] text-amber-600 font-semibold">VVS- & Kyltekniker</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EDIT PROFILE FORM & SUPABASE AUTH */}
        <div className="space-y-6">
          {/* EDIT PROFILE FORM */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-extrabold text-[#0F172A]">
                  Dina ID06- & Företagsuppgifter
                </h3>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Synkas till kortet
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Fullständigt namn
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="t.ex. Johan Lindqvist"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                />
              </div>

              {/* Company Name */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Företag / Arbetsgivare
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="t.ex. Nordic Entreprenad AB"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                />
              </div>

              {/* ID06 Number */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1 flex items-center justify-between">
                  <span>ID06-Kortnummer</span>
                  <span className="text-[10px] text-slate-400">12 siffror på baksidan</span>
                </label>
                <input
                  type="text"
                  required
                  value={id06Number}
                  onChange={(e) => setId06Number(e.target.value)}
                  placeholder="9820 4410 8821"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] font-mono tracking-wider placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-bold"
                />
              </div>

              {/* Profession */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Yrkesroll
                </label>
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                >
                  <option value="Certifierad Elinstallatör">Elinstallatör / Elektriker</option>
                  <option value="Snickare / Träarbetare">Snickare / Träarbetare</option>
                  <option value="VVS- & Rörmontör">VVS- & Rörmontör</option>
                  <option value="Plattsättare / Murare">Plattsättare / Murare</option>
                  <option value="Målare / Ytbehandlare">Målare / Ytbehandlare</option>
                  <option value="Plåtslagare & Takmontör">Plåtslagare & Takmontör</option>
                  <option value="Anläggningsarbetare / Maskinförare">Anläggning / Maskinförare</option>
                  <option value="Projektledare / Platschef">Projektledare / Platschef</option>
                  <option value="Kyl- & Ventilationstekniker">Kyl- & Ventilationstekniker</option>
                </select>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#FACC15] hover:bg-yellow-400 text-slate-950 font-black py-3 px-4 rounded-2xl shadow-sm active:scale-98 transition-all text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{saveLoading ? 'Sparar...' : 'Spara uppgifter till Yrkeskortet'}</span>
                </button>
              </div>
            </form>

            {/* Direct link to card */}
            <button
              onClick={onNavigateToCard}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-[#0F172A] text-xs font-bold transition-colors border border-slate-200/80"
            >
              <CreditCard className="w-4 h-4 text-amber-500" />
              <span>Visa mitt uppdaterade digitala kort</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
            </button>
          </div>

          {/* SUPABASE AUTH SECTION */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-extrabold text-[#0F172A]">
                  Supabase Auth (Konto)
                </h3>
              </div>
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                    authMode === 'login' ? 'bg-[#0F172A] text-white' : 'text-slate-500'
                  }`}
                >
                  Logga in
                </button>
                <button
                  onClick={() => setAuthMode('signup')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                    authMode === 'signup' ? 'bg-[#0F172A] text-white' : 'text-slate-500'
                  }`}
                >
                  Skapa konto
                </button>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  E-postadress
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="namn@foretag.se"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Lösenord
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minst 6 tecken"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {authLoading
                    ? 'Behandlar...'
                    : authMode === 'login'
                    ? 'Logga in med Supabase'
                    : 'Skapa nytt konto med e-post'}
                </span>
              </button>
            </form>

            {profile && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-red-600 hover:text-red-700 font-bold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logga ut / Nollställ session</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ID06 SECURITY NOTICE & ADMIN LINK */}
      <div className="pt-2 space-y-3">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-500 shadow-sm">
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Yrkeskortet är en förmånsportal för alla med ID06. ID06® är ett registrerat varumärke för ID06 AB. Förmånerna tillhandahålls i samarbete med leverantörer och lokala partners i hela Sverige.
          </p>
        </div>

        <div className="text-center pb-4">
          <button
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#0F172A] transition-colors py-1.5 px-3 rounded-full hover:bg-slate-200/60"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Admin-inloggning</span>
          </button>
        </div>
      </div>
    </div>
  );
};
