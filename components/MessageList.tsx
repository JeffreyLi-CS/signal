import type { Message, SharedItem } from "@prisma/client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";

export type MessageWithShared = Message & { sharedItem?: SharedItem | null };

export type MessageListHandle = {
  scrollToMessage: (id: number) => void;
  scrollToBottom: () => void;
};

export const MessageList = forwardRef<
  MessageListHandle,
  {
    messages: MessageWithShared[];
    currentUser: string;
    highlightedMessageId: number | null;
    onImageClick?: (src: string, alt: string) => void;
  }
>(({ messages, currentUser, highlightedMessageId, onImageClick }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const scrollToBottom = () => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth"
    });
  };

  const scrollToMessage = (id: number) => {
    if (!containerRef.current) return;
    const target = containerRef.current.querySelector(
      `[data-message-id="${id}"]`
    );
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  useImperativeHandle(ref, () => ({
    scrollToMessage,
    scrollToBottom
  }));

  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages.length, isNearBottom]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distance = scrollHeight - scrollTop - clientHeight;
    setIsNearBottom(distance < 150);
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex h-full flex-col gap-4 overflow-y-auto px-6 py-6"
      >
        {messages.map((message, index) => {
          const prev = messages[index - 1];
          const next = messages[index + 1];
          const sameAsPrev =
            prev &&
            prev.user === message.user &&
            prev.isBot === message.isBot &&
            Math.abs(
              new Date(message.createdAt).getTime() -
                new Date(prev.createdAt).getTime()
            ) < 2 * 60 * 1000;
          const sameAsNext =
            next &&
            next.user === message.user &&
            next.isBot === message.isBot &&
            Math.abs(
              new Date(next.createdAt).getTime() -
                new Date(message.createdAt).getTime()
            ) < 2 * 60 * 1000;
          const isOwn = message.user === currentUser && !message.isBot;

          return (
            <div
              key={message.id}
              data-message-id={message.id}
              className={`flex ${
                isOwn ? "justify-end" : "justify-start"
              } ${sameAsPrev ? "mt-1" : "mt-3"}`}
            >
              <MessageBubble
                message={message}
                isOwn={isOwn}
                isBot={Boolean(message.isBot)}
                showSender={!sameAsPrev}
                isLastInGroup={!sameAsNext}
                onImageClick={onImageClick}
                isHighlighted={highlightedMessageId === message.id}
              />
            </div>
          );
        })}
      </div>

      {!isNearBottom ? (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-6 right-6 rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-100 shadow-lg"
        >
          Jump to latest
        </button>
      ) : null}
    </div>
  );
});

MessageList.displayName = "MessageList";
