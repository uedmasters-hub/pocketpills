const HOW_CDN = "https://static.pocketpills.com/acq-web/redesign/home";

export type HowItWorksStep = {
  n: number;
  title: string;
  lead: string;
  body: string;
  listTitle: string;
  items: string[];
  secondary?: { listTitle: string; items: string[] };
  img: string;
  imgAlt: string;
  video: string;
  poster: string;
};

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    n: 1,
    title: "Create your account",
    lead: "Minutes — not a trip to the city.",
    body: "Set up your profile and add family. We’ll remember your district so we can show consultants and facilities you can actually reach.",
    listTitle: "What you can do",
    items: [
      "Set up your own profile in Nepali or English",
      "Add family members and manage their care from one account",
      "Save your district so nearby care is easier to find",
    ],
    img: "/img/how/card1-welcome.png",
    imgAlt: "Create a Pocketpills account from home",
    video: `${HOW_CDN}/videos/step1.webm`,
    poster: `${HOW_CDN}/posterStep1.webp`,
  },
  {
    n: 2,
    title: "Choose the care you need",
    lead: "Search, or start with what you already know.",
    body: "Doctor, hospital, clinic, pharmacy, ambulance, or home care — pick the path. If you are unsure, book a consultant. You do not have to decide everything up front.",
    listTitle: "Start with",
    items: [
      "A doctor or specialist consult from home",
      "A hospital, clinic, or pharmacy nearby",
      "Ambulance, home care, or urgent help on the ground",
    ],
    img: "/img/how/card2-experts.png",
    imgAlt: "Choose a consultant or nearby facility",
    video: `${HOW_CDN}/videos/step2.webm`,
    poster: `${HOW_CDN}/posterStep2.webp`,
  },
  {
    n: 3,
    title: "Meet a licensed provider",
    lead: "The right consultant — from where you live.",
    body: "Meet online when it is safe. You see who you are booking before you confirm. Travel stays for emergencies and procedures that cannot happen on a screen.",
    listTitle: "Doctors can",
    items: [
      "Diagnose, advise, and prescribe when appropriate",
      "Renew medicines and plan follow-up from home",
      "Refer you to a specialist or a facility if you must go in",
    ],
    secondary: {
      listTitle: "Pharmacists can",
      items: [
        "Fill or transfer a prescription",
        "Answer questions about your medicines",
        "Help you get the right dose without a wasted trip",
      ],
    },
    img: "/img/how/card2-call.png",
    imgAlt: "Talk to a licensed Pocketpills care provider",
    video: `${HOW_CDN}/videos/step2.webm`,
    poster: `${HOW_CDN}/posterStep2.webp`,
  },
  {
    n: 4,
    title: "Stay home, or go in",
    lead: "Finish the care without a wasted journey.",
    body: "If you need medicine, fill or transfer with a pharmacy. If you need a ward, a lab, or a theatre, we help you find the right facility. Follow-ups can stay at home.",
    listTitle: "What happens next",
    items: [
      "Pharmacy fill, transfer, and delivery where available",
      "A nearby hospital or clinic when care must be in person",
      "Follow-ups from home so you are not travelling for a conversation",
    ],
    img: "/img/how/card3-manage.png",
    imgAlt: "Manage care, medicines, and follow-up from home",
    video: `${HOW_CDN}/videos/step3.webm`,
    poster: `${HOW_CDN}/posterStep3.webp`,
  },
];

export const HOW_IT_WORKS_WHY = [
  {
    title: "Licensed care",
    detail: "Doctors, pharmacists, and facilities in Nepal — you see who you book.",
    imageUrl: "/img/how/why-licensed.png",
  },
  {
    title: "Stay home when it’s safe",
    detail: "Consults and follow-ups without a bus to the city.",
    imageUrl: "/img/how/why-home.png",
  },
  {
    title: "Travel only when you must",
    detail: "Emergencies and in-person procedures still happen in person.",
    imageUrl: "/img/how/why-travel.png",
  },
] as const;

export const HOW_IT_WORKS_HERO_VIDEO = `${HOW_CDN}/videos/step1.webm`;
export const HOW_IT_WORKS_HERO_POSTER = `${HOW_CDN}/posterStep1.webp`;
