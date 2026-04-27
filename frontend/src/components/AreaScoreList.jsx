export function AreaScoreList({ areas }) {
  return (
    <section className="result-panel">
      <div className="panel-heading">
        <p className="panel-kicker">Leitura por area</p>
        <h2>Onde o esforco apareceu com mais intensidade</h2>
      </div>

      <div className="area-score-list">
        {areas.map((area) => (
          <article className="area-row" key={area.key}>
            <div className="area-row-header">
              <div>
                <h3>{area.label}</h3>
                <p>{area.description}</p>
              </div>
              <strong>{area.percentage}%</strong>
            </div>

            <div className="area-meter">
              <div className="area-meter-fill" style={{ width: `${area.percentage}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

