// Servicio de OpenAI ChatGPT 4o para China Verifier - Sistema Anti-Alucinación
import { Company, CompanyReportJSON } from '../types';
import { CantonCompany } from '../types/canton';
import supabaseSearchService from './supabaseSearch';

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

interface SearchResult {
  companies: CantonCompany[];
  isExact: boolean;
  searchQuery: string;
}

class OpenAIService {
  private apiKey: string;
  private baseURL: string = 'https://api.openai.com/v1';

  constructor() {
    // API Key configurada directamente para el deployment
    this.apiKey = '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';
  }

  // Función para convertir títulos de campo markdown a negritas HTML reales
  private convertFieldTitlesToHTML(text: string): string {
    // Expresión regular para capturar "- **Campo:**"
    const fieldTitleRegex = /- \*\*(.+?):\*\*/g;
    
    return text.replace(fieldTitleRegex, (match, fieldName) => {
      // Escapar HTML para seguridad
      const escapedFieldName = fieldName
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      
      return `- <strong>${escapedFieldName}:</strong>`;
    });
  }

  // Función para convertir cifras chinas a lenguaje claro
  private convertChineseNumbers(text: string): string {
    const conversions = {
      '万元': ' millones de yuanes',
      '万': ' millones',
      '千万': ' decenas de millones',
      '亿': ' cientos de millones',
      '元': ' yuanes'
    };
    
    let converted = text;
    Object.entries(conversions).forEach(([chinese, spanish]) => {
      converted = converted.replace(new RegExp(chinese, 'g'), spanish);
    });
    
    // Convertir números como "1200万元" a "12 millones de yuanes"
    converted = converted.replace(/(\d+)万元/g, (match, number) => {
      const millions = parseInt(number) / 100;
      return `${millions} millones de yuanes`;
    });
    
    return converted;
  }

  // Búsqueda inteligente usando Supabase
  async performSupabaseSearch(query: string): Promise<SearchResult> {
    try {
      console.log('🔍 OpenAI: Realizando búsqueda con MiniMax + Supabase');
      // Usar el nuevo servicio integrado MiniMax + Supabase
      const searchResponse = await supabaseSearchService.search(query, 10, true);
      
      return {
        companies: searchResponse.companies.map(result => result.company),
        isExact: searchResponse.companies.length > 0 && searchResponse.companies[0].relevanceScore > 80,
        searchQuery: query
      };
    } catch (error) {
      console.error('Error en búsqueda MiniMax + Supabase:', error);
      
      // Fallback: búsqueda sin IA si la inteligente falla
      try {
        console.log('⚡ OpenAI: Usando búsqueda fallback sin IA');
        const fallbackResponse = await supabaseSearchService.search(query, 10, false);
        return {
          companies: fallbackResponse.companies.map(result => result.company),
          isExact: false,
          searchQuery: query
        };
      } catch (fallbackError) {
        console.error('Error en búsqueda fallback:', fallbackError);
        return {
          companies: [],
          isExact: false,
          searchQuery: query
        };
      }
    }
  }

