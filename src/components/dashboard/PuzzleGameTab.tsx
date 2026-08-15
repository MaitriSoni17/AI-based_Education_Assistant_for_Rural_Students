import React, { useState, useEffect, useMemo } from 'react';
import { User, LanguageCode } from '../../types';
import { 
  CheckCircle2, XCircle, ArrowRight, ChevronLeft, 
  Play, Calendar, Shuffle, Sparkles, Loader2, RefreshCw, Wand2, Lightbulb, Compass
} from 'lucide-react';

interface PuzzleGameTabProps {
  user: User;
  lang: LanguageCode;
  onUpdateUser: (fields: Partial<User>) => void;
}

type PuzzleGroup = 1 | 2 | 3;

interface GameDefinition {
  id: string;
  group: PuzzleGroup;
  title: Record<string, string>;
  category: Record<string, string>;
  icon: string;
  color: string;
  borderColor: string;
  bgColor: string;
  description: Record<string, string>;
  hasDiagram: boolean;
}

// Universal text localization helper with fallback
export function getLocText(val: Record<string, string> | string | undefined, lang: LanguageCode): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val[lang] || val['en'] || val['hi'] || val['gu'] || Object.values(val)[0] || '';
}

// Array shuffle helper
function shuffleArray<T>(arr: T[] | undefined | null): T[] {
  if (!arr || !Array.isArray(arr) || arr.length === 0) {
    return [];
  }
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  if (JSON.stringify(result) === JSON.stringify(arr) && arr.length > 1) {
    return result.reverse();
  }
  return result;
}

// ==========================================
// MULTILINGUAL DYNAMIC PUZZLE VARIANT POOLS
// ==========================================

export const FOOD_CHAIN_VARIANTS = [
  {
    title: {
      en: '🌱 Grassland Ecosystem Chain',
      hi: '🌱 घास के मैदान का पारिस्थितिकी तंत्र',
      gu: '🌱 ઘાસના મેદાનની આહાર શ્રૃંખલા',
      mr: '🌱 गवत प्रदेश अन्न साखळी',
      ta: '🌱 புல்வெளி சுற்றுச்சூழல் சங்கிலி',
      te: '🌱 గడ్డిభూమి పర్యావరణ వ్యవస్థ గొలుసు'
    },
    items: [
      { key: 'Grass', name: { en: '🌱 Grass', hi: '🌱 घास', gu: '🌱 ઘાસ', mr: '🌱 गवत', ta: '🌱 புல்', te: '🌱 గడ్డి' } },
      { key: 'Grasshopper', name: { en: '🦗 Grasshopper', hi: '🦗 टिड्डा', gu: '🦗 તીડ', mr: '🦗 टोળ', ta: '🦗 வெட்டுக்கிளி', te: '🦗 మిడుత' } },
      { key: 'Frog', name: { en: '🐸 Frog', hi: '🐸 मेंढक', gu: '🐸 દેડકો', mr: '🐸 बेडूक', ta: '🐸 தவளை', te: '🐸 కప్ప' } },
      { key: 'Snake', name: { en: '🐍 Snake', hi: '🐍 सांप', gu: '🐍 સાપ', mr: '🐍 साप', ta: '🐍 பாம்பு', te: '🐍 పాము' } },
      { key: 'Eagle', name: { en: '🦅 Eagle', hi: '🦅 बाज / चील', gu: '🦅 ગરુડ', mr: '🦅 गरुड', ta: '🦅 கழுகு', te: '🦅 డేగ' } },
    ],
    solutionKeys: ['Grass', 'Grasshopper', 'Frog', 'Snake', 'Eagle'],
    explanation: {
      en: 'Grass → Grasshopper → Frog → Snake → Eagle',
      hi: 'घास → टिड्डा → मेंढक → सांप → बाज',
      gu: 'ઘાસ → તીડ → દેડકો → સાપ → ગરુડ',
      mr: 'गवत → टोळ → बेडूक → साप → गरुड',
      ta: 'புல் → வெட்டுக்கிளி → தவளை → பாம்பு → கழுகு',
      te: 'గడ్డి → మిడుత → కప్ప → పాము → డేగ'
    }
  },
  {
    title: {
      en: '🌊 Ocean Marine Food Web',
      hi: '🌊 समुद्री भोजन जाल',
      gu: '🌊 સમુદ્રી આહાર શ્રૃંખલા',
      mr: '🌊 सागरी अन्न जाळे',
      ta: '🌊 கடல் உணவு சங்கிலி',
      te: '🌊 సముద్ర ఆహార జాలం'
    },
    items: [
      { key: 'Phytoplankton', name: { en: '🧫 Phytoplankton', hi: '🧫 सूक्ष्म प्लवक', gu: '🧫 સૂક્ષ્મ વનસ્પતિ પ્લવક', mr: '🧫 सूक्ष्म प्लवक', ta: '🧫 தாவர மிதவை', te: '🧫 ఫైటోప్లాంక్టన్' } },
      { key: 'Krill', name: { en: '🦐 Krill', hi: '🦐 क्रिल झींगा', gu: '🦐 ઝીંગા (Krill)', mr: '🦐 क्रिल कोळंबी', ta: '🦐 கிரில் இறால்', te: '🦐 క్రిల్ రొయ్య' } },
      { key: 'Small Fish', name: { en: '🐟 Small Fish', hi: '🐟 छोटी मछली', gu: '🐟 નાની માછલી', mr: '🐟 लहान मासा', ta: '🐟 சிறிய மீன்', te: '🐟 చిన్న చేప' } },
      { key: 'Shark', name: { en: '🦈 Shark', hi: '🦈 शार्क्', gu: '🦈 શાર્ક માછલી', mr: '🦈 शार्क मासा', ta: '🦈 சுறா மீன்', te: '🦈 షార్క్ చేప' } },
      { key: 'Orca Whale', name: { en: '🐋 Orca Whale', hi: '🐋 ओर्का व्हेल', gu: '🐋 ઓર્કા વ્હેલ', mr: '🐋 देवमासा', ta: '🐋 ஆர்கா திமிங்கலம்', te: '🐋 ఆర్కా తిమింగలం' } },
    ],
    solutionKeys: ['Phytoplankton', 'Krill', 'Small Fish', 'Shark', 'Orca Whale'],
    explanation: {
      en: 'Phytoplankton → Krill → Small Fish → Shark → Orca Whale',
      hi: 'सूक्ष्म प्लवक → क्रिल झींगा → छोटी मछली → शार्क् → ओर्का व्हेल',
      gu: 'સૂક્ષ્મ પ્લવક → ઝીંગા → નાની માછલી → શાર્ક → વ્હેલ',
      mr: 'सूक्ष्म प्लवक → क्रिल → लहान मासा → शार्क → देवमासा',
      ta: 'தாவர மிதவை → கிரில் → சிறிய மீன் → சுறா → திமிங்கலம்',
      te: 'ఫైటోప్లాంక్టన్ → క్రిల్ → చిన్న చేప → షార్క్ → ఆర్కా తిమింగలం'
    }
  },
  {
    title: {
      en: '🌲 Forest Woodland Food Chain',
      hi: '🌲 वन भोजन श्रृंखला',
      gu: '🌲 જંગલ આહાર શ્રૃંખલા',
      mr: '🌲 जंगल अन्न साखळी',
      ta: '🌲 காடு உணவு சங்கிலி',
      te: '🌲 అడవి ఆహార గొలుసు'
    },
    items: [
      { key: 'Leaves', name: { en: '🍃 Plant Leaves', hi: '🍃 पौधे की पत्तियां', gu: '🍃 પાંદડાં', mr: '🍃 पानांची पाने', ta: '🍃 இலைகள்', te: '🍃 ఆకులు' } },
      { key: 'Caterpillar', name: { en: '🐛 Caterpillar', hi: '🐛 इल्ली', gu: '🐛 ઈયળ', mr: '🐛 सुरवंट', ta: '🐛 கம்பளிப்பூச்சி', te: '🐛 గొంగళి పురుగు' } },
      { key: 'Blue Bird', name: { en: '🐦 Blue Bird', hi: '🐦 चिड़िया', gu: '🐦 પક્ષી', mr: '🐦 पक्षी', ta: '🐦 பறவை', te: '🐦 పిట్ట' } },
      { key: 'Fox', name: { en: '🦊 Wild Fox', hi: '🦊 लोमड़ी', gu: '🦊 શિયાળ', mr: '🦊 लांडगा/कोल्हा', ta: '🦊 நரி', te: '🦊 నక్క' } },
      { key: 'Grizzly Bear', name: { en: '🐻 Grizzly Bear', hi: '🐻 भालू', gu: '🐻 રીંછ', mr: '🐻 अस्वल', ta: '🐻 கரடி', te: '🐻 ఎలుగుబంటి' } },
    ],
    solutionKeys: ['Leaves', 'Caterpillar', 'Blue Bird', 'Fox', 'Grizzly Bear'],
    explanation: {
      en: 'Leaves → Caterpillar → Blue Bird → Fox → Grizzly Bear',
      hi: 'पत्तियां → इल्ली → चिड़िया → लोमड़ी → भालू',
      gu: 'પાંદડાં → ઈયળ → પક્ષી → શિયાળ → રીંછ',
      mr: 'पाने → सुरवंट → पक्षी → कोल्हा → अस्वल',
      ta: 'இலைகள் → கம்பளிப்பூச்சி → பறவை → நரி → கரடி',
      te: 'ఆకులు → గొంగళి పురుగు → పిట్ట → నక్క → ఎలుగుబంటి'
    }
  },
  {
    title: {
      en: '🏜️ Desert Ecosystem Food Chain',
      hi: '🏜️ रेगिस्तानी पारिस्थितिकी तंत्र',
      gu: '🏜️ રણપ્રદેશ આહાર શ્રૃંખલા',
      mr: '🏜️ वाळवंट अन्न साखळी',
      ta: '🏜️ பாலைவன சுற்றுச்சூழல் சங்கிலி',
      te: '🏜️ ఎడారి పర్యావરણ వ్యవస్థ గొలుసు'
    },
    items: [
      { key: 'Cactus', name: { en: '🌵 Cactus Plant', hi: '🌵 कैक्टस', gu: '🌵 થોર', mr: '🌵 कॅक्टस', ta: '🌵 கள்ளியான்', te: '🌵 బ్రహ్మజెముడు' } },
      { key: 'Desert Beetle', name: { en: '🪲 Desert Beetle', hi: '🪲 रेगिस्तानी भृंग', gu: '🪲 રણનું જીવડું', mr: '🪲 कीटक', ta: '🪲 பாலைவன வண்டு', te: '🪲 ఎడారి పురుగు' } },
      { key: 'Lizard', name: { en: '🦎 Desert Lizard', hi: '🦎 छिपकली', gu: '🦎 કાચંડો', mr: '🦎 पाल', ta: '🦎 பல்லி', te: '🦎 బల్లి' } },
      { key: 'Hawk', name: { en: '🦅 Desert Hawk', hi: '🦅 बाज', gu: '🦅 બાજ', mr: '🦅 ससाणा', ta: '🦅 பருந்து', te: '🦅 గద్ద' } },
      { key: 'Coyote', name: { en: '🐺 Wild Coyote', hi: '🐺 कोयोटी', gu: '🐺 જંગલી કૂતરો', mr: '🐺 जंगली कुत्रा', ta: '🐺 பாலைவன ஓநாய்', te: '🐺 అడవి తోడేలు' } },
    ],
    solutionKeys: ['Cactus', 'Desert Beetle', 'Lizard', 'Hawk', 'Coyote'],
    explanation: {
      en: 'Cactus → Desert Beetle → Lizard → Hawk → Coyote',
      hi: 'कैक्टस → रेगिस्तानी भृंग → छिपकली → बाज → कोयोटी',
      gu: 'થોર → જીવડું → કાચંડો → બાજ → જંગલી કૂતરો',
      mr: 'कॅक्टस → कीटक → पाल → ससाणा → कोयोटी',
      ta: 'கள்ளியான் → வண்டு → பல்லி → பருந்து → ஓநாய்',
      te: 'బ్రహ్మజెముడు → పురుగు → బల్లి → గద్ద → తోడేలు'
    }
  },
  {
    title: {
      en: '🧊 Arctic Tundra Food Chain',
      hi: '🧊 आर्कटिक टुंड्रा खाद्य श्रृंखला',
      gu: '🧊 આર્કટિક ટુંડ્રા આહાર શ્રૃંખલા',
      mr: '🧊 आर्क्टिक अन्न साखळी',
      ta: '🧊 ஆர்க்டிக் உணவு சங்கிலி',
      te: '🧊 ఆర్కిటిక్ టండ్రా ఆహార గொలుసు'
    },
    items: [
      { key: 'Lichen', name: { en: '🌿 Tundra Lichen', hi: '🌿 काई / लाइकेन', gu: '🌿 લીલ (Lichen)', mr: '🌿 शेवाळ', ta: '🌿 பாசி', te: '🌿 నాచు' } },
      { key: 'Arctic Hare', name: { en: '🐇 Arctic Hare', hi: '🐇 बर्फ़ीला खरगोश', gu: '🐇 આર્કટિક સસલું', mr: '🐇 बर्फाळ ससा', ta: '🐇 ஆர்க்டிக் முயல்', te: '🐇 ఆర్కిటిక్ కుందేలు' } },
      { key: 'Arctic Fox', name: { en: '🦊 Arctic Fox', hi: '🦊 बर्फ़ीली लोमड़ी', gu: '🦊 સફેદ શિયાળ', mr: '🦊 बर्फाळ कोल्हा', ta: '🦊 ஆர்க்டிக் நரி', te: '🦊 ఆర్కిటిక్ నక్క' } },
      { key: 'Snowy Owl', name: { en: '🦉 Snowy Owl', hi: '🦉 बर्फ़ीला उल्लू', gu: '🦉 સફેદ ઘુવડ', mr: '🦉 बर्फाळ घुबड', ta: '🦉 ஆர்க்டિક ஆந்தை', te: '🦉 మంచు గుడ్లగూબ' } },
      { key: 'Polar Bear', name: { en: '🐻‍❄️ Polar Bear', hi: '🐻‍❄️ ध्रुवीय भालू', gu: '🐻‍❄️ સફેદ રીંછ', mr: '🐻‍❄️ ध्रुवीय अस्वल', ta: '🐻‍❄️ பனிப்பாறை கரடி', te: '🐻‍❄️ ధ్రువపు ఎలుగుబంటి' } },
    ],
    solutionKeys: ['Lichen', 'Arctic Hare', 'Arctic Fox', 'Snowy Owl', 'Polar Bear'],
    explanation: {
      en: 'Lichen → Arctic Hare → Arctic Fox → Snowy Owl → Polar Bear',
      hi: 'काई → बर्फ़ीला खरगोश → बर्फ़ीली लोमड़ी → बर्फ़ीला उल्लू → ध्रुवीय भालू',
      gu: 'લીલ → સસલું → સફેદ શિયાળ → ઘુવડ → સફેદ રીંછ',
      mr: 'शेवाळ → ससा → कोल्हा → घुबड → ध्रुवीय अस्वल',
      ta: 'பாசி → முயல் → நரி → ஆந்தை → கரடி',
      te: 'నాచు → కుందేలు → నక్క → గుడ్లగూબ → ధ్రువపు ఎలుగుబంటి'
    }
  }
];

export const SHAPE_VARIANTS = [
  {
    id: "house",
    title: {
      en: "🏠 House Blueprint",
      hi: "🏠 घर का ब्लूप्रिंट",
      gu: "🏠 ઘરનું બ્લૂપ્રિન્ટ",
      mr: "🏠 घराचा आराखडा",
      ta: "🏠 வீட்டின் வரைபடம்",
      te: "🏠 ఇంటి బ్లూప్రింట్"
    },
    items: [
      { key: "Square House Base", name: { en: "🟧 Square Base", hi: "🟧 वर्ग आधार", gu: "🟧 ચોરસ આધાર", mr: "🟧 चौरस पाया", ta: "🟧 சதுர அடித்தளம்", te: "🟧 చతురస్ర పునాది" } },
      { key: "Triangle Roof", name: { en: "🔺 Triangle Roof", hi: "🔺 त्रिकोण छत", gu: "🔺 ત્રિકોણ છત", mr: "🔺 त्रिकोण छत", ta: "🔺 முக்கோண கூரை", te: "🔺 త్రిభుజం పైకప్పు" } },
      { key: "Rectangle Door", name: { en: "🚪 Rectangle Door", hi: "🚪 आयत दरवाजा", gu: "🚪 લંબચોરસ દરવાજો", mr: "🚪 आयताकृती दार", ta: "🚪 செவ்வக கதவு", te: "🚪 దీర్ఘచతురస్ర తలుపు" } },
      { key: "Circle Attic Window", name: { en: "🔵 Circle Window", hi: "🔵 वृत्त खिड़की", gu: "🔵 વર્તુળ બારી", mr: "🔵 वर्तुळाकार खिडकी", ta: "🔵 வட்ட ஜன்னல்", te: "🔵 గుండ్రని కిటికీ" } }
    ],
    requiredKeys: ["Square House Base", "Triangle Roof", "Rectangle Door", "Circle Attic Window"],
    solution: ["Square House Base", "Triangle Roof", "Rectangle Door", "Circle Attic Window"],
    hint: {
      en: "Start with the base foundation, place the roof atop, then add door and attic window.",
      hi: "पहले घर का आधार रखें, फिर ऊपर त्रिकोण छत, फिर दरवाजा व गोल खिड़की जोड़ें।",
      gu: "પહેલા ઘરનો આધાર મૂકો, પછી ઉપર ત્રિકોણ છત, પછી દરવાજો અને બારી જોડો.",
      mr: "प्रथम पाया तयार करा, वर छत लावा आणि नंतर दार व खिडकी बसवा.",
      ta: "முதலில் அடித்தளத்தை அமைத்து, மேலே கூரையை வைத்து, பின் கதவு மற்றும் ஜன்னலைச் சேர்க்கவும்.",
      te: "ముందుగా పునాదిని ఉంచి, పైన పైకప్పును అమర్చి, తరువాత తలుపు మరియు కిటికీని చేర్చండి."
    }
  },
  {
    id: "rocket",
    title: {
      en: "🚀 Space Rocket",
      hi: "🚀 अंतरिक्ष रॉकेट",
      gu: "🚀 રોકેટ",
      mr: "🚀 રોકેટ",
      ta: "🚀 விண்கலம்",
      te: "🚀 రాకెట్"
    },
    items: [
      { key: "Cylinder Body", name: { en: "🚀 Main Fuselage", hi: "🚀 मुख्य ढांचा", gu: "🚀 મુખ્ય ભાગ", mr: "🚀 मुख्य भाग", ta: "🚀 முக்கிய உடல்", te: "🚀 ప్రధాన భాగం" } },
      { key: "Cone Tip", name: { en: "🔺 Nose Cone", hi: "🔺 नुकीला शीर्ष", gu: "🔺 શંકુ ટોચ", mr: "🔺 त्रिकोणी टोक", ta: "🔺 கூம்பு முனை", te: "🔺 శంకు అగ్రభాగం" } },
      { key: "Triangle Fins", name: { en: "📐 Side Boosters", hi: "📐 पंख / बूस्टर", gu: "📐 પાંખો / બૂસ્ટર", mr: "📐 बाजूचे पंख", ta: "📐 பக்கவாட்டு இறக்கைகள்", te: "📐 పక్క రెక్కలు" } },
      { key: "Flame Exhaust", name: { en: "🔥 Rocket Thrusters", hi: "🔥 रॉकेट थ्रस्टर्स", gu: "🔥 નોઝલ જ્વાળાઓ", mr: "🔥 थ्रस्टर जाळ", ta: "🔥 எஞ்சின் தீப்பொறி", te: "🔥 ఇంజిన్ మంటలు" } }
    ],
    requiredKeys: ["Cylinder Body", "Cone Tip", "Triangle Fins", "Flame Exhaust"],
    solution: ["Cylinder Body", "Cone Tip", "Triangle Fins", "Flame Exhaust"],
    hint: {
      en: "Assemble the fuselage body, attach the top nose cone, add stabilizer fins, and fire up the thrusters.",
      hi: "मुख्य ढांचा रखें, ऊपर नुकीला शीर्ष लगाएं, साइड पंख जोड़ें और थ्रस्टर्स चालू करें।",
      gu: "મુખ્ય બોડી મૂકો, ઉપર શંકુ લગાવો, પાંખો જોડો અને થ્રસ્ટર લગાવો.",
      mr: "मुख्य भाग तयार करा, वर त्रिकोणी टोक लावा, पंख जोडा आणि थ्रस्टर लावा.",
      ta: "முக்கிய பகுதியை வைத்து, கூம்பு முனையை இணைத்து, இறக்கைகளைச் சேர்த்து, எஞ்சினை இயக்கவும்.",
      te: "ప్రధాన భాగాన్ని ఉంచి, శంకు భాగాన్ని అమర్చి, రెక్కలను జోడించి, ఇంజిన్‌ను ప్రారంభించండి."
    }
  },
  {
    id: "sailboat",
    title: {
      en: "⛵ Sailboat Vessel",
      hi: "⛵ पाल वाली नाव",
      gu: "⛵ હોડીનું બ્લૂપ્રિન્ટ",
      mr: "⛵ शिडाच्या नौकेचा आराखडा",
      ta: "⛵ படகு வரைபடம்",
      te: "⛵ పడవ బ్లూప్రింట్"
    },
    items: [
      { key: "Trapezoid Boat Hull", name: { en: "🚤 Trapezoid Boat Hull", hi: "🚤 नाव का तल्हा", gu: "🚤 બોટનું હોડકું", mr: "🚤 नौकेचे शरीर", ta: "🚤 படகு உடல்", te: "🚤 పడవ బాడీ" } },
      { key: "Triangular Main Sail", name: { en: "⛵ Triangular Main Sail", hi: "⛵ मुख्य त्रिकोण पाल", gu: "⛵ ત્રિકોણાકાર સઢ", mr: "⛵ त्रिकोणी मुख्य शीड", ta: "⛵ முக்கோண பாய்", te: "⛵ త్రిభుజాకార పాయలు" } },
      { key: "Vertical Mast Pole", name: { en: "🪵 Vertical Pole Mast", hi: "🪵 मस्तूल का खंभा", gu: "🪵 શિડનો થાંભલો", mr: "🪵 लाकडी खांब", ta: "🪵 கம்பம்", te: "🪵 నిలువు స్తంభం" } },
      { key: "Circular Lifebuoy Ring", name: { en: "⭕ Circular Lifebuoy Ring", hi: "⭕ रक्षा रिंग", gu: "⭕ લાઇફબોય રિંગ", mr: "⭕ जीवरक्षक कडे", ta: "⭕ பாதுகாப்பு வளையம்", te: "⭕ రక్షణ వలయం" } }
    ],
    requiredKeys: ["Trapezoid Boat Hull", "Triangular Main Sail", "Vertical Mast Pole", "Circular Lifebuoy Ring"],
    solution: ["Trapezoid Boat Hull", "Vertical Mast Pole", "Triangular Main Sail", "Circular Lifebuoy Ring"],
    hint: {
      en: "First place the boat hull, mount the vertical mast, raise the triangular sail, and attach the lifebuoy.",
      hi: "नाव का तल्हा रखें, मस्तूल लगाएं, पाल उठाएं और लाइफबॉय लगाएं।",
      gu: "હોડીનું હોડકું મૂકો, થાંભલો લગાવો, સઢ ચઢાવો અને રિંગ જોડો.",
      mr: "नौकेचे शरीर ठेवा, खांब बसवा, शीड लावा आणि जीवरक्षक कडे जोडा.",
      ta: "படகு உடலை வைத்து, கம்பத்தை நட்டு, பாயை ஏற்றி, பாதுகாப்பு வளையத்தை இணைக்கவும்.",
      te: "పడవ బాడీని ఉంచి, స్తంభాన్ని అమర్చి, పాయలను ఎగురవేసి, రక్షణ వలయాన్ని జోడించండి."
    }
  },
  {
    id: "castle",
    title: {
      en: "🏰 Medieval Castle Fortress",
      hi: "🏰 मध्यकालीन किला",
      gu: "🏰 મધ્યકાલીન કિલ્લો",
      mr: "🏰 मध्ययुगीन किल्ला",
      ta: "🏰 இடைக்கால கோட்டை",
      te: "🏰 ప్రాచీన కోట"
    },
    items: [
      { key: "Rectangular Castle Wall", name: { en: "🏰 Main Fortress Wall", hi: "🏰 किला दीवार", gu: "🏰 કિલ્લાની દીવાલ", mr: "🏰 किल्ल्याची भिंत", ta: "🏰 கோட்டை சுவர்", te: "🏰 కోట గోడ" } },
      { key: "Twin Guard Towers", name: { en: "🏰 Twin Guard Towers", hi: "🏰 ट्विन टावर", gu: "🏰 બે બુરજ", mr: "🏰 दोन बुरुज", ta: "🏰 இரட்டை கோபுரங்கள்", te: "🏰 రక్షణ బురుజులు" } },
      { key: "Arched Main Gateway", name: { en: "🚪 Arched Castle Gate", hi: "🚪 मेहराबदार द्वार", gu: "🚪 કમાનાકાર દરવાજો", mr: "🚪 कमानदार दार", ta: "🚪 வளைவு நுழைவாயில்", te: "🚪 ధనుస్సు ఆకార తలుపు" } },
      { key: "Conical Spire Roofs", name: { en: "🔺 Conical Spire Roofs", hi: "🔺 मीनार की छतरी", gu: "🔺 શંકુ છત", mr: "🔺 निमुळती छते", ta: "🔺 கூம்பு கூரைகள்", te: "🔺 శంకువు కప్పులు" } }
    ],
    requiredKeys: ["Rectangular Castle Wall", "Twin Guard Towers", "Arched Main Gateway", "Conical Spire Roofs"],
    solution: ["Rectangular Castle Wall", "Twin Guard Towers", "Arched Main Gateway", "Conical Spire Roofs"],
    hint: {
      en: "Build the main wall, add watch towers on both sides, construct the arched gate, and place conical spires.",
      hi: "मुख्य दीवार बनाएं, दोनों तरफ बुर्ज जोड़ें, मेहराबदार द्वार लगाएं और मीनार की छतरी सजाएं।",
      gu: "મુખ્ય દીવાલ બનાવો, બંને બાજુ બુરજ લગાવો, દરવાજો મૂકો અને શંકુ છત લગાવો.",
      mr: "मुख्य भिंत बांधा, दोन्ही बाजूला बुरुज जोडा, कमानदार दार लावा आणि निमुळती छते बसवा.",
      ta: "முக்கிய சுவரை அமைத்து, இருபுறமும் கோபுரங்களைச் சேர்த்து, நுழைவாயிலை அமைத்து, கூம்புக் கூரைகளை வைக்கவும்.",
      te: "ప్రధాన గోడను నిర్మించి, ఇరువైపులా బురుజులను జోడించి, తలుపు అమర్చి, శంకువు కప్పులను ఉంచండి."
    }
  },
  {
    id: "robot",
    title: {
      en: "🤖 Friendly Robot Companion",
      hi: "🤖 फ्रेंडली रोबोट",
      gu: "🤖 રોબોટ મિત્ર",
      mr: "🤖 रोबोट सोबती",
      ta: "🤖 ரோபோ தோழன்",
      te: "🤖 ఫ్రెండ్లీ రోబోట్"
    },
    items: [
      { key: "Square Robot Head", name: { en: "🤖 Square Robot Head", hi: "🤖 वर्ग रोबोट सिर", gu: "🤖 ચોરસ માથું", mr: "🤖 चौरस डोके", ta: "🤖 சதுர ரோபோ தலை", te: "🤖 చతురస్ర రోబో తల" } },
      { key: "Chest Torso Body", name: { en: "🤖 Chest Torso Body", hi: "🤖 चेस्ट टॉर्बो बॉडी", gu: "🤖 છાતીનું બોડી", mr: "🤖 छातीचा भाग", ta: "🤖 ரோபோ உடல்", te: "🤖 రోబో శరీరం" } },
      { key: "Glowing Eye Lenses", name: { en: "👁️ Glowing Eye Lenses", hi: "👁️ चमकदार आंखें", gu: "👁️ ચમકતી આંખો", mr: "👁️ चमकदार डोळे", ta: "👁️ ஒளிரும் கண்கள்", te: "👁️ ప్రకాశించే కళ్ళు" } },
      { key: "Top Signal Antenna", name: { en: "📡 Signal Antenna", hi: "📡 सिग्नल एंटीना", gu: "📡 એન્ટેના", mr: "📡 अँटेना", ta: "📡 சிக்னல் ஆண்டெனா", te: "📡 సిగ్నల్ యాంటెన్నా" } }
    ],
    requiredKeys: ["Square Robot Head", "Chest Torso Body", "Glowing Eye Lenses", "Top Signal Antenna"],
    solution: ["Chest Torso Body", "Square Robot Head", "Glowing Eye Lenses", "Top Signal Antenna"],
    hint: {
      en: "Start with torso, attach robot head, install glowing sensor eyes, and fit top antenna.",
      hi: "टॉर्सो से शुरू करें, रोबोट सिर लगाएं, आंखें फिट करें और एंटीना लगाएं।",
      gu: "બોડીથી શરૂ કરો, માથું લગાવો, આંખો ફિટ કરો અને એન્ટેના લગાવો.",
      mr: "शरीरापासून सुरुवात करा, डोके जोडा, डोळे बसवा आणि अँटेना लावा.",
      ta: "உடலில் தொடங்கி, தலையை இணைத்து, கண்களைப் பொருத்தி, ஆண்டெனாவை வைக்கவும்.",
      te: "శరీరంతో ప్రారంభించి, తలని జోడించి, కళ్ళు అమర్చి, యాంటెన్నాను అమర్చండి."
    }
  },
  {
    id: "train",
    title: {
      en: "🚂 Steam Locomotive Train",
      hi: "🚂 स्टीम इंजन ट्रेन",
      gu: "🚂 સ્ટીમ એન્જિન ટ્રેન",
      mr: "🚂 वाफेचे इंजिन ट्रेन",
      ta: "🚂 நீராவி ரயில்",
      te: "🚂 స్టీమ్ ఇంజన్ రైలు"
    },
    items: [
      { key: "Steam Engine Boiler", name: { en: "🚂 Engine Boiler Tank", hi: "🚂 भाप बॉयलर टैंक", gu: "🚂 બોઈલર ટેન્ક", mr: "🚂 इंजिन बॉयलर", ta: "🚂 எஞ்சின் கொதிகலன்", te: "🚂 ఇంజన్ బాయిలర్" } },
      { key: "Driver Cabin Room", name: { en: "🏠 Driver Cabin Room", hi: "🏠 चालक केबिन", gu: "🏠 ડ્રાઇવર કેબિન", mr: "🏠 ड्रायव्हर केबिन", ta: "🏠 ஓட்டுனர் அறை", te: "🏠 డ్రైవర్ క్యాబిన్" } },
      { key: "Chimney Smokestack", name: { en: "🏭 Chimney Smokestack", hi: "🏭 चिमनी", gu: "🏭 ચિમની", mr: "🏭 धुराडे", ta: "🏭 புகைப்போக்கி", te: "🏭 పొగగొట్టం" } },
      { key: "Steel Drive Wheels", name: { en: "⚙️ Steel Drive Wheels", hi: "⚙️ लोहे के पहिए", gu: "⚙️ લોખંડના પૈડા", mr: "⚙️ पोलादी चाके", ta: "⚙️ இரும்பு சக்கரங்கள்", te: "⚙️ ఇనుప చక్రాలు" } }
    ],
    requiredKeys: ["Steam Engine Boiler", "Driver Cabin Room", "Chimney Smokestack", "Steel Drive Wheels"],
    solution: ["Steam Engine Boiler", "Driver Cabin Room", "Chimney Smokestack", "Steel Drive Wheels"],
    hint: {
      en: "Position engine boiler, attach cabin, mount smokestack on top, and fit the steel drive wheels.",
      hi: "बॉयलर टैंक रखें, केबिन लगाएं, चिमनी लगाएं और लोहे के पहिए जोड़ें।",
      gu: "બોઈલર ટેન્ક મૂકો, કેબિન જોડો, ચિમની લગાવો અને પૈડા જોડો.",
      mr: "बॉयलर ठेवा, केबिन जोडा, धुराडे बसवा आणि पोलादी चाके जोडा.",
      ta: "கொதிகலனை வைத்து, ஓட்டுனர் அறையை இணைத்து, புகைப்போக்கியை நட்டு, சக்கரங்களைப் பொருத்தவும்.",
      te: "బాయిలర్‌ను ఉంచి, క్యాబిన్‌ను జోడించి, పొగగొట్టాన్ని అమర్చి, చక్రాలను అమర్చండి."
    }
  }
];

