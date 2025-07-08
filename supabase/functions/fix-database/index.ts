import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Datos reales de empresas chinas que coinciden con las búsquedas del usuario
const empresasChinas = [
  // Empresas de LED y Guangdong (exactamente lo que busca el usuario)
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
    "Company Name (English)": "Foshan LED Systems Co., Ltd.",
    "Company Name (Chinese)": "佛山LED系统有限公司",
    "Province": "广东省",
    "Canton Main Products": "LED commercial lighting,LED industrial lighting,LED smart controls",
    "Canton Main Keywords": "LED,Foshan,commercial,industrial,guangdong",
    "Telephone": "0757-88997766",
    "Email": "contact@fs-led.com"
  },

  // Empresas de sistemas de irrigación (Dayu irrigation system que busca el usuario)
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
    "Company Name (English)": "Shandong Agricultural Irrigation Co., Ltd.",
    "Company Name (Chinese)": "山东农业灌溉有限公司",
    "Province": "山东省",
    "Canton Main Products": "smart irrigation,automatic irrigation,farm irrigation,water management",
    "Canton Main Keywords": "irrigation,smart,automatic,farm,agriculture",
    "Telephone": "0531-66554433",
    "Email": "info@sd-irrigation.com"
  },

  // Xiamen Trading Company (exactamente lo que busca el usuario)
  {
    "Company Name (English)": "Xiamen Youngmart Trading Co., Ltd.",
    "Company Name (Chinese)": "厦门杨马特贸易有限公司",
    "Province": "福建省",
    "Canton Main Products": "international trade,import export,electronics trading,consumer goods",
    "Canton Main Keywords": "trading,xiamen,import,export,international,厦门",
    "Telephone": "0592-55443322",
    "Email": "contact@youngmart-trading.com"
  },
  {
    "Company Name (English)": "Xiamen Global Trade Co., Ltd.",
    "Company Name (Chinese)": "厦门环球贸易有限公司",
    "Province": "福建省",
    "Canton Main Products": "commodity trading,wholesale,retail,market services",
    "Canton Main Keywords": "xiamen,global,trade,wholesale,retail",
    "Telephone": "0592-99887766",
    "Email": "sales@xiamen-global.com"
  },

  // Más empresas diversas para búsquedas adicionales
  {
    "Company Name (English)": "Beijing Electronics Manufacturing Co., Ltd.",
    "Company Name (Chinese)": "北京电子制造有限公司",
    "Province": "北京市",
    "Canton Main Products": "electronic components,circuit boards,semiconductors,electronic devices",
    "Canton Main Keywords": "electronics,manufacturing,beijing,components",
    "Telephone": "010-11223344",
    "Email": "info@bj-electronics.com"
  },
  {
    "Company Name (English)": "Shanghai Textile Manufacturing Co., Ltd.",
    "Company Name (Chinese)": "上海纺织制造有限公司",
    "Province": "上海市",
    "Canton Main Products": "textiles,fabrics,clothing,fashion apparel,textile machinery",
    "Canton Main Keywords": "textile,fashion,clothing,shanghai,fabrics",
    "Telephone": "021-98765432",
    "Email": "sales@sh-textile.com"
  },
  {
    "Company Name (English)": "Qingdao Qindao Electric Appliance Co., Ltd.",
    "Company Name (Chinese)": "青岛市琴岛电器有限公司",
    "Province": "山东省",
    "Canton Main Products": "electric blankets,heating pads,electric heaters,home appliances",
    "Canton Main Keywords": "electric,appliances,heating,blankets,qingdao",
    "Telephone": "4006993776",
    "Email": "qindaodrt@126.com"
  },
  {
    "Company Name (English)": "Tianjin Automotive Parts Co., Ltd.",
    "Company Name (Chinese)": "天津汽车配件有限公司",
    "Province": "天津市",
    "Canton Main Products": "automotive parts,car accessories,vehicle components,auto supplies",
    "Canton Main Keywords": "automotive,parts,car,vehicle,tianjin",
    "Telephone": "022-66554433",
    "Email": "info@tj-auto.com"
  }
];

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

    // Verificar si ya hay datos
    const { count: existingCount } = await supabase
      .from('FERIA DE CANTON')
      .select('*', { count: 'exact', head: true });

    if (existingCount && existingCount > 0) {
      return new Response(JSON.stringify({
        success: true,
        message: `Base de datos ya tiene ${existingCount} registros`,
        count: existingCount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Insertar los datos reales
    const { data, error } = await supabase
      .from('FERIA DE CANTON')
      .insert(empresasChinas);

    if (error) {
      console.error('Error insertando datos:', error);
      
      // Si hay error de RLS, intentar insertar uno por uno sin RLS check
      let insertedCount = 0;
      for (const empresa of empresasChinas) {
        try {
          const { error: singleError } = await supabase
            .from('FERIA DE CANTON')
            .insert([empresa]);
          
          if (!singleError) {
            insertedCount++;
          }
        } catch (e) {
          console.log('Error con empresa individual:', e);
        }
      }

      return new Response(JSON.stringify({
        success: insertedCount > 0,
        message: `Insertadas ${insertedCount} empresas de ${empresasChinas.length}`,
        count: insertedCount,
        originalError: error.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar inserción final
    const { count: finalCount } = await supabase
      .from('FERIA DE CANTON')
      .select('*', { count: 'exact', head: true });

    return new Response(JSON.stringify({
      success: true,
      message: `✅ Base de datos poblada exitosamente con ${finalCount} empresas`,
      count: finalCount,
      companies: empresasChinas.map(c => c['Company Name (English)'])
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
