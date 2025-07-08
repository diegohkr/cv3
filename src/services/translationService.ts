// Servicio de traducción con ChatGPT-4o para China Verifier
interface ChatGPTMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatGPTResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface TranslationRequest {
  text: string;
  direction: 'es-to-zh' | 'zh-to-es';
}

class TranslationService {
  private apiKey: string;
  private baseURL: string = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    // Usando la misma API key configurada para el sistema
    this.apiKey = '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';
  }

  async translateText({ text, direction }: TranslationRequest): Promise<string> {
    try {
      if (!text.trim()) {
        throw new Error('Texto vacío para traducir');
      }

      console.log(`Traduciendo (${direction}):`, text);

      // Configurar prompt según la dirección de traducción
      const systemPrompt = this.getSystemPrompt(direction);
      const userPrompt = this.getUserPrompt(text, direction);

      const messages: ChatGPTMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: messages,
          max_tokens: 1000,
          temperature: 0.3, // Baja temperatura para traducciones más precisas
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error de ChatGPT API:', response.status, errorText);
        
        if (response.status === 401) {
          throw new Error('Error de autenticación con el servicio de traducción');
        } else if (response.status === 429) {
          throw new Error('Límite de uso excedido. Intenta más tarde');
        } else if (response.status === 500) {
          throw new Error('Error interno del servicio. Intenta más tarde');
        }
        
        throw new Error(`Error de traducción: ${response.status}`);
      }

      const data: ChatGPTResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('Respuesta inválida del servicio de traducción');
      }

      const translation = data.choices[0].message.content.trim();
      
      if (!translation) {
        throw new Error('Traducción vacía recibida');
      }

      console.log('Traducción exitosa:', translation);
      return translation;

    } catch (error) {
      console.error('Error en servicio de traducción:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Error desconocido en la traducción');
    }
  }

  private getSystemPrompt(direction: 'es-to-zh' | 'zh-to-es'): string {
    if (direction === 'es-to-zh') {
      return `Eres un traductor profesional especializado en traducir del español al chino simplificado.

INSTRUCCIONES IMPORTANTES:
- Traduce ÚNICAMENTE el texto proporcionado, sin agregar explicaciones
- Usa chino simplificado (no tradicional)
- Mantén el tono y registro del texto original
- Si hay expresiones coloquiales, encuentra equivalentes naturales en chino
- Para términos de negocios, usa vocabulario comercial apropiado
- NO incluyas romanización pinyin a menos que se solicite
- Devuelve SOLO la traducción en chino

CONTEXTO: Esta traducción es para comunicación empresarial entre España y China.`;
    } else {
      return `Eres un traductor profesional especializado en traducir del chino (simplificado y tradicional) al español.

INSTRUCCIONES IMPORTANTES:
- Traduce ÚNICAMENTE el texto proporcionado, sin agregar explicaciones
- Acepta tanto chino simplificado como tradicional
- Mantén el tono y registro del texto original
- Si hay expresiones idiomáticas chinas, encuentra equivalentes naturales en español
- Para términos de negocios, usa vocabulario comercial apropiado en español
- Usa español neutral (comprensible en toda Latinoamérica y España)
- Devuelve SOLO la traducción en español

CONTEXTO: Esta traducción es para comunicación empresarial entre China y países de habla hispana.`;
    }
  }

  private getUserPrompt(text: string, direction: 'es-to-zh' | 'zh-to-es'): string {
    if (direction === 'es-to-zh') {
      return `Traduce este texto del español al chino simplificado:

"${text}"`;
    } else {
      return `Traduce este texto del chino al español:

"${text}"`;
    }
  }

  // Función para validar si un texto necesita traducción
  static needsTranslation(text: string, direction: 'es-to-zh' | 'zh-to-es'): boolean {
    if (!text.trim()) return false;
    
    // Verificaciones básicas para evitar traducciones innecesarias
    if (direction === 'es-to-zh') {
      // Si el texto ya contiene principalmente caracteres chinos, no traducir
      const chineseChars = text.match(/[\u4e00-\u9fff]/g);
      return !chineseChars || chineseChars.length < text.length * 0.5;
    } else {
      // Si el texto ya está principalmente en español/latino, no traducir
      const latinChars = text.match(/[a-zA-ZñáéíóúüÑÁÉÍÓÚÜ]/g);
      return !latinChars || latinChars.length < text.length * 0.5;
    }
  }

  // Función para detectar idioma del texto
  static detectLanguage(text: string): 'spanish' | 'chinese' | 'unknown' {
    if (!text.trim()) return 'unknown';
    
    const chineseChars = text.match(/[\u4e00-\u9fff]/g);
    const latinChars = text.match(/[a-zA-ZñáéíóúüÑÁÉÍÓÚÜ]/g);
    
    const chineseRatio = chineseChars ? chineseChars.length / text.length : 0;
    const latinRatio = latinChars ? latinChars.length / text.length : 0;
    
    if (chineseRatio > 0.3) return 'chinese';
    if (latinRatio > 0.3) return 'spanish';
    return 'unknown';
  }
}

export default TranslationService;
