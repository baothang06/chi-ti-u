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

// Format date to "16 Jun 2026"
export const formatDateString = (dateStr: string): string => {
  const date = new Date(dateStr);
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
  const date = new Date(dateStr);
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
  const refDate = new Date(refDateStr);
  const expDate = new Date(expenseDateStr);

  // Set hours to midday/zero for clean date comparisons
  refDate.setHours(0, 0, 0, 0);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = refDate.getTime() - expDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  switch (period) {
    case Period.Today:
      return diffDays === 0;

    case Period.ThisWeek: {
      // Within last 7 days of the reference Tuesday
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
