import React from 'react';
import { Button } from './ui/button';
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFExporterProps {
  companyName: string;
  reportContent: string;
  className?: string;
}

const PDFExporter: React.FC<PDFExporterProps> = ({ 
  companyName, 
  reportContent, 
  className = "" 
}) => {
  const exportToPDF = async () => {
    try {
      // Crear un contenedor temporal para el PDF
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.top = '0';
      pdfContainer.style.width = '800px';
      pdfContainer.style.backgroundColor = 'white';
      pdfContainer.style.padding = '40px';
      pdfContainer.style.fontFamily = 'Montserrat, sans-serif';
      pdfContainer.style.fontSize = '12px';
      pdfContainer.style.lineHeight = '1.5';
      pdfContainer.style.color = '#333';

      // Crear el contenido del PDF con diseño profesional
      pdfContainer.innerHTML = `
        <div style="max-width: 720px; margin: 0 auto;">
          <!-- Header con logo -->
          <div style="display: flex; align-items: center; margin-bottom: 30px; border-bottom: 3px solid #E53E3E; padding-bottom: 20px;">
            <img src="/images/logo-large.png" alt="China Verifier" style="height: 60px; margin-right: 20px;" />
            <div style="flex: 1;">
              <h1 style="font-size: 24px; font-weight: bold; color: #2D3748; margin: 0;">
                Reporte de ${companyName}
              </h1>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">
                Generado el ${new Date().toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>

          <!-- Contenido del reporte -->
          <div style="white-space: pre-line; line-height: 1.6;">
            ${formatContentForPDF(reportContent)}
          </div>

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; text-align: center;">
            <p style="color: #666; font-size: 10px; margin: 0;">
              Información verificada de la Feria de Cantón - China Verifier
            </p>
            <p style="color: #666; font-size: 10px; margin: 5px 0 0 0;">
              Este reporte contiene información oficial y verificada de empresas chinas
            </p>
          </div>
        </div>
      `;

      document.body.appendChild(pdfContainer);

      // Esperar a que las imágenes se carguen
      await new Promise(resolve => setTimeout(resolve, 500));

      // Convertir a canvas
      const canvas = await html2canvas(pdfContainer, {
        width: 800,
        height: pdfContainer.scrollHeight,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Limpiar el contenedor temporal
      document.body.removeChild(pdfContainer);

      // Crear el PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // Margen de 10mm a cada lado
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      // Agregar primera página
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;

      // Agregar páginas adicionales si es necesario
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }

      // Descargar el PDF
      const fileName = `Reporte_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta de nuevo.');
    }
  };

  return (
    <Button
      onClick={exportToPDF}
      variant="outline"
      size="sm"
      className={`border-china-red text-china-red hover:bg-china-red hover:text-white ${className}`}
    >
      <Download className="w-4 h-4 mr-2" />
      Exportar PDF
    </Button>
  );
};

// Función para formatear el contenido del reporte para PDF
const formatContentForPDF = (content: string): string => {
  return content
    // Convertir emojis a texto HTML estilizado
    .replace(/🧾/g, '<span style="font-weight: bold; color: #E53E3E;">📋</span>')
    .replace(/📍/g, '<span style="color: #E53E3E;">📍</span>')
    .replace(/💼/g, '<span style="color: #E53E3E;">💼</span>')
    .replace(/🌐/g, '<span style="color: #E53E3E;">🌐</span>')
    .replace(/📦/g, '<span style="color: #E53E3E;">📦</span>')
    .replace(/🏭/g, '<span style="color: #E53E3E;">🏭</span>')
    
    // Mejorar el formato de las secciones
    .replace(/^(📋|📍|💼|🌐|📦|🏭)(.+)$/gm, '<h3 style="font-size: 16px; font-weight: bold; color: #2D3748; margin: 20px 0 10px 0; border-bottom: 1px solid #E2E8F0; padding-bottom: 5px;">$1$2</h3>')
    
    // Formatear campos de información
    .replace(/^([A-Za-zÁ-ÿ\s]+):\s*(.+)$/gm, '<div style="margin: 8px 0;"><strong style="color: #4A5568;">$1:</strong> $2</div>')
    
    // Mejorar formato de productos (líneas que contienen paréntesis)
    .replace(/^(.+)\s+\((.+)\)$/gm, '<div style="margin: 5px 0; padding: 5px; background-color: #F7FAFC; border-left: 3px solid #E53E3E;"><strong>$1</strong> <span style="color: #666;">($2)</span></div>')
    
    // Formatear separador final
    .replace(/^---.*$/gm, '<hr style="margin: 30px 0; border: none; border-top: 2px solid #E2E8F0;">')
    
    // Formatear texto en cursiva al final
    .replace(/^\*(.+)\*$/gm, '<div style="text-align: center; font-style: italic; color: #666; margin-top: 20px;">$1</div>');
};

export default PDFExporter;
