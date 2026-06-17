import React, { useState, useEffect } from "react";
import { Wifi } from "lucide-react";
import { Expense, Category, PaymentMethod, Filters, Period } from "./types";
import { seedInitialExpenses, saveExpenses } from "./utils";
import Dashboard from "./components/Dashboard";
import AddExpenseModal from "./components/AddExpenseModal";

function IOSStatusBar() {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-11 bg-black px-6 flex items-center justify-between select-none shrink-0 z-40 text-[14px] font-sans font-semibold tracking-tight text-white/95 relative">
      {/* Time on left */}
      <span className="text-[14px] ml-1">{currentTime}</span>
      
      {/* iOS styled notch visual element in center for desktop framing */}
      <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 w-32 h-6 bg-black rounded-b-2xl z-50 pointer-events-none" />

      {/* iOS style top status indicators on right */}
      <div className="flex items-center gap-1.5 text-[12px] opacity-90 mr-1">
        {/* Signal icon using bars */}
        <div className="flex items-end gap-[2px] h-3 w-4 pb-[1px]" aria-label="Signal Strength">
          <div className="w-[3px] h-[3px] bg-white rounded-[0.5px]"></div>
          <div className="w-[3px] h-[5px] bg-white rounded-[0.5px]"></div>
          <div className="w-[3px] h-[8px] bg-white rounded-[0.5px]"></div>
          <div className="w-[3px] h-[10px] bg-white rounded-[0.5px]"></div>
        </div>
        
        {/* Wifi icon */}
        <Wifi size={13} strokeWidth={2.5} />
        
        {/* Battery icon */}
        <div className="flex items-center" aria-label="Battery Status">
          <div className="w-[20px] h-[11px] border border-white/50 rounded-[3px] p-[1.5px] flex items-center relative">
            <div className="h-full w-full bg-white rounded-[1px]"></div>
          </div>
          <div className="w-[1.5px] h-[4px] bg-white/50 rounded-r-[1px] ml-[1px]"></div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeProfile, setActiveProfile] = useState<string>("Thang");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filters, setFilters] = useState<Filters>({
    period: Period.Today,
    category: "All",
    paymentMethod: "All"
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEditExpense, setSelectedEditExpense] = useState<Expense | null>(null);

  // Layout View Control: Bezels enabled by default for authentic mobile portfolio presentation
  const [useBezel, setUseBezel] = useState(true);

  // Load and Seed relative profile databases
  useEffect(() => {
    const key = `ios_expenses_${activeProfile.replace(/\s+/g, "_")}`;
    const stored = localStorage.getItem(key);

    if (stored) {
      try {
        setExpenses(JSON.parse(stored));
      } catch (e) {
        console.error("Error loading expenses for profile", activeProfile, e);
      }
    } else {
      // Seed default data depending on active profile selector
      let seed: Expense[] = [];
      if (activeProfile === "Thang") {
        seed = seedInitialExpenses();
      } else if (activeProfile === "Family Ledger") {
        seed = [
          {
            id: "fam-1",
            title: "Đi siêu thị Big C",
            amount: 450000,
            category: Category.Shopping,
            paymentMethod: PaymentMethod.Card,
            date: "2026-06-16"
          },
          {
            id: "fam-2",
            title: "Thanh toán Tiền điện",
            amount: 680000,
            category: Category.Bills,
            paymentMethod: PaymentMethod.Bank,
            date: "2026-06-15"
          },
          {
            id: "fam-3",
            title: "Mua bỉm tã sữa",
            amount: 250000,
            category: Category.Shopping,
            paymentMethod: PaymentMethod.Cash,
            date: "2026-06-12"
          }
        ];
      } else if (activeProfile === "Business Expense") {
        seed = [
          {
            id: "biz-1",
            title: "Mua Hosting Cloud VPS",
            amount: 350000,
            category: Category.Bills,
            paymentMethod: PaymentMethod.Card,
            date: "2026-06-16"
          },
          {
            id: "biz-2",
            title: "In ấn tờ rơi giới thiệu",
            amount: 180000,
            category: Category.Shopping,
            paymentMethod: PaymentMethod.Cash,
            date: "2026-06-15"
          },
          {
            id: "biz-3",
            title: "Thảo luận ăn uống đối tác",
            amount: 1200000,
            category: Category.Food,
            paymentMethod: PaymentMethod.Card,
            date: "2026-06-11"
          }
        ];
      }
      setExpenses(seed);
      localStorage.setItem(key, JSON.stringify(seed));
    }
  }, [activeProfile]);

  // Sync state back to core local storage on transactions changes
  const updateExpensesState = (updated: Expense[]) => {
    setExpenses(updated);
    const key = `ios_expenses_${activeProfile.replace(/\s+/g, "_")}`;
    localStorage.setItem(key, JSON.stringify(updated));
    // Also update legacy key so list utility has metrics
    localStorage.setItem("ios_expenses", JSON.stringify(updated));
  };

  // Add / Save transaction handler
  const handleSaveExpense = (data: {
    title: string;
    amount: number;
    category: Category;
    paymentMethod: PaymentMethod;
    date: string;
  }) => {
    if (selectedEditExpense) {
      // Edit mode
      const updated = expenses.map((item) =>
        item.id === selectedEditExpense.id ? { ...item, ...data } : item
      );
      updateExpensesState(updated);
    } else {
      // New mode
      const newExpense: Expense = {
        id: "exp-" + Date.now(),
        ...data
      };
      updateExpensesState([newExpense, ...expenses]);
    }
    setIsAddModalOpen(false);
    setSelectedEditExpense(null);
  };

  // Delete transaction handler
  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter((item) => item.id !== id);
    updateExpensesState(updated);
    setIsAddModalOpen(false);
    setSelectedEditExpense(null);
  };

  // Preset trigger helpers - restore exact reference Tuesday
  const handleLoadReferenceState = () => {
    const key = `ios_expenses_${activeProfile.replace(/\s+/g, "_")}`;
    localStorage.removeItem(key);
    localStorage.removeItem("ios_expenses");
    // Reload state manually
    const seed = seedInitialExpenses();
    setExpenses(seed);
    setFilters({
      period: Period.AllTime,
      category: "All",
      paymentMethod: "All"
    });
  };

  // Preset trigger helpers - load dense mockup dataset
  const handleLoadDenseState = () => {
    const mockDense: Expense[] = [
      {
        id: "dense-1",
        title: "Đi chơi dã ngoại",
        amount: 200000,
        category: Category.Entertainment,
        paymentMethod: PaymentMethod.Card,
        date: "2026-06-16"
      },
      {
        id: "dense-2",
        title: "Ăn trưa bún chả",
        amount: 30000,
        category: Category.Food,
        paymentMethod: PaymentMethod.Cash,
        date: "2026-06-16"
      },
      {
        id: "dense-3",
        title: "Vé xe bus khứ hồi",
        amount: 15000,
        category: Category.Transport,
        paymentMethod: PaymentMethod.Cash,
        date: "2026-06-14"
      },
      {
        id: "dense-4",
        title: "Trà sữa Matcha Latte",
        amount: 45000,
        category: Category.Food,
        paymentMethod: PaymentMethod.Bank,
        date: "2026-06-10"
      },
      {
        id: "dense-5",
        title: "Thanh toán cước Wifi",
        amount: 350000,
        category: Category.Bills,
        paymentMethod: PaymentMethod.Bank,
        date: "2026-06-15"
      },
      {
        id: "dense-6",
        title: "Mua áo polo nam",
        amount: 280000,
        category: Category.Shopping,
        paymentMethod: PaymentMethod.Card,
        date: "2026-06-13"
      },
      {
        id: "dense-7",
        title: "Cà phê đen đá",
        amount: 25000,
        category: Category.Food,
        paymentMethod: PaymentMethod.Cash,
        date: "2026-06-16"
      },
      {
        id: "dense-8",
        title: "Xem phim viễn tưởng CGV",
        amount: 120000,
        category: Category.Entertainment,
        paymentMethod: PaymentMethod.Card,
        date: "2026-06-12"
      }
    ];
    updateExpensesState(mockDense);
  };

  // Pure list wipe helper
  const handleClearAll = () => {
    updateExpensesState([]);
  };

  return (
    <div className="min-h-screen w-full bg-[#050507] text-white flex flex-col md:justify-center md:items-center font-sans antialiased overflow-x-hidden selection:bg-white/20">
      
      {/* Main Responsive Mobile Frame (Adapts to full screen on mobile, styled device on desktop) */}
      <div className="w-full max-w-md mx-auto h-[100dvh] md:h-[844px] md:min-h-[844px] md:max-h-[844px] md:rounded-[40px] md:border-8 md:border-[#2C2C2E] md:shadow-[0_25px_60px_rgba(0,0,0,0.85)] bg-black flex flex-col relative overflow-hidden transition-all duration-300">
        
        {/* Subtle decorative glowing background layers - bounded strictly inside the frame */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute right-[-10%] top-[-10%] w-72 h-72 rounded-full bg-blue-500/[0.04] blur-[80px]" />
          <div className="absolute left-[-10%] bottom-[-10%] w-80 h-80 rounded-full bg-violet-500/[0.04] blur-[90px]" />
        </div>
        
        {/* Display screen body content wrapping Dashboard */}
        <div className="flex-1 w-full overflow-hidden relative flex flex-col">
          <IOSStatusBar />
          <Dashboard
            expenses={expenses}
            onOpenAddModal={() => {
              setSelectedEditExpense(null);
              setIsAddModalOpen(true);
            }}
            onSelectEditExpense={(expense) => {
              setSelectedEditExpense(expense);
              setIsAddModalOpen(true);
            }}
            filters={filters}
            onChangeFilters={setFilters}
            activeProfile={activeProfile}
            onChangeProfile={setActiveProfile}
            onLoadReference={handleLoadReferenceState}
            onLoadLargeDataset={handleLoadDenseState}
            onClearAll={handleClearAll}
            isAddModalOpen={isAddModalOpen}
          />
        </div>

        {/* iOS Bottom Home indicator bar (only visible on desktop wrapper window) */}
        <div className="hidden md:flex justify-center py-2 z-30 pointer-events-none select-none bg-black shrink-0">
          <div className="w-32 h-[4px] rounded-full bg-white/30" />
        </div>

        {/* 3. ADD AND EDIT TRANSACTION SHEET */}
        <AddExpenseModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedEditExpense(null);
          }}
          onSave={handleSaveExpense}
          onDelete={handleDeleteExpense}
          editExpense={selectedEditExpense}
        />

      </div>
    </div>
  );
}
