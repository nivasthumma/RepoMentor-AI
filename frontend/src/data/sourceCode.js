const aggregatedSource = `import { DataSource, MetricsRecord } from '../types/metrics';
import { AggregateWriter } from '../db/aggregate-writer';

export class MetricsAggregator {
  private sourceRegistry: DataSource[] = [];
  private writer: AggregateWriter;
  private pollInterval: number;
  private timer: NodeJS.Timeout | null = null;

  constructor(writer: AggregateWriter, pollIntervalMs = 60000) {
    this.writer = writer;
    this.pollInterval = pollIntervalMs;
  }

  registerSource(source: DataSource): void {
    this.sourceRegistry.push(source);
    console.log(\`Registered data source: \${source.getName()}\`);
  }

  start(): void {
    if (this.timer) return;
    console.log('MetricsAggregator started');
    this.poll();
    this.timer = setInterval(() => this.poll(), this.pollInterval);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async poll(): Promise<void> {
    const allRecords: MetricsRecord[] = [];

    for (const source of this.sourceRegistry) {
      try {
        const pipelines = await source.fetchPipelines();
        const tests = await source.fetchTestResults();
        const deploys = await source.fetchDeployments();

        const normalized = this.normalize(source, pipelines, tests, deploys);
        allRecords.push(...normalized);
      } catch (err) {
        console.error(\`Source \${source.getName()} failed: \`, err);
      }
    }

    if (allRecords.length > 0) {
      await this.writer.writeBatch(allRecords);
    }
  }

  private normalize(
    source: DataSource,
    pipelines: any[],
    tests: any[],
    deployments: any[]
  ): MetricsRecord[] {
    const timestamp = new Date();
    const records: MetricsRecord[] = [];

    for (const p of pipelines) {
      records.push({
        source: source.getName(),
        type: 'pipeline',
        value: p.durationMs,
        labels: { status: p.status, branch: p.branch },
        timestamp,
      });
    }

    for (const t of tests) {
      records.push({
        source: source.getName(),
        type: 'test',
        value: t.passRate,
        labels: { total: String(t.total), failed: String(t.failed) },
        timestamp,
      });
    }

    for (const d of deployments) {
      records.push({
        source: source.getName(),
        type: 'deploy',
        value: d.durationMs,
        labels: { environment: d.environment, version: d.version },
        timestamp,
      });
    }

    return records;
}
}`;

const dashboardSource = `import React, { useEffect, useState } from 'react';
import { MetricChart } from './MetricChart';
import { PipelineHealth } from './PipelineHealth';
import { IssueBurndown } from './IssueBurndown';
import { ReviewTurnaround } from './ReviewTurnaround';
import { useMetricsStream } from '../hooks/useMetricsStream';

interface DashboardProps {
  teamId: string;
}

export function Dashboard({ teamId }: DashboardProps) {
  const { metrics, isConnected, error } = useMetricsStream(teamId);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    document.title = 'Dashboard - PulseBoard';
  }, []);

  if (error) {
    return <div className="dashboard-error">Failed to load: {error.message}</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <div className="connection-status">
          <span className={\`status-dot \${isConnected ? 'connected' : 'disconnected'}\`} />
          {isConnected ? 'Live' : 'Reconnecting...'}
        </div>
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)}>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </header>

      <div className="dashboard-grid">
        <MetricChart
          title="Deployment Velocity"
          data={metrics.velocity}
          timeRange={timeRange}
        />
        <PipelineHealth
          data={metrics.pipelineHealth}
        />
        <IssueBurndown
          data={metrics.issueBurndown}
          timeRange={timeRange}
        />
        <ReviewTurnaround
          data={metrics.reviewTurnaround}
        />
      </div>
    </div>
  );
}`;

