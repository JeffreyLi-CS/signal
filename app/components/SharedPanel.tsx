'use client';

import SharedItemCard, { type SharedItemCardData } from './SharedItemCard';

export type SharedItem = SharedItemCardData;

export default function SharedPanel({
  items,
  activeTab,
  onTabChange,
  sort,
  onSortChange,
  onItemClick
}: {
  items: SharedItem[];
  activeTab: 'link' | 'image';
  onTabChange: (tab: 'link' | 'image') => void;
  sort: 'recent' | 'shared';
  onSortChange: (sort: 'recent' | 'shared') => void;
  onItemClick: (id: string) => void;
}) {
  return (
    <aside className="sticky top-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Shared Panel</h2>
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as 'recent' | 'shared')}
          className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200"
        >
          <option value="recent">Most recent</option>
          <option value="shared">Most shared</option>
        </select>
      </div>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => onTabChange('link')}
          className={`flex-1 rounded-lg px-3 py-2 text-sm ${
            activeTab === 'link' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-200'
          }`}
        >
          Links
        </button>
        <button
          type="button"
          onClick={() => onTabChange('image')}
          className={`flex-1 rounded-lg px-3 py-2 text-sm ${
            activeTab === 'image' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-200'
          }`}
        >
          Images
        </button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-sm text-slate-400">Nothing shared yet.</p>}
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onItemClick(item.id)}
            className="w-full text-left"
          >
            <SharedItemCard item={item} />
          </button>
        ))}
      </div>
    </aside>
  );
}
