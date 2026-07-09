import { useState, useEffect } from 'react';
import { LanguageCode, User } from '../../types';
import { TRANSLATIONS } from '../../data/translations';
import { speakText, stopSpeaking } from '../../utils/speech';
import { 
  Compass, BookOpen, GraduationCap, ChevronRight, Sparkles, 
  Smile, ArrowRight, Heart, ArrowLeft, Loader2, Sparkle, AlertCircle, CheckCircle, Award,
  IndianRupee, Wrench, Code, MessageSquare
} from 'lucide-react';

interface CareerGuidanceTabProps {
  lang: LanguageCode;
  user?: User;
}

interface AICareer {
  title: string;
  suitability: string;
  reason: string;
  exams?: { 
    name: string; 
    eligibility: string; 
    requiredSubjects: string; 
    minQualifications: string; 
    ageLimit: string; 
    tips: string; 
  }[];
  salary?: {
    beginner: string;
    midLevel: string;
    experienced: string;
  };
  growth?: {
    futureScope: string;
    jobOpportunities: string;
    demand: string;
    careerGrowth: string;
  };
  skills?: {
    technical: string[];
    soft: string[];
  };
  scholarship?: string;
  scholarshipsList?: {
    name: string;
    amount: string;
    eligibility: string;
    description: string;
  }[];
}

interface AICourse {
  name: string;
  duration: string;
  institutions: string;
  alignment: string;
  exams?: { 
    name: string; 
    eligibility: string; 
    requiredSubjects: string; 
    minQualifications: string; 
    ageLimit: string; 
    tips: string; 
  }[];
}

interface AIResult {
  careers: AICareer[];
  courses: AICourse[];
  advice: string;
  recommendedStream: {
    streamName: string;
    reason: string;
    subjectsToFocus: string;
    after10thOptions: string;
    after12thCareers: string;
  };
  learningRoadmap: {
    phaseName: string;
    milestone: string;
    skills: string[];
    exams: string[];
    description: string;
  }[];
}

const CAREERS = [
  {
    id: 'agri-sci',
    title: 'Agriculture Scientist 🌾',
    category: 'Rural Science & Farming',
    desc: 'Automates yield processes, protects cash crops, analyzes soil health, and creates organic fertilizers.',
    subjects: 'Biology, Chemistry, Modern Farming Tech',
    roadmap: 'Pass Class 10 -> Science Stream (PCB) -> Bachelors in Agricultural Science (B.Sc. Agri) -> Research Scientist.',
    scholarship: 'ICAR National Talent Scholarships (NTS), India Agri-Research Fellowship.',
    scholarshipsList: [
      {
        name: "ICAR National Talent Scholarship (NTS)",
        amount: "₹3,000 per month",
        eligibility: "Admitted to a state agricultural university outside of their home state through ICAR-AIEEA.",
        description: "Provided by the Indian Council of Agricultural Research to encourage national mobility in agricultural education."
      },
      {
        name: "Post Matric Scholarship Scheme",
        amount: "Up to ₹1,200 per month + full course fee waiver",
        eligibility: "SC, ST, or OBC students whose annual family income is below ₹2.5 Lakhs (varies slightly by state).",
        description: "Administered by individual states with central assistance, providing full fee coverage and living stipends."
      },
      {
        name: "Swami Vivekananda Merit-cum-Means (SVMCM)",
        amount: "₹12,000 to ₹60,000 per year",
        eligibility: "Class 12 pass with 60% or more, family income under ₹2.5 Lakhs per year.",
        description: "A highly popular and effective state scholarship supporting students of science and vocational streams."
      }
    ],
    salary: {
      beginner: '₹3,50,000 - ₹5,00,000 per annum',
      midLevel: '₹6,00,000 - ₹10,00,000 per annum',
      experienced: '₹12,00,000 - ₹20,00,000+ per annum'
    },
    growth: {
      futureScope: 'Extremely promising with the emergence of precision agriculture, vertical farming, bio-pesticides, and climate-resilient crop research.',
      jobOpportunities: 'Agricultural research institutes (ICAR), public sector seed corporations, private agro-chemical firms, food processing companies, and soil conservation boards.',
      demand: 'High and rising as India balances sustainable ecological farming with food security demands for a growing population.',
      careerGrowth: 'Research Fellow -> Scientist / Assistant Professor -> Senior Scientist -> Principal Scientist -> Director of Agricultural Research.'
    },
    exams: [
      {
        name: 'ICAR AIEEA (UG)',
        eligibility: '10+2 with Physics, Chemistry, Biology/Agriculture, with at least 50% marks.',
        requiredSubjects: 'Physics, Chemistry, Biology, Mathematics or Agriculture',
        minQualifications: 'Completed or appearing in Class 12 Board Exams',
        ageLimit: 'Minimum 16 years of age, no upper age limit',
        tips: 'Thoroughly cover NCERT class 11 and 12 Biology and basic Agriculture terminology. Practice daily MCQ mock tests.'
      },
      {
        name: 'State Agriculture CETs (e.g. MH-CET, KCET)',
        eligibility: 'Resident of respective state, 10+2 with Science stream.',
        requiredSubjects: 'Physics, Chemistry, Biology or Mathematics',
        minQualifications: 'Class 12 pass with at least 45-50% marks',
        ageLimit: 'Minimum 16 or 17 years depending on state, no upper age limit',
        tips: 'Focus on state-board textbooks for Biology and Chemistry. Solve past 10 years papers.'
      }
    ],
    skills: {
      technical: ['Soil Chemistry Analysis', 'Bio-fertilizer Formulation', 'Crop Pathology Diagnostics', 'Precision Agriculture Software', 'GIS Mapping'],
      soft: ['Critical Thinking', 'Patience & Persistence', 'Scientific Writing', 'Rural Communication & Collaboration']
    }
  },
  {
    id: 'renew-tech',
    title: 'Solar & Renewable Grid Engineer ☀️',
    category: 'Engineering & Green Power',
    desc: 'Sets up localized solar panel mini-grids and wind setups to provide continuous electricity to rural villages.',
    subjects: 'Physics, Mathematics, Electrical Circuits',
    roadmap: 'Pass Class 10 -> Vocational ITI Diploma or Science Stream (PCM) -> B.Tech in Power Engineering.',
    scholarship: 'PRERANA Rural Engineering Scholarships, National Solar Mission training aids.',
    scholarshipsList: [
      {
        name: "AICTE Pragati Scholarship for Girls",
        amount: "₹50,000 per year for up to 4 years",
        eligibility: "Female students admitted to first-year B.Tech or Diploma courses, family income below ₹8 Lakhs.",
        description: "An outstanding initiative by AICTE to promote girl children pursuing higher technical education."
      },
      {
        name: "ONGC Scholarship Scheme",
        amount: "₹48,000 per year",
        eligibility: "SC, ST, or OBC students pursuing engineering, minimum 60% in Class 12 board exams.",
        description: "An industry-supported scheme helping meritorious students with interest in energy technologies."
      },
      {
        name: "Prime Minister's Special Scholarship Scheme (PMSSS)",
        amount: "Up to ₹1.25 Lakhs per year + maintenance allowances",
        eligibility: "Students from J&K or Ladakh boards seeking technical degrees in mainstream Indian institutions.",
        description: "Facilitates high-quality technical education for students in target union territories."
      }
    ],
    salary: {
      beginner: '₹4,00,000 - ₹6,00,000 per annum',
      midLevel: '₹7,00,000 - ₹12,00,000 per annum',
      experienced: '₹15,00,000 - ₹25,00,000+ per annum'
    },
    growth: {
      futureScope: 'Rapid transition towards green energy, microgrids, battery energy storage systems, and electric vehicle (EV) infrastructure.',
      jobOpportunities: 'Solar panel developers, public power grids, eco-energy consultancies, hydroelectric and wind-farm developers, and government energy agencies.',
      demand: 'Exponentially growing due to India\'s national targets of achieving net-zero emissions and deploying massive clean energy grids.',
      careerGrowth: 'Graduate Engineer Trainee -> Design Engineer -> Senior Project Manager -> Renewable Energy Consultant -> Chief Technical Officer (CTO).'
    },
    exams: [
      {
        name: 'JEE Main',
        eligibility: 'Passed or appearing in 10+2 with Physics, Mathematics, and Chemistry/Biotechnology.',
        requiredSubjects: 'Physics, Mathematics, Chemistry/Biotechnology/Technical Vocational subject',
        minQualifications: 'Class 12th Pass or equivalent qualifying exam',
        ageLimit: 'No age limit for JEE Main, but college admission might have specific requirements',
        tips: 'Prioritize understanding physical concepts in Electrostatics, Thermodynamics, and command over Calculus in Mathematics.'
      },
      {
        name: 'State level CETs (COMEDK, WBJEE, TNEA)',
        eligibility: '10+2 with PCM, criteria varies slightly by state.',
        requiredSubjects: 'Physics, Chemistry, Mathematics',
        minQualifications: 'Class 12 passed with 45-50% marks',
        ageLimit: 'Usually minimum 17 years of age, no upper limit',
        tips: 'Time management is key. Solve speed-based question papers and focus on scoring formulas.'
      }
    ],
    skills: {
      technical: ['Solar PV Sizing', 'Microgrid Designing', 'Power System Protection', 'Battery Management Systems (BMS)', 'AutoCAD Electrical'],
      soft: ['Complex Problem Solving', 'Safety Orientation', 'Team Coordination', 'Field Adaptability']
    }
  },
  {
    id: 'vet-doc',
    title: 'Community Veterinary Doctor 🩺',
    category: 'Livestock Care & Healthcare',
    desc: 'Keeps livestock, dairy cattle, poultry, and farming companions clean, vaccinated, and healthy.',
    subjects: 'Animal Physiology, Biology, Veterinary Medicines',
    roadmap: 'Pass Class 10 -> Biology Stream (PCB) -> Bachelor of Veterinary Science (B.V.Sc & AH) -> Registered Veterinary Doctor.',
    scholarship: 'VCI Merit Scholarships, Indian Animal Welfare Research Assistances.',
    scholarshipsList: [
      {
        name: "Veterinary Council of India (VCI) Merit Scholarship",
        amount: "₹1,000 per month",
        eligibility: "Top scorers of veterinary state CETs/NEET who are admitted to recognized veterinary colleges.",
        description: "Awarded by the Veterinary Council of India to encourage promising talent in veterinary sciences."
      },
      {
        name: "National Fellowship for OBC Candidates",
        amount: "₹31,000 to ₹35,000 per month + HRA",
        eligibility: "OBC veterinary graduates pursuing post-graduation or PhD in Veterinary Sciences and who qualify NET/ICAR exams.",
        description: "Excellent central scheme designed to fund research in animal genetics, livestock pathology, and diagnostics."
      },
      {
        name: "State Veterinary Student Stipend",
        amount: "₹2,500 to ₹5,000 per semester",
        eligibility: "Students belonging to agricultural/rural families enrolled in state animal husbandry universities.",
        description: "State-specific financial grants to help veterinary students cover laboratory fees and medicine kits."
      }
    ],
    salary: {
      beginner: '₹3,60,000 - ₹5,50,000 per annum',
      midLevel: '₹7,00,000 - ₹11,00,000 per annum',
      experienced: '₹12,00,000 - ₹18,00,000+ per annum'
    },
    growth: {
      futureScope: 'Expanding opportunities in organic dairy farming, zoological parks, animal genetics, research sectors, and advanced animal surgical procedures.',
      jobOpportunities: 'State animal husbandry departments, milk federations (like Amul), private veterinary hospitals, wildlife sanctuaries, and pharmaceutical research centers.',
      demand: 'Perennially high in rural economies deeply integrated with animal livestock, alongside booming urban companion care markets.',
      careerGrowth: 'Veterinary Officer -> Senior Veterinary Surgeon -> District Animal Husbandry Officer -> Specialized Consultant -> Director of Animal Husbandry.'
    },
    exams: [
      {
        name: 'NEET-UG',
        eligibility: '10+2 with Physics, Chemistry, Biology/Biotechnology, and English with minimum 50% aggregate.',
        requiredSubjects: 'Physics, Chemistry, Biology/Biotechnology, English',
        minQualifications: 'Class 12 (PCB) pass or equivalent',
        ageLimit: 'Minimum 17 years as of 31st December of admission year, no upper age limit',
        tips: 'NCERT is your bible. Master Animal Kingdom and Genetics chapters. Take structured mock tests weekly.'
      }
    ],
    skills: {
      technical: ['Animal Surgical Procedures', 'Pathological Diagnostics', 'Livestock Nutrition Sizing', 'Pharmacotherapy Administration', 'Vaccination Scheduling'],
      soft: ['Empathy & Compassion', 'Stress Management', 'Quick Decision Making', 'Farmer Counseling']
    }
  },
  {
    id: 'cyber-code',
    title: 'Software Developer & Cyber Security 💻',
    category: 'Information Technology',
    desc: 'Codes localized mobile utility applications, manages cloud storage architectures securely, and guides cyber security.',
    subjects: 'Computer science, Algebra, English literacy',
    roadmap: 'Pass Class 10 -> PCM stream or Polytechnic CS -> Bachelor in Computer Applications (BCA) or B.Tech CS.',
    scholarship: 'PM Narendra Modi Scholarship Scheme for Technical streams, AICTE rural coder awards.',
    scholarshipsList: [
      {
        name: "AICTE Saksham Scholarship Scheme",
        amount: "₹50,000 per year",
        eligibility: "Differently-abled students pursuing degree/diploma in technical courses (Computer Science/BCA).",
        description: "Provides financial aid for technical skill development, books, and assistive devices like laptops."
      },
      {
        name: "HDFC Bank Badhte Kadam Scholarship",
        amount: "₹30,000 to ₹1,00,000 per year",
        eligibility: "Students pursuing professional courses (BCA/B.Tech), family income under ₹6 Lakhs, with strong academic record.",
        description: "A corporate CSR initiative focused on assisting talented but economically weaker students in engineering & tech."
      },
      {
        name: "Google Generation Scholarship (APAC)",
        amount: "USD 2,500 (approx. ₹2 Lakhs)",
        eligibility: "Female students enrolled in an undergraduate Computer Science, IT, or cybersecurity degree.",
        description: "Prestigious global scholarship that supports women in technology and security fields."
      }
    ],
    salary: {
      beginner: '₹5,00,000 - ₹8,00,000 per annum',
      midLevel: '₹10,00,000 - ₹18,00,000 per annum',
      experienced: '₹20,00,000 - ₹40,00,000+ per annum'
    },
    growth: {
      futureScope: 'Pivotal role with the rapid integration of artificial intelligence (AI), machine learning, blockchain, cloud computing, and next-gen cybersecurity protocols.',
      jobOpportunities: 'Global IT majors, high-growth startups, banking & financial institutions, cybersecurity agencies, military intelligence, and freelance app development.',
      demand: 'Extremely high. Virtually every sector is undergoing aggressive digital transformation, rendering software and security expertise non-negotiable.',
      careerGrowth: 'Junior Developer / Security Analyst -> Tech Lead / Security Consultant -> Software Architect -> Chief Information Security Officer (CISO) or CTO.'
    },
    exams: [
      {
        name: 'NIMCET (for MCA) / IPU CET / CUET-UG',
        eligibility: 'For BCA/B.Sc: 10+2 with Mathematics/Computer Science. For B.Tech: 10+2 with PCM.',
        requiredSubjects: 'Mathematics, Physics, Chemistry or Computer Science',
        minQualifications: 'Class 12 pass with at least 50% marks',
        ageLimit: 'No age limit for CUET; other university specific tests have a maximum age of 21-25 years',
        tips: 'Build a strong foundation in Algebra, Trigonometry, and Probability. Practice logical reasoning and basic hardware/software awareness.'
      }
    ],
    skills: {
      technical: ['Full-stack Development (React/Node.js)', 'Vulnerability Assessment', 'Cloud Infrastructure Security', 'Database Administration', 'Network Firewalls'],
      soft: ['Analytical Problem Solving', 'Adaptability & Continuous Learning', 'Communication of Security Risks', 'Collaboration']
    }
  },
  {
    id: 'gov-teacher',
    title: 'Civil Servant or Educator 🏛️',
    category: 'Administration & Education',
    desc: 'Guides local administration, manages rural welfare schemes, or teaches primary and secondary schools.',
    subjects: 'Civics, History, Language Literature, Pedagogy',
    roadmap: 'Pass Class 10 -> Arts/Science stream -> Bachelor Degree (BA/B.Sc) -> Clear UPSC/State Civil exams or B.Ed.',
    scholarship: 'National Fellowship Schemes, State Welfare training grant vouchers.',
    scholarshipsList: [
      {
        name: "UGC Postgraduate Scholarship for Single Girl Child",
        amount: "₹36,200 per annum for 2 years",
        eligibility: "Postgraduate students who are single girl child in their family, pursuing regular PG or B.Ed degrees.",
        description: "Promotes higher educational opportunities and training for female teachers and administrators."
      },
      {
        name: "Central Sector Scheme of Scholarship",
        amount: "₹12,00,00 to ₹20,000 per year",
        eligibility: "Class 12 board percentile above 80th rank, pursuing professional or regular courses like BA, B.Sc, B.Ed.",
        description: "Ministry of Education scheme providing financial support to excellent regular non-technical students."
      },
      {
        name: "State Teacher Training & B.Ed Concession Scheme",
        amount: "Full or partial tuition fee waiver",
        eligibility: "Students from rural or low-income families enrolled in recognized state B.Ed colleges.",
        description: "State-specific incentives to encourage local youth to take up remote primary and secondary teaching."
      }
    ],
    salary: {
      beginner: '₹3,60,000 - ₹6,00,000 per annum',
      midLevel: '₹8,00,000 - ₹15,00,000 per annum',
      experienced: '₹16,00,000 - ₹30,00,000+ per annum'
    },
    growth: {
      futureScope: 'Evolving toward digitized public governance (e-Governance) and modern, technology-enhanced smart classrooms and educational pedagogy.',
      jobOpportunities: 'Government administrative departments, public/private schools and colleges, training institutes, state civil service boards, and non-governmental organizations.',
      demand: 'Perennial and stable. The scale of Indian administrative machinery and educational outreach ensures a continuous requirement for skilled professionals.',
      careerGrowth: 'Assistant Professor / Deputy Collector -> Principal / District Magistrate -> Head of Department / State Commissioner -> University Dean / State Secretary.'
    },
    exams: [
      {
        name: 'UPSC Civil Services Examination (CSE)',
        eligibility: 'Graduation degree in any stream from a recognized university. Age 21 to 32 years.',
        requiredSubjects: 'Any subject (Arts, Science, Commerce or Engineering are all valid)',
        minQualifications: 'Graduate Degree (or in final year of Graduation)',
        ageLimit: 'Minimum 21 years, Maximum 32 years (Relaxation of 3 years for OBC, 5 years for SC/ST)',
        tips: 'Cultivate a strong daily habit of reading national newspapers (The Hindu/Indian Express). Master Polity, History, and geography basics.'
      },
      {
        name: 'CTET / State TET (for teachers)',
        eligibility: 'B.Ed or D.El.Ed degree with relevant graduation/senior secondary scores.',
        requiredSubjects: 'Child Development, Pedagogy, Languages, Environmental Studies or Science/Math/Social Science',
        minQualifications: 'Diploma in Elementary Education (D.El.Ed) or Bachelor of Education (B.Ed)',
        ageLimit: 'Minimum 17-18 years, No upper age limit for CTET',
        tips: 'Focus heavily on Child Development and Pedagogy. Practice classroom management concepts.'
      }
    ],
    skills: {
      technical: ['Pedagogy & Lesson Planning', 'e-Governance Software Management', 'Data-driven Public Reporting', 'Curriculum Design', 'Presentation Tools'],
      soft: ['Public Speaking', 'Empathy & Mentorship', 'Conflict Resolution', 'Leadership & Community Mobilization']
    }
  }
];

