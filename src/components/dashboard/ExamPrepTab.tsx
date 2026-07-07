import React, { useState, useEffect } from 'react';
import { LanguageCode, User } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { speakText, stopSpeaking } from '../../utils/speech';
import { 
  Award, 
  Clock, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  BookOpen, 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Square, 
  RefreshCw, 
  Layers, 
  CheckSquare, 
  Languages, 
  Trash2, 
  TrendingUp, 
  Gauge, 
  ChevronDown, 
  ChevronUp, 
  User as UserIcon,
  Volume2
} from 'lucide-react';

interface ExamPrepTabProps {
  user: User;
  lang: LanguageCode;
  onUpdateUser: (updatedFields: Partial<User>) => void;
}

interface AttachedFileState {
  file: File;
  previewUrl: string;
  base64Data: string;
  mimeType: string;
}

interface SavedEvaluation {
  id: string;
  timestamp: string;
  examType: string;
  totalScore: string;
  maxMarks: string;
  accuracyRate: string;
  fullText: string;
}

interface ParsedQuestion {
  qNum: string;
  status: string; // Correct, Incorrect, Partially Correct, Unattempted
  marksAwarded: string;
  maxMarksForQ: string;
  feedback: string;
}

interface ParsedReport {
  totalScore: string;
  maxMarks: string;
  accuracyRate: string;
  questions: ParsedQuestion[];
  strengths: string[];
  areasOfImprovement: string[];
  expertAdvice: string[];
  isParsed: boolean;
}

