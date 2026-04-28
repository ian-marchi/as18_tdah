export function ScreenFrame({
  eyebrow,
  title,
  subtitle,
  children,
  footer = null,
  cardClassName = "",
  tone = "default",
}) {
  const sectionClassName = ["screen-card", "fade-up", cardClassName].filter(Boolean).join(" ");

  return (
    <main className={`app-shell tone-${tone}`}>
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <section className={sectionClassName}>
        <div className="brand-mark">Neurodivergência Feminina</div>

        <header className="screen-header">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 className="display-title">{title}</h1>
          {subtitle ? <p className="display-subtitle">{subtitle}</p> : null}
        </header>

        <div className="screen-body">{children}</div>

        {footer ? <footer className="screen-footer">{footer}</footer> : null}
      </section>
    </main>
  );
}
