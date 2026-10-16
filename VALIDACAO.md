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

## Atualização — prancha inteira na tela e arco-íris

- Layout alterado para ocupar a altura disponível com `100dvh`, sem redimensionar artificialmente a página por zoom. Campo 3D, título e controles permanecem na mesma tela.
- As quatro colunas de texto foram preservadas em **Notas da prancha**, um painel sobreposto com fonte maior e rolagem interna quando necessário. O botão informa o estado de expansão; `Esc` fecha o painel.
- Verificados os tamanhos 1920 × 1080, 1440 × 900, 1366 × 768, 768 × 1024, 390 × 844, 320 × 568 e 844 × 390. Em todos, a largura e altura de rolagem do documento coincidem com o viewport; todos os botões estão dentro da tela. Abertura, fechamento por `Esc` e limites do painel também conferidos nos sete tamanhos.
- Inspeção visual em desktop e celular emulado após o ajuste. Arquivos locais: `.qa/viewport-rainbow-1440.png`, `.qa/viewport-rainbow-390.png` e `.qa/viewport-results.json`.
- Iridescência reforçada por variação de espessura, luzes de área adicionais e modulação artística da luz especular, dependente do ângulo de visão. A textura original, transmissão e transparência foram preservadas. Sem emissão ou bloom.
- Console sem erros de execução ou compilação de shader durante os sete carregamentos. Build TypeScript/Vite concluído com sucesso.
- Build de produção servido na porta 4175: pausa interrompe quadros, nervuras alternam, seta gira e restaurar vista retorna a zero; nenhum erro no console. Captura: `.qa/viewport-rainbow-production.png`.

## Atualização — arco-íris mais destacado

Reflexos ampliados em faixas largas: o espectro usa a normal original da superfície, separado das nervuras finas, e uma amostra suave do ambiente de estúdio acrescenta reflexão colorida sobre a membrana. A luz branca de área foi alargada e há um realce em ciano. A contribuição continua ligada à iluminação e ao ângulo de visão; não há emissão, bloom, alteração de geometria ou aumento de opacidade.

Inspeção visual executada em 1440 × 900 e 390 × 844, além de uma vista girada por teclado. Alternância das nervuras e restauração da vista conferidas. Nenhum erro no console ou na compilação do shader; build TypeScript/Vite aprovado. No celular, o documento continua com 390 × 844, sem rolagem. Capturas: `.qa/rainbow-intense-desktop.png`, `.qa/rainbow-intense-angle.png` e `.qa/rainbow-intense-mobile.png`.

## Atualização — halo iridescente ao redor da flor

Um canvas 2D decorativo, sem acesso por foco e oculto da árvore de acessibilidade, recebe uma cópia de baixa resolução do quadro WebGL real. Desfoque suave, saturação e composição de tela espalham as cores ligeiramente além do contorno. O efeito acompanha o próprio modelo e não depende de imagem estática ou renderização 3D adicional. Limite de 512 px no maior lado, reduzido a 256 px no celular/modo econômico. Os materiais e a geometria não foram alterados para gerar o halo.

Inspeção visual executada em desktop 1440 × 900 e celular emulado 390 × 844. Halo confirmado acompanhando a rotação; nervuras alternadas e vista restaurada. No celular, o halo mediu 154 × 256 px e a prancha continuou sem rolagem. Perda de contexto simulada limpa o halo; nova tentativa recupera a flor com apenas um canvas de halo. Console sem erros nos carregamentos e build TypeScript/Vite aprovado. Capturas locais: `.qa/rainbow-halo-desktop.png` e `.qa/rainbow-halo-mobile.png`.

Verificação adicional com `prefers-reduced-motion: reduce`: renderização estabilizada em um único quadro; leituras sucessivas do halo estabilizado permaneceram iguais.

## Estado da publicação

O Sites havia retornado o identificador `appgprj_6ad22fe9fc7c8191b0713e44094dc454` na criação. Na retomada, a consulta desse mesmo identificador retornou `NOT_FOUND / project_not_found`. A identidade foi preservada em `.openai/hosting.json`; não foi criado outro projeto para contornar o erro. Nenhum deploy foi confirmado. O código e o build estático estão disponíveis localmente, com execução documentada no README.
