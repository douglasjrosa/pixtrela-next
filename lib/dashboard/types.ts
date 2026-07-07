export interface RankingRow {
  rank: number;
  userDocumentId: string;
  name: string;
  totalIncome: number;
}

export interface CurrencyRanking {
  id: number;
  name: string;
  title: string;
  pluralTitle: string;
  rows: RankingRow[];
}

export interface MonthlyRankingData {
  month: string;
  currencies: CurrencyRanking[];
}

export interface ColaboratorOption {
  documentId: string;
  name: string;
  code: number;
}

export interface DayIncome {
  date: string;
  amount: number;
}

export interface DailyIncomeByCurrency {
  currencyId: number;
  days: DayIncome[];
}

export interface MonthSummary {
  month: string;
  totalIncome: number;
  totalOutcome: number;
  net: number;
}

export interface PreviousMonthsByCurrency {
  currencyId: number;
  months: MonthSummary[];
}

export interface ColaboratorInsightsData {
  colaboratorDocumentId: string;
  month: string;
  dailyIncomeByCurrency: DailyIncomeByCurrency[];
  previousMonthsByCurrency: PreviousMonthsByCurrency[];
}
