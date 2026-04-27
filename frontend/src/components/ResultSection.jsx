const BAND_LABELS = {
  baixo: "Baixa compatibilidade",
  sinais: "Sinais de atenção",
  alto: "Alta compatibilidade",
};


export function ResultSection({ result }) {
  return (
    <section className="result-panel result-summary">
      <div className="score-orb">
        <span>Resultado</span>
        <strong>{result.percentageTotal}%</strong>
      </div>

      <div className="result-copy">
        <p className="result-badge">{BAND_LABELS[result.resultBand.key] || "Leitura do teste"}</p>
        <h2>{result.resultBand.headline}</h2>
        <p>{result.resultBand.body}</p>
      </div>
    </section>
  );
}
