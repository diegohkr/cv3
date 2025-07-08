import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import TranslatorWidget from './TranslatorWidget';
import {
  CheckCircle,
  AlertCircle,
  Languages,
  Map,
  Calendar,
  Info,
  HelpCircle,
  Search,
  Upload,
  FileText,
  Mic,
  History,
  Settings,
  Building2,
  Truck,
  Phone,
  MapPin,
  Star,
  ChevronLeft,
  ExternalLink,
  Globe,
  Award,
  Shield
} from 'lucide-react';

interface WelcomeCardsProps {
  onAction: (action: string, data?: any) => void;
}

type MainCardType = 'verification' | 'translation' | 'map' | 'fairs' | 'info' | 'help' | null;

const WelcomeCards: React.FC<WelcomeCardsProps> = ({ onAction }) => {
  const [selectedCard, setSelectedCard] = useState<MainCardType>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [translationInput, setTranslationInput] = useState('');
  const [brandSearchResult, setBrandSearchResult] = useState<string>('');
  const [isSearchingBrands, setIsSearchingBrands] = useState(false);

  const mainCards = [
    {
      id: 'verification' as MainCardType,
      title: 'Verificación de Empresas',
      description: 'Comprueba la existencia y reputación de proveedores chinos',
      icon: CheckCircle,
      color: 'bg-red-500',
      gradient: 'from-red-500 to-red-600'
    },
    {
      id: 'translation' as MainCardType,
      title: 'Traducción',
      description: 'Comunicación instantánea español ↔ chino',
      icon: Languages,
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'map' as MainCardType,
      title: 'Mapa de la Feria de Cantón',
      description: 'Planos oficiales y orientación del recinto',
      icon: Map,
      color: 'bg-green-500',
      gradient: 'from-green-500 to-green-600'
    },
    {
      id: 'fairs' as MainCardType,
      title: 'Ferias Especializadas',
      description: 'Otras ferias relevantes en China',
      icon: Calendar,
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      id: 'info' as MainCardType,
      title: 'Información Útil',
      description: 'Recursos prácticos para importadores',
      icon: Info,
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      id: 'help' as MainCardType,
      title: 'Ayuda',
      description: 'Guías, contactos de emergencia y consejos',
      icon: HelpCircle,
      color: 'bg-teal-500',
      gradient: 'from-teal-500 to-teal-600'
    }
  ];

  const handleCardClick = (cardId: MainCardType) => {
    setSelectedCard(selectedCard === cardId ? null : cardId);
  };

  const handleBackToMain = () => {
    setSelectedCard(null);
  };

  const handleCompanySearch = () => {
    if (searchTerm.trim()) {
      onAction('company-search', { query: searchTerm });
      setSearchTerm('');
    }
  };

  const handleFileUpload = () => {
    onAction('file-upload');
  };

  const handleManualReview = () => {
    onAction('manual-review');
  };

  const handleTranslation = (direction: string) => {
    if (translationInput.trim()) {
      onAction('translation', { text: translationInput, direction });
      setTranslationInput('');
    }
  };

  const handleBrandRankingSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearchingBrands(true);
    setBrandSearchResult('');
    
    try {
      // Simular búsqueda inteligente en Maigoo
      // En una implementación real, esto haría una búsqueda web real
      const category = searchTerm.trim().toLowerCase();
      
      // Mapeo de categorías comunes a URLs de Maigoo
      const categoryMappings: { [key: string]: string } = {
        'electrodomésticos': 'https://www.maigoo.com/category/brand/appliances/',
        'electrodomesticos': 'https://www.maigoo.com/category/brand/appliances/',
        'televisores': 'https://www.maigoo.com/category/brand/tv/',
        'móviles': 'https://www.maigoo.com/category/brand/mobile/',
        'moviles': 'https://www.maigoo.com/category/brand/mobile/',
        'celulares': 'https://www.maigoo.com/category/brand/mobile/',
        'teléfonos': 'https://www.maigoo.com/category/brand/mobile/',
        'telefonos': 'https://www.maigoo.com/category/brand/mobile/',
        'automóviles': 'https://www.maigoo.com/category/brand/automotive/',
        'automoviles': 'https://www.maigoo.com/category/brand/automotive/',
        'coches': 'https://www.maigoo.com/category/brand/automotive/',
        'autos': 'https://www.maigoo.com/category/brand/automotive/',
        'textiles': 'https://www.maigoo.com/category/brand/textiles/',
        'ropa': 'https://www.maigoo.com/category/brand/clothing/',
        'moda': 'https://www.maigoo.com/category/brand/fashion/',
        'muebles': 'https://www.maigoo.com/category/brand/furniture/',
        'hogar': 'https://www.maigoo.com/category/brand/home/',
        'decoración': 'https://www.maigoo.com/category/brand/decoration/',
        'decoracion': 'https://www.maigoo.com/category/brand/decoration/',
        'juguetes': 'https://www.maigoo.com/category/brand/toys/',
        'cosmética': 'https://www.maigoo.com/category/brand/cosmetics/',
        'cosmetica': 'https://www.maigoo.com/category/brand/cosmetics/',
        'belleza': 'https://www.maigoo.com/category/brand/beauty/',
        'medicina': 'https://www.maigoo.com/category/brand/medical/',
        'salud': 'https://www.maigoo.com/category/brand/health/',
        'deportes': 'https://www.maigoo.com/category/brand/sports/',
        'fitness': 'https://www.maigoo.com/category/brand/fitness/',
        'herramientas': 'https://www.maigoo.com/category/brand/tools/',
        'maquinaria': 'https://www.maigoo.com/category/brand/machinery/',
        'construcción': 'https://www.maigoo.com/category/brand/construction/',
        'construccion': 'https://www.maigoo.com/category/brand/construction/',
        'alimentación': 'https://www.maigoo.com/category/brand/food/',
        'alimentacion': 'https://www.maigoo.com/category/brand/food/',
        'comida': 'https://www.maigoo.com/category/brand/food/',
        'bebidas': 'https://www.maigoo.com/category/brand/beverages/',
        'tecnología': 'https://www.maigoo.com/category/brand/technology/',
        'tecnologia': 'https://www.maigoo.com/category/brand/technology/',
        'computadoras': 'https://www.maigoo.com/category/brand/computers/',
        'ordenadores': 'https://www.maigoo.com/category/brand/computers/',
        'laptops': 'https://www.maigoo.com/category/brand/laptops/',
        'tablets': 'https://www.maigoo.com/category/brand/tablets/'
      };
      
      // Buscar coincidencia exacta o parcial
      let foundUrl = categoryMappings[category];
      
      if (!foundUrl) {
        // Buscar coincidencias parciales
        for (const [key, url] of Object.entries(categoryMappings)) {
          if (key.includes(category) || category.includes(key)) {
            foundUrl = url;
            break;
          }
        }
      }
      
      if (foundUrl) {
        setBrandSearchResult(foundUrl);
      } else {
        setBrandSearchResult('No se encontró un ranking para esta categoría en Maigoo.');
      }
      
    } catch (error) {
      console.error('Error al buscar ranking:', error);
      setBrandSearchResult('Error al buscar el ranking. Por favor, intenta de nuevo.');
    } finally {
      setIsSearchingBrands(false);
    }
  };



  if (selectedCard) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4">
        <Button
          onClick={handleBackToMain}
          variant="ghost"
          className="mb-4 text-china-navy hover:text-china-red"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Volver al menú principal
        </Button>

        <div className="grid gap-4">
          {selectedCard === 'verification' && (
            <>
              <h3 className="text-xl font-bold text-china-navy mb-6">Verificación de Empresas</h3>
              
              {/* Primera fila - Opciones principales de búsqueda */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Opciones de Búsqueda</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <Search className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Búsqueda por Nombre</h4>
                        <p className="text-sm text-gray-600">Busca empresas por nombre comercial en nuestra base de datos de 24,225 empresas verificadas</p>
                        <div className="w-full space-y-3">
                          <Input
                            placeholder="Nombre de la empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCompanySearch()}
                          />
                          <Button onClick={handleCompanySearch} className="w-full" disabled={!searchTerm.trim()}>
                            Buscar Empresa
                          </Button>
                        </div>
                        <a href="https://chinaverifier.com/verifica-empresas" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Más información
                        </a>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                          <Building2 className="w-6 h-6 text-purple-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Búsqueda por Otros Datos</h4>
                        <p className="text-sm text-gray-600">Busca empresa usando marca, sitio web, número de licencia, etc.</p>
                        <div className="w-full space-y-3">
                          <Input
                            placeholder="Marca, sitio web, número de licencia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCompanySearch()}
                          />
                          <Button onClick={handleCompanySearch} className="w-full" disabled={!searchTerm.trim()}>
                            Buscar
                          </Button>
                        </div>
                        <a href="https://chinaverifier.com/verifica-empresas" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Más información
                        </a>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                          <Upload className="w-6 h-6 text-green-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Subir Documento</h4>
                        <p className="text-sm text-gray-600">Sube una foto o PDF con información de la empresa</p>
                        <Button onClick={handleFileUpload} className="w-full">
                          <Upload className="w-4 h-4 mr-2" />
                          Seleccionar Archivo
                        </Button>
                        <a href="https://chinaverifier.com/verifica-empresas" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Más información
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Segunda fila - Opciones de reporte especial */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Reportes Especiales</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                          <FileText className="w-6 h-6 text-orange-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Reporte de Empresa No Listada</h4>
                        <p className="text-sm text-gray-600">Reporta una empresa que no está en nuestra base para que nuestro equipo la investigue</p>
                        <Button onClick={handleManualReview} variant="outline" className="w-full">
                          Crear Reporte
                        </Button>
                        <a href="https://chinaverifier.com/verifica-empresas" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Más información
                        </a>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                          <Shield className="w-6 h-6 text-red-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Reporte Exhaustivo</h4>
                        <p className="text-sm text-gray-600">Solicita un reporte exhaustivo de una empresa con análisis de riesgo y verificación de antecedentes</p>
                        <Button onClick={() => onAction('exhaustive-report')} className="w-full bg-red-500 hover:bg-red-600">
                          Solicitar Reporte
                        </Button>
                        <a href="https://chinaverifier.com/verifica-empresas" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Más información
                        </a>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <Star className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Reporte Múltiple</h4>
                        <p className="text-sm text-gray-600">Sube un archivo o lista con hasta 30 empresas para verificar todas en un solo paso</p>
                        <Button onClick={() => onAction('multiple-report')} variant="outline" className="w-full">
                          Subir Lista
                        </Button>
                        <a href="https://chinaverifier.com/verifica-empresas" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Más información
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}

          {selectedCard === 'translation' && (
            <TranslatorWidget onBack={handleBackToMain} />
          )}

          {selectedCard === 'map' && (
            <>
              <h3 className="text-xl font-bold text-china-navy mb-4">Mapa de la Feria de Cantón</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-red-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Fase 1</h4>
                      <div className="text-sm text-gray-800 font-medium">B2B Industrial y Tecnología</div>
                      <div className="text-sm text-gray-600">15 – 19 octubre 2025</div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => window.open('http://chinaverifier.com/wp-content/uploads/2025/07/phase1.webp', '_blank')}
                      >
                        Ver Plano
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Fase 2</h4>
                      <div className="text-sm text-gray-800 font-medium">Construcción, Hogar y Consumo</div>
                      <div className="text-sm text-gray-600">23 – 27 octubre 2025</div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => window.open('http://chinaverifier.com/wp-content/uploads/2025/07/phase2.webp', '_blank')}
                      >
                        Ver Plano
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Fase 3</h4>
                      <div className="text-sm text-gray-800 font-medium">Textil, Moda y FMCG</div>
                      <div className="text-sm text-gray-600">31 octubre – 4 noviembre 2025</div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => window.open('http://chinaverifier.com/wp-content/uploads/2025/07/phase3.webp', '_blank')}
                      >
                        Ver Plano
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Info className="w-6 h-6 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Rubros</h4>
                      <p className="text-sm text-gray-600">Ver los rubros y categorías de cada etapa</p>
                      <Button 
                        className="w-full bg-purple-500 hover:bg-purple-600"
                        onClick={() => window.open('https://chinaverifier.com/cantonfairstages', '_blank')}
                      >
                        Ver Rubros
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {selectedCard === 'fairs' && (
            <>
              <h3 className="text-xl font-bold text-china-navy mb-4">Ferias Especializadas</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">CBD Fair</h4>
                      <p className="text-sm text-gray-600">Centro de Negocios y Desarrollo</p>
                      <div className="w-full space-y-2 text-xs">
                        <div className="p-2 bg-gray-50 rounded">
                          <strong>Fechas:</strong> Marzo 15-18, 2024
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <strong>Ciudad:</strong> Shenzhen
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Sitio Oficial
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">China Hi-Tech Fair</h4>
                      <p className="text-sm text-gray-600">Tecnología e Innovación</p>
                      <div className="w-full space-y-2 text-xs">
                        <div className="p-2 bg-gray-50 rounded">
                          <strong>Fechas:</strong> Noviembre 14-18, 2024
                        </div>
                        <div className="p-2 bg-gray-50 rounded">
                          <strong>Ciudad:</strong> Shenzhen
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Sitio Oficial
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Más Ferias</h4>
                      <p className="text-sm text-gray-600">Próximamente más eventos</p>
                      <Button variant="outline" size="sm" className="w-full">
                        Ver Calendario Completo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {selectedCard === 'info' && (
            <>
              <h3 className="text-xl font-bold text-china-navy mb-4">Información Útil</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Ranking de Marcas</h4>
                      <p className="text-sm text-gray-600">Top 10 marcas chinas por categoría</p>
                      <div className="w-full space-y-3">
                        <Input 
                          placeholder="Ej: electrodomésticos, móviles, textiles..." 
                          className="text-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleBrandRankingSearch()}
                        />
                        <Button 
                          onClick={handleBrandRankingSearch}
                          className="w-full bg-yellow-500 hover:bg-yellow-600"
                          disabled={!searchTerm.trim() || isSearchingBrands}
                        >
                          {isSearchingBrands ? 'Buscando...' : 'Buscar Rankings'}
                        </Button>
                        
                        {/* Área de resultado */}
                        {brandSearchResult && (
                          <div className="w-full mt-4 p-3 bg-gray-50 rounded-lg border">
                            {brandSearchResult.startsWith('https://') ? (
                              <div className="space-y-2">
                                <p className="text-xs text-green-600 font-medium">
                                  ✅ Ranking encontrado para "{searchTerm}"
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-xs"
                                  onClick={() => window.open(brandSearchResult, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Ver Ranking en Maigoo
                                </Button>
                              </div>
                            ) : (
                              <p className="text-xs text-red-600">
                                ❌ {brandSearchResult}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Empresas de Inspección</h4>
                      <p className="text-sm text-gray-600">Servicios de calidad verificados</p>
                      <div className="w-full space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => window.open('https://www.qima.com', '_blank')}
                        >
                          Qima
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => window.open('https://www.v-trust.com', '_blank')}
                        >
                          V-Trust
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => window.open('https://www.weinspection.com', '_blank')}
                        >
                          WeInspection
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => window.open('https://www.tuv.com/world/en', '_blank')}
                        >
                          TÜV Rheinland
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => window.open('https://www.sgsgroup.com.cn', '_blank')}
                        >
                          SGS
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => window.open('https://www.intertek.com', '_blank')}
                        >
                          Intertek
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Truck className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Logística Recomendada</h4>
                      <p className="text-sm text-gray-600">Agentes logísticos certificados</p>
                      <Button 
                        className="w-full bg-green-500 hover:bg-green-600"
                        onClick={() => window.open('https://chinaverifier.com/logistic', '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Lista Completa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {selectedCard === 'help' && (
            <>
              <h3 className="text-xl font-bold text-china-navy mb-4">Centro de Ayuda</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Info className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Guía de Etiqueta</h4>
                      <p className="text-sm text-gray-600">Consejos culturales y de protocolo empresarial</p>
                      <Button variant="outline" className="w-full">Ver Guía</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-6 h-6 text-red-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Teléfonos Útiles</h4>
                      <p className="text-sm text-gray-600">Emergencias, embajadas y hospitales</p>
                      <div className="w-full space-y-1 text-xs">
                        <div className="p-2 bg-red-50 rounded">🚨 Emergencias: 110</div>
                        <div className="p-2 bg-blue-50 rounded">🏥 Ambulancia: 120</div>
                        <div className="p-2 bg-green-50 rounded">🔥 Bomberos: 119</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <HelpCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Consejos Generales</h4>
                      <p className="text-sm text-gray-600">Seguridad y negociación en China</p>
                      <Button variant="outline" className="w-full">Ver Consejos</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Globe className="w-6 h-6 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Apps Chinas</h4>
                      <p className="text-sm text-gray-600">Cómo instalar aplicaciones locales</p>
                      <Button variant="outline" className="w-full">Ver Tutorial</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-orange-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Sugerencias Turísticas</h4>
                      <p className="text-sm text-gray-600">Lugares para visitar y dónde comer</p>
                      <Button variant="outline" className="w-full">Ver Lugares</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mainCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <Card
              key={card.id}
              className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 group"
              onClick={() => handleCardClick(card.id)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-china-red transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  <div className="w-full pt-2">
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${card.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">
          Selecciona una categoría para acceder a herramientas especializadas
        </p>
      </div>
    </div>
  );
};

export default WelcomeCards;