const CAREER_PAGE_TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    title: "Rural Career Companion & Mentor",
    subtitle: "Discover sustainable, highly paid professions, scholarship systems, and custom study timelines.",
    aiPlannerBtn: "AI Personalized Planner ✨",
    matchmakerBtn: "Discover Matchmaker ➡️",
    aiGuidanceTitle: "Swami AI Smart Guidance",
    aiGuidanceDesc: "Provide details below to receive a personalized analysis of best careers and college courses tailored for you.",
    backBtn: "Back",
    section1Title: "1. Tell Us About Yourself",
    favoriteSubjectLabel: "Favorite Subject",
    favoriteSubjectPlaceholder: "e.g. Mathematics, Biology, Civics",
    keyInterestsLabel: "Your Key Interests",
    keyInterestsPlaceholder: "e.g. green farming, solar energy, repairing mobile phones",
    hobbiesLabel: "Your Hobbies",
    hobbiesPlaceholder: "e.g. reading books, gardening, solving puzzles",
    skillsLabel: "Your Skills / Superpowers",
    skillsPlaceholder: "e.g. mental math, fast writing, caring for farm animals",
    personalityVibeLabel: "Personality Vibe",
    currentEduLevelLabel: "Current Education Level",
    careerGoalLabel: "Specific Career Goal / Ambition (Optional but recommended for College Course mapping)",
    careerGoalPlaceholder: "e.g. Agriculture Scientist, Solar Engineer, Software Developer, Civil Servant",
    generateBtn: "Generate Career & College Course Guide ✨",
    planningTitle: "Swami AI is planning your future...",
    planningDesc: "Evaluating favorite subjects, skills, interests, and matching top Indian colleges, vocational programs, and high-paying careers.",
    swamiCounselTitle: "Swami's personalized counsel",
    suggestedCareersTitle: "Suggested Career Options based on your profile",
    salaryInIndia: "Salary in India",
    salaryBeginner: "Beginner",
    salaryMid: "Mid-Level",
    salaryExp: "Experienced",
    scopeOpps: "Scope & Opportunities",
    futureScope: "Future Scope",
    opportunities: "Opportunities",
    demandInIndia: "Demand in India",
    careerGrowth: "Career Growth",
    entranceExams: "Entrance Exams",
    eligibility: "Eligibility",
    subjects: "Subjects",
    qualifications: "Qualifications",
    ageLimit: "Age Limit",
    prepTips: "Prep Tips",
    scholarshipsFinancialAid: "Scholarships & Financial Aid",
    scholarshipsInIndia: "Scholarships In India",
    bestCollegeCourses: "Best College Courses & Learning Pathways",
    duration: "Duration",
    topInstitutions: "Top Indian Institutions / Portals",
    alignmentOutcome: "Alignment & Outcome",
    admissionExams: "Admission Exams",
    streamAnalyzer: "Stream Suitability Analyzer",
    recommendedStream: "Recommended Stream",
    coreSubjectsFocus: "Core Subjects Focus",
    streamOptions10th: "Stream & Options After 10th",
    highPotential12th: "High-Potential Careers After 12th",
    milestoneExamTracker: "Milestone & Exam Tracker",
    learningRoadmap: "Your Step-by-Step Learning Roadmap",
    milestone: "Milestone",
    skills: "Skills",
    exams: "Exams",
    editProfileBtn: "Edit Profile & Re-calculate",
    returnDirectoryBtn: "Return to Directory",
    syllabusGameTitle: "Syllabus Interests Matching Game",
    cancelBtn: "Cancel X",
    questChecklist: "Quest Checklist: Step",
    of: "of",
    recommendedProfile: "Your Recommended Career Profile",
    roleDesc: "Role Description",
    studyRoadmapMilestones: "Study Pathway Milestones",
    recIndianScholarships: "Recommended Indian Scholarships",
    recSkillsToDevelop: "Recommended Skills to Develop",
    technicalSkills: "Technical Skills",
    softSkills: "Soft Skills",
    careerGrowthProspects: "Career Growth & Prospects",
    futureScopeTrends: "Future Scope & Trends",
    whereYouCanWork: "Where you can work",
    marketDemand: "Market Demand in India",
    promotionTrajectory: "Promotion Trajectory",
    replayMatchmaker: "Replay Matchmaker",
    browseAllPaths: "Browse All Paths",
    browseProfessionalStreams: "Browse Professional Streams",
    roleScope: "Role & Scope",
    recommendedSubjects: "Recommended subjects",
    academicRoadmapGrades: "Academic Roadmap (Grades)",
    requiredEntranceExams: "Required Entrance Exams & Preparation Guides",
    selectCareerPrompt: "Select a Career pathway from the list on the left to review its scholarship structure and academics roadmap.",
    matchLabel: "Match",
    required: "required",
    avgSalaryIndia: "Average Salary in India (Per Annum)",
    techSoftSkillsRequired: "Technical & Soft Skills Required",
    futureScopeDynamics: "Future Scope & Career Dynamics",
    eligibilityCriteria: "Eligibility Criteria",
    requiredSubjectsLabel: "Required Subjects",
    minQualificationsLabel: "Minimum Qualifications",
    ageLimitsLabel: "Age Limits",
    prepTipsLabel: "Prep Tips",
    grade10: "Grade 10",
    personality1: "Analytical & Focused (Likes solving puzzles & numbers)",
    personality2: "Social & Outgoing (Enjoys talking, leading & teaching)",
    personality3: "Caring & Caring (Likes animals, plant care & nursing)",
    personality4: "Creative & Artistic (Enjoys drawing, design & building things)",
    q1: "Where do you naturally love spending your holidays or free hours?",
    q1_opt1: "Outside checking green fields, crops, or caring livestock cows 🌾",
    q1_opt2: "At a table reading books, drawing, or exploring on cell phones 💻",
    q2: "Which subject do you score highest in or study with absolute excitement?",
    q2_opt1: "Ecology & Biology 🔬",
    q2_opt2: "Speed Mathematics 📐",
    q2_opt3: "Languages & Stories 🗣️",
    q2_opt4: "Logic & GK Brain Puzzles 🧠",
    q3: "If you could have one superpower, which would you pick to help your hometown?",
    q3_opt1: "Caring, curing, or healing sick animals and crops 🩺",
    q3_opt2: "Erecting solar energy grids or coding modern phone software 💻",
    q3_opt3: "Teaching children or administering village welfare councils 🏛️"
  },
  hi: {
    title: "ग्रामीण करियर साथी और मार्गदर्शक",
    subtitle: "टिकाऊ, उच्च वेतन वाले व्यवसायों, छात्रवृत्ति प्रणालियों और अनुकूलित अध्ययन समय-सीमाओं की खोज करें।",
    aiPlannerBtn: "AI व्यक्तिगत योजनाकार ✨",
    matchmakerBtn: "करियर मैचमेकर खोजें ➡️",
    aiGuidanceTitle: "स्वामी AI स्मार्ट मार्गदर्शन",
    aiGuidanceDesc: "अपने अनुकूल सर्वोत्तम करियर और कॉलेज पाठ्यक्रमों का व्यक्तिगत विश्लेषण प्राप्त करने के लिए नीचे विवरण प्रदान करें।",
    backBtn: "पीछे जाएं",
    section1Title: "1. अपने बारे में बताएं",
    favoriteSubjectLabel: "पसंदीदा विषय",
    favoriteSubjectPlaceholder: "जैसे: गणित, जीव विज्ञान, नागरिक शास्त्र",
    keyInterestsLabel: "आपकी मुख्य रुचियां",
    keyInterestsPlaceholder: "जैसे: जैविक खेती, सौर ऊर्जा, मोबाइल फोन ठीक करना",
    hobbiesLabel: "आपके शौक",
    hobbiesPlaceholder: "जैसे: किताबें पढ़ना, बागवानी, पहेलियां सुलझाना",
    skillsLabel: "आपके कौशल / महाशक्तियां",
    skillsPlaceholder: "जैसे: मानसिक गणित, तेज लेखन, पालतू जानवरों की देखभाल",
    personalityVibeLabel: "व्यक्तित्व वाइब",
    currentEduLevelLabel: "वर्तमान शिक्षा स्तर",
    careerGoalLabel: "विशिष्ट करियर लक्ष्य / महत्वाकांक्षा (कॉलेज पाठ्यक्रम मानचित्रण के लिए अनुशंसित)",
    careerGoalPlaceholder: "जैसे: कृषि वैज्ञानिक, सौर ऊर्जा इंजीनियर, सॉफ्टवेयर डेवलपर, सिविल सेवक",
    generateBtn: "करियर और कॉलेज पाठ्यक्रम गाइड तैयार करें ✨",
    planningTitle: "स्वामी AI आपके भविष्य की योजना बना रहे हैं...",
    planningDesc: "पसंदीदा विषयों, कौशलों, रुचियों का मूल्यांकन करना और शीर्ष भारतीय कॉलेजों, व्यावसायिक कार्यक्रमों और उच्च-वेतन वाले करियर का मिलान करना।",
    swamiCounselTitle: "स्वामी की व्यक्तिगत सलाह",
    suggestedCareersTitle: "आपकी प्रोफाइल के आधार पर सुझाए गए करियर विकल्प",
    salaryInIndia: "भारत में वेतन",
    salaryBeginner: "शुरुआती",
    salaryMid: "मध्यम स्तर",
    salaryExp: "अनुभवी",
    scopeOpps: "दायरा और अवसर",
    futureScope: "भविष्य का दायरा",
    opportunities: "अवसर",
    demandInIndia: "भारत में मांग",
    careerGrowth: "करियर विकास",
    entranceExams: "प्रवेश परीक्षाएं",
    eligibility: "पात्रता",
    subjects: "विषय",
    qualifications: "योग्यता",
    ageLimit: "आयु सीमा",
    prepTips: "तैयारी के टिप्स",
    scholarshipsFinancialAid: "छात्रवृत्ति और वित्तीय सहायता",
    scholarshipsInIndia: "भारत में छात्रवृत्तियां",
    bestCollegeCourses: "सर्वोत्तम कॉलेज पाठ्यक्रम और सीखने के मार्ग",
    duration: "अवधि",
    topInstitutions: "शीर्ष भारतीय संस्थान / पोर्टल",
    alignmentOutcome: "तालमेल और परिणाम",
    admissionExams: "प्रवेश परीक्षाएं",
    streamAnalyzer: "स्ट्रीम उपयुक्तता विश्लेषक",
    recommendedStream: "अनुशंसित स्ट्रीम",
    coreSubjectsFocus: "मुख्य विषयों पर ध्यान",
    streamOptions10th: "10वीं के बाद स्ट्रीम और विकल्प",
    highPotential12th: "12वीं के बाद उच्च क्षमता वाले करियर",
    milestoneExamTracker: "मील का पत्थर और परीक्षा ट्रैकर",
    learningRoadmap: "आपका चरण-दर-चरण सीखने का रोडमैप",
    milestone: "मील का पत्थर",
    skills: "कौशल",
    exams: "परीक्षाएं",
    editProfileBtn: "प्रोफ़ाइल संपादित करें और पुन: गणना करें",
    returnDirectoryBtn: "निर्देशिका पर लौटें",
    syllabusGameTitle: "पाठ्यक्रम रुचि मिलान खेल",
    cancelBtn: "रद्द करें X",
    questChecklist: "खोज चेकलिस्ट: चरण",
    of: "का",
    recommendedProfile: "आपकी अनुशंसित करियर प्रोफ़ाइल",
    roleDesc: "भूमिका विवरण",
    studyRoadmapMilestones: "अध्ययन मार्ग के मील के पत्थर",
    recIndianScholarships: "अनुशंसित भारतीय छात्रवृत्तियां",
    recSkillsToDevelop: "विकसित करने के लिए अनुशंसित कौशल",
    technicalSkills: "तकनीकी कौशल",
    softSkills: "सॉफ्ट स्किल्स",
    careerGrowthProspects: "करियर विकास और संभावनाएं",
    futureScopeTrends: "भविष्य का दायरा और रुझान",
    whereYouCanWork: "आप कहां काम कर सकते हैं",
    marketDemand: "भारत में बाजार की मांग",
    promotionTrajectory: "पदोन्नति प्रक्षेपवक्र",
    replayMatchmaker: "मैचमेकर दोबारा खेलें",
    browseAllPaths: "सभी पथ ब्राउज़ करें",
    browseProfessionalStreams: "व्यावसायिक स्ट्रीम ब्राउज़ करें",
    roleScope: "भूमिका और दायरा",
    recommendedSubjects: "अनुशंसित विषय",
    academicRoadmapGrades: "शैक्षणिक रोडमैप (ग्रेड)",
    requiredEntranceExams: "आवश्यक प्रवेश परीक्षाएं और तैयारी गाइड",
    selectCareerPrompt: "करियर के छात्रवृत्ति ढांचे और शैक्षणिक रोडमैप की समीक्षा करने के लिए बाईं ओर की सूची से एक पथ चुनें।",
    matchLabel: "मैच",
    required: "आवश्यक",
    avgSalaryIndia: "भारत में औसत वेतन (प्रति वर्ष)",
    techSoftSkillsRequired: "आवश्यक तकनीकी और सॉफ्ट कौशल",
    futureScopeDynamics: "भविष्य का दायरा और करियर गतिशीलता",
    eligibilityCriteria: "पात्रता मापदंड",
    requiredSubjectsLabel: "आवश्यक विषय",
    minQualificationsLabel: "न्यूनतम योग्यता",
    ageLimitsLabel: "आयु सीमा",
    prepTipsLabel: "तैयारी के टिप्स",
    grade10: "कक्षा 10",
    personality1: "विश्लेषणात्मक और केंद्रित (पहेलियां और संख्याएं हल करना पसंद है)",
    personality2: "सामाजिक और मिलनसार (बात करना, नेतृत्व करना और पढ़ाना पसंद है)",
    personality3: "देखभाल और सेवाभावी (जानवरों, पौधों की देखभाल और नर्सिंग पसंद है)",
    personality4: "रचनात्मक और कलात्मक (चित्र बनाना, डिज़ाइन और चीजें बनाना पसंद है)",
    q1: "आप स्वाभाविक रूप से अपनी छुट्टियां या खाली घंटे कहां बिताना पसंद करते हैं?",
    q1_opt1: "बाहर हरे-भरे खेतों, फसलों को देखने या गायों-बैलों की देखभाल करने में 🌾",
    q1_opt2: "टेबल पर किताबें पढ़ने, चित्र बनाने या मोबाइल फोन पर नई चीजें खोजने में 💻",
    q2: "आप किस विषय में सबसे अधिक अंक प्राप्त करते हैं या पूरे उत्साह के साथ पढ़ते हैं?",
    q2_opt1: "पारिस्थितिकी और जीव विज्ञान 🔬",
    q2_opt2: "गति गणित 📐",
    q2_opt3: "भाषाएं और कहानियां 🗣️",
    q2_opt4: "तर्क और सामान्य ज्ञान पहेलियां 🧠",
    q3: "यदि आपके पास एक महाशक्ति हो, तो आप अपने गृहनगर की मदद के लिए कौन सी चुनेंगे?",
    q3_opt1: "बीमार जानवरों और फसलों की देखभाल, इलाज या उन्हें ठीक करना 🩺",
    q3_opt2: "सौर ऊर्जा ग्रिड स्थापित करना या आधुनिक फोन सॉफ्टवेयर को कोड करना 💻",
    q3_opt3: "बच्चों को पढ़ाना या ग्राम कल्याण परिषदों का प्रशासन करना 🏛️"
  },
  gu: {
    title: "ગ્રામીણ કારકિર્દી સાથી અને માર્ગદર્શક",
    subtitle: "ટકાઉ, ઉચ્ચ પગારવાળા વ્યવસાયો, શિષ્યવૃત્તિ પ્રણાલીઓ અને કસ્ટમ અભ્યાસ સમયરેખાઓ શોધો.",
    aiPlannerBtn: "AI વ્યક્તિગત આયોજક ✨",
    matchmakerBtn: "કારકિર્દી મેચમેકર શોધો ➡️",
    aiGuidanceTitle: "સ્વામી AI સ્માર્ટ માર્ગદર્શન",
    aiGuidanceDesc: "તમારા માટે વ્યક્તિગત કારકિર્દી અને કૉલેજ અભ્યાસક્રમોનું વિશ્લેષણ મેળવવા માટે નીચે વિગતો આપો.",
    backBtn: "પાછા જાઓ",
    section1Title: "1. તમારા વિશે જણાવો",
    favoriteSubjectLabel: "પ્રિય વિષય",
    favoriteSubjectPlaceholder: "દા.ત. ગણિત, જીવવિજ્ઞાન, નાગરિકશાસ્ત્ર",
    keyInterestsLabel: "તમારી મુખ્ય રુચિઓ",
    keyInterestsPlaceholder: "દા.ત. ઓર્ગેનિક ખેતી, સોલર એનર્જી, મોબાઈલ રિપેરિંગ",
    hobbiesLabel: "તમારા શોખ",
    hobbiesPlaceholder: "દા.ત. પુસ્તકો વાંચવા, બાગકામ, કોયડા ઉકેલવા",
    skillsLabel: "તમારી કુશળતા / મહાશક્તિઓ",
    skillsPlaceholder: "દા.ત. વૈદિક ગણિત, ઝડપી લખાણ, પશુઓની સારસંભાળ",
    personalityVibeLabel: "વ્યક્તિત્વ વાઇબ",
    currentEduLevelLabel: "વર્તમાન શિક્ષણ સ્તર",
    careerGoalLabel: "ચોક્કસ કારકિર્દી ધ્યેય / મહત્વાકાંક્ષા (કૉલેજ કોર્સ મેપિંગ માટે ભલામણ કરેલ)",
    careerGoalPlaceholder: "દા.ત. કૃષિ વૈજ્ઞાનિક, સોલર એન્જિનિયર, સોફ્ટવેર ડેવલપર, સરકારી સેવા",
    generateBtn: "કારકિર્દી અને કૉલેજ કોર્સ માર્ગદર્શિકા બનાવો ✨",
    planningTitle: "સ્વામી AI તમારા ભવિષ્યનું આયોજન કરી રહ્યા છે...",
    planningDesc: "મનપસંદ વિષયો, કુશળતા, રુચિઓનું મૂલ્યાંકન કરવું અને ટોચની ભારતીય કૉલેજો અને ઉચ્ચ પગારવાળી કારકિર્દી સાથે મેળ મેળવવો.",
    swamiCounselTitle: "સ્વામીની વ્યક્તિગત સલાહ",
    suggestedCareersTitle: "તમારી પ્રોફાઇલના આધારે સૂચવેલ કારકિર્દી વિકલ્પો",
    salaryInIndia: "ભારતમાં પગાર",
    salaryBeginner: "શરૂઆતી",
    salaryMid: "મધ્યમ સ્તર",
    salaryExp: "અનુભવી",
    scopeOpps: "ક્ષેત્ર અને તકો",
    futureScope: "ભવિષ્યની તકો",
    opportunities: "તકો",
    demandInIndia: "ભારતમાં માંગ",
    careerGrowth: "કારકિર્દી વિકાસ",
    entranceExams: "પ્રવેશ પરીક્ષાઓ",
    eligibility: "લાયકાત",
    subjects: "વિષયો",
    qualifications: "લાયકાત ધોરણ",
    ageLimit: "વય મર્યાદા",
    prepTips: "તૈયારીની ટીપ્સ",
    scholarshipsFinancialAid: "Scholarships & Financial Aid",
    scholarshipsInIndia: "ભારતમાં શિષ્યવૃત્તિઓ",
    bestCollegeCourses: "શ્રેષ્ઠ કૉલેજ અભ્યાસક્રમો અને શીખવાના માર્ગો",
    duration: "સમયગાળો",
    topInstitutions: "ટોચની ભારતીય સંસ્થાઓ / પોર્ટલ",
    alignmentOutcome: "જોડાણ અને પરિણામ",
    admissionExams: "પ્રવેશ પરીક્ષાઓ",
    streamAnalyzer: "સ્ટ્રીમ યોગ્યતા વિશ્લેષક",
    recommendedStream: "ભલામણ કરેલ સ્ટ્રીમ",
    coreSubjectsFocus: "મુખ્ય વિષયો પર ધ્યાન કેન્દ્રિત કરો",
    streamOptions10th: "10મા પછી સ્ટ્રીમ અને વિકલ્પો",
    highPotential12th: "12મા પછી ઉચ્ચ ક્ષમતાવાળી કારકિર્દી",
    milestoneExamTracker: "મીલસ્ટોન અને પરીક્ષા ટ્રેકર",
    learningRoadmap: "તમારો પગલું-દર-પગલાં શીખવાનો રોડમેપ",
    milestone: "મીલસ્ટોન",
    skills: "કુશળતા",
    exams: "પરીક્ષાઓ",
    editProfileBtn: "પ્રોફાઇલ સંપાદિત કરો અને ફરીથી ગણતરી કરો",
    returnDirectoryBtn: "ડિરેક્ટરી પર પાછા ફરો",
    syllabusGameTitle: "અભ્યાસક્રમ રસ મેચિંગ ગેમ",
    cancelBtn: "રદ કરો X",
    questChecklist: "શોધ ચેકલિસ્ટ: પગલું",
    of: "નું",
    recommendedProfile: "તમારી ભલામણ કરેલ કારકિર્દી પ્રોફાઇલ",
    roleDesc: "ભૂમિકા વર્ણન",
    studyRoadmapMilestones: "અભ્યાસ માર્ગના મીલસ્ટોન્સ",
    recIndianScholarships: "ભલામણ કરેલ ભારતીય શિષ્યવૃત્તિઓ",
    recSkillsToDevelop: "વિકસાવવા માટે ભલામણ કરેલ કુશળતા",
    technicalSkills: "તકનીકી કુશળતા",
    softSkills: "સોફ્ટ સ્કિલ્સ",
    careerGrowthProspects: "કારકિર્દી વિકાસ અને સંભાવનાઓ",
    futureScopeTrends: "ભવિષ્યનું ક્ષેત્ર અને પ્રવાહો",
    whereYouCanWork: "તમે ક્યાં કામ કરી શકો છો",
    marketDemand: "ભારતમાં બજારની માંગ",
    promotionTrajectory: "બઢતીનો માર્ગ",
    replayMatchmaker: "મેચમેકર ફરીથી રમો",
    browseAllPaths: "બધા માર્ગો જુઓ",
    browseProfessionalStreams: "વ્યાવસાયિક સ્ટ્રીમ્સ જુઓ",
    roleScope: "ભૂમિકા અને ક્ષેત્ર",
    recommendedSubjects: "ભલામણ કરેલ વિષયો",
    academicRoadmapGrades: "શૈક્ષણિક રોડમેપ (ગ્રેડ)",
    requiredEntranceExams: "જરૂરી પ્રવેશ પરીક્ષાઓ અને તૈયારી માર્ગદર્શિકાઓ",
    selectCareerPrompt: "કારકિર્દીના શિષ્યવૃત્તિ માળખા અને શૈક્ષણિક રોડમેપની સમીક્ષા કરવા માટે ડાબી બાજુની સૂચિમાંથી માર્ગ પસંદ કરો.",
    matchLabel: "મેચ",
    required: "જરૂરી",
    avgSalaryIndia: "ભારતમાં સરેરાશ પગાર (વાર્ષિક)",
    techSoftSkillsRequired: "જરૂરી તકનીકી અને સોફ્ટ કુશળતા",
    futureScopeDynamics: "ભવિષ્યનું ક્ષેત્ર અને કારકિર્દી ગતિશીલતા",
    eligibilityCriteria: "પાત્રતા માપદંડ",
    requiredSubjectsLabel: "જરૂરી વિષયો",
    minQualificationsLabel: "ન્યૂનતમ લાયકાત",
    ageLimitsLabel: "વય મર્યાદા",
    prepTipsLabel: "તૈયારીની ટીપ્સ",
    grade10: "ધોરણ ૧૦",
    personality1: "વિશ્લેષણાત્મક અને કેન્દ્રિત (કોયડાઓ અને નંબરો ઉકેલવા ગમે છે)",
    personality2: "સામાજિક અને મિલનસાર (વાત કરવી, નેતૃત્વ અને શિક્ષણ ગમે છે)",
    personality3: "કાળજી અને સેવાભાવી (પ્રાણીઓ, છોડની સંભાળ અને નર્સિંગ ગમે છે)",
    personality4: "સર્જનાત્મક અને કલાત્મક (ચિત્રકામ, ડિઝાઇન અને વસ્તુઓ બનાવવી ગમે છે)",
    q1: "તમે સ્વાભાવિક રીતે રજાઓ અથવા ખાલી કલાકો ક્યાં વિતાવવાનું પસંદ કરો છો?",
    q1_opt1: "બહાર લીલાછમ ખેતરો, પાકની સંભાળ રાખવામાં અથવા ગાય-ભેંસની સંભાળ લેવામાં 🌾",
    q1_opt2: "ટેબલ પર પુસ્તકો વાંચવામાં, ચિત્ર દોરવામાં કે મોબાઇલ ફોન પર નવી વસ્તુઓ શોધવામાં 💻",
    q2: "તમે કયા વિષયમાં સૌથી વધુ માર્ક્સ મેળવો છો અથવા પૂરા ઉત્સાહથી ભણો છો?",
    q2_opt1: "પરિસ્થિતિવિજ્ઞાન અને જીવવિજ્ઞાન 🔬",
    q2_opt2: "ઝડપી ગણિત 📐",
    q2_opt3: "ભાષાઓ અને વાર્તાઓ 🗣️",
    q2_opt4: "તર્ક અને સામાન્ય જ્ઞાન કોયડા 🧠",
    q3: "જો તમારી પાસે કોઈ મહાશક્તિ હોય, તો તમે તમારા ગામની મદદ માટે કઈ પસંદ કરશો?",
    q3_opt1: "બીમાર પ્રાણીઓ અને પાકની કાળજી લેવી અને સારવાર કરવી 🩺",
    q3_opt2: "સોલાર એનર્જી ગ્રીડ સ્થાપવી અથવા સ્માર્ટફોન સોફ્ટવેરનું કોડિંગ કરવું 💻",
    q3_opt3: "બાળકોને ભણાવવું અથવા ગ્રામ્ય પંચાયતોનો વહીવટ કરવો 🏛️"
  },
  mr: {
    title: "ग्रामीण करिअर सहकारी आणि मार्गदर्शक",
    subtitle: "शाश्वत, उच्च पगाराचे व्यवसाय, शिष्यवृत्ती योजना आणि वैयक्तिक अभ्यास वेळापत्रक शोधा.",
    aiPlannerBtn: "AI वैयक्तिक नियोजक ✨",
    matchmakerBtn: "करिअर मॅचमेकर शोधा ➡️",
    aiGuidanceTitle: "स्वामी AI स्मार्ट मार्गदर्शन",
    aiGuidanceDesc: "तुमच्यासाठी वैयक्तिक करिअर आणि कॉलेज अभ्यासक्रमांचे विश्लेषण मिळवण्यासाठी खाली तपशील द्या.",
    backBtn: "मागे",
    section1Title: "1. तुमच्याबद्दल सांगा",
    favoriteSubjectLabel: "आवडता विषय",
    favoriteSubjectPlaceholder: "उदा. गणित, जीवशास्त्र, नागरीशास्त्र",
    keyInterestsLabel: "तुमच्या मुख्य आवडी",
    keyInterestsPlaceholder: "उदा. सेंद्रिय शेती, सौर ऊर्जा, मोबाईल दुरुस्ती",
    hobbiesLabel: "तुमचे छंद",
    hobbiesPlaceholder: "उदा. पुस्तके वाचणे, बागकाम, कोडी सोडवणे",
    skillsLabel: "तुमची कौशल्ये / महाशक्ती",
    skillsPlaceholder: "उदा. गणिती हिशोब, जलद लेखन, प्राण्यांची निगा",
    personalityVibeLabel: "व्यक्तिमत्व वाइब",
    currentEduLevelLabel: "सध्याचे शिक्षण स्तर",
    careerGoalLabel: "विशिष्ट करिअर ध्येय / महत्त्वाकांक्षा (कॉलेज कोर्स मॅपिंगसाठी शिफारस केलेले)",
    careerGoalPlaceholder: "उदा. कृषी वैज्ञानिक, सौर अभियंता, सॉफ्टवेअर डेव्हलपर, सनदी अधिकारी",
    generateBtn: "करिअर आणि कॉलेज कोर्स मार्गदर्शक तयार करा ✨",
    planningTitle: "स्वामी AI तुमच्या भविष्याचे नियोजन करत आहेत...",
    planningDesc: "आवडते विषय, कौशल्ये, आवडींचे मूल्यमापन करणे आणि शीर्ष भारतीय कॉलेजेस व उच्च पगाराच्या करिअरशी जुळवून घेणे.",
    swamiCounselTitle: "स्वामींचा वैयक्तिक सल्ला",
    suggestedCareersTitle: "तुमच्या प्रोफाइलवर आधारित सुचविलेले करिअर पर्याय",
    salaryInIndia: "भारतातील वेतन",
    salaryBeginner: "सुरुवातीचे",
    salaryMid: "मध्यम स्तर",
    salaryExp: "अनुभवी",
    scopeOpps: "व्याप्ती आणि संधी",
    futureScope: "भविष्यातील व्याप्ती",
    opportunities: "संधी",
    demandInIndia: "भारतात मागणी",
    careerGrowth: "करिअर विकास",
    entranceExams: "प्रवेश परीक्षा",
    eligibility: "पात्रता",
    subjects: "विषय",
    qualifications: "किमान पात्रता",
    ageLimit: "वयोमर्यादा",
    prepTips: "तैयारीच्या टिप्स",
    scholarshipsFinancialAid: "शिष्यवृत्ती आणि आर्थिक सहाय्य",
    scholarshipsInIndia: "भारतातील शिष्यवृत्ती",
    bestCollegeCourses: "उत्कृष्ट कॉलेज अभ्यासक्रम आणि शिकण्याचे मार्ग",
    duration: "कालावधी",
    topInstitutions: "शीर्ष भारतीय संस्था / पोर्टल",
    alignmentOutcome: "सुसंगतता आणि निकाल",
    admissionExams: "प्रवेश परीक्षा",
    streamAnalyzer: "शाखा उपयुक्तता विश्लेषक",
    recommendedStream: "शिफारस केलेली शाखा",
    coreSubjectsFocus: "मुख्य विषयांवर लक्ष केंद्रित करा",
    streamOptions10th: "१० वी नंतरचे पर्याय व शाखा",
    highPotential12th: "१२ वी नंतरचे उच्च-क्षमता करिअर",
    milestoneExamTracker: "मैलचा दगड आणि परीक्षा ट्रॅकर",
    learningRoadmap: "तुमचा टप्प्याटप्प्याने शिकण्याचा रोडमॅप",
    milestone: "मैलचा दगड",
    skills: "कौशल्ये",
    exams: "परीक्षा",
    editProfileBtn: "प्रोफाइल संपादित करा आणि पुन्हा मोजा",
    returnDirectoryBtn: "निर्देशिकेवर परत जा",
    syllabusGameTitle: "अभ्यासक्रम आवड जुळवणी खेळ",
    cancelBtn: "रद्द करा X",
    questChecklist: "शोध चेकलिस्ट: टप्पा",
    of: "पैकी",
    recommendedProfile: "तुमचे शिफारस केलेले करिअर प्रोफाइल",
    roleDesc: "भूमिका वर्णन",
    studyRoadmapMilestones: "अभ्यास मार्गाचे टप्पे",
    recIndianScholarships: "शिफारस केलेल्या भारतीय शिष्यवृत्ती",
    recSkillsToDevelop: "विकसित करण्यासाठी शिफारस केलेली कौशल्ये",
    technicalSkills: "तांत्रिक कौशल्ये",
    softSkills: "सॉफ्ट स्किल्स",
    careerGrowthProspects: "करिअर विकास आणि शक्यता",
    futureScopeTrends: "भविष्यातील व्याप्ती आणि प्रवाह",
    whereYouCanWork: "तुम्ही कुठे काम करू शकता",
    marketDemand: "भारतात बाजारपेठेतील मागणी",
    promotionTrajectory: "पदोन्नतीचा मार्ग",
    replayMatchmaker: "मॅचमेकर पुन्हा खेळा",
    browseAllPaths: "सर्व मार्ग पहा",
    browseProfessionalStreams: "व्यावसायिक शाखा पहा",
    roleScope: "भूमिका आणि व्याप्ती",
    recommendedSubjects: "शिफारस केलेले विषय",
    academicRoadmapGrades: "शैक्षणिक रोडमॅप (ग्रेड)",
    requiredEntranceExams: "आवश्यक प्रवेश परीक्षा आणि तयारी मार्गदर्शक",
    selectCareerPrompt: "करिअरच्या शिष्यवृत्ती रचनेचे आणि शैक्षणिक रोडमॅपचे पुनरावलोकन करण्यासाठी डावीकडील सूचीमधून एक मार्ग निवडा.",
    matchLabel: "साम्य",
    required: "आवश्यक",
    avgSalaryIndia: "भारतातील सरासरी वेतन (वार्षिक)",
    techSoftSkillsRequired: "आवश्यक तांत्रिक आणि सॉफ्ट कौशल्ये",
    futureScopeDynamics: "भविष्यातील व्याप्ती आणि करिअर गतिशीलता",
    eligibilityCriteria: "पात्रता निकष",
    requiredSubjectsLabel: "आवश्यक विषय",
    minQualificationsLabel: "किमान पात्रता",
    ageLimitsLabel: "वयोमर्यादा",
    prepTipsLabel: "तयारीच्या टिप्स",
    grade10: "इयत्ता १० वी",
    personality1: "विश्लेषणात्मक आणि केंद्रित (कोडे आणि संख्या सोडवणे आवडते)",
    personality2: "सामाजिक आणि मनमिळाऊ (बोलणे, नेतृत्व आणि शिकवणे आवडते)",
    personality3: "काळजी आणि सेवाभावी (प्राणी, वनस्पतींची काळजी आणि नर्सिंग आवडते)",
    personality4: "रचनात्मक आणि कलात्मक (चित्रकला, डिझाइन आणि गोष्टी बनवणे आवडते)",
    q1: "तुम्हाला साहजिकच तुमच्या सुट्ट्या किंवा मोकळा वेळ कुठे घालवायला आवडतो?",
    q1_opt1: "बाहेर शेतात, पिकांची काळजी घेण्यात किंवा गायी-गुरांची काळजी घेण्यात 🌾",
    q1_opt2: "टेबलवर पुस्तके वाचण्यात, चित्र काढण्यात किंवा मोबाईल फोनवर नवीन गोष्टी शोधण्यात 💻",
    q2: "तुम्ही कोणत्या विषयात सर्वाधिक गुण मिळवता किंवा पूर्ण उत्साहाने अभ्यास करता?",
    q2_opt1: "पारिस्थितिकी आणि जीवशास्त्र 🔬",
    q2_opt2: "वेगवान गणित 📐",
    q2_opt3: "भाषा आणि गोष्टी 🗣️",
    q2_opt4: "तर्कशास्त्र आणि सामान्य ज्ञान कोडी 🧠",
    q3: "तुमच्याकडे एखादी महाशक्ती असती, तर तुम्ही तुमच्या गावाच्या मदतीसाठी कोणती निवडली असती?",
    q3_opt1: "आजारी प्राणी आणि पिकांची काळजी घेणे आणि त्यांच्यावर उपचार करणे 🩺",
    q3_opt2: "सौर ऊर्जा ग्रिड स्थापित करणे किंवा मोबाईल सॉफ्टवेअरचे कोडिंग करणे 💻",
    q3_opt3: "मुलांना शिकवणे किंवा ग्रामपंचायतींचे प्रशासन सांभाळणे 🏛️"
  },
  ta: {
    title: "கிராமப்புற வாழ்க்கை வழிகாட்டி மற்றும் வழிகாட்டுனர்",
    subtitle: "நிலையான, அதிக சம்பளம் தரும் தொழில்கள், கல்வி உதவித்தொகை மற்றும் தனிப்பயனாக்கப்பட்ட படிப்பு கால அட்டவணைகளைக் கண்டறியவும்.",
    aiPlannerBtn: "AI தனிப்பயனாக்கப்பட்ட திட்டமிடுபவர் ✨",
    matchmakerBtn: "தொழில் மேட்ச்மேக்கர் ➡️",
    aiGuidanceTitle: "சுவாமி AI ஸ்மார்ட் வழிகாட்டுதல்",
    aiGuidanceDesc: "உங்களுக்கு ஏற்ற சிறந்த தொழில்கள் மற்றும் கல்லூரி படிப்புகளின் தனிப்பயனாக்கப்பட்ட பகுப்பாய்வைப் பெற கீழே விபரங்களை வழங்கவும்.",
    backBtn: "பின்னால்",
    section1Title: "1. உங்களைப் பற்றி சொல்லுங்கள்",
    favoriteSubjectLabel: "விருப்பமான பாடம்",
    favoriteSubjectPlaceholder: "உதாரணமாக: கணிதம், உயிரியல், குடிமையியல்",
    keyInterestsLabel: "உங்கள் முக்கிய ஆர்வங்கள்",
    keyInterestsPlaceholder: "உதாரணமாக: இயற்கை விவசாயம், சூரிய சக்தி, மொபைல் பழுதுபார்த்தல்",
    hobbiesLabel: "உங்கள் பொழுதுபோக்குகள்",
    hobbiesPlaceholder: "உதாரணமாக: புத்தகங்கள் வாசிப்பு, தோட்டம் வளர்த்தல், புதிர்கள் தீர்த்தல்",
    skillsLabel: "உங்கள் திறன்கள் / வல்லமைகள்",
    skillsPlaceholder: "உதாரணமாக: கணிதக் கணக்கீடு, வேகமான எழுத்து, கால்நடை வளர்ப்பு",
    personalityVibeLabel: "ஆளுமைப் பண்பு",
    currentEduLevelLabel: "தற்போதைய கல்வி நிலை",
    careerGoalLabel: "குறிப்பிட்ட தொழில் குறிக்கோள் (கல்லூரி படிப்பு மேப்பிங்கிற்கு பரிந்துரைக்கப்படுகிறது)",
    careerGoalPlaceholder: "உதாரணமாக: வேளாண் விஞ்ஞானி, சூரிய மின்சக்தி பொறியாளர், மென்பொருள் உருவாக்குநர்",
    generateBtn: "தொழில் மற்றும் கல்லூரி படிப்பு வழிகாட்டியை உருவாக்கு ✨",
    planningTitle: "சுவாமி AI உங்கள் எதிர்காலத்தைத் திட்டமிடுகிறது...",
    planningDesc: "விருப்பமான பாடங்கள், திறன்கள், ஆர்வங்களை மதிப்பிடுதல் மற்றும் சிறந்த இந்திய கல்லூரிகள் மற்றும் அதிக சம்பளம் தரும் தொழில்களுடன் பொருத்துதல்.",
    swamiCounselTitle: "சுவாமியின் தனிப்பட்ட ஆலோசனை",
    suggestedCareersTitle: "உங்கள் சுயவிவரத்தின் அடிப்படையில் பரிந்துரைக்கப்பட்ட தொழில் வாய்ப்புகள்",
    salaryInIndia: "இந்தியாவில் சம்பளம்",
    salaryBeginner: "தொடக்க நிலை",
    salaryMid: "நடுத்தர நிலை",
    salaryExp: "அனுபவம் வாய்ந்த நிலை",
    scopeOpps: "வாய்ப்புகள் & வளர்ச்சி",
    futureScope: "எதிர்கால வாய்ப்பு",
    opportunities: "வேலை வாய்ப்புகள்",
    demandInIndia: "இந்தியாவில் தேவை",
    careerGrowth: "தொழில் வளர்ச்சி",
    entranceExams: "நுழைவுத் தேர்வுகள்",
    eligibility: "தகுதி",
    subjects: "பாடங்கள்",
    qualifications: "கல்வித் தகுதி",
    ageLimit: "வயது வரம்பு",
    prepTips: "தயாரிப்பு குறிப்புகள்",
    scholarshipsFinancialAid: "Scholarships & Financial Aid",
    scholarshipsInIndia: "இந்தியாவில் கல்வி உதவித்தொகைகள்",
    bestCollegeCourses: "சிறந்த கல்லூரி படிப்புகள் & கற்றல் வழிகள்",
    duration: "கால அளவு",
    topInstitutions: "முன்னணி இந்திய நிறுவனங்கள் / இணையதளங்கள்",
    alignmentOutcome: "பொருத்தம் & பலன்கள்",
    admissionExams: "நுழைவுத் தேர்வுகள்",
    streamAnalyzer: "பாடப்பிரிவு பொருத்த பகுப்பாய்வி",
    recommendedStream: "பரிந்துரைக்கப்படும் பாடப்பிரிவு",
    coreSubjectsFocus: "கவனத்தில் கொள்ள வேண்டிய பாடங்கள்",
    streamOptions10th: "10-ஆம் வகுப்பிற்குப் பின் உள்ள பிரிவுகள்",
    highPotential12th: "12-ஆம் வகுப்பிற்குப் பின் உள்ள சிறந்த தொழில்கள்",
    milestoneExamTracker: "மைல்கல் & தேர்வு கண்காணிப்பாளர்",
    learningRoadmap: "உங்கள் படி வாரியான கற்றல் வரைபடம்",
    milestone: "மைல்கல்",
    skills: "திறன்கள்",
    exams: "தேர்வுகள்",
    editProfileBtn: "சுயவிவரத்தை திருத்தி மீண்டும் கணக்கிடு",
    returnDirectoryBtn: "முகப்புப் பட்டியலுக்குத் திரும்பு",
    syllabusGameTitle: "பாடத்திட்ட ஆர்வப் பொருத்து விளையாட்டு",
    cancelBtn: "ரத்து செய் X",
    questChecklist: "தேடல் பட்டியல்: படி",
    of: "இல்",
    recommendedProfile: "பரிந்துரைக்கப்பட்ட தொழில் சுயவிவரம்",
    roleDesc: "தொழில் விளக்கம்",
    studyRoadmapMilestones: "படிப்பு பாதையின் மைல்கற்கள்",
    recIndianScholarships: "பரிந்துரைக்கப்படும் இந்திய கல்வி உதவித்தொகைகள்",
    recSkillsToDevelop: "வளர்க்க வேண்டிய பரிந்துரைக்கப்பட்ட திறன்கள்",
    technicalSkills: "தொழில்நுட்ப திறன்கள்",
    softSkills: "மென்திறன்கள்",
    careerGrowthProspects: "தொழில் வளர்ச்சி & வாய்ப்புகள்",
    futureScopeTrends: "எதிர்கால வாய்ப்புகள் & போக்குகள்",
    whereYouCanWork: "நீங்கள் எங்கு வேலை செய்யலாம்",
    marketDemand: "இந்தியாவில் சந்தை தேவை",
    promotionTrajectory: "பதவி உயர்வுப் பாதை",
    replayMatchmaker: "பொருத்து விளையாட்டை மீண்டும் விளையாடு",
    browseAllPaths: "அனைத்து வழிகளையும் பார்",
    browseProfessionalStreams: "தொழில் பிரிவுகளைப் பார்",
    roleScope: "பங்கு & நோக்கம்",
    recommendedSubjects: "பரிந்துரைக்கப்படும் பாடங்கள்",
    academicRoadmapGrades: "கல்வி வரைபடம் (வகுப்புகள்)",
    requiredEntranceExams: "தேவையான நுழைவுத் தேர்வுகள் & வழிகாட்டிகள்",
    selectCareerPrompt: "தொழிலின் கல்வி உதவித்தொகை மற்றும் கல்வி வரைபடத்தை அறிய இடதுபுறமுள்ள பட்டியலில் இருந்து ஒரு தொழிலைத் தேர்ந்தெடுக்கவும்.",
    matchLabel: "பொருத்தம்",
    required: "தேவையானது",
    avgSalaryIndia: "இந்தியாவில் சராசரி சம்பளம் (ஆண்டுக்கு)",
    techSoftSkillsRequired: "தேவைப்படும் தொழில்நுட்ப & மென்திறன்கள்",
    futureScopeDynamics: "எதிர்கால வாய்ப்புகள் & தொழில் இயக்கம்",
    eligibilityCriteria: "தகுதி வரம்புகள்",
    requiredSubjectsLabel: "தேவைப்படும் பாடங்கள்",
    minQualificationsLabel: "குறைந்தபட்ச தகுதி",
    ageLimitsLabel: "வயது வரம்புகள்",
    prepTipsLabel: "தயாரிப்பு குறிப்புகள்",
    grade10: "பத்தாம் வகுப்பு",
    personality1: "பகுப்பாய்வு மற்றும் கவனம் (புதிர்கள் மற்றும் எண்களை தீர்க்க விரும்புகிறார்)",
    personality2: "சமூக மற்றும் வெளிச்செல்லும் (பேசுவது, வழிநடத்துவது மற்றும் கற்பிப்பது பிடிக்கும்)",
    personality3: "அக்கறை மற்றும் சேவை (விலங்குகள், தாவர பராமரிப்பு மற்றும் செவிலியம் பிடிக்கும்)",
    personality4: "படைப்பாற்றல் மற்றும் கலைநயம் (வரைதல், வடிவமைப்பு மற்றும் உருவாக்குதல் பிடிக்கும்)",
    q1: "உங்கள் விடுமுறை நாட்கள் அல்லது ஓய்வு நேரங்களை எங்கு கழிக்க விரும்புகிறீர்கள்?",
    q1_opt1: "வெளியே பசுமையான வயல்வெளிகள், பயிர்களைப் பார்ப்பது அல்லது கால்நடைகளைப் பராமரிப்பது 🌾",
    q1_opt2: "மேஜையில் புத்தகங்களை வாசிப்பது, வரைவது அல்லது மொபைலில் ஆராய்வது 💻",
    q2: "நீங்கள் எந்த பாடத்தில் அதிக மதிப்பெண்கள் பெறுகிறீர்கள் அல்லது அதிக ஆர்வத்துடன் படிக்கிறீர்கள்?",
    q2_opt1: "சூழலியல் & உயிரியல் 🔬",
    q2_opt2: "வேகக் கணிதம் 📐",
    q2_opt3: "மொழிகள் & கதைகள் 🗣️",
    q2_opt4: "தர்க்கம் & பொது அறிவு புதிர்கள் 🧠",
    q3: "உங்களுக்கு ஒரு சூப்பர் பவர் இருந்தால், உங்கள் ஊருக்கு உதவ எதைத் தேர்ந்தெடுப்பீர்கள்?",
    q3_opt1: "நோய்வாய்ப்பட்ட விலங்குகள் மற்றும் பயிர்களை கவனித்து குணப்படுத்துவது 🩺",
    q3_opt2: "சூரிய சக்தி கிரிட்களை அமைப்பது அல்லது மொபைல் மென்பொருளை உருவாக்குவது 💻",
    q3_opt3: "குழந்தைகளுக்குக் கற்பிப்பது அல்லது கிராம நலச் சபைகளை நிர்வகிப்பது 🏛️"
  },
  te: {
    title: "గ్రామీణ కెరీర్ తోడు మరియు మార్గదర్శి",
    subtitle: "స్థిరమైన, అధిక జీతం ఇచ్చే వృత్తులు, స్కాలర్‌షిప్ వ్యవస్థలు మరియు వ్యక్తిగత అధ్యయన కాలక్రమాలను కనుగొనండి.",
    aiPlannerBtn: "AI వ్యక్తిగతీకరించిన ప్లానర్ ✨",
    matchmakerBtn: "కెరీర్ మ్యాచ్‌మేకర్ ➡️",
    aiGuidanceTitle: "స్వామి AI స్మార్ట్ మార్గదర్శకత్వం",
    aiGuidanceDesc: "మీ కోసం వ్యక్తిగతీకరించిన కెరీర్ మరియు కాలేజీ కోర్సుల విశ్లేషణ పొందడానికి క్రింది వివరాలను అందించండి.",
    backBtn: "వెనుకకు",
    section1Title: "1. మీ గురించి చెప్పండి",
    favoriteSubjectLabel: "ఇష్టమైన విషయం",
    favoriteSubjectPlaceholder: "ఉదాహరణకు: గణితం, జీవశాస్త్రం, సివిక్స్",
    keyInterestsLabel: "మీ ముఖ్య అభిరుచులు",
    keyInterestsPlaceholder: "ఉదాహరణకు: సేంద్రీయ వ్యవసాయం, సౌర శక్తి, మొబైల్ ఫోన్లు బాగు చేయడం",
    hobbiesLabel: "మీ హాబీలు",
    hobbiesPlaceholder: "ఉదాహరణకు: పుస్తకాలు చదవడం, తోటపని, పజిల్స్ సాధన",
    skillsLabel: "మీ నైపుణ్యాలు / మహాశక్తులు",
    skillsPlaceholder: "ఉదాహరణకు: వేగవంతమైన గణితం, శీఘ్ర రచన, పశువుల సంరక్షణ",
    personalityVibeLabel: "వ్యక్తిత్వ వైబ్",
    currentEduLevelLabel: "ప్రస్తుత విద్యా స్థాయి",
    careerGoalLabel: "నిర్దిష్ట కెరీర్ లక్ష్యం (కాలేజీ కోర్సుల మ్యాపింగ్ కోసం సిఫార్సు చేయబడింది)",
    careerGoalPlaceholder: "ఉదాహరణకు: వ్యవసాయ శాస్త్రవేత్త, సోలార్ ఇంజనీర్, సాఫ్ట్‌వేర్ డెవలపర్",
    generateBtn: "కెరీర్ & కాలేజీ కోర్స్ గైడ్‌ను రూపొందించు ✨",
    planningTitle: "స్వామి AI మీ భవిష్యత్తును ప్లాన్ చేస్తోంది...",
    planningDesc: "ఇష్టమైన విషయాలు, నైపుణ్యాలు, అభిరుచులను అంచనా వేయడం మరియు అగ్రశ్రేణి భారతీయ కాలేజీలు మరియు అధిక జీతం ఇచ్చే కెరీర్‌లతో సరిపోల్చడం.",
    swamiCounselTitle: "స్వామి వ్యక్తిగత సలహా",
    suggestedCareersTitle: "మీ ప్రొఫైల్ ఆధారంగా సిఫార్సు చేయబడిన కెరీర్ ఎంపికలు",
    salaryInIndia: "భారతదేశంలో జీతం",
    salaryBeginner: "ప్రారంభ స్థాయి",
    salaryMid: "మధ్య స్థాయి",
    salaryExp: "అనుభవజ్ఞుల స్థాయి",
    scopeOpps: "అవకాశాలు & వృద్ధి",
    futureScope: "భవిష్యత్ పరిధి",
    opportunities: "ఉద్యోగ అవకాశాలు",
    demandInIndia: "భారతదేశంలో డిమాండ్",
    careerGrowth: "కెరీర్ వృద్ధి",
    entranceExams: "ప్రవేశ పరీక్షలు",
    eligibility: "అర్హత",
    subjects: "సబ్జెక్టులు",
    qualifications: "కనీస అర్హత",
    ageLimit: "వయోపరిమితి",
    prepTips: "ప్రిపరేషన్ చిట్కాలు",
    scholarshipsFinancialAid: "Scholarships & Financial Aid",
    scholarshipsInIndia: "భారతదేశంలో స్కాలర్‌షిప్‌లు",
    bestCollegeCourses: "ఉత్తమ కాలేజీ కోర్సులు & అభ్యసన మార్గాలు",
    duration: "వ్యవధి",
    topInstitutions: "ప్రముఖ భారతీయ సంస్థలు / పోర్టల్స్",
    alignmentOutcome: "సరిపోలిక & ఫలితాలు",
    admissionExams: "ప్రవేశ పరీక్షలు",
    streamAnalyzer: "సబ్జెక్ట్ స్ట్రీమ్ సరిపోలిక విశ్లేషణ",
    recommendedStream: "సిఫార్సు చేయబడిన స్ట్రీమ్",
    coreSubjectsFocus: "దృష్టి పెట్టవలసిన ముఖ్య సబ్జెక్టులు",
    streamOptions10th: "10వ తరగతి తర్వాత స్ట్రీమ్స్ & ఆప్షన్స్",
    highPotential12th: "12వ తరగతి తర్వాత అధిక సామర్థ్యం గల కెరీర్లు",
    milestoneExamTracker: "మైలురాయి & పరీక్షల ట్రాకర్",
    learningRoadmap: "మీ దశల వారీ అభ్యసన రోడ్‌మ్యాప్",
    milestone: "మైలురాయి",
    skills: "నైపుణ్యాలు",
    exams: "పరీక్షలు",
    editProfileBtn: "ప్రొఫైల్ సవరించి మళ్ళీ లెక్కించండి",
    returnDirectoryBtn: "డైరెక్టరీకి తిరిగి వెళ్ళు",
    syllabusGameTitle: "సిలబస్ అభిరుచుల సరిపోలిక ఆట",
    cancelBtn: "రద్దు చేయి X",
    questChecklist: "అన్వేషణల జాబితా: దశ",
    of: "లో",
    recommendedProfile: "సిఫార్సు చేయబడిన కెరీర్ ప్రొఫైల్",
    roleDesc: "పాత్ర వివరణ",
    studyRoadmapMilestones: "అధ్యయన మార్గం యొక్క మైలురాళ్ళు",
    recIndianScholarships: "సిఫార్సు చేయబడిన భారతీయ స్కాలర్‌షిప్‌లు",
    recSkillsToDevelop: "అభివృద్ధి చేసుకోవలసిన సిఫార్సు నైపుణ్యాలు",
    technicalSkills: "సాంకేతిక నైపుణ్యాలు",
    softSkills: "సాఫ్ట్ స్కిల్స్",
    careerGrowthProspects: "కెరీర్ వృద్ధి & అవకాశాలు",
    futureScopeTrends: "భవిష్యత్ పరిధి & ధోరణులు",
    whereYouCanWork: "మీరు ఎక్కడ పని చేయవచ్చు",
    marketDemand: "భారతదేశంలో మార్కెట్ డిమాండ్",
    promotionTrajectory: "పదోన్నతి మార్గం",
    replayMatchmaker: "మ్యాచీ మేకర్‌ను మళ్ళీ ఆడండి",
    browseAllPaths: "అన్ని మార్గాలను చూడండి",
    browseProfessionalStreams: "వృత్తిపరమైన స్ట్రీమ్‌లను చూడండి",
    roleScope: "పాత్ర & పరిధి",
    recommendedSubjects: "సిఫార్సు చేయబడిన సబ్జెక్టులు",
    academicRoadmapGrades: "విద్యా రోడ్‌మ్యాప్ (తరగతులు)",
    requiredEntranceExams: "అవసరమైన ప్రవేశ పరీక్షలు & ప్రిపరేషన్ గైడ్స్",
    selectCareerPrompt: "కెరీర్ యొక్క స్కాలర్‌షిప్ నిర్మాణం మరియు విద్యా రోడ్‌మ్యాప్‌ను సమీక్షించడానికి ఎడమ వైపున ఉన్న జాబితా నుండి ఒక మార్గాన్ని ఎంచుకోండి.",
    matchLabel: "సరిపోలిక",
    required: "అవసరం",
    avgSalaryIndia: "భారతదేశంలో సగటు జీతం (సంవత్సరానికి)",
    techSoftSkillsRequired: "సాంకేతిక మరియు సాఫ్ట్ నైపుణ్యాలు అవసరం",
    futureScopeDynamics: "భవిష్యత్ పరిధి & కెరీర్ గమనం",
    eligibilityCriteria: "అర్హత ప్రమాణాలు",
    requiredSubjectsLabel: "అవసరమైన సబ్జెక్టులు",
    minQualificationsLabel: "కనీస అర్హతలు",
    ageLimitsLabel: "వయోపరిమితులు",
    prepTipsLabel: "ప్రిపరేషన్ చిట్కాలు",
    grade10: "పదవ తరగతి",
    personality1: "విశ్లేషణాత్మక మరియు దృష్టి (పజిల్స్ మరియు సంఖ్యలను పరిష్కరించడం ఇష్టం)",    personality2: "సామాజిక మరియు స్నేహపూర్వక (మాట్లాడటం, నాయకత్వం మరియు బోధించడం ఇష్టం)",
    personality3: "సంరక్షణ మరియు సేవ (జంతువులు, మొక్కల సంరక్షణ మరియు నర్సింగ్ ఇష్టం)",
    personality4: "సృజనాత్మక మరియు కళాత్మక (డ్రాయింగ్, డిజైన్ మరియు వస్తువులను తయారు చేయడం ఇష్టం)",
    q1: "మీరు సహజంగా మీ సెలవులు లేదా ఖాళీ సమయాన్ని ఎక్కడ గడపడానికి ఇష్టపడతారు?",
    q1_opt1: "బయట పచ్చని పొలాలు, పంటలను చూడటం లేదా పశువుల సంరక్షణ చేయడం 🌾",
    q1_opt2: "టేబుల్ వద్ద పుస్తకాలు చదవడం, డ్రాయింగ్ వేయడం లేదా మొబైల్‌లో శోధించడం 💻",
    q2: "మీరు ఏ సబ్జెక్టులో ఎక్కువ మార్కులు సాధిస్తారు లేదా పూర్తి ఉత్సాహంతో చదువుతారు?",
    q2_opt1: "పర్యావరణ శాస్త్రం & జీవశాస్త్రం 🔬",
    q2_opt2: "వేగవంతమైన గణితం 📐",
    q2_opt3: "భాషలు & కథలు 🗣️",
    q2_opt4: "లాజిక్ & జనరల్ నాలెడ్జ్ పజిల్స్ 🧠",
    q3: "మీకు ఒక మహాశక్తి ఉంటే, మీ గ్రామానికి సహాయం చేయడానికి దేనిని ఎంచుకుంటారు?",
    q3_opt1: "జబ్బుపడిన జంతువులు మరియు పంటలను సంరక్షించడం మరియు వాటిని నయం చేయడం 🩺",
    q3_opt2: "సౌర విద్యుత్ గ్రిడ్‌లను ఏర్పాటు చేయడం లేదా మొబైల్ సాఫ్ట్‌వేర్‌ను కోడింగ్ చేయడం 💻",
    q3_opt3: "పిల్లలకు బోధించడం లేదా గ్రామ పంచాయతీలను నిర్వహించడం 🏛️"
  }
};

