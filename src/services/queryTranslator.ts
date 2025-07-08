// services/queryTranslator.ts
import { openai, JSON_CONFIG } from "./openaiClient";

export interface SearchCriteria {
  products: string[];
  location: string | null;
  employees: {
    min?: number;
    max?: number;
    exact?: number;
    operator?: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'between';
  } | null;
  credit_rating: string | null;
  company_age: {
    min_years?: number;
    max_years?: number;
    exact_years?: number;
    operator?: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'between';
  } | null;
  capital: {
    min_amount?: number;
    max_amount?: number;
    currency?: 'RMB' | 'USD';
    operator?: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'between';
  } | null;
  brands: string[];
  certifications: string[];
  company_type: string | null; // 'manufacturer' | 'trading' | 'factory'
  provinces_excluded: string[];
  cities_excluded: string[];
  sorting: {
    field: string;
    order: 'asc' | 'desc';
  } | null;
  risk_level: 'low' | 'medium' | 'high' | null;
  website_requirements: {
    languages?: string[];
    must_have_sections?: string[];
    keywords_in_web?: string[];
  } | null;
  limit: number;
  confidence: number;
  query_intent: string;
  company_name: string | null;
  exclusions: {
    products?: string[];
    locations?: string[];
    company_names?: string[];
  };
}

export async function translateQuery(naturalPrompt: string): Promise<SearchCriteria> {
  console.log('🧠 Traduciendo consulta con GPT-4o:', naturalPrompt);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // 🏆 Máxima calidad de análisis
      response_format: { type: "json_object" },
      temperature: 0.2, // + precisión / – alucinación
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: `
            Eres un experto especializado en análisis de consultas para empresas chinas de la Feria de Cantón.
            Tu expertise incluye productos chinos, geografía china, terminología de negocios, y análisis de importadores.
            
            ANALIZA CUIDADOSAMENTE Y EXTRAE TODOS LOS CRITERIOS MENCIONADOS.
            
            Devuelve estrictamente un JSON con esta estructura completa:
            {
              "products": ["array de productos, servicios o industrias"],
              "location": "ubicación específica china o null",
              "employees": {
                "min": "número mínimo si se menciona",
                "max": "número máximo si se menciona", 
                "exact": "número exacto si se menciona",
                "operator": "gt|lt|gte|lte|eq|between según el contexto"
              },
              "company_age": {
                "min_years": "años mínimos de antigüedad",
                "max_years": "años máximos", 
                "exact_years": "años exactos",
                "operator": "gt|lt|gte|lte|eq|between"
              },
              "capital": {
                "min_amount": "capital mínimo en millones",
                "max_amount": "capital máximo",
                "currency": "RMB|USD",
                "operator": "gt|lt|gte|lte|eq|between"
              },
              "brands": ["marcas mencionadas para buscar en web/dominios"],
              "certifications": ["certificaciones como ISO, CE, etc."],
              "company_type": "manufacturer|trading|factory|null",
              "provinces_excluded": ["provincias a excluir"],
              "cities_excluded": ["ciudades a excluir"],
              "sorting": {
                "field": "employees|age|capital|name",
                "order": "asc|desc"
              },
              "risk_level": "low|medium|high|null",
              "website_requirements": {
                "languages": ["idiomas requeridos en web"],
                "must_have_sections": ["secciones requeridas"],
                "keywords_in_web": ["palabras clave que debe tener la web"]
              },
              "limit": "número de resultados (default 10)",
              "confidence": "confianza 0-100",
              "query_intent": "product_search|location_search|size_search|risk_search|complex_search|comparison|exclusion",
              "company_name": "nombre específico o null",
              "exclusions": {
                "products": ["productos a excluir"],
                "locations": ["ubicaciones a excluir"],
                "company_names": ["empresas específicas a excluir"]
              }
            }

            REGLAS CRÍTICAS PARA ANÁLISIS:
            
            1. EMPLEADOS: Buscar en "Real Insured Employees"
               - "más de X empleados" → employees.min = X, operator = "gte"
               - "menos de X empleados" → employees.max = X, operator = "lte" 
               - "entre X y Y empleados" → employees.min = X, max = Y, operator = "between"
               
            2. PRODUCTOS/RUBROS: Buscar en múltiples campos:
               - Company Name (English/Chinese)
               - Canton Website
               - Canton Main Keywords  
               - Canton Main Products
               
            3. MARCAS: Buscar en dominios web y nombres
               - brands array para buscar en "Canton Website" y nombres
               
            4. ANTIGÜEDAD: Calcular desde año actual (2025)
               - "más de X años" → company_age.min_years = X
               - "fundadas hace X años" → company_age.exact_years = X
               
            5. EXCLUSIONES: Detectar "pero no", "excluye", "que NO"
               - provinces_excluded, cities_excluded, exclusions
               
            6. ORDENAMIENTO: "ordenadas por", "de mayor a menor"
               - sorting.field y sorting.order
               
            7. TIPOS DE EMPRESA:
               - "fabricantes", "fábricas" → company_type: "manufacturer" 
               - "trading" → company_type: "trading"
               
            EJEMPLOS REALISTAS:
            "Busco 3 empresas de luces LED en Shenzhen" → 
            products: ["LED", "luces", "lighting"], location: "Shenzhen", limit: 3
            
            "Fabricantes con más de 200 empleados" →
            employees: {min: 200, operator: "gte"}, company_type: "manufacturer"
            
            "Empresas de textiles pero que NO estén en Guangdong" →
            products: ["textiles"], provinces_excluded: ["Guangdong"]
            
            "Ordenadas de mayor a menor por empleados" →
            sorting: {field: "employees", order: "desc"}
            
            "Marca SunPower" → brands: ["SunPower"]
            
            "Con certificación CE" → certifications: ["CE"]
          `
        },
        { 
          role: "user", 
          content: `Analiza esta consulta: "${naturalPrompt}"`
        }
      ]
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    
    // Validación y normalización de criterios avanzados
    const criteria: SearchCriteria = {
      products: Array.isArray(result.products) ? result.products : [],
      location: result.location || null,
      employees: result.employees ? {
        min: result.employees.min || undefined,
        max: result.employees.max || undefined,
        exact: result.employees.exact || undefined,
        operator: result.employees.operator || 'gte'
      } : null,
      credit_rating: result.credit_rating || null,
      company_age: result.company_age ? {
        min_years: result.company_age.min_years || undefined,
        max_years: result.company_age.max_years || undefined,
        exact_years: result.company_age.exact_years || undefined,
        operator: result.company_age.operator || 'gte'
      } : null,
      capital: result.capital ? {
        min_amount: result.capital.min_amount || undefined,
        max_amount: result.capital.max_amount || undefined,
        currency: result.capital.currency || 'RMB',
        operator: result.capital.operator || 'gte'
      } : null,
      brands: Array.isArray(result.brands) ? result.brands : [],
      certifications: Array.isArray(result.certifications) ? result.certifications : [],
      company_type: result.company_type || null,
      provinces_excluded: Array.isArray(result.provinces_excluded) ? result.provinces_excluded : [],
      cities_excluded: Array.isArray(result.cities_excluded) ? result.cities_excluded : [],
      sorting: result.sorting ? {
        field: result.sorting.field || 'employees',
        order: result.sorting.order || 'desc'
      } : null,
      risk_level: result.risk_level || null,
      website_requirements: result.website_requirements || null,
      limit: Math.min(result.limit || 10, 50),
      confidence: Math.max(0, Math.min(100, result.confidence || 70)),
      query_intent: result.query_intent || 'general_search',
      company_name: result.company_name || null,
      exclusions: result.exclusions || {
        products: [],
        locations: [],
        company_names: []
      }
    };

    console.log('✅ Consulta traducida:', criteria);
    return criteria;

  } catch (error) {
    console.error('❌ Error en traducción de consulta:', error);
    
    // Fallback: análisis básico local
    return {
      products: extractProductsLocal(naturalPrompt),
      location: extractLocationLocal(naturalPrompt),
      employees: null,
      credit_rating: null,
      company_age: null,
      capital: null,
      brands: [],
      certifications: [],
      company_type: null,
      provinces_excluded: [],
      cities_excluded: [],
      sorting: null,
      risk_level: null,
      website_requirements: null,
      limit: 10,
      confidence: 30,
      query_intent: 'general_search',
      company_name: extractCompanyNameLocal(naturalPrompt),
      exclusions: {
        products: [],
        locations: [],
        company_names: []
      }
    };
  }
}

