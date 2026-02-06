"use client";

import { useEffect, useState } from "react";
import type { SharedItem } from "@prisma/client";
import { SharedItemCard } from "./SharedItemCard";

const TABS = [
  { label: "Links", value: "link" },
  { label: "Images", value: "image" }
];

export function SharedPanel({
  refreshKey,
  onSelectItem
}: {
  refreshKey: number;
  onSelectItem: (item: SharedItem) => void;
}) {
  const [activeTab, setActiveTab] = useState("link");
  const [sort, setSort] = useState("recent");
  const [items, setItems] = useState<SharedItem[]>([]);

  const loadItems = async () => {
    const response = await fetch(
      `/api/shared?type=${activeTab}&sort=${sort}`
    );
    const data = await response.json();
    setItems(data);
  };

  useEffect(() => {
    loadItems();
  }, [activeTab, sort, refreshKey]);

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                activeTab === tab.value
                  ? "bg-indigo-500 text-white"
                  : "border border-slate-700 text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
        >
          <option value="recent">Most recent</option>
          <option value="shared">Most shared</option>
        </select>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-4">
        {items.length === 0 ? (
          <div className="text-sm text-slate-400">No shared items yet.</div>
        ) : (
          items.map((item) => (
            <SharedItemCard
              key={item.id}
              item={item}
              onClick={() => onSelectItem(item)}
            />
          ))
        )}
      </div>
    </div>
  );
}
