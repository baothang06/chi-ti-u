import { Expense, Category, PaymentMethod, Period } from "./types";

// Format currency in the Vietnamese Đồng style: 230.000
export const formatVND = (value: number): string => {
  const formatted = Math.floor(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return formatted;
};

// Format raw number for the Y-axis label: e.g., 300.000
export const formatAxisNumber = (value: number): string => {
  return Math.floor(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Parse "YYYY-MM-DD" local date string robustly without timezone/UTC shift
export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed month
    const day = parseInt(parts[2], 10);
    // Use midday to prevent daylight savings shifts from changing the calendar date
    return new Date(year, month, day, 12, 0, 0, 0);
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return new Date();
  }
  return d;
};

// Format date to "16 Jun 2026"
export const formatDateString = (dateStr: string): string => {
  const date = parseLocalDate(dateStr);
  if (isNaN(date.getTime())) {
    return dateStr;
  }
  const day = date.getDate();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Get day of week abbreviation from ISO date string
export const getDayOfWeek = (dateStr: string): string => {
  const date = parseLocalDate(dateStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
};

// Seed initial expenses to match the user's screenshots exactly
export const seedInitialExpenses = (): Expense[] => {
  const key = "ios_expenses";
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing stored expenses", e);
    }
  }

  // Generate mock expenses matching reference screenshots (June 16, 2026 is a Tuesday)
  // Screenshot shows total ₫230.000 spent today (Tuesday, Jun 16)
  // Transactions: "Đi chơi" ₫200.000, "Ăn trưa" ₫30.000
  // Chart shows Wednesday, Thursday, Friday, Saturday, Sunday, Monday, Tuesday
  // Bars on Wednesday (small), Sunday (very small), Tuesday (large: 230k)
  const initial: Expense[] = [
    {
      id: "1",
      title: "Đi chơi",
      amount: 200000,
      category: Category.Entertainment,
      paymentMethod: PaymentMethod.Card,
      date: "2026-06-16"
    },
    {
      id: "2",
      title: "Ăn trưa",
      amount: 30000,
      category: Category.Food,
      paymentMethod: PaymentMethod.Cash,
      date: "2026-06-16"
    },
    {
      id: "3",
      title: "Ăn tối tối",
      amount: 15000,
      category: Category.Food,
      paymentMethod: PaymentMethod.Cash,
      date: "2026-06-14" // Sunday
    },
    {
      id: "4",
      title: "Trà sữa",
      amount: 45000,
      category: Category.Food,
      paymentMethod: PaymentMethod.Bank,
      date: "2026-06-10" // Wednesday
    }
  ];

  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
};

// Save expenses back to local storage
export const saveExpenses = (expenses: Expense[]): void => {
  localStorage.setItem("ios_expenses", JSON.stringify(expenses));
};

// Check if an expense fits a particular period filter relative to a specific reference date (Default is June 16, 2026)
export const matchesPeriod = (expenseDateStr: string, period: Period, refDateStr: string = "2026-06-16"): boolean => {
  const refDate = parseLocalDate(refDateStr);
  const expDate = parseLocalDate(expenseDateStr);

  // Set hours to midday for clean date comparisons
  refDate.setHours(12, 0, 0, 0);
  expDate.setHours(12, 0, 0, 0);

  const diffTime = refDate.getTime() - expDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  switch (period) {
    case Period.Today:
      return diffDays === 0;

    case Period.ThisWeek: {
      // Within last 7 days of the reference Tue/Today
      return diffDays >= 0 && diffDays < 7;
    }

    case Period.ThisMonth: {
      // Same month and year
      return expDate.getFullYear() === refDate.getFullYear() && expDate.getMonth() === refDate.getMonth();
    }

    case Period.ThisYear: {
      // Same year
      return expDate.getFullYear() === refDate.getFullYear();
    }

    case Period.AllTime:
    default:
      return true;
  }
};

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

