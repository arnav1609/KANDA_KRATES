export type Lang = "en" | "hi" | "mr" | "ta" | "kn" | "bn";

export function getSellMessage(
  ohi: number,
  batch: string,
  lang: Lang
) {
  const messages: Record<Lang, string> = {
    en: `⚠️ Sell ${batch} now. Onion quality is dropping.`,
    hi: `⚠️ ${batch} तुरंत बेचें। प्याज की गुणवत्ता गिर रही है।`,
    mr: `⚠️ ${batch} त्वरित विक्री करा. कांद्याची गुणवत्ता घसरत आहे.`,
    ta: `⚠️ ${batch} உடனே விற்கவும். வெங்காய தரம் குறைகிறது.`,
    kn: `⚠️ ${batch} ತಕ್ಷಣ ಮಾರಾಟ ಮಾಡಿ. ಈರುಳ್ಳಿ ಗುಣಮಟ್ಟ ಕಡಿಮೆಯಾಗುತ್ತಿದೆ.`,
    bn: `⚠️ ${batch} এখনই বিক্রি করুন। পেঁয়াজের গুণমান কমছে।`
  };

  return messages[lang];
}
