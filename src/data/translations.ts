import { LanguageCode, LanguageInfo } from '../types';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
];

export interface TranslationSet {
  appTitle: string;
  navHome: string;
  navAbout: string;
  navFeatures: string;
  navLogin: string;
  navSignUp: string;
  navDashboard: string;
  navLogout: string;

  // Footer
  footerDesc: string;
  footerCopyright: string;
  footerAdminLogin: string;
  footerQuickLinks: string;
  footerTagline: string;
  footerBuiltFor: string;
  
  // Home Page
  heroTitle: string;
  heroSubtitle: string;
  getStarted: string;
  howItWorks: string;
  connectivityLabel: string;
  offlineReadyTitle: string;
  offlineReadyDesc: string;
  lowInternetMode: string;
  lowInternetModeDesc: string;

  // About Page
  aboutTitle: string;
  aboutSubtitle: string;
  missionTitle: string;
  missionDesc: string;
  visionTitle: string;
  visionDesc: string;
  ruralReachTitle: string;
  ruralReachDesc: string;

  // Features Page
  featuresTitle: string;
  featuresSubtitle: string;
  featureTTS: string;
  featureTTSDesc: string;
  featureVideos: string;
  featureVideosDesc: string;
  featureOffline: string;
  featureOfflineDesc: string;
  featureQuizzes: string;
  featureQuizzesDesc: string;

  // Auth Page
  loginTitle: string;
  signupTitle: string;
  mobileLabel: string;
  mobilePlaceholder: string;
  sendOTP: string;
  otpLabel: string;
  otpPlaceholder: string;
  verifyOTP: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  selectLanguageLabel: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  otpSentMessage: string;
  logInBtn: string;
  signUpBtn: string;
}

