import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import LoadingProgress from './LoadingProgress';
import CompanyDocumentProcessor from './CompanyDocumentProcessor';
import PDFExporter from './PDFExporter';
import VoiceRecorder from './VoiceRecorder';
import WelcomeCards from './WelcomeCards';
import SmartSearchExamples from './SmartSearchExamples';

import { openAIService } from '../services/openai';
import { 
  Send, 
  CheckCircle, 
  User, 
  Factory,
  Search,
  Globe,
  Settings,
  Paperclip,
  Loader2,
  Upload,
  ExternalLink,
  Database,
  X
} from 'lucide-react';

const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const { 
    currentConversation, 
    sendMessage, 
    isLoading,
    isProcessing,
    processingProgress,
    processingStatus
  } = useChat();
  
  const [message, setMessage] = useState('');
  const [isAdvancedPanelOpen, setIsAdvancedPanelOpen] = useState(false);
  const [verificationInput, setVerificationInput] = useState('');
  const [activeTab, setActiveTab] = useState('document');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    await sendMessage(message);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Detectar si un mensaje es un reporte de empresa y extraer el nombre
  const isCompanyReport = (content: string): boolean => {
    // Patrones más amplios para detectar reportes de empresas
    const reportPatterns = [
      '🧾 Reporte de Empresa:',
      'Reporte de Empresa:',
      '📍 Información General',
      '📍 **Información General**',
      '🏭 Nombre de la Empresa:',
      '🏭 **Nombre de la Empresa:**',
      '🌐 Sitio Web:',
      '🌐 **Sitio Web:**',
      '📦 Productos Principales:',
      '📦 **Productos Principales:**',
      'reporte completo',
      'información de la empresa',
      '常州', // Nombre en chino de empresas como Changzhou
      'Co., Ltd',
      'Import & Export',
      'Trading Co',
      'Industrial Co'
    ];
    
    // Verificar si contiene múltiples indicadores de reporte
    const matches = reportPatterns.filter(pattern => 
      content.toLowerCase().includes(pattern.toLowerCase())
    ).length;
    
    // Si tiene 2 o más indicadores, probablemente es un reporte
    return matches >= 2 || 
           content.includes('🧾 Reporte de Empresa:') ||
           content.includes('📍 Información General') ||
           (content.length > 500 && content.includes('empresa') && content.includes('contacto'));
  };

  const extractCompanyName = (content: string): string => {
    // Múltiples patrones para extraer el nombre de la empresa
    const patterns = [
      /🧾\s*Reporte de Empresa:\s*(.+?)(?:\n|$)/,
      /Reporte de Empresa:\s*(.+?)(?:\n|$)/,
      /🏭\s*\*\*Nombre de la Empresa:\*\*\s*(.+?)(?:\n|$)/,
      /🏭\s*Nombre de la Empresa:\s*(.+?)(?:\n|$)/,
      /\*\*Empresa:\*\*\s*(.+?)(?:\n|$)/,
      /Empresa:\s*(.+?)(?:\n|$)/,
      /reporte completo de\s+(.+?)(?:\n|$)/i,
      /información de\s+(.+?)(?:\n|$)/i,
      // Patrones para nombres de empresas comunes
      /([A-Za-z\s]+(?:Co\.?,?\s*Ltd\.?|Trading Co\.?|Industrial Co\.?|Import.*Export|Corporation))/,
      // Patrón para nombres chinos + inglés
      /([\u4e00-\u9fff]+.*?(?:Co\.?,?\s*Ltd\.?|Trading|Industrial))/
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        let companyName = match[1].trim();
        // Limpiar caracteres especiales del markdown
        companyName = companyName.replace(/\*\*/g, '').replace(/[()]/g, '').trim();
        if (companyName.length > 3) {
          return companyName;
        }
      }
    }
    
    // Si no se encuentra un patrón específico, buscar nombres típicos de empresas
    const companyMatches = content.match(/([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Co\.?,?\s*Ltd\.?|Corporation|Trading|Industrial))/g);
    if (companyMatches && companyMatches.length > 0) {
      return companyMatches[0].replace(/\*\*/g, '').trim();
    }
    
    return 'Empresa China';
  };

  // Manejar extracción de datos de empresas desde documentos
  const handleCompanyDataExtracted = async (extractedData: any, searchQuery: string) => {
    try {
      // Enviar mensaje con los datos extraídos
      const messageWithData = `He extraído los siguientes datos de la empresa desde el documento:

📋 **DATOS EXTRAÍDOS:**
${extractedData.chineseName ? `- **Nombre chino:** ${extractedData.chineseName}` : ''}
${extractedData.englishName ? `- **Nombre inglés:** ${extractedData.englishName}` : ''}
${extractedData.website ? `- **Sitio web:** ${extractedData.website}` : ''}
${extractedData.contact ? `- **Contacto:** ${extractedData.contact}` : ''}
${extractedData.email ? `- **Email:** ${extractedData.email}` : ''}
${extractedData.address ? `- **Dirección:** ${extractedData.address}` : ''}
${extractedData.brands ? `- **Marcas:** ${extractedData.brands.join(', ')}` : ''}
${extractedData.products ? `- **Productos:** ${extractedData.products.join(', ')}` : ''}

🔍 Ahora busco esta empresa en mi base de datos de 24,225 empresas verificadas...`;

      // Enviar el mensaje con los datos extraídos
      await sendMessage(messageWithData);
      
      // Después buscar en la base de datos con los términos extraídos
      setTimeout(async () => {
        await sendMessage(`Buscar empresa: ${searchQuery}`);
      }, 1000);

    } catch (error) {
      console.error('Error al procesar datos extraídos:', error);
      await sendMessage('❌ Error al procesar los datos extraídos del documento. Por favor, intenta de nuevo.');
    }
  };

  const handleWelcomeCardAction = async (action: string, data?: any) => {
    switch (action) {
      case 'company-search':
        if (data?.query) {
          setMessage(`Reporte completo de empresa: ${data.query}`);
          setTimeout(async () => {
            await sendMessage(`Reporte completo de empresa: ${data.query}`);
            setMessage('');
          }, 100);
        }
        break;
      
      case 'file-upload':
        setIsAdvancedPanelOpen(true);
        setActiveTab('document');
        break;
      
      case 'manual-review':
        await sendMessage('Solicito una revisión manual de empresa. Por favor, crea un ticket para investigación humana.');
        break;
      
      case 'exhaustive-report':
        await sendMessage('Solicito un reporte exhaustivo de empresa con análisis de riesgo completo y verificación de antecedentes. Por favor, proporciona información detallada sobre la empresa que necesitas analizar.');
        break;
      
      case 'multiple-report':
        await sendMessage('Quiero realizar un reporte múltiple de hasta 30 empresas. Por favor, proporciona la lista de empresas que necesitas verificar o indica cómo quieres enviar el listado.');
        break;
      
      case 'translation':
        if (data?.text && data?.direction) {
          const directionText = data.direction === 'es-to-zh' ? 'del español al chino' : 'del chino al español';
          await sendMessage(`Traduce ${directionText}: ${data.text}`);
        }
        break;
      
      case 'brand-ranking':
        if (data?.category) {
          await sendMessage(`Busca el ranking de las mejores marcas chinas en la categoría: ${data.category}. Por favor, traduce automáticamente esta categoría al chino y busca en https://www.maigoo.com/category/brand/ para proporcionar el enlace directo y las mejores marcas.`);
        }
        break;
      
      default:
        console.log('Acción no manejada:', action, data);
    }
  };

  // Removed obsolete example cards as requested

  const formatMessageContent = (content: string) => {
    // Detectar si es un reporte de empresa (contiene negritas HTML)
    const hasHTMLBold = content.includes('<strong>') && content.includes('</strong>');
    
    return content.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h3 key={index} className="font-bold text-china-navy mb-2">
            {line.replace(/\*\*/g, '')}
          </h3>
        );
      }
      if (line.startsWith('*') && line.endsWith('*')) {
        return (
          <p key={index} className="italic text-gray-600 mb-2">
            {line.replace(/\*/g, '')}
          </p>
        );
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      
      // Si la línea contiene HTML de negritas, renderizar con dangerouslySetInnerHTML
      if (hasHTMLBold && line.includes('<strong>')) {
        return (
          <p 
            key={index} 
            className="mb-2"
            dangerouslySetInnerHTML={{ __html: line }}
          />
        );
      }
      
      return (
        <p key={index} className="mb-2">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-china-red rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-china-navy">
              {currentConversation?.title || 'Nueva Conversación'}
            </h2>
            <p className="text-sm text-gray-500">
              Verificador de empresas chinas con IA
            </p>
          </div>
          {currentConversation && (
            <Badge variant="secondary" className="ml-auto">
              {currentConversation.messages.length} mensajes
            </Badge>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-6 py-4">
        {!currentConversation || currentConversation.messages.length === 0 ? (
          /* Welcome Screen with Interactive Cards */
          <div className="flex flex-col h-full">
            {/* Header Section */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-24 h-24 bg-china-red rounded-full flex items-center justify-center mb-6 shadow-lg">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
              
              <h1 className="text-3xl font-bold text-china-navy mb-4">
                ¡Bienvenido a China Verifier!
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl">
                Tu asistente especializado en verificación de empresas chinas. 
                Selecciona una categoría para acceder a herramientas especializadas.
              </p>
            </div>

            {/* Interactive Cards Section */}
            <div className="flex-1 flex flex-col items-center justify-start space-y-6">
              <WelcomeCards onAction={handleWelcomeCardAction} />
              
              {/* Smart Search Examples */}
              <div className="w-full max-w-4xl">
                <SmartSearchExamples onQuerySelect={(query) => setMessage(query)} />
              </div>
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="space-y-6 max-w-4xl mx-auto">
            {currentConversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex space-x-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <Avatar>
                    <AvatarFallback className="bg-china-red text-white">
                      <CheckCircle className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-3xl ${
                    msg.role === 'user'
                      ? 'bg-china-red text-white rounded-2xl rounded-br-md'
                      : 'bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm'
                  } px-4 py-3`}
                >
                  <div className={msg.role === 'assistant' ? 'text-gray-800' : 'text-white'}>
                    {formatMessageContent(msg.content)}
                  </div>
                  
                  {/* Botón de exportar PDF para reportes de empresas */}
                  {msg.role === 'assistant' && isCompanyReport(msg.content) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <PDFExporter
                        companyName={extractCompanyName(msg.content)}
                        reportContent={msg.content}
                        className="w-full justify-center"
                      />
                    </div>
                  )}
                  
                  {msg.attachments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Archivos adjuntos:</p>
                      <div className="space-y-1">
                        {msg.attachments.map((attachment, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Paperclip className="w-3 h-3 mr-1" />
                            Archivo {index + 1}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className={`text-xs mt-2 ${
                    msg.role === 'user' ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {new Date(msg.createdAt).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {msg.role === 'user' && (
                  <Avatar>
                    <AvatarFallback className="bg-china-navy text-white">
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-china-red text-white">
                    <CheckCircle className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-china-red" />
                    <span className="text-gray-600">Analizando tu consulta...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Indicador de Progreso */}
          <LoadingProgress 
            isVisible={isProcessing}
            progress={processingProgress}
            status={processingStatus}
            onComplete={() => {
              // Opcional: acciones al completar
            }}
          />

          {/* Panel de Funciones Avanzadas - Compactado */}
          {isAdvancedPanelOpen && (
            <div className="mb-3 border border-gray-200 rounded-lg bg-gray-50 px-4 py-3">
              {/* Título compactado - 12px margen inferior */}
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-china-navy flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-china-red" />
                  Funciones Avanzadas
                </h4>
                <Button
                  onClick={() => {
                    setIsAdvancedPanelOpen(false);
                    setVerificationInput('');
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Pestañas con colores dinámicos - 12px superior e inferior */}
              <div className="grid grid-cols-2 gap-2 my-3">
                <Button
                  onClick={() => setActiveTab('document')}
                  className={`text-xs h-8 transition-all duration-150 ${
                    activeTab === 'document' 
                      ? 'bg-[#E53935] hover:bg-[#E53935]/90 text-white shadow-[0_2px_4px_rgba(0,0,0,0.12)]' 
                      : 'bg-[#2D3748] hover:bg-[#2D3748]/90 text-white'
                  }`}
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Subir Documento
                </Button>
                <Button
                  onClick={() => setActiveTab('verification')}
                  className={`text-xs h-8 transition-all duration-150 ${
                    activeTab === 'verification' 
                      ? 'bg-[#E53935] hover:bg-[#E53935]/90 text-white shadow-[0_2px_4px_rgba(0,0,0,0.12)]' 
                      : 'bg-[#2D3748] hover:bg-[#2D3748]/90 text-white'
                  }`}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verificación Oficial
                </Button>
              </div>

              {/* Contenido de las pestañas */}
              {activeTab === 'verification' && (
                <div className="space-y-2">
                  {/* Cinta compactada - padding 4px vertical, fuente xs, 8px margen inferior */}
                  <Badge variant="secondary" className="text-xs py-1 mb-2">
                    Base de 24,225 empresas verificadas
                  </Badge>

                  {/* Input altura 48px */}
                  <Textarea
                    placeholder="Nombre de empresa, código social, o sitio web oficial..."
                    value={verificationInput}
                    onChange={(e) => setVerificationInput(e.target.value)}
                    className="text-sm min-h-[48px] max-h-[48px] resize-none"
                  />

                  {/* Botones altura 44px, padding lateral 12px, separación 6px */}
                  <div className="space-y-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (verificationInput.trim()) {
                          const searchQuery = `Reporte completo de empresa: ${verificationInput}`;
                          setMessage(searchQuery);
                          setVerificationInput('');
                          setIsAdvancedPanelOpen(false);
                          setTimeout(async () => {
                            await sendMessage(searchQuery);
                            setMessage('');
                          }, 100);
                        }
                      }}
                      className="bg-white border-china-red/20 text-china-navy hover:bg-china-red/5 justify-start text-xs h-11 px-3 w-full"
                    >
                      <Search className="w-3 h-3 mr-2" />
                      Búsqueda Exhaustiva en Base de Datos
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (verificationInput.trim()) {
                          const searchQuery = `Verificar información oficial: ${verificationInput}`;
                          setMessage(searchQuery);
                          setVerificationInput('');
                          setIsAdvancedPanelOpen(false);
                          setTimeout(async () => {
                            await sendMessage(searchQuery);
                            setMessage('');
                          }, 100);
                        }
                      }}
                      className="bg-white border-china-red/20 text-china-navy hover:bg-china-red/5 justify-start text-xs h-11 px-3 w-full"
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      Verificar Fuente Oficial Externa
                    </Button>
                  </div>

                  {/* Sugerencias rápidas rediseñadas */}
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-1 font-semibold text-sm">
                      <Search className="w-[18px] h-[18px] text-[#A0AEC0]" />
                      <span>Busca empresa por…</span>
                    </div>
                    <ul className="space-y-2 sm:space-y-1">
                      {[
                        "Nombre de la Empresa",
                        "Marca", 
                        "Sitio Web",
                        "Rubro"
                      ].map((item, index) => (
                        <li 
                          key={index}
                          className="text-sm font-medium text-gray-700 hover:underline hover:text-[#1A202C] cursor-pointer py-1"
                          onClick={() => setVerificationInput(item.toLowerCase())}
                        >
                          {index + 1}. {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'document' && (
                <div className="space-y-2">
                  {/* Línea descriptiva compactada - line-height 1.3, 8px espacio inferior */}
                  <div className="text-xs text-gray-600 leading-[1.3] mb-2">
                    Sube una imagen, tarjeta de presentación o PDF que contenga información de empresas chinas. 
                    El sistema extraerá automáticamente nombres, sitios web, marcas y datos de contacto.
                  </div>
                  
                  {/* Tarjeta azul compactada - padding 12x16px, margen inferior 12px */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-3">
                    <div className="text-xs text-blue-800 font-medium">
                      📄 Extractor de Datos de Empresas
                    </div>
                  </div>
                  
                  <CompanyDocumentProcessor
                    onCompanyDataExtracted={handleCompanyDataExtracted}
                  />
                </div>
              )}
            </div>
          )}

          {/* Campo de entrada unificado estilo ChatGPT */}
          <div className="relative bg-white border border-gray-300 rounded-[26px] flex items-center transition-colors duration-150 focus-within:border-blue-500 hover:border-gray-400">
            {/* Botón de funciones avanzadas */}
            <Button
              onClick={() => setIsAdvancedPanelOpen(!isAdvancedPanelOpen)}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-china-red hover:bg-gray-100 h-8 w-8 p-0 flex-shrink-0 ml-3 relative top-[-1px]"
              title="Funciones Avanzadas"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            
            {/* Textarea principal */}
            <Textarea
              ref={textareaRef}
              placeholder="Busca empresas chinas, solicita reportes completos..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                // Auto-expansión
                const textarea = e.target;
                textarea.style.height = 'auto';
                textarea.style.height = Math.min(textarea.scrollHeight, window.innerHeight * 0.4) + 'px';
              }}
              onKeyPress={handleKeyPress}
              className="flex-1 w-full resize-none border-0 focus:ring-0 focus:border-0 bg-transparent text-gray-900 placeholder-gray-500 placeholder-opacity-60"
              style={{ 
                padding: '14px 16px',
                fontSize: '16px',
                lineHeight: '1.4',
                minHeight: '44px',
                maxHeight: '40vh',
                overflowY: 'auto'
              }}
              disabled={isLoading}
            />
            
            {/* Botones de la derecha */}
            <div className="flex items-center gap-2 mr-3 relative top-[-1px]">
              {/* Dictado por voz */}
              <VoiceRecorder
                onTranscription={(text) => setMessage(text)}
                disabled={isLoading}
              />
              
              {/* Botón de envío */}
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !message.trim()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white h-8 w-8 p-0 flex-shrink-0 rounded-full"
                title="Enviar mensaje"
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
      </div>
    </div>
  );
};

export default ChatInterface;
