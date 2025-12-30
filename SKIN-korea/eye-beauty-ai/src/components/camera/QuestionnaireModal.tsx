'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export interface QuestionnaireData {
  sleepHours: number;
  eyeFatigue: 'low' | 'medium' | 'high';
  coldSensitivity: boolean;
  stressLevel: 'low' | 'medium' | 'high';
}

interface QuestionnaireModalProps {
  isOpen: boolean;
  onComplete: (data: QuestionnaireData) => void;
}

export default function QuestionnaireModal({ isOpen, onComplete }: QuestionnaireModalProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireData>({
    sleepHours: 7,
    eyeFatigue: 'medium',
    coldSensitivity: false,
    stressLevel: 'medium',
  });

  const questions = [
    {
      id: 'sleepHours',
      type: 'slider',
      min: 3,
      max: 10,
      step: 0.5,
    },
    {
      id: 'eyeFatigue',
      type: 'select',
      options: ['low', 'medium', 'high'],
    },
    {
      id: 'coldSensitivity',
      type: 'boolean',
    },
    {
      id: 'stressLevel',
      type: 'select',
      options: ['low', 'medium', 'high'],
    },
  ];

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(answers);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderQuestion = () => {
    const question = questions[currentStep];

    switch (question.type) {
      case 'slider':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">
              {t(`questionnaire.${question.id}.question`)}
            </h3>
            <div className="px-4">
              <input
                type="range"
                min={question.min}
                max={question.max}
                step={question.step}
                value={answers.sleepHours}
                onChange={(e) => setAnswers({ ...answers, sleepHours: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span>{question.min}h</span>
                <span className="font-medium text-lg text-[#2C2C2C]">{answers.sleepHours}h</span>
                <span>{question.max}h</span>
              </div>
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">
              {t(`questionnaire.${question.id}.question`)}
            </h3>
            <div className="grid gap-3">
              {question.options?.map((option) => (
                <button
                  key={option}
                  onClick={() => setAnswers({ ...answers, [question.id]: option })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    answers[question.id as keyof QuestionnaireData] === option
                      ? 'border-[#2C2C2C] bg-[#F5F3EF]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-2xl mb-1">
                    {question.id === 'eyeFatigue' && (option === 'low' ? '😊' : option === 'medium' ? '😐' : '😫')}
                    {question.id === 'stressLevel' && (option === 'low' ? '😌' : option === 'medium' ? '😟' : '😰')}
                  </span>
                  <span className="text-sm">{t(`questionnaire.${question.id}.${option}`)}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'boolean':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">
              {t(`questionnaire.${question.id}.question`)}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAnswers({ ...answers, coldSensitivity: true })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  answers.coldSensitivity
                    ? 'border-[#2C2C2C] bg-[#F5F3EF]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="block text-2xl mb-1">🥶</span>
                <span className="text-sm">{t('questionnaire.yes')}</span>
              </button>
              <button
                onClick={() => setAnswers({ ...answers, coldSensitivity: false })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  !answers.coldSensitivity
                    ? 'border-[#2C2C2C] bg-[#F5F3EF]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="block text-2xl mb-1">😊</span>
                <span className="text-sm">{t('questionnaire.no')}</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
          >
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-medium text-gray-800">
                  {t('questionnaire.title')}
                </h2>
                <span className="text-sm text-gray-600">
                  {currentStep + 1} / {questions.length}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#2C2C2C]"
                  animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="mb-8">
              {renderQuestion()}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  {t('questionnaire.previous')}
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-[#2C2C2C] text-white rounded-xl font-medium hover:bg-[#3D3D3D] transition-colors"
              >
                {currentStep < questions.length - 1
                  ? t('questionnaire.next')
                  : t('questionnaire.complete')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}