'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import MessageList, { type ChatMessage } from './MessageList';
import MessageInput from './MessageInput';
import SharedPanel, { type SharedItem } from './SharedPanel';

const USERS = ['Avery', 'Jordan', 'Kai', 'Maya'];

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sharedItems, setSharedItems] = useState<SharedItem[]>([]);
  const [allSharedItems, setAllSharedItems] = useState<SharedItem[]>([]);
  const [activeTab, setActiveTab] = useState<'link' | 'image'>('link');
  const [sort, setSort] = useState<'recent' | 'shared'>('recent');
  const [selectedUser, setSelectedUser] = useState(USERS[0]);

  const fetchMessages = useCallback(async () => {
    const res = await fetch('/api/messages');
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data);
  }, []);

  const fetchShared = useCallback(async () => {
    const res = await fetch(`/api/shared?type=${activeTab}&sort=${sort}`);
    if (!res.ok) return;
    const data = await res.json();
    setSharedItems(data);
  }, [activeTab, sort]);

  const fetchAllShared = useCallback(async () => {
    const res = await fetch('/api/shared');
    if (!res.ok) return;
    const data = await res.json();
    setAllSharedItems(data);
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchShared();
    fetchAllShared();
    const interval = setInterval(() => {
      fetchMessages();
      fetchShared();
      fetchAllShared();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages, fetchShared, fetchAllShared]);

  const sharedById = useMemo(() => {
    return allSharedItems.reduce<Record<string, SharedItem>>((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [allSharedItems]);

  const handleSend = async (text: string) => {
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: selectedUser, text })
    });
    await fetchMessages();
    await fetchShared();
    await fetchAllShared();
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', selectedUser);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) return;
    await fetchMessages();
    await fetchShared();
    await fetchAllShared();
  };

  const handleCardClick = (sharedId: string) => {
    const target = document.querySelector(`[data-shared-id="${sharedId}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl gap-6 px-6 py-8">
      <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">LockIn Chat</h1>
            <p className="text-sm text-slate-400">Shared links and images resurface automatically.</p>
          </div>
          <select
            value={selectedUser}
            onChange={(event) => setSelectedUser(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            {USERS.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
        </div>
        <MessageList messages={messages} sharedById={sharedById} />
        <MessageInput onSend={handleSend} onUpload={handleUpload} />
      </div>
      <div className="w-80">
        <SharedPanel
          items={sharedItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          sort={sort}
          onSortChange={setSort}
          onItemClick={handleCardClick}
        />
      </div>
    </div>
  );
}
