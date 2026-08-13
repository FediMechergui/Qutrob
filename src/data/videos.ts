// Single registry for all reward/archive videos.
// Adding a new video here makes it available in both the reward flow and the archive.

export interface RewardVideo {
  id: string;
  filename: string;
  title: string;
  description: string;
  source: number; // static require() asset reference
}

export const REWARD_VIDEOS: RewardVideo[] = [
  {
    id: "1",
    filename: "(اتفاق اللفظ و اختلاف المعنى (ضرب_20251211_235337_0000.mp4",
    title: "اتفاق اللفظ واختلاف المعنى",
    description: "فيديو تعليمي عن اتفاق اللفظ واختلاف المعنى في اللغة العربية",
    source: require("../../assets/(اتفاق اللفظ و اختلاف المعنى (ضرب_20251211_235337_0000.mp4"),
  },
  {
    id: "2",
    filename: "في محاسن العين _20251212_175057_0000.mp4",
    title: "في محاسن العين",
    description: "فيديو تعليمي عن محاسن العين في الشعر العربي",
    source: require("../../assets/في محاسن العين _20251212_175057_0000.mp4"),
  },
];

// Points awarded for completing a reward video
export const VIDEO_REWARD_POINTS = 100;
