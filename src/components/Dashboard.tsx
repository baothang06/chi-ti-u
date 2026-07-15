import React, { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  TrendingUp,
  Search,
  Clock,
  FileText,
  Plus,
  Utensils,
  ShoppingBag,
  Car,
  Film,
  Receipt,
  HelpCircle,
  X,
  CreditCard,
  Coins,
  Building2,
  Info,
  RefreshCw,
  Sparkles,
  Trash2
} from "lucide-react";
import { Expense, Category, PaymentMethod, Filters, Period } from "../types";
import { formatVND, formatDateString, getDayOfWeek, formatAxisNumber, getTodayDateString, parseLocalDate, matchesPeriod } from "../utils";
import FilterPopover from "./FilterPopover";

interface DashboardProps {
  expenses: Expense[];
  onOpenAddModal: () => void;
  onSelectEditExpense: (expense: Expense) => void;
  filters: Filters;
  onChangeFilters: (newFilters: Filters) => void;
  activeProfile: string;
  onChangeProfile: (profile: string) => void;
  onLoadReference: () => void;
  onLoadLargeDataset: () => void;
  onClearAll: () => void;
  isAddModalOpen?: boolean;
}

export default function Dashboard({
  expenses,
  onOpenAddModal,
  onSelectEditExpense,
  filters,
  onChangeFilters,
  activeProfile,
  onChangeProfile,
  onLoadReference,
  onLoadLargeDataset,
  onClearAll,
  isAddModalOpen
}: DashboardProps) {
  // UI toggles
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [showNotesCard, setShowNotesCard] = useState(false);
  const [notesText, setNotesText] = useState(() => localStorage.getItem("user_notes") || "");
  const [topSpendingPeriod, setTopSpendingPeriod] = useState<"week" | "month" | "year">("week");
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Dynamic Reference Date (Today) to ensure newly added items are reflected immediately
  const systemReferenceDateStr = getTodayDateString();

  // Category to Icon mapping function
  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case Category.Food:
        return <Utensils size={16} className="text-white" />;
      case Category.Shopping:
        return <ShoppingBag size={16} className="text-white" />;
      case Category.Transport:
        return <Car size={16} className="text-white" />;
      case Category.Entertainment:
        return <Film size={16} className="text-white" />;
      case Category.Bills:
        return <Receipt size={16} className="text-white" />;
      default:
        return <HelpCircle size={16} className="text-white" />;
    }
  };

  const getCategoryColor = (cat: Category) => {
    switch (cat) {
      case Category.Food:
        return "bg-emerald-500/20 text-emerald-400";
      case Category.Shopping:
        return "bg-cyan-500/20 text-cyan-400";
      case Category.Transport:
        return "bg-amber-500/20 text-amber-400";
      case Category.Entertainment:
        return "bg-rose-500/20 text-rose-400";
      case Category.Bills:
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  // Profile List
  const profiles = [
    { id: "Thang", name: "Thang" },
    { id: "Family Ledger", name: "Family Ledger" },
    { id: "Business Expense", name: "Business Ledger" }
  ];

  // Calculate "Spent today" (filtered strictly to system reference date: 2026-06-16)
  const spentToday = expenses
    .filter((e) => e.date === systemReferenceDateStr)
    .reduce((sum, item) => sum + item.amount, 0);

  // Helper to determine transaction hour based on saved time or title & id deterministic fallback
  const getSimulatedHour = (expense: Expense): number => {
    if (expense.time) {
      const parts = expense.time.split(":");
      if (parts.length >= 1) {
        const h = parseInt(parts[0], 10);
        if (!isNaN(h)) return h;
      }
    }
    const title = expense.title;
    const id = expense.id;
    const t = title.toLowerCase();
    if (t.includes("sáng") || t.includes("cà phê") || t.includes("coffee") || t.includes("bún") || t.includes("phở")) return 8;
    if (t.includes("trưa") || t.includes("lunch") || t.includes("cơm")) return 12;
    if (t.includes("chiều") || t.includes("chơi") || t.includes("cgv") || t.includes("phim") || t.includes("áo") || t.includes("polo")) return 15;
    if (t.includes("tối") || t.includes("dinner") || t.includes("lẩu")) return 18;
    if (t.includes("wifi") || t.includes("điện") || t.includes("nước") || t.includes("cước")) return 11;
    // Deterministic fallback based on id/charcode
    let hash = 0;
    const combined = title + id;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hours = [8, 12, 15, 18, 21, 23];
    return hours[Math.abs(hash) % hours.length];
  };

  // Get top 10 largest expenses for the selected period
  const getTopExpenses = () => {
    let periodEnum = Period.ThisWeek;
    if (topSpendingPeriod === "month") periodEnum = Period.ThisMonth;
    if (topSpendingPeriod === "year") periodEnum = Period.ThisYear;
    
    return expenses
      .filter((e) => matchesPeriod(e.date, periodEnum, systemReferenceDateStr))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  };

  // Filter transactions for chart (scoped to active profile, category, payment method)
  const chartFilteredExpenses = expenses.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchPay = item.paymentMethod.toLowerCase().includes(q);
      if (!matchTitle && !matchCat && !matchPay) return false;
    }
    if (filters.category !== "All" && item.category !== filters.category) return false;
    if (filters.paymentMethod !== "All" && item.paymentMethod !== filters.paymentMethod) return false;
    return true;
  });

  // Calculate dynamic chart structure based on Period
  let chartValues: { label: string; amount: number; hoverLabel?: string; keyId: string; dateStr?: string }[] = [];

  if (filters.period === Period.Today || filters.period === Period.ThisWeek) {
    // TODAY & THIS WEEK: Dynamically compute the last 7 days ending with today's date
    const refDateObj = parseLocalDate(systemReferenceDateStr);
    const chartDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(refDateObj);
      d.setDate(refDateObj.getDate() - i);
      const year = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, "0");
      const dateStr = String(d.getDate()).padStart(2, "0");
      const isoDate = `${year}-${monthStr}-${dateStr}`;
      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const label = daysOfWeek[d.getDay()];
      chartDays.push({
        dateStr: isoDate,
        label,
        keyId: `w-${isoDate}`
      });
    }

    chartValues = chartDays.map((day) => {
      const total = chartFilteredExpenses
        .filter((e) => e.date === day.dateStr)
        .reduce((sum, item) => sum + item.amount, 0);
      return {
        label: day.label,
        amount: total,
        hoverLabel: formatDateString(day.dateStr),
        keyId: day.keyId,
        dateStr: day.dateStr
      };
    });

  } else if (filters.period === Period.ThisMonth) {
    // 3. THIS MONTH: Spent 5 columns (1-6, 7-12, 13-18, 19-24, 25-31) with dynamic month label
    const refDateObj = parseLocalDate(systemReferenceDateStr);
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const monthAbbrev = months[refDateObj.getMonth()];
    const monthBins = [
      { label: "1-6", min: 1, max: 6, amount: 0, hoverLabel: `01 - 06 tháng ${monthAbbrev}`, keyId: "m1" },
      { label: "7-12", min: 7, max: 12, amount: 0, hoverLabel: `07 - 12 tháng ${monthAbbrev}`, keyId: "m2" },
      { label: "13-18", min: 13, max: 18, amount: 0, hoverLabel: `13 - 18 tháng ${monthAbbrev}`, keyId: "m3" },
      { label: "19-24", min: 19, max: 24, amount: 0, hoverLabel: `19 - 24 tháng ${monthAbbrev}`, keyId: "m4" },
      { label: "25-31", min: 25, max: 31, amount: 0, hoverLabel: `25 - 31 tháng ${monthAbbrev}`, keyId: "m5" }
    ];

    const refDate = parseLocalDate(systemReferenceDateStr);
    const monthExpenses = chartFilteredExpenses.filter((e) => {
      const expDate = parseLocalDate(e.date);
      return expDate.getFullYear() === refDate.getFullYear() && expDate.getMonth() === refDate.getMonth();
    });

    monthExpenses.forEach((e) => {
      const dayNum = parseLocalDate(e.date).getDate();
      const bin = monthBins.find((b) => dayNum >= b.min && dayNum <= b.max);
      if (bin) {
        bin.amount += e.amount;
      }
    });

    chartValues = monthBins.map((bin) => ({
      label: bin.label,
      amount: bin.amount,
      hoverLabel: bin.hoverLabel,
      keyId: bin.keyId
    }));

  } else if (filters.period === Period.ThisYear) {
    // 4. THIS YEAR: Spent 12 months
    const yearMonths = [
      { label: "J", mIdx: 0, labelFull: "Jan", keyId: "y1" },
      { label: "F", mIdx: 1, labelFull: "Feb", keyId: "y2" },
      { label: "M", mIdx: 2, labelFull: "Mar", keyId: "y3" },
      { label: "A", mIdx: 3, labelFull: "Apr", keyId: "y4" },
      { label: "M", mIdx: 4, labelFull: "May", keyId: "y5" },
      { label: "J", mIdx: 5, labelFull: "Jun", keyId: "y6" },
      { label: "J", mIdx: 6, labelFull: "Jul", keyId: "y7" },
      { label: "A", mIdx: 7, labelFull: "Aug", keyId: "y8" },
      { label: "S", mIdx: 8, labelFull: "Sep", keyId: "y9" },
      { label: "O", mIdx: 9, labelFull: "Oct", keyId: "y10" },
      { label: "N", mIdx: 10, labelFull: "Nov", keyId: "y11" },
      { label: "D", mIdx: 11, labelFull: "Dec", keyId: "y12" }
    ];

    const refDate = parseLocalDate(systemReferenceDateStr);
    const yearExpenses = chartFilteredExpenses.filter((e) => {
      const expDate = parseLocalDate(e.date);
      return expDate.getFullYear() === refDate.getFullYear();
    });

    chartValues = yearMonths.map((ym) => {
      const total = yearExpenses
        .filter((e) => parseLocalDate(e.date).getMonth() === ym.mIdx)
        .reduce((sum, item) => sum + item.amount, 0);
      return {
        label: ym.label,
        amount: total,
        hoverLabel: ym.labelFull,
        keyId: ym.keyId
      };
    });

  } else {
    // 5. ALL TIME: Spent by year
    const baseYears = [2024, 2025, 2026];
    const txYears = chartFilteredExpenses.map((e) => parseLocalDate(e.date).getFullYear());
    const unionYears = Array.from(new Set([...baseYears, ...txYears]))
      .filter((y) => !isNaN(y))
      .sort((a, b) => a - b);

    chartValues = unionYears.map((yr) => {
      const total = chartFilteredExpenses
        .filter((e) => parseLocalDate(e.date).getFullYear() === yr)
        .reduce((sum, item) => sum + item.amount, 0);
      return {
        label: yr.toString(),
        amount: total,
        hoverLabel: `Năm ${yr}`,
        keyId: `yr-${yr}`
      };
    });
  }

  // Dynamically calculate chart max scaling (must be a multiple of 300,000 for clean 100,000 step ticks on the grid)
  const maxSpentInDays = Math.max(...chartValues.map((v) => v.amount));
  const chartMaxScale = maxSpentInDays > 300000 ? Math.ceil(maxSpentInDays / 300000) * 300000 : 300000;

  // Axis grid labels as clean integer multiples of 100,000
  const axisGridTicks = [
    chartMaxScale,
    Math.round((chartMaxScale / 3) * 2),
    Math.round(chartMaxScale / 3),
    0
  ];

  // 2. FILTER TRANSACTIONS BASED ON PERIODS & SELECTORS
  const checkFiltersAndSearch = (item: Expense): boolean => {
    // A. Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchPay = item.paymentMethod.toLowerCase().includes(q);

      // Amount matching (raw, formatted "200.000", or using shorthand "k" e.g. "200k")
      const rawAmountStr = item.amount.toString();
      const formattedAmountStr = formatVND(item.amount);
      const cleanedQ = q.endsWith("k") ? q.slice(0, -1) : q;
      const matchAmount =
        rawAmountStr.includes(cleanedQ) ||
        formattedAmountStr.includes(q) ||
        (q.endsWith("k") && rawAmountStr.startsWith(cleanedQ));

      // Date matching (raw date "2026-06-16", formatted "16 Jun 2026", and traditional Vietnamese representations)
      const expDate = parseLocalDate(item.date);
      const day = expDate.getDate();
      const month = expDate.getMonth() + 1;
      const year = expDate.getFullYear();
      const daysVN = ["chủ nhật", "thứ hai", "thứ ba", "thứ tư", "thứ năm", "thứ sáu", "thứ bảy"];
      const dayVN = daysVN[expDate.getDay()];

      const dateStrings = [
        `${day}/${month}/${year}`,
        `${day}/${month}`,
        `${day}-${month}-${year}`,
        `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`,
        `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}`,
        `thg ${month}`,
        `tháng ${month}`,
        `th0 ${month}`,
        `th ${month}`,
        item.date,
        formatDateString(item.date).toLowerCase(),
        dayVN,
        `${dayVN}, ${day} th0 ${month}`,
        `${dayVN}, ${day} tháng ${month}`,
      ];

      const matchDate = dateStrings.some((ds) => ds.includes(q));

      if (!matchTitle && !matchCat && !matchPay && !matchAmount && !matchDate) return false;
    }

    // B. Category check
    if (filters.category !== "All" && item.category !== filters.category) {
      return false;
    }

    // C. Payment Method check
    if (filters.paymentMethod !== "All" && item.paymentMethod !== filters.paymentMethod) {
      return false;
    }

    // D. Period check
    return matchesPeriod(item.date, filters.period, systemReferenceDateStr);
  };

  const filteredExpenses = expenses.filter(checkFiltersAndSearch);

  // Grouped aggregates for filtered list summary info
  const filteredSum = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  // Grouping helper based on period to create human readable time milestone subheaders
  const getGroupedExpenses = () => {
    const groupsMap: { [key: string]: { title: string; expenses: Expense[]; sortOrder: number } } = {};

    filteredExpenses.forEach((expense) => {
      let groupKey = "";
      let groupTitle = "";
      let sortOrder = 0;

      const refDate = parseLocalDate(systemReferenceDateStr);
      const expDate = parseLocalDate(expense.date);
      refDate.setHours(12, 0, 0, 0);
      expDate.setHours(12, 0, 0, 0);

      const diffDays = Math.round((refDate.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24));

      if (filters.period === Period.Today) {
        // Group by hour ranges
        const hr = getSimulatedHour(expense);
        if (hr >= 23 || hr < 6) {
          groupKey = "h23";
          groupTitle = "Đêm muộn (23:00 - 06:00)";
          sortOrder = 6;
        } else if (hr >= 20) {
          groupKey = "h20";
          groupTitle = "Tối muộn (20:00 - 23:00)";
          sortOrder = 5;
        } else if (hr >= 17) {
          groupKey = "h17";
          groupTitle = "Buổi tối (17:00 - 20:00)";
          sortOrder = 4;
        } else if (hr >= 14) {
          groupKey = "h14";
          groupTitle = "Buổi chiều (14:00 - 17:00)";
          sortOrder = 3;
        } else if (hr >= 11) {
          groupKey = "h11";
          groupTitle = "Buổi trưa (11:00 - 14:00)";
          sortOrder = 2;
        } else {
          groupKey = "h08";
          groupTitle = "Buổi sáng (08:00 - 11:00)";
          sortOrder = 1;
        }
      } else if (filters.period === Period.ThisWeek || filters.period === Period.ThisMonth) {
        // Group by exact date
        groupKey = expense.date;
        sortOrder = expDate.getTime();

        const dayNum = expDate.getDate();
        const monthNum = expDate.getMonth() + 1;

        if (diffDays === 0) {
          groupTitle = `Hôm nay, ${dayNum} Th0 ${monthNum}`;
        } else if (diffDays === 1) {
          groupTitle = `Hôm qua, ${dayNum} Th0 ${monthNum}`;
        } else {
          const daysVN = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
          const dayName = daysVN[expDate.getDay()];
          groupTitle = `${dayName}, ${dayNum} Th0 ${monthNum}`;
        }
      } else {
        // ThisYear or AllTime -> group by Month
        const monthsVN = [
          "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
          "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
        ];
        groupKey = `${expDate.getFullYear()}-${(expDate.getMonth() + 1).toString().padStart(2, "0")}`;
        groupTitle = `${monthsVN[expDate.getMonth()]}, ${expDate.getFullYear()}`;
        sortOrder = expDate.getFullYear() * 12 + expDate.getMonth();
      }

      if (!groupsMap[groupKey]) {
        groupsMap[groupKey] = {
          title: groupTitle,
          expenses: [],
          sortOrder: sortOrder
        };
      }
      groupsMap[groupKey].expenses.push(expense);
    });

    return Object.entries(groupsMap)
      .map(([key, data]) => {
        const totalAmount = data.expenses.reduce((s, e) => s + e.amount, 0);
        const sortedExpenses = [...data.expenses].sort((a, b) => {
          if (filters.period === Period.Today) {
            return getSimulatedHour(b) - getSimulatedHour(a);
          }
          return 0;
        });

        return {
          key,
          title: data.title,
          totalAmount,
          expenses: sortedExpenses,
          sortOrder: data.sortOrder
        };
      })
      .sort((a, b) => b.sortOrder - a.sortOrder);
  };

  if (showNotesCard) {
    return (
      <div className="w-full h-full bg-black text-white flex flex-col justify-between overflow-x-hidden relative select-none">
        
        {/* iOS style Top Navigation Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04] shrink-0 mt-2">
          <button
            type="button"
            onClick={() => setShowNotesCard(false)}
            className="flex items-center gap-1.5 text-white text-[16px] font-medium active:opacity-60 cursor-pointer"
          >
            <ChevronLeft size={22} className="-ml-1" />
            <span>Quay lại</span>
          </button>
          
          <span className="font-sans text-[17px] font-semibold text-white tracking-tight absolute left-1/2 -translate-x-1/2">
            Chi tiêu lớn nhất
          </span>

          <div className="w-16" /> {/* Spacer to balance layout */}
        </div>

        {/* Scrollable Screen Content */}
        <div className="flex-1 flex flex-col gap-5 px-5 pt-5 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] overflow-y-auto">
          {/* TABS */}
          <div className="shrink-0">
            <div className="flex w-full bg-white/[0.06] rounded-xl p-[3px] border border-white/[0.04]">
              <button
                type="button"
                onClick={() => setTopSpendingPeriod("week")}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold tracking-wide transition-all cursor-pointer text-center ${
                  topSpendingPeriod === "week"
                    ? "bg-white text-black shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Tuần
              </button>
              <button
                type="button"
                onClick={() => setTopSpendingPeriod("month")}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold tracking-wide transition-all cursor-pointer text-center ${
                  topSpendingPeriod === "month"
                    ? "bg-white text-black shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Tháng
              </button>
              <button
                type="button"
                onClick={() => setTopSpendingPeriod("year")}
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold tracking-wide transition-all cursor-pointer text-center ${
                  topSpendingPeriod === "year"
                    ? "bg-white text-black shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Năm
              </button>
            </div>
          </div>

          {/* LIST CONTAINER */}
          <div className="flex flex-col gap-2">
            <div className="bg-[#1C1C1E] border border-white/[0.04] rounded-2xl p-2.5 flex flex-col divide-y divide-white/[0.04]">
              {getTopExpenses().length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12 text-gray-500 text-xs">
                  Không có giao dịch nào trong khoảng thời gian này.
                </div>
              ) : (
                getTopExpenses().map((expense, idx) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between py-3.5 px-3 hover:bg-white/[0.02] transition-colors rounded-xl text-left"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="text-gray-500 font-mono text-[11px] w-5 text-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex flex-col min-w-0 ml-0.5">
                        <span className="text-white text-[15px] font-semibold truncate">
                          {expense.title}
                        </span>
                        <span className="text-[11px] text-gray-400 truncate mt-0.5">
                          {formatDateString(expense.date)} {expense.time || ""}
                        </span>
                      </div>
                    </div>
                    <span className="text-red-400 text-[15px] font-bold font-sans shrink-0 pl-2">
                      -{formatVND(expense.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black text-white flex flex-col justify-between overflow-x-hidden relative select-none">
      
      {/* Dynamic slide-down iOS native styling Search bar panel */}
      {showSearch && (
        <div className="absolute top-0 inset-x-0 bg-[#161618] border-b border-white/5 py-3 px-4 z-40 flex items-center gap-2.5 animate-[slideDown_0.22s_ease-out]">
          <div className="flex-1 bg-white/10 rounded-full py-1.5 px-3 flex items-center gap-2">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Title or Category..."
              className="bg-transparent text-white placeholder-gray-500 focus:outline-none text-[16px] w-full font-sans"
              autoFocus
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")}>
                <X size={13} className="text-gray-400 hover:text-white" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
            }}
            className="text-blue-400 text-sm font-medium pr-1 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Primary header list viewport */}
      <div className="flex flex-col flex-1 px-5 pt-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] overflow-y-auto">
        
        {/* TOP STATUS NAVIGATION BAR ROW */}
        <div className="flex items-center justify-between mb-6 relative mt-1 shrink-0">
          {/* Elegant title / quote replacing the profile selector */}
          <div className="flex items-center select-none">
            <span className="font-sans text-base font-semibold text-white tracking-tight">
              Tiết kiệm là TỰ DO
            </span>
          </div>

          {/* Right quick command buttons */}
          <div className="flex items-center gap-2">
            {/* Search toggler */}
            <button
              type="button"
              onClick={() => {
                setShowSearch(true);
                setShowFilterPopover(false);
                setShowNotesCard(false);
              }}
              className="w-10 h-10 bg-[#1C1C1E] active:scale-95 rounded-full flex items-center justify-center border border-white/[0.04] cursor-pointer hover:bg-[#2C2C2E]"
            >
              <Search size={16} className="text-white" />
            </button>

            {/* Time Period panel Toggle */}
            <button
              type="button"
              onClick={() => {
                setShowFilterPopover(!showFilterPopover);
                setShowProfileSelector(false);
                setShowNotesCard(false);
              }}
              className={`w-10 h-10 active:scale-95 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                showFilterPopover || filters.period !== Period.AllTime
                  ? "bg-white border-transparent text-black"
                  : "bg-[#1C1C1E] border-white/[0.04] text-white hover:bg-[#2C2C2E]"
              }`}
            >
              <Clock size={16} />
            </button>

            {/* Notes and Top Spending panel Toggle */}
            <button
              type="button"
              onClick={() => {
                setShowNotesCard(!showNotesCard);
                setShowProfileSelector(false);
                setShowFilterPopover(false);
              }}
              className={`w-10 h-10 active:scale-95 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                showNotesCard
                  ? "bg-white border-transparent text-black"
                  : "bg-[#1C1C1E] border-white/[0.04] text-white hover:bg-[#2C2C2E]"
              }`}
            >
              <FileText size={16} />
            </button>
          </div>

          {/* Interactive filter dropdown list menu */}
          {showFilterPopover && (
            <FilterPopover
              filters={filters}
              onChangeFilters={onChangeFilters}
              onClose={() => setShowFilterPopover(false)}
            />
          )}
        </div>

        {/* LARGE SPENDING SUMMARY CARD */}
        <div className="background-[#1C1C1E] bg-[#1C1C1E] rounded-[32px] px-6 py-6 border border-white/[0.04] flex flex-col shadow-xl shrink-0 select-none">
          <span className="text-[#8E8E93] text-[13px] font-sans font-medium tracking-tight mb-1.5 select-none block unicode-capitalize">
            {filters.period === Period.Today ? "Spent today" :
             filters.period === Period.ThisWeek ? "Spent this week" :
             filters.period === Period.ThisMonth ? "Spent this month" :
             filters.period === Period.ThisYear ? "Spent this year" : "Spent overall"}
          </span>
          <h2 className="text-[44px] font-bold font-display tracking-tight text-white leading-none pr-1 select-all font-sans mb-7">
            {formatVND(filteredSum)}
          </h2>

          {/* MINIMALIST LINE-AXIS BAR CHART */}
          <div className="relative h-32 w-full mt-2 select-none flex items-end">
            
            {/* Horizontal Grid lines and axis markers */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none select-none">
              {axisGridTicks.map((val, idx) => (
                <div key={idx} className="w-full flex items-center justify-between border-b border-white/[0.06] pb-0.5">
                  <div className="w-[83%] h-px" />
                  <span className="text-[10px] text-gray-600 font-sans tracking-tight text-right w-[42px] select-none">
                    {formatAxisNumber(val)}
                  </span>
                </div>
              ))}
            </div>

            {/* Dynamic White Solid Bars Columns */}
            <div className="w-[83%] h-[82%] flex justify-between px-0.5 relative z-10 select-none items-end mb-1">
              {chartValues.map((day, idx) => {
                const heightPercent = chartMaxScale > 0 ? (day.amount / chartMaxScale) * 100 : 0;
                const isHovered = hoveredBarIndex === idx;

                const maxBarWidthClass = 
                  chartValues.length <= 3 ? "max-w-[36px] rounded-t-[7px]" :
                  chartValues.length <= 5 ? "max-w-[26px] rounded-t-[6px]" :
                  chartValues.length <= 7 ? "max-w-[18px] rounded-t-[5px]" : "max-w-[11px] rounded-t-[3px]";

                return (
                  <div
                    key={day.keyId}
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    className="flex flex-col items-center flex-1 h-full justify-end relative cursor-pointer group"
                  >
                    {/* Floating dynamic value annotation */}
                    {isHovered && (
                      <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-[#2C2C2E] border border-white/10 text-white text-[9px] font-medium px-2 py-0.5 rounded-md pointer-events-none whitespace-nowrap z-50 shadow-md flex flex-col items-center">
                        {day.hoverLabel && (
                          <span className="text-gray-400 text-[8px] font-sans">{day.hoverLabel}</span>
                        )}
                        <span className="font-semibold">{formatVND(day.amount)}</span>
                      </div>
                    )}

                    {/* Bar Pillar visual */}
                    <div
                      className={`w-4/5 ${maxBarWidthClass} bg-white transition-all duration-300 ${
                        isHovered ? "opacity-100 scale-x-110 shadow-lg brightness-110" : "opacity-[0.82] hover:opacity-100"
                      }`}
                      style={{ height: day.amount > 0 ? `${Math.max(3, heightPercent)}%` : "0%" }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart bottom labels */}
          <div className="w-[83%] flex justify-between px-0.5 mt-2.5 shrink-0 select-none">
            {chartValues.map((day, idx) => {
              let isCurrent = false;
              if (filters.period === Period.Today || filters.period === Period.ThisWeek) {
                isCurrent = day.dateStr === systemReferenceDateStr;
              } else if (filters.period === Period.ThisMonth) {
                isCurrent = day.label === "13-18"; // Tuesday June 16 is in 13-18 slot
              } else if (filters.period === Period.ThisYear) {
                isCurrent = day.label === "J"; // Jun
              } else {
                isCurrent = day.label === "2026";
              }

              return (
                <span
                  key={day.keyId}
                  className={`text-[9.5px] font-sans font-medium text-center flex-1 block ${
                    isCurrent ? "text-white font-bold" : "text-gray-500"
                  }`}
                >
                  {day.label}
                </span>
              );
            })}
          </div>

        </div>

        {/* LATEST TRANSACTIONS SECTION */}
        <div className="mt-7 flex flex-col flex-1 pb-16">
          <div className="flex items-center justify-between mb-3 select-none shrink-0">
            <span className="text-white text-[17px] font-semibold tracking-tight font-display">
              {searchQuery.trim()
                ? `Results for "${searchQuery}"`
                : filters.category !== "All" || filters.paymentMethod !== "All" || filters.period !== Period.AllTime
                ? `Filtered (${filters.period})`
                : "Latest"}
            </span>


          </div>

          {/* List Wrapper card container */}
          {filteredExpenses.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center flex flex-col items-center justify-center gap-2 select-none">
              <span className="text-gray-400 font-semibold text-sm">No expenses found</span>
              <span className="text-xs text-gray-600 max-w-[200px] leading-relaxed">
                Try adjusting your filter search or click the "+" button to add a new transaction!
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-6 select-none">
              {getGroupedExpenses().map((group) => (
                <div key={group.key} className="flex flex-col gap-2">
                  {/* Subtle heading divider for the time milestone and its total */}
                  <div className="flex items-center justify-between px-1.5 select-none">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider font-sans">
                      {group.title}
                    </span>
                    <span className="text-[11.5px] text-gray-400 font-sans font-bold">
                      {formatVND(group.totalAmount)}
                    </span>
                  </div>

                  <div className="bg-[#1C1C1E] border border-white/[0.04] rounded-2xl p-2.5 flex flex-col divide-y divide-white/[0.04]">
                    {group.expenses.map((expense) => {
                      const hr = getSimulatedHour(expense);
                      const hourStr = expense.time || `${hr.toString().padStart(2, "0")}:00`;
                      return (
                        <button
                          key={expense.id}
                          type="button"
                          onClick={() => onSelectEditExpense(expense)}
                          className="flex items-center justify-between py-3.5 px-3 hover:bg-white/[0.03] transition-colors rounded-xl text-left cursor-pointer group"
                        >
                          {/* Icon label container */}
                          <div className="flex items-center gap-3.5">
                            <div className="flex flex-col">
                              <span className="text-white font-medium text-[15px] group-hover:text-blue-400 transition-colors">
                                {expense.title}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-400">
                                  {hourStr}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Wallet Display Amount */}
                          <div className="text-right flex flex-col items-end">
                            <span className="text-white font-medium font-display text-[15px] pl-1 font-sans">
                              {formatVND(expense.amount)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* FLOATING ACTION ADD BUTTON LAYOUT */}
      {!isAddModalOpen && (
        <div className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom,0px))] right-6 z-50 select-none pointer-events-auto">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="w-14 h-14 bg-white text-black hover:bg-zinc-100 active:scale-90 shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.45)] rounded-full flex items-center justify-center transition-all duration-200 ease-out cursor-pointer outline-none border-none"
            id="floating-add-expense-btn"
          >
            <Plus size={28} className="stroke-[3]" />
          </button>
        </div>
      )}

    </div>
  );
}