export const WORD_BUILDER_VARIANTS = [
  {
    rootWord: 'Act',
    rootWordLoc: { en: 'Act (Action)', hi: 'Act (कार्य/क्रिया)', gu: 'Act (કાર્ય)', mr: 'Act (कृती)', ta: 'Act (செயல்)', te: 'Act (చర్య)' },
    affixes: [
      {
        affix: '-ion',
        word: 'Action',
        def: {
          en: 'Action: The process of doing something',
          hi: 'Action (क्रिया): कार्य करने की प्रक्रिया',
          gu: 'Action (કાર્ય): કંઈક કરવાની પ્રક્રિયા',
          mr: 'Action (कृती): कृती करण्याची प्रक्रिया',
          ta: 'Action (செயல்): ஒன்றைச் செய்யும் நிலை',
          te: 'Action (చర్య): ఏదైనా చేసే ప్రక్రియ'
        }
      },
      {
        affix: 'Re-',
        word: 'React',
        def: {
          en: 'React: To act in response to something',
          hi: 'React (प्रतिक्रिया): घटना पर प्रतिक्रिया देना',
          gu: 'React (પ્રતિક્રિયા): પ્રતિસાદ આપવો',
          mr: 'React (प्रतिक्रिया): प्रतिसादात्मक कृती',
          ta: 'React (எதிர்வினை): பதிலளிக்கும் செயல்',
          te: 'React (ప్రతిస్పందించు): స్పందించడం'
        }
      },
      {
        affix: '-ive',
        word: 'Active',
        def: {
          en: 'Active: Energetic and engaged in action',
          hi: 'Active (सक्रिय): ऊर्जावान या कार्यशील',
          gu: 'Active (સક્રિય): ઉત્સાહી અને કાર્યરત',
          mr: 'Active (सक्रिय): कार्यमग्न',
          ta: 'Active (சுறுசுறுப்பான): ஆற்றல்மிக்க செயல்',
          te: 'Active (చురుకైన): ఉత్సాహంగా పనిచేయడం'
        }
      }
    ]
  },
  {
    rootWord: 'Form',
    rootWordLoc: { en: 'Form (Shape)', hi: 'Form (रूप/आकार)', gu: 'Form (રૂપ)', mr: 'Form (रूप)', ta: 'Form (வடிவம்)', te: 'Form (రూపం)' },
    affixes: [
      {
        affix: 'Trans-',
        word: 'Transform',
        def: {
          en: 'Transform: Make a thorough change in form',
          hi: 'Transform (रूपांतरित करना): रूप पूरी तरह बदलना',
          gu: 'Transform (રૂપાંતરિત કરવું): આકાર બદલવો',
          mr: 'Transform (रूपांतरित करणे): बदल करणे',
          ta: 'Transform (மாற்றுதல்): உருவத்தை மாற்றுதல்',
          te: 'Transform (రూపాంతరం): మార్చడం'
        }
      },
      {
        affix: 'Re-',
        word: 'Reform',
        def: {
          en: 'Reform: Improve by alteration of structure',
          hi: 'Reform (सुधार): संरचना में सुधार करना',
          gu: 'Reform (સુધારો): સુધારો કરવો',
          mr: 'Reform (सुधारणा): सुधारणा करणे',
          ta: 'Reform (சீர்திருத்தம்): கட்டமைப்பை மேம்படுத்துதல்',
          te: 'Reform (సంస్కరణ): నిర్మాణాన్ని మెరుగుపరచడం'
        }
      }
    ]
  }
];

export const CIRCUIT_VARIANTS = [
  {
    id: 'series-light',
    title: {
      en: '💡 Series Lighting Circuit',
      hi: '💡 श्रेणी प्रकाश परिपथ',
      gu: '💡 શ્રેણી પ્રકાશ પરિપથ',
      mr: '💡 मालिका प्रकाश परिपथ',
      ta: '💡 தொடர் விளக்கு மின்சுற்று',
      te: '💡 సిరీస్ లైటింగ్ సర్క్యూట్'
    },
    components: [
      { key: 'battery', name: { en: '🔋 Battery Power', hi: '🔋 बैटरी पावर', gu: '🔋 બેટરી પાવર', mr: '🔋 बॅटरी', ta: '🔋 பேட்டரி', te: '🔋 బ్యాటరీ' }, icon: '🔋' },
      { key: 'switch', name: { en: '🔘 Toggle Switch', hi: '🔘 स्विच', gu: '🔘 સ્વિચ', mr: '🔘 कळी/स्विच', ta: '🔘 சுவிட்ச்', te: '🔘 స్విచ్' }, icon: '🔘' },
      { key: 'bulb', name: { en: '💡 Light Bulb', hi: '💡 बल्ब', gu: '💡 બલ્બ', mr: '💡 दिवा/बल्ब', ta: '💡 மின்விளக்கு', te: '💡 బల్బు' }, icon: '💡' }
    ]
  },
  {
    id: 'motor-fan',
    title: {
      en: '🌀 Motor Fan Circuit',
      hi: '🌀 मोटर पंखा परिपथ',
      gu: '🌀 મોટર પંખો પરિપથ',
      mr: '🌀 मोटर पंखा परिपथ',
      ta: '🌀 மோட்டார் விசிறி மின்சுற்று',
      te: '🌀 మోటార్ ఫ్యాన్ సర్క్యూట్'
    },
    components: [
      { key: 'battery', name: { en: '🔋 DC Battery', hi: '🔋 डीसी बैटरी', gu: '🔋 ડીસી બેટરી', mr: '🔋 बॅटरी', ta: '🔋 பேட்டரி', te: '🔋 బ్యాటరీ' }, icon: '🔋' },
      { key: 'switch', name: { en: '🔘 Control Switch', hi: '🔘 नियंत्रण स्विच', gu: '🔘 કંટ્રોલ સ્વિચ', mr: '🔘 कळी', ta: '🔘 சுவிட்ச்', te: '🔘 స్విచ్' }, icon: '🔘' },
      { key: 'motor', name: { en: '🌀 Electric Motor', hi: '🌀 इलेक्ट्रिक मोटर', gu: '🌀 મોટર', mr: '🌀 मोटार', ta: '🌀 மோட்டார்', te: '🌀 మోటార్' }, icon: '🌀' }
    ]
  },
  {
    id: 'alarm-buzzer',
    title: {
      en: '🔔 Security Buzzer Circuit',
      hi: '🔔 सुरक्षा बज़र परिपथ',
      gu: '🔔 સુરક્ષા બઝર પરિપથ',
      mr: '🔔 अलार्म परिपथ',
      ta: '🔔 பாதுகாப்பு அலாரம் மின்சுற்று',
      te: '🔔 సెక్యూరిటీ బజర్ సర్క్యూట్'
    },
    components: [
      { key: 'battery', name: { en: '🔋 Battery Power', hi: '🔋 बैटरी', gu: '🔋 બેટરી', mr: '🔋 बॅटरी', ta: '🔋 பேட்டரி', te: '🔋 బ్యాటరీ' }, icon: '🔋' },
      { key: 'switch', name: { en: '🔘 Sensor Switch', hi: '🔘 सेंसर स्विच', gu: '🔘 સેન્સર સ્વિચ', mr: '🔘 स्विच', ta: '🔘 சுவிட்ச்', te: '🔘 స్విచ్' }, icon: '🔘' },
      { key: 'buzzer', name: { en: '🔔 Alarm Buzzer', hi: '🔔 अलार्म बज़र', gu: '🔔 બઝર', mr: '🔔 गजर/बझर', ta: '🔔 அலாரம்', te: '🔔 బజర్' }, icon: '🔔' }
    ]
  },
  {
    id: 'solar-led',
    title: {
      en: '☀️ Solar Panel LED Circuit',
      hi: '☀️ सौर पैनल एलईडी परिपथ',
      gu: '☀️ સોલર પેનલ એલઇડી પરિપથ',
      mr: '☀️ सौर ऊर्जा परिपथ',
      ta: '☀️ சூரிய மின்சக்தி LED மின்சுற்று',
      te: '☀️ సోలార్ ప్యానెల్ LED సర్క్యూట్'
    },
    components: [
      { key: 'solar', name: { en: '☀️ Solar Cell', hi: '☀️ सौर सेल', gu: '☀️ સોલર સેલ', mr: '☀️ सौर सेल', ta: '☀️ சூரிய மின்கலம்', te: '☀️ సోలార్ సెల్' }, icon: '☀️' },
      { key: 'switch', name: { en: '🔘 Main Switch', hi: '🔘 मुख्य स्विच', gu: '🔘 મુખ્ય સ્વિચ', mr: '🔘 मुख्य कळी', ta: '🔘 சுவிட்ச்', te: '🔘 స్విచ్' }, icon: '🔘' },
      { key: 'led', name: { en: '💡 Glowing LED', hi: '💡 ग्लोइंग एलईडी', gu: '💡 એલઇડી લાઈટ', mr: '💡 एलईडी दिवा', ta: '💡 LED விளக்கு', te: '💡 LED લાઇટ' }, icon: '💡' }
    ]
  },
  {
    id: 'electromagnet-circuit',
    title: {
      en: '🧲 Electromagnet Coil Circuit',
      hi: '🧲 विद्युत चुंबक परिपथ',
      gu: '🧲 વિદ્યુત ચુંબક પરિપથ',
      mr: '🧲 विद्युत चुंबक परिपथ',
      ta: '🧲 மின்காந்தச் சுற்று',
      te: '🧲 విద్యుదయస్కాంత సర్క్యూట్'
    },
    components: [
      { key: 'battery', name: { en: '🔋 High-Current Battery', hi: '🔋 उच्च धारा बैटरी', gu: '🔋 બેટરી', mr: '🔋 बॅटरी', ta: '🔋 பேட்டரி', te: '🔋 బ్యాటరీ' }, icon: '🔋' },
      { key: 'switch', name: { en: '🔘 Push Button Switch', hi: '🔘 पुश बटन स्विच', gu: '🔘 પુશ બટન સ્વિચ', mr: '🔘 कळी', ta: '🔘 சுவிட்ச்', te: '🔘 స్విచ్' }, icon: '🔘' },
      { key: 'coil', name: { en: '🧲 Iron Core Solenoid Coil', hi: '🧲 लोहे की क्रोड वाली कुंडली', gu: '🧲 સોલેનોઇડ કોઈલ', mr: '🧲 विद्युत कॉइल', ta: '🧲 மின்காந்த சுருள்', te: '🧲 విద్యుదయస్కాంత తీగచుట్ట' }, icon: '🧲' }
    ]
  },
  {
    id: 'dimmer-resistor',
    title: {
      en: '🎛️ Variable Resistor Lamp Dimmer',
      hi: '🎛️ परिवर्ती प्रतिरोधक लैंप डिमर',
      gu: '🎛️ રિઓસ્ટેટ લેમ્પ ડિમર પરિપથ',
      mr: '🎛️ व्हेरिएबल रेझिस्टर परिपथ',
      ta: '🎛️ மாறுபடும் மின்தடை விளக்கு சுற்று',
      te: '🎛️ వేరియబుల్ రెసిస్టర్ ల్యాంప్ సర్క్యూట్'
    },
    components: [
      { key: 'battery', name: { en: '🔋 9V Battery Pack', hi: '🔋 9V बैटरी पैक', gu: '🔋 9V બેટરી', mr: '🔋 9V बॅटरी', ta: '🔋 9V பேட்டரி', te: '🔋 9V బ్యాటరీ' }, icon: '🔋' },
      { key: 'rheostat', name: { en: '🎛️ Rheostat / Resistor', hi: '🎛️ रिओस्टेट / प्रतिरोधक', gu: '🎛️ રિઓસ્ટેટ', mr: '🎛️ रेझिस्टर', ta: '🎛️ மின்தடை', te: '🎛️ రెసిస్టర్' }, icon: '🎛️' },
      { key: 'bulb', name: { en: '💡 Dimmable Lamp', hi: '💡 डिमेबल लैंप', gu: '💡 લેમ્પ', mr: '💡 दिवा', ta: '💡 மின்விளக்கு', te: '💡 దీపం' }, icon: '💡' }
    ]
  }
];

export const MEMORY_VARIANTS = [
  {
    title: {
      en: '📐 Math Symbols & Constants',
      hi: '📐 गणितीय प्रतीक और स्थिरांक',
      gu: '📐 ગણિતના ચિહ્નો અને અચળાંકો',
      mr: '📐 गणितीय चिन्हे आणि स्थिरांक',
      ta: '📐 கணிதக் குறியீடுகள் & மாறிலிகள்',
      te: '📐 గణిత చిహ్నాలు & స్థిరాంకాలు'
    },
    pairs: [
      { pairId: 1, symbol: 'π', text: { en: 'Pi (3.14)', hi: 'पाई (3.14)', gu: 'પાઈ (3.14)', mr: 'पाई (3.14)', ta: 'பை (3.14)', te: 'పై (3.14)' } },
      { pairId: 2, symbol: '√', text: { en: 'Square Root', hi: 'वर्गमूल', gu: 'વર્ગમૂળ', mr: 'वर्गमूळ', ta: 'வர்க்கமூலம்', te: 'వర్గమూలం' } },
      { pairId: 3, symbol: '∑', text: { en: 'Summation', hi: 'योग (Sum)', gu: 'સરવાળો', mr: 'बेरीज', ta: 'கூடுதல்', te: 'మొత్తం' } },
      { pairId: 4, symbol: '∞', text: { en: 'Infinity', hi: 'अनंत', gu: 'અનંત', mr: 'अनंत', ta: 'முடிவிலி', te: 'అనంతం' } }
    ]
  },
  {
    title: {
      en: '🧪 Chemical Elements & Symbols',
      hi: '🧪 रासायनिक तत्व और प्रतीक',
      gu: '🧪 રાસાયણિક તત્વો અને સંજ્ઞાઓ',
      mr: '🧪 रासायनिक मूलद्रव्ये आणि संज्ञा',
      ta: '🧪 வேதியியல் தனிமங்கள் & குறியீடுகள்',
      te: '🧪 రసాయన మూలకాలు & చిహ్నాలు'
    },
    pairs: [
      { pairId: 1, symbol: 'Au', text: { en: 'Gold Element', hi: 'सोना (Gold)', gu: 'સોનું (Gold)', mr: 'सोने (Gold)', ta: 'தங்கம் (Gold)', te: 'బంగారం (Gold)' } },
      { pairId: 2, symbol: 'Fe', text: { en: 'Iron Element', hi: 'लोहा (Iron)', gu: 'લોખંડ (Iron)', mr: 'लोखंड (Iron)', ta: 'இரும்பு (Iron)', te: 'ఇనుము (Iron)' } },
      { pairId: 3, symbol: 'O', text: { en: 'Oxygen Gas', hi: 'ऑक्सीजन गैस', gu: 'ઓક્સિજન વાયુ', mr: 'ऑक्सिजन वायू', ta: 'ஆக்ஸிஜன் வாயு', te: 'ఆక్సిజన్ వాయువు' } },
      { pairId: 4, symbol: 'Na', text: { en: 'Sodium Metal', hi: 'सोडियम धातु', gu: 'સોડિયમ ધાતુ', mr: 'સોડિઅમ ધાતુ', ta: 'சோடியம் உலோகம்', te: 'సోడియం లోహం' } }
    ]
  },
  {
    title: {
      en: '📏 Physics Units & Quantities',
      hi: '📏 भौतिक इकाइयां और राशियां',
      gu: '📏 ભૌતિક એકમો અને રાશિઓ',
      mr: '📏 भौतिक एकके आणि राशी',
      ta: '📏 இயற்பியல் அலகுகள்',
      te: '📏 భౌతిక ప్రమాణాలు'
    },
    pairs: [
      { pairId: 1, symbol: 'N', text: { en: 'Newton (Force)', hi: 'न्यूटन (बल)', gu: 'ન્યૂટન (બળ)', mr: 'न्यूटन (बल)', ta: 'நியூட்டன் (விசை)', te: 'న్యూటన్ (బలం)' } },
      { pairId: 2, symbol: 'J', text: { en: 'Joule (Energy)', hi: 'जूल (ऊर्जा)', gu: 'જૂલ (ઉર્જા)', mr: 'ज्यूल (ऊर्जा)', ta: 'ஜூல் (ஆற்றல்)', te: 'జూల్ (శక్తి)' } },
      { pairId: 3, symbol: 'W', text: { en: 'Watt (Power)', hi: 'वाट (शक्ति)', gu: 'વોટ (શક્તિ)', mr: 'व्हॉट (शक्ती)', ta: 'வாட் (திறன்)', te: 'వాట్ (సామర్థ్యం)' } },
      { pairId: 4, symbol: 'V', text: { en: 'Volt (Voltage)', hi: 'वोल्ट (वोल्टेज)', gu: 'વોલ્ટ (વોલ્ટેજ)', mr: 'व्होल्ट (विभवांतर)', ta: 'வோல்ட் (மின்னழுத்தம்)', te: 'వోల్ట్ (వోల్టేజ్)' } }
    ]
  },
  {
    title: {
      en: '🪐 Solar System & Planets',
      hi: '🪐 सौरमंडल और ग्रह',
      gu: '🪐 સૂર્યમંડળ અને ગ્રહો',
      mr: '🪐 सूर्यमाला आणि ग्रह',
      ta: '🪐 சூரிய குடும்பம் & கோள்கள்',
      te: '🪐 సౌర వ్యవస్థ & గ్రహాలు'
    },
    pairs: [
      { pairId: 1, symbol: '🔴', text: { en: 'Mars (Red Planet)', hi: 'मंगल (लाल ग्रह)', gu: 'મંગળ (લાલ ગ્રહ)', mr: 'मंगळ (लाल ग्रह)', ta: 'செவ்வாய் (சிவப்பு கோள்)', te: 'అంగారకుడు (ఎర్ర గ్రహం)' } },
      { pairId: 2, symbol: '🪐', text: { en: 'Saturn (Ringed Planet)', hi: 'शनि (वलय युक्त ग्रह)', gu: 'શનિ (વલય વાળો ગ્રહ)', mr: 'शनि (कड्यांचा ग्रह)', ta: 'சனி (வளையக் கோள்)', te: 'శని (రింగుల గ్రహం)' } },
      { pairId: 3, symbol: '☀️', text: { en: 'Sun (Central Star)', hi: 'सूर्य (तारा)', gu: 'સૂર્ય (તારો)', mr: 'सूर्य (तारा)', ta: 'சூரியன் (நட்சத்திரம்)', te: 'సూర్యుడు (నక్షత్రం)' } },
      { pairId: 4, symbol: '🌕', text: { en: 'Moon (Earth Satellite)', hi: 'चंद्रमा (उपग्रह)', gu: 'ચંદ્ર (ઉપગ્રહ)', mr: 'चंद्र (उपग्रह)', ta: 'நிலவு (துணைக்கோள்)', te: 'చంద్రుడు (ఉపగ్రహం)' } }
    ]
  }
];

