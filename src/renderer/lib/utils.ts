import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function replaceDoubleQuotesWithSingleQuotes(
  jsonString: string
): string {
  return jsonString.replace(/"/g, "'");
}

export function extractText(data: string): string {
  // const regex = /(?<=```json)(.*)(?=```)/;
  // const match = data.match(regex);

  console.log(data.split("```"));
  const match = data.split("```")[1].replace("json", "");

  // If both start and end indices are found, extract the text block
  if (match) {
    return match;
  } else {
    // If text block is not found, return an empty string
    return "Not found.";
  }
}
