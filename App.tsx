
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getUltrasevenAnswerStream } from './services/geminiService';
import { ChatMessage as ChatMessageType } from './types';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';

const EyeSluggerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const App: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([
    {
      role: 'model',
      text: "I am the digital archivist for the Ultra Guard. Ask me anything about Ultraseven's history."
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessageType = { role: 'user', text: message };
    setChatHistory(prev => [...prev, userMessage, { role: 'model', text: '' }]);
    setIsLoading(true);

    try {
      const stream = await getUltrasevenAnswerStream(message);
      
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        setChatHistory(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.role === 'model') {
            lastMessage.text += chunkText;
            return [...prev.slice(0, -1), lastMessage];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error fetching from Gemini API:', error);
      setChatHistory(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.role === 'model') {
          lastMessage.text = 'An error occurred while communicating with the archives. Please try again.';
          return [...prev.slice(0, -1), lastMessage];
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-gray-200 font-sans">
      <header className="bg-slate-800/50 backdrop-blur-sm p-4 border-b border-red-500/30 flex items-center justify-center space-x-4 shadow-lg">
        <EyeSluggerIcon className="w-10 h-10 text-red-500 transform -rotate-45" />
        <h1 className="text-3xl font-bold text-gray-100 tracking-wider">
          ULTR<span className="text-red-500">A</span>SEVEN: ARCHIVES
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {chatHistory.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && chatHistory[chatHistory.length -1].text === '' && (
           <div className="flex justify-start">
            <div className="bg-slate-700 p-3 rounded-lg max-w-xl animate-pulse">
                <div className="h-4 bg-slate-600 rounded w-24"></div>
            </div>
           </div>
        )}
        <div ref={chatEndRef} />
      </main>

      <footer className="p-4 bg-slate-900/80 backdrop-blur-sm sticky bottom-0">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </footer>
    </div>
  );
};

export default App;
