// Servicio MiniMax-M1 API para comprensión conversacional avanzada
interface MinimaxSearchCriteria {
  products: string[];
  location: string[];
  industry: string[];
  employeeRange?: {
    min?: number;
    max?: number;
  };
  creditRating?: string[];
  scale?: string[];
  establishedAfter?: number;
  hasWebsite?: boolean;
  query: string;
  intent: 'search' | 'filter' | 'compare' | 'info';
}

interface MinimaxResponse {
  success: boolean;
  criteria: MinimaxSearchCriteria;
  confidence: number;
  explanation: string;
  suggestions?: string[];
}

class MinimaxService {
  private readonly apiKey: string;
  private readonly baseURL = 'https://api.minimax.chat/v1';
  
  constructor() {
    // MiniMax-M1 API Key proporcionada por el usuario
    this.apiKey = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJEaWVnbyBNYXJ0w61uZXogVGFnbGUiLCJVc2VyTmFtZSI6IkRpZWdvIE1hcnTDrW5leiBUYWdsZSIsIkFjY291bnQiOiIiLCJTdWJqZWN0SUQiOiIxOTQwOTA4MzA1Mjk5ODA0NjM2IiwiUGhvbmUiOiIiLCJHcm91cElEIjoiMTk0MDkwODMwNTI5NTYxMDMzMiIsIlBhZ2VOYW1lIjoiIiwiTWFpbCI6ImRpZWdvQGhrcmVnaXN0cmF0aW9uLmNvbSIsIkNyZWF0ZVRpbWUiOiIyMDI1LTA3LTA0IDA4OjQ1OjA4IiwiVG9rZW5UeXBlIjoxLCJpc3MiOiJtaW5pbWF4In0.qJWp_UWkjx7QGZmm_tb64T8iopL53HJciMw3-CM0MmE0O2ArFwhKm8TNxIAkHaQ2RvxXEVbiB75PETtNFLImJ_LLM9rMQSygbUx_djFt_CyEr16NwAg4clmdIhQy9h0rragwR1oaLyK-e-DogMLYI_QtCFEv7VG255u8opgHBzzpY5kydFMkkNfb1ifaFdlKB8G13t0_8Q3T7UHlGwzdykHkjgPZ-8iBIrzXJ3ahKlPr5o6FdEH4vGsZheL8zHimnDaaPBQyqcemK1ik3S3xE8P9mM5iTX6sCEA4Ci04kZbhPRaOoFXYRzt2ug6nbNYjdKlKiyLeB7U5RPxYWmPSLQ';
  }

  /**
   * Prueba la conectividad con la API de MiniMax
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'abab6.5s-chat',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        })
      });
      
      console.log('🔧 MiniMax API Test Response Status:', response.status);
      const data = await response.json();
      console.log('🔧 MiniMax API Test Response:', data);
      
      return response.ok;
    } catch (error) {
      console.error('🔧 MiniMax API Test Error:', error);
      return false;
    }
  }

  /**
   * Analiza una consulta conversacional y extrae criterios de búsqueda estructurados
   */
  async analyzeSearchQuery(query: string): Promise<MinimaxResponse> {
    const startTime = Date.now();
    
    try {
      console.log('🤖 MiniMax-M1: Analizando consulta:', query);

      // Prompt especializado para análisis de búsquedas empresariales
      const systemPrompt = `Eres un experto en análisis de consultas de búsqueda de empresas chinas.
Tu trabajo es extraer criterios estructurados de consultas conversacionales.

CAMPOS DISPONIBLES:
- Productos: LED, PVC, textiles, electrónicos, alimentos, medicina, maquinaria, etc.
- Ubicaciones: Shenzhen, Cantón, Guangdong, Shandong, Jiangxi, Hubei, etc.
- Industrias: manufactura, textiles, electrónicos, alimentos, medicina, etc.
- Empleados: rangos numéricos (ej: >30, <50, 100-200)
- Rating crediticio: A, B, L (con números)
- Escala: S(小型), M(中型), L(大型)
- Año establecimiento: años específicos o rangos

EJEMPLOS:
"Dame 10 empresas que vendan LED, en Shenzhen y que tengan más de 30 empleados"
→ productos: ["LED"], ubicaciones: ["Shenzhen"], empleados: {min: 31}

"Empresas de PVC en Cantón con hasta 50 empleados"
→ productos: ["PVC"], ubicaciones: ["Cantón"], empleados: {max: 50}

Responde SOLO en formato JSON válido con esta estructura:
{
  "products": [],
  "location": [],
  "industry": [],
  "employeeRange": {"min": null, "max": null},
  "creditRating": [],
  "scale": [],
  "establishedAfter": null,
  "hasWebsite": null,
  "intent": "search",
  "confidence": 0.95
}`;

      const requestBody = {
        model: 'abab6.5s-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.1,
        max_tokens: 1000
      };

      console.log('🔧 MiniMax Request URL:', `${this.baseURL}/chat/completions`);
      console.log('🔧 MiniMax Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🔧 MiniMax Response Status:', response.status);
      console.log('🔧 MiniMax Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔧 MiniMax Error Response:', errorText);
        throw new Error(`MiniMax API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🔧 MiniMax Response Data:', JSON.stringify(data, null, 2));
      
      const analysisResult = data.choices?.[0]?.message?.content;

      if (!analysisResult) {
        console.error('🔧 MiniMax respuesta vacía o malformada:', data);
        throw new Error('No se recibió respuesta válida de MiniMax API');
      }

      // Intentar parsear respuesta JSON
      let criteria: MinimaxSearchCriteria;
      try {
        const parsedCriteria = JSON.parse(analysisResult);
        criteria = {
          ...parsedCriteria,
          query,
          intent: parsedCriteria.intent || 'search'
        };
      } catch (parseError) {
        console.warn('⚠️ Error parseando JSON de MiniMax, usando fallback:', parseError);
        criteria = this.getFallbackCriteria(query);
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ MiniMax-M1: Análisis completado en ${responseTime}ms`);

      return {
        success: true,
        criteria,
        confidence: 0.8,
        explanation: this.generateExplanation(criteria),
        suggestions: this.generateSuggestions(criteria)
      };

    } catch (error) {
      console.error('❌ Error en MiniMax API:', error);
      
      // Fallback: análisis básico local
      return {
        success: false,
        criteria: this.getFallbackCriteria(query),
        confidence: 0.5,
        explanation: 'Análisis realizado localmente (MiniMax API no disponible)',
        suggestions: ['Intenta ser más específico en tu búsqueda']
      };
    }
  }

