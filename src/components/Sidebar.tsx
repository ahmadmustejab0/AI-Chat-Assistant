import { useState } from "react";
import { ChatSession } from "../types";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Check, 
  X, 
  ChevronLeft, 
  Settings2,
  Sparkles,
  Code,
  PenTool,
  GraduationCap,
  LogOut
} from "lucide-react";
import { SYSTEM_PERSONAS } from "../data";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  selectedPersona: string;
  onSelectPersona: (personaId: string) => void;
  systemInstructionCustom: string;
  onUpdateSystemInstruction: (instructions: string) => void;
  currentUser?: { name: string; email: string } | null;
  onLogout?: () => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  selectedPersona,
  onSelectPersona,
  systemInstructionCustom,
  onUpdateSystemInstruction,
  currentUser,
  onLogout
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // Helper to map icon names to actual Lucide component
  const renderPersonaIcon = (iconName: string) => {
    switch (iconName) {
      case "Sparkles":
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case "Code":
        return <Code className="w-4 h-4 text-indigo-400" />;
      case "PenTool":
        return <PenTool className="w-4 h-4 text-pink-400" />;
      case "GraduationCap":
        return <GraduationCap className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditVal(currentTitle);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editVal.trim()) {
      onRenameSession(id, editVal.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="flex flex-col w-[260px] h-full bg-elegant-sidebar border-r border-elegant-border-light text-elegant-text-primary select-none">
      {/* New Chat Button Row */}
      <div className="p-4 flex items-center justify-between gap-2 border-b border-elegant-border-light">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-between p-3 rounded-lg border border-elegant-border-dark hover:bg-elegant-card text-sm font-medium transition-colors cursor-pointer"
          id="btn-new-chat"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
              AI
            </div>
            <span>New Chat</span>
          </div>
          <Plus className="w-4 h-4 text-elegant-text-secondary" />
        </button>
      </div>

      {/* Sessions Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 focus:outline-none scrollbar-thin">
        <div className="text-[11px] font-semibold text-elegant-text-muted px-2 py-3 uppercase tracking-wider select-none">
          Saved Conversations
        </div>

        {sessions.length === 0 ? (
          <div className="text-elegant-text-muted/80 text-xs px-2.5 py-4 leading-relaxed italic border border-dashed border-[#2d2d2d] rounded-lg">
            No chats logged yet. Start a new session.
          </div>
        ) : (
          sessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            const isEditing = sess.id === editingId;

            return (
              <div
                key={sess.id}
                onClick={() => !isEditing && onSelectSession(sess.id)}
                className={`group flex items-center justify-between p-3 text-sm rounded-lg transition-colors cursor-pointer relative ${
                  isActive
                    ? "bg-elegant-card text-white font-medium border border-elegant-border-light"
                    : "hover:bg-elegant-card text-elegant-text-secondary hover:text-white border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-emerald-400" : "text-elegant-text-muted"}`} />
                  
                  {isEditing ? (
                    <input
                      type="text"
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onRenameSession(sess.id, editVal);
                          setEditingId(null);
                        } else if (e.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                      className="bg-[#1a1a1a] text-white text-xs px-2 py-1 rounded border border-elegant-border-dark focus:outline-none focus:border-[#4d4d4d] w-full font-sans"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate pr-2 text-xs md:text-sm">{sess.title}</span>
                  )}
                </div>

                {/* Session Actions (Rename / Delete) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={(e) => handleSaveRename(sess.id, e)}
                        className="p-1 rounded text-zinc-400 hover:text-emerald-400 hover:bg-elegant-card-accent transition-colors"
                        title="Save name"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-elegant-card-accent transition-colors"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => handleStartRename(sess.id, sess.title, e)}
                        className="px-1.5 py-0.5 rounded text-elegant-text-muted hover:text-white hover:bg-elegant-card-accent transition-colors text-[10px] font-sans"
                        title="Rename Chat"
                      >
                        edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(sess.id);
                        }}
                        className="p-1 rounded text-elegant-text-muted hover:text-rose-400 hover:bg-elegant-card-accent transition-colors"
                        title="Delete Chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Model Persona Config Block */}
      <div className="border-t border-elegant-border-light bg-[#121212]/80 p-3.5 space-y-3.5">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full flex items-center justify-between text-xs font-semibold text-elegant-text-muted hover:text-white transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Settings2 className="w-4 h-4 text-elegant-text-muted" />
            <span>Customize Assistant Settings</span>
          </div>
          <span className="text-[10px] text-elegant-text-muted">{showSettings ? "collapse" : "expand"}</span>
        </button>

        {showSettings && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* System Persona selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-elegant-text-muted block">
                Select Persona Blueprint
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {SYSTEM_PERSONAS.map((persona) => {
                  const isCur = persona.id === selectedPersona;
                  return (
                    <button
                      key={persona.id}
                      onClick={() => onSelectPersona(persona.id)}
                      className={`flex flex-col gap-1 items-start text-left p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                        isCur
                          ? "bg-elegant-card hover:bg-elegant-card-hover border-elegant-border-dark text-white"
                          : "bg-transparent hover:bg-elegant-card/30 border-elegant-border-light/60 text-elegant-text-secondary"
                      }`}
                      title={persona.description}
                    >
                      <div className="flex items-center gap-1">
                        {renderPersonaIcon(persona.icon)}
                        <span className="font-medium text-[11px] truncate w-18">{persona.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editable current System Instruction */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-elegant-text-muted flex items-center justify-between">
                <span>Directives (System Prompt)</span>
                <span className="text-[9px] lowercase bg-elegant-card/85 text-elegant-text-secondary px-1 py-0.5 rounded">customizable</span>
              </label>
              <textarea
                value={systemInstructionCustom}
                onChange={(e) => onUpdateSystemInstruction(e.target.value)}
                rows={3}
                placeholder="Alter AI directives directly..."
                className="w-full bg-[#1c1c1d] border border-elegant-border-light rounded-lg p-2 text-xs text-elegant-text-primary font-sans focus:outline-none focus:border-elegant-border-dark leading-relaxed resize-none cursor-text scrollbar-thin"
              />
            </div>
          </div>
        )}
      </div>

      {/* User Profile Block */}
      {currentUser && (
        <div className="p-4 border-t border-elegant-border-light bg-[#121212]/40">
          <div className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-elegant-card group">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-[#3d3d3d] flex items-center justify-center font-bold text-xs flex-shrink-0 text-white">
                {currentUser.name ? currentUser.name.substring(0, 2).toUpperCase() : "US"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{currentUser.name}</div>
                <div className="text-xs text-elegant-text-muted truncate">{currentUser.email}</div>
              </div>
            </div>
            
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1 px-1.5 rounded-lg text-elegant-text-muted hover:text-white hover:bg-elegant-card-accent transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
                title="Log out of application"
                id="btn-sidebar-logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer Branding info */}
      <div className="p-4 border-t border-elegant-border-light bg-[#121212] text-center select-none">
        <div className="text-[10px] text-elegant-text-muted font-medium">
          Powered by Gemini 3.5 & Imagen Capabilities
        </div>
      </div>
    </div>
  );
}
