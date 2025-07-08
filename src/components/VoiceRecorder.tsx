import React, { useState, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Check, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscription, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [showConfirmButtons, setShowConfirmButtons] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm;codecs=opus' 
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        transcribeAudio();
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Auto-stop después de 60 segundos
      timeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 60000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error de micrófono",
        description: "Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isRecording]);

  const transcribeAudio = async () => {
    if (chunksRef.current.length === 0) {
      toast({
        title: "Error de grabación",
        description: "No se pudo grabar audio. Inténtalo de nuevo.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      // No especificamos idioma para auto-detección
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer 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`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error de transcripción: ${response.status}`);
      }

      const result = await response.json();
      const text = result.text?.trim();
      
      if (text) {
        setTranscribedText(text);
        setShowConfirmButtons(true);
        
        toast({
          title: "Transcripción completada",
          description: "Audio convertido a texto exitosamente",
        });
      } else {
        throw new Error('No se pudo transcribir el audio');
      }
      
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Error de transcripción",
        description: "No se pudo transcribir el audio. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmTranscription = () => {
    onTranscription(transcribedText);
    setTranscribedText('');
    setShowConfirmButtons(false);
  };

  const cancelTranscription = () => {
    setTranscribedText('');
    setShowConfirmButtons(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isRecording) {
        stopRecording();
      } else if (showConfirmButtons) {
        cancelTranscription();
      }
    } else if (e.key === 'Enter' && showConfirmButtons) {
      confirmTranscription();
    }
  };

  if (showConfirmButtons) {
    return (
      <div className="flex items-center space-x-2" onKeyDown={handleKeyDown}>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 max-w-xs">
          <p className="text-sm text-blue-900 truncate" title={transcribedText}>
            {transcribedText}
          </p>
        </div>
        <Button
          onClick={confirmTranscription}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white h-8 w-8 p-0 rounded-full"
          title="Confirmar transcripción (Enter)"
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          onClick={cancelTranscription}
          size="sm"
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50 h-8 w-8 p-0 rounded-full"
          title="Cancelar transcripción (Esc)"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled || isProcessing}
      variant="ghost"
      size="sm"
      className={`h-8 w-8 p-0 rounded-full flex-shrink-0 transition-all duration-200 ${
        isRecording 
          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
      aria-label={isRecording ? "Detener grabación" : "Iniciar dictado"}
      aria-pressed={isRecording}
      title={
        isProcessing 
          ? "Procesando audio..." 
          : isRecording 
            ? "Detener grabación (Esc)" 
            : "Iniciar dictado por voz"
      }
      onKeyDown={handleKeyDown}
    >
      {isProcessing ? (
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : isRecording ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
};

export default VoiceRecorder;
