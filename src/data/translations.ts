import { LanguageCode, LanguageInfo } from '../types';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' }
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
    navLogout: "Exit Class",
    
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
    
    heroTitle: "हर गाँव के स्कूल के लिए AI शिक्षक",
    heroSubtitle: "बिना इंटरनेट के चलने वाली आवाज और वीडियो शिक्षा। अपनी मातृभाषा में बोलें, देखें और सीखें!",
    getStarted: "अभी सीखना शुरू करें",
    howItWorks: "काम करने का तरीका",
    connectivityLabel: "सिग्नल शक्ति: कमजोर नेटवर्क के अनुकूल",
    offlineReadyTitle: "बिना इंटरनेट की तैयारी",
    offlineReadyDesc: "पंचायत केंद्रों या बस स्टैंडों पर एक बार वीडियो डाउनलोड करें, और घर पर कहीं भी ऑफ़लाइन पढ़ाई करें।",
    lowInternetMode: "2G इंटरनेट का समर्थन",
    lowInternetModeDesc: "ऑटो-कंप्रेस्ड ऑडियो/वीडियो ताकि कमजोर से कमजोर सिग्नल पर भी पढ़ाई बिना रुके चलती रहे।",

    aboutTitle: "हमारा लक्ष्य और सपना",
    aboutSubtitle: "स्मार्ट ऑफ़लाइन आर्टिफिशियल इंटेलिजेंस (AI) द्वारा शहरों और दूरदराज के गाँवों के बीच की दूरी मिटाना।",
    missionTitle: "ग्रामीण युवाओं का सशक्तीकरण",
    missionDesc: "60% से अधिक ग्रामीण छात्रों के पास इंटरनेट नहीं है। हम हल्का और तेज़ सॉफ्टवेयर बनाते हैं जो उत्कृष्ट कोचिंग देता है।",
    visionTitle: "सहज और मज़ेदार",
    visionDesc: "हम बच्चों को कदम-दर-कदम समझाने के लिए एनिमेटेड AI पात्रों का उपयोग करते हैं, जिससे बच्चों में जिज्ञासा का संचार होता है।",
    ruralReachTitle: "स्थानीय भाषाओँ का सम्मान",
    ruralReachDesc: "विशेष रूप से स्थानीय बोलियों को समझने और बुनियादी मोबाइल एवं टैबलेट पर बेहतरीन काम करने के लिए डिज़ाइन किया गया है।",

    featuresTitle: "ग्रामीण जरूरतों के लिए विशेष रूप से निर्मित",
    featuresSubtitle: "तेज़ वाईफाई नहीं है? पढ़ना नहीं आता? कोई बात नहीं! पढ़ाई को हम आसान बनाते हैं।",
    featureTTS: "आवाज़ में सुनने की सुविधा",
    featureTTSDesc: "किसी भी वाक्य को छुएं, और एक मित्रवत आवाज़ उसे पढ़कर सुनाएगी! बच्चों को स्वतंत्र रूप से शब्दों का उच्चारण सीखने में मदद मिलेगी।",
    featureVideos: "AI वीडियो शिक्षक",
    featureVideosDesc: "आपके प्रश्नों का उत्तर कार्टून शिक्षक वीडियो और एनिमेशन के माध्यम से मनोरंजक सरल भाषा में देते हैं।",
    featureOffline: "ऑफ़लाइन पढ़ाई का खजाना",
    featureOfflineDesc: "पाठ, ऑडियो और प्रश्नोत्तरी को डिवाइस में सहेजें। ना कोई बफरिंग, ना ही बार-बार मोबाइल डेटा का खर्च।",
    featureQuizzes: "खेल-खेल में प्रश्नोत्तरी",
    featureQuizzesDesc: "हर समझाने वाले वीडियो के बाद मजेदार क्विज़। सही उत्तर दें, अंक बढ़ाएं, डिजिटल पदक जीतें!",

    loginTitle: "कक्षा में आपका स्वागत है!",
    signupTitle: "अपना नया खाता बनाएं",
    mobileLabel: "10 अंकों का मोबाइल नंबर दर्ज करें",
    mobilePlaceholder: "उदाहरण: 9876543210",
    sendOTP: "ओटीपी (OTP) कोड भेजें",
    otpLabel: "6 अंकों का सुरक्षा कोड (ओटीपी)",
    otpPlaceholder: "6-अंकों का कोड (बाईपास के लिए 123456 दर्ज करें)",
    verifyOTP: "सुरक्षा कोड सत्यापित करें",
    fullNameLabel: "छात्र का पूरा नाम",
    fullNamePlaceholder: "यहाँ अपना पूरा नाम लिखें",
    selectLanguageLabel: "अपनी डिफ़ॉल्ट पढ़ाई की भाषा चुनें",
    alreadyHaveAccount: "पहले से पंजीकृत हैं? यहाँ लॉगिन करें",
    dontHaveAccount: "नए छात्र हैं? पहले यहाँ खाता बनाएं",
    otpSentMessage: "आपके मोबाइल पर अस्थायी सुरक्षा कोड भेज दिया गया है!",
    logInBtn: "कक्षा में प्रवेश करें",
    signUpBtn: "पंजीकरण करें और पढ़ना शुरू करें"
  },
  gu: {
    appTitle: "જ્ઞાનબોટ (GyaanBot)",
    navHome: "મુખ્ય પાનું",
    navAbout: "અમારા વિશે",
    navFeatures: "સુવિધાઓ",
    navLogin: "વિદ્યાર્થી લોગીન",
    navSignUp: "નવું રજીસ્ટ્રેશન",
    navDashboard: "મારો વર્ગખંડ",
    navLogout: "વર્ગમાંથી બહાર નીકળો",
    
    heroTitle: "દરેક ગામ માટે સ્માર્ટ AI શિક્ષક",
    heroSubtitle: "ઈન્ટરનેટ વગર ચાલતું ઓડિયો અને વિડીયો લર્નિંગ! તમારી માતૃભાષામાં બોલો, જુઓ અને ભણો.",
    getStarted: "ભણવાનું શરૂ કરો",
    howItWorks: "રીત જાણો",
    connectivityLabel: "સિગ્નલ ક્ષમતા: નબળા નેટવર્ક માટે ઉત્તમ",
    offlineReadyTitle: "ઝીરો ઇન્ટરનેટ સપોર્ટ",
    offlineReadyDesc: "પંચાયત કેન્દ્ર અથવા બસ સ્ટોપ પર એકવાર વિડીયો ડાઉનલોડ કરો, અને ઘરે ગમે ત્યારે ઇન્ટરનેટ વિના ભણો.",
    lowInternetMode: "2G ઇન્ટરનેટ સપોર્ટ",
    lowInternetModeDesc: "નબળા નેટવર્ક સિગ્નલમાં પણ ઓડિયો અને વિડીયો અટક્યા વિના સરળતાથી ઓપન થાય છે.",

    aboutTitle: "અમારું ધ્યેય અને સ્વપ્ન",
    aboutSubtitle: "સ્માર્ટ ઓફલાઇન આર્ટિફિશિયલ ઇન્ટેલિજન્સ દ્વારા શહેરો અને અંતરિયાળ ગામડાઓ વચ્ચેનું અંતર પૂરૂ કરવું.",
    missionTitle: "ગ્રામીણ વિદ્યાર્થીઓનું સશક્તિકરણ",
    missionDesc: "૬૦% થી વધુ ગ્રામીણ બાળકો પાસે ઇન્ટરનેટ નથી. અમે ખૂબ જ હળવું અને સ્માર્ટ સોફ્ટવેર બનાવ્યું છે જે કોઈપણ ડેટા ખર્ચ વિના ભણાવે છે.",
    visionTitle: "આનંદદાયક અને ઇન્ટરેક્ટિવ",
    visionDesc: "અમે કાર્ટૂન AI પાત્રો દ્વારા વિડીયો પાઠ શીખવાડીએ છીએ, જેથી બાળકોમાં ગોખણપટ્ટી ને બદલે જિજ્ઞાસા વધે.",
    ruralReachTitle: "સ્થાનિક બોલીઓનો આદર",
    ruralReachDesc: "સ્થાનિક બોલીઓ સમજવા અને સાદા કે સસ્તા મોબાઈલ-ટેબલેટ પર સુંદર રીતે કામ કરવા માટે ખાસ ડિઝાઇન કરેલ.",

    featuresTitle: "ખાસ ગ્રામીણ જરૂરિયાતો મુજબ બનાવેલ",
    featuresSubtitle: "ઈન્ટરનેટ સ્પીડ નથી? વાંચતા નથી આવડતું? કોઈ ચિંતા નહિ! ભણતરને આ રીતે સરળ બનાવો.",
    featureTTS: "ટેક્સ્ટ-ટુ-સ્પીચ અવાજ મદદગાર",
    featureTTSDesc: "કોઈપણ વાક્ય પર આંગળી અડાડો, એટલે સ્માર્ટ અવાજ તેને મોટેથી વાંચશે! બાળકો પોતાની જાતે સાચું ઉચ્ચારણ શીખી શકે.",
    featureVideos: "ઇન્ટરેક્ટિવ AI વિડીયો પાઠ",
    featureVideosDesc: "એનિમેટેડ કાર્ટૂન શિક્ષકો તમારા પ્રશ્નોના જવાબો મનોરંજક અને સમજાય તેવા વિડીયો દ્વારા આપશે.",
    featureOffline: "સંપૂર્ણ ઓફલાઇન સુવિધા",
    featureOfflineDesc: "પાઠવેદ, ઓડિયો અને ક્વિઝ બધું ડિવાઇસ માં જ સેવ રાખો. કોઈ બફરિંગ કે વધારાનો મોબાઈલ ખર્ચ નહિ.",
    featureQuizzes: "રમત-ગમત સાથે ક્વિઝ",
    featureQuizzesDesc: "દરેક વિડીયો પાઠના અંતે ટૂંકું ક્વિઝ રમો. સાચો જવાબ આપો, પોઈન્ટ મેળવો, અને ડિજિટલ મેડલ જીતો!",

    loginTitle: "વર્ગખંડમાં તમારું સ્વાગત છે!",
    signupTitle: "તમારું નવું રજીસ્ટ્રેશન કરો",
    mobileLabel: "૧૦ આંકડાનો મોબાઈલ નંબર લખો",
    mobilePlaceholder: "દા.ત., 9876543210",
    sendOTP: "સુરક્ષા કોડ (OTP) મોકલો",
    otpLabel: "6 આંકડાનો ઓટીપી કોડ",
    otpPlaceholder: "6 આંકડાનો કોડ લખો (બાયપાસ કરવા ૧૨૩૪૫૬ લખો)",
    verifyOTP: "સુરક્ષા કોડ ચેક કરો",
    fullNameLabel: "વિદ્યાર્થીનું પૂરું નામ",
    fullNamePlaceholder: "તમારું નામ અહીં લખો",
    selectLanguageLabel: "ડિફોલ્ટ ભણવાની ભાષા પસંદ કરો",
    alreadyHaveAccount: "પહેલાથી રજીસ્ટ્રેશન કરેલ છે? અહીં લોગીન કરો",
    dontHaveAccount: "નવા વિદ્યાર્થી છો? પહેલા નવું રજીસ્ટ્રેશન કરો",
    otpSentMessage: "તમારા મોબાઈલ પર થોડા સમય માટેનો સુરક્ષા કોડ મોકલવામાં આવ્યો છે!",
    logInBtn: "ડિજિટલ ક્લાસમાં પ્રવેશો",
    signUpBtn: "રજીસ્ટ્રેશન કરો અને ભણવાનું શરૂ કરો"
  },
  mr: {
    appTitle: "ज्ञानबॉट (GyaanBot)",
    navHome: "मुख्य पृष्ठ",
    navAbout: "आमच्याबद्दल",
    navFeatures: "वैशिष्ट्ये",
    navLogin: "विद्यार्थी लॉगिन",
    navSignUp: "रजिस्ट्रेशन करा",
    navDashboard: "माझा वर्ग",
    navLogout: "बाहेर पडा",
    
    heroTitle: "प्रत्येक ग्रामीण शाळेसाठी AI शिक्षक",
    heroSubtitle: "इंटरनेटशिवाय चालणारे आवाज आणि व्हिडिओ शिक्षण. तुमच्या मातृभाषेत बोला, पहा आणि शिका!",
    getStarted: "आता शिकायला सुरुवात करा",
    howItWorks: "कार्यपद्धती पहा",
    connectivityLabel: "सिग्नल सामर्थ्य: कमकुवत नेटवर्क सुसंगत",
    offlineReadyTitle: "शून्य इंटरनेट सुसंगत",
    offlineReadyDesc: "पंचायत केंद्र किंवा बस स्टॉपवर एकदा व्हिडिओ डाउनलोड करा आणि घरी ऑफलाइन अभ्यासाचा आनंद घ्या.",
    lowInternetMode: "2G इंटरनेट समर्थन",
    lowInternetModeDesc: "ऑडिओ/व्हिडिओ स्वयंचलित कॉम्प्रेशन मुळे कमकुवत सिग्नलवरही अभ्यास न थांबता चालतो.",

    aboutTitle: "आमचे ध्येय आणि स्वप्न",
    aboutSubtitle: "स्मार्ट ऑफलाइन आर्टिफिशिअल इंटेलिजन्स याद्वारे शहरे आणि दुर्गम गावांना जवळ आणणे.",
    missionTitle: "ग्रामीण तरुणांचे सक्षमीकरण",
    missionDesc: "६०% पेक्षा जास्त ग्रामीण विद्यार्थ्यांकडे वीज वा चांगला इंटरनेट नाही. आम्ही हलका व वेगवान सॉफ्टवेअर बनवतो जो दर्जेदार मार्गदर्शन देतो.",
    visionTitle: "सहज आणि आनंददायक",
    visionDesc: "आम्ही मुलांना समजावण्यासाठी ॲनिमेटेड AI पात्रांचा वापर करतो, ज्यामुळे त्यांच्या मनात कुतूहल निर्माण होते.",
    ruralReachTitle: "स्थानिक बोलीभाषांचा आदर",
    ruralReachDesc: "स्थानिक भाषा समजण्यासाठी आणि सामान्य मोबाईल-टॅबलेटवर सुरळीत चालण्यासाठी खास डिझाइन केलेले.",

    featuresTitle: "विशेषतः ग्रामीण गरजांसाठी",
    featuresSubtitle: "वेगवान इंटरनेट नाही? वाचता येत नाही? काळजी करू नका! अभ्यास आता सोपा आहे.",
    featureTTS: "आवाजात ऐकण्याची सुविधा",
    featureTTSDesc: "कोणत्याही वाक्याला स्पर्श करा, आणि एक सुसंस्कृत आवाज ते वाचून दाखवेल! मुले स्वतंत्रपणे शब्दांचे उच्चार शिकू शकतील.",
    featureVideos: "इन्टरेक्टिव AI व्हिडिओ पाठ",
    featureVideosDesc: "ॲनिमेटेड कार्टून शिक्षक तुमच्या प्रश्नांचे उत्तर सोप्या व्हिडिओ आणि ॲनिमेशनद्वारे मनोरंजक पद्धतीने देतात.",
    featureOffline: "पूर्णपणे ऑफलाइन सुविधा",
    featureOfflineDesc: "पाठ, ऑडिओ आणि प्रश्नमंजुषा डिव्हाइसमध्ये जतन करा. कोणताही अतिरिक्त मोबाईल डेटा खर्च नाही.",
    featureQuizzes: "खेळत-खेळत प्रश्नमंजुषा",
    featureQuizzesDesc: "प्रत्येक व्हिडिओ पाठाच्या शेवटी सोपी प्रश्नमंजुषा. योग्य उत्तरे द्या, गुण वाढवा, आणि डिजिटल पदके मिळवा!",

    loginTitle: "वर्गात तुमचे स्वागत आहे!",
    signupTitle: "नवीन खाते तयार करा",
    mobileLabel: "१० अंकी मोबाईल नंबर नोंदवा",
    mobilePlaceholder: "उदा. 9876543210",
    sendOTP: "सुरक्षा कोड (OTP) पाठवा",
    otpLabel: "६ अंकी सुरक्षा कोड (OTP)",
    otpPlaceholder: "६ अंकी कोड दर्ज करा (बायपाससाठी १२३४५६ वापरा)",
    verifyOTP: "सुरक्षा कोड तपासा",
    fullNameLabel: "विद्यार्थ्याचे पूर्ण नाव",
    fullNamePlaceholder: "तुमचे नाव येथे लिहा",
    selectLanguageLabel: "तुमची अभ्यासाची भाषा निवडा",
    alreadyHaveAccount: "आधीच नोंदणी केली आहे? येथे लॉगिन करा",
    dontHaveAccount: "नवीन विद्यार्थी आहात? प्रथम नोंदणी करा",
    otpSentMessage: "तुमच्या मोबाईलवर तात्पुरता सुरक्षा कोड पाठवला गेला आहे!",
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
    
    heroTitle: "ஒவ்வொரு கிராம பள்ளிக்கும் AI ஆசிரியர்",
    heroSubtitle: "இணையம் இல்லாமல் இயங்கும் குரல் மற்றும் வீடியோ கல்வி. உங்கள் தாய்மொழியில் பேசவும், பார்க்கவும், கற்றுக்கொள்ளவும்!",
    getStarted: "இப்போதே கற்கத் தொடங்குங்கள்",
    howItWorks: "செயல்முறையை அறிந்திடுங்கள்",
    connectivityLabel: "சிக்னல் வலிமை: குறைந்த இணைய வசதிக்கு சிறந்தது",
    offlineReadyTitle: "முற்றிலும் ஆஃப்லைன்",
    offlineReadyDesc: "பஞ்சாயத்து அல்லது பேருந்து நிலையங்களில் ஒருமுறை வீடியோக்களைப் பதிவிறக்கி, எந்த நேரத்திலும் ஆஃப்லைனில் படிக்கலாம்.",
    lowInternetMode: "2G இணைய ஆதரவு",
    lowInternetModeDesc: "சிக்னல் குறைவாக இருந்தாலும் ஆடியோ/video-கடுமையான தடங்கல் இல்லாமல் வேகமாக இயங்கும்.",

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
    featureQuizzesDesc: "ప్రతి వీడియో పాఠం చివరలో ఒక చిన్న సరదా క్విజ్. సరైన సమాధానాలు చెప్పి, పాయింట్లు మ్యూచువల్స్ సాధించి, పతకాలు గెలవండి!",

    loginTitle: "తరగతి గదిలోకి స్వాగతం!",
    signupTitle: "కొత్త అకౌంట్ సృష్టించండి",
    mobileLabel: "10 అంకెల మొబైల్ నంబర్ दर्ज చేయండి",
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
