import React, { useState, useEffect } from "react";
import {
  Lock,
  Unlock,
  ShieldCheck,
  KeyRound,
  Delete,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Store,
  Users,
  Clock,
  Sparkles
} from "lucide-react";
import { User, StoreSettings, ROLE_PERMISSIONS } from "../types";
import { soundManager } from "../utils/barcodeUtils";

interface PinLoginPageProps {
  users: User[];
  settings: StoreSettings;
  isOnline: boolean;
  onLoginSuccess: (user: User) => void;
  onOpenAddStaff?: () => void;
}

export const PinLoginPage: React.FC<PinLoginPageProps> = ({
  users,
  settings,
  isOnline,
  onLoginSuccess,
  onOpenAddStaff
}) => {
  const [pin, setPin] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
  );

  // Update clock every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setCurrentDate(new Date().toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Handle PIN verification
  const verifyPin = (candidatePin: string, targetUser: User | null = selectedUser) => {
    if (!candidatePin) return;

    let authenticatedUser: User | undefined;

    if (targetUser) {
      if (targetUser.pin === candidatePin) {
        authenticatedUser = targetUser;
      }
    } else {
      // Universal PIN: match any active staff member with this PIN
      authenticatedUser = users.find((u) => u.pin === candidatePin && u.active !== false);
    }

    if (authenticatedUser) {
      soundManager.playSuccess();
      setMatchedUser(authenticatedUser);
      setIsSuccess(true);
      setErrorMsg(null);
      setTimeout(() => {
        onLoginSuccess(authenticatedUser!);
      }, 400);
    } else {
      soundManager.playError();
      setErrorMsg(
        targetUser
          ? `Incorrect PIN for ${targetUser.name}. Try again.`
          : "Invalid PIN code. Please check and try again."
      );
      // Auto clear after error
      setTimeout(() => {
        setPin("");
      }, 600);
    }
  };

  // Numpad key press
  const handleKeyClick = (digit: string) => {
    if (isSuccess) return;
    if (errorMsg) setErrorMsg(null);

    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);

      // If target user selected and pin matches target's length, or default 4 digits
      const targetLen = selectedUser ? selectedUser.pin.length : 4;
      if (nextPin.length === targetLen) {
        verifyPin(nextPin, selectedUser);
      }
    }
  };

  const handleBackspace = () => {
    if (isSuccess) return;
    if (errorMsg) setErrorMsg(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isSuccess) return;
    setPin("");
    setErrorMsg(null);
  };

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSuccess) return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleKeyClick(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape" || e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleClear();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (pin.length >= 3) {
          verifyPin(pin, selectedUser);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, selectedUser, isSuccess]);

  const activeUserList = users.filter((u) => u.active !== false);

  return (
    <div
      id="pin-login-page"
      className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-4 sm:p-6 selection:bg-zinc-800"
    >
      {/* Top Bar: Store Branding & Status */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white text-zinc-950 font-black text-xs flex items-center justify-center tracking-wider shadow-md">
            RF
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-white tracking-tight leading-tight">
              {settings.businessName || "RetailFlow Cloud POS"}
            </h1>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Terminal Locked • Staff PIN Required</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-right">
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-zinc-200">{currentTime}</p>
            <p className="text-[10px] text-zinc-500">{currentDate}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
            <Wifi className={`w-3.5 h-3.5 ${isOnline ? "text-emerald-400" : "text-amber-400"}`} />
            <span className="hidden md:inline">{isOnline ? "Cloud Online" : "Offline Storage"}</span>
          </div>
        </div>
      </div>

      {/* Main Terminal Center */}
      <div className="max-w-md w-full mx-auto my-auto py-4">
        {/* Selected Staff Card or Quick Switcher */}
        <div className="mb-5 text-center">
          {selectedUser ? (
            <div className="inline-flex flex-col items-center p-3 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-9 h-9 rounded-xl bg-white text-zinc-950 font-bold text-xs flex items-center justify-center">
                  {selectedUser.avatar}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">{selectedUser.name}</p>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                    {selectedUser.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setPin("");
                  setErrorMsg(null);
                }}
                className="text-[11px] text-zinc-400 hover:text-white underline font-semibold transition-colors cursor-pointer"
              >
                Switch to any staff member
              </button>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Lock className="w-6 h-6 text-zinc-300" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Enter Staff PIN
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                Type your 4-digit PIN code on the keypad or keyboard to access your assigned register and accessibility.
              </p>

              {/* Staff quick selection avatars */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                {activeUserList.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(user);
                      setPin("");
                      setErrorMsg(null);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer text-left group"
                  >
                    <div className="w-6 h-6 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 text-white font-bold text-[10px] flex items-center justify-center">
                      {user.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200 leading-none">{user.name}</p>
                      <p className="text-[9px] text-zinc-500 uppercase">{user.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PIN Dots Display */}
        <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center justify-center gap-3 h-12">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      isSuccess
                        ? "bg-emerald-400 scale-125 shadow-lg shadow-emerald-500/50"
                        : errorMsg
                        ? "bg-red-500 scale-110 shadow-lg shadow-red-500/50"
                        : filled
                        ? "bg-white scale-125 shadow-sm"
                        : "bg-zinc-800 border border-zinc-700/80"
                    }`}
                  />
                );
              })}
            </div>

            {/* Error or Success Feedback Message */}
            <div className="h-6 mt-2 flex items-center justify-center text-center">
              {isSuccess && matchedUser ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Welcome back, {matchedUser.name} ({matchedUser.role.toUpperCase()})</span>
                </div>
              ) : errorMsg ? (
                <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold animate-in shake">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              ) : (
                <span className="text-[11px] text-zinc-500">
                  {selectedUser ? `Entering PIN for ${selectedUser.name}` : "Enter any staff member's PIN"}
                </span>
              )}
            </div>
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyClick(digit)}
                className="h-14 sm:h-16 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/90 active:bg-zinc-600 text-white font-bold text-xl sm:text-2xl transition-all shadow-sm border border-zinc-700/50 active:scale-95 flex items-center justify-center cursor-pointer select-none"
              >
                {digit}
              </button>
            ))}

            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClear}
              className="h-14 sm:h-16 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-400 hover:text-zinc-200 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all border border-zinc-800 active:scale-95 flex items-center justify-center cursor-pointer select-none"
            >
              Clear
            </button>

            {/* Zero Button */}
            <button
              type="button"
              onClick={() => handleKeyClick("0")}
              className="h-14 sm:h-16 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/90 active:bg-zinc-600 text-white font-bold text-xl sm:text-2xl transition-all shadow-sm border border-zinc-700/50 active:scale-95 flex items-center justify-center cursor-pointer select-none"
            >
              0
            </button>

            {/* Backspace Button */}
            <button
              type="button"
              onClick={handleBackspace}
              className="h-14 sm:h-16 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all border border-zinc-800 active:scale-95 flex items-center justify-center cursor-pointer select-none"
              title="Backspace"
            >
              <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Submit / Unlock Button (for physical keyboards or custom length PINs) */}
          <div className="mt-4 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => verifyPin(pin, selectedUser)}
              disabled={pin.length < 3 || isSuccess}
              className="w-full py-3 bg-white hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white text-zinc-950 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Terminal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info: Quick PIN Hints & Accessibility Legend */}
      <div className="max-w-2xl w-full mx-auto pt-3 border-t border-zinc-900 text-center space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-400">
          <span className="font-semibold text-zinc-300">Default Staff PINs for Testing:</span>
          {activeUserList.map((u) => (
            <span
              key={u.id}
              onClick={() => {
                setSelectedUser(u);
                setPin(u.pin);
                verifyPin(u.pin, u);
              }}
              className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white cursor-pointer font-mono transition-colors"
              title={`Click to quick-login as ${u.name}`}
            >
              {u.name.split(" ")[0]} ({u.role}): <strong className="text-emerald-400">{u.pin}</strong>
            </span>
          ))}
        </div>

        <p className="text-[10px] text-zinc-500">
          Role-Based Access: Cashiers access POS Register & Billing • Managers access Inventory & Analytics • Administrators access Full System & Settings
        </p>
      </div>
    </div>
  );
};
