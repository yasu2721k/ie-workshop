'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDiagnosis } from '@/contexts/DiagnosisContext';
import BackButton from '@/components/ui/BackButton';
import CameraView from '@/components/camera/CameraView';
import DebugButtons from '@/components/camera/DebugButtons';
import Modal from '@/components/ui/Modal';
import { ROUTES } from '@/lib/constants';

export default function CameraPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { setCapturedImage, setForceType } = useDiagnosis();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCapture = useCallback((result: { imageData: string; width: number; height: number }) => {
    setCapturedImage(result.imageData, { width: result.width, height: result.height });
    router.push(ROUTES.ANALYZING);
  }, [setCapturedImage, router]);

  const handleError = useCallback((error: string | null) => {
    setErrorMessage(error);
  }, []);

  const handleDebugCapture = useCallback((type: 'dark_circles' | 'wrinkles') => {
    // Create a placeholder image for debug mode
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#fce7f3');
      gradient.addColorStop(1, '#e9d5ff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add debug text
      ctx.fillStyle = '#6b7280';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Debug: ${type}`, canvas.width / 2, canvas.height / 2);
    }

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setForceType(type);
    setCapturedImage(imageData, { width: canvas.width, height: canvas.height });
    router.push(ROUTES.ANALYZING);
  }, [setCapturedImage, setForceType, router]);

  return (
    <main className="min-h-screen flex flex-col bg-[#1A1A1A]">
      {/* Header */}
      <header className="p-4 flex items-center">
        <BackButton href={ROUTES.HOME} className="text-white" />
      </header>

      {/* Instruction */}
      <div className="px-4 py-2 text-center">
        <p className="text-white/90 text-lg font-light tracking-wide">
          {t('camera.instruction')}
        </p>
      </div>

      {/* Camera View */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <CameraView onCapture={handleCapture} onError={handleError} />
      </div>

      {/* Debug Buttons */}
      <DebugButtons onDebugCapture={handleDebugCapture} />

      {/* Error Modal */}
      <Modal
        isOpen={!!errorMessage}
        onClose={() => setErrorMessage(null)}
        title={t('camera.errorTitle')}
      >
        <p className="text-[#6B6B6B] mb-4">{errorMessage}</p>
        <button
          onClick={() => setErrorMessage(null)}
          className="w-full py-3 bg-[#2C2C2C] text-white rounded-xl font-medium hover:bg-[#3D3D3D] transition-colors"
        >
          {t('common.close')}
        </button>
      </Modal>
    </main>
  );
}
