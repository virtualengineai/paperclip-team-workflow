import { getDashboard, Agent, Issue } from "@/lib/paperclip";

// Prevent static generation — data is fetched at request time
export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500",
  idle: "bg-yellow-500",
  running: "bg-blue-500",
  paused: "bg-gray-500",
  error: "bg-red-500",
  pending_approval: "bg-purple-500",
  terminated: "bg-red-700",
};

const ISSUE_STATUS_COLORS: Record<string, string> = {
  todo: "bg-gray-500",
  in_progress: "bg-blue-500",
  blocked: "bg-red-500",
  done: "bg-green-500",
  in_review: "bg-yellow-500",
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: "!!!!",
  high: "!!!",
  medium: "!!",
  low: "!",
};

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status] || "bg-gray-500"}`}
    />
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const heartbeat = agent.lastHeartbeatAt
    ? new Date(agent.lastHeartbeatAt).toLocaleString()
    : "Never";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 hover:bg-[var(--bg-card-hover)] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-glow)] border border-[var(--accent)]/30 flex items-center justify-center text-lg font-bold text-[var(--accent)]">
            {agent.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text)]">{agent.name}</h3>
            <p className="text-xs text-[var(--text-muted)]">
              {agent.role.toUpperCase()}
              {agent.title ? ` - ${agent.title}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot status={agent.status} />
          <span className="text-xs text-[var(--text-muted)] capitalize">
            {agent.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-[var(--text-muted)]">Adapter</span>
          <p className="text-[var(--text)] font-mono mt-0.5">
            {agent.adapterType}
          </p>
        </div>
        <div>
          <span className="text-[var(--text-muted)]">Last Heartbeat</span>
          <p className="text-[var(--text)] mt-0.5">{heartbeat}</p>
        </div>
        <div>
          <span className="text-[var(--text-muted)]">Budget</span>
          <p className="text-[var(--text)] mt-0.5">
            ${(agent.spentMonthlyCents / 100).toFixed(2)} / $
            {(agent.budgetMonthlyCents / 100).toFixed(2)}
          </p>
        </div>
        <div>
          <span className="text-[var(--text-muted)]">Created</span>
          <p className="text-[var(--text)] mt-0.5">
            {new Date(agent.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function IssueRow({ issue }: { issue: Issue }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors">
      <span
        className={`inline-block w-2 h-2 rounded-full ${ISSUE_STATUS_COLORS[issue.status] || "bg-gray-500"}`}
      />
      <span className="text-xs font-mono text-[var(--accent)] w-20 shrink-0">
        {issue.identifier}
      </span>
      <span className="text-sm text-[var(--text)] truncate flex-1">
        {issue.title}
      </span>
      <span className="text-xs text-[var(--text-muted)] capitalize w-24 text-right">
        {issue.status.replace("_", " ")}
      </span>
      {issue.priority && (
        <span className="text-xs font-mono text-yellow-500 w-10 text-right">
          {PRIORITY_LABELS[issue.priority] || issue.priority}
        </span>
      )}
    </div>
  );
}

export default async function Dashboard() {
  let data;
  try {
    data = await getDashboard();
  } catch (e) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Connection Error</h1>
          <p className="text-[var(--text-muted)]">
            Cannot reach Paperclip API. Check PAPERCLIP_API_URL env var.
          </p>
          <pre className="mt-4 text-xs text-red-400">
            {e instanceof Error ? e.message : String(e)}
          </pre>
        </div>
      </main>
    );
  }

  const { company, agents, issues, health } = data;

  const activeAgents = agents.filter(
    (a: Agent) => a.status !== "terminated"
  ).length;
  const runningAgents = agents.filter(
    (a: Agent) => a.status === "running"
  ).length;
  const blockedIssues = issues.filter(
    (i: Issue) => i.status === "blocked"
  ).length;

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {company.name}
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]">
              {company.issuePrefix}
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Paperclip Workspace Dashboard
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span
            className={`w-2 h-2 rounded-full ${health.status === "ok" ? "bg-green-500" : "bg-red-500"}`}
          />
          v{health.version}
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Agents", value: agents.length },
          { label: "Active", value: activeAgents },
          { label: "Running Now", value: runningAgents },
          { label: "Blocked Issues", value: blockedIssues },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
          >
            <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Agents */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Agents</h2>
        {agents.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">
            No agents registered yet.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent: Agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </section>

      {/* Active Issues */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Active Issues</h2>
        {issues.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">
            No active issues.
          </p>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2">
            {issues.map((issue: Issue) => (
              <IssueRow key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
