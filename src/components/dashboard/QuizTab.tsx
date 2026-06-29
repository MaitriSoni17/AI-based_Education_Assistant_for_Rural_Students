import React, { useState, useEffect } from 'react';
import { LanguageCode, User } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { speakText, stopSpeaking } from '../../utils/speech';
import { Award, HelpCircle, BookOpen, Brain, Sparkles, AlertTriangle, CheckCircle, Flame, RefreshCw, Timer, ShieldCheck, Download, Printer, X } from 'lucide-react';
import { offlineSyncManager } from '../../utils/offlineSync';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface QuizTabProps {
  user: User;
  lang: LanguageCode;
  onNavigateToTab?: (tabId: any) => void;
  onUpdateUser: (fields: Partial<User>) => void;
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
  },
  {
    id: 'hist-heroes',
    title: 'History & Heritage Quiz 🏰',
    subject: 'History',
    difficulty: 'Medium',
    questions: [
      {
        question: "Who is lovingly referred to as the 'Father of the Nation' in India?",
        options: ["Jawaharlal Nehru", "Subhash Chandra Bose", "Mahatma Gandhi", "Bhagat Singh"],
        answerIndex: 2,
        explanation: "Mahatma Gandhi is widely honored as the Father of the Nation due to his leadership in India's non-violent independence struggle."
      },
      {
        question: "Which famous monument in Agra is made of white marble and is one of the Wonders of the World?",
        options: ["Red Fort", "Taj Mahal", "Qutub Minar", "Hawa Mahal"],
        answerIndex: 1,
        explanation: "The Taj Mahal was commissioned by Shah Jahan in 1631 to house the tomb of his favorite wife, Mumtaz Mahal."
      },
      {
        question: "Which Indian city is famously known as the 'Pink City' because of the dominant color scheme of its buildings?",
        options: ["Jaipur", "Udaipur", "Jodhpur", "Jaisalmer"],
        answerIndex: 0,
        explanation: "Jaipur, the capital of Rajasthan, was painted pink in 1876 to welcome Queen Victoria's husband, Prince Albert."
      },
      {
        question: "In which historic year did India gain freedom from British colonial rule?",
        options: ["1942", "1945", "1947", "1950"],
        answerIndex: 2,
        explanation: "India became an independent nation on August 15, 1947, ending nearly two centuries of British rule."
      },
      {
        question: "Which major festival celebrates the return of Lord Rama to Ayodhya after 14 years of exile?",
        options: ["Holi", "Diwali", "Dussehra", "Eid"],
        answerIndex: 1,
        explanation: "Diwali, the festival of lights, is celebrated by lighting lamps to symbolize the victory of light over darkness as Rama returned."
      },
      {
        question: "Who was the very first Prime Minister of independent India?",
        options: ["Lal Bahadur Shastri", "Dr. Rajendra Prasad", "Jawaharlal Nehru", "Sardar Patel"],
        answerIndex: 2,
        explanation: "Jawaharlal Nehru was the first Prime Minister of India, serving from 1947 until his death in 1964."
      },
      {
        question: "Which ancient Emperor built Ashoka Pillars and abandoned violence after the Kalinga War?",
        options: ["Chandragupta Maurya", "Emperor Ashoka", "Akbar", "Harsha"],
        answerIndex: 1,
        explanation: "Emperor Ashoka the Great embraced Buddhism and spread messages of peace, non-violence, and moral duties after witnessing the horrors of Kalinga."
      },
      {
        question: "Which legendary freedom fighter is affectionately known as 'Netaji'?",
        options: ["Bhagat Singh", "Subhash Chandra Bose", "Bal Gangadhar Tilak", "Lala Lajpat Rai"],
        answerIndex: 1,
        explanation: "Subhash Chandra Bose led the Indian National Army (INA) to fight against the British and was popularly called Netaji."
      },
      {
        question: "What is the capital city of India?",
        options: ["Mumbai", "Kolkata", "Chennai", "New Delhi"],
        answerIndex: 3,
        explanation: "New Delhi is the official capital of India, housing the seat of the legislative, executive, and judiciary branches."
      },
      {
        question: "Who composed the Indian national anthem, 'Jana Gana Mana'?",
        options: ["Bankim Chandra Chattopadhyay", "Rabindranath Tagore", "Sarojini Naidu", "Mahadevi Varma"],
        answerIndex: 1,
        explanation: "Rabindranath Tagore, a Nobel laureate, wrote 'Jana Gana Mana', which was officially adopted as the National Anthem in 1950."
      },
      {
        question: "Who is known as the 'Iron Man of India' for successfully uniting over 500 princely states?",
        options: ["Sardar Vallabhbhai Patel", "B. R. Ambedkar", "Bhagat Singh", "Chandra Shekhar Azad"],
        answerIndex: 0,
        explanation: "Sardar Vallabhbhai Patel played a monumental role in integrating princely states into the Indian Union after independence."
      },
      {
        question: "The great King Krishnadevaraya, famous for wisdom and patronage of arts, ruled which empire?",
        options: ["Mughal Empire", "Maratha Empire", "Vijayanagara Empire", "Chola Empire"],
        answerIndex: 2,
        explanation: "Krishnadevaraya was the celebrated emperor of the Vijayanagara Empire in Southern India, ruling during its golden age."
      },
      {
        question: "Who was the Chief Architect and Father of the Indian Constitution?",
        options: ["Dr. Rajendra Prasad", "Dr. B. R. Ambedkar", "Mahatma Gandhi", "Motilal Nehru"],
        answerIndex: 1,
        explanation: "Dr. Bhimrao Ramji Ambedkar served as the Chairman of the Drafting Committee for India's Constitution."
      },
      {
        question: "Which brave Queen of Jhansi fought fearlessly against British forces during the Revolt of 1857?",
        options: ["Rani Lakshmibai", "Begum Hazrat Mahal", "Rani Chennamma", "Savitribai Phule"],
        answerIndex: 0,
        explanation: "Rani Lakshmibai of Jhansi was a central leader of the 1857 uprising, fighting valiantly on horseback."
      },
      {
        question: "In which holy city did the tragic Jallianwala Bagh massacre occur in 1919?",
        options: ["Amritsar", "Lahore", "Delhi", "Jalandhar"],
        answerIndex: 0,
        explanation: "The Jallianwala Bagh massacre took place in Amritsar, Punjab, where British troops fired on an unarmed gathering celebrating Baisakhi."
      }
    ]
  },
  {
    id: 'geog-crops',
    title: 'Basic Geography & Crops 🌾',
    subject: 'Geography',
    difficulty: 'Medium',
    questions: [
      {
        question: "Which is the longest river in India, flowing from the Himalayas to the Bay of Bengal?",
        options: ["Yamuna", "Narmada", "Ganga River", "Kaveri"],
        answerIndex: 2,
        explanation: "The Ganga is the longest and most sacred river in India, supporting vast agricultural regions."
      },
      {
        question: "What is the highest mountain range in the world, forming India's northern border?",
        options: ["The Andes", "The Rockies", "The Himalayas", "The Alps"],
        answerIndex: 2,
        explanation: "The Himalayas are the highest mountains globally, acting as a natural geographic barrier for northern India."
      },
      {
        question: "Which crop is the primary staple food of Southern India, requiring deep water to grow?",
        options: ["Wheat", "Rice (Paddy)", "Millet", "Mustard"],
        answerIndex: 1,
        explanation: "Rice (Paddy) is grown in flooded clay soils and is the most widely consumed crop across South and East India."
      },
      {
        question: "Which seasonal winds bring heavy rain to India, crucial for watering farm crops?",
        options: ["The Monsoon", "The Trade Winds", "Cyclones", "Westerlies"],
        answerIndex: 0,
        explanation: "The Southwest Monsoon season (June to September) supplies over 70% of India's annual rainfall."
      },
      {
        question: "Which northern Indian state is known as the 'Land of Five Rivers'?",
        options: ["Haryana", "Punjab", "Himachal Pradesh", "Uttar Pradesh"],
        answerIndex: 1,
        explanation: "Punjab translates to the land of five waters/rivers: Sutlej, Beas, Ravi, Chenab, and Jhelum."
      },
      {
        question: "Which type of soil is dark, rich in clay, and best suited for growing cotton crops?",
        options: ["Red Soil", "Black Soil", "Sandy Soil", "Laterite Soil"],
        answerIndex: 1,
        explanation: "Black soil (also called Regur soil) has high clay content and excellent moisture-holding capacity, ideal for cotton cultivation."
      },
      {
        question: "Which river in Southern India is often called 'Dakshin Ganga' due to its size and importance?",
        options: ["Godavari", "Krishna", "Mahanadi", "Tapi"],
        answerIndex: 0,
        explanation: "The Godavari is the second-longest river in India and is revered as the southern counterpart of the Ganga."
      },
      {
        question: "Which Indian state has the longest coastline bordering the Arabian Sea?",
        options: ["Maharashtra", "Goa", "Gujarat", "Kerala"],
        answerIndex: 2,
        explanation: "Gujarat boasts the longest coastline among all Indian states, stretching over 1,600 kilometers."
      },
      {
        question: "What is the primary occupation of the majority of people living in rural India?",
        options: ["Mining", "Agriculture", "Information Technology", "Tourism"],
        answerIndex: 1,
        explanation: "Agriculture and allied activities employ over 50% of India's total workforce, particularly in rural villages."
      },
      {
        question: "Which of these is a typical Kharif crop, planted with summer monsoon rains?",
        options: ["Wheat", "Maize (Corn)", "Barley", "Gram"],
        answerIndex: 1,
        explanation: "Maize, along with rice, is a primary Kharif crop sown in June/July and harvested in autumn."
      },
      {
        question: "Which dry sandy desert covers a major portion of Western Rajasthan?",
        options: ["Gobi Desert", "Thar Desert", "Sahara Desert", "Atacama Desert"],
        answerIndex: 1,
        explanation: "The Thar Desert (Great Indian Desert) forms a natural boundary between India and Pakistan in Rajasthan."
      },
      {
        question: "Which river flows westward through a deep rift valley between Vindhya and Satpura mountains?",
        options: ["Yamuna", "Narmada", "Godavari", "Ganga"],
        answerIndex: 1,
        explanation: "The Narmada River is one of the few major Indian rivers that flow west and empty into the Arabian Sea."
      },
      {
        question: "What is the highest mountain peak located in India (under active Indian administration)?",
        options: ["Mount Everest", "K2", "Kanchenjunga", "Nanda Devi"],
        answerIndex: 2,
        explanation: "Kanchenjunga, located on the border of Sikkim and Nepal, is the third highest peak in the world and the highest in India."
      },
      {
        question: "Which of these is a winter crop (Rabi crop), harvested around March or April?",
        options: ["Rice", "Cotton", "Wheat", "Groundnut"],
        answerIndex: 2,
        explanation: "Wheat is a Rabi crop sown in October/November and harvested in dry spring months."
      },
      {
        question: "Which famous high-altitude mountain pass connects the Indian state of Sikkim with Tibet?",
        options: ["Khyber Pass", "Nathu La Pass", "Zoji La", "Rohtang Pass"],
        answerIndex: 1,
        explanation: "Nathu La is a strategic mountain pass in the Himalayas connecting Sikkim with Tibet's Chumbi Valley."
      }
    ]
  },
  {
    id: 'money-savings',
    title: 'Smart Money & Savings 🪙',
    subject: 'Financial Literacy',
    difficulty: 'Medium',
    questions: [
      {
        question: "What is the safest place to store your saved money while earning extra interest?",
        options: ["Under the bed", "In a safe Bank Account", "In a drawer", "With a neighbor"],
        answerIndex: 1,
        explanation: "Keeping money in a licensed bank account keeps it protected from theft, damage, and lets you earn interest over time."
      },
      {
        question: "What is the official currency used in India for daily transactions?",
        options: ["Rupee", "Dollar", "Yen", "Paisa"],
        answerIndex: 0,
        explanation: "The Indian Rupee (INR), represented by the symbol ₹, is the official currency of India."
      },
      {
        question: "Which plastic card allows you to withdraw cash directly from an Automated Teller Machine (ATM)?",
        options: ["Library Card", "Ration Card", "Debit Card", "Business Card"],
        answerIndex: 2,
        explanation: "A Debit Card is linked to your bank account, letting you withdraw cash or make digital payments instantly."
      },
      {
        question: "What is the primary benefit of making a monthly family budget?",
        options: ["It makes you rich instantly", "It tracks income and helps control unnecessary spending", "It stops the rain", "It lets you borrow unlimited money"],
        answerIndex: 1,
        explanation: "A budget balances your incoming cash against outgoing expenses, ensuring you don't overspend and can save money."
      },
      {
        question: "What do we call the paper slip that lists items bought, prices paid, and proves purchase?",
        options: ["Envelope", "Receipt / Bill", "Checkbook", "Pamphlet"],
        answerIndex: 1,
        explanation: "A receipt or bill serves as official proof of payment and is important for tracking your actual expenses."
      },
      {
        question: "What is the extra money a bank pays you for keeping your savings deposits with them?",
        options: ["Tax", "Interest", "Loan fee", "Donation"],
        answerIndex: 1,
        explanation: "Interest is a percentage gain a bank yields to you as a reward for storing your money in savings accounts."
      },
      {
        question: "What is the main advantage of starting to save money at a very young age?",
        options: ["The Power of Compounding Interest over time", "You don't have to go to school", "Banks give you free gifts", "You don't pay any taxes"],
        answerIndex: 0,
        explanation: "Compounding interest means you earn interest on your earned interest, causing savings to multiply exponentially over decades."
      },
      {
        question: "What does the 'PIN' of a bank debit or credit card stand for?",
        options: ["Personal Identification Number", "Public Information Network", "Post Index Number", "Private Internet Name"],
        answerIndex: 0,
        explanation: "PIN stands for Personal Identification Number. It is a secret code that only you should know to access your funds."
      },
      {
        question: "Why is borrowing from unregulated local moneylenders at extreme rates dangerous?",
        options: ["They might lose your money", "High-interest traps can lead to permanent heavy debt burden", "The government forbids borrowing", "It takes too much paperwork"],
        answerIndex: 1,
        explanation: "Informal moneylenders often charge extremely high, compound interest rates, making it difficult for families to ever pay off the principal."
      },
      {
        question: "What is the purpose of buying crop, health, or livestock insurance?",
        options: ["To make a profit", "To reduce financial shock from unexpected loss or disaster", "To guarantee double yields", "Because it is a legal requirement to walk"],
        answerIndex: 1,
        explanation: "Insurance protects your family or farm against devastating financial losses by paying out funds when disasters occur."
      },
      {
        question: "What is 'inflation'?",
        options: ["The expansion of bicycle tires", "A general increase in prices over time, lowering currency value", "A drop in school enrollment", "Unusual cooling of the weather"],
        answerIndex: 1,
        explanation: "Inflation is the rate at which the general level of prices for goods and services rises, meaning a rupee buys less tomorrow than today."
      },
      {
        question: "What is a 'Fixed Deposit' (FD) in a bank?",
        options: ["A locked savings plan for a set term yielding higher interest", "A loan you never pay back", "Depositing money that is broken", "A monthly lottery ticket"],
        answerIndex: 0,
        explanation: "A Fixed Deposit locks a sum of money for a specified period (e.g. 1 year) in return for a higher interest rate than a regular savings account."
      },
      {
        question: "Which central institution regulates banks and prints all currency notes in India?",
        options: ["State Bank of India", "Reserve Bank of India (RBI)", "Ministry of Agriculture", "Central Bureau of Investigation"],
        answerIndex: 1,
        explanation: "The Reserve Bank of India (RBI) is India's central bank, controlling monetary policy and note issuance."
      },
      {
        question: "What does the concept of 'diversification' in saving money refer to?",
        options: ["Putting all your coins in one piggy bank", "Spreading your savings across different financial options to lower risk", "Keeping money in foreign languages", "Spending everything on different luxury goods"],
        answerIndex: 1,
        explanation: "Diversification means 'not putting all your eggs in one basket', so if one asset class performs poorly, other savings protect you."
      },
      {
        question: "What is the tax collected by the government on transactions of goods and services in India called?",
        options: ["Income Tax", "Property Tax", "Goods and Services Tax (GST)", "Road Tax"],
        answerIndex: 2,
        explanation: "GST (Goods and Services Tax) is an indirect, multi-stage tax imposed on the sale of goods and services in India."
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

const SUBJECT_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    "Science": "Science 🔬",
    "Mathematics": "Mathematics 📐",
    "Languages": "Languages 🗣️",
    "General Knowledge": "General Knowledge 💡",
    "History": "History 🏰",
    "Geography": "Geography 🌾",
    "Financial Literacy": "Financial Literacy 🪙",
    "Custom AI Science": "Custom AI Science ✨"
  },
  hi: {
    "Science": "विज्ञान 🔬",
    "Mathematics": "गणित 📐",
    "Languages": "भाषाएँ 🗣️",
    "General Knowledge": "सामान्य ज्ञान 💡",
    "History": "इतिहास 🏰",
    "Geography": "भूगोल 🌾",
    "Financial Literacy": "वित्तीय साक्षरता 🪙",
    "Custom AI Science": "कस्टम एआई विज्ञान ✨"
  },
  gu: {
    "Science": "વિજ્ઞાન 🔬",
    "Mathematics": "ગણિત 📐",
    "Languages": "ભાષાઓ 🗣️",
    "General Knowledge": "સામાન્ય જ્ઞાન 💡",
    "History": "ઇતિહાસ 🏰",
    "Geography": "ભૂગોળ 🌾",
    "Financial Literacy": "નાણાકીય સાક્ષરતા 🪙",
    "Custom AI Science": "કસ્ટમ એઆઈ વિજ્ઞાન ✨"
  },
  mr: {
    "Science": "विज्ञान 🔬",
    "Mathematics": "गणित 📐",
    "Languages": "भाषा 🗣️",
    "General Knowledge": "सामान्य ज्ञान 💡",
    "History": "इतिहास 🏰",
    "Geography": "भूगोल 🌾",
    "Financial Literacy": "आर्थिक साक्षरता 🪙",
    "Custom AI Science": "कस्टम एआय विज्ञान ✨"
  },
  ta: {
    "Science": "அறிவியல் 🔬",
    "Mathematics": "கணிதம் 📐",
    "Languages": "மொழிகள் 🗣️",
    "General Knowledge": "பொது அறிவு 💡",
    "History": "வரலாறு 🏰",
    "Geography": "புவியியல் 🌾",
    "Financial Literacy": "நிதி அறிவு 🪙",
    "Custom AI Science": "தனிப்பயன் ஏஐ அறிவியல் ✨"
  },
  te: {
    "Science": "సైన్స్ 🔬",
    "Mathematics": "గణితం 📐",
    "Languages": "భాషలు 🗣️",
    "General Knowledge": "జనరల్ నాలెడ్జ్ 💡",
    "History": "చరిత్ర 🏰",
    "Geography": "భూగోళశాస్త్రం 🌾",
    "Financial Literacy": "ఆర్థిక అక్షరాస్యత 🪙",
    "Custom AI Science": "కస్టమ్ ఏఐ సైన్స్ ✨"
  }
};

const QUIZ_TITLE_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    "sci-env": "Earth & Environment Quiz 🌍",
    "math-brain": "Speed Multiplication Puzzles 📐",
    "lang-fun": "Riddles & Word Power 🗣️",
    "gk-nature": "Nature & Animals Quiz 🐘",
    "hist-heroes": "History & Heritage Quiz 🏰",
    "geog-crops": "Basic Geography & Crops 🌾",
    "money-savings": "Smart Money & Savings 🪙"
  },
  hi: {
    "sci-env": "पृथ्वी और पर्यावरण प्रश्नोत्तरी 🌍",
    "math-brain": "तीव्र गुणा पहेलियाँ 📐",
    "lang-fun": "पहेलियाँ और शब्द शक्ति 🗣️",
    "gk-nature": "प्रकृति और पशु प्रश्नोत्तरी 🐘",
    "hist-heroes": "इतिहास और विरासत प्रश्नोत्तरी 🏰",
    "geog-crops": "बुनियादी भूगोल और फसलें 🌾",
    "money-savings": "स्मार्ट धन और बचत 🪙"
  },
  gu: {
    "sci-env": "પૃથ્વી અને પર્યાવરણ ક્વિઝ 🌍",
    "math-brain": "ઝડપી ગુણાકાર કોયડાઓ 📐",
    "lang-fun": "ઉખાણાં અને શબ્દ શક્તિ 🗣️",
    "gk-nature": "કુદરત અને પ્રાણીઓની ક્વિઝ 🐘",
    "hist-heroes": "ઇતિહાસ અને વારસો ક્વિઝ 🏰",
    "geog-crops": "મૂળભૂત ભૂગોળ અને પાક 🌾",
    "money-savings": "સ્માર્ટ મની અને બચત 🪙"
  },
  mr: {
    "sci-env": "पृथ्वी आणि पर्यावरण प्रश्नमंजुषा 🌍",
    "math-brain": "वेगवान गुणाकार कोडे 📐",
    "lang-fun": "कोडी आणि शब्द सामर्थ्य 🗣️",
    "gk-nature": "निसर्ग आणि प्राणी प्रश्नमंजुषा 🐘",
    "hist-heroes": "इतिहास आणि वारसा प्रश्नमंजुषा 🏰",
    "geog-crops": "मूलभूत भूगोल आणि पिके 🌾",
    "money-savings": "स्मार्ट मनी आणि बचत 🪙"
  },
  ta: {
    "sci-env": "பூமி & சுற்றுச்சூழல் வினாடி வினா 🌍",
    "math-brain": "வேகமான பெருக்கல் புதிர்கள் 📐",
    "lang-fun": "விடுகதைகள் & வார்த்தை சக்தி 🗣️",
    "gk-nature": "இயற்கை மற்றும் விலங்குகள் வினாடி வினா 🐘",
    "hist-heroes": "வரலாறு மற்றும் பாரம்பரிய வினாடி வினா 🏰",
    "geog-crops": "அடிப்படை புவியியல் மற்றும் பயிர்கள் 🌾",
    "money-savings": "ஸ்மார்ட் பணம் மற்றும் சேமிப்பு 🪙"
  },
  te: {
    "sci-env": "భూమి & పర్యావరణ క్విజ్ 🌍",
    "math-brain": "వేగవంతమైన గుణకార పజిల్స్ 📐",
    "lang-fun": "పొడుపుకథలు & పదజాలం 🗣️",
    "gk-nature": "ప్రకృతి & జంతువుల క్విజ్ 🐘",
    "hist-heroes": "చరిత్ర & వారసత్వం క్విజ్ 🏰",
    "geog-crops": "ప్రాథమిక భౌగోళిక శాస్త్రం & పంటలు 🌾",
    "money-savings": "స్మార్ట్ మనీ & పొదుపు 🪙"
  }
};

