import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Calendar, Tag, CreditCard, PenTool, Trash2, X } from "lucide-react";
import { Category, PaymentMethod, Expense } from "../types";
import IOSKeyboard from "./iOSKeyboard";

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
  const [focusedField, setFocusedField] = useState<"title" | "amount" | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Initialize fields on mount / edit transition
  useEffect(() => {
    if (editExpense) {
      setTitle(editExpense.title);
      setAmountStr(editExpense.amount.toString());
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
    setFocusedField(isOpen ? "title" : null);

    if (isOpen) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [editExpense, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const rawVal = parseFloat(amountStr) || 0;
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

  const handleDelete = () => {
    if (editExpense && onDelete) {
      onDelete(editExpense.id);
    }
  };

  // Keyboard state update handoffs
  const handleVirtualKeyPress = (char: string) => {
    if (focusedField === "title") {
      setTitle((prev) => prev + char);
    } else if (focusedField === "amount") {
      if (char === "." && amountStr.includes(".")) return;
      setAmountStr((prev) => prev + char);
    }
  };

  const handleVirtualDelete = () => {
    if (focusedField === "title") {
      setTitle((prev) => prev.slice(0, -1));
    } else if (focusedField === "amount") {
      setAmountStr((prev) => prev.slice(0, -1));
    }
  };

  const handleVirtualSpace = () => {
    if (focusedField === "title") {
      setTitle((prev) => prev + " ");
    }
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
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-5">
          
          {/* iOS Rounded Dark Form block */}
          <div className="bg-[#1C1C1E] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5 text-[15px]">
            {/* Title Row */}
            <div className="flex items-center justify-between py-3.5 px-4">
              <span className="text-gray-400 select-none font-medium text-sm">Title</span>
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => {
                  setFocusedField("title");
                  setActivePicker("none");
                }}
                placeholder="Expense name"
                className="bg-transparent text-right text-white placeholder-gray-600 focus:outline-none flex-1 max-w-[180px] text-15px font-sans"
              />
            </div>

            {/* Amount Row */}
            <div className="flex items-center justify-between py-3.5 px-4 bg-white/[0.01]">
              <span className="text-gray-400 select-none font-medium text-sm">Amount</span>
              <div aria-label="amount input container" className="flex items-center gap-1.5 flex-1 justify-end">
                <input
                  ref={amountInputRef}
                  type="text"
                  value={amountStr}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9.]/g, "");
                    setAmountStr(clean);
                  }}
                  onFocus={() => {
                    setFocusedField("amount");
                    setActivePicker("none");
                  }}
                  placeholder="0.00"
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
              onClick={handleDelete}
              className="mt-2 w-full py-3 px-4 rounded-xl border border-red-500/10 bg-red-500/10 active:bg-red-500/20 text-red-400 font-medium text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 size={15} />
              <span>Delete Expense</span>
            </button>
          )}

          {/* Quick instructions indicator for better UX */}
          {!focusedField && activePicker === "none" && (
            <div className="text-[12px] text-gray-500 text-center select-none py-4 leading-normal">
              Tap fields to edit. Tap Title or Amount to deploy the iOS virtual mock screen keyboard.
            </div>
          )}

        </div>

        {/* Dynamic slides-in virtual iOS Keyboard to fulfill the visual keyboard reference screenshots */}
        {focusedField && (
          <div className="shrink-0">
            <IOSKeyboard
              onKeyPress={handleVirtualKeyPress}
              onDelete={handleVirtualDelete}
              onSpace={handleVirtualSpace}
              onClose={() => setFocusedField(null)}
              numericOnly={focusedField === "amount"}
            />
          </div>
        )}

      </div>
    </div>
  );
}
