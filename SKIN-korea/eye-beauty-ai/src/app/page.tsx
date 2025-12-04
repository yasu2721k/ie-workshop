'use client';

import Hero from '@/components/landing/Hero';
import LanguageToggle from '@/components/landing/LanguageToggle';

export default function Home() {
  return (
    <main className="relative">
      <LanguageToggle />
      <Hero />
    </main>
  );
}
