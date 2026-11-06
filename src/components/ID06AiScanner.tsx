import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  ArrowRight, 
  Lock, 
  Upload,
  CreditCard,
  FileQuestion,
  UserCheck
} from 'lucide-react';
import { Profile } from '../types';
import { verifyID06WithGemini, ID06VerificationResult } from '../lib/gemini';
import { supabase } from '../lib/supabase';

interface ID06AiScannerProps {
  profile: Profile | null;
  onVerificationComplete: (updatedProfile: Profile) => void;
  onNavigateToCard: () => void;
}

export const ID06AiScanner: React.FC<ID06AiScannerProps> = ({
  profile,
  onVerificationComplete,
  onNavigateToCard,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [result, setResult] = useState<ID06VerificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process chosen image
  const processImage = async (base64String: string, mimeType: string) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setResult(null);
    setSuccess(false);
    setAnalyzingStep('AI ansluter till Gemini Vision...');

    const stepTimer1 = setTimeout(() => {
      setAnalyzingStep('Identifierar ID06-logotyp och säkerhetselement...');
    }, 900);

    const stepTimer2 = setTimeout(() => {
      setAnalyzingStep('Läser av namn, företag, kortnummer och giltighetstid...');
    }, 2200);

    try {
      const res = await verifyID06WithGemini(base64String, mimeType);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setResult(res);

      if (res.is_valid_id06 && !res.is_expired) {
        setSuccess(true);
        setAnalyzingStep('Verifiering godkänd!');

        const updatedProfile: Profile = {
          id: profile?.id || 'demo-user-id06',
          full_name: res.full_name || profile?.full_name || 'Verifierad Medlem',
          company_name: res.company_name || profile?.company_name || 'Registrerat Företag',
          id06_number: res.id06_number || profile?.id06_number || '9820 4410 8821',
          profession: profile?.profession || 'Certifierad Yrkesutövare',
          id06_status: 'verified',
        };

        // Save to Supabase profiles if session exists
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
          console.warn('Could not save to Supabase, continuing locally:', dbErr);
        }

        // Update local app state
        onVerificationComplete(updatedProfile);
      } else {
        setSuccess(false);
        setErrorMsg(res.reason || 'Kortet kunde inte godkännas som ett giltigt ID06-kort.');
      }
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      console.error('AI verification failed:', err);
      setErrorMsg(err.message || 'Ett fel uppstod under AI-granskningen. Försök igen.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle native file input (Camera or Gallery)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      processImage(base64, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  // Helper: Generate a synthetic canvas ID06 card for instant 1-click desktop testing
  const handleSampleTest = (valid: boolean) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (valid) {
      // Draw realistic Swedish ID06 Card
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 640, 400);

      // Top security strip with Swedish flag colors / yellow
      ctx.fillStyle = '#005293';
      ctx.fillRect(0, 0, 640, 70);
      ctx.fillStyle = '#FECB00';
      ctx.fillRect(0, 65, 640, 8);

      // ID06 Logo
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('ID06', 30, 48);

      ctx.font = '14px sans-serif';
      ctx.fillText('Sveriges Bygg- och Yrkeslegitimation', 140, 45);

      // Photo placeholder
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(40, 110, 130, 170);
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.arc(105, 170, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(105, 270, 55, Math.PI, 0);
      ctx.fill();

      // Smart chip
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(200, 115, 60, 45);
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(200, 115, 60, 45);

      // Cardholder Information Text
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('ERIK LINDSTRÖM', 200, 195);

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('FÖRETAG / ARBETSGIVARE:', 200, 225);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('SVEA BYGGTEAM AB', 200, 248);

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('KORTNUMMER: 9820 4410 8821', 200, 280);

      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('GILTIGT T.O.M: 2027-12-31 (AKTIVT)', 200, 305);

      // Bottom Bar
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 340, 640, 60);
      ctx.strokeStyle = '#E2E8F0';
      ctx.strokeRect(0, 340, 640, 60);
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('OFFICIELLT ID06-KORT • EMV CHIP & NFC', 30, 375);
    } else {
      // Draw unrelated image (e.g. coffee cup / random object)
      ctx.fillStyle = '#FFF7ED';
      ctx.fillRect(0, 0, 640, 400);
      ctx.fillStyle = '#EA580C';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('Kaffekopp & Skrivbord', 180, 200);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#9A3412';
      ctx.fillText('(Inte ett svenskt ID06-kort)', 200, 240);
    }

    const dataUrl = canvas.toDataURL('image/png');
    setPreviewImage(dataUrl);
    processImage(dataUrl, 'image/png');
  };

  // Submit for manual review to Admin Panel if auto verification fails
  const handleSendToManualReview = async () => {
    const updatedProfile: Profile = {
      id: profile?.id || 'demo-user-id06',
      full_name: profile?.full_name || 'Ansöker om ID06',
      company_name: profile?.company_name || 'Väntar på granskning',
      id06_number: profile?.id06_number || '9820 0000 0000',
      profession: profile?.profession || 'Hantverkare',
      id06_status: 'pending',
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('profiles').upsert({
          id: session.user.id,
          full_name: updatedProfile.full_name,
          company_name: updatedProfile.company_name,
          id06_number: updatedProfile.id06_number,
          id06_status: 'pending',
        });
      }
    } catch (e) {
      console.warn(e);
    }

    onVerificationComplete(updatedProfile);
    alert('Ditt ID06-kort har skickats in för manuell granskning till administratören. Du meddelas när det är godkänt!');
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-4">
      {/* Hidden native input */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header section */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            AI-verifiering med Gemini Vision
          </span>
          <h3 className="text-base font-black text-[#0F172A] tracking-tight">
            Verifiera ditt ID06 på 5 sekunder
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Fota ditt fysiska ID06-kort. Vår AI läser av namn, företag och kortnummer och aktiverar dina rabatter direkt.
          </p>
        </div>

        <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
          <Camera className="w-5 h-5 text-amber-500" />
        </div>
      </div>

      {/* Preview and Laser Scanning Animation */}
      {previewImage && (
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-400/50 max-h-56 shadow-md flex items-center justify-center">
          <img
            src={previewImage}
            alt="Förhandsgranskning ID06"
            className="w-full h-full object-contain"
          />

          {/* Animated Laser Scanning Beam */}
          {isAnalyzing && (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#FACC15] animate-pulse" />
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10B981] animate-pulse" />
            </div>
          )}
        </div>
      )}

      {/* Loading state indicator */}
      {isAnalyzing && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-center space-y-2 animate-fade-in">
          <div className="flex items-center justify-center gap-2 text-amber-800 font-extrabold text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span>AI granskar ditt ID06-kort...</span>
          </div>
          <p className="text-[11px] text-amber-700 font-medium animate-pulse">
            {analyzingStep}
          </p>
        </div>
      )}

      {/* Success banner */}
      {success && result && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Ditt ID06 är verifierat!</span>
          </div>

          <div className="bg-white rounded-xl p-3 border border-emerald-100 text-xs space-y-1.5 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Namn på kortet:</span>
              <strong className="text-[#0F172A]">{result.full_name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Företag:</span>
              <strong className="text-[#0F172A]">{result.company_name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">ID06-Kortnummer:</span>
              <strong className="font-mono text-amber-700">{result.id06_number}</strong>
            </div>
            {result.expiry_date && (
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Giltighetstid:</span>
                <span className="text-emerald-700 font-semibold">{result.expiry_date}</span>
              </div>
            )}
          </div>

          <button
            onClick={onNavigateToCard}
            className="w-full flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-yellow-400 font-black py-2.5 px-4 rounded-xl shadow-md text-xs transition-colors"
          >
            <span>Öppna mitt uppdaterade Yrkeskort</span>
            <ArrowRight className="w-4 h-4 text-yellow-400" />
          </button>
        </div>
      )}

      {/* Error / Rejection Banner */}
      {!isAnalyzing && errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3 animate-fade-in text-xs">
          <div className="flex items-start gap-2 text-red-800 font-bold">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold">Kunde inte verifiera kortet</p>
              <p className="text-[11px] text-red-700 mt-0.5">{errorMsg}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ta ny bild</span>
            </button>

            <button
              onClick={handleSendToManualReview}
              className="flex-1 py-2 px-3 rounded-xl bg-white border border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs transition-colors"
            >
              Skicka för manuell granskning
            </button>
          </div>
        </div>
      )}

      {/* Main Action Button */}
      {!isAnalyzing && (
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black py-3.5 px-4 rounded-2xl shadow-lg shadow-yellow-500/20 active:scale-98 transition-all text-sm"
          >
            <Camera className="w-5 h-5 stroke-[2.4]" />
            <span>Fota eller välj bild på ditt ID06-kort</span>
          </button>

          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1 font-medium">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Bilden analyseras direkt av vår AI och sparas aldrig</span>
          </p>

          {/* Quick Sample Presets (For fast testing on desktop without a camera) */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold">Testa direkt i datorn:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSampleTest(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-bold transition-colors"
                title="Genererar ett exempel-ID06 och analyserar det i realtid med Gemini"
              >
                ✨ Testa med ID06
              </button>
              <button
                type="button"
                onClick={() => handleSampleTest(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium transition-colors"
                title="Testar en ogiltig bild för att se avvisning och felmeddelande"
              >
                Testa ogiltig
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