export const TRANSLATIONS: Record<LanguageCode, TranslationSet> = {
  en: {
    appTitle: "GyaanBot",
    navHome: "Home",
    navAbout: "About Us",
    navFeatures: "Features",
    navLogin: "Student Login",
    navSignUp: "Register First",
    navDashboard: "My Classroom",
    navLogout: "Exit",

    footerDesc: "A specialized digital learning assistant designed to operate securely under 2G bandwidth. Built for local offline synchronization and text-to-speech literacy assistance.",
    footerCopyright: "© 2026 GyaanBot. India Primary Rural Classrooms Initiatives.",
    footerAdminLogin: "Admin Portal Login",
    footerQuickLinks: "Quick Navigation",
    footerTagline: "Specialized rural digital learning platform",
    footerBuiltFor: "Built for rural education & offline learning",
    
    heroTitle: "AI Teacher for Every Village School",
    heroSubtitle: "Interactive voice and video learning that runs without any active internet. Speak, watch, and learn in your home language!",
    getStarted: "Start Learning Now",
    howItWorks: "See How It Works",
    connectivityLabel: "Signal Strength: Ultra-Low Friendly",
    offlineReadyTitle: "Zero Internet Supported",
    offlineReadyDesc: "Download videos once at Panchayat centers or bus stops, and study offline at home anywhere.",
    lowInternetMode: "2G Internet Support",
    lowInternetModeDesc: "Automatically compresses audio/video so tutoring works smoothly even on weak rural signals.",

    aboutTitle: "Our Mission & Dream",
    aboutSubtitle: "Bridging the gap between the cities and remote villages through smart offline artificial intelligence.",
    missionTitle: "Empowering Rural Minds",
    missionDesc: "More than 60% of rural students have limited broadband access. We build lightweight local software that delivers premium coaching.",
    visionTitle: "Interactive & Friendly",
    visionDesc: "We use animated virtual AI characters to deliver step-by-step videos, so children build curiosity, not just memorize textbooks.",
    ruralReachTitle: "Deep Regional Roots",
    ruralReachDesc: "Engineered specifically to understand localized dialects and work with basic feature phones or entry-level tab screens.",

    featuresTitle: "Specially Made for Rural Needs",
    featuresSubtitle: "No high-speed WiFi? Low literacy? No problem! Here is how we make learning simple.",
    featureTTS: "Text-to-Speech Voice Assistant",
    featureTTSDesc: "Just touch any sentence, and a friendly local voice reads it aloud! Helps children learn pronunciation independently.",
    featureVideos: "Interactive AI Response Videos",
    featureVideosDesc: "Animated AI cartoon teachers respond to your questions through friendly animated video responses that make hard topics fun.",
    featureOffline: "Offline Synchronized Study",
    featureOfflineDesc: "Save lessons, audio records, and interactive quizzes locally. No buffering, no extra mobile data expenses.",
    featureQuizzes: "Playful Concept Quizzes",
    featureQuizzesDesc: "Simple gamified checks at the end of every video to test understanding. Score points, earn dynamic medals!",

    loginTitle: "Welcome Back, Student!",
    signupTitle: "Create Your Free Account",
    mobileLabel: "Enter 10-Digit Mobile Number",
    mobilePlaceholder: "e.g., 9876543210",
    sendOTP: "Send Verification Code (OTP)",
    otpLabel: "Enter 6-Digit Security Code (OTP)",
    otpPlaceholder: "Enter 6-digit code (Use 123456 to bypass)",
    verifyOTP: "Verify Security Code",
    fullNameLabel: "Student's Full Name",
    fullNamePlaceholder: "Type your full name",
    selectLanguageLabel: "Choose default study language",
    alreadyHaveAccount: "Already registered? Log In here",
    dontHaveAccount: "New student? Register first",
    otpSentMessage: "Secured temporary code sent to your mobile!",
    logInBtn: "Enter Digital Classroom",
    signUpBtn: "Register & Start Learning"
  },
  hi: {
    appTitle: "ज्ञानबॉट (GyaanBot)",
    navHome: "मुख्य पृष्ठ",
    navAbout: "हमारे बारे में",
    navFeatures: "विशेषताएं",
    navLogin: "छात्र लॉगिन",
    navSignUp: "पंजीकरण करें",
    navDashboard: "मेरी कक्षा",
    navLogout: "बाहर जाएं",

    footerDesc: "कमज़ोर 2G नेटवर्क में भी सुरक्षित रूप से चलने वाला विशेष डिजिटल शिक्षण सहायक। स्थानीय ऑफ़लाइन सिंक और टेक्स्ट-टू-स्पीच भाषा सहायता के साथ निर्मित।",
    footerCopyright: "© 2026 ज्ञानबॉट. भारत प्राथमिक ग्रामीण कक्षा पहल।",
    footerAdminLogin: "एडमिन पोर्टल लॉगिन",
    footerQuickLinks: "त्वरित नेविगेशन",
    footerTagline: "विशेष ग्रामीण डिजिटल शिक्षा मंच",
    footerBuiltFor: "ग्रामीण शिक्षा और ऑफ़लाइन अध्ययन के लिए निर्मित",
    
    heroTitle: "हर गाँव के स्कूल के लिए AI शिक्षक",
    heroSubtitle: "बिना इंटरनेट के चलने वाली आवाज और वीडियो शिक्षा। अपनी मातृभाषा में बोलें, देखें और सीखें!",
    getStarted: "अभी सीखना शुरू करें",
    howItWorks: "काम करने का तरीका",
    connectivityLabel: "सिग्नल शक्ति: कमजोर नेटवर्क के अनुकूल",
    offlineReadyTitle: "बिना इंटरनेट की तैयारी",
    offlineReadyDesc: "पंचायत केंद्रों या बस स्टैंडों पर एक बार वीडियो डाउनलोड करें, और घर पर कहीं भी ऑफ़लाइन पढ़ाई करें।",
    lowInternetMode: "2G इंटरनेट का समर्थन",
    lowInternetModeDesc: "ऑटो-कंप्रेस्ड ऑडियो/वीडियो ताकि कमजोर से कमजोर सिग्नल पर भी पढ़ाई बिना रुके चलती रहे।",

    aboutTitle: "हमारा उद्देश्य और सपना",
    aboutSubtitle: "स्मार्ट ऑफ़लाइन आर्टिफिशियल इंटेलिजेंस द्वारा शहरों और सुदूर ग्रामीण क्षेत्रों के बीच की दूरी को कम करना।",
    missionTitle: "ग्रामीण प्रतिभाओं को संवारना",
    missionDesc: "60% से अधिक ग्रामीण छात्रों के पास ब्रॉडबैंड की सुविधा नहीं है। हम ऐसा हल्का सॉफ्टवेयर बनाते हैं जो बिना इंटरनेट के काम करता है।",
    visionTitle: "सहज और रोचक",
    visionDesc: "हम बच्चों में उत्सुकता जगाने के लिए एनिमेटेड AI पात्रों का उपयोग करते हैं, जिससे बच्चे केवल रटते नहीं बल्कि समझते हैं।",
    ruralReachTitle: "मातृभाषा और क्षेत्रीय समझ",
    ruralReachDesc: "स्थानीय बोलियों को समझने और साधारण फोन व टैबलेट स्क्रीन पर निर्बाध रूप से काम करने के लिए तैयार किया गया है।",

    featuresTitle: "ग्रामीण आवश्यकताओं के अनुसार निर्मित",
    featuresSubtitle: "तेज़ वाई-फ़ाई नहीं है? कोई बात नहीं! यहाँ बताया गया है कि हम पढ़ाई को कैसे आसान बनाते हैं।",
    featureTTS: "आवाज़ से पढ़ने वाला सहायक (TTS)",
    featureTTSDesc: "किसी भी वाक्य को छुएं, और एक मित्रवत आवाज़ उसे पढ़कर सुनाएगी! बच्चे स्वतंत्र रूप से उच्चारण सीख सकते हैं।",
    featureVideos: "रोचक AI वीडियो पाठ",
    featureVideosDesc: "एनिमेटेड कार्टून शिक्षक आपके प्रश्नों का उत्तर वीडियो और एनीमेशन द्वारा देते हैं जिससे कठिन विषय भी आसान हो जाते हैं।",
    featureOffline: "ऑफ़लाइन पढ़ाई और सिंक",
    featureOfflineDesc: "पाठ, ऑडियो और क्विज़ को अपने डिवाइस पर सुरक्षित रखें। न बफरिंग की समस्या, न मोबाइल डेटा का अतिरिक्त खर्च।",
    featureQuizzes: "रोचक अभ्यास क्विज़",
    featureQuizzesDesc: "हर वीडियो पाठ के अंत में सरल क्विज़। सही उत्तर दें, अंक प्राप्त करें और पदक जीतें!",

    loginTitle: "कक्षा में पुनः स्वागत है!",
    signupTitle: "नया खाता बनाएं",
    mobileLabel: "10 अंकों का मोबाइल नंबर दर्ज करें",
    mobilePlaceholder: "उदा. 9876543210",
    sendOTP: "सत्यापन कोड (OTP) भेजें",
    otpLabel: "6 अंकों का सुरक्षा कोड (OTP)",
    otpPlaceholder: "6 अंकों का कोड दर्ज करें (बाईपास के लिए 123456 उपयोग करें)",
    verifyOTP: "सुरक्षा कोड सत्यापित करें",
    fullNameLabel: "छात्र का पूरा नाम",
    fullNamePlaceholder: "अपना पूरा नाम लिखें",
    selectLanguageLabel: "अपनी डिफ़ॉल्ट अध्ययन भाषा चुनें",
    alreadyHaveAccount: "पहले से पंजीकृत हैं? यहाँ लॉगिन करें",
    dontHaveAccount: "नए छात्र हैं? पहले पंजीकरण करें",
    otpSentMessage: "आपके मोबाइल पर सुरक्षित अस्थायी सुरक्षा कोड भेज दिया गया है!",
    logInBtn: "डिजिटल कक्षा में प्रवेश करें",
    signUpBtn: "पंजीकरण करें और पढ़ाई शुरू करें"
  },
  gu: {
    appTitle: "જ્ઞાનબોટ (GyaanBot)",
    navHome: "મુખ્ય પૃષ્ઠ",
    navAbout: "અમારા વિશે",
    navFeatures: "સુવિધાઓ",
    navLogin: "વિદ્યાર્થી લૉગિન",
    navSignUp: "નોંધણી કરો",
    navDashboard: "મારો વર્ગ",
    navLogout: "બહાર નીકળો",

    footerDesc: "2G નેટવર્કમાં પણ સુરક્ષિત રીતે ચાલતો વિશિષ્ટ ડિજિટલ શિક્ષણ સહાયક. સ્થાનિક ઑફલાઇન સિંક અને ટેક્સ્ટ-ટુ-સ્પીચ સહાય માટે નિર્મિત.",
    footerCopyright: "© 2026 જ્ઞાનબોટ. ભારત પ્રાથમિક ગ્રામીણ વર્ગ પહેલ.",
    footerAdminLogin: "એડમિન પોર્ટલ લૉગિન",
    footerQuickLinks: "ઝડપી નેવિગેશન",
    footerTagline: "વિશિષ્ટ ગ્રામીણ ડિજિટલ શિક્ષણ પ્લેટફોર્મ",
    footerBuiltFor: "ગ્રામીણ શિક્ષણ અને ઑફલાઇન અભ્યાસ માટે નિર્મિત",
    
    heroTitle: "દરેક ગામની શાળા માટે AI શિક્ષક",
    heroSubtitle: "ઇન્ટરનેટ વિના ચાલતું અવાજ અને વિડિયો શિક્ષણ. તમારી માતૃભાષામાં બોલો, જુઓ અને શીખો!",
    getStarted: "હવે શીખવાનું શરૂ કરો",
    howItWorks: "કેવી રીતે કામ કરે છે તે જુઓ",
    connectivityLabel: "સિગ્નલ ક્ષમતા: નબળા નેટવર્ક માટે અનુકૂળ",
    offlineReadyTitle: "સંપૂર્ણ ઑફલાઇન સપોર્ટ",
    offlineReadyDesc: "પંચાયત કેન્દ્ર કે બસ સ્ટેન્ડ પર એકવાર વિડિયો ડાઉનલોડ કરો અને ઘરે ગમે ત્યાં ઑફલાઇન અભ્યાસ કરો.",
    lowInternetMode: "2G ઇન્ટરનેટ સપોર્ટ",
    lowInternetModeDesc: "ઑટો-કોમ્પ્રેસ્ડ ઑડિયો/વિડિયો જેથી ઓછા સિગ્નલ પર પણ શિક્ષણ અવિરત ચાલુ રહે.",

    aboutTitle: "અમારું લક્ષ્ય અને સ્વપ્ન",
    aboutSubtitle: "સ્માર્ટ ઑફલાઇન AI દ્વારા શહેરો અને દૂરના ગ્રામીણ વિસ્તારો વચ્ચેનું અંતર ઘટાડવું.",
    missionTitle: "ગ્રામીણ વિદ્યાર્થીઓનું સશક્તિકરણ",
    missionDesc: "60% થી વધુ ગ્રામીણ વિદ્યાર્થીઓ પાસે ઇન્ટરનેટ નથી. અમે ઇન્ટરનેટ વિના ચાલતું હલકું સોફ્ટવેર બનાવ્યું છે.",
    visionTitle: "સરળ અને રસપ્રદ",
    visionDesc: "બાળકોમાં જિજ્ઞાસા જગાવવા અમે એનિમેટેડ AI પાત્રોનો ઉપયોગ કરીએ છીએ, જેથી બાળકો માત્ર ગોખણપટ્ટી ન કરે પણ સમજે.",
    ruralReachTitle: "સ્થાનિક ભાષાઓની સમજ",
    ruralReachDesc: "સ્થાનિક બોલીઓ સમજવા અને સામાન્ય ફોન-ટેબ્લેટ પર સરળતાથી ચાલવા માટે ડિઝાઇન કરવામાં આવ્યું છે.",

    featuresTitle: "ગ્રામીણ જરૂરિયાતો અનુસાર નિર્મિત",
    featuresSubtitle: "ઝડપી વાઇફાઇ નથી? વાંચવામાં તકલીફ? ચિંતા કરશો નહીં! અમે શિક્ષણ સરળ બનાવીએ છીએ.",
    featureTTS: "અવાજ દ્વારા વાંચન સહાયક (TTS)",
    featureTTSDesc: "કોઈપણ વાક્યને સ્પર્શ કરો, અને એક અવાજ તે વાંચી સંભળાવશે! બાળકો જાતે યોગ્ય ઉચ્ચાર શીખી શકે છે.",
    featureVideos: "રસપ્રદ AI વિડિયો પાઠ",
    featureVideosDesc: "એનિમેટેડ કાર્ટૂન શિક્ષકો તમારા પ્રશ્નોના ઉત્તરો વિડિયો દ્વારા સરળ ભાષામાં આપે છે.",
    featureOffline: "ઑફલાઇન અભ્યાસ અને સિંક",
    featureOfflineDesc: "પાઠ, ઑડિયો અને ક્વિઝ તમારા ફોન પર સાચવો. બફરિંગની સમસ્યા નહીં અને ડેટાનો ખર્ચ પણ નહીં.",
    featureQuizzes: "રમતા રમતા ક્વિઝ",
    featureQuizzesDesc: "દરેક વિડિયો પાઠના અંતે સરળ ક્વિઝ. સાચા જવાબો આપો, પોઇન્ટ્સ મેળવો અને મેડલ જીતો!",

    loginTitle: "વર્ગમાં પુનઃ સ્વાગત છે!",
    signupTitle: "નવું ખાતું બનાવો",
    mobileLabel: "10 અંકનો મોબાઈલ નંબર દાખલ કરો",
    mobilePlaceholder: "દા.ત. 9876543210",
    sendOTP: "સત્યાપન કોડ (OTP) મોકલો",
    otpLabel: "6 અંકનો સુરક્ષા કોડ (OTP)",
    otpPlaceholder: "6 અંકનો કોડ દાખલ કરો (બાયપાસ માટે 123456 વાપરો)",
    verifyOTP: "સુરક્ષા કોડ ચકાસો",
    fullNameLabel: "વિદ્યાર્થીનું પૂરું નામ",
    fullNamePlaceholder: "તમારું પૂરું નામ લખો",
    selectLanguageLabel: "તમારી ડિફૉલ્ટ અભ્યાસ ભાષા પસંદ કરો",
    alreadyHaveAccount: "પહેલેથી નોંધાયેલા છો? અહીં લૉગિન કરો",
    dontHaveAccount: "નવા વિદ્યાર્થી છો? પહેલા નોંધણી કરો",
    otpSentMessage: "તમારા મોબાઈલ પર સુરક્ષિત OTP મોકલવામાં આવ્યો છે!",
    logInBtn: "ડિજિટલ વર્ગમાં પ્રવેશ કરો",
    signUpBtn: "નોંધણી કરો અને શીખવાનું શરૂ કરો"
  },
  mr: {
    appTitle: "ज्ञानबॉट (GyaanBot)",
    navHome: "मुख्य पृष्ठ",
    navAbout: "आमच्याबद्दल",
    navFeatures: "वैशिष्ट्ये",
    navLogin: "विद्यार्थी लॉगिन",
    navSignUp: "नोंदणी करा",
    navDashboard: "माझा वर्ग",
    navLogout: "बाहेर पडा",

    footerDesc: "2G नेटवर्कवरही सुरक्षितपणे चालणारा विशेष डिजिटल शिक्षण सहाय्यक. स्थानिक ऑफलाइन सिंक आणि टेक्स्ट-टू-स्पीच भाषा साहाय्यासाठी निर्मित.",
    footerCopyright: "© 2026 ज्ञानबॉट. भारत प्राथमिक ग्रामीण वर्ग पुढाकार.",
    footerAdminLogin: "प्रशासक पोर्टल लॉगिन",
    footerQuickLinks: "जलद नेव्हिगेशन",
    footerTagline: "विशेष ग्रामीण डिजिटल शिक्षण मंच",
    footerBuiltFor: "ग्रामीण शिक्षण आणि ऑफलाइन अभ्यासासाठी निर्मित",
    
    heroTitle: "प्रत्येक ग्रामीण शाळेसाठी AI शिक्षक",
    heroSubtitle: "इंटरनेटशिवाय चालणारे आवाज आणि व्हिडिओ शिक्षण. तुमच्या मातृभाषेत बोला, पाहा आणि शिका!",
    getStarted: "आता शिकणे सुरू करा",
    howItWorks: "कसे कार्य करते ते पाहा",
    connectivityLabel: "सिग्नल क्षमता: कमकुवत नेटवर्कसाठी अनुकूल",
    offlineReadyTitle: "पूर्णपणे ऑफलाइन तयारी",
    offlineReadyDesc: "ग्रामपंचायत केंद्र किंवा बस स्टॉपवर एकदा व्हिडिओ डाउनलोड करा आणि घरी कुठेही ऑफलाइन अभ्यास करा.",
    lowInternetMode: "2G इंटरनेट समर्थन",
    lowInternetModeDesc: "ऑटो-कंप्रेस्ड ऑडिओ/व्हिडिओ ज्यामुळे अगदी कमी सिग्नलवरही शिक्षण अखंड सुरू राहते.",

    aboutTitle: "आमचे ध्येय आणि स्वप्न",
    aboutSubtitle: "स्मार्ट ऑफलाइन AI द्वारे शहरे आणि ग्रामीण भागातील अंतर कमी करणे.",
    missionTitle: "ग्रामीण विद्यार्थ्यांचे सबलीकरण",
    missionDesc: "६०% पेक्षा जास्त ग्रामीण विद्यार्थ्यांकडे इंटरनेट नाही. आम्ही इंटरनेटशिवाय चालणारे हलके सॉफ्टवेअर तयार केले आहे.",
    visionTitle: "सोपे आणि रंजक",
    visionDesc: "मुलांमध्ये जिज्ञासा निर्माण करण्यासाठी आम्ही ॲनिमेटेड AI पात्रांचा वापर करतो, ज्यामुळे मुले केवळ पाठांतर न करता समजून घेतात.",
    ruralReachTitle: "स्थानिक भाषांची समज",
    ruralReachDesc: "स्थानिक बोलीभाषा समजण्यासाठी आणि सामान्य फोन-टॅब्लेटवर सहजतेने चालण्यासाठी डिझाइन केलेले आहे.",

    featuresTitle: "ग्रामीण गरजांनुसार निर्मित",
    featuresSubtitle: "वेगवान वायफाय नाही? वाचनात अडचण? काळजी नको! आम्ही शिक्षण सोपे करतो.",
    featureTTS: "आवाजी वाचन सहाय्यक (TTS)",
    featureTTSDesc: "कोणत्याही वाक्याला स्पर्श करा, आणि एक आवाज ते वाचून दाखवेल! मुले स्वतःहून योग्य उच्चार शिकू शकतात.",
    featureVideos: "रंजक AI व्हिडिओ धडे",
    featureVideosDesc: "ॲनिमेटेड कार्टून शिक्षक तुमच्या प्रश्नांची उत्तरे व्हिडिओद्वारे सोप्या भाषेत देतात.",
    featureOffline: "ऑफलाइन अभ्यास व सिंक",
    featureOfflineDesc: "धडे, ऑडिओ आणि क्विझ तुमच्या फोनवर सेव्ह करा. बफरिंगची समस्या नाही आणि डेटाचा खर्चही नाही.",
    featureQuizzes: "खेळता खेळता क्विझ",
    featureQuizzesDesc: "प्रत्येक व्हिडिओ धड्यानंतर सोपी क्विझ. योग्य उत्तरे द्या, गुण मिळवा आणि पदके जिंका!",

    loginTitle: "वर्गात आपले स्वागत आहे!",
    signupTitle: "नवीन खाते तयार करा",
    mobileLabel: "१० अंकी मोबाईल नंबर टाका",
    mobilePlaceholder: "उदा. 9876543210",
    sendOTP: "सत्यापन कोड (OTP) पाठवा",
    otpLabel: "६ अंकी सुरक्षा कोड (OTP)",
    otpPlaceholder: "६ अंकी कोड टाका (बायपाससाठी 123456 वापरा)",
    verifyOTP: "सुरक्षा कोड तपासा",
    fullNameLabel: "विद्यार्थ्याचे पूर्ण नाव",
    fullNamePlaceholder: "आपले पूर्ण नाव लिहा",
    selectLanguageLabel: "आपली प्राथमिक अभ्यासाची भाषा निवडा",
    alreadyHaveAccount: "आधीच नोंदणी केली आहे? येथे लॉगिन करा",
    dontHaveAccount: "नवीन विद्यार्थी आहात? प्रथम नोंदणी करा",
    otpSentMessage: "तुमच्या मोबाईलवर तात्पुरता OTP पाठवण्यात आला आहे!",
    logInBtn: "डिजिटल वर्गात प्रवेश करा",
    signUpBtn: "नोंदणी करा आणि शिकणे सुरू करा"
  },
  ta: {
    appTitle: "ஞான்பாட் (GyaanBot)",
    navHome: "முகப்பு",
    navAbout: "எங்களைப் பற்றி",
    navFeatures: "அம்சங்கள்",
    navLogin: "மாணவர் உள்நுழைவு",
    navSignUp: "பதிவு செய்தல்",
    navDashboard: "என் வகுப்பறை",
    navLogout: "வெளியேறு",

    footerDesc: "2G நெட்வொர்க்கிலும் சிறப்பாக செயல்படும் சிறப்பு டிஜிட்டல் கல்வி உதவியாளர். ஆஃப்லைன் சின்க் மற்றும் குரல் வாசிப்பு உதவியுடன் உருவாக்கப்பட்டது.",
    footerCopyright: "© 2026 ஞான்பாட். இந்திய முதன்மை கிராமப்புற வகுப்பறைகள் முயற்சி.",
    footerAdminLogin: "நிர்வாகி உள்நுழைவு",
    footerQuickLinks: "விரைவு இணைப்புகள்",
    footerTagline: "கிராமப்புற டிஜிட்டல் கற்றல் தளம்",
    footerBuiltFor: "கிராமப்புற கல்வி மற்றும் ஆஃப்லைன் கற்றலுக்காக உருவாக்கப்பட்டது",
    
    heroTitle: "ஒவ்வொரு கிராம பள்ளிக்கும் AI ஆசிரியர்",
    heroSubtitle: "இணையம் இல்லாமல் இயங்கும் குரல் மற்றும் வீடியோ கல்வி. உங்கள் தாய்மொழியில் பேசவும், பார்க்கவும், கற்றுக்கொள்ளவும்!",
    getStarted: "இப்போதே கற்கத் தொடங்குங்கள்",
    howItWorks: "செயல்முறையை அறிந்திடுங்கள்",
    connectivityLabel: "சிக்னல் வலிமை: குறைந்த இணைய வசதிக்கு சிறந்தது",
    offlineReadyTitle: "முற்றிலும் ஆஃப்லைன்",
    offlineReadyDesc: "பஞ்சாயத்து அல்லது பேருந்து நிலையங்களில் ஒருமுறை வீடியோக்களைப் பதிவிறக்கி, எந்த நேரத்திலும் ஆஃப்லைனில் படிக்கலாம்.",
    lowInternetMode: "2G இணைய ஆதரவு",
    lowInternetModeDesc: "சிக்னல் குறைவாக இருந்தாலும் ஆடியோ/வீடியோ தடங்கல் இல்லாமல் வேகமாக இயங்கும்.",

    aboutTitle: "எங்கள் லட்சியம் & கனவு",
    aboutSubtitle: "இணைய வசதி குறைந்த கிராமப்புற மாணவர்களுக்கும் தரமான கல்வியை ஆஃப்லைன் AI மூலம் வழங்குவது.",
    missionTitle: "கிராமப்புற மாணவர் மேம்பாடு",
    missionDesc: "60 சதவீதத்திற்கும் அதிகமான கிராம மாணவர்களுக்கு முறையான இணைய வசதி இல்லை. எனவே, மொபைல் டேட்டா பயன்படுத்தாத எளிய மென்பொருளை உருவாக்கியுள்ளோம்.",
    visionTitle: "ஆர்வம் தூண்டும் கல்வி",
    visionDesc: "அனிமேஷன் AI பாத்திரங்கள் மூலமாகப் பாடங்களை கற்றுத்தருவதால், குழந்தைகள் எளிதில் புரிந்து கொள்வர்.",
    ruralReachTitle: "வட்டார மொழிகள்",
    ruralReachDesc: "வட்டார பேச்சுவழக்குகளைப் புரிந்துகொள்வதற்காகவும், எளிய மொபைல்களில் இயங்குவதற்காகவும் வடிவமைக்கப்பட்டது.",

    featuresTitle: "கிராமப்புற தேவைகளுக்காக",
    featuresSubtitle: "வேகமான வைஃபை இல்லையா? வாசிக்கத் தெரியாதா? கவலை வேண்டாம்! கல்வி இப்போது மிகவும் எளிது.",
    featureTTS: "பேசும் குரல் உதவி (TTS)",
    featureTTSDesc: "எந்தவொரு வாக்கியத்தையும் தொட்டால், மென்பொருள் அதை வாசித்துக் காட்டும்! குழந்தைகள் தாங்களாகவே உச்சரிப்பைக் கற்றுக்கொள்ளலாம்.",
    featureVideos: "AI அனிமேஷன் ஆசிரியர்கள்",
    featureVideosDesc: "உங்கள் கேள்விகளுக்கு அனிமேஷன் கார்ட்டூன் பாத்திரங்கள் வீடியோக்கள் மூலம் எளிமையான முறையில் பதிலளிக்கும்.",
    featureOffline: "ஆஃப்லைன் சின்க்",
    featureOfflineDesc: "பாடங்கள், ஆடியோ மற்றும் வினாடி வினாக்களைச் சேமித்து வைத்து பஃபரிங் இல்லாமல் படிக்கலாம்.",
    featureQuizzes: "விளையாட்டு வினாடி வினா",
    featureQuizzesDesc: "ஒவ்வொரு வீடியோவின் முடிவிலும் எளிய வினாடி வினாக்கள். சரியான பதில் தந்து, புள்ளிகள் பெற்று, பதக்கங்களை வென்றிடுங்கள்!",

    loginTitle: "வகுப்பறைக்கு உங்களை வரவேற்கிறோம்!",
    signupTitle: "புதிய கணக்கை உருவாக்கவும்",
    mobileLabel: "உங்கள் 10 இலக்க மொபைல் எண்",
    mobilePlaceholder: "எ.கா: 9876543210",
    sendOTP: "OTP குறியீட்டை அனுப்பவும்",
    otpLabel: "6 இலக்க OTP குறியீடு",
    otpPlaceholder: "6 இலக்க குறியீடு (பைபாஸ் செய்ய 123456 பயன்படுத்தலாம்)",
    verifyOTP: "OTP சரிபார்க்கவும்",
    fullNameLabel: "மாணவரின் முழு பெயர்",
    fullNamePlaceholder: "உங்கள் பெயரை இங்கு எழுதவும்",
    selectLanguageLabel: "விருப்பமான கல்வி மொழியைத் தேர்ந்தெடுக்கவும்",
    alreadyHaveAccount: "ஏற்கனவே கணக்கு உள்ளதா? இங்கு உள்நுழையவும்",
    dontHaveAccount: "புதிய மாணவரா? முதலில் பதிவு செய்யவும்",
    otpSentMessage: "உங்கள் மொபைலுக்கு தற்காலிக OTP அனுப்பப்பட்டு உள்ளது!",
    logInBtn: "வகுப்பறைக்குள் செல்",
    signUpBtn: "பதிவு செய்து கற்க அடியெடுத்து வை"
  },
  te: {
    appTitle: "జ్ఞానబోట్ (GyaanBot)",
    navHome: "హోమ్",
    navAbout: "మా గురించి",
    navFeatures: "ఫీచర్లు",
    navLogin: "విద్యార్థి లాగిన్",
    navSignUp: "రిజిస్ట్రేషన్",
    navDashboard: "నా తరగతి గది",
    navLogout: "తరగతి నుండి నిష్క్రమించు",

    footerDesc: "2G నెట్‌వర్క్‌లో కూడా సురక్షితంగా పనిచేసే ప్రత్యేక డిజిటల్ లెర్నింగ్ అసిస్టెంట్. లోకల్ ఆఫ్‌లైన్ సింక్ మరియు టెక్స్ట్-టు-స్పీచ్ సౌలభ్యంతో రూపొందించబడింది.",
    footerCopyright: "© 2026 జ్ఞానబోట్. భారత ప్రాథమిక గ్రామీణ తరగతి గదుల కార్యక్రమం.",
    footerAdminLogin: "అడ్మిన్ పోర్టల్ లాగిన్",
    footerQuickLinks: "త్వరిత నావిగేషన్",
    footerTagline: "ప్రత్యేక గ్రామీణ డిజిటల్ లెర్నింగ్ ప్లాట్‌ఫామ్",
    footerBuiltFor: "గ్రామీణ విద్య మరియు ఆఫ్‌లైన్ అభ్యసనం కోసం నిర్మించబడింది",
    
    heroTitle: "ప్రతి గ్రామ పాఠశాల కోసం AI ఉపాధ్యాయుడు",
    heroSubtitle: "ఇంటర్నెట్ అవసరం లేని వాయిస్ మరియు వీడియో లెర్నింగ్! మీ మాతృభాషలో మాట్లాడండి, చూడండి, మరియు నేర్చుకోండి.",
    getStarted: "ఇప్పుడే నేర్చుకోవడం ప్రారంభించండి",
    howItWorks: "పనితీరును తెలుసుకోండి",
    connectivityLabel: "సిగ్నల్ బలం: చాలా తక్కువ ఇంటర్నెట్‌తో కూడా అనుకూలమైనది",
    offlineReadyTitle: "పూర్తి ఆఫ్‌లైన్ సపోర్ట్",
    offlineReadyDesc: "పంచాయతీ కేంద్రాలు లేదా బస్టాండ్‌లలో వీడియోలను ఒకసారి డౌన్‌లోడ్ చేసుకొని, ఎక్కడైనా ఆఫ్‌లైన్‌లో చదువుకోవచ్చు.",
    lowInternetMode: "2G నెట్‌వర్క్ సపోర్ట్",
    lowInternetModeDesc: "ఆటో-కంప్రెషన్ వల్ల సిగ్నల్స్ చాలా బలహీనంగా ఉన్నప్పటికీ ఆడియో, వీడియోలు ఎలాంటి ఆటంకం లేకుండా పనిచేస్తాయి.",

    aboutTitle: "మా లక్ష్యం & కల",
    aboutSubtitle: "స్మార్ట్ ఆఫ్‌లైన్ ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ (AI) తో నగరాలు మరియు మారుమూల గ్రామాలను దగ్గర చేయడం.",
    missionTitle: "గ్రామీణ విద్యార్థుల సాధికారత",
    missionDesc: "60% కంటే ఎక్కువ గ్రామీణ విద్యార్థులకు ఇంటర్నెట్ సౌకర్యం లేదు. మేము చాలా తేలికైన సాఫ్ట్‌వేర్ నిర్మించాము, అది ఇంటర్నెట్ లేకుండా పనిచేస్తుంది.",
    visionTitle: "సులభమైన అవగాహన",
    visionDesc: "మేము పిల్లలకి సులభంగా అర్థం కావడానికి యానిమేటెడ్ AI పాత్రలను ఉపయోగిస్తాము, దీనివల్ల క్రమంగా పిల్లలలో జిజ్ఞాస పెరుగుతుంది.",
    ruralReachTitle: "ప్రాంతీయ భాషల అనుకూలత",
    ruralReachDesc: "స్థానిక యాసలను గ్రహించడానికి మరియు సాధారణ లేదా బడ్జెట్ ఫోన్‌లలో సజావుగా పనిచేసేందుకు ప్రత్యేకంగా రూపకల్పన చేయబడినది.",

    featuresTitle: "గ్రామీణ విద్యార్థుల అవసరాల కోసం",
    featuresSubtitle: "వేగవంతమైన వైఫై లేదా? చదవడం రాదా? పర్వాలేదు! చదువును మేము సులభతరం చేస్తాము.",
    featureTTS: "టెక్స్ట్-టు-స్పీచ్ వాయిస్ అసిస్టెంట్",
    featureTTSDesc: "ఏ వాక్యాన్నైనా తాకండి, చదువుతూ వినిపిస్తుంది! దీనివల్ల పిల్లలు పదాల సరైన ఉచ్చారణను సులభంగా నేర్చుకోవచ్చు.",
    featureVideos: "ఇంటరాక్టివ్ AI వీడియో పాఠాలు",
    featureVideosDesc: "యానిమేటెడ్ కార్టూన్ ఉపాధ్యాయులు మీ ప్రశ్నలకి వీడియోలు మరియు యానిమేషన్ల ద్వారా చాలా సరదగా సమాధానాలు ఇస్తారు.",
    featureOffline: "ఆఫ్‌లైన్ విద్యా సంపద",
    featureOfflineDesc: "పాఠాలు, ఆడియో మరియు క్విజ్‌లను డివైజ్‌లోనే సేవ్ చేసుకోండి. బఫరింగ్ సమస్య లేదు, ఇంటర్నెట్ బిల్లు ఖర్చూ లేదు.",
    featureQuizzes: "ఆడుతూ-పాడుతూ క్విజ్",
    featureQuizzesDesc: "ప్రతి వీడియో పాఠం చివరలో ఒక చిన్న సరదా క్విజ్. సరైన సమాధానాలు చెప్పి, పాయింట్లు సాధించి, పతకాలు గెలవండి!",

    loginTitle: "తరగతి గదిలోకి స్వాగతం!",
    signupTitle: "కొత్త అకౌంట్ సృష్టించండి",
    mobileLabel: "10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి",
    mobilePlaceholder: "ఉదా: 9876543210",
    sendOTP: "ఓటీపీ (OTP) కోడ్ పంపించు",
    otpLabel: "6 అంకెల ఓటీపీ కోడ్",
    otpPlaceholder: "6 అంకెల కోడ్ ఎంటర్ చేయండి (బైపాస్ కోసం 123456 ఉపయోగించండి)",
    verifyOTP: "ఓటీపీని సరిచూసుకోండి",
    fullNameLabel: "విద్యార్థి పూర్తి పేరు",
    fullNamePlaceholder: "ఇక్కడ మీ పూర్తి పేరు వ్రాయండి",
    selectLanguageLabel: "మీ డిఫాల్ట్ అభ్యసన భాషను ఎంచుకోండి",
    alreadyHaveAccount: "ఇంతకుముందే రిజిస్టర్ చేసుకున్నారా? ఇక్కడ లాగిన్ అవ్వండి",
    dontHaveAccount: "కొత్త విద్యార్థియా? మొదట మీ అకౌంట్ సృష్టించుకోండి",
    otpSentMessage: "మీ మొబైల్‌కు తాత్కాలిక ఓటీపీ కోడ్ పంపవడింది!",
    logInBtn: "డిజిటల్ క్లాస్‌లోకి ప్రవేశించండి",
    signUpBtn: "రిజిస్టర్ చేసుకొని చదవడం ప్రారంభించండి"
  }
};

