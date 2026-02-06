"use client";

import { useEffect, useState } from "react";
import { ChatShell } from "./ChatShell";
import type { MessageWithShared } from "./MessageList";

export function ChatWindow() {
  const [messages, setMessages] = useState<MessageWithShared[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadMessages = async () => {
    const response = await fetch("/api/messages");
    const data = await response.json();
    setMessages(data);
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async ({ user, text }: { user: string; text: string }) => {
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, text })
    });
    await loadMessages();
    setRefreshKey((prev) => prev + 1);
  };

  const handleUpload = async ({ user, file }: { user: string; file: File }) => {
    const formData = new FormData();
    formData.append("user", user);
    formData.append("file", file);
    await fetch("/api/upload", {
      method: "POST",
      body: formData
    });
    await loadMessages();
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <ChatShell
      messages={messages}
      refreshKey={refreshKey}
      onSend={handleSend}
      onUpload={handleUpload}
    />
  );
}
