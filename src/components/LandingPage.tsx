import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, Shield, Search, FileText, Mic, Globe, ArrowRight, Star } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const handleStartRecording = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-china-light to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/business-bg.jpg')] bg-cover bg-center opacity-10"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="/images/logo-large.png" 
              alt="China Verifier Logo" 
              className="h-24 w-auto drop-shadow-lg"
            />
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl font-bold text-china-navy mb-6 leading-tight">
            Verifica Empresas Chinas
            <span className="block text-china-red">con Inteligencia Artificial</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            La plataforma más avanzada para verificar, analizar y traducir información de empresas chinas. 
            Alimentada por IA para decisiones comerciales inteligentes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-china-red hover:bg-red-600 text-white font-semibold px-8 py-4 rounded-lg text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              Comenzar Ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button
              onClick={handleStartRecording}
              size="lg"
              variant="outline"
              className="border-china-navy text-china-navy hover:bg-china-navy hover:text-white font-semibold px-8 py-4 rounded-lg text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Mic className="mr-2 h-5 w-5" />
              Grabar Consulta
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2 text-green-600" />
              Seguro y Confiable
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-2 text-yellow-500" />
              Alimentado por IA
            </div>
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-2 text-blue-600" />
              Acceso Global
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-china-navy mb-4">
              Todo lo que necesitas para verificar empresas chinas
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Herramientas profesionales impulsadas por inteligencia artificial para análisis empresarial completo
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="hover:shadow-xl transition-shadow duration-300 border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-china-red rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-china-navy">Búsqueda Inteligente</CardTitle>
                <CardDescription>
                  Encuentra empresas chinas usando IA avanzada con filtros por ubicación, industria y productos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Base de datos actualizada
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Búsqueda por productos
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Filtros avanzados
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="hover:shadow-xl transition-shadow duration-300 border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-china-navy rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-china-navy">Traductor por Voz</CardTitle>
                <CardDescription>
                  Traduce entre español y chino usando reconocimiento de voz y ChatGPT-4o profesional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Transcripción automática
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Traducción instantánea
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Calidad profesional
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="hover:shadow-xl transition-shadow duration-300 border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-china-navy">Reportes Detallados</CardTitle>
                <CardDescription>
                  Genera reportes profesionales con análisis completo de empresas y exportación en PDF
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Análisis financiero
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Exportación PDF
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Datos verificados
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-china-navy text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">
            ¿Por qué elegir China Verifier?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-china-red mb-2">10,000+</div>
              <div className="text-gray-300">Empresas Verificadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-china-red mb-2">95%</div>
              <div className="text-gray-300">Precisión en Traducciones</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-china-red mb-2">24/7</div>
              <div className="text-gray-300">Disponibilidad</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-china-red mb-2">5 Seg</div>
              <div className="text-gray-300">Tiempo de Respuesta</div>
            </div>
          </div>

          <Button
            onClick={handleGetStarted}
            size="lg"
            className="bg-china-red hover:bg-red-600 text-white font-semibold px-12 py-4 rounded-lg text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            Comenzar Verificación Gratuita
            <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="/images/logo-small.png" 
              alt="China Verifier" 
              className="h-12 w-auto opacity-80"
            />
          </div>
          <p className="text-gray-600 mb-4">
            Verificador de Empresas Chinas - Impulsado por Inteligencia Artificial
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-500">
            <span>© 2025 China Verifier</span>
            <span>•</span>
            <span>Términos de Servicio</span>
            <span>•</span>
            <span>Política de Privacidad</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
