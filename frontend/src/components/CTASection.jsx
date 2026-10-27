export function CTASection({ cta, supportingCopy }) {
  return (
    <section className="cta-panel">
      <div className="cta-copy">
        <p className="panel-kicker">Próximo passo</p>
        <h2>{supportingCopy.conversionBridge}</h2>
        <p>{supportingCopy.nextStepDescription}</p>
      </div>

      <a className="primary-button cta-primary-button" href={cta.href} rel="noopener noreferrer" target="_blank">
        {cta.label}
        <span className="sr-only"> (abre em nova aba)</span>
      </a>

      <p className="inline-note">{supportingCopy.finalImpact}</p>
    </section>
  );
}
