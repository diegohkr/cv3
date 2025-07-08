import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Conversation, Message, ChatState, Company } from '../types';
import { CantonCompany } from '../types/canton';
import { useAuth } from './AuthContext';
import { openAIService } from '../services/openai';
import supabaseSearchService from '../services/supabaseSearch';
import { supabase } from '../lib/supabase';

interface ChatContextType extends ChatState {
  sendMessage: (content: string, attachments?: string[]) => Promise<void>;
  createNewConversation: () => void;
  selectConversation: (conversationId: string) => void;
  searchCompanies: (query: string) => Promise<CantonCompany[]>;
  getCompanyStats: () => Promise<any>;
  isProcessing: boolean;
  processingProgress: number;
  processingStatus: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat debe ser usado dentro de un ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [chatState, setChatState] = useState<ChatState>({
    conversations: [],
    currentConversation: null,
    isLoading: false,
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');

  useEffect(() => {
    if (user) {
      // Verificar si es modo demo
      const demoMode = localStorage.getItem('demo_mode');
      if (demoMode === 'true') {
        // Para modo demo, usar conversaciones en memoria
        setChatState({
          conversations: [],
          currentConversation: null,
          isLoading: false,
        });
        console.log('🚀 Modo Demo: Funcionando sin base de datos de conversaciones');
      } else {
        loadConversations();
      }
    } else {
      // Clear conversations when user logs out
      setChatState({
        conversations: [],
        currentConversation: null,
        isLoading: false,
      });
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      setChatState(prev => ({ ...prev, isLoading: true }));
      
      // Load conversations from Supabase
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (conversationsError) {
        console.error('Error loading conversations:', conversationsError);
        setChatState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Load messages for each conversation
      const conversationsWithMessages: Conversation[] = [];
      
      for (const conv of conversationsData || []) {
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Error loading messages for conversation:', conv.id, messagesError);
          continue;
        }

        const messages: Message[] = (messagesData || []).map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role as 'user' | 'assistant',
          conversationId: conv.id,
          attachments: msg.attachments || [],
          createdAt: msg.created_at,
        }));

        conversationsWithMessages.push({
          id: conv.id,
          title: conv.title,
          userId: user.id,
          messages,
          createdAt: conv.created_at,
        });
      }

      setChatState({
        conversations: conversationsWithMessages,
        currentConversation: conversationsWithMessages[0] || null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error in loadConversations:', error);
      setChatState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const saveConversationToSupabase = async (conversation: Conversation): Promise<boolean> => {
    if (!user) return false;

    // En modo demo, no guardar en Supabase
    const demoMode = localStorage.getItem('demo_mode');
    if (demoMode === 'true') {
      console.log('🚀 Modo Demo: Conversación guardada en memoria (no en Supabase)');
      return true; // Simular éxito
    }

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversation.id)
        .single();

      if (!existingConv) {
        // Insert new conversation (without custom ID, let Supabase generate UUID)
        const { data: conversationData, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            title: conversation.title,
          })
          .select()
          .single();

        if (conversationError) {
          console.error('Error creating conversation:', conversationError);
          return false;
        }

        // Update conversation ID in our local state to match the generated UUID
        conversation.id = conversationData.id;
      }

      // Save/update messages
      for (const message of conversation.messages) {
        // Check if message already exists
        const { data: existingMsg } = await supabase
          .from('messages')
          .select('id')
          .eq('id', message.id)
          .single();

        if (!existingMsg) {
          // Insert new message
          const { error: messageError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversation.id,
              content: message.content,
              role: message.role,
              attachments: message.attachments || [],
            });

          if (messageError) {
            console.error('Error saving message:', messageError);
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error in saveConversationToSupabase:', error);
      return false;
    }
  };

  const generateConversationTitle = (firstMessage: string): string => {
    const cleanMessage = firstMessage.replace(/[^\w\s]/g, '').trim();
    const words = cleanMessage.split(' ').slice(0, 5);
    let title = words.join(' ');
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    return title || 'Nueva Conversación';
  };

  const sendMessage = async (content: string, attachments: string[] = []) => {
    if (!user) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      content,
      role: 'user',
      conversationId: '',
      attachments,
      createdAt: new Date().toISOString(),
    };

    let conversation = chatState.currentConversation;

    if (!conversation) {
      // Create new conversation
      const title = generateConversationTitle(content);
      // Create conversation with temporary ID (will be replaced by Supabase UUID)
      const tempId = `temp-${Date.now()}`;
      userMessage.conversationId = tempId;
      
      conversation = {
        id: tempId,
        title,
        userId: user.id,
        messages: [userMessage],
        createdAt: new Date().toISOString(),
      };

      setChatState(prev => ({
        conversations: [conversation!, ...prev.conversations],
        currentConversation: conversation!,
        isLoading: false,
      }));
    } else {
      // Add to existing conversation
      userMessage.conversationId = conversation.id;
      const updatedConversation = {
        ...conversation,
        messages: [...conversation.messages, userMessage],
      };

      setChatState(prev => ({
        conversations: prev.conversations.map(c => 
          c.id === conversation!.id ? updatedConversation : c
        ),
        currentConversation: updatedConversation,
        isLoading: false,
      }));

      conversation = updatedConversation;
    }

    // Save to Supabase
    const savedSuccessfully = await saveConversationToSupabase(conversation);
    
    if (savedSuccessfully) {
      // Update message conversation IDs after successful save
      userMessage.conversationId = conversation.id;
    }

    try {
      setIsProcessing(true);
      setProcessingProgress(25);
      setProcessingStatus('Analizando mensaje...');

      // Get AI response using Supabase search
      const conversationHistory = conversation.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
      
      const response = await openAIService.generateChatResponse(
        content,
        conversationHistory,
        (progress, status) => {
          setProcessingProgress(progress);
          setProcessingStatus(status);
        }
      );

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        content: response,
        role: 'assistant',
        conversationId: conversation.id,
        attachments: [],
        createdAt: new Date().toISOString(),
      };

      const finalConversation = {
        ...conversation,
        messages: [...conversation.messages, assistantMessage],
      };

      setChatState(prev => ({
        conversations: prev.conversations.map(c => 
          c.id === conversation!.id ? finalConversation : c
        ),
        currentConversation: finalConversation,
        isLoading: false,
      }));

      // Save final conversation to Supabase
      await saveConversationToSupabase(finalConversation);

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        content: 'Disculpa, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.',
        role: 'assistant',
        conversationId: conversation.id,
        attachments: [],
        createdAt: new Date().toISOString(),
      };

      const errorConversation = {
        ...conversation,
        messages: [...conversation.messages, errorMessage],
      };

      setChatState(prev => ({
        conversations: prev.conversations.map(c => 
          c.id === conversation!.id ? errorConversation : c
        ),
        currentConversation: errorConversation,
        isLoading: false,
      }));

      // Save error conversation to Supabase
      await saveConversationToSupabase(errorConversation);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingStatus('');
    }
  };

