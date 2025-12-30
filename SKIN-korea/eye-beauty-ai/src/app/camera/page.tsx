'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDiagnosis } from '@/contexts/DiagnosisContext';
import BackButton from '@/components/ui/BackButton';
import CameraView from '@/components/camera/CameraView';
import QuestionnaireModal, { QuestionnaireData } from '@/components/camera/QuestionnaireModal';
import Modal from '@/components/ui/Modal';
import { ROUTES } from '@/lib/constants';
import { EyePositions } from '@/types/diagnosis';

export default function CameraPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { setCapturedImage, setQuestionnaireData } = useDiagnosis();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(true);
  const [captureMode, setCaptureMode] = useState<'single' | 'expression'>('expression');

  const handleCapture = useCallback((result: { imageData: string; width: number; height: number; eyePositions?: EyePositions }) => {
    setCapturedImage(
      result.imageData,
      { width: result.width, height: result.height },
      result.eyePositions
    );
    router.push(ROUTES.ANALYZING);
  }, [setCapturedImage, router]);

  const handleExpressionCapture = useCallback((neutral: any, smile: any) => {
    // Store both captures for expression analysis
    setCapturedImage(
      neutral.imageData,
      { width: neutral.width, height: neutral.height },
      neutral.eyePositions,
      smile.imageData
    );
    router.push(ROUTES.ANALYZING);
  }, [setCapturedImage, router]);

  const handleError = useCallback((error: string | null) => {
    setErrorMessage(error);
  }, []);

  const handleQuestionnaireComplete = useCallback((data: QuestionnaireData) => {
    setQuestionnaireData(data);
    setShowQuestionnaire(false);
  }, [setQuestionnaireData]);

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
        {!showQuestionnaire && (
          <CameraView 
            onCapture={handleCapture} 
            onError={handleError}
            captureMode={captureMode}
            onExpressionCapture={handleExpressionCapture}
          />
        )}
      </div>

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

      {/* Questionnaire Modal */}
      <QuestionnaireModal
        isOpen={showQuestionnaire}
        onComplete={handleQuestionnaireComplete}
      />
    </main>
  );
}
