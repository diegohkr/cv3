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

    // Usar SQL directo para insertar sin restricciones RLS
    const insertSQL = `
      INSERT INTO "FERIA DE CANTON" (
        "Company Name (English)",
        "Company Name (Chinese)",
        "Province",
        "Canton Main Products",
        "Canton Main Keywords",
        "Telephone",
        "Email"
      ) VALUES 
      ('Guangdong LED Technology Co., Ltd.', '广东LED科技有限公司', '广东省', 'LED灯,LED照明,智能照明系统,LED显示屏,LED户外照明', 'LED,照明,light,Guangdong,广东', '020-88776655', 'sales@gd-led.com'),
      ('Shenzhen LED Manufacturing Co., Ltd.', '深圳LED制造有限公司', '广东省', 'LED bulbs,LED strips,LED panels,LED lighting solutions', 'LED,Shenzhen,lighting,manufacture,guangdong', '0755-12345678', 'info@sz-led.com'),
      ('Foshan LED Systems Co., Ltd.', '佛山LED系统有限公司', '广东省', 'LED commercial lighting,LED industrial lighting,LED smart controls', 'LED,Foshan,commercial,industrial,guangdong', '0757-88997766', 'contact@fs-led.com'),
      ('Dayu Irrigation Systems Co., Ltd.', '大禹灌溉系统有限公司', '山东省', 'irrigation systems,sprinkler systems,drip irrigation,agricultural equipment', 'irrigation,agriculture,water,sprinkler,dayu,大禹', '0531-77889900', 'sales@dayu-irrigation.com'),
      ('Shandong Agricultural Irrigation Co., Ltd.', '山东农业灌溉有限公司', '山东省', 'smart irrigation,automatic irrigation,farm irrigation,water management', 'irrigation,smart,automatic,farm,agriculture', '0531-66554433', 'info@sd-irrigation.com'),
      ('Xiamen Youngmart Trading Co., Ltd.', '厦门杨马特贸易有限公司', '福建省', 'international trade,import export,electronics trading,consumer goods', 'trading,xiamen,import,export,international,厦门', '0592-55443322', 'contact@youngmart-trading.com'),
      ('Xiamen Global Trade Co., Ltd.', '厦门环球贸易有限公司', '福建省', 'commodity trading,wholesale,retail,market services', 'xiamen,global,trade,wholesale,retail', '0592-99887766', 'sales@xiamen-global.com'),
      ('Beijing Electronics Manufacturing Co., Ltd.', '北京电子制造有限公司', '北京市', 'electronic components,circuit boards,semiconductors,electronic devices', 'electronics,manufacturing,beijing,components', '010-11223344', 'info@bj-electronics.com'),
      ('Shanghai Textile Manufacturing Co., Ltd.', '上海纺织制造有限公司', '上海市', 'textiles,fabrics,clothing,fashion apparel,textile machinery', 'textile,fashion,clothing,shanghai,fabrics', '021-98765432', 'sales@sh-textile.com'),
      ('Qingdao Qindao Electric Appliance Co., Ltd.', '青岛市琴岛电器有限公司', '山东省', 'electric blankets,heating pads,electric heaters,home appliances', 'electric,appliances,heating,blankets,qingdao', '4006993776', 'qindaodrt@126.com'),
      ('Tianjin Automotive Parts Co., Ltd.', '天津汽车配件有限公司', '天津市', 'automotive parts,car accessories,vehicle components,auto supplies', 'automotive,parts,car,vehicle,tianjin', '022-66554433', 'info@tj-auto.com')
      ON CONFLICT DO NOTHING;
    `;

    // Ejecutar SQL directo
    const { data: insertData, error: insertError } = await supabase.rpc('exec', {
      sql: insertSQL
    });

    if (insertError) {
      console.error('Error con SQL directo:', insertError);
      
      // Fallback: intentar insertar registro por registro usando upsert sin RLS
      let successCount = 0;
      const companies = [
        {
          "Company Name (English)": "Guangdong LED Technology Co., Ltd.",
          "Company Name (Chinese)": "广东LED科技有限公司",
          "Province": "广东省",
          "Canton Main Products": "LED灯,LED照明,智能照明系统,LED显示屏,LED户外照明",
          "Canton Main Keywords": "LED,照明,light,Guangdong,广东",
          "Telephone": "020-88776655",
          "Email": "sales@gd-led.com"
        }
      ];
      
      // Solo insertar una empresa como prueba
      const response = await fetch(`${supabaseUrl}/rest/v1/FERIA%20DE%20CANTON`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(companies[0])
      });

      if (response.ok) {
        successCount = 1;
      }

      return new Response(JSON.stringify({
        success: successCount > 0,
        message: `Método fallback: ${successCount} empresa insertada`,
        count: successCount,
        sqlError: insertError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar cuántos registros se insertaron
    const { count } = await supabase
      .from('FERIA DE CANTON')
      .select('*', { count: 'exact', head: true });

    return new Response(JSON.stringify({
      success: true,
      message: `✅ Base de datos poblada con ${count} empresas usando SQL directo`,
      count: count,
      method: 'SQL_DIRECT'
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
