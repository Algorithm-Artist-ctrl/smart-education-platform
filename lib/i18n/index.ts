// lib/i18n/index.ts
export type Language = 'en' | 'hi';

export const translations = {
  en: {
    // Navigation & Common
    appName: 'Smart Edu',
    studentDashboard: 'Student Dashboard',
    teacherDashboard: 'Teacher Dashboard',
    parentDashboard: 'Parent Dashboard',
    adminDashboard: 'Admin Dashboard',
    superAdminDashboard: 'Super Admin Dashboard',
    login: 'Log In',
    register: 'Sign Up',
    logout: 'Log Out',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    loading: 'Loading...',
    emptyState: 'No data available yet.',
    viewAll: 'View All',
    back: 'Back',

    // Student Dashboard
    welcomeBack: 'Welcome back',
    todaysPlan: "Today's Study Plan",
    activeCourses: 'My Subjects',
    weakTopics: 'Focus Areas (Weak Topics)',
    weakTopicsDesc: 'Topics that need a quick revision based on your quiz attempts.',
    recentActivity: 'Recent Activity',
    studyStreak: 'Day Streak',
    totalPoints: 'XP Points',
    studentLevel: 'Level',
    continueLearning: 'Continue Learning',
    noStudyPlanToday: 'No study plan scheduled for today. Great job or create a new session!',
    noWeakTopics: 'Awesome! No weak topics detected yet. Keep up the high accuracy!',
    startAssessment: 'Start Diagnostic Assessment',
    takeQuiz: 'Take Practice Quiz',
    reviseNow: 'Revise Topic',

    // Assessment & Quiz
    question: 'Question',
    of: 'of',
    submitAnswer: 'Submit Answer',
    nextQuestion: 'Next Question',
    finishAssessment: 'Finish Assessment',
    score: 'Your Score',
    accuracy: 'Accuracy',
    explanation: 'Explanation',
    passed: 'Mastery Achieved!',
    needsRevision: 'Added to your Weak Topics for Revision',

    // Teacher
    assignedClasses: 'Assigned Classes',
    createAssignment: 'Create Assignment',
    uploadContent: 'Upload Learning Material',
    gradeSubmissions: 'Grade Submissions',

    // Parent
    childProgress: "Child's Learning Progress",
    childAttendance: 'Attendance Overview',
    childWeakAreas: 'Areas Needing Attention',

    // Applied Learning & Accessibility
    creativityLab: 'Creativity Lab',
    lifeMissions: 'Life Missions',
    portfolio: 'Learning Portfolio',
    accessibility: 'Accessibility & Support',
    focusMode: 'Focus Mode',
    readAloud: 'Read Aloud',
    dyslexiaFont: 'Dyslexia Friendly Font',
    liteMode: 'Lite Mode',

    // Offline / Sync
    offlineNotice: 'You are currently offline. Actions will be saved and synced automatically.',
    onlineNotice: 'Back online! Synced with Supabase.',
  },
  hi: {
    // Navigation & Common
    appName: 'स्मार्ट एडु',
    studentDashboard: 'विद्यार्थी डैशबोर्ड',
    teacherDashboard: 'शिक्षक डैशबोर्ड',
    parentDashboard: 'अभिभावक डैशबोर्ड',
    adminDashboard: 'प्रशासक डैशबोर्ड',
    superAdminDashboard: 'सुपर व्यवस्थापक',
    login: 'लॉग इन करें',
    register: 'साइन अप करें',
    logout: 'लॉग आउट',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    submit: 'जमा करें',
    loading: 'लोड हो रहा है...',
    emptyState: 'कोई डेटा उपलब्ध नहीं है।',
    viewAll: 'सभी देखें',
    back: 'वापस जाएं',

    // Student Dashboard
    welcomeBack: 'वापसी पर स्वागत है',
    todaysPlan: 'आज की अध्ययन योजना',
    activeCourses: 'मेरे विषय',
    weakTopics: 'सुधार के क्षेत्र (कमजोर विषय)',
    weakTopicsDesc: 'क्विज प्रदर्शन के आधार पर इन विषयों का पुनरीक्षण आवश्यक है।',
    recentActivity: 'हालिया गतिविधि',
    studyStreak: 'दैनिक स्ट्रीक',
    totalPoints: 'अंक (XP)',
    studentLevel: 'स्तर',
    continueLearning: 'पढ़ाई जारी रखें',
    noStudyPlanToday: 'आज के लिए कोई अध्ययन योजना नहीं है। आप नया सत्र जोड़ सकते हैं!',
    noWeakTopics: 'शानदार! अभी तक कोई कमजोर विषय नहीं मिला है।',
    startAssessment: 'प्रारंभिक मूल्यांकन शुरू करें',
    takeQuiz: 'अभ्यास क्विज़ दें',
    reviseNow: 'विषय दोहराएं',

    // Assessment & Quiz
    question: 'प्रश्न',
    of: 'का',
    submitAnswer: 'उत्तर जमा करें',
    nextQuestion: 'अगला प्रश्न',
    finishAssessment: 'मूल्यांकन समाप्त करें',
    score: 'आपका स्कोर',
    accuracy: 'सटीकता',
    explanation: 'व्याख्या',
    passed: 'सफलतापूर्वक उत्तीर्ण!',
    needsRevision: 'पुनरीक्षण के लिए कमजोर विषयों में जोड़ा गया',

    // Teacher
    assignedClasses: 'आवंटित कक्षाएं',
    createAssignment: 'नया असाइनमेंट बनाएं',
    uploadContent: 'अध्ययन सामग्री अपलोड करें',
    gradeSubmissions: 'उत्तर पुस्तिकाओं का मूल्यांकन करें',

    // Parent
    childProgress: 'बच्चे की सीखने की प्रगति',
    childAttendance: 'उपस्थिति विवरण',
    childWeakAreas: 'जिन क्षेत्रों में ध्यान देने की आवश्यकता है',

    // Applied Learning & Accessibility
    creativityLab: 'रचनात्मकता प्रयोगशाला',
    lifeMissions: 'व्यावहारिक जीवन मिशन',
    portfolio: 'शिक्षण पोर्टफोलियो',
    accessibility: 'सुलभता एवं सहायता',
    focusMode: 'ध्यान मोड',
    readAloud: 'बोलकर पढ़ें',
    dyslexiaFont: 'डिस्लेक्सिया-अनुकूल फ़ॉन्ट',
    liteMode: 'लाइट मोड',

    // Offline / Sync
    offlineNotice: 'आप अभी ऑफलाइन हैं। क्रियाएं सहेजी जाएंगी और पुनः कनेक्ट होने पर सिंक होंगी।',
    onlineNotice: 'आप ऑनलाइन आ चुके हैं! डेटा सिंक हो गया है।',
  },
} as const;

export type TranslationKey = keyof typeof translations['en'];
