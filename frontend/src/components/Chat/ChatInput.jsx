import { useState, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatInput({ onSend, isLoading }) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    // Auto resize
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  const toggleSpeechToText = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Speech recognition error');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    toast.success('Listening...');
  };

  return (
    <div className="border-t border-gray-200 dark:border-dark-500 p-4 bg-white dark:bg-dark-700">
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... (Shift+Enter for new line)"
            rows={1}
            className="input-field resize-none pr-12"
            disabled={isLoading}
          />
        </div>

        <button
          onClick={toggleSpeechToText}
          className={`p-3 rounded-xl transition-all ${isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-gray-100 dark:bg-dark-500 hover:bg-gray-200 dark:hover:bg-dark-400'
            }`}
          title="Speech to text"
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="btn-primary p-3 !rounded-xl"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}