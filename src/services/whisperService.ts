// Servicio de transcripción con OpenAI Whisper API
interface WhisperResponse {
  text: string;
}

interface TranscriptionRequest {
  audioBlob: Blob;
  language?: string;
}

class WhisperService {
  private apiKey: string;
  private baseURL: string = 'https://api.openai.com/v1/audio/transcriptions';

  constructor() {
    // Usando la misma API key que está configurada para ChatGPT
    this.apiKey = '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';
  }

  async transcribeAudio({ audioBlob, language = 'auto' }: TranscriptionRequest): Promise<string> {
    try {
      // Crear FormData para enviar el archivo de audio
      const formData = new FormData();
      
      // Convertir el blob a un archivo con la extensión correcta
      const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      
      // Configurar idioma si se especifica
      if (language !== 'auto') {
        formData.append('language', language);
      }

      console.log('Enviando audio a Whisper API...');
      
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error de Whisper API:', response.status, errorText);
        throw new Error(`Error de transcripción: ${response.status} - ${errorText}`);
      }

      const data: WhisperResponse = await response.json();
      console.log('Transcripción recibida:', data.text);
      
      return data.text || '';

    } catch (error) {
      console.error('Error en transcripción:', error);
      
      // Manejar diferentes tipos de error
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          throw new Error('Error de conexión. Verifica tu internet.');
        } else if (error.message.includes('401')) {
          throw new Error('Error de autenticación con el servicio de transcripción.');
        } else if (error.message.includes('429')) {
          throw new Error('Límite de uso excedido. Intenta más tarde.');
        }
        throw new Error(`Error de transcripción: ${error.message}`);
      }
      
      throw new Error('Error desconocido en la transcripción');
    }
  }

  // Función para verificar soporte de grabación de audio
  static isAudioRecordingSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // Función para obtener configuración de audio optimizada
  static getAudioConstraints(): MediaStreamConstraints {
    return {
      audio: {
        channelCount: 1, // Mono para reducir tamaño
        sampleRate: 16000, // Whisper funciona mejor con 16kHz
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    };
  }
}

export default WhisperService;
