import React, { useState, useRef, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { FileUpload as FileUploadType } from '../types';
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  X, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface FileUploadProps {
  onFilesUploaded: (files: FileUploadType[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFilesUploaded, 
  maxFiles = 5, 
  maxSizePerFile = 5 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadType[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedTypes = {
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/webp': 'image',
    'image/gif': 'image',
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
    'text/plain': 'document',
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return Image;
      case 'pdf':
        return FileText;
      case 'document':
        return File;
      default:
        return File;
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizePerFile * 1024 * 1024) {
      return `El archivo "${file.name}" supera el límite de ${maxSizePerFile}MB`;
    }

    if (!Object.keys(supportedTypes).includes(file.type)) {
      return `El tipo de archivo "${file.type}" no es compatible`;
    }

    return null;
  };

  const processFile = async (file: File): Promise<FileUploadType> => {
    const fileType = supportedTypes[file.type as keyof typeof supportedTypes];
    let content = '';
    let preview = '';

    try {
      if (fileType === 'image') {
        // Crear preview para imágenes
        preview = URL.createObjectURL(file);
        
        // Simular OCR (en un entorno real usarías Tesseract.js)
        content = `Imagen procesada: ${file.name} (${Math.round(file.size / 1024)}KB)`;
        
        // Aquí iría la integración real con Tesseract.js:
        // const { createWorker } = await import('tesseract.js');
        // const worker = createWorker();
        // await worker.load();
        // await worker.loadLanguage('eng+chi_sim');
        // await worker.initialize('eng+chi_sim');
        // const { data: { text } } = await worker.recognize(file);
        // content = text;
        // await worker.terminate();
      } else if (fileType === 'pdf') {
        // Simular extracción de texto de PDF
        content = `Contenido de PDF extraído: ${file.name}`;
        
        // Aquí iría la integración real con pdf-parse:
        // const pdfParse = await import('pdf-parse');
        // const arrayBuffer = await file.arrayBuffer();
        // const data = await pdfParse(arrayBuffer);
        // content = data.text;
      } else if (fileType === 'document') {
        // Leer archivo de texto
        content = await file.text();
      }

      return {
        file,
        type: fileType as 'image' | 'pdf' | 'document',
        content,
        preview,
      };
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      throw new Error(`Error al procesar ${file.name}`);
    }
  };

  const handleFiles = useCallback(async (files: FileList) => {
    setError('');
    
    if (uploadedFiles.length + files.length > maxFiles) {
      setError(`Solo puedes subir hasta ${maxFiles} archivos`);
      return;
    }

    const fileArray = Array.from(files);
    const validationErrors = fileArray.map(validateFile).filter(Boolean);
    
    if (validationErrors.length > 0) {
      setError(validationErrors[0]!);
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const processedFiles: FileUploadType[] = [];
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setProgress(((i + 1) / fileArray.length) * 100);
        
        const processedFile = await processFile(file);
        processedFiles.push(processedFile);
      }

      setUploadedFiles(prev => [...prev, ...processedFiles]);
      onFilesUploaded(processedFiles);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al procesar archivos');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [uploadedFiles.length, maxFiles, onFilesUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated;
    });
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragOver 
            ? 'border-china-red bg-china-red/5' 
            : 'border-gray-300 hover:border-china-red hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <div className="p-6 text-center">
          <Upload className={`w-8 h-8 mx-auto mb-3 ${isDragOver ? 'text-china-red' : 'text-gray-400'}`} />
          <p className="text-sm font-medium text-gray-900 mb-1">
            Arrastra archivos aquí o haz clic para seleccionar
          </p>
          <p className="text-xs text-gray-500">
            Soporta: JPG, PNG, WebP, GIF, PDF, DOCX, TXT (máx. {maxSizePerFile}MB cada uno)
          </p>
        </div>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Progress */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-china-red" />
            <span className="text-sm text-gray-600">Procesando archivos...</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            Archivos procesados ({uploadedFiles.length}/{maxFiles})
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile, index) => {
              const IconComponent = getFileIcon(uploadedFile.type);
              return (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border"
                >
                  <IconComponent className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {uploadedFile.type} • {Math.round(uploadedFile.file.size / 1024)}KB
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Procesado
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
