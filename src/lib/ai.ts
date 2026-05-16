import Groq from "groq-sdk";

export function getClient(): Groq {
  return new Groq({ apiKey: process.env.GROQ_API_KEY! });
}
