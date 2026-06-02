import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language?: string;
  value: string;
}

export function CodeBlock({ language = "javascript", value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Clipboard access failed, fallback standard", err);
    }
  };

  return (
    <div className="relative my-4 rounded-lg overflow-hidden border border-zinc-800/80 bg-zinc-950 font-mono text-sm leading-relaxed text-zinc-300">
      {/* CodeBlock Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/90 text-xs font-semibold text-zinc-400 border-b border-zinc-800/50 select-none">
        <span className="capitalize tracking-wider font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded hover:bg-zinc-800 hover:text-zinc-200 transition-all active:scale-95 text-zinc-400"
          title="Copy code snippet"
          id={`copy-btn-${Math.random().toString(36).substr(2, 9)}`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code area */}
      <div className="p-4 overflow-x-auto text-[13px] md:text-sm whitespace-pre">
        <code>{value}</code>
      </div>
    </div>
  );
}
