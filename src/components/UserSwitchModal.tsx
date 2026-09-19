import React, { useState } from "react";
import { X, ShieldCheck, UserCheck, KeyRound, Edit2, Plus, Users } from "lucide-react";
import { User } from "../types";

interface UserSwitchModalProps {
  users: User[];
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
  onEditUser?: (user: User) => void;
  onAddNewUser?: () => void;
}

export const UserSwitchModal: React.FC<UserSwitchModalProps> = ({
  users,
  currentUser,
  isOpen,
  onClose,
  onSelectUser,
  onEditUser,
  onAddNewUser
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState<string>("");
  const [pinError, setPinError] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelect = (user: User) => {
    setSelectedUser(user);
    setPin("");
    setPinError(false);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (pin === selectedUser.pin) {
      onSelectUser(selectedUser);
      onClose();
    } else {
      setPinError(true);
      setPin("");
    }
  };

  return (
    <div id="user-switch-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 bg-zinc-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-zinc-200 text-zinc-800">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-base">Switch Staff Profile</h3>
              <p className="text-xs text-zinc-500">Multi-user terminal login</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!selectedUser ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-zinc-600">Select your staff account:</p>
                {onAddNewUser && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onAddNewUser();
                    }}
                    className="text-[11px] font-bold text-zinc-700 hover:text-zinc-900 flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Staff</span>
                  </button>
                )}
              </div>

              {users.map((user) => (
                <div
                  key={user.id}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    currentUser.id === user.id
                      ? "border-zinc-900 bg-zinc-50/80 shadow-xs"
                      : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(user)}
                    className="flex items-center gap-3 flex-1 text-left cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {user.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-zinc-900">{user.name}</p>
                        {currentUser.id === user.id && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700">
                        {user.role}
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 pl-2">
                    {onEditUser && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          onEditUser(user);
                        }}
                        title={`Edit name and PIN for ${user.name}`}
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/80 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full bg-zinc-900 text-white font-bold text-sm flex items-center justify-center mx-auto mb-2">
                  {selectedUser.avatar}
                </div>
                <h4 className="font-bold text-zinc-900 text-base">{selectedUser.name}</h4>
                <p className="text-xs text-zinc-500 uppercase font-semibold mt-0.5">
                  Role: {selectedUser.role} (Default PIN: {selectedUser.pin})
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1 text-center">
                  Enter 4-Digit Staff PIN
                </label>
                <div className="relative max-w-[200px] mx-auto">
                  <input
                    id="staff-pin-input"
                    type="password"
                    autoFocus
                    maxLength={4}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, ""));
                      setPinError(false);
                    }}
                    placeholder="••••"
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono py-2 border border-zinc-300 rounded-xl focus:outline-none focus:border-zinc-900"
                  />
                </div>
                {pinError && (
                  <p className="text-xs text-red-600 text-center mt-1.5 font-medium">
                    Incorrect PIN. Please try again.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-2 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  id="submit-pin-btn"
                  type="submit"
                  disabled={pin.length < 4}
                  className="flex-1 py-2 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-xl transition-colors"
                >
                  Verify & Switch
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
