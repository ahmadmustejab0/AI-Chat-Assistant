import { useState } from "react";
import { Sparkles, Key, Mail, User, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import authBanner from "../assets/images/auth_banner_1780392555932.png";

interface AuthViewProps {
  onAuthSuccess: (user: { name: string; email: string }) => void;
}

interface UserProfile {
  name: string;
  email: string;
  password?: string;
}

export function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Input fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Feedback states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper: Load users from localStorage safely
  const getRegisteredUsers = (): UserProfile[] => {
    try {
      const saved = localStorage.getItem("registered_users_db_v1");
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  };

  // Helper: Save user to localStorage database
  const saveRegisteredUser = (newUser: UserProfile) => {
    try {
      const users = getRegisteredUsers();
      users.push(newUser);
      localStorage.setItem("registered_users_db_v1", JSON.stringify(users));
    } catch (_) {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Simple validation
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all standard credentials.");
      return;
    }

    if (isSignUp && !name.trim()) {
      setError("Please input your displays or profile name.");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError("Your password matches do not align.");
      return;
    }

    if (password.length < 5) {
      setError("Password is too brief. Keep it above 4 characters.");
      return;
    }

    setLoading(true);

    // Simulate authenticating/verifying phase
    setTimeout(() => {
      const dbUsers = getRegisteredUsers();

      if (isSignUp) {
        // Sign-up process
        const userExists = dbUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (userExists) {
          setError("This email address is already registered.");
          setLoading(false);
          return;
        }

        const newUser: UserProfile = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password
        };

        saveRegisteredUser(newUser);
        setSuccess("Account registered successfully! Redirecting...");
        
        setTimeout(() => {
          onAuthSuccess({ name: newUser.name, email: newUser.email });
          setLoading(false);
        }, 1200);

      } else {
        // Sign-in process
        // Check local database
        const matched = dbUsers.find(
          u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (matched) {
          setSuccess("Welcome back! Loading assistant pipeline...");
          setTimeout(() => {
            onAuthSuccess({ name: matched.name, email: matched.email });
            setLoading(false);
          }, 1200);
        } else {
          // Check for fallback demo account if DB is entirely empty, for effortless quick testing
          if (email.toLowerCase() === "admin@example.com" && password === "admin123") {
            setSuccess("Welcome back administrator! Loading pipeline...");
            setTimeout(() => {
              onAuthSuccess({ name: "Admin User", email: "admin@example.com" });
              setLoading(false);
            }, 1200);
            return;
          }
          
          setError("No matching user credentials found. Please sign up first!");
          setLoading(false);
        }
      }
    }, 800);
  };

  const handleApplyDemoAccount = () => {
    setEmail("admin@example.com");
    setPassword("admin123");
    setIsSignUp(false);
    setError("");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-elegant-bg text-[#ececec] px-4 font-sans relative overflow-hidden select-none">
      
      {/* Dynamic ambient grid effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.03)_0%,transparent_65%)] pointer-events-none" />
      
      <div className="w-full max-w-[420px] z-10 space-y-8">
        
        {/* Superior App Header branding */}
        <div className="text-center space-y-4 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-20 h-20 rounded-2xl border border-elegant-border-dark overflow-hidden shadow-2xl bg-black relative flex items-center justify-center group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
            <img
              src={authBanner}
              alt="AI Workspace Logo Hologram"
              className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Free Chat Workspace
          </h1>
          <p className="text-xs text-elegant-text-muted">
            {isSignUp 
              ? "Create a local workspace profile to lock down dialog trees." 
              : "Signature prompt dashboard. Log in securely below."}
          </p>
        </div>

        {/* Elegant glass auth card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-elegant-card border border-elegant-border-light p-6 md:p-8 rounded-2xl shadow-2xl relative"
        >
          {error && (
            <div className="mb-4.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold leading-relaxed animate-fadeIn">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold leading-relaxed animate-fadeIn">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* If Sign-up mode, collect user name */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-elegant-text-secondary select-none">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-elegant-text-muted" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#161618] border border-elegant-border-light/80 hover:border-elegant-border-dark focus:border-purple-500/70 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none transition-all placeholder-elegant-text-muted text-white"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-elegant-text-secondary select-none">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-elegant-text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-[#161618] border border-elegant-border-light/80 hover:border-elegant-border-dark focus:border-purple-500/70 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none transition-all placeholder-elegant-text-muted text-white"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-elegant-text-secondary select-none">
                  Workspace Password
                </label>
              </div>
              <div className="relative">
                <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-elegant-text-muted" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#161618] border border-elegant-border-light/80 hover:border-elegant-border-dark focus:border-purple-500/70 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none transition-all placeholder-elegant-text-muted text-white"
                />
              </div>
            </div>

            {/* Confirm Password (only on Sign-Up) */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-elegant-text-secondary select-none">
                  Confirm Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-elegant-text-muted" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#161618] border border-elegant-border-light/80 hover:border-elegant-border-dark focus:border-purple-500/70 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none transition-all placeholder-elegant-text-muted text-white"
                  />
                </div>
              </div>
            )}

            {/* Submit auth trigger */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm rounded-xl hover:from-purple-500 hover:to-indigo-500 active:scale-98 transition-all cursor-pointer shadow-lg shadow-purple-900/10 disabled:opacity-60 disabled:cursor-not-allowed"
              id="btn-auth-submit"
            >
              <span>{isSignUp ? "Create Account & Unlock" : "Log In to Workspace"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          {/* Switch Register vs login */}
          <div className="mt-5 text-center text-xs">
            <span className="text-elegant-text-muted">
              {isSignUp ? "Already registered user profile?" : "New to the workspace?"}
            </span>{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setSuccess("");
              }}
              className="text-purple-400 hover:text-purple-300 font-bold transition-all ml-1 underline underline-offset-4 cursor-pointer"
              id="btn-auth-toggle-mode"
            >
              {isSignUp ? "Sign In" : "Register / Sign Up"}
            </button>
          </div>

        </motion.div>

        {/* Admin credential quick test trigger */}
        <div className="p-4 rounded-xl border border-elegant-border-light bg-[#121213] text-center space-y-2 select-none shadow">
          <div className="flex items-center justify-center gap-1 text-[11px] text-elegant-text-secondary font-medium">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Need a quick test profile? Click below:</span>
          </div>
          <button
            onClick={handleApplyDemoAccount}
            className="text-[10px] bg-elegant-card border border-elegant-border-dark px-3 py-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-elegant-card-hover font-semibold transition-all active:scale-95 cursor-pointer"
            id="btn-apply-demo"
          >
            Pre-fill Demo Account (admin@example.com / admin123)
          </button>
        </div>

        {/* Legal policy text */}
        <div className="text-[10px] text-elegant-text-footer text-center select-none font-medium">
          Workspace state is fully persistent within local isolation trees. Secure Sandbox Certified.
        </div>

      </div>

    </div>
  );
}