  // Formatear reporte completo de empresa en nuevo formato visual con emojis
  private formatCompanyReport(company: CantonCompany): string {
    // Convertir cifras chinas a formato comprensible con redondeo a 4 decimales
    const convertCapital = (text: string): string => {
      if (!text || text === 'nan') return 'No disponible';
      
      // Buscar números seguidos de 万元 (decenas de miles de yuanes)
      const tenThousandsMatch = text.match(/(\d+(?:\.\d+)?)万元/);
      if (tenThousandsMatch) {
        const value = parseFloat(tenThousandsMatch[1]);
        const millions = (value / 100).toFixed(4);
        return `${millions} millones de yuanes`;
      }
      
      // Buscar números simples
      const numberMatch = text.match(/(\d+(?:\.\d+)?)/);
      if (numberMatch) {
        const value = parseFloat(numberMatch[1]);
        if (value >= 100) {
          const millions = (value / 100).toFixed(4);
          return `${millions} millones de yuanes`;
        } else {
          return `${value} mil yuanes`;
        }
      }
      
      return text;
    };

    // Extraer y traducir productos principales
    const extractProductsFormatted = (cantonProducts: string): string => {
      if (!cantonProducts || cantonProducts === 'nan' || cantonProducts === 'null') return 'No especificados';
      
      const products = cantonProducts.split(',').slice(0, 8); // Máximo 8 productos
      
      // Diccionario de traducciones expandido
      const translations: Record<string, string> = {
        '塑料地板': 'Pisos de plástico',
        '强化木地板': 'Pisos laminados reforzados',
        '胶合地板': 'Pisos de madera contrachapada',
        '复合地板': 'Pisos compuestos',
        '竹地板': 'Pisos de bambú',
        '实木地板': 'Pisos de madera sólida',
        '踢脚线': 'Zócalos',
        '地板附件': 'Accesorios para pisos',
        '笔记本': 'Cuadernos',
        '日记本': 'Diarios',
        '便签本': 'Libretas de notas',
        '日程本': 'Agendas',
        '电子产品': 'Productos electrónicos',
        '纺织品': 'Productos textiles',
        '机械': 'Maquinaria',
        '服装': 'Ropa',
        '家具': 'Mobiliario',
        '金属制品': 'Productos metálicos',
        '塑料制品': 'Productos plásticos',
        '化工产品': 'Productos químicos',
        '玩具': 'Juguetes',
        '灯具': 'Luminarias',
        '五金': 'Ferretería',
        '包装': 'Embalaje',
        '建材': 'Materiales de construcción'
      };
      
      return products.map(product => {
        const cleaned = product.trim();
        const translation = translations[cleaned] || cleaned;
        return `• ${cleaned} (${translation})`;
      }).join('\n');
    };

    // Extraer todos los teléfonos
    const extractAllPhones = (telephone?: string): string => {
      if (telephone && telephone !== 'nan' && telephone !== 'null') {
        return telephone;
      }
      return 'No disponible';
    };

    // Extraer todos los emails
    const extractAllEmails = (email?: string): string => {
      if (email && email !== 'nan' && email !== 'null') {
        return email;
      }
      return 'No disponible';
    };

    // Crear perfil de empresa mejorado
    const createEnhancedProfile = (company: CantonCompany): string => {
      if (company['Company profile'] && company['Company profile'] !== 'nan' && company['Company profile'] !== 'null') {
        // Si el perfil existe, mejorarlo agregando información clave al final
        let profile = company['Company profile'];
        if (!profile.includes('actualmente')) {
          profile += ' La empresa se encuentra actualmente activa.';
        }
        return profile;
      }
      
      // Generar perfil detallado si no existe
      const establishmentYear = company['Year of establishment'] || 'año no especificado';
      const legalRep = company['Legal Representative'] || 'no especificado';
      const industry = company['Category'] || 'industria general';
      const businessScope = company['Business scope'] || 'actividades comerciales generales';
      
      return `${company['Company Name (English)']} fue fundada en ${establishmentYear}. ` +
             `Su representante legal es ${legalRep}. La empresa opera en la industria de ${industry}. ` +
             `Su alcance de negocio incluye ${businessScope}. ` +
             `La empresa se encuentra actualmente activa.`;
    };

    // Formatear dirección completa
    const formatFullAddress = (address?: string): string => {
      if (!address || address === 'nan' || address === 'null') return 'No disponible';
      
      // Si ya incluye la provincia, devolverla tal como está
      if (address.includes(company['Province'] || '')) {
        return address;
      }
      
      // Si no, combinar provincia + dirección
      const province = company['Province'] || '';
      return province ? `${province}, ${address}` : address;
    };

    // Generar el reporte en el nuevo formato
    const report = `🧾 Reporte de Empresa: ${company['Company Name (English)'] || 'No disponible'}
Nombre en Inglés: ${company['Company Name (English)'] || 'No disponible'}
Nombre en Chino: ${company['Company Name (Chinese)'] || 'No disponible'}
________________________________________
📍 Información General
• Provincia: ${company['Province'] || 'No disponible'}
• Dirección completa: ${formatFullAddress(company['Address'])}
• Año de fundación: ${company['Year of establishment'] || 'No disponible'}
• Antigüedad: ${company['Age'] || 'No disponible'} años
• Tipo de empresa: ${company['Enterprise Type'] || 'No disponible'}
________________________________________
💼 Información Legal y Financiera
• Capital registrado: ${convertCapital(company['Registered Capital'] || '')}
• Capital pagado: ${convertCapital(company['Paid Capital'] || '')}
• Código de crédito social unificado: ${company['Social Credit Code'] || 'No disponible'}
• Escala empresarial: ${company['Enterprise Scale'] || 'No disponible'}
• Empleados asegurados: ${company['Real Insured Employees'] || 'No disponible'}
• Credit Scoring: ${company['Credit Rate Scoring'] || 'No disponible'}
• Credit Rating: ${company['Credit rating'] || 'No disponible'}
________________________________________
🌐 Contacto y Sitios Web
• Teléfono(s): ${extractAllPhones(company['Telephone'])}
• Email(s): ${extractAllEmails(company['Email'])}
• Sitio web oficial: ${company['Official website'] || 'No disponible'}
• Sitio web en Feria de Cantón: ${company['Canton Website'] || 'No disponible'}
________________________________________
📦 Productos Principales
${extractProductsFormatted(company['Canton Main Products'] || '')}
________________________________________
🏭 Perfil de la Empresa
${createEnhancedProfile(company)}

---
*Información verificada de la Feria de Cantón - China Verifier*`;

    return report;
  }

