import React, { useState } from "react";
import { X, Tag, Plus, Edit2, Trash2, Check, AlertCircle, Layers } from "lucide-react";
import { Product } from "../types";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  products: Product[];
  onAddCategory: (name: string) => Promise<void>;
  onRenameCategory: (oldName: string, newName: string) => Promise<void>;
  onDeleteCategory: (categoryName: string, fallbackCategory?: string) => Promise<void>;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  products,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory
}) => {
  const [newCatName, setNewCatName] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<string | null>(null);
  const [fallbackCat, setFallbackCat] = useState<string>("General");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate count of products per category
  const productCountMap = categories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = products.filter((p) => p.category?.toLowerCase() === cat.toLowerCase()).length;
    return acc;
  }, {});

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`Category "${trimmed}" already exists.`);
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    try {
      await onAddCategory(trimmed);
      setNewCatName("");
    } catch {
      setErrorMsg("Failed to add category.");
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (cat: string) => {
    setEditingCat(cat);
    setEditName(cat);
    setDeleteConfirmCat(null);
    setErrorMsg(null);
  };

  const handleSaveRename = async (oldName: string) => {
    const trimmedNew = editName.trim();
    if (!trimmedNew || trimmedNew.toLowerCase() === oldName.toLowerCase()) {
      setEditingCat(null);
      return;
    }

    if (
      categories.some(
        (c) => c.toLowerCase() === trimmedNew.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase()
      )
    ) {
      setErrorMsg(`A category named "${trimmedNew}" already exists.`);
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    try {
      await onRenameCategory(oldName, trimmedNew);
      setEditingCat(null);
    } catch {
      setErrorMsg("Failed to rename category.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (cat: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await onDeleteCategory(cat, fallbackCat);
      setDeleteConfirmCat(null);
    } catch {
      setErrorMsg("Failed to delete category.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="category-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-base">Edit & Manage Categories</h3>
              <p className="text-xs text-zinc-500">Create, rename, or organize catalog departments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Add New Category Input */}
          <form onSubmit={handleCreate} className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-700">Add New Category</label>
            <div className="flex gap-2">
              <input
                id="new-category-name-input"
                type="text"
                placeholder="e.g. Bakery & Pastries, Electronics..."
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="flex-1 px-3.5 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-800 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!newCatName.trim() || isLoading}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold px-1">
              <span>Active Store Categories ({categories.length})</span>
              <span>Linked Products</span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-xl bg-white shadow-inner">
              {categories.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-400">No categories found.</div>
              ) : (
                categories.map((cat) => {
                  const count = productCountMap[cat] || 0;
                  const isEditing = editingCat === cat;
                  const isConfirmingDelete = deleteConfirmCat === cat;

                  return (
                    <div key={cat} className="p-3 flex flex-col gap-2 transition-colors hover:bg-zinc-50/70">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRename(cat);
                              if (e.key === "Escape") setEditingCat(null);
                            }}
                            autoFocus
                            className="flex-1 px-3 py-1.5 text-xs font-semibold bg-white border border-zinc-400 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-900"
                          />
                          <button
                            onClick={() => handleSaveRename(cat)}
                            disabled={isLoading || !editName.trim()}
                            title="Save Rename"
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingCat(null)}
                            title="Cancel"
                            className="p-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : isConfirmingDelete ? (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                          <p className="text-xs text-amber-900 font-medium">
                            Delete <strong>"{cat}"</strong>?
                            {count > 0 && ` ${count} product(s) will be reassigned.`}
                          </p>
                          {count > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-amber-800 font-semibold shrink-0">Reassign to:</span>
                              <select
                                value={fallbackCat}
                                onChange={(e) => setFallbackCat(e.target.value)}
                                className="flex-1 px-2 py-1 text-xs bg-white border border-amber-300 rounded text-zinc-800"
                              >
                                {categories
                                  .filter((c) => c !== cat)
                                  .map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => setDeleteConfirmCat(null)}
                              className="px-2.5 py-1 text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 rounded hover:bg-zinc-100 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDelete(cat)}
                              disabled={isLoading}
                              className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                            <span className="text-xs font-bold text-zinc-800">{cat}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600">
                              {count} {count === 1 ? "item" : "items"}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditing(cat)}
                                title={`Rename ${cat}`}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/70 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirmCat(cat);
                                  setFallbackCat(categories.find((c) => c !== cat) || "General");
                                }}
                                title={`Delete ${cat}`}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 px-6 py-3.5 bg-zinc-50 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Renaming updates all matched products in real-time
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
