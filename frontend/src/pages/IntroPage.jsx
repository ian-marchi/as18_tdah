import { ScreenFrame } from "../components/ScreenFrame";


const INTRO_POINTS = [
  "Responda pensando em como isso aparece no seu dia a dia.",
  "Não existe certo ou errado. O foco é identificação, não perfeição.",
  "Essa leitura é psicoeducativa e não substitui avaliação clínica, neuropsicológica ou psiquiátrica.",
];


export function IntroPage({ screens, onContinue }) {
  return (
    <ScreenFrame
      eyebrow="Respire antes de começar"
      subtitle={screens.intro.body}
      title={screens.intro.title}
      footer={
        <button className="primary-button" onClick={onContinue} type="button">
          {screens.intro.cta}
        </button>
      }
      tone="soft"
    >
      <div className="intro-list">
        {INTRO_POINTS.map((point) => (
          <article className="guidance-card" key={point}>
            <span className="guidance-index" />
            <p>{point}</p>
          </article>
        ))}
      </div>
    </ScreenFrame>
  );
}
