import { ResultSection } from "../components/ResultSection";
import { ScreenFrame } from "../components/ScreenFrame";


export function ResultPreviewPage({ onContinue, result }) {
  return (
    <ScreenFrame
      eyebrow="Resultado inicial"
      subtitle="Sua primeira leitura já está pronta. Agora você pode liberar a devolutiva completa."
      title="Você já tem um sinal importante para olhar com mais cuidado"
      tone="warm"
    >
      <ResultSection result={result} />

      <section className="result-panel narrative-panel">
        <div className="panel-heading">
          <p className="panel-kicker">Próximo passo</p>
          <h2>Sua leitura completa está logo depois</h2>
        </div>

        <p>
          Para ver a leitura por eixo, salvar sua devolutiva e receber o resultado completo,
          siga para a próxima etapa.
        </p>
      </section>

      <button className="primary-button" onClick={onContinue} type="button">
        Liberar meu resultado completo
      </button>
    </ScreenFrame>
  );
}
