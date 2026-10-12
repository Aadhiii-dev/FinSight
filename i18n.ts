import { useStore } from "./store";

export type Lang = "en" | "hi" | "ta";

const dict = {
  home: { en: "Home", hi: "होम", ta: "முகப்பு" },
  dashboard: { en: "Dashboard", hi: "डैशबोर्ड", ta: "டாஷ்போர்டு" },
  planner: { en: "Emergency Planner", hi: "आपातकालीन योजना", ta: "அவசர திட்டம்" },
  stress: { en: "Stress Test", hi: "तनाव परीक्षण", ta: "அழுத்த சோதனை" },
  compliance: { en: "Compliance & Privacy", hi: "अनुपालन और गोपनीयता", ta: "இணக்கம் & தனியுரிமை" },
  heroTitle: {
    en: "Know exactly how much to save, so an emergency never becomes a crisis.",
    hi: "जानिए हर महीने कितना बचाना है, ताकि आपातकाल संकट न बने।",
    ta: "அவசரநிலை நெருக்கடியாக மாறாமல் இருக்க, எவ்வளவு சேமிக்க வேண்டும் என்பதை அறியுங்கள்.",
  },
  heroSub: {
    en: "Finsight studies your past income and spending, then builds your personal emergency fund plan.",
    hi: "Finsight आपकी पिछली आय और खर्च को समझकर आपकी आपातकालीन निधि योजना बनाता है।",
    ta: "Finsight உங்கள் கடந்த வருமானம் மற்றும் செலவுகளை ஆய்வு செய்து அவசர நிதி திட்டத்தை உருவாக்குகிறது.",
  },
  loadDemo: { en: "Load demo data", hi: "डेमो डेटा लोड करें", ta: "டெமோ தரவை ஏற்று" },
  uploadCsv: { en: "Upload CSV", hi: "CSV अपलोड करें", ta: "CSV பதிவேற்று" },
  manual: { en: "Enter manually", hi: "स्वयं दर्ज करें", ta: "கைமுறையாக உள்ளிடு" },
  yourDetails: { en: "Your details", hi: "आपका विवरण", ta: "உங்கள் விவரங்கள்" },
  savings: { en: "Current savings", hi: "वर्तमान बचत", ta: "தற்போதைய சேமிப்பு" },
  insurance: { en: "Health insurance cover", hi: "स्वास्थ्य बीमा कवर", ta: "சுகாதார காப்பீடு" },
  dependents: { en: "Dependents", hi: "आश्रित", ta: "சார்ந்தவர்கள்" },
  cityTier: { en: "City tier", hi: "शहर श्रेणी", ta: "நகர வகை" },
  incomeType: { en: "Income type", hi: "आय का प्रकार", ta: "வருமான வகை" },
  consent: {
    en: "I have read the Privacy Notice. I consent to Finsight processing the financial details I enter, only in my browser and only to predict my financial projections.",
    hi: "मैंने गोपनीयता सूचना पढ़ ली है। मैं सहमति देता/देती हूँ कि Finsight मेरे द्वारा दर्ज वित्तीय विवरण केवल मेरे ब्राउज़र में और केवल मेरे वित्तीय पूर्वानुमान के लिए संसाधित करे।",
    ta: "நான் தனியுரிமை அறிவிப்பைப் படித்தேன். நான் உள்ளிடும் நிதி விவரங்களை Finsight எனது உலாவியில் மட்டும், எனது நிதி முன்னறிவிப்புக்காக மட்டும் செயலாக்க ஒப்புக்கொள்கிறேன்.",
  },
  consentGate: {
    en: "Tick the consent box above to start adding your data.",
    hi: "अपना डेटा जोड़ना शुरू करने के लिए ऊपर सहमति बॉक्स पर निशान लगाएँ।",
    ta: "உங்கள் தரவைச் சேர்க்கத் தொடங்க மேலே உள்ள ஒப்புதல் பெட்டியைத் தேர்ந்தெடுக்கவும்.",
  },
  privacyTitle: { en: "Privacy Notice", hi: "गोपनीयता सूचना", ta: "தனியுரிமை அறிவிப்பு" },
  privacyIntro: {
    en: "Please read this before entering any data:",
    hi: "डेटा दर्ज करने से पहले कृपया इसे पढ़ें:",
    ta: "தரவை உள்ளிடுவதற்கு முன் தயவுசெய்து இதைப் படிக்கவும்:",
  },
  pn1: {
    en: "What we collect: only the income, spending, savings, insurance, dependents and city tier that you type in yourself.",
    hi: "हम क्या एकत्र करते हैं: केवल वही आय, खर्च, बचत, बीमा, आश्रितों और शहर श्रेणी का विवरण जो आप स्वयं दर्ज करते हैं।",
    ta: "நாங்கள் சேகரிப்பவை: நீங்களே உள்ளிடும் வருமானம், செலவு, சேமிப்பு, காப்பீடு, சார்ந்தவர்கள், நகர வகை விவரங்கள் மட்டுமே.",
  },
  pn2: {
    en: "Why: your data is used solely for predicting your financial projections and emergency-fund plan. Never for advertising, profiling or sale.",
    hi: "उद्देश्य: आपके डेटा का उपयोग केवल आपके वित्तीय पूर्वानुमान और आपातकालीन निधि योजना बनाने के लिए होता है। विज्ञापन, प्रोफ़ाइलिंग या बिक्री के लिए कभी नहीं।",
    ta: "நோக்கம்: உங்கள் தரவு உங்கள் நிதி முன்னறிவிப்பு மற்றும் அவசர நிதி திட்டத்தை உருவாக்க மட்டுமே பயன்படுத்தப்படும். விளம்பரம், சுயவிவரப் பகுப்பாய்வு அல்லது விற்பனைக்காக ஒருபோதும் இல்லை.",
  },
  pn3: {
    en: "Where it stays: only in this browser. No account, no server, no analytics or advertising trackers. Nothing is shared with anyone.",
    hi: "डेटा कहाँ रहता है: केवल इसी ब्राउज़र में। कोई खाता नहीं, कोई सर्वर नहीं, कोई विश्लेषण या विज्ञापन ट्रैकर नहीं। कुछ भी किसी के साथ साझा नहीं किया जाता।",
    ta: "தரவு எங்கே இருக்கும்: இந்த உலாவியில் மட்டும். கணக்கு இல்லை, சர்வர் இல்லை, பகுப்பாய்வு அல்லது விளம்பர டிராக்கர்கள் இல்லை. எதுவும் யாருடனும் பகிரப்படாது.",
  },
  pn4: {
    en: "How long: until you delete it, withdraw consent, or clear your browser data.",
    hi: "कितने समय तक: जब तक आप इसे हटा न दें, सहमति वापस न लें या ब्राउज़र डेटा साफ़ न करें।",
    ta: "எவ்வளவு காலம்: நீங்கள் நீக்கும் வரை, ஒப்புதலைத் திரும்பப் பெறும் வரை அல்லது உலாவித் தரவை அழிக்கும் வரை.",
  },
  pn5: {
    en: "Your control: press \"Delete all my data\" at any time. Un-ticking the consent box also erases your data immediately.",
    hi: "आपका नियंत्रण: आप कभी भी \"मेरा सारा डेटा हटाएँ\" दबा सकते हैं। सहमति का निशान हटाने पर आपका डेटा तुरंत मिट जाता है।",
    ta: "உங்கள் கட்டுப்பாடு: எப்போது வேண்டுமானாலும் \"என் தரவை நீக்கு\" அழுத்தலாம். ஒப்புதல் குறியை நீக்கினால் உங்கள் தரவு உடனே அழிக்கப்படும்.",
  },
  privacyLink: { en: "Privacy Notice", hi: "गोपनीयता सूचना", ta: "தனியுரிமை அறிவிப்பு" },
  a11yLink: { en: "Accessibility", hi: "सुगम्यता", ta: "அணுகல்தன்மை" },
  analyse: { en: "Analyse my finances", hi: "मेरे वित्त का विश्लेषण करें", ta: "என் நிதியை ஆய்வு செய்" },
  deleteAll: { en: "Delete all my data", hi: "मेरा सारा डेटा हटाएँ", ta: "என் தரவை நீக்கு" },
  avgIncome: { en: "Avg. monthly income", hi: "औसत मासिक आय", ta: "சராசரி மாத வருமானம்" },
  avgExpenses: { en: "Avg. monthly expenses", hi: "औसत मासिक खर्च", ta: "சராசரி மாத செலவு" },
  avgSavings: { en: "Avg. monthly savings", hi: "औसत मासिक बचत", ta: "சராசரி மாத சேமிப்பு" },
  savingsRate: { en: "Savings rate", hi: "बचत दर", ta: "சேமிப்பு விகிதம்" },
  stability: { en: "Income stability", hi: "आय स्थिरता", ta: "வருமான நிலைத்தன்மை" },
  readiness: { en: "Emergency Readiness Score", hi: "आपातकालीन तैयारी स्कोर", ta: "அவசர தயார்நிலை மதிப்பெண்" },
  disclaimer: {
    en: "Finsight gives estimates based on your inputs and stated assumptions. It is not financial advice.",
    hi: "Finsight आपके इनपुट और बताई गई मान्यताओं के आधार पर अनुमान देता है। यह वित्तीय सलाह नहीं है।",
    ta: "Finsight உங்கள் உள்ளீடுகள் மற்றும் அனுமானங்களின் அடிப்படையில் மதிப்பீடுகளை வழங்குகிறது. இது நிதி ஆலோசனை அல்ல.",
  },
  localOnly: {
    en: "No login. No servers. Your data never leaves this browser.",
    hi: "कोई लॉगिन नहीं। कोई सर्वर नहीं। आपका डेटा इस ब्राउज़र से बाहर नहीं जाता।",
    ta: "உள்நுழைவு இல்லை. சர்வர் இல்லை. உங்கள் தரவு இந்த உலாவியை விட்டு வெளியேறாது.",
  },
} as const;

export type TKey = keyof typeof dict;

export function useT() {
  const { lang } = useStore();
  return (k: TKey) => dict[k][lang];
}
