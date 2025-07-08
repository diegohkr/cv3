import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Building2,
  ExternalLink,
  Star,
  MapPin,
  Tag,
  Globe,
  Zap,
  Database
} from 'lucide-react';
import supabaseSearchService, { SearchResult, SearchResponse } from '../services/supabaseSearch';

interface IntelligentSearchWidgetProps {
  onCompanySelect: (company: any) => void;
  placeholder?: string;
  className?: string;
  enableAI?: boolean;
}

const IntelligentSearchWidget: React.FC<IntelligentSearchWidgetProps> = ({
  onCompanySelect,
  placeholder = "Ej: 'Dame 10 empresas que vendan LED en Shenzhen con más de 30 empleados'",
  className = "",
  enableAI = true
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStats, setSearchStats] = useState<any>(null);

  // Cargar estadísticas al montar
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await supabaseSearchService.getStats();
        setSearchStats(stats);
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      }
    };
    loadStats();
  }, []);

  // Búsqueda inteligente en tiempo real con debounce
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    const delayedSearch = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await supabaseSearchService.search(query, 10, true);
        setSearchResults(results);
      } catch (error) {
        console.error('Error en búsqueda Supabase:', error);
        // Mostrar error al usuario pero no romper la aplicación
        setSearchResults({
          query,
          totalResults: 0,
          companies: [],
          searchTime: '0ms',
          criteria: { products: [], location: [], industry: [] },
          isAIAssisted: false
        });
      } finally {
        setIsSearching(false);
      }
    }, 500); // Debounce de 500ms para consultas de IA

    return () => clearTimeout(delayedSearch);
  }, [query, enableAI]);

  const handleCompanySelect = (result: SearchResult) => {
    onCompanySelect(result.company);
    setQuery('');
    setSearchResults(null);
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 15) return 'text-green-600 bg-green-50';
    if (score >= 8) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  const getRelevanceIcon = (score: number) => {
    if (score >= 15) return <CheckCircle className="w-3 h-3" />;
    if (score >= 8) return <Star className="w-3 h-3" />;
    return <AlertCircle className="w-3 h-3" />;
  };

  const renderMatchedFields = (result: SearchResult) => {
    const fieldIcons: { [key: string]: React.ReactNode } = {
      nombre: <Building2 className="w-3 h-3" />,
      productos: <Star className="w-3 h-3" />,
      ubicación: <MapPin className="w-3 h-3" />,
      categoría: <Tag className="w-3 h-3" />,
      industria: <Tag className="w-3 h-3" />,
      website: <Globe className="w-3 h-3" />
    };

    return result.matchedFields.map(field => (
      <div key={field} className="flex items-center gap-1 text-xs text-gray-500">
        {fieldIcons[field] || <Star className="w-3 h-3" />}
        <span>{field}</span>
      </div>
    ));
  };

  return (
    <div className={`relative ${className}`}>
      {/* Campo de búsqueda inteligente */}
      <div className="relative">
        <div className="flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          {enableAI && (
            <Zap className="absolute left-8 top-1/2 transform -translate-y-1/2 w-3 h-3 text-amber-500" />
          )}
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${enableAI ? 'pl-12' : 'pl-10'} pr-4`}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-china-red border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        {/* Indicador de base de datos */}
        {searchStats && (
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <Database className="w-3 h-3" />
            <span>Base de datos: {searchStats.totalCompanies?.toLocaleString()} empresas verificadas</span>
            {enableAI && <Badge variant="outline" className="text-xs">IA Habilitada</Badge>}
          </div>
        )}
      </div>

      {/* Resultados de búsqueda inteligente */}
      {searchResults && query.trim() && (
        <Card className="absolute top-full left-0 right-0 mt-2 shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {/* Encabezado de resultados */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-800">
                    Resultados de búsqueda inteligente
                  </span>
                  {searchResults.isAIAssisted && (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                      <Zap className="w-3 h-3 mr-1" />
                      IA
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {searchResults.totalResults} resultado{searchResults.totalResults !== 1 ? 's' : ''} • {searchResults.searchTime}
                </div>
              </div>
            </div>

            {/* Resultados principales */}
            {searchResults.companies.length > 0 && (
              <div className="p-4">
                <div className="space-y-3">
                  {searchResults.companies.map((result, index) => (
                    <div 
                      key={index}
                      className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-china-red hover:bg-gray-50 transition-all group"
                      onClick={() => handleCompanySelect(result)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {result.company['Company Name (English)']}
                            </h4>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getRelevanceColor(result.relevanceScore)}`}>
                              {getRelevanceIcon(result.relevanceScore)}
                              <span>{result.relevanceScore}pts</span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-600 mb-2">
                            <div className="font-medium text-gray-500 mb-1">
                              {result.company['Company Name (Chinese)']}
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {result.company['Category']}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {result.company['Province']}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {result.company['Real Insured Employees']} empleados
                              </span>
                            </div>
                          </div>

                          {/* Productos principales */}
                          {result.company['Canton Main Products'] && (
                            <div className="mb-2">
                              <span className="text-xs text-gray-500">Productos: </span>
                              <span className="text-xs text-blue-600">
                                {result.company['Canton Main Products'].substring(0, 60)}...
                              </span>
                            </div>
                          )}

                          {/* Campos coincidentes */}
                          {result.matchedFields.length > 0 && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-gray-500">Coincidencias:</span>
                              <div className="flex gap-1">
                                {renderMatchedFields(result)}
                              </div>
                            </div>
                          )}

                          {/* Explicación de relevancia */}
                          <p className="text-xs text-gray-500 italic">
                            {result.explanation}
                          </p>
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="ml-3 text-xs hover:bg-china-red hover:text-white group-hover:bg-china-red group-hover:text-white transition-colors"
                        >
                          Ver Empresa
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sin resultados */}
            {searchResults.companies.length === 0 && (
              <div className="p-6 text-center">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-2">
                  No se encontraron empresas para "{query}"
                </p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Intenta con:</p>
                  <p>• "empresas que vendan LED en Shenzhen"</p>
                  <p>• "fabricantes de plástico con más de 50 empleados"</p>
                  <p>• "empresas en Guangdong con buena calificación"</p>
                </div>
                {searchStats && (
                  <div className="mt-3 text-xs text-gray-400">
                    Base de datos: {searchStats.totalCompanies?.toLocaleString()} empresas disponibles
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IntelligentSearchWidget;
