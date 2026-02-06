'use client';

import SharedItemCard, { type SharedItemCardData } from './SharedItemCard';

export type ChatMessage = {
  id: string;
  user: string;
  text: string;
  createdAt: string;
};

const BOT_NAME = 'LockIn Bot';
const SHARED_TAG = /\[\[shared:(.+?)\]\]/;

export default function MessageList({
  messages,
  sharedById
}: {
  messages: ChatMessage[];
  sharedById: Record<string, SharedItemCardData>;
}) {
  return (
    <div className="mb-4 max-h-[60vh] overflow-y-auto pr-2">
      <ul className="space-y-3">
        {messages.map((message) => {
          const match = message.text.match(SHARED_TAG);
          const sharedId = match?.[1];
          const sharedItem = sharedId ? sharedById[sharedId] : undefined;
          const displayText = message.text.replace(SHARED_TAG, '').trim();
          const isBot = message.user === BOT_NAME;
          return (
            <li
              key={message.id}
              id={`message-${message.id}`}
              data-shared-id={sharedId}
              className={`rounded-xl border px-4 py-3 ${
                isBot ? 'border-emerald-500/40 bg-emerald-950/40' : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{message.user}</span>
                <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
              </div>
              {displayText && <p className="mt-2 text-sm text-slate-100">{displayText}</p>}
              {sharedItem && (
                <div className="mt-3">
                  <SharedItemCard item={sharedItem} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