  /**
   * Análisis local básico cuando MiniMax API no responde
   */
  private getFallbackCriteria(query: string): MinimaxSearchCriteria {
    const lowerQuery = query.toLowerCase();
    
    // Extraer productos comunes
    const products: string[] = [];
    const productKeywords = {
      'led': ['led', 'luces', 'iluminación'],
      'pvc': ['pvc', 'plástico', 'vinyl'],
      'textiles': ['textiles', 'ropa', 'tela', 'clothing'],
      'electrónicos': ['electrónicos', 'electronics', 'eléctrico'],
      'alimentos': ['alimentos', 'food', 'comida'],
      'medicina': ['medicina', 'medical', 'médico', 'health']
    };

    for (const [product, keywords] of Object.entries(productKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        products.push(product);
      }
    }

    // Extraer ubicaciones
    const location: string[] = [];
    const locationKeywords = {
      'Shenzhen': ['shenzhen', 'shen zhen'],
      'Cantón': ['cantón', 'canton', 'guangzhou'],
      'Guangdong': ['guangdong', 'guang dong'],
      'Shandong': ['shandong', 'shan dong'],
      'Jiangxi': ['jiangxi', 'jiang xi'],
      'Hubei': ['hubei', 'hu bei']
    };

    for (const [loc, keywords] of Object.entries(locationKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        location.push(loc);
      }
    }

    // Extraer rangos de empleados
    let employeeRange: { min?: number; max?: number } | undefined;
    
    // Patrones para empleados
    const employeePatterns = [
      { regex: /más de (\d+) empleados?/i, type: 'min' },
      { regex: /con más de (\d+)/i, type: 'min' },
      { regex: /hasta (\d+) empleados?/i, type: 'max' },
      { regex: /con hasta (\d+)/i, type: 'max' },
      { regex: /menos de (\d+)/i, type: 'max' },
      { regex: />(\d+)/i, type: 'min' },
      { regex: /<(\d+)/i, type: 'max' }
    ];

    for (const pattern of employeePatterns) {
      const match = lowerQuery.match(pattern.regex);
      if (match) {
        const number = parseInt(match[1]);
        if (!employeeRange) employeeRange = {};
        
        if (pattern.type === 'min') {
          employeeRange.min = number + 1; // "más de 30" = min: 31
        } else {
          employeeRange.max = number;
        }
      }
    }

    return {
      products,
      location,
      industry: [],
      employeeRange,
      creditRating: [],
      scale: [],
      establishedAfter: undefined,
      hasWebsite: undefined,
      query,
      intent: 'search'
    };
  }

