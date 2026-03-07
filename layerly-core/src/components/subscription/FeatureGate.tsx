'use client';

import { Loader2, Lock } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from './UpgradeModal';

interface FeatureGateProps {
  children: ReactNode;
  feature?: 'pdfExport' | 'clientManagement' | 'ordersAccess' | 'advancedAnalytics';
  fallback?: ReactNode;
  mode?: 'hide' | 'blur' | 'lock';
}

export function FeatureGate({ children, feature, fallback, mode = 'lock' }: FeatureGateProps) {
  const { features, isPending } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (isPending) {
    return (
      <div className="w-full h-32 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/50">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mb-2" />
        <span className="text-xs font-bold text-slate-500">Loading...</span>
      </div>
    );
  }

  const isAllowed = feature ? features[feature] : true;

  if (isAllowed) {
    return <>{children}</>;
  }

  if (mode === 'hide') {
    return null;
  }

  const handleUnlockClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowUpgradeModal(true);
  };

  return (
    <>
      <button
        type="button"
        className="relative group cursor-pointer w-full text-left"
        onClick={handleUnlockClick}
      >
        {mode === 'blur' && (
          <div className="relative">
            <div className="blur-sm select-none pointer-events-none opacity-50">{children}</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-slate-900/80 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium shadow-xl backdrop-blur-sm transition-transform group-hover:scale-105">
                <Lock className="w-4 h-4" />
                <span>Unlock feature</span>
              </div>
            </div>
          </div>
        )}

        {mode === 'lock' &&
          (fallback || (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors text-slate-400">
                <Lock className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                Feature locked
              </p>
              <span className="text-xs text-blue-600 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Click to unlock
              </span>
            </div>
          ))}
      </button>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title={feature === 'pdfExport' ? 'Export Professional Reports' : undefined}
        description={feature === 'pdfExport' ? 'Generate beautiful PDFs for your clients and build a professional image with the PRO plan.' : undefined}
      />
    </>
  );
}
