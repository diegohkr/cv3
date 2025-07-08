import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Paperclip, ExternalLink, Search, Database, Globe } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface VerificationHookProps {
  onVerificationRequest: (query: string, type: 'company' | 'document' | 'reference') => void;
}

const VerificationHook: React.FC<VerificationHookProps> = ({ onVerificationRequest }) => {
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
    setIsExpanded(false);
  };

  const quickSuggestions = [
    { text: "Buscar por nombre de empresa", icon: <Search className="w-3 h-3" /> },
    { text: "Verificar código social unificado", icon: <Database className="w-3 h-3" /> },
    { text: "Consultar por sitio web oficial", icon: <Globe className="w-3 h-3" /> },
  ];

  return (
    <div className="bg-gradient-to-r from-china-red/5 to-china-navy/5 rounded-lg p-3 border border-china-red/10">
      {!isExpanded ? (
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(true)}
          className="w-full justify-start h-auto p-3 hover:bg-china-red/10 border-2 border-dashed border-china-red/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-china-red/10 rounded-full">
              <Paperclip className="w-4 h-4 text-china-red" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-china-navy">
                Vincular a Fuente Oficial
              </div>
              <div className="text-xs text-gray-600">
                Verificar empresas directamente desde registros oficiales chinos
              </div>
            </div>
          </div>
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Paperclip className="w-4 h-4 text-china-red" />
            <span className="text-sm font-medium text-china-navy">
              Verificación Oficial
            </span>
            <Badge variant="secondary" className="text-xs">
              Base de 24,225 empresas
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
              onClick={() => handleSubmit('company')}
              className="bg-china-red hover:bg-china-red/90 text-white justify-start text-xs h-8"
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

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsExpanded(false);
                setInputValue('');
              }}
              className="text-xs"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationHook;
