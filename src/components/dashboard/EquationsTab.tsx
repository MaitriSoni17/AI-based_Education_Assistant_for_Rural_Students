import React, { useState, useEffect } from 'react';
import { LanguageCode, User } from '../../types';
import { speakText, stopSpeaking } from '../../utils/speech';
import { 
  Zap, ArrowRight, Sparkles, Volume2, HelpCircle, 
  Award, RefreshCw, Layers, CheckCircle2, Sliders, Play, RotateCcw,
  Binary, Flame, Compass, HelpCircle as HelpIcon
} from 'lucide-react';

interface EquationsTabProps {
  user: User;
  lang: LanguageCode;
  onUpdateUser: (fields: Partial<User>) => void;
}

interface ChemicalQuestion {
  id: string;
  reactionName: string;
  reactants: string[];
  products: string[];
  correctCoefficients: number[]; // Reactants + Products
  placeholders: string[]; 
  points: number;
  hint: string;
}

export default function EquationsTab({ user, lang, onUpdateUser }: EquationsTabProps) {
  // Main Category state: 'science' or 'math'
  const [activeCategory, setActiveCategory] = useState<'science' | 'math'>('science');
  
  // Selection states
  const [selectedScienceEq, setSelectedScienceEq] = useState<'newton' | 'ohms' | 'einstein' | 'chemistry'>('newton');
  const [selectedMathEq, setSelectedMathEq] = useState<'pythagoras' | 'trigonometry' | 'quadratic'>('pythagoras');

  // ----------------------------------------------------
  // SCIENCE SLIDERS STATE
  // ----------------------------------------------------
  // Newton's Law: F = m * a
  const [mass, setMass] = useState<number>(15); // kg
  const [accel, setAccel] = useState<number>(6); // m/s²
  
  // Ohm's Law: V = I * R
  const [current, setCurrent] = useState<number>(2.5); // Amperes
  const [resistance, setResistance] = useState<number>(10); // Ohms

  // Einstein: E = m * c²
  const [milligrams, setMilligrams] = useState<number>(2); // mg

  // ----------------------------------------------------
  // MATHEMATICS SLIDERS STATE
  // ----------------------------------------------------
  // Pythagoras: a² + b² = c²
  const [sideA, setSideA] = useState<number>(6); // base
  const [sideB, setSideB] = useState<number>(8); // height

  // Trigonometry: Height = d * tan(θ)
  const [distance, setDistance] = useState<number>(15); // meters away
  const [elevationAngle, setElevationAngle] = useState<number>(30); // degrees

  // Quadratic equation: ax² + bx + c = 0
  const [coeffA, setCoeffA] = useState<number>(1); // a must not be 0
  const [coeffB, setCoeffB] = useState<number>(-2);
  const [coeffC, setCoeffC] = useState<number>(-3);

  // ----------------------------------------------------
  // COMMON STATE
  // ----------------------------------------------------
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Chemical game state
  const [activeChemIndex, setActiveChemIndex] = useState<number>(0);
  const [chemInputs, setChemInputs] = useState<string[]>(['', '', '', '']);
  const [chemStatus, setChemStatus] = useState<'idle' | 'success' | 'incorrect'>('idle');
  const [scoreNotification, setScoreNotification] = useState<string | null>(null);

  // Stop reading when switching tabs, categories or equations
  useEffect(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, [activeCategory, selectedScienceEq, selectedMathEq]);

  // Chemical balancing database
  const chemicalQuestions: ChemicalQuestion[] = [
    {
      id: 'water',
      reactionName: lang === 'hi' ? 'पानी का संश्लेषण (Synthesis of Water)' : 'Synthesis of Water',
      reactants: ['H₂', 'O₂'],
      products: ['H₂O'],
      correctCoefficients: [2, 1, 2],
      placeholders: ['H₂', 'O₂', 'H₂O'],
      points: 10,
      hint: lang === 'hi' 
        ? 'संकेत: दाईं ओर हाइड्रोजन और ऑक्सीजन की संख्या बराबर करने के लिए H₂O से पहले 2 लगाएं।' 
        : 'Hint: Put a 2 in front of H₂O and H₂ to balance both hydrogen and oxygen atoms!'
    },
    {
      id: 'ammonia',
      reactionName: lang === 'hi' ? 'अमोनिया का उत्पादन (Haber Process)' : 'Synthesis of Ammonia',
      reactants: ['N₂', 'H₂'],
      products: ['NH₃'],
      correctCoefficients: [1, 3, 2],
      placeholders: ['N₂', 'H₂', 'NH₃'],
      points: 15,
      hint: lang === 'hi'
        ? 'संकेत: अमोनिया (NH₃) से पहले 2 लगाने से नाइट्रोजन संतुलित होगा। फिर हाइड्रोजन को संतुलित करें।'
        : 'Hint: Put a 2 before NH₃ to balance Nitrogen, then put a 3 before H₂ to balance Hydrogen!'
    },
    {
      id: 'carbon_combust',
      reactionName: lang === 'hi' ? 'कार्बन दहन (Carbon Combustion)' : 'Carbon Combustion',
      reactants: ['C', 'O₂'],
      products: ['CO₂'],
      correctCoefficients: [1, 1, 1],
      placeholders: ['C', 'O₂', 'CO₂'],
      points: 5,
      hint: lang === 'hi'
        ? 'संकेत: यह पहले से ही संतुलित है! सभी स्थानों पर 1 लिखें।'
        : 'Hint: This reaction is already balanced. Just write 1 for each chemical!'
    }
  ];

  const activeQuestion = chemicalQuestions[activeChemIndex];

  // Sync inputs length when chemical question changes
  useEffect(() => {
    setChemInputs(Array(activeQuestion.correctCoefficients.length).fill(''));
    setChemStatus('idle');
  }, [activeChemIndex, lang]);

  // ----------------------------------------------------
  // CALCULATED VALUES
  // ----------------------------------------------------
  // Science outputs
  const force = mass * accel;
  const voltage = current * resistance;
  const energyMWh = milligrams * 25; // standard scaled equivalent

  // Math outputs
  const hypotenuse = Math.sqrt(sideA * sideA + sideB * sideB);
  
  // Trig calculations
  const angleRad = (elevationAngle * Math.PI) / 180;
  const computedHeight = distance * Math.tan(angleRad);
  const lineOfSight = distance / Math.cos(angleRad);

  // Quadratic calculations
  const discriminant = (coeffB * coeffB) - (4 * coeffA * coeffC);
  let rootsInfo = {
    nature: '',
    r1: '',
    r2: '',
    hasReal: false
  };

  if (discriminant > 0) {
    const root1 = (-coeffB + Math.sqrt(discriminant)) / (2 * coeffA);
    const root2 = (-coeffB - Math.sqrt(discriminant)) / (2 * coeffA);
    rootsInfo = {
      nature: lang === 'hi' ? 'वास्तविक और असमान (Real & Distinct)' : 'Real & Distinct Roots',
      r1: root1.toFixed(2),
      r2: root2.toFixed(2),
      hasReal: true
    };
  } else if (discriminant === 0) {
    const root = -coeffB / (2 * coeffA);
    rootsInfo = {
      nature: lang === 'hi' ? 'वास्तविक और समान (Real & Equal)' : 'Real & Equal Roots',
      r1: root.toFixed(2),
      r2: root.toFixed(2),
      hasReal: true
    };
  } else {
    const realPart = (-coeffB / (2 * coeffA)).toFixed(2);
    const imagPart = (Math.sqrt(-discriminant) / (2 * coeffA)).toFixed(2);
    rootsInfo = {
      nature: lang === 'hi' ? 'काल्पनिक / अवास्तविक (Complex / Imaginary)' : 'Complex / Imaginary Roots',
      r1: `${realPart} + ${imagPart}i`,
      r2: `${realPart} - ${imagPart}i`,
      hasReal: false
    };
  }

  // ----------------------------------------------------
  // EXPLANATIONS DICTIONARY
  // ----------------------------------------------------
  const scienceExplanations = {
    newton: {
      title: lang === 'hi' ? 'न्यूटन का गति का दूसरा नियम' : "Newton's Second Law of Motion",
      formula: 'F = m × a',
      variables: lang === 'hi' 
        ? 'F = बल (Force, न्यूटन में), m = द्रव्यमान (Mass, kg में), a = त्वरण (Acceleration, m/s² में)'
        : 'F = Force (Newtons), m = Mass (kilograms), a = Acceleration (m/s²)',
      explanation: lang === 'hi'
        ? `यह नियम बताता है कि किसी वस्तु पर लगाया गया बल उसके द्रव्यमान और त्वरण के गुणनफल के बराबर होता है। सरल शब्दों में, भारी वस्तु को तेजी से धकेलने के लिए अधिक बल की आवश्यकता होती है!`
        : `This law states that the force applied to an object is equal to its mass multiplied by its acceleration. Simply put, pushing a heavier object faster requires much more physical force!`,
      intuition: lang === 'hi'
        ? `वर्तमान मान: ${mass} किलोग्राम की गाड़ी को ${accel} m/s² से धकेलने के लिए ${force.toFixed(1)} न्यूटन बल चाहिए। गाँव में कुएँ से पानी की 2 भारी बाल्टियाँ उठाने में लगभग इतना ही बल लगता है!`
        : `Current calculation: Pushing a ${mass} kg wagon at an acceleration of ${accel} m/s² requires ${force.toFixed(1)} Newtons of force. In practical terms, this is about the force needed to pump water or lift deep buckets from a well!`,
      speechText: lang === 'hi'
        ? `न्यूटन का दूसरा नियम। सूत्र है: बल बराबर द्रव्यमान गुना त्वरण। यहाँ द्रव्यमान है ${mass} किलोग्राम और त्वरण है ${accel} मीटर प्रति सेकंड वर्ग। कुल बल ${force.toFixed(1)} न्यूटन बनता है।`
        : `Newton's Second Law of Motion. The formula is: Force equals Mass times Acceleration. Here, with a mass of ${mass} kilograms and an acceleration of ${accel} meters per second squared, the total force is ${force.toFixed(1)} Newtons.`
    },
    ohms: {
      title: lang === 'hi' ? 'ओम का नियम (विद्युत धारा)' : "Ohm's Law of Electricity",
      formula: 'V = I × R',
      variables: lang === 'hi'
        ? 'V = विभवांतर (Voltage, वोल्ट में), I = विद्युत धारा (Current, एम्पियर में), R = प्रतिरोध (Resistance, ओम Ω में)'
        : 'V = Voltage (Volts), I = Current (Amperes), R = Resistance (Ohms Ω)',
      explanation: lang === 'hi'
        ? `ओम का नियम बताता है कि किसी विद्युत चालक में बहने वाली धारा उसके दोनों सिरों के विभवांतर के सीधे आनुपातिक होती है और प्रतिरोध के विपरीत आनुपातिक होती है।`
        : `Ohm's Law states that the electric current flowing through a conductor is directly proportional to the voltage across its ends, and inversely proportional to the electrical resistance.`,
      intuition: lang === 'hi'
        ? `वर्तमान मान: यदि बल्ब का प्रतिरोध ${resistance} ओम है और इसमें ${current} एम्पियर की धारा प्रवाहित होती है, तो वोल्टेज ${voltage.toFixed(1)} वोल्ट होगा। घरेलू बिजली का सॉकेट 220 वोल्ट का होता है!`
        : `Current calculation: If a bulb has a resistance of ${resistance} Ohms and a current of ${current} Amperes flows through it, the required Voltage is ${voltage.toFixed(1)} Volts. Standard home outlets in India supply about 220 Volts!`,
      speechText: lang === 'hi'
        ? `ओम का नियम। सूत्र है: वोल्टेज बराबर करंट गुना प्रतिरोध। वर्तमान में करंट ${current} एम्पियर और प्रतिरोध ${resistance} ओम है। इसका परिणाम ${voltage.toFixed(1)} वोल्ट वोल्टेज है।`
        : `Ohm's Law. The formula is: Voltage equals Current times Resistance. Currently, with a current of ${current} Amperes and a resistance of ${resistance} Ohms, the calculated voltage is ${voltage.toFixed(1)} Volts.`
    },
    einstein: {
      title: lang === 'hi' ? 'आइंस्टीन का द्रव्यमान-ऊर्जा समीकरण' : "Einstein's Mass-Energy Equivalence",
      formula: 'E = m × c²',
      variables: lang === 'hi'
        ? 'E = ऊर्जा (Energy, जूल में), m = द्रव्यमान (Mass, kg में), c = प्रकाश की गति (3 × 10⁸ m/s)'
        : 'E = Energy (Joules), m = Mass (kilograms), c = Speed of light (~300,000 km/s)',
      explanation: lang === 'hi'
        ? `यह प्रसिद्ध समीकरण दिखाता है कि द्रव्यमान और ऊर्जा एक ही सिक्के के दो पहलू हैं। बहुत कम मात्रा में द्रव्यमान को भी नष्ट करके विशाल मात्रा में ऊर्जा प्राप्त की जा सकती है!`
        : `This historic equation demonstrates that mass and energy are interchangeable. An incredibly tiny amount of matter can be converted into an immense, overwhelming quantity of pure energy!`,
      intuition: lang === 'hi'
        ? `वर्तमान मान: केवल ${milligrams} मिलीग्राम पदार्थ को पूरी तरह ऊर्जा में बदलने पर ${energyMWh.toLocaleString()} मेगावाट-घंटा ऊर्जा मिलेगी। यह आपके पूरे गाँव के सरकारी स्कूल को लगातार ${((energyMWh) / 10).toFixed(0)} महीनों तक बिजली दे सकता है!`
        : `Current scale: Converting just ${milligrams} milligrams of salt or sugar completely into energy yields ${energyMWh.toLocaleString()} Megawatt-hours of electricity. This is enough to power an entire village primary school for over ${((energyMWh) / 10).toFixed(0)} months!`,
      speechText: lang === 'hi'
        ? `आइंस्टीन का समीकरण। ई बराबर एम सी वर्ग। केवल ${milligrams} मिलीग्राम पदार्थ को बदलने पर ${energyMWh} मेगावाट घंटा ऊर्जा मिलेगी, जो गाँव के स्कूल को कई महीनों तक रोशन रख सकती है।`
        : `Einstein's mass energy equivalence. E equals m c squared. Converting just ${milligrams} milligrams of matter releases ${energyMWh} megawatt hours of energy, capable of powering a rural school for many months.`
    },
    chemistry: {
      title: lang === 'hi' ? 'रासायनिक समीकरण संतुलन' : 'Chemical Equation Balancing Lab',
      formula: 'a Reactants ➔ b Products',
      variables: lang === 'hi' ? 'परमाणुओं का संरक्षण (Conservation of Atoms)' : 'Conservation of Mass & Atoms',
      explanation: lang === 'hi'
        ? 'रासायनिक क्रिया में कोई नया परमाणु बनता या नष्ट नहीं होता। समीकरण के दोनों ओर प्रत्येक तत्व के कुल परमाणुओं की संख्या बिल्कुल समान होनी चाहिए।'
        : 'During a chemical reaction, atoms are neither created nor destroyed. The total count of each element must remain exactly equal on both the reactant side and the product side.',
      intuition: lang === 'hi'
        ? 'अभ्यास द्वारा सीखें! गुणांकों को समायोजित करें और "जांचें" बटन दबाकर अपने उत्तर का परीक्षण करें।'
        : 'Learn by practice! Try entering the correct integers for each reactant and product, then check if they balance perfectly.',
      speechText: lang === 'hi' ? 'रासायनिक समीकरण संतुलन लैब। अभिकारकों और उत्पादों को संतुलित करें।' : 'Chemical balancing lab. Balance the reactant and product atoms.'
    }
  };

  const mathExplanations = {
    pythagoras: {
      title: lang === 'hi' ? 'पाइथागोरस प्रमेय (ज्यामिति)' : "Pythagoras Theorem of Geometry",
      formula: 'a² + b² = c²',
      variables: lang === 'hi'
        ? 'a = आधार (Base side), b = लंब (Height side), c = कर्ण (Hypotenuse)'
        : 'a = Base, b = Height, c = Hypotenuse (diagonal)',
      explanation: lang === 'hi'
        ? `समकोण त्रिभुज में, कर्ण का वर्ग अन्य दो भुजाओं के वर्गों के योग के बराबर होता है। भारत में राजमिस्त्री सही समकोण कोना जांचने के लिए ३-४-५ की रस्सी मापते हैं, जिसे 'गुनिया' कहा जाता है!`
        : `In a right-angled triangle, the square of the hypotenuse is equal to the sum of squares of the other two sides. Masons in India use this as the 3-4-5 'Guniya' rule to establish perfect brick corners!`,
      intuition: lang === 'hi'
        ? `वर्तमान मान: आधार = ${sideA} cm, लंब = ${sideB} cm। कर्ण (c) की लंबाई ${hypotenuse.toFixed(2)} cm होगी। (${sideA}² + ${sideB}² = ${sideA*sideA + sideB*sideB})`
        : `Current calculation: Base = ${sideA} cm, Height = ${sideB} cm. The diagonal hypotenuse length is ${hypotenuse.toFixed(2)} cm! (Because ${sideA}² + ${sideB}² = ${sideA*sideA + sideB*sideB})`,
      speechText: lang === 'hi'
        ? `पाइथागोरस प्रमेय। समकोण त्रिभुज के लिए सूत्र है ए वर्ग जमा बी वर्ग बराबर सी वर्ग।`
        : `Pythagoras theorem. For right triangles, a squared plus b squared equals c squared.`
    },
    trigonometry: {
      title: lang === 'hi' ? 'त्रिकोणमिति: ऊँचाई और दूरी' : "Trigonometry: Heights & Distances",
      formula: 'h = d × tan(θ)',
      variables: lang === 'hi'
        ? 'h = ऊँचाई (Height), d = दूरी (Distance), θ = उन्नयन कोण (Angle of Elevation)'
        : 'h = Height, d = Horizontal Distance, θ = Angle of elevation (degrees)',
      explanation: lang === 'hi'
        ? `त्रिकोणमिति के सिद्धांतों का उपयोग करके हम बहुत ऊँचे मोबाइल टावर, नारियल के पेड़ या मंदिर के शिखर की ऊँचाई बिना ऊपर चढ़े निकाल सकते हैं! बस जमीन की दूरी और देखने का कोण चाहिए।`
        : `Using trigonometry, we can discover the precise height of tall structures (like mobile towers, trees, or local temples) purely by standing on the ground and measuring distance and angle!`,
      intuition: lang === 'hi'
        ? `वर्तमान मान: यदि आप टावर से ${distance} मीटर दूर हैं और उन्नयन कोण ${elevationAngle}° है, तो टावर की ऊँचाई ${computedHeight.toFixed(1)} मीटर है! (दृष्टि रेखा की कुल दूरी ${lineOfSight.toFixed(1)} मीटर है)`
        : `Current calculation: Standing ${distance} meters away with an elevation angle of ${elevationAngle}°, the projected height of the tower is ${computedHeight.toFixed(1)} meters! (The total line-of-sight distance is ${lineOfSight.toFixed(1)} meters)`,
      speechText: lang === 'hi'
        ? `त्रिकोणमिति ऊँचाई और दूरी। सूत्र है: ऊँचाई बराबर दूरी गुना टेन थीटा। यहाँ ऊँचाई ${computedHeight.toFixed(1)} मीटर है।`
        : `Trigonometry heights and distances. The formula is Height equals Distance times tangent of theta. The projected height is ${computedHeight.toFixed(1)} meters.`
    },
    quadratic: {
      title: lang === 'hi' ? 'द्विघात समीकरण प्रयोगशाला' : "Quadratic Equations Lab",
      formula: 'ax² + bx + c = 0',
      variables: lang === 'hi'
        ? 'a, b, c = गुणांक (Coefficients), D = b² - 4ac (विविक्तकर / Discriminant)'
        : 'a, b, c = Coefficients, D = Discriminant',
      explanation: lang === 'hi'
        ? `यह एक अत्यंत महत्वपूर्ण बीजीय सूत्र है। इसका ग्राफ़ एक 'परवलय' (Parabola) यानी यू-शेप बनाता है। हवा में फेंकी गई क्रिकेट गेंद का रास्ता बिल्कुल इसी वक्र पर चलता है!`
        : `A quadratic equation is a core algebraic equation. Its graph is a 'Parabola' (U-shape curve). The physical path of a thrown cricket ball or water fountain jets trace this exact geometric shape!`,
      intuition: lang === 'hi'
        ? `वर्तमान मान: समीकरण ${coeffA}x² + ${coeffB >= 0 ? `+${coeffB}` : coeffB}x + ${coeffC >= 0 ? `+${coeffC}` : coeffC} = 0. विविक्तकर D = ${discriminant}। मूल प्रकार: ${rootsInfo.nature}। मूल १ = ${rootsInfo.r1}, मूल २ = ${rootsInfo.r2}`
        : `Current Equation: ${coeffA}x² ${coeffB >= 0 ? `+ ${coeffB}` : `${coeffB}`}x ${coeffC >= 0 ? `+ ${coeffC}` : `${coeffC}`} = 0. Discriminant D = ${discriminant}. Roots: ${rootsInfo.nature}. Root 1 = ${rootsInfo.r1}, Root 2 = ${rootsInfo.r2}`,
      speechText: lang === 'hi'
        ? `द्विघात समीकरण लैब। वर्तमान समीकरण का विविक्तकर ${discriminant} है। मूलों का प्रकार है ${rootsInfo.nature}।`
        : `Quadratic equation lab. The discriminant is ${discriminant}. The nature of roots is ${rootsInfo.nature}.`
    }
  };

  // Select active equation info based on current category tab
  const activeEqInfo = activeCategory === 'science' 
    ? scienceExplanations[selectedScienceEq]
    : mathExplanations[selectedMathEq];

  // Voice text synthesizer
  const handleVoiceExplanation = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const textToSpeak = `${activeEqInfo.title}. ${activeEqInfo.explanation} ${activeEqInfo.intuition}`;
      speakText(textToSpeak, lang, 'Aryabhata AI 🦉', '🦉 Aryabhata AI', () => {
        setIsSpeaking(false);
      });
    }
  };

  // Chemical quiz verification
  const checkChemicalAnswer = () => {
    let allCorrect = true;
    const currentCorrect = activeQuestion.correctCoefficients;
    
    for (let i = 0; i < currentCorrect.length; i++) {
      const parsedVal = parseInt(chemInputs[i], 10);
      if (isNaN(parsedVal) || parsedVal !== currentCorrect[i]) {
        allCorrect = false;
        break;
      }
    }

    if (allCorrect) {
      setChemStatus('success');
      const bonus = activeQuestion.points;
      const originalPoints = user.totalPoints || 15;
      const updatedPoints = originalPoints + bonus;
      
      onUpdateUser({ totalPoints: updatedPoints });
      
      const successMsg = lang === 'hi'
        ? `✨ सही संतुलन! आपको +${bonus} अंक मिले! कुल अंक: ${updatedPoints}`
        : `✨ Perfectly Balanced! You earned +${bonus} study points! Total: ${updatedPoints} pts`;
      setScoreNotification(successMsg);
      
      speakText(
        lang === 'hi' ? 'बहुत बढ़िया! रासायनिक समीकरण पूरी तरह से संतुलित है।' : 'Excellent work! The chemical equation is perfectly balanced.',
        lang, 'Swami AI 🤖', '🤖 Swami AI'
      );

      setTimeout(() => {
        setScoreNotification(null);
      }, 5000);
    } else {
      setChemStatus('incorrect');
      speakText(
        lang === 'hi' ? 'यह संतुलित नहीं है। कृपया परमाणु संख्याओं की दोबारा जांच करें।' : 'That is not correct. Please count the atoms on both sides again.',
        lang, 'Swami AI 🤖', '🤖 Swami AI'
      );
    }
  };

  const resetChemicalGame = () => {
    setChemInputs(Array(activeQuestion.correctCoefficients.length).fill(''));
    setChemStatus('idle');
  };

  return (
    <div id="interactive-equation-hub" className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-br from-[#3D405B] to-[#2B2D42] text-white p-6 rounded-3xl border border-slate-700 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#F2CC8F]/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute left-1/3 bottom-0 w-48 h-20 bg-[#E07A5F]/10 rounded-full blur-3xl"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-white/10 rounded-2xl text-[#F2CC8F] border border-white/15 shadow-inner">
            <Zap className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold text-[#F2CC8F] tracking-widest bg-white/10 px-2 py-0.5 rounded-full">
                {lang === 'hi' ? 'पाठ्यपुस्तक क्रियाकलाप' : 'Interactive Lab Activities'}
              </span>
              <span className="text-[10px] uppercase font-mono font-bold bg-[#E07A5F]/20 text-[#E07A5F] px-2 py-0.5 rounded-full border border-[#E07A5F]/30">
                {lang === 'hi' ? 'ऑफ़लाइन सक्षम' : '100% Offline-Ready'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold mt-1">
              {lang === 'hi' ? 'स्मार्ट समीकरण हब' : 'Smart Equation & Sandbox Hub'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-sans mt-1 max-w-xl">
              {lang === 'hi' 
                ? 'विज्ञान (भौतिकी, रसायन शास्त्र) और गणित के कठिन सूत्रों को लाइव एनिमेशन, स्लाइडर्स और सिमुलेशन के साथ आसान भाषा में सीखें।'
                : 'Master complex Science & Mathematics concepts from Indian boards with responsive visual models, sliders, and audio explanations.'}
            </p>
          </div>
        </div>
      </div>

      {/* CATEGORY SELECTOR SWITCHES */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/80 max-w-md mx-auto">
        <button
          onClick={() => {
            setActiveCategory('science');
            stopSpeaking();
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-sans text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeCategory === 'science'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <span className="text-base">🧪</span>
          <span>{lang === 'hi' ? 'विज्ञान लैब (Science)' : 'Science Lab'}</span>
        </button>
        <button
          onClick={() => {
            setActiveCategory('math');
            stopSpeaking();
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-sans text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeCategory === 'math'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <span className="text-base">📐</span>
          <span>{lang === 'hi' ? 'गणित लैब (Maths)' : 'Mathematics Lab'}</span>
        </button>
      </div>

      {/* TWO COLUMN GRID FOR VISUAL PLAYGROUND */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: TOPIC SELECTION LIST (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-4 rounded-3xl border border-gray-150 shadow-2xs">
            <h2 className="text-xs font-mono uppercase font-bold text-gray-400 tracking-wider mb-3">
              {lang === 'hi' ? 'एक विषय चुनें' : 'Select a topic'}
            </h2>
            
            {/* SCIENCE TOPIC BUTTONS */}
            {activeCategory === 'science' && (
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedScienceEq('newton')}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                    selectedScienceEq === 'newton'
                      ? 'bg-[#FAF8F4] border-[#E07A5F] text-gray-900 shadow-3xs'
                      : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <h4 className="font-sans font-bold text-sm">
                      {lang === 'hi' ? 'गति का नियम (Newton)' : "Newton's Force Law"}
                    </h4>
                    <span className="font-mono text-xs text-[#E07A5F] font-bold">F = m × a</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 transition-transform ${selectedScienceEq === 'newton' ? 'translate-x-1 text-[#E07A5F]' : 'text-gray-300'}`} />
                </button>

                <button
                  onClick={() => setSelectedScienceEq('ohms')}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                    selectedScienceEq === 'ohms'
                      ? 'bg-[#FAF8F4] border-[#E07A5F] text-gray-900 shadow-3xs'
                      : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <h4 className="font-sans font-bold text-sm">
                      {lang === 'hi' ? 'ओम का नियम (Ohm)' : "Ohm's Law"}
                    </h4>
                    <span className="font-mono text-xs text-[#E07A5F] font-bold">V = I × R</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 transition-transform ${selectedScienceEq === 'ohms' ? 'translate-x-1 text-[#E07A5F]' : 'text-gray-300'}`} />
                </button>

                <button
                  onClick={() => setSelectedScienceEq('einstein')}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                    selectedScienceEq === 'einstein'
                      ? 'bg-[#FAF8F4] border-[#E07A5F] text-gray-900 shadow-3xs'
                      : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <h4 className="font-sans font-bold text-sm">
                      {lang === 'hi' ? 'द्रव्यमान-ऊर्जा समीकरण' : "Mass-Energy Equivalence"}
                    </h4>
                    <span className="font-mono text-xs text-[#E07A5F] font-bold">E = m × c²</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 transition-transform ${selectedScienceEq === 'einstein' ? 'translate-x-1 text-[#E07A5F]' : 'text-gray-300'}`} />
                </button>

                <button
                  onClick={() => setSelectedScienceEq('chemistry')}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                    selectedScienceEq === 'chemistry'
                      ? 'bg-[#FAF8F4] border-[#E07A5F] text-gray-900 shadow-3xs'
                      : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <h4 className="font-sans font-bold text-sm">
                      {lang === 'hi' ? 'रासायनिक संतुलन लैब' : "Chemical Balancing Lab"}
                    </h4>
                    <span className="font-mono text-xs text-[#E07A5F] font-bold">Reactants ➔ Products</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 transition-transform ${selectedScienceEq === 'chemistry' ? 'translate-x-1 text-[#E07A5F]' : 'text-gray-300'}`} />
                </button>
              </div>
            )}

            {/* MATHEMATICS TOPIC BUTTONS */}
            {activeCategory === 'math' && (
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedMathEq('pythagoras')}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                    selectedMathEq === 'pythagoras'
                      ? 'bg-[#FAF8F4] border-[#E07A5F] text-gray-900 shadow-3xs'
                      : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <h4 className="font-sans font-bold text-sm">
                      {lang === 'hi' ? 'पाइथागोरस प्रमेय (Guniya)' : "Pythagoras Theorem"}
                    </h4>
                    <span className="font-mono text-xs text-[#E07A5F] font-bold">a² + b² = c²</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 transition-transform ${selectedMathEq === 'pythagoras' ? 'translate-x-1 text-[#E07A5F]' : 'text-gray-300'}`} />
                </button>

                <button
                  onClick={() => setSelectedMathEq('trigonometry')}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                    selectedMathEq === 'trigonometry'
                      ? 'bg-[#FAF8F4] border-[#E07A5F] text-gray-900 shadow-3xs'
                      : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <h4 className="font-sans font-bold text-sm">
                      {lang === 'hi' ? 'ऊँचाई और दूरी (Trig)' : "Heights & Distances"}
                    </h4>
                    <span className="font-mono text-xs text-[#E07A5F] font-bold">h = d × tan(θ)</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 transition-transform ${selectedMathEq === 'trigonometry' ? 'translate-x-1 text-[#E07A5F]' : 'text-gray-300'}`} />
                </button>

                <button
                  onClick={() => setSelectedMathEq('quadratic')}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                    selectedMathEq === 'quadratic'
                      ? 'bg-[#FAF8F4] border-[#E07A5F] text-gray-900 shadow-3xs'
                      : 'bg-white border-gray-150 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <h4 className="font-sans font-bold text-sm">
                      {lang === 'hi' ? 'द्विघात समीकरण (Parabola)' : "Quadratic Equations Lab"}
                    </h4>
                    <span className="font-mono text-xs text-[#E07A5F] font-bold">ax² + bx + c = 0</span>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 transition-transform ${selectedMathEq === 'quadratic' ? 'translate-x-1 text-[#E07A5F]' : 'text-gray-300'}`} />
                </button>
              </div>
            )}

          </div>

          {/* DYNAMIC HINDI/ENGLISH DID-YOU-KNOW TRIVIA CARD */}
          <div className="bg-amber-50/70 border border-amber-150 rounded-3xl p-4 text-left">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h5 className="font-sans font-bold text-xs text-amber-800">
                  {activeCategory === 'science' 
                    ? (lang === 'hi' ? 'भारतीय विज्ञान धरोहर' : 'Did You Know?') 
                    : (lang === 'hi' ? 'भारतीय वैदिक गणित रहस्य' : 'Vedic Math & Local Trivia')}
                </h5>
                <p className="text-xs text-gray-650 leading-relaxed">
                  {activeCategory === 'science' ? (
                    lang === 'hi'
                      ? "कणाद मुनि ने २५०० वर्ष पहले 'वैशेषिक सूत्र' में लिखा था कि ब्रह्मांड का प्रत्येक पदार्थ सूक्ष्म कणों (परमाणुओं) से बना है, जिसे आधुनिक विज्ञान एटम कहता है!"
                      : "Over 2500 years ago, Indian sage Maharishi Kanada formulated the 'atomic theory of matter', stating everything is made of indivisible particles called 'Anu' (atoms)!"
                  ) : (
                    lang === 'hi'
                      ? "बौधायन सुल्वसूत्र (800 ईसा पूर्व) में पाइथागोरस के जन्म से सदियों पहले ही इस प्रमेय का स्पष्ट उल्लेख मिलता है। भारतीय राजमिस्त्री आज भी इसे दीवार नापने के लिए 'गुनिया सूत्र' कहते हैं।"
                      : "Centuries before Pythagoras, the Indian mathematician Baudhayan written down the exact relationship in the 'Shulba Sutras' (800 BC). It was used to build precise geometric altars!"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED SIMULATION PLAYGROUND (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* MAIN EXPERIMENT COMPONENT */}
          {!(activeCategory === 'science' && selectedScienceEq === 'chemistry') ? (
            <div className="bg-white rounded-3xl border border-gray-150 shadow-2xs overflow-hidden">
              
              {/* PLAYGROUND TITLE HEADER */}
              <div className="border-b border-gray-100 p-5 bg-gray-50/50 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <span className="font-mono text-[10px] text-gray-450 uppercase font-bold tracking-wider block">
                    {lang === 'hi' ? 'इंटरैक्टिव प्रयोग और सैंडबॉक्स' : 'Interactive Sandbox Experiment'}
                  </span>
                  <h2 className="font-display font-extrabold text-base text-gray-900 mt-0.5">
                    {activeEqInfo.title}
                  </h2>
                </div>

                {/* READ OUT LOUD EXPLAINER */}
                <button
                  onClick={handleVoiceExplanation}
                  className={`px-4 py-2 rounded-full font-sans text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isSpeaking
                      ? 'bg-amber-600 text-white shadow-xs animate-pulse'
                      : 'bg-amber-55 text-amber-900 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Volume2 className="h-4 w-4 shrink-0" />
                  <span>{isSpeaking ? (lang === 'hi' ? 'आवाज़ बंद करें' : 'Stop Speaking') : (lang === 'hi' ? 'आवाज़ में समझें' : 'Listen Explanation')}</span>
                </button>
              </div>

              {/* THE FORMULA CARD */}
              <div className="p-6 bg-[#FAF8F4] flex flex-col items-center justify-center border-b border-gray-100 py-8">
                <span className="text-xs font-mono font-bold text-[#E07A5F] uppercase tracking-widest">
                  {lang === 'hi' ? 'गणितीय सूत्र' : 'Standard Formula'}
                </span>
                <div className="text-4xl sm:text-5xl font-mono font-black text-[#3D405B] tracking-tight mt-2 text-center drop-shadow-3xs">
                  {activeEqInfo.formula}
                </div>
                <div className="text-xs font-sans font-semibold text-gray-550 mt-3 text-center max-w-lg bg-white/70 px-4 py-2 rounded-full border border-gray-100 shadow-3xs">
                  {activeEqInfo.variables}
                </div>
              </div>

              {/* LAYOUT GRID: SLIDERS ON LEFT, VISUAL GRAPHICS ON RIGHT */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* SLIDERS CONTROLLER (5 cols) */}
                <div className="md:col-span-5 space-y-5 border-r border-gray-100/80 pr-0 md:pr-6">
                  <div className="flex items-center gap-2 text-gray-800 pb-1">
                    <Sliders className="h-4 w-4 text-[#E07A5F]" />
                    <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-gray-500">
                      {lang === 'hi' ? 'पैरामीटर बदलें' : 'Adjust Parameters'}
                    </h3>
                  </div>

                  {/* SLIDERS ACCORDING TO SELECTED FORMULA */}
                  {activeCategory === 'science' && selectedScienceEq === 'newton' && (
                    <div className="space-y-4">
                      {/* Mass Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'द्रव्यमान (Mass m):' : 'Mass (m):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{mass} kg</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={mass}
                          onChange={(e) => setMass(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>1 kg</span>
                          <span>50 kg</span>
                        </div>
                      </div>

                      {/* Acceleration Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'त्वरण (Acceleration a):' : 'Acceleration (a):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{accel} m/s²</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="15"
                          value={accel}
                          onChange={(e) => setAccel(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>1 m/s²</span>
                          <span>15 m/s²</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'science' && selectedScienceEq === 'ohms' && (
                    <div className="space-y-4">
                      {/* Current Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'विद्युत धारा (Current I):' : 'Current (I):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{current.toFixed(1)} A</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="10"
                          step="0.5"
                          value={current}
                          onChange={(e) => setCurrent(parseFloat(e.target.value))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>0.5 A</span>
                          <span>10 A</span>
                        </div>
                      </div>

                      {/* Resistance Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'प्रतिरोध (Resistance R):' : 'Resistance (R):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{resistance} Ω</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={resistance}
                          onChange={(e) => setResistance(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>1 Ω</span>
                          <span>50 Ω</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'science' && selectedScienceEq === 'einstein' && (
                    <div className="space-y-4">
                      {/* Milligrams mass */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'द्रव्यमान (Mass m in mg):' : 'Mass (m in mg):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{milligrams} mg</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={milligrams}
                          onChange={(e) => setMilligrams(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>1 mg</span>
                          <span>10 mg</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MATHS FORMULA SLIDERS */}
                  {activeCategory === 'math' && selectedMathEq === 'pythagoras' && (
                    <div className="space-y-4">
                      {/* Base side A */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'आधार (Base side a):' : 'Base (Side a):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{sideA} cm</span>
                        </div>
                        <input
                          type="range"
                          min="3"
                          max="15"
                          value={sideA}
                          onChange={(e) => setSideA(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>3 cm</span>
                          <span>15 cm</span>
                        </div>
                      </div>

                      {/* Height side B */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'लंब (Height side b):' : 'Height (Side b):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{sideB} cm</span>
                        </div>
                        <input
                          type="range"
                          min="3"
                          max="15"
                          value={sideB}
                          onChange={(e) => setSideB(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>3 cm</span>
                          <span>15 cm</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'math' && selectedMathEq === 'trigonometry' && (
                    <div className="space-y-4">
                      {/* Ground Distance (d) */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'जमीनी दूरी (Distance d):' : 'Distance from Base (d):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{distance} m</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="30"
                          value={distance}
                          onChange={(e) => setDistance(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>5 m</span>
                          <span>30 m</span>
                        </div>
                      </div>

                      {/* Angle of Elevation (θ) */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'उन्नयन कोण (Angle θ):' : 'Angle of Elevation (θ):'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{elevationAngle}°</span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="75"
                          step="5"
                          value={elevationAngle}
                          onChange={(e) => setElevationAngle(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>15°</span>
                          <span>75°</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'math' && selectedMathEq === 'quadratic' && (
                    <div className="space-y-4">
                      {/* Coefficient a */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">
                            {lang === 'hi' ? 'गुणांक a (शून्य नहीं):' : 'Coefficient a (≠ 0):'}
                          </span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{coeffA}</span>
                        </div>
                        <input
                          type="range"
                          min="-4"
                          max="4"
                          step="1"
                          value={coeffA}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setCoeffA(val === 0 ? 1 : val); // prevent division by zero
                          }}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>-4</span>
                          <span>4 (non-zero)</span>
                        </div>
                      </div>

                      {/* Coefficient b */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'गुणांक b:' : 'Coefficient b:'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{coeffB}</span>
                        </div>
                        <input
                          type="range"
                          min="-8"
                          max="8"
                          value={coeffB}
                          onChange={(e) => setCoeffB(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>-8</span>
                          <span>8</span>
                        </div>
                      </div>

                      {/* Coefficient c */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{lang === 'hi' ? 'अचर पद c:' : 'Constant c:'}</span>
                          <span className="font-mono font-extrabold text-[#E07A5F]">{coeffC}</span>
                        </div>
                        <input
                          type="range"
                          min="-8"
                          max="8"
                          value={coeffC}
                          onChange={(e) => setCoeffC(parseInt(e.target.value, 10))}
                          className="w-full accent-[#E07A5F] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                          <span>-8</span>
                          <span>8</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RUNTIME RESULT BOX */}
                  <div className="bg-[#3D405B] text-white p-4 rounded-2xl text-left shadow-inner">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-[#F2CC8F] font-bold block">
                      {lang === 'hi' ? 'सक्रिय गणना परिणाम' : 'Live Calculation Output'}
                    </span>
                    
                    {activeCategory === 'science' && selectedScienceEq === 'newton' && (
                      <div>
                        <div className="flex items-baseline gap-1 mt-1.5">
                          <span className="text-3xl font-mono font-black text-[#F2CC8F]">{force}</span>
                          <span className="text-xs font-sans font-bold text-gray-300">Newtons (N)</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-sans mt-1 leading-normal">
                          {lang === 'hi' ? 'बल = द्रव्यमान × त्वरण' : 'Force = Mass × Acceleration'}
                        </p>
                      </div>
                    )}

                    {activeCategory === 'science' && selectedScienceEq === 'ohms' && (
                      <div>
                        <div className="flex items-baseline gap-1 mt-1.5">
                          <span className="text-3xl font-mono font-black text-[#F2CC8F]">{voltage.toFixed(1)}</span>
                          <span className="text-xs font-sans font-bold text-gray-300">Volts (V)</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-sans mt-1 leading-normal">
                          {lang === 'hi' ? 'वोल्टेज = विद्युत धारा × प्रतिरोध' : 'Voltage = Current × Resistance'}
                        </p>
                      </div>
                    )}

                    {activeCategory === 'science' && selectedScienceEq === 'einstein' && (
                      <div>
                        <div className="flex items-baseline gap-1 mt-1.5">
                          <span className="text-2xl font-mono font-black text-[#F2CC8F]">{energyMWh.toLocaleString()}</span>
                          <span className="text-xs font-sans font-bold text-gray-300">MWh</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-sans mt-1 leading-normal">
                          {lang === 'hi' ? 'ऊर्जा (E) = द्रव्यमान (m) × c²' : 'Energy (E) = Mass (m) × c²'}
                        </p>
                      </div>
                    )}

                    {activeCategory === 'math' && selectedMathEq === 'pythagoras' && (
                      <div>
                        <div className="flex items-baseline gap-1 mt-1.5">
                          <span className="text-3xl font-mono font-black text-[#F2CC8F]">{hypotenuse.toFixed(2)}</span>
                          <span className="text-xs font-sans font-bold text-gray-300">cm</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-sans mt-1 leading-normal">
                          {lang === 'hi' ? 'कर्ण (c) = √(a² + b²)' : 'Hypotenuse (c) = √(a² + b²)'}
                        </p>
                      </div>
                    )}

                    {activeCategory === 'math' && selectedMathEq === 'trigonometry' && (
                      <div className="space-y-1 mt-1.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-mono font-black text-[#F2CC8F]">{computedHeight.toFixed(1)}</span>
                          <span className="text-xs font-sans font-bold text-gray-300">meters (Height)</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-sans leading-normal">
                          {lang === 'hi' 
                            ? `tan(${elevationAngle}°) = ${Math.tan(angleRad).toFixed(3)} | कर्ण = ${lineOfSight.toFixed(1)} m` 
                            : `tan(${elevationAngle}°) = ${Math.tan(angleRad).toFixed(3)} | Hypotenuse = ${lineOfSight.toFixed(1)} m`}
                        </p>
                      </div>
                    )}

                    {activeCategory === 'math' && selectedMathEq === 'quadratic' && (
                      <div className="mt-1.5 space-y-1 text-xs">
                        <div className="font-bold text-[#F2CC8F]">
                          {lang === 'hi' ? 'मूल (Roots):' : 'Computed Roots:'}
                        </div>
                        <div className="font-mono font-extrabold text-sm flex flex-col gap-0.5">
                          <div className="text-white">x₁ = <span className="text-[#F2CC8F]">{rootsInfo.r1}</span></div>
                          <div className="text-white">x₂ = <span className="text-[#F2CC8F]">{rootsInfo.r2}</span></div>
                        </div>
                        <p className="text-[10px] text-slate-300 font-sans leading-none pt-1">
                          D = b² - 4ac = <span className="font-mono font-bold">{discriminant}</span> ({rootsInfo.nature})
                        </p>
                      </div>
                    )}

                  </div>
                </div>

                {/* VISUAL ILLUSTRATION SCREEN (7 cols) */}
                <div className="md:col-span-7 bg-gray-50 rounded-2xl border border-gray-150 p-4 flex flex-col justify-between min-h-[260px] relative overflow-hidden">
                  
                  {/* 1. Newton's Visual Animation */}
                  {activeCategory === 'science' && selectedScienceEq === 'newton' && (
                    <div className="h-full flex flex-col justify-between space-y-4">
                      <span className="text-[9px] uppercase font-mono text-gray-400 font-bold tracking-wider block">
                        {lang === 'hi' ? 'गति की दिशा और बल सदिश' : 'Push Vector Visualization'}
                      </span>
                      
                      <div className="relative h-28 flex items-center justify-center bg-white border border-gray-100 rounded-xl px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-center">
                            <span className="text-2xl">🧔</span>
                            <span className="text-[9px] font-bold text-gray-500 font-sans">{lang === 'hi' ? 'धक्का' : 'Push'}</span>
                          </div>

                          {/* Force Arrow */}
                          <div 
                            className="h-4 bg-[#E07A5F] rounded-full relative transition-all duration-300"
                            style={{ width: `${Math.min(30 + force * 2.5, 160)}px` }}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-[#E07A5F]"></div>
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black text-[#E07A5F] whitespace-nowrap">
                              {force.toFixed(0)} N
                            </span>
                          </div>

                          {/* Moving Wagon */}
                          <div 
                            className="p-3 bg-[#3D405B] text-white rounded-lg border border-slate-700 shadow flex flex-col items-center justify-center transition-all duration-300 relative"
                            style={{ transform: `scale(${1 + mass / 100})` }}
                          >
                            <span className="text-lg">📦</span>
                            <span className="text-[8px] font-mono font-bold text-[#F2CC8F] mt-0.5">{mass} kg</span>
                            
                            {/* Wheels */}
                            <div className="absolute -bottom-1.5 left-2 h-3 w-3 rounded-full bg-slate-900 border border-slate-400 animate-spin"></div>
                            <div className="absolute -bottom-1.5 right-2 h-3 w-3 rounded-full bg-slate-900 border border-slate-400 animate-spin"></div>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-500 text-center italic bg-white/50 p-2 rounded-lg border border-gray-100 font-sans">
                        {lang === 'hi' 
                          ? 'स्लाइडर बदलें! भारी वजन को उसी गति से बढ़ाने के लिए अधिक बल चाहिए।' 
                          : 'Adjust sliders! A heavier box needs a stronger push to accelerate to the same speed.'}
                      </div>
                    </div>
                  )}

                  {/* 2. Ohm's Law Circuit */}
                  {activeCategory === 'science' && selectedScienceEq === 'ohms' && (
                    <div className="h-full flex flex-col justify-between space-y-4">
                      <span className="text-[9px] uppercase font-mono text-gray-400 font-bold tracking-wider block">
                        {lang === 'hi' ? 'विद्युत परिपथ और बल्ब की चमक' : 'Interactive Bulb Circuit'}
                      </span>
                      
                      <div className="relative h-28 flex items-center justify-center bg-white border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center gap-10">
                          {/* Battery */}
                          <div className="relative border-2 border-slate-700 w-14 h-8 rounded bg-slate-100 flex items-center justify-center">
                            <span className="text-[10px] font-mono font-black text-slate-700">🔋 {voltage.toFixed(1)}V</span>
                            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-3 bg-slate-700 rounded-r"></div>
                          </div>

                          {/* Connection wires drawn as line */}
                          <div className="flex-1 h-0.5 bg-slate-400 relative">
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-mono text-gray-500 font-bold bg-white px-1 border border-gray-150 rounded">
                              {current.toFixed(1)} A
                            </div>
                          </div>

                          {/* Lightbulb with dynamic glow and brightness */}
                          <div className="relative flex flex-col items-center">
                            <div 
                              className="absolute rounded-full transition-all duration-300 blur-md pointer-events-none"
                              style={{ 
                                width: `${Math.min(20 + voltage * 3, 75)}px`, 
                                height: `${Math.min(20 + voltage * 3, 75)}px`, 
                                backgroundColor: `rgba(242, 204, 143, ${Math.min(voltage / 100, 0.95)})` 
                              }}
                            ></div>
                            
                            <div className="z-10 text-3xl transition-transform duration-300" style={{ transform: `scale(${1 + current / 20})` }}>
                              💡
                            </div>
                            <span className="text-[9px] font-bold text-gray-650 font-mono mt-1">Bulb: {resistance} Ω</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-500 text-center italic bg-white/50 p-2 rounded-lg border border-gray-100 font-sans">
                        {lang === 'hi'
                          ? 'प्रतिरोध (R) बढ़ने से करंट कम होता है, जिससे बल्ब धीमा होता है। वोल्टेज बढ़ने से करंट बढ़ता है!'
                          : 'Increasing resistance reduces current, making the bulb dim. Increasing voltage pumps more current!'}
                      </div>
                    </div>
                  )}

                  {/* 3. Einstein Mass-Energy Equivalence */}
                  {activeCategory === 'science' && selectedScienceEq === 'einstein' && (
                    <div className="h-full flex flex-col justify-between space-y-4">
                      <span className="text-[9px] uppercase font-mono text-gray-400 font-bold tracking-wider block">
                        {lang === 'hi' ? 'ऊर्जा रूपांतरण तुलना' : 'Equivalent Power Scale'}
                      </span>
                      
                      <div className="relative h-28 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-center bg-[#FAF8F4] border border-gray-150 p-2 rounded-xl">
                            <span className="text-2xl">🧂</span>
                            <span className="text-[9px] font-mono font-bold text-gray-700">{milligrams} mg Salt</span>
                          </div>

                          <ArrowRight className="h-5 w-5 text-amber-500 animate-bounce" />

                          <div className="flex flex-col items-center bg-[#3D405B] text-white p-2 px-3 rounded-xl">
                            <span className="text-xl">🏫 💡</span>
                            <span className="text-[8px] font-mono text-[#F2CC8F] font-bold text-center mt-0.5">
                              {energyMWh.toLocaleString()} Megawatt Hours
                            </span>
                          </div>
                        </div>

                        <div className="text-[10px] font-sans font-bold text-gray-700 mt-2 text-center">
                          ⚡ {lang === 'hi' ? 'यह ग्रामीण स्कूल को' : 'Can run village primary school for'} <span className="text-[#E07A5F] font-extrabold">{((energyMWh) / 10).toFixed(0)}</span> {lang === 'hi' ? 'महीने तक बिजली देगा!' : 'months!'}
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-500 text-center italic bg-white/50 p-2 rounded-lg border border-gray-100 font-sans">
                        {lang === 'hi'
                          ? 'चूंकि प्रकाश की गति बहुत अधिक है, इसलिए बहुत कम मात्रा में द्रव्यमान नष्ट होने पर भी विशाल ऊर्जा उत्पन्न होती है!'
                          : 'Because the speed of light is exceptionally fast, converting even a speck of dust yields incredible quantities of power!'}
                      </div>
                    </div>
                  )}

                  {/* 4. Pythagoras Dynamic Triangle */}
                  {activeCategory === 'math' && selectedMathEq === 'pythagoras' && (
                    <div className="h-full flex flex-col justify-between space-y-4">
                      <span className="text-[9px] uppercase font-mono text-gray-400 font-bold tracking-wider block">
                        {lang === 'hi' ? 'समकोण त्रिभुज SVG दृश्य' : 'Live SVG Right-Triangle Render'}
                      </span>
                      
                      <div className="relative h-32 flex items-center justify-center bg-white border border-gray-100 rounded-xl px-2">
                        <svg width="220" height="120" viewBox="0 0 220 120" className="overflow-visible">
                          {(() => {
                            const startX = 60;
                            const startY = 100;
                            const widthPx = Math.min(sideA * 8.5, 140);
                            const heightPx = Math.min(sideB * 5.5, 80);
                            
                            const ptBaseCorner = `${startX},${startY}`;
                            const ptTop = `${startX},${startY - heightPx}`;
                            const ptRight = `${startX + widthPx},${startY}`;
                            
                            return (
                              <>
                                <polygon 
                                  points={`${ptBaseCorner} ${ptTop} ${ptRight}`} 
                                  fill="#FAF8F4" 
                                  stroke="#3D405B" 
                                  strokeWidth="2.5"
                                  strokeLinejoin="round"
                                />
                                
                                <rect x={startX} y={startY - 8} width="8" height="8" fill="none" stroke="#E07A5F" strokeWidth="1" />

                                <text x={startX - 22} y={startY - (heightPx / 2) + 3} fontSize="9" fontWeight="bold" fontFamily="monospace" fill="#333">
                                  b={sideB}
                                </text>

                                <text x={startX + (widthPx / 2) - 8} y={startY + 15} fontSize="9" fontWeight="bold" fontFamily="monospace" fill="#333">
                                  a={sideA}
                                </text>

                                <text x={startX + (widthPx / 2) + 5} y={startY - (heightPx / 2) - 5} fontSize="10" fontWeight="bold" fontFamily="monospace" fill="#E07A5F">
                                  c={hypotenuse.toFixed(1)}
                                </text>
                              </>
                            );
                          })()}
                        </svg>
                      </div>

                      <div className="text-[10px] text-gray-500 text-center italic bg-white/50 p-2 rounded-lg border border-gray-100 font-sans">
                        {lang === 'hi'
                          ? 'भारतीय राजमिस्त्रियों का गुनिया नियम 3:4:5 अनुपात पर आधारित है, क्योंकि 3² + 4² = 5²।'
                          : 'Indian builders utilize the exact 3:4:5 ratio as a simple geometric standard to square foundations perfectly!'}
                      </div>
                    </div>
                  )}

                  {/* 5. Trigonometry Heights & Distances */}
                  {activeCategory === 'math' && selectedMathEq === 'trigonometry' && (
                    <div className="h-full flex flex-col justify-between space-y-4">
                      <span className="text-[9px] uppercase font-mono text-gray-400 font-bold tracking-wider block">
                        {lang === 'hi' ? 'उन्नयन कोण और ऊँचाई प्रोजेक्शन' : 'Angle of Elevation Visualized'}
                      </span>
                      
                      <div className="relative h-36 flex items-center justify-center bg-white border border-gray-100 rounded-xl overflow-hidden px-2">
                        <svg width="240" height="130" viewBox="0 0 240 130" className="overflow-visible">
                          {(() => {
                            // Scale dimensions to fit SVG nicely
                            // Distance 5m to 30m maps to width 30px to 160px
                            // Height computedHeight (max around 30m * tan(75) = large, let's cap drawn height)
                            const originX = 30; // student location
                            const groundY = 110;
                            const scaleX = 5.0; // pixels per meter
                            const widthPx = distance * scaleX;
                            const heightPx = computedHeight * scaleX;
                            
                            // Tower top coordinate
                            const towerX = originX + widthPx;
                            const towerTopY = Math.max(10, groundY - heightPx);

                            return (
                              <>
                                {/* Ground Line */}
                                <line x1="10" y1={groundY} x2="230" y2={groundY} stroke="#bbb" strokeWidth="1.5" />
                                
                                {/* Student representation */}
                                <text x={originX - 10} y={groundY - 5} fontSize="20">🧑‍🎓</text>
                                
                                {/* School Building or Mobile Tower visual */}
                                <g transform={`translate(${towerX - 10}, ${towerTopY})`}>
                                  {/* Draw a tall thin rectangle for tower */}
                                  <rect x="2" y="0" width="16" height={groundY - towerTopY} fill="#FAF8F4" stroke="#3D405B" strokeWidth="2" />
                                  {/* Antenna top */}
                                  <line x1="10" y1="0" x2="10" y2="-10" stroke="#E07A5F" strokeWidth="2" />
                                  <circle cx="10" cy="-10" r="3" fill="#E07A5F" />
                                  {/* Small window indicators */}
                                  <rect x="5" y="10" width="10" height="5" fill="#3D405B" opacity="0.3" />
                                  <rect x="5" y="25" width="10" height="5" fill="#3D405B" opacity="0.3" />
                                </g>

                                {/* Dashed Line of Sight */}
                                <line 
                                  x1={originX} 
                                  y1={groundY - 15} 
                                  x2={towerX} 
                                  y2={towerTopY} 
                                  stroke="#E07A5F" 
                                  strokeWidth="2" 
                                  strokeDasharray="4,3" 
                                />

                                {/* Distance Line indicator */}
                                <path d={`M ${originX} ${groundY + 5} L ${towerX} ${groundY + 5}`} stroke="#3D405B" strokeWidth="1" />
                                <text x={originX + (widthPx/2) - 15} y={groundY + 15} fontSize="8" fontWeight="bold" fontFamily="monospace">
                                  d={distance}m
                                </text>

                                {/* Height Line indicator */}
                                <path d={`M ${towerX + 10} ${towerTopY} L ${towerX + 10} ${groundY}`} stroke="#E07A5F" strokeWidth="1" />
                                <text x={towerX + 15} y={towerTopY + (groundY - towerTopY)/2 + 4} fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#E07A5F">
                                  h={computedHeight.toFixed(1)}m
                                </text>

                                {/* Angle label */}
                                <path 
                                  d={`M ${originX + 15} ${groundY} A 15 15 0 0 0 ${originX + 14.5} ${groundY - 6}`} 
                                  fill="none" 
                                  stroke="#E07A5F" 
                                  strokeWidth="1.5" 
                                />
                                <text x={originX + 18} y={groundY - 4} fontSize="8" fontWeight="bold" fill="#E07A5F" fontFamily="monospace">
                                  {elevationAngle}°
                                </text>
                              </>
                            );
                          })()}
                        </svg>
                      </div>

                      <div className="text-[10px] text-gray-500 text-center italic bg-white/50 p-2 rounded-lg border border-gray-100 font-sans">
                        {lang === 'hi'
                          ? 'कोण (θ) या दूरी (d) बढ़ाने पर मीनार की आनुमानिक ऊँचाई भी बढ़ जाती है!'
                          : 'Increasing angle (θ) or walking further away updates the dynamic heights & distances model!'}
                      </div>
                    </div>
                  )}

                  {/* 6. Quadratic Equation Plotter */}
                  {activeCategory === 'math' && selectedMathEq === 'quadratic' && (
                    <div className="h-full flex flex-col justify-between space-y-4">
                      <span className="text-[9px] uppercase font-mono text-gray-400 font-bold tracking-wider block">
                        {lang === 'hi' ? 'परवलय आरेख (Parabola curve) SVG' : 'Parabola Graph Plotter'}
                      </span>
                      
                      <div className="relative h-32 flex items-center justify-center bg-white border border-gray-100 rounded-xl p-2 overflow-hidden">
                        <svg width="220" height="110" viewBox="0 0 220 110" className="overflow-visible">
                          {(() => {
                            const originX = 110;
                            const originY = 55;
                            const scaleX = 12; // px per x unit
                            const scaleY = 6;  // px per y unit

                            // Create path points for ax^2 + bx + c
                            const points: string[] = [];
                            for (let x = -8; x <= 8; x += 0.5) {
                              const y = (coeffA * x * x) + (coeffB * x) + coeffC;
                              // SVG Y coordinates are inverted (0 is top)
                              const svgX = originX + (x * scaleX);
                              const svgY = originY - (y * scaleY);
                              
                              if (svgY >= 5 && svgY <= 105 && svgX >= 5 && svgX <= 215) {
                                points.push(`${svgX.toFixed(1)},${svgY.toFixed(1)}`);
                              }
                            }
                            const polylinePoints = points.join(' ');

                            return (
                              <>
                                {/* Cartesian Grid Lines */}
                                <line x1="5" y1={originY} x2="215" y2={originY} stroke="#eee" strokeWidth="1.5" /> {/* X axis */}
                                <line x1={originX} y1="5" x2={originX} y2="105" stroke="#eee" strokeWidth="1.5" /> {/* Y axis */}

                                {/* Axis ticks */}
                                <circle cx={originX} cy={originY} r="2" fill="#3D405B" />
                                
                                {/* Label for Origin */}
                                <text x={originX + 4} y={originY + 11} fontSize="7" fill="#888">0</text>
                                
                                {/* Parabola Curve */}
                                {polylinePoints && (
                                  <polyline 
                                    points={polylinePoints} 
                                    fill="none" 
                                    stroke="#E07A5F" 
                                    strokeWidth="2.5" 
                                    strokeLinecap="round"
                                  />
                                )}

                                {/* Real Roots markers on the graph if any */}
                                {rootsInfo.hasReal && (() => {
                                  const r1Val = parseFloat(rootsInfo.r1);
                                  const r2Val = parseFloat(rootsInfo.r2);
                                  const svgR1X = originX + (r1Val * scaleX);
                                  const svgR2X = originX + (r2Val * scaleX);

                                  return (
                                    <>
                                      {svgR1X >= 5 && svgR1X <= 215 && (
                                        <g>
                                          <circle cx={svgR1X} cy={originY} r="4" fill="#3D405B" stroke="#white" strokeWidth="1" />
                                          <text x={svgR1X - 8} y={originY - 6} fontSize="7" fontWeight="bold" fill="#3D405B">r₁</text>
                                        </g>
                                      )}
                                      {svgR2X >= 5 && svgR2X <= 215 && Math.abs(svgR1X - svgR2X) > 5 && (
                                        <g>
                                          <circle cx={svgR2X} cy={originY} r="4" fill="#3D405B" stroke="#white" strokeWidth="1" />
                                          <text x={svgR2X - 8} y={originY - 6} fontSize="7" fontWeight="bold" fill="#3D405B">r₂</text>
                                        </g>
                                      )}
                                    </>
                                  );
                                })()}
                              </>
                            );
                          })()}
                        </svg>
                      </div>

                      <div className="text-[10px] text-gray-500 text-center italic bg-white/50 p-2 rounded-lg border border-gray-100 font-sans">
                        {lang === 'hi'
                          ? 'गुणांक a ऋणात्मक (-) होने पर परवलय नीचे की तरफ घूमता है, धनात्मक (+) होने पर ऊपर की तरफ!'
                          : 'If "a" is positive, the parabola opens upward. If "a" is negative, it opens downward!'}
                      </div>
                    </div>
                  )}

                  {/* COMMON DYNAMIC INSIGHT TEXT BOX */}
                  <div className="bg-white border border-gray-150 rounded-xl p-3.5 text-left text-xs text-gray-750 font-sans leading-relaxed shadow-3xs">
                    <div className="font-bold text-gray-800 mb-1 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E07A5F]"></span>
                      {lang === 'hi' ? 'अवधारणा की समझ (Physical Insight)' : 'Academic Concept Insight'}
                    </div>
                    {activeEqInfo.explanation}
                    <div className="mt-2 text-gray-650 pt-2 border-t border-gray-100 text-[11px]">
                      {activeEqInfo.intuition}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          ) : (
            
            // SPECIAL DETACHED CHEMISTRY GAME (Rendered only when Science -> Chemistry is selected)
            <div id="chemistry-balancing-lab" className="bg-white rounded-3xl border border-gray-150 shadow-2xs overflow-hidden">
              
              <div className="bg-[#FAF8F4] border-b border-gray-150 p-5 flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-55 text-amber-900 rounded-xl">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#E07A5F] tracking-wider block">
                      {lang === 'hi' ? 'इंटरैक्टिव गतिविधि' : 'Interactive Lab Activity'}
                    </span>
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-gray-900">
                      {lang === 'hi' ? 'रासायनिक समीकरण संतुलित करें' : 'Balance the Chemical Equation'}
                    </h3>
                  </div>
                </div>
                <div className="bg-white/95 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold text-amber-800 flex items-center gap-1.5 shadow-3xs">
                  <span>🌟</span>
                  <span>{lang === 'hi' ? 'बोनस: अंक अर्जित करें' : 'Earn Study Points'}</span>
                </div>
              </div>

              <div className="p-6 space-y-6 text-left">
                <p className="text-xs text-gray-650 font-sans leading-relaxed">
                  {lang === 'hi'
                    ? 'अभिकारकों (Reactants) और उत्पादों (Products) के प्रत्येक तत्व के कुल परमाणुओं को समान बनाने के लिए सही पूर्णांक (Coefficients) भरें।'
                    : 'Type in the correct integers to balance the elements on both sides of the reaction arrow.'}
                </p>

                {/* LEVEL CONTROLLERS */}
                <div className="flex flex-wrap gap-2">
                  {chemicalQuestions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setActiveChemIndex(idx)}
                      className={`px-4 py-2 rounded-full font-sans text-xs font-bold transition-all cursor-pointer ${
                        activeChemIndex === idx
                          ? 'bg-emerald-650 text-white border-transparent shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-150 border border-gray-200'
                      }`}
                    >
                      {lang === 'hi' ? `अभ्यास ${idx + 1}: ` : `Reaction ${idx + 1}: `} {q.reactionName}
                    </button>
                  ))}
                </div>

                {/* REACTION FORMULA EDITOR PANEL */}
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center space-y-6 shadow-inner py-8">
                  
                  {scoreNotification && (
                    <div className="w-full max-w-md bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold text-center animate-bounce">
                      {scoreNotification}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-4 text-gray-800 font-mono font-black text-xl sm:text-2xl select-none">
                    
                    {/* Reactants loop */}
                    {activeQuestion.reactants.map((reactant, rIdx) => (
                      <React.Fragment key={`react-${rIdx}`}>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            max="9"
                            placeholder="?"
                            value={chemInputs[rIdx]}
                            onChange={(e) => {
                              const copy = [...chemInputs];
                              copy[rIdx] = e.target.value;
                              setChemInputs(copy);
                            }}
                            className={`w-10 h-10 rounded-xl text-center border-2 font-mono font-extrabold text-sm sm:text-base focus:outline-none transition-all ${
                              chemStatus === 'success'
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : chemStatus === 'incorrect'
                                ? 'border-rose-300 bg-rose-50 text-rose-600'
                                : 'border-slate-300 focus:border-[#E07A5F] bg-white'
                            }`}
                          />
                          <span className="bg-white/80 border border-slate-150 px-2.5 py-1 rounded-xl text-sm sm:text-base text-slate-800 font-bold shadow-3xs">
                            {reactant}
                          </span>
                        </div>
                        
                        {rIdx < activeQuestion.reactants.length - 1 && (
                          <span className="text-slate-400 font-sans text-lg">+</span>
                        )}
                      </React.Fragment>
                    ))}

                    <span className="text-[#E07A5F] px-1 font-sans text-xl sm:text-2xl">➔</span>

                    {/* Products loop */}
                    {activeQuestion.products.map((product, pIdx) => {
                      const idxInCorrectList = activeQuestion.reactants.length + pIdx;
                      return (
                        <React.Fragment key={`prod-${pIdx}`}>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              max="9"
                              placeholder="?"
                              value={chemInputs[idxInCorrectList]}
                              onChange={(e) => {
                                const copy = [...chemInputs];
                                copy[idxInCorrectList] = e.target.value;
                                setChemInputs(copy);
                              }}
                              className={`w-10 h-10 rounded-xl text-center border-2 font-mono font-extrabold text-sm sm:text-base focus:outline-none transition-all ${
                                chemStatus === 'success'
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                  : chemStatus === 'incorrect'
                                  ? 'border-rose-300 bg-rose-50 text-rose-600'
                                  : 'border-slate-300 focus:border-[#E07A5F] bg-white'
                              }`}
                            />
                            <span className="bg-white/80 border border-slate-150 px-2.5 py-1 rounded-xl text-sm sm:text-base text-slate-800 font-bold shadow-3xs">
                              {product}
                            </span>
                          </div>
                          
                          {pIdx < activeQuestion.products.length - 1 && (
                            <span className="text-slate-400 font-sans text-lg">+</span>
                          )}
                        </React.Fragment>
                      );
                    })}

                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={checkChemicalAnswer}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-sans text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{lang === 'hi' ? 'समीकरण जांचें' : 'Validate Equation'}</span>
                    </button>

                    <button
                      onClick={resetChemicalGame}
                      className="px-4 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-full font-sans text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>{lang === 'hi' ? 'रीसेट' : 'Reset'}</span>
                    </button>
                  </div>
                </div>

                {/* STUDY GUIDE HELPER */}
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-100 flex gap-3">
                  <div className="p-1 bg-amber-100 text-amber-700 rounded-lg mt-0.5 shrink-0">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-sans font-bold text-xs text-amber-800 block">
                      {lang === 'hi' ? 'समीकरण संतुलित कैसे करें?' : 'Need Help Balancing?'}
                    </span>
                    <p className="text-xs text-gray-650 leading-relaxed">
                      {activeQuestion.hint}
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