const QUIZ_DESC_TRANSLATIONS: Record<string, string> = {
  en: "question concept checkpoints",
  hi: "प्रश्न संकल्पना चेकपॉइंट",
  gu: "પ્રશ્ન સંકલ્પના ચેકપોઇન્ટ",
  mr: "प्रश्न संकल्पना चेकपॉईंट",
  ta: "கேள்வி கருத்து சோதனைகள்",
  te: "ప్రశ్న భావన చెక్‌పాయింట్లు"
};

const START_GAME_LABELS: Record<string, string> = {
  en: "Start Game 🎬",
  hi: "खेल शुरू करें 🎬",
  gu: "રમત શરૂ કરો 🎬",
  mr: "खेळ सुरू करा 🎬",
  ta: "விளையாட்டைத் தொடங்கு 🎬",
  te: "ఆట ప్రారంభించండి 🎬"
};

const STANDARD_SUBJECTS_LABELS: Record<string, string> = {
  en: "Standard Subjects Challenges",
  hi: "मानक विषय चुनौतियाँ",
  gu: "પ્રમાણભૂત વિષયના પડકારો",
  mr: "मानक विषय आव्हाने",
  ta: "நிலையான பாடங்களின் சவால்கள்",
  te: "ప్రామాణిక సబ్జెక్టుల సవాళ్లు"
};

const AI_QUIZ_SYNTHESIZER_LABELS: Record<string, string> = {
  en: "AI Quiz Synthesizer",
  hi: "एआई क्विज़ सिंथेसाइज़र",
  gu: "એઆઈ ક્વિઝ સિન્થેસાઇઝર",
  mr: "एआय प्रश्नमंजुषा सिंथेसायझर",
  ta: "ஏஐ வினாடி வினா தொகுப்பான்",
  te: "ఏఐ క్విజ్ సింథసైజర్"
};

const CUSTOM_QUIZ_GENERATOR_LABELS: Record<string, string> = {
  en: "Custom Quiz Generator",
  hi: "कस्टम क्विज़ जनरेटर",
  gu: "કસ્ટમ ક્વિઝ જનરેટર",
  mr: "कस्टम प्रश्नमंजुषा जनरेटर",
  ta: "தனிப்பயன் வினாடி வினா உருவாக்கி",
  te: "కస్టమ్ క్విజ్ జనరేటర్"
};

