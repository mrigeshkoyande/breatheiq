import React, { createContext, useContext, useEffect, useState } from 'react';
import { readStorage, writeStorage } from '../utils/storage';

export type SupportedLang = 'en' | 'hi' | 'mr';

export const TRANSLATIONS: Record<SupportedLang, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.airQuality': 'Air Quality',
    'nav.analytics': 'Inversion',
    'nav.assistant': 'Copilot',
    'nav.routine': 'Routine',
    'nav.home': 'Indoor & IAQ',
    'nav.family': 'Family',
    'nav.routes': 'CleanRoute',
    'nav.impact': 'Impact',
    'nav.community': 'Community',
    'nav.notifications': 'Alerts',
    'nav.settings': 'Settings',
    'nav.admin': 'Admin',
    'nav.signOut': 'Sign out',
    'dash.commandCenter': 'Family Atmospheric Command Center',
    'dash.corridorSelector': 'Active Monitoring Corridor',
    'dash.windowOracle': 'Window Oracle Verdict',
    'dash.todaysRoutine': "Today's Adaptive Routine",
    'dash.cleanRoute': 'CleanRoute Commute Comparison',
    'dash.impactSummary': 'Verified Exposure Mitigation',
    'dash.askCopilot': 'Ask Atmospheric Copilot',
    'dash.viewAll': 'Open full workspace',
    'dash.medicalDisclaimer': 'Public health guidance only — not medical advice.',
  },
  hi: {
    'nav.dashboard': 'डैशबोर्ड',
    'nav.airQuality': 'वायु गुणवत्ता',
    'nav.analytics': 'इन्वर्जन विश्लेषण',
    'nav.assistant': 'एआई सहायक',
    'nav.routine': 'दैनिक दिनचर्या',
    'nav.home': 'घर व वेंटिलेशन',
    'nav.family': 'परिवार सुरक्षा',
    'nav.routes': 'स्वच्छ मार्ग',
    'nav.impact': 'पर्यावरण प्रभाव',
    'nav.community': 'समुदाय रिपोर्ट',
    'nav.notifications': 'अलर्ट',
    'nav.settings': 'सेटिंग्स',
    'nav.admin': 'प्रशासन',
    'nav.signOut': 'लॉग आउट',
    'dash.commandCenter': 'परिवार वायु गुणवत्ता कमांड सेंटर',
    'dash.corridorSelector': 'सक्रिय निगरानी क्षेत्र',
    'dash.windowOracle': 'खिड़की खोलने का सही समय',
    'dash.todaysRoutine': 'आज की सुरक्षित दिनचर्या',
    'dash.cleanRoute': 'स्वच्छ यात्रा मार्ग तुलना',
    'dash.impactSummary': 'प्रभाव व उत्सर्जन बचत',
    'dash.askCopilot': 'सहायक से पूछें',
    'dash.viewAll': 'पूरा विवरण खोलें',
    'dash.medicalDisclaimer': 'केवल जन-स्वास्थ्य मार्गदर्शन — चिकित्सा सलाह नहीं।',
  },
  mr: {
    'nav.dashboard': 'डॅशबोर्ड',
    'nav.airQuality': 'हवा गुणवत्ता',
    'nav.analytics': 'इन्व्हर्जन कल',
    'nav.assistant': 'एआय सहाय्यक',
    'nav.routine': 'दैनिक दिनचर्या',
    'nav.home': 'घर व हवा शुद्धता',
    'nav.family': 'कुटुंब सुरक्षा',
    'nav.routes': 'स्वच्छ प्रवास',
    'nav.impact': 'प्रभाव नोंद',
    'nav.community': 'समुदाय अहवाल',
    'nav.notifications': 'सूचना',
    'nav.settings': 'सेटिंग्ज',
    'nav.admin': 'प्रशासन',
    'nav.signOut': 'साइन आउट',
    'dash.commandCenter': 'कुटुंब हवा गुणवत्ता नियंत्रण केंद्र',
    'dash.corridorSelector': 'सक्रिय निरीक्षण क्षेत्र',
    'dash.windowOracle': 'खिडकी उघडण्याची योग्य वेळ',
    'dash.todaysRoutine': 'आजची सुरक्षित दिनचर्या',
    'dash.cleanRoute': 'स्वच्छ प्रवास मार्ग तुलना',
    'dash.impactSummary': 'प्रभाव आणि बचत',
    'dash.askCopilot': 'सहाय्यकाला विचारा',
    'dash.viewAll': 'संपूर्ण विभाग उघडा',
    'dash.medicalDisclaimer': 'केवळ सार्वजनिक आरोग्य मार्गदर्शन — वैद्यकीय सल्ला नाही.',
  },
};

interface LanguageContextValue {
  lang: SupportedLang;
  setLang: (lang: SupportedLang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);
const LANG_STORAGE_KEY = 'breatheiq_lang';

function readStoredLanguage(): SupportedLang {
  const saved = readStorage(LANG_STORAGE_KEY);
  return saved === 'en' || saved === 'hi' || saved === 'mr' ? saved : 'en';
}

function writeStoredLanguage(lang: SupportedLang): void {
  writeStorage(LANG_STORAGE_KEY, lang);
}

/** Provides localized UI copy (EN/HI/MR) and syncs `<html lang>`. */
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<SupportedLang>(readStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: SupportedLang): void => {
    setLangState(next);
    writeStoredLanguage(next);
  };

  const t = (key: string): string => TRANSLATIONS[lang][key] ?? TRANSLATIONS.en[key] ?? key;

  return React.createElement(LanguageContext.Provider, { value: { lang, setLang, t } }, children);
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: 'en',
      setLang: () => undefined,
      t: (key: string) => TRANSLATIONS.en[key] ?? key,
    };
  }
  return ctx;
};
