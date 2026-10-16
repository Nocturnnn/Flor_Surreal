# Validação executada — 16/10/2026

## Ambiente

Windows, Node.js 24.11.0, npm e Google Chrome instalado, controlado por Playwright em modo headless. As telas móveis e tablet foram emuladas; não houve teste em aparelho físico, Safari ou Firefox.

## Resultados

- `npm install`: dependências instaladas; auditoria da instalação sem vulnerabilidades reportadas.
- `npm run build`: TypeScript e Vite concluíram com sucesso.
- Build servido com `npm run preview` na porta 4173: carregamento do GLB e alternância de nervuras confirmados, sem erros no console. Tela estreita de 320 × 740 também verificada sem rolagem horizontal.
- GLB carregado por GLTFLoader, com as seis peças esperadas e 50.576 triângulos.
- SHA-256 do arquivo em `public/models/` idêntico ao original em Downloads: `830C54BA1534150589556905236CE3FFABD5F3F29AF67C09AA002AC4E91CD808`.
- Inspeção visual por capturas em desktop (1440 × 1000), tablet (768 × 1024) e celular (390 × 844). Sem rolagem horizontal nos três tamanhos.
- Console da versão final: nenhum erro de execução no carregamento normal em desktop; o carregamento normal móvel também foi verificado sem erros.
- Pausar movimento: estado alterado e contador de quadros estabilizado. Retomar: animação reiniciada.
- Nervuras: visibilidade desligada e religada pelo botão; controles também acionados na emulação móvel.
- Teclado: seta direita altera a rotação; restaurar vista retorna a `0.000,0.000`.
- Arraste com mouse: rotação alterada. Gesto de toque horizontal via Chrome DevTools Protocol também altera a rotação no celular emulado.
- Download: arquivo recebido com o nome `Flor_Translucida.glb`.
- `prefers-reduced-motion: reduce`: inicia pausado e não mantém renderização contínua.
- Visibilidade: evento de aba oculta simulado, com pausa confirmada pelo contador de quadros e retomada ao retornar. Essa verificação usou a propriedade de visibilidade simulada, não uma medição de energia de uma aba real em segundo plano.
- Falha de rede do GLB simulada: mensagem HTML clara; após remover o bloqueio, **Tentar novamente** carrega a flor.
- WebGL indisponível simulado: mensagem HTML de indisponibilidade e botão de nova tentativa.
- Evento de perda de contexto gráfico simulado: mensagem de recuperação apresentada. Não foi provocada uma falha física de GPU.

Capturas e resultados técnicos estão na pasta local ignorada `.qa/`.

## Fidelidade visual

A versão final é uma prancha editorial vertical contínua, sem menu, cartões ou seções de landing page. A imagem é usada como direção de composição e atmosfera. A flor principal é sempre o GLB fornecido. As pétalas pontudas e a disposição das folhas do arquivo diferem da referência, portanto o resultado não é uma reprodução idêntica da silhueta. O diagrama radial é identificado como esquema sem escala.

## Publicação

O Sites havia retornado o identificador `appgprj_6ad22fe9fc7c8191b0713e44094dc454` na criação. Na retomada, a consulta desse mesmo identificador retornou `NOT_FOUND / project_not_found`. A identidade foi preservada em `.openai/hosting.json`; não foi criado outro projeto para contornar o erro. Nenhum deploy foi confirmado. O código e o build estático estão disponíveis localmente, com execução documentada no README.
