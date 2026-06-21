import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Send,
  Square,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import { Streamdown } from "streamdown";

import { useGuitarRecommendationChat } from "#/lib/demo-ai-hook";
import type { ChatMessages } from "#/lib/demo-ai-hook";
import { useAudioRecorder } from "#/hooks/demo-useAudioRecorder";
import { useTTS } from "#/hooks/demo-useTTS";

import GuitarRecommendation from "#/components/demo-GuitarRecommendation";

import "./ai-chat.css";

function InitialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="mx-auto w-full max-w-3xl text-center">
        <h1 className="demo-title mb-4">TanStack Chat</h1>
        <p className="demo-muted mx-auto mb-6 max-w-2xl text-lg">
          You can ask me about anything, I might or might not have a good
          answer, but you can still ask.
        </p>
        {children}
      </div>
    </div>
  );
}

function ChattingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky right-0 bottom-0 left-0 z-10 border-[var(--line)] border-t bg-[var(--header-bg)] backdrop-blur-sm">
      <div className="mx-auto w-full max-w-3xl px-4 py-3">{children}</div>
    </div>
  );
}

function Messages({
  messages,
  playingId,
  onSpeak,
  onStopSpeak,
}: {
  messages: ChatMessages;
  playingId: string | null;
  onSpeak: (text: string, id: string) => void;
  onStopSpeak: () => void;
}) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!messages.length) {
    return null;
  }

  // Extract text content from message parts
  const getTextContent = (
    parts: ChatMessages[number]["parts"],
  ): string | null => {
    for (const part of parts) {
      if (part.type === "text" && part.content) {
        return part.content;
      }
    }
    return null;
  };

  return (
    <div
      ref={messagesContainerRef}
      className="min-h-0 flex-1 overflow-y-auto pb-4"
    >
      <div className="mx-auto w-full max-w-3xl px-4">
        {messages.map((message) => {
          const textContent = getTextContent(message.parts);
          const isPlaying = playingId === message.id;

          return (
            <div
              key={message.id}
              className={`p-4 ${
                message.role === "assistant"
                  ? "bg-[var(--chip-bg)]"
                  : "bg-transparent"
              }`}
            >
              <div className="mx-auto flex w-full max-w-3xl items-start gap-4">
                {message.role === "assistant" ? (
                  <div className="mt-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--lagoon-deep)] font-medium text-sm text-white">
                    AI
                  </div>
                ) : (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--sea-ink-soft)] font-medium text-sm text-white">
                    Y
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {message.parts.map((part, index) => {
                    if (part.type === "text" && part.content) {
                      return (
                        <div
                          className="prose prose-sm min-w-0 max-w-none flex-1"
                          key={index}
                        >
                          <Streamdown>{part.content}</Streamdown>
                        </div>
                      );
                    }
                    // Guitar recommendation card
                    if (
                      part.type === "tool-call" &&
                      part.name === "recommendGuitar" &&
                      part.output
                    ) {
                      return (
                        <div key={part.id} className="mx-auto max-w-[80%]">
                          <GuitarRecommendation id={String(part.output?.id)} />
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
                {/* TTS button for assistant messages */}
                {message.role === "assistant" && textContent && (
                  <button
                    onClick={() =>
                      isPlaying
                        ? onStopSpeak()
                        : onSpeak(textContent, message.id)
                    }
                    className="demo-muted flex-shrink-0 p-2 transition-colors hover:text-[var(--lagoon-deep)]"
                    title={isPlaying ? "Stop speaking" : "Read aloud"}
                  >
                    {isPlaying ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChatPage() {
  const [input, setInput] = useState("");

  const { isRecording, isTranscribing, startRecording, stopRecording } =
    useAudioRecorder();
  const { playingId, speak, stop: stopTTS } = useTTS();

  const { messages, sendMessage, isLoading, stop } =
    useGuitarRecommendationChat();

  const handleMicClick = async () => {
    if (isRecording) {
      const transcribedText = await stopRecording();
      if (transcribedText) {
        setInput((prev) =>
          prev ? `${prev} ${transcribedText}` : transcribedText,
        );
      }
    } else {
      await startRecording();
    }
  };

  const Layout = messages.length ? ChattingLayout : InitialLayout;

  return (
    <div className="relative flex h-[calc(100vh-12rem)] min-h-[32rem]">
      <div className="flex min-h-0 flex-1 flex-col">
        <Messages
          messages={messages}
          playingId={playingId}
          onSpeak={speak}
          onStopSpeak={stopTTS}
        />

        <Layout>
          <div className="space-y-3">
            {isLoading && (
              <div className="flex items-center justify-center">
                <button
                  onClick={stop}
                  className="demo-button demo-button-danger"
                >
                  <Square className="h-4 w-4 fill-current" />
                  Stop
                </button>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim()) {
                  sendMessage(input);
                  setInput("");
                }
              }}
            >
              <div className="relative mx-auto flex max-w-xl items-center gap-2">
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={isLoading || isTranscribing}
                  className={`demo-button p-3 ${
                    isRecording ? "demo-button-danger" : "demo-button-secondary"
                  } disabled:opacity-50`}
                  title={isRecording ? "Stop recording" : "Start recording"}
                >
                  {isTranscribing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>

                <div className="relative flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type something clever..."
                    className="demo-textarea pr-12 text-sm"
                    rows={1}
                    style={{ minHeight: "44px", maxHeight: "200px" }}
                    disabled={isLoading}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && input.trim()) {
                        e.preventDefault();
                        sendMessage(input);
                        setInput("");
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute top-1/2 right-2 -translate-y-1/2 p-2 text-[var(--lagoon-deep)] transition-colors hover:text-[var(--sea-ink)] disabled:text-[var(--sea-ink-soft)]"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </Layout>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/demo/ai/chat")({
  component: ChatPage,
});
