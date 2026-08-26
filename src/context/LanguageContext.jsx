import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Brand & Navigation
    'brand.name': 'Careerly',
    'brand.tagline': 'Autonomous Opportunity Intelligence & Career Accelerator',
    'nav.dashboard': 'Dashboard',
    'nav.opportunities': 'Opportunities',
    'nav.discover': 'Discover',
    'nav.applications': 'Applications',
    'nav.saved': 'Saved',
    'nav.cv_studio': 'CV Studio',
    'nav.interview_coach': 'Interview Coach',
    'nav.calendar': 'Calendar',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.admin': 'Admin Intelligence',
    'nav.signin': 'Sign In',
    'nav.signup': 'Get Started',
    'nav.logout': 'Log Out',

    // Dashboard & Metrics
    'dashboard.welcome': 'Welcome back,',
    'dashboard.subtitle': 'Here is your personalized opportunity discovery pipeline.',
    'dashboard.stat_total_opps': 'Verified Opportunities',
    'dashboard.stat_active_apps': 'Active Applications',
    'dashboard.stat_readiness': 'Readiness Score',
    'dashboard.stat_saved': 'Saved Opportunities',
    'dashboard.search_placeholder': 'Search by role, company, skills (e.g. React, Marketing Intern)...',
    'dashboard.all_types': 'All Types',
    'dashboard.jobs': 'Jobs',
    'dashboard.internships': 'Internships',
    'dashboard.scholarships': 'Scholarships',
    'dashboard.fellowships': 'Fellowships',
    'dashboard.view_details': 'View Details',
    'dashboard.apply_portal': 'Apply on Official Portal',
    'dashboard.save_crm': 'Save to CRM',
    'dashboard.saved_crm': 'Saved in CRM',
    'dashboard.email_recruiter': 'Email Recruiter',

    // Discovery & Search
    'discovery.title': 'Discover Career Opportunities',
    'discovery.subtitle': 'Verified listings curated from official university and corporate ATS repositories.',
    'discovery.filter_type': 'Opportunity Type',
    'discovery.filter_location': 'Location',
    'discovery.filter_field': 'Discipline / Field',
    'discovery.no_results': 'No opportunities found matching your criteria.',
    'discovery.results_found': 'opportunities found',

    // Application Assistant & Drawers
    'drawer.overview': 'Overview',
    'drawer.benefits': 'Compensation & Benefits',
    'drawer.eligibility': 'Eligibility & Criteria',
    'drawer.evidence': 'Evidence & Provenance',
    'drawer.app_kit': 'AI Application Kit',
    'drawer.readiness_tab': 'Readiness & Research',
    'drawer.cover_letter_tab': 'Tailored Cover Letter',
    'drawer.cv_bullets_tab': 'CV Bullet Suggestions',
    'drawer.checklist_tab': 'Application Checklist',
    'drawer.launch_portal': 'Launch Official Portal & Paste Dossier',
    'drawer.email_directly': 'Email Recruiter Directly',
    'drawer.copy_letter': 'Copy Letter',
    'drawer.copied': 'Copied!',

    // Common Buttons & Actions
    'btn.save': 'Save',
    'btn.cancel': 'Cancel',
    'btn.close': 'Close',
    'btn.previous': 'Previous',
    'btn.next': 'Next',
    'btn.search': 'Search',
    'btn.filter': 'Filter',
    'btn.loading': 'Loading...',
    'btn.verified_active': 'Verified Active',

    // Landing Page
    'landing.hero_title': 'Launch Your Global Career with AI Intelligence',
    'landing.hero_sub': 'Discover verified internships, scholarships, and careers with automated ATS tailoring and interview coaching.',
    'landing.cta_primary': 'Find Opportunities Now',
    'landing.cta_secondary': 'Explore Features',

    // Language
    'lang.english': 'English',
    'lang.arabic': 'العربية'
  },
  ar: {
    // Brand & Navigation
    'brand.name': 'كاريرلي',
    'brand.tagline': 'منظومة استكشاف الفرص العالمية وتسريع المسار المهني',
    'nav.dashboard': 'لوحة التحكم',
    'nav.opportunities': 'الفرص المتاحة',
    'nav.discover': 'استكشاف',
    'nav.applications': 'التقديمات',
    'nav.saved': 'المحفوظات',
    'nav.cv_studio': 'استوديو السيرة الذاتية',
    'nav.interview_coach': 'مدرب المقابلات',
    'nav.calendar': 'التقويم',
    'nav.profile': 'الملف الشخصي',
    'nav.settings': 'الإعدادات',
    'nav.admin': 'لوحة الإدارة الذكية',
    'nav.signin': 'تسجيل الدخول',
    'nav.signup': 'ابدأ الآن مجاناً',
    'nav.logout': 'تسجيل الخروج',

    // Dashboard & Metrics
    'dashboard.welcome': 'مرحباً بك مجدداً،',
    'dashboard.subtitle': 'إليك مسار استكشاف الفرص المخصص لملفك المهني.',
    'dashboard.stat_total_opps': 'فرصة موثقة',
    'dashboard.stat_active_apps': 'تقديمات نشطة',
    'dashboard.stat_readiness': 'معدل الجاهزية',
    'dashboard.stat_saved': 'الفرص المحفوظة',
    'dashboard.search_placeholder': 'ابحث بالمسمى الوظيفي، الشركة، المهارات (مثل React، تدريب تسويق)...',
    'dashboard.all_types': 'جميع الأنواع',
    'dashboard.jobs': 'وظائف',
    'dashboard.internships': 'تدريب مهني',
    'dashboard.scholarships': 'منح دراسية',
    'dashboard.fellowships': 'زمالات بحثية',
    'dashboard.view_details': 'عرض التفاصيل',
    'dashboard.apply_portal': 'التقديم عبر البوابة الرسمية',
    'dashboard.save_crm': 'حفظ الفرصة',
    'dashboard.saved_crm': 'تم الحفظ في المحفظة',
    'dashboard.email_recruiter': 'مراسلة مسؤول التوظيف',

    // Discovery & Search
    'discovery.title': 'استكشف الفرص المهنية والأكاديمية',
    'discovery.subtitle': 'فرص موثقة تم جمعها مباشرة من الجامعات العالمية وأنظمة التوظيف الرسمية.',
    'discovery.filter_type': 'نوع الفرصة',
    'discovery.filter_location': 'الموقع الجغرافي',
    'discovery.filter_field': 'التخصص والمجال',
    'discovery.no_results': 'لم يتم العثور على فرص تطابق معايير البحث.',
    'discovery.results_found': 'فرص متاحة',

    // Application Assistant & Drawers
    'drawer.overview': 'نظرة عامة',
    'drawer.benefits': 'المكافأة والمزايا',
    'drawer.eligibility': 'شروط الأهلية والقبول',
    'drawer.evidence': 'التوثيق ومصدر البيانات',
    'drawer.app_kit': 'حقيبة التقديم الذكية',
    'drawer.readiness_tab': 'الجاهزية والتحليل',
    'drawer.cover_letter_tab': 'خطاب التقديم المخصص',
    'drawer.cv_bullets_tab': 'نقاط السيرة الذاتية المقترحة',
    'drawer.checklist_tab': 'قائمة التحقق قبل الإرسال',
    'drawer.launch_portal': 'فتح البوابة الرسمية ونقل البيانات',
    'drawer.email_directly': 'مراسلة مسؤول التوظيف مباشرة',
    'drawer.copy_letter': 'نسخ الخطاب',
    'drawer.copied': 'تم النسخ بنجاح!',

    // Common Buttons & Actions
    'btn.save': 'حفظ',
    'btn.cancel': 'إلغاء',
    'btn.close': 'إغلاق',
    'btn.previous': 'السابق',
    'btn.next': 'التالي',
    'btn.search': 'بحث',
    'btn.filter': 'تصفية',
    'btn.loading': 'جاري التحميل...',
    'btn.verified_active': 'موثق ونشط',

    // Landing Page
    'landing.hero_title': 'انطلق في مسارك المهني العالمي بالذكاء الاصطناعي',
    'landing.hero_sub': 'اكتشف فرص التدريب والوظائف والمنح الدراسية الموثقة مع مواءمة السيرة الذاتية والتدريب على المقابلات.',
    'landing.cta_primary': 'استكشف الفرص الآن',
    'landing.cta_secondary': 'تعرف على المميزات',

    // Language
    'lang.english': 'English',
    'lang.arabic': 'العربية'
  }
};

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  isRtl: false,
  t: (key, fallback) => fallback || key
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('careerly_lang') || 'en';
  });

  const isRtl = language === 'ar';

  const setLanguage = (lang) => {
    const target = lang === 'ar' ? 'ar' : 'en';
    setLanguageState(target);
    localStorage.setItem('careerly_lang', target);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    if (isRtl) {
      document.body.classList.add('rtl-mode');
    } else {
      document.body.classList.remove('rtl-mode');
    }
  }, [language, isRtl]);

  const t = (key, fallback) => {
    const langDict = translations[language] || translations.en;
    if (langDict[key] !== undefined) {
      return langDict[key];
    }
    if (translations.en[key] !== undefined) {
      return translations.en[key];
    }
    return fallback !== undefined ? fallback : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, isRtl, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export default LanguageContext;
