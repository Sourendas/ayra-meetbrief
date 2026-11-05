import type { FindingCategory } from "./types";

const HIRE = /\b(appoint(?:ed|s)?|hir(?:e|es|ed|ing)|joins|joined|named|names|chief|ceo|cto|cfo|cmo|coo|vp of|head of|president)\b/i;
const LAUNCH = /\b(launch(?:ed|es|ing)?|unveil(?:s|ed)?|releas(?:e|ed|es|ing)|debut(?:s|ed)?|introduc(?:e|es|ed)|rolls out|rolled out)\b/i;
const FUNDING = /\b(funding|raises|raised|series\s+[a-e]|seed round|investment|invests|acquires|acquisition|valuation)\b/i;

export function classify(title: string, content: string): FindingCategory {
  const text = `${title} ${content}`;
  if (HIRE.test(text)) return "hire";
  if (LAUNCH.test(text)) return "launch";
  if (FUNDING.test(text)) return "funding";
  if (title.trim() || content.trim()) return "news";
  return "other";
}

export const CATEGORY_LABEL: Record<FindingCategory, string> = {
  launch: "Launches",
  hire: "Hires and leadership",
  funding: "Funding and deals",
  news: "News",
  other: "Other updates",
};

export const CATEGORY_ORDER: FindingCategory[] = ["launch", "hire", "funding", "news", "other"];
