import Link from "next/link";
import type { Metadata } from "next";
import {
  getOpsDashboardData,
  resolveOpsAccess,
  type OpsActivityRow,
  type OpsDashboardData,
  type OpsIssueRow,
} from "@/lib/ops/dashboard";
import { MedusaLogo } from "@/components/MedusaLogo";

export const metadata: Metadata = {
  title: "MEDUSA Ops",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function OpsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const keyValue = params.key;
  const key = typeof keyValue === "string" ? keyValue : Array.isArray(keyValue) ? keyValue[0] : null;
  const access = resolveOpsAccess(key);

  if (access.status !== "ready") {
    return <OpsAccessScreen state={access.status} />;
  }

  const data = await getOpsDashboardData();

  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 flex flex-col gap-6 border-b border-white/8 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-5">
              <MedusaLogo size="sm" />
            </div>
            <p className="text-xs uppercase tracking-[0.28em] text-rose-400">Internal Operations</p>
            <h1
              className="mt-4 text-5xl font-semibold leading-none md:text-6xl"
              style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
            >
              Product memory,
              <br />
              eval quality,
              <br />
              one read.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/50 md:text-base">
              This page is for operating MEDUSA, not using it. It shows whether persistence is active,
              whether real users are generating runs, and where the model is drifting or failing.
            </p>
          </div>
          <div className="grid gap-3 text-[11px] uppercase tracking-[0.22em] text-white/34">
            <span className="rounded-full border border-white/10 px-4 py-3">DB-backed visibility</span>
            <span className="rounded-full border border-white/10 px-4 py-3">Automatic eval scoring</span>
            <span className="rounded-full border border-white/10 px-4 py-3">No raw face photos stored</span>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.metricCards.map((card) => (
            <article
              key={card.label}
              className="rounded-[1.9rem] border border-white/8 bg-white/[0.03] p-6"
            >
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/28">{card.label}</p>
              <p
                className="mt-4 text-5xl font-semibold leading-none text-white"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                {card.value}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/48">{card.detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel
            eyebrow="Recent Product Activity"
            title="Persistence is only useful if the loop is real."
            body="These are the most recent saved analyses, tutorials, and feedback events. If this stays empty after traffic, persistence is not wired correctly."
          >
            <ActivityTable rows={data.recentPersistence} emptyText="No saved product activity yet." />
          </Panel>

          <Panel
            eyebrow="Recent Eval Runs"
            title="Model quality needs a live pulse."
            body="Every face analysis and tutorial generation should leave an eval row. Hard flags show up here immediately."
          >
            <ActivityTable rows={data.recentEvalRuns} emptyText="No eval rows recorded yet." />
          </Panel>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel
            eyebrow="Top Issue Codes"
            title="This is where the model is actually drifting."
            body="Repeated codes are the prompt or contract problems worth fixing first."
          >
            <IssueTable rows={data.topIssues} />
          </Panel>

          <Panel
            eyebrow="Daily Volume"
            title="Traffic and quality should move together."
            body="If eval count and run count drift apart, one side of the instrumentation path is broken."
          >
            <DailyVolumeTable data={data.dailyVolume} />
          </Panel>
        </section>

        <section className="mt-6">
          <Panel
            eyebrow="Look Health"
            title="Some look families usually break first."
            body="Use this to see whether one look is producing disproportionately low scores or failures."
          >
            <LookHealthTable rows={data.lookHealth} />
          </Panel>
        </section>
      </div>
    </main>
  );
}

function OpsAccessScreen({
  state,
}: {
  state: "missing_database" | "missing_key" | "forbidden";
}) {
  const copy = {
    missing_database: {
      eyebrow: "Ops Dashboard Unavailable",
      title: "Postgres is not configured.",
      body: "This route reads directly from the persistence and eval tables. Set DATABASE_URL first, then redeploy.",
    },
    missing_key: {
      eyebrow: "Ops Dashboard Locked",
      title: "Set MEDUSA_OPS_ACCESS_KEY first.",
      body: "This route is intentionally not public. Add MEDUSA_OPS_ACCESS_KEY to the deployment, then open /ops?key=your-value.",
    },
    forbidden: {
      eyebrow: "Ops Dashboard Locked",
      title: "Access key is missing or invalid.",
      body: "Open this route with the configured key in the query string: /ops?key=your-value.",
    },
  }[state];

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050508] px-6 text-white">
      <div className="w-full max-w-3xl rounded-[2.2rem] border border-white/8 bg-white/[0.03] p-8 md:p-10">
        <div className="mb-6">
          <MedusaLogo size="sm" />
        </div>
        <p className="text-xs uppercase tracking-[0.28em] text-rose-400">{copy.eyebrow}</p>
        <h1
          className="mt-5 text-4xl font-semibold leading-tight md:text-5xl"
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
        >
          {copy.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/50">{copy.body}</p>
        <div className="mt-8 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-white/34">
          <Link href="/" className="rounded-full border border-white/10 px-5 py-3 hover:border-white/18 hover:text-white/70">
            Back Home
          </Link>
          <Link href="/app" className="rounded-full border border-white/10 px-5 py-3 hover:border-white/18 hover:text-white/70">
            Open App
          </Link>
        </div>
      </div>
    </main>
  );
}

