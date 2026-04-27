const TRUST_POINTS = [
  "Privado e confidencial",
  "Leitura clara em poucos minutos",
  "Sem julgamento, sem certo ou errado",
];

const PREMIUM_FEATURES = [
  {
    title: "Feito para mulheres adultas",
    text: "Uma experiência pensada para reconhecer nuances que costumam passar despercebidas por muito tempo.",
  },
  {
    title: "Linguagem acolhedora",
    text: "Sem frieza clínica e sem superficialidade. O foco é te ajudar a se reconhecer com mais clareza.",
  },
  {
    title: "Um primeiro passo real",
    text: "Você termina com uma leitura objetiva, sensível e pronta para te direcionar ao próximo movimento.",
  },
];

const WELCOME_STILL_LIFE_SRC = `${import.meta.env.BASE_URL}welcome-still-life.png`;


export function WelcomePage({ screens, onStart }) {
  return (
    <main className="app-shell hero-home-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <div className="ambient hero-ambient-center" />

      <section className="hero-home-card fade-up">
        <div className="hero-home-grid">
          <div className="hero-home-copy">
            <div className="brand-mark hero-brand-mark">Neurodivergência Feminina</div>
            <p className="hero-home-eyebrow">{screens.welcome.eyebrow}</p>

            <h1 className="hero-home-title">{screens.welcome.title}</h1>
            <p className="hero-home-subtitle">{screens.welcome.subtitle}</p>

            <div className="hero-home-divider" />

            <p className="hero-home-support">
              Um teste breve, sensível e bem guiado para revelar padrões que muitas
              mulheres carregam por dentro durante anos, sem conseguir nomear.
            </p>

            <div className="hero-home-actions">
              <button className="primary-button hero-home-button" onClick={onStart} type="button">
                {screens.welcome.cta}
              </button>
            </div>

            <div className="hero-home-trustline" aria-label="Diferenciais da experiência">
              {TRUST_POINTS.map((point) => (
                <span className="hero-home-trustitem" key={point}>
                  {point}
                </span>
              ))}
            </div>
          </div>

          <aside className="hero-visual-column" aria-label="Painel visual da experiência">
            <div className="hero-visual-frame">
              <img
                alt="Vaso escultural em composição editorial suave e acolhedora."
                className="hero-visual-image"
                src={WELCOME_STILL_LIFE_SRC}
              />

              <div className="hero-quote-card">
                <p className="hero-quote-copy">
                  Talvez o problema nunca tenha sido falta de esforço. Talvez tenha
                  faltado uma leitura mais gentil do seu jeito de funcionar.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="hero-feature-grid">
          {PREMIUM_FEATURES.map((feature) => (
            <article className="hero-feature-card" key={feature.title}>
              <span className="hero-feature-orb" aria-hidden="true" />
              <div className="hero-feature-copy">
                <h2>{feature.title}</h2>
                <p>{feature.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
