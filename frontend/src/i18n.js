import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: {
        dashboard: 'Dashboard',
        patients: 'Patients',
        doctors: 'Doctors',
        appointments: 'Appointments',
        billing: 'Billing',
        logout: 'Logout',
        collapse: 'Collapse',
        expand: 'Expand'
      },
      common: {
        language: 'Language',
        arabic: 'العربية',
        english: 'English'
      }
    }
  },
  ar: {
    translation: {
      nav: {
        dashboard: 'لوحة القيادة',
        patients: 'المرضى',
        doctors: 'الأطباء',
        appointments: 'المواعيد',
        billing: 'الفواتير',
        logout: 'تسجيل الخروج',
        collapse: 'تصغير',
        expand: 'توسيع'
      },
      common: {
        language: 'اللغة',
        arabic: 'العربية',
        english: 'English'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage']
    }
  });

// Handle RTL
i18n.on('languageChanged', (lng) => {
  document.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

// Initial set
document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = i18n.language;

export default i18n;