  /**
   * Genera explicación legible de los criterios extraídos
   */
  private generateExplanation(criteria: MinimaxSearchCriteria): string {
    const parts: string[] = [];
    
    if (criteria.products.length > 0) {
      parts.push(`Productos: ${criteria.products.join(', ')}`);
    }
    
    if (criteria.location.length > 0) {
      parts.push(`Ubicación: ${criteria.location.join(', ')}`);
    }
    
    if (criteria.employeeRange) {
      if (criteria.employeeRange.min && criteria.employeeRange.max) {
        parts.push(`Empleados: ${criteria.employeeRange.min}-${criteria.employeeRange.max}`);
      } else if (criteria.employeeRange.min) {
        parts.push(`Empleados: más de ${criteria.employeeRange.min - 1}`);
      } else if (criteria.employeeRange.max) {
        parts.push(`Empleados: hasta ${criteria.employeeRange.max}`);
      }
    }
    
    if (criteria.industry.length > 0) {
      parts.push(`Industria: ${criteria.industry.join(', ')}`);
    }

    return parts.length > 0 
      ? `Búsqueda por: ${parts.join(' | ')}`
      : 'Búsqueda general en base de datos';
  }

  /**
   * Genera sugerencias para mejorar la búsqueda
   */
  private generateSuggestions(criteria: MinimaxSearchCriteria): string[] {
    const suggestions: string[] = [];
    
    if (criteria.products.length === 0) {
      suggestions.push('Especifica el tipo de producto (LED, PVC, textiles, etc.)');
    }
    
    if (criteria.location.length === 0) {
      suggestions.push('Agrega una ubicación (Shenzhen, Cantón, Guangdong, etc.)');
    }
    
    if (!criteria.employeeRange) {
      suggestions.push('Define el tamaño de empresa (ej: "más de 50 empleados")');
    }

    return suggestions;
  }

  /**
   * Convierte criterios de MiniMax a filtros SQL para Supabase
   */
  convertToSupabaseFilters(criteria: MinimaxSearchCriteria) {
    const filters: any[] = [];
    
    // Filtros de productos
    if (criteria.products.length > 0) {
      const productFilters = criteria.products.map(product => 
        `"Canton Main Products".ilike.%${product}%,"Canton Main Keywords".ilike.%${product}%`
      );
      filters.push(`(${productFilters.join(' or ')})`);
    }
    
    // Filtros de ubicación
    if (criteria.location.length > 0) {
      const locationFilters = criteria.location.map(location => 
        `"Province".ilike.%${location}%,"City, District, Business address".ilike.%${location}%`
      );
      filters.push(`(${locationFilters.join(' or ')})`);
    }
    
    // Filtros de empleados
    if (criteria.employeeRange) {
      if (criteria.employeeRange.min) {
        filters.push(`"Real Insured Employees".gte.${criteria.employeeRange.min}`);
      }
      if (criteria.employeeRange.max) {
        filters.push(`"Real Insured Employees".lte.${criteria.employeeRange.max}`);
      }
    }
    
    // Filtros de industria
    if (criteria.industry.length > 0) {
      const industryFilters = criteria.industry.map(industry => 
        `"National standard industry categories".ilike.%${industry}%`
      );
      filters.push(`(${industryFilters.join(' or ')})`);
    }

    return filters;
  }

  /**
   * Genera respuesta conversacional basada en resultados
   */
  generateConversationalResponse(criteria: MinimaxSearchCriteria, results: any[], searchTime: string): string {
    const resultCount = results.length;
    
    if (resultCount === 0) {
      return `No encontré empresas que coincidan con tu búsqueda de ${this.generateExplanation(criteria)}. 
      
Sugerencias:
${this.generateSuggestions(criteria).map(s => `• ${s}`).join('\n')}`;
    }
    
    const responseIntro = resultCount === 1 
      ? `Encontré 1 empresa que coincide con tu búsqueda:`
      : `Encontré ${resultCount} empresas que coinciden con tu búsqueda:`;
    
    const companySummaries = results.slice(0, 3).map((result, index) => {
      const company = result.company || result;
      return `${index + 1}. **${company['Company Name (English)']}** (${company['Company Name (Chinese)']})
   📍 ${company['Province']} - ${company['City, District, Business address']}
   👥 ${company['Real Insured Employees']} empleados
   🏭 ${company['Canton Main Products']}
   ⭐ Rating: ${company['Credit rating']}`;
    }).join('\n\n');
    
    const moreResults = resultCount > 3 
      ? `\n\n... y ${resultCount - 3} empresas más.`
      : '';
    
    return `${responseIntro}

${companySummaries}${moreResults}

🔍 Búsqueda completada en ${searchTime}`;
  }
}

export const minimaxService = new MinimaxService();
export type { MinimaxSearchCriteria, MinimaxResponse };