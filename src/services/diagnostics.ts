// services/diagnostics.ts
import { supabase } from "../lib/supabase";
import { openai } from "./openaiClient";

export class SystemDiagnostics {
  
  /**
   * Diagnóstico completo del sistema de búsqueda
   */
  async runFullDiagnostic(): Promise<any> {
    console.log('🔧 Iniciando diagnóstico completo del sistema...');
    
    const results = {
      supabase: await this.testSupabaseConnection(),
      openai: await this.testOpenAIConnection(),
      rls: await this.testRLSPolicies(),
      sampleData: await this.testSampleQueries()
    };
    
    console.log('📊 Resultados del diagnóstico:', results);
    return results;
  }

  /**
   * Test de conectividad con Supabase
   */
  async testSupabaseConnection(): Promise<any> {
    try {
      console.log('🔍 Probando conexión con Supabase...');
      
      // Test básico de conexión
      const { data, error, count } = await supabase
        .from('FERIA DE CANTON')
        .select('*', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        return {
          status: 'error',
          message: `Error de conexión: ${error.message}`,
          details: error
        };
      }

      return {
        status: 'success',
        message: `Conexión exitosa. Total de registros: ${count}`,
        totalRecords: count
      };

    } catch (error: any) {
      return {
        status: 'error',
        message: `Excepción en conexión: ${error.message}`,
        details: error
      };
    }
  }

  /**
   * Test de conectividad con OpenAI
   */
  async testOpenAIConnection(): Promise<any> {
    try {
      console.log('🤖 Probando conexión con OpenAI GPT-4o...');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "user", content: "Responde solo 'OK' para confirmar conexión" }
        ],
        max_tokens: 10,
        temperature: 0
      });

      const response = completion.choices[0].message.content;
      
      return {
        status: 'success',
        message: `Conexión exitosa con GPT-4o`,
        response: response,
        usage: completion.usage
      };

    } catch (error: any) {
      return {
        status: 'error',
        message: `Error de conexión OpenAI: ${error.message}`,
        details: error
      };
    }
  }

  /**
   * Test de políticas RLS
   */
  async testRLSPolicies(): Promise<any> {
    try {
      console.log('🔐 Verificando políticas RLS...');
      
      // Intentar leer algunos registros específicos
      const { data, error } = await supabase
        .from('FERIA DE CANTON')
        .select(`
          "Company Name (English)",
          "Company Name (Chinese)", 
          "Province",
          "Canton Main Products"
        `)
        .limit(3);

      if (error) {
        return {
          status: 'rls_blocked',
          message: `Políticas RLS bloquean lectura: ${error.message}`,
          details: error
        };
      }

      if (!data || data.length === 0) {
        return {
          status: 'no_data',
          message: 'Conexión exitosa pero sin datos (tabla vacía o filtros RLS)',
          data: data
        };
      }

      return {
        status: 'success',
        message: `RLS permite lectura. ${data.length} registros obtenidos`,
        sampleData: data
      };

    } catch (error: any) {
      return {
        status: 'error',
        message: `Error verificando RLS: ${error.message}`,
        details: error
      };
    }
  }

  /**
   * Test de consultas de muestra
   */
  async testSampleQueries(): Promise<any> {
    try {
      console.log('📝 Probando consultas de muestra...');
      
      const testQueries = [
        'DECNO',
        'Dayu irrigation',
        'LED companies',
        'empresas de iluminación'
      ];
      
      const results = [];
      
      for (const query of testQueries) {
        try {
          const { data } = await supabase
            .from('FERIA DE CANTON')
            .select(`
              "Company Name (English)",
              "Canton Main Products"
            `)
            .or(`"Company Name (English)".ilike.%${query}%,"Canton Main Products".ilike.%${query}%`)
            .limit(2);
          
          results.push({
            query,
            status: 'success',
            results: data?.length || 0,
            sample: data?.[0] || null
          });
        } catch (error: any) {
          results.push({
            query,
            status: 'error',
            error: error.message
          });
        }
      }
      
      return {
        status: 'completed',
        message: `Probadas ${testQueries.length} consultas`,
        results
      };

    } catch (error: any) {
      return {
        status: 'error',
        message: `Error en consultas de muestra: ${error.message}`,
        details: error
      };
    }
  }

  /**
   * Diagnóstico rápido para debugging
   */
  async quickCheck(): Promise<string> {
    const supabaseTest = await this.testSupabaseConnection();
    const openaiTest = await this.testOpenAIConnection();
    
    let status = "🚀 SISTEMA OPERATIVO:\n";
    status += `📊 Supabase: ${supabaseTest.status === 'success' ? '✅' : '❌'} ${supabaseTest.message}\n`;
    status += `🤖 OpenAI GPT-4o: ${openaiTest.status === 'success' ? '✅' : '❌'} ${openaiTest.message}\n`;
    
    return status;
  }
}

export const systemDiagnostics = new SystemDiagnostics();