const SUGGESTION_TRANSLATIONS: Record<LanguageCode, {
  subjects: string[];
  interests: string[];
  hobbies: string[];
  skills: string[];
}> = {
  en: {
    subjects: ['Mathematics', 'Science (Biology)', 'Physics & Chemistry', 'Social Studies/Civics', 'Computer Science', 'Languages & Arts'],
    interests: ['Organic Farming', 'Green Renewable Energy', 'Mobile Apps & Coding', 'Teaching & Coaching', 'Rural Healthcare', 'Dairy Farming'],
    hobbies: ['Reading Books', 'Fixing Gadgets', 'Gardening/Plants', 'Cricket & Sports', 'Drawing & Crafting', 'Helping Community'],
    skills: ['Fast Calculation', 'Computer Typing', 'Public Speaking', 'Building Gadgets', 'Storytelling', 'Animal Care']
  },
  hi: {
    subjects: ['गणित', 'विज्ञान (जीव विज्ञान)', 'भौतिकी और रसायन शास्त्र', 'सामाजिक अध्ययन/नागरिक शास्त्र', 'कंप्यूटर विज्ञान', 'भाषा और कला'],
    interests: ['जैविक खेती', 'हरित नवीकरणीय ऊर्जा', 'मोबाइल ऐप्स और कोडिंग', 'शिक्षण और कोचिंग', 'ग्रामीण स्वास्थ्य सेवा', 'डेयरी फार्मिंग'],
    hobbies: ['किताबें पढ़ना', 'गैजेट्स ठीक करना', 'बागवानी/पौधे', 'क्रिकेट और खेल', 'ड्राइंग और क्राफ्टिंग', 'समुदाय की मदद करना'],
    skills: ['तेज गणना', 'कंप्यूटर टाइपिंग', 'सार्वजनिक भाषण', 'गैजेट्स बनाना', 'कहानी सुनाना', 'पशुओं की देखभाल']
  },
  gu: {
    subjects: ['ગણિત', 'વિજ્ઞાન (જીવવિજ્ઞાન)', 'ભૌતિકશાસ્ત્ર અને રસાયણશાસ્ત્ર', 'સામાજિક અભ્યાસ/નાગરિકશાસ્ત્ર', 'કમ્પ્યુટર વિજ્ઞાન', 'ભાષાઓ અને કળા'],
    interests: ['જૈવિક ખેતી', 'હરિત પુનઃપ્રાપ્ય ઊર્જા', 'મોબાઇલ એપ્સ અને કોડિંગ', 'શિક્ષણ અને કોચિંગ', 'ગ્રામીણ આરોગ્યસંભાળ', 'ડેરી ફાર્મિંગ'],
    hobbies: ['પુસ્તકો વાંચવા', 'ગેજેટ્સ રિપેર કરવા', 'બાગકામ/છોડ', 'ક્રિકેટ અને રમતગમત', 'ચિત્રકામ અને ક્રાફ્ટિંગ', 'સમુદાયને મદદ કરવી'],
    skills: ['ઝડપી ગણતરી', 'કમ્પ્યુટર ટાઈપીંગ', 'જાહેરમાં બોલવું', 'ગેજેટ્સ બનાવવા', 'વાર્તા કહેવી', 'પ્રાણીઓની સંભાળ']
  },
  mr: {
    subjects: ['गणित', 'विज्ञान (जीवशास्त्र)', 'भौतिकशास्त्र आणि रसायनशास्त्र', 'सामाजिक अभ्यास/नागरीशास्त्र', 'संगणक विज्ञान', 'भाषा आणि कला'],
    interests: ['सेंद्रिय शेती', 'हरित नवीकरणीय ऊर्जा', 'मोबाईल ॲप्स आणि कोडिंग', 'शिक्षण आणि कोचिंग', 'ग्रामीण आरोग्य सेवा', 'दुग्धव्यवसाय'],
    hobbies: ['पुस्तके वाचणे', 'गॅझेट्स दुरुस्त करणे', 'बागकाम/झाडे', 'क्रिकेट आणि खेळ', 'चित्रकला आणि हस्तकला', 'समुदायाला मदत करणे'],
    skills: ['जलद गणना', 'संगणक टायपिंग', 'सार्वजनिक भाषण', 'गॅझेट्स बनवणे', 'गोष्टी सांगणे', 'प्राण्यांची काळजी घेणे']
  },
  ta: {
    subjects: ['கணிதம்', 'அறிவியல் (உயிரியல்)', 'இயற்பியல் & வேதியியல்', 'சமூக அறிவியல்/குடிமையியல்', 'கணினி அறிவியல்', 'மொழிகள் & கலைகள்'],
    interests: ['இயற்கை விவசாயம்', 'பசுமை புதுப்பிக்கத்தக்க ஆற்றல்', 'மொபைல் ஆப்ஸ் & கோடிங்', 'கற்பித்தல் & பயிற்சி', 'கிராமப்புற சுகாதாரம்', 'டைரி ஃபார்மிங்'],
    hobbies: ['புத்தகங்கள் வாசிப்பு', 'கேஜெட்டுகள் பழுதுபார்த்தல்', 'தோட்டக்கலை/செடிகள்', 'கிரிக்கெட் & விளையாட்டுகள்', 'வரைதல் & கைவினை', 'சமூகத்திற்கு உதவுதல்'],
    skills: ['வேகமான கணக்கீடு', 'கணினி தட்டச்சு', 'பொதுப் பேச்சு', 'கேஜெட்டுகள் உருவாக்குதல்', 'கதைசொல்லல்', 'கால்நடை பராமரிப்பு']
  },
  te: {
    subjects: ['గణితం', 'సైన్స్ (జీవశాస్త్రం)', 'భౌతికశాస్త్రం & రసాయనశాస్త్రం', 'సోషల్ స్టడీస్/సివిక్స్', 'కంప్యూటర్ సైన్స్', 'భాషలు & కళలు'],
    interests: ['సేంద్రీయ వ్యవసాయం', 'గ్రీన్ పునరుత్పాదక శక్తి', 'మొబైల్ యాప్స్ & కోడింగ్', 'బోధన & కోచింగ్', 'గ్రామీణ ఆరోగ్య రక్షణ', 'డైరీ ఫార్మింగ్'],
    hobbies: ['పుస్తకాలు చదవడం', 'గ్యాడ్జెట్‌లను బాగు చేయడం', 'తోటపని/మొక్కలు', 'క్రికట్ & క్రీడలు', 'డ్రాయింగ్ & క్రాఫ్టింగ్', 'సమాజానికి సహాయం చేయడం'],
    skills: ['వేగవంతమైన లెక్కింపు', 'కంప్యూటర్ టైపింగ్', 'పబ్లిక్ స్పీకింగ్', 'గ్యాడ్జెట్‌లను తయారు చేయడం', 'కథలు చెప్పడం', 'జంతువుల సంరక్షణ']
  }
};

