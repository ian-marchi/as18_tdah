export function CTASection({ cta, supportingCopy }) {
  return (
    <section className="cta-panel">
      <div className="cta-copy">
        <p className="panel-kicker">Próximo passo</p>
        <h2>{supportingCopy.conversionBridge}</h2>
        <p>{supportingCopy.mapDescription}</p>
      </div>

      <a className="primary-button cta-primary-button" href={cta.href} rel="noreferrer" target="_blank">
        {cta.label}
      </a>

      <p className="inline-note">{supportingCopy.finalImpact}</p>
    </section>
  );
}
