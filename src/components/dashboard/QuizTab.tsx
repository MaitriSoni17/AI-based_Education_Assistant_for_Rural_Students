import React, { useState } from 'react';
import { LanguageCode } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { speakText, stopSpeaking } from '../../utils/speech';
import { Award, HelpCircle, BookOpen, Brain, Sparkles, AlertTriangle, CheckCircle, Flame, RefreshCw } from 'lucide-react';
import { offlineSyncManager } from '../../utils/offlineSync';

interface QuizTabProps {
  lang: LanguageCode;
}

interface CustomQuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

const GENERAL_QUIZZES = [
  {
    id: 'sci-env',
    title: 'Earth & Environment Quiz 🌍',
    subject: 'Science',
    difficulty: 'Easy',
    questions: [
      {
        question: "Which of the following is essential for standard plant growth?",
        options: ["Cold Soda", "Salt Water", "Sunlight & Water", "White Paint"],
        answerIndex: 2,
        explanation: "Plants require light from the sun, water from the soil, and minerals to photosynthesize and grow robustly!"
      },
      {
        question: "What is gaseous atmosphere layer around the Earth called?",
        options: ["Atmosphere", "Lithosphere", "Water tank", "Glass cover"],
        answerIndex: 0,
        explanation: "The atmosphere is the envelope of gases surrounding the earth, keeping it warm and breathable!"
      },
      {
        question: "Which gas do plants absorb from the air to make food?",
        options: ["Nitrogen", "Oxygen", "Carbon Dioxide", "Helium"],
        answerIndex: 2,
        explanation: "Plants absorb carbon dioxide from the air and release oxygen during the process of photosynthesis."
      },
      {
        question: "What is the primary source of energy for all living things on Earth?",
        options: ["Electricity", "The Moon", "The Sun", "Windmills"],
        answerIndex: 2,
        explanation: "The Sun provides light and heat energy, which plants use to make food, supporting the entire food chain."
      },
      {
        question: "What percentage of the Earth's surface is covered with water?",
        options: ["About 30%", "About 50%", "About 71%", "About 95%"],
        answerIndex: 2,
        explanation: "About 71% of the Earth's surface is water-covered, mostly by oceans."
      },
      {
        question: "Which of these is a renewable source of energy?",
        options: ["Coal", "Petroleum", "Wind Power", "Natural Gas"],
        answerIndex: 2,
        explanation: "Wind power is renewable because wind is constantly replenished naturally and never runs out."
      },
      {
        question: "What process turns liquid water into water vapor?",
        options: ["Condensation", "Evaporation", "Freezing", "Precipitation"],
        answerIndex: 1,
        explanation: "Evaporation is the process where water turns from liquid to gas/vapor due to heat."
      },
      {
        question: "Which of these is the coldest layer of Earth's atmosphere?",
        options: ["Troposphere", "Stratosphere", "Mesosphere", "Thermosphere"],
        answerIndex: 2,
        explanation: "The mesosphere is the coldest layer of Earth's atmosphere, with temperatures dropping below -90°C."
      },
      {
        question: "What do we call rain that contains harmful chemicals from pollution?",
        options: ["Acid Rain", "Chemical Rain", "Smoggy Rain", "Heavy Rain"],
        answerIndex: 0,
        explanation: "Acid rain is caused by chemical reactions from air pollutants like sulfur dioxide and nitrogen oxides."
      },
      {
        question: "Which layer of the Earth do we live on?",
        options: ["Core", "Mantle", "Crust", "Atmosphere"],
        answerIndex: 2,
        explanation: "The crust is the outermost solid shell of Earth where all life resides."
      },
      {
        question: "Which gas is most abundant in the Earth's atmosphere?",
        options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
        answerIndex: 2,
        explanation: "Nitrogen makes up about 78% of the Earth's atmosphere, followed by oxygen at 21%."
      },
      {
        question: "What do we call the process of collecting rainwater for future use?",
        options: ["Water Filtering", "Rainwater Harvesting", "Cloud Seeding", "Deltas"],
        answerIndex: 1,
        explanation: "Rainwater harvesting is the collection and storage of rain, rather than allowing it to run off."
      },
      {
        question: "What is the protective layer that shields us from harmful solar ultraviolet rays?",
        options: ["Oxygen Layer", "Carbon Shield", "Ozone Layer", "Dust Blanket"],
        answerIndex: 2,
        explanation: "The Ozone layer in the stratosphere absorbs most of the Sun's harmful ultraviolet radiation."
      },
      {
        question: "Which of these helps reduce soil erosion?",
        options: ["Cutting trees", "Planting more trees", "Overgrazing cattle", "Ploughing on steep slopes"],
        answerIndex: 1,
        explanation: "Planting trees (afforestation) helps hold the soil together with roots, preventing erosion."
      },
      {
        question: "Which planet is known as the \"Blue Planet\" because of abundant water?",
        options: ["Mars", "Venus", "Earth", "Neptune"],
        answerIndex: 2,
        explanation: "Earth is called the Blue Planet because from outer space it appears blue due to the oceans covering most of its surface."
      }
    ]
  },
  {
    id: 'math-brain',
    title: 'Speed Multiplication Puzzles 📐',
    subject: 'Mathematics',
    difficulty: 'Medium',
    questions: [
      {
        question: "If a farmer plants 4 rows of maize, and each row has 9 plants, how many plants are there in total?",
        options: ["13 plants", "36 plants", "40 plants", "32 plants"],
        answerIndex: 1,
        explanation: "Multiplying 4 times 9 (4 x 9) yields exactly 36. This is fast multiplication!"
      },
      {
        question: "Solve: (7 x 3) + 5",
        options: ["26", "21", "15", "30"],
        answerIndex: 0,
        explanation: "7 times 3 equals 21. Adding 5 yields 26!"
      },
      {
        question: "If 5 goats eat 3 kg of fodder each daily, how much fodder do they eat in total per day?",
        options: ["8 kg", "15 kg", "18 kg", "25 kg"],
        answerIndex: 1,
        explanation: "5 goats times 3 kg each equals 15 kg of fodder in total."
      },
      {
        question: "A tractor travels at 12 km per hour. How far does it travel in 3 hours?",
        options: ["15 km", "24 km", "36 km", "48 km"],
        answerIndex: 2,
        explanation: "Distance equals speed multiplied by time: 12 km/h x 3 hours = 36 km."
      },
      {
        question: "If 1 sack of rice weighs 10 kg, how much do 8 sacks weigh?",
        options: ["18 kg", "70 kg", "80 kg", "100 kg"],
        answerIndex: 2,
        explanation: "8 sacks x 10 kg per sack = 80 kg."
      },
      {
        question: "A box contains 6 rows of eggs, with 6 eggs in each row. How many eggs in total?",
        options: ["12 eggs", "30 eggs", "36 eggs", "42 eggs"],
        answerIndex: 2,
        explanation: "6 rows times 6 eggs per row equals 36 eggs."
      },
      {
        question: "Solve: 9 x 8",
        options: ["64", "72", "81", "90"],
        answerIndex: 1,
        explanation: "9 times 8 equals exactly 72."
      },
      {
        question: "If a student solves 5 math problems every day for 7 days, how many problems are solved?",
        options: ["12", "30", "35", "40"],
        answerIndex: 2,
        explanation: "5 problems per day x 7 days = 35 problems solved."
      },
      {
        question: "A milkman has 4 cans. Each can has 15 liters of milk. How much milk in total?",
        options: ["45 liters", "50 liters", "60 liters", "75 liters"],
        answerIndex: 2,
        explanation: "4 cans x 15 liters per can = 60 liters of milk."
      },
      {
        question: "Solve: (10 x 5) - 8",
        options: ["40", "42", "48", "50"],
        answerIndex: 1,
        explanation: "10 times 5 is 50. Subtracting 8 gives 42."
      },
      {
        question: "If 3 pens cost 15 rupees, how much do 12 pens cost?",
        options: ["30 rupees", "45 rupees", "60 rupees", "75 rupees"],
        answerIndex: 2,
        explanation: "If 3 pens cost 15, then 1 pen costs 5. Therefore, 12 pens cost 12 x 5 = 60 rupees."
      },
      {
        question: "Solve: 11 x 9",
        options: ["90", "99", "110", "121"],
        answerIndex: 1,
        explanation: "11 multiplied by 9 is 99."
      },
      {
        question: "A garden has 5 rows of rose plants. Each row has 8 plants. How many plants in total?",
        options: ["13", "35", "40", "45"],
        answerIndex: 2,
        explanation: "5 rows x 8 plants per row = 40 rose plants."
      },
      {
        question: "Solve: (6 x 6) + 4",
        options: ["36", "38", "40", "44"],
        answerIndex: 2,
        explanation: "6 times 6 is 36. Adding 4 gives 40."
      },
      {
        question: "If you divide 100 apples equally among 5 families, how many apples does each family get?",
        options: ["15 apples", "20 apples", "25 apples", "30 apples"],
        answerIndex: 1,
        explanation: "100 divided by 5 equals exactly 20 apples per family."
      }
    ]
  },
  {
    id: 'lang-spell',
    title: 'Spelling Bees & Homophones 🗣️',
    subject: 'Languages',
    difficulty: 'Easy',
    questions: [
      {
        question: "Which word means 'correct' and is also the opposite of 'left'?",
        options: ["Write", "Rite", "Right", "Writ"],
        answerIndex: 2,
        explanation: "'Right' is spelled R-I-G-H-T and denotes correctness or directions!"
      },
      {
        question: "Complete the spelling: AC_C_DE_T (unplanned event)",
        options: ["O, I, N", "C, I, N", "C, I, T", "K, I, D"],
        answerIndex: 1,
        explanation: "The correct word is ACCIDENT: A-C-C-I-D-E-N-T."
      },
      {
        question: "Which word is a homophone of 'see' (to look) but means a large body of salt water?",
        options: ["Sea", "Ski", "She", "Sigh"],
        answerIndex: 0,
        explanation: "The 'Sea' is a vast body of saltwater, pronounced exactly like the verb 'see'."
      },
      {
        question: "Which of the following words is spelled correctly?",
        options: ["Recieve", "Receive", "Receve", "Reseive"],
        answerIndex: 1,
        explanation: "Remember the spelling rule: 'i before e except after c'. So it is R-E-C-E-I-V-E."
      },
      {
        question: "What is the opposite of the word 'Assemble' (to bring together)?",
        options: ["Collect", "Disperse", "Connect", "Build"],
        answerIndex: 1,
        explanation: "To disperse means to scatter or spread widely, which is the opposite of assemble."
      },
      {
        question: "Complete the word: B_A_T_F_L (very pretty)",
        options: ["E, U, I, U", "E, A, I, U", "A, E, I, U", "E, U, I, O"],
        answerIndex: 0,
        explanation: "The correct letters are E, U, I, U to complete BEAUTIFUL."
      },
      {
        question: "Which word is a homophone of 'know' (have knowledge of) but means the number 0?",
        options: ["Now", "New", "No", "Not"],
        answerIndex: 2,
        explanation: "'No' is pronounced the same as 'know' in English but signifies negation/zero."
      },
      {
        question: "What is the past tense of the verb 'teach'?",
        options: ["Teached", "Taught", "Tought", "Teach"],
        answerIndex: 1,
        explanation: "The past tense of teach is taught (T-A-U-G-H-T), which is an irregular verb."
      },
      {
        question: "Complete the spelling: K_N_W_E_G_E (information gained)",
        options: ["O, L, D, L", "O, L, E, D", "O, L, E, G", "A, L, E, G"],
        answerIndex: 1,
        explanation: "The correct letters complete KNOWLEDGE: K-N-O-W-L-E-D-G-E."
      },
      {
        question: "Which word means 'quiet/undisturbed' and is a homophone of 'piece'?",
        options: ["Pace", "Peas", "Peace", "Peak"],
        answerIndex: 2,
        explanation: "'Peace' means calm and harmony, and is pronounced identically to 'piece' (a part of something)."
      },
      {
        question: "Which prefix makes the word 'happy' mean 'not happy'?",
        options: ["Dis-", "Im-", "Un-", "Mis-"],
        answerIndex: 2,
        explanation: "Adding the prefix 'un-' makes the word 'unhappy', which means not happy."
      },
      {
        question: "Select the correct spelling:",
        options: ["Tomorrow", "To-morrow", "Tommorow", "Tomorow"],
        answerIndex: 0,
        explanation: "Tomorrow is spelled with one 'm' and double 'r': T-O-M-O-R-R-O-W."
      },
      {
        question: "Complete the sentence: \"The birds fly ___ the sky.\"",
        options: ["on", "at", "in", "with"],
        answerIndex: 2,
        explanation: "We use the preposition 'in' when referring to flight within the boundaries of the sky."
      },
      {
        question: "What is a word that means the same as 'Quick' (synonym)?",
        options: ["Slow", "Fast", "Heavy", "Deep"],
        answerIndex: 1,
        explanation: "Fast and quick are synonyms, meaning moving or capable of moving at high speed."
      },
      {
        question: "What is the plural of 'child'?",
        options: ["Childs", "Childrens", "Children", "Childes"],
        answerIndex: 2,
        explanation: "The plural form of 'child' is 'children'. It is an irregular plural."
      }
    ]
  },
  {
    id: 'gk-animals',
    title: 'Wonderful Animal Kingdom 🦁',
    subject: 'General Knowledge',
    difficulty: 'Easy',
    questions: [
      {
        question: "Which mammal is famous for having a long trunk and big ears?",
        options: ["Kangaroo", "Lion", "Giraffe", "Elephant"],
        answerIndex: 3,
        explanation: "Elephants use their long trunk for drinking, smelling, bathing, and picking food!"
      },
      {
        question: "Which bird is known as the national bird of India and has beautiful blue-green feathers?",
        options: ["Parrot", "Peacock", "Eagle", "Sparrow"],
        answerIndex: 1,
        explanation: "The Peacock is India's national bird, celebrated for its colorful plumage and dance during rains."
      },
      {
        question: "Which animal is called the \"Ship of the Desert\"?",
        options: ["Camel", "Horse", "Donkey", "Yak"],
        answerIndex: 0,
        explanation: "Camels can survive without water for many days and travel easily over sandy deserts."
      },
      {
        question: "Which is the tallest mammal on Earth?",
        options: ["Elephant", "Giraffe", "Hippo", "Bear"],
        answerIndex: 1,
        explanation: "Giraffes are the tallest mammals, using their long necks to eat leaves from high tree branches."
      },
      {
        question: "Which animal is known as the king of the jungle?",
        options: ["Tiger", "Lion", "Cheetah", "Elephant"],
        answerIndex: 1,
        explanation: "The Lion is traditionally called the King of the Jungle due to its majestic appearance and strength."
      },
      {
        question: "What is the only mammal capable of true flight?",
        options: ["Ostrich", "Bat", "Flying Squirrel", "Eagle"],
        answerIndex: 1,
        explanation: "Bats are the only mammals that are capable of true, simulated flight."
      },
      {
        question: "Which animal can live both on land and in water?",
        options: ["Fish", "Frog", "Lizard", "Rabbit"],
        answerIndex: 1,
        explanation: "Frogs are amphibians, meaning they can survive both on land and in water."
      },
      {
        question: "Which is the fastest land animal?",
        options: ["Cheetah", "Lion", "Horse", "Antelope"],
        answerIndex: 0,
        explanation: "The Cheetah can reach speeds of up to 120 km/h, making it the fastest animal on land."
      },
      {
        question: "Which animal carries its baby in a pouch?",
        options: ["Koala", "Monkey", "Kangaroo", "Panda"],
        answerIndex: 2,
        explanation: "Kangaroos are marsupials; they carry their underdeveloped young in a specialized pouch."
      },
      {
        question: "What bird is famous for its wisdom and is active at night?",
        options: ["Owl", "Crow", "Pigeon", "Woodpecker"],
        answerIndex: 0,
        explanation: "Owls are nocturnal birds of prey, often associated with wisdom in folktales."
      },
      {
        question: "Which sea creature has eight arms?",
        options: ["Jellyfish", "Starfish", "Octopus", "Shark"],
        answerIndex: 2,
        explanation: "An octopus has eight arms (tentacles) lined with suction cups for grasping."
      },
      {
        question: "Which animal produces wool?",
        options: ["Cow", "Goat", "Sheep", "Horse"],
        answerIndex: 2,
        explanation: "Sheep grow thick woolly coats which are sheared to make woolen clothing."
      },
      {
        question: "Which insect produces honey?",
        options: ["Butterfly", "Honeybee", "Ant", "Mosquito"],
        answerIndex: 1,
        explanation: "Honeybees collect nectar from flowers and process it into sweet honey inside their hives."
      },
      {
        question: "What is the largest animal on Earth?",
        options: ["Elephant", "Blue Whale", "Dinosaur", "Giant Squid"],
        answerIndex: 1,
        explanation: "The Blue Whale is the largest animal ever known to have lived on Earth, even larger than any dinosaur."
      },
      {
        question: "Which animal has black and white stripes on its body?",
        options: ["Zebra", "Tiger", "Leopard", "Panda"],
        answerIndex: 0,
        explanation: "Zebras have distinctive black and white striped coats, unique to each individual."
      }
    ]
  }
];

