export interface Milestone {
  id: string;
  title: { en: string; hi: string };
  description: { en: string; hi: string };
}

export interface LearningPath {
  id: string;
  title: { en: string; hi: string };
  subject: 'Science' | 'Maths' | 'Agriculture' | 'EVS';
  grade: string;
  icon: string; // Lucide icon identifier
  description: { en: string; hi: string };
  milestones: Milestone[];
  systemInstructionBonus: string;
  starterPrompt: { en: string; hi: string };
}

export const LOCAL_LEARNING_PATHS: LearningPath[] = [
  {
    id: 'water-cycle',
    title: {
      en: 'Water Cycle & Rural Ecosystems 🌧️',
      hi: 'जल चक्र और ग्रामीण पारिस्थितिकी 🌧️'
    },
    subject: 'Science',
    grade: 'Class 5-8',
    icon: 'CloudRain',
    description: {
      en: 'Explore how rain forms, why wells fill with groundwater, and how village ponds sustain agriculture.',
      hi: 'जानें कि बारिश कैसे होती है, कुओं में पानी कहाँ से आता है, और गाँव के तालाब खेती को कैसे जीवित रखते हैं।'
    },
    starterPrompt: {
      en: 'Namaste! I have selected the "Water Cycle & Rural Ecosystems" path. Let us start with Step 1: Evaporation and River Water!',
      hi: 'नमस्ते! मैंने "जल चक्र और ग्रामीण पारिस्थितिकी" मार्ग चुना है। आइए चरण 1: वाष्पीकरण और नदी के पानी से शुरू करें!'
    },
    systemInstructionBonus: 'You are currently guiding the student through the "Water Cycle & Rural Ecosystems" learning path. Structure your lessons step-by-step. Focus first on Evaporation (milestone 1), then Condensation & Clouds (milestone 2), and finally Groundwater Conservation (milestone 3). Keep explanations grounded in simple village metaphors like boiling tea or damp soil.',
    milestones: [
      {
        id: 'wc-1',
        title: { en: 'Evaporation: Rising Vapor', hi: 'वाष्पीकरण: ऊपर उठती भाप' },
        description: {
          en: 'How the sun warms river and pond water, turning it into invisible vapor rising into the sky.',
          hi: 'सूरज कैसे नदियों और तालाबों के पानी को गर्म करता है, जिससे वह अदृश्य भाप बनकर आसमान में उड़ जाता है।'
        }
      },
      {
        id: 'wc-2',
        title: { en: 'Condensation & Clouds', hi: 'संघनन और बादलों का बनना' },
        description: {
          en: 'How tiny droplets gather together high up to create heavy rain clouds.',
          hi: 'कैसे पानी की नन्ही बूंदें आसमान में ऊपर जाकर आपस में मिलकर घने बरसाती बादल बनाती हैं।'
        }
      },
      {
        id: 'wc-3',
        title: { en: 'Precipitation & Rain', hi: 'वर्षा और वर्षा जल' },
        description: {
          en: 'How cooling brings rain to our agricultural fields and parched soil.',
          hi: 'कैसे ठंडी हवा बादलों को पिघलाकर हमारे खेतों और सूखी मिट्टी पर बारिश बरसाती है।'
        }
      },
      {
        id: 'wc-4',
        title: { en: 'Groundwater & Farming Wells', hi: 'भूजल और सिंचाई के कुएँ' },
        description: {
          en: 'How rainwater seeps deep into the soil to recharge village wells and tubewells.',
          hi: 'कैसे बारिश का पानी रिसकर ज़मीन के अंदर जाता है और हमारे कुओं और ट्यूबवेलों को पुनर्जीवित करता है।'
        }
      }
    ]
  },
  {
    id: 'speed-math',
    title: {
      en: 'Magic Speed Mathematics ✨',
      hi: 'जादुई गणित ट्रिक्स ✨'
    },
    subject: 'Maths',
    grade: 'Class 4-7',
    icon: 'Sparkles',
    description: {
      en: 'Master swift calculation techniques, fast division, and counting hacks using rural market puzzles.',
      hi: 'ग्रामीण बाजार की पहेलियों का उपयोग करके तेज गणना, त्वरित गुणा-भाग और मजेदार गणितीय ट्रिक्स सीखें।'
    },
    starterPrompt: {
      en: 'Hi! Let us embark on the "Magic Speed Mathematics" path. Teach me the easiest hack to multiply any double-digit number by 11!',
      hi: 'नमस्ते! आइए "जादुई गणित ट्रिक्स" मार्ग शुरू करें। मुझे दो अंकों की संख्या को 11 से गुणा करने की सबसे आसान ट्रिक सिखाएं!'
    },
    systemInstructionBonus: 'You are currently guiding the student through the "Magic Speed Mathematics" learning path. Teach them fast Vedic maths methods or smart calculation shortcuts. Frame calculations around local village trades (buying seed bags, counting cattle, selling milk liters). Keep the feedback highly encouraging and gamified.',
    milestones: [
      {
        id: 'sm-1',
        title: { en: 'Instant Multiplication by 11', hi: '11 से तुरंत गुणा करना' },
        description: {
          en: 'The secret sandwich trick to multiply any 2-digit number by 11 in under 3 seconds.',
          hi: 'किसी भी 2 अंकों की संख्या को 3 सेकंड से कम समय में 11 से गुणा करने की सैंडविच ट्रिक।'
        }
      },
      {
        id: 'sm-2',
        title: { en: 'Fast Multiplication by 9 & 99', hi: '9 और 99 से तीव्र गुणा' },
        description: {
          en: 'Using simple subtractions and finger patterns to multiply by nine instantly.',
          hi: 'घटाव और उंगलियों के जादू से 9 या 99 से तुरंत गुणा करने की विधि।'
        }
      },
      {
        id: 'sm-3',
        title: { en: 'Smart Division & Sharing', hi: 'स्मार्ट विभाजन और बंटवारा' },
        description: {
          en: 'Dividing grain bags, mangoes, or farm products equally among village teams.',
          hi: 'अनाज की बोरियों या आमों को गाँव की मंडलियों में बराबर-बराबर बांटने के आसान तरीके।'
        }
      }
    ]
  },
  {
    id: 'sustainable-farming',
    title: {
      en: 'Organic Agriculture & Farm Science 🌱',
      hi: 'जैविक खेती और कृषि विज्ञान 🌱'
    },
    subject: 'Agriculture',
    grade: 'Class 6-9',
    icon: 'Leaf',
    description: {
      en: 'Learn soil health secret ingredients, bio-pesticides, drip irrigation, and modern solar farming.',
      hi: 'जानें मिट्टी की सेहत का राज़, जैविक खाद, बूँद-बूँद सिंचाई और आधुनिक सोलर खेती के बारे में।'
    },
    starterPrompt: {
      en: 'Namaste! Let us begin the "Organic Agriculture & Farm Science" path. Tell me why compost is better for soil health than synthetic fertilizers!',
      hi: 'नमस्ते! आइए "जैविक खेती और कृषि विज्ञान" मार्ग शुरू करें। मुझे बताएं कि मिट्टी की सेहत के लिए रासायनिक खाद से बेहतर जैविक खाद क्यों है!'
    },
    systemInstructionBonus: 'You are currently teaching the student "Organic Agriculture & Farm Science". Highlight the science of soil nutrition (Nitrogen, Phosphorus, Potassium) and eco-friendly farming practices. Frame lessons in terms of Indian farming contexts like Kharif/Rabi crops, vermicomposting, and conserving solar energy on pumps.',
    milestones: [
      {
        id: 'ag-1',
        title: { en: 'Soil Health & Earthworms', hi: 'मिट्टी की सेहत और केंचुए' },
        description: {
          en: 'Why earthworms are a farmers best friend and how organic compost enriches soil texture.',
          hi: 'क्यों केंचुए किसानों के सबसे अच्छे दोस्त हैं और जैविक खाद मिट्टी की ताकत कैसे बढ़ाती है।'
        }
      },
      {
        id: 'ag-2',
        title: { en: 'Natural Bio-Pesticides', hi: 'प्राकृतिक जैविक कीटनाशक' },
        description: {
          en: 'Making neem spray and garlic extracts to protect crops without harmful chemical toxins.',
          hi: 'बिना जहरीले रसायनों के फसलों को बचाने के लिए नीम का पानी और प्राकृतिक काढ़ा बनाने की विधि।'
        }
      },
      {
        id: 'ag-3',
        title: { en: 'Smart Drip Irrigation', hi: 'बूँद-बूँद सिंचाई तकनीक' },
        description: {
          en: 'Conserving water by delivering moisture directly to plant roots, preventing evaporation loss.',
          hi: 'पौधों की जड़ों में सीधे पानी पहुँचाकर सिंचाई करने और पानी की भारी बचत करने का तरीका।'
        }
      }
    ]
  },
  {
    id: 'clean-energy',
    title: {
      en: 'Solar Energy & Powering Villages ☀️',
      hi: 'सौर ऊर्जा और गाँव की बिजली ☀️'
    },
    subject: 'EVS',
    grade: 'Class 5-8',
    icon: 'Sun',
    description: {
      en: 'Discover how solar cells turn sunshine into clean electricity for stoves, lights, and irrigation pumps.',
      hi: 'सीखें कि कैसे सोलर पैनल धूप को बिजली में बदलते हैं और गाँव के चूल्हों, लाइटों तथा पंपों को ऊर्जा देते हैं।'
    },
    starterPrompt: {
      en: 'Hi! Let us start the "Solar Energy & Powering Villages" learning path. How does a solar panel capture light and turn it into battery power?',
      hi: 'नमस्ते! आइए "सौर ऊर्जा और गाँव की बिजली" सीखने का मार्ग शुरू करें। सोलर पैनल धूप को पकड़कर बैटरी में बिजली कैसे भरता है?'
    },
    systemInstructionBonus: 'You are currently guiding the student through the "Solar Energy & Powering Villages" learning path. Explain how photovoltaic cells operate, stored battery power, and solar water heaters. Use village-centric examples like powering solar street lamps or solar-driven water pumps to replace costly diesel engines.',
    milestones: [
      {
        id: 'se-1',
        title: { en: 'Sunlight as a Power Source', hi: 'ऊर्जा के स्रोत के रूप में धूप' },
        description: {
          en: 'Understanding that sunshine carries immense free energy waiting to be captured.',
          hi: 'यह समझना कि धूप में अपार मुफ़्त ऊर्जा है जो हमारे घरों को रोशन कर सकती है।'
        }
      },
      {
        id: 'se-2',
        title: { en: 'How Solar Panels Work', hi: 'सोलर पैनल कैसे काम करते हैं' },
        description: {
          en: 'A simple look at the silicon cells that absorb light and generate electrical current.',
          hi: 'सिलिकॉन कोशिकाओं की सरल व्याख्या जो धूप को सोखकर बिजली का प्रवाह शुरू करती हैं।'
        }
      },
      {
        id: 'se-3',
        title: { en: 'Solar Pumps vs Diesel Pumps', hi: 'सोलर पंप बनाम डीजल इंजन' },
        description: {
          en: 'How village farmers save huge money and keep the air fresh by using sunshine to pump groundwater.',
          hi: 'कैसे गाँव के किसान डीजल का खर्च बचाकर धूप की मदद से सिंचाई पंप चला सकते हैं।'
        }
      }
    ]
  }
];