const restRouterSource = `import { Router } from 'express';
import { z } from 'zod';
import { MetricsController } from '../controllers/metrics-controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';

const router = Router();
const metricsController = new MetricsController();

const dashboardQuerySchema = z.object({
  teamId: z.string().uuid(),
  timeRange: z.enum(['7d', '30d', '90d']).default('30d'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().max(100).default(20),
});

router.get(
  '/api/v1/metrics/dashboard',
  authenticate,
  validate(dashboardQuerySchema),
  async (req, res, next) => {
    try {
      const result = await metricsController.getDashboardMetrics(
        req.teamId,
        req.query.timeRange,
        req.query.page,
        req.query.limit
      );
      res.json({ data: result.data, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/api/v1/health',
  async (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }
);

export default router;`;

const migrationSource = `-- Migration: 003_add_team_filters
-- Description: Adds team-based access control for repository metrics
-- Requires: 002_add_repositories.sql

CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_repositories (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    PRIMARY KEY (team_id, repository_id)
);

CREATE INDEX IF NOT EXISTS idx_team_repositories_team_id ON team_repositories(team_id);
CREATE INDEX IF NOT EXISTS idx_team_repositories_repo_id ON team_repositories(repository_id);

CREATE OR REPLACE VIEW team_metrics AS
SELECT ms.*
FROM metrics_snapshots ms
JOIN repositories r ON r.id = ms.repository_id
JOIN team_repositories tr ON tr.repository_id = r.id
WHERE tr.team_id = current_setting('app.current_team_id')::UUID;`;

const websocketSource = `import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import Redis from 'ioredis';

interface ClientSession {
  ws: WebSocket;
  teamId: string;
  lastPing: number;
}

export class WebSocketPublisher {
  private wss: WebSocketServer;
  private clients: Map<string, ClientSession> = new Map();
  private redis: Redis;
  private heartbeatInterval: NodeJS.Timeout;

  constructor(server: Server, redisUrl: string) {
    this.wss = new WebSocketServer({ server, path: '/ws/metrics' });
    this.redis = new Redis(redisUrl);

    this.wss.on('connection', (ws, req) => {
      const sessionId = crypto.randomUUID();
      const teamId = this.extractTeamId(req.url);
      const session: ClientSession = { ws, teamId, lastPing: Date.now() };
      this.clients.set(sessionId, session);

      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'pong') {
          session.lastPing = Date.now();
        }
      });

      ws.on('close', () => {
        this.clients.delete(sessionId);
      });

      ws.send(JSON.stringify({ type: 'connected', sessionId }));
    });

    this.redis.subscribe('metrics:deltas');
    this.redis.on('message', (_channel, message) => {
      const delta = JSON.parse(message);
      this.broadcast(delta);
    });

    this.heartbeatInterval = setInterval(() => this.checkHealth(), 30000);
  }

  private extractTeamId(url: string): string {
    const params = new URLSearchParams(url.split('?')[1] || '');
    return params.get('teamId') || 'default';
  }

  broadcast(delta: any): void {
    const payload = JSON.stringify({ type: 'delta', data: delta });
    for (const [id, session] of this.clients) {
      if (session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(payload);
      } else {
        this.clients.delete(id);
      }
    }
  }

  private checkHealth(): void {
    const now = Date.now();
    for (const [id, session] of this.clients) {
      if (now - session.lastPing > 60000) {
        session.ws.terminate();
        this.clients.delete(id);
      }
    }
  }

  shutdown(): void {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
    this.redis.unsubscribe();
    this.redis.quit();
  }
}`;

const loginPageSource = `import React, { useState } from 'react';
import { authService } from '../services/authService';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.login(email, password);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="login-loading">Signing in...</div>;
  }

  return (
    <div className="login-page">
      <h1>Sign in to PulseBoard</h1>
      {error && <div className="login-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input aria-label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit" disabled={loading}>Sign in</button>
      </form>
    </div>
  );
}`;

