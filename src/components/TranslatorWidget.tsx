import React, { useState, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Languages, Volume2, Mic, Loader2, MicOff, Square, Zap } from 'lucide-react';
import WhisperService from '../services/whisperService';
import TranslationService from '../services/translationService';

interface TranslatorWidgetProps {
  onBack: () => void;
}

const TranslatorWidget: React.FC<TranslatorWidgetProps> = ({ onBack }) => {
  const [esText, setEsText] = useState('');
  const [zhText, setZhText] = useState('');
  const [esTranslation, setEsTranslation] = useState('');
  const [zhTranslation, setZhTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Estados para grabación de audio
  const [isRecordingEs, setIsRecordingEs] = useState(false);
  const [isRecordingZh, setIsRecordingZh] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Estados para flujo automático de traducción por voz
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);
  const [lastInputSource, setLastInputSource] = useState<'voice' | 'manual' | null>(null);
  
  // Referencias para MediaRecorder
  const mediaRecorderEs = useRef<MediaRecorder | null>(null);
  const mediaRecorderZh = useRef<MediaRecorder | null>(null);
  const audioChunksEs = useRef<Blob[]>([]);
  const audioChunksZh = useRef<Blob[]>([]);
  
  // Instancias de servicios
  const whisperService = new WhisperService();
  const translationService = new TranslationService();

  // Función para traducción automática después de transcripción por voz
  const performAutoTranslation = async (text: string, direction: 'es-to-zh' | 'zh-to-es') => {
    if (!text.trim()) return;

    setIsAutoTranslating(true);
    setErrorMessage('');
    
    try {
      console.log('Iniciando traducción automática...');
      
      // Verificar si realmente necesita traducción
      if (!TranslationService.needsTranslation(text, direction)) {
        console.log('Texto ya está en el idioma destino, omitiendo traducción');
        return;
      }

      // Llamar al servicio de traducción con ChatGPT-4o
      const translation = await translationService.translateText({
        text,
        direction
      });

      // Colocar traducción en el campo correspondiente
      if (direction === 'es-to-zh') {
        setEsTranslation(translation);
      } else {
        setZhTranslation(translation);
      }

      console.log('Traducción automática completada:', translation);

    } catch (error) {
      console.error('Error en traducción automática:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error en traducción automática';
      setErrorMessage(`Traducción automática falló: ${errorMsg}`);
    } finally {
      setIsAutoTranslating(false);
    }
  };

  // Función para traducción manual (solo para texto escrito a mano)
  const translateTextManually = async (text: string, direction: 'es-to-zh' | 'zh-to-es') => {
    if (!text.trim()) {
      setErrorMessage('Escribe algo para traducir');
      return;
    }

    // Solo permitir traducción manual si el texto fue escrito manualmente
    if (lastInputSource === 'voice') {
      setErrorMessage('Este texto fue transcrito por voz y ya se tradujo automáticamente');
      return;
    }

    setIsTranslating(true);
    setErrorMessage('');
    
    try {
      console.log('Iniciando traducción manual...');
      
      // Verificar si realmente necesita traducción
      if (!TranslationService.needsTranslation(text, direction)) {
        setErrorMessage('El texto ya parece estar en el idioma destino');
        return;
      }

      // Llamar al servicio de traducción con ChatGPT-4o
      const translation = await translationService.translateText({
        text,
        direction
      });

      // Colocar traducción en el campo correspondiente
      if (direction === 'es-to-zh') {
        setEsTranslation(translation);
      } else {
        setZhTranslation(translation);
      }

      console.log('Traducción manual completada:', translation);

    } catch (error) {
      console.error('Error en traducción manual:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error en la traducción';
      setErrorMessage(errorMsg);
    } finally {
      setIsTranslating(false);
    }
  };

  // Función para iniciar grabación de audio
  const startRecording = async (language: 'es' | 'zh') => {
    try {
      // Verificar soporte de grabación
      if (!WhisperService.isAudioRecordingSupported()) {
        setErrorMessage('Grabación de audio no disponible en este navegador');
        return;
      }

      setErrorMessage('');
      
      // Obtener acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia(
        WhisperService.getAudioConstraints()
      );

      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      // Configurar referencias según el idioma
      if (language === 'es') {
        mediaRecorderEs.current = mediaRecorder;
        audioChunksEs.current = [];
        setIsRecordingEs(true);
      } else {
        mediaRecorderZh.current = mediaRecorder;
        audioChunksZh.current = [];
        setIsRecordingZh(true);
      }

      // Event listeners para MediaRecorder
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          if (language === 'es') {
            audioChunksEs.current.push(event.data);
          } else {
            audioChunksZh.current.push(event.data);
          }
        }
      };

      mediaRecorder.onstop = async () => {
        // Detener el stream
        stream.getTracks().forEach(track => track.stop());
        
        // Procesar audio grabado
        await processRecordedAudio(language);
      };

      // Iniciar grabación
      mediaRecorder.start();
      console.log(`Grabación iniciada para ${language}`);

    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      setErrorMessage('Error al acceder al micrófono. Verifica los permisos.');
      
      // Resetear estados en caso de error
      if (language === 'es') {
        setIsRecordingEs(false);
      } else {
        setIsRecordingZh(false);
      }
    }
  };

  // Función para detener grabación
  const stopRecording = (language: 'es' | 'zh') => {
    const mediaRecorder = language === 'es' ? mediaRecorderEs.current : mediaRecorderZh.current;
    
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      console.log(`Grabación detenida para ${language}`);
    }
    
    // Actualizar estados
    if (language === 'es') {
      setIsRecordingEs(false);
    } else {
      setIsRecordingZh(false);
    }
  };

  // Función para procesar audio grabado con Whisper
  const processRecordedAudio = async (language: 'es' | 'zh') => {
    try {
      setIsTranscribing(true);
      setErrorMessage('');

      // Obtener chunks de audio según el idioma
      const audioChunks = language === 'es' ? audioChunksEs.current : audioChunksZh.current;
      
      if (audioChunks.length === 0) {
        throw new Error('No se grabó audio');
      }

      // Crear blob de audio
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      
      // Verificar tamaño mínimo del archivo
      if (audioBlob.size < 1000) { // 1KB mínimo
        throw new Error('Grabación muy corta. Intenta hablar más tiempo.');
      }

      console.log(`Procesando audio de ${audioBlob.size} bytes para ${language}`);

      // Configurar idioma para Whisper
      const whisperLanguage = language === 'es' ? 'es' : 'zh';

      // Enviar a Whisper API
      const transcription = await whisperService.transcribeAudio({
        audioBlob,
        language: whisperLanguage
      });

      // Colocar transcripción en el campo correspondiente
      if (transcription.trim()) {
        if (language === 'es') {
          setEsText(transcription);
          setLastInputSource('voice');
          // Automáticamente traducir al chino después de transcripción
          await performAutoTranslation(transcription, 'es-to-zh');
        } else {
          setZhText(transcription);
          setLastInputSource('voice');
          // Automáticamente traducir al español después de transcripción
          await performAutoTranslation(transcription, 'zh-to-es');
        }
        console.log(`Transcripción exitosa (${language}):`, transcription);
      } else {
        setErrorMessage('No se detectó voz en la grabación. Intenta de nuevo.');
      }

    } catch (error) {
      console.error('Error en transcripción:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido en transcripción';
      setErrorMessage(errorMsg);
    } finally {
      setIsTranscribing(false);
      
      // Limpiar chunks de audio
      if (language === 'es') {
        audioChunksEs.current = [];
      } else {
        audioChunksZh.current = [];
      }
    }
  };

  // Función para manejar clic en micrófono
  const handleVoiceInput = (language: 'es' | 'zh') => {
    const isRecording = language === 'es' ? isRecordingEs : isRecordingZh;
    
    if (isRecording) {
      stopRecording(language);
    } else {
      startRecording(language);
    }
  };

  // Función para leer texto en voz alta
  const speakText = (text: string, language: 'es' | 'zh') => {
    if (!text.trim()) return;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'es' ? 'es-ES' : 'zh-CN';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error al reproducir texto:', error);
      setErrorMessage('Síntesis de voz no disponible');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {/* Botón de volver */}
      <Button
        onClick={onBack}
        variant="ghost"
        className="mb-4 text-china-navy hover:text-china-red"
      >
        ← Volver al menú principal
      </Button>

      {/* Título */}
      <h3 className="text-2xl font-bold text-china-navy mb-6 text-center">
        Traductor Español ↔ Chino
      </h3>

      {/* Mensaje de error local */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{errorMessage}</p>
          <Button
            onClick={() => setErrorMessage('')}
            variant="ghost"
            size="sm"
            className="mt-2 text-red-600 hover:text-red-800"
          >
            Cerrar
          </Button>
        </div>
      )}

      {/* Indicador de transcripción */}
      {isTranscribing && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <p className="text-blue-700 font-medium">Transcribiendo audio con IA...</p>
          </div>
        </div>
      )}

      {/* Indicador de traducción automática */}
      {isAutoTranslating && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <Zap className="w-5 h-5 animate-pulse text-green-600" />
            <p className="text-green-700 font-medium">Traduciendo automáticamente con ChatGPT-4o...</p>
          </div>
        </div>
      )}

      {/* Información del servicio */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700 text-sm">
          🤖 <strong>Traductor Inteligente</strong> - Transcripción automática con OpenAI Whisper + Traducción con ChatGPT-4o. 
          <br />🎤 <strong>Flujo por voz:</strong> Graba → Transcribe → Traduce automáticamente
          <br />⌨️ <strong>Entrada manual:</strong> Escribe y usa el botón "Traducir" manualmente
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Panel Español → Chino */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg">
                <h4 className="font-bold text-xl">Español → Chino</h4>
              </div>
              
              <div className="space-y-4">
                {/* Botón de micrófono */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    className={`w-16 h-16 rounded-full border-2 transition-all duration-200 ${
                      isRecordingEs
                        ? 'border-red-500 bg-red-100 animate-pulse shadow-lg' 
                        : 'border-red-300 hover:border-red-500 hover:bg-red-50'
                    }`}
                    onClick={() => handleVoiceInput('es')}
                    disabled={isTranscribing || isRecordingZh || isAutoTranslating}
                    title={
                      isRecordingEs 
                        ? "Grabando... Clic para detener" 
                        : "Clic para grabar en español"
                    }
                  >
                    {isRecordingEs ? (
                      <div className="relative">
                        <Square className="w-6 h-6 text-red-700 fill-current" />
                        <div className="absolute -inset-1 border-2 border-red-500 rounded-full animate-ping"></div>
                      </div>
                    ) : (
                      <Mic className="w-8 h-8 text-red-600" />
                    )}
                  </Button>
                </div>
                
                {/* Indicador de grabación */}
                {isRecordingEs && (
                  <div className="text-center">
                    <p className="text-sm text-red-600 font-medium animate-pulse">
                      🎤 Grabando en español... Habla ahora
                    </p>
                  </div>
                )}
                
                {/* Área de texto en español */}
                <Textarea
                  placeholder={
                    isRecordingEs 
                      ? "Grabando audio en español..." 
                      : "Escribe o graba audio en español para traducir al chino..."
                  }
                  value={esText}
                  onChange={(e) => {
                    setEsText(e.target.value);
                    setLastInputSource('manual');
                    if (esTranslation) setEsTranslation('');
                  }}
                  className="min-h-[100px] text-center resize-none"
                  disabled={isRecordingEs || isTranscribing || isAutoTranslating}
                />
                
                {/* Botón de traducir */}
                <Button 
                  onClick={() => translateTextManually(esText, 'es-to-zh')} 
                  className="w-full bg-red-500 hover:bg-red-600" 
                  disabled={!esText.trim() || isTranslating || isAutoTranslating}
                >
                  {isTranslating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Traduciendo...
                    </>
                  ) : lastInputSource === 'voice' ? (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Traducido automáticamente por voz
                    </>
                  ) : (
                    <>
                      <Languages className="w-4 h-4 mr-2" />
                      Traducir al Chino (manual)
                    </>
                  )}
                </Button>
                
                {/* Resultado de traducción */}
                {esTranslation && (
                  <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Traducción:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => speakText(esTranslation, 'zh')}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Volume2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-lg font-chinese text-center">{esTranslation}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panel Chino → Español */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                <h4 className="font-bold text-xl">Chino → Español</h4>
              </div>
              
              <div className="space-y-4">
                {/* Botón de micrófono */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    className={`w-16 h-16 rounded-full border-2 transition-all duration-200 ${
                      isRecordingZh
                        ? 'border-blue-500 bg-blue-100 animate-pulse shadow-lg' 
                        : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                    onClick={() => handleVoiceInput('zh')}
                    disabled={isTranscribing || isRecordingEs}
                    title={
                      isRecordingZh 
                        ? "录音中... 点击停止" 
                        : "点击录制中文语音"
                    }
                  >
                    {isRecordingZh ? (
                      <div className="relative">
                        <Square className="w-6 h-6 text-blue-700 fill-current" />
                        <div className="absolute -inset-1 border-2 border-blue-500 rounded-full animate-ping"></div>
                      </div>
                    ) : (
                      <Mic className="w-8 h-8 text-blue-600" />
                    )}
                  </Button>
                </div>
                
                {/* Indicador de grabación */}
                {isRecordingZh && (
                  <div className="text-center">
                    <p className="text-sm text-blue-600 font-medium animate-pulse">
                      🎤 正在录制中文... 请开始说话
                    </p>
                  </div>
                )}
                
                {/* Área de texto en chino */}
                <Textarea
                  placeholder={
                    isRecordingZh 
                      ? "正在录制中文音频..." 
                      : "输入或录制中文音频以翻译成西班牙语..."
                  }
                  value={zhText}
                  onChange={(e) => {
                    setZhText(e.target.value);
                    setLastInputSource('manual');
                    if (zhTranslation) setZhTranslation('');
                  }}
                  className="min-h-[100px] text-center resize-none font-chinese"
                  disabled={isRecordingZh || isTranscribing || isAutoTranslating}
                />
                
                {/* Botón de traducir */}
                <Button 
                  onClick={() => translateTextManually(zhText, 'zh-to-es')} 
                  className="w-full bg-blue-500 hover:bg-blue-600" 
                  disabled={!zhText.trim() || isTranslating || isAutoTranslating}
                >
                  {isTranslating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      翻译中...
                    </>
                  ) : lastInputSource === 'voice' ? (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      语音自动翻译完成
                    </>
                  ) : (
                    <>
                      <Languages className="w-4 h-4 mr-2" />
                      翻译成西班牙语 (手动)
                    </>
                  )}
                </Button>
                
                {/* Resultado de traducción */}
                {zhTranslation && (
                  <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Traducción:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => speakText(zhTranslation, 'es')}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Volume2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-lg text-center">{zhTranslation}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pie de página con información */}
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>
          🎯 <strong>Funcionalidades:</strong> Transcripción de voz con IA, traducción instantánea, síntesis de voz
        </p>
        <p className="mt-1">
          🎤 <strong>Grabación:</strong> Clic en micrófono para grabar → Transcripción automática con OpenAI Whisper
        </p>
        <p className="mt-2">
          📞 Para traducciones profesionales y documentos oficiales, contáctanos directamente
        </p>
      </div>
    </div>
  );
};

export default TranslatorWidget;