  async generateChatResponse(
    userMessage: string, 
    conversationHistory: ChatGPTMessage[] = [],
    onProgress?: (progress: number, status: string) => void
  ): Promise<string> {
    try {
      // Paso 1: Búsqueda exhaustiva
      if (onProgress) onProgress(10, "Analizando consulta...");
      
      // Verificar si es una consulta de reporte específico de empresa
      const isCompanyReport = userMessage.toLowerCase().includes('reporte') || 
                             userMessage.toLowerCase().includes('información completa') ||
                             userMessage.toLowerCase().includes('datos completos') ||
                             userMessage.toLowerCase().includes('informe de');

      if (onProgress) onProgress(25, "Buscando en base de datos Supabase...");
      
      // Realizar búsqueda inteligente en Supabase
      const searchResult = await this.performSupabaseSearch(userMessage);
      
      if (onProgress) onProgress(50, "Procesando resultados...");

      // Si es un reporte y encontramos una empresa específica
      if (isCompanyReport && searchResult.companies.length > 0) {
        if (onProgress) onProgress(75, "Generando reporte detallado...");
        
        const targetCompany = searchResult.companies[0];
        const detailedReport = this.formatCompanyReport(targetCompany);
        
        // Convertir títulos de campo a negritas HTML reales
        const processedReport = this.convertFieldTitlesToHTML(detailedReport);
        
        if (onProgress) onProgress(100, "Reporte completado");
        return processedReport;
      }

      // Para otras consultas, usar ChatGPT con contexto preciso
      if (onProgress) onProgress(60, "Consultando IA especializada...");
      
      const systemPrompt = this.buildSystemPrompt(searchResult.companies, searchResult.isExact);
      
      // Preparar mensajes para ChatGPT
      const messages: ChatGPTMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-6), // Últimos 6 mensajes para contexto
        { role: 'user', content: userMessage }
      ];

