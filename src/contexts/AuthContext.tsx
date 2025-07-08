import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, AuthUser } from '../lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name?: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Convert Supabase user to our User type
const transformSupabaseUser = (supabaseUser: SupabaseUser): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || '',
    phone: supabaseUser.user_metadata?.phone || supabaseUser.phone || '',
    image: supabaseUser.user_metadata?.avatar_url || null,
    createdAt: supabaseUser.created_at,
    updatedAt: supabaseUser.updated_at || supabaseUser.created_at,
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Verificar modo demo primero
    const demoMode = localStorage.getItem('demo_mode');
    if (demoMode === 'true') {
      // Crear usuario demo simulado para probar motor de búsqueda
      const demoUser: User = {
        id: 'demo-user',
        email: 'demo@chinaverifier.com',
        name: 'Usuario Demo',
        phone: '+1234567890',
        image: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setAuthState({
        user: demoUser,
        isAuthenticated: true,
        isLoading: false,
      });
      
      console.log('Modo Demo activado - Motor de búsqueda disponible');
      return;
    }

    // Get initial session para usuarios reales
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthState({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        if (session?.user) {
          const user = transformSupabaseUser(session.user);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState({ user: null, isAuthenticated: false, isLoading: false });
        }
      } catch (error) {
        console.error('Error in getSession:', error);
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          const user = transformSupabaseUser(session.user);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { 
          success: false, 
          error: error.message === 'Invalid login credentials' 
            ? 'Credenciales incorrectas. Por favor verifica tu email y contraseña.' 
            : error.message 
        };
      }

      if (data.user) {
        const user = transformSupabaseUser(data.user);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      }

      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Error desconocido durante el inicio de sesión' };
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      console.error('Sign in error:', error);
      return { success: false, error: 'Error de conexión. Inténtalo de nuevo.' };
    }
  };

  const signUp = async (email: string, password: string, name?: string, phone?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || '',
            full_name: name || '',
            phone: phone || '',
          }
        }
      });

      if (error) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { 
          success: false, 
          error: error.message === 'User already registered' 
            ? 'Este email ya está registrado. Intenta iniciar sesión.' 
            : error.message 
        };
      }

      if (data.user) {
        // For email confirmation flow
        if (!data.session) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return { 
            success: true, 
            error: 'Revisa tu email para confirmar tu cuenta antes de iniciar sesión.' 
          };
        }

        const user = transformSupabaseUser(data.user);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      }

      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, error: 'Error desconocido durante el registro' };
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      console.error('Sign up error:', error);
      return { success: false, error: 'Error de conexión. Inténtalo de nuevo.' };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      // Verificar si es modo demo
      const demoMode = localStorage.getItem('demo_mode');
      if (demoMode === 'true') {
        // Limpiar modo demo
        localStorage.removeItem('demo_mode');
        console.log('Saliendo del modo demo');
      } else {
        // Cerrar sesión normal en Supabase
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Sign out error:', error);
        }
      }
      
      // Clear local state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const loginAsDemo = (): void => {
    // Activar modo demo para probar motor de búsqueda
    localStorage.setItem('demo_mode', 'true');
    
    const demoUser: User = {
      id: 'demo-user',
      email: 'demo@chinaverifier.com',
      name: 'Usuario Demo',
      phone: '+1234567890',
      image: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setAuthState({
      user: demoUser,
      isAuthenticated: true,
      isLoading: false,
    });
    
    console.log('🚀 Modo Demo activado - Motor de búsqueda inteligente disponible');
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });

      if (error) {
        return { 
          success: false, 
          error: error.message 
        };
      }

      return { 
        success: true, 
        error: 'Se ha enviado un enlace de recuperación a tu email.' 
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'Error de conexión. Inténtalo de nuevo.' };
    }
  };

  const value: AuthContextType = {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    loginAsDemo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
