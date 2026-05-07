import { startTransition, useDeferredValue, useEffect, useState } from "react";

import {
  createAdminSession,
  deleteAdminSession,
  fetchAdminSession,
  fetchDashboardData,
  fetchDashboardSubmissions,
  fetchSubmissionDetail,
} from "../lib/api";


const PERIOD_OPTIONS = [
  { key: "day", label: "Dia" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mês" },
];

const LEGACY_OPTIONS = [
  { key: "all", label: "Todos" },
  { key: "exclude", label: "Só completos" },
  { key: "only", label: "Só legado" },
];


function formatDateTime(value) {
  if (!value) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}


function formatPercentage(value) {
  if (typeof value !== "number") {
    return "—";
  }

  return `${value}%`;
}


function DashboardLogin({ errorMessage, isSubmitting, onSubmit }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(email.trim(), password);
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-login-card fade-up">
        <div className="dashboard-login-copy">
          <div className="brand-mark">Painel administrativo</div>
          <p className="hero-home-eyebrow">Acesso restrito</p>
          <h1 className="dashboard-login-title">Entre para visualizar os resultados das usuárias</h1>
          <p className="dashboard-login-subtitle">
            Esta área mostra apenas os dados internos do projeto e não fica visível na página
            pública.
          </p>
        </div>

        <form className="dashboard-login-form" onSubmit={handleSubmit}>
          <label className="field-stack" htmlFor="admin-email">
            <span>E-mail administrativo</span>
            <input
              autoComplete="username"
              className="text-input"
              id="admin-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@admin.com"
              type="email"
              value={email}
            />
          </label>

          <label className="field-stack" htmlFor="admin-password">
            <span>Senha</span>
            <input
              autoComplete="current-password"
              className="text-input"
              id="admin-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              type="password"
              value={password}
            />
          </label>

          {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}

          <button className="primary-button dashboard-login-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Entrando..." : "Entrar no dashboard"}
          </button>
        </form>
      </section>
    </main>
  );
}