// Multilingual translations localized for the Evaluator component
const LOCAL_TRANSLATIONS = {
  en: {
    suiteTitle: "Expert Exam Evaluator & Academic Mentor",
    suiteSubtitle: "Upload your handwritten answer sheet PDF or images. Compare against your question paper & answer key to receive instant scoring, detailed analysis, and constructive mentoring in your language.",
    examProfile: "Exam Profile / Track",
    selectExam: "Select Target Exam",
    custom: "Custom Exam Pattern",
    boardLabel: "Academic Board",
    maxMarks: "Maximum Marks",
    negMarking: "Negative Marking Scheme",
    negNone: "None",
    negOneThird: "-0.33 per wrong MCQ",
    negOneFourth: "-0.25 per wrong MCQ",
    studentSheet: "Student Handwritten Answer Sheet (PDF/Image)",
    questionPaper: "Original Question Paper (Optional)",
    answerKey: "Answer Key / Rubric (Optional)",
    pasteText: "Paste Original Text Instead",
    uploadDoc: "Upload Document/Image",
    textPlaceholderQP: "Type or paste the exam questions here...",
    textPlaceholderAK: "Type or paste the ideal answers, scoring rubric, or keywords here...",
    feedbackLanguage: "Feedback Language",
    evaluateBtn: "Analyze & Evaluate Sheet",
    evaluating: "AI Evaluating... Please wait",
    dragDrop: "Drag & drop file here or click to browse",
    allowedTypes: "Supports PDF and Images (PNG, JPG, WebP)",
    strengths: "Strengths",
    improvements: "Areas of Improvement",
    expertAdvice: "Expert Academic Advice",
    finalScore: "Final Assessment Score",
    accuracy: "Accuracy Rate",
    analysis: "Question-wise Rubric Review",
    pointsAwarded: "Marks Awarded",
    textReportTab: "Full Academic Report",
    visualDashboardTab: "Visual Performance Board",
    listenFeedback: "Speak Report (Audio)",
    stopAudio: "Stop Voice",
    generateSample: "Load Sample Practice Sheet",
    sampleDesc: "Don't have an answer sheet ready? Click below to load a sample UPSC History question, student response, and rubric to see the evaluator in action!",
    marks: "Marks",
    noFileSelected: "No file selected",
    historyTitle: "Past Evaluation Reports",
    historyEmpty: "No evaluation records yet. Upload an answer sheet above to begin your assessment history!",
    pointsEarned: "Earned +15 Academic Points for evaluation completion!",
    extraInstructions: "Extra Evaluation Instructions (e.g. 'focus on hand-writing', 'strict checking')",
    extraPlaceholder: "Specify extra instructions for checking (optional)..."
  },
  hi: {
    suiteTitle: "विशेषज्ञ परीक्षा मूल्यांकनकर्ता और शैक्षणिक मेंटर",
    suiteSubtitle: "अपनी हस्तलिखित उत्तर पुस्तिका (PDF या चित्र) अपलोड करें। अपनी परीक्षा के प्रश्न पत्र और उत्तर कुंजी के साथ तुलना करके त्वरित स्कोर, विस्तृत विश्लेषण और अपनी भाषा में रचनात्मक सलाह प्राप्त करें।",
    examProfile: "परीक्षा प्रोफ़ाइल / ट्रैक",
    selectExam: "लक्षित परीक्षा चुनें",
    custom: "कस्टम परीक्षा पैटर्न",
    boardLabel: "शैक्षणिक बोर्ड",
    maxMarks: "अधिकतम अंक",
    negMarking: "ऋणात्मक अंक योजना",
    negNone: "कोई नहीं",
    negOneThird: "प्रत्येक गलत MCQ पर -0.33 अंक",
    negOneFourth: "प्रत्येक गलत MCQ पर -0.25 अंक",
    studentSheet: "छात्र की हस्तलिखित उत्तर पुस्तिका (PDF/चित्र)",
    questionPaper: "मूल प्रश्न पत्र (वैकल्पिक)",
    answerKey: "उत्तर कुंजी / रूब्रिक (वैकल्पिक)",
    pasteText: "मूल पाठ यहाँ पेस्ट करें",
    uploadDoc: "दस्तावेज़/चित्र अपलोड करें",
    textPlaceholderQP: "यहाँ परीक्षा के प्रश्न टाइप करें या पेस्ट करें...",
    textPlaceholderAK: "यहाँ आदर्श उत्तर, मूल्यांकन रूब्रिक या कीवर्ड टाइप करें या पेस्ट करें...",
    feedbackLanguage: "फीडबैक की भाषा",
    evaluateBtn: "उत्तर पुस्तिका का विश्लेषण और मूल्यांकन करें",
    evaluating: "AI मूल्यांकन कर रहा है... कृपया प्रतीक्षा करें",
    dragDrop: "यहाँ फ़ाइल खींचें और छोड़ें या ब्राउज़ करने के लिए क्लिक करें",
    allowedTypes: "PDF और चित्र (PNG, JPG, WebP) का समर्थन करता है",
    strengths: "मजबूत पक्ष",
    improvements: "सुधार के क्षेत्र",
    expertAdvice: "विशेषज्ञ शैक्षणिक सलाह",
    finalScore: "अंतिम मूल्यांकन स्कोर",
    accuracy: "सटीकता दर",
    analysis: "प्रश्न-वार रूब्रिक समीक्षा",
    pointsAwarded: "प्रदान किए गए अंक",
    textReportTab: "पूर्ण शैक्षणिक रिपोर्ट",
    visualDashboardTab: "विजुअल परफॉर्मेंस बोर्ड",
    listenFeedback: "रिपोर्ट सुनें (ऑдио)",
    stopAudio: "आवाज बंद करें",
    generateSample: "नमूना अभ्यास पत्र लोड करें",
    sampleDesc: "क्या आपके पास उत्तर पुस्तिका तैयार नहीं है? इस मूल्यांकनकर्ता को काम करते देखने के लिए नमूना UPSC इतिहास प्रश्न, छात्र का उत्तर और रूब्रिक लोड करने के लिए नीचे क्लिक करें!",
    marks: "अंक",
    noFileSelected: "कोई फ़ाइल चुनी नहीं गई",
    historyTitle: "पिछले मूल्यांकन रिपोर्ट",
    historyEmpty: "अभी तक कोई मूल्यांकन रिकॉर्ड नहीं है। अपना मूल्यांकन इतिहास शुरू करने के लिए ऊपर एक उत्तर पुस्तिका अपलोड करें!",
    pointsEarned: "मूल्यांकन पूरा करने के लिए +15 शैक्षणिक अंक अर्जित किए!",
    extraInstructions: "अतिरिक्त मूल्यांकन निर्देश (जैसे 'हैंडराइटिंग पर ध्यान दें', 'सख्त चेकिंग करें')",
    extraPlaceholder: "चेकिंग के लिए अतिरिक्त निर्देश निर्दिष्ट करें (वैकल्पिक)..."
  },
  gu: {
    suiteTitle: "નિષ્ણાત પરીક્ષા મૂલ્યાંકનકાર અને શૈક્ષણిక માર્ગદર્શક",
    suiteSubtitle: "તમારી હસ્તલિખિત ઉત્તરવહી PDF અથવા છબીઓ અપલોડ કરો. ત્વરિત સ્કોરિંગ, વિગતવાર વિશ્લેષણ અને તમારી ભાષામાં રચનાત્મક માર્ગદર્શન મેળવવા માટે તમારા પ્રશ્નપત્ર અને ઉત્તર કી સાથે સરખામણી કરો.",
    examProfile: "પરીક્ષા પ્રોફાઇલ / ટ્રેક",
    selectExam: "લક્ષ્ય પરીક્ષા પસંદ કરો",
    custom: "કસ્ટમ પરીક્ષા પેટર્ન",
    boardLabel: "શૈક્ષણિક બોર્ડ",
    maxMarks: "મહત્તમ ગુણ",
    negMarking: "નકારાત્મક ગુણ પદ્ધતિ",
    negNone: "કોઈ નહીં",
    negOneThird: "-0.33 પ્રતિ ખોટા MCQ",
    negOneFourth: "-0.25 પ્રતિ ખોટા MCQ",
    studentSheet: "વિદ્યાર્થીની હસ્તલિખિત ઉત્તરવહી (PDF/છબી)",
    questionPaper: "મૂળ પ્રશ્નપત્ર (વૈકલ્પિક)",
    answerKey: "ઉત્તર કી / રૂબ્રિક (વૈકલ્પિક)",
    pasteText: "મૂળ લખાણ અહીં પેસ્ટ કરો",
    uploadDoc: "દસ્તાવેજ/છબી અપલોડ કરો",
    textPlaceholderQP: "અહીં પરીક્ષાના પ્રશ્નો લખો અથવા પેસ્ટ કરો...",
    textPlaceholderAK: "અહીં આદર્શ જવાબો, સ્કોરિંગ રૂબ્રિક અથવા કીવર્ડ્સ લખો અથવા પેસ્ટ કરો...",
    feedbackLanguage: "પ્રતિસાદની ભાષા",
    evaluateBtn: "પત્રકનું વિશ્લેષણ અને મૂલ્યાંકન કરો",
    evaluating: "AI મૂલ્યાંકન કરી રહ્યું છે... કૃપા કરીને રાહ જુઓ",
    dragDrop: "અહીં ફાઇલ ખેંચો અને છોડો અથવા બ્રાઉઝ કરવા માટે ક્લિક કરો",
    allowedTypes: "PDF અને છબીઓ (PNG, JPG, WebP) ને સપોર્ટ કરે છે",
    strengths: "મજબૂત પાસાઓ",
    improvements: "સુધારણાના ક્ષેત્રો",
    expertAdvice: "નિષ્ણાત શૈક્ષણिक સલાહ",
    finalScore: "અંતિમ મૂલ્યાંકન સ્કોર",
    accuracy: "ચોકસાઈ દર",
    analysis: "પ્રશ્ન-વાર રૂબ્રિક સમીક્ષા",
    pointsAwarded: "આપેલ ગુણ",
    textReportTab: "પૂર્ણ શૈક્ષણિક અહેવાલ",
    visualDashboardTab: "વિઝ્યુઅલ પરફોર્મન્સ બોર્ડ",
    listenFeedback: "અહેવાલ સાંભળો (ઓડિયો)",
    stopAudio: "અવાજ બંધ કરો",
    generateSample: "નમૂના ઉત્તરવહી લોડ કરો",
    sampleDesc: "ઉત્તરવહી તૈયાર નથી? આ મૂલ્યાંકનકારને કાર્યરત જોવા માટે નમૂના UPSC ઇતિહાસ પ્રશ્ન, વિદ્યાર્થીનો પ્રતિસાદ અને રૂબ્રિક લોડ કરવા માટે નીચે ક્લિક કરો!",
    marks: "ગુણ",
    noFileSelected: "કોઈ ફાઇલ પસંદ નથી",
    historyTitle: "ભૂતકાળના મૂલ્યાંકન અહેવાલો",
    historyEmpty: "હજી સુધી કોઈ મૂલ્યાંકન રેકોર્ડ નથી. તમારો મૂલ્યાંકન ઇતિહાસ શરૂ કરવા માટે ઉપર ઉત્તરવહી અપલોડ કરો!",
    pointsEarned: "મૂલ્યાંકન પૂર્ણ કરવા માટે +15 શૈક્ષણિક પોઇન્ટ મેળવ્યા!",
    extraInstructions: "વધારાની સૂચનાઓ (દા.ત. 'અક્ષરો પર ધ્યાન આપો', 'કડક ચેકિંગ')",
    extraPlaceholder: "મૂલ્યાંકન માટે વધારાની સૂચનાઓ લખો (વૈકલ્પિક)..."
  },
  mr: {
    suiteTitle: "तज्ज्ञ परीक्षा मूल्यमापनकर्ता आणि शैक्षणिक मार्गदर्शक",
    suiteSubtitle: "तुमची हस्तलिखित उत्तरपत्रिका PDF किंवा प्रतिमा अपलोड करा. तुमच्या प्रश्नपत्रिका आणि उत्तर पत्रिकेशी तुलना करून तुमच्या स्वतःच्या भाषेत त्वरित गुण, तपशीलवार विश्लेषण आणि रचनात्मक सल्ला मिळवा.",
    examProfile: "परीक्षा प्रोफाइल / ट्रॅक",
    selectExam: "लक्ष्य परीक्षा निवडा",
    custom: "सानुकूल परीक्षा नमुना",
    boardLabel: "शैक्षणिक बोर्ड",
    maxMarks: "कमाल गुण",
    negMarking: "नकारात्मक गुण पद्धत",
    negNone: "काहीही नाही",
    negOneThird: "प्रत्येक चुकीच्या MCQ साठी -0.33 गुण",
    negOneFourth: "प्रत्येक चुकीच्या MCQ साठी -0.25 गुण",
    studentSheet: "विद्यार्थ्याची हस्तलिखित उत्तरपत्रिका (PDF/प्रतिमा)",
    questionPaper: "मूळ प्रश्नपत्रिका (पर्यायी)",
    answerKey: "उत्तर पत्रिका / निकष (पर्यायी)",
    pasteText: "मूळ मजकूर येथे पेस्ट करा",
    uploadDoc: "दस्तऐवज/प्रतिमा अपलोड करा",
    textPlaceholderQP: "येथे परीक्षेचे प्रश्न टाईप करा किंवा पेस्ट करा...",
    textPlaceholderAK: "येथे आदर्श उत्तरे, गुण देण्याचे निकष किंवा महत्त्वाचे शब्द टाईप करा किंवा पेस्ट करा...",
    feedbackLanguage: "अभिप्राय भाषा",
    evaluateBtn: "उत्तरपत्रिकेचे विश्लेषण आणि मूल्यमापन करा",
    evaluating: "AI मूल्यमापन करत आहे... कृपया प्रतीक्षा करा",
    dragDrop: "येथे फाईल ड्रॅग करा आणि सोडा किंवा ब्राउझ करण्यासाठी क्लिक करा",
    allowedTypes: "PDF आणि प्रतिमा (PNG, JPG, WebP) चे समर्थन करते",
    strengths: "मजबूत बाजू",
    improvements: "सुधारणेचे क्षेत्र",
    expertAdvice: "तज्ज्ञ शैक्षणिक सल्ला",
    finalScore: "अंतिम मूल्यमापन गुण",
    accuracy: "अचूकता दर",
    analysis: "प्रश्न-निहाय मूल्यमापन",
    pointsAwarded: "दिलेले गुण",
    textReportTab: "पूर्ण शैक्षणिक अहवाल",
    visualDashboardTab: "विझ्युअल परफॉर्मन्स बोर्ड",
    listenFeedback: "अहवाल ऐका (ऑडिओ)",
    stopAudio: "आवाज बंद करा",
    generateSample: "नमुना उत्तरपत्रिका लोड करा",
    sampleDesc: "तुमच्याकडे उत्तरपत्रिका तयार नाही का? हे मूल्यमापन कसे चालते हे पाहण्यासाठी नमुना UPSC इतिहास प्रश्न, विद्यार्थ्याचे उत्तर आणि गुण देण्याचे निकष लोड करण्यासाठी खाली क्लिक करा!",
    marks: "गुण",
    noFileSelected: "कोणतीही फाईल निवडली नाही",
    historyTitle: "मागील मूल्यमापन अहवाल",
    historyEmpty: "अद्याप कोणताही मूल्यमापन रेकॉर्ड नाही. तुमचा मूल्यमापन इतिहास सुरू करण्यासाठी वर एक उत्तरपत्रिका अपलोड करा!",
    pointsEarned: "मूल्यमापन पूर्ण केल्याबद्दल +15 शैक्षणिक गुण मिळाले!",
    extraInstructions: "अतिरिक्त मूल्यमापन सूचना (उदा. 'हस्ताक्षरावर लक्ष केंद्रित करा', 'कडक तपासणी')",
    extraPlaceholder: "मूल्यमापनासाठी अतिरिक्त सूचना लिहा (पर्यायी)..."
  },
  ta: {
    suiteTitle: "தேர்வு மதிப்பீட்டாளர் & கல்வி வழிகாட்டி",
    suiteSubtitle: "உங்கள் கையெழுத்து விடைத்தாளின் PDF அல்லது படங்களை பதிவேற்றவும். உங்கள் கேள்வித்தாள் மற்றும் விடைக்குறிப்புடன் ஒப்பிட்டு, உங்கள் சொந்த மொழியிலேயே உடனடி மதிப்பெண், விரிவான பகுப்பாய்வு மற்றும் வழிகாட்டல்களைப் பெறுங்கள்.",
    examProfile: "தேர்வு சுயவிவரம்",
    selectExam: "தேர்வைத் தேர்ந்தெடுக்கவும்",
    custom: "தனிப்பயன் தேர்வு முறை",
    boardLabel: "கல்வி வாரியம்",
    maxMarks: "அதிகபட்ச மதிப்பெண்கள்",
    negMarking: "தவறான விடைகளுக்கான மதிப்பெண் குறைப்பு",
    negNone: "இல்லை",
    negOneThird: "-0.33 மதிப்பெண் குறைப்பு",
    negOneFourth: "-0.25 மதிப்பெண் குறைப்பு",
    studentSheet: "மாணவரின் கையெழுத்து விடைத்தாள் (PDF/படம்)",
    questionPaper: "அசல் கேள்வித்தாள் (விருப்பத்திற்குரியது)",
    answerKey: "விடைக்குறிப்பு / மதிப்பீட்டு விதிமுறை (விருப்பத்திற்குரியது)",
    pasteText: "அசல் உரையை ஒட்டவும்",
    uploadDoc: "ஆவணத்தை/படத்தைப் பதிவேற்றவும்",
    textPlaceholderQP: "தேர்வு வினாக்களை இங்கே தட்டச்சு செய்யவும் அல்லது ஒட்டவும்...",
    textPlaceholderAK: "மாதிரி விடைகள் அல்லது முக்கிய வார்த்தைகளை இங்கே தட்டச்சு செய்யவும் அல்லது ஒட்டவும்...",
    feedbackLanguage: "கருத்து மொழி",
    evaluateBtn: "விடைத்தாளை பகுப்பாய்வு செய்து மதிப்பிடவும்",
    evaluating: "AI மதிப்பிடுகிறது... தயவுசெய்து காத்திருக்கவும்",
    dragDrop: "கோப்பை இழுத்து இங்கே விடவும் அல்லது தேட கிளிக் செய்யவும்",
    allowedTypes: "PDF மற்றும் படங்களை (PNG, JPG, WebP) ஆதரிக்கிறது",
    strengths: "பலம்",
    improvements: "மேம்படுத்த வேண்டிய பகுதிகள்",
    expertAdvice: "வல்லுநரின் கல்வி ஆலோசனை",
    finalScore: "இறுதி மதிப்பீட்டு மதிப்பெண்",
    accuracy: "துல்லிய விகிதம்",
    analysis: "கேள்வி வாரியான மதிப்பீடு",
    pointsAwarded: "வழங்கப்பட்ட மதிப்பெண்கள்",
    textReportTab: "முழு கல்வி அறிக்கை",
    visualDashboardTab: "விஷுவல் செயல்திறன் பலகை",
    listenFeedback: "அறிக்கையைக் கேளுங்கள் (ஆடியோ)",
    stopAudio: "ஒலியை நிறுத்து",
    generateSample: "மாதிரி விடைத்தாளை ஏற்றுக",
    sampleDesc: "விடைத்தாள் தயாராக இல்லையா? இந்த மதிப்பீட்டாளர் எவ்வாறு செயல்படுகிறது என்பதைப் பார்க்க மாதிரி UPSC வரலாறு கேள்வி, மாணவர் விடை மற்றும் விதிமுறையை ஏற்ற கீழே கிளிக் செய்யவும்!",
    marks: "மதிப்பெண்கள்",
    noFileSelected: "கோப்பு எதுவும் தேர்ந்தெடுக்கப்படவில்லை",
    historyTitle: "கடந்தகால மதிப்பீட்டு அறிக்கைகள்",
    historyEmpty: "மதிப்பீட்டு பதிவுகள் எதுவும் இல்லை. உங்கள் மதிப்பீட்டு வரலாற்றைத் தொடங்க விடைத்தாளைப் பதிவேற்றவும்!",
    pointsEarned: "மதிப்பீடு முடிந்ததற்கு +15 கல்விப் புள்ளிகள் பெறப்பட்டன!",
    extraInstructions: "கூடுதல் மதிப்பீட்டு வழிமுறைகள் (எ.கா. 'கையெழுத்தை கவனிக்கவும்', 'கடுமையான திருத்தம்')",
    extraPlaceholder: "மதிப்பீட்டிற்கான கூடுதல் வழிமுறைகளைக் குறிப்பிடவும் (விருப்பத்திற்குரியது)..."
  },
  te: {
    suiteTitle: "పరీక్షా మూల్యాంకనకర్త & విద్యా మెంటార్",
    suiteSubtitle: "మీ చేతితో రాసిన జవాబు పత్రం యొక్క PDF లేదా చిత్రాలను అప్‌లోడ్ చేయండి. మీ ప్రశ్నపత్రం మరియు జవాబు కీతో పోల్చి మీ స్వంత భాషలోనే తక్షణ స్కోర్, విశ్లేషణ మరియు విద్యా మార్గదర్శకత్వాన్ని పొందండి.",
    examProfile: "పరీక్షా ప్రొఫైల్",
    selectExam: "పరీక్షను ఎంచుకోండి",
    custom: "కస్టమ్ పరీక్షా విధానం",
    boardLabel: "విద్యా బోర్డు",
    maxMarks: "గరిష్ట మార్కులు",
    negMarking: "నెగటివ్ మార్కింగ్ విధానం",
    negNone: "ఏమీ లేదు",
    negOneThird: "ప్రతి తప్పు సమాధానానికి -0.33 మార్కులు",
    negOneFourth: "ప్రతి తప్పు సమాధానానికి -0.25 మార్కులు",
    studentSheet: "విద్యార్థి చేతితో రాసిన జవాబు పత్రం (PDF/చిత్రం)",
    questionPaper: "అసలు ప్రశ్న పత్రం (ఐచ్ఛికం)",
    answerKey: "జవాబు కీ / రూబ్రిక్ (ఐచ్ఛికం)",
    pasteText: "అసలు వచనాన్ని ఇక్కడ పేస్ట్ చేయండి",
    uploadDoc: "పత్రాన్ని/చిత్రాన్ని అప్‌లోడ్ చేయండి",
    textPlaceholderQP: "పరీక్ష ప్రశ్నలను ఇక్కడ టైప్ చేయండి లేదా పేస్ట్ చేయండి...",
    textPlaceholderAK: "ఆదర్శ సమాధానాలు లేదా ముఖ్యమైన పదాలను ఇక్కడ టైప్ చేయండి లేదా పేస్ట్ చేయండి...",
    feedbackLanguage: "ఫీడ్‌బ్యాక్ భాష",
    evaluateBtn: "జవాబు పత్రాన్ని విశ్లేషించి మూల్యాంకనం చేయండి",
    evaluating: "AI మూల్యాంకనం చేస్తోంది... దయచేసి వేచి ఉండండి",
    dragDrop: "ఫైల్‌ను ఇక్కడ లాగి వదలండి లేదా బ్రౌజ్ చేయడానికి క్లిక్ చేయండి",
    allowedTypes: "PDF మరియు చిత్రాలను (PNG, JPG, WebP) సపోర్ట్ చేస్తుంది",
    strengths: "బలాలు",
    improvements: "మెరుగుపరచుకోవాల్సిన అంశాలు",
    expertAdvice: "నిపుణుల విద్యా సలహా",
    finalScore: "తుది మూల్యాంకన స్కోర్",
    accuracy: "ఖచ్చితత్వ రేటు",
    analysis: "ప్రశ్నల వారీ సమీక్ష",
    pointsAwarded: "కేటాయించిన మార్కులు",
    textReportTab: "పూర్తి విద్యా నివేదిక",
    visualDashboardTab: "విజువల్ పెర్ఫార్మెన్స్ బోర్డు",
    listenFeedback: "నివేదిక వినండి (ఆడియో)",
    stopAudio: "ఆడియో ఆపండి",
    generateSample: "నమూనా పత్రాన్ని లోడ్ చేయండి",
    sampleDesc: "జవాబు పత్రం సిద్ధంగా లేదా? ఈ మూల్యాంకనకర్త ఎలా పనిచేస్తుందో చూడటానికి నమూనా UPSC హిస్టరీ ప్రశ్న, విద్యార్థి జవాబు మరియు రూబ్రిక్‌ను లోడ్ చేయడానికి క్రింది క్లిక్ చేయండి!",
    marks: "మార్కులు",
    noFileSelected: "ఏ ఫైల్ ఎంపిక చేయబడలేదు",
    historyTitle: "గత మూల్యాంకన నివేదికలు",
    historyEmpty: "ఇంకా మూల్యాంకన రికార్డులు లేవు. మీ మూల్యాంకన చరిత్రను ప్రారంభించడానికి పైన ఒక జవాబు పత్రాన్ని అప్‌లోడ్ చేయండి!",
    pointsEarned: "మూల్యాంకనం విజయవంతంగా పూర్తి చేసినందుకు +15 విద్యా పాయింట్లు లభించాయి!",
    extraInstructions: "అదనపు ఆదేశాలు (ఉదా. 'రాతను గమనించండి', 'కఠినమైన మూల్యాంకనం')",
    extraPlaceholder: "మూల్యాంకనానికి అదనపు ఆదేశాలు రాయండి (ఐచ్ఛికం)..."
  }
};

