"use client";

import { useEffect, useRef, useState } from "react";
import { extractUrls, normalizeUrl } from "@/lib/urlNormalize";
import { Composer } from "./Composer";
import { ImageLightbox } from "./ImageLightbox";
import { MessageList, type MessageListHandle, type MessageWithShared } from "./MessageList";
import { SharedPanel } from "./SharedPanel";
import type { SharedItem } from "@prisma/client";

const USERS = ["Ava", "Milo", "Kai", "Zoe"];

export function ChatShell({
  messages,
  refreshKey,
  onSend,
  onUpload
}: {
  messages: MessageWithShared[];
  refreshKey: number;
  onSend: (payload: { user: string; text: string }) => Promise<void>;
  onUpload: (payload: { user: string; file: File }) => Promise<void>;
}) {
  const [currentUser, setCurrentUser] = useState(USERS[0]);
  const [lightboxImage, setLightboxImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const highlightTimeoutRef = useRef<number | null>(null);
  const listRef = useRef<MessageListHandle | null>(null);

  useEffect(
    () => () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    },
    []
  );

  const handleSelectSharedItem = (item: SharedItem) => {
    const targetMessageId = findMessageIdForItem(item, messages);
    if (!targetMessageId) return;

    listRef.current?.scrollToMessage(targetMessageId);
    setHighlightedMessageId(targetMessageId);
    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedMessageId(null);
    }, 2000);
    setIsPanelOpen(false);
  };

  const handleSend = async (text: string) => {
    await onSend({ user: currentUser, text });
  };

  const handleUpload = async (file: File) => {
    await onUpload({ user: currentUser, file });
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur">
        <div>
          <h1 className="text-lg font-semibold">LockIn Chat</h1>
          <p className="text-xs text-slate-400">
            Links and images are tracked automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsPanelOpen(true)}
          className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 lg:hidden"
        >
          Shared items
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <MessageList
            ref={listRef}
            messages={messages}
            currentUser={currentUser}
            highlightedMessageId={highlightedMessageId}
            onImageClick={(src, alt) => setLightboxImage({ src, alt })}
          />
          <div className="sticky bottom-0 z-20 border-t border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur">
            <Composer
              users={USERS}
              currentUser={currentUser}
              onUserChange={setCurrentUser}
              onSend={handleSend}
              onUpload={handleUpload}
            />
          </div>
        </div>

        <aside className="hidden h-full w-80 flex-col border-l border-slate-800 bg-slate-950/80 lg:flex">
          <SharedPanel refreshKey={refreshKey} onSelectItem={handleSelectSharedItem} />
        </aside>
      </div>

      {isPanelOpen ? (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden">
          <div className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-slate-950 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-100">Shared items</h2>
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-200"
              >
                Close
              </button>
            </div>
            <SharedPanel refreshKey={refreshKey} onSelectItem={handleSelectSharedItem} />
          </div>
        </div>
      ) : null}

      {lightboxImage ? (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      ) : null}
    </div>
  );
}

function findMessageIdForItem(item: SharedItem, messages: MessageWithShared[]) {
  if (item.type === "image") {
    return messages.find((message) => message.sharedItemId === item.id)?.id;
  }

  if (item.type === "link" && item.url) {
    const normalizedTarget = normalizeUrl(item.url);
    return messages.find((message) => {
      const urls = extractUrls(message.text ?? "");
      return urls.some((url) => normalizeUrl(url) === normalizedTarget);
    })?.id;
  }

  return null;
}
