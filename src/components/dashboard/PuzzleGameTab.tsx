import React, { useState, useEffect, useMemo } from 'react';
import { User, LanguageCode } from '../../types';
import { 
  CheckCircle2, XCircle, ArrowRight, ChevronLeft, 
  Play, Calendar, Shuffle
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
function shuffleArray<T>(arr: T[]): T[] {
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
    id: 'house',
    title: {
      en: '🏠 House Blueprint',
      hi: '🏠 घर का ब्लूप्रिंट',
      gu: '🏠 ઘરનું બ્લૂપ્રિન્ટ',
      mr: '🏠 घराचा आराखडा',
      ta: '🏠 வீட்டின் வரைபடம்',
      te: '🏠 ఇంటి బ్లూప్రింట్'
    },
    items: [
      { key: 'Triangle Roof', name: { en: '🔺 Triangle Roof', hi: '🔺 त्रिकोण छत', gu: '🔺 ત્રિકોણ છત', mr: '🔺 त्रिकोण छत', ta: '🔺 முக்கோண கூரை', te: '🔺 త్రిభుజం పైకప్పు' } },
      { key: 'Square House Base', name: { en: '🟧 Square Base', hi: '🟧 वर्ग आधार', gu: '🟧 ચોરસ આધાર', mr: '🟧 चौरस पाया', ta: '🟧 சதுர அடித்தளம்', te: '🟧 చతురస్ర పునాది' } },
      { key: 'Rectangle Door', name: { en: '🚪 Rectangle Door', hi: '🚪 आयत दरवाजा', gu: '🚪 લંબચોરસ દરવાજો', mr: '🚪 आयताकृती दार', ta: '🚪 செவ்வக கதவு', te: '🚪 దీర్ઘచతురస్ర తలుపు' } },
      { key: 'Circle Attic Window', name: { en: '🔵 Circle Window', hi: '🔵 वृत्त खिड़की', gu: '🔵 વર્તુળ બારી', mr: '🔵 वर्तुळाकार खिडकी', ta: '🔵 வட்ட ஜன்னல்', te: '🔵 వృత్తాకార కిటికీ' } }
    ],
    requiredKeys: ['Triangle Roof', 'Square House Base', 'Rectangle Door', 'Circle Attic Window']
  },
  {
    id: 'rocket',
    title: {
      en: '🚀 Rocket Spacecraft Blueprint',
      hi: '🚀 रॉकेट अंतरिक्ष यान',
      gu: '🚀 રોકેટ અંતરિક્ષ યાન',
      mr: '🚀 रॉकेट अंतराळयान',
      ta: '🚀 ராக்கெட் விண்கலம்',
      te: '🚀 రాకెట్ వ్యోమనౌక'
    },
    items: [
      { key: 'Rocket Cone Nose', name: { en: '🔺 Rocket Cone Nose', hi: '🔺 रॉकेट कोन नोज़', gu: '🔺 રોકેટ અણી', mr: '🔺 रॉकेट टोक', ta: '🔺 கூம்பு முனை', te: '🔺 రాకెట్ శంకువు' } },
      { key: 'Booster Body', name: { en: '🟧 Booster Body Cylinder', hi: '🟧 बूस्टर बॉडी', gu: '🟧 બૂસ્ટર બોડી', mr: '🟧 बूस्टर बॉडी', ta: '🟧 பூஸ்டர் உடல்', te: '🟧 బూస్టర్ బాడీ' } },
      { key: 'Main Thruster Engine', name: { en: '🔥 Main Thruster Engine', hi: '🔥 थ्रस्टर इंजन', gu: '🔥 થ્રસ્ટર એન્જિન', mr: '🔥 थ्रस्टर इंजिन', ta: '🔥 பிரதான எஞ்சின்', te: '🔥 ప్రధాన ఇంజన్' } },
      { key: 'Porthole Glass Window', name: { en: '🔵 Porthole Glass Window', hi: '🔵 दृश्य खिड़की', gu: '🔵 કાચની બારી', mr: '🔵 गोल खिडकी', ta: '🔵 வட்ட ஜன்னல்', te: '🔵 గుండ્રని కిటికీ' } },
      { key: 'Delta Side Fins', name: { en: '📐 Delta Side Wings', hi: '📐 डेल्टा विंग्स', gu: '📐 પાંખો', mr: '📐 बाजूचे पंख', ta: '📐 பக்கவாட்டு சிறகுகள்', te: '📐 పక్క రెక్కలు' } }
    ],
    requiredKeys: ['Rocket Cone Nose', 'Booster Body', 'Main Thruster Engine', 'Porthole Glass Window', 'Delta Side Fins']
  },
  {
    id: 'sailboat',
    title: {
      en: '⛵ Sailing Boat Blueprint',
      hi: '⛵ पाल वाली नाव ब्लूप्रिंट',
      gu: '⛵ હોડીનું બ્લૂપ્રિન્ટ',
      mr: '⛵ शिडाच्या नौकेचा आराखडा',
      ta: '⛵ படகு வரைபடம்',
      te: '⛵ పడవ బ્లూప్రింట్'
    },
    items: [
      { key: 'Trapezoid Boat Hull', name: { en: '🚤 Trapezoid Boat Hull', hi: '🚤 नाव का तल्हा', gu: '🚤 બોટનું હોડકું', mr: '🚤 नौकेचे शरीर', ta: '🚤 படகு உடல்', te: '🚤 పడవ బాడీ' } },
      { key: 'Triangular Main Sail', name: { en: '⛵ Triangular Main Sail', hi: '⛵ मुख्य त्रिकोण पाल', gu: '⛵ ત્રિકોણાકાર સઢ', mr: '⛵ त्रिकोणी मुख्य शीड', ta: '⛵ முக்கோண பாய்', te: '⛵ త్రిభుజాకార పాయలు' } },
      { key: 'Vertical Mast Pole', name: { en: '🪵 Vertical Pole Mast', hi: '🪵 मस्तूल का खंभा', gu: '🪵 શિડનો થાંભલો', mr: '🪵 लाकडी खांब', ta: '🪵 கம்பம்', te: '🪵 నిలువు స్తంభం' } },
      { key: 'Circular Lifebuoy Ring', name: { en: '⭕ Circular Lifebuoy Ring', hi: '⭕ रक्षा रिंग', gu: '⭕ લાઇફબોય રિંગ', mr: '⭕ जीवरक्षक कडे', ta: '⭕ பாதுகாப்பு வளையம்', te: '⭕ రక్షణ వలయం' } }
    ],
    requiredKeys: ['Trapezoid Boat Hull', 'Triangular Main Sail', 'Vertical Mast Pole', 'Circular Lifebuoy Ring']
  },
  {
    id: 'castle',
    title: {
      en: '🏰 Medieval Castle Fortress',
      hi: '🏰 मध्यकालीन किला',
      gu: '🏰 મધ્યકાલીન કિલ્લો',
      mr: '🏰 मध्ययुगीन किल्ला',
      ta: '🏰 இடைக்கால கோட்டை',
      te: '🏰 ప్రాచీన కోట'
    },
    items: [
      { key: 'Rectangular Castle Wall', name: { en: '🏰 Main Fortress Wall', hi: '🏰 किला दीवार', gu: '🏰 કિલ્લાની દીવાલ', mr: '🏰 किल्ल्याची भिंत', ta: '🏰 கோட்டை சுவர்', te: '🏰 కోట గోడ' } },
      { key: 'Twin Guard Towers', name: { en: '🏰 Twin Guard Towers', hi: '🏰 ट्विन टावर', gu: '🏰 બે બુરજ', mr: '🏰 दोन बुरुज', ta: '🏰 இரட்டை கோபுரங்கள்', te: '🏰 రక్షణ బురుజులు' } },
      { key: 'Arched Main Gateway', name: { en: '🚪 Arched Castle Gate', hi: '🚪 मेहराबदार द्वार', gu: '🚪 કમાનાકાર દરવાજો', mr: '🚪 कमानदार दार', ta: '🚪 वளைவு நுழைவாயில்', te: '🚪 ధనుస్సు ఆకార తలుపు' } },
      { key: 'Conical Spire Roofs', name: { en: '🔺 Conical Spire Roofs', hi: '🔺 मीनार की छतरी', gu: '🔺 શંકુ છત', mr: '🔺 निमुळती छते', ta: '🔺 கூம்பு கூரைகள்', te: '🔺 శంకువు కప్పులు' } }
    ],
    requiredKeys: ['Rectangular Castle Wall', 'Twin Guard Towers', 'Arched Main Gateway', 'Conical Spire Roofs']
  },
  {
    id: 'robot',
    title: {
      en: '🤖 Friendly Robot Companion',
      hi: '🤖 फ्रेंडली रोबोट',
      gu: '🤖 રોબોટ મિત્ર',
      mr: '🤖 रोबोट सोबती',
      ta: '🤖 ரோபோ தோழன்',
      te: '🤖 ఫ్రెండ్లీ రోబోట్'
    },
    items: [
      { key: 'Square Robot Head', name: { en: '🤖 Square Robot Head', hi: '🤖 वर्ग रोबोट सिर', gu: '🤖 ચોરસ માથું', mr: '🤖 चौरस डोके', ta: '🤖 சதுர ரோபோ தலை', te: '🤖 చతుரస్ర రోబో తల' } },
      { key: 'Chest Torso Body', name: { en: '🤖 Chest Torso Body', hi: '🤖 चेस्ट टॉर्बो बॉडी', gu: '🤖 છાતીનું બોડી', mr: '🤖 छातीचा भाग', ta: '🤖 ரோபோ உடல்', te: '🤖 రోబో శరీరం' } },
      { key: 'Glowing Eye Lenses', name: { en: '👁️ Glowing Eye Lenses', hi: '👁️ चमकदार आंखें', gu: '👁️ ચમકતી આંખો', mr: '👁️ चमकदार डोळे', ta: '👁️ ஒளிரும் கண்கள்', te: '👁️ ప్రకాశించే కళ్ళు' } },
      { key: 'Top Signal Antenna', name: { en: '📡 Signal Antenna', hi: '📡 सिग्नल एंटीना', gu: '📡 એન્ટેના', mr: '📡 अँटेना', ta: '📡 சિકનல் ஆண்டெனா', te: '📡 సిగ్నల్ యాంటెన్నా' } }
    ],
    requiredKeys: ['Square Robot Head', 'Chest Torso Body', 'Glowing Eye Lenses', 'Top Signal Antenna']
  },
  {
    id: 'train',
    title: {
      en: '🚂 Steam Locomotive Train',
      hi: '🚂 स्टीम इंजन ट्रेन',
      gu: '🚂 સ્ટીમ એન્જિન ટ્રેન',
      mr: '🚂 वाफेचे इंजिन ट्रेन',
      ta: '🚂 நீராவி ரயில்',
      te: '🚂 స్టీమ్ ఇంజన్ రైలు'
    },
    items: [
      { key: 'Steam Engine Boiler', name: { en: '🚂 Engine Boiler Tank', hi: '🚂 भाप बॉयलर टैंक', gu: '🚂 બોઈલર ટેન્ક', mr: '🚂 इंजिन बॉयलर', ta: '🚂 எஞ்சિન కొప్పర', te: '🚂 ఇంజన్ బాయిలర్' } },
      { key: 'Driver Cabin Room', name: { en: '🏠 Driver Cabin Room', hi: '🏠 चालक केबिन', gu: '🏠 ડ્રાઇવર કેબિન', mr: '🏠 ड्रायव्हर केबिन', ta: '🏠 ஓட்டுனர் அறை', te: '🏠 డ్రైవర్ క్యాబిన్' } },
      { key: 'Chimney Smokestack', name: { en: '🏭 Chimney Smokestack', hi: '🏭 चिमनी', gu: '🏭 ચિમની', mr: '🏭 धुराडे', ta: '🏭 புகைப்போக்கி', te: '🏭 పొగగొట్టం' } },
      { key: 'Steel Drive Wheels', name: { en: '⚙️ Steel Drive Wheels', hi: '⚙️ लोहे के पहिए', gu: '⚙️ લોખંડના પૈડા', mr: '⚙️ पोलादी चाके', ta: '⚙️ இரும்பு சக்கரங்கள்', te: '⚙️ ఇనుప చక్రాలు' } }
    ],
    requiredKeys: ['Steam Engine Boiler', 'Driver Cabin Room', 'Chimney Smokestack', 'Steel Drive Wheels']
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
          ta: 'Reform (சீர்திருத்தம்): சீரமைத்தல்',
          te: 'Reform (సంస్కరణ): బాగుచేయడం'
        }
      },
      {
        affix: '-ation',
        word: 'Formation',
        def: {
          en: 'Formation: Structure or arrangement',
          hi: 'Formation (निर्माण/संरचना): संरचना बनाना',
          gu: 'Formation (નિર્માણ): રચના કરવી',
          mr: 'Formation (रचना): रचना करणे',
          ta: 'Formation (உருવાக்கம்): கட்டமைப்பு',
          te: 'Formation (నిర్మాణం): ఆకృతి'
        }
      }
    ]
  },
  {
    rootWord: 'Port',
    rootWordLoc: { en: 'Port (Carry)', hi: 'Port (ले जाना)', gu: 'Port (લઈ જવું)', mr: 'Port (वाहून नेणे)', ta: 'Port (சுமந்து செல்)', te: 'Port (మోసుకెళ్లు)' },
    affixes: [
      {
        affix: 'Ex-',
        word: 'Export',
        def: {
          en: 'Export: Send goods to another country',
          hi: 'Export (निर्यात): सामान दूसरे देश भेजना',
          gu: 'Export (નિકાસ): માલ બીજા દેશમાં મોકલવો',
          mr: 'Export (निर्यात): माल दुसऱ्या देशात पाठवणे',
          ta: 'Export (ஏற்றுமதி): பிற நாட்டிற்கு அனுப்புதல்',
          te: 'Export (ఎగుమతి): ఇతర దేశాలకు పంపడం'
        }
      },
      {
        affix: 'Im-',
        word: 'Import',
        def: {
          en: 'Import: Bring goods in from abroad',
          hi: 'Import (आयात): विदेश से सामान मंगाना',
          gu: 'Import (આયાત): વિદેશથી માલ લાવવો',
          mr: 'Import (आयात): माल मागवणे',
          ta: 'Import (இறக்குமதி): பிற நாட்டிலிருந்து வரவழைத்தல்',
          te: 'Import (దిగుమతి): విదేశాల నుండి తెప్పించడం'
        }
      },
      {
        affix: '-able',
        word: 'Portable',
        def: {
          en: 'Portable: Easily carried or moved',
          hi: 'Portable (सुवाह्य): आसानी से ले जाने योग्य',
          gu: 'Portable (સરળતાથી લઈ જઈ શકાય)',
          mr: 'Portable (सहज वाहून नेण्याजोगे)',
          ta: 'Portable (எளிதில் எடுத்துச்செல்லக்கூடிய)',
          te: 'Portable (సులభంగా తీసుకెళ్లగల)'
        }
      }
    ]
  },
  {
    rootWord: 'Struct',
    rootWordLoc: { en: 'Struct (Build)', hi: 'Struct (निर्माण करना)', gu: 'Struct (બાંધવું)', mr: 'Struct (बांधणे)', ta: 'Struct (கட்டுதல்)', te: 'Struct (నిర్మించు)' },
    affixes: [
      {
        affix: 'Con-',
        word: 'Construct',
        def: {
          en: 'Construct: To build or erect something',
          hi: 'Construct (निर्माण): बनाना या खड़ा करना',
          gu: 'Construct (બાંધકામ): નિર્માણ કરવું',
          mr: 'Construct (बांधणे): तयार करणे',
          ta: 'Construct (கட்டுதல்): உருவாக்குதல்',
          te: 'Construct (నిర్మించడం): కట్టడం'
        }
      },
      {
        affix: 'De-',
        word: 'Destruct',
        def: {
          en: 'Destruct: Cause deliberate damage or break down',
          hi: 'Destruct (नष्ट करना): तोड़ना या नष्ट करना',
          gu: 'Destruct (નાશ કરવો): તોડી પાડવું',
          mr: 'Destruct (नष्ट करणे): तोडणे',
          ta: 'Destruct (அழித்தல்): உடைத்தல்',
          te: 'Destruct (నాశనం చేయు): కూల్చివేయడం'
        }
      },
      {
        affix: '-ure',
        word: 'Structure',
        def: {
          en: 'Structure: The arrangement of elements',
          hi: 'Structure (ढांचा/संरचना): घटकों की व्यवस्था',
          gu: 'Structure (માળખું): રચના સંરચના',
          mr: 'Structure (रचना): रचना',
          ta: 'Structure (அமைப்பு): கட்டமைப்பு',
          te: 'Structure (నిర్మాణం): ఆకృతి'
        }
      }
    ]
  },
  {
    rootWord: 'Bio',
    rootWordLoc: { en: 'Bio (Life)', hi: 'Bio (जीवन)', gu: 'Bio (જીવન)', mr: 'Bio (जीवन)', ta: 'Bio (உயிர்)', te: 'Bio (జీవం)' },
    affixes: [
      {
        affix: '-logy',
        word: 'Biology',
        def: {
          en: 'Biology: The study of living organisms',
          hi: 'Biology (जीव विज्ञान): जीवों का अध्ययन',
          gu: 'Biology (જીવવિજ્ઞાન): સજીવોનો અભ્યાસ',
          mr: 'Biology (जीवशास्त्र): सजीवांचा अभ्यास',
          ta: 'Biology (உயிரியல்): உயிரினங்களின் ஆய்வு',
          te: 'Biology (జీవశాస్త్రం): జీవుల అధ్యయనం'
        }
      },
      {
        affix: '-hazard',
        word: 'Biohazard',
        def: {
          en: 'Biohazard: Biological substance posing a health threat',
          hi: 'Biohazard (जैविक खतरा): स्वास्थ्य के लिए जैविक खतरा',
          gu: 'Biohazard (જૈવિક જોખમ): આરોગ્ય માટે જોખમ',
          mr: 'Biohazard (जैविक धोका): आरोग्याला धोका',
          ta: 'Biohazard (உயிரியல் ஆபத்து): சுகாதார அச்சுறுத்தல்',
          te: 'Biohazard (జైవిక ప్రమాదం): ఆరోగ్యానికి ముప్పు'
        }
      },
      {
        affix: '-graphy',
        word: 'Biography',
        def: {
          en: 'Biography: Written account of a person’s life',
          hi: 'Biography (जीवनी): किसी व्यक्ति के जीवन का वृत्तांत',
          gu: 'Biography (જીવનચરિત્ર): જીવનકથા',
          mr: 'Biography (चरित्र): व्यक्तीचे जीवनचरित्र',
          ta: 'Biography (வாழ்க்கை வரலாறு): நபர் வரலாறு',
          te: 'Biography (జీవిత చరిత్ర): జీవన కథ'
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
          ta: 'Reform (சீர்திருத்தம்): சீரமைத்தல்',
          te: 'Reform (సంస్కరణ): బాగుచేయడం'
        }
      },
      {
        affix: '-ation',
        word: 'Formation',
        def: {
          en: 'Formation: Structure or arrangement',
          hi: 'Formation (निर्माण/संरचना): संरचना बनाना',
          gu: 'Formation (નિર્માણ): રચના કરવી',
          mr: 'Formation (रचना): रचना करणे',
          ta: 'Formation (உருவாக்கம்): கட்டமைப்பு',
          te: 'Formation (నిర్మాణం): ఆకృతి'
        }
      }
    ]
  },
  {
    rootWord: 'Port',
    rootWordLoc: { en: 'Port (Carry)', hi: 'Port (ले जाना)', gu: 'Port (લઈ જવું)', mr: 'Port (वाहून नेणे)', ta: 'Port (சுமந்து செல்)', te: 'Port (మోసుకెళ్లు)' },
    affixes: [
      {
        affix: 'Ex-',
        word: 'Export',
        def: {
          en: 'Export: Send goods to another country',
          hi: 'Export (निर्यात): सामान दूसरे देश भेजना',
          gu: 'Export (નિકાસ): માલ બીજા દેશમાં મોકલવો',
          mr: 'Export (निर्यात): माल दुसऱ्या देशात पाठवणे',
          ta: 'Export (ஏற்றுமதி): பிற நாட்டிற்கு அனுப்புதல்',
          te: 'Export (ఎగుమతి): ఇతర దేశాలకు పంపడం'
        }
      },
      {
        affix: 'Im-',
        word: 'Import',
        def: {
          en: 'Import: Bring goods in from abroad',
          hi: 'Import (आयात): विदेश से सामान मंगाना',
          gu: 'Import (આયાત): વિદેશથી માલ લાવવો',
          mr: 'Import (आयात): माल मागवणे',
          ta: 'Import (இறக்குமதி): பிற நாட்டிலிருந்து வரவழைத்தல்',
          te: 'Import (దిగుమతి): విదేశాల నుండి తెప్పించడం'
        }
      },
      {
        affix: '-able',
        word: 'Portable',
        def: {
          en: 'Portable: Easily carried or moved',
          hi: 'Portable (सुवाह्य): आसानी से ले जाने योग्य',
          gu: 'Portable (સરળતાથી લઈ જઈ શકાય)',
          mr: 'Portable (सहज वाहून नेण्याजोगे)',
          ta: 'Portable (எளிதில் எடுத்துச்செல்லக்கூடிய)',
          te: 'Portable (సులభంగా తీసుకెళ్లగల)'
        }
      }
    ]
  },
  {
    rootWord: 'Struct',
    rootWordLoc: { en: 'Struct (Build)', hi: 'Struct (निर्माण करना)', gu: 'Struct (બાંધવું)', mr: 'Struct (बांधणे)', ta: 'Struct (கட்டுதல்)', te: 'Struct (నిర్మించు)' },
    affixes: [
      {
        affix: 'Con-',
        word: 'Construct',
        def: {
          en: 'Construct: To build or erect something',
          hi: 'Construct (निर्माण): बनाना या खड़ा करना',
          gu: 'Construct (બાંધકામ): નિર્માણ કરવું',
          mr: 'Construct (बांधणे): तयार करणे',
          ta: 'Construct (கட்டுதல்): உருவாக்குதல்',
          te: 'Construct (నిర్మించడం): కట్టడం'
        }
      },
      {
        affix: 'De-',
        word: 'Destruct',
        def: {
          en: 'Destruct: Cause deliberate damage or break down',
          hi: 'Destruct (नष्ट करना): तोड़ना या नष्ट करना',
          gu: 'Destruct (નાશ કરવો): તોડી પાડવું',
          mr: 'Destruct (नष्ट करणे): तोडणे',
          ta: 'Destruct (அழித்தல்): உடைத்தல்',
          te: 'Destruct (நாశనం చేయు): కూల్చివేయడం'
        }
      },
      {
        affix: '-ure',
        word: 'Structure',
        def: {
          en: 'Structure: The arrangement of elements',
          hi: 'Structure (ढांचा/संरचना): घटकों की व्यवस्था',
          gu: 'Structure (માળખું): રચના સંરચના',
          mr: 'Structure (रचना): रचना',
          ta: 'Structure (அமைப்பு): கட்டமைப்பு',
          te: 'Structure (నిర్మాణం): ఆకృతి'
        }
      }
    ]
  },
  {
    rootWord: 'Bio',
    rootWordLoc: { en: 'Bio (Life)', hi: 'Bio (जीवन)', gu: 'Bio (જીવન)', mr: 'Bio (जीवन)', ta: 'Bio (உயிர்)', te: 'Bio (జీవం)' },
    affixes: [
      {
        affix: '-logy',
        word: 'Biology',
        def: {
          en: 'Biology: The study of living organisms',
          hi: 'Biology (जीव विज्ञान): जीवों का अध्ययन',
          gu: 'Biology (જીવવિજ્ઞાન): સજીવોનો અભ્યાસ',
          mr: 'Biology (जीवशास्त्र): सजीवांचा अभ्यास',
          ta: 'Biology (உயிரியல்): உயிரினங்களின் ஆய்வு',
          te: 'Biology (జీవశాస్త్రం): జీవుల అధ్యయనం'
        }
      },
      {
        affix: '-hazard',
        word: 'Biohazard',
        def: {
          en: 'Biohazard: Biological substance posing a health threat',
          hi: 'Biohazard (जैविक खतरा): स्वास्थ्य के लिए जैविक खतरा',
          gu: 'Biohazard (જૈવિક જોખમ): આરોગ્ય માટે જોખમ',
          mr: 'Biohazard (जैविक धोका): आरोग्याला धोका',
          ta: 'Biohazard (உயிரியல் ஆபத்து): சுகாதார அச்சுறுத்தல்',
          te: 'Biohazard (జైవిక ప్రమాదం): ఆరోగ్యానికి ముప్పు'
        }
      },
      {
        affix: '-graphy',
        word: 'Biography',
        def: {
          en: 'Biography: Written account of a person’s life',
          hi: 'Biography (जीवनी): किसी व्यक्ति के जीवन का वृत्तांत',
          gu: 'Biography (જીવનચરિત્ર): જીવનકથા',
          mr: 'Biography (चरित्र): व्यक्तीचे जीवनचरित्र',
          ta: 'Biography (வாழ்க்கை வரலாறு): நபர் வரலாறு',
          te: 'Biography (ஜீవిత చరిత్ర): జీవన కథ'
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
      { key: 'battery', name: { en: '🔋 DC Battery', hi: '🔋 डीसी बैटरी', gu: '🔋 ડીસી બેટરી', mr: '🔋 बॅटरी', ta: '🔋 பேட்டரி', te: '🔋 బ్యాటરી' }, icon: '🔋' },
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
      { key: 'battery', name: { en: '🔋 Battery Power', hi: '🔋 बैटरी', gu: '🔋 બેટરી', mr: '🔋 बॅटरी', ta: '🔋 பேட்டரி', te: '🔋 బ్యాటરી' }, icon: '🔋' },
      { key: 'switch', name: { en: '🔘 Sensor Switch', hi: '🔘 सेंसर स्विच', gu: '🔘 સેન્સર સ્વિચ', mr: '🔘 स्विच', ta: '🔘 சுவிட்ச்', te: '🔘 స్વિచ్' }, icon: '🔘' },
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
      { key: 'switch', name: { en: '🔘 Main Switch', hi: '🔘 मुख्य स्विच', gu: '🔘 મુખ્ય સ્વિચ', mr: '🔘 मुख्य कळी', ta: '🔘 சுவிட்ச்', te: '🔘 స్વિచ్' }, icon: '🔘' },
      { key: 'led', name: { en: '💡 Glowing LED', hi: '💡 ग्लोइंग एलईडी', gu: '💡 એલઇડી લાઈટ', mr: '💡 एलईडी दिवा', ta: '💡 LED விளக்கு', te: '💡 LED લાઇટ' }, icon: '💡' }
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
      { pairId: 4, symbol: 'Na', text: { en: 'Sodium Metal', hi: 'सोडियम धातु', gu: 'સોડિયમ ધાતુ', mr: 'सोडिअम धातू', ta: 'சோடியம் உலோகம்', te: 'సోడియం లోహం' } }
    ]
  },
  {
    title: {
      en: '📏 Physics Units & Quantities',
      hi: '📏 भौतिक इकाइयां और राशियां',
      gu: '📏 ભૌતિક એકમો અને રાશિઓ',
      mr: '📏 भौतिक एकके आणि राशी',
      ta: '📏 இயற்பியல் அலகுகள்',
      te: '📏 భૌతిక ప్రమాణాలు'
    },
    pairs: [
      { pairId: 1, symbol: 'N', text: { en: 'Newton (Force)', hi: 'न्यूटन (बल)', gu: 'ન્યૂટન (બળ)', mr: 'न्यूटन (बल)', ta: 'நியூட்டன் (விசை)', te: 'న్యూటன் (బలం)' } },
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
      { pairId: 1, symbol: '🔴', text: { en: 'Mars (Red Planet)', hi: 'मंगल (लाल ग्रह)', gu: 'મંગળ (લાલ ગ્રહ)', mr: 'मंगळ (लाल ग्रह)', ta: 'செவ்வாய் (சிவப்பு கோள்)', te: 'అంగారకుడు (ఎర్ர గ్రహం)' } },
      { pairId: 2, symbol: '🪐', text: { en: 'Saturn (Ringed Planet)', hi: 'शनि (वलय युक्त ग्रह)', gu: 'શનિ (વલય વાળો ગ્રહ)', mr: 'शनि (कड्यांचा ग्रह)', ta: 'சனி (வளையக் கோள்)', te: 'శని (రింగుల గ్రహం)' } },
      { pairId: 3, symbol: '☀️', text: { en: 'Sun (Central Star)', hi: 'सूर्य (तारा)', gu: 'સૂર્ય (તારો)', mr: 'सूर्य (तारा)', ta: 'சூரியன் (நட்சத்திரம்)', te: 'సూర్యుడు (నక్షత్రం)' } },
      { pairId: 4, symbol: '🌕', text: { en: 'Moon (Earth Satellite)', hi: 'चंद्रमा (उपग्रह)', gu: 'ચંદ્ર (ઉપગ્રહ)', mr: 'चंद्र (उपग्रह)', ta: 'நிலவு (துணைக்கோள்)', te: 'చంద్రుడు (ఉపగ్రహம்)' } }
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
      { id: 4, title: { en: '⛵ Chola Maritime Expansion (1014 CE)', hi: '⛵ चोल राजवंश का समुद्री विस्तार (1014 ईस्वी)', gu: '⛵ ચોલ સામ્રાજ્ય દરિયાઈ વિસ્તરણ (1014 ઈ.સ.)', mr: '⛵ चोळ राजघराण्याचा सागरी विस्तार (1014 ई.स.)', ta: '⛵ சோழர்களின் கடற்படை விரிவாக்கம் (கி.பி 1014)', te: '⛵ చోళ సామ్రాజ్య నావికా విస్తరణ (క్రీ.శ 1014)' } }
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
  }
];

export const CROSSWORD_VARIANTS = [
  {
    title: {
      en: 'Biology & Cell Biology',
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
  }
];

export const NUMBER_GRID_VARIANTS = [
  {
    title: {
      en: 'Math Chain Set A',
      hi: 'गणित श्रृंखला सेट A',
      gu: 'ગણિત શ્રૃંખલા સેટ A',
      mr: 'गणित साखळी सेट A',
      ta: 'கணித சங்கிலித் தொகுதி A',
      te: 'మ్యాథ్ చైన్ సెట్ A'
    },
    q1: '8 + 7 = ?',
    a1: '15',
    q2: '12 - 4 = ?',
    a2: '8',
    q3: '6 × 5 = ?',
    a3: '30'
  }
];

export const ODD_ONE_OUT_VARIANTS = [
  {
    title: {
      en: 'Periodic Table Families',
      hi: 'आवर्त सारणी परिवार',
      gu: 'આવર્ત કોષ્ટક સમૂહો',
      mr: 'आवर्तसारणी गट',
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
  }));

  const [selectedGroup, setSelectedGroup] = useState<PuzzleGroup>(userGroup);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [completedGames, setCompletedGames] = useState<Set<string>>(new Set());

  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  const activeFoodChain = FOOD_CHAIN_VARIANTS[(variantSeeds['food-chain'] || 0) % FOOD_CHAIN_VARIANTS.length] || FOOD_CHAIN_VARIANTS[0];
  const activeShape = SHAPE_VARIANTS[(variantSeeds['shape-puzzle'] || 0) % SHAPE_VARIANTS.length] || SHAPE_VARIANTS[0];
  const activeWord = WORD_BUILDER_VARIANTS[(variantSeeds['word-builder'] || 0) % WORD_BUILDER_VARIANTS.length] || WORD_BUILDER_VARIANTS[0];
  const activeCircuit = CIRCUIT_VARIANTS[(variantSeeds['circuit-puzzle'] || 0) % CIRCUIT_VARIANTS.length] || CIRCUIT_VARIANTS[0];
  const activeMemory = MEMORY_VARIANTS[(variantSeeds['memory-match'] || 0) % MEMORY_VARIANTS.length] || MEMORY_VARIANTS[0];
  const activeTimeline = TIMELINE_VARIANTS[(variantSeeds['history-timeline'] || 0) % TIMELINE_VARIANTS.length] || TIMELINE_VARIANTS[0];
  const activeSequence = SEQUENCE_VARIANTS[(variantSeeds['sequence-builder'] || 0) % SEQUENCE_VARIANTS.length] || SEQUENCE_VARIANTS[0];
  const activeOdd = ODD_ONE_OUT_VARIANTS[(variantSeeds['odd-one-out'] || 0) % ODD_ONE_OUT_VARIANTS.length] || ODD_ONE_OUT_VARIANTS[0];
  const activeGrid = NUMBER_GRID_VARIANTS[(variantSeeds['number-grid'] || 0) % NUMBER_GRID_VARIANTS.length] || NUMBER_GRID_VARIANTS[0];
  const activeCrossword = CROSSWORD_VARIANTS[(variantSeeds['crossword'] || 0) % CROSSWORD_VARIANTS.length] || CROSSWORD_VARIANTS[0];

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
    variant.pairs.forEach((p, idx) => {
      deck.push({ id: idx * 2 + 1, symbol: p.symbol, pairId: p.pairId, flipped: false, matched: false });
      deck.push({ id: idx * 2 + 2, symbol: getLocText(p.text, currentLanguage), pairId: p.pairId, flipped: false, matched: false });
    });
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

  const startGame = (gameId: string, nextSeedIndex?: number) => {
    setActiveGameId(gameId);
    setShowFeedback(false);
    setIsCorrect(false);
    setFeedbackMessage('');

    const currentSeed = nextSeedIndex !== undefined ? nextSeedIndex : (variantSeeds[gameId] || 0);

    if (gameId === 'food-chain') {
      const v = FOOD_CHAIN_VARIANTS[currentSeed % FOOD_CHAIN_VARIANTS.length] || FOOD_CHAIN_VARIANTS[0];
      setFoodChainOrder([]);
      setShuffledFoodChain(shuffleArray(v.items));
    } else if (gameId === 'shape-puzzle') {
      const v = SHAPE_VARIANTS[currentSeed % SHAPE_VARIANTS.length] || SHAPE_VARIANTS[0];
      setPlacedShapes([]);
      setShuffledShapes(shuffleArray(v.items));
    } else if (gameId === 'history-timeline') {
      const v = TIMELINE_VARIANTS[currentSeed % TIMELINE_VARIANTS.length] || TIMELINE_VARIANTS[0];
      setTimelineOrder([]);
      setShuffledTimeline(shuffleArray(v.items));
    } else if (gameId === 'word-builder') {
      const v = WORD_BUILDER_VARIANTS[currentSeed % WORD_BUILDER_VARIANTS.length] || WORD_BUILDER_VARIANTS[0];
      setSelectedRoot(v.rootWord);
      setSelectedAffix('');
      setShuffledAffixes(shuffleArray(v.affixes));
    } else if (gameId === 'circuit-puzzle') {
      setCircuitSlots({ battery: false, switch: false, bulb: false });
    } else if (gameId === 'memory-match') {
      const v = MEMORY_VARIANTS[currentSeed % MEMORY_VARIANTS.length] || MEMORY_VARIANTS[0];
      initMemoryGame(v);
    } else if (gameId === 'sequence-builder') {
      const v = SEQUENCE_VARIANTS[currentSeed % SEQUENCE_VARIANTS.length] || SEQUENCE_VARIANTS[0];
      setSequenceOrder([]);
      setShuffledSequence(shuffleArray(v.items));
    } else if (gameId === 'crossword') {
      setCrosswordInputs({});
    } else if (gameId === 'number-grid') {
      setGridAnswers({});
    } else if (gameId === 'odd-one-out') {
      const v = ODD_ONE_OUT_VARIANTS[currentSeed % ODD_ONE_OUT_VARIANTS.length] || ODD_ONE_OUT_VARIANTS[0];
      setSelectedOddOption(null);
      setShuffledOddOneOut(shuffleArray(v.items));
    }
  };

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

                  <button
                    onClick={() => startPuzzleWithNewVariant(game.id)}
                    className="w-full py-3 rounded-2xl bg-[#3D405B] hover:bg-[#2D3047] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{UI_TEXT.startPuzzle}</span>
                  </button>
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

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                {getLocText(GAMES.find(g => g.id === activeGameId)?.title, currentLanguage)}
              </span>

              <button
                onClick={() => generateNewPuzzleVariant(activeGameId)}
                className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-purple-300"
              >
                <Shuffle className="w-3.5 h-3.5 text-purple-700" />
                <span>{UI_TEXT.nextChallenge}</span>
              </button>
            </div>
          </div>

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
                {shuffledFoodChain.map(org => {
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
                {shuffledShapes.map(shape => {
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
                {shuffledAffixes.map(item => (
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
                  const item = activeTimeline.items.find(i => i.id === stepId);
                  return (
                    <div key={stepId} className="p-3 bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-between">
                      <span>{index + 1}. {item ? getLocText(item.title, currentLanguage) : ''}</span>
                      <button onClick={() => setTimelineOrder(prev => prev.filter(id => id !== stepId))}>✕</button>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                {shuffledTimeline.map(item => {
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
                  const item = activeSequence.items.find(s => s.id === stepId);
                  return (
                    <div key={stepId} className="p-3 bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center justify-between">
                      <span>Step {index + 1}: {item ? getLocText(item.title, currentLanguage) : ''}</span>
                      <button onClick={() => setSequenceOrder(prev => prev.filter(id => id !== stepId))}>✕</button>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shuffledSequence.map(step => {
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
                {shuffledOddOneOut.map(opt => (
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