/* =========================================================================
   COMPREHENSIVE DASHBOARD & TAB TRANSLATIONS (6 LANGUAGES)
   ========================================================================= */

export interface DashboardTabLabels {
  profile: string;
  aiAssistant: string;
  tutor: string;
  equations: string;
  adminPdfs: string;
  quiz: string;
  puzzles: string;
  certificates: string;
  exam: string;
  career: string;
  settings: string;
}

export const DASHBOARD_TABS_I18N: Record<LanguageCode, DashboardTabLabels> = {
  en: {
    profile: "My Profile Overview",
    aiAssistant: "AI Study Chatbot",
    tutor: "Mascot Class Tutor",
    equations: "Smart Equation Hub",
    adminPdfs: "Study Materials",
    quiz: "Topic Play Quizzes",
    puzzles: "AI Puzzle Arena",
    certificates: "My Certificates",
    exam: "Competitive Exams",
    career: "Career Guidance",
    settings: "System Settings",
  },
  hi: {
    profile: "मेरी प्रोफ़ाइल विवरण",
    aiAssistant: "AI अध्ययन सहायक",
    tutor: "मास्कॉट शिक्षक कक्षा",
    equations: "समीकरण व सूत्र हब",
    adminPdfs: "अध्ययन सामग्री व PDF",
    quiz: "विषयवार अभ्यास क्विज़",
    puzzles: "AI पहेली एरीना",
    certificates: "मेरे प्रमाण पत्र",
    exam: "प्रतियोगी परीक्षा तैयारी",
    career: "करियर व कॉलेज मार्गदर्शन",
    settings: "सिस्टम सेटिंग्स",
  },
  gu: {
    profile: "મારી પ્રોફાઇલ વિગત",
    aiAssistant: "AI અભ્યાસ સહાયક",
    tutor: "મેસ્કોટ શિક્ષક વર્ગ",
    equations: "સમીકરણ અને સૂત્ર કેન્દ્ર",
    adminPdfs: "અભ્યાસ સામગ્રી અને PDF",
    quiz: "વિષયવાર ક્વિઝ",
    puzzles: "AI કોયડા એરેના",
    certificates: "મારા પ્રમાણપત્રો",
    exam: "સ્પર્ધાત્મક પરીક્ષા તૈયારી",
    career: "કારકિર્દી માર્ગદર્શન",
    settings: "સિસ્ટમ સેટિંગ્સ",
  },
  mr: {
    profile: "माझी प्रोफाईल माहिती",
    aiAssistant: "AI अभ्यास सहाय्यक",
    tutor: "मॅस्कॉट शिक्षक वर्ग",
    equations: "समीकरण व सूत्र केंद्र",
    adminPdfs: "अभ्यास साहित्य व PDF",
    quiz: "विषयवार सराव क्विझ",
    puzzles: "AI कोडे एरिना",
    certificates: "माझे प्रमाणपत्र",
    exam: "स्पर्धा परीक्षा तयारी",
    career: "करिअर मार्गदर्शन",
    settings: "सिस्टम सेटिंग्ज",
  },
  ta: {
    profile: "என் சுயவிவரம்",
    aiAssistant: "AI படிப்பு உதவியாளர்",
    tutor: "மேஸ்காட் ஆசிரியர் வகுப்பு",
    equations: "சமன்பாடு & சூத்திர மையம்",
    adminPdfs: "படிப்பு பொருட்கள் & PDF",
    quiz: "பாட வினாடி வினா",
    puzzles: "AI புதிர்கள் அரங்கம்",
    certificates: "என் சான்றிதழ்கள்",
    exam: "போட்டித் தேர்வு பயிற்சி",
    career: "தொழில் வழிகாட்டுதல்",
    settings: "அமைப்பு அமைப்புகள்",
  },
  te: {
    profile: "నా ప్రొఫైల్ వివరాలు",
    aiAssistant: "AI స్టడీ అసిస్టెంట్",
    tutor: "మాస్కాట్ టీచర్ క్లాస్",
    equations: "సమీకరణాలు & ఫార్ములా హబ్",
    adminPdfs: "స్టడీ మెటీరియల్ & PDF",
    quiz: "టాపిక్ వారీ క్విజ్",
    puzzles: "AI పజిల్స్ అరీనా",
    certificates: "నా సర్టిఫికెట్లు",
    exam: "పోటీ పరీక్షల తయారీ",
    career: "కెరీర్ మార్గదర్శకత్వం",
    settings: "సిస్టమ్ సెట్టింగ్స్",
  }
};

