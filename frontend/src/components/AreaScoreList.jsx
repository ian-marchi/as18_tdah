export function AreaScoreList({ areas }) {
  return (
    <section className="result-panel">
      <div className="panel-heading">
        <p className="panel-kicker">Leitura por área</p>
        <h2>Onde o esforço apareceu com mais intensidade</h2>
      </div>

      <div className="area-score-list">
        {areas.map((area) => (
          <article className="area-row" key={area.key}>
            <div className="area-row-header">
              <div>
                <div className="area-heading-row">
                  <h3>{area.label}</h3>
                  <span className="area-band-chip">{area.bandLabel}</span>
                </div>
                <p>{area.description}</p>
              </div>
              <strong>{area.percentage}%</strong>
            </div>

            <div className="area-meter">
              <div className="area-meter-fill" style={{ width: `${area.percentage}%` }} />
            </div>

            {area.insight ? <p className="area-insight">{area.insight}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
