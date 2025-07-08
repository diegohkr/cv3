import React, { useState, useRef, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Upload, 
  Image, 
  FileText, 
  X, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Building2,
  Search,
  Globe,
  Tag,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { CompanyExtractedData } from '../types';

interface CompanyDocumentProcessorProps {
  onCompanyDataExtracted: (data: CompanyExtractedData, searchQuery: string) => void;
}

const CompanyDocumentProcessor: React.FC<CompanyDocumentProcessorProps> = ({ 
  onCompanyDataExtracted
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<CompanyExtractedData | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedTypes = {
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/webp': 'image',
    'image/gif': 'image',
    'application/pdf': 'pdf',
  };

  const validateFile = (file: File): string | null => {
    if (file.size > 10 * 1024 * 1024) { // 10MB límite
      return `El archivo "${file.name}" supera el límite de 10MB`;
    }

    if (!Object.keys(supportedTypes).includes(file.type)) {
      return `El tipo de archivo "${file.type}" no es compatible. Solo se permiten imágenes (JPG, PNG, WebP, GIF) y PDFs`;
    }

    return null;
  };

  const extractCompanyDataWithAI = async (file: File): Promise<CompanyExtractedData> => {
    try {
      setProgress(30);
      
      // Convertir archivo a base64 si es imagen
      let base64Data = '';
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        base64Data = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      setProgress(60);

      // Importar el servicio OpenAI
      const { openAIService } = await import('../services/openai');
      
      // Llamar directamente al servicio OpenAI
      const extractedData = await openAIService.extractCompanyDataFromDocument(
        file.type,
        base64Data,
        file.name
      );

      setProgress(90);
      return extractedData;
    } catch (error) {
      console.error('Error en extracción con IA:', error);
      throw new Error('Error al extraer datos del documento');
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError('');
    setProgress(10);

    try {
      const extractedData = await extractCompanyDataWithAI(file);
      
      setProgress(100);
      setExtractedData(extractedData);
      setProcessedFile(file);

      // Crear consulta de búsqueda basada en los datos extraídos
      const searchTerms = [
        extractedData.chineseName,
        extractedData.englishName,
        extractedData.website,
        ...(extractedData.brands || [])
      ].filter(Boolean);

      const searchQuery = searchTerms.join(' ');
      
      if (searchQuery.trim()) {
        onCompanyDataExtracted(extractedData, searchQuery);
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al procesar el archivo');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFiles = useCallback(async (files: FileList) => {
    setError('');
    
    if (files.length === 0) return;
    
    // Solo procesar el primer archivo
    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    await processFile(file);
  }, []);

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

  const clearProcessedFile = () => {
    setExtractedData(null);
    setProcessedFile(null);
    setError('');
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const searchWithExtractedData = () => {
    if (extractedData) {
      const searchTerms = [
        extractedData.chineseName,
        extractedData.englishName,
        extractedData.website,
        ...(extractedData.brands || [])
      ].filter(Boolean);

      const searchQuery = searchTerms.join(' ');
      if (searchQuery.trim()) {
        onCompanyDataExtracted(extractedData, searchQuery);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header explicativo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-blue-900">Extractor de Datos de Empresas</h3>
        </div>
        <p className="text-xs text-blue-700">
          Sube una imagen o PDF que contenga información de empresas chinas. El sistema extraerá automáticamente nombres, sitios web, marcas y datos de contacto para buscar en nuestra base de datos.
        </p>
      </div>

      {/* Drop Zone - Compactado a 160px altura mínima */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer min-h-[160px] ${
          isDragOver 
            ? 'border-china-red bg-china-red/5' 
            : 'border-gray-300 hover:border-china-red hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <div className="p-6 text-center flex flex-col justify-center min-h-[160px]">
          <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${
            isDragOver ? 'bg-china-red text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">
            Arrastra aquí tu documento empresarial
          </p>
          <p className="text-xs text-gray-500 mb-2">
            o haz clic para seleccionar archivo
          </p>
          <div className="flex justify-center space-x-4 text-xs text-gray-400">
            <span className="flex items-center">
              <Image className="w-3 h-3 mr-1" />
              JPG, PNG, WebP, GIF
            </span>
            <span className="flex items-center">
              <FileText className="w-3 h-3 mr-1" />
              PDF
            </span>
          </div>
        </div>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Progress */}
      {isProcessing && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-china-red" />
            <span className="text-sm text-gray-600">
              Extrayendo datos de empresa con IA...
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-gray-500 text-center">
            {progress < 30 && "Preparando documento..."}
            {progress >= 30 && progress < 60 && "Analizando contenido con IA..."}
            {progress >= 60 && progress < 90 && "Extrayendo datos de empresa..."}
            {progress >= 90 && "Finalizando procesamiento..."}
          </div>
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

      {/* Extracted Data Display */}
      {extractedData && processedFile && (
        <div className="space-y-4">
          <Card className="border-green-200 bg-green-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="text-sm font-semibold text-green-900">
                    Datos Extraídos de: {processedFile.name}
                  </h4>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearProcessedFile}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {extractedData.chineseName && (
                  <div className="flex items-center space-x-2">
                    <Tag className="w-3 h-3 text-red-600" />
                    <span className="font-medium">Nombre chino:</span>
                    <span className="text-gray-700">{extractedData.chineseName}</span>
                  </div>
                )}
                
                {extractedData.englishName && (
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-3 h-3 text-blue-600" />
                    <span className="font-medium">Nombre inglés:</span>
                    <span className="text-gray-700">{extractedData.englishName}</span>
                  </div>
                )}

                {extractedData.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="w-3 h-3 text-green-600" />
                    <span className="font-medium">Sitio web:</span>
                    <span className="text-gray-700">{extractedData.website}</span>
                  </div>
                )}

                {extractedData.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3 h-3 text-purple-600" />
                    <span className="font-medium">Email:</span>
                    <span className="text-gray-700">{extractedData.email}</span>
                  </div>
                )}

                {extractedData.contact && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3 h-3 text-orange-600" />
                    <span className="font-medium">Contacto:</span>
                    <span className="text-gray-700">{extractedData.contact}</span>
                  </div>
                )}

                {extractedData.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3 h-3 text-red-600" />
                    <span className="font-medium">Dirección:</span>
                    <span className="text-gray-700">{extractedData.address}</span>
                  </div>
                )}
              </div>

              {extractedData.brands && extractedData.brands.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-medium text-gray-700">Marcas detectadas:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {extractedData.brands.map((brand, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {brand}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {extractedData.products && extractedData.products.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-medium text-gray-700">Productos detectados:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {extractedData.products.map((product, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {product}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-center">
                <Button 
                  onClick={searchWithExtractedData}
                  className="bg-china-red hover:bg-red-600 text-white"
                  size="sm"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Buscar en Base de Datos
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CompanyDocumentProcessor;
