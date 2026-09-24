export const pulseboardData = {
  name: 'PulseBoard',
  purpose:
    'PulseBoard is a real-time team analytics dashboard that aggregates data from CI/CD pipelines, issue trackers, and code review tools into one unified view, helping engineering teams monitor delivery health, identify bottlenecks, and track deployment velocity across multiple repositories.',

  technologies: [
    'React 18',
    'TypeScript',
    'Node.js',
    'Express',
    'PostgreSQL',
    'Redis',
    'Docker',
    'GitHub Actions',
  ],

  repoHealth: {
    architectureStyle:
      'Layered monolith with a clear frontend/API/backend/data separation. Frontend talks only to the API layer; the backend coordinates aggregation, auth, and data access.',
    primaryTechnologies: ['React 18 + TypeScript', 'Express + Zod', 'Passport.js', 'PostgreSQL + knex.js', 'Redis + ioredis', 'WebSocket (ws)'],
    majorModules: ['dashboard', 'authentication', 'data-sources', 'team-filters', 'real-time-publisher'],
    apiSurface: [
      'GET /api/v1/metrics/dashboard',
      'GET /api/v1/datasources',
      'POST /api/v1/datasources',
      'POST /api/v1/auth/login',
      'POST /api/v1/auth/logout',
      'GET /api/v1/health',
      'WS /ws/metrics',
    ],
    dataLayer: 'PostgreSQL via knex.js. Migrations under src/db/migrations. Team filtering enforced in the team_metrics view.',
    testCoverageAreas: [
      'metrics-aggregator: normalisation and per-source error isolation',
      'Dashboard: rendering, error state, and responsive layout',
      'rest-router: route registration and validation responses',
      'auth-service: login flow and team-context propagation',
      'data-source-service: CRUD and registry integration',
    ],
  },

  importantFiles: [
    {
      path: 'src/services/metrics-aggregator.ts',
      reason:
        'Central orchestration point that collects, normalizes, and persists metrics from every external data source.',
      role: 'Service-layer orchestration and data pipeline entry point',
      explanation:
        'This file is the central orchestrator that collects raw metrics from CI/CD, issues, and review data sources, normalizes them into a unified schema, and writes aggregated results to the database. It uses a plugin-based architecture where each data source implements a common DataSource interface, making it straightforward to add new integrations without modifying the core pipeline.',
      directDependencies: ['src/types/metrics.ts', 'src/db/aggregate-writer.ts'],
      relatedFiles: ['src/services/data-source.ts', 'src/services/github-adapter.ts', 'src/services/gitlab-adapter.ts'],
      connectedLayers: ['Backend'],
      purpose: 'Central data aggregation and normalization pipeline',
      importance: 'Critical — the brain of the entire application',
    },
    {
      path: 'src/components/Dashboard.tsx',
      reason:
        'Primary React component that renders the main analytics view consumed by every user.',
      role: 'Top-level UI component and main entry point for frontend features',
      explanation:
        'Dashboard.tsx composes all major visualization panels — velocity chart, pipeline health, issue burndown, and review turnaround — into a single scrollable page. It subscribes to a real-time WebSocket stream so that metric updates appear without a manual refresh. Layout and individual panels are delegated to child components, keeping each unit testable in isolation.',
      directDependencies: [
        'src/components/MetricChart.tsx',
        'src/components/PipelineHealth.tsx',
        'src/hooks/useMetricsStream.ts',
      ],
      relatedFiles: ['src/components/IssueBurndown.tsx', 'src/components/ReviewTurnaround.tsx', 'src/pages/DashboardPage.tsx'],
      connectedLayers: ['Frontend'],
      purpose: 'Main dashboard user interface',
      importance: 'High — primary user-facing component',
    },
    {
      path: 'src/api/rest-router.ts',
      reason:
        'Defines every REST endpoint the frontend consumes and wires request handling to service modules.',
      role: 'HTTP routing and request dispatch layer',
      explanation:
        'This Express router maps URL paths and HTTP methods to the appropriate controller functions. It validates request parameters with Zod schemas before they reach business logic, returns consistent JSON envelopes, and attaches request-scoped context (logging, rate-limit headers) via middleware. Every new frontend feature that needs a server endpoint starts by adding a route here.',
      directDependencies: ['src/controllers/metrics-controller.ts', 'src/middleware/validate.ts'],
      relatedFiles: ['src/api/ws-router.ts', 'src/api/health-check.ts', 'src/middleware/auth.ts'],
      connectedLayers: ['APIs'],
      purpose: 'API endpoint definitions and request dispatch',
      importance: 'High — single entry point for all API traffic',
    },
    {
      path: 'src/pages/LoginPage.tsx',
      reason:
        'Entry point for authentication. Users sign in with GitHub OAuth before accessing the dashboard.',
      role: 'Frontend authentication page',
      explanation:
        'LoginPage renders the sign-in form and delegates authentication to src/services/authService.ts. On success it stores the returned session token and redirects to the dashboard. It shows an inline error state when authentication fails, and a loading state while the request is in flight.',
      directDependencies: ['src/services/authService.ts', 'src/types/user.ts'],
      relatedFiles: ['src/api/client.ts', 'src/components/Dashboard.tsx', 'src/middleware/auth.ts'],
      connectedLayers: ['Frontend'],
      purpose: 'User sign-in flow',
      importance: 'High — first interaction every user hits',
    },
    {
      path: 'src/services/authService.ts',
      reason:
        'Frontend service that encapsulates the authentication API calls and token handling.',
      role: 'Frontend authentication service',
      explanation:
        'authService exposes login() and logout() which call the API client. It stores the session token, exposes the current user, and attaches the token to outgoing requests. Callers like LoginPage depend on it so the auth transport details stay contained in one place.',
      directDependencies: ['src/api/client.ts', 'src/types/user.ts'],
      relatedFiles: ['src/pages/LoginPage.tsx', 'src/controllers/auth-controller.ts', 'src/middleware/auth.ts'],
      connectedLayers: ['Frontend'],
      purpose: 'Authentication API wrapper and token management',
      importance: 'Medium — reusable across all frontend pages',
    },
    {
      path: 'src/controllers/auth-controller.ts',
      reason:
        'Backend controller that turns authentication requests into service calls and session responses.',
      role: 'Backend authentication controller',
      explanation:
        'auth-controller receives the login request, delegates to src/services/auth-service.ts, and returns a session token plus the authenticated user. The /api/v1/auth routes are exposed here and are consumed by the frontend authService.',
      directDependencies: ['src/services/auth-service.ts', 'src/db/repositories/user-repository.ts'],
      relatedFiles: ['src/api/rest-router.ts', 'src/middleware/auth.ts', 'src/config/auth.ts'],
      connectedLayers: ['APIs', 'Backend'],
      purpose: 'Handles authentication request lifecycle',
      importance: 'Medium — core to the sign-in flow',
    },
    {
      path: 'src/components/DataSourceForm.tsx',
      reason:
        'Primary form for creating new CI/CD metric sources from the dashboard.',
      role: 'Frontend data source creation form',
      explanation:
        'DataSourceForm collects the provider name, repository URL, and access token. It validates input client-side with src/utils/validation.ts before submitting to the API via src/services/dataSourceService.ts. Inline field-level errors are shown without a full page reload.',
      directDependencies: ['src/utils/validation.ts', 'src/services/dataSourceService.ts'],
      relatedFiles: ['src/pages/DashboardPage.tsx', 'src/services/dashboardService.ts', 'src/controllers/data-source-controller.ts'],
      connectedLayers: ['Frontend'],
      purpose: 'Create and validate new data sources',
      importance: 'Medium — supports onboarding new integrations',
    },
    {
      path: 'src/db/migrations/003_add_team_filters.sql',
      reason:
        'Latest schema migration that introduced team-based filtering, a foundational access-control feature.',
      role: 'Database schema evolution and team-filtering foundation',
      explanation:
        'This migration adds a teams table and a many-to-many relationship between teams and repositories. All subsequent queries for dashboard metrics filter by the requesting user team memberships, ensuring developers only see data for repositories their team owns. The migration is written to be idempotent and includes a down migration for safe rollbacks.',
      directDependencies: ['src/db/migrations/002_add_repositories.sql'],
      relatedFiles: ['src/db/query-builder.ts', 'src/controllers/teams-controller.ts'],
      connectedLayers: ['Database'],
      purpose: 'Team-based access control schema',
      importance: 'Medium — foundational for multi-team support',
    },
    {
      path: 'src/services/websocket-publisher.ts',
      reason:
        'Real-time data push mechanism that eliminates polling and keeps the dashboard live.',
      role: 'WebSocket broadcast service for live metric updates',
      explanation:
        'This service maintains a pool of connected WebSocket clients and publishes incremental metric deltas as they arrive from the aggregator. It uses Redis pub/sub to horizontally scale across multiple server instances so that any backend process can broadcast to all connected frontend sessions without coupling. Client reconnection and back-pressure handling are built into the connection lifecycle.',
      directDependencies: ['src/services/metrics-aggregator.ts', 'src/config/redis.ts'],
      relatedFiles: ['src/api/ws-router.ts', 'src/hooks/useMetricsStream.ts'],
      connectedLayers: ['Services'],
      purpose: 'Real-time metrics broadcast via WebSocket',
      importance: 'High — enables live dashboard updates',
    },
  ],

  dependencies: [
    { name: 'React Router', role: 'Client-side navigation between dashboard views, settings, and admin pages.' },
    { name: 'Recharts', role: 'Composable charting library for velocity, burndown, and pipeline-health visualisations.' },
    { name: 'Zod', role: 'Runtime schema validation for API request parameters and environment configuration.' },
    { name: 'ioredis', role: 'Robust Redis client used for pub/sub messaging across WebSocket publisher instances.' },
    { name: 'knex.js', role: 'SQL query builder used for database access with migration management.' },
    { name: 'Passport.js', role: 'Authentication middleware supporting GitHub OAuth and personal-access-token strategies.' },
  ],

  hierarchy: {
    name: 'PulseBoard',
    type: 'folder',
    children: [
      {
        name: 'src',
        type: 'folder',
        children: [
          {
            name: 'pages',
            type: 'folder',
            children: [
              { name: 'LoginPage.tsx', type: 'file' },
              { name: 'DashboardPage.tsx', type: 'file' },
              { name: 'SettingsPage.tsx', type: 'file' },
            ],
          },
          {
            name: 'components',
            type: 'folder',
            children: [
              { name: 'Dashboard.tsx', type: 'file' },
              { name: 'MetricChart.tsx', type: 'file' },
              { name: 'PipelineHealth.tsx', type: 'file' },
              { name: 'IssueBurndown.tsx', type: 'file' },
              { name: 'ReviewTurnaround.tsx', type: 'file' },
              { name: 'TeamFilter.tsx', type: 'file' },
              { name: 'SettingsPanel.tsx', type: 'file' },
              { name: 'DataSourceForm.tsx', type: 'file' },
            ],
          },
          {
            name: 'forms',
            type: 'folder',
            children: [
              { name: 'DataSourceForm.tsx', type: 'file' },
            ],
          },
          {
            name: 'hooks',
            type: 'folder',
            children: [
              { name: 'useMetricsStream.ts', type: 'file' },
              { name: 'useTeamFilter.ts', type: 'file' },
            ],
          },
          {
            name: 'services',
            type: 'folder',
            children: [
              { name: 'authService.ts', type: 'file' },
              { name: 'dashboardService.ts', type: 'file' },
              { name: 'dataSourceService.ts', type: 'file' },
              { name: 'metrics-aggregator.ts', type: 'file' },
              { name: 'websocket-publisher.ts', type: 'file' },
              { name: 'data-source.ts', type: 'file' },
              { name: 'github-adapter.ts', type: 'file' },
              { name: 'gitlab-adapter.ts', type: 'file' },
              { name: 'auth-service.ts', type: 'file' },
              { name: 'data-source-service.ts', type: 'file' },
            ],
          },
          {
            name: 'api',
            type: 'folder',
            children: [
              { name: 'client.ts', type: 'file' },
              { name: 'rest-router.ts', type: 'file' },
              { name: 'ws-router.ts', type: 'file' },
              { name: 'health-check.ts', type: 'file' },
            ],
          },
          {
            name: 'controllers',
            type: 'folder',
            children: [
              { name: 'metrics-controller.ts', type: 'file' },
              { name: 'repositories-controller.ts', type: 'file' },
              { name: 'teams-controller.ts', type: 'file' },
              { name: 'auth-controller.ts', type: 'file' },
              { name: 'data-source-controller.ts', type: 'file' },
            ],
          },
          {
            name: 'db',
            type: 'folder',
            children: [
              { name: 'aggregate-writer.ts', type: 'file' },
              { name: 'query-builder.ts', type: 'file' },
              {
                name: 'repositories',
                type: 'folder',
                children: [
                  { name: 'user-repository.ts', type: 'file' },
                  { name: 'data-source-repository.ts', type: 'file' },
                ],
              },
              {
                name: 'migrations',
                type: 'folder',
                children: [
                  { name: '001_initial.sql', type: 'file' },
                  { name: '002_add_repositories.sql', type: 'file' },
                  { name: '003_add_team_filters.sql', type: 'file' },
                ],
              },
            ],
          },
          {
            name: 'utils',
            type: 'folder',
            children: [
              { name: 'validation.ts', type: 'file' },
            ],
          },
          {
            name: 'types',
            type: 'folder',
            children: [
              { name: 'metrics.ts', type: 'file' },
              { name: 'repository.ts', type: 'file' },
              { name: 'team.ts', type: 'file' },
              { name: 'user.ts', type: 'file' },
              { name: 'datasource.ts', type: 'file' },
            ],
          },
          {
            name: 'config',
            type: 'folder',
            children: [
              { name: 'redis.ts', type: 'file' },
              { name: 'database.ts', type: 'file' },
              { name: 'auth.ts', type: 'file' },
            ],
          },
          {
            name: 'middleware',
            type: 'folder',
            children: [
              { name: 'validate.ts', type: 'file' },
              { name: 'auth.ts', type: 'file' },
              { name: 'rate-limit.ts', type: 'file' },
            ],
          },
          { name: 'index.ts', type: 'file' },
          { name: 'app.ts', type: 'file' },
        ],
      },
      {
        name: 'tests',
        type: 'folder',
        children: [
          { name: 'metrics-aggregator.test.ts', type: 'file' },
          { name: 'Dashboard.test.tsx', type: 'file' },
          { name: 'rest-router.test.ts', type: 'file' },
          { name: 'authService.test.ts', type: 'file' },
          { name: 'dataSourceService.test.ts', type: 'file' },
          { name: 'auth-controller.test.ts', type: 'file' },
        ],
      },
      {
        name: 'docker-compose.yml',
        type: 'file',
      },
      {
        name: 'Dockerfile',
        type: 'file',
      },
      {
        name: 'package.json',
        type: 'file',
      },
      {
        name: 'tsconfig.json',
        type: 'file',
      },
    ],
  },

  architecture: {
    layers: [
      {
        id: 'frontend',
        label: 'Frontend',
        purpose:
          'React-based single-page application that renders real-time dashboards, charts, and team-filtering controls. Communicates with the backend via REST and WebSocket.',
        associatedFiles: [
          'src/pages/LoginPage.tsx',
          'src/pages/DashboardPage.tsx',
          'src/components/Dashboard.tsx',
          'src/components/DataSourceForm.tsx',
          'src/services/authService.ts',
          'src/services/dashboardService.ts',
          'src/api/client.ts',
          'src/hooks/useMetricsStream.ts',
        ],
      },
      {
        id: 'apis',
        label: 'APIs',
        purpose:
          'Express-based REST API layer that validates requests, dispatches to controllers, and returns consistent JSON responses. Also manages WebSocket upgrade and routing.',
        associatedFiles: ['src/api/rest-router.ts', 'src/api/ws-router.ts', 'src/middleware/validate.ts'],
      },
      {
        id: 'backend',
        label: 'Backend',
        purpose:
          'Business-logic and service layer that orchestrates metric aggregation, auth, data-source management, and coordinates between the API and data layers.',
        associatedFiles: [
          'src/services/metrics-aggregator.ts',
          'src/controllers/auth-controller.ts',
          'src/controllers/data-source-controller.ts',
          'src/controllers/metrics-controller.ts',
          'src/services/auth-service.ts',
          'src/services/data-source-service.ts',
          'src/services/data-source.ts',
        ],
      },
      {
        id: 'services',
        label: 'Services',
        purpose:
          'Infrastructure services including WebSocket broadcast, Redis pub/sub, and external-source adapters that run as background processes.',
        associatedFiles: [
          'src/services/websocket-publisher.ts',
          'src/services/github-adapter.ts',
          'src/services/gitlab-adapter.ts',
        ],
      },
      {
        id: 'database',
        label: 'Database',
        purpose:
          'PostgreSQL schema managed via knex migrations, storing repositories, teams, metrics snapshots, and user preferences.',
        associatedFiles: [
          'src/db/aggregate-writer.ts',
          'src/db/query-builder.ts',
          'src/db/repositories/user-repository.ts',
          'src/db/repositories/data-source-repository.ts',
          'src/db/migrations/003_add_team_filters.sql',
        ],
      },
    ],
    relationships: [
      { from: 'frontend', to: 'apis', label: 'fetches data via REST and subscribes via WebSocket', dataFlow: 'HTTP requests and WebSocket subscriptions flow from the Frontend to the APIs layer. The frontend sends GET/POST requests for dashboard, auth, and data-source endpoints and opens a WebSocket connection for real-time metric deltas.' },
      { from: 'apis', to: 'backend', label: 'delegates business logic to services', dataFlow: 'The API layer forwards validated requests to backend controllers. Controllers orchestrate business logic: auth-controller calls auth-service, metrics-controller checks the aggregator, and data-source-controller manages integration metadata.' },
      { from: 'backend', to: 'database', label: 'reads and writes metric and configuration data', dataFlow: 'Backend services use knex.js query builders and repositories to persist aggregated metrics, teams, and data-source configuration to PostgreSQL. Read queries are filtered by team membership for data isolation.' },
      { from: 'backend', to: 'services', label: 'publishes metric deltas to WebSocket publisher', dataFlow: 'After the metrics-aggregator completes a batch write, the backend publishes the delta to the WebSocket publisher service, which broadcasts it to all connected frontend clients via Redis pub/sub.' },
      { from: 'services', to: 'backend', label: 'delivers external-source data via adapter interface', dataFlow: 'Service-layer adapters (GitHub, GitLab) implement the DataSource interface and feed raw CI/CD, issue, and review data into the metrics-aggregator in the backend layer.' },
    ],
  },

  curatedAnswers: [
    {
      prompt: 'How does this project work?',
      answer:
        'PulseBoard is a full-stack analytics dashboard. The frontend React application renders dashboards and charts that connect to an Express API layer. The API delegates business logic to service modules — the central metrics-aggregator collects data from CI/CD and issue-tracking sources, normalises it, and writes it to a PostgreSQL database. A WebSocket publisher pushes live metric deltas to connected dashboard sessions so updates appear in real time without page refreshes. The system is containerised with Docker and uses Redis for horizontal scaling of the pub/sub layer.',
      references: [
        'src/services/metrics-aggregator.ts',
        'src/components/Dashboard.tsx',
        'src/services/websocket-publisher.ts',
        'src/api/rest-router.ts',
      ],
    },
    {
      prompt: 'Where does authentication happen?',
      answer:
        'Authentication starts on the frontend: LoginPage.tsx calls authService.ts, which posts to /api/v1/auth/login via the API client (src/api/client.ts). On the server, the route is handled by src/controllers/auth-controller.ts, which delegates to src/services/auth-service.ts and loads the user from src/db/repositories/user-repository.ts. Every subsequent request passes through the Passport.js middleware in src/middleware/auth.ts, which attaches the authenticated user and team memberships to the request context.',
      references: [
        'src/pages/LoginPage.tsx',
        'src/services/authService.ts',
        'src/controllers/auth-controller.ts',
        'src/middleware/auth.ts',
      ],
    },
    {
      prompt: 'What should I understand first?',
      answer:
        'Start with the metrics-aggregator at src/services/metrics-aggregator.ts — it is the brain of the application. It defines a DataSource interface that any external service adapter implements, collects raw data from all connected sources, normalises it, and writes the result to the database. Once you understand the aggregation pipeline, explore the Dashboard.tsx component to see how the frontend consumes that data, then trace the API routes in rest-router.ts to understand how requests flow between frontend and backend.',
      references: [
        'src/services/metrics-aggregator.ts',
        'src/components/Dashboard.tsx',
        'src/api/rest-router.ts',
        'src/types/metrics.ts',
      ],
    },
  ],

  contextualAnswers: {
    'src/services/metrics-aggregator.ts': [
      {
        prompt: 'What calls this file?',
        answer: {
          summary: 'The metrics-aggregator is called by the backend controllers and the WebSocket publisher. It is the central hub of the data pipeline.',
          codePath: 'APIs Layer → src/controllers/metrics-controller.ts → src/services/metrics-aggregator.ts → src/db/aggregate-writer.ts',
          relatedFiles: ['src/controllers/metrics-controller.ts', 'src/services/websocket-publisher.ts', 'src/services/data-source.ts'],
          impact: 'Modifying this file affects the entire data pipeline — from data ingestion through to database writes and real-time broadcasts. Changes here impact all downstream consumers including the Dashboard and WebSocket clients.',
        },
      },
      {
        prompt: 'What does this file call?',
        answer: {
          summary: 'This file delegates data persistence to the aggregate-writer and relies on type definitions from the shared types module.',
          codePath: 'src/services/metrics-aggregator.ts → src/db/aggregate-writer.ts (writes data) | src/types/metrics.ts (type contracts)',
          relatedFiles: ['src/db/aggregate-writer.ts', 'src/types/metrics.ts'],
          impact: 'Any change to the aggregate-writer interface or MetricsRecord type will require corresponding updates in this file.',
        },
      },
      {
        prompt: 'What happens before this?',
        answer: {
          summary: 'Before the aggregator runs, external-source adapters (GitHub, GitLab) fetch raw data from their respective APIs and normalise it into the DataSource interface contract.',
          codePath: 'src/services/github-adapter.ts → DataSource interface → src/services/metrics-aggregator.ts',
          relatedFiles: ['src/services/github-adapter.ts', 'src/services/gitlab-adapter.ts', 'src/services/data-source.ts'],
          impact: 'Adapters that break or change their output format directly affect the ability of the aggregator to process data.',
        },
      },
      {
        prompt: 'What happens after this?',
        answer: {
          summary: 'After aggregation, data is written to the database via aggregate-writer, and deltas are broadcast to connected dashboard clients via the WebSocket publisher.',
          codePath: 'src/services/metrics-aggregator.ts → src/db/aggregate-writer.ts (persist) | src/services/websocket-publisher.ts (broadcast) → src/components/Dashboard.tsx (display)',
          relatedFiles: ['src/db/aggregate-writer.ts', 'src/services/websocket-publisher.ts', 'src/components/Dashboard.tsx'],
          impact: 'If this file stops producing output, the database stops receiving updates and dashboards go stale.',
        },
      },
      {
        prompt: 'What could break if I modify this?',
        answer: {
          summary: 'Modifying the metrics-aggregator could break the data pipeline, cause dashboard staleness, or introduce data corruption if the normalisation logic changes.',
          codePath: 'Affected chain: aggregator → aggregate-writer → database queries → API responses → Dashboard visualizations',
          relatedFiles: ['src/db/aggregate-writer.ts', 'src/services/websocket-publisher.ts', 'src/controllers/metrics-controller.ts', 'src/components/Dashboard.tsx'],
          impact: 'High risk. Changes to the core aggregation logic ripple through the entire system. Ensure comprehensive test coverage in metrics-aggregator.test.ts and validate against all adapter outputs.',
        },
      },
    ],
    'src/components/Dashboard.tsx': [
      {
        prompt: 'What calls this file?',
        answer: {
          summary: 'Dashboard.tsx is rendered by the DashboardPage at src/pages/DashboardPage.tsx.',
          codePath: 'src/pages/DashboardPage.tsx → src/components/Dashboard.tsx → child chart components',
          relatedFiles: ['src/pages/DashboardPage.tsx', 'src/components/MetricChart.tsx', 'src/components/PipelineHealth.tsx'],
          impact: 'Changes here affect the primary user-facing view of the application. All users see this page after signing in.',
        },
      },
      {
        prompt: 'What does this file call?',
        answer: {
          summary: 'Dashboard composes chart components and subscribes to real-time data via the useMetricsStream hook.',
          codePath: 'src/components/Dashboard.tsx → src/components/MetricChart.tsx | src/components/PipelineHealth.tsx | src/hooks/useMetricsStream.ts',
          relatedFiles: ['src/components/MetricChart.tsx', 'src/components/PipelineHealth.tsx', 'src/hooks/useMetricsStream.ts'],
          impact: 'Modifying the Dashboard layout or data props may require updates to child chart components.',
        },
      },
      {
        prompt: 'What could break if I modify this?',
        answer: {
          summary: 'Modifying Dashboard.tsx could break the main user interface — charts may not render correctly, WebSocket connection might fail, or layout could degrade.',
          codePath: 'Dashboard → MetricsChart/PipelineHealth/IssueBurndown/ReviewTurnaround',
          relatedFiles: ['src/components/MetricChart.tsx', 'src/components/PipelineHealth.tsx', 'src/hooks/useMetricsStream.ts'],
          impact: 'Medium risk. The Dashboard is a composition layer; changes are mostly isolated to UI layout. The WebSocket hook handles its own reconnection logic.',
        },
      },
    ],
    'src/api/rest-router.ts': [
      {
        prompt: 'What calls this file?',
        answer: {
          summary: 'The Express application bootstraps the REST router at startup. The frontend calls these endpoints via the API client.',
          codePath: 'src/app.ts → src/api/rest-router.ts → controllers (auth, datasource, metrics)',
          relatedFiles: ['src/app.ts', 'src/middleware/auth.ts', 'src/middleware/validate.ts'],
          impact: 'Every frontend request passes through this router. Breaking it takes down the entire API surface.',
        },
      },
      {
        prompt: 'What does this file call?',
        answer: {
          summary: 'The router delegates to controller functions after passing through validation and auth middleware.',
          codePath: 'src/api/rest-router.ts → src/middleware/validate.ts → controllers',
          relatedFiles: ['src/controllers/metrics-controller.ts', 'src/controllers/auth-controller.ts', 'src/middleware/validate.ts'],
          impact: 'Adding new routes requires new controller methods. Removing routes breaks frontend functionality.',
        },
      },
      {
        prompt: 'What could break if I modify this?',
        answer: {
          summary: 'Changes to the router could break the API contract — existing endpoints may return different shapes, validation could fail, or routes could become unreachable.',
          codePath: 'Frontend → src/api/rest-router.ts → controllers → services',
          relatedFiles: ['src/controllers/metrics-controller.ts', 'src/middleware/validate.ts', 'src/middleware/rate-limit.ts'],
          impact: 'High risk. The router is the contract between frontend and backend. Coordinate changes with frontend API calls and update test files in rest-router.test.ts.',
        },
      },
    ],
    'src/pages/LoginPage.tsx': [
      {
        prompt: 'What calls this file?',
        answer: {
          summary: 'LoginPage is the initial route of the application, rendered before authentication.',
          codePath: 'React Router → src/pages/LoginPage.tsx → src/services/authService.ts',
          relatedFiles: ['src/services/authService.ts', 'src/components/Dashboard.tsx'],
          impact: 'Changes here affect the sign-in experience for every new visitor.',
        },
      },
      {
        prompt: 'What does this file call?',
        answer: {
          summary: 'LoginPage calls authService to authenticate, then redirects to the dashboard on success.',
          codePath: 'src/pages/LoginPage.tsx → src/services/authService.ts → src/api/client.ts',
          relatedFiles: ['src/services/authService.ts', 'src/api/client.ts'],
          impact: 'The auth transport details live behind authService, so UI changes here are generally isolated.',
        },
      },
    ],
    'src/services/authService.ts': [
      {
        prompt: 'What calls this file?',
        answer: {
          summary: 'authService is called by pages that need the current user or session, primarily LoginPage.',
          codePath: 'src/pages/LoginPage.tsx → src/services/authService.ts → src/api/client.ts',
          relatedFiles: ['src/pages/LoginPage.tsx', 'src/api/client.ts'],
          impact: 'If the token handling breaks, users can no longer log in or stay authenticated.',
        },
      },
      {
        prompt: 'What could break if I modify this?',
        answer: {
          summary: 'Modifying authService could break login, token persistence, or request authorisation headers across the whole frontend.',
          codePath: 'authService → api/client.ts → all authenticated requests',
          relatedFiles: ['src/api/client.ts', 'src/pages/LoginPage.tsx'],
          impact: 'High risk. Test the full sign-in flow and verify tokens are attached to every authenticated request.',
        },
      },
    ],
    'src/controllers/auth-controller.ts': [
      {
        prompt: 'What calls this file?',
        answer: {
          summary: 'auth-controller is invoked by the REST router for the /api/v1/auth routes.',
          codePath: 'src/api/rest-router.ts → src/controllers/auth-controller.ts → src/services/auth-service.ts',
          relatedFiles: ['src/api/rest-router.ts', 'src/services/auth-service.ts'],
          impact: 'Changes here directly affect the login and logout API contract.',
        },
      },
      {
        prompt: 'What happens after this?',
        answer: {
          summary: 'After the controller authenticates the user, subsequent requests carry the session via the auth middleware so controllers and queries know who is calling.',
          codePath: 'auth-controller → auth-service → user-repository → session issued → middleware/auth.ts guards future requests',
          relatedFiles: ['src/services/auth-service.ts', 'src/db/repositories/user-repository.ts', 'src/middleware/auth.ts'],
          impact: 'If the session shape changes, the middleware and all downstream controllers must be updated.',
        },
      },
    ],
    'src/components/DataSourceForm.tsx': [
      {
        prompt: 'What calls this file?',
        answer: {
          summary: 'DataSourceForm is opened from the dashboard page when a user adds a new metric source.',
          codePath: 'src/pages/DashboardPage.tsx → src/components/DataSourceForm.tsx → src/services/dataSourceService.ts',
          relatedFiles: ['src/pages/DashboardPage.tsx', 'src/services/dataSourceService.ts'],
          impact: 'Changes affect the data-source creation flow and its inline validation.',
        },
      },
      {
        prompt: 'What could break if I modify this?',
        answer: {
          summary: 'Modifying the form could break validation, token capture, or the create request sent to the API.',
          codePath: 'DataSourceForm → validation.ts → dataSourceService.ts → POST /api/v1/datasources',
          relatedFiles: ['src/utils/validation.ts', 'src/services/dataSourceService.ts', 'src/controllers/data-source-controller.ts'],
          impact: 'Medium risk. Verify both client-side validation and the resulting API request.',
        },
      },
    ],
    'src/db/migrations/003_add_team_filters.sql': [
      {
        prompt: 'What could break if I modify this?',
        answer: {
          summary: 'Modifying this migration could break team-based access control, cause migration ordering issues, or lead to inconsistent database state.',
          codePath: 'knex migrate:up → 003_add_team_filters.sql → src/db/query-builder.ts (team-filtered queries)',
          relatedFiles: ['src/db/migrations/002_add_repositories.sql', 'src/db/query-builder.ts', 'src/controllers/teams-controller.ts'],
          impact: 'Very high risk. Database migrations are designed to be immutable once applied. Create a new migration instead of modifying existing ones.',
        },
      },
    ],
    'src/services/websocket-publisher.ts': [
      {
        prompt: 'What calls this file?',
        answer: {
          summary: 'The backend layer publishes metric deltas to the WebSocket publisher after each aggregation cycle.',
          codePath: 'src/services/metrics-aggregator.ts → src/services/websocket-publisher.ts → Redis pub/sub → connected clients',
          relatedFiles: ['src/services/metrics-aggregator.ts', 'src/config/redis.ts', 'src/hooks/useMetricsStream.ts'],
          impact: 'If this file breaks, real-time updates stop and dashboards become static.',
        },
      },
      {
        prompt: 'What could break if I modify this?',
        answer: {
          summary: 'Modifying the publisher could break WebSocket connections, cause message format mismatches, or introduce memory leaks from unmanaged client connections.',
          codePath: 'aggregator → websocket-publisher → Redis pub/sub → useMetricsStream hook → Dashboard',
          relatedFiles: ['src/services/metrics-aggregator.ts', 'src/config/redis.ts', 'src/hooks/useMetricsStream.ts', 'src/components/Dashboard.tsx'],
          impact: 'High risk. Client reconnection and back-pressure handling are critical. Test under load to ensure memory and connection lifecycle are correct.',
        },
      },
    ],
  },

  traceCodePaths: [
    {
      name: 'Login to Dashboard Flow',
      description: 'Trace how a user signs in, loads the dashboard, and sees real-time metrics.',
      steps: [
        {
          file: 'src/pages/LoginPage.tsx',
          layer: 'frontend',
          explanation: 'User opens the app and lands on LoginPage. It captures credentials and submits them to authService.',
          detail: 'LoginPage renders the sign-in form, tracks local form state, and calls authService.login(). On success it stores the session and navigates to the dashboard route.',
        },
        {
          file: 'src/services/authService.ts',
          layer: 'frontend',
          explanation: 'authService wraps the login API call and token storage.',
          detail: 'authService.login() posts to /api/v1/auth/login via the API client, stores the returned JWT, and exposes the current user to the rest of the app.',
        },
        {
          file: 'src/api/client.ts',
          layer: 'frontend',
          explanation: 'The API client sends the HTTP request and attaches the session token.',
          detail: 'client.ts is a thin fetch wrapper used by all frontend services. It sets the Content-Type header, attaches the Authorization bearer token when present, and normalises error responses.',
        },
        {
          file: 'src/api/rest-router.ts',
          layer: 'apis',
          explanation: 'The request hits the REST router, which routes it to the auth controller.',
          detail: 'POST /api/v1/auth/login is registered here. The route applies the validation middleware before delegating to auth-controller.',
        },
        {
          file: 'src/controllers/auth-controller.ts',
          layer: 'backend',
          explanation: 'The controller handles the login request and returns a session token.',
          detail: 'auth-controller validates the payload, calls auth-service to verify credentials, and responds with { token, user } in the standard envelope.',
        },
        {
          file: 'src/services/auth-service.ts',
          layer: 'backend',
          explanation: 'auth-service verifies credentials and loads the user from the repository.',
          detail: 'auth-service checks the password hash (or GitHub OAuth code) and fetches the user record via user-repository, attaching team memberships.',
        },
        {
          file: 'src/db/repositories/user-repository.ts',
          layer: 'database',
          explanation: 'The repository reads the user row and team memberships from PostgreSQL.',
          detail: 'user-repository uses the knex query builder to fetch a user by email and their team memberships, returning a domain User object.',
        },
        {
          file: 'src/pages/DashboardPage.tsx',
          layer: 'frontend',
          explanation: 'After login the user is redirected here, which composes the Dashboard and real-time stream.',
          detail: 'DashboardPage loads the initial metric snapshot via dashboardService and passes it into Dashboard.tsx, which subscribes to live deltas.',
        },
        {
          file: 'src/components/Dashboard.tsx',
          layer: 'frontend',
          explanation: 'Dashboard renders the analytics panels using live data.',
          detail: 'Dashboard composes MetricChart, PipelineHealth, IssueBurndown, and ReviewTurnaround, feeding each its slice of metrics from useMetricsStream.',
        },
        {
          file: 'src/services/websocket-publisher.ts',
          layer: 'services',
          explanation: 'Live metric deltas are broadcast to the connected dashboard session.',
          detail: 'After each aggregation cycle the publisher sends the delta through Redis pub/sub so all connected clients update in real time via useMetricsStream.',
        },
      ],
    },
    {
      name: 'Add a Data Source Flow',
      description: 'Trace how a developer adds a new CI/CD integration from the dashboard form through to persistence.',
      steps: [
        {
          file: 'src/components/DataSourceForm.tsx',
          layer: 'frontend',
          explanation: 'The developer fills in the new source name, repository URL, and access token.',
          detail: 'DataSourceForm validates fields with src/utils/validation.ts and shows inline errors before submitting.',
        },
        {
          file: 'src/services/dataSourceService.ts',
          layer: 'frontend',
          explanation: 'dataSourceService submits the validated payload to the API.',
          detail: 'It calls POST /api/v1/datasources via the API client and returns the created source so the UI can update the list.',
        },
        {
          file: 'src/api/rest-router.ts',
          layer: 'apis',
          explanation: 'The router passes the request through validation to the data-source controller.',
          detail: 'The route validates the body with a Zod schema and forwards to data-source-controller.',
        },
        {
          file: 'src/controllers/data-source-controller.ts',
          layer: 'backend',
          explanation: 'The controller orchestrates creation and returns the persisted source.',
          detail: 'It delegates to data-source-service, which validates provider type and registers the source in the aggregator registry.',
        },
        {
          file: 'src/services/data-source-service.ts',
          layer: 'backend',
          explanation: 'data-source-service handles domain logic for source creation.',
          detail: 'It writes the source metadata to the database via data-source-repository and registers an adapter in the aggregator so the new source starts being polled.',
        },
        {
          file: 'src/db/repositories/data-source-repository.ts',
          layer: 'database',
          explanation: 'The repository persists the new data source row.',
          detail: 'It inserts into the data_sources table and returns the created record for the controller response.',
        },
      ],
    },
  ],

  fileExplanations: {
    'src/services/metrics-aggregator.ts':
      'The metrics-aggregator is the central data pipeline. It maintains a registry of DataSource adapters (one per external service), polls them on a configurable interval, normalises each data point into a common MetricsRecord shape, and writes batches to the database via aggregate-writer. Error handling is per-source so a single failing adapter never blocks the entire pipeline.',
    'src/components/Dashboard.tsx':
      'Dashboard.tsx is the main page component. It uses the useMetricsStream hook to open a WebSocket connection, receives metric deltas, and distributes them to child chart components. Layout is CSS Grid with responsive breakpoints. Each panel — velocity, pipeline health, issue burndown, review turnaround — is an independent component that receives its slice of data via props.',
    'src/api/rest-router.ts':
      'The REST router registers every API endpoint under /api/v1. Each route definition includes a Zod schema for input validation, a controller function reference, and an optional middleware chain. The router returns a 422 status with field-level error details when validation fails, and a consistent { data, meta } envelope on success.',
    'src/pages/LoginPage.tsx':
      'LoginPage is the authentication entry point. It renders the sign-in form, collects credentials, and calls authService.login(). On success it stores the session and redirects to the dashboard; on failure it shows an inline error.',
    'src/services/authService.ts':
      'authService is the frontend wrapper around the auth API. It exposes login() and logout(), persists the session token, exposes the current user, and attaches the Authorization header to requests through the API client.',
    'src/controllers/auth-controller.ts':
      'auth-controller handles the /api/v1/auth routes. It validates the request payload, delegates to auth-service for credential verification and user loading, and returns a { token, user } session response in the standard envelope.',
    'src/components/DataSourceForm.tsx':
      'DataSourceForm collects provider name, repository URL, and access token for a new metric source. It validates input client-side using src/utils/validation.ts and submits via dataSourceService.create() with inline field-level error feedback.',
    'src/db/migrations/003_add_team_filters.sql':
      'This migration creates the teams and team_repositories tables. It is designed to be run with knex migrate:up and includes a corresponding down migration. The migration checks for existing tables before creating them to remain idempotent in CI/CD pipelines.',
    'src/services/websocket-publisher.ts':
      'The WebSocket publisher maintains a Map of client connections keyed by session ID. When the metrics-aggregator finishes a batch, the publisher serialises only the delta (changed metrics since last publish) and sends it to every connected client. The Redis pub/sub integration allows any backend instance to broadcast without knowing which instance owns which client.',
  },

  onboardingSteps: [
    {
      title: 'Project Purpose',
      content:
        'PulseBoard helps engineering teams monitor delivery health by aggregating data from CI/CD, issue trackers, and code review tools into one real-time dashboard. Its goal is to surface bottlenecks, track deployment velocity, and give every team member a shared view of project status without switching between multiple tools.',
    },
    {
      title: 'Project Structure',
      content:
        'The repository follows a layered layout: frontend pages live in src/pages, React components in src/components, frontend services and API wrappers in src/services and src/api, backend controllers and services in src/controllers and src/services, and the data layer in src/db with migrations and repositories. Shared types live in src/types and infrastructure config in src/config.',
    },
    {
      title: 'Architecture Overview',
      content:
        'PulseBoard has five architectural layers: Frontend (React SPA), APIs (Express REST + WebSocket), Backend (business-logic services and controllers), Services (infrastructure adapters and pub/sub), and Database (PostgreSQL with knex migrations). The frontend communicates with the API layer only; the backend orchestrates business logic and coordinates between APIs, services, and the database.',
    },
    {
      title: 'Important Files',
      content:
        'A few files are especially worth understanding first: metrics-aggregator.ts (the central pipeline), Dashboard.tsx (the main UI), LoginPage.tsx and authService.ts (the auth flow), rest-router.ts (API endpoint definitions), and websocket-publisher.ts (real-time data push). Each file includes an explanation and lists its direct dependencies so you can trace how data flows through the system.',
    },
    {
      title: 'Your First Contribution',
      content:
        'A great place to start is adding a new CI/CD metric source by implementing the DataSource interface defined in src/services/data-source.ts. The interface is small and well-documented, and the metrics-aggregator automatically picks up any registered source. The Your First Contribution section below has the full details, including the specific file to edit and the first action to take.',
    },
  ],

  firstContribution: {
    areaName: 'Add a new CI/CD metric source adapter',
    rationale:
      'The DataSource interface in src/services/data-source.ts is narrow (three methods), has existing adapters as reference implementations, and does not require changes to any other part of the system. Implementing a new adapter for a service like CircleCI or Jenkins is self-contained and gives you a broad understanding of the aggregation pipeline without needing to modify the frontend, API, or database layers.',
    relevantPath: 'src/services/data-source.ts',
    firstAction:
      'Create a new file src/services/circleci-adapter.ts that exports a class implementing the DataSource interface. Follow the patterns in github-adapter.ts: implement fetchPipelines(), fetchTestResults(), and fetchDeployments(). Register the new adapter in metrics-aggregator.ts by adding it to the source registry.',
    whyGoodFirstContribution: 'Self-contained change that touches only one interface and one new file. You learn the core data pipeline without modifying existing code. Existing adapters serve as clear reference implementations.',
    difficulty: 'Intermediate',
    prerequisites: ['TypeScript interfaces', 'Async/await patterns', 'Basic understanding of CI/CD pipelines'],
  },

  dependencyRelationships: [
    { from: 'src/services/metrics-aggregator.ts', to: 'src/types/metrics.ts', type: 'imports', description: 'Imports MetricsRecord and DataSource type definitions' },
    { from: 'src/services/metrics-aggregator.ts', to: 'src/db/aggregate-writer.ts', type: 'imports', description: 'Imports AggregateWriter for persisting metric batches' },
    { from: 'src/services/websocket-publisher.ts', to: 'src/services/metrics-aggregator.ts', type: 'depends-on', description: 'Publishes deltas produced by the aggregator' },
    { from: 'src/services/websocket-publisher.ts', to: 'src/config/redis.ts', type: 'imports', description: 'Uses Redis config for pub/sub connections' },
    { from: 'src/services/websocket-publisher.ts', to: 'src/api/ws-router.ts', type: 'related', description: 'Shares the WebSocket upgrade path' },
    { from: 'src/components/Dashboard.tsx', to: 'src/components/MetricChart.tsx', type: 'imports', description: 'Renders the velocity chart panel' },
    { from: 'src/components/Dashboard.tsx', to: 'src/components/PipelineHealth.tsx', type: 'imports', description: 'Renders the pipeline health panel' },
    { from: 'src/components/Dashboard.tsx', to: 'src/components/IssueBurndown.tsx', type: 'imports', description: 'Renders the issue burndown chart' },
    { from: 'src/components/Dashboard.tsx', to: 'src/components/ReviewTurnaround.tsx', type: 'imports', description: 'Renders the review turnaround panel' },
    { from: 'src/components/Dashboard.tsx', to: 'src/hooks/useMetricsStream.ts', type: 'imports', description: 'Subscribes to real-time WebSocket metrics' },
    { from: 'src/components/Dashboard.tsx', to: 'src/services/dashboardService.ts', type: 'indirect', description: 'Consumes data fetched by the dashboard service' },
    { from: 'src/pages/DashboardPage.tsx', to: 'src/components/Dashboard.tsx', type: 'imports', description: 'Renders the Dashboard component' },
    { from: 'src/pages/DashboardPage.tsx', to: 'src/services/dashboardService.ts', type: 'imports', description: 'Loads the initial metric snapshot' },
    { from: 'src/pages/LoginPage.tsx', to: 'src/services/authService.ts', type: 'imports', description: 'Delegates authentication' },
    { from: 'src/services/authService.ts', to: 'src/api/client.ts', type: 'imports', description: 'Sends HTTP requests and attaches the session token' },
    { from: 'src/services/dashboardService.ts', to: 'src/api/client.ts', type: 'imports', description: 'Fetches dashboard metrics over REST' },
    { from: 'src/services/dataSourceService.ts', to: 'src/api/client.ts', type: 'imports', description: 'Submits data-source creation requests' },
    { from: 'src/components/DataSourceForm.tsx', to: 'src/utils/validation.ts', type: 'imports', description: 'Validates form fields client-side' },
    { from: 'src/components/DataSourceForm.tsx', to: 'src/services/dataSourceService.ts', type: 'imports', description: 'Submits the new data source' },
    { from: 'src/hooks/useMetricsStream.ts', to: 'src/api/ws-router.ts', type: 'depends-on', description: 'Opens the WebSocket connection via ws-router' },
    { from: 'src/hooks/useMetricsStream.ts', to: 'src/services/websocket-publisher.ts', type: 'indirect', description: 'Consumes broadcasts from the publisher' },
    { from: 'src/api/rest-router.ts', to: 'src/controllers/metrics-controller.ts', type: 'imports', description: 'Routes dashboard requests to the controller' },
    { from: 'src/api/rest-router.ts', to: 'src/controllers/auth-controller.ts', type: 'imports', description: 'Routes auth requests to the controller' },
    { from: 'src/api/rest-router.ts', to: 'src/controllers/data-source-controller.ts', type: 'imports', description: 'Routes data-source requests to the controller' },
    { from: 'src/api/rest-router.ts', to: 'src/middleware/validate.ts', type: 'imports', description: 'Validates request parameters with Zod schemas' },
    { from: 'src/api/rest-router.ts', to: 'src/middleware/auth.ts', type: 'imports', description: 'Authenticates requests via Passport.js' },
    { from: 'src/controllers/auth-controller.ts', to: 'src/services/auth-service.ts', type: 'imports', description: 'Verifies credentials and loads the user' },
    { from: 'src/controllers/auth-controller.ts', to: 'src/db/repositories/user-repository.ts', type: 'depends-on', description: 'Reads user and team data' },
    { from: 'src/services/auth-service.ts', to: 'src/db/repositories/user-repository.ts', type: 'imports', description: 'Loads users and team memberships' },
    { from: 'src/controllers/data-source-controller.ts', to: 'src/services/data-source-service.ts', type: 'imports', description: 'Creates and lists data sources' },
    { from: 'src/services/data-source-service.ts', to: 'src/db/repositories/data-source-repository.ts', type: 'imports', description: 'Persists data-source metadata' },
    { from: 'src/controllers/metrics-controller.ts', to: 'src/services/metrics-aggregator.ts', type: 'depends-on', description: 'Calls the aggregator for processed data' },
    { from: 'src/controllers/metrics-controller.ts', to: 'src/db/query-builder.ts', type: 'depends-on', description: 'Builds team-filtered database queries' },
    { from: 'src/db/repositories/user-repository.ts', to: 'src/db/query-builder.ts', type: 'imports', description: 'Builds SQL queries for users and teams' },
    { from: 'src/services/github-adapter.ts', to: 'src/services/data-source.ts', type: 'imports', description: 'Implements DataSource for GitHub Actions' },
    { from: 'src/services/gitlab-adapter.ts', to: 'src/services/data-source.ts', type: 'imports', description: 'Implements DataSource for GitLab CI' },
    { from: 'src/db/migrations/002_add_repositories.sql', to: 'src/db/migrations/003_add_team_filters.sql', type: 'depends-on', description: 'Must be run before the team-filters migration' },
  ],

  impactScopes: {
    'src/services/metrics-aggregator.ts': {
      level: 'system-wide',
      explanation: 'The metrics-aggregator is the central data pipeline. Every part of the system — from API controllers to the frontend dashboard — depends on the data it produces. A change here affects data ingestion, storage, and real-time broadcast.',
      affectedLayers: ['Backend', 'APIs', 'Services', 'Database'],
    },
    'src/components/Dashboard.tsx': {
      level: 'module',
      explanation: 'Dashboard.tsx composes chart components but delegates rendering to children. Changes primarily affect the frontend module, though the component consumes hooks and services that connect to the broader system.',
      affectedLayers: ['Frontend'],
    },
    'src/api/rest-router.ts': {
      level: 'cross-module',
      explanation: 'The REST router defines the contract between frontend and backend. Changing endpoints, validation schemas, or middleware affects all frontend API consumers and the controllers they call.',
      affectedLayers: ['APIs', 'Backend'],
    },
    'src/pages/LoginPage.tsx': {
      level: 'module',
      explanation: 'LoginPage is the authentication entry point. Changes mainly affect the sign-in UI, but if authService behaviour changes, every authenticated page is affected.',
      affectedLayers: ['Frontend'],
    },
    'src/services/authService.ts': {
      level: 'cross-module',
      explanation: 'authService manages the session token used by all authenticated requests. A break here affects login and every page that requires authentication.',
      affectedLayers: ['Frontend', 'APIs'],
    },
    'src/controllers/auth-controller.ts': {
      level: 'cross-module',
      explanation: 'auth-controller sits between the router, the auth service, and the user repository. Contract changes ripple to the frontend authService and the middleware guarding all routes.',
      affectedLayers: ['APIs', 'Backend', 'Database'],
    },
    'src/components/DataSourceForm.tsx': {
      level: 'local',
      explanation: 'DataSourceForm is a self-contained form. Changes mostly affect the creation flow and its validation, plus the service it calls.',
      affectedLayers: ['Frontend'],
    },
    'src/db/migrations/003_add_team_filters.sql': {
      level: 'local',
      explanation: 'This migration is a database schema change. It is applied once and primarily affects how the backend queries team-filtered data. Other migrations depend on it only for ordering.',
      affectedLayers: ['Database'],
    },
    'src/services/websocket-publisher.ts': {
      level: 'cross-module',
      explanation: 'The WebSocket publisher connects backend services to frontend sessions. Changes affect real-time data delivery across all connected dashboard clients.',
      affectedLayers: ['Services', 'Frontend'],
    },
  },

  changeChecklists: {
    'src/services/metrics-aggregator.ts': [
      'Review all registered DataSource adapters for compatibility',
      'Check the MetricsRecord type contract in src/types/metrics.ts',
      'Verify aggregate-writer write batch behaviour',
      'Update metrics-aggregator.test.ts with new scenarios',
      'Re-run the integration test suite for the data pipeline',
      'Verify the WebSocket delta format still matches the publisher',
      'Test per-source error isolation with a failing adapter',
    ],
    'src/components/Dashboard.tsx': [
      'Review child component prop interfaces (MetricChart, PipelineHealth, etc.)',
      'Check the useMetricsStream hook return type',
      'Verify timeRange state is correctly propagated',
      'Update Dashboard.test.tsx snapshot tests',
      'Test responsive layout at 1024px and 640px breakpoints',
      'Verify the error state renders when the WebSocket disconnects',
    ],
    'src/api/rest-router.ts': [
      'Check Zod validation schemas for backward compatibility',
      'Review authentication middleware for new endpoints',
      'Verify the response envelope format matches the frontend',
      'Update API contract documentation',
      'Update rest-router.test.ts with new route tests',
      'Test rate-limiting behaviour for modified endpoints',
    ],
    'src/pages/LoginPage.tsx': [
      'Verify login success navigation',
      'Verify login error state and inline validation',
      'Check the disabled state while the request is in flight',
    ],
    'src/services/authService.ts': [
      'Verify token storage and retrieval',
      'Verify the Authorization header is attached to requests',
      'Test logout clears the session',
      'Update authService.test.ts with new scenarios',
    ],
    'src/controllers/auth-controller.ts': [
      'Verify the login and logout routes',
      'Check credential verification in auth-service',
      'Verify user-repository queries',
      'Update auth-controller.test.ts',
    ],
    'src/components/DataSourceForm.tsx': [
      'Verify client-side validation for each field',
      'Check the create request payload',
      'Verify inline field-level error rendering',
      'Test the success path updates the source list',
    ],
    'src/db/migrations/003_add_team_filters.sql': [
      'Create a new migration instead of modifying existing ones',
      'Verify migration ordering with knex migrate:list',
      'Test up and down migrations on a staging database',
      'Update the team-metrics view if the schema changes',
      'Verify query-builder integration with the new schema',
    ],
    'src/services/websocket-publisher.ts': [
      'Verify WebSocket message protocol with the frontend hook',
      'Check Redis pub/sub channel naming consistency',
      'Test client reconnection with exponential backoff',
      'Review memory pressure with 1000+ concurrent clients',
      'Verify shutdown cleans up all connections and subscriptions',
    ],
  },

  whatCouldBreak: {
    'src/services/metrics-aggregator.ts': {
      affectedArea: 'Entire data pipeline',
      whyAffected: 'The aggregator is the single source of processed metrics. Any failure or regression here means the database stops receiving updates, dashboards go stale, and all downstream consumers lose data.',
      relatedFiles: ['src/db/aggregate-writer.ts', 'src/services/websocket-publisher.ts', 'src/controllers/metrics-controller.ts', 'src/components/Dashboard.tsx', 'src/types/metrics.ts'],
      codePath: 'DataSources → MetricsAggregator → AggregateWriter → Database → WebSocketPublisher → Dashboard',
      developerShouldVerify: 'Start by running metrics-aggregator.test.ts. Then verify that a registered DataSource produces correctly normalised MetricsRecord objects. Finally, test the end-to-end flow by starting the aggregator and confirming data appears in the database and dashboard.',
      testingConsiderations: 'Unit test the normalize() method with known inputs. Integration test the full poll cycle with a mock writer. Test per-source error isolation by providing a failing adapter alongside a working one.',
    },
    'src/components/Dashboard.tsx': {
      affectedArea: 'Frontend dashboard view',
      whyAffected: 'This is the primary user-facing component. Breaking it would prevent all users from seeing analytics data, effectively making the application unusable.',
      relatedFiles: ['src/components/MetricChart.tsx', 'src/components/PipelineHealth.tsx', 'src/hooks/useMetricsStream.ts', 'src/components/IssueBurndown.tsx', 'src/pages/DashboardPage.tsx'],
      codePath: 'DashboardPage → Dashboard.tsx → useMetricsStream (WebSocket) → Chart components → User sees data',
      developerShouldVerify: 'Check that all child components receive the correct props. Verify the WebSocket connection status indicator works. Test the error state by simulating a connection failure.',
      testingConsiderations: 'Test rendering with mock metrics data. Test responsive layout breakpoints. Test the loading state before the WebSocket connects. Test the error state rendering.',
    },
    'src/api/rest-router.ts': {
      affectedArea: 'All API endpoints',
      whyAffected: 'The router handles every HTTP request from the frontend. A misconfiguration here can expose endpoints without auth, break validation, or return incorrect response shapes.',
      relatedFiles: ['src/controllers/metrics-controller.ts', 'src/middleware/validate.ts', 'src/middleware/auth.ts', 'src/middleware/rate-limit.ts'],
      codePath: 'Frontend HTTP → rest-router.ts → middleware chain → controller → response',
      developerShouldVerify: 'Run route registration tests. Verify auth middleware is applied to protected routes. Test validation error responses for malformed input. Verify the response envelope format.',
      testingConsiderations: 'Test each route with valid and invalid inputs. Test auth middleware on public vs protected routes. Verify all error codes (401, 422, 500) return consistent JSON.',
    },
    'src/pages/LoginPage.tsx': {
      affectedArea: 'Sign-in experience',
      whyAffected: 'LoginPage is the first screen users see. A regression here blocks access to the whole application.',
      relatedFiles: ['src/services/authService.ts', 'src/api/client.ts', 'src/controllers/auth-controller.ts'],
      codePath: 'LoginPage → authService → api/client.ts → rest-router → auth-controller → auth-service',
      developerShouldVerify: 'Verify a successful login redirects to the dashboard. Verify an invalid credential shows the error state. Verify the loading state during the request.',
      testingConsiderations: 'Test login success, failure, and loading states. Verify that no unauthenticated requests are sent before the token is stored.',
    },
    'src/services/authService.ts': {
      affectedArea: 'Frontend authentication and session handling',
      whyAffected: 'authService owns the session token. If it breaks, every authenticated request in the application fails.',
      relatedFiles: ['src/api/client.ts', 'src/pages/LoginPage.tsx', 'src/controllers/auth-controller.ts'],
      codePath: 'authService → api/client.ts (all authenticated requests)',
      developerShouldVerify: 'Verify login stores the token, logout clears it, and the Authorization header is attached to every request. Update authService.test.ts.',
      testingConsiderations: 'Test token persistence across page reloads. Test that failed authentication leaves no partial session.',
    },
    'src/controllers/auth-controller.ts': {
      affectedArea: 'Backend auth API',
      whyAffected: 'auth-controller defines the auth API contract. Changes here affect the frontend authService and the middleware guarding all protected routes.',
      relatedFiles: ['src/services/auth-service.ts', 'src/db/repositories/user-repository.ts', 'src/middleware/auth.ts', 'src/api/rest-router.ts'],
      codePath: 'rest-router → auth-controller → auth-service → user-repository → session issued',
      developerShouldVerify: 'Verify the login and logout response shapes. Verify the session is usable by the middleware on subsequent requests.',
      testingConsiderations: 'Test the login route with valid and invalid credentials. Test that the returned token guards protected routes.',
    },
    'src/components/DataSourceForm.tsx': {
      affectedArea: 'Data source creation flow',
      whyAffected: 'DataSourceForm drives the creation of new integrations. A regression here blocks the onboarding of new metric sources.',
      relatedFiles: ['src/utils/validation.ts', 'src/services/dataSourceService.ts', 'src/controllers/data-source-controller.ts'],
      codePath: 'DataSourceForm → validation.ts → dataSourceService → POST /api/v1/datasources',
      developerShouldVerify: 'Verify field validation on empty, malformed, and duplicate inputs. Verify the success path updates the source list.',
      testingConsiderations: 'Test client-side validation for each field. Test the request payload shape. Test the error path when the API rejects the request.',
    },
    'src/db/migrations/003_add_team_filters.sql': {
      affectedArea: 'Database schema and team access control',
      whyAffected: 'Database migrations are applied sequentially in production. Modifying an existing migration instead of creating a new one could break the migration chain and leave the database in an inconsistent state.',
      relatedFiles: ['src/db/migrations/002_add_repositories.sql', 'src/db/query-builder.ts', 'src/controllers/teams-controller.ts', 'src/middleware/auth.ts'],
      codePath: 'knex migrate:up → 003_add_team_filters.sql → schema update → team-filtered queries',
      developerShouldVerify: 'Create a new migration file rather than editing this one. Test the up migration against a copy of production data. Verify the down migration rolls back cleanly.',
      testingConsiderations: 'Test migration idempotency (IF NOT EXISTS). Test rollback with the down migration. Verify the team_metrics view returns correct data with different team contexts.',
    },
    'src/services/websocket-publisher.ts': {
      affectedArea: 'Real-time data delivery',
      whyAffected: 'The WebSocket publisher is the bridge between backend data processing and live dashboard updates. Breaking this means dashboards become static and require manual page refreshes.',
      relatedFiles: ['src/services/metrics-aggregator.ts', 'src/config/redis.ts', 'src/hooks/useMetricsStream.ts', 'src/components/Dashboard.tsx', 'src/api/ws-router.ts'],
      codePath: 'MetricsAggregator → WebSocketPublisher → Redis pub/sub → useMetricsStream → Dashboard UI',
      developerShouldVerify: 'Test that a single broadcast reaches all connected clients. Verify client reconnection after a publisher restart. Check that heartbeat timeout correctly terminates stale connections.',
      testingConsiderations: 'Test with a single client and with 100+ simulated clients. Test client reconnection with exponential backoff. Test message format backward compatibility.',
    },
  },

  taskAnalyses: [
    {
      id: 'add-validation',
      taskQuery: 'Add validation to a form',
      summary: 'The developer wants to add input validation to the data source creation form. This involves client-side validation in DataSourceForm.tsx, a matching Zod schema for the API contract, and storage-level constraints.',
      startHere: {
        file: 'src/components/DataSourceForm.tsx',
        reason: 'This is the form that collects new data source details. Understanding its current validation state shows exactly where your change belongs.',
      },
      steps: [
        {
          file: 'src/components/DataSourceForm.tsx',
          func: 'DataSourceForm (component)',
          layer: 'frontend',
          explanation: 'This form renders the provider, repository URL, and token fields. Review how it currently calls validation.ts and where inline errors are displayed.',
        },
        {
          file: 'src/utils/validation.ts',
          func: 'validateDataSourceInput',
          layer: 'frontend',
          explanation: 'Shared validation helpers. This is where field rules (required, URL format, token length) are defined and reused across the frontend.',
        },
        {
          file: 'src/services/dataSourceService.ts',
          func: 'createDataSource',
          layer: 'frontend',
          explanation: 'The service that submits the validated payload to the API. Confirm the submitted shape matches the backend schema you are updating.',
        },
        {
          file: 'src/controllers/data-source-controller.ts',
          func: 'create',
          layer: 'backend',
          explanation: 'The controller that receives the creation request. Verify it validates the body and returns consistent error responses.',
        },
        {
          file: 'src/db/repositories/data-source-repository.ts',
          func: 'create',
          layer: 'database',
          explanation: 'Data persistence. Confirm that constraints here match the validation rules so bad data is rejected at every layer.',
        },
      ],
      dependencyImpact: {
        affectedFiles: ['src/components/DataSourceForm.tsx', 'src/utils/validation.ts', 'src/services/dataSourceService.ts', 'src/controllers/data-source-controller.ts', 'src/db/repositories/data-source-repository.ts'],
        affectedLayers: ['Frontend', 'APIs', 'Backend', 'Database'],
        description: 'Adding validation affects the frontend form and its validation util, the API schema, the backend controller, and storage constraints.',
      },
      changeChecklist: [
        'Understand current form state management in DataSourceForm.tsx',
        'Inspect existing validation patterns in validation.ts',
        'Define the validation schema for the new fields',
        'Add client-side validation feedback in DataSourceForm.tsx',
        'Add the corresponding Zod schema in the API layer',
        'Review error handling for validation failures in the frontend',
        'Check affected components that consume the validated data',
        'Verify the full user flow from form input to data submission',
      ],
      verificationPlan: {
        flowsToCheck: ['User opens the data source form and submits valid and invalid data'],
        areasToReview: ['Frontend inline validation feedback', 'API validation error responses (422 status)', 'Error state rendering in the source list'],
        relatedBehavior: ['Submission with empty required fields', 'Submission with an invalid repository URL', 'Submission with a duplicate source name'],
      },
    },
    {
      id: 'change-auth',
      taskQuery: 'Change the authentication flow',
      summary: 'The developer wants to modify authentication. This spans the frontend login page and service, the auth API routes, the backend auth service, and the user repository.',
      startHere: {
        file: 'src/pages/LoginPage.tsx',
        reason: 'The login page is the natural entry point for any authentication change — it is the first screen a user sees.',
      },
      steps: [
        {
          file: 'src/pages/LoginPage.tsx',
          func: 'LoginPage (component)',
          layer: 'frontend',
          explanation: 'The sign-in UI. Review how it collects credentials and delegates to authService before redirecting.',
        },
        {
          file: 'src/services/authService.ts',
          func: 'login',
          layer: 'frontend',
          explanation: 'The frontend auth wrapper. It owns token storage and is where transport-level changes belong.',
        },
        {
          file: 'src/api/client.ts',
          func: 'request',
          layer: 'frontend',
          explanation: 'The HTTP client. Verify how the Authorization header is attached to authenticate outgoing requests.',
        },
        {
          file: 'src/controllers/auth-controller.ts',
          func: 'login',
          layer: 'backend',
          explanation: 'The backend auth controller. Changes to the login contract, response shape, or error codes live here.',
        },
        {
          file: 'src/services/auth-service.ts',
          func: 'authenticate',
          layer: 'backend',
          explanation: 'The auth domain logic — credential verification and session building. This is where the actual auth strategy change lands.',
        },
        {
          file: 'src/db/repositories/user-repository.ts',
          func: 'findByEmail',
          layer: 'database',
          explanation: 'User data access. If auth depends on user fields or team memberships, change them here.',
        },
      ],
      dependencyImpact: {
        affectedFiles: ['src/pages/LoginPage.tsx', 'src/services/authService.ts', 'src/api/client.ts', 'src/controllers/auth-controller.ts', 'src/services/auth-service.ts', 'src/db/repositories/user-repository.ts'],
        affectedLayers: ['Frontend', 'APIs', 'Backend', 'Database'],
        description: 'Changing authentication affects the frontend login flow, the API contract, backend auth logic, and the user repository.',
      },
      changeChecklist: [
        'Review the current Passport.js strategy configuration',
        'Understand the auth middleware request enrichment pattern',
        'Design the new auth flow (JWT, session, or OAuth)',
        'Update auth service implementation',
        'Update auth configuration',
        'Verify auth context propagation to all controllers',
        'Check team-filtering queries still receive the correct team context',
        'Update route protection annotations',
      ],
      verificationPlan: {
        flowsToCheck: ['User authenticates and accesses the dashboard', 'Unauthenticated user is rejected with a 401', 'Team context is propagated into filtered queries'],
        areasToReview: ['Auth middleware for all protected routes', 'Auth config for secret management', 'Controller auth context usage'],
        relatedBehavior: ['Token refresh flow', 'Session expiry handling', 'Multi-strategy fallback behaviour'],
      },
    },
    {
      id: 'add-api-field',
      taskQuery: 'Add a new API field',
      summary: 'The developer needs to add a new field to an existing API response. This involves type definitions, the controller response, the service layer, and the frontend component that renders it.',
      startHere: {
        file: 'src/types/metrics.ts',
        reason: 'Shared type definitions are the source of truth for the API contract — add the field here so all consumers stay aligned.',
      },
      steps: [
        {
          file: 'src/types/metrics.ts',
          func: null,
          layer: 'backend',
          explanation: 'Shared type definitions. Add the new field to MetricsRecord or the response interface so the frontend and backend agree on the shape.',
        },
        {
          file: 'src/controllers/metrics-controller.ts',
          func: 'getDashboardMetrics',
          layer: 'backend',
          explanation: 'The controller assembles the API response. Update it to include the new field in the payload.',
        },
        {
          file: 'src/services/metrics-aggregator.ts',
          func: 'normalize',
          layer: 'backend',
          explanation: 'If the new field comes from a data source, update normalize() so it is captured when raw data becomes a MetricsRecord.',
        },
        {
          file: 'src/db/query-builder.ts',
          func: 'selectDashboardMetrics',
          layer: 'database',
          explanation: 'If the field is stored, add it to the relevant queries.',
        },
        {
          file: 'src/components/Dashboard.tsx',
          func: 'Dashboard (component)',
          layer: 'frontend',
          explanation: 'The component that renders the data. Update it to display the new field in the appropriate panel.',
        },
      ],
      dependencyImpact: {
        affectedFiles: ['src/types/metrics.ts', 'src/controllers/metrics-controller.ts', 'src/db/query-builder.ts', 'src/services/metrics-aggregator.ts', 'src/components/Dashboard.tsx'],
        affectedLayers: ['Backend', 'Database', 'Frontend'],
        description: 'Adding an API field affects the type contract, the response assembly, database queries (if persisted), and the frontend rendering.',
      },
      changeChecklist: [
        'Define the new field in the shared type definitions',
        'Update the controller response assembly',
        'Update the database query if the field is persisted',
        'Update the aggregation pipeline if the field is computed',
        'Add frontend rendering for the new field',
        'Update the API contract documentation',
        'Add a frontend test for the new field display',
      ],
      verificationPlan: {
        flowsToCheck: ['API returns the new field in the response', 'Frontend displays the field correctly', 'Database persists the field if applicable'],
        areasToReview: ['TypeScript type alignment across all consumers', 'Response format consistency', 'Frontend loading and error states'],
        relatedBehavior: ['Backward compatibility with existing API consumers', 'Null handling for optional fields', 'Field ordering in the API response'],
      },
    },
    {
      id: 'improve-error-handling',
      taskQuery: 'Improve error handling',
      summary: 'The developer wants to improve error handling across the app. This involves the API error format, backend service isolation, and frontend error states.',
      startHere: {
        file: 'src/api/rest-router.ts',
        reason: 'The router is where API errors are produced. Studying its current catch pattern is essential before improving it.',
      },
      steps: [
        {
          file: 'src/api/rest-router.ts',
          func: null,
          layer: 'apis',
          explanation: 'Review the error propagation pattern — errors are forwarded to Express error middleware. Consider adding structured error codes and field-level details.',
        },
        {
          file: 'src/services/metrics-aggregator.ts',
          func: 'poll',
          layer: 'backend',
          explanation: 'The aggregator demonstrates per-source error isolation. Apply the same pattern to other services for graceful degradation.',
        },
        {
          file: 'src/services/websocket-publisher.ts',
          func: 'checkHealth',
          layer: 'services',
          explanation: 'Heartbeat and timeout monitoring. Consider similar health checks for other service connections.',
        },
        {
          file: 'src/components/Dashboard.tsx',
          func: 'Dashboard (component)',
          layer: 'frontend',
          explanation: 'Frontend error states. Review the current error UI and consider more specific messages for different failures.',
        },
        {
          file: 'src/middleware/rate-limit.ts',
          func: null,
          layer: 'apis',
          explanation: 'Rate-limit middleware. Consider adding rate-limit error responses with retry-after headers.',
        },
      ],
      dependencyImpact: {
        affectedFiles: ['src/api/rest-router.ts', 'src/middleware/validate.ts', 'src/middleware/rate-limit.ts', 'src/components/Dashboard.tsx', 'src/services/metrics-aggregator.ts'],
        affectedLayers: ['APIs', 'Frontend', 'Backend'],
        description: 'Error handling improvements touch every layer — structured API errors, backend isolation, and specific frontend error states.',
      },
      changeChecklist: [
        'Audit current error handling patterns across all layers',
        'Define the structured error response format',
        'Add error codes and field-level details to API errors',
        'Add per-service error isolation (aggregator pattern)',
        'Add specific error-state UI components in the frontend',
        'Add rate-limit error responses with retry headers',
        'Add error logging with context information',
        'Verify error messages are user-friendly',
      ],
      verificationPlan: {
        flowsToCheck: ['API returns structured errors for invalid input', 'Frontend shows the appropriate error state per failure type', 'Service failures do not cascade to unrelated services'],
        areasToReview: ['Error message clarity and usefulness', 'Error isolation boundaries', 'Frontend error recovery mechanisms'],
        relatedBehavior: ['Error logging output', 'Error response format consistency', 'Graceful degradation when downstream services fail'],
      },
    },
    {
      id: 'add-datasource',
      taskQuery: 'Add a new data source',
      summary: 'The developer wants to integrate a new CI/CD data source (e.g., CircleCI). This involves implementing the DataSource interface, registering an adapter, and persisting source metadata.',
      startHere: {
        file: 'src/services/data-source.ts',
        reason: 'The DataSource interface defines the contract every adapter must implement. Starting here ensures you know the required methods before writing code.',
      },
      steps: [
        {
          file: 'src/services/data-source.ts',
          func: null,
          layer: 'backend',
          explanation: 'The DataSource interface with fetchPipelines(), fetchTestResults(), and fetchDeployments(). Study the contract before implementing.',
        },
        {
          file: 'src/services/github-adapter.ts',
          func: 'fetchPipelines',
          layer: 'services',
          explanation: 'Reference implementation for GitHub Actions. Use it as a template — same interface, different API calls.',
        },
        {
          file: 'src/services/metrics-aggregator.ts',
          func: 'registerSource',
          layer: 'backend',
          explanation: 'After creating the adapter, register it here so it is polled each cycle.',
        },
        {
          file: 'src/controllers/data-source-controller.ts',
          func: 'create',
          layer: 'backend',
          explanation: 'Review how data sources are created via the API so your adapter metadata is persisted correctly.',
        },
        {
          file: 'src/db/repositories/data-source-repository.ts',
          func: 'create',
          layer: 'database',
          explanation: 'Data persistence for sources. Confirm the new provider type is supported by the schema.',
        },
      ],
      dependencyImpact: {
        affectedFiles: ['src/services/data-source.ts', 'src/services/metrics-aggregator.ts', 'src/controllers/data-source-controller.ts', 'src/db/repositories/data-source-repository.ts', 'src/types/datasource.ts'],
        affectedLayers: ['Backend', 'Services', 'Database'],
        description: 'Adding a data source touches the interface, the aggregator registry, the API creation flow, and persistence.',
      },
      changeChecklist: [
        'Study the DataSource interface contract',
        'Review the GitHub adapter as a reference implementation',
        'Implement the new adapter class',
        'Register the adapter in the aggregator source registry',
        'Add a database migration if new fields are introduced',
        'Update the datasource type if new metadata is needed',
        'Test adapter error isolation with the aggregator',
      ],
      verificationPlan: {
        flowsToCheck: ['The new adapter is registered and polled by the aggregator', 'Data flows through normalize() correctly', 'Metrics appear in the database and dashboard'],
        areasToReview: ['Adapter API authentication', 'Error handling for API failures', 'Data normalisation correctness'],
        relatedBehavior: ['The aggregator keeps working if the adapter fails', 'Existing adapters are unaffected by the new registration', 'The dashboard shows new data without frontend changes'],
      },
    },
  ],

  mentorInsights: [
    {
      condition: 'default',
      message: 'The metrics-aggregator is the heart of PulseBoard — trace how data flows from external sources through the pipeline to the dashboard.',
      action: { type: 'selectFile', value: 'src/services/metrics-aggregator.ts' },
    },
    {
      condition: 'file:src/services/metrics-aggregator.ts',
      message: 'This orchestrator collects data from multiple adapters. Each source is isolated — one failure never blocks the pipeline.',
      action: { type: 'selectLayer', value: 'backend' },
    },
    {
      condition: 'file:src/components/Dashboard.tsx',
      message: 'Dashboard composes four chart components and subscribes to live WebSocket data. The UI updates without page refreshes.',
      action: { type: 'selectLayer', value: 'frontend' },
    },
    {
      condition: 'file:src/api/rest-router.ts',
      message: 'Every API request passes through Zod validation before reaching business logic. The validate middleware enforces the contract.',
      action: { type: 'selectLayer', value: 'apis' },
    },
    {
      condition: 'file:src/services/websocket-publisher.ts',
      message: 'Real-time data flows through Redis pub/sub. Any backend instance can broadcast to all connected dashboards simultaneously.',
      action: { type: 'selectLayer', value: 'services' },
    },
    {
      condition: 'file:src/db/migrations/003_add_team_filters.sql',
      message: 'The team_metrics view uses PostgreSQL session variables to filter data by team — no application-level filtering needed.',
      action: { type: 'selectLayer', value: 'database' },
    },
    {
      condition: 'file:src/pages/LoginPage.tsx',
      message: 'The authentication flow starts here: LoginPage → authService → API client → AuthController → AuthService → UserRepository.',
      action: { type: 'selectLayer', value: 'frontend' },
    },
    {
      condition: 'file:src/services/authService.ts',
      message: 'authService owns the session token for the whole frontend. A change here affects every authenticated request.',
      action: { type: 'selectLayer', value: 'frontend' },
    },
    {
      condition: 'file:src/controllers/auth-controller.ts',
      message: 'auth-controller sits between the router, the auth service, and the user repository — the middle of the auth flow.',
      action: { type: 'selectLayer', value: 'backend' },
    },
    {
      condition: 'file:src/components/DataSourceForm.tsx',
      message: 'Data source creation runs: Form → validation.ts → dataSourceService → POST /api/v1/datasources → controller → service → repository.',
      action: { type: 'selectLayer', value: 'frontend' },
    },
    {
      condition: 'layer:backend',
      message: 'The backend layer orchestrates aggregation, auth, and data-source management across controllers, services, and the data layer.',
      action: { type: 'selectFile', value: 'src/services/metrics-aggregator.ts' },
    },
    {
      condition: 'layer:frontend',
      message: 'The frontend communicates exclusively through the API layer. All real-time data arrives via the WebSocket publisher.',
      action: { type: 'selectFile', value: 'src/components/Dashboard.tsx' },
    },
    {
      condition: 'layer:apis',
      message: 'The API layer is the contract between frontend and backend. Changing a route requires updates in middleware, controllers, and the frontend client.',
      action: { type: 'selectFile', value: 'src/api/rest-router.ts' },
    },
    {
      condition: 'layer:services',
      message: 'Service-layer adapters implement the DataSource interface. Each adapter can be developed, tested, and deployed independently.',
      action: { type: 'selectFile', value: 'src/services/websocket-publisher.ts' },
    },
    {
      condition: 'layer:database',
      message: 'Database migrations are immutable once applied. Schema changes require new migrations, not modifications to existing ones.',
      action: { type: 'selectFile', value: 'src/db/migrations/003_add_team_filters.sql' },
    },
    {
      condition: 'task:add-validation',
      message: 'Adding validation touches every layer: the frontend form and validation util, the API schema, the backend controller, and storage constraints.',
      action: { type: 'selectLayer', value: 'apis' },
    },
    {
      condition: 'task:change-auth',
      message: 'The authentication flow crosses UI, service, API, and data layers. Passport.js middleware enriches every request with team context.',
      action: { type: 'selectLayer', value: 'apis' },
    },
    {
      condition: 'function:selected',
      message: 'Functions with side effects or external calls deserve extra attention — changes can cascade through the entire data pipeline.',
      action: { type: 'selectFunction', value: null },
    },
  ],

  investigationData: {
    'why-does-this-file-exist': {
      answer: 'Every file in PulseBoard has a specific responsibility. For example, src/services/metrics-aggregator.ts exists to collect, normalise, and persist metrics from external CI/CD sources. Files like src/components/Dashboard.tsx exist to compose visualisations. Controllers like src/controllers/auth-controller.ts exist to handle HTTP request lifecycle for a domain. This separation ensures each file can be developed, tested, and understood in isolation.',
      evidence: {
        files: ['src/services/metrics-aggregator.ts', 'src/api/rest-router.ts', 'src/controllers/auth-controller.ts'],
        functions: ['MetricsAggregator.constructor', 'Dashboard (component)', 'POST /api/v1/auth/login'],
        layers: ['Backend', 'Frontend', 'APIs'],
        traceSteps: ['Login to Dashboard (metrics-aggregator step)', 'Login to Dashboard (rest-router step)'],
        dependencies: ['metrics-aggregator → aggregate-writer', 'metrics-aggregator → types/metrics.ts'],
      },
      confidenceScope: 'Directly supported by repository data — each important file has a documented purpose, role, and explanation.',
      suggestions: [
        { label: 'View file purposes', action: { type: 'viewFileExplanations', value: null } },
        { label: 'Explore architecture layers', action: { type: 'setRepoMapView', value: 'architecture' } },
        { label: 'Browse file structure', action: { type: 'setRepoMapView', value: 'structure' } },
      ],
      nextBest: {
        question: 'Walk me through a request',
        preview: 'Trace how a request flows from the frontend through the API to the database.',
      },
      context: 'default',
    },
    'walk-me-through-this-request': {
      answer: 'A typical request in PulseBoard follows this path: the frontend component (e.g., Dashboard.tsx) calls a frontend service (e.g., authService.ts or dashboardService.ts), which uses the API client (src/api/client.ts) to make an HTTP request. The request hits src/api/rest-router.ts, which applies validation and auth middleware, then delegates to the appropriate controller (e.g., src/controllers/auth-controller.ts or src/controllers/metrics-controller.ts). The controller calls a backend service (e.g., src/services/auth-service.ts) that queries the database using a repository or query builder, and returns the result through the same chain.',
      evidence: {
        files: ['src/api/client.ts', 'src/api/rest-router.ts', 'src/middleware/validate.ts', 'src/controllers/auth-controller.ts', 'src/services/auth-service.ts', 'src/db/repositories/user-repository.ts'],
        functions: ['client.post()', 'GET /api/v1/metrics/dashboard', 'POST /api/v1/auth/login'],
        layers: ['Frontend', 'APIs', 'Backend', 'Database'],
        traceSteps: ['Login to Dashboard Flow (10 steps)', 'Add a Data Source Flow (6 steps)'],
        dependencies: ['authService → api/client.ts', 'rest-router → auth-controller', 'auth-controller → auth-service'],
      },
      confidenceScope: 'Directly supported by repository data — the trace paths and dependency relationships model this exact flow.',
      suggestions: [
        { label: 'Show request path', action: { type: 'startTracePath', value: 0 } },
        { label: 'Open authService.ts', action: { type: 'selectFile', value: 'src/services/authService.ts' } },
        { label: 'Explain AuthController', action: { type: 'selectFile', value: 'src/controllers/auth-controller.ts' } },
        { label: 'Show dependencies', action: { type: 'setRepoMapView', value: 'dependencies' } },
        { label: 'What could break?', action: { type: 'whatCouldBreak', value: null } },
      ],
      nextBest: {
        question: 'What happens if I remove this function?',
        preview: 'Understand the impact of removing a function from the request chain.',
      },
      context: 'default',
    },
    'why-is-this-dependency-needed': {
      answer: 'Dependencies in PulseBoard are organised by architectural layer. For example, the frontend (src/services/authService.ts) depends on src/api/client.ts to make HTTP requests — separating the transport layer from business logic. The backend (src/controllers/auth-controller.ts) depends on src/services/auth-service.ts for credential verification and on src/db/repositories/user-repository.ts for data access. This layered dependency structure means each component has a single responsibility and can be tested, mocked, or replaced independently.',
      evidence: {
        files: ['src/services/authService.ts', 'src/api/client.ts', 'src/controllers/auth-controller.ts', 'src/services/auth-service.ts', 'src/db/repositories/user-repository.ts'],
        functions: ['authService.login', 'client.post', 'POST /api/v1/auth/login', 'auth-service.authenticate'],
        layers: ['Frontend', 'APIs', 'Backend', 'Database'],
        traceSteps: [],
        dependencies: ['authService → client.ts (imports)', 'auth-controller → auth-service (imports)', 'auth-service → user-repository (imports)'],
      },
      confidenceScope: 'Supported by related repository relationships — the dependency edges and source imports confirm this structure.',
      suggestions: [
        { label: 'Open dependency view', action: { type: 'setRepoMapView', value: 'dependencies' } },
        { label: 'Explore auth flow', action: { type: 'startTracePath', value: 0 } },
        { label: 'Open authService.ts', action: { type: 'selectFile', value: 'src/services/authService.ts' } },
      ],
      nextBest: {
        question: 'Where does this data eventually go?',
        preview: 'Trace data from user input through every layer to final storage.',
      },
      context: 'default',
    },
    'what-happens-if-i-remove-this-function': {
      answer: 'Removing a key function can break the entire chain. If authService.login() were removed, LoginPage could not authenticate users. If src/controllers/auth-controller.ts were removed, the /api/v1/auth/login endpoint would stop working, and every frontend auth attempt would fail. Functions with side effects are especially risky — for example, the WebSocket publisher broadcast() affects all connected dashboard clients. The Potential Impact section for each function lists callers, callees, and failure points.',
      evidence: {
        files: ['src/services/authService.ts', 'src/controllers/auth-controller.ts', 'src/services/websocket-publisher.ts'],
        functions: ['authService.login', 'POST /api/v1/auth/login', 'WebSocketPublisher.broadcast'],
        layers: ['Frontend', 'APIs', 'Services'],
        traceSteps: ['authService.ts step in Login to Dashboard', 'auth-controller.ts step in Login to Dashboard'],
        dependencies: ['authService called by LoginPage', 'auth-controller called by rest-router', 'broadcast called by message handler'],
      },
      confidenceScope: 'Directly supported by repository data — each function lists calledBy, calls, side effects, and failure points in the Function Intelligence data.',
      suggestions: [
        { label: 'View function impact', action: { type: 'selectFunction', value: null } },
        { label: 'What could break?', action: { type: 'whatCouldBreak', value: null } },
        { label: 'Show dependencies', action: { type: 'setRepoMapView', value: 'dependencies' } },
        { label: 'Explore task analysis', action: { type: 'startGuidedMode', value: 'improve-error-handling' } },
      ],
      nextBest: {
        question: 'What should I inspect next?',
        preview: 'Get guidance on the next area to explore in the codebase.',
      },
      context: 'default',
    },
    'where-does-this-data-eventually-go': {
      answer: 'Data in PulseBoard flows from external sources through the pipeline: external CI/CD APIs (GitHub, GitLab) → DataSource adapters → metrics-aggregator normalisation → aggregate-writer database persistence → team-metrics view query → metrics-controller API response → Dashboard frontend. For authentication, data flows: user input → LoginPage → authService → API client → auth-controller → auth-service → user-repository → PostgreSQL → session token returned. The architecture map and trace paths visualise these flows step by step.',
      evidence: {
        files: ['src/services/metrics-aggregator.ts', 'src/db/aggregate-writer.ts', 'src/db/query-builder.ts', 'src/api/rest-router.ts', 'src/components/Dashboard.tsx'],
        functions: ['MetricsAggregator.poll', 'AggregateWriter.writeBatch', 'GET /api/v1/metrics/dashboard', 'Dashboard (component)'],
        layers: ['Services', 'Backend', 'Database', 'APIs', 'Frontend'],
        traceSteps: ['Login to Dashboard Flow (all 10 steps)', 'Add a Data Source Flow (all 6 steps)'],
        dependencies: ['metrics-aggregator → aggregate-writer (writes data)', 'rest-router → metrics-controller (reads data)'],
      },
      confidenceScope: 'Directly supported by repository data — the source code, trace paths, architecture relationships, and dependency edges all confirm these data flow paths.',
      suggestions: [
        { label: 'Follow the login trace', action: { type: 'startTracePath', value: 0 } },
        { label: 'Follow the datasource trace', action: { type: 'startTracePath', value: 1 } },
        { label: 'Open Dashboard.tsx', action: { type: 'selectFile', value: 'src/components/Dashboard.tsx' } },
        { label: 'View architecture map', action: { type: 'setRepoMapView', value: 'architecture' } },
      ],
      nextBest: {
        question: 'What should I inspect next?',
        preview: 'Get guidance on the next area to explore in the codebase.',
      },
      context: 'default',
    },
    'what-should-i-inspect-next': {
      answer: 'Based on your current context, here are the most valuable investigations. If you explored the authentication flow, inspect how auth errors reach the UI — the error states in LoginPage.tsx and the error response format from auth-controller.ts. If you explored data sources, inspect what happens when the API rejects a create request — the error handling in DataSourceForm.tsx and the data-source-controller.ts catch block. If you explored the architecture, trace a specific request end-to-end using the Trace Code Path feature.',
      evidence: {
        files: ['src/pages/LoginPage.tsx', 'src/components/DataSourceForm.tsx', 'src/controllers/auth-controller.ts', 'src/controllers/data-source-controller.ts'],
        functions: ['LoginPage error state', 'DataSourceForm submit error', 'auth-controller login catch block'],
        layers: ['Frontend', 'APIs'],
        traceSteps: [],
        dependencies: [],
      },
      confidenceScope: 'Inferred from architecture relationships — based on the curated PulseBoard repository structure and typical development flow patterns in the sample data.',
      suggestions: [
        { label: 'Examine error handling', action: { type: 'startGuidedMode', value: 'improve-error-handling' } },
        { label: 'Trace auth errors', action: { type: 'startTracePath', value: 0 } },
        { label: 'How does validation work?', action: { type: 'startGuidedMode', value: 'add-validation' } },
        { label: 'Start a new task', action: { type: 'clearTask', value: null } },
      ],
      nextBest: {
        question: 'Why does this file exist?',
        preview: 'Understand the purpose of any file in PulseBoard.',
      },
      context: 'default',
    },
  },

  investigationRouting: {
    'why': 'why-does-this-file-exist',
    'purpose': 'why-does-this-file-exist',
    'walk me through': 'walk-me-through-this-request',
    'how does.*request': 'walk-me-through-this-request',
    'dependency needed': 'why-is-this-dependency-needed',
    'why.*depend': 'why-is-this-dependency-needed',
    'remove.*function': 'what-happens-if-i-remove-this-function',
    'delete.*function': 'what-happens-if-i-remove-this-function',
    'remove.*this': 'what-happens-if-i-remove-this-function',
    'where.*data.*go': 'where-does-this-data-eventually-go',
    'where.*end up': 'where-does-this-data-eventually-go',
    'data flow': 'where-does-this-data-eventually-go',
    'inspect next': 'what-should-i-inspect-next',
    'what next': 'what-should-i-inspect-next',
    'should I look': 'what-should-i-inspect-next',
  },

  investigationFollowUps: {
    'authService': {
      'what happens after': 'The authService.login() function returns a user object and stores the session token. The LoginPage then redirects to the dashboard. The token is available via authService.getToken() for all subsequent API calls.',
      'what happens before': 'Before authService is called, LoginPage collects the email and password from the form inputs. The handleSubmit function manages the loading state and catches any errors from the authService call.',
    },
    'auth-controller': {
      'what happens after': 'After the auth-controller responds, the frontend receives the { token, user } payload. The authService stores the token and the user is redirected to the dashboard route.',
      'what happens before': 'Before the auth-controller is invoked, the REST router applies the validate middleware to check the request body schema, then the authenticate middleware confirms the request is allowed.',
    },
    'rest-router': {
      'what happens after': 'After the router dispatches a request to a controller, the controller performs its domain logic and returns a JSON response that the router sends back to the frontend.',
      'what happens before': 'Before the router processes routes, the Express app initialises middleware (logging, CORS, auth) and mounts the router at /api/v1.',
    },
    'dashboard': {
      'what happens after': 'After Dashboard.tsx renders, the useMetricsStream hook opens a WebSocket and the chart components begin receiving live metric deltas.',
      'what happens before': 'Before Dashboard.tsx mounts, the user authenticates through the login flow. The DashboardPage loads the initial metric snapshot via dashboardService and passes it as props.',
    },
  },

  changePlans: {
    'add-validation': {
      changeRequest: 'Add validation to a form',
      whyChange: {
        problem: 'The DataSourceForm currently accepts any input without client-side validation. Users can submit empty fields or malformed URLs, causing 422 errors from the API.',
        existingCode: 'DataSourceForm uses uncontrolled inputs with no validation logic. The submit handler calls dataSourceService.create() directly without pre-validation.',
        proposedApproach: 'Add client-side validation using src/utils/validation.ts before submission. Show inline field errors. Add corresponding Zod schema for the API endpoint.',
        dependenciesAffected: ['src/utils/validation.ts', 'src/services/dataSourceService.ts', 'src/api/rest-router.ts', 'src/controllers/data-source-controller.ts'],
        sideEffects: 'Form state management becomes more complex. Error states need new UI elements. The API may receive fewer malformed requests.',
      },
      filesToModify: [
        { file: 'src/components/DataSourceForm.tsx', reason: 'The form component where validation is added.', currentResponsibility: 'Collect user input and call the create service.', proposedResponsibility: 'Validate input client-side before submission and show inline errors.', conceptualChange: 'Add validateDataSourceInput call and error rendering.', dependencies: ['src/utils/validation.ts', 'src/services/dataSourceService.ts'], impact: 'module' },
        { file: 'src/utils/validation.ts', reason: 'Shared validation helpers that define the rules.', currentResponsibility: 'Provide reusable validation functions for the application.', proposedResponsibility: 'Add data-source field validation rules.', conceptualChange: 'Add validateDataSourceInput() function.', dependencies: [], impact: 'local' },
        { file: 'src/controllers/data-source-controller.ts', reason: 'The API endpoint must accept or reject the validated shape.', currentResponsibility: 'Receive and persist data-source creation requests.', proposedResponsibility: 'Apply Zod schema validation and return structured error responses.', conceptualChange: 'Add request body validation with Zod.', dependencies: ['src/middleware/validate.ts'], impact: 'local' },
      ],
      changeFlow: ['Task: Add validation', 'DataSourceForm', 'validation.ts', 'API Controller', 'Dependencies', 'Impact', 'Verification'],
      diffPreviews: [
        {
          file: 'src/components/DataSourceForm.tsx',
          description: 'Add client-side validation before submission',
          before: `function DataSourceForm({ onCreated }) {\n  const [name, setName] = useState('');\n  const [repoUrl, setRepoUrl] = useState('');\n  const [token, setToken] = useState('');\n\n  const handleSubmit = async (e) => {\n    e.preventDefault();\n    setSubmitting(true);\n    try {\n      const source = await dataSourceService.create({ name, repoUrl, token });\n      onCreated(source);\n    } catch (err) {\n      setErrors({ submit: err.message });\n    }\n  };`,
          after: `function DataSourceForm({ onCreated }) {\n  const [name, setName] = useState('');\n  const [errors, setErrors] = useState({});\n\n  const handleSubmit = async (e) => {\n    e.preventDefault();\n    const validation = validateDataSourceInput({ name, repoUrl, token });\n    if (!validation.valid) {\n      setErrors(validation.errors);\n      return;\n    }\n    setSubmitting(true);\n    try {\n      const source = await dataSourceService.create({ name, repoUrl, token });\n      onCreated(source);\n    } catch (err) {\n      setErrors({ submit: err.message });\n    }\n  };`,
        },
      ],
      verificationPlan: {
        flowsToCheck: ['User submits empty fields and sees inline errors', 'User submits with invalid URL and sees a format error', 'User submits valid data and the source is created'],
        componentsToInspect: ['DataSourceForm.tsx', 'validation.ts', 'data-source-controller.ts'],
        apiBehavior: 'POST /api/v1/datasources should reject invalid payloads with 422 and field-level details',
        errorCases: ['Empty name field', 'Invalid repository URL format', 'Missing access token', 'Duplicate source name'],
        regressionAreas: ['Existing sources should continue to load', 'Dashboard panels unaffected'],
      },
    },
    'change-auth': {
      changeRequest: 'Change the authentication flow',
      whyChange: {
        problem: 'The current authentication flow relies on email/password with Passport.js. The application needs to support OAuth-only authentication with JWT tokens.',
        existingCode: 'LoginPage collects email/password and calls authService.login(), which posts to auth-controller. Auth-service uses password verification.',
        proposedApproach: 'Modify LoginPage to redirect to GitHub OAuth. Update authService to handle the OAuth callback. Update auth-controller and auth-service for OAuth token exchange.',
        dependenciesAffected: ['src/pages/LoginPage.tsx', 'src/services/authService.ts', 'src/controllers/auth-controller.ts', 'src/services/auth-service.ts', 'src/config/auth.ts'],
        sideEffects: 'Email/password flow is deprecated. Session management shifts from server sessions to JWT. The user-repository query changes.',
      },
      filesToModify: [
        { file: 'src/pages/LoginPage.tsx', reason: 'The login UI needs to redirect instead of collecting credentials.', currentResponsibility: 'Render email/password form and call authService.', proposedResponsibility: 'Redirect user to GitHub OAuth and handle the callback.', conceptualChange: 'Replace form with OAuth redirect button.', dependencies: ['src/services/authService.ts'], impact: 'module' },
        { file: 'src/services/authService.ts', reason: 'The auth service must handle OAuth token exchange.', currentResponsibility: 'Call login API and store session token.', proposedResponsibility: 'Handle OAuth callback, exchange code for token, and store JWT.', conceptualChange: 'Add handleOAuthCallback() method.', dependencies: ['src/api/client.ts'], impact: 'cross-module' },
        { file: 'src/controllers/auth-controller.ts', reason: 'The backend auth endpoint must support OAuth token exchange.', currentResponsibility: 'Validate credentials and issue session token.', proposedResponsibility: 'Accept OAuth code, call auth-service exchange, return JWT.', conceptualChange: 'Add OAuth token exchange route.', dependencies: ['src/services/auth-service.ts', 'src/config/auth.ts'], impact: 'cross-module' },
      ],
      changeFlow: ['Task: Change auth', 'LoginPage', 'authService', 'auth-controller', 'auth-service', 'Dependencies', 'Impact', 'Verification'],
      diffPreviews: [
        {
          file: 'src/pages/LoginPage.tsx',
          description: 'Replace email/password form with OAuth redirect',
          before: `export function LoginPage() {\n  const [email, setEmail] = useState('');\n  const [password, setPassword] = useState('');\n\n  const handleSubmit = async (e) => {\n    e.preventDefault();\n    await authService.login(email, password);\n    window.location.href = '/dashboard';\n  };`,
          after: `export function LoginPage() {\n  const handleOAuthLogin = () => {\n    window.location.href = '/api/v1/auth/github';\n  };\n\n  const handleCallback = async () => {\n    const code = new URLSearchParams(window.location.search).get('code');\n    if (code) {\n      await authService.handleOAuthCallback(code);\n      window.location.href = '/dashboard';\n    }\n  };`,
        },
      ],
      verificationPlan: {
        flowsToCheck: ['User clicks OAuth button, is redirected to GitHub, authorizes, and returns to dashboard'],
        componentsToInspect: ['LoginPage.tsx', 'authService.ts', 'auth-controller.ts', 'auth-service.ts', 'config/auth.ts'],
        apiBehavior: 'POST /api/v1/auth/github should accept OAuth code and return JWT',
        errorCases: ['OAuth flow cancelled by user', 'Invalid OAuth code', 'GitHub API unavailable'],
        regressionAreas: ['Existing authenticated sessions should still work until JWT expires', 'Dashboard data loading unaffected'],
      },
    },
    'add-api-field': {
      changeRequest: 'Add a new API field',
      whyChange: {
        problem: 'The dashboard API response does not include the deployment environment label, which is needed to distinguish production vs staging metrics.',
        existingCode: 'The MetricsController returns velocity, pipeline health, burndown, and review data. The environment field exists in the database but is not included in the API response.',
        proposedApproach: 'Add the environment field to the MetricsRecord type, update the controller response, and render it in the Dashboard chart.',
        dependenciesAffected: ['src/types/metrics.ts', 'src/controllers/metrics-controller.ts', 'src/components/Dashboard.tsx', 'src/components/MetricChart.tsx'],
        sideEffects: 'Frontend types must match the new response shape. Charts that display the new field need layout adjustments.',
      },
      filesToModify: [
        { file: 'src/types/metrics.ts', reason: 'Type definitions define the API contract.', currentResponsibility: 'Define MetricsRecord and API response types.', proposedResponsibility: 'Add environment: string field.', conceptualChange: 'Add new field to MetricsRecord interface.', dependencies: [], impact: 'local' },
        { file: 'src/controllers/metrics-controller.ts', reason: 'The controller assembles the API response.', currentResponsibility: 'Return metrics data from query builder.', proposedResponsibility: 'Include the deployment environment in each metric record.', conceptualChange: 'Map environment field from database query result.', dependencies: ['src/db/query-builder.ts'], impact: 'local' },
        { file: 'src/components/Dashboard.tsx', reason: 'The frontend must display the new field.', currentResponsibility: 'Render chart components from metrics data.', proposedResponsibility: 'Pass environment data to chart components.', conceptualChange: 'Add environment prop to MetricChart.', dependencies: ['src/components/MetricChart.tsx'], impact: 'module' },
      ],
      changeFlow: ['Task: Add API field', 'types/metrics.ts', 'metrics-controller.ts', 'Dashboard.tsx', 'Impact', 'Verification'],
      diffPreviews: [
        {
          file: 'src/types/metrics.ts',
          description: 'Add environment field to MetricsRecord type',
          before: 'interface MetricsRecord {\n  source: string;\n  type: "pipeline" | "test" | "deploy";\n  value: number;\n  labels: Record<string, string>;\n  timestamp: Date;\n}',
          after: 'interface MetricsRecord {\n  source: string;\n  type: "pipeline" | "test" | "deploy";\n  value: number;\n  labels: Record<string, string>;\n  timestamp: Date;\n  environment?: string;\n}',
        },
      ],
      verificationPlan: {
        flowsToCheck: ['API response includes environment field', 'Dashboard displays environment label', 'Old metrics without environment render without error'],
        componentsToInspect: ['metrics-controller.ts', 'Dashboard.tsx', 'MetricChart.tsx'],
        apiBehavior: 'GET /api/v1/metrics/dashboard should include environment in each record',
        errorCases: ['Null/undefined environment field', 'Very long environment string'],
        regressionAreas: ['Existing API consumers that do not read the new field', 'Chart rendering unchanged for other fields'],
      },
    },
    'improve-error-handling': {
      changeRequest: 'Improve error handling',
      whyChange: {
        problem: 'API errors return generic 500 statuses without structured details. Frontend error states show a single generic message regardless of the failure type.',
        existingCode: 'Errors in rest-router.ts are caught and passed to Express error middleware. The frontend Dashboard.tsx shows a single error div.',
        proposedApproach: 'Define a structured error response format. Add error codes and field-level details to API responses. Create specific error UI components for different failure types.',
        dependenciesAffected: ['src/api/rest-router.ts', 'src/middleware/validate.ts', 'src/components/Dashboard.tsx', 'src/services/metrics-aggregator.ts'],
        sideEffects: 'All API consumers must handle the new error format. Error translation/display logic becomes more complex.',
      },
      filesToModify: [
        { file: 'src/api/rest-router.ts', reason: 'The central error handler produces all API errors.', currentResponsibility: 'Pass errors to Express error middleware with generic status.', proposedResponsibility: 'Return structured { error, code, details } format.', conceptualChange: 'Add error-catch middleware with structured responses.', dependencies: ['src/middleware/validate.ts'], impact: 'cross-module' },
        { file: 'src/components/Dashboard.tsx', reason: 'The frontend displays error states.', currentResponsibility: 'Show generic error banner when WebSocket fails.', proposedResponsibility: 'Show specific error states for auth, connection, and data errors.', conceptualChange: 'Add error type detection and specific UI states.', dependencies: ['src/hooks/useMetricsStream.ts'], impact: 'module' },
        { file: 'src/services/metrics-aggregator.ts', reason: 'The aggregator demonstrates the per-source error isolation pattern to replicate.', currentResponsibility: 'Catch per-source errors and continue processing others.', proposedResponsibility: 'Produce structured error records for failed sources.', conceptualChange: 'Add error metrics to the batch output.', dependencies: ['src/db/aggregate-writer.ts'], impact: 'local' },
      ],
      changeFlow: ['Task: Improve error handling', 'rest-router.ts', 'Dashboard.tsx', 'aggregator', 'Impact', 'Verification'],
      diffPreviews: [
        {
          file: 'src/api/rest-router.ts',
          description: 'Add structured error response format',
          before: "router.use((err, _req, res, next) => {\n  console.error(err);\n  res.status(500).json({ error: 'Internal server error' });\n});",
          after: "router.use((err, _req, res, next) => {\n  console.error(err);\n  const status = err.status || 500;\n  res.status(status).json({\n    error: err.message || 'Internal server error',\n    code: err.code || 'UNKNOWN_ERROR',\n    details: err.details || null,\n  });\n});",
        },
      ],
      verificationPlan: {
        flowsToCheck: ['API returns structured errors for validation failures', 'API returns structured errors for auth failures', 'Dashboard shows specific error state per failure type'],
        componentsToInspect: ['rest-router.ts', 'Dashboard.tsx', 'metrics-aggregator.ts'],
        apiBehavior: 'All error responses should include error, code, and details fields',
        errorCases: ['Zod validation failure', 'Authentication failure', 'Internal server error', 'Rate-limit exceeded'],
        regressionAreas: ['Frontend still handles the old error format gracefully', 'Success responses unchanged'],
      },
    },
    'add-datasource': {
      changeRequest: 'Add a new data source',
      whyChange: {
        problem: 'A new CI/CD provider (CircleCI) needs to be integrated. Currently only GitHub Actions and GitLab CI adapters exist.',
        existingCode: 'The DataSource interface defines fetchPipelines, fetchTestResults, and fetchDeployments. github-adapter.ts implements it for GitHub Actions.',
        proposedApproach: 'Create circleci-adapter.ts implementing DataSource. Register it in the aggregator. Add the provider type to the API creation flow.',
        dependenciesAffected: ['src/services/data-source.ts', 'src/services/github-adapter.ts', 'src/services/metrics-aggregator.ts', 'src/controllers/data-source-controller.ts'],
        sideEffects: 'The new adapter is polled every cycle along with existing adapters. API rate limits for CircleCI must be respected.',
      },
      filesToModify: [
        { file: 'src/services/circleci-adapter.ts', reason: 'New file implementing the DataSource interface.', currentResponsibility: 'Does not exist yet.', proposedResponsibility: 'Implement fetchPipelines, fetchTestResults, and fetchDeployments for CircleCI API.', conceptualChange: 'Create new adapter file.', dependencies: ['src/services/data-source.ts', 'src/types/metrics.ts'], impact: 'local' },
        { file: 'src/services/metrics-aggregator.ts', reason: 'The aggregator must register the new adapter.', currentResponsibility: 'Maintain source registry with existing adapters.', proposedResponsibility: 'Add CircleCI adapter to the source registry.', conceptualChange: 'Register circleci-adapter instance.', dependencies: ['src/services/circleci-adapter.ts'], impact: 'local' },
        { file: 'src/controllers/data-source-controller.ts', reason: 'The API must accept CircleCI as a valid provider type.', currentResponsibility: 'Accept and persist GitHub and GitLab provider types.', proposedResponsibility: 'Accept CircleCI as a valid provider type.', conceptualChange: 'Add circleci to the allowed provider type list.', dependencies: [], impact: 'local' },
      ],
      changeFlow: ['Task: Add data source', 'circleci-adapter.ts (new)', 'aggregator registry', 'API provider type', 'Impact', 'Verification'],
      diffPreviews: [
        {
          file: 'src/services/metrics-aggregator.ts',
          description: 'Register the new adapter in the aggregator',
          before: "const aggregator = new MetricsAggregator(writer);\nconst githubAdapter = new GitHubAdapter(config.github);\nconst gitlabAdapter = new GitLabAdapter(config.gitlab);\naggregator.registerSource(githubAdapter);\naggregator.registerSource(gitlabAdapter);",
          after: "const aggregator = new MetricsAggregator(writer);\nconst githubAdapter = new GitHubAdapter(config.github);\nconst gitlabAdapter = new GitLabAdapter(config.gitlab);\nconst circleciAdapter = new CircleCIAdapter(config.circleci);\naggregator.registerSource(githubAdapter);\naggregator.registerSource(gitlabAdapter);\naggregator.registerSource(circleciAdapter);",
        },
      ],
      verificationPlan: {
        flowsToCheck: ['CircleCI adapter is registered and polled', 'Data from CircleCI appears in the dashboard', 'Existing GitHub and GitLab adapters still function'],
        componentsToInspect: ['circleci-adapter.ts', 'metrics-aggregator.ts', 'data-source-controller.ts'],
        apiBehavior: 'POST /api/v1/datasources should accept circleci provider type',
        errorCases: ['CircleCI API authentication failure', 'Invalid API key format', 'Rate-limit exceeded'],
        regressionAreas: ['Existing data sources continue to produce data', 'Dashboard aggregation logic unchanged'],
      },
    },
  },
};