import { useState, useEffect, useRef } from "react";
import { ChatSession, Message } from "./types";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { AuthView } from "./components/AuthView";
import { SYSTEM_PERSONAS } from "./data";
import { Menu, X, Sparkles, MessageSquare, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Local storage keys
  const SESSIONS_STORAGE_KEY = "gemini_chat_sessions_v1";
  const MODEL_STORAGE_KEY = "gemini_chat_model_v1";
  const PERSONA_STORAGE_KEY = "gemini_chat_persona_v1";
  const DIRECTIVE_STORAGE_KEY = "gemini_chat_directive_v1";
  const USER_STORAGE_KEY = "gemini_active_user_v1";

  // Auth User state
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(() => {
    try {
      const saved = localStorage.getItem("gemini_active_user_v1");
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  // Load initial states from local storage safely
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Correct Date instances on load
        return parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
            isAudioPlaying: false // Ensure reset on load
          }))
        }));
      }
    } catch (_) {}
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].id;
      }
    } catch (_) {}
    return null;
  });

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem(MODEL_STORAGE_KEY) || "gemini-3.5-flash";
  });

  const [selectedPersona, setSelectedPersona] = useState<string>(() => {
    return localStorage.getItem(PERSONA_STORAGE_KEY) || "general";
  });

  const [systemInstructionCustom, setSystemInstructionCustom] = useState<string>(() => {
    const saved = localStorage.getItem(DIRECTIVE_STORAGE_KEY);
    if (saved) return saved;
    const defaultPersona = SYSTEM_PERSONAS.find(p => p.id === "general");
    return defaultPersona ? defaultPersona.instruction : "";
  });

  const [isLoading, setIsLoading] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [apiKeyWarning, setApiKeyWarning] = useState(false);

  // Audio elements tracking
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  // Sync state mutations to local storage
  useEffect(() => {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(MODEL_STORAGE_KEY, selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem(PERSONA_STORAGE_KEY, selectedPersona);
  }, [selectedPersona]);

  useEffect(() => {
    localStorage.setItem(DIRECTIVE_STORAGE_KEY, systemInstructionCustom);
  }, [systemInstructionCustom]);

  // Check server health on index mount to verify API Key availability
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const response = await fetch("/api/health");
        const status = await response.json();
        if (status.status !== "ok") {
          console.warn("Express server health issue");
        }
      } catch (err) {
        // Dev server might be launching, ignore
      }
    };
    checkServerHealth();
  }, []);

  // Set default instruction directive when changing Persona Preset
  const handleSelectPersona = (personaId: string) => {
    setSelectedPersona(personaId);
    const persona = SYSTEM_PERSONAS.find(p => p.id === personaId);
    if (persona) {
      setSystemInstructionCustom(persona.instruction);
    }
  };

  // Create new conversing thread
  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "New Dialogue Thread",
      messages: [],
      createdAt: new Date(),
      model: selectedModel,
      systemInstruction: systemInstructionCustom
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMobileSidebarOpen(false);
    // Cleanup any playing audio
    handleStopTTSAll();
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      const remaining = sessions.filter(s => s.id !== id);
      setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
    handleStopTTSAll();
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  // Text to Speech playback
  const handlePlayTTS = async (messageId: string, text: string, voiceName: string) => {
    try {
      // If there's already active audio playing, stop it first
      handleStopTTSAll();

      // Set audio playing UI loading flag
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: s.messages.map(m => m.id === messageId ? { ...m, isAudioPlaying: true } : m)
          };
        }
        return s;
      }));
      setPlayingMessageId(messageId);

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: voiceName })
      });

      if (!response.ok) {
        throw new Error("Failed to contact TTS API");
      }

      const val = await response.json();
      if (!val.audio) {
        throw new Error("No audio payload received");
      }

      // Convert Base64 response to binary buffer chunk
      const rawBinary = atob(val.audio);
      const dataArray = new Uint8Array(rawBinary.length);
      for (let i = 0; i < rawBinary.length; i++) {
        dataArray[i] = rawBinary.charCodeAt(i);
      }

      const activeBlob = new Blob([dataArray], { type: "audio/pcm" });
      const objectUrl = URL.createObjectURL(activeBlob);

      // Create browser Audio object for standard raw PCM playback representation
      // Wait, let's wrap PCM header properly or output audio wav since browser needs wav
      // Our backend uses PrebuiltVoiceConfig which returns beautiful raw audio in wav container automatically from Gemini TTS models!
      const audioInstance = new Audio(`data:audio/wav;base64,${val.audio}`);
      activeAudioRef.current = audioInstance;

      audioInstance.onended = () => {
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: s.messages.map(m => m.id === messageId ? { ...m, isAudioPlaying: false } : m)
            };
          }
          return s;
        }));
        setPlayingMessageId(null);
        activeAudioRef.current = null;
      };

      audioInstance.onerror = () => {
        handleStopTTS(messageId);
      };

      await audioInstance.play();

    } catch (err) {
      console.error("TTS playback issue:", err);
      handleStopTTS(messageId);
    }
  };

  const handleStopTTS = (messageId: string) => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: s.messages.map(m => m.id === messageId ? { ...m, isAudioPlaying: false } : m)
        };
      }
      return s;
    }));
    if (playingMessageId === messageId) {
      setPlayingMessageId(null);
    }
  };

  const handleStopTTSAll = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (playingMessageId) {
      const curMsgId = playingMessageId;
      setSessions(prev => prev.map(s => ({
        ...s,
        messages: s.messages.map(m => m.id === curMsgId ? { ...m, isAudioPlaying: false } : m)
      })));
      setPlayingMessageId(null);
    }
  };

  // Submit main prompt content
  const handleSendMessage = async (
    content: string, 
    options: { isImageMode: boolean; hdMode: boolean; aspectRatio: string }
  ) => {
    let curSessionId = activeSessionId;
    let fallbackTitleSet = false;

    // Check if session needs lazy construction
    if (!curSessionId) {
      const newId = `session-${Date.now()}`;
      const newSession: ChatSession = {
        id: newId,
        title: content.length > 25 ? content.substring(0, 25) + "..." : content,
        messages: [],
        createdAt: new Date(),
        model: selectedModel,
        systemInstruction: systemInstructionCustom
      };
      // We will statefully append this to list immediately
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newId);
      curSessionId = newId;
      fallbackTitleSet = true;
    }

    const userMsg: Message = {
      id: `user-msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date()
    };

    // Update session state list to immediately draw user prompt
    setSessions(prev => prev.map(s => {
      if (s.id === curSessionId) {
        const titleUpdate = fallbackTitleSet ? s.title : s.title === "New Dialogue Thread" ? (content.substring(0, 24) + "...") : s.title;
        return {
          ...s,
          title: titleUpdate,
          messages: [...s.messages, userMsg]
        };
      }
      return s;
    }));

    setIsLoading(true);
    setApiKeyWarning(false);

    try {
      if (options.isImageMode) {
        // CREATIVE CANVAS ART GENERATOR (DALL-E Equivalent)
        const response = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: content,
            aspectRatio: options.aspectRatio,
            hdMode: options.hdMode
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Image blueprint error from server");
        }

        const data = await response.json();

        const imageAssistantMsg: Message = {
          id: `asst-msg-${Date.now()}`,
          role: "assistant",
          content: `${content}`,
          timestamp: new Date(),
          isImage: true,
          imageUrl: data.imageUrl
        };

        setSessions(prev => prev.map(s => {
          if (s.id === curSessionId) {
            return {
              ...s,
              messages: [...s.messages, imageAssistantMsg]
            };
          }
          return s;
        }));

      } else {
        // STANDARD STREAMING MESSAGING MODE (SSE)
        // Extract conversation tree
        const targetSession = sessions.find(s => s.id === curSessionId);
        const priorMessages = targetSession ? targetSession.messages : [];
        const fullConversationChain = [...priorMessages, userMsg];

        // Append temporary empty assistant streaming bubble to display feedback typing
        const incomingAsstMsgId = `asst-msg-stream-${Date.now()}`;
        const initialAsstMsg: Message = {
          id: incomingAsstMsgId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isStreaming: true
        };

        setSessions(prev => prev.map(s => {
          if (s.id === curSessionId) {
            return {
              ...s,
              messages: [...s.messages, initialAsstMsg]
            };
          }
          return s;
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: fullConversationChain.map(m => ({ role: m.role, content: m.content })),
            model: selectedModel,
            systemInstruction: systemInstructionCustom
          })
        });

        if (!response.ok) {
          const errJson = await response.json();
          // Check if API key is warning
          if (response.status === 500 && errJson.error?.includes("GEMINI_API_KEY")) {
            setApiKeyWarning(true);
          }
          throw new Error(errJson.error || "Streaming connectivity failed");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No readable response pipeline found");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedText = "";

        // Standard stream loop with fragment line buffer protection
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;

            if (cleanLine.startsWith("data: ")) {
              const body = cleanLine.slice(6);
              if (body === "[DONE]") {
                break;
              }

              try {
                const payload = JSON.parse(body);
                if (payload.error) {
                  throw new Error(payload.error);
                }
                if (payload.text) {
                  accumulatedText += payload.text;
                  
                  // Mutate matching streaming dialog in active thread
                  setSessions(prev => prev.map(s => {
                    if (s.id === curSessionId) {
                      return {
                        ...s,
                        messages: s.messages.map(m => m.id === incomingAsstMsgId ? { ...m, content: accumulatedText } : m)
                      };
                    }
                    return s;
                  }));
                }
              } catch (_) {
                // Ignore incomplete line splits JSON parse fail safely
              }
            }
          }
        }

        // Finalize streaming bubble state
        setSessions(prev => prev.map(s => {
          if (s.id === curSessionId) {
            return {
              ...s,
              messages: s.messages.map(m => m.id === incomingAsstMsgId ? { ...m, isStreaming: false } : m)
            };
          }
          return s;
        }));
      }

    } catch (err: any) {
      console.error("Transmission error:", err);
      // Display failure notice inside the chat stream
      const errMsg: Message = {
        id: `asst-error-${Date.now()}`,
        role: "assistant",
        content: `⚠️ **Interaction Error**: ${err.message || "Failed to finalize AI generator link. Please inspect the Settings to ensure your Gemini API key is valid."}`,
        timestamp: new Date()
      };

      setSessions(prev => prev.map(s => {
        if (s.id === curSessionId) {
          // If previous incomplete stream bubble exists, filter or prune active state
          const cleanHistory = s.messages.filter(m => !m.isStreaming || m.content.length > 0);
          return {
            ...s,
            messages: [...cleanHistory, errMsg]
          };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Auth transition handlers
  const handleAuthSuccess = (user: { name: string; email: string }) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setCurrentUser(null);
    setMobileSidebarOpen(false);
    handleStopTTSAll();
  };

  // Locate active session
  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  // Protect & Gate Page 2
  if (!currentUser) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen bg-elegant-bg font-sans overflow-hidden antialiased text-[#ececec]">
      
      {/* Handheld Menu Header Bar */}
      <div className="md:hidden flex h-14 w-full bg-[#0d0d0d] border-b border-elegant-border-light px-4 items-center justify-between absolute top-0 left-0 z-40 select-none">
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1.5 rounded-lg bg-elegant-card border border-elegant-border-dark text-[#ececec] active:scale-95"
          id="btn-mobile-hamburger"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2 font-bold tracking-tight text-white text-sm">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Free ChatGPT</span>
        </div>
        <button
          onClick={handleNewChat}
          className="p-1.5 rounded-lg bg-elegant-card border border-elegant-border-dark text-white font-semibold transition-all"
          id="btn-mobile-newchat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Desktop Persistent Sidebar Column */}
      <div className="hidden md:flex flex-shrink-0 h-full">
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => {
            setActiveSessionId(id);
            handleStopTTSAll();
          }}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          selectedPersona={selectedPersona}
          onSelectPersona={handleSelectPersona}
          systemInstructionCustom={systemInstructionCustom}
          onUpdateSystemInstruction={setSystemInstructionCustom}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      </div>

      {/* Handheld sliding sidebar overlay menu */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-30 flex">
            {/* Backdrop black shadow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black"
            />
            {/* Slide menu content container */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="relative w-[260px] h-full z-40 pt-14 bg-elegant-sidebar flex flex-col"
            >
              <Sidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={(id) => {
                  setActiveSessionId(id);
                  setMobileSidebarOpen(false);
                  handleStopTTSAll();
                }}
                onNewChat={handleNewChat}
                onDeleteSession={handleDeleteSession}
                onRenameSession={handleRenameSession}
                selectedPersona={selectedPersona}
                onSelectPersona={handleSelectPersona}
                systemInstructionCustom={systemInstructionCustom}
                onUpdateSystemInstruction={setSystemInstructionCustom}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Conversational Container View Area */}
      <div className="flex-1 flex flex-col pt-14 md:pt-0 h-full relative overflow-hidden">
        <ChatArea
          session={activeSession}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          onPlayTTS={handlePlayTTS}
          onStopTTS={handleStopTTS}
          apiKeyWarning={apiKeyWarning}
          currentUser={currentUser}
        />
      </div>

    </div>
  );
}
