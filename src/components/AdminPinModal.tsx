import React, { useState } from 'react';
import { Lock, X, ShieldAlert } from 'lucide-react';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '0606') {
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin === '0606') {
        setTimeout(() => {
          setPin('');
          onSuccess();
        }, 150);
      } else if (nextPin.length === 4) {
        setError(true);
        setTimeout(() => setPin(''), 600);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in text-[#0F172A]">
      <div className="relative w-full max-w-xs bg-white rounded-[28px] border border-slate-100 p-6 shadow-2xl text-center space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-[#0F172A] p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
          aria-label="Stäng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-extrabold text-[#0F172A]">
            Admin-inloggning
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ange administratörens PIN-kod
          </p>
        </div>

        {/* PIN Dots Display */}
        <div className="flex justify-center gap-3 py-2">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                  error
                    ? 'border-red-500 bg-red-500 animate-pulse'
                    : isFilled
                    ? 'border-amber-400 bg-amber-400 scale-110 shadow-sm shadow-amber-400/50'
                    : 'border-slate-300 bg-slate-100'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-[11px] font-bold text-red-600 flex items-center justify-center gap-1 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            Felaktig PIN-kod (tips: 0606)
          </p>
        )}

        {/* Numeric keypad for fast touch input */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Rensa', '0', 'OK'].map((item) => {
            if (item === 'Rensa') {
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPin('')}
                  className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
                >
                  C
                </button>
              );
            }
            if (item === 'OK') {
              return (
                <button
                  key={item}
                  type="button"
                  onClick={handleSubmit}
                  className="py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-extrabold transition-colors shadow-sm"
                >
                  OK
                </button>
              );
            }
            return (
              <button
                key={item}
                type="button"
                onClick={() => handleDigit(item)}
                className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#0F172A] font-mono text-base font-bold transition-all active:scale-95 border border-slate-200/60 shadow-sm"
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Hint text */}
        <p className="text-[10px] text-slate-400 pt-1">
          PIN-kod: <span className="text-[#0F172A] font-mono font-bold">0606</span>
        </p>
      </div>
    </div>
  );
};
