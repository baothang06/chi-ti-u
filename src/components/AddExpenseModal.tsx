import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Calendar, Tag, CreditCard, PenTool, Trash2, X } from "lucide-react";
import { Category, PaymentMethod, Expense } from "../types";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: {
    title: string;
    amount: number;
    category: Category;
    paymentMethod: PaymentMethod;
    date: string;
  }) => void;
  onDelete?: (id: string) => void;
  editExpense?: Expense | null;
}

type NestedPicker = "none" | "date";

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editExpense
}: AddExpenseModalProps) {
  const [title, setTitle] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [category, setCategory] = useState<Category>(Category.Other);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [expenseDate, setExpenseDate] = useState("2026-06-16");

  const [activePicker, setActivePicker] = useState<NestedPicker>("none");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const formatInputAmount = (val: string): string => {
    const clean = val.replace(/[^0-9]/g, "");
    if (!clean) return "";
    return parseInt(clean, 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Initialize fields on mount / edit transition
  useEffect(() => {
    if (editExpense) {
      setTitle(editExpense.title);
      setAmountStr(formatInputAmount(editExpense.amount.toString()));
      setCategory(editExpense.category);
      setPaymentMethod(editExpense.paymentMethod);
      setExpenseDate(editExpense.date);
    } else {
      setTitle("");
      setAmountStr("");
      setCategory(Category.Other);
      setPaymentMethod(PaymentMethod.Cash);
      setExpenseDate("2026-06-16");
    }
    setActivePicker("none");
    setShowDeleteConfirm(false);

    if (isOpen) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [editExpense, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const cleanAmount = amountStr.replace(/\./g, "");
    const rawVal = parseFloat(cleanAmount) || 0;
    if (!title.trim()) {
      alert("Please enter an expense title.");
      return;
    }
    if (rawVal <= 0) {
      alert("Please enter an expense amount greater than 0.");
      return;
    }

    onSave({
      title: title.trim(),
      amount: rawVal,
      category,
      paymentMethod,
      date: expenseDate
    });
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (editExpense && onDelete) {
      onDelete(editExpense.id);
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex flex-col justify-end overflow-hidden transition-all duration-300">
      {/* Tap outside backdrop */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      {/* Sheet Container */}
      <div className="w-full max-h-[92%] bg-[#121214] rounded-t-[32px] flex flex-col border-t border-white/10 overflow-hidden shadow-2xl animate-[slideUp_0.28s_ease-out]">
        
        {/* iOS Drag Handle bar */}
        <div className="w-full flex justify-center py-2 shrink-0">
          <div className="w-9 h-1 rounded-full bg-white/15" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-white text-[17px] active:text-white/60 tracking-normal hover:opacity-80"
          >
            Cancel
          </button>
          <span className="text-white font-semibold text-[17px] select-none font-display">
            {editExpense ? "Edit Expense" : "New Expense"}
          </span>
          <button
            type="button"
            onClick={handleSave}
            className={`text-[17px] font-semibold active:opacity-60 hover:opacity-100 ${
              title && amountStr
                ? "text-white"
                : "text-white/40"
            }`}
          >
            Save
          </button>
        </div>

        {/* Main interactive form card scroll space */}
        <div className="p-5 pb-32 overflow-y-auto flex flex-col gap-5">
          
          {/* iOS Rounded Dark Form block */}
          <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5 text-[15px]">
            {/* Title Row */}
            <div 
              className="flex items-center justify-between py-3.5 px-4 cursor-pointer active:bg-white/[0.02]"
              onClick={() => titleInputRef.current?.focus()}
            >
              <span className="text-gray-400 select-none font-medium text-sm">Title</span>
              <input
                ref={titleInputRef}
                type="text"
                inputMode="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => {
                  setActivePicker("none");
                }}
                placeholder="Expense name"
                className="bg-transparent text-right text-white placeholder-gray-600 focus:outline-none flex-1 max-w-[220px] text-15px font-sans"
              />
            </div>

             {/* Amount Row */}
            <div 
              className="flex items-center justify-between py-3.5 px-4 bg-white/[0.01] cursor-pointer active:bg-white/[0.03]"
              onClick={() => amountInputRef.current?.focus()}
            >
              <span className="text-gray-400 select-none font-medium text-sm">Amount</span>
              <div aria-label="amount input container" className="flex items-center gap-1.5 flex-1 justify-end">
                <input
                  ref={amountInputRef}
                  type="text"
                  inputMode="decimal"
                  value={amountStr}
                  onChange={(e) => {
                    setAmountStr(formatInputAmount(e.target.value));
                  }}
                  onFocus={() => {
                    setActivePicker("none");
                  }}
                  placeholder="0"
                  className="bg-transparent text-right text-white placeholder-gray-600 focus:outline-none flex-1 w-full text-15px font-sans font-medium"
                />
              </div>
            </div>

            {/* Date Row */}
            <div className="flex items-center justify-between py-3 px-4">
              <span className="text-gray-400 select-none font-medium text-sm">Date</span>
              <div className="flex items-center gap-1 bg-white/10 dark:bg-white/[0.08] px-3 py-1.5 rounded-lg select-pointer relative">
                <Calendar size={14} className="text-gray-400 mr-1.5" />
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="bg-transparent text-white focus:outline-none text-[13px] font-sans text-right appearance-none"
                />
              </div>
            </div>
          </div>

          {/* Delete section (visible ONLY when editing) */}
          {editExpense && onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="mt-2 w-full py-3 px-4 rounded-xl border border-red-500/10 bg-red-500/10 active:bg-red-500/20 text-red-400 font-medium text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 size={15} />
              <span>Delete Expense</span>
            </button>
          )}

        </div>

      </div>

      {/* iOS styled Delete Confirmation Modal Overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#1C1C1E]/95 border border-white/10 rounded-2xl w-full max-w-[270px] overflow-hidden flex flex-col items-center text-center shadow-2xl animate-[zoomIn_0.15s_ease-out]">
            <div className="p-5 flex flex-col gap-1.5">
              <span className="text-white font-semibold text-[17px] tracking-tight font-display">Delete Expense?</span>
              <p className="text-gray-400 text-[13px] leading-snug">Are you sure you want to delete this expense? This action cannot be undone.</p>
            </div>
            <div className="w-full border-t border-white/10 grid grid-cols-2 divide-x divide-white/10 h-11 text-[15px]">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-[#0A84FF] font-normal active:bg-white/[0.05] h-full flex items-center justify-center cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="text-[#FF453A] font-semibold active:bg-white/[0.05] h-full flex items-center justify-center cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