export const UI_COMMON_I18N: Record<LanguageCode, Record<string, string>> = {
  en: {
    namaste: "Namaste",
    curriculumMedium: "Curriculum Medium",
    studyStreak: "Study Streak",
    timeStudied: "Time Studied",
    completed: "Completed",
    medals: "medals",
    days: "Days",
    activePage: "Active Page",
    allPages: "All Pages",
    myClassChannels: "My Class Channels",
    accountAndSettings: "Account & Settings",
    aiLearningTools: "AI Learning Tools",
    curriculumAndPrep: "Curriculum & Prep",
    practiceAndRewards: "Practice & Rewards",
    onlineMode: "Online Mode",
    offlineMode: "Offline Mode",
    syncPending: "Sync Pending",
    syncAllNow: "Sync All Now",
    syncSuccess: "All offline data synced successfully!",
    searchPlaceholder: "Search...",
    filterAll: "All",
    backBtn: "Back",
    cancelBtn: "Cancel",
    saveBtn: "Save",
    deleteBtn: "Delete",
    downloadPdf: "Download PDF",
    shareBtn: "Share",
    loading: "Loading...",
    noDataFound: "No records found",
    comingSoon: "Coming Soon",
  },
  hi: {
    namaste: "नमस्ते",
    curriculumMedium: "अध्ययन माध्यम",
    studyStreak: "अध्ययन स्ट्रीक",
    timeStudied: "पढ़ा गया समय",
    completed: "पूर्ण",
    medals: "पदक",
    days: "दिन",
    activePage: "सक्रिय पृष्ठ",
    allPages: "सभी पृष्ठ",
    myClassChannels: "मेरे कक्षा चैनल",
    accountAndSettings: "खाता और सेटिंग्स",
    aiLearningTools: "AI अध्ययन उपकरण",
    curriculumAndPrep: "पाठ्यक्रम और तैयारी",
    practiceAndRewards: "अभ्यास और पुरस्कार",
    onlineMode: "ऑनलाइन मोड",
    offlineMode: "ऑफ़लाइन मोड",
    syncPending: "सिंक लंबित",
    syncAllNow: "अभी सिंक करें",
    syncSuccess: "सभी ऑफ़लाइन डेटा सफलतापूर्वक सिंक हो गया!",
    searchPlaceholder: "खोजें...",
    filterAll: "सभी",
    backBtn: "वापस जाएं",
    cancelBtn: "रद्द करें",
    saveBtn: "सहेजें",
    deleteBtn: "हटाएं",
    downloadPdf: "PDF डाउनलोड करें",
    shareBtn: "साझा करें",
    loading: "लोड हो रहा है...",
    noDataFound: "कोई डेटा नहीं मिला",
    comingSoon: "शीघ्र आ रहा है",
  },
  gu: {
    namaste: "નમસ્તે",
    curriculumMedium: "અભ્યાસ માધ્યમ",
    studyStreak: "અભ્યાસ સ્ટ્રીક",
    timeStudied: "અભ્યાસ સમય",
    completed: "પૂર્ણ થયેલ",
    medals: "મેડલ",
    days: "દિવસો",
    activePage: "સક્રિય પૃષ્ઠ",
    allPages: "બધા પૃષ્ઠો",
    myClassChannels: "મારા વર્ગ ચેનલ્સ",
    accountAndSettings: "ખાતું અને સેટિંગ્સ",
    aiLearningTools: "AI શીખવાના સાધનો",
    curriculumAndPrep: "અભ્યાસક્રમ અને તૈયારી",
    practiceAndRewards: "અભ્યાસ અને પુરસ્કાર",
    onlineMode: "ઓનલાઇન મોડ",
    offlineMode: "ઓફલાઇન મોડ",
    syncPending: "સિંક બાકી",
    syncAllNow: "હમણાં સિંક કરો",
    syncSuccess: "બધો ઓફલાઇન ડેટા સફળતાપૂર્વક સિંક થયો!",
    searchPlaceholder: "શોધો...",
    filterAll: "બધા",
    backBtn: "પાછા જાઓ",
    cancelBtn: "રદ કરો",
    saveBtn: "સાચવો",
    deleteBtn: "કાઢી નાખો",
    downloadPdf: "PDF ડાઉનલોડ કરો",
    shareBtn: "શેર કરો",
    loading: "લોડ થઈ રહ્યું છે...",
    noDataFound: "કોઈ માહિતી મળી નથી",
    comingSoon: "ટૂંક સમયમાં ઉપલબ્ધ",
  },
  mr: {
    namaste: "नमस्ते",
    curriculumMedium: "अभ्यास माध्यम",
    studyStreak: "अभ्यास स्ट्रीक",
    timeStudied: "अभ्यास वेळ",
    completed: "पूर्ण",
    medals: "पदके",
    days: "दिवस",
    activePage: "सक्रिय पृष्ठ",
    allPages: "सर्व पृष्ठे",
    myClassChannels: "माझे वर्ग चॅनेल",
    accountAndSettings: "खाते आणि सेटिंग्ज",
    aiLearningTools: "AI अभ्यास साधने",
    curriculumAndPrep: "अभ्यासक्रम आणि तयारी",
    practiceAndRewards: "सराव आणि बक्षिसे",
    onlineMode: "ऑनलाइन मोड",
    offlineMode: "ऑफलाइन मोड",
    syncPending: "सिंक प्रलंबित",
    syncAllNow: "आत्ताच सिंक करा",
    syncSuccess: "सर्व ऑफलाइन डेटा यशस्वीरीत्या सिंक झाला!",
    searchPlaceholder: "शोधा...",
    filterAll: "सर्व",
    backBtn: "मागे जा",
    cancelBtn: "रद्द करा",
    saveBtn: "जतन करा",
    deleteBtn: "हटवा",
    downloadPdf: "PDF डाउनलोड करा",
    shareBtn: "शेअर करा",
    loading: "लोड होत आहे...",
    noDataFound: "कोणतीही माहिती आढळली नाही",
    comingSoon: "लवकरच येत आहे",
  },
  ta: {
    namaste: "வணக்கம்",
    curriculumMedium: "கல்வி ஊடகம்",
    studyStreak: "படிப்பு தொடர்ச்சி",
    timeStudied: "படித்த நேரம்",
    completed: "முடிந்தது",
    medals: "பதக்கங்கள்",
    days: "நாட்கள்",
    activePage: "செயலில் உள்ள பக்கம்",
    allPages: "அனைத்துப் பக்கங்களும்",
    myClassChannels: "என் வகுப்பு சேனல்கள்",
    accountAndSettings: "கணக்கு & அமைப்புகள்",
    aiLearningTools: "AI கற்றல் கருவிகள்",
    curriculumAndPrep: "பாடத்திட்டம் & பயிற்சி",
    practiceAndRewards: "பயிற்சி & பரிசுகள்",
    onlineMode: "ஆன்லைன் பயன்முறை",
    offlineMode: "ஆஃப்லைன் பயன்முறை",
    syncPending: "ஒத்திசைவு நிலுவை",
    syncAllNow: "இப்போதே ஒத்திசைக்கவும்",
    syncSuccess: "ஆஃப்லைன் தரவு வெற்றிகரமாக ஒத்திசைக்கப்பட்டது!",
    searchPlaceholder: "தேடு...",
    filterAll: "அனைத்தும்",
    backBtn: "பின்செல்லவும்",
    cancelBtn: "ரத்து செய்",
    saveBtn: "சேமிக்கவும்",
    deleteBtn: "நீக்கவும்",
    downloadPdf: "PDF பதிவிறக்கவும்",
    shareBtn: "பகிரவும்",
    loading: "ஏற்றுகிறது...",
    noDataFound: "தகவல்கள் எதுவும் கிடைக்கவில்லை",
    comingSoon: "விரைவில் வருகிறது",
  },
  te: {
    namaste: "నమస్తే",
    curriculumMedium: "బోధనా మాధ్యమం",
    studyStreak: "స్టడీ స్ట్రీక్",
    timeStudied: "చదివిన సమయం",
    completed: "పూర్తయింది",
    medals: "పతకాలు",
    days: "రోజులు",
    activePage: "యాక్టివ్ పేజీ",
    allPages: "అన్ని పేజీలు",
    myClassChannels: "నా క్లాస్ ఛానెల్స్",
    accountAndSettings: "ఖాతా & సెట్టింగ్స్",
    aiLearningTools: "AI లెర్నింగ్ టూల్స్",
    curriculumAndPrep: "పాఠ్యప్రణాళిక & ప్రిపరేషన్",
    practiceAndRewards: "ప్రాక్టీస్ & బహుమతులు",
    onlineMode: "ఆన్‌లైన్ మోడ్",
    offlineMode: "ఆఫ్‌లైన్ మోడ్",
    syncPending: "సింక్ పెండింగ్",
    syncAllNow: "ఇప్పుడే సింక్ చేయండి",
    syncSuccess: "ఆఫ్‌లైన్ డేటా విజయవంతంగా సింక్ చేయబడింది!",
    searchPlaceholder: "శోధించండి...",
    filterAll: "అన్నీ",
    backBtn: "వెనుకకు",
    cancelBtn: "రద్దు చేయండి",
    saveBtn: "భద్రపరచండి",
    deleteBtn: "తొలగించండి",
    downloadPdf: "PDF డౌన్‌లోડ చేయండి",
    shareBtn: "షేర్ చేయండి",
    loading: "లోడ్ అవుతోంది...",
    noDataFound: "ఎలాంటి సమాచారం కనుగొనబడలేదు",
    comingSoon: "త్వరలో రాబోతోంది",
  }
};