const CUSTOM_QUIZ_SUBTITLE_LABELS: Record<string, string> = {
  en: "Type any chapter topic (e.g. Birds, Crops, Fractions) and play a custom game.",
  hi: "कोई भी अध्याय विषय टाइप करें (जैसे पक्षी, फसलें, भिन्न) और एक कस्टम खेल खेलें।",
  gu: "કોઈપણ પ્રકરણનો વિષય લખો (દા.ત. પક્ષીઓ, પાક, અપૂર્ણાંક) અને કસ્ટમ રમત રમો.",
  mr: "कोणताही धडा विषय टाईप करा (उदा. पक्षी, पिके, अपूर्णांक) आणि सानुकूल खेळ खेळा.",
  ta: "ஏதேனும் பாடத் தலைப்பைத் தட்டச்சு செய்து (எ.கா. பறவைகள், பயிர்கள், பின்னங்கள்) தனிப்பயன் விளையாட்டை விளையாடுங்கள்.",
  te: "ఏదైనా అధ్యాయం అంశాన్ని టైప్ చేయండి (ఉదా. పక్షులు, పంటలు, భిన్నాలు) మరియు కస్టమ్ గేమ్ ఆడండి."
};

const ENTER_TOPIC_PLACEHOLDERS: Record<string, string> = {
  en: "e.g., Photosynthesis or Prime Numbers...",
  hi: "जैसे, प्रकाश संश्लेषण या अभाज्य संख्याएँ...",
  gu: "દા.ત., પ્રકાશસંશ્લેષણ અથવા અવિભાજ્ય સંખ્યાઓ...",
  mr: "उदा., प्रकाशसंलेषण किंवा मूळ संख्या...",
  ta: "எ.கா., ஒளிச்சேர்க்கை அல்லது பகா எண்கள்...",
  te: "ఉదా., కిరణజన్య సంయోగక్రియ లేదా ప్రధాన సంఖ్యలు..."
};

const ASSEMBLING_QUESTIONS_LABELS: Record<string, string> = {
  en: "Assembling Questions...",
  hi: "प्रश्न संकलित किए जा रहे हैं...",
  gu: "પ્રશ્નો તૈયાર થઈ રહ્યા છે...",
  mr: "प्रश्न संकलित केले जात आहेत...",
  ta: "கேள்விகள் சேகரிக்கப்படுகின்றன...",
  te: "ప్రశ్నలు సేకరిస్తున్నారు..."
};

const GENERATE_CUSTOM_GAME_LABELS: Record<string, string> = {
  en: "Generate Custom Game ✨",
  hi: "कस्टम गेम जेनरेट करें ✨",
  gu: "કસ્ટમ રમત બનાવો ✨",
  mr: "कस्टम गेम तयार करा ✨",
  ta: "தனிப்பயன் விளையாட்டை உருவாக்கு ✨",
  te: "కస్టమ్ గేమ్ సృష్టించండి ✨"
};

const CUMULATIVE_SCORE_TITLE_LABELS: Record<string, string> = {
  en: "Cumulative Quiz Score",
  hi: "संचयी क्विज़ स्कोर",
  gu: "કુલ ક્વિઝ સ્કોર",
  mr: "एकूण प्रश्नमंजुषा गुण",
  ta: "ஒட்டுமொத்த வினாடி வினா மதிப்பெண்",
  te: "సంచిత క్విజ్ స్కోరు"
};

const CUMULATIVE_SCORE_DESC_LABELS: Record<string, string> = {
  en: "points cumulative",
  hi: "कुल संचित अंक",
  gu: "પોઇન્ટ સંચિત",
  mr: "एकूण गुण",
  ta: "புள்ளிகள் ஒட்டுமொத்தமாக",
  te: "పాయింట్లు సంచితంగా"
};

const LENGTH_SUBTITLE_LABELS: Record<string, string> = {
  en: "Choose how many questions you want to solve.",
  hi: "चुनें कि आप कितने प्रश्नों को हल करना चाहते हैं।",
  gu: "તમે કેટલા પ્રશ્નો ઉકેલવા માંગો છો તે પસંદ કરો.",
  mr: "तुम्हाला किती प्रश्न सोडवायचे आहेत ते निवडा.",
  ta: "நீங்கள் எத்தனை கேள்விகளைத் தீர்க்க விரும்புகிறீர்கள் என்பதைத் தேர்ந்தெடுக்கவும்.",
  te: "మీరు ఎన్ని ప్రశ్నలను పరిష్కరించాలనుకుంటున్నారో ఎంచుకోండి."
};

const DIFFICULTY_SUBTITLE_LABELS: Record<string, string> = {
  en: "Select difficulty level to adapt the questions.",
  hi: "प्रश्नों को अनुकूलित करने के लिए कठिनाई स्तर चुनें।",
  gu: "પ્રશ્નોને અનુકૂળ કરવા માટે મુશ્કેલી સ્તર પસંદ કરો.",
  mr: "प्रश्नांनुसार काठिण्य पातळी निवडा.",
  ta: "கேள்விகளை மாற்றியமைக்க கடினத்தன்மை அளவைத் தேர்ந்தெடுக்கவும்.",
  te: "ప్రశ్నలను మార్చడానికి కఠినత్వ స్థాయిని ఎంచుకోండి."
};

const TIMER_LIMIT_SELECTOR_LABELS: Record<string, string> = {
  en: "⏱️ Time per Question",
  hi: "⏱️ प्रति प्रश्न समय",
  gu: "⏱️ પ્રશ્ન દીઠ સમય",
  mr: "⏱️ प्रति प्रश्न वेळ",
  ta: "⏱️ ஒரு கேள்விக்கான நேரம்",
  te: "⏱️ ప్రశ్నకు సమయం"
};

const TIMER_LIMIT_SUBTITLE_LABELS: Record<string, string> = {
  en: "Select how many seconds you have to answer each question.",
  hi: "चुनें कि प्रत्येक प्रश्न का उत्तर देने के लिए आपके पास कितने सेकंड हैं।",
  gu: "પસંદ કરો કે દરેક પ્રશ્નનો જવાબ આપવા માટે તમારી પાસે કેટલી સેકન્ડ છે.",
  mr: "प्रत्येक प्रश्नाचे उत्तर देण्यासाठी तुमच्याकडे किती सेकंद आहेत ते निवडा.",
  ta: "ஒவ்வொரு கேள்விக்கும் பதிலளிக்க உங்களுக்கு எத்தனை வினாடிகள் உள்ளன என்பதைத் தேர்ந்தெடுக்கவும்.",
  te: "ప్రతి ప్రశ్నకు సమాధానం ఇవ్వడానికి మీకు ఎన్ని సెకన్లు ఉన్నాయో ఎంచుకోండి."
};

const PROGRESS_LABELS: Record<string, string> = {
  en: "PROGRESS",
  hi: "प्रगति",
  gu: "પ્રગતિ",
  mr: "प्रगती",
  ta: "முன்னேற்றம்",
  te: "పురోగతి"
};

const OF_LABELS: Record<string, string> = {
  en: "of",
  hi: "का",
  gu: "માંથી",
  mr: "पैकी",
  ta: "இல்",
  te: "లో"
};

const QUESTION_LABELS: Record<string, string> = {
  en: "Question",
  hi: "प्रश्न",
  gu: "પ્રશ્ન",
  mr: "प्रश्न",
  ta: "கேள்வி",
  te: "ప్రశ్న"
};

const FINISH_LABELS: Record<string, string> = {
  en: "Finish Game 🏁",
  hi: "खेल समाप्त करें 🏁",
  gu: "રમત પૂર્ણ કરો 🏁",
  mr: "खेळ पूर्ण करा 🏁",
  ta: "விளையாட்டை முடி 🏁",
  te: "ఆట ముగించండి 🏁"
};

const NEXT_QUESTION_LABELS: Record<string, string> = {
  en: "Next Question ➡️",
  hi: "अगला प्रश्न ➡️",
  gu: "આગલો પ્રશ્ન ➡️",
  mr: "पुढील प्रश्न ➡️",
  ta: "அடுத்த கேள்வி ➡️",
  te: "తదుపరి ప్రశ్న ➡️"
};

const EXIT_QUIZ_LABELS: Record<string, string> = {
  en: "Stop and Exit",
  hi: "रोकें और बाहर निकलें",
  gu: "અટકાવો અને બહાર નીકળો",
  mr: "थांबा आणि बाहेर पडा",
  ta: "நிறுத்தி வெளியேறு",
  te: "ఆపి నిష్క్రమించు"
};

const getCompletedScoreText = (lang: string, score: number, total: number) => {
  if (lang === 'hi') {
    return `आपने ${total} प्रश्नों में से ${score} सही उत्तर प्राप्त किए।`;
  }
  if (lang === 'gu') {
    return `તમે ${total} પ્રશ્નોમાંથી ${score} સાચા જવાબો મેળવ્યા.`;
  }
  if (lang === 'mr') {
    return `तुम्ही ${total} प्रश्नांपैकी ${score} अचूक उत्तरे मिळवली.`;
  }
  if (lang === 'ta') {
    return `நீங்கள் ${total} கேள்விகளில் ${score} சரியான பதில்களைப் பெற்றுள்ளீர்கள்.`;
  }
  if (lang === 'te') {
    return `మీరు ${total} ప్రశ్నలలో ${score} సరైన సమాధానాలు సాధించారు.`;
  }
  return `You scored ${score} correct answers out of ${total} questions.`;
};

const PERFECT_SCORE_LABELS: Record<string, string> = {
  en: "PERFECT CHECKPOINT UNLOCKED! 🏆 You gained +15 bonus speed score!",
  hi: "सटीक चेकपॉइंट अनलॉक! 🏆 आपको +15 बोनस स्पीड स्कोर मिला!",
  gu: "પરફેક્ટ ચેકપોઇન્ટ અનલોક! 🏆 તમને +15 બોનસ સ્પીડ સ્કોર મળ્યો!",
  mr: "परफेक्ट चेकपॉईंट अनलॉक! 🏆 तुम्हाला +१५ बोनस स्पीड गुण मिळाले!",
  ta: "சரியான இலக்கு திறக்கப்பட்டது! 🏆 உங்களுக்கு +15 போனஸ் வேகம் கிடைத்தது!",
  te: "పర్ఫెక్ట్ చెక్‌పాయింట్ అన్‌లాక్ చేయబడింది! 🏆 మీరు +15 బోనస్ వేగం పొందారు!"
};

const RETRY_GAME_LABELS: Record<string, string> = {
  en: "Retry Game 🔄",
  hi: "पुनः प्रयास करें 🔄",
  gu: "ફરી પ્રયાસ કરો 🔄",
  mr: "पुन्हा प्रयत्न करा 🔄",
  ta: "மீண்டும் முயற்சி செய் 🔄",
  te: "మళ్ళీ ప్రయత్నించండి 🔄"
};


const BACK_TO_SUBJECTS_LABELS: Record<string, string> = {
  en: "Back to Subjects",
  hi: "विषयों पर वापस जाएं",
  gu: "વિષયો પર પાછા જાઓ",
  mr: "विषयांवर परत जा",
  ta: "பாடங்களுக்குத் திரும்பு",
  te: "సబ్జెక్టులకు తిరిగి వెళ్ళండి"
};

const TIME_UP_LABELS: Record<string, string> = {
  en: "Time's Up!",
  hi: "समय समाप्त!",
  gu: "સમય પૂરો થયો!",
  mr: "वेळ संपली!",
  ta: "நேரம் முடிந்தது!",
  te: "సమయం ముగిసింది!"
};

const TIME_UP_VOICE_FEEDBACK: Record<string, string> = {
  en: "Time is up! Read the explanation below to learn.",
  hi: "समय समाप्त हो गया है! सीखने के लिए नीचे दिया गया स्पष्टीकरण पढ़ें।",
  gu: "સમય પૂરો થઈ ગયો છે! શીખવા માટે નીચે આપેલી સમજૂતી વાંચો.",
  mr: "वेळ संपली आहे! शिकण्यासाठी खालील स्पष्टीकरण वाचा.",
  ta: "நேரம் முடிந்தது! தெரிந்துகொள்ள கீழே உள்ள விளக்கத்தைப் படியுங்கள்.",
  te: "సమయం ముగిసింది! తెలుసుకోవడానికి క్రింది వివరణను చదవండి."
};

const REVIEW_ANSWERS_LABELS: Record<string, string> = {
  en: "Detailed Review & Explanations 📝",
  hi: "विस्तृत समीक्षा और स्पष्टीकरण 📝",
  gu: "વિગતવાર સમીક્ષા અને સમજૂતી 📝",
  mr: "तपशीलवार पुनरावलोकन आणि स्पष्टीकरण 📝",
  ta: "விரிவான ஆய்வு மற்றும் விளக்கங்கள் 📝",
  te: "వివరణాత్మక సమీక్ష & వివరణలు 📝"
};

const YOUR_ANSWER_LABELS: Record<string, string> = {
  en: "Your Answer",
  hi: "आपका उत्तर",
  gu: "તમારો ઉત્તર",
  mr: "तुमचे उत्तर",
  ta: "உங்கள் பதில்",
  te: "మీ సమాధానం"
};

