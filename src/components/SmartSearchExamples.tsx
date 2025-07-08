// components/SmartSearchExamples.tsx
import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface SmartSearchExamplesProps {
  onQuerySelect: (query: string) => void;
}

export const SmartSearchExamples: React.FC<SmartSearchExamplesProps> = ({ onQuerySelect }) => {
  
  const searchExamples = {
    product_location: [
      "Busco 3 empresas de luces LED que estén en Shenzhen",
      "Dame fabricantes de maquinaria agrícola en la provincia de Shandong", 
      "¿Quiénes son los proveedores de textiles de algodón en Zhejiang?",
      "Encuentra fábricas de juguetes en la ciudad de Dongguan",
      "Muéstrame empresas de componentes electrónicos en Bao'an, Shenzhen"
    ],
    size_age: [
      "Empresas con más de 200 empleados",
      "Compañías fundadas hace más de 10 años", 
      "Fabricantes de herramientas con entre 50 y 200 empleados",
      "Empresas grandes (+500 empleados) de inyección de plástico",
      "Las 5 empresas con mayor número de empleados en construcción"
    ],
    brands_certs: [
      "Encuentra empresas que comercialicen la marca SunPower",
      "Proveedores que mencionen certificación CE en su web",
      "Empresas que distribuyan la marca Hikvision",
      "Fabricantes con certificación ISO 9001",
      "Empresas que mencionen exportar a Latinoamérica"
    ],
    complex_combined: [
      "3 empresas en Shenzhen que fabriquen drones, +50 empleados, +5 años",
      "Fabricantes de calzado deportivo en Fujian, bajo riesgo, +100 empleados",
      "Proveedores de empaques flexibles en Guangdong, +10 años, web en inglés",
      "Material médico descartable, que NO estén en Shanghai, 50-300 empleados",
      "Fábricas de muebles de madera, +20 años antigüedad, riesgo bajo"
    ],
    exclusions_comparison: [
      "Empresas de textiles, pero excluye las de Guangdong",
      "10 empresas de pisos, ordenadas por número de empleados",
      "Proveedores de muebles, que NO sean de oficina",
      "Fabricantes de LED en Shenzhen, ¿cuál es el más antiguo?",
      "Juguetes de madera, pero que no estén en Yiwu"
    ]
  };

  const categoryInfo = {
    product_location: {
      title: "Producto y Ubicación",
      description: "Búsquedas básicas por productos específicos en ubicaciones determinadas",
      color: "bg-blue-500"
    },
    size_age: {
      title: "Tamaño y Antigüedad", 
      description: "Filtros por número de empleados, años de experiencia y capacidad",
      color: "bg-green-500"
    },
    brands_certs: {
      title: "Marcas y Certificaciones",
      description: "Búsquedas por marcas específicas y certificaciones en sitios web",
      color: "bg-purple-500"
    },
    complex_combined: {
      title: "Búsquedas Combinadas",
      description: "Consultas complejas con múltiples criterios combinados",
      color: "bg-orange-500"
    },
    exclusions_comparison: {
      title: "Exclusiones y Comparaciones",
      description: "Filtros de exclusión y comparaciones entre empresas",
      color: "bg-red-500"
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">
          🧠 Búsquedas Inteligentes Avanzadas
        </CardTitle>
        <p className="text-sm text-gray-600 text-center">
          Ejemplos de consultas que puedes hacer con nuestro motor GPT-4o
        </p>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="product_location" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {Object.entries(categoryInfo).map(([key, info]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {info.title.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(searchExamples).map(([category, queries]) => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`${categoryInfo[category as keyof typeof categoryInfo].color} text-white`}>
                    {categoryInfo[category as keyof typeof categoryInfo].title}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {categoryInfo[category as keyof typeof categoryInfo].description}
                  </span>
                </div>
                
                <div className="grid gap-2">
                  {queries.map((query, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-3 text-left text-sm hover:bg-gray-50 justify-start"
                      onClick={() => onQuerySelect(query)}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <span className="text-blue-500 font-bold min-w-[20px]">
                          {index + 1}.
                        </span>
                        <span className="flex-1">{query}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Capacidades del Motor:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
            <div>✅ Búsqueda por empleados (Real Insured Employees)</div>
            <div>✅ Filtros por ubicación (provincias, ciudades)</div>
            <div>✅ Búsqueda de marcas en dominios web</div>
            <div>✅ Análisis de certificaciones</div>
            <div>✅ Exclusiones geográficas</div>
            <div>✅ Ordenamiento por múltiples criterios</div>
            <div>✅ Filtros por antigüedad de empresa</div>
            <div>✅ Búsquedas combinadas complejas</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartSearchExamples;