const SURE_ANSWER_LABELS: Record<string, string> = {
  en: "Sure Answer ✔️",
  hi: "उत्तर पक्का करें ✔️",
  gu: "જવાબ પાકો કરો ✔️",
  mr: "उत्तर निश्चित करा ✔️",
  ta: "பதிலை உறுதிப்படுத்துக ✔️",
  te: "సమాధానం ఖరారు చేయండి ✔️"
};

const DIFFICULTY_LABELS: Record<string, Record<string, string>> = {
  en: { easy: "🟢 Easy", medium: "🟡 Medium", hard: "🔴 Hard" },
  hi: { easy: "🟢 आसान", medium: "🟡 मध्यम", hard: "🔴 कठिन" },
  gu: { easy: "🟢 સરળ", medium: "🟡 મધ્યમ", hard: "🔴 કઠિન" },
  mr: { easy: "🟢 सोपे", medium: "🟡 मध्यम", hard: "🔴 कठीण" },
  ta: { easy: "🟢 எளிது", medium: "🟡 நடுத்தரம்", hard: "🔴 கடினம்" },
  te: { easy: "🟢 సులభం", medium: "🟡 మధ్యమం", hard: "🔴 కఠినం" }
};

const getDifficultyBadge = (difficulty: string | undefined, lang: string) => {
  if (!difficulty) return null;
  const key = difficulty.toLowerCase();
  const labels = DIFFICULTY_LABELS[lang] || DIFFICULTY_LABELS['en'];
  const text = labels[key] || difficulty;

  let colorClasses = "bg-gray-50 text-gray-650 border-gray-200";
  if (key === 'easy') {
    colorClasses = "bg-emerald-50 text-emerald-800 border-emerald-250";
  } else if (key === 'medium') {
    colorClasses = "bg-amber-50 text-amber-800 border-amber-250";
  } else if (key === 'hard') {
    colorClasses = "bg-rose-50 text-rose-800 border-rose-250";
  }

  return (
    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold tracking-wider uppercase inline-flex items-center gap-1 ${colorClasses}`}>
      {text}
    </span>
  );
};

const LENGTH_SELECTOR_LABELS: Record<string, string> = {
  en: "🎯 Choose Quiz Length",
  hi: "🎯 प्रश्नोत्तरी की लंबाई चुनें",
  gu: "🎯 પ્રશ્નોત્તરીની લંબાઈ પસંદ કરો",
  mr: "🎯 प्रश्नमंजुषा लांबी निवडा",
  ta: "🎯 வினாடி வினா நீளத்தைத் தேர்ந்தெடுக்கவும்",
  te: "🎯 క్విజ్ నిడివిని ఎంచుకోండి"
};

const LENGTH_OPTIONS_LABELS: Record<string, Record<number, string>> = {
  en: { 5: "5 Questions", 10: "10 Questions", 15: "15 Questions" },
  hi: { 5: "5 प्रश्न", 10: "10 प्रश्न", 15: "15 प्रश्न" },
  gu: { 5: "5 પ્રશ્નો", 10: "10 પ્રશ્નો", 15: "15 પ્રશ્નો" },
  mr: { 5: "5 प्रश्न", 10: "10 प्रश्न", 15: "15 प्रश्न" },
  ta: { 5: "5 கேள்விகள்", 10: "10 கேள்விகள்", 15: "15 கேள்விகள்" },
  te: { 5: "5 ప్రశ్నలు", 10: "10 ప్రశ్నలు", 15: "15 ప్రశ్నలు" }
};

const DIFFICULTY_SELECTOR_LABELS: Record<string, string> = {
  en: "⚡ Choose Quiz Difficulty",
  hi: "⚡ प्रश्नोत्तरी कठिनाई चुनें",
  gu: "⚡ પ્રશ્નોત્તરી મુશ્કેલી પસંદ કરો",
  mr: "⚡ प्रश्नमंजुषा काठिण्य पातळी निवडा",
  ta: "⚡ வினாடி வினா கடினத்தன்மையைத் தேர்ந்தெடுக்கவும்",
  te: "⚡ క్విజ్ కఠినత్వాన్ని ఎంచుకోండి"
};

const DIFFICULTY_OPTIONS_LABELS: Record<string, Record<string, string>> = {
  en: { easy: "🟢 Easy", medium: "🟡 Medium", hard: "🔴 Hard" },
  hi: { easy: "🟢 आसान", medium: "🟡 मध्यम", hard: "🔴 कठिन" },
  gu: { easy: "🟢 સરળ", medium: "🟡 મધ્યમ", hard: "🔴 કઠિન" },
  mr: { easy: "🟢 सोपे", medium: "🟡 मध्यम", hard: "🔴 कठीण" },
  ta: { easy: "🟢 எளிது", medium: "🟡 நடுத்தரம்", hard: "🔴 கடினம்" },
  te: { easy: "🟢 సులభం", medium: "🟡 మధ్యమం", hard: "🔴 కఠినం" }
};

const generateCustomQuestions = (topic: string, count: number) => {
  const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
  const templates = [
    {
      question: `Which basic school concept best relates to understanding "${capitalizedTopic}"?`,
      options: ["Logical observation & rules", "Throwing stones", "Sleeping early", "Ignoring lessons"],
      answerIndex: 0,
      explanation: `Understanding ${capitalizedTopic} is rooted in systematic scientific inquiry, step-by-step observation, and logic!`
    },
    {
      question: `Which factor is most likely to change or affect "${capitalizedTopic}"?`,
      options: ["The date on calendar", "Controlled research & core heat factors", "The color of study books", "Loud stadium music"],
      answerIndex: 1,
      explanation: "In science and research, temperature shifts and controlled logical testing are paramount to determining outcomes."
    },
    {
      question: `Identify the true statement regarding "${capitalizedTopic}":`,
      options: ["It can be studied with interactive guides", "It's a military secret", "It was invented this week", "It is illegal to learn"],
      answerIndex: 0,
      explanation: "India's rural curriculums encourage students to read interactive tutorials to digest complex modern concepts!"
    },
    {
      question: `What is the ultimate goal of learning about "${capitalizedTopic}"?`,
      options: ["To pass exams & solve real-world village problems", "To gain super powers", "To argue with neighbors", "To build a movie theater"],
      answerIndex: 0,
      explanation: `Education aims to expand critical thinking so you can apply your knowledge of ${capitalizedTopic} to local innovations!`
    },
    {
      question: `If a teacher asks you to write an essay on "${capitalizedTopic}", where should you start?`,
      options: ["By defining the core principles and history", "By copying a friend's homework", "By drawing random circles", "By waiting until next year"],
      answerIndex: 0,
      explanation: `Structuring your essay on ${capitalizedTopic} by starting with definitions and core rules makes it highly clear and readable.`
    },
    {
      question: `Which tool is most useful for investigating "${capitalizedTopic}"?`,
      options: ["A hammer", "Careful measurement & analytical thinking", "A gold coin", "A deck of cards"],
      answerIndex: 1,
      explanation: `Science relies on precise measurements and critical thinking to unlock secrets of ${capitalizedTopic}.`
    },
    {
      question: `How does "${capitalizedTopic}" benefit our community or village life?`,
      options: ["By helping us manage crops, soil, and local resources better", "By changing the weather instantly", "By making gold out of iron", "It does not benefit us at all"],
      answerIndex: 0,
      explanation: `Applying academic knowledge like ${capitalizedTopic} allows smart water, crop, and sanitation management!`
    },
    {
      question: `What is a common mistake when studying "${capitalizedTopic}"?`,
      options: ["Memorizing answers without understanding the underlying logic", "Asking too many questions", "Taking neat handwritten notes", "Discussing ideas with friends"],
      answerIndex: 0,
      explanation: `Rote memorization fails to build lasting knowledge. True learners understand the 'why' behind ${capitalizedTopic}.`
    },
    {
      question: `How can we describe a student who is excellent at "${capitalizedTopic}"?`,
      options: ["A curious explorer who asks questions", "Someone who reads fast without thinking", "A student who avoids homework", "Someone who knows everything but never shares"],
      answerIndex: 0,
      explanation: `Curiosity and sharing insights are the marks of a true rural scholar mastering ${capitalizedTopic}.`
    },
    {
      question: `What role does observation play in understanding "${capitalizedTopic}"?`,
      options: ["It is the first step of the scientific method", "It is totally useless", "It is only for experts with expensive microscopes", "It is done only at night"],
      answerIndex: 0,
      explanation: `Observation is crucial. Anyone can observe patterns of ${capitalizedTopic} in nature or everyday tasks!`
    },
    {
      question: `If you combine "${capitalizedTopic}" with mathematics, what do you get?`,
      options: ["Precise data models and clear calculations", "A confusing mess", "An illegal formula", "A game of chess"],
      answerIndex: 0,
      explanation: `Mathematics provides the precise language and tools to measure and solve ${capitalizedTopic} puzzles.`
    },
    {
      question: `Which of the following is most essential to master "${capitalizedTopic}"?`,
      options: ["Regular practice and problem solving", "Expensive computer screens", "Going to the city", "Luck"],
      answerIndex: 0,
      explanation: `Consistency is key. Daily practice of ${capitalizedTopic} reinforces neural pathways and builds confidence.`
    },
    {
      question: `Why do schools emphasize studying "${capitalizedTopic}"?`,
      options: ["To build analytical skills and scientific literacy", "To keep kids busy all day", "Because it is required by law in space", "To sell textbooks"],
      answerIndex: 0,
      explanation: `Studying topics like ${capitalizedTopic} develops critical brain muscles and prepares you for secondary school success!`
    },
    {
      question: `What is the best way to help a classmate struggling with "${capitalizedTopic}"?`,
      options: ["Explain the concept using a simple daily life example", "Give them the answer keys", "Tell them it's too hard for them", "Ignore them and play outside"],
      answerIndex: 0,
      explanation: `Peer teaching is extremely powerful. Using simple village analogies helps make ${capitalizedTopic} click!`
    },
    {
      question: `Which of the following is a primary attribute of "${capitalizedTopic}"?`,
      options: ["It follows standard laws of nature and science", "It only exists in fantasy stories", "It is completely random and unpredictable", "It depends on the time of day"],
      answerIndex: 0,
      explanation: `Everything in the natural world, including ${capitalizedTopic}, operates under logical laws of physics and nature.`
    }
  ];

  return templates.slice(0, count);
};

const getFilteredQuizQuestions = (
  questions: any[],
  requestedDifficulty: 'easy' | 'medium' | 'hard',
  limit: number
) => {
  // First assign actual difficulty tags to each question programmatically if not present
  const withDifficulty = questions.map((q, idx) => {
    let questionDiff: 'easy' | 'medium' | 'hard' = 'easy';
    if (idx >= 5 && idx < 10) {
      questionDiff = 'medium';
    } else if (idx >= 10) {
      questionDiff = 'hard';
    }
    return { ...q, difficulty: q.difficulty || questionDiff };
  });

  // Filter or group questions
  const primaryMatch = withDifficulty.filter(q => q.difficulty.toLowerCase() === requestedDifficulty.toLowerCase());
  
  // Set up fallbacks to ensure we always satisfy the requested limit
  const remaining = withDifficulty.filter(q => q.difficulty.toLowerCase() !== requestedDifficulty.toLowerCase());
  
  // Sort remaining to prioritize close difficulty levels
  remaining.sort((a, b) => {
    const diffOrder = { easy: 0, medium: 1, hard: 2 };
    const aVal = diffOrder[a.difficulty as 'easy' | 'medium' | 'hard'] || 0;
    const bVal = diffOrder[b.difficulty as 'easy' | 'medium' | 'hard'] || 0;
    const targetVal = diffOrder[requestedDifficulty];
    return Math.abs(aVal - targetVal) - Math.abs(bVal - targetVal);
  });

  return [...primaryMatch, ...remaining].slice(0, limit);
};

export default function QuizTab({ lang }: QuizTabProps) {
  // Global cumulative states
  const [totalQuizPoints, setTotalQuizPoints] = useState(() => {
    return Number(localStorage.getItem('quizzes_total_points')) || 40;
  });

  // Current active quiz states
  const [activeQuiz, setActiveQuiz] = useState<typeof GENERAL_QUIZZES[0] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [tempSelectedOpt, setTempSelectedOpt] = useState<number | null>(null);
  const [roundMinsScore, setRoundMinsScore] = useState(0);
  const [roundFinished, setRoundFinished] = useState(false);

  // Dynamic question count state (5, 10, or 15)
  const [quizLength, setQuizLength] = useState<number>(5);

  // Dynamic question difficulty state ('easy', 'medium', or 'hard')
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  // Creative "Quiz Generator" states
  const [customTopic, setCustomTopic] = useState('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

  const startQuizDeck = (quiz: typeof GENERAL_QUIZZES[0]) => {
    const tailoredQuestions = getFilteredQuizQuestions(quiz.questions, quizDifficulty, quizLength);
    setActiveQuiz({
      ...quiz,
      difficulty: quizDifficulty.charAt(0).toUpperCase() + quizDifficulty.slice(1),
      questions: tailoredQuestions
    });
    setCurrentQuestionIndex(0);
    setSelectedOpt(null);
    setTempSelectedOpt(null);
    setRoundMinsScore(0);
    setRoundFinished(false);
  };

  const handleOptSelect = (optIdx: number) => {
    if (selectedOpt !== null || !activeQuiz) return;
    setTempSelectedOpt(optIdx);
  };

  const handleConfirmAnswer = () => {
    if (tempSelectedOpt === null || selectedOpt !== null || !activeQuiz) return;
    
    const optIdx = tempSelectedOpt;
    setSelectedOpt(optIdx);
    
    const isCorrect = optIdx === activeQuiz.questions[currentQuestionIndex].answerIndex;
    
    // Play voice feedback based on selection
    if (isCorrect) {
      setRoundMinsScore(prev => prev + 1);
      speakText("Wonderful! You hit the correct answer.", lang, "Swami AI", "🤖 Swami AI");
    } else {
      speakText("Nice try! Read the explanation below to learn.", lang, "Swami AI", "🤖 Swami AI");
    }
  };

  const handleNextQ = () => {
    setSelectedOpt(null);
    setTempSelectedOpt(null);
    if (!activeQuiz) return;

    if (currentQuestionIndex + 1 < activeQuiz.questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setRoundFinished(true);
      // Update global quiz points: +15 points for passing!
      const pointsGain = roundMinsScore * 10 + (roundMinsScore === activeQuiz.questions.length ? 15 : 0);
      const updatedPoints = totalQuizPoints + pointsGain;
      setTotalQuizPoints(updatedPoints);
      localStorage.setItem('quizzes_total_points', String(updatedPoints));

      // Reconcile and buffer score records if in offline cache mode
      if (!offlineSyncManager.isOnline()) {
        offlineSyncManager.queuePendingProgress('quiz_points', pointsGain);
      }
    }
  };

  const handleGenerateCustomQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim()) return;

    setIsGeneratingCustom(true);
    speakText(`Assembling quiz questions on ${customTopic}...`, lang, "Swami AI", "🤖 Swami AI");

    setTimeout(() => {
      const capitalizedTopic = customTopic.charAt(0).toUpperCase() + customTopic.slice(1);
      
      const customQuiz = {
        id: 'cust-' + Math.random().toString(36).substring(2, 5),
        title: `${capitalizedTopic} Genius Pack 🧠`,
        subject: 'Custom AI Science',
        difficulty: quizDifficulty.charAt(0).toUpperCase() + quizDifficulty.slice(1),
        questions: generateCustomQuestions(customTopic, quizLength)
      };

      setIsGeneratingCustom(false);
      setActiveQuiz(customQuiz);
      setCurrentQuestionIndex(0);
      setSelectedOpt(null);
      setTempSelectedOpt(null);
      setRoundMinsScore(0);
      setRoundFinished(false);
      setCustomTopic('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. QUIZ HIGHLIGHTS HEADER PANEL */}
      <div className="bg-white rounded-3xl border border-gray-150 p-5 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 text-left">
        <div className="space-y-1">
          <h2 className="font-display font-extrabold text-lg text-[#3D405B] flex items-center gap-2">
            <Brain className="h-5 w-5 text-amber-500 animate-pulse" />
            Interactive Testing Hall
          </h2>
          <p className="text-xs text-gray-400">Play standard school challenges or draft Custom AI Games about raw topics!</p>
        </div>

        <div className="bg-gradient-to-tr from-[#3D405B] to-[#4D506F] text-white rounded-2xl p-3 px-4 flex items-center gap-3 shrink-0 shadow-2xs">
          <Award className="h-6 w-6 text-amber-300 animate-bounce" />
          <div className="font-mono">
            <div className="text-[9px] text-[#F2CC8F] font-black uppercase tracking-wider">Cumulative Quiz Score</div>
            <div className="text-base font-bold">{totalQuizPoints} points cumulative</div>
          </div>
        </div>
      </div>

      {activeQuiz === null ? (
        <div className="space-y-6">
          {/* 🎯 CONFIGURATION CONTROLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            {/* 🎯 SELECT QUIZ LENGTH PANEL */}
            <div className="bg-gradient-to-r from-orange-50/75 via-white to-amber-50/75 rounded-2xl border border-[#F2CC8F]/30 p-4 shadow-3xs flex flex-col sm:flex-row justify-between items-center gap-4 text-left">
              <div className="space-y-1">
                <h3 className="font-sans font-extrabold text-xs sm:text-sm text-[#3D405B] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#E07A5F]" />
                  {LENGTH_SELECTOR_LABELS[lang] || LENGTH_SELECTOR_LABELS['en']}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-gray-400">
                  Choose how many questions you want to solve.
                </p>
              </div>
              <div className="flex gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-150 shadow-2xs shrink-0 w-full sm:w-auto justify-center">
                {[5, 10, 15].map((len) => (
                  <button
                    key={len}
                    onClick={() => setQuizLength(len)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      quizLength === len
                        ? "bg-[#E07A5F] text-white shadow-2xs scale-102"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {LENGTH_OPTIONS_LABELS[lang]?.[len] || LENGTH_OPTIONS_LABELS['en'][len]}
                  </button>
                ))}
              </div>
            </div>

            {/* ⚡ SELECT QUIZ DIFFICULTY PANEL */}
            <div className="bg-gradient-to-r from-teal-50/75 via-white to-emerald-50/75 rounded-2xl border border-[#81B29A]/30 p-4 shadow-3xs flex flex-col sm:flex-row justify-between items-center gap-4 text-left">
              <div className="space-y-1">
                <h3 className="font-sans font-extrabold text-xs sm:text-sm text-[#3D405B] flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-[#81B29A]" />
                  {DIFFICULTY_SELECTOR_LABELS[lang] || DIFFICULTY_SELECTOR_LABELS['en']}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-gray-400">
                  Select difficulty level to adapt the questions.
                </p>
              </div>
              <div className="flex gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-150 shadow-2xs shrink-0 w-full sm:w-auto justify-center">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setQuizDifficulty(diff)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      quizDifficulty === diff
                        ? diff === 'easy'
                          ? "bg-emerald-600 text-white shadow-2xs scale-102"
                          : diff === 'medium'
                            ? "bg-amber-500 text-white shadow-2xs scale-102"
                            : "bg-rose-600 text-white shadow-2xs scale-102"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {DIFFICULTY_OPTIONS_LABELS[lang]?.[diff] || DIFFICULTY_OPTIONS_LABELS['en'][diff]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* STATIC SUBJECT DECKS (Left) */}
            <div className="lg:col-span-8 space-y-4">
              <h3 className="font-display font-extrabold text-xs text-gray-500 uppercase tracking-widest text-left">
                Standard Subjects Challenges
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GENERAL_QUIZZES.map((quiz) => (
                  <div 
                    key={quiz.id}
                    className="bg-white rounded-2xl border border-gray-150 p-4 shadow-3xs flex flex-col justify-between hover:border-[#81B29A] hover:shadow-2xs transition-all text-left group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase">
                        <span className="p-1 px-2 rounded-sm bg-gray-100 text-gray-650">{quiz.subject}</span>
                        {getDifficultyBadge(quizDifficulty, lang)}
                      </div>
                      <h4 className="font-display font-extrabold text-sm text-[#3D405B] group-hover:text-[#E07A5F] transition-colors leading-snug">
                        {quiz.title}
                      </h4>
                      <p className="text-[11px] text-gray-450 pr-4">
                        {quizLength} question concept checkpoints
                      </p>
                    </div>
                    
                    <button
                      onClick={() => startQuizDeck(quiz)}
                      className="w-full mt-4 py-2 bg-[#FAF8F4] border border-[#F2CC8F]/50 group-hover:bg-[#E07A5F] group-hover:text-white group-hover:border-transparent rounded-xl text-xs font-sans font-bold text-[#3D405B] text-center transition-all cursor-pointer"
                    >
                      Start Game 🎬
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI QUIZ GENERATOR BLOCK (Right) */}
            <div className="lg:col-span-4 space-y-4 text-left">
              <h3 className="font-display font-extrabold text-xs text-gray-500 uppercase tracking-widest">
                AI Quiz Synthesizer
              </h3>

              <div className="bg-white rounded-2xl border border-[#F2CC8F]/30 p-5 shadow-3xs space-y-4">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-xs text-gray-900 flex items-center gap-1.5 uppercase">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Custom Quiz Generator
                  </h4>
                  <p className="text-[10px] text-gray-400">Type any chapter topic (e.g. Birds, Crops, Fractions) and play a custom game.</p>
                </div>

                <form onSubmit={handleGenerateCustomQuiz} className="space-y-3">
                  <input
                    type="text"
                    value={customTopic}
                    disabled={isGeneratingCustom}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="e.g. Village farming or Magnetism"
                    className="w-full p-2.5 bg-gray-50/50 rounded-xl border border-gray-200 text-xs sm:text-sm font-sans placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#E07A5F]"
                  />
                  
                  <button
                    type="submit"
                    disabled={!customTopic.trim() || isGeneratingCustom}
                    className="w-full py-2 bg-[#3D405B] hover:bg-[#2D2F44] text-white text-xs font-sans font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingCustom ? (
                      <>
                        <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                        <span>Writing custom questions...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4.5 w-4.5 text-[#F2CC8F]" />
                        <span>Assemble AI game</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* ACTIVE QUIZ VIEWPORT */
        <div className="bg-white rounded-3xl border border-gray-200 p-6 text-left max-w-2xl mx-auto space-y-5 shadow-sm">
          
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1 px-2 text-[10px] bg-amber-50 text-amber-800 rounded-sm font-bold uppercase">
                {activeQuiz.title}
              </span>
              {activeQuiz.difficulty && getDifficultyBadge(activeQuiz.difficulty, lang)}
            </div>
            
            <button
              onClick={() => { stopSpeaking(); setActiveQuiz(null); }}
              className="text-xs bg-gray-100 px-3 py-1 hover:bg-gray-200 rounded-lg font-bold font-sans cursor-pointer text-gray-500"
            >
              Exit X
            </button>
          </div>

          {!roundFinished ? (
            <div className="space-y-5">
              
              <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                <span>PROGRESS: Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
                <span className="font-bold text-[#E07A5F]">Current accuracy: {roundMinsScore}/{currentQuestionIndex}</span>
              </div>

              {/* Question Screen */}
              <div className="p-5 bg-[#FAF8F4] border border-[#F2CC8F]/30 rounded-2xl">
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold block text-gray-400">Standard Concept Probe</span>
                  {activeQuiz.difficulty && getDifficultyBadge(activeQuiz.difficulty, lang)}
                </div>
                <h4 className="font-display font-extrabold text-[#3D405B] text-sm sm:text-base leading-snug">
                  {activeQuiz.questions[currentQuestionIndex].question}
                </h4>
              </div>

              {/* Options array */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeQuiz.questions[currentQuestionIndex].options.map((opt, oIdx) => {
                  const isSelected = selectedOpt === oIdx;
                  const isCorrect = oIdx === activeQuiz.questions[currentQuestionIndex].answerIndex;
                  
                  let optStyle = "bg-white border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300";
                  if (selectedOpt !== null) {
                    if (isCorrect) {
                      optStyle = "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold";
                    } else if (isSelected) {
                      optStyle = "bg-rose-50 text-rose-800 border-rose-300 font-medium";
                    } else {
                      optStyle = "bg-white/40 text-gray-400 border-gray-100 opacity-60";
                    }
                  } else if (tempSelectedOpt === oIdx) {
                    optStyle = "bg-orange-50 text-[#E07A5F] border-[#E07A5F] ring-2 ring-[#E07A5F]/45 font-bold scale-[1.01] shadow-2xs";
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={selectedOpt !== null}
                      onClick={() => handleOptSelect(oIdx)}
                      className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm font-sans cursor-pointer transition-all ${optStyle}`}
                    >
                      <span className="font-mono font-bold mr-1">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                    </button>
                  );
                })}
              </div>

              {/* Sure Answer Button */}
              {tempSelectedOpt !== null && selectedOpt === null && (
                <div className="flex justify-center pt-2 animate-fade-in">
                  <button
                    id="sure-answer-btn"
                    onClick={handleConfirmAnswer}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#E07A5F] to-[#F2CC8F] hover:from-[#F2CC8F] hover:to-[#E07A5F] text-white font-sans font-black text-xs sm:text-sm rounded-xl cursor-pointer shadow-md active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 animate-pulse"
                  >
                    <span>{SURE_ANSWER_LABELS[lang] || "Sure Answer ✔️"}</span>
                  </button>
                </div>
              )}

              {/* Explanations reveals */}
              {selectedOpt !== null && (
                <div className="p-4 bg-amber-50/50 border border-amber-250 rounded-2xl space-y-2 animate-fade-in text-xs sm:text-sm">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5 text-xs uppercase font-mono">
                    {selectedOpt === activeQuiz.questions[currentQuestionIndex].answerIndex ? (
                      <span className="text-emerald-700">🎉 Bravo! Correct</span>
                    ) : (
                      <span className="text-rose-600">🌱 Study Point explanation</span>
                    )}
                  </div>
                  <p className="text-gray-650 leading-relaxed text-xs">
                    {activeQuiz.questions[currentQuestionIndex].explanation}
                  </p>

                  <button
                    onClick={handleNextQ}
                    className="mt-2.5 text-xs font-bold px-4 py-2 bg-[#3D405B] hover:bg-[#2D2F44] text-white rounded-lg cursor-pointer"
                  >
                    Next Question {currentQuestionIndex + 1 < activeQuiz.questions.length ? "➡️" : "🏁完成"}
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* CONGRATULATIONS PANEL */
            <div className="text-center p-6 space-y-4">
              <div className="text-5xl animate-bounce">🏆</div>
              <div className="space-y-1">
                <h4 className="font-display font-extrabold text-lg text-[#3D405B]">Challenge Complete!</h4>
                <p className="text-xs text-gray-500">
                  You scored <span className="font-bold text-emerald-600">{roundMinsScore} correct</span> answers out of {activeQuiz.questions.length} questions.
                </p>
              </div>

              <div className="bg-[#81B29A]/15 border border-[#81B29A]/20 text-gray-800 p-4 rounded-xl text-left text-xs space-y-2 max-w-sm mx-auto">
                <h5 className="font-bold flex items-center gap-1 text-emerald-700">
                  <CheckCircle className="h-4 w-4" /> Score payout rewards:
                </h5>
                <ul className="list-disc pl-5 font-mono text-[10px] text-gray-500 space-y-1 font-bold">
                  <li>Points gained: +{roundMinsScore * 10} points</li>
                  {roundMinsScore === activeQuiz.questions.length && (
                    <li className="text-amber-600">Streak clean sheet sweep bonus: +15 points!</li>
                  )}
                </ul>
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => startQuizDeck(activeQuiz)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#3D405B] font-bold text-xs rounded-xl cursor-pointer"
                >
                  Retry Game
                </button>
                <button
                  onClick={() => { stopSpeaking(); setActiveQuiz(null); }}
                  className="px-4 py-2 bg-[#3D405B] hover:bg-[#2D2F44] text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
