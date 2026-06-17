export enum Category {
  Food = "Food",
  Shopping = "Shopping",
  Transport = "Transport",
  Entertainment = "Entertainment",
  Bills = "Bills",
  Other = "Other"
}

export enum PaymentMethod {
  Cash = "Cash",
  Bank = "Bank",
  Card = "Card"
}

export enum Period {
  Today = "Today",
  ThisWeek = "This Week",
  ThisMonth = "This Month",
  ThisYear = "This Year",
  AllTime = "All Time"
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  paymentMethod: PaymentMethod;
  date: string; // ISO String (YYYY-MM-DD)
  time?: string; // "HH:MM" e.g. "10:15"
}

export interface Filters {
  period: Period;
  category: string; // "All" or Category values
  paymentMethod: string; // "All" or PaymentMethod values
}
