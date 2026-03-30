const API_URL = process.env.PAPERCLIP_API_URL || "http://127.0.0.1:3100";
const API_KEY = process.env.PAPERCLIP_API_KEY || "";
const COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID || "";

async function apiFetch(path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  adapterType: string;
  adapterConfig: Record<string, unknown>;
  budgetMonthlyCents: number;
  spentMonthlyCents: number;
  lastHeartbeatAt: string | null;
  createdAt: string;
  urlKey: string;
  icon: string | null;
  title: string | null;
  reportsTo: string | null;
}

export interface Company {
  id: string;
  name: string;
  issuePrefix: string;
  status: string;
  budgetMonthlyCents: number;
  spentMonthlyCents: number;
  issueCounter: number;
  createdAt: string;
}

export interface Issue {
  id: string;
  identifier: string;
  title: string;
  status: string;
  priority: string;
  assigneeAgentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  company: Company;
  agents: Agent[];
  issues: Issue[];
  health: { status: string; version: string };
}

export async function getDashboard(): Promise<DashboardData> {
  const [health, agents, issues] = await Promise.all([
    apiFetch("/api/health"),
    apiFetch(`/api/companies/${COMPANY_ID}/agents`),
    apiFetch(
      `/api/companies/${COMPANY_ID}/issues?status=todo,in_progress,blocked&limit=20`
    ),
  ]);

  // Company info from the agents endpoint or separate call
  let company: Company;
  try {
    company = await apiFetch(`/api/companies/${COMPANY_ID}`);
  } catch {
    company = {
      id: COMPANY_ID,
      name: "Unknown",
      issuePrefix: "?",
      status: "active",
      budgetMonthlyCents: 0,
      spentMonthlyCents: 0,
      issueCounter: 0,
      createdAt: new Date().toISOString(),
    };
  }

  return { company, agents, issues, health };
}