const TRANSLATED_CAREERS: Record<LanguageCode, Record<string, Partial<typeof CAREERS[0]>>> = {
  en: {},
  hi: {
    'agri-sci': {
      title: 'कृषि वैज्ञानिक 🌾',
      category: 'ग्रामीण विज्ञान और खेती',
      desc: 'पैदावार प्रक्रियाओं को स्वचालित करता है, नकदी फसलों की रक्षा करता है, मिट्टी के स्वास्थ्य का विश्लेषण करता है, और जैविक उर्वरक बनाता है।',
      subjects: 'जीव विज्ञान, रसायन विज्ञान, आधुनिक खेती तकनीक',
      roadmap: 'कक्षा 10 उत्तीर्ण करें -> विज्ञान स्ट्रीम (PCB) -> कृषि विज्ञान में स्नातक (B.Sc. Agri) -> अनुसंधान वैज्ञानिक।',
      scholarship: 'ICAR राष्ट्रीय प्रतिभा छात्रवृत्ति (NTS), भारत कृषि-अनुसंधान फेलोशिप।',
      scholarshipsList: [
        {
          name: "ICAR राष्ट्रीय प्रतिभा छात्रवृत्ति (NTS)",
          amount: "₹3,000 प्रति माह",
          eligibility: "ICAR-AIEEA के माध्यम से अपने गृह राज्य के बाहर एक राज्य कृषि विश्वविद्यालय में प्रवेश लिया हो।",
          description: "कृषि शिक्षा में राष्ट्रीय गतिशीलता को बढ़ावा देने के लिए भारतीय कृषि अनुसंधान परिषद द्वारा प्रदान किया जाता है।"
        },
        {
          name: "मैट्रिकोत्तर छात्रवृत्ति योजना",
          amount: "₹1,200 प्रति माह तक + पूर्ण पाठ्यक्रम शुल्क छूट",
          eligibility: "एससी, एसटी, या ओबीसी छात्र जिनकी वार्षिक पारिवारिक आय ₹2.5 लाख से कम है।",
          description: "केंद्रीय सहायता के साथ व्यक्तिगत राज्यों द्वारा प्रशासित, पूर्ण शुल्क कवरेज और रहने का वजीफा प्रदान करता है।"
        },
        {
          name: "स्वामी विवेकानंद मेरिट-सह-साधन (SVMCM)",
          amount: "₹12,000 से ₹60,000 प्रति वर्ष",
          eligibility: "60% या अधिक के साथ कक्षा 12 उत्तीर्ण, पारिवारिक आय ₹2.5 लाख प्रति वर्ष से कम।",
          description: "विज्ञान और व्यावसायिक धाराओं के छात्रों का समर्थन करने वाली एक अत्यधिक लोकप्रिय राज्य छात्रवृत्ति।"
        }
      ]
    },
    'renew-tech': {
      title: 'सौर और नवीकरणीय ग्रिड इंजीनियर ☀️',
      category: 'इंजीनियरिंग और हरित ऊर्जा',
      desc: 'ग्रामीण गांवों को निरंतर बिजली प्रदान करने के लिए स्थानीय सौर पैनल मिनी-ग्रिड और पवन सेटअप स्थापित करता है।',
      subjects: 'भौतिकी, गणित, विद्युत सर्किट',
      roadmap: 'कक्षा 10 उत्तीर्ण करें -> व्यावसायिक ITI डिप्लोमा या विज्ञान स्ट्रीम (PCM) -> पावर इंजीनियरिंग में बी.टेक।',
      scholarship: 'प्रेरणा ग्रामीण इंजीनियरिंग छात्रवृत्ति, राष्ट्रीय सौर मिशन प्रशिक्षण सहायता।',
      scholarshipsList: [
        {
          name: "लड़कियों के लिए एआईसीटीई प्रगति छात्रवृत्ति",
          amount: "4 वर्ष तक ₹50,000 प्रति वर्ष",
          eligibility: "प्रथम वर्ष बी.टेक या डिप्लोमा पाठ्यक्रमों में प्रवेश पाने वाली छात्राएं, पारिवारिक आय ₹8 लाख से कम।",
          description: "उच्च तकनीकी शिक्षा प्राप्त करने वाली लड़कियों को बढ़ावा देने के लिए एआईसीटीई द्वारा एक उत्कृष्ट पहल।"
        },
        {
          name: "ओएनजीसी छात्रवृत्ति योजना",
          amount: "₹48,000 प्रति वर्ष",
          eligibility: "इंजीनियरिंग करने वाले एससी, एसटी या ओबीसी छात्र, कक्षा 12 की बोर्ड परीक्षा में न्यूनतम 60%।",
          description: "ऊर्जा प्रौद्योगिकियों में रुचि रखने वाले मेधावी छात्रों की सहायता करने वाली एक उद्योग-समर्थित योजना।"
        }
      ]
    },
    'vet-doc': {
      title: 'सामुदायिक पशु चिकित्सक 🩺',
      category: 'पशुधन देखभाल और स्वास्थ्य सेवा',
      desc: 'पशुधन, दुधारू पशुओं, मुर्गियों और खेती के साथियों को साफ, टीकाकृत और स्वस्थ रखता है।',
      subjects: 'पशु शरीर क्रिया विज्ञान, जीव विज्ञान, पशु चिकित्सा औषधियां',
      roadmap: 'कक्षा 10 उत्तीर्ण करें -> जीव विज्ञान स्ट्रीम (PCB) -> पशु चिकित्सा विज्ञान स्नातक (B.V.Sc & AH) -> पंजीकृत पशु चिकित्सक।',
      scholarship: 'VCI योग्यता छात्रवृत्ति, भारतीय पशु कल्याण अनुसंधान सहायता।',
      scholarshipsList: [
        {
          name: "भारतीय पशु चिकित्सा परिषद (VCI) मेरिट छात्रवृत्ति",
          amount: "₹1,000 प्रति माह",
          eligibility: "पशु चिकित्सा राज्य सीईटी/नीट के शीर्ष स्कोरर जो मान्यता प्राप्त पशु चिकित्सा कॉलेजों में प्रवेश लेते हैं।",
          description: "पशु चिकित्सा विज्ञान में होनहार प्रतिभा को बढ़ावा देने के लिए भारतीय पशु चिकित्सा परिषद द्वारा प्रदान किया जाता है।"
        }
      ]
    },
    'cyber-code': {
      title: 'सॉफ्टवेयर डेवलपर और साइबर सुरक्षा 💻',
      category: 'सूचना प्रौद्योगिकी (IT)',
      desc: 'स्थानीयकृत मोबाइल उपयोगिता अनुप्रयोगों को कोड करता है, क्लाउड स्टोरेज आर्किटेक्चर को सुरक्षित रूप से प्रबंधित करता है, और साइबर सुरक्षा का मार्गदर्शन करता है।',
      subjects: 'कंप्यूटर विज्ञान, बीजगणित, अंग्रेजी साक्षरता',
      roadmap: 'कक्षा 10 उत्तीर्ण करें -> PCM स्ट्रीम या पॉलिटेक्निक CS -> कंप्यूटर एप्लीकेशन में स्नातक (BCA) या बी.टेक CS।',
      scholarship: 'तकनीकी स्ट्रीम के लिए पीएम नरेंद्र मोदी छात्रवृत्ति योजना, एआईसीटीई ग्रामीण कोडर पुरस्कार।',
      scholarshipsList: [
        {
          name: "एआईसीटीई सक्षम छात्रवृत्ति योजना",
          amount: "₹50,000 प्रति वर्ष",
          eligibility: "तकनीकी पाठ्यक्रमों (कंप्यूटर विज्ञान/BCA) में डिग्री/डिप्लोमा करने वाले दिव्यांग छात्र।",
          description: "तकनीकी कौशल विकास, पुस्तकों और लैपटॉप जैसे सहायक उपकरणों के लिए वित्तीय सहायता प्रदान करता है।"
        }
      ]
    },
    'gov-teacher': {
      title: 'सिविल सेवक या शिक्षक 🏛️',
      category: 'प्रशासन और शिक्षा',
      desc: 'स्थानीय प्रशासन का मार्गदर्शन करता है, ग्रामीण कल्याण योजनाओं का प्रबंधन करता है, या प्राथमिक और माध्यमिक स्कूलों में पढ़ाता है।',
      subjects: 'नागरिक शास्त्र, इतिहास, भाषा साहित्य, शिक्षाशास्त्र',
      roadmap: 'कक्षा 10 उत्तीर्ण करें -> कला/विज्ञान स्ट्रीम -> स्नातक डिग्री (BA/B.Sc) -> यूपीएससी/राज्य सिविल परीक्षा या बी.एड उत्तीर्ण करें।',
      scholarship: 'राष्ट्रीय फेलोशिप योजनाएं, राज्य कल्याण प्रशिक्षण अनुदान वाउचर।',
      scholarshipsList: [
        {
          name: "एकल कन्या संतान के लिए यूजीसी स्नातकोत्तर छात्रवृत्ति",
          amount: "2 वर्ष के लिए ₹36,200 प्रति वर्ष",
          eligibility: "स्नातकोत्तर छात्र जो अपने परिवार में एकल कन्या संतान हैं, नियमित पीजी या बी.एड डिग्री कर रहे हैं।",
          description: "महिला शिक्षकों और प्रशासकों के लिए उच्च शैक्षणिक अवसरों और प्रशिक्षण को बढ़ावा देता है।"
        }
      ]
    }
  },
  gu: {
    'agri-sci': {
      title: 'કૃષિ વૈજ્ઞાનિક 🌾',
      category: 'ગ્રામીણ વિજ્ઞાન અને ખેતી',
      desc: 'પાકની ઉપજ પ્રક્રિયાઓને ઓટોમેટ કરે છે, રોકડિયા પાકોનું રક્ષણ કરે છે, જમીનના સ્વાસ્થ્યનું વિશ્લેષણ કરે છે, અને જૈવિક ખાતરો બનાવે છે.',
      subjects: 'જીવવિજ્ઞાન, રસાયણશાસ્ત્ર, આધુનિક ખેતી ટેકનોલોજી',
      roadmap: 'ધોરણ ૧૦ પાસ કરો -> સાયન્સ પ્રવાહ (PCB) -> એગ્રીકલ્ચર સાયન્સમાં બેચલર (B.Sc. Agri) -> રિસર્ચ સાયન્ટિસ્ટ.',
      scholarship: 'ICAR નેશનલ ટેલેન્ટ સ્કોલરશિપ (NTS), ઇન્ડિયા એગ્રી-રિસર્ચ ફેલોશિપ.',
      scholarshipsList: [
        {
          name: "ICAR નેશનલ ટેલેન્ટ સ્કોલરશિપ (NTS)",
          amount: "₹3,000 પ્રતિ માસ",
          eligibility: "ICAR-AIEEA દ્વારા પોતાના ગૃહ રાજ્યની બહારની રાજ્ય કૃષિ યુનિવર્સિટીમાં પ્રવેશ મેળવ્યો હોય.",
          description: "કૃષિ શિક્ષણમાં રાષ્ટ્રીય ગતિશીલતાને પ્રોત્સાહન આપવા માટે ભારતીય કૃષિ સંશોધન પરિષદ દ્વારા આપવામાં આવે છે."
        }
      ]
    },
    'renew-tech': {
      title: 'સોલર અને રિન્યુએબલ ગ્રીડ એન્જિનિયર ☀️',
      category: 'એન્જિનિયરિંગ અને ગ્રીન પાવર',
      desc: 'ગ્રામીણ ગામડાઓને સતત વીજળી પૂરી પાડવા માટે સ્થાનિક સોલર પેનલ મિની-ગ્રીડ અને પવન પાવર સેટઅપ સ્થાપિત કરે છે.',
      subjects: 'ભૌતિકશાસ્ત્ર, ગણિતશાસ્ત્ર, ઇલેક્ટ્રિકલ સર્કિટ્સ',
      roadmap: 'ધોરણ ૧૦ પાસ કરો -> વોકેશનલ ITI ડિપ્લોમા અથવા સાયન્સ પ્રવાહ (PCM) -> પાવર એન્જિનિયરિંગમાં B.Tech.',
      scholarship: 'પ્રેરણા ગ્રામીણ એન્જિનિયરિંગ સ્કોલરશિપ, નેશનલ સોલર મિશન તાલીમ સહાય.',
      scholarshipsList: [
        {
          name: "છોકરીઓ માટે AICTE પ્રગતિ સ્કોલરશિપ",
          amount: "૪ વર્ષ સુધી વર્ષે ₹50,000",
          eligibility: "પ્રથમ વર્ષ B.Tech અથવા ડિપ્લોમા કોર્સમાં પ્રવેશ મેળવતી વિદ્યાર્થીનીઓ, પારિવારિક આવક ₹8 લાખથી ઓછી.",
          description: "ઉચ્ચ તકનીકી શિક્ષણ મેળવતી વિદ્યાર્થીનીઓને પ્રોત્સાહિત કરવા માટે AICTE દ્વારા એક ઉત્કૃષ્ટ પહેલ."
        }
      ]
    },
    'vet-doc': {
      title: 'સામુદાયિક પશુચિકિત્સક 🩺',
      category: 'પશુધન સંભાળ અને આરોગ્ય સેવા',
      desc: 'પશુધન, દૂધાળા પશુઓ, મરઘા અને ખેતીના સાથી પ્રાણીઓને સાફ, રસીયુક્ત અને સ્વસ્થ રાખે છે.',
      subjects: 'પ્રાણી શરીરવિજ્ઞાન, જીવવિજ્ઞાન, પશુચિકિત્સા દવાઓ',
      roadmap: 'ધોરણ ૧૦ પાસ કરો -> બાયોલોજી પ્રવાહ (PCB) -> બેચલર ઓફ વેટરનરી સાયન્સ (B.V.Sc & AH) -> રજિસ્ટર્ડ વેટરનરી ડોક્ટર.',
      scholarship: 'VCI મેરિટ સ્કોલરશિપ્સ, ઇન્ડિયન એનિમલ વેલ્ફેર રિસર્ચ આસિસ્ટન્સ.',
      scholarshipsList: [
        {
          name: "વેટરનરી કાઉન્સિલ ઓફ ઇન્ડિયા (VCI) મેરિટ સ્કોલરશિપ",
          amount: "₹1,000 પ્રતિ માસ",
          eligibility: "વેટરનરી રાજ્ય CET/NEET ના ટોચના સ્કોરર્સ જેઓ માન્યતા પ્રાપ્ત વેટરનરી કોલેજોમાં પ્રવેશ મેળવે છે.",
          description: "પશુચિકિત્સા વિજ્ઞાનમાં આશાસ્પદ પ્રતિભાને પ્રોત્સાહિત કરવા માટે વેટરનરી કાઉન્સિલ ઓફ ઇન્ડિયા દ્વારા એનાયત કરવામાં આવે છે."
        }
      ]
    },
    'cyber-code': {
      title: 'સોફ્ટવેર ડેવલપર અને સાયબર સિક્યુરિટી 💻',
      category: 'ઇન્ફોર્મેશન ટેકનોલોજી',
      desc: 'સ્થાનિક મોબાઇલ એપ્લિકેશનો કોડ કરે છે, ક્લાઉડ સ્ટોરેજ આર્કિટેક્ચરને સુરક્ષિત રીતે સંચાલિત કરે છે અને સાયબર સુરક્ષાનું માર્ગદર્શન કરે છે.',
      subjects: 'કમ્પ્યુટર વિજ્ઞાન, બીજગણિત, અંગ્રેજી સાક્ષરતા',
      roadmap: 'ધોરણ ૧૦ પાસ કરો -> PCM પ્રવાહ અથવા પોલિટેકનિક CS -> કમ્પ્યુટર એપ્લિકેશન્સમાં બેચલર (BCA) અથવા B.Tech CS.',
      scholarship: 'ટેકનિકલ પ્રવાહો માટે પીએમ નરેન્દ્ર મોદી સ્કોલરશિપ સ્કીમ, AICTE ગ્રામીણ કોડર એવોર્ડ્સ.',
      scholarshipsList: [
        {
          name: "AICTE સક્ષમ સ્કોલરશિપ સ્કીમ",
          amount: "વર્ષે ₹50,000",
          eligibility: "તકનીકી અભ્યાસક્રમો (કમ્પ્યુટર વિજ્ઞાન/BCA) માં ડિગ્રી/ડિપ્લોમા મેળવતા દિવ્યાંગ વિદ્યાર્થીઓ.",
          description: "તકનીકી કૌશલ્ય વિકાસ, પુસ્તકો અને લેપટોપ જેવા સહાયક ઉપકરણો માટે નાણાકીય સહાય પૂરી પાડે છે."
        }
      ]
    },
    'gov-teacher': {
      title: 'સિવિલ સેવક અથવા શિક્ષક 🏛️',
      category: 'વહીવટ અને શિક્ષણ',
      desc: 'સ્થાનિક વહીવટનું માર્ગદર્શન કરે છે, ગ્રામીણ કલ્યાણ યોજનાઓનું સંચાલન કરે છે અથવા પ્રાથમિક અને માધ્યમિક શાળાઓમાં ભણાવે છે.',
      subjects: 'નાગરિકશાસ્ત્ર, ઇતિહાસ, ભાષા સાહિત્ય, શિક્ષણશાસ્ત્ર',
      roadmap: 'ધોરણ ૧૦ પાસ કરો -> આર્ટ્સ/સાયન્સ પ્રવાહ -> બેચલર ડિગ્રી (BA/B.Sc) -> UPSC/રાજ્ય સિવિલ પરીક્ષાઓ અથવા B.Ed પાસ કરો.',
      scholarship: 'નેશનલ ફેલોશિપ સ્કીમ્સ, સ્ટેટ વેલ્ફેર ટ્રેનિંગ ગ્રાન્ટ વાઉચર્સ.',
      scholarshipsList: [
        {
          name: "એકલ પુત્રી માટે UGC પોસ્ટગ્રેજ્યુએટ સ્કોલરશિપ",
          amount: "૨ વર્ષ માટે વર્ષે ₹36,200",
          eligibility: "નિયમિત પીજી અથવા B.Ed ડિગ્રી મેળવતા પોસ્ટગ્રેજ્યુએટ વિદ્યાર્થીઓ કે જેઓ તેમના પરિવારમાં એકમાત્ર પુત્રી છે.",
          description: "મહિલા શિક્ષકો અને વહીવટકર્તાઓ માટે ઉચ્ચ શૈક્ષણિક તકો અને તાલીમને પ્રોત્સાહન આપે છે."
        }
      ]
    }
  },
  mr: {
    'agri-sci': {
      title: 'कृषी वैज्ञानिक 🌾',
      category: 'ग्रामीण विज्ञान आणि शेती',
      desc: 'उत्पादन प्रक्रिया स्वयंचलित करतो, रोख पिकांचे रक्षण करतो, मातीचे आरोग्य विश्लेषित करतो आणि सेंद्रिय खते तयार करतो.',
      subjects: 'जीवशास्त्र, रसायनशास्त्र, आधुनिक शेती तंत्रज्ञान',
      roadmap: 'इयत्ता १० वी उत्तीर्ण -> विज्ञान शाखा (PCB) -> कृषी विज्ञानात पदवी (B.Sc. Agri) -> संशोधन वैज्ञानिक.',
      scholarship: 'ICAR राष्ट्रीय प्रज्ञा शोध शिष्यवृत्ती (NTS), भारत कृषी-संशोधन फेलोशिप.',
      scholarshipsList: [
        {
          name: "ICAR राष्ट्रीय प्रज्ञा शोध शिष्यवृत्ती (NTS)",
          amount: "₹३,००० प्रति महा",
          eligibility: "ICAR-AIEEA द्वारे आपल्या गृहराज्याबाहेरील राज्य कृषी विद्यापीठात प्रवेश घेतलेला असावा.",
          description: "कृषी शिक्षणात राष्ट्रीय गतिशीलतेला प्रोत्साहन देण्यासाठी भारतीय कृषी संशोधन परिषदेद्वारे प्रदान केले जाते."
        }
      ]
    },
    'renew-tech': {
      title: 'सौर आणि नवीकरणीय ग्रिड अभियंता ☀️',
      category: 'अभियांत्रिकी आणि हरित ऊर्जा',
      desc: 'ग्रामीण गावांना सतत वीज पुरवण्यासाठी स्थानिक सौर पॅनेल मिनी-ग्रिड आणि पवन ऊर्जा संच स्थापित करतो.',
      subjects: 'भौतिकशास्त्र, गणित, इलेक्ट्रिकल सर्किट्स',
      roadmap: 'इयत्ता १० वी उत्तीर्ण -> व्यावसायिक ITI डिप्लोमा किंवा विज्ञान शाखा (PCM) -> पॉवर इंजिनिअरिंगमध्ये B.Tech.',
      scholarship: 'प्रेरणा ग्रामीण अभियांत्रिकी शिष्यवृत्ती, राष्ट्रीय सौर मिशन प्रशिक्षण सहाय्य.',
      scholarshipsList: [
        {
          name: "मुलींसाठी AICTE प्रगती शिष्यवृत्ती",
          amount: "४ वर्षांपर्यंत ₹५०,००० प्रति वर्ष",
          eligibility: "प्रथम वर्ष B.Tech किंवा डिप्लोमा अभ्यासक्रमांना प्रवेश घेणाऱ्या विद्यार्थिनी, कौटुंबिक उत्पन्न ₹८ लाखांपेक्षा कमी.",
          description: "उच्च तांत्रिक शिक्षण घेणाऱ्या मुलींना प्रोत्साहन देण्यासाठी AICTE चा एक उत्कृष्ट उपक्रम."
        }
      ]
    },
    'vet-doc': {
      title: 'सामुदायिक पशुवैद्यकीय डॉक्टर 🩺',
      category: 'पशुधन काळजी आणि आरोग्य सेवा',
      desc: 'पशुधन, दुग्धजन्य प्राणी, कोंबड्या आणि शेतीतील साथी प्राणी स्वच्छ, लसीकरण केलेले आणि निरोगी ठेवतो.',
      subjects: 'प्राणी शरीरशास्त्र, जीवशास्त्र, पशुवैद्यकीय औषधे',
      roadmap: 'इयत्ता १० वी उत्तीर्ण -> जीवशास्त्र शाखा (PCB) -> पशुवैद्यकीय विज्ञान पदवी (B.V.Sc & AH) -> नोंदणीकृत पशुवैद्यकीय डॉक्टर.',
      scholarship: 'VCI गुणवत्ता शिष्यवृत्ती, भारतीय प्राणी कल्याण संशोधन सहाय्य.',
      scholarshipsList: [
        {
          name: "पशुवैद्यकीय परिषद (VCI) गुणवत्ता शिष्यवृत्ती",
          amount: "₹१,००० प्रति महा",
          eligibility: "राज्य पशुवैद्यकीय CET/NEET चे अव्वल गुणवंत जे मान्यताप्राप्त पशुवैद्यकीय महाविद्यालयात प्रवेश घेतात.",
          description: "पशुवैद्यकीय विज्ञानातील आश्वासक प्रतिभेला प्रोत्साहन देण्यासाठी भारतीय पशुवैद्यकीय परिषदेद्वारे प्रदान केले जाते."
        }
      ]
    },
    'cyber-code': {
      title: 'सॉफ्टवेअर डेव्हलपर आणि सायबर सुरक्षा 💻',
      category: 'माहिती तंत्रज्ञान',
      desc: 'स्थानिक मोबाईल युटिलिटी ॲप्स कोड करतो, क्लाउड स्टोरेज सुरक्षितपणे व्यवस्थापित करतो आणि सायबर सुरक्षेचे मार्गदर्शन करतो.',
      subjects: 'संगणक विज्ञान, बीजगणित, इंग्रजी साक्षरता',
      roadmap: 'इयत्ता १० वी उत्तीर्ण -> PCM शाखा किंवा पॉलिटेक्निक CS -> संगणक उपयोगात पदवी (BCA) किंवा B.Tech CS.',
      scholarship: 'तांत्रिक शाखेसाठी पंतप्रधान नरेंद्र मोदी शिष्यवृत्ती योजना, AICTE ग्रामीण कोडर पुरस्कार.',
      scholarshipsList: [
        {
          name: "AICTE सक्षम शिष्यवृत्ती योजना",
          amount: "₹५०,००० प्रति वर्ष",
          eligibility: "तांत्रिक अभ्यासक्रमात (संगणक विज्ञान/BCA) पदवी/डिप्लोमा घेणारे दिव्यांग विद्यार्थी.",
          description: "तांत्रिक कौशल्य विकास, पुस्तके आणि लॅपटॉप यांसारख्या सहाय्यक उपकरणांसाठी आर्थिक सहाय्य प्रदान करते."
        }
      ]
    },
    'gov-teacher': {
      title: 'सनदी अधिकारी किंवा शिक्षक 🏛️',
      category: 'प्रशासन आणि शिक्षण',
      desc: 'स्थानिक प्रशासनाला मार्गदर्शन करतो, ग्रामीण कल्याण योजनांचे व्यवस्थापन करतो किंवा प्राथमिक आणि माध्यमिक शाळांमध्ये शिकवतो.',
      subjects: 'नागरिकशास्त्र, इतिहास, भाषा साहित्य, अध्यापनशास्त्र',
      roadmap: 'इयत्ता १० वी उत्तीर्ण -> कला/विज्ञान शाखा -> पदवी (BA/B.Sc) -> UPSC/राज्य नागरी सेवा परीक्षा किंवा B.Ed उत्तीर्ण करा.',
      scholarship: 'राष्ट्रीय फेलोशिप योजना, राज्य कल्याण प्रशिक्षण अनुदान व्हाउचर.',
      scholarshipsList: [
        {
          name: "एकुलत्या एक मुलीसाठी UGC पदव्युत्तर शिष्यवृत्ती",
          amount: "२ वर्षांसाठी ₹३६,२०० प्रति वर्ष",
          eligibility: "नियमित पीजी किंवा B.Ed पदवी घेणारे पदव्युत्तर विद्यार्थी जे त्यांच्या कुटुंबातील एकुलते एक कन्या अपत्य आहेत.",
          description: "महिला शिक्षक आणि प्रशासकांसाठी उच्च शैक्षणिक संधी आणि प्रशिक्षणाला प्रोत्साहन देते."
        }
      ]
    }
  },
  ta: {
    'agri-sci': {
      title: 'வேளாண் वैज्ञानिक 🌾',
      category: 'கிராமப்புற அறிவியல் & விவசாயம்',
      desc: 'விளைச்சல் செயல்முறைகளை தானியக்கமாக்குகிறது, பயிர்களைப் பாதுகாக்கிறது, மண்ணின் ஆரோக்கியத்தை பகுப்பாய்வு செய்கிறது, மற்றும் இயற்கை உரங்களை உருவாக்குகிறது.',
      subjects: 'உயிரியல், வேதியியல், நவீன விவசாய தொழில்நுட்பம்',
      roadmap: '10-ஆம் வகுப்பு தேர்ச்சி -> அறிவியல் பிரிவு (PCB) -> வேளாண் அறிவியல் இளங்கலை (B.Sc. Agri) -> ஆராய்ச்சி விஞ்ஞானி.',
      scholarship: 'ICAR தேசிய திறமை உதவித்தொகை (NTS), இந்திய வேளாண் ஆராய்ச்சி நிதியுதவி.',
      scholarshipsList: [
        {
          name: "ICAR தேசிய திறமை உதவித்தொகை (NTS)",
          amount: "மாதம் ₹3,000",
          eligibility: "ICAR-AIEEA மூலம் தனது சொந்த மாநிலத்திற்கு வெளியே உள்ள மாநில வேளாண் பல்கலைக்கழகத்தில் சேர்க்கை பெற்றிருக்க வேண்டும்.",
          description: "வேளாண் கல்வியில் தேசிய அளவிலான இயக்கத்தை ஊக்குவிக்க இந்திய வேளாண் ஆராய்ச்சி கவுன்சிலால் வழங்கப்படுகிறது."
        }
      ]
    },
    'renew-tech': {
      title: 'சூரியசக்தி மற்றும் புதுப்பிக்கத்தக்க கிரிட் பொறியாளர் ☀️',
      category: 'பொறியியல் & பசுமை ஆற்றல்',
      desc: 'கிராமப்புற கிராமங்களுக்கு தொடர்ச்சியான மின்சாரத்தை வழங்க உள்ளூர் சூரியசக்தி பேனல் மினி-கிரிட்கள் மற்றும் காற்று மின்சார அமைப்புகளை நிறுவுகிறது.',
      subjects: 'இயற்பியல், கணிதம், மின்சுற்றுகள்',
      roadmap: '10-ஆம் வகுப்பு தேர்ச்சி -> தொழில்முறை ITI டிப்ளமோ அல்லது அறிவியல் பிரிவு (PCM) -> மின் ஆற்றல் பொறியியல் இளங்கலை (B.Tech).',
      scholarship: 'பிரேரணா கிராமப்புற பொறியியல் உதவித்தொகை, தேசிய சூரியசக்தி பயிற்சி உதவிகள்.',
      scholarshipsList: [
        {
          name: "பெண்களுக்கான AICTE பிரகதி உதவித்தொகை",
          amount: "4 ஆண்டுகள் வரை ஆண்டுக்கு ₹50,000",
          eligibility: "முதலாம் ஆண்டு B.Tech அல்லது டிப்ளமோ படிப்புகளில் சேர்க்கை பெற்ற மாணவிகள், குடும்ப வருமானம் ₹8 லட்சத்திற்குக் கீழ்.",
          description: "பெண்கள் உயர் தொழில்நுட்பக் கல்வியைத் தொடர ஊக்குவிக்க AICTE-யின் ஒரு சிறந்த முயற்சி."
        }
      ]
    },
    'vet-doc': {
      title: 'சமூக கால்நடை மருத்துவர் 🩺',
      category: 'கால்நடை பராமரிப்பு & சுகாதாரம்',
      desc: 'கால்நடைகள், பால் மாடுகள், கோழிகள் மற்றும் விவசாயத் தோழர்களை சுத்தமாகவும், தடுப்பூசி போடப்பட்டதாகவும், ஆரோக்கியமாகவும் வைத்திருக்கிறார்.',
      subjects: 'விலங்கு உடலியல், உயிரியல், கால்நடை மருந்துகள்',
      roadmap: '10-ஆம் வகுப்பு தேர்ச்சி -> உயிரியல் பிரிவு (PCB) -> கால்நடை அறிவியல் இளங்கலை (B.V.Sc & AH) -> பதிவு செய்யப்பட்ட கால்நடை மருத்துவர்.',
      scholarship: 'VCI தகுதி உதவித்தொகை, இந்திய விலங்கு நல ஆராய்ச்சி உதவிகள்.',
      scholarshipsList: [
        {
          name: "இந்திய கால்நடை கவுன்சில் (VCI) தகுதி உதவித்தொகை",
          amount: "மாதம் ₹1,000",
          eligibility: "அங்கீகரிக்கப்பட்ட கால்நடை மருத்துவக் கல்லூரிகளில் சேர்க்கை பெறும் மாநில கால்நடை CET/NEET தேர்வுகளில் சிறந்த மதிப்பெண் பெற்றவர்கள்.",
          description: "கால்நடை அறிவியலில் சிறந்த திறமைகளை ஊக்குவிக்க இந்திய கால்நடை கவுன்சிலால் வழங்கப்படுகிறது."
        }
      ]
    },
    'cyber-code': {
      title: 'மென்பொருள் உருவாக்குநர் & சைபர் பாதுகாப்பு 💻',
      category: 'தகவல் தொழில்நுட்பம் (IT)',
      desc: 'உள்ளூர் மொபைல் பயன்பாட்டு செயலிகளை உருவாக்குகிறது, கிளவுட் சேமிப்பக கட்டமைப்புகளைப் பாதுகாப்பாக நிர்வகிக்கிறது, மற்றும் சைபர் பாதுகாப்பை உறுதி செய்கிறது.',
      subjects: 'கணினி அறிவியல், இயற்கணிதம், ஆங்கில அறிவு',
      roadmap: '10-ஆம் வகுப்பு தேர்ச்சி -> PCM பிரிவு அல்லது பாலிடெக்னிக் CS -> கணினி பயன்பாட்டியல் இளங்கலை (BCA) அல்லது B.Tech CS.',
      scholarship: 'தொழில்நுட்பப் பிரிவுகளுக்கான பிரதமர் நரேந்திர மோடி உதவித்தொகை திட்டம், AICTE கிராமப்புற குறியீட்டாளர் விருதுகள்.',
      scholarshipsList: [
        {
          name: "AICTE சக்ஷம் உதவித்தொகை திட்டம்",
          amount: "ஆண்டுக்கு ₹50,000",
          eligibility: "தொழில்நுட்பப் படிப்புகளில் (கணினி அறிவியல்/BCA) பட்டப்படிப்பு/டிப்ளமோ பயிலும் மாற்றுத்திறனாளி மாணவர்கள்.",
          description: "தொழில்நுட்பத் திறன் மேம்பாடு, புத்தகங்கள் மற்றும் லேப்டாப் போன்ற உதவிக் கருவிகளை வாங்க நிதியுதவி வழங்குகிறது."
        }
      ]
    },
    'gov-teacher': {
      title: 'அரசு அதிகாரி அல்லது கல்வியாளர் 🏛️',
      category: 'நிர்வாகம் & கல்வி',
      desc: 'உள்ளூர் நிர்வாகத்தை வழிநடத்துகிறது, கிராமப்புற நலத் திட்டங்களை நிர்வகிக்கிறது, அல்லது ஆரம்ப மற்றும் மேல்நிலைப் பள்ளிகளில் கற்பிக்கிறது.',
      subjects: 'குடிமையியல், வரலாறு, மொழி இலக்கியம், கற்பித்தல் முறை',
      roadmap: '10-ஆம் வகுப்பு தேர்ச்சி -> கலை/அறிவியல் பிரிவு -> இளங்கலை பட்டம் (BA/B.Sc) -> UPSC/மாநில அரசுப் பணிகளுக்கான தேர்வுகள் அல்லது B.Ed தேர்ச்சி.',
      scholarship: 'தேசிய ஆராய்ச்சி உதவித்தொகை திட்டங்கள், மாநில அரசு பயிற்சி நிதியுதவி வவுச்சர்கள்.',
      scholarshipsList: [
        {
          name: "ஒற்றைப் பெண் குழந்தைக்கான UGC முதுகலை உதவித்தொகை",
          amount: "2 ஆண்டுகளுக்கு ஆண்டுக்கு ₹36,200",
          eligibility: "தங்கள் குடும்பத்தில் ஒரே பெண் குழந்தையாக இருந்து, வழக்கமான முதுகலை அல்லது B.Ed படிப்புகளை பயிலும் மாணவிகள்.",
          description: "பெண் ஆசிரியர்கள் மற்றும் நிர்வாகிகளுக்கான உயர் கல்வி வாய்ப்புகளையும் பயிற்சியையும் ஊக்குவிக்கிறது."
        }
      ]
    }
  },
  te: {
    'agri-sci': {
      title: 'వ్యవసాయ శాస్త్రవేత్త 🌾',
      category: 'గ్రామీణ విజ్ఞానం & వ్యవసాయం',
      desc: 'దిగుబడి ప్రక్రియలను ఆటోమేట్ చేస్తుంది, పంటలను రక్షిస్తుంది, నేల ఆరోగ్యాన్ని విశ్లేషిస్తుంది మరియు సేంద్రీయ ఎరువులను తయారు చేస్తుంది.',
      subjects: 'జీవశాస్త్రం, రసాయన శాస్త్రం, ఆధునిక వ్యవసాయ సాంకేతికత',
      roadmap: '10వ తరగతి ఉత్తీర్ణత -> సైన్స్ స్ట్రీమ్ (PCB) -> అగ్రికల్చరల్ సైన్స్‌లో బ్యాచిలర్ (B.Sc. Agri) -> పరిశోధన శాస్త్రవేత్త.',
      scholarship: 'ICAR నేషనల్ టాలెంట్ స్కాలర్‌షిప్ (NTS), ఇండియా అగ్రి-రీసెర్చ్ ఫెలోషిప్.',
      scholarshipsList: [
        {
          name: "ICAR నేషనల్ టాలెంట్ స్కాలర్‌షిప్ (NTS)",
          amount: "నెలకి ₹3,000",
          eligibility: "ICAR-AIEEA ద్వారా తన సొంత రాష్ట్రం వెలుపల ఉన్న రాష్ట్ర వ్యవసాయ విశ్వవిద్యాలయంలో ప్రవేశం పొంది ఉండాలి.",
          description: "వ్యవసాయ విద్యలో జాతీయ స్థాయి గమనాన్ని ప్రోత్సహించడానికి భారతీయ వ్యవసాయ పరిశోధన మండలి ద్వారా అందించబడుతుంది."
        }
      ]
    },
    'renew-tech': {
      title: 'సోలార్ మరియు పునరుత్పాదక గ్రిడ్ ఇంజనీర్ ☀️',
      category: 'ఇంజనీరింగ్ & గ్రీన్ పవర్',
      desc: 'గ్రామీణ గ్రామాలకు నిరంతర విద్యుత్‌ను అందించడానికి స్థానిక సోలార్ ప్యానెల్ మినీ-గ్రిడ్‌లు మరియు పవన విద్యుత్ వ్యవస్థలను ఏర్పాటు చేస్తుంది.',
      subjects: 'భౌతికశాస్త్రం, గణితం, ఎలక్ట్రికల్ సర్క్యూట్లు',
      roadmap: '10వ తరగతి ఉత్తీర్ణత -> వృత్తిపరమైన ITI డిప్లొమా లేదా సైన్స్ స్ట్రీమ్ (PCM) -> పవర్ ఇంజనీరింగ్‌లో B.Tech.',
      scholarship: 'ప్రేరణ గ్రామీణ ఇంజనీరింగ్ స్కాలర్‌షిప్స్, జాతీయ సౌర మిషన్ శిక్షణ సాయం.',
      scholarshipsList: [
        {
          name: "బాలికల కోసం AICTE ప్రగతి స్కాలర్‌షిప్",
          amount: "4 సంవత్సరాల వరకు సంవత్సరానికి ₹50,000",
          eligibility: "మొదటి సంవత్సరం B.Tech లేదా డిప్లొమా కోర్సులలో ప్రవేశం పొందిన విద్యార్థినులు, కుటుంబ ఆదాయం ₹8 లక్షల కంటే తక్కువ.",
          description: "బాలికలు ఉన్నత సాంకేతిక విద్యను అభ్యసించేలా ప్రోత్సహించడానికి AICTE ద్వారా ఒక అద్భుతమైన చొరవ."
        }
      ]
    },
    'vet-doc': {
      title: 'కమ్యూనిటీ పశువైద్యుడు 🩺',
      category: 'పశువుల సంరక్షణ & ఆరోగ్యం',
      desc: 'పశువులు, పాలు ఇచ్చే జంతువులు, కోళ్ళు మరియు వ్యవసాయ తోడు జంతువులను శుభ్రంగా, టీకాలు వేసి, ఆరోగ్యంగా ఉంచుతుంది.',
      subjects: 'జంతు శరీరధర్మ శాస్త్రం, జీవశాస్త్రం, పశువైద్య మందులు',
      roadmap: '10వ తరగతి ఉత్తీర్ణత -> జీవశాస్త్ర స్ట్రీమ్ (PCB) -> బ్యాచిలర్ ఆఫ్ వెటర్నరీ సైన్స్ (B.V.Sc & AH) -> రిజిస్టర్డ్ పశువైద్యుడు.',
      scholarship: 'VCI మెరిట్ స్కాలర్‌షిప్‌లు, భారతీయ జంతు సంక్షేమ పరిశోధన సహాయం.',
      scholarshipsList: [
        {
          name: "వెటర్నరీ కౌన్సిల్ ఆఫ్ ఇండియా (VCI) మెరిట్ స్కాలర్‌షిప్",
          amount: "నెలకి ₹1,000",
          eligibility: "గుర్తింపు పొందిన వెటర్నరీ కాలేజీలలో ప్రవేశం పొందిన రాష్ట్ర వెటర్నరీ CET/NEET టాపర్స్.",
          description: "పశువైద్య శాస్త్రంలో మంచి ప్రతిభను ప్రోత్సహించడానికి వెటర్నరీ కౌన్సిల్ ఆఫ్ ఇండియా ద్వారా అందించబడుతుంది."
        }
      ]
    },
    'cyber-code': {
      title: 'సాఫ్ట్‌వేర్ డెవలపర్ & సైబర్ సెక్యూరిటీ 💻',
      category: 'ఇన్ఫర్మేషన్ టెక్నాలజీ (IT)',
      desc: 'స్థానిక మొబైల్ యుటిలిటీ అప్లికేషన్‌లను కోడింగ్ చేస్తుంది, క్లౌడ్ స్టోరేజ్ ఆర్కిటెక్చర్‌లను సురక్షితంగా నిర్వహిస్తుంది మరియు సైబర్ భద్రతను పర్యవేక్షిస్తుంది.',
      subjects: 'కంప్యూటర్ సైన్స్, బీజగణితం, ఇంగ్లీష్ పరిజ్ఞానం',
      roadmap: '10వ తరగతి ఉత్తీర్ణత -> PCM స్ట్రీమ్ లేదా పాలిటెక్నిక్ CS -> కంప్యూటర్ అప్లికేషన్స్‌లో బ్యాచిలర్ (BCA) లేదా B.Tech CS.',
      scholarship: 'సాంకేతిక విభాగాలకు పిఎం నరేంద్ర మోదీ స్కాలర్‌షిప్ స్కీమ్, AICTE రూరల్ కోడర్ అవార్డ్స్.',
      scholarshipsList: [
        {
          name: "AICTE సక్షమ్ స్కాలర్‌షిప్ స్కీమ్",
          amount: "సంవత్సరానికి ₹50,000",
          eligibility: "సాంకేతిక కోర్సులలో (కంప్యూటర్ సైన్స్/BCA) డిగ్రీ/డిప్లొమా అభ్యసిస్తున్న దివ్యాంగులైన విద్యార్థులు.",
          description: "సాంకేతిక నైపుణ్యాభివృద్ధి, పుస్తకాలు మరియు ల్యాప్‌టాప్ వంటి సహాయక పరికరాల కోసం ఆర్థిక సహాయాన్ని అందిస్తుంది."
        }
      ]
    },
    'gov-teacher': {
      title: 'సివిల్ సర్వెంట్ లేదా ప్రభుత్వ ఉపాధ్యాయుడు 🏛️',
      category: 'పరిపాలన & విద్య',
      desc: 'స్థానిక పరిపాలనను నడిపిస్తుంది, గ్రామీణ సంక్షేమ పథకాలను నిర్వహిస్తుంది లేదా ప్రాథమిక మరియు ఉన్నత పాఠశాలల్లో బోధిస్తుంది.',
      subjects: 'పౌరశాస్త్రం, చరిత్ర, భాషా సాహిత్యం, బోధనా పద్ధతులు',
      roadmap: '10వ తరగతి ఉత్తీర్ణత -> ఆర్ట్స్/సైన్స్ స్ట్రీమ్ -> బ్యాచిలర్ డిగ్రీ (BA/B.Sc) -> UPSC/రాష్ట్ర సివిల్స్ పరీక్షలు లేదా B.Ed ఉత్తీర్ణత.',
      scholarship: 'జాతీయ రీసెర్చ్ ఫెలోషిప్ స్కేమ్స్, రాష్ట్ర సంక్షేమ శిక్షణ గ్రాంట్ వోచర్లు.',
      scholarshipsList: [
        {
          name: "ఒంటరి ఆడపిల్ల కోసం UGC పోస్ట్ గ్రాడ్యుయేట్ స్కాలర్‌షిప్",
          amount: "2 సంవత్సరాల వరకు సంవత్సరానికి ₹36,200",
          eligibility: "కుటుంబంలో ఏకైక ఆడపిల్ల అయి ఉండి, రెగ్యులర్ పీజీ లేదా B.Ed కోర్సు చదువుతున్న విద్యార్థినులు.",
          description: "మహిళా ఉపాధ్యాయులు మరియు నిర్వాహకులకు ఉన్నత విద్యా అవకాశాలు మరియు శిక్షణను ప్రోత్సహిస్తుంది."
        }
      ]
    }
  }
};