  const createNewConversation = () => {
    setChatState(prev => ({
      ...prev,
      currentConversation: null,
    }));
  };

  const selectConversation = (conversationId: string) => {
    const conversation = chatState.conversations.find(c => c.id === conversationId);
    if (conversation) {
      setChatState(prev => ({
        ...prev,
        currentConversation: conversation,
      }));
    }
  };

  const searchCompanies = async (query: string): Promise<CantonCompany[]> => {
    try {
      console.log('🔍 ChatContext: Buscando empresas con nuevo servicio MiniMax + Supabase');
      const searchResponse = await supabaseSearchService.search(query, 10, true);
      return searchResponse.companies.map(result => result.company);
    } catch (error) {
      console.error('Error searching companies with MiniMax + Supabase:', error);
      return [];
    }
  };

  const getCompanyStats = async () => {
    try {
      console.log('📊 ChatContext: Obteniendo estadísticas de empresas');
      const stats = await supabaseSearchService.getStats();
      return stats;
    } catch (error) {
      console.error('Error getting company stats:', error);
      return { totalCompanies: 0, byProvince: {}, byIndustry: {} };
    }
  };

  return (
    <ChatContext.Provider
      value={{
        ...chatState,
        sendMessage,
        createNewConversation,
        selectConversation,
        searchCompanies,
        getCompanyStats,
        isProcessing,
        processingProgress,
        processingStatus,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