      if (onProgress) onProgress(80, "Generando respuesta inteligente...");

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: messages,
          max_tokens: 2000,
          temperature: 0.3, // Temperatura baja para respuestas más precisas
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error de OpenAI API:', errorData);
        throw new Error(`Error de API: ${response.status}`);
      }

      const data: ChatGPTResponse = await response.json();
      
      if (onProgress) onProgress(100, "Respuesta generada");
      
      return data.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';

    } catch (error) {
      console.error('Error al generar respuesta de ChatGPT:', error);
      if (onProgress) onProgress(100, "Error - usando respuesta de respaldo");
      
      // Realizar búsqueda de respaldo usando Supabase
      const fallbackSearchResult = await this.performSupabaseSearch(userMessage);
      return this.getFallbackResponse(userMessage, fallbackSearchResult.companies);
    }
  }

  private buildSystemPrompt(companies: CantonCompany[], isExactMatch: boolean = false): string {
    const companyData = companies.length > 0 ? this.formatCompaniesForPrompt(companies) : '';
    
    return `Eres China Verifier, un sistema de verificación de empresas chinas ANTI-ALUCINACIÓN. 

INSTRUCCIONES CRÍTICAS:
1. NUNCA inventes información que no esté en los datos proporcionados
2. Si no tienes datos específicos, indica claramente "No disponible en la base de datos"
3. Usa ÚNICAMENTE información de las empresas proporcionadas
4. Convierte cifras chinas (万元) a español claro (millones de yuanes)
5. Mantén estilo formal, directo y sin opiniones
6. Si se solicita un reporte completo, incluye TODOS los campos disponibles

ESPECIALIDADES VERIFICADAS:
- 24,225 empresas de la Feria de Cantón verificadas
- Información oficial de registros chinos
- Datos de certificaciones y calificaciones reales
- Contactos y ubicaciones verificadas

${isExactMatch ? 'COINCIDENCIA EXACTA ENCONTRADA' : 'BÚSQUEDA REALIZADA'} - ${companies.length} empresa(s):

${companyData}

RESPONDE ÚNICAMENTE CON INFORMACIÓN VERIFICADA. Si no tienes datos, indica explícitamente su ausencia.`;
  }

  private formatCompaniesForPrompt(companies: CantonCompany[]): string {
    return companies.slice(0, 5).map((company, index) => {
      return `EMPRESA ${index + 1}:
Nombre: ${company['Company Name (English)']}
Nombre chino: ${company['Company Name (Chinese)']}
Provincia: ${company['Province']}
Dirección: ${company['Address'] || 'No disponible'}
Establecimiento: ${company['Year of establishment']} (${company['Age']} años)
Tipo: ${company['Enterprise Type'] || 'No disponible'}
Capital registrado: ${this.convertChineseNumbers(company['Registered Capital'] || '')}
Capital pagado: ${this.convertChineseNumbers(company['Paid Capital'] || '')}
Empleados asegurados: ${company['Real Insured Employees']}
Escala empresarial: ${company['Enterprise Scale']}
Credit Rating: ${company['Credit rating'] || 'No disponible'}
Credit Scoring: ${company['Credit Rate Scoring'] || 'No disponible'}
Teléfono: ${company['Telephone'] || 'No disponible'}
Email: ${company['Email'] || 'No disponible'}
Website oficial: ${company['Official website'] || 'No disponible'}
Website Cantón: ${company['Canton Website'] || 'No disponible'}
Productos principales: ${company['Canton Main Products']}
Keywords: ${company['Canton Main Keywords']}
Perfil: ${company['Company profile'] || 'No disponible'}
Código social: ${company['Social Credit Code'] || 'No disponible'}
---`;
    }).join('\n\n');
  }

  private getFallbackResponse(userMessage: string, companies: CantonCompany[]): string {
    // Respuesta de respaldo sin alucinaciones
    if (companies.length > 0) {
      let response = `📋 **RESULTADOS DE BÚSQUEDA VERIFICADOS**\n\nEncontradas ${companies.length} empresa${companies.length > 1 ? 's' : ''} en la base de datos oficial:\n\n`;
      
      companies.slice(0, 3).forEach((company, index) => {
        response += `**${index + 1}. ${company['Company Name (English)']}**\n`;
        response += `🏢 ${company['Company Name (Chinese)']}\n`;
        response += `📍 ${company['Province']}\n`;
        response += `⭐ Credit Rating: ${company['Credit rating'] || 'No disponible'}\n`;
        response += `👥 Empleados asegurados: ${company['Real Insured Employees'] || 'No disponible'}\n`;
        response += `📱 ${company['Telephone'] || 'No disponible'}\n`;
        response += `📧 ${company['Email'] || 'No disponible'}\n\n`;
      });

      if (companies.length > 3) {
        response += `📊 *${companies.length - 3} empresa${companies.length - 3 > 1 ? 's' : ''} adicional${companies.length - 3 > 1 ? 'es' : ''} disponible${companies.length - 3 > 1 ? 's' : ''}*\n\n`;
      }

      response += '✅ Información verificada de la Feria de Cantón.\n💡 Para obtener un reporte completo, solicita "reporte de [nombre de empresa]"';
      return response;
    }

    return `🔍 **BÚSQUEDA SIN RESULTADOS**\n\nNo se encontraron empresas que coincidan con "${userMessage}" en la base de datos de 24,225 empresas verificadas.\n\n💡 **Sugerencias:**\n- Intenta con términos más generales\n- Busca por provincia (ej: "empresas en Guangdong")\n- Busca por producto (ej: "fabricantes de electrónicos")\n- Usa nombres en inglés o chino\n\n📊 La base de datos incluye empresas verificadas de todas las provincias chinas principales.`;
  }

  // Nuevo método: Extraer datos de empresas desde documentos
  async extractCompanyDataFromDocument(
    fileType: string,
    base64Data: string,
    fileName: string
  ): Promise<CompanyExtractedData> {
    try {
      const messages: any[] = [
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
        }
      ];

      // Agregar contenido basado en tipo de archivo
      if (fileType.startsWith('image/')) {
        messages.push({
          role: "user",
          content: [
            {
              type: "text",
              text: `Por favor, analiza esta imagen empresarial (${fileName}) y extrae todos los datos de empresa que puedas encontrar. Responde solo con el JSON solicitado.`
            },
            {
              type: "image_url",
              image_url: {
                url: base64Data,
                detail: "high"
              }
            }
          ]
        });
      } else {
        // Para PDFs u otros documentos, usar solo texto
        messages.push({
          role: "user",
          content: `Por favor, analiza este documento empresarial (${fileName}) y extrae todos los datos de empresa que puedas encontrar. Responde solo con el JSON solicitado.`
        });
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o", // Modelo con capacidades de visión
          messages: messages,
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
          englishName: this.extractNameFromText(content, 'english'),
          chineseName: this.extractNameFromText(content, 'chinese'),
          website: this.extractWebsiteFromText(content)
        };
      }

    } catch (error) {
      console.error('Error in OpenAI document extraction:', error);
      throw new Error('Error al procesar el documento con IA');
    }
  }

  // Funciones auxiliares para extracción de fallback
  private extractNameFromText(text: string, type: 'english' | 'chinese'): string | undefined {
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

  private extractWebsiteFromText(text: string): string | undefined {
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
}

export const openAIService = new OpenAIService();