const getTranslatedCareer = (career: typeof CAREERS[0], lang: string) => {
  const langOverrides = TRANSLATED_CAREERS[lang] || {};
  return {
    ...career,
    ...langOverrides[career.id]
  };
};

const SUBJECT_SUGGESTIONS = ['Mathematics', 'Science (Biology)', 'Physics & Chemistry', 'Social Studies/Civics', 'Computer Science', 'Languages & Arts'];
const INTEREST_SUGGESTIONS = ['Organic Farming', 'Green Renewable Energy', 'Mobile Apps & Coding', 'Teaching & Coaching', 'Rural Healthcare', 'Dairy Farming'];
const HOBBIES_SUGGESTIONS = ['Reading Books', 'Fixing Gadgets', 'Gardening/Plants', 'Cricket & Sports', 'Drawing & Crafting', 'Helping Community'];
const SKILLS_SUGGESTIONS = ['Fast Calculation', 'Computer Typing', 'Public Speaking', 'Building Gadgets', 'Storytelling', 'Animal Care'];

export default function CareerGuidanceTab({ lang, user }: CareerGuidanceTabProps) {
  const t = (key: string) => {
    return CAREER_PAGE_TRANSLATIONS[lang]?.[key] || CAREER_PAGE_TRANSLATIONS['en']?.[key] || key;
  };
  const activeSuggestions = SUGGESTION_TRANSLATIONS[lang] || SUGGESTION_TRANSLATIONS['en'];

  const [selectedCareer, setSelectedCareer] = useState<typeof CAREERS[0] | null>(null);

  // Matchmaker Questionnaire states
  const [inQuiz, setInQuiz] = useState(false);
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [resultCareer, setResultCareer] = useState<typeof CAREERS[0] | null>(null);

  const activeCareer = selectedCareer ? getTranslatedCareer(selectedCareer, lang) : null;
  const activeResultCareer = resultCareer ? getTranslatedCareer(resultCareer, lang) : null;

  // AI Personalized Planner states
  const [showAIPlanner, setShowAIPlanner] = useState(false);
  const [aiFavoriteSubject, setAiFavoriteSubject] = useState('');
  const [aiInterests, setAiInterests] = useState('');
  const [aiHobbies, setAiHobbies] = useState('');
  const [aiSkills, setAiSkills] = useState('');
  const [aiPersonality, setAiPersonality] = useState('Analytical & Focused');
  const [aiAcademicLevel, setAiAcademicLevel] = useState(user?.standard || 'Grade 10');
  const [aiCareerGoal, setAiCareerGoal] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  useEffect(() => {
    if (user?.standard) {
      setAiAcademicLevel(user.standard);
    }
  }, [user?.standard]);

  const startQuiz = () => {
    stopSpeaking();
    setShowAIPlanner(false);
    setInQuiz(true);
    setStep(1);
    setAnswers({});
    setResultCareer(null);
    speakText("Welcome! Answer three simple questions, and I will match your career pathway!", lang, "Swami AI", "🤖 Swami AI");
  };

  const handleSelectAnswer = (ansKey: string) => {
    const updated = { ...answers, [step]: ansKey };
    setAnswers(updated);

    if (step < 3) {
      setStep(prev => prev + 1);
    } else {
      // Evaluate result career
      const likesField = updated[1] === 'fields';
      const favSub = updated[2];
      
      let matched = CAREERS[0]; // Default Agriculture
      
      if (likesField) {
        if (favSub === 'science') matched = CAREERS[0]; // Agri Scientist
        else if (favSub === 'math') matched = CAREERS[1]; // Renewable Eng
        else matched = CAREERS[2]; // Vet Doctor
      } else {
        if (favSub === 'math' || favSub === 'science') matched = CAREERS[3]; // Software Coder
        else matched = CAREERS[4]; // Civil Servant/Teacher
      }

      setResultCareer(matched);
      setInQuiz(false);
      speakText(`Evaluation complete! Your natural interests point beautifully to: ${matched.title}. Read the detail roadmap!`, lang, "Swami AI", "🤖 Swami AI");
    }
  };

  const handleGenerateRecommendations = async () => {
    if (!aiFavoriteSubject.trim()) {
      setAiError(lang === 'hi' ? 'कृपया अपना पसंदीदा विषय दर्ज करें!' : 'Please enter your favorite subject!');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    const speakMsg = lang === 'hi' 
      ? 'स्वामी एआई आपकी शैक्षणिक पृष्ठभूमि का विश्लेषण कर रहे हैं...' 
      : 'Swami AI is compiling personalized career paths and college courses for you...';
    speakText(speakMsg, lang, "Swami AI", "🤖 Swami AI");

    try {
      const response = await fetch('/api/gemini/career-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          favoriteSubject: aiFavoriteSubject,
          interests: aiInterests,
          hobbies: aiHobbies,
          skills: aiSkills,
          personality: aiPersonality,
          academicLevel: aiAcademicLevel,
          careerGoal: aiCareerGoal,
          lang: lang
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setAiResult(resData.data);
        const successMsg = lang === 'hi'
          ? 'कैरियर और कॉलेज के सुझाव तैयार हैं!'
          : 'Your personalized careers and college courses recommendation list is ready!';
        speakText(successMsg, lang, "Swami AI", "🤖 Swami AI");
      } else {
        setAiError(resData.message || 'An unexpected response structure was received.');
      }
    } catch (err: any) {
      console.error("[AI Career Planner Error]:", err);
      setAiError(err.message || 'Failed to connect to AI server.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION HEADER */}
      <div className="bg-white rounded-3xl border border-gray-150 p-5 shadow-sm text-left flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-1">
          <h2 className="font-display font-extrabold text-[#3D405B] text-lg flex items-center gap-1.5">
            <Compass className="h-5.5 w-5.5 text-amber-500" />
            {t('title')}
          </h2>
          <p className="text-xs text-gray-400">{t('subtitle')}</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {!showAIPlanner && (
            <button
              onClick={() => { stopSpeaking(); setInQuiz(false); setResultCareer(null); setShowAIPlanner(true); }}
              className="bg-gradient-to-tr from-[#81B29A] to-[#3D405B] hover:opacity-90 active:scale-95 text-white p-3 py-2 px-4 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all"
            >
              <Sparkles className="h-4 w-4 text-[#F2CC8F] animate-pulse" />
              <span>{t('aiPlannerBtn')}</span>
            </button>
          )}

          <button
            onClick={startQuiz}
            className="bg-gradient-to-tr from-[#3D405B] to-[#E07A5F] hover:opacity-90 active:scale-95 text-white p-3 py-2 px-4 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all"
          >
            <Smile className="h-4 w-4 text-[#F2CC8F]" />
            <span>{t('matchmakerBtn')}</span>
          </button>
        </div>
      </div>

      {showAIPlanner ? (
        /* AI PERSONALIZED PLANNER BLOCK */
        <div className="space-y-6 animate-fade-in text-left">
          <div className="bg-gradient-to-tr from-amber-50 to-[#FAF8F4] border border-amber-250 p-5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Sparkle className="h-5.5 w-5.5 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-[#3D405B] text-sm">{t('aiGuidanceTitle')}</h3>
                <p className="text-xs text-gray-500">{t('aiGuidanceDesc')}</p>
              </div>
            </div>
            <button
              onClick={() => { stopSpeaking(); setShowAIPlanner(false); setAiResult(null); setAiError(null); }}
              className="p-2 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-sans font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t('backBtn')}</span>
            </button>
          </div>

          {!aiResult && !aiLoading && (
            <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-3xs space-y-6">
              <h4 className="font-display font-extrabold text-xs text-[#3D405B] uppercase tracking-wider border-b border-gray-100 pb-2">
                {t('section1Title')}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {/* Favorite Subject */}
                <div className="space-y-1.5">
                  <label className="font-sans font-bold text-[#3D405B]">{t('favoriteSubjectLabel')} <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder={t('favoriteSubjectPlaceholder')}
                    value={aiFavoriteSubject}
                    onChange={(e) => setAiFavoriteSubject(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#81B29A]"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeSuggestions.subjects.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setAiFavoriteSubject(sub)}
                        className="p-1 px-2 rounded-md border border-gray-150 bg-gray-50 hover:bg-gray-100 text-[10px] text-gray-650 font-medium"
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div className="space-y-1.5">
                  <label className="font-sans font-bold text-[#3D405B]">{t('keyInterestsLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('keyInterestsPlaceholder')}
                    value={aiInterests}
                    onChange={(e) => setAiInterests(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#81B29A]"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeSuggestions.interests.map((int) => (
                      <button
                        key={int}
                        type="button"
                        onClick={() => setAiInterests(int)}
                        className="p-1 px-2 rounded-md border border-gray-150 bg-gray-50 hover:bg-gray-100 text-[10px] text-gray-650 font-medium"
                      >
                        {int}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hobbies */}
                <div className="space-y-1.5">
                  <label className="font-sans font-bold text-[#3D405B]">{t('hobbiesLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('hobbiesPlaceholder')}
                    value={aiHobbies}
                    onChange={(e) => setAiHobbies(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#81B29A]"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeSuggestions.hobbies.map((hob) => (
                      <button
                        key={hob}
                        type="button"
                        onClick={() => setAiHobbies(hob)}
                        className="p-1 px-2 rounded-md border border-gray-150 bg-gray-50 hover:bg-gray-100 text-[10px] text-gray-650 font-medium"
                      >
                        {hob}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-1.5">
                  <label className="font-sans font-bold text-[#3D405B]">{t('skillsLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('skillsPlaceholder')}
                    value={aiSkills}
                    onChange={(e) => setAiSkills(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#81B29A]"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeSuggestions.skills.map((sk) => (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => setAiSkills(sk)}
                        className="p-1 px-2 rounded-md border border-gray-150 bg-gray-50 hover:bg-gray-100 text-[10px] text-gray-650 font-medium"
                      >
                        {sk}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personality */}
                <div className="space-y-1.5">
                  <label className="font-sans font-bold text-[#3D405B]">{t('personalityVibeLabel')}</label>
                  <select
                    value={aiPersonality}
                    onChange={(e) => setAiPersonality(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#81B29A]"
                  >
                    <option value="Analytical & Focused">{t('personality1')}</option>
                    <option value="Social & Outgoing">{t('personality2')}</option>
                    <option value="Caring & Caring">{t('personality3')}</option>
                    <option value="Creative & Artistic">{t('personality4')}</option>
                  </select>
                </div>

                {/* Academic level / Current education */}
                <div className="space-y-1.5">
                  <label className="font-sans font-bold text-[#3D405B]">{t('currentEduLevelLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('grade10')}
                    value={aiAcademicLevel}
                    onChange={(e) => setAiAcademicLevel(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#81B29A]"
                  />
                </div>

                {/* Specific Career Goal */}
                <div className="col-span-1 md:col-span-2 space-y-1.5">
                  <label className="font-sans font-bold text-[#3D405B]">{t('careerGoalLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('careerGoalPlaceholder')}
                    value={aiCareerGoal}
                    onChange={(e) => setAiCareerGoal(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#81B29A]"
                  />
                </div>
              </div>

              {aiError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateRecommendations}
                  className="bg-gradient-to-tr from-[#3D405B] to-[#81B29A] hover:opacity-90 active:scale-95 text-white p-3 py-2.5 px-6 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all"
                >
                  <Sparkles className="h-4 w-4 text-[#F2CC8F] animate-pulse" />
                  <span>{t('generateBtn')}</span>
                </button>
              </div>
            </div>
          )}

          {/* LOADING STATE */}
          {aiLoading && (
            <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center shadow-3xs flex flex-col justify-center items-center space-y-4">
              <Loader2 className="h-10 w-10 text-[#81B29A] animate-spin" />
              <div className="space-y-1">
                <h4 className="font-display font-extrabold text-[#3D405B] text-sm">{t('aiPlanningTitle')}</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">{t('aiPlanningDesc')}</p>
              </div>
              <div className="w-48 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-[#3D405B] to-[#81B29A] h-full w-2/3 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}

          {/* AI PLANNER RESULTS CANVAS */}
          {aiResult && (
            <div className="space-y-6">
              
              {/* Advice and summary card */}
              <div className="bg-gradient-to-tr from-emerald-50 to-[#FAF8F4] border border-[#81B29A]/30 rounded-2xl p-6 text-[#3D405B] shadow-3xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <h4 className="font-display font-extrabold text-sm text-[#3D405B]">{t('swamiCounsel')}</h4>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-gray-700 font-medium italic">
                  "{aiResult.advice}"
                </p>
              </div>

              {/* Suggested careers (Grid of 3) */}
              <div className="space-y-3">
                <h3 className="font-display font-extrabold text-xs text-[#3D405B] uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-500" />
                  {t('suggestedCareersTitle')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aiResult.careers.map((car, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white rounded-xl border border-gray-150 p-5 shadow-3xs flex flex-col justify-between hover:border-amber-250 transition-all group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <span className="text-2xl">
                            {idx === 0 ? '🏆' : idx === 1 ? '🌟' : '🚀'}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 p-1 px-1.5 rounded-md border border-emerald-100">
                            {t('matchPercentLabel')} {car.suitability}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-display font-extrabold text-xs text-gray-900 group-hover:text-[#E07A5F] transition-colors">
                            {car.title}
                          </h4>
                          <p className="text-gray-650 font-sans text-xs pt-1.5 leading-relaxed font-medium">
                            {car.reason}
                          </p>
                        </div>

                        {car.salary && (
                          <div className="pt-2.5 border-t border-gray-100 space-y-1.5 text-left">
                            <span className="text-[9px] font-mono font-bold text-emerald-800 block uppercase flex items-center gap-1">
                              <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                              {t('salaryInIndiaLabel')}
                            </span>
                            <div className="bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100/30 space-y-1 text-[11px]">
                              <p className="text-gray-650"><strong className="text-gray-750">{t('beginnerSalary')}:</strong> {car.salary.beginner}</p>
                              <p className="text-gray-650"><strong className="text-gray-750">{t('midLevelSalary')}:</strong> {car.salary.midLevel}</p>
                              <p className="text-gray-650"><strong className="text-gray-750">{t('experiencedSalary')}:</strong> {car.salary.experienced}</p>
                            </div>
                          </div>
                        )}

                        {car.growth && (
                          <div className="pt-2.5 border-t border-gray-100 space-y-1.5 text-left">
                            <span className="text-[9px] font-mono font-bold text-amber-800 block uppercase flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                              {t('scopeOppLabel')}
                            </span>
                            <div className="bg-[#FAF8F4] p-2.5 rounded-lg border border-[#F2CC8F]/30 space-y-1.5 text-[11px] leading-relaxed">
                              <p className="text-gray-650"><strong className="text-gray-755 font-bold">{t('futureScopeLabel')}:</strong> {car.growth.futureScope}</p>
                              <p className="text-gray-650"><strong className="text-gray-755 font-bold">{t('jobOppsLabel')}:</strong> {car.growth.jobOpportunities}</p>
                              <p className="text-gray-650"><strong className="text-gray-755 font-bold">{t('demandInIndiaLabel')}:</strong> {car.growth.demand}</p>
                              <p className="text-gray-650"><strong className="text-gray-755 font-bold">{t('careerGrowthLabel')}:</strong> {car.growth.careerGrowth}</p>
                            </div>
                          </div>
                        )}

                        {car.exams && car.exams.length > 0 && (
                          <div className="pt-2.5 border-t border-gray-100 space-y-1.5 text-left">
                            <span className="text-[9px] font-mono font-bold text-amber-700 block uppercase">{t('entranceExamsLabel')}</span>
                            <div className="space-y-2">
                              {car.exams.map((ex, exIdx) => (
                                <div key={exIdx} className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50 text-[11px] leading-relaxed space-y-1">
                                  <p className="font-bold text-gray-800">📝 {ex.name}</p>
                                  <p className="text-gray-650"><strong className="text-gray-750">{t('eligibilityLabel')}:</strong> {ex.eligibility}</p>
                                  {ex.requiredSubjects && (
                                    <p className="text-gray-650"><strong className="text-gray-755">{t('subjectsLabel')}:</strong> {ex.requiredSubjects}</p>
                                  )}
                                  {ex.minQualifications && (
                                    <p className="text-gray-650"><strong className="text-gray-755">{t('qualificationsLabel')}:</strong> {ex.minQualifications}</p>
                                  )}
                                  {ex.ageLimit && (
                                    <p className="text-gray-650"><strong className="text-gray-755">{t('ageLimitLabel')}:</strong> {ex.ageLimit}</p>
                                  )}
                                  <p className="text-gray-655"><strong className="text-gray-755">{t('tipsLabel')}:</strong> {ex.tips}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {car.scholarshipsList && car.scholarshipsList.length > 0 && (
                          <div className="pt-2.5 border-t border-gray-100 space-y-1.5 text-left">
                            <span className="text-[9px] font-mono font-bold text-emerald-800 block uppercase flex items-center gap-1">
                              <Award className="h-3.5 w-3.5 text-emerald-700 animate-pulse" />
                              {t('scholarshipsAidLabel')}
                            </span>
                            <div className="space-y-2">
                              {car.scholarshipsList.map((scholarship, sIdx) => (
                                <div key={sIdx} className="bg-emerald-50/30 p-2.5 rounded-lg border border-emerald-100/30 text-[11px] leading-relaxed space-y-1">
                                  <p className="font-bold text-emerald-900">🏅 {scholarship.name}</p>
                                  <p className="text-gray-655"><strong className="text-emerald-850 font-bold">💰 {t('benefitLabel')}:</strong> {scholarship.amount}</p>
                                  <p className="text-gray-655"><strong className="text-emerald-850 font-bold">🎓 {t('eligibilityLabel')}:</strong> {scholarship.eligibility}</p>
                                  <p className="text-gray-600 text-[10px] italic pt-0.5">{scholarship.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {car.scholarship && (!car.scholarshipsList || car.scholarshipsList.length === 0) && (
                          <div className="pt-2.5 border-t border-gray-100 space-y-1.5 text-left">
                            <span className="text-[9px] font-mono font-bold text-emerald-800 block uppercase flex items-center gap-1">
                              <Award className="h-3.5 w-3.5 text-emerald-700 animate-pulse" />
                              {t('scholarshipsInIndiaLabel')}
                            </span>
                            <p className="text-emerald-700 font-extrabold bg-emerald-50 max-w-max p-1 px-2.5 rounded-md border border-emerald-200 text-[10px]">
                              {car.scholarship}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended College Courses */}
              <div className="space-y-3 pt-2">
                <h3 className="font-display font-extrabold text-xs text-[#3D405B] uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-[#81B29A]" />
                  {t('collegePathwayTitle')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiResult.courses.map((course, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white rounded-xl border border-gray-150 p-5 shadow-3xs hover:border-[#81B29A]/50 transition-all text-left space-y-3.5 animate-fade-in"
                    >
                      <div className="border-b border-gray-100 pb-2 flex justify-between items-start">
                        <div>
                          <h4 className="font-display font-extrabold text-xs text-gray-900 leading-normal">
                            {course.name}
                          </h4>
                          <p className="text-[10px] text-[#3D405B] font-mono font-bold mt-1 uppercase">
                            ⏳ {t('durationLabel')}: {course.duration}
                          </p>
                        </div>
                        <span className="text-xl">🎓</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono uppercase text-gray-400 block font-bold">{t('topInstitutionsLabel')}</span>
                          <p className="text-gray-800 font-semibold leading-relaxed">
                            {course.institutions}
                          </p>
                        </div>

                        <div className="space-y-0.5 pb-2">
                          <span className="text-[9px] font-mono uppercase text-gray-400 block font-bold">{t('alignmentOutcomeLabel')}</span>
                          <p className="text-gray-655 leading-relaxed font-medium">
                            {course.alignment}
                          </p>
                        </div>

                        {course.exams && course.exams.length > 0 && (
                          <div className="pt-2.5 border-t border-gray-100 space-y-1">
                            <span className="text-[9px] font-mono font-bold text-amber-700 block uppercase">{t('admissionExamsLabel')}</span>
                            <div className="space-y-2">
                              {course.exams.map((ex, exIdx) => (
                                <div key={exIdx} className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50 text-[11px] leading-relaxed space-y-1 text-left">
                                  <p className="font-bold text-gray-800">📝 {ex.name}</p>
                                  <p className="text-gray-650"><strong className="text-gray-750">{t('eligibilityLabel')}:</strong> {ex.eligibility}</p>
                                  {ex.requiredSubjects && (
                                    <p className="text-gray-650"><strong className="text-gray-755">{t('subjectsLabel')}:</strong> {ex.requiredSubjects}</p>
                                  )}
                                  {ex.minQualifications && (
                                    <p className="text-gray-650"><strong className="text-gray-755">{t('qualificationsLabel')}:</strong> {ex.minQualifications}</p>
                                  )}
                                  {ex.ageLimit && (
                                    <p className="text-gray-650"><strong className="text-gray-755">{t('ageLimitLabel')}:</strong> {ex.ageLimit}</p>
                                  )}
                                  <p className="text-gray-655"><strong className="text-gray-755">{t('tipsLabel')}:</strong> {ex.tips}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RECOMMENDED ACADEMIC STREAM */}
              {aiResult.recommendedStream && (
                <div className="bg-gradient-to-tr from-[#FAF8F4] to-[#FDFBF7] border border-[#F2CC8F]/50 rounded-2xl p-6 text-left shadow-3xs space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                      <Compass className="h-5 w-5 animate-spin" style={{ animationDuration: '8s' }} />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-bold text-amber-700 uppercase tracking-wider block">{t('streamAnalyzerLabel')}</span>
                      <h4 className="font-display font-extrabold text-[#3D405B] text-sm">
                        {t('recommendedStreamLabel')}: <span className="text-amber-600 underline decoration-amber-300 decoration-2">{aiResult.recommendedStream.streamName}</span>
                      </h4>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <p className="text-gray-755 font-semibold leading-relaxed bg-white/60 p-3 rounded-xl border border-[#F2CC8F]/20">
                      {aiResult.recommendedStream.reason}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">{t('coreSubjectsLabel')}:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {aiResult.recommendedStream.subjectsToFocus.split(',').map((subj, sIdx) => (
                          <span key={sIdx} className="bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-md text-[10px] font-bold border border-[#F2CC8F]/20">
                            📚 {subj.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="bg-[#FAF8F4]/80 p-4 rounded-xl border border-amber-100/40 space-y-1.5">
                        <span className="text-[9px] font-mono font-bold text-amber-800 block uppercase tracking-wider">🚀 {t('optionsAfter10thLabel')}</span>
                        <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                          {aiResult.recommendedStream.after10thOptions}
                        </p>
                      </div>

                      <div className="bg-emerald-50/20 p-4 rounded-xl border border-emerald-100/40 space-y-1.5">
                        <span className="text-[9px] font-mono font-bold text-emerald-800 block uppercase tracking-wider">🎯 {t('careersAfter12thLabel')}</span>
                        <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                          {aiResult.recommendedStream.after12thCareers}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PERSONALIZED STEP-BY-STEP ROADMAP TIMELINE */}
              {aiResult.learningRoadmap && aiResult.learningRoadmap.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-3xs text-left space-y-5 animate-fade-in">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <div className="h-9 w-9 rounded-xl bg-[#81B29A]/15 flex items-center justify-center text-[#81B29A]">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-bold text-emerald-800 uppercase tracking-wider block">{t('milestoneTrackerLabel')}</span>
                      <h4 className="font-display font-extrabold text-[#3D405B] text-sm">{t('learningRoadmapTitle')}</h4>
                    </div>
                  </div>

                  <div className="relative pl-6 sm:pl-8 border-l border-emerald-100/80 space-y-6 pt-1 ml-3.5">
                    {aiResult.learningRoadmap.map((step, sIdx) => (
                      <div key={sIdx} className="relative group text-left">
                        
                        {/* Timeline Circle Indicator */}
                        <span className="absolute -left-9.5 sm:-left-[43px] top-0 h-7 w-7 rounded-full bg-gradient-to-tr from-[#81B29A] to-[#3D405B] border-4 border-white text-white font-mono text-[10px] font-black flex items-center justify-center shadow-3xs group-hover:scale-110 transition-transform">
                          {sIdx + 1}
                        </span>

                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h5 className="font-display font-extrabold text-xs sm:text-sm text-[#3D405B]">
                              {step.phaseName}
                            </h5>
                            <span className="bg-[#FAF8F4] text-amber-800 px-2 py-0.5 rounded-lg border border-[#F2CC8F]/30 text-[10px] font-bold flex items-center gap-1 shrink-0">
                              🎯 {t('milestoneLabel')}: {step.milestone}
                            </span>
                          </div>

                          <p className="text-xs text-gray-650 leading-relaxed font-medium">
                            {step.description}
                          </p>

                          {/* Skills & Exams in the phase */}
                          <div className="flex flex-wrap gap-4 pt-1 text-[10px]">
                            {step.skills && step.skills.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono font-bold text-gray-400 uppercase">{t('skillsLabel')}:</span>
                                <div className="flex flex-wrap gap-1">
                                  {step.skills.map((sk, skIdx) => (
                                    <span key={skIdx} className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold border border-emerald-100">
                                      🛠️ {sk}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {step.exams && step.exams.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono font-bold text-gray-400 uppercase">{t('examsLabel')}:</span>
                                <div className="flex flex-wrap gap-1">
                                  {step.exams.map((ex, exIdx) => (
                                    <span key={exIdx} className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-[#F2CC8F]/30 font-bold">
                                      📝 {ex}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset Option */}
              <div className="pt-3 flex justify-center gap-3">
                <button
                  onClick={() => { setAiResult(null); setAiError(null); }}
                  className="px-5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-sans font-bold cursor-pointer transition-all"
                >
                  {t('recalculateBtn')}
                </button>
                <button
                  onClick={() => { stopSpeaking(); setShowAIPlanner(false); setAiResult(null); setAiError(null); }}
                  className="px-5 py-2 bg-[#3D405B] hover:bg-[#2D2F44] text-white rounded-xl text-xs font-sans font-bold cursor-pointer transition-all"
                >
                  {t('returnDirectoryBtn')}
                </button>
              </div>

            </div>
          )}

        </div>
      ) : inQuiz ? (
        /* INTERACTIVE CAREER MATCHING GAME */
        <div className="bg-white rounded-3xl border border-[#F2CC8F]/30 p-6 text-left max-w-xl mx-auto space-y-5 shadow-xs animate-fade-in">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
            <h4 className="font-display font-extrabold text-xs text-[#3D405B] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
              {t('matchmakerTitle')}
            </h4>
            <button 
              onClick={() => { stopSpeaking(); setInQuiz(false); }}
              className="text-xs text-gray-400 hover:text-gray-600 font-mono"
            >
              {t('cancelLabel')} X
            </button>
          </div>

          <div className="text-xs font-mono font-bold text-amber-700">
            {t('questChecklist').replace('{step}', String(step))}
          </div>

          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#FAF8F4] p-4 rounded-xl border border-[#F2CC8F]/30 text-xs sm:text-sm text-gray-900 font-sans font-semibold leading-relaxed">
                {t('question1')}
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => handleSelectAnswer('fields')}
                  className="w-full p-3 text-left bg-white hover:bg-[#FAF8F4] border border-gray-200 rounded-xl text-xs sm:text-sm font-sans flex items-center justify-between cursor-pointer group"
                >
                  <span>{t('q1Option1')}</span>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 group-hover:text-[#E07A5F] transition-all" />
                </button>
                <button
                  onClick={() => handleSelectAnswer('desk')}
                  className="w-full p-3 text-left bg-white hover:bg-[#FAF8F4] border border-gray-200 rounded-xl text-xs sm:text-sm font-sans flex items-center justify-between cursor-pointer group"
                >
                  <span>{t('q1Option2')}</span>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 group-hover:text-[#E07A5F] transition-all" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#FAF8F4] p-4 rounded-xl border border-[#F2CC8F]/30 text-xs sm:text-sm text-gray-900 font-sans font-semibold leading-relaxed">
                {t('question2')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'science', label: t('q2Option1') },
                  { key: 'math', label: t('q2Option2') },
                  { key: 'lang', label: t('q2Option3') },
                  { key: 'art', label: t('q2Option4') }
                ].map(sub => (
                  <button
                    key={sub.key}
                    onClick={() => handleSelectAnswer(sub.key)}
                    className="p-3 text-left bg-white hover:bg-[#FAF8F4] border border-gray-200 rounded-xl text-xs sm:text-sm font-sans flex items-center justify-between cursor-pointer group"
                  >
                    <span>{sub.label}</span>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 group-hover:text-[#E07A5F] transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#FAF8F4] p-4 rounded-xl border border-[#F2CC8F]/30 text-xs sm:text-sm text-gray-900 font-sans font-semibold leading-relaxed">
                {t('question3')}
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => handleSelectAnswer('heal')}
                  className="w-full p-3 text-left bg-white hover:bg-[#FAF8F4] border border-gray-200 rounded-xl text-xs sm:text-sm font-sans flex items-center justify-between cursor-pointer"
                >
                  <span>{t('q3Option1')}</span>
                </button>
                <button
                  onClick={() => handleSelectAnswer('build')}
                  className="w-full p-3 text-left bg-white hover:bg-[#FAF8F4] border border-gray-200 rounded-xl text-xs sm:text-sm font-sans flex items-center justify-between cursor-pointer"
                >
                  <span>{t('q3Option2')}</span>
                </button>
                <button
                  onClick={() => handleSelectAnswer('leader')}
                  className="w-full p-3 text-left bg-white hover:bg-[#FAF8F4] border border-gray-200 rounded-xl text-xs sm:text-sm font-sans flex items-center justify-between cursor-pointer"
                >
                  <span>{t('q3Option3')}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      ) : activeResultCareer !== null ? (
        /* MATCH RESUL DECK */
        <div className="bg-emerald-50 rounded-3xl border border-emerald-350 p-6 text-left max-w-xl mx-auto space-y-4 animate-fade-in">
          <div className="text-center space-y-1 pb-2 border-b border-emerald-200">
            <span className="text-4xl">🌟</span>
            <h4 className="font-display font-extrabold text-[#3D405B] text-base">{t('recommendedCareerProfile')}</h4>
            <h3 className="font-display font-black text-emerald-800 text-lg sm:text-xl pt-1">
              {activeResultCareer.title}
            </h3>
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm">
            <div className="space-y-1">
              <span className="font-mono font-bold text-emerald-800 uppercase text-[9px] block">{t('roleDescriptionLabel')}</span>
              <p className="text-gray-700 leading-normal font-sans font-medium">{activeResultCareer.desc}</p>
            </div>

            <div className="space-y-1">
              <span className="font-mono font-bold text-emerald-800 uppercase text-[9px] block">{t('studyPathwayLabel')}</span>
              <p className="text-[#3D405B] font-bold leading-normal">{activeResultCareer.roadmap}</p>
            </div>

            <div className="space-y-2">
              <span className="font-mono font-bold text-emerald-800 uppercase text-[9px] block">{t('recommendedScholarshipsLabel')}</span>
              <p className="text-amber-800 font-semibold italic bg-white/40 p-2 rounded-lg border border-emerald-200/30">{activeResultCareer.scholarship}</p>
              
              {activeResultCareer.scholarshipsList && activeResultCareer.scholarshipsList.length > 0 && (
                <div className="grid grid-cols-1 gap-2 pt-1 text-left">
                  {activeResultCareer.scholarshipsList.map((scholarship, idx) => (
                    <div key={idx} className="bg-white/70 p-3 rounded-xl border border-emerald-200/40 space-y-1">
                      <h5 className="font-sans font-bold text-xs text-emerald-900 flex items-center gap-1">
                        <span>🏅</span> {scholarship.name}
                      </h5>
                      <div className="flex flex-wrap gap-1.5 text-[10px] pt-0.5">
                        <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold border border-emerald-100">
                          💰 {scholarship.amount}
                        </span>
                        <span className="bg-[#FAF8F4] text-amber-800 px-1.5 py-0.5 rounded border border-[#F2CC8F]/30 font-medium">
                          🎓 {t('eligibilityLabel')}: {scholarship.eligibility}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 pt-1 leading-relaxed">{scholarship.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {activeResultCareer.salary && (
              <div className="space-y-2 pt-2 border-t border-emerald-200/50">
                <span className="font-mono font-bold text-emerald-800 uppercase text-[9px] block flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                  {t('averageSalaryLabel')}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="bg-emerald-100/30 p-2.5 rounded-xl border border-emerald-200/30">
                    <span className="text-[9px] font-mono text-emerald-800 font-bold uppercase tracking-wider block">{t('beginnerLabel')}</span>
                    <span className="text-xs font-black text-gray-800 block mt-0.5">{activeResultCareer.salary.beginner}</span>
                  </div>
                  <div className="bg-emerald-100/60 p-2.5 rounded-xl border border-emerald-200/50">
                    <span className="text-[9px] font-mono text-emerald-800 font-bold uppercase tracking-wider block">{t('midLevelLabel')}</span>
                    <span className="text-xs font-black text-gray-800 block mt-0.5">{activeResultCareer.salary.midLevel}</span>
                  </div>
                  <div className="bg-emerald-100/90 p-2.5 rounded-xl border border-emerald-200/70">
                    <span className="text-[9px] font-mono text-emerald-800 font-bold uppercase tracking-wider block">{t('experiencedLabel')}</span>
                    <span className="text-xs font-black text-gray-800 block mt-0.5">{activeResultCareer.salary.experienced}</span>
                  </div>
                </div>
              </div>
            )}

            {activeResultCareer.skills && (
              <div className="space-y-3 pt-3 border-t border-emerald-200/50">
                <span className="font-mono font-bold text-emerald-800 uppercase text-[9px] block flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-emerald-700" />
                  {t('skillsToDevelopLabel')}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white/60 p-3 rounded-xl border border-emerald-200/40 space-y-1.5">
                    <strong className="text-[10px] text-emerald-900 font-mono uppercase block flex items-center gap-1">
                      <Code className="h-3 w-3 text-emerald-700" />
                      {t('technicalSkillsLabel')}
                    </strong>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {activeResultCareer.skills.technical.map((sk, idx) => (
                        <span key={idx} className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-medium border border-emerald-100">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/60 p-3 rounded-xl border border-emerald-200/40 space-y-1.5">
                    <strong className="text-[10px] text-[#3D405B] font-mono uppercase block flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-[#3D405B]" />
                      {t('softSkillsLabel')}
                    </strong>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {activeResultCareer.skills.soft.map((sk, idx) => (
                        <span key={idx} className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-[10px] font-medium border border-[#F2CC8F]/30">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeResultCareer.growth && (
              <div className="space-y-3 pt-3 border-t border-emerald-200/50">
                <span className="font-mono font-bold text-emerald-800 uppercase text-[9px] block flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  {t('growthProspectsLabel')}
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="bg-white/60 p-3 rounded-xl border border-emerald-200/40 space-y-1">
                    <strong className="text-[10px] text-emerald-900 font-mono uppercase block">{t('futureScopeLabel')}</strong>
                    <p className="text-xs text-gray-700 leading-relaxed font-medium">{activeResultCareer.growth.futureScope}</p>
                  </div>
                  <div className="bg-white/60 p-3 rounded-xl border border-emerald-200/40 space-y-1">
                    <strong className="text-[10px] text-emerald-900 font-mono uppercase block">{t('jobOpportunitiesLabel')}</strong>
                    <p className="text-xs text-gray-700 leading-relaxed font-medium">{activeResultCareer.growth.jobOpportunities}</p>
                  </div>
                  <div className="bg-white/60 p-3 rounded-xl border border-emerald-200/40 space-y-1">
                    <strong className="text-[10px] text-emerald-900 font-mono uppercase block">{t('marketDemandLabel')}</strong>
                    <p className="text-xs text-gray-700 leading-relaxed font-medium">{activeResultCareer.growth.demand}</p>
                  </div>
                  <div className="bg-white/60 p-3 rounded-xl border border-emerald-200/40 space-y-1">
                    <strong className="text-[10px] text-emerald-900 font-mono uppercase block">{t('careerGrowthLabel')}</strong>
                    <p className="text-xs text-gray-700 leading-relaxed font-medium">{activeResultCareer.growth.careerGrowth}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-center pt-3">
            <button
              onClick={startQuiz}
              className="px-4 py-1.5 bg-white border border-emerald-300 text-[#3D405B] hover:bg-emerald-100 rounded-xl text-xs font-bold font-sans cursor-pointer transition-all"
            >
              {t('replayMatchmakerBtn')}
            </button>
            <button
              onClick={() => { stopSpeaking(); setResultCareer(null); }}
              className="px-4 py-1.5 bg-[#3D405B] hover:bg-[#2D2F44] text-white rounded-xl text-xs font-bold font-sans cursor-pointer transition-all"
            >
              {t('browseAllPathsBtn')}
            </button>
          </div>
        </div>
      ) : (
        /* MAIN CAREERS DIRECTORY */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          
          {/* List panel (Left) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs space-y-3">
            <h3 className="font-display font-extrabold text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
              {t('browseStreamsLabel')}
            </h3>
            <div className="space-y-2">
              {CAREERS.map(car => (
                <button
                  key={car.id}
                  onClick={() => setSelectedCareer(car)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedCareer?.id === car.id
                      ? 'border-[#81B29A] bg-[#81B29A]/15 font-bold text-gray-900 ring-1 ring-[#81B29A]'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <h4 className="text-xs sm:text-sm font-sans font-bold">{getTranslatedCareer(car, lang).title}</h4>
                    <p className="text-[10px] text-gray-400 font-sans font-medium leading-none mt-1">{getTranslatedCareer(car, lang).category}</p>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${selectedCareer?.id === car.id ? 'translate-x-1 text-[#81B29A]' : 'text-gray-350'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Details canvas panel (Right) */}
          <div className="lg:col-span-7">
            {activeCareer ? (
              <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-3xs space-y-5 animate-fade-in">
                
                <div className="border-b border-gray-100 pb-3 space-y-1">
                  <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-50 rounded p-1 px-1.5 uppercase max-w-max block">
                    {activeCareer.category}
                  </span>
                  <h3 className="font-display font-extrabold text-[#3D405B] text-base pt-1">
                    {activeCareer.title}
                  </h3>
                </div>

                <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-gray-400 block font-bold">{t('roleScopeLabel')}</span>
                    <p className="text-gray-655 font-sans font-medium">{activeCareer.desc}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-gray-400 block font-bold">{t('recommendedSubjectsLabel')}</span>
                    <p className="text-gray-800 font-semibold">{activeCareer.subjects}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-gray-400 block font-bold">{t('academicRoadmapLabel')}</span>
                    <div className="p-3 bg-[#FAF8F4] border border-[#F2CC8F]/30 rounded-xl font-bold text-[#E07A5F] flex items-start gap-1.5 shadow-3xs text-xs">
                      <GraduationCap className="h-4.5 w-4.5 text-[#E07A5F] shrink-0 mt-0.5" />
                      <span>{activeCareer.roadmap}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase text-gray-400 block font-bold">{t('scholarshipsInIndiaLabel')}</span>
                    <p className="text-emerald-700 font-extrabold bg-emerald-50 max-w-max p-1 px-2.5 rounded-sm border border-emerald-200">
                      {activeCareer.scholarship}
                    </p>
                    
                    {activeCareer.scholarshipsList && activeCareer.scholarshipsList.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 pt-1 text-left">
                        {activeCareer.scholarshipsList.map((scholarship, idx) => (
                          <div key={idx} className="bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/40 space-y-1">
                            <h5 className="font-sans font-bold text-xs text-emerald-900 flex items-center gap-1">
                              <span>🏅</span> {scholarship.name}
                            </h5>
                            <div className="flex flex-wrap gap-1.5 text-[10px] pt-0.5">
                              <span className="bg-emerald-100/50 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">
                                💰 {scholarship.amount}
                              </span>
                              <span className="bg-[#FAF8F4] text-amber-800 px-1.5 py-0.5 rounded border border-[#F2CC8F]/30 font-medium">
                                🎓 Eligibility: {scholarship.eligibility}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-650 pt-1 leading-relaxed">{scholarship.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedCareer.salary && (
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <span className="text-[10px] font-mono uppercase text-[#3D405B] font-black block flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                        Average Salary in India (Per Annum)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 text-left">
                          <span className="text-[9px] font-mono text-emerald-800 font-bold uppercase tracking-wider block">Beginner</span>
                          <span className="text-xs font-black text-[#3D405B] block mt-1">{selectedCareer.salary.beginner}</span>
                        </div>
                        <div className="bg-[#FAF8F4] p-3 rounded-xl border border-[#F2CC8F]/30 text-left">
                          <span className="text-[9px] font-mono text-amber-800 font-bold uppercase tracking-wider block">Mid-Level</span>
                          <span className="text-xs font-black text-[#3D405B] block mt-1">{selectedCareer.salary.midLevel}</span>
                        </div>
                        <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-200/30 text-left">
                          <span className="text-[9px] font-mono text-amber-700 font-bold uppercase tracking-wider block">Experienced</span>
                          <span className="text-xs font-black text-[#3D405B] block mt-1">{selectedCareer.salary.experienced}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCareer.skills && (
                    <div className="space-y-3 pt-3 border-t border-gray-100 text-left">
                      <span className="text-[10px] font-mono uppercase text-[#3D405B] font-black block flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5 text-emerald-700 animate-pulse" />
                        Technical & Soft Skills Required
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-[#FAF8F4] p-3.5 rounded-xl border border-[#F2CC8F]/30 space-y-2">
                          <span className="text-[9px] font-mono font-bold text-emerald-800 uppercase block flex items-center gap-1">
                            <Code className="h-3.5 w-3.5 text-emerald-600" />
                            Technical Skills
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCareer.skills.technical.map((sk, idx) => (
                              <span key={idx} className="bg-white text-emerald-850 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-3xs border border-emerald-100">
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100/40 space-y-2">
                          <span className="text-[9px] font-mono font-bold text-amber-800 uppercase block flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                            Soft Skills
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCareer.skills.soft.map((sk, idx) => (
                              <span key={idx} className="bg-white text-gray-750 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-3xs border border-[#F2CC8F]/20">
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCareer.growth && (
                    <div className="space-y-3 pt-3 border-t border-gray-100 text-left">
                      <span className="text-[10px] font-mono uppercase text-[#3D405B] font-black block flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                        Future Scope & Career Dynamics
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-[#FAF8F4] p-3.5 rounded-xl border border-[#F2CC8F]/30 space-y-1">
                          <span className="text-[9px] font-mono font-bold text-amber-800 uppercase block">Future Scope</span>
                          <p className="text-xs text-gray-750 font-medium leading-relaxed">{selectedCareer.growth.futureScope}</p>
                        </div>
                        <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100/40 space-y-1">
                          <span className="text-[9px] font-mono font-bold text-emerald-800 uppercase block">Job Opportunities</span>
                          <p className="text-xs text-gray-750 font-medium leading-relaxed">{selectedCareer.growth.jobOpportunities}</p>
                        </div>
                        <div className="bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/30 space-y-1">
                          <span className="text-[9px] font-mono font-bold text-amber-700 uppercase block">Market Demand in India</span>
                          <p className="text-xs text-gray-750 font-medium leading-relaxed">{selectedCareer.growth.demand}</p>
                        </div>
                        <div className="bg-teal-50/40 p-3.5 rounded-xl border border-teal-100/30 space-y-1">
                          <span className="text-[9px] font-mono font-bold text-teal-800 uppercase block">Career Growth Progression</span>
                          <p className="text-xs text-gray-755 font-semibold leading-relaxed">{selectedCareer.growth.careerGrowth}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCareer.exams && selectedCareer.exams.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                      <span className="text-[10px] font-mono uppercase text-amber-700 block font-black flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        Required Entrance Exams & Preparation Guides
                      </span>
                      <div className="space-y-3.5">
                        {selectedCareer.exams.map((ex, exIdx) => (
                          <div key={exIdx} className="bg-amber-50/40 rounded-xl p-3.5 border border-amber-200/40 space-y-2">
                            <h4 className="font-display font-extrabold text-xs text-[#3D405B]">
                              📝 {ex.name}
                            </h4>
                            <div className="text-xs space-y-1.5">
                              <p className="text-gray-650">
                                <strong className="text-gray-700">Eligibility Criteria:</strong> {ex.eligibility}
                              </p>
                              {ex.requiredSubjects && (
                                <p className="text-gray-650">
                                  <strong className="text-gray-700">Required Subjects:</strong> {ex.requiredSubjects}
                                </p>
                              )}
                              {ex.minQualifications && (
                                <p className="text-gray-650">
                                  <strong className="text-gray-700">Minimum Qualifications:</strong> {ex.minQualifications}
                                </p>
                              )}
                              {ex.ageLimit && (
                                <p className="text-gray-650">
                                  <strong className="text-gray-700">Age Limits:</strong> {ex.ageLimit}
                                </p>
                              )}
                              <p className="text-gray-650">
                                <strong className="text-gray-700">Prep Tips:</strong> {ex.tips}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center h-full flex flex-col justify-center items-center text-gray-400 space-y-2">
                <Compass className="h-10 w-10 text-gray-300 animate-spin" style={{ animationDuration: '6s' }} />
                <p className="font-sans text-xs font-semibold">Select a Career pathway from the list on the left to review its scholarship structure and academics roadmap.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
