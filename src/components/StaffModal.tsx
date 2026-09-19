import React, { useState, useEffect } from "react";
import { X, UserCheck, Shield, KeyRound, Check, AlertCircle } from "lucide-react";
import { User, UserRole } from "../types";

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffUser: User | null; // null means adding a new staff
  onSave: (userData: Partial<User> & { name: string; pin: string }) => Promise<void>;
  onDelete?: (userId: string) => Promise<void>;
  totalStaffCount: number;
  currentUserId: string;
}

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  staffUser,
  onSave,
  onDelete,
  totalStaffCount,
  currentUserId
}) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("cashier");
  const [pin, setPin] = useState("");
  const [avatar, setAvatar] = useState("");
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (staffUser) {
      setName(staffUser.name);
      setRole(staffUser.role);
      setPin(staffUser.pin);
      setAvatar(staffUser.avatar);
      setActive(staffUser.active !== false);
    } else {
      setName("");
      setRole("cashier");
      setPin(`${Math.floor(1000 + Math.random() * 9000)}`);
      setAvatar("");
      setActive(true);
    }
    setConfirmDelete(false);
    setErrorMsg(null);
  }, [staffUser, isOpen]);

  if (!isOpen) return null;

  // Auto-generate avatar initials if empty or when name changes
  const handleNameChange = (val: string) => {
    setName(val);
    if (!staffUser || !staffUser.avatar) {
      const parts = val.trim().split(/\s+/);
      if (parts.length > 1) {
        setAvatar((parts[0][0] + parts[1][0]).toUpperCase());
      } else if (val.trim().length > 0) {
        setAvatar(val.trim().slice(0, 2).toUpperCase());
      }
    }
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPin = pin.trim();

    if (!trimmedName) {
      setErrorMsg("Please enter the staff member's name.");
      return;
    }

    if (!trimmedPin || trimmedPin.length < 3) {
      setErrorMsg("Please enter a PIN code with at least 3 digits.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onSave({
        id: staffUser?.id,
        name: trimmedName,
        role,
        pin: trimmedPin,
        avatar: avatar.trim().toUpperCase() || trimmedName.slice(0, 2).toUpperCase(),
        active
      });
      onClose();
    } catch {
      setErrorMsg("Failed to save staff profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!staffUser || !onDelete) return;
    setIsSubmitting(true);
    try {
      await onDelete(staffUser.id);
      onClose();
    } catch {
      setErrorMsg("Failed to delete staff member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSelf = staffUser?.id === currentUserId;
  const canDelete = staffUser && totalStaffCount > 1;

  return (
    <div
      id="staff-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
              {avatar || "ST"}
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-base">
                {staffUser ? "Edit Staff Profile" : "Add Staff Member"}
              </h3>
              <p className="text-xs text-zinc-500">
                {staffUser ? `Update permissions & credentials for ${staffUser.name}` : "Create a new terminal account"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Staff Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="staff-name-input"
              type="text"
              placeholder="e.g. Alex Rivera, Jordan Lee..."
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-800 focus:bg-white"
              autoFocus
            />
          </div>

          {/* Role & Avatar Initials */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Access Role</label>
              <select
                id="staff-role-select"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-zinc-300 rounded-xl text-zinc-800 focus:outline-none focus:border-zinc-800"
              >
                <option value="cashier">Cashier (POS & Sales)</option>
                <option value="manager">Store Manager</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Badge Initials</label>
              <input
                id="staff-avatar-input"
                type="text"
                maxLength={3}
                placeholder="e.g. AR"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 uppercase font-mono text-center focus:outline-none focus:border-zinc-800 focus:bg-white"
              />
            </div>
          </div>

          {/* Quick Terminal PIN */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
                <span>Quick Terminal PIN</span>
              </label>
              <button
                type="button"
                onClick={() => setPin(`${Math.floor(1000 + Math.random() * 9000)}`)}
                className="text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 underline cursor-pointer"
              >
                Generate random
              </button>
            </div>
            <input
              id="staff-pin-input"
              type="text"
              maxLength={6}
              placeholder="e.g. 1234"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="w-full px-3.5 py-2 text-sm font-mono tracking-widest text-center bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 focus:outline-none focus:border-zinc-800 focus:bg-white"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Used to switch accounts and authorize discounts at the checkout terminal.
            </p>
          </div>

          {/* Delete confirmation section */}
          {staffUser && canDelete && (
            <div className="pt-2 border-t border-zinc-100">
              {confirmDelete ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                  <p className="text-xs text-red-800 font-semibold">
                    Are you sure you want to remove <strong>{staffUser.name}</strong>?
                  </p>
                  {isSelf && (
                    <p className="text-[11px] text-red-600">
                      Note: You are currently signed in as this staff member. You will be switched to another account.
                    </p>
                  )}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1 text-xs font-semibold text-zinc-600 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                >
                  Remove this staff account...
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-staff-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{staffUser ? "Save Changes" : "Create Account"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
