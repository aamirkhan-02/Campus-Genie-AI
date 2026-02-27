import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

export default function ChatWindow({ messages, isLoading, onSend }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎓</div>
          <h3 className="text-2xl font-bold mb-3 gradient-text">Start Learning!</h3>
          <p className="text-gray-500 dark:text-dark-200 mb-6">
            Choose a subject, select an AI mode, and ask any question.
            I'll help you understand concepts clearly.
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              'Explain normalization in DBMS',
              'What is polymorphism in Java?',
              'Binary search algorithm code',
              'TCP vs UDP differences'
            ].map((suggestion, i) => (
              <button
                key={i}
                onClick={() => onSend?.(suggestion)}
                className="p-3 bg-gray-50 dark:bg-dark-600 rounded-xl text-left 
                         hover:bg-primary-50 dark:hover:bg-primary-900/20 
                         hover:text-primary-600 transition-all text-xs cursor-pointer"
              >
                💡 {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.map((msg, index) => (
        <ChatMessage key={index} message={msg} />
      ))}

      {isLoading && (
        <div className="flex gap-4 animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 
                        flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm">🤖</span>
          </div>
          <div className="bg-white dark:bg-dark-600 rounded-2xl rounded-bl-md px-5 py-4 
                        border border-gray-100 dark:border-dark-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-primary-500 rounded-full typing-dot" />
              <div className="w-2 h-2 bg-primary-500 rounded-full typing-dot" />
              <div className="w-2 h-2 bg-primary-500 rounded-full typing-dot" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}