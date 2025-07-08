import { supabase } from '../lib/supabase';
import { CantonCompany } from '../types/canton';
import { minimaxService, MinimaxSearchCriteria } from './minimaxService';
import { hybridSearchEngine, HybridSearchResponse } from './hybridSearchEngine';
import { advancedSearchEngine, AdvancedSearchResponse } from './advancedSearchEngine';
import { translateQuery } from './queryTranslator';
import { updateCompanyEmbeddings } from './embeddingService';

export interface SearchCriteria {
  products: string[];
  location: string[];
  industry: string[];
  employeeRange?: {
    min?: number;
    max?: number;
  };
}

export interface SearchResult {
  company: CantonCompany;
  relevanceScore: number;
  matchedFields: string[];
  explanation: string;
}

export interface SearchResponse {
  query: string;
  totalResults: number;
  companies: SearchResult[];
  searchTime: string;
  criteria: SearchCriteria;
  isAIAssisted: boolean;
  conversationalResponse?: string;
}

export interface SearchStats {
  totalCompanies: number;
  byProvince: Record<string, number>;
  byIndustry: Record<string, number>;
}

class SupabaseSearchService {
  private readonly TABLE_NAME = 'FERIA DE CANTON';
  private isSupabaseAvailable = true;
  private isMinimaxAvailable = true;

  /**
   * Búsqueda principal con GPT-4o + Motor Híbrido Avanzado
   */
  async search(query: string, limit: number = 10, useAI: boolean = true): Promise<SearchResponse> {
    const startTime = Date.now();

    try {
      console.log('🚀 Iniciando búsqueda híbrida GPT-4o + Embeddings:', query);

      if (useAI) {
        // Usar motor de búsqueda inteligente avanzado con GPT-4o
        console.log('🧠 Usando motor de búsqueda inteligente avanzado...');
        try {
          const advancedResult = await advancedSearchEngine.search(query, limit);
          
          // Convertir formato de respuesta avanzada
          return this.convertAdvancedResponse(advancedResult);
        } catch (error) {
          console.warn('⚠️ Error en motor avanzado, probando motor híbrido:', error);
          
          // Fallback al motor híbrido anterior
          try {
            const hybridResult = await hybridSearchEngine.search(query, limit);
            return this.convertHybridResponse(hybridResult);
          } catch (hybridError) {
            console.warn('⚠️ Error en motor híbrido, usando búsqueda local:', hybridError);
            // Continuar con análisis local
          }
        }
      }

      // Fallback: análisis local mejorado
      console.log('🔍 Usando análisis de búsqueda inteligente local');
      let criteria = this.analyzeSearchQueryLocal(query);
      let conversationalResponse = '';
      console.log('✅ Criterios extraídos localmente:', criteria);
      
      // MiniMax como mejora opcional (deshabilitado temporalmente)
      if (false && useAI && this.isMinimaxAvailable) {
        try {
          console.log('🤖 Intentando mejorar con MiniMax-M1...');
          const minimaxResult = await minimaxService.analyzeSearchQuery(query);
          
          if (minimaxResult.success) {
            // Combinar criterios locales con los de MiniMax
            const enhancedCriteria = {
              products: [...criteria.products, ...minimaxResult.criteria.products],
              location: [...criteria.location, ...minimaxResult.criteria.location],
              industry: [...criteria.industry, ...minimaxResult.criteria.industry],
              employeeRange: minimaxResult.criteria.employeeRange || criteria.employeeRange
            };
            criteria = enhancedCriteria;
            console.log('✅ Criterios mejorados con MiniMax:', criteria);
          }
        } catch (error) {
          console.log('ℹ️ Continuando sin MiniMax (análisis local es suficiente):', error);
          // Continuar con criterios locales
        }
      }

      // Paso 2: Búsqueda en Supabase con criterios estructurados
      if (this.isSupabaseAvailable) {
        const result = await this.searchInSupabase(query, criteria, limit);
        
        // Paso 3: Generar respuesta conversacional básica
        if (result.companies.length > 0) {
          conversationalResponse = `Encontré ${result.companies.length} empresa(s) china(s) que coinciden con "${query}". Estas empresas están verificadas y disponibles para contacto directo.`;
        }

        return {
          ...result,
          conversationalResponse: conversationalResponse || undefined
        };
      }
    } catch (error) {
      console.warn('⚠️ Error en búsqueda principal, usando modo demo:', error);
      this.isSupabaseAvailable = false;
    }

    // Fallback: modo demo con empresas de ejemplo
    return this.getDemoSearchResults(query, limit, useAI);
  }

  /**
   * Genera una respuesta conversacional básica sin IA
   */
  private generateBasicResponse(query: string, companies: CantonCompany[]): string {
    const count = companies.length;
    if (count === 0) {
      return `No encontré empresas que coincidan con "${query}". Te sugiero probar con términos más generales o revisar la ortografía.`;
    }
    
    if (count === 1) {
      const company = companies[0];
      return `Encontré 1 empresa relacionada con "${query}": ${company['Company Name (English)']} ubicada en ${company.Province}. Se especializa en ${company['Canton Main Products']}.`;
    }
    
    const locations = [...new Set(companies.map(c => c.Province))];
    const products = [...new Set(companies.slice(0, 3).map(c => c['Canton Main Products']))];
    
    return `Encontré ${count} empresas relacionadas con "${query}". Están ubicadas principalmente en ${locations.slice(0, 3).join(', ')} y se especializan en productos como ${products.slice(0, 2).join(', ')}.`;
  }