const CORRECT_ANSWER_LABELS: Record<string, string> = {
  en: "Correct Answer",
  hi: "सही उत्तर",
  gu: "સાચો જવાબ",
  mr: "अचूक उत्तर",
  ta: "சரியான பதில்",
  te: "సరైన సమాధానం"
};

const NO_ANSWER_TIMED_OUT: Record<string, string> = {
  en: "No Answer (Timed Out ⏰)",
  hi: "कोई उत्तर नहीं (समय समाप्त ⏰)",
  gu: "કોઈ ઉત્તર નહીં (સમય પૂરો થયો ⏰)",
  mr: "उत्तर दिले नाही (वेळ संपली ⏰)",
  ta: "பதில் இல்லை (நேரம் முடிந்தது ⏰)",
  te: "సమాధానం లేదు (సమయం ముగిసింది ⏰)"
};

const PASS_STATUS_LABELS: Record<string, string> = {
  en: "PASSED ✅",
  hi: "उत्तीर्ण (पास) ✅",
  gu: "ઉત્તીર્ણ (પાસ) ✅",
  mr: "उत्तीर्ण (पास) ✅",
  ta: "தேர்ச்சி ✅",
  te: "ఉత్తీర్ణత ✅"
};

const FAIL_STATUS_LABELS: Record<string, string> = {
  en: "FAILED ❌",
  hi: "अनुत्तीर्ण (फेल) ❌",
  gu: "અનુત્તીર્ણ (ફેલ) ❌",
  mr: "अनुत्तीर्ण (फेल) ❌",
  ta: "தோல்வி ❌",
  te: "அnuత్తీర్ణత ❌"
};

const CERTIFICATE_TITLE_LABELS: Record<string, string> = {
  en: "CERTIFICATE OF ACHIEVEMENT",
  hi: "सफलता का प्रमाण पत्र",
  gu: "સિદ્ધિનું પ્રમાણપત્ર",
  mr: "यशस्वीतेचे प्रमाणपत्र",
  ta: "சான்றிதழ்",
  te: "ప్రశంసా పత్రం"
};

const CERT_SUBTITLE_LABELS: Record<string, string> = {
  en: "PROUDLY PRESENTED TO",
  hi: "यह प्रमाण पत्र गर्व के साथ दिया जाता है",
  gu: "આ પ્રમાણપત્ર ગર્વ સાથે એનાયત કરવામાં આવે છે",
  mr: "हे प्रमाणपत्र अभिमानाने प्रदान केले जात आहे",
  ta: "பெருமையுடன் வழங்கப்படுகிறது",
  te: "గర్వంగా సమర్పించబడినది"
};

const CERT_BODY_LABELS: Record<string, string> = {
  en: "for successfully passing the academic topic quiz on",
  hi: "जिन्होंने सफलतापूर्वक शैक्षणिक विषय प्रश्नोत्तरी उत्तीर्ण की",
  gu: "જેમણે આ શૈક્ષણિક વિષય પર સફળતાપૂર્વક ક્વિઝ પાસ કરી",
  mr: "જ્યાની યા શૈક્ષણિક વિષયાવરીલ ચાચણી યશસ્વીપણે પૂર્ણ કેલી",
  ta: "என்ற வினாடி வினாவில் வெற்றிகரமாக தேர்ச்சி பெற்றதற்காக",
  te: "అనే అంశంపై క్విజ్‌ను విజయవంతంగా పూర్తి చేసినందుకు"
};

const CERT_SCORE_LABELS: Record<string, string> = {
  en: "with a remarkable accuracy score of",
  hi: "एक उत्कृष्ट सटीकता स्कोर के साथ",
  gu: "એક ઉત્કૃષ્ટ સ્કોર સાથે",
  mr: "एक उत्कृष्ट गुणांसह",
  ta: "சிறந்த மதிப்பெண்களுடன்",
  te: "అత్యుత్తమ స్కోరుతో"
};

const CERT_DATE_LABELS: Record<string, string> = {
  en: "Date of Achievement",
  hi: "उपलब्धि की तिथि",
  gu: "સિદ્ધિની તારીખ",
  mr: "प्राप्तीची तारीख",
  ta: "சான்றிதழ் வழங்கப்பட்ட தேதி",
  te: "సాధించిన తేదీ"
};

const CERT_SIGN_LABELS: Record<string, string> = {
  en: "Swami AI Academic Dean",
  hi: "स्वामी एआई शिक्षा निदेशक",
  gu: "સ્વામી એઆઈ શૈક્ષણિક પ્રમુખ",
  mr: "स्वामी एआय शिक्षण संचालक",
  ta: "சுவாமி ஏஐ கல்வி முதன்மையர்",
  te: "స్వామి ఏఐ విద్యాధిపతి"
};

const ENTER_NAME_LABELS: Record<string, string> = {
  en: "Enter your full name for the certificate",
  hi: "प्रमाण पत्र के लिए अपना पूरा नाम दर्ज करें",
  gu: "પ્રમાણપત્ર માટે તમારું પૂરું નામ લખો",
  mr: "प्रमाणपत्रासाठी तुमचे पूर्ण नाव प्रविष्ट करा",
  ta: "சான்றிதழில் அச்சிட உங்கள் முழுப் பெயரை உள்ளிடவும்",
  te: "ధృవీకరణ పత్రం కోసం మీ పూర్తి పేరును నమోదు చేయండి"
};

const CLAIM_CERT_BTN_LABELS: Record<string, string> = {
  en: "Claim Achievement Certificate 📜",
  hi: "सफलता का प्रमाण पत्र प्राप्त करें 📜",
  gu: "સિદ્ધિનું પ્રમાણપત્ર મેળવો 📜",
  mr: "यशस्वीतेचे प्रमाणपत्र मिळवा 📜",
  ta: "சான்றிதழைப் பெற்றிடுங்கள் 📜",
  te: "ప్రశంసా పత్రాన్ని పొందండి 📜"
};

const ACCURACY_LABELS: Record<string, string> = {
  en: "Current accuracy",
  hi: "वर्तमान शुद्धता",
  gu: "વર્તમાન ચોકસાઈ",
  mr: "चालू अचूकता",
  ta: "தற்போதைய துல்லியம்",
  te: "ప్రస్తుత ఖచ్చితత్వం"
};

const CONCEPT_PROBE_LABELS: Record<string, string> = {
  en: "Standard Concept Probe",
  hi: "मानक अवधारणा जांच",
  gu: "પ્રમાણભૂત વિભાવના ચકાસણી",
  mr: "मानक संकल्पना चाचणी",
  ta: "நிலையான கருத்து ஆய்வு",
  te: "ప్రామాణిక భావన పరిశోధన"
};

const BRAVO_LABELS: Record<string, string> = {
  en: "Bravo! Correct",
  hi: "शाबाश! सही",
  gu: "શાબાશ! સાચો જવાબ",
  mr: "शाब्बास! बरोबर",
  ta: "அற்புதம்! சரியானது",
  te: "శభాష్! సరైనది"
};

const EXPLANATION_HEADER_LABELS: Record<string, string> = {
  en: "Study Point Explanation",
  hi: "अध्ययन बिंदु स्पष्टीकरण",
  gu: "અભ્યાસ કેન્દ્ર સમજૂતી",
  mr: "अभ्यास संकल्पना स्पष्टीकरण",
  ta: "பாட விளக்கம்",
  te: "పాఠ్యాంశ వివరణ"
};

const HEADER_TITLE_LABELS: Record<string, string> = {
  en: "Interactive Testing Hall",
  hi: "इंटरैक्टिव प्रश्नोत्तरी हॉल",
  gu: "ઇન્ટરેક્ટિવ ક્વિઝ હોલ",
  mr: "संवादी प्रश्नमंजुषा कक्ष",
  ta: "ஊடாடும் வினாடி வினா கூடம்",
  te: "ఇంటరాక్టివ్ క్విజ్ హాల్"
};

const HEADER_SUBTITLE_LABELS: Record<string, string> = {
  en: "Play standard school challenges or draft Custom AI Games about raw topics!",
  hi: "मानक स्कूल चुनौतियों को खेलें या नए विषयों के बारे में कस्टम एआई गेम तैयार करें!",
  gu: "પ્રમાણભૂત શાળાના પડકારો રમો અથવા નવા વિષયો વિશે કસ્ટમ એઆઈ રમતો તૈયાર કરો!",
  mr: "मानक शालेय आव्हाने खेळा किंवा नवीन विषयांविषयी सानुकूल एआय खेळ तयार करा!",
  ta: "நிலையான பள்ளி சவால்களை விளையாடுங்கள் அல்லது புதிய தலைப்புகளைப் பற்றிய தனிப்பயன் ஏஐ விளையாட்டுகளை உருவாக்குங்கள்!",
  te: "ప్రామాణిక పాఠశాల సవాళ్లను ఆడండి లేదా కొత్త అంశాల గురించి కస్టమ్ ఏఐ గేమ్‌లను సృష్టించండి!"
};

const CHALLENGE_COMPLETE_LABELS: Record<string, string> = {
  en: "Challenge Complete!",
  hi: "चुनौती पूर्ण! 🎉",
  gu: "પડકાર પૂર્ણ થયો! 🎉",
  mr: "आव्हान पूर्ण झाले! 🎉",
  ta: "சவால் முடிந்தது! 🎉",
  te: "సవాలు పూర్తయింది! 🎉"
};

const PAYOUT_REWARDS_LABELS: Record<string, string> = {
  en: "Score payout rewards:",
  hi: "अंक भुगतान पुरस्कार:",
  gu: "મેળવેલા સ્કોર પુરસ્કારો:",
  mr: "मिळालेले गुण बक्षीस:",
  ta: "மதிப்பெண் வெகுமதிகள்:",
  te: "స్కోరు బహుమతులు:"
};

const POINTS_GAINED_LABELS: Record<string, string> = {
  en: "Points gained",
  hi: "प्राप्त अंक",
  gu: "મેળવેલા પોઇન્ટ્સ",
  mr: "मिळालेले गुण",
  ta: "பெற்ற புள்ளிகள்",
  te: "పొందిన పాయింట్లు"
};

