import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Send, Loader2, Paperclip, Upload, CheckCircle, Search, ExternalLink, Database, Globe } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import CompanyDocumentProcessor from './CompanyDocumentProcessor';

interface IntegratedInputAreaProps {
  message: string;
  setMessage: (message: string) => void;
  handleSendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  onVerificationRequest: (query: string, type: 'company' | 'document' | 'reference') => void;
  onCompanyDataExtracted: (extractedData: any, searchQuery: string) => void;
}

const IntegratedInputArea: React.FC<IntegratedInputAreaProps> = ({
  message,
  setMessage,
  handleSendMessage,
  handleKeyPress,
  isLoading,
  onVerificationRequest,
  onCompanyDataExtracted
}) => {
  const [isAttachmentPanelOpen, setIsAttachmentPanelOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    <div className="space-y-4">
      {/* Panel de funciones avanzadas cuando está abierto */}
      {isAttachmentPanelOpen && (
        <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-semibold text-china-navy flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-china-red" />
              Funciones Avanzadas
            </h4>
            <Button
              onClick={() => {
                setIsAttachmentPanelOpen(false);
                setInputValue('');
              }}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-red-600"
            >
              ×
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
      
      {/* Campo de entrada integrado estilo ChatGPT */}
      <div className="relative border border-gray-300 rounded-lg bg-white focus-within:border-china-red focus-within:ring-1 focus-within:ring-china-red">
        <div className="flex items-end space-x-2 p-3">
          {/* Botón de funciones avanzadas integrado */}
          <Button
            onClick={() => setIsAttachmentPanelOpen(!isAttachmentPanelOpen)}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-china-red hover:bg-gray-100 h-8 w-8 p-0 flex-shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          {/* Textarea sin borde propio */}
          <Textarea
            ref={textareaRef}
            placeholder="Busca empresas chinas, solicita reportes completos..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 min-h-[24px] max-h-32 resize-none border-0 focus:ring-0 focus:border-0 p-0 bg-transparent"
            disabled={isLoading}
          />
          
          {/* Botón de envío integrado */}
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white h-8 w-8 p-0 flex-shrink-0 rounded-full"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntegratedInputArea;
