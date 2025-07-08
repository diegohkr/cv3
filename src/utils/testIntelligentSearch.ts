// utils/testIntelligentSearch.ts
// Script de prueba para el motor de búsqueda inteligente

export const intelligentSearchTests = [
  // 1. Búsquedas por Producto y Ubicación
  {
    category: "Producto y Ubicación",
    queries: [
      "Busco 3 empresas de luces LED que estén en Shenzhen",
      "Dame fabricantes de maquinaria agrícola en la provincia de Shandong", 
      "¿Quiénes son los proveedores de textiles de algodón en Zhejiang?",
      "Encuentra fábricas de juguetes en la ciudad de Dongguan",
      "Muéstrame empresas de componentes electrónicos en Bao'an, Shenzhen"
    ],
    expectedBehavior: [
      "Buscar 'LED' y 'luces' en productos, filtrar por Shenzhen, límite 3",
      "Buscar 'maquinaria agrícola' en productos, filtrar por Shandong",
      "Buscar 'textiles' y 'algodón' en productos, filtrar por Zhejiang",
      "Buscar 'juguetes' en productos, filtrar por Dongguan",
      "Buscar 'componentes electrónicos' en productos, filtrar por Bao'an"
    ]
  },

  // 2. Búsquedas por Tamaño y Antigüedad
  {
    category: "Tamaño y Antigüedad",
    queries: [
      "Empresas con más de 200 empleados",
      "Compañías fundadas hace más de 10 años", 
      "Fabricantes de herramientas con entre 50 y 200 empleados",
      "Empresas grandes (+500 empleados) de inyección de plástico",
      "Las 5 empresas con mayor número de empleados en construcción"
    ],
    expectedBehavior: [
      "Filtrar Real Insured Employees >= 200",
      "Calcular años desde 2025, filtrar Year of establishment <= 2015",
      "Buscar 'herramientas', empleados entre 50-200",
      "Buscar 'inyección plástico', empleados >= 500",
      "Buscar 'construcción', ordenar por empleados DESC, límite 5"
    ]
  },

  // 3. Búsquedas por Marcas y Certificaciones
  {
    category: "Marcas y Certificaciones",
    queries: [
      "Encuentra empresas que comercialicen la marca SunPower",
      "Proveedores que mencionen certificación CE en su web",
      "Empresas que distribuyan la marca Hikvision",
      "Fabricantes con certificación ISO 9001",
      "Empresas que mencionen exportar a Latinoamérica"
    ],
    expectedBehavior: [
      "Buscar 'SunPower' en Canton Website y nombres",
      "Buscar 'CE' en website_requirements.certifications",
      "Buscar 'Hikvision' en Canton Website y nombres",
      "Buscar 'ISO 9001' en certifications",
      "Buscar 'Latinoamérica' y 'export' en website_requirements"
    ]
  },

  // 4. Búsquedas Combinadas Complejas
  {
    category: "Búsquedas Combinadas",
    queries: [
      "3 empresas en Shenzhen que fabriquen drones, +50 empleados, +5 años",
      "Fabricantes de calzado deportivo en Fujian, bajo riesgo, +100 empleados",
      "Proveedores de empaques flexibles en Guangdong, +10 años, web en inglés",
      "Material médico descartable, que NO estén en Shanghai, 50-300 empleados",
      "Fábricas de muebles de madera, +20 años antigüedad, riesgo bajo"
    ],
    expectedBehavior: [
      "products=['drones'], location='Shenzhen', employees.min=50, company_age.min_years=5, limit=3",
      "products=['calzado deportivo'], location='Fujian', risk_level='low', employees.min=100",
      "products=['empaques flexibles'], location='Guangdong', company_age.min_years=10, website_requirements.languages=['inglés']",
      "products=['material médico descartable'], cities_excluded=['Shanghai'], employees.min=50, employees.max=300",
      "products=['muebles', 'madera'], company_age.min_years=20, risk_level='low', company_type='manufacturer'"
    ]
  },

  // 5. Búsquedas con Exclusiones
  {
    category: "Exclusiones y Comparaciones",
    queries: [
      "Empresas de textiles, pero excluye las de Guangdong",
      "10 empresas de pisos, ordenadas por número de empleados",
      "Proveedores de muebles, que NO sean de oficina",
      "Fabricantes de LED en Shenzhen, ¿cuál es el más antiguo?",
      "Juguetes de madera, pero que no estén en Yiwu"
    ],
    expectedBehavior: [
      "products=['textiles'], provinces_excluded=['Guangdong']",
      "products=['pisos'], sorting={field: 'employees', order: 'desc'}, limit=10",
      "products=['muebles'], exclusions.products=['oficina']",
      "products=['LED'], location='Shenzhen', sorting={field: 'age', order: 'desc'}, limit=1",
      "products=['juguetes', 'madera'], cities_excluded=['Yiwu']"
    ]
  }
];

// Función para ejecutar pruebas
export const runIntelligentSearchTest = async (query: string) => {
  console.log(`🧪 Probando consulta: "${query}"`);
  
  // Aquí se puede agregar lógica para:
  // 1. Llamar al translateQuery con la consulta
  // 2. Verificar que los criterios extraídos sean correctos
  // 3. Ejecutar la búsqueda
  // 4. Validar los resultados
  
  return {
    query,
    timestamp: new Date().toISOString(),
    status: 'test_ready'
  };
};

// Casos de prueba específicos para validar comportamiento
export const validationTests = {
  employees: {
    "más de 200 empleados": { employees: { min: 200, operator: "gte" } },
    "menos de 100 empleados": { employees: { max: 100, operator: "lte" } },
    "entre 50 y 200 empleados": { employees: { min: 50, max: 200, operator: "between" } }
  },
  
  location: {
    "en Shenzhen": { location: "Shenzhen" },
    "provincia de Guangdong": { location: "Guangdong" },
    "que NO estén en Shanghai": { cities_excluded: ["Shanghai"] }
  },
  
  brands: {
    "marca SunPower": { brands: ["SunPower"] },
    "que distribuyan Hikvision": { brands: ["Hikvision"] }
  },
  
  sorting: {
    "ordenadas por empleados": { sorting: { field: "employees", order: "desc" } },
    "de mayor a menor por antigüedad": { sorting: { field: "age", order: "desc" } }
  },
  
  company_type: {
    "fabricantes": { company_type: "manufacturer" },
    "trading companies": { company_type: "trading" },
    "fábricas": { company_type: "factory" }
  }
};

export default intelligentSearchTests;
