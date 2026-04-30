import { AreaScoreList } from "../components/AreaScoreList";
import { CTASection } from "../components/CTASection";
import { ResultSection } from "../components/ResultSection";
import { ScreenFrame } from "../components/ScreenFrame";


export function ResultPage({ result, onRestart }) {
  return (
    <ScreenFrame
      eyebrow="Leitura do seu resultado"
      subtitle={result.supportingCopy.coreMessage}
      title="O que esse padrão pode estar tentando te mostrar"
      tone="warm"
    >
      <div className="result-layout">
        <ResultSection result={result} />
        <AreaScoreList areas={result.areas} />
      </div>

      {result.supportingCopy.closingReflection ? (
        <section className="result-panel narrative-panel">
          <div className="panel-heading">
            <p className="panel-kicker">Fechamento</p>
            <h2>Talvez o esforço faça mais sentido agora</h2>
          </div>

          <p>{result.supportingCopy.closingReflection}</p>
        </section>
      ) : null}

      <section className="result-panel narrative-panel">
        <div className="panel-heading">
          <p className="panel-kicker">Importante</p>
          <h2>Contexto e cuidado antes do próximo passo</h2>
        </div>

        <p>{result.supportingCopy.disclaimer}</p>
      </section>

      <CTASection cta={result.cta} supportingCopy={result.supportingCopy} />

      <button className="ghost-button" onClick={onRestart} type="button">
        Voltar para o início
      </button>
    </ScreenFrame>
  );
}
