import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  HardHat, 
  Clock, 
  QrCode, 
  Copy, 
  Check, 
  Sun, 
  Award, 
  ChevronRight, 
  Sparkles,
  RotateCw,
  Barcode,
  Wifi,
  Lock,
  Radio
} from 'lucide-react';
import { Profile } from '../types';
import { QRCodeDisplay } from './QRCodeDisplay';
import { BarcodeDisplay } from './BarcodeDisplay';

interface YrkeskortetViewProps {
  profile: Profile | null;
  onNavigateToProfile: () => void;
}

export const YrkeskortetView: React.FC<YrkeskortetViewProps> = ({
  profile,
  onNavigateToProfile,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [maxBrightness, setMaxBrightness] = useState(false);

  // Real-time ticking clock with seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Swedish date and time
  const formattedTime = currentTime.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = currentTime.toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Effective member data with realistic fallbacks
  const memberName = profile?.full_name?.trim() || 'Johan Lindqvist';
  const companyName = profile?.company_name?.trim() || 'Nordic Entreprenad AB';
  const rawId06 = profile?.id06_number?.trim() || '9820 4410 8821';
  const profession = profile?.profession || 'Certifierad Elinstallatör';

  // Masked ID06 e.g. "ID06 •••• 8821"
  const cleanDigits = rawId06.replace(/\D/g, '');
  const lastFour = cleanDigits.slice(-4) || '8821';
  const maskedId06 = `ID06 •••• ${lastFour}`;
  const barcodeValue = `YK-06-${lastFour}-${currentTime.getFullYear()}`;

  const handleCopyId06 = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(rawId06);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  return (
    <div className={`w-full max-w-lg mx-auto space-y-5 pb-24 pt-4 px-4 transition-all duration-300 ${maxBrightness ? 'brightness-125' : ''}`}>
      {/* Top Banner Notice (Apple Wallet style top bar) */}
      <div>
        <div className="bg-white border border-slate-100 rounded-2xl p-3 flex items-center justify-between shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span className="text-xs font-bold text-[#0F172A]">
              Apple Wallet Pass • Verifierat ID06
            </span>
          </div>

          <button
            onClick={() => setMaxBrightness(!maxBrightness)}
            className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full transition-all shadow-sm ${
              maxBrightness
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Öka skärmens ljusstyrka för butiksscanning"
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>{maxBrightness ? 'Max ljus PÅ' : 'Ljusstyrka'}</span>
          </button>
        </div>
      </div>

      {/* 3D REVERSIBLE DIGITAL MEMBERSHIP CARD (Apple Wallet Inspired) */}
      <div>
        <div className="perspective-1000 w-full select-none">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`relative w-full transition-transform duration-700 transform-style-3d cursor-pointer ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            style={{ minHeight: '480px' }}
          >
            {/* ======================================================== */}
            {/* FRONT FACE (METALLIC PREMIUM TITANIUM & GOLD PASS)       */}
            {/* ======================================================== */}
            <div className="backface-hidden w-full h-full rounded-[28px] p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-[#0B1120] border-2 border-amber-400/40 shadow-2xl shadow-slate-950/40 text-white flex flex-col justify-between relative overflow-hidden">
              {/* Dynamic Holographic Shimmer Effect */}
              <div className="absolute inset-0 hologram-shimmer pointer-events-none opacity-40 mix-blend-screen" />

              {/* Diagonal Watermark Anti-Fraud Pattern */}
              <div className="absolute -inset-10 opacity-5 pointer-events-none flex flex-wrap gap-6 text-[10px] font-mono font-black uppercase text-yellow-400 transform -rotate-12">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span key={i} className="tracking-widest">
                    YRKESKORTET • VERIFIED ID06 PASS • OFFICIAL
                  </span>
                ))}
              </div>

              {/* CARD TOP ROW: LOGO, BRAND & CHIP / NFC */}
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-400 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-yellow-500/30">
                    <HardHat className="w-6 h-6 text-slate-950" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xl tracking-wider text-white">
                        YRKES<span className="text-yellow-400">KORTET</span>
                      </span>
                      <span className="text-[10px] uppercase font-black bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 px-1.5 py-0.5 rounded">
                        .se
                      </span>
                    </div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                      Officiellt Medlemskort
                    </p>
                  </div>
                </div>

                {/* EMV Gold Chip & Contactless NFC icon */}
                <div className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-yellow-400/70 rotate-90" />
                  <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 border border-yellow-200/50 flex flex-col justify-between p-1 opacity-95 shadow">
                    <div className="h-0.5 w-full bg-slate-900/30 rounded" />
                    <div className="h-0.5 w-3/4 bg-slate-900/30 rounded mx-auto" />
                    <div className="h-0.5 w-full bg-slate-900/30 rounded" />
                  </div>
                </div>
              </div>

              {/* SECURITY BADGE: VERIFIERAD ID06-INNEHAVARE */}
              <div className="relative z-10 my-4">
                <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/50 rounded-full px-3.5 py-1.5 shadow-lg shadow-emerald-500/10 backdrop-blur-md">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-sm"></span>
                  </span>
                  <span className="text-xs font-black tracking-wider text-emerald-400 uppercase">
                    VERIFIERAD ID06-INNEHAVARE
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 ml-0.5" />
                </div>
              </div>

              {/* LIVE SECURITY BAR: ANTI-SCREENSHOT REAL-TIME CLOCK & WAVEFORM */}
              <div className="relative z-10 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-inner backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-0.5">
                      <Clock className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Äkthetskontroll i realtid</span>
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-3xl font-black text-white tracking-wider">
                        {formattedTime}
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping inline-block" />
                    </div>
                  </div>

                  {/* Pulsing Live Audio/Radar Security Waveform */}
                  <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="security-wave-bar w-1 bg-emerald-400 rounded-full" style={{ animationDelay: '0ms' }} />
                    <span className="security-wave-bar w-1 bg-emerald-400 rounded-full" style={{ animationDelay: '200ms' }} />
                    <span className="security-wave-bar w-1 bg-yellow-400 rounded-full" style={{ animationDelay: '400ms' }} />
                    <span className="security-wave-bar w-1 bg-yellow-400 rounded-full" style={{ animationDelay: '150ms' }} />
                    <span className="security-wave-bar w-1 bg-emerald-400 rounded-full" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-yellow-300 font-bold capitalize">
                    {formattedDate}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                    SIGNAL AKTIV
                  </span>
                </div>
              </div>

              {/* MEMBER & ID06 PROFILE DATA */}
              <div className="relative z-10 pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Medlem / Innehavare
                    </span>
                    <h3 className="text-base font-black text-white truncate">
                      {memberName}
                    </h3>
                    <span className="text-[11px] text-yellow-400 font-semibold block truncate">
                      {profession}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Företag / Arbetsgivare
                    </span>
                    <h4 className="text-sm font-bold text-slate-200 truncate">
                      {companyName}
                    </h4>
                    <span className="text-[10px] text-slate-400 block">
                      Registrerat bolag
                    </span>
                  </div>
                </div>

                {/* Masked ID06 Number Row */}
                <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">
                      ID06-Kortnummer
                    </span>
                    <span className="font-mono text-sm font-black text-yellow-300 tracking-widest">
                      {maskedId06}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Giltigt: 12/27
                    </span>
                    <button
                      onClick={handleCopyId06}
                      className="text-xs flex items-center gap-1 font-bold text-slate-300 hover:text-yellow-400 bg-slate-800 px-2 py-1 rounded-lg transition-colors"
                      title="Kopiera fullständigt ID06-nummer"
                    >
                      {copiedNumber ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD BOTTOM HINT */}
              <div className="relative z-10 mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                  <RotateCw className="w-3 h-3" />
                  Klicka på kortet för kassan
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  SEC-06-{lastFour}
                </span>
              </div>
            </div>

            {/* ======================================================== */}
            {/* BACK FACE (KASSALÄGE / HIGH CONTRAST QR & BARCODE)       */}
            {/* ======================================================== */}
            <div className="backface-hidden rotate-y-180 absolute inset-0 w-full h-full rounded-[28px] p-6 bg-white text-[#0F172A] shadow-2xl flex flex-col justify-between border-2 border-amber-400/80 overflow-hidden">
              {/* Back Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#0F172A] text-yellow-400 flex items-center justify-center font-black">
                    ID
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-[#0F172A] tracking-wider">
                      Kassaläge • Yrkeskortet
                    </h4>
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verifierad ID06-ansluten
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Klocka
                  </span>
                  <span className="font-mono text-sm font-black text-[#0F172A]">
                    {formattedTime}
                  </span>
                </div>
              </div>

              {/* Center QR Code (Maximal Clarity & Sharpness for Cashier Scanner) */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="p-2 bg-white rounded-2xl shadow-md border-2 border-slate-200">
                  <QRCodeDisplay
                    value={`https://yrkeskortet.se/verify/${cleanDigits}?t=${currentTime.getTime()}`}
                    size={160}
                  />
                </div>
                <span className="text-[11px] font-bold text-[#0F172A] mt-2 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-amber-500" />
                  Skanna QR i kassan för automatisk rabatt
                </span>
              </div>

              {/* Realistic Code-128 Barcode */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex flex-col items-center">
                <BarcodeDisplay
                  value={barcodeValue}
                  width={250}
                  height={44}
                />
              </div>

              {/* Back Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px] truncate max-w-[190px]">
                  {memberName} • {companyName}
                </span>
                <span className="flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                  <RotateCw className="w-3 h-3" />
                  Klicka för framsida
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK FLIP ACTION BUTTON & INSTRUCTIONS */}
      <div className="space-y-3">
        {/* Toggle Flip Button */}
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-full flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-yellow-400 font-black py-3.5 px-4 rounded-2xl shadow-lg shadow-slate-900/10 active:scale-98 transition-all text-xs"
        >
          <RotateCw className={`w-4 h-4 transition-transform duration-500 ${isFlipped ? 'rotate-180' : ''}`} />
          <span>
            {isFlipped
              ? 'Vänd tillbaka till kortets framsida'
              : 'Visa QR-kod & Streckkod för kassan (3D-vänd)'}
          </span>
        </button>

        {/* How to use info box */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Så visar du kortet i butik & restaurang
            </h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Visa framsidan med den tickande realtidsklockan och gröna ID06-badgen för kassapersonalen vid kassan, eller tryck på kortet för att vända fram QR- och streckkoden för direkt scanning med butikens scanner.
          </p>
          <button
            onClick={onNavigateToProfile}
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-[#0F172A] text-xs font-bold transition-colors border border-slate-200/80"
          >
            <span>Uppdatera namn, företag eller ID06-uppgifter</span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
          </button>
        </div>
      </div>
    </div>
  );
};