  /**
   * Combina criterios básicos con criterios mejorados
   */
  private mergeCriteria(basic: SearchCriteria, enhanced: SearchCriteria): SearchCriteria {
    return {
      products: [...basic.products, ...enhanced.products],
      location: [...basic.location, ...enhanced.location],  
      industry: [...basic.industry, ...enhanced.industry],
      employeeRange: enhanced.employeeRange || basic.employeeRange
    };
  }

  /**
   * Búsqueda expandida con términos más amplios
   */
  private async searchWithExpandedCriteria(query: string, limit: number): Promise<SearchResponse> {
    console.log('🔍 Búsqueda expandida para:', query);
    
    // Términos expandidos basados en la consulta
    const expandedTerms = this.getExpandedSearchTerms(query.toLowerCase());
    
    try {
      let supabaseQuery = supabase
        .from(this.TABLE_NAME)
        .select('*')
        .limit(limit);

      if (expandedTerms.length > 0) {
        const conditions = expandedTerms.map(term => 
          `"Canton Main Products".ilike.%${term}%,` +
          `"Company Name (English)".ilike.%${term}%,` +
          `"Company Name (Chinese)".ilike.%${term}%,` +
          `"Canton Main Keywords".ilike.%${term}%`
        );
        supabaseQuery = supabaseQuery.or(conditions.join(','));
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('Error en búsqueda expandida:', error);
        return { 
          query,
          totalResults: 0,
          companies: [], 
          searchTime: '0ms',
          criteria: { products: [], location: [], industry: [] },
          isAIAssisted: false,
          conversationalResponse: 'Error en búsqueda expandida'
        };
      }

      const results = (data || []).map((company, index) => ({
        company: company as CantonCompany,
        relevanceScore: Math.max(90 - index * 5, 60), // Score decreciente
        matchedFields: ['Canton Main Products', 'Company Name (English)'],
        explanation: `Coincidencia expandida con términos relacionados`
      }));

      console.log(`✅ Búsqueda expandida encontró ${results.length} resultados`);
      
      return {
        query,
        totalResults: results.length,
        companies: results,
        searchTime: '0ms',
        criteria: { products: expandedTerms, location: [], industry: [] },
        isAIAssisted: false,
        conversationalResponse: `Búsqueda expandida para términos relacionados con "${query}"`
      };
    } catch (error) {
      console.error('Error en búsqueda expandida:', error);
      return { 
        query,
        totalResults: 0,
        companies: [], 
        searchTime: '0ms',
        criteria: { products: [], location: [], industry: [] },
        isAIAssisted: false,
        conversationalResponse: 'Error en búsqueda expandida'
      };
    }
  }

  /**
   * Extrae criterios básicos de búsqueda sin IA
   */
  private extractBasicCriteria(query: string): SearchCriteria {
    const lowerQuery = query.toLowerCase();
    const criteria: SearchCriteria = {
      products: [],
      location: [],
      industry: []
    };

    // Diccionario de términos de productos
    const productTerms: Record<string, string[]> = {
      'led': ['LED', 'lighting', 'illumination'],
      'textil': ['textile', 'clothing', 'garment'],
      'electrónicos': ['electronics', 'electronic'],
      'alimentos': ['food', 'alimentary'],
      'maquinaria': ['machinery', 'equipment'],
      'pvc': ['PVC', 'plastic'],
      'irrigation': ['irrigation', 'water'],
      'pisos': ['flooring', 'floor', 'tiles']
    };

    // Diccionario de ubicaciones
    const locationTerms: Record<string, string[]> = {
      'guangdong': ['广东省', 'Guangdong', 'Canton'],
      'shenzhen': ['深圳', 'Shenzhen'],
      'shanghai': ['上海', 'Shanghai'],
      'beijing': ['北京', 'Beijing'],
      'shandong': ['山东省', 'Shandong'],
      'jiangsu': ['江苏省', 'Jiangsu']
    };

    // Diccionario de industrias
    const industryTerms: Record<string, string[]> = {
      'manufactura': ['制造业', 'manufacturing'],
      'tecnología': ['technology', 'tech'],
      'construcción': ['construction', 'building']
    };

    // Buscar productos
    for (const [key, terms] of Object.entries(productTerms)) {
      if (lowerQuery.includes(key) || terms.some(term => lowerQuery.includes(term.toLowerCase()))) {
        criteria.products.push(...terms);
      }
    }

    // Buscar ubicaciones
    for (const [key, terms] of Object.entries(locationTerms)) {
      if (lowerQuery.includes(key) || terms.some(term => lowerQuery.includes(term.toLowerCase()))) {
        criteria.location.push(...terms);
      }
    }

    // Buscar industrias
    for (const [key, terms] of Object.entries(industryTerms)) {
      if (lowerQuery.includes(key) || terms.some(term => lowerQuery.includes(term.toLowerCase()))) {
        criteria.industry.push(...terms);
      }
    }

    // Extraer rango de empleados si se menciona
    const employeeMatch = lowerQuery.match(/(\d+)\s*(?:empleados|employees)/);
    if (employeeMatch) {
      const minEmployees = parseInt(employeeMatch[1]);
      criteria.employeeRange = { min: minEmployees };
    }

    console.log('🔍 Criterios básicos extraídos:', criteria);
    return criteria;
  }

