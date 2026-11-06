import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  CreditCard, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Discount } from '../types';
import { getCategoryFallbackImage } from '../lib/supabase';

interface DiscountModalProps {
  discount: Discount | null;
  isVerified: boolean;
  onClose: () => void;
  onNavigateToCard: () => void;
  onNavigateToProfile: () => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({
  discount,
  isVerified,
  onClose,
  onNavigateToCard,
  onNavigateToProfile,
}) => {
  const [copied, setCopied] = useState(false);

  if (!discount) return null;

  const isShowCard =
    !discount.discount_code ||
    discount.discount_code.trim().toUpperCase() === 'VISA KORTET' ||
    discount.discount_code.toLowerCase().includes('visa') ||
    discount.is_local;

  const handleCopy = () => {
    if (discount.discount_code && isVerified) {
      navigator.clipboard.writeText(discount.discount_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const modalImg = discount.image_url || getCategoryFallbackImage(discount.category, discount.company);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10 text-[#0F172A]">
        {/* Top Hero Image Header */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-100 shrink-0">
          <img
            src={modalImg}
            alt={discount.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />

          {/* Close Button on top of image */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-[#0F172A] hover:bg-white flex items-center justify-center shadow-md transition-colors"
            aria-label="Stäng modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Floating Yellow Badge & Status */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="bg-[#FACC15] text-[#0F172A] font-black text-xs px-3 py-1.5 rounded-full shadow-lg">
              {discount.discount_badge}
            </div>

            {!isVerified && (
              <div className="bg-slate-900/90 text-yellow-400 font-extrabold text-[11px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 backdrop-blur-md border border-yellow-400/30">
                <Lock className="w-3 h-3" />
                <span>Låst förmån</span>
              </div>
            )}
          </div>

          {/* Company & Category Overlaid at bottom of image */}
          <div className="absolute bottom-3.5 left-4 right-4 text-white">
            <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-300 block mb-0.5">
              {discount.company}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md">
                {discount.category}
              </span>
              {discount.is_local && (
                <span className="text-[10px] font-extrabold bg-emerald-500/80 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  Lokal förmån
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#0F172A] leading-tight">
              {discount.title}
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {discount.description}
            </p>
          </div>

          {/* Location & Verification info */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Gäller: <strong className="text-[#0F172A]">{discount.location || 'Hela Sverige'}</strong></span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>ID06 Avtal</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CASE 1: USER IS NOT VERIFIED (LOCKED STATE)              */}
          {/* ======================================================== */}
          {!isVerified ? (
            <div className="space-y-4 pt-1">
              {/* Masked Discount Code Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Exklusiv rabattkod (Maskerad):</span>
                </label>
                <div className="relative flex items-center justify-between bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-3.5 overflow-hidden">
                  <div className="font-mono text-xl font-black text-slate-400 tracking-widest pl-2 select-none filter blur-[3px]">
                    {discount.discount_code ? 'YRKES06SECRET' : 'VISAKORTET06'}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100/70 backdrop-blur-[2px]">
                    <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#0F172A] bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Koden är låst</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Requirement 1: Prominent Lock Notice with Exact Text */}
              <div className="bg-gradient-to-br from-amber-50 via-yellow-50/40 to-white border-2 border-dashed border-amber-300 rounded-3xl p-5 text-center space-y-3.5 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-yellow-400 flex items-center justify-center mx-auto shadow-md">
                  <Lock className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-[#0F172A] text-base">
                    Lås upp förmånen med ID06
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed max-w-sm mx-auto">
                    Logga in och verifiera ditt ID06 för att låsa upp rabattkoder och förmåner.
                  </p>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onNavigateToProfile();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-yellow-400 font-black py-3 px-4 rounded-2xl shadow-md active:scale-98 transition-all text-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-yellow-400" />
                  <span>Gå till Profil / ID06 och lås upp</span>
                  <ArrowRight className="w-4 h-4 text-yellow-400" />
                </button>
              </div>

              {/* Requirement 2: Masked/Disabled External Link */}
              {discount.external_url && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToProfile();
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 font-bold text-xs transition-colors border border-slate-200"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Länk till butiken låses upp vid verifierat ID06</span>
                </button>
              )}
            </div>
          ) : (
            /* ======================================================== */
            /* CASE 2: USER IS VERIFIED (UNLOCKED STATE)                */
            /* ======================================================== */
            <div className="pt-1 space-y-4">
              {!isShowCard && discount.discount_code ? (
                // Online Code Redemption
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider block">
                    Din upplåsta rabattkod:
                  </label>
                  <div className="flex items-center justify-between bg-slate-50 border-2 border-dashed border-amber-400/60 rounded-2xl p-3.5">
                    <div className="font-mono text-xl font-black text-[#0F172A] tracking-widest pl-2 select-all">
                      {discount.discount_code}
                    </div>
                    <button
                      onClick={handleCopy}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-md ${
                        copied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#FACC15] hover:bg-yellow-400 text-slate-950 active:scale-95'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Kopierad!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Kopiera kod</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">
                    Ange koden i kassan på partnerns webbplats eller i appen.
                  </p>
                </div>
              ) : (
                // In-store / In-person Redemption
                <div className="bg-gradient-to-br from-amber-50 via-yellow-50/50 to-white border border-amber-200 rounded-2xl p-4 text-center space-y-3 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-600 flex items-center justify-center mx-auto">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-[#0F172A] text-base">
                      Visa Yrkeskortet i kassan
                    </h5>
                    <p className="text-xs text-slate-600 mt-1">
                      Denna rabatt erhålls i fysisk butik eller restaurang genom att visa upp ditt aktiva digitala Yrkeskort på telefonen.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToCard();
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white font-black py-3 px-4 rounded-xl shadow-md active:scale-98 transition-all"
                  >
                    <CreditCard className="w-5 h-5 text-yellow-400" />
                    <span>Öppna mitt Yrkeskort nu</span>
                  </button>
                </div>
              )}

              {/* Unlocked External URL */}
              {discount.external_url && (
                <a
                  href={discount.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  <span>Besök butikens hemsida</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Exklusiv förmån för Yrkeskortet & ID06-anslutna
          </p>
        </div>
      </div>
    </div>
  );
};
