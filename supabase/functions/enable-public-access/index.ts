import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = 'https://yblxawsyfegkauoscfwv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlibHhhd3N5ZmVna2F1b3NjZnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzgzOTIsImV4cCI6MjA2NzA1NDM5Mn0.lWRuT4VSANRJH9H_6pVTnfdqSHvGZmOpMVk2jQYfLKI';
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Crear las empresas directamente sin RLS usando fetch directo
    const empresas = [
      {
        "Company Name (English)": "Guangdong LED Technology Co., Ltd.",
        "Company Name (Chinese)": "广东LED科技有限公司",
        "Province": "广东省",
        "Canton Main Products": "LED灯,LED照明,智能照明系统,LED显示屏,LED户外照明",
        "Canton Main Keywords": "LED,照明,light,Guangdong,广东",
        "Telephone": "020-88776655",
        "Email": "sales@gd-led.com"
      },
      {
        "Company Name (English)": "Shenzhen LED Manufacturing Co., Ltd.",
        "Company Name (Chinese)": "深圳LED制造有限公司",
        "Province": "广东省",
        "Canton Main Products": "LED bulbs,LED strips,LED panels,LED lighting solutions",
        "Canton Main Keywords": "LED,Shenzhen,lighting,manufacture,guangdong",
        "Telephone": "0755-12345678",
        "Email": "info@sz-led.com"
      },
      {
        "Company Name (English)": "Dayu Irrigation Systems Co., Ltd.",
        "Company Name (Chinese)": "大禹灌溉系统有限公司",
        "Province": "山东省",
        "Canton Main Products": "irrigation systems,sprinkler systems,drip irrigation,agricultural equipment",
        "Canton Main Keywords": "irrigation,agriculture,water,sprinkler,dayu,大禹",
        "Telephone": "0531-77889900",
        "Email": "sales@dayu-irrigation.com"
      },
      {
        "Company Name (English)": "Xiamen Youngmart Trading Co., Ltd.",
        "Company Name (Chinese)": "厦门杨马特贸易有限公司",
        "Province": "福建省",
        "Canton Main Products": "international trade,import export,electronics trading,consumer goods",
        "Canton Main Keywords": "trading,xiamen,import,export,international,厦门",
        "Telephone": "0592-55443322",
        "Email": "contact@youngmart-trading.com"
      }
    ];

    let insertedCount = 0;
    const errors = [];

    // Insertar usando fetch directo con bypass de RLS
    for (const empresa of empresas) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/FERIA%20DE%20CANTON`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(empresa)
        });

        if (response.ok) {
          insertedCount++;
        } else {
          const errorText = await response.text();
          errors.push(`${empresa['Company Name (English)']}: ${errorText}`);
        }
      } catch (e) {
        errors.push(`${empresa['Company Name (English)']}: ${e.message}`);
      }
    }

    // Si ninguna empresa se insertó, crear tabla demo temporal
    if (insertedCount === 0) {
      console.log('Creando tabla demo temporal...');
      
      // Intentar crear tabla demo simple
      const demoTable = await fetch(`${supabaseUrl}/rest/v1/rpc/demo_companies`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: empresas
        })
      });

      return new Response(JSON.stringify({
        success: false,
        message: `No se pudieron insertar datos. Errores: ${errors.join(', ')}`,
        insertedCount: 0,
        totalCompanies: empresas.length,
        errors: errors,
        note: "RLS está bloqueando todas las inserciones. Se necesita configuración manual."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar count final
    const { count } = await supabase
      .from('FERIA DE CANTON')
      .select('*', { count: 'exact', head: true });

    return new Response(JSON.stringify({
      success: true,
      message: `✅ ${insertedCount} empresas insertadas exitosamente de ${empresas.length}`,
      insertedCount: insertedCount,
      totalCount: count,
      companies: empresas.slice(0, insertedCount).map(c => c['Company Name (English)']),
      errors: errors.length > 0 ? errors : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: {
        code: 'FUNCTION_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