function Panel({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2.1rem] border border-white/8 bg-white/[0.03] p-6 md:p-7">
      <p className="text-[10px] uppercase tracking-[0.24em] text-rose-300">{eyebrow}</p>
      <h2
        className="mt-4 text-3xl font-semibold leading-none text-white"
        style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
      >
        {title}
      </h2>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/48">{body}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ActivityTable({
  rows,
  emptyText,
}: {
  rows: OpsActivityRow[];
  emptyText: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-white/40">{emptyText}</p>;
  }

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-white/8">
      <div className="grid grid-cols-[168px_minmax(0,1fr)_120px] gap-4 border-b border-white/8 bg-white/[0.03] px-4 py-3 text-[10px] uppercase tracking-[0.22em] text-white/28">
        <span>Type</span>
        <span>Detail</span>
        <span>When</span>
      </div>
      {rows.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-[168px_minmax(0,1fr)_120px] gap-4 border-b border-white/6 px-4 py-4 last:border-b-0"
        >
          <div>
            <p className={toneClass(row.tone)}>{row.label}</p>
            {row.profileId ? (
              <p className="mt-2 truncate text-[11px] uppercase tracking-[0.14em] text-white/22">
                {shortId(row.profileId)}
              </p>
            ) : null}
          </div>
          <p className="text-sm leading-relaxed text-white/62">{row.detail}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-white/32">{formatWhen(row.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}

function IssueTable({ rows }: { rows: OpsIssueRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-white/40">No eval issue rows recorded yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-white/8">
      <div className="grid grid-cols-[minmax(0,1fr)_90px_100px_160px] gap-4 border-b border-white/8 bg-white/[0.03] px-4 py-3 text-[10px] uppercase tracking-[0.22em] text-white/28">
        <span>Issue Code</span>
        <span>Severity</span>
        <span>Count</span>
        <span>Workflow</span>
      </div>
      {rows.map((row) => (
        <div
          key={`${row.code}-${row.severity}`}
          className="grid grid-cols-[minmax(0,1fr)_90px_100px_160px] gap-4 border-b border-white/6 px-4 py-4 last:border-b-0"
        >
          <p className="truncate text-sm text-white/72">{row.code}</p>
          <p className={severityClass(row.severity)}>{row.severity}</p>
          <p className="text-sm text-white/60">{row.count}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-white/34">
            {row.workflows.join(", ")}
          </p>
        </div>
      ))}
    </div>
  );
}

function DailyVolumeTable({ data }: { data: OpsDashboardData["dailyVolume"] }) {
  if (data.length === 0) {
    return <p className="text-sm text-white/40">No daily activity recorded yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-white/8">
      <div className="grid grid-cols-[110px_repeat(4,1fr)] gap-4 border-b border-white/8 bg-white/[0.03] px-4 py-3 text-[10px] uppercase tracking-[0.22em] text-white/28">
        <span>Day</span>
        <span>Analyses</span>
        <span>Tutorials</span>
        <span>Feedback</span>
        <span>Evals</span>
      </div>
      {data.map((row) => (
        <div
          key={row.day}
          className="grid grid-cols-[110px_repeat(4,1fr)] gap-4 border-b border-white/6 px-4 py-4 last:border-b-0"
        >
          <p className="text-sm text-white/68">{row.day}</p>
          <p className="text-sm text-white/58">{row.analyses}</p>
          <p className="text-sm text-white/58">{row.tutorials}</p>
          <p className="text-sm text-white/58">{row.feedback}</p>
          <p className="text-sm text-white/58">{row.evals}</p>
        </div>
      ))}
    </div>
  );
}

function LookHealthTable({ rows }: { rows: OpsDashboardData["lookHealth"] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-white/40">No tutorial eval rows recorded yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-white/8">
      <div className="grid grid-cols-[minmax(0,1fr)_110px_120px_110px] gap-4 border-b border-white/8 bg-white/[0.03] px-4 py-3 text-[10px] uppercase tracking-[0.22em] text-white/28">
        <span>Look</span>
        <span>Runs</span>
        <span>Avg Score</span>
        <span>Failures</span>
      </div>
      {rows.map((row) => (
        <div
          key={row.look}
          className="grid grid-cols-[minmax(0,1fr)_110px_120px_110px] gap-4 border-b border-white/6 px-4 py-4 last:border-b-0"
        >
          <p className="text-sm capitalize text-white/70">{row.look}</p>
          <p className="text-sm text-white/58">{row.runCount}</p>
          <p className="text-sm text-white/58">{row.avgScore ?? "n/a"}</p>
          <p className={`${row.failCount > 0 ? "text-amber-300/90" : "text-white/42"} text-sm`}>
            {row.failCount}
          </p>
        </div>
      ))}
    </div>
  );
}

function toneClass(tone: OpsActivityRow["tone"]) {
  switch (tone) {
    case "rose":
      return "text-[11px] uppercase tracking-[0.18em] text-rose-300";
    case "amber":
      return "text-[11px] uppercase tracking-[0.18em] text-amber-200";
    default:
      return "text-[11px] uppercase tracking-[0.18em] text-white/34";
  }
}

function severityClass(severity: OpsIssueRow["severity"]) {
  switch (severity) {
    case "fail":
      return "text-xs uppercase tracking-[0.16em] text-amber-200";
    case "warn":
      return "text-xs uppercase tracking-[0.16em] text-rose-200";
    case "info":
      return "text-xs uppercase tracking-[0.16em] text-white/42";
  }
}

function formatWhen(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function shortId(value: string) {
  return `${value.slice(0, 8)}...`;
}
