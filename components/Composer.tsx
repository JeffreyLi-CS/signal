"use client";

import { useRef, useState } from "react";

export function Composer({
  users,
  currentUser,
  onUserChange,
  onSend,
  onUpload
}: {
  users: string[];
  currentUser: string;
  onUserChange: (user: string) => void;
  onSend: (text: string) => Promise<void>;
  onUpload: (file: File) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(
      textareaRef.current.scrollHeight,
      120
    )}px`;
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    setIsSending(true);
    await onSend(text.trim());
    setText("");
    resizeTextarea();
    setIsSending(false);
  };

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await handleSend();
    }
  };

  const handleUploadClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsSending(true);
    await onUpload(file);
    event.target.value = "";
    setIsSending(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span>Sending as</span>
        <select
          value={currentUser}
          onChange={(event) => onUserChange(event.target.value)}
          className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
        >
          {users.map((user) => (
            <option key={user} value={user}>
              {user}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-2">
        <button
          type="button"
          onClick={handleUploadClick}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-slate-200"
          aria-label="Upload image"
        >
          +
        </button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            resizeTextarea();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Message LockIn..."
          rows={1}
          className="max-h-32 flex-1 resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="button"
          disabled={isSending || !text.trim()}
          onClick={handleSend}
          className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          Send
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