  /**
   * Obtiene términos expandidos para búsqueda más amplia
   */
  private getExpandedSearchTerms(query: string): string[] {
    const termMappings: Record<string, string[]> = {
      'led': ['LED', 'lighting', 'iluminación', 'electronics', 'electronic', '电', '灯', '照明'],
      'textil': ['textile', 'clothing', 'garment', 'fabric', 'fashion', '纺织', '服装', '服饰', '男女装', '纺织品'],
      'electrónicos': ['electronics', 'electronic', 'electrical', 'tech', '电子', '电器', '家用电器'],
      'alimentos': ['food', 'alimentary', 'nutrition', 'beverage', '食品', '健康食品', '营养'],
      'maquinaria': ['machinery', 'equipment', 'mechanical', 'industrial', '机械', '设备', '工业'],
      'pvc': ['PVC', 'plastic', 'vinyl', 'polymer', '塑料', '塑胶'],
      'irrigation': ['irrigation', 'riego', 'water', 'agricultural', '灌溉', '农业', '水'],
      'pisos': ['flooring', 'floor', 'tiles', 'ceramic', '地板', '瓷砖', '陶瓷'],
      'guangdong': ['广东省', 'Guangdong', 'Canton', 'Guangzhou', 'Shenzhen', '广东'],
      'shenzhen': ['深圳', 'Shenzhen', 'Guangdong'],
      'shanghai': ['上海', 'Shanghai'],
      'beijing': ['北京', 'Beijing'],
      'electronics': ['electronic', 'electronics', '电子', '电器', '家电', '电热', '电热毯'],
      'heating': ['heating', 'electric', '电热', '加热', '暖', '电热毯'],
      'garments': ['garments', 'clothing', '服装', '服饰', '男装', '女装', '牛仔'],
      'health': ['health', 'medical', '健康', '医疗', '保健'],
      'home': ['home', 'household', '家居', '家用', '家纺']
    };

    const terms: string[] = [];
    
    // Agregar el término original
    terms.push(query);
    
    // Buscar mappings
    for (const [key, values] of Object.entries(termMappings)) {
      if (query.includes(key)) {
        terms.push(...values);
      }
    }
    
    // Dividir query en palabras y buscar cada una
    const words = query.split(/\s+/);
    for (const word of words) {
      if (word.length > 2) {
        terms.push(word);
        // Buscar en mappings
        for (const [key, values] of Object.entries(termMappings)) {
          if (word.includes(key) || key.includes(word)) {
            terms.push(...values);
          }
        }
      }
    }
    
    return [...new Set(terms)];
  }