const SWEEP_BONUS_LABELS: Record<string, string> = {
  en: "Streak clean sheet sweep bonus: +15 points!",
  hi: "लगातार सही उत्तर देने का क्लीन शीट बोनस: +15 अंक!",
  gu: "સતત સાચા ઉત્તર માટે બોનસ: +15 પોઇન્ટ!",
  mr: "सलग अचूक उत्तरांसाठी बोनस गुण: +१५ गुण!",
  ta: "தொடர் வெற்றிக்கான போன斯: +15 புள்ளிகள்!",
  te: "వరుస విజయాల బోనస్ పాయింట్లు: +15 పాయింట్లు!"
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

export default function QuizTab({ user, lang, onNavigateToTab, onUpdateUser }: QuizTabProps) {
  // Global cumulative states
  const [totalQuizPoints, setTotalQuizPoints] = useState(() => {
    return user.totalPoints ?? 15;
  });

  // Current active quiz states
  const [activeQuiz, setActiveQuiz] = useState<typeof GENERAL_QUIZZES[0] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [tempSelectedOpt, setTempSelectedOpt] = useState<number | null>(null);
  const [roundMinsScore, setRoundMinsScore] = useState(0);
  const [roundFinished, setRoundFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [userAnswers, setUserAnswers] = useState<(number | -1)[]>([]);

  // Dynamic question count state (5, 10, or 15)
  const [quizLength, setQuizLength] = useState<number>(5);

  // Dynamic question difficulty state ('easy', 'medium', or 'hard')
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  // Dynamic timer limit state per question (15, 30, 60, 90, 120 seconds)
  const [timerLimit, setTimerLimit] = useState<number>(60);

  // Certificate states
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateName, setCertificateName] = useState(() => user.certificateName || user.name || '');
  const [certificateId, setCertificateId] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Update state when user changes
  useEffect(() => {
    setTotalQuizPoints(user.totalPoints ?? 15);
    setCertificateName(user.certificateName || user.name || '');
  }, [user]);

  const handleDownloadCertificatePDF = async () => {
    if (!activeQuiz) return;

    try {
      setIsGeneratingPdf(true);
      speakText(lang === 'hi' ? "आपका प्रमाण पत्र तैयार किया जा रहा है..." : "Generating your certificate PDF...", lang, "Swami AI", "🤖 Swami AI");

      // Create high-resolution landscape A4 canvas (300 DPI approx, 2000x1414 is super crisp)
      const canvas = document.createElement('canvas');
      canvas.width = 2000;
      canvas.height = 1414;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not create 2D canvas context");

      // Enable text anti-aliasing
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      // 1. Solid background (elegant soft ivory cream)
      ctx.fillStyle = '#FAF8F5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Beautiful background watermark (subtle Brain outline or pattern)
      ctx.save();
      ctx.globalAlpha = 0.025;
      ctx.fillStyle = '#B45309';
      ctx.font = 'bold 500px sans-serif';
      ctx.fillText('🎓', canvas.width / 2, canvas.height / 2);
      ctx.restore();

      // 3. Double luxury gold border
      // Outer border
      ctx.strokeStyle = '#D97706'; // amber-600
      ctx.lineWidth = 24;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      // Inner border
      ctx.strokeStyle = '#F59E0B'; // amber-500
      ctx.lineWidth = 4;
      ctx.strokeRect(64, 64, canvas.width - 128, canvas.height - 128);

      // 4. Elegant corner motifs
      ctx.fillStyle = '#D97706';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('⚜️', 90, 110);
      ctx.fillText('⚜️', canvas.width - 90, 110);
      ctx.fillText('⚜️', 90, canvas.height - 110);
      ctx.fillText('⚜️', canvas.width - 90, canvas.height - 110);

      // 5. Header: Certificate of Achievement
      ctx.fillStyle = '#B45309'; // dark amber
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText(CERTIFICATE_TITLE_LABELS[lang] || "CERTIFICATE OF ACHIEVEMENT", canvas.width / 2, 220);

      // Gold elegant accent line under title
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 250, 260);
      ctx.lineTo(canvas.width / 2 + 250, 260);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 6. Subtitle: Proudly presented to
      ctx.fillStyle = '#6B7280'; // gray-500
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(CERT_SUBTITLE_LABELS[lang] || "PROUDLY PRESENTED TO", canvas.width / 2, 340);

      // 7. Student's Full Name (Bold, elegant, dynamic font scaling if long)
      const nameText = certificateName.trim() || (lang === 'hi' ? "अध्ययनकर्ता" : "Acclaimed Scholar");
      ctx.fillStyle = '#111827'; // gray-900
      ctx.font = 'italic bold 72px Georgia, serif';
      // Measure name text and scale down if too long
      const maxNameWidth = canvas.width - 400;
      let nameFontSize = 72;
      while (ctx.measureText(nameText).width > maxNameWidth && nameFontSize > 36) {
        nameFontSize -= 4;
        ctx.font = `italic bold ${nameFontSize}px Georgia, serif`;
      }
      ctx.fillText(nameText, canvas.width / 2, 450);

      // Accent underline under name
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 350, 500);
      ctx.lineTo(canvas.width / 2 + 350, 500);
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 8. Body Description (Multiple lines)
      ctx.fillStyle = '#4B5563'; // gray-600
      ctx.font = '30px sans-serif';
      ctx.fillText(CERT_BODY_LABELS[lang] || "for successfully passing the academic topic quiz on", canvas.width / 2, 590);

      // Topic Name (Highlighted in stylish card border or prominent text)
      ctx.fillStyle = '#1E3A8A'; // deep blue-900
      ctx.font = 'bold 38px Georgia, serif';
      ctx.fillText(`🎯 ${activeQuiz.title}`, canvas.width / 2, 670);

      // Score percentage and details
      ctx.fillStyle = '#4B5563'; // gray-600
      ctx.font = '30px sans-serif';
      const accuracyPct = Math.round((roundMinsScore / activeQuiz.questions.length) * 100);
      
      ctx.fillText(
        `${CERT_SCORE_LABELS[lang] || "with a remarkable accuracy score of"} ${accuracyPct}%`,
        canvas.width / 2,
        750
      );
      
      ctx.font = 'italic bold 26px sans-serif';
      ctx.fillStyle = '#10B981'; // emerald-550
      ctx.fillText(
        `(${roundMinsScore} / ${activeQuiz.questions.length} ${lang === 'hi' ? "उत्तर सही" : "correct answers"})`,
        canvas.width / 2,
        810
      );

      // 9. Footer Components (Y = 1050)
      const footerY = 1050;

      // Left: Date
      ctx.textAlign = 'left';
      ctx.fillStyle = '#9CA3AF'; // gray-400
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(CERT_DATE_LABELS[lang] || "Date of Achievement", 220, footerY);

      ctx.fillStyle = '#374151'; // gray-700
      ctx.font = 'bold 26px monospace';
      const formattedDate = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : lang, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      ctx.fillText(formattedDate, 220, footerY + 50);

      // Right: Signature
      ctx.textAlign = 'right';
      ctx.fillStyle = '#9CA3AF'; // gray-400
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('AUTHORIZED SIGNATURE', canvas.width - 220, footerY);

      // Draw handwriting/signature text
      ctx.fillStyle = '#1E3A8A'; // rich dark blue
      ctx.font = 'italic bold 36px Georgia, serif';
      ctx.fillText('✍️ Swami AI Tutor', canvas.width - 220, footerY + 45);

      // Signature line
      ctx.beginPath();
      ctx.moveTo(canvas.width - 440, footerY + 70);
      ctx.lineTo(canvas.width - 220, footerY + 70);
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#9CA3AF'; // gray-400
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(CERT_SIGN_LABELS[lang] || "Swami AI Academic Dean", canvas.width - 220, footerY + 105);

      // Center: Stamp / Gold Seal Badge
      const stampX = canvas.width / 2;
      const stampY = footerY + 40;

      // Ribbon tails behind seal
      ctx.fillStyle = '#EF4444'; // red-550
      ctx.beginPath();
      ctx.moveTo(stampX - 25, stampY + 30);
      ctx.lineTo(stampX - 45, stampY + 115);
      ctx.lineTo(stampX - 10, stampY + 95);
      ctx.lineTo(stampX - 10, stampY + 30);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(stampX + 10, stampY + 30);
      ctx.lineTo(stampX + 10, stampY + 95);
      ctx.lineTo(stampX + 45, stampY + 115);
      ctx.lineTo(stampX + 25, stampY + 30);
      ctx.closePath();
      ctx.fill();

      // Gold seal body circle
      ctx.beginPath();
      ctx.arc(stampX, stampY, 70, 0, 2 * Math.PI);
      const sealGrad = ctx.createRadialGradient(stampX, stampY, 10, stampX, stampY, 70);
      sealGrad.addColorStop(0, '#FDE047'); // yellow-300
      sealGrad.addColorStop(0.5, '#F59E0B'); // amber-500
      sealGrad.addColorStop(1, '#B45309'); // amber-700
      ctx.fillStyle = sealGrad;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Inner dashed seal border
      ctx.beginPath();
      ctx.arc(stampX, stampY, 58, 0, 2 * Math.PI);
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Seal text content
      ctx.textAlign = 'center';
      ctx.fillStyle = '#78350F'; // amber-900
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('★', stampX, stampY - 12);

      ctx.font = 'black 16px sans-serif';
      ctx.fillText('OFFICIAL', stampX, stampY + 18);
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('SWAMI AI', stampX, stampY + 34);

      // 10. Secure bottom verification details footer (Y = 1320)
      ctx.textAlign = 'left';
      ctx.fillStyle = '#9CA3AF'; // gray-400
      ctx.font = 'bold 18px monospace';
      ctx.fillText('🔒 SECURE STUDY METRICS SYNC VERIFIED', 100, canvas.height - 110);

      ctx.textAlign = 'right';
      ctx.fillText(certificateId || 'CERT-SWAMI-SESSION', canvas.width - 100, canvas.height - 110);

      // Convert Canvas to High-Quality PNG Data URL
      const imgData = canvas.toDataURL('image/png', 1.0);

      // Create landscape A4 jsPDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const fileName = `Certificate_${certificateName.trim().replace(/[^a-zA-Z0-9]/g, '_') || 'Swami_AI_Quiz'}.pdf`;
      pdf.save(fileName);

      speakText(lang === 'hi' ? "प्रमाण पत्र सफलतापूर्वक डाउनलोड हो गया है!" : "Certificate downloaded successfully!", lang, "Swami AI", "🤖 Swami AI");
    } catch (error) {
      console.error('Failed to generate Canvas PDF:', error);
      speakText(lang === 'hi' ? "प्रमाण पत्र डाउनलोड करने में विफल रहा। कृपया पुनः प्रयास करें।" : "Failed to download certificate. Please try again.", lang, "Swami AI", "🤖 Swami AI");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleTimeout = () => {
    if (selectedOpt !== null || !activeQuiz) return;
    setSelectedOpt(-1);
    setTempSelectedOpt(null);
    setUserAnswers(prev => {
      const next = [...prev];
      next[currentQuestionIndex] = -1;
      return next;
    });
    speakText(TIME_UP_VOICE_FEEDBACK[lang] || TIME_UP_VOICE_FEEDBACK['en'], lang, "Swami AI", "🤖 Swami AI");
  };

  useEffect(() => {
    if (!activeQuiz || roundFinished || selectedOpt !== null) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz, roundFinished, selectedOpt, currentQuestionIndex, timerLimit]);

  // Creative "Quiz Generator" states
  const [customTopic, setCustomTopic] = useState('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

  // Translation cache and state
  const [translatedQuizzesCache, setTranslatedQuizzesCache] = useState<Record<string, any>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  const languageNames: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    gu: "Gujarati",
    mr: "Marathi",
    ta: "Tamil",
    te: "Telugu"
  };

  const CORRECT_VOICE_FEEDBACK: Record<string, string> = {
    en: "Wonderful! You hit the correct answer.",
    hi: "अद्भुत! आपने सही उत्तर चुना है।",
    gu: "અદ્ભુત! તમે સાચો જવાબ પસંદ કર્યો છે.",
    mr: "अप्रतिम! तुम्ही अचूक उत्तर निवडले आहे.",
    ta: "அற்புதம்! நீங்கள் சரியான விடையைத் தேர்ந்தெடுத்துள்ளீர்கள்.",
    te: "అద్భుతం! మీరు సరైన సమాధానాన్ని ఎంచుకున్నారు."
  };

  const INCORRECT_VOICE_FEEDBACK: Record<string, string> = {
    en: "Nice try! Read the explanation below to learn.",
    hi: "अच्छा प्रयास! सीखने के लिए नीचे दिया गया स्पष्टीकरण पढ़ें।",
    gu: "સરસ પ્રયાસ! શીખવા માટે નીચે આપેલી સમજૂતી વાંચો.",
    mr: "चांगला प्रयत्न! शिकण्यासाठी खालील स्पष्टीकरण वाचा.",
    ta: "நல்ல முயற்சி! தெரிந்துகொள்ள கீழே உள்ள விளக்கத்தைப் படியுங்கள்.",
    te: "మంచి ప్రయత్నం! తెలుసుకోవడానికి క్రింది వివరణను చదవండి."
  };

  const translateQuizUsingGemini = async (quiz: any, targetLang: string) => {
    const cacheKey = `${quiz.id}_${quiz.questions.length}_${quizDifficulty}_${targetLang}`;
    if (translatedQuizzesCache[cacheKey]) {
      return translatedQuizzesCache[cacheKey];
    }

    const targetLangName = languageNames[targetLang] || targetLang;
    
    // Prompt for Gemini to translate the quiz perfectly
    const systemInstruction = `You are a professional educational translator. You will translate school quiz content into the Indian language: ${targetLangName}.
CRITICAL REQUIREMENTS:
1. Translate the 'title', 'subject', and all fields in the 'questions' array (specifically 'question', 'options' array, and 'explanation') into ${targetLangName} (using its proper script/alphabet).
2. The 'id', 'difficulty', and 'answerIndex' properties must NOT be changed. They must keep their original numeric or string values exactly.
3. The number of questions and the order/number of options per question must match the input exactly.
4. Return ONLY valid JSON that matches the input structure. Do NOT wrap the response in markdown code blocks like \`\`\`json. Return the raw string of JSON only. Do NOT add any extra text, introductory remarks, or conversation.`;

    const response = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: JSON.stringify({
          title: quiz.title,
          subject: quiz.subject,
          questions: quiz.questions
        }),
        systemInstruction
      })
    });

    const data = await response.json();
    if (data.success && data.text) {
      let cleanText = data.text.trim();
      if (cleanText.startsWith('```')) {
        const lines = cleanText.split('\n');
        if (lines[0].startsWith('```')) {
          lines.shift();
        }
        if (lines[lines.length - 1].startsWith('```')) {
          lines.pop();
        }
        cleanText = lines.join('\n').trim();
      }

      try {
        const parsed = JSON.parse(cleanText);
        const translatedQuiz = {
          ...quiz,
          title: parsed.title || quiz.title,
          subject: parsed.subject || quiz.subject,
          questions: quiz.questions.map((q: any, qIdx: number) => {
            const parsedQ = parsed.questions?.[qIdx] || {};
            return {
              ...q,
              question: parsedQ.question || q.question,
              options: parsedQ.options || q.options,
              explanation: parsedQ.explanation || q.explanation
            };
          })
        };

        setTranslatedQuizzesCache(prev => ({
          ...prev,
          [cacheKey]: translatedQuiz
        }));

        return translatedQuiz;
      } catch (err) {
        console.error("Failed to parse translated quiz JSON:", err, cleanText);
      }
    }
    
    throw new Error("Failed to translate quiz");
  };

  const generateQuizWithGemini = async (topic: string, count: number, difficulty: string, targetLang: string) => {
    const targetLangName = languageNames[targetLang] || "English";
    const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    
    const systemInstruction = `You are Swami AI, an exceptionally smart and encouraging school teacher tutor. You create high-quality academic quizzes for young school students.
CRITICAL MANDATES:
1. Generate exactly ${count} multiple-choice questions about the specific topic: "${topic}".
2. Target difficulty level: ${difficultyLabel}.
3. Every question must have exactly 4 clear options (with realistic distractors).
4. Specify the "answerIndex" as a number from 0 to 3 (index of the correct option).
5. Provide a clear, educational "explanation" of 2 sentences for each question.
6. All text fields (including the quiz 'title', 'subject', 'question', 'options' array, and 'explanation') MUST be written entirely in ${targetLangName} (using its proper script/alphabet).
7. Return ONLY valid raw JSON containing the schema below. Do NOT use markdown formatting (\`\`\`json) or conversational preambles. Output exactly the raw JSON text.

JSON Schema:
{
  "title": "A beautiful, relevant title in ${targetLangName}",
  "subject": "Academic Topic - ${topic}",
  "questions": [
    {
      "question": "Question text in ${targetLangName}",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "answerIndex": 0,
      "explanation": "Clear educational explanation of why the correct answer is correct, in ${targetLangName}"
    }
  ]
}`;

    const response = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Generate a high-quality academic school quiz about "${topic}" containing exactly ${count} questions at ${difficultyLabel} level, fully written in ${targetLangName}.`,
        systemInstruction
      })
    });

    const data = await response.json();
    if (data.success && data.text) {
      let cleanText = data.text.trim();
      if (cleanText.startsWith('```')) {
        const lines = cleanText.split('\n');
        if (lines[0].startsWith('```')) {
          lines.shift();
        }
        if (lines[lines.length - 1].startsWith('```')) {
          lines.pop();
        }
        cleanText = lines.join('\n').trim();
      }

      const parsed = JSON.parse(cleanText);
      if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return {
          id: 'cust-' + Math.random().toString(36).substring(2, 5),
          title: parsed.title || `${topic} Genius Pack 🧠`,
          subject: parsed.subject || 'Custom AI Science',
          difficulty: difficultyLabel,
          questions: parsed.questions.slice(0, count).map((q: any) => ({
            question: q.question || `Question about ${topic}`,
            options: Array.isArray(q.options) && q.options.length >= 4 
              ? q.options.slice(0, 4) 
              : ["Option A", "Option B", "Option C", "Option D"],
            answerIndex: typeof q.answerIndex === 'number' && q.answerIndex >= 0 && q.answerIndex < 4 
              ? q.answerIndex 
              : 0,
            explanation: q.explanation || "Correct answer explanation."
          }))
        };
      }
    }
    throw new Error("Invalid format or response from Gemini");
  };

  const startQuizDeck = async (quiz: typeof GENERAL_QUIZZES[0]) => {
    const tailoredQuestions = getFilteredQuizQuestions(quiz.questions, quizDifficulty, quizLength);
    const initialQuizDeck = {
      ...quiz,
      difficulty: quizDifficulty.charAt(0).toUpperCase() + quizDifficulty.slice(1),
      questions: tailoredQuestions
    };

    if (lang !== 'en') {
      setIsTranslating(true);
      try {
        const translated = await translateQuizUsingGemini(initialQuizDeck, lang);
        setActiveQuiz(translated);
      } catch (err) {
        console.error("Quiz translation failed, falling back to English:", err);
        setActiveQuiz(initialQuizDeck);
      } finally {
        setIsTranslating(false);
      }
    } else {
      setActiveQuiz(initialQuizDeck);
    }

    setCurrentQuestionIndex(0);
    setSelectedOpt(null);
    setTempSelectedOpt(null);
    setRoundMinsScore(0);
    setRoundFinished(false);
    setTimeLeft(timerLimit);
    setUserAnswers([]);
  };

  const handleOptSelect = (optIdx: number) => {
    if (selectedOpt !== null || !activeQuiz) return;
    setTempSelectedOpt(optIdx);
  };

  const handleConfirmAnswer = () => {
    if (tempSelectedOpt === null || selectedOpt !== null || !activeQuiz) return;
    
    const optIdx = tempSelectedOpt;
    setSelectedOpt(optIdx);
    setUserAnswers(prev => {
      const next = [...prev];
      next[currentQuestionIndex] = optIdx;
      return next;
    });
    
    const isCorrect = optIdx === activeQuiz.questions[currentQuestionIndex].answerIndex;
    
    // Play voice feedback based on selection
    if (isCorrect) {
      setRoundMinsScore(prev => prev + 1);
      speakText(CORRECT_VOICE_FEEDBACK[lang] || CORRECT_VOICE_FEEDBACK['en'], lang, "Swami AI", "🤖 Swami AI");
    } else {
      speakText(INCORRECT_VOICE_FEEDBACK[lang] || INCORRECT_VOICE_FEEDBACK['en'], lang, "Swami AI", "🤖 Swami AI");
    }
  };

  const handleNextQ = () => {
    setSelectedOpt(null);
    setTempSelectedOpt(null);
    setTimeLeft(timerLimit);
    if (!activeQuiz) return;

    if (currentQuestionIndex + 1 < activeQuiz.questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setRoundFinished(true);
      
      // Generate certificate ID
      const randHash = Math.floor(100000 + Math.random() * 900000);
      const generatedCertId = `CERT-SWAMI-${randHash}`;
      setCertificateId(generatedCertId);

      // Build chat logs of the quiz session for the separate Certificates page
      const currentChatLogs = activeQuiz.questions.map((q, qIdx) => {
        // Ensure userAnswer is retrieved safely
        const chosenIndex = userAnswers[qIdx] !== undefined ? userAnswers[qIdx] : -1;
        return {
          question: q.question,
          options: q.options,
          correctAnswerIndex: q.answerIndex,
          selectedAnswerIndex: chosenIndex,
          explanation: q.explanation
        };
      });

      const dateNow = new Date();
      const formattedDate = dateNow.toLocaleDateString(lang === 'en' ? 'en-US' : lang, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = dateNow.toLocaleTimeString(lang === 'en' ? 'en-US' : lang, {
        hour: '2-digit',
        minute: '2-digit'
      });

      const savedName = user.certificateName || user.name || 'GyaanBot Scholar';

      const certObj = {
        id: generatedCertId,
        quizTitle: activeQuiz.title,
        quizId: activeQuiz.id,
        score: roundMinsScore,
        totalQuestions: activeQuiz.questions.length,
        date: formattedDate,
        time: formattedTime,
        recipientName: savedName,
        chatLogs: currentChatLogs
      };

      // Save to user object in state/Firestore so they are displayable on the separate certificates page
      let updatedCertificates = [];
      try {
        const existingRaw = user.earnedCertificates;
        const existingList = existingRaw ? JSON.parse(existingRaw) : [];
        existingList.unshift(certObj); // Prepend so newest is first
        updatedCertificates = existingList;
      } catch (err) {
        console.error("Error writing quiz certificate", err);
      }

      // Update global quiz points: +15 points for passing!
      const pointsGain = roundMinsScore * 10 + (roundMinsScore === activeQuiz.questions.length ? 15 : 0);
      const updatedPoints = totalQuizPoints + pointsGain;
      setTotalQuizPoints(updatedPoints);

      onUpdateUser({
        earnedCertificates: JSON.stringify(updatedCertificates),
        totalPoints: updatedPoints
      });

      // Reconcile and buffer score records if in offline cache mode
      if (!offlineSyncManager.isOnline()) {
        offlineSyncManager.queuePendingProgress('quiz_points', pointsGain, user.mobile);
      }
    }
  };

  const handleGenerateCustomQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim()) return;

    setIsGeneratingCustom(true);
    const formattedTopic = customTopic.trim();
    
    // Announce generation in correct language
    speakText(
      lang === 'hi' 
        ? `स्वामी एआई आपके लिए "${formattedTopic}" विषय पर प्रश्नोत्तरी तैयार कर रहा है...` 
        : `Swami AI is crafting a custom quiz about "${formattedTopic}" for you...`, 
      lang, 
      "Swami AI", 
      "🤖 Swami AI"
    );

    let finalQuiz: any = null;

    try {
      // 1. Try real-time specific generation using Gemini directly
      finalQuiz = await generateQuizWithGemini(formattedTopic, quizLength, quizDifficulty, lang);
    } catch (err) {
      console.warn("Gemini direct custom quiz generation failed, falling back to offline templates:", err);
      
      // 2. Offline Fallback: use templates and translate if language is not English
      const capitalizedTopic = formattedTopic.charAt(0).toUpperCase() + formattedTopic.slice(1);
      const customQuiz = {
        id: 'cust-' + Math.random().toString(36).substring(2, 5),
        title: `${capitalizedTopic} Genius Pack 🧠`,
        subject: 'Custom AI Science',
        difficulty: quizDifficulty.charAt(0).toUpperCase() + quizDifficulty.slice(1),
        questions: generateCustomQuestions(formattedTopic, quizLength)
      };

      if (lang !== 'en') {
        try {
          finalQuiz = await translateQuizUsingGemini(customQuiz, lang);
        } catch (transErr) {
          console.error("Custom quiz translation failed:", transErr);
          finalQuiz = customQuiz;
        }
      } else {
        finalQuiz = customQuiz;
      }
    }

    if (finalQuiz) {
      setActiveQuiz(finalQuiz);
      setCurrentQuestionIndex(0);
      setSelectedOpt(null);
      setTempSelectedOpt(null);
      setRoundMinsScore(0);
      setRoundFinished(false);
      setCustomTopic('');
      setTimeLeft(timerLimit);
      setUserAnswers([]);
    }

    setIsGeneratingCustom(false);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. QUIZ HIGHLIGHTS HEADER PANEL */}
      <div className="bg-white rounded-3xl border border-gray-150 p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 text-left">
        <div className="space-y-1">
          <h2 className="font-display font-extrabold text-lg text-[#3D405B] flex items-center gap-2">
            <Brain className="h-5 w-5 text-amber-500 animate-pulse" />
            {HEADER_TITLE_LABELS[lang] || HEADER_TITLE_LABELS['en']}
          </h2>
          <p className="text-xs text-gray-400">{HEADER_SUBTITLE_LABELS[lang] || HEADER_SUBTITLE_LABELS['en']}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('certificates')}
              className="w-full sm:w-auto px-4.5 py-3 bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-900 font-extrabold text-xs rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition-all shadow-3xs hover:scale-102"
            >
              <span>📜 {lang === 'hi' ? "मेरे प्रमाण पत्र" : "My Certificates Portfolio"}</span>
            </button>
          )}

          <div className="bg-gradient-to-tr from-[#3D405B] to-[#4D506F] text-white rounded-2xl p-3 px-4 flex items-center gap-3 shrink-0 shadow-2xs w-full sm:w-auto justify-center">
            <Award className="h-6 w-6 text-amber-300 animate-bounce" />
            <div className="font-mono text-left">
              <div className="text-[9px] text-[#F2CC8F] font-black uppercase tracking-wider">{CUMULATIVE_SCORE_TITLE_LABELS[lang] || CUMULATIVE_SCORE_TITLE_LABELS['en']}</div>
              <div className="text-base font-bold">{totalQuizPoints} {CUMULATIVE_SCORE_DESC_LABELS[lang] || CUMULATIVE_SCORE_DESC_LABELS['en']}</div>
            </div>
          </div>
        </div>
      </div>

      {isTranslating ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center max-w-md mx-auto space-y-6 shadow-sm animate-pulse flex flex-col justify-center items-center">
          <div className="relative flex justify-center">
            <RefreshCw className="h-12 w-12 text-[#E07A5F] animate-spin" />
            <Sparkles className="h-6 w-6 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h4 className="font-display font-extrabold text-base text-[#3D405B]">
              {lang === 'gu' ? 'ક્વિઝનું ભાષાંતર થઈ રહ્યું છે...' : 
               lang === 'hi' ? 'क्विज़ का अनुवाद किया जा रहा है...' : 
               lang === 'mr' ? 'प्रश्नमंजुषा भाषांतरित केली जात आहे...' : 
               lang === 'ta' ? 'வினாடி வினா மொழிபெயர்க்கப்படுகிறது...' : 
               lang === 'te' ? 'క్విజ్ అనువదించబడుతోంది...' : 
               'Translating quiz questions...'}
            </h4>
            <p className="text-xs text-gray-400">
              {lang === 'gu' ? 'તમારા માટે ગુજરાતીમાં પ્રશ્નો અને જવાબો તૈયાર કરી રહ્યા છીએ.' :
               lang === 'hi' ? 'आपके लिए हिंदी में प्रश्न और उत्तर तैयार किए जा रहे हैं।' :
               lang === 'mr' ? 'तुमच्यासाठी मराठीत प्रश्न आणि उत्तरे तयार केली जात आहेत.' :
               lang === 'ta' ? 'உங்களுக்காக தமிழில் கேள்விகள் மற்றும் பதில்கள் தயார் செய்யப்படுகின்றன.' :
               lang === 'te' ? 'మీ కోసం తెలుగులో ప్రశ్నలు మరియు సమాధానాలు సిద్ధం చేయబడుతున్నాయి.' :
               'Preparing customized questions and answers in your selected language.'}
            </p>
          </div>
        </div>
      ) : activeQuiz === null ? (
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
                  {LENGTH_SUBTITLE_LABELS[lang] || LENGTH_SUBTITLE_LABELS['en']}
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
                {STANDARD_SUBJECTS_LABELS[lang] || STANDARD_SUBJECTS_LABELS['en']}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GENERAL_QUIZZES.map((quiz) => (
                  <div 
                    key={quiz.id}
                    className="bg-white rounded-2xl border border-gray-150 p-4 shadow-3xs flex flex-col justify-between hover:border-[#81B29A] hover:shadow-2xs transition-all text-left group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase">
                        <span className="p-1 px-2 rounded-sm bg-gray-100 text-gray-650">
                          {SUBJECT_TRANSLATIONS[lang]?.[quiz.subject] || SUBJECT_TRANSLATIONS['en']?.[quiz.subject] || quiz.subject}
                        </span>
                        {getDifficultyBadge(quizDifficulty, lang)}
                      </div>
                      <h4 className="font-display font-extrabold text-sm text-[#3D405B] group-hover:text-[#E07A5F] transition-colors leading-snug">
                        {QUIZ_TITLE_TRANSLATIONS[lang]?.[quiz.id] || quiz.title}
                      </h4>
                      <p className="text-[11px] text-gray-450 pr-4">
                        {quizLength} {QUIZ_DESC_TRANSLATIONS[lang] || QUIZ_DESC_TRANSLATIONS['en']}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => startQuizDeck(quiz)}
                      className="w-full mt-4 py-2 bg-[#FAF8F4] border border-[#F2CC8F]/50 group-hover:bg-[#E07A5F] group-hover:text-white group-hover:border-transparent rounded-xl text-xs font-sans font-bold text-[#3D405B] text-center transition-all cursor-pointer"
                    >
                      {START_GAME_LABELS[lang] || START_GAME_LABELS['en']}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI QUIZ GENERATOR BLOCK (Right) */}
            <div className="lg:col-span-4 space-y-4 text-left">
              <h3 className="font-display font-extrabold text-xs text-gray-500 uppercase tracking-widest">
                {AI_QUIZ_SYNTHESIZER_LABELS[lang] || AI_QUIZ_SYNTHESIZER_LABELS['en']}
              </h3>

              <div className="bg-white rounded-2xl border border-[#F2CC8F]/30 p-5 shadow-3xs space-y-4">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-xs text-gray-900 flex items-center gap-1.5 uppercase">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    {CUSTOM_QUIZ_GENERATOR_LABELS[lang] || CUSTOM_QUIZ_GENERATOR_LABELS['en']}
                  </h4>
                  <p className="text-[10px] text-gray-400">{CUSTOM_QUIZ_SUBTITLE_LABELS[lang] || CUSTOM_QUIZ_SUBTITLE_LABELS['en']}</p>
                </div>

                <form onSubmit={handleGenerateCustomQuiz} className="space-y-3">
                  <input
                    type="text"
                    value={customTopic}
                    disabled={isGeneratingCustom}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder={ENTER_TOPIC_PLACEHOLDERS[lang] || ENTER_TOPIC_PLACEHOLDERS['en']}
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
                        <span>{ASSEMBLING_QUESTIONS_LABELS[lang] || ASSEMBLING_QUESTIONS_LABELS['en']}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4.5 w-4.5 text-[#F2CC8F]" />
                        <span>{GENERATE_CUSTOM_GAME_LABELS[lang] || GENERATE_CUSTOM_GAME_LABELS['en']}</span>
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
                {QUIZ_TITLE_TRANSLATIONS[lang]?.[activeQuiz.id] || activeQuiz.title}
              </span>
              {activeQuiz.difficulty && getDifficultyBadge(activeQuiz.difficulty, lang)}
            </div>
            
            <button
              onClick={() => { stopSpeaking(); setActiveQuiz(null); }}
              className="text-xs bg-gray-100 px-3 py-1 hover:bg-gray-200 rounded-lg font-bold font-sans cursor-pointer text-gray-500"
            >
              {EXIT_QUIZ_LABELS[lang] || "Exit X"}
            </button>
          </div>

          {!roundFinished ? (
            <div className="space-y-5">
              
              <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                <span>{PROGRESS_LABELS[lang] || "PROGRESS"}: {QUESTION_LABELS[lang] || "Question"} {currentQuestionIndex + 1} {OF_LABELS[lang] || "of"} {activeQuiz.questions.length}</span>
                <span className="font-bold text-[#E07A5F]">{ACCURACY_LABELS[lang] || "Current accuracy"}: {roundMinsScore}/{currentQuestionIndex}</span>
              </div>

              {/* TIMER DISPLAY */}
              {selectedOpt === null && (
                <div className="space-y-1.5 p-3.5 bg-gray-50/50 rounded-2xl border border-gray-150 animate-fade-in text-left">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-[#E07A5F] font-black">
                      <Timer className={`h-4.5 w-4.5 ${timeLeft <= 10 ? 'text-rose-600 animate-spin' : 'text-amber-500 animate-pulse'}`} />
                      <span>
                        {timeLeft} {lang === 'gu' ? 'સેકન્ડ બાકી' : 
                         lang === 'hi' ? 'सेकंड बचे' : 
                         lang === 'mr' ? 'सेकंड शिल्लक' : 
                         lang === 'ta' ? 'வினாடிகள் மீதமுள்ளன' : 
                         lang === 'te' ? 'సెకన్లు మిగిలి ఉన్నాయి' : 
                         'seconds remaining'}
                      </span>
                    </span>
                    <span className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">{timerLimit}s limit</span>
                  </div>
                  <div className="w-full bg-gray-200/65 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                        timeLeft <= 10 ? 'bg-rose-500 animate-pulse' : timeLeft <= 20 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(timeLeft / timerLimit) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Question Screen */}
              <div className="p-5 bg-[#FAF8F4] border border-[#F2CC8F]/30 rounded-2xl">
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold block text-gray-400">{CONCEPT_PROBE_LABELS[lang] || "Standard Concept Probe"}</span>
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
                    {selectedOpt === -1 ? (
                      <span className="text-rose-600">⏰ {TIME_UP_LABELS[lang] || "Time's Up!"}</span>
                    ) : selectedOpt === activeQuiz.questions[currentQuestionIndex].answerIndex ? (
                      <span className="text-emerald-700">🎉 {BRAVO_LABELS[lang] || "Bravo! Correct"}</span>
                    ) : (
                      <span className="text-rose-600">🌱 {EXPLANATION_HEADER_LABELS[lang] || "Study Point Explanation"}</span>
                    )}
                  </div>
                  <p className="text-gray-650 leading-relaxed text-xs">
                    {activeQuiz.questions[currentQuestionIndex].explanation}
                  </p>

                  <button
                    onClick={handleNextQ}
                    className="mt-2.5 text-xs font-bold px-4 py-2 bg-[#3D405B] hover:bg-[#2D2F44] text-white rounded-lg cursor-pointer"
                  >
                    {currentQuestionIndex + 1 < activeQuiz.questions.length ? (NEXT_QUESTION_LABELS[lang] || "Next Question ➡️") : (FINISH_LABELS[lang] || "Finish Game 🏁")}
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* CONGRATULATIONS PANEL */
            <div className="p-6 space-y-6">
              
              {/* Animated Header & Trophy */}
              <div className="text-center space-y-2">
                <div className="text-6xl animate-bounce mb-3">
                  {(roundMinsScore / activeQuiz.questions.length) >= 0.5 ? "🏆" : "💪"}
                </div>
                <h4 className="font-display font-extrabold text-2xl text-[#3D405B] tracking-tight">
                  {CHALLENGE_COMPLETE_LABELS[lang] || "Challenge Complete!"}
                </h4>
                <p className="text-sm text-gray-500 font-medium max-w-md mx-auto">
                  {getCompletedScoreText(lang, roundMinsScore, activeQuiz.questions.length)}
                </p>

                {/* PASS / FAIL STATUS BADGE */}
                <div className="flex justify-center pt-2">
                  {(roundMinsScore / activeQuiz.questions.length) >= 0.5 ? (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-sans font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xs animate-pulse">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      {PASS_STATUS_LABELS[lang] || "PASSED ✅"}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 font-sans font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      {FAIL_STATUS_LABELS[lang] || "FAILED ❌"}
                    </div>
                  )}
                </div>
              </div>

              {/* Instant Score Gauge / Circular Ring */}
              <div className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl border border-gray-100 shadow-xs max-w-sm mx-auto">
                <div className="relative flex items-center justify-center h-28 w-28">
                  {/* Background track circle */}
                  <svg className="absolute transform -rotate-90 w-28 h-28">
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke="#f3f4f6"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    {/* Active progress circle */}
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      stroke={
                        (roundMinsScore / activeQuiz.questions.length) >= 0.8 
                          ? "#81B29A" 
                          : (roundMinsScore / activeQuiz.questions.length) >= 0.5 
                          ? "#F2CC8F" 
                          : "#E07A5F"
                      }
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 46}
                      strokeDashoffset={(2 * Math.PI * 46) - ((roundMinsScore / activeQuiz.questions.length) * (2 * Math.PI * 46))}
                      className="transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Core percentage label */}
                  <div className="text-center space-y-0.5 z-10">
                    <span className="block text-2xl font-black text-[#3D405B]">
                      {Math.round((roundMinsScore / activeQuiz.questions.length) * 100)}%
                    </span>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                      {roundMinsScore} / {activeQuiz.questions.length}
                    </span>
                  </div>
                </div>

                {/* Score Tagline */}
                <span className="mt-4 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full font-mono shadow-3xs" style={{
                  backgroundColor: (roundMinsScore / activeQuiz.questions.length) >= 0.8 ? "#e8f5e9" : (roundMinsScore / activeQuiz.questions.length) >= 0.5 ? "#fdf6e2" : "#fdf2f2",
                  color: (roundMinsScore / activeQuiz.questions.length) >= 0.8 ? "#1b5e20" : (roundMinsScore / activeQuiz.questions.length) >= 0.5 ? "#b78103" : "#c62828"
                }}>
                  {(roundMinsScore / activeQuiz.questions.length) === 1 
                    ? (lang === 'hi' ? "उत्कृष्ट प्रदर्शन!" : "PERFECT SCORE!")
                    : (roundMinsScore / activeQuiz.questions.length) >= 0.8
                    ? (lang === 'hi' ? "शानदार!" : "GREAT WORK!")
                    : (roundMinsScore / activeQuiz.questions.length) >= 0.5
                    ? (lang === 'hi' ? "अच्छा प्रयास!" : "PASSING EFFORT!")
                    : (lang === 'hi' ? "अभ्यास करते रहें!" : "KEEP PRACTICING!")}
                </span>
              </div>

              {/* Reward Points Payout Panel */}
              <div className="bg-[#81B29A]/15 border border-[#81B29A]/20 text-gray-800 p-4 rounded-2xl text-left text-xs space-y-2.5 max-w-md mx-auto">
                <h5 className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle className="h-4.5 w-4.5 text-[#81B29A]" /> {PAYOUT_REWARDS_LABELS[lang] || "Score payout rewards:"}
                </h5>
                <ul className="list-none pl-1 font-mono text-[11px] text-gray-650 space-y-1.5 font-bold">
                  <li className="flex items-center gap-1.5">
                    ✨ {POINTS_GAINED_LABELS[lang] || "Points gained"}: 
                    <span className="text-emerald-700 font-extrabold">+{roundMinsScore * 10} QP</span>
                  </li>
                  {roundMinsScore === activeQuiz.questions.length && (
                    <li className="text-amber-700 flex items-center gap-1.5 bg-amber-50/70 p-1.5 rounded-lg border border-amber-200/50">
                      ⭐ {SWEEP_BONUS_LABELS[lang] || "Streak clean sheet sweep bonus: +15 points!"}
                    </li>
                  )}
                </ul>
              </div>

              {/* QUESTION BY QUESTION DETAILED INTERACTIVE REVIEW */}
              <div className="text-left space-y-3.5 max-w-2xl mx-auto pt-2">
                <h5 className="font-display font-extrabold text-sm text-[#3D405B] border-b border-gray-100 pb-2 flex items-center gap-2">
                  <span>{REVIEW_ANSWERS_LABELS[lang] || "Detailed Review & Explanations 📝"}</span>
                </h5>
                
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {activeQuiz.questions.map((q, qIdx) => {
                    const chosenIndex = userAnswers[qIdx] !== undefined ? userAnswers[qIdx] : -1;
                    const isCorrect = chosenIndex === q.answerIndex;
                    const isTimeout = chosenIndex === -1;

                    return (
                      <div 
                        key={qIdx} 
                        className={`p-4 rounded-2xl border transition-all ${
                          isCorrect 
                            ? 'bg-emerald-50/20 border-emerald-150' 
                            : isTimeout 
                            ? 'bg-gray-50/40 border-gray-150' 
                            : 'bg-rose-50/20 border-rose-150'
                        }`}
                      >
                        {/* Question title and status header */}
                        <div className="flex justify-between items-start gap-3 mb-2.5">
                          <span className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">
                            {qIdx + 1}. {q.question}
                          </span>
                          <span className={`text-[10px] uppercase tracking-wider font-mono font-black shrink-0 px-2.5 py-1 rounded-full ${
                            isCorrect 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : isTimeout 
                              ? 'bg-gray-200 text-gray-700' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isCorrect ? "✅ " + (lang === 'hi' ? "सही" : "CORRECT") : isTimeout ? "⏰ " + (lang === 'hi' ? "समय समाप्त" : "TIME OUT") : "❌ " + (lang === 'hi' ? "गलत" : "INCORRECT")}
                          </span>
                        </div>

                        {/* Answer Choices Summary */}
                        <div className="space-y-1.5 text-xs font-sans text-gray-700">
                          {/* User's choice */}
                          <div className="flex items-start gap-1">
                            <span className="font-bold text-gray-500 shrink-0 min-w-[90px]">{YOUR_ANSWER_LABELS[lang] || "Your Answer"}:</span>
                            <span className={isCorrect ? 'text-emerald-700 font-semibold' : isTimeout ? 'text-gray-500 font-medium italic' : 'text-rose-700 font-semibold line-through'}>
                              {isTimeout 
                                ? (NO_ANSWER_TIMED_OUT[lang] || "No Answer (Timed Out)") 
                                : q.options[chosenIndex] || "N/A"}
                            </span>
                          </div>

                          {/* Correct option */}
                          {!isCorrect && (
                            <div className="flex items-start gap-1">
                              <span className="font-bold text-[#E07A5F] shrink-0 min-w-[90px]">{CORRECT_ANSWER_LABELS[lang] || "Correct Answer"}:</span>
                              <span className="text-emerald-700 font-bold">
                                {q.options[q.answerIndex]}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Explanation snippet for learning */}
                        <div className="mt-3 pt-2.5 border-t border-gray-100/60 text-[11px] leading-relaxed text-gray-500">
                          <span className="font-extrabold uppercase text-[9px] tracking-wider text-amber-600 block mb-0.5">
                            💡 {lang === 'hi' ? "अध्ययन बिंदु स्पष्टीकरण" : "EXPLANATION"}
                          </span>
                          {q.explanation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-4 border-t border-gray-100">
                {(roundMinsScore / activeQuiz.questions.length) >= 0.5 && (
                  <button
                    id="btn-claim-certificate"
                    onClick={() => {
                      setShowCertificateModal(true);
                      speakText(lang === 'hi' ? "बधाई हो! अपना नाम दर्ज करें और अपना प्रमाण पत्र प्राप्त करें।" : "Congratulations! Enter your name and claim your certificate.", lang, "Swami AI", "🤖 Swami AI");
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-650 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 animate-pulse"
                  >
                    📜 {CLAIM_CERT_BTN_LABELS[lang] || "Claim Certificate"}
                  </button>
                )}
                <button
                  onClick={() => startQuizDeck(activeQuiz)}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#3D405B] font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all duration-150 flex items-center justify-center gap-2"
                >
                  🔄 {RETRY_GAME_LABELS[lang] || "Retry Game"}
                </button>
                <button
                  onClick={() => { stopSpeaking(); setActiveQuiz(null); }}
                  className="px-6 py-2.5 bg-[#3D405B] hover:bg-[#2D2F44] text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2"
                >
                  🏁 {BACK_TO_SUBJECTS_LABELS[lang] || "Return to Dashboard"}
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* CERTIFICATE MODAL OVERLAY */}
      {showCertificateModal && activeQuiz && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              /* Hide all page content except the certificate area */
              body * {
                visibility: hidden !important;
              }
              #quiz-certificate-print-area, #quiz-certificate-print-area * {
                visibility: visible !important;
              }
              #quiz-certificate-print-area {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                max-width: 100vw !important;
                margin: 0 !important;
                padding: 3rem !important;
                border: 16px double #b45309 !important;
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                z-index: 9999999 !important;
              }
            }
          `}} />
          <div className="bg-[#FAF8F4] border border-[#F2CC8F] w-full max-w-2xl rounded-3xl shadow-2xl p-6 relative flex flex-col space-y-5 max-h-[95vh] overflow-y-auto text-left">
            
            {/* Header / Dismiss */}
            <div className="flex justify-between items-center border-b border-[#F2CC8F]/30 pb-3">
              <div className="flex items-center gap-2">
                <Award className="h-6 w-6 text-amber-500 animate-bounce" />
                <h3 className="font-display font-extrabold text-base sm:text-lg text-[#3D405B]">
                  {lang === 'hi' ? 'सफलता का प्रमाण पत्र 📜' : 'Achievement Certificate 📜'}
                </h3>
              </div>
              <button 
                id="close-cert-modal"
                onClick={() => setShowCertificateModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-200/50 text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Live Name Input field */}
            <div className="space-y-1.5 p-4 bg-white rounded-2xl border border-gray-150 shadow-3xs">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-500 font-mono">
                ✏️ {ENTER_NAME_LABELS[lang] || "Enter your full name for the certificate"}
              </label>
              <input
                id="input-cert-name"
                type="text"
                value={certificateName}
                onChange={(e) => {
                  setCertificateName(e.target.value);
                  onUpdateUser({ certificateName: e.target.value });
                }}
                placeholder={lang === 'hi' ? "जैसे: राहुल कुमार" : "e.g., Jane Doe"}
                className="w-full px-4 py-2 text-sm sm:text-base border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-50/50"
                maxLength={40}
              />
            </div>

            {/* Certificate Area */}
            <div id="quiz-certificate-print-area" className="relative p-6 sm:p-10 bg-white border-[12px] border-double border-amber-600/70 rounded-2xl shadow-inner text-center font-serif select-none overflow-hidden max-w-full">
              {/* Corner Ornaments */}
              <div className="absolute top-2 left-2 text-amber-600/50 text-xl">⚜️</div>
              <div className="absolute top-2 right-2 text-amber-600/50 text-xl">⚜️</div>
              <div className="absolute bottom-2 left-2 text-amber-600/50 text-xl">⚜️</div>
              <div className="absolute bottom-2 right-2 text-amber-600/50 text-xl">⚜️</div>

              {/* Watermark in background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <Brain className="w-96 h-96 text-amber-600" />
              </div>

              {/* Header */}
              <div className="space-y-1">
                <h2 className="text-amber-700 font-black text-sm sm:text-base tracking-[0.15em] font-sans">
                  {CERTIFICATE_TITLE_LABELS[lang] || "CERTIFICATE OF ACHIEVEMENT"}
                </h2>
                <div className="w-36 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto" />
              </div>

              {/* Presentation Line */}
              <p className="text-[10px] sm:text-xs text-gray-400 italic mt-6 tracking-wide font-sans font-bold">
                {CERT_SUBTITLE_LABELS[lang] || "PROUDLY PRESENTED TO"}
              </p>

              {/* Recipient Name */}
              <h1 className="text-xl sm:text-3xl font-extrabold text-[#3D405B] my-4 border-b-2 border-gray-100 pb-2 inline-block px-8 max-w-full truncate font-serif italic text-amber-900/90 min-h-[36px]">
                {certificateName.trim() || (lang === 'hi' ? "आपका नाम यहाँ" : "Your Name Here")}
              </h1>

              {/* Body Description */}
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-500 font-sans font-medium max-w-md mx-auto leading-relaxed">
                <p>
                  {CERT_BODY_LABELS[lang] || "for successfully passing the academic topic quiz on"}
                </p>
                <p className="font-black text-[#3D405B] text-sm sm:text-base tracking-tight font-serif bg-amber-50/40 py-1 px-3 rounded-lg border border-amber-100/30 inline-block">
                  🎯 {activeQuiz.title}
                </p>
                <p>
                  {CERT_SCORE_LABELS[lang] || "with a remarkable accuracy score of"}{" "}
                  <span className="font-extrabold text-emerald-700 text-sm sm:text-base">
                    {Math.round((roundMinsScore / activeQuiz.questions.length) * 100)}%
                  </span>{" "}
                  ({roundMinsScore}/{activeQuiz.questions.length} {lang === 'hi' ? "उत्तर सही" : "correct"})
                </p>
              </div>

              {/* Signature, Stamp & Date Row */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-8 pt-6 border-t border-gray-100/80">
                {/* Date */}
                <div className="text-center sm:text-left space-y-1">
                  <span className="block text-[10px] sm:text-xs text-gray-400 font-bold font-sans uppercase tracking-wider">{CERT_DATE_LABELS[lang] || "Date of Achievement"}</span>
                  <span className="block text-xs font-bold text-gray-700 font-mono">
                    {new Date().toLocaleDateString(lang === 'en' ? 'en-US' : lang, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                {/* Gold Seal / Badge */}
                <div className="relative flex items-center justify-center shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 rounded-full border-4 border-white shadow-md">
                  <div className="absolute inset-1 rounded-full border-2 border-dashed border-amber-600/50 animate-pulse" />
                  <div className="text-center z-10 text-amber-950">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 mx-auto text-amber-900" />
                    <span className="text-[7px] sm:text-[9px] font-black tracking-widest font-sans">OFFICIAL</span>
                  </div>
                  {/* Decorative ribbon tails */}
                  <div className="absolute -bottom-3 left-2 w-3 h-6 bg-red-600/80 transform rotate-12 -z-10 rounded-b-xs" />
                  <div className="absolute -bottom-3 right-2 w-3 h-6 bg-red-600/80 transform -rotate-12 -z-10 rounded-b-xs" />
                </div>

                {/* Signature */}
                <div className="text-center sm:text-right space-y-1">
                  <span className="block text-[10px] sm:text-xs text-gray-400 font-bold font-sans uppercase tracking-wider">AUTHORIZED SIGNATURE</span>
                  <span className="block text-sm font-bold text-amber-800 italic font-serif leading-none select-none tracking-wide pt-1">
                    ✍️ Swami AI Tutor
                  </span>
                  <div className="w-28 sm:w-32 h-0.5 bg-gray-200 mx-auto sm:mr-0" />
                  <span className="block text-[9px] font-bold text-gray-400 font-sans">{CERT_SIGN_LABELS[lang] || "Swami AI Academic Dean"}</span>
                </div>
              </div>

              {/* Secure verification metadata footer */}
              <div className="mt-8 text-center text-[8px] sm:text-[10px] text-gray-400 font-mono border-t border-gray-100 pt-4 flex flex-col sm:flex-row justify-between gap-2">
                <span>🔒 SECURE STUDY METRICS SYNC VERIFIED</span>
                <span className="font-bold tracking-wider">{certificateId || 'CERT-SWAMI-SESSION'}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-3 border-t border-[#F2CC8F]/35">
              <button
                id="btn-print-certificate"
                onClick={handleDownloadCertificatePDF}
                disabled={!certificateName.trim() || isGeneratingPdf}
                className={`px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-xs ${(!certificateName.trim() || isGeneratingPdf) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isGeneratingPdf ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{lang === 'hi' ? 'पीडीएफ जनरेट हो रहा है...' : 'Generating PDF...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4.5 w-4.5" />
                    <span>{lang === 'hi' ? 'प्रमाण पत्र डाउनलोड करें 📥' : 'Download Certificate 📥'}</span>
                  </>
                )}
              </button>
              <button
                id="btn-close-cert"
                onClick={() => setShowCertificateModal(false)}
                className="px-5 py-2.5 bg-[#3D405B] hover:bg-[#2D2F44] text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all"
              >
                {lang === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
