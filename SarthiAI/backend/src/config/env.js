import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  groq: {
    apiKey: process.env.GROQ_API_KEY,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  unsplash: {
    accessKey: process.env.UNSPLASH_ACCESS_KEY,
  },
  openweather: {
    apiKey: process.env.OPENWEATHER_API_KEY,
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
  },
};
