import { useState, useCallback } from 'react';
import { chatService } from '../services/chatService';
import toast from 'react-hot-toast';

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (message, mode, subject) => {
    setIsLoading(true);
    
    // Add user message immediately
    const userMsg = { role: 'user', content: message, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await chatService.sendMessage({
        session_id: sessionId,
        message,
        mode,
        subject
      });

      const { session_id: newSessionId, message: aiResponse } = res.data;
      
      if (!sessionId) setSessionId(newSessionId);

      const aiMsg = { role: 'assistant', content: aiResponse, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);

      return aiResponse;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to get response');
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const loadSession = useCallback(async (id) => {
    try {
      setIsLoading(true);
      const res = await chatService.getSessionMessages(id);
      setMessages(res.messages);
      setSessionId(id);
      return res.session;
    } catch (error) {
      toast.error('Failed to load chat session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
  }, []);

  return {
    messages,
    sessionId,
    isLoading,
    sendMessage,
    loadSession,
    clearChat,
    setMessages,
    setSessionId
  };
};