function MetricCard({ label, value, tone = "default" }) {
  return (
    <article className={`dashboard-metric-card dashboard-metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}


function VolumeChart({ activePeriod, onChangePeriod, series }) {
  const maxValue = Math.max(...series.map((item) => item.count), 1);

  return (
    <section className="dashboard-card dashboard-volume-card">
      <div className="dashboard-card-header">
        <div>
          <p className="panel-kicker">Volume de testes</p>
          <h2>Quantidade por dia, semana e mês</h2>
        </div>

        <div className="dashboard-segmented-control">
          {PERIOD_OPTIONS.map((option) => (
            <button
              className="dashboard-segment-button"
              data-active={activePeriod === option.key}
              key={option.key}
              onClick={() => onChangePeriod(option.key)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-chart">
        {series.map((item) => (
          <article className="dashboard-chart-column" key={item.key}>
            <div className="dashboard-chart-track">
              <div
                className="dashboard-chart-fill"
                style={{ height: `${Math.max((item.count / maxValue) * 100, item.count ? 10 : 2)}%` }}
              />
            </div>
            <strong>{item.count}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}


function BandDistribution({ items }) {
  return (
    <section className="dashboard-card">
      <div className="dashboard-card-header">
        <div>
          <p className="panel-kicker">Distribuição</p>
          <h2>Faixas de resultado</h2>
        </div>
      </div>

      <div className="dashboard-distribution-list">
        {items.map((item) => (
          <article className="dashboard-distribution-item" key={item.key}>
            <div>
              <strong>{item.label}</strong>
            </div>
            <span>{item.count}</span>
          </article>
        ))}
      </div>
    </section>
  );
}


function SubmissionDirectory({
  items,
  legacyFilter,
  onChangeFilter,
  onSelect,
  query,
  selectedId,
  onChangeQuery,
}) {
  return (
    <section className="dashboard-card dashboard-directory-card">
      <div className="dashboard-card-header">
        <div>
          <p className="panel-kicker">Selecionar usuária</p>
          <h2>Buscar e abrir resultados</h2>
        </div>
      </div>

      <div className="dashboard-directory-toolbar">
        <input
          className="text-input"
          onChange={(event) => onChangeQuery(event.target.value)}
          placeholder="Buscar por nome, e-mail ou telefone"
          type="search"
          value={query}
        />

        <div className="select-field-wrap">
          <select
            className="select-input"
            onChange={(event) => onChangeFilter(event.target.value)}
            value={legacyFilter}
          >
            {LEGACY_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <span aria-hidden="true" className="select-field-chevron">
            {"\u25be"}
          </span>
        </div>
      </div>

      <div className="dashboard-directory-list">
        {items.length === 0 ? (
          <div className="dashboard-empty-state">
            <strong>Nenhuma usuária encontrada</strong>
            <p>Ajuste sua busca ou o filtro para encontrar um registro.</p>
          </div>
        ) : (
          items.map((item) => (
            <button
              className="dashboard-directory-item"
              data-selected={selectedId === item.id}
              key={item.id}
              onClick={() => onSelect(item.id)}
              type="button"
            >
              <div className="dashboard-directory-row">
                <strong>{item.name}</strong>
                {item.isLegacy ? <span className="area-band-chip">Legado</span> : null}
              </div>
              <p>{item.email}</p>
              <div className="dashboard-directory-meta">
                <span>{formatPercentage(item.percentageTotal)}</span>
                <span>{formatDateTime(item.createdAtUtc)}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}


function SubmissionDetail({ isLoading, submission }) {
  if (isLoading) {
    return (
      <section className="dashboard-card dashboard-detail-card">
        <div className="dashboard-empty-state">
          <strong>Carregando resultado...</strong>
          <p>Estamos organizando os dados desta usuária.</p>
        </div>
      </section>
    );
  }

  if (!submission) {
    return (
      <section className="dashboard-card dashboard-detail-card">
        <div className="dashboard-empty-state">
          <strong>Selecione uma usuária</strong>
          <p>Escolha um registro para visualizar o detalhamento completo do teste.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-card dashboard-detail-card">
      <div className="dashboard-card-header">
        <div>
          <p className="panel-kicker">Resultado da usuária</p>
          <h2>{submission.name}</h2>
        </div>
        {submission.isLegacy ? <span className="area-band-chip">Legado</span> : null}
      </div>

      <div className="dashboard-detail-grid">
        <article className="dashboard-detail-panel">
          <h3>Contato</h3>
          <dl className="dashboard-detail-list">
            <div>
              <dt>E-mail</dt>
              <dd>{submission.email}</dd>
            </div>
            <div>
              <dt>Telefone</dt>
              <dd>{submission.phone}</dd>
            </div>
            <div>
              <dt>Faixa etária</dt>
              <dd>{submission.ageRange}</dd>
            </div>
            <div>
              <dt>Data do envio</dt>
              <dd>{formatDateTime(submission.createdAtUtc)}</dd>
            </div>
          </dl>
        </article>

        <article className="dashboard-detail-panel">
          <h3>Resumo do resultado</h3>
          {submission.isLegacy ? (
            <p className="dashboard-legacy-note">
              Este registro foi migrado do histórico antigo. O contato foi preservado, mas o
              resultado completo não estava disponível nos arquivos legados.
            </p>
          ) : (
            <div className="dashboard-score-summary">
              <div className="score-orb dashboard-score-orb">
                <span>Resultado</span>
                <strong>{formatPercentage(submission.percentageTotal)}</strong>
              </div>
              <div className="result-copy">
                <p className="result-badge">{submission.resultBandHeadline || "Resultado geral"}</p>
                <p>
                  Pontuação: {submission.scoreTotal} de {submission.scoreMax}
                </p>
              </div>
            </div>
          )}
        </article>
      </div>

      {!submission.isLegacy && submission.areas?.length ? (
        <div className="dashboard-area-list">
          {submission.areas.map((area) => (
            <article className="dashboard-area-card" key={area.key}>
              <div className="dashboard-directory-row">
                <strong>{area.label}</strong>
                <span className="area-band-chip">{area.bandLabel}</span>
              </div>
              <p>{area.description}</p>
              <div className="area-meter">
                <div className="area-meter-fill" style={{ width: `${area.percentage}%` }} />
              </div>
              <span className="dashboard-area-percentage">{area.percentage}%</span>
              <p className="area-insight">{area.insight}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}


export function DashboardPage() {
  const [authStatus, setAuthStatus] = useState("checking");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [query, setQuery] = useState("");
  const [legacyFilter, setLegacyFilter] = useState("all");
  const [activePeriod, setActivePeriod] = useState("day");
  const [adminEmail, setAdminEmail] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let isActive = true;

    async function bootstrapSession() {
      try {
        const payload = await fetchAdminSession();
        if (!isActive) {
          return;
        }

        setAdminEmail(payload.admin?.email || "");
        setAuthStatus("authenticated");
      } catch (error) {
        if (!isActive) {
          return;
        }

        setAuthStatus("anonymous");
      }
    }

    bootstrapSession();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      return;
    }

    let isActive = true;

    async function loadDashboard() {
      try {
        const [summaryPayload, submissionsPayload] = await Promise.all([
          fetchDashboardData(),
          fetchDashboardSubmissions({
            query: deferredQuery,
            legacy: legacyFilter,
          }),
        ]);

        if (!isActive) {
          return;
        }

        const submissionItems = submissionsPayload.items || [];
        setDashboardData(summaryPayload);
        setSubmissions(submissionItems);

        const nextSelectedId = submissionItems[0]?.id || null;
        setSelectedSubmissionId((currentValue) => {
          if (currentValue && submissionItems.some((item) => item.id === currentValue)) {
            return currentValue;
          }

          return nextSelectedId;
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setAuthError(error.message || "Não consegui carregar a dashboard agora.");
      }
    }

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, [authStatus, deferredQuery, legacyFilter]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !selectedSubmissionId) {
      setSelectedSubmission(null);
      return;
    }

    let isActive = true;
    setIsLoadingDetail(true);

    async function loadSubmissionDetail() {
      try {
        const payload = await fetchSubmissionDetail(selectedSubmissionId);
        if (!isActive) {
          return;
        }

        setSelectedSubmission(payload);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setAuthError(error.message || "Não consegui carregar os detalhes da usuária.");
      } finally {
        if (isActive) {
          setIsLoadingDetail(false);
        }
      }
    }

    loadSubmissionDetail();

    return () => {
      isActive = false;
    };
  }, [authStatus, selectedSubmissionId]);

  async function handleLogin(email, password) {
    setAuthError("");
    setIsLoggingIn(true);

    try {
      const payload = await createAdminSession(email, password);
      setAdminEmail(payload.admin?.email || email);
      setAuthStatus("authenticated");
    } catch (error) {
      setAuthError(error.message || "Não foi possível entrar no dashboard.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleLogout() {
    try {
      await deleteAdminSession();
    } finally {
      setDashboardData(null);
      setSubmissions([]);
      setSelectedSubmission(null);
      setSelectedSubmissionId(null);
      setAuthStatus("anonymous");
    }
  }

  function handleSelectSubmission(submissionId) {
    startTransition(() => {
      setSelectedSubmissionId(submissionId);
    });
  }

  if (authStatus === "checking") {
    return (
      <main className="dashboard-shell">
        <section className="dashboard-login-card fade-up">
          <div className="dashboard-empty-state">
            <strong>Verificando acesso...</strong>
            <p>Estamos preparando o painel administrativo.</p>
          </div>
        </section>
      </main>
    );
  }

  if (authStatus !== "authenticated") {
    return (
      <DashboardLogin
        errorMessage={authError}
        isSubmitting={isLoggingIn}
        onSubmit={handleLogin}
      />
    );
  }

  const volumeSeries = dashboardData?.volume?.[activePeriod] || [];

  return (
    <main className="dashboard-shell">
      <section className="dashboard-page fade-up">
        <header className="dashboard-header">
          <div>
            <div className="brand-mark">Dashboard</div>
            <h1>Visão administrativa do projeto</h1>
            <p>{adminEmail}</p>
          </div>

          <button className="ghost-button" onClick={handleLogout} type="button">
            Sair
          </button>
        </header>

        {authError ? <p className="error-banner">{authError}</p> : null}

        <section className="dashboard-metrics-grid">
          <MetricCard label="Total de testes" value={dashboardData?.totals?.all ?? 0} tone="primary" />
          <MetricCard label="Hoje" value={dashboardData?.totals?.today ?? 0} />
          <MetricCard label="Semana atual" value={dashboardData?.totals?.week ?? 0} />
          <MetricCard label="Mês atual" value={dashboardData?.totals?.month ?? 0} />
        </section>

        <section className="dashboard-summary-grid">
          <VolumeChart
            activePeriod={activePeriod}
            onChangePeriod={setActivePeriod}
            series={volumeSeries}
          />
          <BandDistribution items={dashboardData?.bandDistribution || []} />
        </section>

        <section className="dashboard-content-grid">
          <SubmissionDirectory
            items={submissions}
            legacyFilter={legacyFilter}
            onChangeFilter={setLegacyFilter}
            onChangeQuery={setQuery}
            onSelect={handleSelectSubmission}
            query={query}
            selectedId={selectedSubmissionId}
          />
          <SubmissionDetail isLoading={isLoadingDetail} submission={selectedSubmission} />
        </section>
      </section>
    </main>
  );
}