const authServiceSource = `import { client } from '../api/client';

let currentToken = null;
let currentUser = null;

export const authService = {
  async login(email, password) {
    const { token, user } = await client.post('/api/v1/auth/login', { email, password });
    currentToken = token;
    currentUser = user;
    localStorage.setItem('pb_token', token);
    return user;
  },

  logout() {
    currentToken = null;
    currentUser = null;
    localStorage.removeItem('pb_token');
  },

  getToken() {
    return currentToken || localStorage.getItem('pb_token');
  },

  getUser() {
    return currentUser;
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};`;

const authControllerSource = `import { Router } from 'express';
import { authService } from '../services/auth-service';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/api/v1/auth/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.authenticate(email, password);
    res.json({ data: result, meta: {} });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(422).json({ error: 'Validation failed', details: err.errors });
    }
    next(err);
  }
});

router.post('/api/v1/auth/logout', async (_req, res) => {
  res.json({ data: { message: 'Logged out' }, meta: {} });
});

export default router;`;

const dataSourceFormSource = `import React, { useState } from 'react';
import { validateDataSourceInput } from '../utils/validation';
import { dataSourceService } from '../services/dataSourceService';

export function DataSourceForm({ onCreated }) {
  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [token, setToken] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateDataSourceInput({ name, repoUrl, token });
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setSubmitting(true);
    try {
      const source = await dataSourceService.create({ name, repoUrl, token });
      onCreated(source);
      setName('');
      setRepoUrl('');
      setToken('');
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="datasource-form" onSubmit={handleSubmit}>
      <input aria-label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Source name" />
      {errors.name && <span className="field-error">{errors.name}</span>}
      <input aria-label="Repository URL" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/owner/repo" />
      {errors.repoUrl && <span className="field-error">{errors.repoUrl}</span>}
      <input aria-label="Access token" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Access token" />
      {errors.token && <span className="field-error">{errors.token}</span>}
      <button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Add source'}</button>
      {errors.submit && <span className="field-error">{errors.submit}</span>}
    </form>
  );
}`;

