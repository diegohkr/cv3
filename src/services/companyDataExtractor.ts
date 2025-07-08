// services/companyDataExtractor.ts
import { openai, JSON_CONFIG } from "./openaiClient";

export interface ExtractedCompanyData {
  nombre_cn: string;
  nombre_en: string;
  webs: string[];
  dominios: string[];
  marcas: string[];
  productos: string[];
  telefono: string;
  email: string;
  ubicacion: string;
  industria: string;
  confidence: number;
}

export async function extractCompanyData(base64Img: string): Promise<ExtractedCompanyData> {
  console.log('🔍 Extrayendo datos de empresa con GPT-4o Vision...');

  try {
    const completion = await openai.chat.completions.create({
      ...JSON_CONFIG,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "image_url", 
              image_url: { 
                url: `data:image/png;base64,${base64Img}`,
                detail: "high"  // Máxima calidad de análisis
              }
            },
            {
              type: "text",
              text: `
                Analiza esta imagen/documento y extrae toda la información de empresa china disponible.
                
                Devuelve JSON con esta estructura exacta:
                {
                  "nombre_cn": "nombre en chino",
                  "nombre_en": "nombre en inglés",
                  "webs": ["array de websites"],
                  "dominios": ["array de dominios web"],
                  "marcas": ["array de marcas/brands"],
                  "productos": ["array de productos/servicios"],
                  "telefono": "número de teléfono",
                  "email": "dirección de email",
                  "ubicacion": "ubicación/dirección",
                  "industria": "sector industrial",
                  "confidence": "confianza 0-100 en la extracción"
                }

                INSTRUCCIONES ESPECÍFICAS:
                - Buscar caracteres chinos, números de teléfono, emails
                - Identificar nombres de empresas (Co. Ltd., 有限公司, etc.)
                - Extraer URLs, dominios web
                - Detectar productos/servicios mencionados
                - Encontrar información de contacto
                - Si hay logos o marcas, mencionarlos
                - Ubicaciones en China (provincias, ciudades)
                - Códigos sociales de crédito si están presentes
                
                Si no encuentras información específica, usar null o array vacío.
              `
            }
          ]
        }
      ]
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    
    // Validación y normalización
    const extractedData: ExtractedCompanyData = {
      nombre_cn: result.nombre_cn || '',
      nombre_en: result.nombre_en || '',
      webs: Array.isArray(result.webs) ? result.webs : [],
      dominios: Array.isArray(result.dominios) ? result.dominios : [],
      marcas: Array.isArray(result.marcas) ? result.marcas : [],
      productos: Array.isArray(result.productos) ? result.productos : [],
      telefono: result.telefono || '',
      email: result.email || '',
      ubicacion: result.ubicacion || '',
      industria: result.industria || '',
      confidence: Math.max(0, Math.min(100, result.confidence || 50))
    };

    console.log('✅ Datos extraídos:', extractedData);
    return extractedData;

  } catch (error) {
    console.error('❌ Error en extracción de datos:', error);
    
    // Fallback data
    return {
      nombre_cn: '',
      nombre_en: '',
      webs: [],
      dominios: [],
      marcas: [],
      productos: [],
      telefono: '',
      email: '',
      ubicacion: '',
      industria: '',
      confidence: 0
    };
  }
}

export async function analyzeDocumentText(text: string): Promise<ExtractedCompanyData> {
  console.log('📄 Analizando texto de documento con GPT-4o...');

  try {
    const completion = await openai.chat.completions.create({
      ...JSON_CONFIG,
      messages: [
        {
          role: "system",
          content: `
            Eres un experto en análisis de documentos empresariales chinos.
            Extrae toda la información de empresa del texto proporcionado.
            
            Devuelve JSON con estructura exacta:
            {
              "nombre_cn": "nombre en chino",
              "nombre_en": "nombre en inglés", 
              "webs": ["websites"],
              "dominios": ["dominios"],
              "marcas": ["marcas"],
              "productos": ["productos/servicios"],
              "telefono": "teléfono",
              "email": "email",
              "ubicacion": "ubicación",
              "industria": "industria",
              "confidence": "confianza 0-100"
            }
          `
        },
        {
          role: "user",
          content: `Analiza este texto y extrae información de empresa:\n\n${text}`
        }
      ]
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    
    return {
      nombre_cn: result.nombre_cn || '',
      nombre_en: result.nombre_en || '',
      webs: Array.isArray(result.webs) ? result.webs : [],
      dominios: Array.isArray(result.dominios) ? result.dominios : [],
      marcas: Array.isArray(result.marcas) ? result.marcas : [],
      productos: Array.isArray(result.productos) ? result.productos : [],
      telefono: result.telefono || '',
      email: result.email || '',
      ubicacion: result.ubicacion || '',
      industria: result.industria || '',
      confidence: Math.max(0, Math.min(100, result.confidence || 60))
    };

  } catch (error) {
    console.error('❌ Error analizando texto:', error);
    
    return {
      nombre_cn: '',
      nombre_en: '',
      webs: [],
      dominios: [],
      marcas: [],
      productos: [],
      telefono: '',
      email: '',
      ubicacion: '',
      industria: '',
      confidence: 0
    };
  }
}