import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import UserMenu from './UserMenu';
import { 
  CheckCircle, 
  Plus, 
  MessageSquare
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { conversations, currentConversation, createNewConversation, selectConversation, sendMessage } = useChat();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleNewChat = () => {
    createNewConversation();
  };

  const handleUserMenuToggle = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleCloseUserMenu = () => {
    setShowUserMenu(false);
  };

  const handleLogout = async () => {
    await signOut();
    setShowUserMenu(false);
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hoy';
    if (diffDays === 2) return 'Ayer';
    if (diffDays <= 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col items-center mb-4">
          <img 
            src="/images/china-verifier-logo.png" 
            alt="China Verifier" 
            className="h-12 w-auto"
          />
        </div>

        <Button 
          onClick={handleNewChat}
          className="w-full bg-[#2D3748] hover:bg-[#4A5568] active:bg-[#1A202C] text-white font-medium transition-colors duration-150"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Conversación
        </Button>
      </div>



      {/* Lista de Conversaciones */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-china-navy mb-3">
            Conversaciones Recientes
            {conversations.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {conversations.length}
              </Badge>
            )}
          </h3>
        </div>
        
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-0.5">
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No hay conversaciones aún</p>
                <p className="text-xs text-gray-400 mt-1">Inicia una nueva conversación</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <Button
                  key={conversation.id}
                  variant={currentConversation?.id === conversation.id ? "secondary" : "ghost"}
                  className={`w-full justify-start text-left h-auto p-1.5 ${
                    currentConversation?.id === conversation.id 
                      ? "bg-china-red/10 border-china-red/20 border" 
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => selectConversation(conversation.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate leading-tight">
                      {conversation.title}
                    </p>
                    <div className="flex items-center justify-between mt-0">
                      <p className="text-xs text-gray-500">
                        {conversation.messages.length} mensaje{conversation.messages.length !== 1 ? 's' : ''}
                      </p>
                      <span className="text-xs text-gray-400">
                        {formatDate(conversation.createdAt)}
                      </span>
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* User Menu - Estilo Claude */}
      <div className="p-4 border-t border-gray-200 relative">
        <button
          onClick={handleUserMenuToggle}
          className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Avatar>
            <AvatarFallback className="bg-china-red text-white">
              {user?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'Usuario'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || 'usuario@chinaverifier.com'}
            </p>
          </div>
        </button>

        {/* Menú de usuario */}
        {showUserMenu && (
          <div className="absolute bottom-full left-4 right-4 mb-2">
            <UserMenu
              user={{
                name: user?.name || 'Usuario',
                email: user?.email || 'usuario@chinaverifier.com',
                plan: 'Plan Pro',
                workspace: 'Personal'
              }}
              onLogout={handleLogout}
              onClose={handleCloseUserMenu}
            />
          </div>
        )}
      </div>

      {/* Overlay para cerrar el menú */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={handleCloseUserMenu}
        />
      )}
    </div>
  );
};

export default Sidebar;
