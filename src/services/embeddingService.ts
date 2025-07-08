// services/embeddingService.ts
import { openai } from "./openaiClient";
import { supabase } from "../lib/supabase";

export interface EmbeddingResult {
  embedding: number[];
  text: string;
  model: string;
}

export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  console.log('🧮 Generando embedding con text-embedding-3-large...');
  
  try {
    const { data } = await openai.embeddings.create({
      model: "text-embedding-3-large",  // última generación, máxima calidad
      input: text,
      encoding_format: "float"
    });

    return {
      embedding: data[0].embedding,
      text: text,
      model: "text-embedding-3-large"
    };

  } catch (error) {
    console.error('❌ Error generando embedding:', error);
    throw error;
  }
}

export async function generateQueryEmbedding(query: string): Promise<number[]> {
  // Expandir consulta para mejor matching semántico
  const expandedQuery = await expandQuery(query);
  const result = await generateEmbedding(expandedQuery);
  return result.embedding;
}

async function expandQuery(query: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content: `
            Expande esta consulta de búsqueda con términos relacionados y sinónimos 
            para mejorar la búsqueda semántica de empresas chinas.
            
            Incluye:
            - Sinónimos en inglés y chino
            - Términos de industria relacionados
            - Variaciones del producto/servicio
            - NO cambies el significado original
            
            Devuelve solo el texto expandido, sin explicaciones.
          `
        },
        {
          role: "user",
          content: `Expande esta consulta: "${query}"`
        }
      ]
    });

    const expanded = completion.choices[0].message.content || query;
    console.log('📈 Consulta expandida:', expanded);
    return expanded;

  } catch (error) {
    console.error('❌ Error expandiendo consulta:', error);
    return query;
  }
}

export async function searchBySimilarity(
  queryEmbedding: number[], 
  limit: number = 10,
  threshold: number = 0.7
) {
  console.log('🔍 Buscando por similitud semántica...');
  
  try {
    // Búsqueda por similitud de vectores en Supabase
    const { data, error } = await supabase
      .rpc('match_companies', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit
      });

    if (error) {
      console.error('❌ Error en búsqueda vectorial:', error);
      return [];
    }

    console.log(`✅ Encontradas ${data?.length || 0} empresas por similitud`);
    return data || [];

  } catch (error) {
    console.error('❌ Error en búsqueda semántica:', error);
    return [];
  }
}

// Función para crear/actualizar embeddings de empresas existentes
export async function updateCompanyEmbeddings() {
  console.log('🔄 Actualizando embeddings de empresas...');
  
  try {
    // Obtener todas las empresas sin embedding
    const { data: companies } = await supabase
      .from('FERIA DE CANTON')
      .select('*')
      .is('embedding', null)
      .limit(50); // Procesar en lotes

    if (!companies?.length) {
      console.log('✅ Todas las empresas ya tienen embeddings');
      return;
    }

    for (const company of companies) {
      try {
        // Crear texto combinado para embedding
        const combinedText = [
          company['Company Name (English)'],
          company['Company Name (Chinese)'],
          company['Canton Main Products'],
          company['Canton Main Keywords'],
          company['Province'],
          company['Category']
        ].filter(Boolean).join(' ');

        // Generar embedding
        const result = await generateEmbedding(combinedText);
        
        // Actualizar en base de datos
        await supabase
          .from('FERIA DE CANTON')
          .update({ 
            embedding: result.embedding,
            embedding_text: combinedText
          })
          .eq('id', company.id);

        console.log(`✅ Embedding actualizado para: ${company['Company Name (English)']}`);
        
        // Pequeña pausa para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error con empresa ${company.id}:`, error);
      }
    }

    console.log('🎉 Actualización de embeddings completada');

  } catch (error) {
    console.error('❌ Error actualizando embeddings:', error);
  }
}

// Función SQL para crear la función de matching en Supabase
export const createMatchingFunction = `
CREATE OR REPLACE FUNCTION match_companies (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id bigint,
  "Company Name (English)" text,
  "Company Name (Chinese)" text,
  "Province" text,
  "Canton Main Products" text,
  "Canton Main Keywords" text,
  "Telephone" text,
  "Email" text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    "FERIA DE CANTON".id,
    "FERIA DE CANTON"."Company Name (English)",
    "FERIA DE CANTON"."Company Name (Chinese)",
    "FERIA DE CANTON"."Province",
    "FERIA DE CANTON"."Canton Main Products", 
    "FERIA DE CANTON"."Canton Main Keywords",
    "FERIA DE CANTON"."Telephone",
    "FERIA DE CANTON"."Email",
    1 - ("FERIA DE CANTON".embedding <=> query_embedding) AS similarity
  FROM "FERIA DE CANTON"
  WHERE 1 - ("FERIA DE CANTON".embedding <=> query_embedding) > match_threshold
  ORDER BY "FERIA DE CANTON".embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
`;
