import { useState, useRef, useEffect } from "react";
import authBanner from "../assets/images/auth_banner_1780392555932.png";
import { 
  Message, 
  ChatSession, 
  ModelPreset, 
  VoicePreset, 
  PromptPreset 
} from "../types";
import { 
  Send, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Image as ImageIcon, 
  Cpu, 
  Grid,
  SquareTerminal,
  RefreshCw,
  Copy,
  Check,
  User,
  Compass,
  Download,
  Info
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CodeBlock } from "./CodeBlock";
import { MODEL_PRESETS, SUGGESTED_PROMPTS, VOICE_PRESETS } from "../data";
import { motion, AnimatePresence } from "motion/react";

interface ChatAreaProps {
  session: ChatSession | null;
  onSendMessage: (content: string, options: { 
    isImageMode: boolean; 
    hdMode: boolean; 
    aspectRatio: string;
  }) => void;
  isLoading: boolean;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  // TTS triggers & playback status helpers
  onPlayTTS: (messageId: string, text: string, voiceName: string) => void;
  onStopTTS: (messageId: string) => void;
  apiKeyWarning: boolean;
  currentUser?: { name: string; email: string } | null;
}

export function ChatArea({
  session,
  onSendMessage,
  isLoading,
  selectedModel,
  onSelectModel,
  onPlayTTS,
  onStopTTS,
  apiKeyWarning,
  currentUser
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [isImageMode, setIsImageMode] = useState(false);
  const [hdMode, setHdMode] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [selectedVoice, setSelectedVoice] = useState("Kore");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages, session?.messages?.map(m => m.content).join("")]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim(), { isImageMode, hdMode, aspectRatio });
    setInput("");
  };

  const handlePromptSuggestionClick = (promptText: string) => {
    setInput(promptText);
    // Focus in text area can be done or model switcher keeps user focused
  };

  const handleCopyMessageText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch (_) {}
  };

  // Custom renderer mapping for ReactMarkdown elements
  const customMarkdownComponents = {
    code(props: any) {
      const { children, className, node, ...rest } = props;
      const match = /language-(\w+)/.exec(className || "");
      const lang = match ? match[1] : "javascript";
      return match ? (
        <CodeBlock
          language={lang}
          value={String(children).replace(/\n$/, "")}
        />
      ) : (
        <code className="bg-zinc-800 text-pink-300 font-mono text-[13px] px-1.5 py-0.5 rounded" {...rest}>
          {children}
        </code>
      );
    }
  };

  // Triggering text-to-speech option
  const toggleTTS = (msg: Message) => {
    if (msg.isAudioPlaying) {
      onStopTTS(msg.id);
    } else {
      // Clean up markdown markers from read-aloud prompt
      const cleanedText = msg.content
        .replace(/```[\s\S]*?```/g, "[Code block excluded]")
        .replace(/[*#_`~]/g, "");
      onPlayTTS(msg.id, cleanedText, selectedVoice);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-elegant-bg text-[#ececec] overflow-hidden relative" id="chat-area-container">
      
      {/* Dynamic Upper Header Bar */}
      <header className="h-14 border-b border-elegant-border-light px-6 flex items-center justify-between bg-elegant-bg/95 backdrop-blur-md z-10 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-elegant-sidebar border border-elegant-border-light">
            {MODEL_PRESETS.map((m) => {
              const active = m.id === selectedModel;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectModel(m.id)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    active 
                      ? "bg-elegant-card text-white shadow border border-elegant-border-dark" 
                      : "text-elegant-text-muted hover:text-elegant-text-secondary"
                  }`}
                  title={m.description}
                >
                  {m.name.split(" ")[1]} {m.badge && "⚡"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic connection indicators */}
        <div className="flex items-center gap-4.5">
          {apiKeyWarning && (
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] md:text-xs py-1 px-2.5 rounded-lg">
              <Info className="w-3.5 h-3.5" />
              <span>Missing API Key</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-[11px] text-elegant-text-muted mr-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1"></span>
            <span>Gemini LLM Connected</span>
          </div>
        </div>
      </header>

      {/* Main Container Scroll Segment */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:py-8 space-y-6 focus:outline-none scrollbar-thin">
        {session && session.messages.length > 0 ? (
          <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
            <AnimatePresence initial={false}>
              {session.messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-4 md:gap-5 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {/* Assistant logo */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold shadow-md hover:scale-105 transition-transform flex-shrink-0 select-none">
                        AI
                      </div>
                    )}

                    {/* Chat Bubble Container */}
                    <div className={`max-w-[85%] md:max-w-[80%] flex flex-col space-y-2`}>
                      <div className={`rounded-2xl px-4.5 py-3 md:py-3.5 text-[14px] leading-relaxed shadow-sm ${
                        isUser 
                          ? "bg-transparent text-[#ececec] border border-elegant-border-light p-4" 
                          : "bg-elegant-card border border-elegant-border-light text-[#ececec] rounded-tl-none prose-custom"
                      }`}>
                        
                        {/* If typical messaging context */}
                        {msg.isImage ? (
                          <div className="space-y-3.5">
                            <img 
                              src={msg.imageUrl} 
                              alt="Generated Creative Output" 
                              className="w-full max-h-96 object-contain rounded-xl border border-elegant-border-light bg-black"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex items-center justify-between bg-black/50 p-2.5 rounded-lg border border-elegant-border-light text-xs text-elegant-text-secondary">
                              <span className="truncate max-w-[70%] font-mono text-[11px]">{msg.content}</span>
                              <a 
                                href={msg.imageUrl} 
                                download="ai-generated-masterpiece.png"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 px-2 py-1 rounded bg-[#2e2e2e] hover:bg-elegant-card-accent text-white font-medium transition-all"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Save</span>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <ReactMarkdown components={customMarkdownComponents}>
                            {msg.content}
                          </ReactMarkdown>
                        )}

                        {/* Streaming Indicator */}
                        {msg.isStreaming && (
                          <span className="inline-block w-1.5 h-4 ml-0.5 bg-emerald-400 animate-pulse rounded-full align-middle"></span>
                        )}
                      </div>

                      {/* Micro-Interaction Tools underneath */}
                      {!isUser && !msg.isStreaming && (
                        <div className="flex items-center gap-3 px-1 text-elegant-text-muted text-xs select-none">
                          <button
                            onClick={() => handleCopyMessageText(msg.id, msg.content)}
                            className="flex items-center gap-1 hover:text-white transition-colors"
                            title="Copy text snippet"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {/* TTS Trigger */}
                          {!msg.isImage && (
                            <button
                              onClick={() => toggleTTS(msg)}
                              className={`flex items-center gap-1 hover:text-white transition-colors ${
                                msg.isAudioPlaying ? "text-emerald-400 animate-pulse" : ""
                              }`}
                              title="Toggles Text-to-Speech Playback"
                            >
                              {msg.isAudioPlaying ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                                  <span className="text-rose-400">Stop Voice</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Speak Out</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* User logo */}
                    {isUser && (
                      <div className="w-8 h-8 rounded-full bg-[#3d3d3d] flex items-center justify-center text-[#ececec] text-xs font-bold border border-elegant-border-light hover:scale-105 transition-transform flex-shrink-0 select-none">
                        {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : "US"}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        ) : (
          /* Empty Suggestion Board (Bento Box / Prompt Grid) */
          <div className="max-w-2xl mx-auto py-12 md:py-16 text-center space-y-8 select-none">
            <div className="space-y-3 flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="relative w-20 h-20 rounded-2xl border border-elegant-border-dark overflow-hidden bg-black shadow-2xl shadow-purple-950/10 group hover:scale-105 transition-transform duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10" />
                <img
                  src={authBanner}
                  alt="AI Assistant Workspace Orb"
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight pt-2">
                How can I assist you today?
              </h1>
              <p className="text-elegant-text-secondary max-w-md mx-auto text-xs md:text-sm">
                Write a topic choice below, ask me to build a high-fidelity script, or switch modes to generate custom images.
              </p>
            </div>

            {/* Quickstart suggestions bento grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
              {SUGGESTED_PROMPTS.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handlePromptSuggestionClick(suggestion.prompt)}
                  className="p-4 rounded-xl text-left bg-elegant-card hover:bg-elegant-card-hover border border-elegant-border-light hover:border-elegant-border-dark transition-all hover:translate-y-[-2px] group relative overflow-hidden cursor-pointer"
                >
                  <div className="space-y-1 relative z-10">
                    <h3 className="text-xs md:text-sm font-semibold text-zinc-250 group-hover:text-amber-400 transition-colors">
                      {suggestion.title}
                    </h3>
                    <p className="text-[11px] text-elegant-text-muted leading-relaxed truncate-3-lines">
                      {suggestion.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Persistent Bottom Chat Controller Area */}
      <footer className="p-4 md:p-6 bg-gradient-to-t from-elegant-bg via-elegant-bg/95 to-transparent sticky bottom-0">
        <div className="max-w-3xl mx-auto space-y-3">
          
          <form onSubmit={handleSubmit} className="relative group/input">
            
            {/* Real Search Card Area */}
            <div className={`rounded-2xl border bg-elegant-card text-[#ececec] transition-all overflow-hidden ${
              isImageMode 
                ? "border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.06)]" 
                : "border-elegant-border-dark focus-within:border-[#4c4c4c] focus-within:shadow-[0_0_16px_rgba(255,255,255,0.01)]"
            }`}>
              
              {/* Actual inputs */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !isLoading) {
                      onSendMessage(input.trim(), { isImageMode, hdMode, aspectRatio });
                      setInput("");
                    }
                  }
                }}
                rows={isImageMode ? 2 : 3}
                placeholder={
                  isImageMode 
                    ? "Paint your vision. Describe subject, style, detail levels..." 
                    : "Message GPT-4o & Gemini assistant..."
                }
                className="w-full bg-transparent px-4.5 py-3 md:py-4 text-sm focus:outline-none placeholder-elegant-text-muted resize-none leading-relaxed cursor-text"
                disabled={isLoading}
              />

              {/* Toolbar Control Shelf */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4.5 py-2.5 bg-elegant-card/45 border-t border-elegant-border-light/85 select-none">
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Mode Selector Option: DALL-E Image Mode toggle */}
                  <button
                    type="button"
                    onClick={() => setIsImageMode(!isImageMode)}
                    className={`flex items-center gap-1.5 py-1 px-3.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      isImageMode 
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40" 
                        : "bg-[#181818] hover:bg-elegant-card-hover text-elegant-text-secondary border border-elegant-border-light"
                    }`}
                    title="Generate custom visual artwork directly"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Creative Canvas Mode</span>
                  </button>

                  {/* Adaptive Settings for Image Mode */}
                  {isImageMode && (
                    <div className="flex items-center gap-1.5 animate-fadeIn">
                      {/* HD Toggle */}
                      <button
                        type="button"
                        onClick={() => setHdMode(!hdMode)}
                        className={`text-[10px] font-semibold px-2 py-1 rounded transition-colors ${
                          hdMode ? "bg-cyan-500/15 text-cyan-400" : "bg-[#1d1d1f] text-elegant-text-muted"
                        }`}
                        title="Toggles output resolution"
                      >
                        HD
                      </button>

                      {/* Aspect Ratio choice */}
                      <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="bg-[#1d1d1f] border-none text-[10px] text-elegant-text-primary px-2 py-1 rounded focus:outline-none cursor-pointer"
                        title="Choose layout proportions"
                      >
                        <option value="1:1">1:1 Square</option>
                        <option value="16:9">16:9 Wide</option>
                        <option value="9:16">9:16 High</option>
                      </select>
                    </div>
                  )}

                  {/* TTS Voice presets picker */}
                  {!isImageMode && (
                    <div className="flex items-center gap-1.5 text-xs text-elegant-text-muted min-w-[130px]">
                      <Volume2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="bg-[#181818] border-none text-[10px] text-elegant-text-secondary font-semibold px-1 py-0.5 rounded focus:outline-none cursor-pointer hover:text-white"
                        title="Voice configuration"
                      >
                        {VOICE_PRESETS.map((vp) => (
                          <option key={vp.id} value={vp.id}>
                            {vp.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Sender button */}
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className={`flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                    isLoading || !input.trim()
                      ? "bg-[#181818] text-[#555] border border-elegant-border-light cursor-not-allowed"
                      : isImageMode
                        ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)] active:scale-95"
                        : "bg-white text-black hover:bg-slate-200 active:scale-95"
                  }`}
                  id="btn-sender"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>

              </div>

            </div>

          </form>

          {/* Legal notes */}
          <div className="text-[10px] text-elegant-text-footer text-center select-none font-medium">
            ChatGPT can make mistakes. Check important information. Code outputs can be cleanly copied.
          </div>

        </div>
      </footer>

    </div>
  );
}
