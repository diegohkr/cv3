import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Paperclip, 
  ExternalLink, 
  Search, 
  Database, 
  Globe,
  Upload,
  X,
  CheckCircle 
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import CompanyDocumentProcessor from './CompanyDocumentProcessor';

interface UnifiedAttachmentPanelProps {
  onVerificationRequest: (query: string, type: 'company' | 'document' | 'reference') => void;
  onCompanyDataExtracted: (extractedData: any, searchQuery: string) => void;
}

const UnifiedAttachmentPanel: React.FC<UnifiedAttachmentPanelProps> = ({ 
  onVerificationRequest,
  onCompanyDataExtracted 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { toast } = useToast();

  const handleSubmit = (type: 'company' | 'document' | 'reference') => {
    if (!inputValue.trim()) {
      toast({
        title: "Campo requerido",
        description: "Por favor ingresa la información a verificar",
        variant: "destructive",
      });
      return;
    }

    onVerificationRequest(inputValue.trim(), type);
    setInputValue('');
  };

  const quickSuggestions = [
    { text: "Buscar por nombre de empresa", icon: <Search className="w-3 h-3" /> },
    { text: "Verificar código social unificado", icon: <Database className="w-3 h-3" /> },
    { text: "Consultar por sitio web oficial", icon: <Globe className="w-3 h-3" /> },
  ];

  return (
    <div className="mb-4">
      {!isExpanded ? (
        <div className="flex justify-center">
          <Button
            onClick={() => setIsExpanded(true)}
            variant="outline"
            className="border-china-red text-china-red hover:bg-china-red hover:text-white"
            size="sm"
          >
            <Paperclip className="w-4 h-4 mr-2" />
            Funciones Avanzadas
          </Button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-semibold text-china-navy flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-china-red" />
              Funciones Avanzadas
            </h4>
            <Button
              onClick={() => {
                setIsExpanded(false);
                setInputValue('');
              }}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <Tabs defaultValue="document" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="document" className="text-xs bg-[#E53935] text-white data-[state=active]:bg-[#E53935] data-[state=active]:text-white hover:bg-[#E53935] hover:text-white">
                <Upload className="w-3 h-3 mr-1" />
                Subir Documento
              </TabsTrigger>
              <TabsTrigger value="verification" className="text-xs bg-[#E53935] text-white data-[state=active]:bg-[#E53935] data-[state=active]:text-white hover:bg-[#E53935] hover:text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verificación Oficial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="verification" className="space-y-3 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  Base de 24,225 empresas verificadas
                </Badge>
              </div>

              <Input
                placeholder="Nombre de empresa, código social, o sitio web oficial..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit('company');
                  }
                }}
              />

              <div className="grid grid-cols-1 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSubmit('company')}
                  className="bg-white border-china-red/20 text-china-navy hover:bg-china-red/5 justify-start text-xs h-8"
                >
                  <Search className="w-3 h-3 mr-2" />
                  Búsqueda Exhaustiva en Base de Datos
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSubmit('reference')}
                  className="border-china-red/20 text-china-navy hover:bg-china-red/5 justify-start text-xs h-8"
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  Verificar Fuente Oficial Externa
                </Button>
              </div>

              <div className="border-t border-gray-200 pt-2">
                <div className="text-xs text-gray-500 mb-2">Sugerencias rápidas:</div>
                <div className="space-y-1">
                  {quickSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInputValue(suggestion.text.toLowerCase())}
                      className="w-full text-left text-xs text-gray-600 hover:text-china-red p-1 rounded hover:bg-china-red/5 flex items-center gap-2"
                    >
                      {suggestion.icon}
                      {suggestion.text}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="document" className="mt-4">
              <div className="text-xs text-gray-600 mb-3">
                Sube una imagen, tarjeta de presentación o PDF que contenga información de empresas chinas. 
                El sistema extraerá automáticamente nombres, sitios web, marcas y datos de contacto.
              </div>
              
              <CompanyDocumentProcessor
                onCompanyDataExtracted={onCompanyDataExtracted}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default UnifiedAttachmentPanel;
