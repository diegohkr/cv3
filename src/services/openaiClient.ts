// services/openaiClient.ts
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: "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",  // clave secreta proporcionada
  // organization: process.env.OPENAI_ORG_ID       // si usas org
});

// Configuración por defecto para máxima calidad
export const GPT4_CONFIG = {
  model: "gpt-4o",  // Usando el modelo más reciente disponible
  temperature: 0.2,  // + precisión / – alucinación
  max_tokens: 2000,
  top_p: 0.95
};

// Para respuestas JSON estructuradas
export const JSON_CONFIG = {
  ...GPT4_CONFIG,
  response_format: { type: "json_object" as const },
  temperature: 0.1  // Máxima estabilidad para JSON
};