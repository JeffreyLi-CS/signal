import type { SharedItem } from "@prisma/client";

const formatDate = (value: string | Date) =>
  new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const getDomain = (link?: string | null) => {
  if (!link) return "link";
  try {
    return new URL(link).hostname.replace("www.", "");
  } catch (error) {
    return link;
  }
};

export function SharedItemCard({
  item,
  onClick
}: {
  item: SharedItem;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-left transition hover:border-slate-600"
    >
      <div className="flex items-center gap-3">
        {item.type === "image" ? (
          <img
            src={item.imagePath ?? ""}
            alt={item.title ?? "Shared image"}
            className="h-12 w-12 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800 text-xs uppercase text-slate-300">
            🌐
          </div>
        )}
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-100">
            {item.title ?? item.url ?? "Shared item"}
          </div>
          <div className="text-xs text-slate-400">
            {item.type === "link" ? getDomain(item.url) : "Image share"}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs text-slate-400">
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px]">
            {item.shareCount}x
          </span>
          <span className="text-[10px]">{formatDate(item.lastSharedAt)}</span>
        </div>
      </div>
    </button>
  );
}