const EXAM_PRESETS = [
  { id: 'upsc', name: 'UPSC IAS Civil Services (Mains)', maxMarks: 250, type: 'subjective', neg: 'None' },
  { id: 'jee', name: 'JEE Advanced (Mathematics Block)', maxMarks: 60, type: 'mixed', neg: '-1 per wrong answer' },
  { id: 'neet', name: 'NEET Practice Drill', maxMarks: 120, type: 'mcq', neg: '-1 per wrong MCQ' },
  { id: 'ssc', name: 'SSC CGL Tier II General Studies', maxMarks: 100, type: 'mcq', neg: '-0.25 per wrong MCQ' },
  { id: 'nmms', name: 'NMMS Scholastic Scholarship Practice', maxMarks: 90, type: 'mcq', neg: 'None' },
  { id: 'jnvst', name: 'JNVST Navodaya Mathematics Test', maxMarks: 50, type: 'mcq', neg: 'None' },
  { id: 'custom', name: 'Custom Exam Pattern', maxMarks: 100, type: 'mixed', neg: 'None' }
];

export default function ExamPrepTab({ user, lang, onUpdateUser }: ExamPrepTabProps) {
  const currentLang = LOCAL_TRANSLATIONS[lang] ? lang : 'en';
  const t = LOCAL_TRANSLATIONS[currentLang];

  // Form State parameters
  const [selectedPresetId, setSelectedPresetId] = useState('upsc');
  const [customExamName, setCustomExamName] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [negativeMarking, setNegativeMarking] = useState('None');
  const [academicBoard, setAcademicBoard] = useState(user?.board || 'CBSE');
  const [feedbackLang, setFeedbackLang] = useState<LanguageCode>(lang);
  const [extraInstructions, setExtraInstructions] = useState('');

  // --- SIMULATED LIVE EXAM STATES ---
  const [mode, setMode] = useState<'simulated' | 'standard'>('simulated'); // Default to simulated mode
  const [simStage, setSimStage] = useState<'setup' | 'generating' | 'live' | 'scan_upload'>('setup');
  const [simTopic, setSimTopic] = useState('');
  const [simNumQuestions, setSimNumQuestions] = useState(3);
  const [simQuestionPaper, setSimQuestionPaper] = useState('');
  const [simAnswerKey, setSimAnswerKey] = useState('');
  const [simTimeRemaining, setSimTimeRemaining] = useState(0);
  const [simTimeDuration, setSimTimeDuration] = useState(30);
  const [simIsTimerRunning, setSimIsTimerRunning] = useState(false);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [typedAnswersText, setTypedAnswersText] = useState('');
  const [answersSubmissionMode, setAnswersSubmissionMode] = useState<'upload' | 'text'>('upload');

  // Uploaded Files State
  const [studentAnswersFile, setStudentAnswersFile] = useState<AttachedFileState | null>(null);
  const [questionPaperFile, setQuestionPaperFile] = useState<AttachedFileState | null>(null);
  const [answerKeyFile, setAnswerKeyFile] = useState<AttachedFileState | null>(null);

  // Raw text modes
  const [qpMode, setQpMode] = useState<'text' | 'file'>('text');
  const [akMode, setAkMode] = useState<'text' | 'file'>('text');
  const [questionPaperText, setQuestionPaperText] = useState('');
  const [answerKeyText, setAnswerKeyText] = useState('');

  // Loading & evaluation progression
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationStep, setEvaluationStep] = useState(0);
  const [evaluationReport, setEvaluationReport] = useState<string>('');
  const [parsedReport, setParsedReport] = useState<ParsedReport | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<'dashboard' | 'report'>('dashboard');
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio Reading state
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Drag and Drop Drag states
  const [isAnswersDragging, setIsAnswersDragging] = useState(false);

  // Load Saved History
  const [history, setHistory] = useState<SavedEvaluation[]>(() => {
    try {
      const saved = localStorage.getItem('gyaanbot_eval_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync state parameters with preset selection
  useEffect(() => {
    const preset = EXAM_PRESETS.find(p => p.id === selectedPresetId);
    if (preset && preset.id !== 'custom') {
      setMaxMarks(preset.maxMarks);
      setNegativeMarking(preset.neg);
    }
  }, [selectedPresetId]);

  // Timer countdown effect
  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    if (mode === 'simulated' && simStage === 'live' && simIsTimerRunning) {
      timerInterval = setInterval(() => {
        setSimTimeRemaining(prev => {
          if (prev <= 1) {
            if (timerInterval) clearInterval(timerInterval);
            setSimIsTimerRunning(false);
            setSimStage('scan_upload');
            alert(lang === 'hi' 
              ? "समय समाप्त! कृपया अपनी उत्तर पुस्तिका अपलोड करें।" 
              : "Time is up! Your live exam timer has run out. Please scan and upload your answer sheet now."
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [mode, simStage, simIsTimerRunning]);

  // Handle Animated Evaluation Progression steps
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isEvaluating) {
      interval = setInterval(() => {
        setEvaluationStep(prev => (prev < 3 ? prev + 1 : prev));
      }, 3500);
    } else {
      setEvaluationStep(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isEvaluating]);

  // API Trigger: Generate dynamic exam paper with answer key
  const handleGenerateExam = async () => {
    setIsGeneratingExam(true);
    setErrorMsg(null);
    setSimStage('generating');
    
    try {
      const examNameStr = selectedPresetId === 'custom' 
        ? (customExamName || "Custom Exam") 
        : EXAM_PRESETS.find(p => p.id === selectedPresetId)?.name;

      const response = await fetch('/api/gemini/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examType: examNameStr,
          topic: simTopic || "General Syllabus Topics",
          maxMarks: maxMarks,
          numQuestions: simNumQuestions,
          board: academicBoard,
          lang: feedbackLang
        })
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.message || "Failed to generate exam questions.");
      }

      setSimQuestionPaper(resData.questionPaper);
      setSimAnswerKey(resData.answerKey);
      
      const durationMin = resData.duration || (simNumQuestions * 10); // fallback 10 mins per question
      setSimTimeDuration(durationMin);
      setSimTimeRemaining(durationMin * 60);
      setSimStage('live');
      setSimIsTimerRunning(true);

    } catch (err: any) {
      console.error("Exam generation error:", err);
      setErrorMsg(err.message || "Unable to generate your live exam paper. Please check connection and try again.");
      setSimStage('setup');
    } finally {
      setIsGeneratingExam(false);
    }
  };

  // Convert typed text responses to a neat visual canvas image for vision-based evaluate API
  const createAnswersImageFromText = (text: string): AttachedFileState => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Draw background
      ctx.fillStyle = '#FAF9F6'; // Warm ivory paper color
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw lined paper margins/notebook lines
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      for (let y = 100; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Draw standard left red margin line
      ctx.strokeStyle = '#FCA5A5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(120, 0);
      ctx.lineTo(120, canvas.height);
      ctx.stroke();
      
      // Draw text with handwritten/typewriter font feel
      ctx.fillStyle = '#1E293B'; // Dark slate ink
      ctx.font = '15px "Courier New", Courier, monospace';
      
      const examNameStr = selectedPresetId === 'custom' 
        ? (customExamName || "Custom Exam") 
        : EXAM_PRESETS.find(p => p.id === selectedPresetId)?.name;

      ctx.fillText(`EXAM: ${examNameStr}`, 150, 60);
      ctx.fillText(`DATE: ${new Date().toLocaleDateString()}`, 550, 60);
      
      const lines = text.split('\n');
      let y = 130;
      
      for (let line of lines) {
        if (y > canvas.height - 60) break;
        // Word wrap handling
        const words = line.split(' ');
        let currentLine = '';
        for (let word of words) {
          const testLine = currentLine + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > 580 && currentLine.length > 0) {
            ctx.fillText(currentLine, 150, y);
            y += 40;
            currentLine = word + ' ';
          } else {
            currentLine = testLine;
          }
        }
        ctx.fillText(currentLine, 150, y);
        y += 40;
      }
    }
    
    const dataUrl = canvas.toDataURL('image/png');
    return {
      file: new File([], "typed_exam_answers.png", { type: "image/png" }),
      previewUrl: dataUrl,
      base64Data: dataUrl,
      mimeType: "image/png"
    };
  };

  // Base64 File Loader Helper
  const handleFileLoad = (file: File, setter: (state: AttachedFileState | null) => void) => {
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      alert(lang === 'hi' ? 'केवल PDF या चित्र फ़ाइलें स्वीकार की जाती हैं!' : 'Only PDF documents or image files are allowed!');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setter({
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        base64Data: reader.result as string,
        mimeType: file.type
      });
    };
    reader.onerror = () => {
      setErrorMsg("Error parsing uploaded file. Please retry.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsAnswersDragging(true);
  };

  const handleDragLeave = () => {
    setIsAnswersDragging(false);
  };

  const handleDropAnswers = (e: React.DragEvent) => {
    e.preventDefault();
    setIsAnswersDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileLoad(e.dataTransfer.files[0], setStudentAnswersFile);
    }
  };

  // Pre-load a gorgeous UPSC History Mains sample
  const loadSampleData = () => {
    setSelectedPresetId('upsc');
    setMaxMarks(50);
    setNegativeMarking('None');
    setAcademicBoard('UPSC IAS Mains guidelines');
    setExtraInstructions('Evaluate depth of content, structured arguments, and handwriting legibility.');
    setQpMode('text');
    setAkMode('text');
    setQuestionPaperText(
      `Q1. Critically analyze the socio-religious reform movements of nineteenth-century India and how they paved the way for modern Indian nationalism. (25 Marks)\n\nQ2. Explain the significance of the Dandi March (1930) in the Indian National Movement and its impact on British administrative policies. (25 Marks)`
    );
    setAnswerKeyText(
      `Q1 Rubric (25 Marks):\n- Keywords: Raja Ram Mohan Roy, Brahmo Samaj, Ishwar Chandra Vidyasagar, Arya Samaj, social reforms (Sati abolition, widow remarriage), national consciousness.\n- Critical points: Revitalized traditional society, challenged orthodox religious practices, unified reformist thoughts into political nationalism.\n- Score: 20-25 marks for highly structured historical connections; 10-19 marks for basic descriptive details.\n\nQ2 Rubric (25 Marks):\n- Keywords: Civil Disobedience, Salt Satyagraha, Mahatma Gandhi, mass mobilization, violation of salt laws, Round Table Conference.\n- Significance: Unified the rural-urban population, shattered British monopoly, showed non-violent strength globally.\n- Score: 20-25 marks if both consequences and global implications are highlighted.`
    );
    // Lightweight transparent grey placeholder image mock representing scanned answer handwriting
    setStudentAnswersFile({
      file: new File([], "sample_upsc_answers.png", { type: "image/png" }),
      previewUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      base64Data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      mimeType: "image/png"
    });
    setErrorMsg(null);
  };

  // Score Parser & Analysis Extractor
  function parseEvaluationReport(text: string): ParsedReport {
    const result: ParsedReport = {
      totalScore: "",
      maxMarks: "",
      accuracyRate: "",
      questions: [],
      strengths: [],
      areasOfImprovement: [],
      expertAdvice: [],
      isParsed: false
    };

    try {
      // 1. Parse Final Score
      const scoreSectionMatch = text.match(/### 1\.\s*Final\s*Score([\s\S]*?)(?=### 2|$)/i);
      if (scoreSectionMatch) {
        const scoreSec = scoreSectionMatch[1];
        const totalScoreMatch = scoreSec.match(/Total\s*Score:\s*\*?\[?([0-9.]+)\s*\/\s*([0-9.]+)\]?/i) || 
                                scoreSec.match(/Total\s*Score:\s*\*?\*?([0-9.]+)\s*\/\s*([0-9.]+)/i);
        if (totalScoreMatch) {
          result.totalScore = totalScoreMatch[1];
          result.maxMarks = totalScoreMatch[2];
        }
        const accuracyMatch = scoreSec.match(/Accuracy\s*Rate:\s*\*?\*?([0-9.]+)/i);
        if (accuracyMatch) {
          result.accuracyRate = accuracyMatch[1];
        }
      }

      // 2. Parse Question-wise Analysis
      const questionSectionMatch = text.match(/### 2\.\s*Question-wise\s*Analysis([\s\S]*?)(?=### 3|$)/i);
      if (questionSectionMatch) {
        const questionsBlock = questionSectionMatch[1];
        const qSplit = questionsBlock.split(/\*\s*\*\*?Q(\d+)\*\*?:?/i);
        if (qSplit.length > 1) {
          for (let i = 1; i < qSplit.length; i += 2) {
            const qNum = qSplit[i];
            const qBody = qSplit[i + 1] || "";
            
            let status = "Partially Correct";
            const statusMatch = qBody.match(/^\s*\*?\*?\[?(Correct|Incorrect|Partially\s*Correct|Unattempted)\]?/i);
            if (statusMatch) {
              status = statusMatch[1].trim();
            } else if (qBody.toLowerCase().includes("partially correct")) {
              status = "Partially Correct";
            } else if (qBody.toLowerCase().includes("incorrect")) {
              status = "Incorrect";
            } else if (qBody.toLowerCase().includes("correct")) {
              status = "Correct";
            } else if (qBody.toLowerCase().includes("unattempted")) {
              status = "Unattempted";
            }

            let marksAwarded = "0";
            let maxMarksForQ = "10";
            const marksMatch = qBody.match(/Marks\s*Awarded:\s*\*?\*?([0-9.]+)\s*\/\s*([0-9.]+)/i);
            if (marksMatch) {
              marksAwarded = marksMatch[1];
              maxMarksForQ = marksMatch[2];
            }

            let feedback = "";
            const feedbackMatch = qBody.match(/Feedback:\s*\*?\*?([\s\S]*?)(?=\*|\n\s*\n|$)/i);
            if (feedbackMatch) {
              feedback = feedbackMatch[1].trim();
            } else {
              feedback = qBody.replace(/Marks\s*Awarded:.*?(\n|$)/i, "").replace(/\[?(Correct|Incorrect|Partially\s*Correct|Unattempted)\]?/gi, "").trim();
            }

            result.questions.push({
              qNum,
              status,
              marksAwarded,
              maxMarksForQ,
              feedback
            });
          }
        }
      }

      // 3. Parse Weaknesses & Strengths
      const weaknessSectionMatch = text.match(/### 3\.\s*Core\s*Weakness\s*&\s*Strengths([\s\S]*?)(?=### 4|$)/i);
      if (weaknessSectionMatch) {
        const weaknessBlock = weaknessSectionMatch[1];
        
        const strengthsMatch = weaknessBlock.match(/Strengths:\s*\*?\*?([\s\S]*?)(?=Areas\s*of|$)/i);
        if (strengthsMatch) {
          result.strengths = strengthsMatch[1]
            .split(/\n|\*|-/)
            .map(s => s.trim())
            .filter(s => s.length > 2 && !s.toLowerCase().startsWith("strengths") && !s.toLowerCase().includes("areas of"));
        }

        const improvementsMatch = weaknessBlock.match(/Areas\s*of\s*Improvement:\s*\*?\*?([\s\S]*?)$/i);
        if (improvementsMatch) {
          result.areasOfImprovement = improvementsMatch[1]
            .split(/\n|\*|-/)
            .map(s => s.trim())
            .filter(s => s.length > 2 && !s.toLowerCase().startsWith("areas of"));
        }
      }

      // 4. Parse Expert Advice
      const adviceSectionMatch = text.match(/### 4\.\s*Expert\s*Advice([\s\S]*?)$/i);
      if (adviceSectionMatch) {
        const adviceSec = adviceSectionMatch[1];
        result.expertAdvice = adviceSec
          .split(/\n|\*|-/)
          .map(a => a.trim())
          .filter(a => a.length > 2);
      }

      if (result.totalScore && result.maxMarks) {
        const obtained = parseFloat(result.totalScore);
        const total = parseFloat(result.maxMarks);
        if (total > 0 && !result.accuracyRate) {
          result.accuracyRate = Math.round((obtained / total) * 100).toString();
        }
      }

      if (result.totalScore || result.questions.length > 0) {
        result.isParsed = true;
      }
    } catch (err) {
      console.warn("Failed parsing report structure. Falling back to clean text formatting.", err);
    }

    return result;
  }

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('gyaanbot_eval_history', JSON.stringify(updated));
  };

  const loadPastEvaluation = (record: SavedEvaluation) => {
    setEvaluationReport(record.fullText);
    const parsed = parseEvaluationReport(record.fullText);
    setParsedReport(parsed);
    setActiveReportTab('dashboard');
    setTimeout(() => {
      document.getElementById('evaluation-results-anchor')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const clearCurrentFiles = () => {
    setStudentAnswersFile(null);
    setQuestionPaperFile(null);
    setAnswerKeyFile(null);
    setQuestionPaperText('');
    setAnswerKeyText('');
    setTypedAnswersText('');
    setEvaluationReport('');
    setParsedReport(null);
    setErrorMsg(null);
  };

  const handleToggleAudioReading = () => {
    if (isAudioPlaying) {
      stopSpeaking();
      setIsAudioPlaying(false);
    } else {
      setIsAudioPlaying(true);
      // Read a friendly high-level audio summary
      let readText = `Your exam evaluation is complete! `;
      if (parsedReport && parsedReport.isParsed) {
        readText += `You scored ${parsedReport.totalScore} marks out of ${parsedReport.maxMarks} with a correctness quotient of ${parsedReport.accuracyRate} percent. `;
        if (parsedReport.strengths && parsedReport.strengths.length > 0) {
          readText += `Your key strengths are: ${parsedReport.strengths[0]}. `;
        }
        if (parsedReport.areasOfImprovement && parsedReport.areasOfImprovement.length > 0) {
          readText += `An area to improve is: ${parsedReport.areasOfImprovement[0]}. `;
        }
      } else {
        readText += evaluationReport.substring(0, 200) + "...";
      }
      speakText(readText, feedbackLang, "Swami AI", "🤖 Swami AI", () => {
        setIsAudioPlaying(false);
      });
    }
  };

  const handleStartEvaluation = async () => {
    setIsEvaluating(true);
    setEvaluationStep(0);
    setErrorMsg(null);
    setEvaluationReport('');
    setParsedReport(null);

    const progressInterval = setInterval(() => {
      setEvaluationStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 4500);

    let targetStudentFile = studentAnswersFile;
    if (mode === 'simulated' && answersSubmissionMode === 'text') {
      if (!typedAnswersText.trim()) {
        setErrorMsg(lang === 'hi' ? "कृपया मूल्यांकन से पहले अपने उत्तर टाइप करें।" : "Please type your answers before requesting evaluation.");
        setIsEvaluating(false);
        clearInterval(progressInterval);
        return;
      }
      try {
        const generated = await createAnswersImageFromText(typedAnswersText);
        targetStudentFile = generated;
      } catch (err: any) {
        setErrorMsg("Failed to synthesize handwriting canvas from typed text: " + err.message);
        setIsEvaluating(false);
        clearInterval(progressInterval);
        return;
      }
    }

    if (!targetStudentFile) {
      setErrorMsg(lang === 'hi' ? "समीक्षा के लिए कोई उत्तर पुस्तिका नहीं मिली! कृपया फ़ाइल अपलोड करें।" : "No answer sheet found for evaluation! Please upload or type answers.");
      setIsEvaluating(false);
      clearInterval(progressInterval);
      return;
    }

    try {
      const response = await fetch("/api/gemini/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentAnswersFile: targetStudentFile ? { data: targetStudentFile.base64Data, mimeType: targetStudentFile.mimeType } : null,
          questionPaperFile: questionPaperFile ? { data: questionPaperFile.base64Data, mimeType: questionPaperFile.mimeType } : null,
          answerKeyFile: answerKeyFile ? { data: answerKeyFile.base64Data, mimeType: answerKeyFile.mimeType } : null,
          questionPaperText: mode === 'simulated' ? simQuestionPaper : questionPaperText,
          answerKeyText: mode === 'simulated' ? simAnswerKey : answerKeyText,
          examType: selectedPresetId === 'custom' ? (customExamName || "Custom Exam") : (EXAM_PRESETS.find(p => p.id === selectedPresetId)?.name || "Academic Exam"),
          maxMarks: maxMarks,
          negativeMarking: negativeMarking,
          board: academicBoard,
          lang: feedbackLang
        })
      });

      const data = await response.json();
      clearInterval(progressInterval);

      if (data.success) {
        setEvaluationStep(3); // Complete progress
        setEvaluationReport(data.text);
        const parsed = parseEvaluationReport(data.text);
        setParsedReport(parsed);
        
        // Save to local history
        const newRecord: SavedEvaluation = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleString(),
          examType: selectedPresetId === 'custom' ? (customExamName || "Custom Exam") : (EXAM_PRESETS.find(p => p.id === selectedPresetId)?.name || "Academic Exam"),
          totalScore: parsed.totalScore || "Assessed",
          maxMarks: maxMarks.toString(),
          accuracyRate: parsed.accuracyRate || "N/A",
          fullText: data.text
        };
        const updatedHistory = [newRecord, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('gyaanbot_eval_history', JSON.stringify(updatedHistory));

        // Award points to student
        if (user) {
          const currentPoints = user.totalPoints || 0;
          onUpdateUser({ totalPoints: currentPoints + 15 });
        }

        // Scroll to results anchor
        setTimeout(() => {
          document.getElementById('evaluation-results-anchor')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);

      } else {
        setErrorMsg(data.message || "The evaluation server was busy or encountered an error. Please retry.");
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setErrorMsg(err.message || "Connection timeout. Please check your internet connection.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const FormattedText = ({ text }: { text: string }) => {
    if (!text) return null;
    return (
      <div className="space-y-4 font-sans text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line text-left">
        {text.split('\n').map((line, idx) => {
          let cleanLine = line;
          let isHeading1 = false;
          let isHeading2 = false;
          let isHeading3 = false;
          let isBullet = false;

          if (cleanLine.startsWith('### ')) {
            isHeading3 = true;
            cleanLine = cleanLine.substring(4);
          } else if (cleanLine.startsWith('## ')) {
            isHeading2 = true;
            cleanLine = cleanLine.substring(3);
          } else if (cleanLine.startsWith('# ')) {
            isHeading1 = true;
            cleanLine = cleanLine.substring(2);
          } else if (cleanLine.trim().startsWith('* ') || cleanLine.trim().startsWith('- ')) {
            isBullet = true;
            cleanLine = cleanLine.trim().substring(2);
          }

          // Process bold tags: **text**
          const boldParts = cleanLine.split(/\*\*([\s\S]*?)\*\*/g);
          const lineContent = boldParts.map((part, pIdx) => {
            if (pIdx % 2 === 1) {
              return <strong key={pIdx} className="font-extrabold text-gray-900">{part}</strong>;
            }
            return part;
          });

          if (isHeading1) {
            return <h1 key={idx} className="text-lg font-black text-indigo-950 mt-5 border-b pb-1">{lineContent}</h1>;
          }
          if (isHeading2) {
            return <h2 key={idx} className="text-base font-black text-[#3D405B] mt-4">{lineContent}</h2>;
          }
          if (isHeading3) {
            return <h3 key={idx} className="text-sm font-bold text-indigo-950 mt-3 flex items-center gap-1.5 border-b border-gray-100 pb-1">{lineContent}</h3>;
          }
          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-4">
                <span className="text-[#81B29A] mt-1 shrink-0">•</span>
                <span>{lineContent}</span>
              </div>
            );
          }
          if (!line.trim()) {
            return <div key={idx} className="h-2" />;
          }
          return <p key={idx} className="pl-1">{lineContent}</p>;
        })}
      </div>
    );
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER HERO BANNER */}
      <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <h2 className="font-display font-black text-xl text-[#3D405B] flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500 animate-pulse" />
            {t.suiteTitle}
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            {t.suiteSubtitle}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 shrink-0">
          <span className="text-[10px] bg-rose-50 text-rose-800 px-3 py-1.5 border border-rose-100 rounded-full font-mono uppercase tracking-wide font-extrabold flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-rose-500 animate-spin" />
            AI Pro Mentor 2026
          </span>
          {user?.totalPoints !== undefined && (
            <span className="text-[10px] bg-amber-50 text-amber-800 px-3 py-1.5 border border-amber-200 rounded-full font-mono font-bold">
              🪙 {user.totalPoints} Points
            </span>
          )}
        </div>
      </div>

      {/* MODE SELECTOR WORKFLOW TABS */}
      <div className="bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/50 flex w-full max-w-xl mx-auto gap-1">
        <button
          onClick={() => { setMode('simulated'); setErrorMsg(null); }}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            mode === 'simulated'
              ? 'bg-[#3D405B] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800 bg-transparent'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>📝 Simulated Live AI Exam</span>
        </button>
        <button
          onClick={() => { setMode('standard'); setErrorMsg(null); }}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            mode === 'standard'
              ? 'bg-[#3D405B] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800 bg-transparent'
          }`}
        >
          <UploadCloud className="h-4 w-4" />
          <span>📤 Direct Answer Review</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        
        {/* LEFT COLUMN: MAIN WORKSPACE COLS */}
        <div className="lg:col-span-8 space-y-6">

          {/* ==============================================
              PATHWAY A: SIMULATED LIVE AI EXAM FLOW
              ============================================== */}
          {mode === 'simulated' && (
            <div className="space-y-6">

              {/* DEVELOPER TESTING SANDBOX COMPONENT */}
              <div className="bg-[#EEF2F6] border-2 border-indigo-200 rounded-3xl p-5 shadow-xs space-y-3 text-left">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🛠️</span>
                    <div>
                      <h4 className="font-display font-extrabold text-indigo-950 text-xs uppercase tracking-wider">
                        Developer Testing Sandbox
                      </h4>
                      <p className="text-[10px] text-indigo-700/80 font-medium">
                        Use these helper controls to instantly simulate and verify the "Submit & Upload" and evaluation pipelines.
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-indigo-100 text-indigo-800 font-mono px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shrink-0">
                    DEV TOOLS ACTIVE
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      setSimTopic("Socio-Religious Reform Movements");
                      setSelectedPresetId("upsc");
                      setMaxMarks(50);
                      setAcademicBoard("UPSC IAS Mains guidelines");
                      // Trigger generate
                      setTimeout(() => {
                        handleGenerateExam();
                      }, 100);
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>⚡ 1. Auto-Generate Exam Paper</span>
                  </button>

                  <button
                    type="button"
                    disabled={simStage !== 'live'}
                    onClick={() => {
                      setSimIsTimerRunning(false);
                      setSimStage('scan_upload');
                      setAnswersSubmissionMode('text');
                      setTypedAnswersText(
                        `Question 1: Socio-religious reform movements of nineteenth-century India pioneered modernization by challenging dogmas, abolishing Sati, and promoting educational reforms.\n\nQuestion 2: The Dandi March of 1930 served as a pivotal point for mass mobilization, directly breaking salt monopoly and rallying millions to civil disobedience.`
                      );
                    }}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>⚡ 2. Test "Submit & Upload" (Skip Timer & Pre-Fill)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimStage('setup');
                      clearCurrentFiles();
                    }}
                    className="px-3.5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[11px] font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                  >
                    Reset Sandbox
                  </button>
                </div>
                
                <p className="text-[10px] text-gray-400 italic font-sans leading-relaxed">
                  * Tip: Click <strong className="text-indigo-900">Step 1</strong> to auto-generate a real exam paper using Gemini. Once active, click <strong className="text-rose-900">Step 2</strong> to trigger the "Submit & Upload" sequence with mock student answers loaded instantly, then click "Evaluate Exam" to verify!
                </p>
              </div>

              {/* STAGE 1: PROFILE & SYLLABUS SETUP */}
              {simStage === 'setup' && (
                <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs space-y-6 animate-fade-in">
                  <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                    <h3 className="font-display font-bold text-[#3D405B] text-base flex items-center gap-2">
                      <Layers className="h-5 w-5 text-indigo-500" />
                      Configure Your Simulated Exam
                    </h3>
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 p-1 px-2.5 rounded-full font-mono uppercase font-bold">
                      Step 1 of 3
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Exam Profile */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">{t.examProfile}</label>
                      <select 
                        value={selectedPresetId}
                        onChange={(e) => setSelectedPresetId(e.target.value)}
                        className="w-full text-xs p-3 bg-gray-55 border border-gray-200 rounded-xl font-sans focus:border-indigo-400 focus:outline-none"
                      >
                        {EXAM_PRESETS.map(preset => (
                          <option key={preset.id} value={preset.id}>{preset.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Board Selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">{t.boardLabel}</label>
                      <input 
                        type="text"
                        value={academicBoard}
                        onChange={(e) => setAcademicBoard(e.target.value)}
                        placeholder="e.g. CBSE, ICSE, UPMSP, BIEAP"
                        className="w-full text-xs p-3 bg-gray-55 border border-gray-200 rounded-xl font-sans focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Custom Exam Title */}
                  {selectedPresetId === 'custom' && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-xs font-bold text-gray-500">{t.custom}</label>
                      <input 
                        type="text"
                        value={customExamName}
                        onChange={(e) => setCustomExamName(e.target.value)}
                        placeholder="Type the custom exam or subject name..."
                        className="w-full text-xs p-3 bg-gray-55 border border-gray-200 rounded-xl font-sans focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Target Topic and Question count */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                        <span>🎯 Target Chapter / Specific Topic</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input 
                        type="text"
                        value={simTopic}
                        onChange={(e) => setSimTopic(e.target.value)}
                        placeholder="e.g. Mughal Architecture, Rotational Mechanics, Cellular Respiration"
                        className="w-full text-xs p-3 bg-gray-55 border border-gray-200 rounded-xl font-sans focus:border-indigo-400 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Number of Questions</label>
                      <select
                        value={simNumQuestions}
                        onChange={(e) => setSimNumQuestions(Number(e.target.value))}
                        className="w-full text-xs p-3 bg-gray-55 border border-gray-200 rounded-xl font-sans focus:border-indigo-400 focus:outline-none"
                      >
                        <option value={2}>2 Questions (Quick Sprint)</option>
                        <option value={3}>3 Questions (Standard Practice)</option>
                        <option value={5}>5 Questions (Rigorous Test)</option>
                        <option value={8}>8 Questions (Full Length Exam)</option>
                      </select>
                    </div>
                  </div>

                  {/* Max Marks & Penalty */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Max Marks Allocated</label>
                      <input 
                        type="number"
                        value={maxMarks}
                        onChange={(e) => setMaxMarks(Number(e.target.value))}
                        className="w-full text-xs p-3 bg-gray-55 border border-gray-200 rounded-xl font-sans focus:border-indigo-400 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">{t.negMarking}</label>
                      <select 
                        value={negativeMarking}
                        onChange={(e) => setNegativeMarking(e.target.value)}
                        className="w-full text-xs p-3 bg-gray-55 border border-gray-200 rounded-xl font-sans focus:border-indigo-400 focus:outline-none"
                      >
                        <option value="None">{t.negNone}</option>
                        <option value="-0.33 per wrong MCQ">{t.negOneThird}</option>
                        <option value="-0.25 per wrong MCQ">{t.negOneFourth}</option>
                        <option value="-1 per wrong subjective question">Strict penalty (-1 mark)</option>
                      </select>
                    </div>
                  </div>

                  {/* Language and Extra instructions */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                        <Languages className="h-4 w-4 text-emerald-500" />
                        Preferred Assessment Language
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {(['en', 'hi', 'gu', 'mr', 'ta', 'te'] as LanguageCode[]).map(langCode => (
                          <button
                            key={langCode}
                            type="button"
                            onClick={() => setFeedbackLang(langCode)}
                            className={`text-[10px] font-bold px-3 py-1.5 border rounded-lg transition-all ${
                              feedbackLang === langCode 
                                ? 'bg-indigo-600 border-indigo-600 text-white' 
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {langCode === 'en' && '🇬🇧 English'}
                            {langCode === 'hi' && '🇮🇳 हिंदी'}
                            {langCode === 'gu' && '🇮🇳 ગુજરાતી'}
                            {langCode === 'mr' && '🇮🇳 मराठी'}
                            {langCode === 'ta' && '🇮🇳 தமிழ்'}
                            {langCode === 'te' && '🇮🇳 తెలుగు'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                        {t.extraInstructions}
                      </label>
                      <input 
                        type="text"
                        value={extraInstructions}
                        onChange={(e) => setExtraInstructions(e.target.value)}
                        placeholder="e.g. Focus on physical reaction dynamics, ask for diagrams"
                        className="w-full text-xs p-3 bg-gray-55 border border-gray-200 rounded-xl font-sans focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* ACTION TRIGGER BUTTON */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!simTopic.trim() || isGeneratingExam}
                      onClick={handleGenerateExam}
                      className="w-full py-4 bg-[#3D405B] hover:bg-[#2D2F44] text-white text-xs font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="h-4.5 w-4.5 text-amber-300 animate-pulse" />
                      <span>Generate Question Paper & Start Live Assessment</span>
                    </button>
                    {!simTopic.trim() && (
                      <p className="text-[10px] text-rose-500 text-center mt-2">
                        * Please type a Target Chapter/Topic above to unlock the generator.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* STAGE 2: GENERATING SCREEN */}
              {simStage === 'generating' && (
                <div className="bg-white rounded-3xl border border-gray-150 p-10 shadow-xs text-center space-y-6 animate-pulse">
                  <div className="relative mx-auto w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center">
                    <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin" />
                    <Sparkles className="h-5 w-5 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
                  </div>
                  <div className="space-y-2 max-w-md mx-auto">
                    <h3 className="font-display font-extrabold text-[#3D405B] text-lg">
                      AI Board Evaluation Expert is drafting your paper...
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      We are curating curriculum-specific questions mapping to the {academicBoard} syllabus, formulating grading rubrics, and timing constraints.
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden max-w-xs mx-auto">
                    <div className="bg-indigo-600 h-full animate-progress" style={{ width: '60%' }} />
                  </div>
                </div>
              )}

              {/* STAGE 3: ACTIVE TICKING LIVE EXAM */}
              {simStage === 'live' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* REAL-TIME DYNAMIC TIMER CONTAINER */}
                  <div className={`p-5 rounded-3xl border transition-all ${
                    simTimeRemaining <= 60 
                      ? 'bg-rose-50 border-rose-300 text-rose-950 animate-pulse' 
                      : simTimeRemaining <= 180 
                        ? 'bg-amber-50 border-amber-300 text-amber-950'
                        : 'bg-[#3D405B] border-[#3D405B] text-white shadow-lg'
                  }`}>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      
                      {/* Active indicator */}
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                        </span>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">Exam Session In Progress</p>
                          <p className={`text-[10px] ${simTimeRemaining <= 180 ? 'text-gray-600' : 'text-slate-300'}`}>
                            {academicBoard} Assessment Standards Applied
                          </p>
                        </div>
                      </div>

                      {/* Ticking Clock */}
                      <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-2xl">
                        <Clock className={`h-5 w-5 ${simTimeRemaining <= 60 ? 'text-rose-500 animate-spin' : 'text-amber-400'}`} />
                        <span className="font-mono text-xl font-black tracking-widest">
                          {formatTime(simTimeRemaining)}
                        </span>
                      </div>

                      {/* Controls inside timer panel */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSimIsTimerRunning(!simIsTimerRunning)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs ${
                            simIsTimerRunning 
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-800' 
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          }`}
                        >
                          {simIsTimerRunning ? (
                            <>
                              <Square className="h-3.5 w-3.5 shrink-0" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 shrink-0 fill-current" />
                              <span>Resume</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Are you sure you want to finish writing and submit your answers?")) {
                              setSimIsTimerRunning(false);
                              setSimStage('scan_upload');
                            }
                          }}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1"
                        >
                          <span>Submit & Upload</span>
                        </button>
                      </div>

                    </div>

                    {/* Progress Slider representation of Remaining Time */}
                    <div className="w-full bg-black/10 h-1.5 rounded-full mt-4 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${simTimeRemaining <= 60 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                        style={{ width: `${(simTimeRemaining / (simTimeDuration * 60)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* DRAFTING INSTRUCTIONS PANEL */}
                  <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-xl">✍️</span>
                    <div className="space-y-0.5 text-xs">
                      <p className="font-extrabold text-amber-950">Instructions for Offline Drafting</p>
                      <p className="text-amber-800 leading-relaxed">
                        Write down your formulas, proofs, and essay answers on a blank sheet of paper. When the timer concludes or you press Submit, scan/photograph your physical sheets to receive comprehensive scoring feedback!
                      </p>
                    </div>
                  </div>

                  {/* ACTIVE QUESTION PAPER TERMINAL */}
                  <div className="relative bg-white rounded-3xl border border-gray-150 p-6 shadow-xs space-y-4">
                    <h4 className="font-display font-bold text-[#3D405B] text-base border-b border-gray-100 pb-2.5 flex items-center gap-1.5">
                      <BookOpen className="h-5 w-5 text-indigo-500" />
                      Generated Question Paper
                    </h4>

                    {/* BLUR ANTI-CHEAT OVERLAY WHEN PAUSED */}
                    {!simIsTimerRunning && (
                      <div className="absolute inset-0 bg-slate-100/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center z-10 animate-fade-in">
                        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mb-3">
                          <Lock className="h-6 w-6" />
                        </div>
                        <p className="font-display font-black text-slate-800 text-sm">Session is Paused</p>
                        <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                          The question sheet is locked to support realistic time constraints. Click Resume above to continue.
                        </p>
                        <button
                          onClick={() => setSimIsTimerRunning(true)}
                          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow"
                        >
                          Resume Exam
                        </button>
                      </div>
                    )}

                    <div className="prose max-w-none max-h-96 overflow-y-auto pr-1">
                      <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 leading-relaxed text-xs sm:text-sm text-gray-800 font-serif whitespace-pre-line select-none">
                        {simQuestionPaper}
                      </div>
                    </div>
                  </div>

                  {/* FOOTER ACTIONS */}
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <p>Total Duration: {simTimeDuration} Minutes</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Exit session? Your active progress will be lost.")) {
                          setSimIsTimerRunning(false);
                          setSimStage('setup');
                        }
                      }}
                      className="text-gray-400 hover:text-rose-500 font-bold transition-all"
                    >
                      Cancel Assessment
                    </button>
                  </div>

                </div>
              )}

              {/* STAGE 4: SCAN & UPLOAD HANDWRITTEN SHEET */}
              {simStage === 'scan_upload' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Reference panel: Generated Questions */}
                  <div className="bg-white rounded-3xl border border-gray-150 p-5 shadow-xs space-y-4">
                    <h4 className="font-display font-bold text-[#3D405B] text-sm border-b border-gray-100 pb-2 flex items-center gap-1.5">
                      <BookOpen className="h-4.5 w-4.5 text-orange-500" />
                      Question Reference
                    </h4>
                    <div className="bg-gray-50/75 p-3.5 rounded-xl border border-gray-100 max-h-96 overflow-y-auto text-[11px] text-gray-600 font-serif leading-relaxed whitespace-pre-line">
                      {simQuestionPaper}
                    </div>
                  </div>

                  {/* Submission control center */}
                  <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs space-y-5">
                    <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                      <h3 className="font-display font-bold text-[#3D405B] text-sm flex items-center gap-1.5">
                        <UploadCloud className="h-5 w-5 text-emerald-500" />
                        Upload Your Script
                      </h3>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 p-1 px-2.5 rounded-full font-mono uppercase font-bold">
                        Step 3 of 3
                      </span>
                    </div>

                    {/* Mode Toggle between Scan Upload and Online Typing */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setAnswersSubmissionMode('upload')}
                        className={`flex-1 text-[10px] font-bold px-3 py-2 rounded-lg transition-all ${answersSubmissionMode === 'upload' ? 'bg-white shadow-2xs text-gray-800' : 'text-gray-500 hover:text-gray-800'}`}
                      >
                        📤 Scan / Upload Photo
                      </button>
                      <button 
                        onClick={() => setAnswersSubmissionMode('text')}
                        className={`flex-1 text-[10px] font-bold px-3 py-2 rounded-lg transition-all ${answersSubmissionMode === 'text' ? 'bg-white shadow-2xs text-gray-800' : 'text-gray-500 hover:text-gray-800'}`}
                      >
                        📝 Type Text Answers
                      </button>
                    </div>

                    {answersSubmissionMode === 'upload' ? (
                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDropAnswers}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                          isAnswersDragging 
                            ? 'border-emerald-500 bg-emerald-50/50' 
                            : studentAnswersFile 
                              ? 'border-emerald-300 bg-emerald-50/10' 
                              : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                        }`}
                      >
                        <input 
                          type="file" 
                          id="student-answers-input"
                          className="hidden" 
                          accept="application/pdf,image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileLoad(e.target.files[0], setStudentAnswersFile);
                            }
                          }}
                        />
                        <label htmlFor="student-answers-input" className="cursor-pointer space-y-2.5 block">
                          <div className="mx-auto w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                            <UploadCloud className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-700">{t.dragDrop}</p>
                            <p className="text-[10px] text-gray-400">{t.allowedTypes}</p>
                          </div>
                        </label>

                        {studentAnswersFile && (
                          <div className="mt-4 p-3 bg-white border border-emerald-100 rounded-xl flex items-center justify-between text-left">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              {studentAnswersFile.previewUrl ? (
                                <img 
                                  src={studentAnswersFile.previewUrl} 
                                  alt="Preview" 
                                  className="w-8 h-8 object-cover rounded-md border border-gray-100"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-md flex items-center justify-center">
                                  <FileText className="h-4.5 w-4.5" />
                                </div>
                              )}
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-gray-700 truncate">{studentAnswersFile.file.name}</p>
                                <p className="text-[9px] text-gray-400">
                                  {(studentAnswersFile.file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={(e) => { e.preventDefault(); setStudentAnswersFile(null); }}
                              className="text-gray-400 hover:text-rose-500 p-1"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5 animate-fade-in">
                        <textarea 
                          rows={10}
                          value={typedAnswersText}
                          onChange={(e) => setTypedAnswersText(e.target.value)}
                          placeholder="Draft your answers here. Label each question clearly e.g., Question 1: My answer... Question 2: Solution..."
                          className="w-full text-xs p-3.5 bg-gray-55 border border-gray-200 rounded-xl font-mono focus:border-indigo-400 focus:outline-none leading-relaxed"
                        />
                      </div>
                    )}

                    {/* SUBMIT TRIGGERS */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSimStage('live')}
                        className="px-3.5 py-3 border border-gray-200 text-gray-500 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all flex-1"
                      >
                        Back to Exam
                      </button>

                      <button
                        type="button"
                        disabled={isEvaluating}
                        onClick={handleStartEvaluation}
                        className="px-5 py-3 bg-[#3D405B] hover:bg-[#2D2F44] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 flex-1 disabled:opacity-50"
                      >
                        {isEvaluating ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Grading...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                            <span>Evaluate Exam</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Reset assessment? This clears current exam content.")) {
                            setSimStage('setup');
                            clearCurrentFiles();
                          }
                        }}
                        className="text-[10px] text-gray-400 hover:text-rose-500 transition-all font-bold"
                      >
                        Start Fresh Setup
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* ==============================================
              PATHWAY B: ORIGINAL STANDARD DIRECT REVIEW FLOW
              ============================================== */}
          {mode === 'standard' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs space-y-5">
                <h3 className="font-display font-bold text-[#3D405B] text-base border-b border-gray-100 pb-2.5 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-500" />
                  1. Setup Assessment Profile
                </h3>

                {/* Exam Presets Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">{t.examProfile}</label>
                    <select 
                      value={selectedPresetId}
                      onChange={(e) => setSelectedPresetId(e.target.value)}
                      className="w-full text-xs p-3 bg-gray-55 border border-gray-200 rounded-xl font-sans focus:border-indigo-400 focus:outline-none"
                    >
                      {EXAM_PRESETS.map(preset => (
                        <option key={preset.id} value={preset.id}>{preset.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Board Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">{t.boardLabel}</label>
                    <input 
                      type="text"
                      value={academicBoard}
                      onChange={(e) => setAcademicBoard(e.target.value)}
                      placeholder="e.g. UPSC Union Public Service, CBSE"
                      className="w-full text-xs p-3 bg-gray-55 border border-gray-200 rounded-xl font-sans focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Custom Exam name if custom selected */}
                {selectedPresetId === 'custom' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="text-xs font-bold text-gray-500">{t.custom}</label>
                    <input 
                      type="text"
                      value={customExamName}
                      onChange={(e) => setCustomExamName(e.target.value)}
                      placeholder="Type the exam or subject name..."
                      className="w-full text-xs p-3 bg-gray-55 border border-gray-200 rounded-xl font-sans focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                )}

                {/* Marks & Marking schemes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">{t.maxMarks}</label>
                    <input 
                      type="number"
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(Number(e.target.value))}
                      className="w-full text-xs p-3 bg-gray-55 border border-gray-200 rounded-xl font-sans focus:border-indigo-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">{t.negMarking}</label>
                    <select 
                      value={negativeMarking}
                      onChange={(e) => setNegativeMarking(e.target.value)}
                      className="w-full text-xs p-3 bg-gray-55 border border-gray-200 rounded-xl font-sans focus:border-indigo-400 focus:outline-none"
                    >
                      <option value="None">{t.negNone}</option>
                      <option value="-0.33 per wrong MCQ">{t.negOneThird}</option>
                      <option value="-0.25 per wrong MCQ">{t.negOneFourth}</option>
                      <option value="-1 per wrong subjective question">Strict penalty (-1 mark)</option>
                    </select>
                  </div>
                </div>

                {/* Extra Guidance / instructions */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    {t.extraInstructions}
                  </label>
                  <input 
                    type="text"
                    value={extraInstructions}
                    onChange={(e) => setExtraInstructions(e.target.value)}
                    placeholder={t.extraPlaceholder}
                    className="w-full text-xs p-3 bg-gray-55 border border-gray-200 rounded-xl font-sans focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* MAIN HANDWRITTEN SHEET UPLOAD ZONE */}
              <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs space-y-4">
                <h3 className="font-display font-bold text-[#3D405B] text-base border-b border-gray-100 pb-2.5 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-500" />
                  2. {t.studentSheet} <span className="text-rose-500 font-bold">*</span>
                </h3>

                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDropAnswers}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                    isAnswersDragging 
                      ? 'border-emerald-500 bg-emerald-50/50' 
                      : studentAnswersFile 
                        ? 'border-emerald-300 bg-emerald-50/10' 
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                  }`}
                >
                  <input 
                    type="file" 
                    id="student-answers-input"
                    className="hidden" 
                    accept="application/pdf,image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileLoad(e.target.files[0], setStudentAnswersFile);
                      }
                    }}
                  />
                  <label htmlFor="student-answers-input" className="cursor-pointer space-y-2.5 block">
                    <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-700">{t.dragDrop}</p>
                      <p className="text-[10px] text-gray-400">{t.allowedTypes}</p>
                    </div>
                  </label>

                  {studentAnswersFile && (
                    <div className="mt-4 p-3 bg-white border border-emerald-100 rounded-xl flex items-center justify-between text-left">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {studentAnswersFile.previewUrl ? (
                          <img 
                            src={studentAnswersFile.previewUrl} 
                            alt="Preview" 
                            className="w-10 h-10 object-cover rounded-md border border-gray-100 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-md flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5" />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-gray-700 truncate">{studentAnswersFile.file.name || "sample_upsc_answers.png"}</p>
                          <p className="text-[10px] text-gray-400 font-mono uppercase">
                            {(studentAnswersFile.file.size / 1024).toFixed(1)} KB • {studentAnswersFile.mimeType.split('/').pop()}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.preventDefault(); setStudentAnswersFile(null); }}
                        className="text-gray-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* QUESTION PAPER ZONE */}
              <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                  <h3 className="font-display font-bold text-[#3D405B] text-base flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-500" />
                    3. {t.questionPaper}
                  </h3>
                  
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setQpMode('text')}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${qpMode === 'text' ? 'bg-white shadow-2xs text-gray-800' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      {t.pasteText}
                    </button>
                    <button 
                      onClick={() => setQpMode('file')}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${qpMode === 'file' ? 'bg-white shadow-2xs text-gray-800' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      {t.uploadDoc}
                    </button>
                  </div>
                </div>

                {qpMode === 'text' ? (
                  <textarea 
                    rows={4}
                    value={questionPaperText}
                    onChange={(e) => setQuestionPaperText(e.target.value)}
                    placeholder={t.textPlaceholderQP}
                    className="w-full text-xs p-3 bg-gray-55 border border-gray-200 rounded-xl font-sans focus:border-indigo-400 focus:outline-none leading-relaxed"
                  />
                ) : (
                  <div className="border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-2xl p-6 text-center bg-gray-50/50">
                    <input 
                      type="file" 
                      id="qp-file-input"
                      className="hidden" 
                      accept="application/pdf,image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileLoad(e.target.files[0], setQuestionPaperFile);
                        }
                      }}
                    />
                    <label htmlFor="qp-file-input" className="cursor-pointer space-y-2.5 block">
                      <div className="mx-auto w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-700">{t.dragDrop}</p>
                        <p className="text-[10px] text-gray-400">{t.allowedTypes}</p>
                      </div>
                    </label>

                    {questionPaperFile && (
                      <div className="mt-4 p-3 bg-white border border-orange-100 rounded-xl flex items-center justify-between text-left">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {questionPaperFile.previewUrl ? (
                            <img 
                              src={questionPaperFile.previewUrl} 
                              alt="Preview" 
                              className="w-10 h-10 object-cover rounded-md border border-gray-100"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-md flex items-center justify-center">
                              <FileText className="h-5 w-5" />
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-[#3D405B] truncate">{questionPaperFile.file.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono uppercase">
                              {(questionPaperFile.file.size / 1024).toFixed(1)} KB • {questionPaperFile.mimeType.split('/').pop()}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.preventDefault(); setQuestionPaperFile(null); }}
                          className="text-gray-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ANSWER KEY / RUBRIC ZONE */}
              <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                  <h3 className="font-display font-bold text-[#3D405B] text-base flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-blue-500" />
                    4. {t.answerKey}
                  </h3>
                  
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setAkMode('text')}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${akMode === 'text' ? 'bg-white shadow-2xs text-gray-800' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      {t.pasteText}
                    </button>
                    <button 
                      onClick={() => setAkMode('file')}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${akMode === 'file' ? 'bg-white shadow-2xs text-gray-800' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      {t.uploadDoc}
                    </button>
                  </div>
                </div>

                {akMode === 'text' ? (
                  <textarea 
                    rows={4}
                    value={answerKeyText}
                    onChange={(e) => setAnswerKeyText(e.target.value)}
                    placeholder={t.textPlaceholderAK}
                    className="w-full text-xs p-3 bg-gray-55 border border-gray-200 rounded-xl font-sans focus:border-indigo-400 focus:outline-none leading-relaxed"
                  />
                ) : (
                  <div className="border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-2xl p-6 text-center bg-gray-50/50">
                    <input 
                      type="file" 
                      id="ak-file-input"
                      className="hidden" 
                      accept="application/pdf,image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileLoad(e.target.files[0], setAnswerKeyFile);
                        }
                      }}
                    />
                    <label htmlFor="ak-file-input" className="cursor-pointer space-y-2.5 block">
                      <div className="mx-auto w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-700">{t.dragDrop}</p>
                        <p className="text-[10px] text-gray-400">{t.allowedTypes}</p>
                      </div>
                    </label>

                    {answerKeyFile && (
                      <div className="mt-4 p-3 bg-white border border-blue-100 rounded-xl flex items-center justify-between text-left">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {answerKeyFile.previewUrl ? (
                            <img 
                              src={answerKeyFile.previewUrl} 
                              alt="Preview" 
                              className="w-10 h-10 object-cover rounded-md border border-gray-100"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center">
                              <FileText className="h-5 w-5" />
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-[#3D405B] truncate">{answerKeyFile.file.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono uppercase">
                              {(answerKeyFile.file.size / 1024).toFixed(1)} KB • {answerKeyFile.mimeType.split('/').pop()}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.preventDefault(); setAnswerKeyFile(null); }}
                          className="text-gray-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* LOWER CONTROLS & SUBMISSION ACTIONS */}
              <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-500 flex items-center justify-center sm:justify-start gap-1">
                    <Languages className="h-4 w-4 text-[#81B29A]" />
                    {t.feedbackLanguage}
                  </p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
                    {(['en', 'hi', 'gu', 'mr', 'ta', 'te'] as LanguageCode[]).map(langCode => (
                      <button
                        key={langCode}
                        onClick={() => setFeedbackLang(langCode)}
                        className={`text-[10px] font-bold px-3 py-1 border rounded-lg transition-all ${
                          feedbackLang === langCode 
                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {langCode === 'en' && '🇬🇧 English'}
                        {langCode === 'hi' && '🇮🇳 हिंदी'}
                        {langCode === 'gu' && '🇮🇳 ગુજરાતી'}
                        {langCode === 'mr' && '🇮🇳 मराठी'}
                        {langCode === 'ta' && '🇮🇳 தமிழ்'}
                        {langCode === 'te' && '🇮🇳 తెలుగు'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={clearCurrentFiles}
                    className="px-4 py-3 border border-gray-200 text-gray-500 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all flex-1 sm:flex-none"
                  >
                    Reset Files
                  </button>
                  
                  <button
                    type="button"
                    disabled={isEvaluating}
                    onClick={handleStartEvaluation}
                    className="px-6 py-3 bg-[#3D405B] hover:bg-[#2D2F44] text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 flex-1 sm:flex-none disabled:opacity-50"
                  >
                    {isEvaluating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>{t.evaluating}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                        <span>{t.evaluateBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE EVALUATOR TIMELINE PROGRESSION STEPPER */}
          {isEvaluating && (
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg space-y-4 animate-fade-in text-left">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-[10px] font-mono text-amber-400 font-bold tracking-wider uppercase">Evaluating Exam Sheet</span>
                <span className="text-xs bg-white/10 p-1 px-2 rounded-md font-mono">Step {evaluationStep + 1}/4</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                {[
                  { step: 0, text: "Scanning Handwriting Sheet & Transcribing OCR text..." },
                  { step: 1, text: "Analyzing structures, formulas, and academic quality..." },
                  { step: 2, text: "Cross-referencing answers with Original Question Rubrics..." },
                  { step: 3, text: "Formulating scoring matrices, Strengths, and Expert Advice..." }
                ].map(item => (
                  <div key={item.step} className="space-y-1.5 opacity-90">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        evaluationStep > item.step 
                          ? 'bg-emerald-500 text-white' 
                          : evaluationStep === item.step 
                            ? 'bg-amber-500 text-white animate-pulse' 
                            : 'bg-white/10 text-white/50'
                      }`}>
                        {evaluationStep > item.step ? '✓' : item.step + 1}
                      </div>
                      <span className={`text-[11px] font-bold ${evaluationStep === item.step ? 'text-amber-400' : 'text-white/60'}`}>
                        {evaluationStep === item.step ? 'Analyzing' : evaluationStep > item.step ? 'Done' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/70 leading-normal pl-7">{item.text}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
                <div 
                  className="bg-amber-400 h-full transition-all duration-1000"
                  style={{ width: `${(evaluationStep + 1) * 25}%` }}
                />
              </div>
            </div>
          )}

          {/* REPORT & ANALYSIS OUTPUT */}
          {(evaluationReport || errorMsg) && <div id="evaluation-results-anchor" />}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 text-xs sm:text-sm animate-fade-in">
              <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Evaluation Attempt Failed</p>
                <p className="mt-1 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {evaluationReport && (
            <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-6 animate-fade-in text-left">
              
              {/* Report Control header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-3">
                <div className="space-y-1">
                  <h3 className="font-display font-black text-[#3D405B] text-base flex items-center gap-1.5">
                    <CheckCircle className="h-5.5 w-5.5 text-emerald-500" />
                    Evaluation Report Generated
                  </h3>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    {t.pointsEarned}
                  </p>
                </div>

                {/* Tab selectors + TTS controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                    <button 
                      onClick={() => setActiveReportTab('dashboard')}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${activeReportTab === 'dashboard' ? 'bg-white shadow-2xs text-gray-800' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      {t.visualDashboardTab}
                    </button>
                    <button 
                      onClick={() => setActiveReportTab('report')}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${activeReportTab === 'report' ? 'bg-white shadow-2xs text-gray-800' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      {t.textReportTab}
                    </button>
                  </div>

                  <button
                    onClick={handleToggleAudioReading}
                    className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isAudioPlaying 
                        ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse' 
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {isAudioPlaying ? (
                      <>
                        <Square className="h-3.5 w-3.5 fill-current" />
                        <span>{t.stopAudio}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>{t.listenFeedback}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* REPORT VIEWER CONTENT */}
              {activeReportTab === 'report' || !parsedReport || !parsedReport.isParsed ? (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 relative overflow-hidden">
                  <FormattedText text={evaluationReport} />
                </div>
              ) : (
                /* HIGH END VISUAL PERFORMANCE DASHBOARD */
                <div className="space-y-6">
                  
                  {/* Top Stats bento: Score Circle & Accuracy Rate Gauge */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    {/* Score Circle Card */}
                    <div className="bg-gradient-to-br from-indigo-50/50 to-white p-5 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
                      <div className="absolute top-2 left-2 text-[8px] font-mono font-bold text-indigo-500 bg-indigo-50 p-0.5 px-1.5 rounded uppercase">
                        {t.finalScore}
                      </div>

                      <div className="relative w-28 h-28 flex items-center justify-center mt-2">
                        {/* Circular track bar */}
                        <svg className="w-full h-full transform -rotate-90">
                          <circle 
                            cx="56" 
                            cy="56" 
                            r="48" 
                            className="stroke-gray-100" 
                            strokeWidth="8" 
                            fill="transparent" 
                          />
                          <circle 
                            cx="56" 
                            cy="56" 
                            r="48" 
                            className="stroke-indigo-600 transition-all duration-1000" 
                            strokeWidth="8" 
                            fill="transparent" 
                            strokeDasharray={`${2 * Math.PI * 48}`}
                            strokeDashoffset={`${2 * Math.PI * 48 * (1 - (parseFloat(parsedReport.totalScore) || 0) / (parseFloat(parsedReport.maxMarks) || 100))}`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-display font-black text-2xl text-indigo-950">{parsedReport.totalScore}</span>
                          <span className="text-[10px] text-gray-400 font-bold">out of {parsedReport.maxMarks}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium">Assessed maximum marks matching preset evaluation standard</p>
                    </div>

                    {/* Accuracy rate Card */}
                    <div className="bg-gradient-to-br from-emerald-50/50 to-white p-5 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
                      <div className="absolute top-2 left-2 text-[8px] font-mono font-bold text-emerald-600 bg-emerald-50 p-0.5 px-1.5 rounded uppercase">
                        {t.accuracy}
                      </div>

                      <div className="text-4xl text-emerald-600 mt-2">🎯</div>
                      <div className="space-y-0.5">
                        <div className="font-display font-black text-3xl text-emerald-950">
                          {parsedReport.accuracyRate}%
                        </div>
                        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Correctness Quotient</p>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium">Derived from MCQ weights and subjective keyword coverage</p>
                    </div>
                  </div>

                  {/* Question wise break-down expandable cards */}
                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-sm text-[#3D405B] flex items-center gap-1.5">
                      <CheckSquare className="h-4.5 w-4.5 text-[#3D405B]" />
                      {t.analysis}
                    </h4>

                    {parsedReport.questions.map((q, idx) => {
                      const isExpanded = expandedQuestionIdx === idx;
                      const isCorrect = q.status.toLowerCase().includes("correct") && !q.status.toLowerCase().includes("partially");
                      const isPartially = q.status.toLowerCase().includes("partially");
                      const isIncorrect = q.status.toLowerCase().includes("incorrect");
                      const isUnattempted = q.status.toLowerCase().includes("unattempted");

                      let pillColor = "bg-gray-100 text-gray-700";
                      let borderColor = "border-gray-200 hover:border-gray-300";
                      if (isCorrect) {
                        pillColor = "bg-emerald-50 text-emerald-800 border border-emerald-200";
                        borderColor = "border-emerald-100 hover:border-emerald-200";
                      } else if (isPartially) {
                        pillColor = "bg-amber-50 text-amber-800 border border-amber-200";
                        borderColor = "border-amber-100 hover:border-amber-200";
                      } else if (isIncorrect) {
                        pillColor = "bg-rose-50 text-rose-800 border border-rose-200";
                        borderColor = "border-rose-100 hover:border-rose-200";
                      }

                      return (
                        <div 
                          key={idx} 
                          className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${borderColor}`}
                        >
                          <button
                            onClick={() => setExpandedQuestionIdx(isExpanded ? null : idx)}
                            className="w-full p-4 flex justify-between items-center text-left gap-2"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="font-display font-black text-sm text-[#3D405B]">Question {q.qNum}</span>
                              <span className={`text-[9px] font-mono font-extrabold p-0.5 px-2 rounded uppercase max-w-max ${pillColor}`}>
                                {q.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500 font-mono">
                                {t.pointsAwarded}: <strong className="text-gray-800">{q.marksAwarded}</strong> / {q.maxMarksForQ}
                              </span>
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-gray-50 pt-3 bg-gray-50/50 animate-fade-in">
                              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                                {q.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Core Weaknesses & Strengths Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    {/* Strengths Card */}
                    <div className="p-5 bg-emerald-50/30 border border-emerald-100 rounded-2xl space-y-3">
                      <h4 className="font-display font-extrabold text-sm text-emerald-950 flex items-center gap-1.5">
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
                        {t.strengths}
                      </h4>
                      {parsedReport.strengths && parsedReport.strengths.length > 0 ? (
                        <ul className="space-y-1.5">
                          {parsedReport.strengths.map((str, sIdx) => (
                            <li key={sIdx} className="text-xs text-gray-600 leading-relaxed list-disc ml-4">
                              {str}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500">Good attempt with steady logical layouts.</p>
                      )}
                    </div>

                    {/* Areas of Improvement Card */}
                    <div className="p-5 bg-amber-50/30 border border-amber-100 rounded-2xl space-y-3">
                      <h4 className="font-display font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
                        <AlertTriangle className="h-4.5 w-4.5 text-amber-600 animate-pulse" />
                        {t.improvements}
                      </h4>
                      {parsedReport.areasOfImprovement && parsedReport.areasOfImprovement.length > 0 ? (
                        <ul className="space-y-1.5">
                          {parsedReport.areasOfImprovement.map((imp, iIdx) => (
                            <li key={iIdx} className="text-xs text-gray-600 leading-relaxed list-disc ml-4">
                              {imp}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500">Minor numerical precision corrections required.</p>
                      )}
                    </div>
                  </div>

                  {/* Expert Advice Bento */}
                  {parsedReport.expertAdvice && parsedReport.expertAdvice.length > 0 && (
                    <div className="p-5 bg-indigo-50/30 border border-indigo-100 rounded-2xl space-y-3">
                      <h4 className="font-display font-black text-sm text-indigo-950 flex items-center gap-1.5">
                        <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
                        {t.expertAdvice}
                      </h4>
                      <div className="space-y-2">
                        {parsedReport.expertAdvice.map((adv, aIdx) => (
                          <div key={aIdx} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed bg-white border border-indigo-100/50 p-2.5 rounded-xl">
                            <span className="text-base text-indigo-500">💡</span>
                            <p className="mt-0.5">{adv}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SAMPLE PANEL & PERSISTENT HISTORY (4 COLS ON DESKTOP) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* LOAD SAMPLE CONSOLE */}
          <div className="bg-white rounded-3xl border border-gray-150 p-5 shadow-xs space-y-4">
            <h4 className="font-display font-black text-[#3D405B] text-sm flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-amber-500" />
              {t.generateSample}
            </h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {t.sampleDesc}
            </p>
            <button
              onClick={loadSampleData}
              className="w-full py-2.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#E07A5F] text-xs font-sans font-bold rounded-xl text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Load Mock Practice Sheet</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* PERSISTENT HISTORY LOG PANEL */}
          <div className="bg-white rounded-3xl border border-gray-150 p-5 shadow-xs space-y-4">
            <h4 className="font-display font-black text-[#3D405B] text-sm flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-indigo-500" />
              {t.historyTitle}
            </h4>

            {history.length === 0 ? (
              <p className="text-[11px] text-gray-400 leading-relaxed py-4 text-center">
                {t.historyEmpty}
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {history.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => loadPastEvaluation(record)}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-indigo-400 transition-all cursor-pointer space-y-1.5 relative group text-left"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-mono font-extrabold text-indigo-700 bg-indigo-50 px-1.5 p-0.5 rounded uppercase">
                        {record.examType}
                      </span>
                      
                      <button
                        onClick={(e) => deleteHistoryItem(record.id, e)}
                        className="text-gray-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="text-xs font-bold text-gray-700 truncate pr-6">{record.timestamp}</p>
                    
                    <div className="flex gap-4 text-[10px] text-gray-400">
                      <span>Score: <strong className="text-gray-700 font-bold">{record.totalScore} / {record.maxMarks}</strong></span>
                      <span>Accuracy: <strong className="text-emerald-700 font-bold">{record.accuracyRate}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
