/** Tithi — lunar day (1-30) */
export type TithiNumber = number; // 1-30

/** Tithi names in sequence */
export const TITHI_NAMES = [
  "प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पञ्चमी",
  "षष्ठी", "सप्तमी", "अष्टमी", "नवमी", "दशमी",
  "एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी", "पूर्णिमा",
  "प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पञ्चमी",
  "षष्ठी", "सप्तमी", "अष्टमी", "नवमी", "दशमी",
  "एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी", "अमावस्या",
] as const;

export const TITHI_NAMES_EN = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
  "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
  "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima",
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
  "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
  "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Amavasya",
] as const;

/** Paksha — lunar fortnight */
export type Paksha = "shukla" | "krishna";

export const PAKSHA_NAMES = {
  shukla: { hi: "शुक्ल पक्ष", en: "Shukla Paksha" },
  krishna: { hi: "कृष्ण पक्ष", en: "Krishna Paksha" },
} as const;

/** Nakshatra — lunar mansion (1-27) */
export const NAKSHATRA_NAMES = [
  "अश्विनी", "भरणी", "कृत्तिका", "रोहिणी", "मृगशिरा",
  "आर्द्रा", "पुनर्वसु", "पुष्य", "आश्लेषा", "मघा",
  "पूर्वा फाल्गुनी", "उत्तरा फाल्गुनी", "हस्त", "चित्रा", "स्वाति",
  "विशाखा", "अनुराधा", "ज्येष्ठा", "मूल", "पूर्वाषाढा",
  "उत्तराषाढा", "श्रवण", "धनिष्ठा", "शतभिषा", "पूर्वा भाद्रपद",
  "उत्तरा भाद्रपद", "रेवती",
] as const;

export const NAKSHATRA_NAMES_EN = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira",
  "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha",
  "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati",
  "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
  "Uttara Ashadha", "Shravana", "Dhanishtha", "Shatabhisha", "Purva Bhadrapada",
  "Uttara Bhadrapada", "Revati",
] as const;

/** Hindu lunar month (Purnimant system) */
export const MASA_NAMES = [
  "चैत्र", "वैशाख", "ज्येष्ठ", "आषाढ", "श्रावण",
  "भाद्रपद", "आश्विन", "कार्तिक", "मार्गशीर्ष", "पौष",
  "माघ", "फाल्गुन",
] as const;

export const MASA_NAMES_EN = [
  "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana",
  "Bhadrapada", "Ashwina", "Kartika", "Margashirsha", "Pausha",
  "Magha", "Phalguna",
] as const;

/** Vara — day of the week */
export const VARA_NAMES = [
  "रविवार", "सोमवार", "मंगलवार", "बुधवार",
  "गुरुवार", "शुक्रवार", "शनिवार",
] as const;

export const VARA_NAMES_EN = [
  "Ravivara", "Somavara", "Mangalavara", "Budhavara",
  "Guruvara", "Shukravara", "Shanivara",
] as const;

/** Rashi — zodiac sign for masa determination */
export const RASHI_NAMES = [
  "मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या",
  "तुला", "वृश्चिक", "धनु", "मकर", "कुम्भ", "मीन",
] as const;

export const RASHI_NAMES_EN = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
] as const;

/** Complete Panchang data for a given day */
export interface PanchangData {
  tithi: TithiNumber;
  tithiName: string;
  tithiNameEn: string;
  paksha: Paksha;
  pakshaName: string;
  pakshaNameEn: string;
  nakshatra: number;
  nakshatraName: string;
  nakshatraNameEn: string;
  masa: number;
  masaName: string;
  masaNameEn: string;
  vara: number;
  varaName: string;
  varaNameEn: string;
  rashi: number;
  rashiName: string;
  rashiNameEn: string;
  sunLongitude: number;
  moonLongitude: number;
  isAdhik: boolean;
}