export const TIMELINE_VARIANTS = [
  {
    title: {
      en: '🇮🇳 Indian Freedom Movement Timeline',
      hi: '🇮🇳 भारतीय स्वतंत्रता संग्राम समयरेखा',
      gu: '🇮🇳 ભારતીય સ્વતંત્રતા સંગ્રામ સમયરેખા',
      mr: '🇮🇳 भारतीय स्वातंत्र्य लढा कालरेषा',
      ta: '🇮🇳 இந்திய சுதந்திரப் போராட்ட காலவரிசை',
      te: '🇮🇳 భారత స్వాతంత్య్రోద్యమ టైమ్‌లైన్'
    },
    items: [
      { id: 1, title: { en: '🇮🇳 Dandi March (1930)', hi: '🇮🇳 दांडी यात्रा (1930)', gu: '🇮🇳 દાંડી કૂચ (1930)', mr: '🇮🇳 दांडी यात्रा (1930)', ta: '🇮🇳 தண்டி யாத்திரை (1930)', te: '🇮🇳 దండి మార్చ్ (1930)' } },
      { id: 2, title: { en: '✊ Quit India Movement (1942)', hi: '✊ भारत छोड़ो आंदोलन (1942)', gu: '✊ હિંદ છોડો ચળવળ (1942)', mr: '✊ भारत छोडो आंदोलन (1942)', ta: '✊ வெள்ளையனே வெளியேறு (1942)', te: '✊ క్విట్ ఇండియా ఉద్యమం (1942)' } },
      { id: 3, title: { en: '🕊️ Indian Independence Day (1947)', hi: '🕊️ स्वतंत्रता दिवस (1947)', gu: '🕊️ સ્વાતંત્ર્ય દિન (1947)', mr: '🕊️ स्वातंत्र्य दिन (1947)', ta: '🕊️ சுதந்திர தினம் (1947)', te: '🕊️ స్వాతంత్య్ర దినోత్సవం (1947)' } },
      { id: 4, title: { en: '📜 Constitution Adopted (1950)', hi: '📜 संविधान लागू (1950)', gu: '📜 બંધારણ અમલી (1950)', mr: '📜 संविधान लागू (1950)', ta: '📜 அரசியலமைப்பு சட்டம் (1950)', te: '📜 రాజ్యాంగం అమలు (1950)' } }
    ],
    solutionIds: [1, 2, 3, 4],
    explanation: {
      en: 'Dandi March (1930) → Quit India (1942) → Independence (1947) → Constitution (1950).',
      hi: 'दांडी यात्रा (1930) → भारत छोड़ो (1942) → स्वतंत्रता (1947) → संविधान (1950)।',
      gu: 'દાંડી કૂચ (1930) → હિંદ છોડો (1942) → આઝાદી (1947) → બંધારણ (1950).',
      mr: 'दांडी मार्च (1930) → भारत छोडो (1942) → स्वातंत्र्य (1947) → संविधान (1950).',
      ta: 'தண்டி யாத்திரை (1930) → வெள்ளையனே வெளியேறு (1942) → சுதந்திரம் (1947) → அரசியலமைப்பு (1950).',
      te: 'దండి మార్చ్ (1930) → క్విట్ ఇండియా (1942) → స్వాతంత్య్రం (1947) → రాజ్యాంగం (1950).'
    }
  },
  {
    title: {
      en: '👑 Ancient & Medieval Empires of India',
      hi: '👑 भारत के प्राचीन और मध्यकालीन साम्राज्य',
      gu: '👑 ભારતના પ્રાચીન અને મધ્યકાલીન સામ્રાજ્યો',
      mr: '👑 भारतातील प्राचीन आणि मध्ययुगीन साम्राज्ये',
      ta: '👑 இந்தியாவின் பழங்கால பேரரசுகள்',
      te: '👑 భారతదేశ ప్రాచీన మరియు మధ్యయుగ సామ్రాజ్యాలు'
    },
    items: [
      { id: 1, title: { en: '🏛️ Maurya Empire Founded (322 BCE)', hi: '🏛️ मौर्य साम्राज्य की स्थापना (322 ईसा पूर्व)', gu: '🏛️ મૌર્ય સામ્રાજ્યની સ્થાપના (322 ઈ.પૂ.)', mr: '🏛️ मौर्य साम्राज्याची स्थापना (322 ई.पूर्व)', ta: '🏛️ மௌரிய பேரரசு உருவாக்கம் (கி.மு 322)', te: '🏛️ మౌర్య సామ్రాజ్య స్థాపన (క్రీ.పూ 322)' } },
      { id: 2, title: { en: '☸️ Ashoka War & Edicts (261 BCE)', hi: '☸️ अशोक का कलिंग युद्ध व शिलालेख (261 ईसा पूर्व)', gu: '☸️ અશોક કલિંગ યુદ્ધ અને શિલાલેખ (261 ઈ.પૂ.)', mr: '☸️ सम्राट अशोक कलिंग युद्ध (261 ई.पूर्व)', ta: '☸️ அசோகரின் கலிங்கப் போர் (கி.மு 261)', te: '☸️ అశోకుని కళింగ యుద్ధం (క్రీ.పూ 261)' } },
      { id: 3, title: { en: '✨ Gupta Empire Golden Age (320 CE)', hi: '✨ गुप्त साम्राज्य स्वर्ण युग (320 ईस्वी)', gu: '✨ ગુપ્ત સામ્રાજ્ય સુવર્ણ યુગ (320 ઈ.સ.)', mr: '✨ गुप्त साम्राज्याचा सुवर्णकाळ (320 ई.स.)', ta: '✨ குப்த பேரரசின் பொற்காலம் (கி.பி 320)', te: '✨ గుప్త సామ్రాజ్య స్వర్ణయుగం (క్రీ.శ 320)' } },
      { id: 4, title: { en: '⛵ Chola Maritime Expansion (1014 CE)', hi: '⛵ चोल राजवंश का समुद्री विस्तार (1014 ईस्वी)', gu: '⛵ ચોલ સામ્રાજ્ય દરિયાઈ વિસ્તરણ (1014 ઈ.સ.)', mr: '⛵ चोळ राजघराण्याचा सागरी विस्तार (1014 ई.સ.)', ta: '⛵ சோழர்களின் கடற்படை விரிவாக்கம் (கி.பி 1014)', te: '⛵ చోళ సామ్రాజ్య నావికా విస్తరణ (క్రీ.శ 1014)' } }
    ],
    solutionIds: [1, 2, 3, 4],
    explanation: {
      en: 'Maurya Empire (322 BCE) → Ashoka Edicts (261 BCE) → Gupta Golden Age (320 CE) → Chola Navy (1014 CE).',
      hi: 'मौर्य साम्राज्य (322 ईसा पूर्व) → अशोक शिलालेख (261 ईसा पूर्व) → गुप्त स्वर्ण युग (320 ईस्वी) → चोल विस्तार (1014 ईस्वी)।',
      gu: 'મૌર્ય સામ્રાજ્ય → અશોક શિલાલેખ → ગુપ્ત સુવર્ણ યુગ → ચોલ સામ્રાજ્ય.',
      mr: 'मौर्य साम्राज्य → अशोक शिलालेख → गुप्त सुवर्णकाळ → चोळ साम्राज्य.',
      ta: 'மௌரிய பேரரசு → அசோகர் கல்வெட்டுகள் → குப்தர்களின் பொற்காலம் → சோழர்களின் விரிவாக்கம்.',
      te: 'మౌర్య సామ్రాజ్యం → అశోక శాసనాలు → గుప్త స్వర్ణయుగం → చోళుల నావికా విస్తరణ.'
    }
  },
  {
    title: {
      en: '🚀 Human Space Exploration Milestones',
      hi: '🚀 मानव अंतरिक्ष खोज के मील के पत्थर',
      gu: '🚀 માનવ અંતરિક્ષ સંશોધનના તબક્કા',
      mr: '🚀 मानवी अंतराळ मोहिमांचा इतिहास',
      ta: '🚀 விண்வெளி ஆராய்ச்சியின் மைல்கற்கள்',
      te: '🚀 మానవ అంతరిక్ష పరిశోధన మైలురాళ్లు'
    },
    items: [
      { id: 1, title: { en: '🛰️ Sputnik 1 Satellite Launched (1957)', hi: '🛰️ स्पुतनिक 1 पहला उपग्रह लॉन्च (1957)', gu: '🛰️ સ્પુતનિક 1 પ્રથમ સેટેલાઇટ (1957)', mr: '🛰️ स्पुतनिक 1 पहिला उपग्रह (1957)', ta: '🛰️ ஸ்புட்னிக் 1 செயற்கைக்கோள் (1957)', te: '🛰️ స్పుత్నిక్ 1 తొలి ఉపగ్రహం (1957)' } },
      { id: 2, title: { en: '👨‍🚀 Yuri Gagarin Space Flight (1961)', hi: '👨‍🚀 यूरी गागरिन की अंतरिक्ष उड़ान (1961)', gu: '👨‍🚀 યુરી ગાગરીન પ્રથમ અંતરિક્ષ યાત્રા (1961)', mr: '👨‍🚀 युरी गगारिन अंतराळ प्रवास (1961)', ta: '👨‍🚀 யூரி ககாரின் விண்வெளி பயணம் (1961)', te: '👨‍🚀 యూరీ గగారిన్ వ్యోమయాత్ర (1961)' } },
      { id: 3, title: { en: '🌕 Apollo 11 Moon Landing (1969)', hi: '🌕 अपोलो 11 चंद्रमा पर कदम (1969)', gu: '🌕 અપોલો 11 ચંદ્ર લેન્ડિંગ (1969)', mr: '🌕 अपोलो 11 चंद्रावर पाऊल (1969)', ta: '🌕 அப்பல்லோ 11 நிலவில் தரையிறக்கம் (1969)', te: '🌕 అపోలో 11 చంద్రునిపై కాలుమోపడం (1969)' } },
      { id: 4, title: { en: '🇮🇳 ISRO Chandrayaan-1 Moon Discovery (2008)', hi: '🇮🇳 इसरो चंद्रयान-1 जल खोज (2008)', gu: '🇮🇳 ઈસરો ચંદ્રયાન-1 ચંદ્ર મિશન (2008)', mr: '🇮🇳 इस्रो चांद्रयान-1 चंद्र मोहीम (2008)', ta: '🇮🇳 இஸ்ரோ சந்திரயான்-1 விண்கலம் (2008)', te: '🇮🇳 ఇస్రో చంద్రయాన్-1 ప్రయోగం (2008)' } }
    ],
    solutionIds: [1, 2, 3, 4],
    explanation: {
      en: 'Sputnik 1 (1957) → Yuri Gagarin (1961) → Apollo 11 Moon (1969) → Chandrayaan-1 (2008).',
      hi: 'स्पुतनिक 1 (1957) → यूरी गागरिन (1961) → अपोलो 11 (1969) → चंद्रयान-1 (2008)।',
      gu: 'સ્પુતનિક 1 (1957) → યુરી ગાગરીન (1961) → અપોલો 11 (1969) → ચંદ્રયાન-1 (2008).',
      mr: 'स्पुतनिक 1 (1957) → युरी गगारिन (1961) → अपोलो 11 (1969) → चांद्रयान-1 (2008).',
      ta: 'ஸ்புட்னிக் 1 (1957) → யூரி ககாரின் (1961) → அப்பல்லோ 11 (1969) → சந்திரயான்-1 (2008).',
      te: 'స్పుత్నిక్ 1 (1957) → యూరీ గగారిన్ (1961) → అపోలో 11 (1969) → చంద్రయాన్-1 (2008).'
    }
  }
];

export const SEQUENCE_VARIANTS = [
  {
    title: {
      en: '🔄 The Water Cycle Process',
      hi: '🔄 जल चक्र प्रक्रिया',
      gu: '🔄 જળચક્ર પ્રક્રિયા',
      mr: '🔄 जलचक्र प्रक्रिया',
      ta: '🔄 நீர் சுழற்சி செயல்முறை',
      te: '🔄 నీటి చక్రం ప్రక్రియ'
    },
    items: [
      { id: 1, title: { en: '☀️ Evaporation', hi: '☀️ वाष्पीकरण', gu: '☀️ બાષ્પીભવન', mr: '☀️ बाष्पीभवन', ta: '☀️ ஆவியாதல்', te: '☀️ బాష్పీభవనం' } },
      { id: 2, title: { en: '☁️ Condensation', hi: '☁️ संघनन', gu: '☁️ ઘનીભવન', mr: '☁️ सांद्रीभवन', ta: '☁️ சுருங்குதல்', te: '☁️ సాంద్రీకరణం' } },
      { id: 3, title: { en: '🌧️ Precipitation', hi: '🌧️ वर्षा', gu: '🌧️ વર્ષણ', mr: '🌧️ पर्जन्यवृष्टी', ta: '🌧️ மழைப்பொழிவு', te: '🌧️ వర్షపాతం' } },
      { id: 4, title: { en: '🌊 Collection', hi: '🌊 जल संग्रहण', gu: '🌊 જળ સંગ્રહ', mr: '🌊 जल संकलन', ta: '🌊 சேகரிப்பு', te: '🌊 సేకరణ' } }
    ],
    solutionIds: [1, 2, 3, 4],
    explanation: {
      en: 'Evaporation → Condensation → Precipitation → Collection.',
      hi: 'वाष्पीकरण → संघनन → वर्षा → जल संग्रहण।',
      gu: 'બાષ્પીભવન → ઘનીભવન → વર્ષણ → જળ સંગ્રહ.',
      mr: 'बाष्पीभवन → सांद्रीभवन → पर्जन्यवृष्टी → जल संकलन.',
      ta: 'ஆவியாதல் → சுருங்குதல் → மழைப்பொழிவு → சேகரிப்பு.',
      te: 'బాష్పీభవనం → సాంద్రీకరణం → వర్షపాతం → సేకరణ.'
    }
  },
  {
    title: {
      en: '🌱 Plant Seed Germination Lifecycle',
      hi: '🌱 पौधे का बीज अंकुरण जीवन चक्र',
      gu: '🌱 છોડનું બીજ અંકુરણ જીવનચક્ર',
      mr: '🌱 वनस्पती बीज अंकुरण जीवनचक्र',
      ta: '🌱 தாவர விதை முளைக்கும் வாழ்க்கை சுழற்சி',
      te: '🌱 మొక్కల విత్తన అంకురోత్పత్తి జీవిత చక్రం'
    },
    items: [
      { id: 1, title: { en: '💧 Seed Imbibition & Moisture Absorption', hi: '💧 बीज द्वारा जल अवशोषण', gu: '💧 બીજ દ્વારા પાણીનું શોષણ', mr: '💧 बीजाद्वारे पाणी शोषण', ta: '💧 விதை நீர் உறிஞ்சுதல்', te: '💧 విత్తనం నీటిని పీల్చుకోవడం' } },
      { id: 2, title: { en: '🌱 Radicle Emergence (First Root)', hi: '🌱 मूलांकुर का निकलना (पहली जड़)', gu: '🌱 મૂળનું અંકુરણ (પ્રથમ મૂળ)', mr: '🌱 मुळांची निर्मिती', ta: '🌱 வேர் முளைத்தல்', te: '🌱 మొదటి వేరు రావడం' } },
      { id: 3, title: { en: '🌿 Shoot & Cotyledon Rise', hi: '🌿 प्रांकुर और बीजपत्र का विकास', gu: '🌿 અંકુર અને બીજપત્રનો વિકાસ', mr: '🌿 कोब बाहेर येणे', ta: '🌿 தளிர் & இலை உருவாக்கம்', te: '🌿 మొలక పైకి రావడం' } },
      { id: 4, title: { en: '☀️ True Leaves & Photosynthesis', hi: '☀️ वास्तविक पत्तियां व प्रकाश संश्लेषण', gu: '☀️ સાચા પાંદડા અને પ્રકાશસંશ્લેષણ', mr: '☀️ खरी पाने व प्रकाशसंश्लेषण', ta: '☀️ உண்மையான இலைகள் & ஒளிச்சேர்க்கை', te: '☀️ అసలైన ఆకులు & కిరణజన్య సంయోగక్రియ' } }
    ],
    solutionIds: [1, 2, 3, 4],
    explanation: {
      en: 'Water Absorption → Radicle Root → Shoot Rise → True Leaves & Photosynthesis.',
      hi: 'जल अवशोषण → पहली जड़ (मूलांकुर) → प्रांकुर का विकास → वास्तविक पत्तियां।',
      gu: 'પાણીનું શોષણ → મૂળનું અંકુરણ → અંકુર બહાર આવવું → સાચા પાંદડા.',
      mr: 'पाणी शोषण → मुळांची वाढ → कोब बाहेर येणे → पाने व प्रकाशसंश्लेषण.',
      ta: 'நீர் உறிஞ்சுதல் → வேர் முளைத்தல் → தளிர் உருவாக்கம் → இலைகள் & ஒளிச்சேர்க்கை.',
      te: 'నీటి శోషణ → వేరు రావడం → మొలక పైకి రావడం → ఆకులు & కిరణజన్య సంయోగక్రియ.'
    }
  },
  {
    title: {
      en: '🍔 Human Digestive System Journey',
      hi: '🍔 मानव पाचन तंत्र की यात्रा',
      gu: '🍔 માનવ પાચનતંત્રની યાત્રા',
      mr: '🍔 मानवी पचनसंस्थेचा मार्ग',
      ta: '🍔 மனித செரிமான மண்டல பயணம்',
      te: '🍔 మానవ జీర్ణవ్యవస్థ ప్రయాణం'
    },
    items: [
      { id: 1, title: { en: '👄 Mouth (Mastication & Salivary Amylase)', hi: '👄 मुख (चबाना और लार एमाइलेज)', gu: '👄 મુખ (ચાવવું અને લાળ રસ)', mr: '👄 तोंड (चावणे व लाळ)', ta: '👄 வாய் (மெல்லுதல் & உமிழ்நீர்)', te: '👄 నోరు (నమలడం & లాలాజలం)' } },
      { id: 2, title: { en: '🫁 Esophagus (Peristalsis Swallowing)', hi: '🫁 ग्रसिका (क्रमाकुंचन गति)', gu: '🫁 અન્નનળી (ખોરાક વહન)', mr: '🫁 अन्ननलिका (गिळणे)', ta: '🫁 உணவுக்குழாய்', te: '🫁 అన్నవాహిక' } },
      { id: 3, title: { en: '🥣 Stomach (Gastric Acid & Pepsin)', hi: '🥣 आमाशय (जठर रस और पेप्सिन)', gu: '🥣 જઠર (જઠરરસ અને પેપ્સિન)', mr: '🥣 जठर (आम्ल व पेप्सिन)', ta: '🥣 இரைப்பை (அமிலம் & பெப்சின்)', te: '🥣 జీర్ణాశయం (ఆమ్లం & పెప్సిన్)' } },
      { id: 4, title: { en: '🩸 Small Intestine (Villi Nutrient Absorption)', hi: '🩸 छोटी आंत (पोषक तत्वों का अवशोषण)', gu: '🩸 નાનું આંતરડું (પોષક તત્વોનું શોષણ)', mr: '🩸 लहान आतडे (पोषकद्रव्य शोषण)', ta: '🩸 சிறுகுடல் (ஊட்டச்சத்து உறிஞ்சுதல்)', te: '🩸 చిన్న ప్రేగు (పోషకాల శోషణ)' } }
    ],
    solutionIds: [1, 2, 3, 4],
    explanation: {
      en: 'Mouth → Esophagus → Stomach → Small Intestine absorption.',
      hi: 'मुख → ग्रसिका → आमाशय (पेट) → छोटी आंत में अवशोषण।',
      gu: 'મુખ → અન્નનળી → જઠર → નાનું આંતરડું.',
      mr: 'तोंड → अन्ननलिका → जठर → लहान आतडे.',
      ta: 'வாய் → உணவுக்குழாய் → இரைப்பை → சிறுகுடல்.',
      te: 'నోరు → అన్నవాహిక → జీర్ణాశయం → చిన్న ప్రేగు.'
    }
  },
  {
    title: {
      en: '🦋 Butterfly Metamorphosis Stages',
      hi: '🦋 तितली का कायांतरण (जीवन चक्र)',
      gu: '🦋 પતંગિયાનું રૂપાંતરણ (જીવનચક્ર)',
      mr: '🦋 फुलपाखराचे रूपांतरण (जीवनचक्र)',
      ta: '🦋 வண்ணத்துப்பூச்சியின் உருமாற்ற நிலைகள்',
      te: '🦋 సీతాకోకచిలుక రూపాంతర దశలు'
    },
    items: [
      { id: 1, title: { en: '🥚 Egg Laid on Leaf', hi: '🥚 पत्ती पर दिया गया अंडा', gu: '🥚 પાંદડા પર મૂકેલું ઈંડું', mr: '🥚 पानावर दिलेले अंडे', ta: '🥚 இலையில் இடப்பட்ட முட்டை', te: '🥚 ఆకుపై పెట్టిన గుడ్డు' } },
      { id: 2, title: { en: '🐛 Larva (Hungry Caterpillar)', hi: '🐛 लार्वा (कैटरपिलर / इल्ली)', gu: '🐛 ઈયળ (કેટરપિલર)', mr: '🐛 अळी (कॅटरपिलर)', ta: '🐛 கம்பளிப்பூச்சி (லார்வா)', te: '🐛 గొంగళి పురుగు (లార్వా)' } },
      { id: 3, title: { en: '🛖 Pupa / Chrysalis Cocoon', hi: '🛖 प्यूपा / कोकून (Chrysalis)', gu: '🛖 કોશેટો (પ્યુપા)', mr: '🛖 कोष (प्युपा)', ta: '🛖 கூட்டுப்புழு (பியூப்பா)', te: '🛖 ప్యూపా (కోశస్థ దశ)' } },
      { id: 4, title: { en: '🦋 Adult Winged Butterfly Emergence', hi: '🦋 वयस्क पंखों वाली सुंदर तितली', gu: '🦋 પુખ્ત પાંખોવાળું પતંગિયું', mr: '🦋 प्रौढ सुंदर फुलपाखरू', ta: '🦋 முழு வண்ணத்துப்பூச்சி', te: '🦋 రెక్కలు గల సీతాకోకచిలుక' } }
    ],
    solutionIds: [1, 2, 3, 4],
    explanation: {
      en: 'Egg → Larva (Caterpillar) → Pupa (Chrysalis) → Adult Butterfly.',
      hi: 'अंडा → लार्वा (इल्ली) → प्यूपा (कोकून) → वयस्क तितली।',
      gu: 'ઈંડું → ઈયળ → કોશેટો → પતંગિયું.',
      mr: 'अंडे → अळी → कोष → फुलपाखरू.',
      ta: 'முட்டை → கம்பளிப்பூச்சி → கூட்டுப்புழு → வண்ணத்துப்பூச்சி.',
      te: 'గుడ్డు → గొంగళి పురుగు → ప్యూపా → సీతాకోకచిలుక.'
    }
  },
  {
    title: {
      en: '🔬 Scientific Method Investigation Steps',
      hi: '🔬 वैज्ञानिक पद्धति के चरण',
      gu: '🔬 વૈજ્ઞાનિક પદ્ધતિના તબક્કા',
      mr: '🔬 वैज्ञानिक संशोधन पद्धती पायऱ्या',
      ta: '🔬 அறிவியல் முறைமை படிகள்',
      te: '🔬 శాస్త్రీయ పద్ధతి దశలు'
    },
    items: [
      { id: 1, title: { en: '❓ Observation & Research Question', hi: '❓ अवलोकन और शोध प्रश्न पूछना', gu: '❓ અવલોકન અને પ્રશ્ન પૂછવો', mr: '❓ निरीक्षण व संशोधन प्रश्न', ta: '❓ கவனிப்பு & கேள்வி எழுப்புதல்', te: '❓ పరిశీలన & ప్రశ్న అడగడం' } },
      { id: 2, title: { en: '💡 Formulate Testable Hypothesis', hi: '💡 परीक्षण योग्य परिकल्पना बनाना', gu: '💡 પૂર્વધારણા (Hypothesis) બાંધવી', mr: '💡 गृहीतक मांडणे', ta: '💡 கருதுகோள் உருவாக்குதல்', te: '💡 పరికల్పనను రూపొందించడం' } },
      { id: 3, title: { en: '🧪 Controlled Experiment & Data Collection', hi: '🧪 नियंत्रित प्रयोग और डेटा संग्रह', gu: '🧪 નિયંત્રિત પ્રયોગ અને ડેટા સંગ્રહ', mr: '🧪 नियंत्रित प्रयोग व माहिती संकलन', ta: '🧪 கட்டுப்படுத்தப்பட்ட சோதனை & தரவு', te: '🧪 ప్రయోగం & సమాచార సేకరణ' } },
      { id: 4, title: { en: '📊 Data Analysis & Scientific Conclusion', hi: '📊 डेटा विश्लेषण और वैज्ञानिक निष्कर्ष', gu: '📊 વિશ્લેષણ અને વૈજ્ઞાનિક તારણ', mr: '📊 विश्लेषण व अंतिम निष्कर्ष', ta: '📊 தரவு பகுப்பாய்வு & முடிவு', te: '📊 విశ్లేషణ & శాస్త్రీయ ముగింపు' } }
    ],
    solutionIds: [1, 2, 3, 4],
    explanation: {
      en: 'Question → Hypothesis → Controlled Experiment → Data Analysis Conclusion.',
      hi: 'प्रश्न → परिकल्पना → नियंत्रित प्रयोग → डेटा विश्लेषण व निष्कर्ष।',
      gu: 'પ્રશ્ન → પૂર્વધારણા → પ્રયોગ → તારણ.',
      mr: 'प्रश्न → गृहीतक → प्रयोग → निष्कर्ष.',
      ta: 'கேள்வி → கருதுகோள் → சோதனை → முடிவு.',
      te: 'ప్రశ్న → పరికల్పన → ప్రయోగం → ముగింపు.'
    }
  }
];

