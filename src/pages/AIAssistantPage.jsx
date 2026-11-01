import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AIAssistantPage() {
  const { user, currencySymbol } = useAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const [sumRes, msgRes] = await Promise.all([
          api.getAiSummary(),
          api.getAiMessages(),
        ]);
        setSummary(sumRes);
        if (msgRes.messages && msgRes.messages.length > 0) {
          setMessages(msgRes.messages);
          setConversationId(msgRes.messages[0].conversation_id);
        } else {
          // Default greeting
          setMessages([
            {
              id: 'init_msg',
              role: 'assistant',
              content: `Hello ${user?.full_name || 'there'}! I am your **FinSight AI Financial Assistant**.\n\nI am connected directly to your personal accounts, spending patterns, and budgets. You can ask me anything about your money, savings projections, or where you can reduce expenses.\n\nTry clicking one of the suggested prompts below to start!`
            }
          ]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    initChat();
  }, [user]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    setInput('');
    const userMsg = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query,
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.sendAiChat({
        message: query,
        conversation_id: conversationId,
      });

      if (res.conversation_id && !conversationId) {
        setConversationId(res.conversation_id);
      }

      const botMsg = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: res.message,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: '⚠️ I encountered an error accessing your financial intelligence context. Please try again.',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    'Where did I spend the most this month?',
    'How much did I save this month?',
    'What is my spending forecast for next month?',
    'Are there any unusual transactions detected?',
    'How can I save ₹10,000 extra this quarter?',
  ];

  // Helper for rendering Markdown-like bold and bullet points
  const renderMessageContent = (text) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-xs">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return <h4 key={idx} className="font-bold text-sm text-violet-300 mt-2 mb-1">{line.replace('### ', '')}</h4>;
          }
          if (line.startsWith('• ') || line.startsWith('- ')) {
            const formatted = line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="text-violet-400 mt-0.5">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatted }} />
              </div>
            );
          }
          const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return <p key={idx} dangerouslySetInnerHTML={{ __html: formatted }} />;
        })}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-130px)] flex flex-col rounded-3xl bg-[#172033] dark:bg-[#172033] light:bg-white border border-[#293548] dark:border-[#293548] light:border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-300">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-[#293548] dark:border-[#293548] light:border-slate-200 bg-[#111827] dark:bg-[#111827] light:bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
                FinSight AI Financial Assistant
              </h2>
              <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-bold">
                Gemini 2.5 Grounded
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Personalized budgeting and financial guidance grounded in your authentic portfolio.
            </p>
          </div>
        </div>

        {summary && (
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Current Inflow</span>
              <span className="font-bold text-emerald-400">{currencySymbol}{summary.income?.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Current Outflow</span>
              <span className="font-bold text-rose-400">{currencySymbol}{summary.expense?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/30 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-xl rounded-2xl p-4 shadow-sm ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-[#0B1020] dark:bg-[#0B1020] light:bg-slate-50 text-slate-200 dark:text-slate-200 light:text-slate-800 border border-[#293548] dark:border-[#293548] light:border-slate-200 rounded-tl-none'
                }`}
              >
                {renderMessageContent(m.content)}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0 border border-violet-500/30 mt-1">
              <Bot className="w-4 h-4" />
            </div>
            <div className="rounded-2xl p-4 bg-[#0B1020] border border-[#293548] rounded-tl-none flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
              <span>Analyzing your transactions and generating response...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-6 py-2 border-t border-[#293548]/50 bg-[#111827]/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            className="px-3 py-1 rounded-full bg-[#172033] hover:bg-[#1E293B] text-[11px] text-slate-300 border border-[#293548] whitespace-nowrap transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-[#293548] dark:border-[#293548] light:border-slate-200 bg-[#0B1020] dark:bg-[#0B1020] light:bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about your spending, budget health, or savings goals..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-2xl bg-[#172033] dark:bg-[#172033] light:bg-slate-100 border border-[#293548] text-white dark:text-white light:text-slate-900 text-xs focus:outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-500/20 disabled:opacity-40 transition-all cursor-pointer flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
