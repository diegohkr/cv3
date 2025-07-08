import React, { useEffect, useState } from 'react';
import { Progress } from './ui/progress';
import { Clock, Search, Database, Brain, CheckCircle } from 'lucide-react';

interface LoadingProgressProps {
  isVisible: boolean;
  progress: number;
  status: string;
  onComplete?: () => void;
}

const LoadingProgress: React.FC<LoadingProgressProps> = ({ 
  isVisible, 
  progress, 
  status, 
  onComplete 
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentIcon, setCurrentIcon] = useState<React.ReactNode>(<Search className="w-4 h-4" />);

  useEffect(() => {
    if (!isVisible) {
      setElapsedTime(0);
      return;
    }

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 0.1);
    }, 100);

    return () => clearInterval(timer);
  }, [isVisible]);

  useEffect(() => {
    // Cambiar icono según el progreso
    if (progress >= 100) {
      setCurrentIcon(<CheckCircle className="w-4 h-4 text-green-500" />);
      if (onComplete) {
        setTimeout(onComplete, 500);
      }
    } else if (progress >= 75) {
      setCurrentIcon(<Brain className="w-4 h-4 text-blue-500" />);
    } else if (progress >= 50) {
      setCurrentIcon(<Database className="w-4 h-4 text-purple-500" />);
    } else {
      setCurrentIcon(<Search className="w-4 h-4 text-china-red" />);
    }
  }, [progress, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {currentIcon}
          <span className="text-sm font-medium text-china-navy">
            China Verifier procesando...
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{elapsedTime.toFixed(1)}s</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <Progress 
          value={progress} 
          className="h-2" 
          style={{
            '--progress-background': progress >= 100 ? '#10b981' : '#E53E3E'
          } as React.CSSProperties}
        />
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">{status}</span>
          <span className="text-xs font-mono text-gray-500">
            {Math.min(Math.max(Math.round(elapsedTime), 1), 100)}s
          </span>
        </div>
      </div>

      {progress >= 100 && (
        <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          <span>Búsqueda completada en {elapsedTime.toFixed(1)} segundos</span>
        </div>
      )}
    </div>
  );
};

export default LoadingProgress;
