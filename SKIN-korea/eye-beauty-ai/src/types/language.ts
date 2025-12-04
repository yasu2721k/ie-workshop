export type Language = 'ja' | 'ko';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export interface TranslationData {
  [key: string]: string | TranslationData;
}
