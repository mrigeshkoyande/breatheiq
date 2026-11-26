import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useHousehold } from '../api/hooks';
import { apiRequest } from '../services/api';
import { CopilotChatResponse, ProvenanceSource } from '../types/api';
import { AppShell } from '../components/layout/AppShell';
import { ChatMessage, CopilotMessageList } from '../components/assistant/CopilotMessageList';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ErrorBanner } from '../components/ui/StatusBanner';

const VALID_BADGES: ProvenanceSource[] = [
  'LIVE',
  'MODELED',
  'FORECAST',
  'ESTIMATED',
  'USER-REPORTED',
  'DEMO',
];

const DEFAULT_PROMPTS = [
  'When is the safest window to ventilate today?',
  'What CADR purifier fits a 20 sq m bedroom?',
  'Should I reschedule my morning outdoor run?',
];

/** Grounded AI Atmospheric Copilot conversation interface with evidence validation. */
export const AssistantPage: React.FC = () => {
  const { data: household } = useHousehold();
  const city = household?.city || 'Mumbai';

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your BreatheIQ Atmospheric Copilot for ${city}. Ask about safe ventilation timing, CADR purifier sizing, commute options, or family precautions.`,
      sourceBadge: 'MODELED',
      timestamp: 'Now',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_PROMPTS);
  const msgCounterRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    endRef.current?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
  }, [messages]);

  const nextId = (prefix: string) => {
    msgCounterRef.current += 1;
    return `${prefix}-${msgCounterRef.current}`;
  };

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || sending) return;

    setErrorMsg('');
    if (!textToSend) setInput('');
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      { id: nextId('u'), sender: 'user', text: query, timestamp: nowTime },
    ]);
    setSending(true);

    try {
      const res = await apiRequest<CopilotChatResponse>('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: query,
          city,
          lat: household?.latitude ?? 19.076,
          lon: household?.longitude ?? 72.8777,
        }),
      });
      const badge: ProvenanceSource = VALID_BADGES.includes(res.source_badge as ProvenanceSource)
        ? (res.source_badge as ProvenanceSource)
        : 'MODELED';

      setMessages((prev) => [
        ...prev,
        {
          id: nextId('a'),
          sender: 'assistant',
          text: res.reply,
          sourceBadge: badge,
          flags: res.validator_flags,
          why: res.why_this_advice,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      if (res.suggested_prompts.length > 0) setSuggestions(res.suggested_prompts);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to reach Copilot service.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell title="AI Atmospheric Copilot">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Bot className="w-6 h-6 text-[#0F766E]" aria-hidden="true" />
              Grounded Atmospheric Copilot
            </h1>
            <p className="text-xs text-[#475569]">
              Safety-validated responses citing retrieved {city} telemetry · Public health guidance
              only.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] bg-[#DDF5EC] px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Evidence Validator Active
          </div>
        </div>

        {errorMsg && <ErrorBanner message={errorMsg} />}

        <Card className="p-4 sm:p-6 space-y-4">
          <CopilotMessageList messages={messages} endRef={endRef} />

          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E2E8F0]">
            {suggestions.slice(0, 3).map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={sending}
                onClick={() => void sendMessage(prompt)}
                className="text-xs px-3 py-1.5 rounded-full bg-[#F8FAF7] border border-[#CBD5E1] hover:border-[#0F766E] text-[#334155] font-medium transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
            className="flex items-center gap-2"
          >
            <label htmlFor="copilot-input" className="sr-only">
              Ask the atmospheric copilot
            </label>
            <input
              id="copilot-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${city} smog, windows, purifiers, or commutes...`}
              className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
            <Button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message to Copilot"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send'}</span>
            </Button>
          </form>

          <div className="flex items-center gap-2 text-[11px] text-[#475569]">
            <ShieldAlert className="w-3.5 h-3.5 text-[#0F766E] shrink-0" aria-hidden="true" />
            <span>Advisory guidance only — not medical advice.</span>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};
