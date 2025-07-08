import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CheckCircle, Mail, Lock, Shield, User, AlertCircle, Loader2, Phone } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const Auth: React.FC = () => {
  const { signIn, signUp, loginAsDemo } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password strength validation
  const isValidPassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent, type: 'signin' | 'signup') => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      // Common validations
      if (!formData.email.trim()) {
        setMessage({ type: 'error', text: 'El email es requerido' });
        setIsLoading(false);
        return;
      }

      if (!isValidEmail(formData.email)) {
        setMessage({ type: 'error', text: 'Por favor ingresa un email válido' });
        setIsLoading(false);
        return;
      }

      if (!formData.password.trim()) {
        setMessage({ type: 'error', text: 'La contraseña es requerida' });
        setIsLoading(false);
        return;
      }

      if (type === 'signup') {
        // Additional validations for sign up
        if (!formData.name.trim()) {
          setMessage({ type: 'error', text: 'El nombre completo es requerido' });
          setIsLoading(false);
          return;
        }

        if (formData.name.trim().length < 2) {
          setMessage({ type: 'error', text: 'El nombre debe tener al menos 2 caracteres' });
          setIsLoading(false);
          return;
        }

        if (!isValidPassword(formData.password)) {
          setMessage({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres' });
          setIsLoading(false);
          return;
        }
        
        if (formData.password !== formData.confirmPassword) {
          setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
          setIsLoading(false);
          return;
        }

        if (formData.phone && formData.phone.length < 10) {
          setMessage({ type: 'error', text: 'Por favor ingresa un número de teléfono válido' });
          setIsLoading(false);
          return;
        }

        // Sign up with phone number
        const result = await signUp(
          formData.email.trim(), 
          formData.password, 
          formData.name.trim(),
          formData.phone || undefined
        );
        
        if (result.success) {
          if (result.error) {
            // This is typically the email confirmation message
            setMessage({ type: 'info', text: result.error });
            // Clear form data on successful registration
            setFormData({
              email: '',
              password: '',
              name: '',
              phone: '',
              confirmPassword: '',
            });
          } else {
            setMessage({ type: 'success', text: '¡Cuenta creada exitosamente! Bienvenido a China Verifier.' });
          }
        } else {
          setMessage({ type: 'error', text: result.error || 'Error al crear la cuenta' });
        }
      } else {
        // Sign in validation
        if (!isValidPassword(formData.password)) {
          setMessage({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres' });
          setIsLoading(false);
          return;
        }

        const result = await signIn(formData.email.trim(), formData.password);
        if (!result.success) {
          setMessage({ 
            type: 'error', 
            text: result.error === 'Invalid login credentials' 
              ? 'Email o contraseña incorrectos' 
              : result.error || 'Error al iniciar sesión' 
          });
        } else {
          // Clear form on successful login
          setFormData({
            email: '',
            password: '',
            name: '',
            phone: '',
            confirmPassword: '',
          });
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setMessage({ type: 'error', text: 'Error de conexión. Verifica tu internet e inténtalo de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear messages when user starts typing
    if (message) {
      setMessage(null);
    }
  };

  const handlePhoneChange = (value: string | undefined) => {
    setFormData(prev => ({
      ...prev,
      phone: value || '',
    }));
    
    // Clear messages when user starts typing
    if (message) {
      setMessage(null);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'signin' | 'signup');
    setMessage(null);
    // Clear form when switching tabs
    setFormData({
      email: '',
      password: '',
      name: '',
      phone: '',
      confirmPassword: '',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-500 rounded-full p-3 mr-3">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">China Verifier</h1>
          </div>
          <p className="text-gray-600">
            Verificación empresarial y análisis inteligente
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">
              {activeTab === 'signin' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === 'signin' 
                ? 'Accede a tu cuenta de China Verifier' 
                : 'Únete a China Verifier y comienza a verificar empresas'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Botón Demo para pruebas del motor de búsqueda */}
            <div className="mb-6">
              <Button 
                onClick={loginAsDemo}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 h-12 text-sm font-medium transition-all hover:shadow-lg"
                type="button"
              >
                🚀 MODO DEMO - Probar Motor de Búsqueda Inteligente
              </Button>
              <p className="text-xs text-center text-gray-500 mt-2">
                Acceso instantáneo para probar consultas conversacionales sobre empresas chinas
              </p>
              <div className="mt-2 text-xs text-center text-green-600 font-medium">
                ✨ Base de datos: 24,225+ empresas de la Feria de Cantón
              </div>
            </div>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Registrarse
                </TabsTrigger>
              </TabsList>

              {/* Display Messages */}
              {message && (
                <Alert className={`mb-4 ${
                  message.type === 'error' ? 'border-red-200 bg-red-50' :
                  message.type === 'success' ? 'border-green-200 bg-green-50' :
                  'border-blue-200 bg-blue-50'
                }`}>
                  {message.type === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                  )}
                  <AlertDescription className={
                    message.type === 'error' ? 'text-red-800' :
                    message.type === 'success' ? 'text-green-800' :
                    'text-blue-800'
                  }>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}

              {/* Sign In Tab */}
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={(e) => handleSubmit(e, 'signin')} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="tu-email@ejemplo.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                      autoComplete="email"
                      className="transition-colors focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Contraseña
                    </Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                      autoComplete="current-password"
                      className="transition-colors focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 h-11"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Iniciando sesión...
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 mr-2" />
                        Iniciar Sesión
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={(e) => handleSubmit(e, 'signup')} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nombre Completo
                    </Label>
                    <Input
                      id="signup-name"
                      name="name"
                      type="text"
                      placeholder="Tu nombre completo"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                      autoComplete="name"
                      className="transition-colors focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="tu-email@ejemplo.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                      autoComplete="email"
                      className="transition-colors focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Teléfono (Opcional)
                    </Label>
                    <PhoneInput
                      id="signup-phone"
                      international
                      countryCallingCodeEditable={false}
                      defaultCountry="ES"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      disabled={isLoading}
                      placeholder="Ingresa tu número de teléfono"
                      className="phone-input transition-colors"
                      style={{
                        '--PhoneInputCountryFlag-aspectRatio': '1.5',
                        '--PhoneInputCountrySelectArrow-color': '#6b7280',
                        '--PhoneInput-color--focus': 'rgb(239 68 68)',
                      } as React.CSSProperties}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Contraseña
                    </Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                      autoComplete="new-password"
                      className="transition-colors focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Confirmar Contraseña
                    </Label>
                    <Input
                      id="signup-confirm-password"
                      name="confirmPassword"
                      type="password"
                      placeholder="Repite tu contraseña"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                      autoComplete="new-password"
                      className="transition-colors focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 h-11"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creando cuenta...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Crear Cuenta
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Al crear una cuenta, aceptas nuestros términos de servicio y política de privacidad.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Necesitas ayuda? Contacta nuestro soporte técnico
          </p>
        </div>
      </div>


    </div>
  );
};

export default Auth;
