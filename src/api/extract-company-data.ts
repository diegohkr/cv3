// API para extraer datos de empresas usando OpenAI Vision API

interface CompanyExtractedData {
  chineseName?: string;
  englishName?: string;
  website?: string;
  domains?: string[];
  brands?: string[];
  contact?: string;
  email?: string;
  address?: string;
  products?: string[];
  rawText?: string;
}

export async function extractCompanyDataFromDocument(
  fileType: string,
  base64Data: string,
  fileName: string
): Promise<CompanyExtractedData> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o", // Modelo con capacidades de visión
        messages: [
          {
            role: "system",
            content: `Eres un especialista en extracción de datos de empresas chinas. Tu tarea es analizar imágenes o documentos que contengan información empresarial y extraer datos específicos.

INSTRUCCIONES:
1. Analiza cuidadosamente el documento/imagen proporcionado
2. Extrae SOLO la información que puedas ver claramente
3. Busca especialmente:
   - Nombres de empresas en chino e inglés
   - Sitios web y dominios
   - Marcas comerciales
   - Información de contacto (teléfonos, emails)
   - Direcciones
   - Productos o servicios mencionados

4. Responde ÚNICAMENTE en formato JSON válido con esta estructura:
{
  "chineseName": "nombre en caracteres chinos si está presente",
  "englishName": "nombre en inglés si está presente", 
  "website": "sitio web principal si está presente",
  "domains": ["dominios web adicionales"],
  "brands": ["marcas comerciales detectadas"],
  "contact": "número de teléfono principal",
  "email": "email principal",
  "address": "dirección física si está presente",
  "products": ["productos o servicios mencionados"],
  "rawText": "todo el texto extraído del documento"
}

5. Si no encuentras algún dato, omite el campo o usa null
6. NO inventes información que no esté visible
7. Prioriza precisión sobre completitud`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Por favor, analiza este documento empresarial (${fileName}) y extrae todos los datos de empresa que puedas encontrar. Responde solo con el JSON solicitado.`
              },
              ...(fileType.startsWith('image/') ? [{
                type: "image_url",
                image_url: {
                  url: base64Data,
                  detail: "high"
                }
              }] : [])
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No se recibió respuesta de OpenAI');
    }

    // Limpiar y parsear el JSON
    let cleanedContent = content.trim();
    
    // Remover cualquier texto antes o después del JSON
    const jsonStart = cleanedContent.indexOf('{');
    const jsonEnd = cleanedContent.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
    }

    try {
      const extractedData: CompanyExtractedData = JSON.parse(cleanedContent);
      
      // Validar y limpiar los datos extraídos
      const cleanedData: CompanyExtractedData = {
        chineseName: extractedData.chineseName?.trim() || undefined,
        englishName: extractedData.englishName?.trim() || undefined,
        website: extractedData.website?.trim() || undefined,
        domains: Array.isArray(extractedData.domains) ? 
          extractedData.domains.filter(d => d?.trim()).map(d => d.trim()) : undefined,
        brands: Array.isArray(extractedData.brands) ? 
          extractedData.brands.filter(b => b?.trim()).map(b => b.trim()) : undefined,
        contact: extractedData.contact?.trim() || undefined,
        email: extractedData.email?.trim() || undefined,
        address: extractedData.address?.trim() || undefined,
        products: Array.isArray(extractedData.products) ? 
          extractedData.products.filter(p => p?.trim()).map(p => p.trim()) : undefined,
        rawText: extractedData.rawText?.trim() || undefined
      };

      // Remover campos undefined
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key as keyof CompanyExtractedData] === undefined) {
          delete cleanedData[key as keyof CompanyExtractedData];
        }
      });

      return cleanedData;

    } catch (parseError) {
      console.error('Error parsing JSON from OpenAI:', parseError);
      console.error('Raw content:', content);
      
      // Fallback: intentar extraer información básica del texto
      return {
        rawText: content,
        englishName: extractNameFromText(content, 'english'),
        chineseName: extractNameFromText(content, 'chinese'),
        website: extractWebsiteFromText(content)
      };
    }

  } catch (error) {
    console.error('Error in OpenAI API call:', error);
    throw new Error('Error al procesar el documento con IA');
  }
}

// Funciones auxiliares para extracción de fallback
function extractNameFromText(text: string, type: 'english' | 'chinese'): string | undefined {
  if (type === 'english') {
    // Buscar patrones comunes de nombres de empresas en inglés
    const patterns = [
      /([A-Z][a-z]+ [A-Z][a-z]+ (?:Co\.|Company|Corp\.|Corporation|Ltd\.|Limited|Inc\.|Incorporated))/g,
      /([A-Z][A-Z]+ [A-Z][a-z]+ (?:Co\.|Company|Corp\.|Corporation|Ltd\.|Limited|Inc\.|Incorporated))/g
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }
  } else {
    // Buscar caracteres chinos que podrían ser nombres de empresa
    const chinesePattern = /[\u4e00-\u9fff]{2,}(?:公司|有限公司|股份有限公司|集团)/g;
    const match = text.match(chinesePattern);
    if (match) return match[0];
  }
  
  return undefined;
}

function extractWebsiteFromText(text: string): string | undefined {
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+\.[a-z]{2,}|[a-z0-9-]+\.[a-z]{2,}(?:\.[a-z]{2,})?)/gi;
  const match = text.match(urlPattern);
  if (match) {
    // Limpiar y validar URL
    let url = match[0].trim().replace(/[,;.]$/, '');
    if (!url.startsWith('http')) {
      url = 'https://' + url.replace(/^www\./, '');
    }
    return url;
  }
  return undefined;
}

// Para PDFs, también manejar extracción de texto
export async function extractTextFromPDF(base64Data: string): Promise<string> {
  try {
    // En un entorno real, aquí usarías pdf-parse o similar
    // Por ahora, retornamos un mensaje indicativo
    return "Procesamiento de PDF - implementar extracción real de texto";
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return "";
  }
}
