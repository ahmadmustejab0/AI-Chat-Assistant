import { ModelPreset, VoicePreset, PromptPreset } from "./types";

export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    description: "Lightning-fast, precise response model perfect for creative text, logical coding guidance, and Q&A.",
    badge: "Fast & Smart",
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash-Lite",
    description: "Highly light-weight, designed for maximum efficiency, speed, and standard assistant queries.",
    badge: "Ultra Fast",
  }
];

export const SYSTEM_PERSONAS = [
  {
    id: "general",
    name: "General Assistant",
    description: "Versatile, friendly, and comprehensive helper for any task.",
    instruction: "You are a highly helpful, intelligent, and polite AI Assistant. Provide structured, accurate, and deeply formatted Markdown answers.",
    icon: "Sparkles",
  },
  {
    id: "senior-dev",
    name: "Senior Software Engineer",
    description: "Pragmatic, expert developer that builds clean code and architectural reviews.",
    instruction: "You are an expert Senior Full-Stack Software Engineer. When giving code: write professional, complete, well-commented, and production-ready code blocks. Always specify the languages for code blocks.",
    icon: "Code",
  },
  {
    id: "creative",
    name: "Creative Writer & Editor",
    description: "Expressive content creator, copywriter, and writing coach.",
    instruction: "You are an award-winning Creative Copywriter and Editor. Help write, refine, and edit articles, essays, and stories, using rich descriptive prose and stylish language.",
    icon: "PenTool",
  },
  {
    id: "tutor",
    name: "Socratic STEM Tutor",
    description: "Teaches math, logical sciences & reasoning dynamically.",
    instruction: "You are an expert Socratic Math & Science tutor. Break down complex reasoning steps sequentially, explain the underlying logic, and ask guiding questions to help the user grow.",
    icon: "GraduationCap",
  }
];

export const SUGGESTED_PROMPTS: PromptPreset[] = [
  {
    id: "react-effect",
    title: "Explain React useEffect",
    description: "Understand loops and safe dependency handling.",
    iconName: "Code",
    prompt: "Can you explain the React useEffect hook, how dependency arrays work, and how to avoid infinite re-render loops with clear, simple examples?",
  },
  {
    id: "content-strategy",
    title: "Content Marketing Plan",
    description: "Brainstorm structure for a SaaS product.",
    iconName: "FileText",
    prompt: "Act as a marketing lead and build a structured, high-conversion content plan for launching a SaaS application targetting developers who love speed.",
  },
  {
    id: "node-server",
    title: "Build Node API Proxy",
    description: "Securely route files, inputs, and requests.",
    iconName: "Terminal",
    prompt: "Show me a clean Node.js and Express API proxy route that takes an uploaded file stream and forwards it to an external microservice safely.",
  },
  {
    id: "draw-cyberpunk",
    title: "Draw a Cyberpunk City",
    description: "Directly trigger AI visual generations.",
    iconName: "Image",
    prompt: "Draw a highly detailed cyberpunk futuristic futuristic metropolis at twilight, neon holographic billboards, flying capsules, and rain puddles reflecting golden lights.",
  }
];

export const VOICE_PRESETS: VoicePreset[] = [
  { id: "Kore", name: "Kore (Female - Elegant)", description: "Crisp and sophisticated" },
  { id: "Zephyr", name: "Zephyr (Male - Warm)", description: "Calm and natural" },
  { id: "Puck", name: "Puck (Energetic)", description: "Bubbly and enthusiastic" },
  { id: "Charon", name: "Charon (Narrative)", description: "Deep and resonant" },
  { id: "Fenrir", name: "Fenrir (Deep)", description: "Authoritative and clear" }
];
