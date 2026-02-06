'use client';

export type SharedItemCardData = {
  id: string;
  type: 'link' | 'image';
  url?: string | null;
  imagePath?: string | null;
  title?: string | null;
  shareCount: number;
  lastSharedAt: string;
};

export default function SharedItemCard({ item }: { item: SharedItemCardData }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
      {item.type === 'image' && item.imagePath ? (
        <img
          src={item.imagePath}
          alt={item.title ?? 'Shared image'}
          className="mb-2 h-32 w-full rounded-lg object-cover"
        />
      ) : (
        <div className="mb-2 rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm text-slate-200">
          <p className="truncate font-medium">{item.title ?? item.url}</p>
          {item.url && <p className="truncate text-xs text-slate-400">{item.url}</p>}
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{item.shareCount} shares</span>
        <span>{new Date(item.lastSharedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
