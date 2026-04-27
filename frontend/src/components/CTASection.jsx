export function CTASection({ cta, supportingCopy }) {
  const isPlaceholder = cta.href.includes("seu-link-do-mapa-aqui");

  return (
    <section className="cta-panel">
      <div className="cta-copy">
        <p className="panel-kicker">Proximo passo</p>
        <h2>{supportingCopy.conversionBridge}</h2>
        <p>{supportingCopy.mapDescription}</p>
      </div>

      <a className="primary-button" href={cta.href} rel="noreferrer" target="_blank">
        {cta.label}
      </a>

      <p className="inline-note">{supportingCopy.finalImpact}</p>
      {isPlaceholder ? (
        <p className="dev-note">
          Atualize o link real do MAPA em <code>conteudo/quiz-config.json</code> antes de publicar.
        </p>
      ) : null}
    </section>
  );
}

