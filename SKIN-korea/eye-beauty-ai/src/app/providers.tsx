'use client';

import { ReactNode } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { DiagnosisProvider } from '@/contexts/DiagnosisContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <DiagnosisProvider>{children}</DiagnosisProvider>
    </LanguageProvider>
  );
}