export const CROSSWORD_VARIANTS = [
  {
    title: {
      en: 'Biology & Cell Science',
      hi: 'जीव विज्ञान और कोशिका',
      gu: 'જીવવિજ્ઞાન અને કોષ',
      mr: 'जीवशास्त्र आणि पेशी',
      ta: 'உயிரியல் & செல் உயிரியல்',
      te: 'బయాలజీ & కణ జీవశాస్త్రం'
    },
    across: {
      en: 'Process by which green plants make food using sunlight (14 letters)',
      hi: 'वह प्रक्रिया जिससे हरे पौधे सूर्य के प्रकाश से भोजन बनाते हैं (14 अक्षर / PHOTOSYNTHESIS)',
      gu: 'લીલી વનસ્પતિ સૂર્યપ્રકાશમાંથી ખોરાક બનાવે તે પ્રક્રિયા (14 અક્ષરો / PHOTOSYNTHESIS)',
      mr: 'हिरव्या वनस्पती सूर्यप्रकाशापासून अन्न तयार करण्याची प्रक्रिया (14 अक्षरे / PHOTOSYNTHESIS)',
      ta: 'சூரிய ஒளியைப் பயன்படுத்தி தாவரங்கள் உணவு தயாரிக்கும் முறை (14 எழுத்துக்கள் / PHOTOSYNTHESIS)',
      te: 'సూర్యరశ్మిని ఉపయోగించి మొక్కలు ఆహారాన్ని తయారుచేసే ప్రక్రియ (14 అక్షరాలు / PHOTOSYNTHESIS)'
    },
    acrossAns: 'PHOTOSYNTHESIS',
    down: {
      en: 'Basic structural and functional unit of life (4 letters)',
      hi: 'जीवन की मूलभूत संरचनात्मक इकाई (4 अक्षर / CELL)',
      gu: 'સજીવોનો પાયાનો રચનાત્મક એકમ (4 અક્ષરો / CELL)',
      mr: 'जीवनाचा मूलभूत घटक (4 अक्षरे / CELL)',
      ta: 'உயிரினங்களின் அடிப்படை அலகு (4 எழுத்துக்கள் / CELL)',
      te: 'జీవుల ప్రాథమిక ప్రమాణం (4 అక్షరాలు / CELL)'
    },
    downAns: 'CELL'
  },
  {
    title: {
      en: 'Physics: Forces & Dynamics',
      hi: 'भौतिकी: बल और गतिशीलता',
      gu: 'ભૌતિકશાસ્ત્ર: બળ અને ગતિશાસ્ત્ર',
      mr: 'भौतिकशास्त्र: बल आणि गती',
      ta: 'இயற்பியல்: விசைகள் & இயக்கவியல்',
      te: 'ఫిజిక్స్: బలాలు & చలనశాస్త్రం'
    },
    across: {
      en: 'Force of universal attraction pulling objects toward Earth (7 letters)',
      hi: 'वस्तुओं को पृथ्वी की ओर खींचने वाला सार्वत्रिक आकर्षण बल (7 अक्षर / GRAVITY)',
      gu: 'પૃથ્વી તરફ ખેંચતું ગુરુત્વાકર્ષણ બળ (7 અક્ષરો / GRAVITY)',
      mr: 'पृथ्वीकडे खेचणारे गुरुत्वाकर्षण बल (7 अक्षरे / GRAVITY)',
      ta: 'பூமியை நோக்கி ஈர்க்கும் ஈர்ப்பு விசை (7 எழுத்துக்கள் / GRAVITY)',
      te: 'వస్తువులను భూమి వైపు లాగే గురుత్వాకర్షణ బలం (7 అక్షరాలు / GRAVITY)'
    },
    acrossAns: 'GRAVITY',
    down: {
      en: 'Resistance to motion when two touching surfaces slide against each other (8 letters)',
      hi: 'गति का विरोध करने वाला घर्षण बल (8 अक्षर / FRICTION)',
      gu: 'ગતિનો વિરોધ કરતું ઘર્ષણ બળ (8 અક્ષરો / FRICTION)',
      mr: 'दोन पृष्ठभागांमधील घर्षण बल (8 अक्षरे / FRICTION)',
      ta: 'இயக்கத்தை எதிர்க்கும் உராய்வு விசை (8 எழுத்துக்கள் / FRICTION)',
      te: 'చలనాన్ని నిరోధించే ఘర్షణ బలం (8 అక్షరాలు / FRICTION)'
    },
    downAns: 'FRICTION'
  },
  {
    title: {
      en: 'Chemistry: Acids, Bases & Atoms',
      hi: 'रसायन विज्ञान: अम्ल, क्षार और परमाणु',
      gu: 'રસાયણશાસ્ત્ર: એસિડ, બેઇઝ અને પરમાણુ',
      mr: 'रसायनशास्त्र: आम्ल, आम्लारी व अणू',
      ta: 'வேதியியல்: அமிலங்கள், காரங்கள் & அணுக்கள்',
      te: 'రసాయనశాస్త్రం: ఆమ్లాలు, క్షారాలు & పరమాణువులు'
    },
    across: {
      en: 'Substance with pH less than 7 that tastes sour and turns blue litmus red (4 letters)',
      hi: '7 से कम pH वाला खट्टा पदार्थ जो नीले लिटमस को लाल कर दे (4 अक्षर / ACID)',
      gu: '7 કરતાં ઓછો pH ધરાવતો ખાટો પદાર્થ (4 અક્ષરો / ACID)',
      mr: '7 पेक्षा कमी सामू (pH) असलेला आंबट पदार्थ (4 अक्षरे / ACID)',
      ta: 'pH 7 க்கும் குறைவான புளிப்புச் சுவையுள்ள பொருள் (4 எழுத்துக்கள் / ACID)',
      te: 'pH 7 కంటే తక్కువ ఉన్న పుల్లని పదార్థం (4 అక్షరాలు / ACID)'
    },
    acrossAns: 'ACID',
    down: {
      en: 'Subatomic particle located in the nucleus with positive electrical charge (6 letters)',
      hi: 'धनावेशित उप-परमाण्विक कण जो नाभिक में स्थित होता है (6 अक्षर / PROTON)',
      gu: 'ધન વીજભારિત પરમાણુ કણ (6 અક્ષરો / PROTON)',
      mr: 'धन प्रभारित उप-अणु कण (6 अक्षरे / PROTON)',
      ta: 'நேர்மின்சுமை கொண்ட துணை அணுத்துகள் (6 எழுத்துக்கள் / PROTON)',
      te: 'ధనావేశం కలిగిన ఉప పరమాణు కణం (6 అక్షరాలు / PROTON)'
    },
    downAns: 'PROTON'
  },
  {
    title: {
      en: 'Astronomy: Celestial Bodies',
      hi: 'खगोल विज्ञान: खगोलीय पिंड',
      gu: 'ખગોળશાસ્ત્ર: ખગોળીય પદાર્થો',
      mr: 'खगोलशास्त्र: खगोलीय वस्तू',
      ta: 'வானியல்: விண்பொருட்கள்',
      te: 'ఖగోళ శాస్త్రం: ఖగోళ వస్తువులు'
    },
    across: {
      en: 'A massive celestial body that orbits a star and cleared its orbital neighborhood (6 letters)',
      hi: 'तारे की परिक्रमा करने वाला विशाल खगोलीय पिंड (6 अक्षर / PLANET)',
      gu: 'તારાની પરિક્રમા કરતો વિશાળ અવકાશી પદાર્થ (6 અક્ષરો / PLANET)',
      mr: 'तार्‍याभोवती फिरणारा मोठा खगोलीय गोल (6 अक्षरे / PLANET)',
      ta: 'நட்சத்திரத்தை சுற்றும் பெரிய விண்பொருள் (6 எழுத்துக்கள் / PLANET)',
      te: 'నక్షత్రం చుట్టూ తిరిగే పెద్ద ఖగోళ వస్తువు (6 అక్షరాలు / PLANET)'
    },
    acrossAns: 'PLANET',
    down: {
      en: 'Luminous sphere of plasma held together by its own gravity that generates fusion light (4 letters)',
      hi: 'प्रकाश उत्सर्जित करने वाला प्लाज्मा का चमकदार गोला (4 अक्षर / STAR)',
      gu: 'પોતાનો પ્રકાશ ધરાવતો તેજસ્વી અવકાશી ગોળો (4 અક્ષરો / STAR)',
      mr: 'स्वयंप्रकाशीय खगोलीय तारा (4 अक्षरे / STAR)',
      ta: 'சுய ஒளிரும் பிரகாசமான விண்மீன் (4 எழுத்துக்கள் / STAR)',
      te: 'స్వయం ప్రకాశం గల ఖగోళ నక్షత్రం (4 అక్షరాలు / STAR)'
    },
    downAns: 'STAR'
  },
  {
    title: {
      en: 'Genetics: Code of Life',
      hi: 'आनुवंशिकी: जीवन का कोड',
      gu: 'જનીનશાસ્ત્ર: જીવનનો કોડ',
      mr: 'जनुकशास्त्र: जीवनाची संहिता',
      ta: 'மரபியல்: வாழ்க்கையின் குறியீடு',
      te: 'జన్యుశాస్త్రం: జీవిత సంకేతం'
    },
    across: {
      en: 'Molecule carrying hereditary instructions in a double helix structure (3 letters)',
      hi: 'डबल हेलिक्स संरचना वाला आनुवंशिक अणु (3 अक्षर / DNA)',
      gu: 'વારસાગત લક્ષણો વહન કરતો અણુ (3 અક્ષરો / DNA)',
      mr: 'आनुवंशिक माहिती वाहून नेणारा रेणू (3 अक्षरे / DNA)',
      ta: 'இரட்டை சுருள் அமைப்பைக் கொண்ட மரபணு மூலக்கூறு (3 எழுத்துக்கள் / DNA)',
      te: 'ద్వి-సర్పిలాకార నిర్మాణం గల జన్యు అణువు (3 అక్షరాలు / DNA)'
    },
    acrossAns: 'DNA',
    down: {
      en: 'A distinct sequence of nucleotides forming part of a chromosome (4 letters)',
      hi: 'गुणसूत्र का वह भाग जो लक्षणों को नियंत्रित करता है (4 अक्षर / GENE)',
      gu: 'વારસાગત લક્ષણો નક્કી કરતો એકમ (4 અક્ષરો / GENE)',
      mr: 'गुणसूत्राचा आनुवंशिक घटक (4 अक्षरे / GENE)',
      ta: 'மரபணுவின் அடிப்படை அலகு (4 எழுத்துக்கள் / GENE)',
      te: 'లక్షణాలను నిర్ణయించే జన్యు భాగం (4 అక్షరాలు / GENE)'
    },
    downAns: 'GENE'
  }
];

export const NUMBER_GRID_VARIANTS = [
  {
    title: {
      en: 'Math Chain Set A: Mixed Arithmetic',
      hi: 'गणित श्रृंखला सेट A: मिश्रित अंकगणित',
      gu: 'ગણિત શ્રૃંખલા સેટ A: મિશ્ર અંકગણિત',
      mr: 'गणित साखळी सेट A: अंकगणित',
      ta: 'கணித சங்கிலித் தொகுதி A: எண்கணிதம்',
      te: 'మ్యాథ్ చైన్ సెట్ A: అంకగణితం'
    },
    q1: '8 + 7 = ?',
    a1: '15',
    q2: '12 - 4 = ?',
    a2: '8',
    q3: '6 × 5 = ?',
    a3: '30'
  },
  {
    title: {
      en: 'Math Chain Set B: Squares & Factors',
      hi: 'गणित श्रृंखला सेट B: वर्ग और गुणन',
      gu: 'ગણિત શ્રૃંખલા સેટ B: વર્ગ અને ગુણાકાર',
      mr: 'गणित साखळी सेट B: वर्ग व गुणाकार',
      ta: 'கணித சங்கிலித் தொகுதி B: வர்க்கங்கள்',
      te: 'మ్యాథ్ చైన్ సెట్ B: వర్గాలు & గుణకారాలు'
    },
    q1: '9 × 9 = ?',
    a1: '81',
    q2: '72 ÷ 8 = ?',
    a2: '9',
    q3: '14 + 19 = ?',
    a3: '33'
  },
  {
    title: {
      en: 'Math Chain Set C: Rapid Mental Calculation',
      hi: 'गणित श्रृंखला सेट C: तीव्र मानसिक गणना',
      gu: 'ગણિત શ્રૃંખલા સેટ C: ઝડપી ગણતરી',
      mr: 'गणित साखळी सेट C: जलद गणित',
      ta: 'கணித சங்கிலித் தொகுதி C: விரைவுக் கணிதம்',
      te: 'మ్యాథ్ చైన్ సెట్ C: వేగవంతమైన లెక్కలు'
    },
    q1: '25 × 4 = ?',
    a1: '100',
    q2: '150 - 65 = ?',
    a2: '85',
    q3: '11 × 11 = ?',
    a3: '121'
  },
  {
    title: {
      en: 'Math Chain Set D: Fractions & Decimals',
      hi: 'गणित श्रृंखला सेट D: प्रतिशत और भाग',
      gu: 'ગણિત શ્રૃંખલા સેટ D: ટકાવારી અને ભાગાકાર',
      mr: 'गणित साखळी सेट D: टक्केवारी व भागाकार',
      ta: 'கணித சங்கிலித் தொகுதி D: சதவீதங்கள்',
      te: 'మ్యాథ్ చైన్ సెట్ D: శాతాలు & భాగాహారాలు'
    },
    q1: '50% of 80 = ?',
    a1: '40',
    q2: '96 ÷ 6 = ?',
    a2: '16',
    q3: '7 × 8 + 4 = ?',
    a3: '60'
  },
  {
    title: {
      en: 'Math Chain Set E: Order of Operations (BODMAS)',
      hi: 'गणित श्रृंखला सेट E: BODMAS संक्रियाएं',
      gu: 'ગણિત શ્રૃંખલા સેટ E: BODMAS નિયમો',
      mr: 'गणित साखळी सेट E: कंचेभागुबेव',
      ta: 'கணித சங்கிலித் தொகுதி E: BODMAS',
      te: 'మ్యాథ్ చైన్ సెట్ E: BODMAS నియమాలు'
    },
    q1: '5 + (4 × 6) = ?',
    a1: '29',
    q2: '(100 ÷ 5) - 8 = ?',
    a2: '12',
    q3: '12 × 12 - 44 = ?',
    a3: '100'
  }
];

export const ODD_ONE_OUT_VARIANTS = [
  {
    title: {
      en: 'Periodic Table Chemical Families',
      hi: 'आवर्त सारणी रासायनिक परिवार',
      gu: 'આવર્ત કોષ્ટક રાસાયણિક સમૂહો',
      mr: 'आवर्तसारणी रासायनिक गट',
      ta: 'தனிம வரிசை அட்டவணை குடும்பங்கள்',
      te: 'ఆవర్తన పట్టిక కుటుంబాలు'
    },
    question: {
      en: 'Identify the element that does NOT belong to the Noble Gases:',
      hi: 'उस तत्व को पहचानें जो अक्रिय गैसों (Noble Gases) में शामिल नहीं है:',
      gu: 'નિષ્ક્રિય વાયુઓ (Noble Gases) માં ન આવતું તત્વ શોધો:',
      mr: 'राजवायू (Noble Gases) गटात न बसणारे मूलद्रव्य ओळखा:',
      ta: 'மந்த வாயுக்களில் சேராத தனிமத்தைக் கண்டறியவும்:',
      te: 'నోబెల్ వాయువులకు చెందని మూలకాన్ని గుర్తించండి:'
    },
    items: [
      { id: 1, name: { en: '🎈 Helium (He)', hi: '🎈 हीलियम (He)', gu: '🎈 હિલિયમ (He)', mr: '🎈 हेलियम (He)', ta: '🎈 ஹீலியம் (He)', te: '🎈 హీలియం (He)' } },
      { id: 2, name: { en: '💡 Neon (Ne)', hi: '💡 नियॉन (Ne)', gu: '💡 નિયોન (Ne)', mr: '💡 निऑन (Ne)', ta: '💡 நியான் (Ne)', te: '💡 నియాన్ (Ne)' } },
      { id: 3, name: { en: '⚛️ Argon (Ar)', hi: '⚛️ आर्गन (Ar)', gu: '⚛️ આર્ગોન (Ar)', mr: '⚛️ आर्गॉन (Ar)', ta: '⚛️ ஆர்கான் (Ar)', te: '⚛️ ఆర్గాన్ (Ar)' } },
      { id: 4, name: { en: '🧂 Sodium (Na)', hi: '🧂 सोडियम (Na)', gu: '🧂 સોડિયમ (Na)', mr: '🧂 सोडिअम (Na)', ta: '🧂 சோடியம் (Na)', te: '🧂 సోడియం (Na)' } }
    ],
    solutionId: 4,
    explanation: {
      en: 'Sodium (Na) is an alkali metal! Helium, Neon, and Argon are Noble Gases.',
      hi: 'सोडियम (Na) एक क्षार धातु है! हीलियम, नियॉन और आर्गन अक्रिय गैसें हैं।',
      gu: 'સોડિયમ (Na) આલ્કલી ધાતુ છે! હિલિયમ, નિયોન અને આર્ગોન નિષ્ક્રિય વાયુઓ છે.',
      mr: 'सोडिअम (Na) हा अल्कली धातू आहे! हेलियम, निऑन आणि आर्गॉन हे राजवायू आहेत.',
      ta: 'சோடியம் (Na) ஒரு கார உலோகம்! ஹீலியம், நியான் மற்றும் ஆர்கான் மந்த வாயுக்கள்.',
      te: 'సోడియం (Na) ఆల్కలీ లోహం! హీలియం, నియాన్ మరియు ఆర్గాన్ నోబెల్ వాయువులు.'
    }
  },
  {
    title: {
      en: 'Energy Sources Classification',
      hi: 'ऊर्जा स्रोतों का वर्गीकरण',
      gu: 'ઊર્જા સ્ત્રોતોનું વર્ગીકરણ',
      mr: 'ऊर्जा स्रोतांचे वर्गीकरण',
      ta: 'ஆற்றல் மூலங்கள் வகைப்பாடு',
      te: 'శక్తి వనరుల వర్గీకరణ'
    },
    question: {
      en: 'Identify the energy source that is NOT Renewable / Green:',
      hi: 'उस ऊर्जा स्रोत को पहचानें जो नवीकरणीय (Renewable) नहीं है:',
      gu: 'પુનઃપ્રાપ્ય (Renewable) ન હોય તેવો ઊર્જા સ્ત્રોત શોધો:',
      mr: 'पुनर्नवीकरणीय नसलेला ऊर्जा स्रोत ओळखा:',
      ta: 'புதுப்பிக்க முடியாத ஆற்றல் மூலத்தைக் கண்டறியவும்:',
      te: 'పునరుత్పాదక శక్తి వనరు కానిదాన్ని గుర్తించండి:'
    },
    items: [
      { id: 1, name: { en: '☀️ Solar Power', hi: '☀️ सौर ऊर्जा', gu: '☀️ સૌર ઊર્જા', mr: '☀️ सौर ऊर्जा', ta: '☀️ சூரிய சக்தி', te: '☀️ సౌర శక్తి' } },
      { id: 2, name: { en: '💨 Wind Energy', hi: '💨 पवन ऊर्जा', gu: '💨 પવન ઊર્જા', mr: '💨 पवन ऊर्जा', ta: '💨 காற்று சக்தி', te: '💨 పవన శక్తి' } },
      { id: 3, name: { en: '⛏️ Coal Fossil Fuel', hi: '⛏️ कोयला (जीवाश्म ईंधन)', gu: '⛏️ કોલસો (અશ્મિભૂત બળતણ)', mr: '⛏️ कोळसा', ta: '⛏️ நிலக்கரி', te: '⛏️ బొగ్గు (శిలాజ ఇంధనం)' } },
      { id: 4, name: { en: '🌊 Hydroelectric Power', hi: '🌊 जल विद्युत ऊर्जा', gu: '🌊 જળ વિદ્યુત', mr: '🌊 जलविद्युत', ta: '🌊 நீர்மின் சக்தி', te: '🌊 జల విద్యుత్' } }
    ],
    solutionId: 3,
    explanation: {
      en: 'Coal is a non-renewable fossil fuel! Solar, Wind, and Hydro are clean renewable sources.',
      hi: 'कोयला अनवीकरणीय जीवाश्म ईंधन है! सौर, पवन और जल विद्युत नवीकरणीय स्रोत हैं।',
      gu: 'કોલસો પુનઃઅપ્રાપ્ય અશ્મિભૂત બળતણ છે! સૌર, પવન અને જળ પુનઃપ્રાપ્ય છે.',
      mr: 'कोळसा हा अनवीकरणीय जीवाश्म इंधन आहे! इतर सर्व नवीकरणीय आहेत.',
      ta: 'நிலக்கரி ஒரு புதைபடிவ எரிபொருள்! மற்றவை அனைத்தும் புதுப்பிக்கத்தக்கவை.',
      te: 'బొగ్గు పునరుత్పాదకం కాని శిలాజ ఇంధనం! మిగిలినవి పునరుత్పాదక వనరులు.'
    }
  },
  {
    title: {
      en: 'Biological Vertebrate Taxonomy',
      hi: 'कशेरुकी जीवों का वर्गीकरण',
      gu: 'પૃષ્ઠવંશી સજીવોનું વર્ગીકરણ',
      mr: 'पृष्ठवंशीय प्राण्यांचे वर्गीकरण',
      ta: 'முதுகெலும்பிகள் வகைப்பாடு',
      te: 'వెన్నెముక గల జీవుల వర్గీకరణ'
    },
    question: {
      en: 'Identify the creature that is NOT a Mammal:',
      hi: 'उस प्राणी को पहचानें जो स्तनधारी (Mammal) नहीं है:',
      gu: 'સસ્તન પ્રાણી (Mammal) ન હોય તેવું શોધો:',
      mr: 'सस्तन प्राणी नसलेला सजीव ओळखा:',
      ta: 'பாலூட்டி அல்லாத உயிரினத்தைக் கண்டறியவும்:',
      te: 'క్షీరదం (Mammal) కాని జంతువును గుర్తించండి:'
    },
    items: [
      { id: 1, name: { en: '🐋 Blue Whale', hi: '🐋 ब्लू व्हेल', gu: '🐋 બ્લુ વ્હેલ', mr: '🐋 देवमासा (ब्लू व्हेल)', ta: '🐋 நீல திமிங்கலம்', te: '🐋 నీలి తిమింగలం' } },
      { id: 2, name: { en: '🦇 Flying Bat', hi: '🦇 चमगादड़', gu: '🦇 ચામાચીડિયું', mr: '🦇 वटवाघूळ', ta: '🦇 வவ்வால்', te: '🦇 గబ్బిలం' } },
      { id: 3, name: { en: '🐊 River Crocodile', hi: '🐊 मगरमच्छ (Reptile)', gu: '🐊 મગર (Reptile)', mr: '🐊 मगर (सरपटणारा प्राणी)', ta: '🐊 முதலை (ஊர்வன)', te: '🐊 మొసలి (సరీసృపం)' } },
      { id: 4, name: { en: '🦘 Kangaroo', hi: '🦘 कंगारू', gu: '🦘 કાંગારૂ', mr: '🦘 कांगारू', ta: '🦘 கங்காரு', te: '🦘 కంగారూ' } }
    ],
    solutionId: 3,
    explanation: {
      en: 'Crocodile is a cold-blooded Reptile! Whales, Bats, and Kangaroos are warm-blooded Mammals.',
      hi: 'मगरमच्छ एक सरीसृप (Reptile) है! व्हेल, चमगादड़ और कंगारू स्तनधारी जीव हैं।',
      gu: 'મગર સરીસૃપ (Reptile) છે! વ્હેલ, ચામાચીડિયું અને કાંગારૂ સસ્તન પ્રાણીઓ છે.',
      mr: 'मगर हा सरपटणारा प्राणी आहे! इतर तिघे सस्तन प्राणी आहेत.',
      ta: 'முதலை ஊர்வன வகையைச் சேர்ந்தது! திமிங்கலம், வவ்வால், கங்காரு பாலூட்டிகள்.',
      te: 'మొసలి ఒక సరీసృపం! తిమింగలం, గబ్బిలం మరియు కంగారూ క్షీరదాలు.'
    }
  },
  {
    title: {
      en: 'Prime vs Composite Numbers',
      hi: 'अभाज्य बनाम भाज्य संख्याएं',
      gu: 'અવિભાજ્ય અને વિભાજ્ય સંખ્યાઓ',
      mr: 'मूळ व संयुक्त संख्या',
      ta: 'பகா எண்கள் & பகு எண்கள்',
      te: 'ప్రధాన & సంయుక్త సంఖ్యలు'
    },
    question: {
      en: 'Identify the number that is NOT a Prime Number:',
      hi: 'उस संख्या को पहचानें जो अभाज्य (Prime) नहीं है:',
      gu: 'અવિભાજ્ય (Prime) ન હોય તેવી સંખ્યા શોધો:',
      mr: 'मूळ संख्या (Prime) नसलेली संख्या ओळखा:',
      ta: 'பகா எண் (Prime) அல்லாத எண்ணைக் கண்டறியவும்:',
      te: 'ప్రధాన సంఖ్య (Prime) కానిదాన్ని గుర్తించండి:'
    },
    items: [
      { id: 1, name: { en: '🔢 Number 13', hi: '🔢 संख्या 13', gu: '🔢 સંખ્યા 13', mr: '🔢 संख्या 13', ta: '🔢 எண் 13', te: '🔢 సంఖ్య 13' } },
      { id: 2, name: { en: '🔢 Number 17', hi: '🔢 संख्या 17', gu: '🔢 સંખ્યા 17', mr: '🔢 संख्या 17', ta: '🔢 எண் 17', te: '🔢 సంఖ్య 17' } },
      { id: 3, name: { en: '🔢 Number 21 (3 × 7)', hi: '🔢 संख्या 21 (3 × 7)', gu: '🔢 સંખ્યા 21 (3 × 7)', mr: '🔢 संख्या 21 (3 × 7)', ta: '🔢 எண் 21 (3 × 7)', te: '🔢 సంఖ్య 21 (3 × 7)' } },
      { id: 4, name: { en: '🔢 Number 19', hi: '🔢 संख्या 19', gu: '🔢 સંખ્યા 19', mr: '🔢 संख्या 19', ta: '🔢 எண் 19', te: '🔢 సంఖ్య 19' } }
    ],
    solutionId: 3,
    explanation: {
      en: '21 is composite (divisible by 1, 3, 7, 21)! 13, 17, and 19 are prime numbers.',
      hi: '21 एक भाज्य संख्या है (3 और 7 से विभाज्य)! 13, 17 और 19 अभाज्य संख्याएं हैं।',
      gu: '21 વિભાજ્ય સંખ્યા છે (3 અને 7 વડે ભાગી શકાય)! 13, 17, 19 અવિભાજ્ય છે.',
      mr: '21 ही संयुक्त संख्या आहे (3 व 7 ने भाग जातो)! 13, 17 आणि 19 मूळ संख्या आहेत.',
      ta: '21 ஒரு பகு எண் (3 மற்றும் 7 ஆல் வகுபடும்)! 13, 17, 19 பகா எண்கள்.',
      te: '21 ఒక సంయుక్త సంఖ్య (3 మరియు 7 చే భాగించబడుతుంది)! 13, 17 మరియు 19 ప్రధాన సంఖ్యలు.'
    }
  }
];