export const sourceCode = {
  'src/services/metrics-aggregator.ts': {
    content: aggregatedSource,
    functions: [
      {
        name: 'constructor',
        lines: [6, 9],
        description: 'Initialises the aggregator with a database writer and polling interval.',
        params: 'writer: AggregateWriter — database batch writer; pollIntervalMs: number — polling frequency in milliseconds (default 60000)',
        returns: 'MetricsAggregator instance',
        calls: [],
        calledBy: ['app.ts (bootstrap)'],
        sideEffects: 'Stores references to writer and interval. Does not start polling until start() is called.',
        failures: 'None — constructor only assigns fields.',
        beginnerExplanation: 'This creates the engine that will periodically gather metrics. Think of it like setting up a robot that checks for new data every minute. Pass it the tool to save data (writer) and how often to check (interval).',
        tracePathIndex: null,
        traceStepIndex: null,
        readsDataFrom: [],
        writesUpdates: ['this.writer (reference stored)', 'this.pollInterval (reference stored)'],
        triggers: [],
      },
      {
        name: 'registerSource',
        lines: [11, 14],
        description: 'Registers a new DataSource adapter so the aggregator polls it on each cycle.',
        params: 'source: DataSource — an adapter instance implementing the DataSource interface',
        returns: 'void',
        calls: ['source.getName()'],
        calledBy: ['app.ts (bootstrap)'],
        sideEffects: 'Adds the source to the internal registry array. Logs the registration.',
        failures: 'Does not check for duplicate registrations.',
        beginnerExplanation: 'This tells the aggregator about a new place to get data from, like adding a new channel to a TV. Once registered, the aggregator will automatically fetch data from it every cycle.',
        tracePathIndex: 1,
        traceStepIndex: 2,
        readsDataFrom: ['source.getName() (reads source metadata)'],
        writesUpdates: ['this.sourceRegistry (appends source)'],
        triggers: [],
      },
      {
        name: 'start',
        lines: [16, 21],
        description: 'Begins the polling cycle. Does nothing if already running.',
        params: 'None',
        returns: 'void',
        calls: ['this.poll()', 'setInterval'],
        calledBy: ['app.ts (bootstrap)'],
        sideEffects: 'Sets an interval timer. Logs start message. Triggers immediate first poll.',
        failures: 'Will throw if poll() encounters unhandled errors in sources (though individual source errors are caught internally).',
        beginnerExplanation: 'This turns on the aggregator. It immediately does one check, then checks again every minute. If it is already running, it ignores the start command to avoid double-checking.',
        tracePathIndex: null,
        traceStepIndex: null,
        readsDataFrom: [],
        writesUpdates: ['this.timer (interval handle stored)'],
        triggers: ['this.poll() (first poll triggered immediately)'],
      },
      {
        name: 'stop',
        lines: [23, 28],
        description: 'Stops the polling cycle and clears the timer.',
        params: 'None',
        returns: 'void',
        calls: ['clearInterval'],
        calledBy: ['app.ts (shutdown)'],
        sideEffects: 'Clears the interval timer. Does not disconnect sources or flush pending writes.',
        failures: 'Safe to call even if not running.',
        beginnerExplanation: 'This turns off the aggregator. It stops checking for new data. It is safe to call even if the aggregator was already stopped.',
        tracePathIndex: null,
        traceStepIndex: null,
        readsDataFrom: [],
        writesUpdates: ['this.timer (cleared)'],
        triggers: [],
      },
      {
        name: 'poll (private)',
        lines: [30, 48],
        description: 'Iterates over all registered sources, fetches their data, normalises it, and writes to the database.',
        params: 'None (private)',
        returns: 'Promise<void>',
        calls: ['source.fetchPipelines()', 'source.fetchTestResults()', 'source.fetchDeployments()', 'this.normalize()', 'this.writer.writeBatch()'],
        calledBy: ['this.start()', 'setInterval callback'],
        sideEffects: 'Reads from external APIs via source adapters, writes MetricsRecord batches to the database. Per-source error catching means one failing source does not stop others.',
        failures: 'If writer.writeBatch() throws, the entire batch is lost. If a source adapter throws, its data is skipped but other sources still processed.',
        beginnerExplanation: 'This is the main work function. It asks every registered data source for their latest data, converts it into a standard format, and saves it to the database. If one source has an error, the others still work fine.',
        tracePathIndex: null,
        traceStepIndex: null,
        readsDataFrom: ['this.sourceRegistry (iteration)', 'source.fetchPipelines()', 'source.fetchTestResults()', 'source.fetchDeployments()'],
        writesUpdates: ['allRecords (accumulated)'],
        triggers: ['this.writer.writeBatch() (writes to database)'],
      },
      {
        name: 'normalize (private)',
        lines: [50, 75],
        description: 'Converts raw pipeline, test, and deployment data from a source into uniform MetricsRecord objects.',
        params: 'source: DataSource, pipelines: any[], tests: any[], deployments: any[]',
        returns: 'MetricsRecord[]',
        calls: ['MetricsRecord constructor (implicit)'],
        calledBy: ['this.poll()'],
        sideEffects: 'Creates timestamped MetricsRecord objects. Does not mutate inputs.',
        failures: 'Assumes pipeline/test/deployment objects have required fields. Missing fields produce undefined values in records.',
        beginnerExplanation: 'This takes raw data from different sources (which might have different formats) and converts it into a standard shape that the database understands. Like translating different languages into one common language.',
        tracePathIndex: null,
        traceStepIndex: null,
        readsDataFrom: ['pipelines[]', 'tests[]', 'deployments[]'],
        writesUpdates: ['records[] (built and returned)'],
        triggers: [],
      },
    ],
  },
  'src/components/Dashboard.tsx': {
    content: dashboardSource,
    functions: [
      {
        name: 'Dashboard (component)',
        lines: [11, 35],
        description: 'Main dashboard page component that composes metric visualisation panels and manages the real-time data connection.',
        params: 'props: { teamId: string } — the selected team identifier',
        returns: 'JSX.Element — rendered dashboard layout',
        calls: ['useMetricsStream(teamId)', 'useEffect', 'useState', 'MetricChart', 'PipelineHealth', 'IssueBurndown', 'ReviewTurnaround'],
        calledBy: ['React Router (route handler)'],
        sideEffects: 'Sets document title on mount. Subscribes to WebSocket via useMetricsStream. Passes timeRange down to child charts.',
        failures: 'If teamId is invalid or missing, useMetricsStream may fail to connect, causing the error state to render.',
        beginnerExplanation: 'This is the main page of the application. It creates the layout for all the charts and connects to live data. Think of it as the frame that holds your dashboard together.',
        tracePathIndex: 0,
        traceStepIndex: 8,
        readsDataFrom: ['useMetricsStream(teamId) (subscribes to metrics)'],
        writesUpdates: ['document.title (via useEffect)', 'timeRange (via useState)'],
        triggers: ['MetricChart renders', 'PipelineHealth renders', 'IssueBurndown renders', 'ReviewTurnaround renders'],
      },
    ],
  },
  'src/api/rest-router.ts': {
    content: restRouterSource,
    functions: [
      {
        name: 'GET /api/v1/metrics/dashboard',
        lines: [20, 31],
        description: 'Returns dashboard metrics for a given team, filtered by time range with pagination.',
        params: 'Query: teamId (UUID), timeRange (7d|30d|90d), page (number), limit (number, max 100). Middleware: authenticate, validate(dashboardQuerySchema)',
        returns: 'JSON { data: MetricsDashboard, meta: { page, limit, total } }',
        calls: ['authenticate', 'validate(dashboardQuerySchema)', 'metricsController.getDashboardMetrics()'],
        calledBy: ['Frontend fetch() calls from Dashboard.tsx'],
        sideEffects: 'Reads from database via controller. Attaches team filtering via auth middleware.',
        failures: 'Returns 422 if validation fails (field-level errors). Returns 401 if auth fails. Returns 500 on unexpected controller errors.',
        beginnerExplanation: 'This is an API endpoint. When the frontend needs dashboard data, it calls this URL. The request is checked for valid authentication and correct input format before it fetches data.',
        tracePathIndex: 0,
        traceStepIndex: 3,
        readsDataFrom: ['req.query (request parameters)', 'metricsController.getDashboardMetrics()'],
        writesUpdates: ['res.json (HTTP response)'],
        triggers: ['metricsController.getDashboardMetrics() (triggers backend query)'],
      },
      {
        name: 'GET /api/v1/health',
        lines: [33, 36],
        description: 'Simple health check endpoint to verify the server is running.',
        params: 'None',
        returns: 'JSON { status: "ok", timestamp: ISO string }',
        calls: [],
        calledBy: ['Monitoring/load balancers, health probes'],
        sideEffects: 'None — read-only.',
        failures: 'None.',
        beginnerExplanation: 'A simple check that tells monitoring tools the server is alive. Like a doctor checking a pulse.',
        tracePathIndex: null,
        traceStepIndex: null,
        readsDataFrom: ['new Date() (timestamp)'],
        writesUpdates: ['res.json (HTTP response)'],
        triggers: [],
      },
    ],
  },
  'src/db/migrations/003_add_team_filters.sql': {
    content: migrationSource,
    functions: [
      {
        name: 'CREATE TABLE teams',
        lines: [1, 8],
        description: 'Creates the teams table for organising users into groups with access control.',
        params: 'Columns: id (UUID PK), name (unique), description (optional text), created_at, updated_at',
        returns: 'Table definition',
        calls: [],
        calledBy: ['knex migrate:up'],
        sideEffects: 'Creates a new database table. Uses IF NOT EXISTS to be idempotent.',
        failures: 'Fails if a table constraint is violated (e.g., duplicate name).',
        beginnerExplanation: 'This SQL command creates a table to store teams. Each team has a unique name and a description. It uses IF NOT EXISTS so it is safe to run multiple times.',
        tracePathIndex: null,
        traceStepIndex: null,
        readsDataFrom: [],
        writesUpdates: ['Database: teams table (created)'],
        triggers: [],
      },
      {
        name: 'CREATE TABLE team_repositories',
        lines: [10, 15],
        description: 'Creates a many-to-many join table linking teams to repositories with role-based access.',
        params: 'Columns: team_id (UUID FK), repository_id (UUID FK), role (string, default "viewer"). Composite primary key.',
        returns: 'Table definition',
        calls: [],
        calledBy: ['knex migrate:up'],
        sideEffects: 'Creates a join table with foreign key constraints and indexes. CASCADE deletes ensure referential integrity.',
        failures: 'Fails if referenced team or repository does not exist. Fails on duplicate (team_id, repository_id) pairs.',
        beginnerExplanation: 'This creates a link table that connects teams to repositories. A team can have many repositories and a repository can belong to many teams. It also tracks what each team can do (view, edit, admin).',
        tracePathIndex: null,
        traceStepIndex: null,
        readsDataFrom: [],
        writesUpdates: ['Database: team_repositories table (created)', 'Indexes: created on team_id and repository_id'],
        triggers: [],
      },
      {
        name: 'CREATE VIEW team_metrics',
        lines: [21, 26],
        description: 'Creates a database view that automatically filters metrics based on the current team context.',
        params: 'Uses current_setting(app.current_team_id) session variable for filtering.',
        returns: 'View definition (queryable as a table)',
        calls: ['current_setting() (PostgreSQL function)'],
        calledBy: ['Application queries via knex query builder'],
        sideEffects: 'Creates a logical view. No data is stored.',
        failures: 'Fails if app.current_team_id is not set in the session context.',
        beginnerExplanation: 'This creates a smart filter that automatically shows only the data for the current team. It is like putting on special glasses that let you see only what belongs to your group.',
        tracePathIndex: null,
        traceStepIndex: null,
        readsDataFrom: ['metrics_snapshots table', 'repositories table', 'team_repositories table'],
        writesUpdates: ['Database: team_metrics view (created/replaced)'],
        triggers: [],
      },
    ],
  },
'src/services/websocket-publisher.ts': {
    content: websocketSource,
    functions: [
      {
        name: 'constructor',
        lines: [10, 37],
        description: 'Sets up the WebSocket server, Redis pub/sub, and heartbeat monitoring.',
        params: 'server: Server (HTTP server instance), redisUrl: string (Redis connection string)',
        returns: 'WebSocketPublisher instance',
        calls: ['WebSocketServer constructor', 'new Redis(redisUrl)', 'crypto.randomUUID()', 'this.extractTeamId()', 'this.broadcast()', 'this.checkHealth()', 'setInterval'],
        calledBy: ['app.ts (bootstrap)'],
        sideEffects: 'Creates a WebSocket server on /ws/metrics. Subscribes to Redis channel metrics:deltas. Starts heartbeat interval. Handles WebSocket lifecycle (connection, message, close).',
        failures: 'If Redis connection fails, the publisher still starts but broadcasts will not be distributed across instances.',
        beginnerExplanation: 'This sets up the real-time communication system. It creates a channel where the server can push live updates to all connected dashboards. It also monitors that connections are still alive.',
        tracePathIndex: 0,
        traceStepIndex: 9,
        readsDataFrom: [],
        writesUpdates: ['this.wss (WebSocket server stored)', 'this.clients (Map of client sessions)', 'this.redis (Redis client stored)', 'this.heartbeatInterval (timer stored)'],
        triggers: ['setInterval(checkHealth) (periodic health checks triggered)'],
      },
      {
        name: 'broadcast',
        lines: [44, 52],
        description: 'Sends a metric delta payload to every connected WebSocket client.',
        params: 'delta: any — the metric delta object to broadcast',
        returns: 'void',
        calls: ['JSON.stringify', 'session.ws.send()'],
        calledBy: ['Redis message handler (on message callback)', 'Direct calls from backend services'],
        sideEffects: 'Iterates over all client connections. Disconnected clients are removed from the map. Message is serialised only once.',
        failures: 'If ws.send() throws for a particular client, that client is removed. Other clients still receive the broadcast.',
        beginnerExplanation: 'This sends new data to every dashboard that is currently open. When the aggregator finishes collecting data, this function pushes updates to all users in real-time.',
        tracePathIndex: 0,
        traceStepIndex: 9,
        readsDataFrom: ['this.clients (iterate all sessions)'],
        writesUpdates: ['this.clients (removes stale connections)'],
        triggers: ['session.ws.send() (triggers message event on each client)'],
      },
      {
        name: 'checkHealth (private)',
        lines: [54, 61],
        description: 'Terminates clients that have not sent a pong response within 60 seconds.',
        params: 'None (private)',
        returns: 'void',
        calls: ['session.ws.terminate()', 'this.clients.delete()'],
        calledBy: ['this.heartbeatInterval (setInterval callback)'],
        sideEffects: 'Disconnects stale clients. Prevents memory leaks from zombie connections.',
        failures: 'None — terminate() is safe even if already disconnected.',
        beginnerExplanation: 'This is a cleanup function that checks if any dashboards have gone offline. If a dashboard has not responded for more than a minute, it is disconnected to free up resources.',
        tracePathIndex: null,
        traceStepIndex: null,
        readsDataFrom: ['this.clients (iterate and check lastPing)'],
        writesUpdates: ['this.clients (removes stale sessions)'],
        triggers: ['session.ws.terminate() (triggers connection close)'],
      },
      {
        name: 'shutdown',
        lines: [63, 67],
        description: 'Gracefully shuts down the WebSocket server, Redis connections, and heartbeat timer.',
        params: 'None',
        returns: 'void',
        calls: ['clearInterval', 'this.wss.close()', 'this.redis.unsubscribe()', 'this.redis.quit()'],
        calledBy: ['app.ts (graceful shutdown)'],
        sideEffects: 'Disconnects all clients, unsubscribes from Redis, closes Redis connection. Should be called on server shutdown.',
        failures: 'If Redis is already closed, quit() may throw. Wrap in try/catch in production.',
        beginnerExplanation: 'This cleans up everything when the server is shutting down. It safely disconnects all dashboards and closes the Redis connection.',
        tracePathIndex: null,
        traceStepIndex: null,
        readsDataFrom: [],
        writesUpdates: ['this.heartbeatInterval (cleared)', 'this.wss (closed)', 'this.redis (unsubscribed and quit)'],
        triggers: ['this.wss.close() (triggers close on all connected clients)'],
      },
    ],
  },
  'src/pages/LoginPage.tsx': {
    content: loginPageSource,
    functions: [
      {
        name: 'LoginPage (component)',
        lines: [3, 30],
        description: 'Renders the sign-in form and delegates authentication to authService.',
        params: 'None (route component)',
        returns: 'JSX.Element — the login page',
        calls: ['authService.login(email, password)'],
        calledBy: ['React Router (default route)'],
        sideEffects: 'On success, navigates to /dashboard. Stores the session token via authService. Shows inline errors on failure.',
        failures: 'If the API returns an error message it is displayed in the login-error element.',
        beginnerExplanation: 'This is the sign-in screen. It collects your email and password, sends them to the server via authService, then takes you to the dashboard if it works.',
        tracePathIndex: 0,
        traceStepIndex: 0,
        readsDataFrom: ['email input', 'password input'],
        writesUpdates: ['local state: email, password, error, loading'],
        triggers: ['authService.login() (triggers auth request)'],
      },
    ],
  },
  'src/services/authService.ts': {
    content: authServiceSource,
    functions: [
      {
        name: 'login',
        lines: [7, 14],
        description: 'Authenticates a user and stores the session token.',
        params: 'email: string, password: string',
        returns: 'Promise<User> — the authenticated user',
        calls: ['client.post()'],
        calledBy: ['LoginPage (component)'],
        sideEffects: 'Stores the token in memory and localStorage. Sets the current user.',
        failures: 'Throws if the API returns an error (e.g., invalid credentials).',
        beginnerExplanation: 'This sends your email and password to the server. If they are correct, it saves your login token so you stay signed in.',
        tracePathIndex: 0,
        traceStepIndex: 1,
        readsDataFrom: ['email', 'password'],
        writesUpdates: ['currentToken', 'currentUser', 'localStorage pb_token'],
        triggers: ['client.post() (triggers /api/v1/auth/login)'],
      },
      {
        name: 'logout',
        lines: [16, 19],
        description: 'Clears the session and token.',
        params: 'None',
        returns: 'void',
        calls: [],
        calledBy: ['SettingsPanel (component)'],
        sideEffects: 'Removes the token from memory and localStorage. Clears the current user.',
        failures: 'None.',
        beginnerExplanation: 'This signs you out by deleting the saved token.',
        tracePathIndex: null,
        traceStepIndex: null,
        readsDataFrom: [],
        writesUpdates: ['currentToken (cleared)', 'currentUser (cleared)', 'localStorage pb_token (removed)'],
        triggers: [],
      },
    ],
  },
  'src/controllers/auth-controller.ts': {
    content: authControllerSource,
    functions: [
      {
        name: 'POST /api/v1/auth/login',
        lines: [13, 21],
        description: 'Authenticates a user and issues a session token.',
        params: 'Body: { email, password }. Validated with loginSchema.',
        returns: 'JSON { data: { token, user }, meta: {} }',
        calls: ['loginSchema.parse()', 'authService.authenticate()'],
        calledBy: ['Frontend authService via api/client.ts'],
        sideEffects: 'Issues a session token. On validation failure returns 422 with field details.',
        failures: 'Returns 422 for Zod validation errors; delegates other errors to middleware.',
        beginnerExplanation: 'This is the server endpoint that checks your credentials. If they are valid, it gives you a token that proves you are signed in.',
        tracePathIndex: 0,
        traceStepIndex: 4,
        readsDataFrom: ['req.body (email, password)'],
        writesUpdates: ['res.json (HTTP response with token)'],
        triggers: ['authService.authenticate() (triggers credential check)'],
      },
    ],
  },
  'src/components/DataSourceForm.tsx': {
    content: dataSourceFormSource,
    functions: [
      {
        name: 'DataSourceForm (component)',
        lines: [3, 41],
        description: 'Collects and validates new data source details before creating the source.',
        params: 'props: { onCreated: (source) => void }',
        returns: 'JSX.Element — the data source creation form',
        calls: ['validateDataSourceInput()', 'dataSourceService.create()'],
        calledBy: ['DashboardPage (component)'],
        sideEffects: 'Calls dataSourceService.create() on valid submission. Sets field-level errors on validation failure.',
        failures: 'Shows inline field errors when validation fails. Shows a submit error if the API rejects.',
        beginnerExplanation: 'This form collects the name, repository URL, and access token for a new metric source, checks they are valid, and creates the source.',
        tracePathIndex: 1,
        traceStepIndex: 0,
        readsDataFrom: ['name input', 'repoUrl input', 'token input'],
        writesUpdates: ['local state: name, repoUrl, token, errors, submitting'],
        triggers: ['dataSourceService.create() (triggers source creation)'],
      },
    ],
  },
};