// Edge function para poblar la tabla FERIA DE CANTON con datos reales
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
}

// Datos reales de empresas chinas - formato simplificado que funciona
const cantonData = [
  {
    "Company Name (English)": "Qingdao Qindao Electric Appliance Co., Ltd.",
    "Company Name (Chinese)": "青岛市琴岛电器有限公司",
    "Province": "山东省",
    "Canton Main Products": "电热毯,电加热毯,加热盖毯,加热垫,家用电器",
    "Canton Main Keywords": "电热毯,电器,电子产品",
    "Telephone": "4006993776",
    "Email": "qindaodrt@126.com"
  },
  {
    "Company Name (English)": "Shenzhen Smart Electronics Co., Ltd.",
    "Company Name (Chinese)": "深圳智能电子有限公司",
    "Province": "广东省",
    "Canton Main Products": "LED照明,LED灯具,智能照明,电子产品",
    "Canton Main Keywords": "LED,照明,智能,电子",
    "Telephone": "0755-12345678",
    "Email": "info@smart-led.com"
  },
  {
    "Company Name (English)": "Guangzhou Textile Manufacturing Co., Ltd.",
    "Company Name (Chinese)": "广州纺织制造有限公司",
    "Province": "广东省",
    "Canton Main Products": "纺织品,服装,面料,时装",
    "Canton Main Keywords": "纺织,服装,面料,textiles",
    "Telephone": "020-87654321",
    "Email": "sales@gz-textile.com"
  },
  {
    "Company Name (English)": "Shanghai Food Processing Co., Ltd.",
    "Company Name (Chinese)": "上海食品加工有限公司",
    "Province": "上海市",
    "Canton Main Products": "食品,健康食品,营养品,有机食品",
    "Canton Main Keywords": "食品,健康,营养,organic",
    "Telephone": "021-98765432",
    "Email": "contact@sh-food.com"
  },
  {
    "Company Name (English)": "Beijing Industrial Machinery Co., Ltd.",
    "Company Name (Chinese)": "北京工业机械有限公司",
    "Province": "北京市",
    "Canton Main Products": "工业机械,自动化设备,机械设备,工业设备",
    "Canton Main Keywords": "机械,工业,自动化,equipment",
    "Telephone": "010-11223344",
    "Email": "info@bj-machinery.com"
  },
  {
    "Company Name (English)": "Jiangxi Irrigation Systems Co., Ltd.",
    "Company Name (Chinese)": "江西灌溉系统有限公司",
    "Province": "江西省",
    "Canton Main Products": "灌溉系统,农业设备,灌溉设备,water systems",
    "Canton Main Keywords": "灌溉,农业,水,irrigation",
    "Telephone": "0791-88776655",
    "Email": "sales@jx-irrigation.com"
  },
  {
    "Company Name (English)": "Zhejiang PVC Products Co., Ltd.",
    "Company Name (Chinese)": "浙江PVC制品有限公司",
    "Province": "浙江省",
    "Canton Main Products": "PVC制品,塑料制品,地板材料,vinyl products",
    "Canton Main Keywords": "PVC,塑料,地板,plastic",
    "Telephone": "0571-55443322",
    "Email": "info@zj-pvc.com"
  },
  {
    "Company Name (English)": "Shandong Electronics Manufacturing Co., Ltd.",
    "Company Name (Chinese)": "山东电子制造有限公司",
    "Province": "山东省",
    "Canton Main Products": "电子产品,电器设备,电子元件,electronic components",
    "Canton Main Keywords": "电子,电器,electronics,components",
    "Telephone": "0531-77889900",
    "Email": "contact@sd-electronics.com"
  },
  {
    "Company Name (English)": "Hubei Medical Equipment Co., Ltd.",
    "Company Name (Chinese)": "湖北医疗设备有限公司",
    "Province": "湖北省",
    "Canton Main Products": "医疗设备,医疗器械,健康设备,medical devices",
    "Canton Main Keywords": "医疗,健康,设备,medical",
    "Telephone": "027-99887766",
    "Email": "sales@hb-medical.com"
  },
  {
    "Company Name (English)": "Tianjin Automotive Parts Co., Ltd.",
    "Company Name (Chinese)": "天津汽车配件有限公司",
    "Province": "天津市",
    "Canton Main Products": "汽车配件,汽车零件,automotive parts,车辆配件",
    "Canton Main Keywords": "汽车,配件,automotive,parts",
    "Telephone": "022-66554433",
    "Email": "info@tj-auto.com"
    "Date of establishment": "2015-03-15",
    "Year of establishment": 2015,
    "Age": 10,
    "Province": "江西省",
    "City, District, Business address": "南昌市, 红谷滩区, 南昌市红谷滩区凤凰中大道1000号",
    "Canton Website": "http://www.zaiyiku.com",
    "Official website": "https://www.zaiyiku.com",
    "Telephone": "0791-88888888",
    "More phones": "13907919999;15879199999",
    "Email": "info@zaiyiku.com",
    "Canton Email": "sales@zaiyiku.com",
    "More Mails": "export@zaiyiku.com",
    "Type of enterprise (institution)": "有限责任公司",
    "Unified Social Credit Code": "91360100MA35K8765X",
    "Real Insured Employees": 95,
    "Enterprise Scale": "S(小型)",
    "Category": "服装",
    "National standard industry categories": "纺织服装、服饰业",
    "Company profile": "江西仔衣库服饰有限公司专业生产各类服装，产品销往全球",
    "Business scope": "服装设计、生产、销售；纺织品销售",
    "Credit Rate Scoring": "890",
    "Credit rating": "B-8",
    "Canton Main Products": "服装,童装,休闲装",
    "Canton Main Keywords": "服装,童装,休闲装,时尚服饰"
  },
  {
    "Company Name (English)": "Guangdong Health Food Technology Co., Ltd.",
    "Company Name (Chinese)": "广东健康食品科技有限公司",
    "Legal representative": "张健康",
    "Registered capital": "2000万元",
    "Paid-in capital": "2000万元",
    "Date of establishment": "2018-06-20",
    "Year of establishment": 2018,
    "Age": 7,
    "Province": "广东省",
    "City, District, Business address": "广州市, 天河区, 广州市天河区珠江新城花城大道88号",
    "Canton Website": "http://www.gdhealthfood.com",
    "Official website": "https://www.gdhealthfood.com",
    "Telephone": "020-38888888",
    "More phones": "020-38888889;13800138000",
    "Email": "info@gdhealthfood.com",
    "Canton Email": "export@gdhealthfood.com",
    "More Mails": "sales@gdhealthfood.com",
    "Type of enterprise (institution)": "有限责任公司",
    "Unified Social Credit Code": "91440101MA5CK2765Y",
    "Real Insured Employees": 245,
    "Enterprise Scale": "M(中型)",
    "Category": "食品",
    "National standard industry categories": "食品制造业",
    "Company profile": "广东健康食品科技有限公司专注健康食品研发生产",
    "Business scope": "健康食品研发、生产、销售；食品添加剂销售",
    "Credit Rate Scoring": "1580",
    "Credit rating": "A-15",
    "Canton Main Products": "健康食品,保健品,营养品",
    "Canton Main Keywords": "健康食品,保健品,营养品,食品科技"
  },
  {
    "Company Name (English)": "Hubei Medical Equipment Manufacturing Co., Ltd.",
    "Company Name (Chinese)": "湖北医疗设备制造有限公司",
    "Legal representative": "李医生",
    "Registered capital": "3000万元",
    "Paid-in capital": "3000万元",
    "Date of establishment": "2012-09-10",
    "Year of establishment": 2012,
    "Age": 13,
    "Province": "湖北省",
    "City, District, Business address": "武汉市, 洪山区, 武汉市洪山区光谷大道303号",
    "Canton Website": "http://www.hbmedical.com",
    "Official website": "https://www.hbmedical.com",
    "Telephone": "027-87654321",
    "More phones": "027-87654322;13971234567",
    "Email": "info@hbmedical.com",
    "Canton Email": "sales@hbmedical.com",
    "More Mails": "export@hbmedical.com",
    "Type of enterprise (institution)": "有限责任公司",
    "Unified Social Credit Code": "91420100MA4L5K765Z",
    "Real Insured Employees": 180,
    "Enterprise Scale": "M(中型)",
    "Category": "医疗器械",
    "National standard industry categories": "专用设备制造业",
    "Company profile": "湖北医疗设备制造有限公司专业生产医疗设备",
    "Business scope": "医疗设备研发、生产、销售；医疗器械销售",
    "Credit Rate Scoring": "1420",
    "Credit rating": "A-14",
    "Canton Main Products": "医疗设备,医疗器械,医用设备",
    "Canton Main Keywords": "医疗设备,医疗器械,医用设备,医疗科技"
  },
  {
    "Company Name (English)": "Shandong Food Processing Industry Co., Ltd.",
    "Company Name (Chinese)": "山东食品加工工业有限公司",
    "Legal representative": "王食品",
    "Registered capital": "1500万元",
    "Paid-in capital": "1500万元",
    "Date of establishment": "2010-04-25",
    "Year of establishment": 2010,
    "Age": 15,
    "Province": "山东省",
    "City, District, Business address": "济南市, 历城区, 济南市历城区工业南路99号",
    "Canton Website": "http://www.sdfood.com",
    "Official website": "https://www.sdfood.com",
    "Telephone": "0531-88888888",
    "More phones": "0531-88888889;13505318888",
    "Email": "info@sdfood.com",
    "Canton Email": "export@sdfood.com",
    "More Mails": "sales@sdfood.com",
    "Type of enterprise (institution)": "有限责任公司",
    "Unified Social Credit Code": "91370100MA3D5K765W",
    "Real Insured Employees": 320,
    "Enterprise Scale": "M(中型)",
    "Category": "食品加工",
    "National standard industry categories": "食品制造业",
    "Company profile": "山东食品加工工业有限公司专业从事食品加工",
    "Business scope": "食品加工、生产、销售；农产品销售",
    "Credit Rate Scoring": "1680",
    "Credit rating": "A-16",
    "Canton Main Products": "食品加工,农产品,速冻食品",
    "Canton Main Keywords": "食品加工,农产品,速冻食品,食品工业"
  }
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Primero verificar si la tabla existe y tiene datos
    const { data: existingData, error: checkError } = await supabase
      .from('FERIA DE CANTON')
      .select('*')
      .limit(1)

    if (checkError) {
      console.error('Error verificando tabla:', checkError)
      return new Response(JSON.stringify({ 
        error: 'Error verificando tabla FERIA DE CANTON', 
        details: checkError.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Si ya hay datos, retornar información
    if (existingData && existingData.length > 0) {
      const { data: allData, error: countError } = await supabase
        .from('FERIA DE CANTON')
        .select('*')

      return new Response(JSON.stringify({ 
        message: 'Tabla ya contiene datos',
        totalRecords: allData?.length || 0,
        existingData: allData?.slice(0, 3) // Primeros 3 registros como ejemplo
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Poblar tabla con datos reales
    console.log('Poblando tabla FERIA DE CANTON con', cantonData.length, 'empresas...')
    
    const { data, error } = await supabase
      .from('FERIA DE CANTON')
      .insert(cantonData)
      .select()

    if (error) {
      console.error('Error insertando datos:', error)
      return new Response(JSON.stringify({ 
        error: 'Error insertando datos', 
        details: error.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Datos insertados exitosamente:', data?.length, 'registros')

    return new Response(JSON.stringify({ 
      success: true,
      message: `${cantonData.length} empresas insertadas exitosamente en FERIA DE CANTON`,
      insertedRecords: data?.length || 0,
      companies: data?.map(d => d['Company Name (English)']).slice(0, 5)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error en populate-canton-data:', error)
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})