import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Volume2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`_~]/g, ''));
    utterance.rate = 0.9;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
    toast.success('Speaking...');
  };

  return (
    <div className={`flex gap-4 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 
                      flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-white text-sm">🤖</span>
        </div>
      )}

      <div className={`
        max-w-[80%] rounded-2xl px-5 py-4 
        ${isUser 
          ? 'bg-primary-600 text-white rounded-br-md' 
          : 'bg-white dark:bg-dark-600 border border-gray-100 dark:border-dark-400 rounded-bl-md'
        }
      `}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <div className="markdown-body prose dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    
                    return !inline && match ? (
                      <div className="relative group my-4">
                        <div className="flex items-center justify-between bg-gray-800 px-4 py-2 
                                      rounded-t-xl text-xs text-gray-400">
                          <span>{match[1]}</span>
                          <button
                            onClick={() => copyToClipboard(codeString)}
                            className="flex items-center gap-1 hover:text-white transition"
                          >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ 
                            margin: 0, 
                            borderTopLeftRadius: 0, 
                            borderTopRightRadius: 0,
                            borderBottomLeftRadius: '0.75rem',
                            borderBottomRightRadius: '0.75rem'
                          }}
                          {...props}
                        >
                          {codeString}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-dark-400">
              <button
                onClick={() => copyToClipboard(message.content)}
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-dark-200 
                         hover:text-primary-500 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
              <button
                onClick={() => speak(message.content)}
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-dark-200 
                         hover:text-primary-500 transition"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Speak
              </button>
            </div>
          </>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 
                      flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-white text-sm">👤</span>
        </div>
      )}
    </div>
  );
}