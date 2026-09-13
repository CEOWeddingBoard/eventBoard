export interface AnalyticsDashboard {
  budget: {
    total: number;
    spent: number;
    remaining: number;
    percentUsed: number;
    byCategory: { category: string; planned: number; actual: number; count: number }[];
  };
  guests: {
    total: number;
    confirmed: number;
    declined: number;
    pending: number;
    responseRate: number;
    byDietary: { type: string; count: number }[];
    byGroup: { group: string; count: number }[];
  };
  tasks: {
    total: number;
    completed: number;
    overdue: number;
    completionRate: number;
    byCategory: { category: string; total: number; completed: number; rate: number }[];
  };
  timeline: {
    daysToWedding: number;
    totalTasks: number;
    tasksThisWeek: number;
    tasksNextWeek: number;
    tasksOverdue: number;
    criticalCount: number;
  };
  vendors: {
    total: number;
    confirmed: number;
    totalCost: number;
    byCategory: { category: string; count: number; totalCost: number }[];
  };
  summary: {
    planHealth: "good" | "warning" | "critical";
    completionScore: number;
    topActionItem: string | null;
    alerts: string[];
  };
}
