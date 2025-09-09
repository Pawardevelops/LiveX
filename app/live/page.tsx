// app/live/page.tsx
"use client";
import { useState, useCallback } from 'react';
import CameraPreview from '../components/CameraPreview';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquareText, X } from "lucide-react";

const HumanMessage = ({ text }: { text: string }) => (
  <div className="flex gap-3 items-start">
    <Avatar className="h-8 w-8">
      <AvatarImage src="/avatars/human.png" alt="Human" />
      <AvatarFallback>H</AvatarFallback>
    </Avatar>
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-zinc-900">You</p>
      </div>
      <div className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-800">
        {text}
      </div>
    </div>
  </div>
);

const GeminiMessage = ({ text }: { text: string }) => (
  <div className="flex gap-3 items-start">
    <Avatar className="h-8 w-8 bg-blue-600">
      <AvatarImage src="/avatars/gemini.png" alt="Gemini" />
      <AvatarFallback>AI</AvatarFallback>
    </Avatar>
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-zinc-900">Gemini</p>
      </div>
      <div className="rounded-lg bg-white border border-zinc-200 px-3 py-2 text-sm text-zinc-800">
        {text}
      </div>
    </div>
  </div>
);

export default function Live() {
  const [messages, setMessages] = useState<{ type: 'human' | 'gemini', text: string }[]>([
    { type: 'gemini', text: "Hi! I'm Gemini. I can see and hear you. Let's chat!" }
  ]);
  const [showChat, setShowChat] = useState(false);

  const handleTranscription = useCallback((transcription: string) => {
    setMessages(prev => [...prev, { type: 'gemini', text: transcription }]);
  }, []);

  return (
    <div className="h-screen">
        {/* Camera area */}
        <div className="h-full w-full">
          <CameraPreview
            onTranscription={handleTranscription}
            onToggleChat={() => setShowChat(true)} // from overlay "Text" button
          />
        </div>

        {/* Drawer (mobile/tablet) */}
        <div
          className={`lg:hidden fixed inset-y-0 right-0 w-full max-w-sm bg-white z-50 transform transition-transform duration-300
          ${showChat ? 'translate-x-0' : 'translate-x-full'}`}
          aria-hidden={!showChat}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="font-semibold">Chat</div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowChat(false)}
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-56px)] p-4">
            <div className="space-y-6">
              {messages.map((m, i) =>
                m.type === 'human'
                  ? <HumanMessage key={`mh-${i}`} text={m.text} />
                  : <GeminiMessage key={`mg-${i}`} text={m.text} />
              )}
            </div>
          </ScrollArea>
        </div>
    </div>

  );
}
