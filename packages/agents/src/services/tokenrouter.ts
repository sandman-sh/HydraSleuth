import OpenAI from "openai";
// @ts-expect-error - dotenv types don't resolve properly with this tsconfig moduleResolution
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env.local") });

export const tokenrouter = new OpenAI({
  apiKey: process.env.TOKENROUTER_API_KEY,
  baseURL: "https://api.tokenrouter.com/v1",
});

export function extractJson(content: string | undefined | null): any {
  if (!content) return {};
  try {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      return JSON.parse(match[1].trim());
    }
    return JSON.parse(content.trim());
  } catch (e) {
    console.error("Failed to parse JSON from AI response:", e);
    return {};
  }
}