export const ASSERTION_REASON_VARIANTS = [
  {
    title: {
      en: 'Assertion & Reasoning: Genetics & Heredity',
      hi: 'अभिकथन और कारण: आनुवंशिकी और वंशागति',
      gu: 'વિધાન અને કારણ: જનીનશાસ્ત્ર અને વારસો',
      mr: 'विधान आणि कारण: जनुकशास्त्र आणि आनुवंशिकता',
      ta: 'கூற்று & காரணம்: மரபியல் மற்றும் பரம்பரை',
      te: 'ప్రకటన & కారణం: జన్యుశాస్త్రం & వంశపారంపర్యం'
    },
    assertion: {
      en: 'Mendel conducted his hybridization experiments on garden peas (Pisum sativum).',
      hi: 'मेंडल ने अपने संकरण प्रयोग उद्यान मटर (Pisum sativum) पर किए।',
      gu: 'મેન્ડેલે પોતાના સંકરણ પ્રયોગો વટાણાના છોડ પર કર્યા.',
      mr: 'मेंडेलने आपले संकरण प्रयोग मटारच्या वनस्पतीवर केले.',
      ta: 'மெண்டல் தனது கலப்பின சோதனைகளை பட்டாணி தாவரத்தில் செய்தார்.',
      te: 'మెండల్ తన సంకరీకరణ ప్రయోగాలను బఠానీ మొక్కపై నిర్వహించాడు.'
    },
    reason: {
      en: 'Garden peas have easily detectable contrasting traits and a short life cycle.',
      hi: 'उद्यान मटर में आसानी से पहचाने जाने वाले विपरीत लक्षण और छोटा जीवन चक्र होता है।',
      gu: 'વટાણાના છોડમાં સરળતાથી ઓળખી શકાય તેવા વિરોધાભાસી લક્ષણો અને ટૂંકું આયુષ્ય હોય છે.',
      mr: 'मटारच्या वनस्पतीमध्ये सहज ओळखता येणारी परस्परविरोधी लक्षणे आणि अल्पायुष्य असते.',
      ta: 'பட்டாணி தாவரங்கள் எளிதில் கண்டறியக்கூடிய மாறுபட்ட பண்புகளையும் குறுகிய வாழ்க்கை சுழற்சியையும் கொண்டுள்ளன.',
      te: 'బఠానీ మొక్కలు సులభంగా గుర్తించదగిన విరుద్ధ లక్షణాలను మరియు తక్కువ జీవిత చక్రాన్ని కలిగి ఉంటాయి.'
    },
    options: [
      { id: 1, text: { en: 'Both Assertion and Reason are true, and Reason is the correct explanation of Assertion.', hi: 'अभिकथन और कारण दोनों सत्य हैं, और कारण अभिकथन की सही व्याख्या है।', gu: 'વિધાન અને કારણ બંને સાચા છે, અને કારણ એ વિધાનની સાચી સમજૂતી છે.', mr: 'विधान आणि कारण दोन्ही सत्य आहेत आणि कारण हे विधानाचे योग्य स्पष्टीकरण आहे.', ta: 'கூற்று மற்றும் காரணம் இரண்டும் உண்மை, காரணம் சரியான விளக்கம்.', te: 'ప్రకటన మరియు కారణం రెండూ నిజం, కారణం సరైన వివరణ.' } },
      { id: 2, text: { en: 'Both Assertion and Reason are true, but Reason is NOT the correct explanation of Assertion.', hi: 'अभिकथन और कारण दोनों सत्य हैं, लेकिन कारण अभिकथन की सही व्याख्या नहीं है।', gu: 'વિધાન અને કારણ બંને સાચા છે, પરંતુ કારણ વિધાનની સાચી સમજૂતી નથી.', mr: 'विधान आणि कारण दोन्ही सत्य आहेत, पण कारण योग्य स्पष्टीकरण नाही.', ta: 'இரண்டும் உண்மை, ஆனால் காரணம் சரியான விளக்கம் அல்ல.', te: 'రెండూ నిజం, కానీ కారణం సరైన వివరణ కాదు.' } },
      { id: 3, text: { en: 'Assertion is true, but Reason is false.', hi: 'अभिकथन सत्य है, लेकिन कारण असत्य है।', gu: 'વિધાન સાચું છે, પરંતુ કારણ ખોટું છે.', mr: 'विधान सत्य आहे, पण कारण असत्य आहे.', ta: 'கூற்று உண்மை, ஆனால் காரணம் தவறு.', te: 'ప్రకటన నిజం, కానీ కారణం తప్పు.' } },
      { id: 4, text: { en: 'Assertion is false, but Reason is true.', hi: 'अभिकथन असत्य है, लेकिन कारण सत्य है।', gu: 'વિધાન ખોટું છે, પરંતુ કારણ સાચું છે.', mr: 'विधान असत्य आहे, पण कारण सत्य आहे.', ta: 'கூற்று தவறு, ஆனால் காரணம் உண்மை.', te: 'ప్రకటన తప్పు, కానీ కారణం నిజం.' } }
    ],
    solutionId: 1,
    explanation: {
      en: 'Both are true! Pea plants were chosen specifically because of clear contrasting traits and self-pollination with a short generation time.',
      hi: 'दोनों सत्य हैं! मटर के पौधे को विशेष रूप से स्पष्ट विपरीत लक्षणों और कम जीवन चक्र के कारण चुना गया था।',
      gu: 'બંને સાચા છે! વટાણાના છોડ સ્પષ્ટ લક્ષણો અને ટૂંકા જીવનચક્ર માટે પસંદ કરાયા હતા.',
      mr: 'दोन्ही सत्य आहेत! मटारचे झाड स्पष्ट लक्षणांसाठी निवडले गेले होते.',
      ta: 'இரண்டும் உண்மை! தெளிவான பண்புகள் மற்றும் குறுகிய தலைமுறை நேரத்தின் காரணமாக பட்டாணி தேர்ந்தெடுக்கப்பட்டது.',
      te: 'రెండూ నిజం! స్పష్టమైన విరుద్ధ లక్షణాలు మరియు తక్కువ సమయం కోసం బఠానీ మొక్కను ఎంచుకున్నారు.'
    }
  }
];

export const FORMULA_MATCH_VARIANTS = [
  {
    title: {
      en: 'Senior Physics & Chemistry Laws',
      hi: 'भौतिकी और रसायन विज्ञान के नियम',
      gu: 'ભૌતિકશાસ્ત્ર અને રસાયણશાસ્ત્રના નિયમો',
      mr: 'भौतिकशास्त्र आणि रसायनशास्त्राचे नियम',
      ta: 'இயற்பியல் & வேதியியல் விதிகள்',
      te: 'ఫిజిక్స్ & కెమిస్ట్రీ సూత్రాలు'
    },
    pairs: [
      { pairId: 1, symbol: 'E = mc²', text: { en: "Einstein's Mass-Energy", hi: 'आइंस्टीन का द्रव्यमान-ऊर्जा समीकरण', gu: 'આઈન્સ્ટાઈનનું દળ-ઊર્જા સમીકરણ', mr: 'आईन्स्टाईनचे वस्तुमान-ऊर्जा समीकरण', ta: 'ஐன்ஸ்டீனின் நிறை-ஆற்றல்', te: 'ఐన్‌స్టీన్ ద్రవ్యరాశి-శక్తి' } },
      { pairId: 2, symbol: 'F = G(m₁m₂)/r²', text: { en: "Newton's Gravitation Law", hi: 'न्यूटन का गुरुत्वाकर्षण नियम', gu: 'ન્યૂટનનો ગુરુત્વાકર્ષણ નિયમ', mr: 'न्यूटनचा गुरुत्वाकर्षण नियम', ta: 'நியூட்டனின் ஈர்ப்பு விதி', te: 'న్యూటన్ గురుత్వాకర్షణ నియమం' } },
      { pairId: 3, symbol: 'PV = nRT', text: { en: 'Ideal Gas Equation', hi: 'आदर्श गैस समीकरण', gu: 'આદર્શ વાયુ સમીકરણ', mr: 'आदर्श वायू समीकरण', ta: 'நல்லியல்பு வாயு சமன்பாடு', te: 'ఆదర్శ వాయు సమీకరణం' } },
      { pairId: 4, symbol: 'V = IR', text: { en: "Ohm's Law of Resistance", hi: 'ओम का प्रतिरोध नियम', gu: 'ઓહ્મનો અવરોધ નિયમ', mr: 'ओहमचा नियम', ta: 'ஓம் விதி', te: 'ఓమ్ నియమం' } }
    ]
  }
];