// Funciones de fallback local
function extractProductsLocal(query: string): string[] {
  const productKeywords = [
    'LED', 'lighting', '照明', 'electronics', '电子',
    'irrigation', '灌溉', 'textile', '纺织', 'machinery', '机械',
    'automotive', '汽车', 'furniture', '家具', 'food', '食品'
  ];
  
  return productKeywords.filter(keyword => 
    query.toLowerCase().includes(keyword.toLowerCase())
  );
}

function extractLocationLocal(query: string): string | null {
  const locations = [
    'Guangdong', '广东', 'Beijing', '北京', 'Shanghai', '上海',
    'Shenzhen', '深圳', 'Guangzhou', '广州', 'Foshan', '佛山',
    'Xiamen', '厦门', 'Shandong', '山东', 'Jiangsu', '江苏'
  ];
  
  const found = locations.find(loc => 
    query.toLowerCase().includes(loc.toLowerCase())
  );
  
  return found || null;
}

function extractCompanyNameLocal(query: string): string | null {
  // Detectar nombres específicos de empresas
  const companyPatterns = [
    /(\w+\s*Co\.?,?\s*Ltd\.?)/gi,
    /(Dayu|大禹)/gi,
    /(Youngmart|杨马特)/gi
  ];
  
  for (const pattern of companyPatterns) {
    const match = query.match(pattern);
    if (match) return match[0];
  }
  
  return null;
}

export async function generateConversationalResponse(
  query: string, 
  results: any[], 
  criteria: SearchCriteria
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `
            Eres un asistente experto en empresas chinas de la Feria de Cantón.
            Genera una respuesta conversacional profesional en español sobre los resultados de búsqueda.
            
            REGLAS:
            - Ser específico sobre los resultados encontrados
            - Mencionar aspectos relevantes (ubicación, productos, contacto)
            - Tono profesional pero amigable
            - Máximo 2-3 oraciones
            - Incluir un breve resumen de las empresas encontradas
          `
        },
        {
          role: "user",
          content: `
            Consulta original: "${query}"
            Criterios detectados: ${JSON.stringify(criteria)}
            Resultados encontrados: ${results.length} empresas
            
            Principales empresas:
            ${results.slice(0, 3).map(r => 
              `- ${r.company['Company Name (English)']} (${r.company['Province']}) - ${r.company['Canton Main Products']}`
            ).join('\n')}
            
            Genera una respuesta conversacional sobre estos resultados.
          `
        }
      ]
    });

    return completion.choices[0].message.content || `Encontré ${results.length} empresa(s) que coinciden con tu búsqueda "${query}".`;

  } catch (error) {
    console.error('❌ Error generando respuesta conversacional:', error);
    return `Encontré ${results.length} empresa(s) china(s) verificada(s) que coinciden con "${query}". Estas empresas están disponibles para contacto directo.`;
  }
}