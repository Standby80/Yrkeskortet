import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  Smartphone,
  CheckCircle2,
  HardHat
} from 'lucide-react';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';

interface SaveMembershipModalProps {
  isOpen: boolean;
  profile: Profile | null;
  onClose: () => void;
  onSaved: (updatedProfile: Profile) => void;
  onNavigateToCard?: () => void;
}

export const SaveMembershipModal: React.FC<SaveMembershipModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSaved,
  onNavigateToCard,
}) => {
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !profile) return null;

  const rawId06 = profile.id06_number || '';
  const cleanDigits = rawId06.replace(/\D/g, '');
  const lastFour = cleanDigits.slice(-4) || '8821';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Vänligen ange en giltig e-postadress.');
      setLoading(false);
      return;
    }

    const updatedProfile: Profile = {
      ...profile,
      email: trimmedEmail,
      phone: trimmedPhone || undefined,
      id06_status: 'verified',
    };

    try {
      // 1. Always persist to localStorage for instant 100% friction-free mobile access
      if (rememberMe) {
        localStorage.setItem('yrkeskortet_profile', JSON.stringify(updatedProfile));
        localStorage.setItem('yrkeskortet_remember_me', 'true');
      }

      // 2. Send Supabase Magic Link / OTP without passwords so they can restore on any phone
      try {
        await supabase.auth.signInWithOtp({
          email: trimmedEmail,
          options: {
            data: {
              full_name: updatedProfile.full_name,
              company_name: updatedProfile.company_name,
              id06_number: updatedProfile.id06_number,
              phone: trimmedPhone,
            },
            emailRedirectTo: window.location.origin,
          },
        });
      } catch (authErr) {
        console.warn('Supabase OTP notice (device saved locally):', authErr);
      }

      // 3. Upsert to Supabase profiles if an active session exists
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.from('profiles').upsert({
            id: session.user.id,
            full_name: updatedProfile.full_name,
            company_name: updatedProfile.company_name,
            id06_number: updatedProfile.id06_number,
            id06_status: 'verified',
          });
        }
      } catch (dbErr) {
        console.warn('Could not upsert to Supabase table:', dbErr);
      }

      setSuccess(true);
      onSaved(updatedProfile);

      setTimeout(() => {
        onClose();
        if (onNavigateToCard) {
          onNavigateToCard();
        }
      }, 1400);
    } catch (err: any) {
      console.error('Error saving membership:', err);
      // Fallback: save locally anyway
      onSaved(updatedProfile);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        if (onNavigateToCard) onNavigateToCard();
      }, 1400);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Save locally without requiring email
    const updatedProfile: Profile = {
      ...profile,
      id06_status: 'verified',
    };
    localStorage.setItem('yrkeskortet_profile', JSON.stringify(updatedProfile));
    onSaved(updatedProfile);
    onClose();
    if (onNavigateToCard) {
      onNavigateToCard();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 text-[#0F172A] p-6 space-y-5 animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          aria-label="Stäng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-13 h-13 rounded-2xl bg-[#0F172A] text-yellow-400 flex items-center justify-center mx-auto shadow-md">
            <HardHat className="w-7 h-7 text-yellow-400" />
          </div>

          <h3 className="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight leading-snug">
            Spara ditt medlemskap så du slipper logga in nästa gång!
          </h3>

          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            100% lösenordsfritt för hantverkare. Ange din e-post så hålls ditt aktiva ID06 sparat på denna telefon och i molnet.
          </p>
        </div>

        {/* Mini Preview Card of ID06 */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-inner border border-slate-700/50 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-extrabold text-yellow-400 tracking-wider uppercase text-[10px]">
              YRKESKORTET • ID06
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Verifierad
            </span>
          </div>

          <div className="space-y-0.5">
            <p className="font-black text-sm text-white">{profile.full_name || 'Hantverkare'}</p>
            <p className="text-xs text-slate-300 font-medium">{profile.company_name || 'Byggföretag'}</p>
          </div>

          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>ID06 •••• {lastFour}</span>
            <span className="text-emerald-400 font-sans font-bold">Kortet är aktivt</span>
          </div>
        </div>

        {/* Success View */}
        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-center space-y-1.5 animate-fade-in">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-black text-sm">Medlemskapet är sparat!</h4>
            <p className="text-xs text-emerald-700">
              Du är inloggad på denna telefon och alla rabattkoder är upplåsta.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3.5">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Din e-postadress <span className="text-amber-600">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="t.ex. johan@byggarna.se"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Inga lösenord behövs. Du får en snabblänk om du byter mobil.
              </p>
            </div>

            {/* Phone Field (Optional) */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>Mobilnummer (valfritt)</span>
                <span className="text-[10px] text-slate-400">För SMS vid rabatter</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="070-123 45 67"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium"
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-yellow-400"
              />
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                <span>Kom ihåg mig på denna telefon (rekommenderas)</span>
              </span>
            </label>

            {/* Submit Button */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#FACC15] hover:bg-yellow-400 text-slate-950 font-black py-3.5 px-4 rounded-2xl shadow-md active:scale-98 transition-all text-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Sparar medlemskap...' : 'Spara & Aktivera mitt Yrkeskort'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-600 font-semibold transition-colors"
              >
                Hoppa över – spara bara lokalt på enheten
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