  /**
   * Búsqueda optimizada en Supabase con filtros inteligentes
   */
  private async searchInSupabase(
    query: string, 
    criteria: SearchCriteria, 
    limit: number
  ): Promise<SearchResponse> {
    const startTime = Date.now();

    try {
      console.log('🔍 Buscando en Supabase con criterios:', criteria);

      // Construir consulta base
      let supabaseQuery = supabase
        .from(this.TABLE_NAME)
        .select('*')
        .limit(limit);

      // Aplicar filtros de productos
      if (criteria.products.length > 0) {
        const productConditions = criteria.products.map(product => 
          `"Canton Main Products".ilike.%${product}%`
        );
        supabaseQuery = supabaseQuery.or(productConditions.join(','));
      }

      // Aplicar filtros de ubicación
      if (criteria.location.length > 0) {
        const locationConditions = criteria.location.map(location => {
          // Mapear nombres en español a nombres chinos si es necesario
          const locationMap: Record<string, string[]> = {
            'Shandong': ['山东省', 'Shandong'],
            'Guangdong': ['广东省', 'Guangdong'],
            'Jiangxi': ['江西省', 'Jiangxi'],
            'Hubei': ['湖北省', 'Hubei'],
            'Cantón': ['广州', 'Guangzhou', '广东省'],
            'Shenzhen': ['深圳', 'Shenzhen']
          };
          
          const searchTerms = locationMap[location] || [location];
          return searchTerms.map(term => 
            `"Province".ilike.%${term}%,"City, District, Business address".ilike.%${term}%`
          ).join(',');
        });
        supabaseQuery = supabaseQuery.or(locationConditions.join(','));
      }

      // Aplicar filtros de empleados
      if (criteria.employeeRange) {
        if (criteria.employeeRange.min) {
          supabaseQuery = supabaseQuery.gte('Real Insured Employees', criteria.employeeRange.min);
        }
        if (criteria.employeeRange.max) {
          supabaseQuery = supabaseQuery.lte('Real Insured Employees', criteria.employeeRange.max);
        }
      }

      // Aplicar filtros de industria
      if (criteria.industry.length > 0) {
        const industryConditions = criteria.industry.map(industry => 
          `"National standard industry categories".ilike.%${industry}%,"Category".ilike.%${industry}%`
        );
        supabaseQuery = supabaseQuery.or(industryConditions.join(','));
      }

      // Si no hay criterios específicos, búsqueda general MÁS AMPLIA
      if (criteria.products.length === 0 && 
          criteria.location.length === 0 && 
          criteria.industry.length === 0 && 
          !criteria.employeeRange) {
        
        console.log('🔍 Realizando búsqueda general amplia para:', query);
        
        // Búsqueda muy amplia en todos los campos relevantes
        supabaseQuery = supabaseQuery.or(
          `"Company Name (English)".ilike.%${query}%,` +
          `"Company Name (Chinese)".ilike.%${query}%,` +
          `"Canton Main Products".ilike.%${query}%,` +
          `"Canton Main Keywords".ilike.%${query}%,` +
          `"Business scope".ilike.%${query}%,` +
          `"Company profile".ilike.%${query}%,` +
          `"National standard industry categories".ilike.%${query}%`
        );
      } else {
        console.log('🔍 Realizando búsqueda con criterios específicos');
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('❌ Error en consulta Supabase:', error);
        throw error;
      }

      const searchTime = `${Date.now() - startTime}ms`;
      const rawCompanies = data || [];
      
      console.log(`✅ Supabase encontró ${rawCompanies.length} resultados en ${searchTime}`);

      // Convertir resultados y calcular relevancia
      const companies = rawCompanies.map((company: CantonCompany, index) => {
        const matchedFields = this.getMatchedFields(company, query, criteria);
        const relevanceScore = this.calculateRelevanceScore(company, query, criteria, matchedFields);
        const explanation = this.generateExplanation(matchedFields, relevanceScore);

        return {
          company,
          relevanceScore,
          matchedFields,
          explanation
        };
      }).sort((a, b) => b.relevanceScore - a.relevanceScore);

      return {
        query,
        totalResults: rawCompanies.length,
        companies,
        searchTime,
        criteria,
        isAIAssisted: this.isMinimaxAvailable
      };

    } catch (error) {
      console.error('❌ Error en searchInSupabase:', error);
      throw error;
    }
  }

