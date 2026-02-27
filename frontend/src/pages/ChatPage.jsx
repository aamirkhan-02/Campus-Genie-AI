import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ChatWindow from '../components/Chat/ChatWindow';
import ChatInput from '../components/Chat/ChatInput';
import ModeSelector from '../components/Chat/ModeSelector';
import ChatHistory from '../components/Chat/ChatHistory';
import { useChat } from '../hooks/useChat';
import { SUBJECTS } from '../utils/constants';
import {
  Plus, Download, Trash2, FileText, PanelLeftClose,
  PanelLeftOpen, ChevronDown
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { downloadAsFile } from '../utils/helpers';
import { dashboardService } from '../services/dashboardService';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

export default function ChatPage() {
  const { sessionId: paramSessionId } = useParams();
  const [searchParams] = useSearchParams();
  const paramSubject = searchParams.get('subject');

  const [mode, setMode] = useState('normal');
  const [subject, setSubject] = useState(paramSubject || 'General');
  const [showHistory, setShowHistory] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const { messages, sessionId, isLoading, sendMessage, loadSession, clearChat, setSessionId } = useChat();
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  // Load session if ID in URL
  useEffect(() => {
    if (paramSessionId) {
      loadSession(paramSessionId).then(session => {
        if (session) {
          setSubject(session.subject_name);
          setMode(session.mode);
        }
      });
    }
  }, [paramSessionId]);

  // Set subject from URL params
  useEffect(() => {
    if (paramSubject) {
      setSubject(paramSubject);
    }
  }, [paramSubject]);

  // Track time spent
  useEffect(() => {
    startTimeRef.current = Date.now();
    return () => {
      const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (seconds > 10) {
        dashboardService.updateTimeSpent(subject, seconds).catch(() => { });
      }
    };
  }, [subject]);

  const handleSend = (message) => {
    sendMessage(message, mode, subject).then(() => {
      setHistoryRefreshKey(k => k + 1);
    });
  };

  const handleNewChat = () => {
    clearChat();
    setHistoryRefreshKey(k => k + 1);
    toast.success('New chat started');
  };

  const handleDeleteSession = async () => {
    if (!sessionId) return;
    try {
      await chatService.deleteSession(sessionId);
      clearChat();
      setHistoryRefreshKey(k => k + 1);
      toast.success('Chat deleted');
    } catch {
      toast.error('Failed to delete chat');
    }
  };

  const handleExportPDF = async () => {
    if (!sessionId) return;

    try {
      const data = await chatService.exportChat(sessionId);
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text('Smart Study Buddy Pro - Chat Export', 20, 20);

      doc.setFontSize(11);
      doc.text(`Subject: ${data.subject} | Mode: ${data.mode}`, 20, 30);
      doc.text(`Date: ${new Date(data.exported_at).toLocaleString()}`, 20, 37);

      let y = 50;
      data.messages.forEach(msg => {
        const prefix = msg.role === 'user' ? '👤 You: ' : '🤖 AI: ';
        const text = prefix + msg.content;
        const lines = doc.splitTextToSize(text, 170);

        if (y + lines.length * 6 > 280) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(9);
        doc.text(lines, 20, y);
        y += lines.length * 6 + 8;
      });

      doc.save(`study-notes-${data.subject}.pdf`);
      toast.success('PDF exported!');
    } catch {
      toast.error('Failed to export');
    }
  };

  const handleDownloadNotes = async () => {
    if (!sessionId) return;

    try {
      const data = await chatService.exportChat(sessionId);
      let content = `# Study Notes - ${data.subject}\n`;
      content += `Mode: ${data.mode}\nDate: ${new Date(data.exported_at).toLocaleString()}\n\n---\n\n`;

      data.messages.forEach(msg => {
        content += msg.role === 'user'
          ? `## Question:\n${msg.content}\n\n`
          : `### Answer:\n${msg.content}\n\n---\n\n`;
      });

      downloadAsFile(content, `study-notes-${data.subject}.md`, 'text/markdown');
      toast.success('Notes downloaded!');
    } catch {
      toast.error('Failed to download');
    }
  };

  const allSubjects = [
    { name: 'General', icon: '📚' },
    ...SUBJECTS
  ];

  return (
    <div className="flex h-full">
      {/* History Sidebar */}
      {showHistory && (
        <div className="w-72 border-r border-gray-200 dark:border-dark-500 bg-white dark:bg-dark-700 
                      overflow-y-auto flex-shrink-0 animate-slide-in">
          <div className="p-4 border-b border-gray-100 dark:border-dark-500">
            <button onClick={handleNewChat} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
          <ChatHistory onSelectSession={(id) => loadSession(id)} currentSessionId={sessionId} refreshKey={historyRefreshKey} />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="border-b border-gray-200 dark:border-dark-500 p-4 bg-white dark:bg-dark-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="btn-ghost p-2"
                title="Toggle history"
              >
                {showHistory ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
              </button>

              {/* Subject Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowSubjectPicker(!showSubjectPicker)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-500 
                           rounded-xl hover:bg-gray-200 dark:hover:bg-dark-400 transition-all"
                >
                  <span>{allSubjects.find(s => s.name === subject)?.icon || '📚'}</span>
                  <span className="font-medium text-sm">{subject}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showSubjectPicker && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-dark-600 
                                rounded-xl shadow-xl border border-gray-200 dark:border-dark-400 
                                z-50 max-h-80 overflow-y-auto animate-fade-in">
                    {allSubjects.map(s => (
                      <button
                        key={s.name}
                        onClick={() => { setSubject(s.name); setShowSubjectPicker(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left
                                  hover:bg-gray-50 dark:hover:bg-dark-500 transition-all
                                  ${subject === s.name ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : ''}`}
                      >
                        <span>{s.icon}</span>
                        <span>{s.name}</span>
                      </button>
                    ))}
                    {/* Custom subject input */}
                    <div className="p-3 border-t border-gray-100 dark:border-dark-400">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customSubject}
                          onChange={(e) => setCustomSubject(e.target.value)}
                          placeholder="Custom subject..."
                          className="input-field text-sm py-2"
                        />
                        <button
                          onClick={() => {
                            if (customSubject.trim()) {
                              setSubject(customSubject.trim());
                              setCustomSubject('');
                              setShowSubjectPicker(false);
                            }
                          }}
                          className="btn-primary text-sm px-3 py-2"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button onClick={handleNewChat} className="btn-ghost p-2" title="New chat">
                <Plus className="w-5 h-5" />
              </button>
              <button onClick={handleDownloadNotes} className="btn-ghost p-2" title="Download notes"
                disabled={messages.length === 0}>
                <Download className="w-5 h-5" />
              </button>
              <button onClick={handleExportPDF} className="btn-ghost p-2" title="Export PDF"
                disabled={messages.length === 0}>
                <FileText className="w-5 h-5" />
              </button>
              <button onClick={handleDeleteSession} className="btn-ghost p-2 text-red-500" title="Delete chat"
                disabled={!sessionId}>
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          <ModeSelector selected={mode} onSelect={setMode} />
        </div>

        {/* Messages */}
        <ChatWindow messages={messages} isLoading={isLoading} onSend={handleSend} />

        {/* Input */}
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}