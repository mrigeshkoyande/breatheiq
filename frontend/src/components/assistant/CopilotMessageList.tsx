import React from 'react';
import { ProvenanceSource } from '../../types/api';
import { Badge } from '../ui/Badge';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sourceBadge?: ProvenanceSource;
  flags?: string[];
  why?: string;
  timestamp: string;
}

interface CopilotMessageListProps {
  messages: ChatMessage[];
  endRef: React.RefObject<HTMLDivElement>;
}

/** Accessible live-region message transcript with source provenance badges and validator flags. */
export const CopilotMessageList: React.FC<CopilotMessageListProps> = ({ messages, endRef }) => (
  <div
    role="log"
    aria-live="polite"
    aria-label="Copilot conversation"
    className="space-y-4 max-h-[55vh] overflow-y-auto pr-1"
  >
    {messages.map((msg) => (
      <div
        key={msg.id}
        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
      >
        <div
          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm space-y-2 ${
            msg.sender === 'user' ? 'bg-brand text-white' : 'bg-canvas border border-edge text-ink'
          }`}
        >
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="font-bold">{msg.sender === 'user' ? 'You' : 'BreatheIQ Copilot'}</span>
            <span className={msg.sender === 'user' ? 'text-[#DDF5EC]' : 'text-ink-secondary'}>
              {msg.timestamp}
            </span>
          </div>
          <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
          {msg.sender === 'assistant' && msg.sourceBadge && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge badgeType={msg.sourceBadge} />
              {msg.flags?.map((flag) => (
                <span
                  key={flag}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-edge text-ink-secondary"
                >
                  {flag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    ))}
    <div ref={endRef} />
  </div>
);
