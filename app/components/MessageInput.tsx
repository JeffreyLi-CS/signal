'use client';

import { useRef, useState } from 'react';

export default function MessageInput({
  onSend,
  onUpload
}: {
  onSend: (text: string) => Promise<void> | void;
  onUpload: (file: File) => Promise<void> | void;
}) {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSend = async () => {
    if (!text.trim()) return;
    await onSend(text.trim());
    setText('');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await onUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-3 border-t border-slate-800 pt-4">
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type a message or drop a link..."
        className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
      >
        Upload
      </button>
      <button
        type="button"
        onClick={handleSend}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400"
      >
        Send
      </button>
    </div>
  );
}
