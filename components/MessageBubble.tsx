"use client";

import type { Message, SharedItem } from "@prisma/client";
import { extractUrls } from "@/lib/urlNormalize";

const formatTime = (value: string | Date) =>
  new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const urlRegex = /(https?:\/\/[^\s]+)/g;

const isUrlPart = (value: string) => /^https?:\/\/[^\s]+$/i.test(value);

const getDomain = (link: string) => {
  try {
    return new URL(link).hostname.replace("www.", "");
  } catch (error) {
    return link;
  }
};

export function MessageBubble({
  message,
  isOwn,
  isBot,
  showSender,
  isLastInGroup,
  onImageClick,
  isHighlighted
}: {
  message: Message & { sharedItem?: SharedItem | null };
  isOwn: boolean;
  isBot: boolean;
  showSender: boolean;
  isLastInGroup: boolean;
  onImageClick?: (src: string, alt: string) => void;
  isHighlighted: boolean;
}) {
  const bubbleStyles = isBot
    ? "bg-indigo-500/15 text-indigo-50 border border-indigo-500/30"
    : isOwn
      ? "bg-indigo-500 text-white"
      : "bg-slate-200 text-slate-900";

  const containerAlignment = isOwn ? "items-end" : "items-start";
  const textAlignment = isOwn ? "text-right" : "text-left";
  const links = extractUrls(message.text ?? "");

  return (
    <div className={`group flex flex-col ${containerAlignment}`}>
      {isBot ? (
        <span className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-200">
          LockIn
        </span>
      ) : null}
      {showSender && !isOwn && !isBot ? (
        <span className="mb-1 text-[11px] font-semibold text-slate-400">
          {message.user}
        </span>
      ) : null}
      <div
        className={`flex max-w-[70%] flex-col gap-2 rounded-2xl px-4 py-3 text-sm shadow-sm ${bubbleStyles} ${isHighlighted ? "ring-2 ring-indigo-400/70" : ""}`}
      >
        <div className={`whitespace-pre-wrap break-words ${textAlignment}`}>
          {message.text.split(urlRegex).map((part, index) =>
            isUrlPart(part) ? (
              <a
                key={`${part}-${index}`}
                href={part}
                target="_blank"
                rel="noreferrer"
                className="font-medium underline decoration-white/40 underline-offset-2"
              >
                {part}
              </a>
            ) : (
              <span key={`${part}-${index}`}>{part}</span>
            )
          )}
        </div>

        {links.length > 0 ? (
          <div className={`text-[11px] ${isOwn ? "text-white/70" : "text-slate-500"}`}>
            {links.map((link) => {
              const domain = getDomain(link);
              return <div key={link}>{domain}</div>;
            })}
          </div>
        ) : null}

        {message.sharedItem?.type === "image" && message.sharedItem.imagePath ? (
          <button
            type="button"
            onClick={() =>
              onImageClick?.(
                message.sharedItem?.imagePath ?? "",
                message.sharedItem?.title ?? "Shared image"
              )
            }
            className="overflow-hidden rounded-xl border border-white/20"
          >
            <img
              src={message.sharedItem.imagePath}
              alt={message.sharedItem.title ?? "Shared image"}
              className="h-40 w-full object-cover"
            />
          </button>
        ) : null}

        {message.sharedItem?.type === "link" && message.sharedItem.url ? (
          <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
            <div className="text-xs font-semibold">
              {message.sharedItem.title ?? message.sharedItem.url}
            </div>
            <div className="text-[11px] opacity-70">
              {getDomain(message.sharedItem.url)}
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={`mt-1 text-[10px] text-slate-500 transition-opacity ${
          isLastInGroup ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {formatTime(message.createdAt)}
      </div>
    </div>
  );
}
