import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  User, 
  Settings, 
  Globe, 
  HelpCircle, 
  CreditCard, 
  ChevronDown, 
  ChevronRight,
  Shield,
  LogOut,
  Crown,
  Calendar,
  Download,
  Edit
} from 'lucide-react';

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
    plan: string;
    workspace: string;
  };
  onLogout: () => void;
  onClose: () => void;
}

type SettingsSection = 'profile' | 'account' | 'privacy' | 'billing' | null;

const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout, onClose }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>(null);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  
  // Estados del formulario de perfil
  const [profileForm, setProfileForm] = useState({
    fullName: user.name || '',
    displayName: user.name?.split(' ')[0] || '',
    role: 'Importador',
    preferences: 'Respuestas detalladas con análisis de riesgos'
  });

  const handleSettingsClick = (section: SettingsSection) => {
    setShowSettings(true);
    setActiveSection(section);
  };

  const handleLogoutAllDevices = () => {
    if (confirm('¿Estás seguro de que quieres cerrar sesión en todos los dispositivos?')) {
      onLogout();
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('⚠️ Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar tu cuenta permanentemente?')) {
      alert('Funcionalidad de eliminación pendiente de implementación');
    }
  };

  if (showSettings) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-5xl h-[80vh] flex overflow-hidden shadow-2xl">
          {/* Sidebar de configuraciones */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Ajustes</h3>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
            
            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeSection === 'profile' ? 'bg-china-red text-white' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <User className="w-4 h-4" />
                Perfil
              </button>
              
              <button
                onClick={() => setActiveSection('account')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeSection === 'account' ? 'bg-china-red text-white' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                Cuenta
              </button>
              
              <button
                onClick={() => setActiveSection('privacy')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeSection === 'privacy' ? 'bg-china-red text-white' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                Privacidad
              </button>
              
              <button
                onClick={() => setActiveSection('billing')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeSection === 'billing' ? 'bg-china-red text-white' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Facturación
              </button>
            </nav>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <h4 className="text-xl font-semibold text-gray-900">Perfil de Usuario</h4>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo
                    </label>
                    <Input
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre para Mostrar
                    </label>
                    <Input
                      value={profileForm.displayName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Cómo quieres que te llamen"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción de Rol o Área Laboral
                  </label>
                  <Input
                    value={profileForm.role}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="Ej: Importador, Gerente de Compras, Analista de Mercado"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferencias Personales de Respuesta
                  </label>
                  <Textarea
                    value={profileForm.preferences}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, preferences: e.target.value }))}
                    placeholder="Describe cómo prefieres que el asistente te responda..."
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esto ayudará a personalizar las respuestas del asistente según tu estilo y necesidades.
                  </p>
                </div>
                
                <Button className="bg-china-red hover:bg-red-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            )}

            {activeSection === 'account' && (
              <div className="space-y-6">
                <h4 className="text-xl font-semibold text-gray-900">Configuración de Cuenta</h4>
                
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">Cerrar Sesión en Todos los Dispositivos</h5>
                        <p className="text-sm text-gray-600">Cierra todas las sesiones activas por seguridad</p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleLogoutAllDevices}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Todas
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-red-800">Eliminar Cuenta</h5>
                        <p className="text-sm text-red-600">Esta acción no se puede deshacer.</p>
                      </div>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteAccount}
                        size="sm"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="space-y-6">
                <h4 className="text-xl font-semibold text-gray-900">Privacidad y Datos</h4>
                
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Protección de Datos</h5>
                    <div className="space-y-3 text-sm text-gray-600">
                      <p>• <strong>Encriptación:</strong> Datos protegidos con AES-256.</p>
                      <p>• <strong>Conversaciones:</strong> Almacenadas y sincronizadas de forma segura.</p>
                      <p>• <strong>Análisis:</strong> Solo datos agregados y anónimos.</p>
                      <p>• <strong>Terceros:</strong> No compartimos información personal.</p>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Centro de Privacidad Completo
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar Mis Datos
                  </Button>
                </div>
              </div>
            )}

            {activeSection === 'billing' && (
              <div className="space-y-6">
                <h4 className="text-xl font-semibold text-gray-900">Facturación y Suscripción</h4>
                
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h5 className="font-medium text-gray-900">Plan Actual</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-amber-100 text-amber-800">
                            <Crown className="w-3 h-3 mr-1" />
                            {user.plan}
                          </Badge>
                          <span className="text-sm text-gray-600">• Mensual • Próxima renovación: 15 Feb 2025</span>
                        </div>
                      </div>
                      <Button variant="outline">
                        Actualizar Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border border-gray-200">
                  <CardContent className="p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Historial de Facturas</h5>
                    <div className="space-y-2">
                      {[
                        { date: '15 Ene 2025', amount: '$29.99', status: 'Pagada' },
                        { date: '15 Dic 2024', amount: '$29.99', status: 'Pagada' },
                        { date: '15 Nov 2024', amount: '$29.99', status: 'Pagada' }
                      ].map((invoice, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{invoice.date}</span>
                            <span className="text-sm font-medium">{invoice.amount}</span>
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              {invoice.status}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm">
                            Ver
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!activeSection && (
              <div className="text-center py-12">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Configuración de Cuenta</h4>
                <p className="text-gray-600">Selecciona una categoría del menú lateral para comenzar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Menú desplegable principal (drop-up style como Claude)
  return (
    <div className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in slide-in-from-bottom-2 fade-in-0 duration-100">
      {/* Información del usuario */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-china-red rounded-full flex items-center justify-center text-white font-medium">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 text-sm">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{user.workspace}</Badge>
              <Badge className="bg-amber-100 text-amber-800 text-xs">
                <Crown className="w-3 h-3 mr-1" />
                {user.plan}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Menú de opciones */}
      <div className="p-2">
        <div className="space-y-1">
          <button
            onClick={() => handleSettingsClick('profile')}
            className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Ajustes</span>
          </button>
          
          <button
            onClick={() => alert('Funcionalidad de idioma pendiente')}
            className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Globe className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Idioma</span>
          </button>
          
          <button
            onClick={() => window.open('https://chinaverifier.com/ayuda', '_blank')}
            className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Obtener ayuda</span>
          </button>
          
          <button
            onClick={() => alert('Funcionalidad de upgrade pendiente')}
            className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Crown className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-gray-700">Mejorar plan</span>
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowMoreInfo(!showMoreInfo)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Más información</span>
              {showMoreInfo ? (
                <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
              )}
            </button>
            
            {showMoreInfo && (
              <div className="ml-6 mt-1 space-y-1">
                <a
                  href="https://chinaverifier.com/acerca-de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 text-xs text-gray-600 hover:text-china-red transition-colors"
                >
                  Acerca de China Verifier
                </a>
                <a
                  href="https://chinaverifier.com/politica-uso"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 text-xs text-gray-600 hover:text-china-red transition-colors"
                >
                  Política de uso
                </a>
                <a
                  href="https://chinaverifier.com/privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 text-xs text-gray-600 hover:text-china-red transition-colors"
                >
                  Política de privacidad
                </a>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-100 mt-2 pt-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-red-50 transition-colors text-red-600"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserMenu;
