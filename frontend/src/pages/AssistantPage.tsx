import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Bot,
  User,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

interface EvidenceContext {
  city?: string;
  aqi?: number;
  category?: string;
  dominant_pollutant?: string;
  pm25?: number;
  pm10?: number;
  best_window_start?: string;
  best_window_end?: string;
  current_action?: string;
  source?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sourceBadge?: string;
  evidenceContext?: EvidenceContext;
  whyThisAdvice?: string;
  limitations?: string;
  validatorFlags?: string[];
  suggestedPrompts?: string[];
  isFallback?: boolean;
}

export const AssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [loading, setLoading] = useState(false);
  const [expandedWhyId, setExpandedWhyId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome greeting
  useEffect(() => {
    setMessages([
      {
        id: 'msg-init',
        sender: 'assistant',
        text: `Hello ${user?.full_name ? user.full_name.split(' ')[0] : 'there'}! I am your BreatheIQ Atmospheric Assistant. I synthesize official CAAQMS ground sensor telemetry and diurnal boundary layer physics to give you actionable low-emission guidance. How can I assist your family today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourceBadge: 'MODELED',
        suggestedPrompts: [
          'When is the safest time to open windows today?',
          'Should I go for my morning walk tomorrow?',
          'What CADR purifier size do I need for my bedroom?',
          'Which transit route has the lowest pollution exposure?',
        ],
        whyThisAdvice: 'Personalized greeting based on your registered location and current atmospheric models.',
        limitations: 'Public health guidance only — not clinical medical advice.',
      },
    ]);
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const response = await apiRequest<{
        reply: string;
        intent: string;
        source_badge: string;
        evidence_context: EvidenceContext;
        why_this_advice: string;
        limitations: string;
        validator_flags: string[];
        suggested_prompts: string[];
        is_fallback: boolean;
      }>('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: query,
          city: selectedCity,
        }),
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourceBadge: response.source_badge,
        evidenceContext: response.evidence_context,
        whyThisAdvice: response.why_this_advice,
        limitations: response.limitations,
        validatorFlags: response.validator_flags,
        suggestedPrompts: response.suggested_prompts,
        isFallback: response.is_fallback,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'I am experiencing a momentary network disconnect while querying atmospheric feeds. Please try again in a few moments.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourceBadge: 'OFFLINE_FALLBACK',
        whyThisAdvice: 'Network or rate-limit retry state.',
        limitations: 'Public health guidance only — not clinical medical advice.',
        isFallback: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] flex flex-col font-sans">
      {/* App Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity" title="BreatheIQ Home">
              <img src="/logo-mark.webp" alt="BreatheIQ" className="w-8 h-8 rounded-lg" />
              <span className="font-extrabold text-lg tracking-tight text-[#0F766E]">BreatheIQ</span>
            </Link>
            <span className="text-xs text-[#94A3B8]">/</span>
            <span className="text-xs font-bold text-[#182A29]">Atmospheric Assistant</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <label htmlFor="assistant-city-select" className="text-[#64748B] font-semibold hidden sm:inline">Active City:</label>
            <select
              id="assistant-city-select"
              name="assistant_city"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-[#F8FAF7] border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#182A29] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            >
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Pune">Pune</option>
            </select>
            <Link
              to="/app/dashboard"
              className="px-3 py-1 rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] transition"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Chat Frame */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 lg:p-6 flex flex-col space-y-4">
        {/* Chat History Box */}
        <div className="flex-1 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 sm:p-6 overflow-y-auto space-y-6 max-h-[70vh]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-lg rounded-2xl p-4 space-y-3 ${
                  msg.sender === 'user'
                    ? 'bg-[#0F766E] text-white rounded-tr-xs'
                    : 'bg-[#F8FAF7] border border-[#E2E8F0] rounded-tl-xs text-[#182A29]'
                }`}
              >
                {/* Header Strip with Provenance Badge */}
                {msg.sender === 'assistant' && msg.sourceBadge && (
                  <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold">
                    <span
                      className={`px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        msg.sourceBadge === 'LIVE'
                          ? 'bg-[#DCFCE7] text-[#15803D]'
                          : msg.sourceBadge === 'MODELED'
                          ? 'bg-[#E0F2FE] text-[#0369A1]'
                          : 'bg-[#FEF3C7] text-[#B45309]'
                      }`}
                    >
                      {msg.sourceBadge} DATA
                    </span>
                    {msg.isFallback && (
                      <span className="bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-full uppercase">
                        Template Fallback
                      </span>
                    )}
                    <span className="text-[#94A3B8] font-normal">{msg.timestamp}</span>
                  </div>
                )}

                {/* Message Body Text */}
                <div className="text-xs leading-relaxed whitespace-pre-line">{msg.text}</div>

                {/* Why This Advice Expandable Panel */}
                {msg.sender === 'assistant' && msg.whyThisAdvice && (
                  <div className="border-t border-[#E2E8F0] pt-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedWhyId(expandedWhyId === msg.id ? null : msg.id)
                      }
                      className="text-[11px] font-bold text-[#0F766E] flex items-center gap-1 hover:underline"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Why this advice?</span>
                      {expandedWhyId === msg.id ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {expandedWhyId === msg.id && (
                      <div className="mt-2 p-3 bg-white rounded-xl border border-[#E2E8F0] text-[11px] text-[#475569] space-y-2">
                        <p>{msg.whyThisAdvice}</p>
                        {msg.evidenceContext && (
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F1F5F9] font-mono text-[10px]">
                            <span>City: {msg.evidenceContext.city}</span>
                            <span>NAQI: {msg.evidenceContext.aqi}</span>
                            <span>PM2.5: {msg.evidenceContext.pm25} µg/m³</span>
                            <span>Action: {msg.evidenceContext.current_action}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Limitations & Legal Disclaimer */}
                {msg.sender === 'assistant' && msg.limitations && (
                  <div className="text-[10px] text-[#94A3B8] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#0F766E]" />
                    <span>{msg.limitations}</span>
                  </div>
                )}

                {/* Follow-up Suggested Prompts */}
                {msg.sender === 'assistant' && msg.suggestedPrompts && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {msg.suggestedPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(p)}
                        className="text-[10px] font-semibold bg-white border border-[#CBD5E1] text-[#334155] px-2.5 py-1 rounded-full hover:border-[#0F766E] hover:text-[#0F766E] transition text-left"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-[#182A29] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-[#F8FAF7] border border-[#E2E8F0] rounded-2xl p-4 text-xs text-[#64748B] flex items-center gap-2">
                <span>Synchronizing ground sensors and evaluating boundary layer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Query Input Box */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-2.5 flex items-center gap-2 shadow-sm">
          <label htmlFor="assistant-query-input" className="sr-only">
            Ask Atmospheric Assistant
          </label>
          <input
            id="assistant-query-input"
            name="assistant_query"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={`Ask about routines, window opening, purifiers or transit in ${selectedCity}...`}
            className="flex-1 text-xs px-3 py-2 bg-transparent focus:outline-none text-[#182A29] placeholder-[#94A3B8]"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
            className="w-9 h-9 rounded-xl bg-[#0F766E] text-white flex items-center justify-center hover:bg-[#115E59] disabled:opacity-40 transition shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
};