export default function PuzzleGameTab({ user, lang, onUpdateUser }: PuzzleGameTabProps) {
  // Dynamically derive current active language setting from user object or props
  const currentLanguage = useMemo(() => {
    return (user.defaultLanguage || lang || 'en') as LanguageCode;
  }, [user.defaultLanguage, lang]);

  const userGroup = useMemo<PuzzleGroup>(() => {
    const stdStr = user.standard || '';
    const match = stdStr.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num >= 1 && num <= 5) return 1;
      if (num >= 6 && num <= 9) return 2;
      if (num >= 10) return 3;
    }
    return 2;
  }, [user.standard]);

  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todaySeed = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < todayDateStr.length; i++) {
      hash += todayDateStr.charCodeAt(i);
    }
    return hash;
  }, [todayDateStr]);

  const [variantSeeds, setVariantSeeds] = useState<Record<string, number>>(() => ({
    'food-chain': todaySeed % FOOD_CHAIN_VARIANTS.length,
    'shape-puzzle': todaySeed % SHAPE_VARIANTS.length,
    'word-builder': todaySeed % WORD_BUILDER_VARIANTS.length,
    'circuit-puzzle': todaySeed % CIRCUIT_VARIANTS.length,
    'memory-match': todaySeed % MEMORY_VARIANTS.length,
    'history-timeline': todaySeed % TIMELINE_VARIANTS.length,
    'sequence-builder': todaySeed % SEQUENCE_VARIANTS.length,
    'odd-one-out': todaySeed % ODD_ONE_OUT_VARIANTS.length,
    'number-grid': todaySeed % NUMBER_GRID_VARIANTS.length,
    'crossword': todaySeed % CROSSWORD_VARIANTS.length,
    'assertion-reason': todaySeed % ASSERTION_REASON_VARIANTS.length,
    'formula-match': todaySeed % FORMULA_MATCH_VARIANTS.length,
  }));

  // Dynamic AI generated puzzles storage to guarantee ZERO repetition
  const [dynamicAIPuzzles, setDynamicAIPuzzles] = useState<Record<string, any>>({});
  const [isGeneratingAI, setIsGeneratingAI] = useState<Record<string, boolean>>({});
  const [customTopicInput, setCustomTopicInput] = useState<string>('');
  const [showTopicPrompt, setShowTopicPrompt] = useState<boolean>(false);

  const [selectedGroup, setSelectedGroup] = useState<PuzzleGroup>(userGroup);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [completedGames, setCompletedGames] = useState<Set<string>>(new Set());

  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  // Dynamically resolve active puzzle from AI or deterministic fallback
  const activeFoodChain = (dynamicAIPuzzles['food-chain'] && Array.isArray(dynamicAIPuzzles['food-chain'].items) && dynamicAIPuzzles['food-chain'].items.length > 0)
    ? dynamicAIPuzzles['food-chain']
    : (FOOD_CHAIN_VARIANTS[(variantSeeds['food-chain'] || 0) % FOOD_CHAIN_VARIANTS.length] || FOOD_CHAIN_VARIANTS[0]);

  const activeShape = (dynamicAIPuzzles['shape-puzzle'] && Array.isArray(dynamicAIPuzzles['shape-puzzle'].items) && dynamicAIPuzzles['shape-puzzle'].items.length > 0)
    ? dynamicAIPuzzles['shape-puzzle']
    : (SHAPE_VARIANTS[(variantSeeds['shape-puzzle'] || 0) % SHAPE_VARIANTS.length] || SHAPE_VARIANTS[0]);

  const activeWord = (dynamicAIPuzzles['word-builder'] && Array.isArray(dynamicAIPuzzles['word-builder'].affixes) && dynamicAIPuzzles['word-builder'].affixes.length > 0)
    ? dynamicAIPuzzles['word-builder']
    : (WORD_BUILDER_VARIANTS[(variantSeeds['word-builder'] || 0) % WORD_BUILDER_VARIANTS.length] || WORD_BUILDER_VARIANTS[0]);

  const activeCircuit = (dynamicAIPuzzles['circuit-puzzle'] && Array.isArray(dynamicAIPuzzles['circuit-puzzle'].components) && dynamicAIPuzzles['circuit-puzzle'].components.length > 0)
    ? dynamicAIPuzzles['circuit-puzzle']
    : (CIRCUIT_VARIANTS[(variantSeeds['circuit-puzzle'] || 0) % CIRCUIT_VARIANTS.length] || CIRCUIT_VARIANTS[0]);

  const activeMemory = (dynamicAIPuzzles['memory-match'] && Array.isArray(dynamicAIPuzzles['memory-match'].pairs) && dynamicAIPuzzles['memory-match'].pairs.length > 0)
    ? dynamicAIPuzzles['memory-match']
    : (MEMORY_VARIANTS[(variantSeeds['memory-match'] || 0) % MEMORY_VARIANTS.length] || MEMORY_VARIANTS[0]);

  const activeTimeline = (dynamicAIPuzzles['history-timeline'] && Array.isArray(dynamicAIPuzzles['history-timeline'].items) && dynamicAIPuzzles['history-timeline'].items.length > 0)
    ? dynamicAIPuzzles['history-timeline']
    : (TIMELINE_VARIANTS[(variantSeeds['history-timeline'] || 0) % TIMELINE_VARIANTS.length] || TIMELINE_VARIANTS[0]);

  const activeSequence = (dynamicAIPuzzles['sequence-builder'] && Array.isArray(dynamicAIPuzzles['sequence-builder'].items) && dynamicAIPuzzles['sequence-builder'].items.length > 0)
    ? dynamicAIPuzzles['sequence-builder']
    : (SEQUENCE_VARIANTS[(variantSeeds['sequence-builder'] || 0) % SEQUENCE_VARIANTS.length] || SEQUENCE_VARIANTS[0]);

  const activeOdd = (dynamicAIPuzzles['odd-one-out'] && Array.isArray(dynamicAIPuzzles['odd-one-out'].items) && dynamicAIPuzzles['odd-one-out'].items.length > 0)
    ? dynamicAIPuzzles['odd-one-out']
    : (ODD_ONE_OUT_VARIANTS[(variantSeeds['odd-one-out'] || 0) % ODD_ONE_OUT_VARIANTS.length] || ODD_ONE_OUT_VARIANTS[0]);

  const activeGrid = (dynamicAIPuzzles['number-grid'] && dynamicAIPuzzles['number-grid'].q1)
    ? dynamicAIPuzzles['number-grid']
    : (NUMBER_GRID_VARIANTS[(variantSeeds['number-grid'] || 0) % NUMBER_GRID_VARIANTS.length] || NUMBER_GRID_VARIANTS[0]);

  const activeCrossword = (dynamicAIPuzzles['crossword'] && dynamicAIPuzzles['crossword'].acrossAns)
    ? dynamicAIPuzzles['crossword']
    : (CROSSWORD_VARIANTS[(variantSeeds['crossword'] || 0) % CROSSWORD_VARIANTS.length] || CROSSWORD_VARIANTS[0]);

  const activeAssertion = (dynamicAIPuzzles['assertion-reason'] && dynamicAIPuzzles['assertion-reason'].assertion)
    ? dynamicAIPuzzles['assertion-reason']
    : (ASSERTION_REASON_VARIANTS[(variantSeeds['assertion-reason'] || 0) % ASSERTION_REASON_VARIANTS.length] || ASSERTION_REASON_VARIANTS[0]);

  const activeFormula = (dynamicAIPuzzles['formula-match'] && Array.isArray(dynamicAIPuzzles['formula-match'].pairs) && dynamicAIPuzzles['formula-match'].pairs.length > 0)
    ? dynamicAIPuzzles['formula-match']
    : (FORMULA_MATCH_VARIANTS[(variantSeeds['formula-match'] || 0) % FORMULA_MATCH_VARIANTS.length] || FORMULA_MATCH_VARIANTS[0]);

  const [foodChainOrder, setFoodChainOrder] = useState<string[]>([]);
  const [placedShapes, setPlacedShapes] = useState<string[]>([]);
  const [timelineOrder, setTimelineOrder] = useState<number[]>([]);
  const [selectedRoot, setSelectedRoot] = useState<string>(activeWord.rootWord);
  const [selectedAffix, setSelectedAffix] = useState<string>('');
  const [circuitSlots, setCircuitSlots] = useState<{ battery: boolean; switch: boolean; bulb: boolean }>({
    battery: false, switch: false, bulb: false
  });
  const [memoryCards, setMemoryCards] = useState<{ id: number; symbol: string; pairId: number; flipped: boolean; matched: boolean }[]>([]);
  const [flippedCardIds, setFlippedCardIds] = useState<number[]>([]);
  const [sequenceOrder, setSequenceOrder] = useState<number[]>([]);
  const [crosswordInputs, setCrosswordInputs] = useState<Record<string, string>>({});
  const [gridAnswers, setGridAnswers] = useState<Record<string, string>>({});
  const [selectedOddOption, setSelectedOddOption] = useState<number | null>(null);
  const [selectedAssertionOption, setSelectedAssertionOption] = useState<number | null>(null);

  const [shuffledFoodChain, setShuffledFoodChain] = useState<any[]>([]);
  const [shuffledShapes, setShuffledShapes] = useState<any[]>([]);
  const [shuffledTimeline, setShuffledTimeline] = useState<any[]>([]);
  const [shuffledSequence, setShuffledSequence] = useState<any[]>([]);
  const [shuffledOddOneOut, setShuffledOddOneOut] = useState<any[]>([]);
  const [shuffledAffixes, setShuffledAffixes] = useState<any[]>([]);

  useEffect(() => {
    setSelectedGroup(userGroup);
  }, [userGroup]);

  // Comprehensive 6-language UI translations
  const UI_TEXT = useMemo(() => {
    const l = currentLanguage;
    return {
      pageTitle: getLocText({
        en: 'Interactive Daily Educational Puzzles',
        hi: 'इंटरएक्टिव दैनिक शैक्षणिक पजल गेम्स',
        gu: 'ઇન્ટરેક્ટિવ ડેઇલી શૈક્ષણિક પઝલ ગેમ્સ',
        mr: 'इंटरअॅक्टिव्ह दैनंदिन शैक्षणिक कोडे खेळ',
        ta: 'ஊடாடும் தினசரி கல்வி புதிர் விளையாட்டுகள்',
        te: 'ఇంటరాక్టివ్ డైలీ ఎడ్యుకేషనల్ పజిల్ గేమ్స్'
      }, l),
      pageSub: getLocText({
        en: 'Play fresh dynamic puzzles every day to master science, math, and analytical reasoning',
        hi: 'विज्ञान, गणित और तार्किक सोच में निपुणता के लिए हर दिन नए पजल खेलें',
        gu: 'દરરોજ નવી પઝલ રમો અને વિજ્ઞાન, ગણિત તથા તર્કશાસ્ત્ર મજબૂત કરો',
        mr: 'विज्ञान, गणित आणि तार्किक विचारात प्राविण्य मिळवण्यासाठी दररोज नवीन कोडी खेळा',
        ta: 'அறிவியல், கணிதம் மற்றும் தர்க்கரீதியான சிந்தனையில் தேர்ச்சி பெற தினமும் புதிய புதிர்களை விளையாடுங்கள்',
        te: 'సైన్స్, మ్యాథ్స్ మరియు తార్కిక ఆలోచనలో నైపుణ్యం సాధించడానికి ప్రతిరోజూ కొత్త పజిల్స్ ఆడండి'
      }, l),
      group1Tag: getLocText({ en: '🟢 Group 1 (Classes 1–5)', hi: '🟢 ग्रुप 1 (कक्षा 1–5)', gu: '🟢 ગ્રુપ 1 (ધોરણ 1–5)', mr: '🟢 गट 1 (इयत्ता 1–5)', ta: '🟢 குழு 1 (வகுப்புகள் 1–5)', te: '🟢 గ్రూప్ 1 (తరగతులు 1–5)' }, l),
      group1Title: getLocText({ en: 'Playful Basics & Visual Experiments', hi: 'मजेदार बुनियादी बातें और प्रयोग', gu: 'રમુજી પાયાની બાબતો અને પ્રયોગો', mr: 'आनंददायी मूलभूत गोष्टी', ta: 'அடிப்படைகள் & காட்சி சோதனைகள்', te: 'ప్రాథమిక విషయాలు & ప్రయోగాలు' }, l),
      group1Slogan: getLocText({ en: '“Group 1 builds basic concepts”', hi: '“ग्रुप 1 बुनियादी अवधारणाएं मजबूत करता है”', gu: '“ગ્રુપ 1 પાયાના ખ્યાલો મજબૂત કરે છે”', mr: '“गट 1 मूलभूत संकल्पना मजबूत करतो”', ta: '“குழு 1 அடிப்படை கருத்துக்களை உருவாக்குகிறது”', te: '“గ్రూప్ 1 ప్రాథమిక భావనలను నిర్మిస్తుంది”' }, l),

      group2Tag: getLocText({ en: '🟡 Group 2 (Classes 6–9)', hi: '🟡 ग्रुप 2 (कक्षा 6–9)', gu: '🟡 ગ્રુપ 2 (ધોરણ 6–9)', mr: '🟡 गट 2 (इयत्ता 6–9)', ta: '🟡 குழு 2 (வகுப்புகள் 6–9)', te: '🟡 గ్రూప్ 2 (తరగతులు 6–9)' }, l),
      group2Title: getLocText({ en: 'Structured Knowledge Building & Processes', hi: 'संरचित ज्ञान निर्माण और वैज्ञानिक प्रक्रियाएं', gu: 'સંરચિત જ્ઞાન નિર્માણ અને વૈજ્ઞાનિક પ્રક્રિયાઓ', mr: 'संरचित ज्ञान निर्मिती', ta: 'அமைக்கப்பட்ட அறிவு உருவாக்கம்', te: 'నిర్మాణాత్మక జ్ఞాన నిర్మాణం' }, l),
      group2Slogan: getLocText({ en: '“Group 2 strengthens core concepts”', hi: '“ग्रुप 2 मुख्य अवधारणाओं को मजबूत करता है”', gu: '“ગ્રુપ 2 વૈજ્ઞાનિક ક્ષમતા વધારે છે”', mr: '“गट 2 मुख्य संकल्पना मजबूत करतो”', ta: '“குழு 2 முக்கிய கருத்துக்களை வலுப்படுத்துகிறது”', te: '“గ్రૂప్ 2 కోర్ భావనలను బలోపేతం చేస్తుంది”' }, l),

      group3Tag: getLocText({ en: '🔵 Group 3 (Classes 10–12)', hi: '🔵 ग्रुप 3 (कक्षा 10–12)', gu: '🔵 ગ્રુપ 3 (ધોરણ 10–12)', mr: '🔵 गट 3 (इयत्ता 10–12)', ta: '🔵 குழு 3 (வகுப்புகள் 10–12)', te: '🔵 గ్రూప్ 3 (తరగతులు 10–12)' }, l),
      group3Title: getLocText({ en: 'Critical Thinking & Analytical Reasoning', hi: 'गंभीर सोच और विश्लेषणात्मक तर्क', gu: 'તાર્કિક વિચારસરણી અને વિશ્લેષણાત્મક ક્ષમતા', mr: 'गंभीर विचार आणि तर्क', ta: 'முக்கியமான சிந்தனை & தர்க்கம்', te: 'క్లిష్టమైన ఆలోచన & తర్కం' }, l),
      group3Slogan: getLocText({ en: '“Group 3 sharpens analytical reasoning”', hi: '“ग्रुप 3 विश्लेषणात्मक तर्क को तेज करता है”', gu: '“ગ્રુપ 3 તાર્કિક વિચારસરણી તીક્ષ્ણ કરે છે”', mr: '“गट 3 विश्लेषणात्मक तर्क तीव्र करतो”', ta: '“குழு 3 பகுப்பாய்வு தர்க்கத்தை கூர்மைப்படுத்துகிறது”', te: '“గ్రૂપ 3 విశ్లేషణాత్మక తర్కాన్ని పదునుపెడుతుంది”' }, l),

      backToHub: getLocText({ en: 'Back to Puzzle Hub', hi: 'पजल हब पर वापस जाएं', gu: 'પઝલ હબ પર પાછા જાઓ', mr: 'कोडे हबवर परत जा', ta: 'புதிர் மையத்திற்குத் திரும்பு', te: 'పజిల్ హబ్‌కి తిరిగి వెళ్లండి' }, l),
      startPuzzle: getLocText({ en: 'Play Daily Puzzle', hi: 'दैनिक पजल खेलें', gu: 'દૈનિક પઝલ રમો', mr: 'दैनंदिन कोडे खेळा', ta: 'தினசரி புதிரை விளையாடு', te: 'డైలీ పజิล ఆడండి' }, l),
      resetPuzzle: getLocText({ en: 'Reset Puzzle', hi: 'पुनः प्रयास करें', gu: 'ફરીથી પ્રયાસ કરો', mr: 'रीसेट करा', ta: 'மீட்டமைக்க', te: 'రీసెట్ చేయండి' }, l),
      checkSolution: getLocText({ en: 'Check Solution', hi: 'उत्तर जांचें', gu: 'જવાબ તપાસો', mr: 'उत्तर तपासा', ta: 'சரிபார்க்கவும்', te: 'తనిఖీ చేయండి' }, l),
      nextChallenge: getLocText({ en: 'Generate Different Puzzle', hi: 'अलग पजल बनाएं', gu: 'નવો કોયડો બનાવો', mr: 'वेगळे कोडे तयार करा', ta: 'வேறு புதிர்', te: 'వేరొక పజిల్' }, l),
      totalPoints: getLocText({ en: 'Total Points', hi: 'कुल अंक', gu: 'કુલ પોઇન્ટ્સ', mr: 'एकूण गुण', ta: 'மொத்த புள்ளிகள்', te: 'మొత్తం పాయింట్లు' }, l),
      solvedTag: getLocText({ en: 'Solved (+25 XP)', hi: 'हल किया (+25 XP)', gu: 'ઉકેલાયું (+25 XP)', mr: 'सोडवले (+25 XP)', ta: 'தீர்க்கப்பட்டது (+25 XP)', te: 'పూర్తయింది (+25 XP)' }, l),
      
      // Game specific instructions & feedback
      foodChainInstruct: getLocText({ en: 'Select organisms in correct ecological order:', hi: 'जीवों को सही पारिस्थितिक क्रम में चुनें:', gu: 'સજીવોને સાચા આહાર ક્રમમાં પસંદ કરો:', mr: 'सजीवांना योग्य अन्न साखळी क्रमाने निवडा:', ta: 'உயிரினங்களை சரியான வரிசையில் தேர்ந்தெடுக்கவும்:', te: 'జీవులను సరైన ఆహారపు గొలుసు క్రమంలో ఎంచుకోండి:' }, l),
      foodChainPlaceholder: getLocText({ en: 'Select organisms below to build the chain...', hi: 'श्रृंखला बनाने के लिए नीचे से जीवों को चुनें...', gu: 'શ્રૃંખલા બનાવવા માટે નીચેથી સજીવો પસંદ કરો...', mr: 'साखळी तयार करण्यासाठी खालील सजीव निवडा...', ta: 'சங்கிலியை உருவாக்க கீழே உள்ள உயிரினங்களைத் தேர்ந்தெடுக்கவும்...', te: 'గొలుసును నిర్మించడానికి దిగువ జీవులను ఎంచుకోండి...' }, l),
      
      shapeInstruct: getLocText({ en: 'Select shapes to complete the target blueprint:', hi: 'ब्लूप्रिंट पूरा करने के लिए आकृतियों को चुनें:', gu: 'બ્લૂપ્રિન્ટ પૂર્ણ કરવા આકારો પસંદ કરો:', mr: 'आराखडा पूर्ण करण्यासाठी आकार निवडा:', ta: 'வரைபடத்தை முடிக்க வடிவங்களைத் தேர்ந்தெடுக்கவும்:', te: 'బ్లూప్రింట్‌ను పూర్తి చేయడానికి ఆకారాలను ఎంచుకోండి:' }, l),
      shapeComplete: getLocText({ en: 'Blueprint completed successfully!', hi: 'ब्लूप्रिंट सफलतापूर्वक पूरा हुआ!', gu: 'બ્લૂપ્રિન્ટ સફળતાપૂર્વક પૂર્ણ થયું!', mr: 'आराखडा यशस्वीरीत्या पूर्ण झाला!', ta: 'வரைபடம் வெற்றிகரமாக முடிந்தது!', te: 'బ్లూప్రింట్ విజయవంతంగా పూర్తయింది!' }, l),
      shapeIncomplete: getLocText({ en: 'Incomplete blueprint! Fit all shapes into the design.', hi: 'अपूर्ण ब्लूप्रिंट! सभी आकृतियों को डिज़ाइन में फिट करें।', gu: 'અધૂરું બ્લૂપ્રિન્ટ! તમામ આકારો ગોઠવો.', mr: 'अपूर्ण आराखडा! सर्व आकार योग्य ठिकाणी बसवा.', ta: 'முழுமையற்ற வரைபடம்! அனைத்து வடிவங்களையும் பொருத்தவும்.', te: 'అసంపూర్ణ బ్లూప్రింట్! అన్ని ఆకారాలను అమర్చండి.' }, l),
      
      wordPrompt: getLocText({ en: 'Select an affix to construct the word:', hi: 'शब्द बनाने के लिए प्रत्यय/उपसर्ग चुनें:', gu: 'શબ્દ બનાવવા પૂર્વગ કે પ્રત્યય પસંદ કરો:', mr: 'शब्द तयार करण्यासाठी प्रत्यय जोडा:', ta: 'சொல்லை உருவாக்க பின்னொட்டைத் தேர்ந்தெடுக்கவும்:', te: 'పదాన్ని రూపొందించడానికి ప్రత్యయాన్ని ఎంచుకోండి:' }, l),
      wordSelectAffix: getLocText({ en: 'Please select an affix first!', hi: 'कृपया पहले एक उपसर्ग या प्रत्यय चुनें!', gu: 'કૃપા કરીને પહેલા પૂર્વગ કે પ્રત્યય પસંદ કરો!', mr: 'कृपया आधी प्रत्यय निवडा!', ta: 'முதலில் ஒரு பின்னொட்டைத் தேர்ந்தெடுக்கவும்!', te: 'దయచేసి ముందుగా ప్రత్యయాన్ని ఎంచుకోండి!' }, l),
      
      circuitInstruct: getLocText({ en: 'Click components to complete the electric circuit:', hi: 'विद्युत परिपथ पूरा करने के लिए घटकों पर क्लिक करें:', gu: 'વિદ્યુત પરિપથ પૂરો કરવા ઘટકો પસંદ કરો:', mr: 'विद्युत परिपथ पूर्ण करण्यासाठी घटक निवडा:', ta: 'மின்சுற்றை பூர்த்தி செய்ய பாகங்களை சொடுக்கவும்:', te: 'విద్యుత్ సర్క్యూట్‌ను పూర్తి చేయడానికి భాగాలను క్లిక్ చేయండి:' }, l),
      circuitComplete: getLocText({ en: 'Great job! Electric circuit loop is closed and powered!', hi: 'बहुत बढ़िया! विद्युत परिपथ चालू हो गया है!', gu: 'ખૂબ સરસ! વિદ્યુત પરિપથ પૂર્ણ થયો અને ચાલુ થયો!', mr: 'छान! विद्युत परिपथ पूर्ण झाला!', ta: 'அற்புதம்! மின்சுற்று முழுமையடைந்தது!', te: 'చాలా బాగుంది! విద్యుత్ సర్క్యూట్ పూర్తయింది!' }, l),
      circuitIncomplete: getLocText({ en: 'Circuit incomplete! Connect all components.', hi: 'परिपथ अपूर्ण है! सभी घटकों को जोड़ें।', gu: 'પરિપથ અધૂરો છે! તમામ ઘટકો જોડો.', mr: 'परिपथ अपूर्ण आहे! सर्व घटक जोडा.', ta: 'மின்சுற்று முழுமை பெறவில்லை! அனைத்து பாகங்களையும் இணைக்கவும்.', te: 'సర్క్యూట్ అసంపూర్ణంగా ఉంది! అన్ని భాగాలను అనుసంధానించండి.' }, l),

      crosswordAcross: getLocText({ en: '1 ACROSS', hi: '1 क्षैतिज', gu: '1 આડી ચાવી', mr: '1 आडवे', ta: '1 இடமிருந்து வலம்', te: '1 అడ్డం' }, l),
      crosswordDown: getLocText({ en: '2 DOWN', hi: '2 लंबवत', gu: '2 ઊભી ચાવી', mr: '2 उभे', ta: '2 மேலிருந்து கீழ்', te: '2 నిలువు' }, l),
      crosswordPlaceholder: getLocText({ en: 'TYPE ANSWER...', hi: 'उत्तर लिखें...', gu: 'જવાબ લખો...', mr: 'उत्तर लिहा...', ta: 'பதிலை டைப் செய்யவும்...', te: 'సమాధానం టైప్ చేయండి...' }, l),
      crosswordSolved: getLocText({ en: 'Awesome! Science crossword solved correctly!', hi: 'शानदार! विज्ञान क्रॉसवर्ड सफलतापूर्वक हल हुआ!', gu: 'અદ્ભુત! વિજ્ઞાન ક્રોસવર્ડ સાચો ઉકેલાયો!', mr: 'उत्कृष्ट! विज्ञान शब्दकोडे पूर्ण झाले!', ta: 'அற்புதம்! அறிவியல் குறுக்கெழுத்து சரியாக தீர்க்கப்பட்டது!', te: 'అద్భుతం! సైన్స్ క్రాస్‌వర్డ్ సరిగ్గా పూర్తయింది!' }, l),
      crosswordIncorrect: getLocText({ en: 'Check your answers and letter counts!', hi: 'अपने उत्तर और अक्षरों की संख्या जांचें!', gu: 'તમારા જવાબો અને અક્ષરોની સંખ્યા ચકાસો!', mr: 'तुमचे उत्तर आणि अक्षरे तपासा!', ta: 'உங்கள் பதில்களையும் எழுத்துக்களின் எண்ணிக்கையையும் சரிபார்க்கவும்!', te: 'మీ సమాధానాలు మరియు అక్షరాల సంఖ్యను తనిఖీ చేయండి!' }, l),

      gridSolved: getLocText({ en: 'Brilliant! All math calculations are correct!', hi: 'उत्कृष्ट! सभी गणितीय गणनाएं सही हैं!', gu: 'ખૂબ સરસ! તમામ ગણતરીઓ સાચી છે!', mr: 'छान! सर्व गणितीय गणना योग्य आहेत!', ta: 'அற்புதம்! அனைத்து கணிதக் கணக்கீடுகளும் சரி!', te: 'చాలా బాగుంది! అన్ని గణిత లెక్కలు సరైనవి!' }, l),
      gridIncorrect: getLocText({ en: 'Some math answers are incorrect. Re-check calculations!', hi: 'कुछ उत्तर गलत हैं। अपनी गणना पुनः जांचें!', gu: 'કેલાક જવાબો ખોટા છે. ગણતરી ફરી ચકાસો!', mr: 'काही उत्तरे चुकीची आहेत. पुन्हा तपासा!', ta: 'சில பதில்கள் தவறானவை. கணக்கீடுகளை மீண்டும் சரிபார்க்கவும்!', te: 'కొన్ని సమాధానాలు తప్పు. లెక్కలను మళ్లీ తనిఖీ చేయండి!' }, l),

      oddIncorrect: getLocText({ en: 'Incorrect choice! Review the classification.', hi: 'गलत विकल्प! वर्गीकरण को ध्यान से पढ़ें।', gu: 'ખોટો વિકલ્પ! વર્ગીકરણ ફરીથી વાંચો.', mr: 'चुकीचा पर्याय! वर्गीकरण पुन्हा वाचा.', ta: 'தவறான தேர்வு! வகைப்பாட்டை மீண்டும் படிக்கவும்.', te: 'తప్పు ఎంపిక! వర్గీకరణను మళ్లీ చూడండి.' }, l)
    };
  }, [currentLanguage]);

  const GAMES: GameDefinition[] = useMemo(() => [
    {
      id: 'food-chain',
      group: 1,
      title: { en: 'Food Chain Puzzle', hi: 'खाद्य श्रृंखला पजल', gu: 'આહાર શ્રૃંખલા પઝલ', mr: 'અન્ન સાખળી કોડે', ta: 'உணவு சங்கிலி புதிர்', te: 'ఆహార గొలుసు పజిల్' },
      category: { en: 'Science & Ecology', hi: 'विज्ञान और पारिस्थितिकी', gu: 'વિજ્ઞાન અને પર્યાવરણ', mr: 'विज्ञान आणि पर्यावरण', ta: 'அறிவியல் & சூழலியல்', te: 'సైన్స్ & పర్యావరణం' },
      icon: '🌿', color: 'text-emerald-700', borderColor: 'border-emerald-300 hover:border-emerald-500', bgColor: 'bg-emerald-50/50',
      description: { en: 'Arrange organisms in correct order from producer to apex predator.', hi: 'उत्पादक से शीर्ष शिकारी तक जीवों को सही क्रम में व्यवस्थित करें।', gu: 'સજીવોને ખોરાકના સાચા ક્રમમાં ગોઠવો.', mr: 'सजीवांना योग्य अन्न साखळी क्रमाने लावा.', ta: 'உயிரினங்களை சரியான வரிசையில் ஒழுங்கமைக்கவும்.', te: 'జీవులను సరైన క్రమంలో అమర్చండి.' },
      hasDiagram: true
    },
    {
      id: 'shape-puzzle',
      group: 1,
      title: { en: 'Shape Puzzle (Geometry)', hi: 'आकृति पजल (ज्यामिति)', gu: 'આકાર પઝલ (ભૌમિતિ)', mr: 'આકાર કોડે (ભૂમિતિ)', ta: 'வடிவ புதிர் (வடிவியல்)', te: 'ఆకార పజిల్ (జ్యామితి)' },
      category: { en: 'Math & Geometry', hi: 'गणित और ज्यामिति', gu: 'ગણિત અને ભૌમિતિ', mr: 'गणित आणि भूमिती', ta: 'கணிதம் & வடிவியல்', te: 'మ్యాథ్స్ & జ్యామితి' },
      icon: '📐', color: 'text-blue-700', borderColor: 'border-blue-300 hover:border-blue-500', bgColor: 'bg-blue-50/50',
      description: { en: 'Fit geometric shapes into blueprint target outlines.', hi: 'ब्लूप्रिंट में ज्यामितीय आकृतियों को फिट करें।', gu: 'બ્લૂપ્રિન્ટમાં આકારો બરાબર ગોઠવો.', mr: 'आराखड्यात भूमितीय आकार बसवा.', ta: 'வரைபடத்தில் வடிவங்களைப் பொருத்தவும்.', te: 'బ్లూప్రింట్‌లో ఆకారాలను అమర్చండి.' },
      hasDiagram: true
    },
    {
      id: 'word-builder',
      group: 1,
      title: { en: 'Word Builder Puzzle', hi: 'शब्द निर्माता पजल', gu: 'શબ્દ નિર્માણ પઝલ', mr: 'શબ્દ નિર્મિતિ કોડે', ta: 'சொல் உருவாக்க புதிர்', te: 'పద నిర్మాణ పజిల్' },
      category: { en: 'Language & Grammar', hi: 'भाषा और व्याकरण', gu: 'ભાષા અને વ્યાકરણ', mr: 'भाषा आणि व्याकरण', ta: 'மொழி & இலக்கணம்', te: 'భాష & వ్యాకరణం' },
      icon: '🔠', color: 'text-purple-700', borderColor: 'border-purple-300 hover:border-purple-500', bgColor: 'bg-purple-50/50',
      description: { en: 'Combine root words with prefixes and suffixes.', hi: 'मूल शब्दों को उपसर्ग और प्रत्यय के साथ जोड़ें।', gu: 'પૂર્વગ અને પ્રત્યય જોડી નવા શબ્દો બનાવો.', mr: 'उपसर्ग आणि प्रत्यय जोडून शब्द तयार करा.', ta: 'முன்னொட்டு மற்றும் பின்னொட்டுகளை இணைக்கவும்.', te: 'ఉపసర్గలు మరియు ప్రత్యయాలను కలపండి.' },
      hasDiagram: false
    },
    {
      id: 'circuit-puzzle',
      group: 1,
      title: { en: 'Electric Circuit Puzzle', hi: 'विद्युत परिपथ पजल', gu: 'વિદ્યુત પરિપથ પઝલ', mr: 'વિદ્યુત પરિપથ કોડે', ta: 'மின்சுற்று புதிர்', te: 'విద్యుత్ సర్క్యూట్ పజిల్' },
      category: { en: 'Physics & Electricity', hi: 'भौतिकी और बिजली', gu: 'ભૌતિકશાસ્ત્ર અને વીજળી', mr: 'भौतिकशास्त्र आणि वीज', ta: 'இயற்பியல் & மின்சாரம்', te: 'ఫిజిక్స్ & విద్యుత్' },
      icon: '⚡', color: 'text-amber-700', borderColor: 'border-amber-300 hover:border-amber-500', bgColor: 'bg-amber-50/50',
      description: { en: 'Insert components into closed schematic loops to power Lightbulbs.', hi: 'बल्ब चलाने के लिए परिपथ घटक जोड़ें।', gu: 'લાઇટ ચાલુ કરવા ઘટકો પરિપથમાં મુકો.', mr: 'बल्ब चालू करण्यासाठी परिपथ घटक जोडा.', ta: 'மின்விளக்கை ஒளிரச் செய்ய மின்சுற்று பாகங்களை இணைக்கவும்.', te: 'బల్బును వెలిగించడానికి సర్క్యూట్ భాగాలను అమర్చండి.' },
      hasDiagram: true
    },
    {
      id: 'memory-match',
      group: 1,
      title: { en: 'Memory Match', hi: 'मेमोरी मैच', gu: 'મેમરી મેચ', mr: 'સ્મૃતિ જુળવણી', ta: 'நினைவக பொருத்தம்', te: 'మెమరీ మ్యాచ్' },
      category: { en: 'Memory & Focus', hi: 'स्मृति और ध्यान', gu: 'યાદશક્તિ અને એકાગ્રતા', mr: 'स्मृती आणि एकाग्रता', ta: 'நினைவாற்றல்', te: 'జ్ఞాపకశక్తి' },
      icon: '🎴', color: 'text-rose-700', borderColor: 'border-rose-300 hover:border-rose-500', bgColor: 'bg-rose-50/50',
      description: { en: 'Flip cards to match mathematical symbols, units, or chemical elements.', hi: 'गणितीय प्रतीकों या तत्वों को मिलाने के लिए कार्ड पलटें।', gu: 'ગણિતના ચિહ્નો કે તત્વોના જોડકા મેળવો.', mr: 'गणितीय चिन्हे जुळवण्यासाठी कार्ड उलटवा.', ta: 'கார்டுகளைத் திருப்பவும்.', te: 'కార్డులను తిప్పండి.' },
      hasDiagram: true
    },
    {
      id: 'history-timeline',
      group: 2,
      title: { en: 'History Timeline Puzzle', hi: 'इतिहास समयरेखा पजल', gu: 'ઇતિહાસ સમયરેખા પઝલ', mr: 'ઇતિહાસ કાલરેષા કોડે', ta: 'வரலாற்று காலவரிசை புதிர்', te: 'చరిత్ర టైమ్‌లైన్ పజిల్' },
      category: { en: 'Social Studies', hi: 'सामाजिक अध्ययन', gu: 'સામાજિક વિજ્ઞાન', mr: 'सामाजिक शास्त्रे', ta: 'சமூகவியல்', te: 'సామాజిక శాస్త్రం' },
      icon: '📜', color: 'text-amber-800', borderColor: 'border-amber-300 hover:border-amber-600', bgColor: 'bg-amber-50/60',
      description: { en: 'Arrange historical events chronologically.', hi: 'ऐतिहासिक घटनाओं को कालानुक्रमिक क्रम में व्यवस्थित करें।', gu: 'ઇતિહાસની મહત્વપૂર્ણ ઘટનાઓને સમયરેખા પર ગોઠવો.', mr: 'ऐतिहासिक घटना कालक्रमानुसार लावा.', ta: 'வரலாற்று நிகழ்வுகளை காலவரிசைப்படி ஒழுங்கமைக்கவும்.', te: 'చారిత్రక సంఘటనలను కాలక్రమానుసారంగా అమర్చండి.' },
      hasDiagram: true
    },
    {
      id: 'sequence-builder',
      group: 2,
      title: { en: 'Sequence Process Builder', hi: 'प्रक्रिया अनुक्रम पजल', gu: 'પ્રક્રિયા ક્રમ પઝલ', mr: 'પ્રક્રિયા ક્રમ કોડે', ta: 'செயல்முறை வரிசை புதிர்', te: 'ప్రక్రియ క్రమ పజిల్' },
      category: { en: 'Science Processes', hi: 'वैज्ञानिक प्रक्रियाएं', gu: 'વૈજ્ઞાનિક પ્રક્રિયાઓ', mr: 'वैज्ञानिक प्रक्रिया', ta: 'அறிவியல் செயல்முறைகள்', te: 'శాస్త్రీయ ప్రక్రియలు' },
      icon: '🔄', color: 'text-sky-700', borderColor: 'border-sky-300 hover:border-sky-500', bgColor: 'bg-sky-50/50',
      description: { en: 'Order scientific processes: Water Cycle, Plant Growth.', hi: 'वैज्ञानिक प्रक्रियाओं (जल चक्र, आदि) को सही क्रम में व्यवस्थित करें।', gu: 'વૈજ્ઞાનિક પ્રક્રિયાઓ યોગ્ય ક્રમમાં ગોઠવો.', mr: 'वैज्ञानिक प्रक्रिया योग्य क्रमाने लावा.', ta: 'அறிவியல் செயல்பாடுகளை வரிசைப்படுத்தவும்.', te: 'శాస్త్రీయ ప్రక్రియలను అమర్చండి.' },
      hasDiagram: true
    },
    {
      id: 'crossword',
      group: 2,
      title: { en: 'Science Crossword Puzzle', hi: 'विज्ञान क्रॉसवर्ड पजल', gu: 'વિજ્ઞાન ક્રોસવર્ડ પઝલ', mr: 'વિજ્ઞાન શબ્દકોડે', ta: 'அறிவியல் குறுக்கெழுத்து புதிர்', te: 'సైన్స్ క్రాస్‌వర్డ్ పజిల్' },
      category: { en: 'Science Vocabulary', hi: 'विज्ञान शब्दावली', gu: 'વિજ્ઞાન શબ્દ ભંડોળ', mr: 'विज्ञान शब्दसंग्रह', ta: 'அறிவியல் சொற்கள்', te: 'సైన్స్ పదజాలం' },
      icon: '✏️', color: 'text-indigo-700', borderColor: 'border-indigo-300 hover:border-indigo-500', bgColor: 'bg-indigo-50/50',
      description: { en: 'Fill in crossword grid clues for Biology or Physics vocabulary.', hi: 'जीव विज्ञान या भौतिकी शब्दावली के क्रॉसवर्ड भरें।', gu: 'જીવવિજ્ઞાન કે ભૌતિકશાસ્ત્રના શબ્દોનો ક્રોસવર્ડ પૂરો કરો.', mr: 'विज्ञान शब्दकोडे पूर्ण करा.', ta: 'குறுக்கெழுத்து புதிரை நிரப்பவும்.', te: 'క్రాస్‌వర్డ్‌ను పూరించండి.' },
      hasDiagram: true
    },
    {
      id: 'number-grid',
      group: 2,
      title: { en: 'Number Grid Math Chain', hi: 'संख्या ग्रिड गणित श्रृंखला', gu: 'સંખ્યા ગ્રિડ ગણિત શ્રૃંખલા', mr: 'સંખ્યા ગ્રીડ ગણિત સાખળી', ta: 'எண் கட்டக் கணித சங்கிலி', te: 'సంఖ్యా గ్రిడ్ మ్యాథ్ చైన్' },
      category: { en: 'Logical Arithmetic', hi: 'तार्किक अंकगणित', gu: 'તાર્કિક અંકગણિત', mr: 'तार्किक अंकगणित', ta: 'தர்க்கவியல் கணிதம்', te: 'లాజికల్ ఆర్థమెటిక్' },
      icon: '🔢', color: 'text-emerald-800', borderColor: 'border-emerald-300 hover:border-emerald-600', bgColor: 'bg-emerald-50/50',
      description: { en: 'Calculate missing arithmetic values across mathematical expression chains.', hi: 'गणितीय समीकरण श्रृंखलाओं में लुप्त मान की गणना करें।', gu: 'ગણિતની સાંકળમાં ખૂટતી સંખ્યાઓ લખો.', mr: 'गहाळ मूल्ये शोधा.', ta: 'விடுபட்ட மதிப்புகளைக் கணக்கிடுங்கள்.', te: 'తప్పిపోయిన విలువలను గణించండి.' },
      hasDiagram: true
    },
    {
      id: 'odd-one-out',
      group: 3,
      title: { en: 'Odd One Out', hi: 'विषम चुनें', gu: 'અલગ પડતું શોધો', mr: 'ગટાત ન બસનારા શબ્દ', ta: 'பொருந்தாத ஒன்றைக் கண்டறி', te: 'విభిન્નమైనదాన్ని గుర్తించండి' },
      category: { en: 'Analytical Logic', hi: 'विश्लेषणात्मक तर्क', gu: 'વિશ્લેષણાત્મક તર્ક', mr: 'विश्लेषणात्मक तर्क', ta: 'பகுப்பாய்வு தர்க்கம்', te: 'విశ్లేషణాత్మక తర్కం' },
      icon: '❓', color: 'text-rose-800', borderColor: 'border-rose-300 hover:border-rose-500', bgColor: 'bg-rose-50/50',
      description: { en: 'Identify the item that does NOT belong to the scientific classification.', hi: 'उस वस्तु को पहचानें जो दिए गए वैज्ञानिक समूह में शामिल नहीं है।', gu: 'આપેલા વૈજ્ઞાનિક જૂથમાં ન આવતી વસ્તુ શોધો.', mr: 'दिल्या वैज्ञानिक गटात न बसणारी वस्तू ओळखा.', ta: 'சேராத உருப்படியைக் கண்டறியவும்.', te: 'చెందని అంశాన్ని గుర్తించండి.' },
      hasDiagram: false
    }
  ], []);

  const visibleGames = useMemo(() => {
    return GAMES.filter(g => g.group === selectedGroup);
  }, [GAMES, selectedGroup]);

  const initMemoryGame = (variant = activeMemory) => {
    const deck: any[] = [];
    if (variant && Array.isArray(variant.pairs)) {
      variant.pairs.forEach((p: any, idx: number) => {
        deck.push({ id: idx * 2 + 1, symbol: p.symbol, pairId: p.pairId, flipped: false, matched: false });
        deck.push({ id: idx * 2 + 2, symbol: getLocText(p.text, currentLanguage), pairId: p.pairId, flipped: false, matched: false });
      });
    }
    setMemoryCards(shuffleArray(deck));
    setFlippedCardIds([]);
  };

  const startPuzzleWithNewVariant = (gameId: string) => {
    const nextSeed = (variantSeeds[gameId] ?? 0) + 1;
    setVariantSeeds(prev => ({
      ...prev,
      [gameId]: nextSeed
    }));
    setShowFeedback(false);
    setIsCorrect(false);
    setFeedbackMessage('');

    startGame(gameId, nextSeed);
  };

  const generateNewPuzzleVariant = (gameId: string) => {
    startPuzzleWithNewVariant(gameId);
  };

  const generateAIPuzzle = async (gameId: string, customTopic?: string) => {
    setIsGeneratingAI(prev => ({ ...prev, [gameId]: true }));
    setShowFeedback(false);
    setIsCorrect(false);
    setFeedbackMessage('');

    try {
      const response = await fetch('/api/gemini/generate-puzzle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          group: selectedGroup,
          lang: currentLanguage,
          topic: customTopic || ''
        })
      });

      const data = await response.json();
      if (data.success && data.puzzle) {
        const pz = data.puzzle;
        setDynamicAIPuzzles(prev => ({
          ...prev,
          [gameId]: {
            ...pz,
            mechanic: pz.mechanic || data.mechanic || 'Adaptive Reasoning',
            creativeTwist: pz.creativeTwist || ''
          }
        }));

        setActiveGameId(gameId);

        // Re-initialize specific game state with the dynamic AI puzzle
        if (gameId === 'food-chain' && pz.items) {
          setFoodChainOrder([]);
          setShuffledFoodChain(shuffleArray(pz.items));
        } else if (gameId === 'shape-puzzle' && pz.items) {
          setPlacedShapes([]);
          setShuffledShapes(shuffleArray(pz.items));
        } else if (gameId === 'history-timeline' && pz.items) {
          setTimelineOrder([]);
          setShuffledTimeline(shuffleArray(pz.items));
        } else if (gameId === 'word-builder' && pz.rootWord && pz.affixes) {
          setSelectedRoot(pz.rootWord);
          setSelectedAffix('');
          setShuffledAffixes(shuffleArray(pz.affixes));
        } else if (gameId === 'circuit-puzzle') {
          setCircuitSlots({ battery: false, switch: false, bulb: false });
        } else if (gameId === 'memory-match' && pz.pairs) {
          initMemoryGame(pz);
        } else if (gameId === 'sequence-builder' && pz.items) {
          setSequenceOrder([]);
          setShuffledSequence(shuffleArray(pz.items));
        } else if (gameId === 'crossword') {
          setCrosswordInputs({});
        } else if (gameId === 'number-grid') {
          setGridAnswers({});
        } else if (gameId === 'odd-one-out' && pz.items) {
          setSelectedOddOption(null);
          setShuffledOddOneOut(shuffleArray(pz.items));
        }
      } else {
        startPuzzleWithNewVariant(gameId);
      }
    } catch (err) {
      console.warn("AI dynamic generation fallback to variant:", err);
      startPuzzleWithNewVariant(gameId);
    } finally {
      setIsGeneratingAI(prev => ({ ...prev, [gameId]: false }));
    }
  };

  const startGame = (gameId: string, nextSeedIndex?: number) => {
    setActiveGameId(gameId);
    setShowFeedback(false);
    setIsCorrect(false);
    setFeedbackMessage('');

    const currentSeed = nextSeedIndex !== undefined ? nextSeedIndex : (variantSeeds[gameId] || 0);

    if (gameId === 'food-chain') {
      const v = dynamicAIPuzzles['food-chain']?.items?.length ? dynamicAIPuzzles['food-chain'] : (FOOD_CHAIN_VARIANTS[currentSeed % FOOD_CHAIN_VARIANTS.length] || FOOD_CHAIN_VARIANTS[0]);
      setFoodChainOrder([]);
      setShuffledFoodChain(shuffleArray(v?.items || []));
    } else if (gameId === 'shape-puzzle') {
      const v = dynamicAIPuzzles['shape-puzzle']?.items?.length ? dynamicAIPuzzles['shape-puzzle'] : (SHAPE_VARIANTS[currentSeed % SHAPE_VARIANTS.length] || SHAPE_VARIANTS[0]);
      setPlacedShapes([]);
      setShuffledShapes(shuffleArray(v?.items || []));
    } else if (gameId === 'history-timeline') {
      const v = dynamicAIPuzzles['history-timeline']?.items?.length ? dynamicAIPuzzles['history-timeline'] : (TIMELINE_VARIANTS[currentSeed % TIMELINE_VARIANTS.length] || TIMELINE_VARIANTS[0]);
      setTimelineOrder([]);
      setShuffledTimeline(shuffleArray(v?.items || []));
    } else if (gameId === 'word-builder') {
      const v = dynamicAIPuzzles['word-builder']?.affixes?.length ? dynamicAIPuzzles['word-builder'] : (WORD_BUILDER_VARIANTS[currentSeed % WORD_BUILDER_VARIANTS.length] || WORD_BUILDER_VARIANTS[0]);
      setSelectedRoot(v?.rootWord || 'BIO');
      setSelectedAffix('');
      setShuffledAffixes(shuffleArray(v?.affixes || []));
    } else if (gameId === 'circuit-puzzle') {
      setCircuitSlots({ battery: false, switch: false, bulb: false });
    } else if (gameId === 'memory-match') {
      const v = dynamicAIPuzzles['memory-match']?.pairs?.length ? dynamicAIPuzzles['memory-match'] : (MEMORY_VARIANTS[currentSeed % MEMORY_VARIANTS.length] || MEMORY_VARIANTS[0]);
      initMemoryGame(v);
    } else if (gameId === 'sequence-builder') {
      const v = dynamicAIPuzzles['sequence-builder']?.items?.length ? dynamicAIPuzzles['sequence-builder'] : (SEQUENCE_VARIANTS[currentSeed % SEQUENCE_VARIANTS.length] || SEQUENCE_VARIANTS[0]);
      setSequenceOrder([]);
      setShuffledSequence(shuffleArray(v?.items || []));
    } else if (gameId === 'crossword') {
      setCrosswordInputs({});
    } else if (gameId === 'number-grid') {
      setGridAnswers({});
    } else if (gameId === 'odd-one-out') {
      const v = dynamicAIPuzzles['odd-one-out']?.items?.length ? dynamicAIPuzzles['odd-one-out'] : (ODD_ONE_OUT_VARIANTS[currentSeed % ODD_ONE_OUT_VARIANTS.length] || ODD_ONE_OUT_VARIANTS[0]);
      setSelectedOddOption(null);
      setShuffledOddOneOut(shuffleArray(v?.items || []));
    }
  };

  // Robust synchronization hook: ensures options are never empty when a game is active
  useEffect(() => {
    if (!activeGameId) return;

    if (activeGameId === 'food-chain') {
      if (shuffledFoodChain.length === 0 && activeFoodChain?.items?.length) {
        setShuffledFoodChain(shuffleArray(activeFoodChain.items));
      }
    } else if (activeGameId === 'shape-puzzle') {
      if (shuffledShapes.length === 0 && activeShape?.items?.length) {
        setShuffledShapes(shuffleArray(activeShape.items));
      }
    } else if (activeGameId === 'history-timeline') {
      if (shuffledTimeline.length === 0 && activeTimeline?.items?.length) {
        setShuffledTimeline(shuffleArray(activeTimeline.items));
      }
    } else if (activeGameId === 'word-builder') {
      if (shuffledAffixes.length === 0 && activeWord?.affixes?.length) {
        setShuffledAffixes(shuffleArray(activeWord.affixes));
      }
      if (!selectedRoot && activeWord?.rootWord) {
        setSelectedRoot(activeWord.rootWord);
      }
    } else if (activeGameId === 'memory-match') {
      if (memoryCards.length === 0 && activeMemory?.pairs?.length) {
        initMemoryGame(activeMemory);
      }
    } else if (activeGameId === 'sequence-builder') {
      if (shuffledSequence.length === 0 && activeSequence?.items?.length) {
        setShuffledSequence(shuffleArray(activeSequence.items));
      }
    } else if (activeGameId === 'odd-one-out') {
      if (shuffledOddOneOut.length === 0 && activeOdd?.items?.length) {
        setShuffledOddOneOut(shuffleArray(activeOdd.items));
      }
    }
  }, [activeGameId, activeFoodChain, activeShape, activeTimeline, activeWord, activeMemory, activeSequence, activeOdd, shuffledFoodChain.length, shuffledShapes.length, shuffledTimeline.length, shuffledAffixes.length, memoryCards.length, shuffledSequence.length, shuffledOddOneOut.length]);

  const handleCompleteSuccess = (msg: string) => {
    setIsCorrect(true);
    setShowFeedback(true);
    setFeedbackMessage(msg);
    if (activeGameId && !completedGames.has(activeGameId)) {
      setCompletedGames(prev => new Set(prev).add(activeGameId));
      const newPoints = (user.totalPoints || 0) + 25;
      onUpdateUser({ totalPoints: newPoints });
    }
  };

  const handleMemoryCardClick = (cardId: number) => {
    if (flippedCardIds.length >= 2) return;
    const card = memoryCards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched) return;

    const updated = memoryCards.map(c => c.id === cardId ? { ...c, flipped: true } : c);
    setMemoryCards(updated);
    const newFlipped = [...flippedCardIds, cardId];
    setFlippedCardIds(newFlipped);

    if (newFlipped.length === 2) {
      const card1 = updated.find(c => c.id === newFlipped[0]);
      const card2 = updated.find(c => c.id === newFlipped[1]);

      if (card1 && card2 && card1.pairId === card2.pairId) {
        setTimeout(() => {
          setMemoryCards(prev => prev.map(c => (c.id === card1.id || c.id === card2.id) ? { ...c, matched: true } : c));
          setFlippedCardIds([]);
          const remaining = updated.filter(c => !c.matched && c.id !== card1.id && c.id !== card2.id);
          if (remaining.length === 0) {
            handleCompleteSuccess(getLocText({
              en: `Fantastic memory! All concept pairs matched in ${getLocText(activeMemory.title, currentLanguage)}!`,
              hi: `शानदार मेमोरी! सभी जोड़े सफलतापूर्वक मिल गए!`,
              gu: `શ્રેષ્ઠ યાદશક્તિ! તમામ જોડકા સાચા મળ્યા!`,
              mr: `उत्कृष्ट स्मृती! सर्व जोड्या यशस्वीरित्या जुळल्या!`,
              ta: `அற்புதமான நினைவாற்றல்! அனைத்து ஜோடிகளும் பொருந்தின!`,
              te: `అద్భుతమైన జ్ఞాపకశక్తి! అన్ని జతలు సరిపోయాయి!`
            }, currentLanguage));
          }
        }, 600);
      } else {
        setTimeout(() => {
          setMemoryCards(prev => prev.map(c => (c.id === newFlipped[0] || c.id === newFlipped[1]) ? { ...c, flipped: false } : c));
          setFlippedCardIds([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto pb-16">
      
      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-indigo-900 via-[#3D405B] to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-mono font-bold text-amber-300 border border-white/20">
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Educational Puzzle Challenge • {todayDateStr}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
            {UI_TEXT.pageTitle}
          </h1>
          <p className="text-sm text-gray-200 font-sans leading-relaxed">
            {UI_TEXT.pageSub}
          </p>
        </div>

        {/* XP BADGE */}
        <div className="z-10 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xl shadow-md">
            🏆
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-200 font-bold">{UI_TEXT.totalPoints}</div>
            <div className="text-2xl font-black">{user.totalPoints || 0} XP</div>
          </div>
        </div>
      </div>

      {/* PUZZLE HUB VIEW */}
      {!activeGameId && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((grpNum) => {
              const grp = grpNum as PuzzleGroup;
              const isSelected = selectedGroup === grp;
              const tag = grp === 1 ? UI_TEXT.group1Tag : grp === 2 ? UI_TEXT.group2Tag : UI_TEXT.group3Tag;

              return (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col justify-between cursor-pointer ${
                    isSelected 
                      ? 'bg-[#3D405B] text-white border-[#3D405B] shadow-md scale-[1.02]' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  <span className={`text-xs font-mono font-extrabold ${isSelected ? 'text-amber-300' : 'text-gray-500'}`}>
                    {tag}
                  </span>
                  <span className="text-xs font-bold mt-2">
                    {grp === 1 ? UI_TEXT.group1Title : grp === 2 ? UI_TEXT.group2Title : UI_TEXT.group3Title}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-extrabold uppercase px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
                {selectedGroup === 1 ? UI_TEXT.group1Tag : selectedGroup === 2 ? UI_TEXT.group2Tag : UI_TEXT.group3Tag}
              </span>
              <h2 className="text-lg font-display font-bold text-[#3D405B]">
                {selectedGroup === 1 ? UI_TEXT.group1Title : selectedGroup === 2 ? UI_TEXT.group2Title : UI_TEXT.group3Title}
              </h2>
            </div>
            <div className="text-sm font-bold italic text-[#E07A5F] bg-orange-50 px-4 py-2 rounded-xl border border-orange-200">
              {selectedGroup === 1 ? UI_TEXT.group1Slogan : selectedGroup === 2 ? UI_TEXT.group2Slogan : UI_TEXT.group3Slogan}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {visibleGames.map((game) => {
              const titleText = getLocText(game.title, currentLanguage);
              const descText = getLocText(game.description, currentLanguage);
              const categoryText = getLocText(game.category, currentLanguage);
              const isDone = completedGames.has(game.id);

              return (
                <div
                  key={game.id}
                  className={`p-6 rounded-3xl border-2 transition-all duration-200 bg-white shadow-sm hover:shadow-md flex flex-col justify-between space-y-4 ${game.borderColor}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl shadow-inner">
                        {game.icon}
                      </div>
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {UI_TEXT.solvedTag}
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                          {categoryText}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className={`text-lg font-display font-extrabold ${game.color}`}>
                        {titleText}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1 font-sans leading-relaxed">
                        {descText}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => generateAIPuzzle(game.id)}
                      disabled={isGeneratingAI[game.id]}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingAI[game.id] ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      )}
                      <span>{isGeneratingAI[game.id] ? 'Generating...' : '✨ AI Adaptive'}</span>
                    </button>

                    <button
                      onClick={() => startPuzzleWithNewVariant(game.id)}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#3D405B] hover:bg-[#2D3047] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>{UI_TEXT.startPuzzle}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ACTIVE PUZZLE VIEW */}
      {activeGameId && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <button
              onClick={() => setActiveGameId(null)}
              className="text-xs font-bold text-gray-600 hover:text-[#3D405B] flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{UI_TEXT.backToHub}</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                {getLocText(GAMES.find(g => g.id === activeGameId)?.title, currentLanguage)}
              </span>

              <button
                onClick={() => generateAIPuzzle(activeGameId)}
                disabled={isGeneratingAI[activeGameId]}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isGeneratingAI[activeGameId] ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>{isGeneratingAI[activeGameId] ? 'Crafting AI Puzzle...' : '✨ AI Adaptive Mode'}</span>
              </button>

              <button
                onClick={() => generateNewPuzzleVariant(activeGameId)}
                className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-purple-200"
              >
                <Shuffle className="w-3.5 h-3.5 text-purple-700" />
                <span>{UI_TEXT.nextChallenge}</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC LOGIC MECHANIC & CREATIVE TWIST DISPLAY */}
          {dynamicAIPuzzles[activeGameId]?.mechanic && (
            <div className="bg-gradient-to-r from-purple-900/5 via-indigo-50 to-blue-50 p-4 rounded-2xl border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-mono font-bold rounded-full shadow-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  {dynamicAIPuzzles[activeGameId].mechanic}
                </span>
                <span className="text-xs font-bold text-indigo-950">
                  Adaptive Logic Mechanic
                </span>
              </div>
              {dynamicAIPuzzles[activeGameId].creativeTwist && (
                <p className="text-xs text-indigo-900 font-medium italic max-w-xl">
                  💡 {dynamicAIPuzzles[activeGameId].creativeTwist}
                </p>
              )}
            </div>
          )}

          {/* GAME 1: FOOD CHAIN */}
          {activeGameId === 'food-chain' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-200 shadow-sm space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-display font-bold text-emerald-800">
                  🌿 {getLocText(activeFoodChain.title, currentLanguage)}
                </h2>
                <p className="text-xs text-gray-600">
                  {UI_TEXT.foodChainInstruct}
                </p>
              </div>

              <div className="bg-emerald-50/70 p-6 rounded-2xl border border-emerald-200 space-y-4">
                <div className="flex flex-wrap items-center justify-center gap-3 min-h-[90px] p-4 bg-white/80 rounded-xl border border-emerald-200 shadow-inner">
                  {foodChainOrder.length === 0 ? (
                    <span className="text-xs text-gray-400 italic font-mono">
                      {UI_TEXT.foodChainPlaceholder}
                    </span>
                  ) : (
                    foodChainOrder.map((itemKey, idx) => {
                      const itemObj = activeFoodChain.items.find(i => i.key === itemKey);
                      return (
                        <React.Fragment key={idx}>
                          <div className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2">
                            <span>{itemObj ? getLocText(itemObj.name, currentLanguage) : itemKey}</span>
                            <button
                              onClick={() => setFoodChainOrder(prev => prev.filter((_, i) => i !== idx))}
                              className="ml-1 text-emerald-200 hover:text-white font-black text-xs cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                          {idx < foodChainOrder.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-emerald-500 font-bold" />
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(shuffledFoodChain.length > 0 ? shuffledFoodChain : (activeFoodChain?.items || [])).map(org => {
                  const isSelected = foodChainOrder.includes(org.key);
                  return (
                    <button
                      key={org.key}
                      onClick={() => {
                        if (!isSelected) setFoodChainOrder(prev => [...prev, org.key]);
                      }}
                      className={`p-4 rounded-2xl font-bold text-xs text-center border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-gray-100 text-gray-400 border-gray-200 opacity-50' 
                          : 'bg-white hover:bg-emerald-50 text-emerald-900 border-emerald-200 shadow-sm'
                      }`}
                    >
                      {getLocText(org.name, currentLanguage)}
                    </button>
                  );
                })}
              </div>

              {showFeedback && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${
                  isCorrect ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                  {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                  <span>{feedbackMessage}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    if (JSON.stringify(foodChainOrder) === JSON.stringify(activeFoodChain.solutionKeys)) {
                      handleCompleteSuccess(getLocText(activeFoodChain.explanation, currentLanguage));
                    } else {
                      setShowFeedback(true);
                      setIsCorrect(false);
                      setFeedbackMessage(getLocText(activeFoodChain.explanation, currentLanguage));
                    }
                  }}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {UI_TEXT.checkSolution}
                </button>
                <button
                  onClick={() => setFoodChainOrder([])}
                  className="px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
                >
                  {UI_TEXT.resetPuzzle}
                </button>
              </div>
            </div>
          )}

          {/* GAME 2: SHAPE PUZZLE */}
          {activeGameId === 'shape-puzzle' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-blue-200 shadow-sm space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-display font-bold text-blue-800">
                  📐 {getLocText(activeShape.title, currentLanguage)}
                </h2>
                <p className="text-xs text-gray-600">
                  {UI_TEXT.shapeInstruct}
                </p>
              </div>

              <div className="p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-indigo-50 flex flex-col items-center justify-center space-y-4">
                <div className="w-56 h-56 relative bg-white rounded-2xl border-2 border-dashed border-blue-300 flex items-center justify-center p-4 shadow-inner">
                  {(() => {
                    const id = activeShape.id || 'house';
                    if (id === 'rocket') {
                      return (
                        <svg className="w-full h-full" viewBox="0 0 200 200">
                          {/* Delta Side Fins */}
                          <polygon points="45,145 70,105 70,145" fill={placedShapes.includes('Delta Side Fins') ? '#10B981' : '#E2E8F0'} stroke="#047857" strokeWidth="2" />
                          <polygon points="155,145 130,105 130,145" fill={placedShapes.includes('Delta Side Fins') ? '#10B981' : '#E2E8F0'} stroke="#047857" strokeWidth="2" />
                          {/* Main Thruster Engine */}
                          <polygon points="75,145 125,145 135,180 65,180" fill={placedShapes.includes('Main Thruster Engine') ? '#F59E0B' : '#E2E8F0'} stroke="#B45309" strokeWidth="2" />
                          {/* Booster Body */}
                          <rect x="70" y="60" width="60" height="85" fill={placedShapes.includes('Booster Body') ? '#3B82F6' : '#F1F5F9'} stroke="#1D4ED8" strokeWidth="2" />
                          {/* Rocket Cone Nose */}
                          <polygon points="100,15 70,60 130,60" fill={placedShapes.includes('Rocket Cone Nose') ? '#EF4444' : '#E2E8F0'} stroke="#B91C1C" strokeWidth="2" />
                          {/* Porthole Glass Window */}
                          <circle cx="100" cy="95" r="15" fill={placedShapes.includes('Porthole Glass Window') ? '#06B6D4' : '#FFFFFF'} stroke="#0E7490" strokeWidth="2" />
                        </svg>
                      );
                    }
                    if (id === 'sailboat') {
                      return (
                        <svg className="w-full h-full" viewBox="0 0 200 200">
                          {/* Mast Pole */}
                          <rect x="96" y="15" width="8" height="115" fill={placedShapes.includes('Vertical Mast Pole') ? '#F59E0B' : '#E2E8F0'} stroke="#B45309" strokeWidth="2" />
                          {/* Main Sail */}
                          <polygon points="100,20 100,120 160,120" fill={placedShapes.includes('Triangular Main Sail') ? '#3B82F6' : '#F1F5F9'} stroke="#1D4ED8" strokeWidth="2" />
                          {/* Boat Hull */}
                          <polygon points="20,130 180,130 150,175 50,175" fill={placedShapes.includes('Trapezoid Boat Hull') ? '#8B5CF6' : '#E2E8F0'} stroke="#6D28D9" strokeWidth="2" />
                          {/* Lifebuoy */}
                          <circle cx="100" cy="150" r="10" fill={placedShapes.includes('Circular Lifebuoy Ring') ? '#EF4444' : '#FFFFFF'} stroke="#B91C1C" strokeWidth="2" />
                        </svg>
                      );
                    }
                    if (id === 'castle') {
                      return (
                        <svg className="w-full h-full" viewBox="0 0 200 200">
                          {/* Castle Wall */}
                          <rect x="40" y="80" width="120" height="90" fill={placedShapes.includes('Rectangular Castle Wall') ? '#64748B' : '#F1F5F9'} stroke="#334155" strokeWidth="2" />
                          {/* Twin Towers */}
                          <rect x="20" y="50" width="35" height="120" fill={placedShapes.includes('Twin Guard Towers') ? '#475569' : '#E2E8F0'} stroke="#1E293B" strokeWidth="2" />
                          <rect x="145" y="50" width="35" height="120" fill={placedShapes.includes('Twin Guard Towers') ? '#475569' : '#E2E8F0'} stroke="#1E293B" strokeWidth="2" />
                          {/* Arched Gate */}
                          <path d="M 85,170 L 85,125 A 15,15 0 0,1 115,125 L 115,170 Z" fill={placedShapes.includes('Arched Main Gateway') ? '#78350F' : '#E2E8F0'} stroke="#451A03" strokeWidth="2" />
                          {/* Conical Spires */}
                          <polygon points="37,15 20,50 55,50" fill={placedShapes.includes('Conical Spire Roofs') ? '#DC2626' : '#E2E8F0'} stroke="#991B1B" strokeWidth="2" />
                          <polygon points="162,15 145,50 180,50" fill={placedShapes.includes('Conical Spire Roofs') ? '#DC2626' : '#E2E8F0'} stroke="#991B1B" strokeWidth="2" />
                        </svg>
                      );
                    }
                    if (id === 'robot') {
                      return (
                        <svg className="w-full h-full" viewBox="0 0 200 200">
                          {/* Antenna */}
                          <line x1="100" y1="25" x2="100" y2="10" stroke="#475569" strokeWidth="3" />
                          <circle cx="100" cy="8" r="6" fill={placedShapes.includes('Top Signal Antenna') ? '#EF4444' : '#E2E8F0'} stroke="#B91C1C" strokeWidth="2" />
                          {/* Robot Head */}
                          <rect x="60" y="25" width="80" height="55" rx="8" fill={placedShapes.includes('Square Robot Head') ? '#3B82F6' : '#F1F5F9'} stroke="#1D4ED8" strokeWidth="2" />
                          {/* Glowing Eyes */}
                          <circle cx="82" cy="50" r="9" fill={placedShapes.includes('Glowing Eye Lenses') ? '#10B981' : '#FFFFFF'} stroke="#047857" strokeWidth="2" />
                          <circle cx="118" cy="50" r="9" fill={placedShapes.includes('Glowing Eye Lenses') ? '#10B981' : '#FFFFFF'} stroke="#047857" strokeWidth="2" />
                          {/* Robot Body */}
                          <rect x="50" y="90" width="100" height="75" rx="8" fill={placedShapes.includes('Chest Torso Body') ? '#6366F1' : '#F1F5F9'} stroke="#4338CA" strokeWidth="2" />
                        </svg>
                      );
                    }
                    if (id === 'train') {
                      return (
                        <svg className="w-full h-full" viewBox="0 0 200 200">
                          {/* Boiler */}
                          <rect x="40" y="80" width="90" height="60" rx="10" fill={placedShapes.includes('Steam Engine Boiler') ? '#0284C7' : '#F1F5F9'} stroke="#0369A1" strokeWidth="2" />
                          {/* Cabin */}
                          <rect x="125" y="50" width="55" height="90" rx="5" fill={placedShapes.includes('Driver Cabin Room') ? '#2563EB' : '#F1F5F9'} stroke="#1D4ED8" strokeWidth="2" />
                          {/* Chimney */}
                          <polygon points="65,80 55,45 85,45 75,80" fill={placedShapes.includes('Chimney Smokestack') ? '#DC2626' : '#E2E8F0'} stroke="#991B1B" strokeWidth="2" />
                          {/* Wheels */}
                          <circle cx="65" cy="155" r="16" fill={placedShapes.includes('Steel Drive Wheels') ? '#475569' : '#FFFFFF'} stroke="#1E293B" strokeWidth="3" />
                          <circle cx="105" cy="155" r="16" fill={placedShapes.includes('Steel Drive Wheels') ? '#475569' : '#FFFFFF'} stroke="#1E293B" strokeWidth="3" />
                          <circle cx="150" cy="155" r="16" fill={placedShapes.includes('Steel Drive Wheels') ? '#475569' : '#FFFFFF'} stroke="#1E293B" strokeWidth="3" />
                        </svg>
                      );
                    }
                    // Default House
                    return (
                      <svg className="w-full h-full" viewBox="0 0 200 200">
                        <polygon points="100,20 30,80 170,80" fill={placedShapes.includes('Triangle Roof') ? '#3B82F6' : '#E2E8F0'} stroke="#1D4ED8" strokeWidth="2" />
                        <rect x="40" y="80" width="120" height="100" fill={placedShapes.includes('Square House Base') ? '#60A5FA' : '#F1F5F9'} stroke="#1D4ED8" strokeWidth="2" />
                        <rect x="85" y="120" width="30" height="60" fill={placedShapes.includes('Rectangle Door') ? '#1E40AF' : '#E2E8F0'} stroke="#1D4ED8" strokeWidth="2" />
                        <circle cx="100" cy="55" r="12" fill={placedShapes.includes('Circle Attic Window') ? '#93C5FD' : '#FFFFFF'} stroke="#1D4ED8" strokeWidth="2" />
                      </svg>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(shuffledShapes.length > 0 ? shuffledShapes : (activeShape?.items || [])).map(shape => {
                  const isPlaced = placedShapes.includes(shape.key);
                  return (
                    <button
                      key={shape.key}
                      onClick={() => {
                        if (isPlaced) {
                          setPlacedShapes(prev => prev.filter(s => s !== shape.key));
                        } else {
                          setPlacedShapes(prev => [...prev, shape.key]);
                        }
                      }}
                      className={`p-4 rounded-2xl font-bold text-xs text-center border-2 transition-all cursor-pointer ${
                        isPlaced ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white hover:bg-blue-50 text-blue-900 border-blue-200'
                      }`}
                    >
                      {getLocText(shape.name, currentLanguage)}
                    </button>
                  );
                })}
              </div>

              {showFeedback && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${
                  isCorrect ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                  {isCorrect ? <CheckCircle2 className="w-5 h-5 text-blue-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                  <span>{feedbackMessage}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    if (placedShapes.length === activeShape.requiredKeys.length) {
                      handleCompleteSuccess(UI_TEXT.shapeComplete);
                    } else {
                      setShowFeedback(true);
                      setIsCorrect(false);
                      setFeedbackMessage(UI_TEXT.shapeIncomplete);
                    }
                  }}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {UI_TEXT.checkSolution}
                </button>
                <button
                  onClick={() => setPlacedShapes([])}
                  className="px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
                >
                  {UI_TEXT.resetPuzzle}
                </button>
              </div>
            </div>
          )}

          {/* GAME 3: WORD BUILDER */}
          {activeGameId === 'word-builder' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-200 shadow-sm space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-display font-bold text-purple-800">
                  🔠 {getLocText({ en: 'Word Builder', hi: 'शब्द निर्माता', gu: 'શબ્દ નિર્માણ', mr: 'शब्द निर्मिती', ta: 'சொல் உருவாக்கம்', te: 'పద నిర్మాణం' }, currentLanguage)} ({getLocText(activeWord.rootWordLoc || activeWord.rootWord, currentLanguage)})
                </h2>
                <p className="text-xs text-gray-600">{UI_TEXT.wordPrompt}</p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-200 text-center space-y-2">
                <div className="text-3xl font-black text-purple-900 tracking-wider">
                  {selectedAffix ? `${activeWord.rootWord} + ${selectedAffix}` : `${activeWord.rootWord} + [?]`}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(shuffledAffixes.length > 0 ? shuffledAffixes : (activeWord?.affixes || [])).map(item => (
                  <button
                    key={item.affix}
                    onClick={() => setSelectedAffix(item.affix)}
                    className={`p-4 rounded-2xl text-left border-2 transition-all cursor-pointer ${
                      selectedAffix === item.affix ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-purple-950 border-purple-200'
                    }`}
                  >
                    <div className="font-extrabold text-sm">{item.affix} → {item.word}</div>
                    <div className="text-[11px] opacity-90 mt-1">{getLocText(item.def, currentLanguage)}</div>
                  </button>
                ))}
              </div>

              {showFeedback && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${
                  isCorrect ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                  {isCorrect ? <CheckCircle2 className="w-5 h-5 text-purple-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                  <span>{feedbackMessage}</span>
                </div>
              )}

              <button
                onClick={() => {
                  if (selectedAffix) {
                    const match = activeWord.affixes.find(a => a.affix === selectedAffix);
                    if (match) {
                      handleCompleteSuccess(getLocText(match.def, currentLanguage));
                    }
                  } else {
                    setShowFeedback(true);
                    setIsCorrect(false);
                    setFeedbackMessage(UI_TEXT.wordSelectAffix);
                  }
                }}
                className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                {UI_TEXT.checkSolution}
              </button>
            </div>
          )}

          {/* GAME 4: CIRCUIT PUZZLE */}
          {activeGameId === 'circuit-puzzle' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-amber-200 shadow-sm space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-display font-bold text-amber-800">
                  ⚡ {getLocText(activeCircuit.title, currentLanguage)}
                </h2>
                <p className="text-xs text-gray-600">{UI_TEXT.circuitInstruct}</p>
              </div>

              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-700 flex flex-col items-center justify-center space-y-4 font-mono text-xs font-bold">
                <div className="w-64 h-40 relative border-2 border-amber-400 rounded-xl p-4 flex flex-col justify-between items-center text-center">
                  <div>{circuitSlots.bulb ? '💡 [Light Bulb ON]' : '⭕ [Bulb Slot]'}</div>
                  <div>{circuitSlots.switch ? '🟢 [Switch Closed]' : '🔴 [Switch Open]'}</div>
                  <div>{circuitSlots.battery ? '🔋 [Battery Active]' : '⏹️ [Battery Slot]'}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setCircuitSlots(p => ({ ...p, battery: !p.battery }))}
                  className={`p-4 rounded-2xl border-2 font-bold text-xs cursor-pointer ${
                    circuitSlots.battery ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200'
                  }`}
                >
                  🔋 Battery
                </button>
                <button
                  onClick={() => setCircuitSlots(p => ({ ...p, switch: !p.switch }))}
                  className={`p-4 rounded-2xl border-2 font-bold text-xs cursor-pointer ${
                    circuitSlots.switch ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200'
                  }`}
                >
                  🔘 Switch
                </button>
                <button
                  onClick={() => setCircuitSlots(p => ({ ...p, bulb: !p.bulb }))}
                  className={`p-4 rounded-2xl border-2 font-bold text-xs cursor-pointer ${
                    circuitSlots.bulb ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200'
                  }`}
                >
                  💡 Light Bulb
                </button>
              </div>

              {showFeedback && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${
                  isCorrect ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                  {isCorrect ? <CheckCircle2 className="w-5 h-5 text-amber-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                  <span>{feedbackMessage}</span>
                </div>
              )}

              <button
                onClick={() => {
                  if (circuitSlots.battery && circuitSlots.switch && circuitSlots.bulb) {
                    handleCompleteSuccess(UI_TEXT.circuitComplete);
                  } else {
                    setShowFeedback(true);
                    setIsCorrect(false);
                    setFeedbackMessage(UI_TEXT.circuitIncomplete);
                  }
                }}
                className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                {UI_TEXT.checkSolution}
              </button>
            </div>
          )}

          {/* GAME 5: MEMORY MATCH */}
          {activeGameId === 'memory-match' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-rose-200 shadow-sm space-y-6">
              <h2 className="text-xl font-display font-bold text-rose-800">
                🎴 {getLocText(activeMemory.title, currentLanguage)}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {memoryCards.map(card => (
                  <button
                    key={card.id}
                    onClick={() => handleMemoryCardClick(card.id)}
                    className={`h-24 rounded-2xl font-black text-sm flex items-center justify-center p-2 text-center transition-all cursor-pointer border-2 ${
                      card.flipped || card.matched
                        ? 'bg-rose-600 text-white border-rose-600 scale-105 shadow-md'
                        : 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {card.flipped || card.matched ? card.symbol : '?'}
                  </button>
                ))}
              </div>

              {showFeedback && (
                <div className="p-4 rounded-2xl bg-rose-100 text-rose-900 border border-rose-300 text-xs font-bold flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-rose-600" />
                  <span>{feedbackMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* GAME 6: HISTORY TIMELINE */}
          {activeGameId === 'history-timeline' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-amber-300 shadow-sm space-y-6">
              <h2 className="text-xl font-display font-bold text-amber-900">
                📜 {getLocText(activeTimeline.title, currentLanguage)}
              </h2>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                {timelineOrder.map((stepId, index) => {
                  const item = activeTimeline?.items?.find((i: any) => i.id === stepId);
                  return (
                    <div key={stepId} className="p-3 bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-between">
                      <span>{index + 1}. {item ? getLocText(item.title, currentLanguage) : ''}</span>
                      <button onClick={() => setTimelineOrder(prev => prev.filter(id => id !== stepId))}>✕</button>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                {(shuffledTimeline.length > 0 ? shuffledTimeline : (activeTimeline?.items || [])).map(item => {
                  const isPlaced = timelineOrder.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => { if (!isPlaced) setTimelineOrder(prev => [...prev, item.id]); }}
                      className={`w-full p-4 rounded-2xl font-bold text-xs text-left border-2 cursor-pointer ${
                        isPlaced ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white hover:bg-amber-50 text-amber-950 border-amber-200'
                      }`}
                    >
                      {getLocText(item.title, currentLanguage)}
                    </button>
                  );
                })}
              </div>

              {showFeedback && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${
                  isCorrect ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                  {isCorrect ? <CheckCircle2 className="w-5 h-5 text-amber-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                  <span>{feedbackMessage}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    if (JSON.stringify(timelineOrder) === JSON.stringify(activeTimeline.solutionIds)) {
                      handleCompleteSuccess(getLocText(activeTimeline.explanation, currentLanguage));
                    } else {
                      setShowFeedback(true);
                      setIsCorrect(false);
                      setFeedbackMessage(getLocText(activeTimeline.explanation, currentLanguage));
                    }
                  }}
                  className="px-6 py-3 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {UI_TEXT.checkSolution}
                </button>
                <button onClick={() => setTimelineOrder([])} className="px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer">
                  {UI_TEXT.resetPuzzle}
                </button>
              </div>
            </div>
          )}

          {/* GAME 7: SEQUENCE BUILDER */}
          {activeGameId === 'sequence-builder' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-sky-200 shadow-sm space-y-6">
              <h2 className="text-xl font-display font-bold text-sky-800">
                🔄 {getLocText(activeSequence.title, currentLanguage)}
              </h2>

              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 space-y-2">
                {sequenceOrder.map((stepId, index) => {
                  const item = activeSequence?.items?.find((s: any) => s.id === stepId);
                  return (
                    <div key={stepId} className="p-3 bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center justify-between">
                      <span>Step {index + 1}: {item ? getLocText(item.title, currentLanguage) : ''}</span>
                      <button onClick={() => setSequenceOrder(prev => prev.filter(id => id !== stepId))}>✕</button>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(shuffledSequence.length > 0 ? shuffledSequence : (activeSequence?.items || [])).map(step => {
                  const isPlaced = sequenceOrder.includes(step.id);
                  return (
                    <button
                      key={step.id}
                      onClick={() => { if (!isPlaced) setSequenceOrder(prev => [...prev, step.id]); }}
                      className={`p-4 rounded-2xl font-bold text-xs text-left border-2 cursor-pointer ${
                        isPlaced ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white hover:bg-sky-50 text-sky-950 border-sky-200'
                      }`}
                    >
                      {getLocText(step.title, currentLanguage)}
                    </button>
                  );
                })}
              </div>

              {showFeedback && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${
                  isCorrect ? 'bg-sky-100 text-sky-900 border border-sky-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                  {isCorrect ? <CheckCircle2 className="w-5 h-5 text-sky-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                  <span>{feedbackMessage}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    if (JSON.stringify(sequenceOrder) === JSON.stringify(activeSequence.solutionIds)) {
                      handleCompleteSuccess(getLocText(activeSequence.explanation, currentLanguage));
                    } else {
                      setShowFeedback(true);
                      setIsCorrect(false);
                      setFeedbackMessage(getLocText(activeSequence.explanation, currentLanguage));
                    }
                  }}
                  className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {UI_TEXT.checkSolution}
                </button>
                <button onClick={() => setSequenceOrder([])} className="px-4 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer">
                  {UI_TEXT.resetPuzzle}
                </button>
              </div>
            </div>
          )}

          {/* GAME 8: CROSSWORD PUZZLE */}
          {activeGameId === 'crossword' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-indigo-200 shadow-sm space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-display font-bold text-indigo-800">
                  ✏️ {getLocText(activeCrossword.title, currentLanguage)}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2">
                  <span className="text-xs font-bold text-indigo-900 font-mono uppercase">{UI_TEXT.crosswordAcross} ({activeCrossword.acrossAns.length}):</span>
                  <p className="text-xs text-gray-700">{getLocText(activeCrossword.across, currentLanguage)}</p>
                  <input
                    type="text"
                    value={crosswordInputs['across'] || ''}
                    onChange={(e) => setCrosswordInputs(p => ({ ...p, across: e.target.value.toUpperCase() }))}
                    placeholder={UI_TEXT.crosswordPlaceholder}
                    className="w-full p-3 rounded-xl bg-white border border-indigo-300 font-mono text-sm uppercase font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2">
                  <span className="text-xs font-bold text-indigo-900 font-mono uppercase">{UI_TEXT.crosswordDown} ({activeCrossword.downAns.length}):</span>
                  <p className="text-xs text-gray-700">{getLocText(activeCrossword.down, currentLanguage)}</p>
                  <input
                    type="text"
                    value={crosswordInputs['down'] || ''}
                    onChange={(e) => setCrosswordInputs(p => ({ ...p, down: e.target.value.toUpperCase() }))}
                    placeholder={UI_TEXT.crosswordPlaceholder}
                    className="w-full p-3 rounded-xl bg-white border border-indigo-300 font-mono text-sm uppercase font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {showFeedback && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${
                  isCorrect ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                  {isCorrect ? <CheckCircle2 className="w-5 h-5 text-indigo-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                  <span>{feedbackMessage}</span>
                </div>
              )}

              <button
                onClick={() => {
                  const userAcross = (crosswordInputs['across'] || '').trim().toUpperCase();
                  const userDown = (crosswordInputs['down'] || '').trim().toUpperCase();

                  if (userAcross === activeCrossword.acrossAns && userDown === activeCrossword.downAns) {
                    handleCompleteSuccess(UI_TEXT.crosswordSolved);
                  } else {
                    setShowFeedback(true);
                    setIsCorrect(false);
                    setFeedbackMessage(UI_TEXT.crosswordIncorrect);
                  }
                }}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                {UI_TEXT.checkSolution}
              </button>
            </div>
          )}

          {/* GAME 9: NUMBER GRID */}
          {activeGameId === 'number-grid' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-300 shadow-sm space-y-6">
              <h2 className="text-xl font-display font-bold text-emerald-800">
                🔢 {getLocText(activeGrid.title, currentLanguage)}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                  <span className="text-xs font-mono font-bold text-emerald-900">{activeGrid.q1}</span>
                  <input
                    type="number"
                    value={gridAnswers['q1'] || ''}
                    onChange={(e) => setGridAnswers(p => ({ ...p, q1: e.target.value }))}
                    placeholder="?"
                    className="w-full p-3 rounded-xl bg-white border border-emerald-300 text-center font-mono font-bold text-lg text-emerald-950 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                  <span className="text-xs font-mono font-bold text-emerald-900">{activeGrid.q2}</span>
                  <input
                    type="number"
                    value={gridAnswers['q2'] || ''}
                    onChange={(e) => setGridAnswers(p => ({ ...p, q2: e.target.value }))}
                    placeholder="?"
                    className="w-full p-3 rounded-xl bg-white border border-emerald-300 text-center font-mono font-bold text-lg text-emerald-950 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                  <span className="text-xs font-mono font-bold text-emerald-900">{activeGrid.q3}</span>
                  <input
                    type="number"
                    value={gridAnswers['q3'] || ''}
                    onChange={(e) => setGridAnswers(p => ({ ...p, q3: e.target.value }))}
                    placeholder="?"
                    className="w-full p-3 rounded-xl bg-white border border-emerald-300 text-center font-mono font-bold text-lg text-emerald-950 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {showFeedback && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${
                  isCorrect ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                  {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                  <span>{feedbackMessage}</span>
                </div>
              )}

              <button
                onClick={() => {
                  if (gridAnswers['q1'] === activeGrid.a1 && gridAnswers['q2'] === activeGrid.a2 && gridAnswers['q3'] === activeGrid.a3) {
                    handleCompleteSuccess(UI_TEXT.gridSolved);
                  } else {
                    setShowFeedback(true);
                    setIsCorrect(false);
                    setFeedbackMessage(UI_TEXT.gridIncorrect);
                  }
                }}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                {UI_TEXT.checkSolution}
              </button>
            </div>
          )}

          {/* GAME 10: ODD ONE OUT */}
          {activeGameId === 'odd-one-out' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-rose-200 shadow-sm space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-display font-bold text-rose-800">
                  ❓ {getLocText(activeOdd.title, currentLanguage)}
                </h2>
                <p className="text-xs text-gray-600">
                  {getLocText(activeOdd.question, currentLanguage)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(shuffledOddOneOut.length > 0 ? shuffledOddOneOut : (activeOdd?.items || [])).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOddOption(opt.id)}
                    className={`p-4 rounded-2xl font-bold text-xs text-center border-2 transition-all cursor-pointer ${
                      selectedOddOption === opt.id
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : 'bg-white hover:bg-rose-50 text-rose-950 border-rose-200'
                    }`}
                  >
                    {getLocText(opt.name, currentLanguage)}
                  </button>
                ))}
              </div>

              {showFeedback && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${
                  isCorrect ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                  {isCorrect ? <CheckCircle2 className="w-5 h-5 text-rose-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                  <span>{feedbackMessage}</span>
                </div>
              )}

              <button
                onClick={() => {
                  if (selectedOddOption === activeOdd.solutionId) {
                    handleCompleteSuccess(getLocText(activeOdd.explanation, currentLanguage));
                  } else {
                    setShowFeedback(true);
                    setIsCorrect(false);
                    setFeedbackMessage(UI_TEXT.oddIncorrect);
                  }
                }}
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                {UI_TEXT.checkSolution}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