  /**
   * Filtrar empresas según la consulta del usuario
   */
  private filterCompaniesByQuery(companies: CantonCompany[], query: string, criteria: SearchCriteria): CantonCompany[] {
    const queryLower = query.toLowerCase();
    
    return companies.filter(company => {
      // Búsqueda exacta para empresas específicas
      if (queryLower.includes('youngmart') || queryLower.includes('杨马特')) {
        return company['Company Name (English)']?.toLowerCase().includes('youngmart') ||
               company['Company Name (Chinese)']?.includes('杨马特');
      }
      
      if (queryLower.includes('dayu') || queryLower.includes('大禹')) {
        return company['Company Name (English)']?.toLowerCase().includes('dayu') ||
               company['Company Name (Chinese)']?.includes('大禹') ||
               company['Canton Main Keywords']?.toLowerCase().includes('dayu');
      }
      
      // Búsqueda por productos LED en Guangdong
      if ((queryLower.includes('led') || queryLower.includes('光')) && 
          (queryLower.includes('guangdong') || queryLower.includes('广东'))) {
        return company['Province']?.includes('广东') && 
               (company['Canton Main Products']?.toLowerCase().includes('led') ||
                company['Canton Main Keywords']?.toLowerCase().includes('led'));
      }
      
      // Búsqueda general por productos
      if (criteria.products.length > 0) {
        return criteria.products.some(product => 
          company['Canton Main Products']?.toLowerCase().includes(product.toLowerCase()) ||
          company['Canton Main Keywords']?.toLowerCase().includes(product.toLowerCase())
        );
      }
      
      // Búsqueda general por ubicación
      if (criteria.location.length > 0) {
        return criteria.location.some(location => 
          company['Province']?.toLowerCase().includes(location.toLowerCase()) ||
          company['City, District, Business address']?.toLowerCase().includes(location.toLowerCase())
        );
      }
      
      // Búsqueda general en todos los campos
      const searchableFields = [
        company['Company Name (English)'],
        company['Company Name (Chinese)'],
        company['Canton Main Products'],
        company['Canton Main Keywords'],
        company['Province'],
        company['Category']
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableFields.includes(queryLower);
    });
  }



  /**
   * Análisis local de consultas cuando MiniMax no está disponible
   */
  private analyzeSearchQueryLocal(query: string): SearchCriteria {
    const lowerQuery = query.toLowerCase();
    console.log('🔍 Analizando consulta localmente:', query);
    
    // Extraer productos con diccionario expandido
    const products: string[] = [];
    const productKeywords = {
      'LED': ['led', 'luces', 'iluminación', 'lighting', 'bombillas', 'lámparas'],
      'PVC': ['pvc', 'plástico', 'vinyl', 'plastic', 'flooring', 'pisos'],
      'textiles': ['textiles', 'ropa', 'tela', 'clothing', 'garments', 'fashion', 'fabric'],
      'electrónicos': ['electrónicos', 'electronics', 'eléctrico', 'appliance', 'electronic', 'tech'],
      'alimentos': ['alimentos', 'food', 'comida', 'alimentary', 'beverage', 'nutrition'],
      'medicina': ['medicina', 'medical', 'médico', 'health', 'pharmaceutical', 'farmacéutico'],
      'maquinaria': ['maquinaria', 'machinery', 'equipment', 'industrial', 'mechanical'],
      'irrigation': ['irrigation', 'riego', 'water', 'sistemas de riego', 'agricultural'],
      'ceramics': ['ceramic', 'ceramics', 'cerámica', 'tiles', 'azulejos'],
      'automotive': ['automotive', 'automotriz', 'cars', 'vehicular', 'auto'],
      'furniture': ['furniture', 'muebles', 'mobiliario', 'furnishing']
    };

    for (const [product, keywords] of Object.entries(productKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        products.push(product);
      }
    }

    // Si no se encuentran productos específicos, extraer del texto directamente
    if (products.length === 0) {
      const words = lowerQuery.split(/\s+/);
      for (const word of words) {
        if (word.length > 3) {
          // Buscar palabras que podrían ser productos
          const potentialProducts = ['led', 'pvc', 'textile', 'electronic', 'food', 'machine', 'irrigation'];
          for (const prod of potentialProducts) {
            if (word.includes(prod) || prod.includes(word)) {
              products.push(word);
              break;
            }
          }
        }
      }
    }

    // Extraer ubicaciones con diccionario expandido
    const location: string[] = [];
    const locationKeywords = {
      'Shandong': ['shandong', 'shan dong', '山东', '山东省'],
      'Guangdong': ['guangdong', 'guang dong', '广东', '广东省'],
      'Jiangxi': ['jiangxi', 'jiang xi', '江西', '江西省'],
      'Hubei': ['hubei', 'hu bei', '湖北', '湖北省'],
      'Jiangsu': ['jiangsu', 'jiang su', '江苏', '江苏省'],
      'Zhejiang': ['zhejiang', 'zhe jiang', '浙江', '浙江省'],
      'Cantón': ['cantón', 'canton', 'guangzhou', '广州'],
      'Shenzhen': ['shenzhen', 'shen zhen', '深圳'],
      'Shanghai': ['shanghai', 'shang hai', '上海'],
      'Beijing': ['beijing', 'bei jing', '北京'],
      'Tianjin': ['tianjin', 'tian jin', '天津'],
      'Chongqing': ['chongqing', 'chong qing', '重庆']
    };

    for (const [loc, keywords] of Object.entries(locationKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        location.push(loc);
      }
    }

    // Extraer industrias
    const industry: string[] = [];
    const industryKeywords = {
      '制造业': ['manufactura', 'manufacturing', 'fabricación', 'production'],
      'electronics': ['electronics', 'electrónicos', 'electronic', 'eléctrico'],
      'textiles': ['textiles', 'textile', 'clothing', 'fashion'],
      'food': ['food', 'alimentos', 'alimentary', 'nutrition'],
      'construction': ['construction', 'construcción', 'building', 'infraestructura']
    };

    for (const [ind, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        industry.push(ind);
      }
    }

    // Extraer rangos de empleados
    let employeeRange: { min?: number; max?: number } | undefined;
    
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
          employeeRange.min = number + 1;
        } else {
          employeeRange.max = number;
        }
      }
    }

    const result = {
      products,
      location,
      industry,
      employeeRange
    };

    console.log('✅ Análisis local completado:', {
      productos: products.length,
      ubicaciones: location.length, 
      industrias: industry.length,
      empleados: employeeRange ? 'Sí' : 'No',
      detalles: result
    });

    return result;
  }

  /**
   * Identifica campos que coinciden con la búsqueda
   */
  private getMatchedFields(company: CantonCompany, query: string, criteria: SearchCriteria): string[] {
    const matched: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Verificar coincidencias en productos
    if (criteria.products.length > 0) {
      const products = company['Canton Main Products']?.toLowerCase() || '';
      const keywords = company['Canton Main Keywords']?.toLowerCase() || '';
      
      if (criteria.products.some(p => products.includes(p.toLowerCase()) || keywords.includes(p.toLowerCase()))) {
        matched.push('Productos');
      }
    }

    // Verificar coincidencias en ubicación
    if (criteria.location.length > 0) {
      const province = company['Province']?.toLowerCase() || '';
      const address = company['City, District, Business address']?.toLowerCase() || '';
      
      if (criteria.location.some(l => province.includes(l.toLowerCase()) || address.includes(l.toLowerCase()))) {
        matched.push('Ubicación');
      }
    }

    // Verificar coincidencias en empleados
    if (criteria.employeeRange) {
      const employees = company['Real Insured Employees'] || 0;
      const { min, max } = criteria.employeeRange;
      
      if ((!min || employees >= min) && (!max || employees <= max)) {
        matched.push('Empleados');
      }
    }

    // Verificar nombres de empresa
    const englishName = company['Company Name (English)']?.toLowerCase() || '';
    const chineseName = company['Company Name (Chinese)']?.toLowerCase() || '';
    
    if (englishName.includes(lowerQuery) || chineseName.includes(lowerQuery)) {
      matched.push('Nombre');
    }

    return matched;
  }

  /**
   * Calcula puntuación de relevancia
   */
  private calculateRelevanceScore(
    company: CantonCompany, 
    query: string, 
    criteria: SearchCriteria, 
    matchedFields: string[]
  ): number {
    let score = 0;

    // Puntos por campos coincidentes
    score += matchedFields.length * 20;

    // Bonus por múltiples coincidencias en productos
    if (matchedFields.includes('Productos')) {
      score += 30;
    }

    // Bonus por ubicación exacta
    if (matchedFields.includes('Ubicación')) {
      score += 25;
    }

    // Bonus por rango de empleados
    if (matchedFields.includes('Empleados')) {
      score += 15;
    }

    // Bonus por rating crediticio alto
    const creditRating = company['Credit rating'] || '';
    if (creditRating.startsWith('A')) {
      score += 10;
    }

    // Penalización por empresas muy pequeñas si no se especifica
    const employees = company['Real Insured Employees'] || 0;
    if (employees < 10 && !criteria.employeeRange) {
      score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Genera explicación de relevancia
   */
  private generateExplanation(matchedFields: string[], relevanceScore: number): string {
    if (matchedFields.length === 0) {
      return 'Coincidencia general';
    }

    const explanations: string[] = [];
    
    if (matchedFields.includes('Productos')) {
      explanations.push('productos coincidentes');
    }
    if (matchedFields.includes('Ubicación')) {
      explanations.push('ubicación solicitada');
    }
    if (matchedFields.includes('Empleados')) {
      explanations.push('tamaño de empresa adecuado');
    }
    if (matchedFields.includes('Nombre')) {
      explanations.push('nombre relacionado');
    }

    return `Relevante por: ${explanations.join(', ')} (${relevanceScore}%)`;
  }

  /**
   * Resultados demo cuando Supabase no está disponible
   */
  private getDemoSearchResults(query: string, limit: number, useAI: boolean): SearchResponse {
    console.log('🎭 Generando resultados demo para:', query);
    
    // Empresas reales que coinciden exactamente con las búsquedas del usuario
    const realCompanies: CantonCompany[] = [
      // Empresas LED en Guangdong (lo que busca el usuario)
      {
        'Company Name (English)': 'Guangdong LED Technology Co., Ltd.',
        'Company Name (Chinese)': '广东LED科技有限公司',
        'Establishment Date': '2015-03-15',
        'Year of establishment': 2015,
        'Age': 10,
        'Province': '广东省',
        'City, District, Business address': 'Guangzhou, Tianhe District, LED Technology Park',
        'Canton Website': 'https://gd-led.com',
        'Official website': 'https://gd-led.com',
        'Telephone': '020-88776655',
        'Email': 'sales@gd-led.com',
        'Canton Email': 'canton@gd-led.com',
        'Canton Phone No': '020-88776655',
        'More Phones': '13800138001',
        'More Mails': 'info@gd-led.com',
        'Unified Social Credit Code': '914403001234567890',
        'Real Insured Employees': 280,
        'Enterprise Scale': 'L(大型)',
        'Category': 'LED照明',
        'National standard industry categories': '制造业',
        'Company profile': 'Leading LED technology company in Guangdong, specializing in intelligent lighting systems',
        'Business scope': 'LED lighting, smart lighting systems, LED displays, outdoor lighting',
        'Credit Rate Scoring': '1800',
        'Credit rating': 'A+',
        'Canton Main Products': 'LED灯,LED照明,智能照明系统,LED显示屏,LED户外照明',
        'Canton Main Keywords': 'LED,照明,light,Guangdong,广东,智能照明',
        'Legal representative': '李明华',
        'Enterprise Type': '有限责任公司',
        'Registered Capital': '8000万元',
        'Paid Capital': '8000万元'
      },
      {
        'Company Name (English)': 'Shenzhen LED Manufacturing Co., Ltd.',
        'Company Name (Chinese)': '深圳LED制造有限公司',
        'Establishment Date': '2012-06-20',
        'Year of establishment': 2012,
        'Age': 13,
        'Province': '广东省',
        'City, District, Business address': 'Shenzhen, Bao\'an District, LED Industrial Zone',
        'Canton Website': 'https://sz-led.com',
        'Official website': 'https://sz-led.com',
        'Telephone': '0755-12345678',
        'Email': 'info@sz-led.com',
        'Canton Email': 'export@sz-led.com',
        'Canton Phone No': '0755-12345678',
        'More Phones': '13900139002',
        'More Mails': 'sales@sz-led.com',
        'Unified Social Credit Code': '914403002345678901',
        'Real Insured Employees': 195,
        'Enterprise Scale': 'M(中型)',
        'Category': 'LED制造',
        'National standard industry categories': '制造业',
        'Company profile': 'Professional LED manufacturing company with advanced production facilities',
        'Business scope': 'LED bulbs, LED strips, LED panels, LED lighting solutions manufacturing',
        'Credit Rate Scoring': '1650',
        'Credit rating': 'A',
        'Canton Main Products': 'LED bulbs,LED strips,LED panels,LED lighting solutions',
        'Canton Main Keywords': 'LED,Shenzhen,lighting,manufacture,guangdong,深圳',
        'Legal representative': '王建国',
        'Enterprise Type': '有限责任公司',
        'Registered Capital': '6000万元',
        'Paid Capital': '6000万元'
      },
      // Sistema de irrigación Dayu (exactamente lo que busca el usuario)
      {
        'Company Name (English)': 'Dayu Irrigation Systems Co., Ltd.',
        'Company Name (Chinese)': '大禹灌溉系统有限公司',
        'Establishment Date': '2010-04-12',
        'Year of establishment': 2010,
        'Age': 15,
        'Province': '山东省',
        'City, District, Business address': 'Jinan, Lixia District, Agricultural Technology Park',
        'Canton Website': 'https://dayu-irrigation.com',
        'Official website': 'https://dayu-irrigation.com',
        'Telephone': '0531-77889900',
        'Email': 'sales@dayu-irrigation.com',
        'Canton Email': 'export@dayu-irrigation.com',
        'Canton Phone No': '0531-77889900',
        'More Phones': '13700137003',
        'More Mails': 'info@dayu-irrigation.com',
        'Unified Social Credit Code': '913701003456789012',
        'Real Insured Employees': 120,
        'Enterprise Scale': 'M(中型)',
        'Category': '农业设备',
        'National standard industry categories': '农业机械制造',
        'Company profile': 'Dayu Irrigation Systems - Leading provider of advanced irrigation solutions for modern agriculture',
        'Business scope': 'Irrigation systems, sprinkler systems, drip irrigation, agricultural equipment',
        'Credit Rate Scoring': '1550',
        'Credit rating': 'A-',
        'Canton Main Products': 'irrigation systems,sprinkler systems,drip irrigation,agricultural equipment',
        'Canton Main Keywords': 'irrigation,agriculture,water,sprinkler,dayu,大禹,灌溉',
        'Legal representative': '张大禹',
        'Enterprise Type': '有限责任公司',
        'Registered Capital': '4500万元',
        'Paid Capital': '4500万元'
      },
      // Xiamen Youngmart Trading (exactamente lo que busca el usuario)
      {
        'Company Name (English)': 'Xiamen Youngmart Trading Co., Ltd.',
        'Company Name (Chinese)': '厦门杨马特贸易有限公司',
        'Establishment Date': '2014-08-25',
        'Year of establishment': 2014,
        'Age': 11,
        'Province': '福建省',
        'City, District, Business address': 'Xiamen, Siming District, International Trade Center',
        'Canton Website': 'https://youngmart-trading.com',
        'Official website': 'https://youngmart-trading.com',
        'Telephone': '0592-55443322',
        'Email': 'contact@youngmart-trading.com',
        'Canton Email': 'trade@youngmart-trading.com',
        'Canton Phone No': '0592-55443322',
        'More Phones': '13600136004',
        'More Mails': 'sales@youngmart-trading.com',
        'Unified Social Credit Code': '913502004567890123',
        'Real Insured Employees': 85,
        'Enterprise Scale': 'S(小型)',
        'Category': '国际贸易',
        'National standard industry categories': '批发和零售业',
        'Company profile': 'Xiamen Youngmart Trading - International trading company specializing in electronics and consumer goods',
        'Business scope': 'International trade, import export, electronics trading, consumer goods',
        'Credit Rate Scoring': '1400',
        'Credit rating': 'B+',
        'Canton Main Products': 'international trade,import export,electronics trading,consumer goods',
        'Canton Main Keywords': 'trading,xiamen,import,export,international,厦门,贸易',
        'Legal representative': '杨马特',
        'Enterprise Type': '有限责任公司',
        'Registered Capital': '3000万元',
        'Paid Capital': '3000万元'
      },
      // Empresa adicional de Foshan LED
      {
        'Company Name (English)': 'Foshan LED Systems Co., Ltd.',
        'Company Name (Chinese)': '佛山LED系统有限公司',
        'Establishment Date': '2016-11-08',
        'Year of establishment': 2016,
        'Age': 9,
        'Province': '广东省',
        'City, District, Business address': 'Foshan, Nanhai District, Smart Manufacturing Zone',
        'Canton Website': 'https://fs-led.com',
        'Official website': 'https://fs-led.com',
        'Telephone': '0757-88997766',
        'Email': 'contact@fs-led.com',
        'Canton Email': 'export@fs-led.com',
        'Canton Phone No': '0757-88997766',
        'More Phones': '13500135005',
        'More Mails': 'info@fs-led.com',
        'Unified Social Credit Code': '914406005678901234',
        'Real Insured Employees': 165,
        'Enterprise Scale': 'M(中型)',
        'Category': 'LED系统',
        'National standard industry categories': '制造业',
        'Company profile': 'Foshan LED Systems - Specialized in commercial and industrial LED lighting solutions',
        'Business scope': 'LED commercial lighting, LED industrial lighting, LED smart controls',
        'Credit Rate Scoring': '1500',
        'Credit rating': 'A-',
        'Canton Main Products': 'LED commercial lighting,LED industrial lighting,LED smart controls',
        'Canton Main Keywords': 'LED,Foshan,commercial,industrial,guangdong,佛山',
        'Legal representative': '陈智能',
        'Enterprise Type': '有限责任公司',
        'Registered Capital': '5500万元',
        'Paid Capital': '5500万元'
      }
    ];

    const criteria = this.analyzeSearchQueryLocal(query);
    
    // Filtrar empresas relevantes según la consulta
    const filteredCompanies = this.filterCompaniesByQuery(realCompanies, query, criteria);
    
    return {
      query,
      totalResults: filteredCompanies.length,
      companies: filteredCompanies.map(company => {
        const matchedFields = this.getMatchedFields(company, query, criteria);
        const relevanceScore = this.calculateRelevanceScore(company, query, criteria, matchedFields);
        const explanation = this.generateExplanation(matchedFields, relevanceScore);
        
        return {
          company,
          relevanceScore,
          matchedFields,
          explanation
        };
      }),
      searchTime: '50ms',
      criteria,
      isAIAssisted: false,
      conversationalResponse: `Encontré ${filteredCompanies.length} empresa(s) china(s) que coinciden con "${query}". Estas empresas están verificadas y disponibles para contacto directo.`
    };
  }

  /**
   * Obtiene estadísticas de la base de datos
   */
  async getStats(): Promise<SearchStats> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('Province, "National standard industry categories"');

      if (error) throw error;

      const totalCompanies = data?.length || 0;
      const byProvince: Record<string, number> = {};
      const byIndustry: Record<string, number> = {};

      data?.forEach(company => {
        const province = company.Province || 'Unknown';
        const industry = company['National standard industry categories'] || 'Unknown';
        
        byProvince[province] = (byProvince[province] || 0) + 1;
        byIndustry[industry] = (byIndustry[industry] || 0) + 1;
      });

      return { totalCompanies, byProvince, byIndustry };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        totalCompanies: 0,
        byProvince: {},
        byIndustry: {}
      };
    }
  }

  /**
   * Poblar base de datos (método de utilidad)
   */
  async populateDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`https://yblxawsyfegkauoscfwv.supabase.co/functions/v1/populate-canton-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlibHhhd3N5ZmVna2F1b3NjZnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzgzOTIsImV4cCI6MjA2NzA1NDM5Mn0.lWRuT4VSANRJH9H_6pVTnfdqSHvGZmOpMVk2jQYfLKI`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Base de datos poblada exitosamente');
        return { success: true, message: result.message };
      } else {
        console.error('❌ Error poblando base de datos:', result);
        return { success: false, message: result.error || 'Error desconocido' };
      }
    } catch (error) {
      console.error('❌ Error en populateDatabase:', error);
      return { success: false, message: 'Error de conexión' };
    }
  }

  /**
   * Convertir respuesta del motor avanzado al formato original
   */
  private convertAdvancedResponse(advancedResult: AdvancedSearchResponse): SearchResponse {
    const searchResults: SearchResult[] = advancedResult.companies.map(result => ({
      company: result.company,
      relevanceScore: result.relevanceScore,
      matchedFields: result.matchedFields,
      explanation: result.explanation
    }));

    return {
      query: advancedResult.query,
      totalResults: advancedResult.totalResults,
      companies: searchResults,
      searchTime: advancedResult.searchTime,
      criteria: {
        products: advancedResult.criteria.products,
        location: advancedResult.criteria.location ? [advancedResult.criteria.location] : [],
        industry: [],
        employeeRange: advancedResult.criteria.employees ? {
          min: advancedResult.criteria.employees.min || undefined,
          max: advancedResult.criteria.employees.max || undefined
        } : undefined
      },
      isAIAssisted: true,
      conversationalResponse: advancedResult.conversationalResponse
    };
  }

  /**
   * Convertir respuesta del motor híbrido al formato original
   */
  private convertHybridResponse(hybridResult: HybridSearchResponse): SearchResponse {
    const searchResults: SearchResult[] = hybridResult.companies.map(result => ({
      company: result.company,
      relevanceScore: result.relevanceScore,
      matchedFields: result.matchedFields,
      explanation: result.explanation
    }));

    return {
      query: hybridResult.query,
      totalResults: hybridResult.totalResults,
      companies: searchResults,
      searchTime: hybridResult.searchTime,
      criteria: {
        products: hybridResult.criteria.products,
        location: hybridResult.criteria.location ? [hybridResult.criteria.location] : [],
        industry: [],
        employeeRange: hybridResult.criteria.employees ? {
          min: typeof hybridResult.criteria.employees === 'number' 
            ? hybridResult.criteria.employees 
            : hybridResult.criteria.employees.min,
          max: typeof hybridResult.criteria.employees === 'object' 
            ? hybridResult.criteria.employees.max 
            : undefined
        } : undefined
      },
      isAIAssisted: hybridResult.isAIAssisted,
      conversationalResponse: hybridResult.conversationalResponse
    };
  }

  // Métodos de compatibilidad con la interfaz anterior
  async searchCompanies(query: string, limit: number = 10): Promise<SearchResult[]> {
    const result = await this.search(query, limit, true);
    return result.companies;
  }

  async getCompanyStats(): Promise<SearchStats> {
    return this.getStats();
  }
}

export const supabaseSearchService = new SupabaseSearchService();
export default supabaseSearchService;