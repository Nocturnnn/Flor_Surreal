# TRANSPARÊNCIA

Uma prancha editorial interativa de botânica especulativa. O site usa o **Flor_Translucida.glb fornecido**, sem substituir a flor por uma imagem. A composição tem formato de atlas: campo de observação contínuo, linhas técnicas, notas marginais e diagrama radial. A prancha se adapta à altura disponível (`100dvh`), mantendo a flor completa e os controles na tela, sem rolagem da página. As legendas longas ficam em **Notas da prancha**, um painel sobreposto com rolagem própria e texto legível. Use o mesmo botão ou `Esc` para fechar.

## Instalar e executar

Requer Node.js 22.12 ou superior e npm.

```sh
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite, normalmente `http://127.0.0.1:5173/`.

```sh
npm run build
npm run preview
```

O build estático é gerado em `dist/`. Para hospedagem, publique esse diretório. Fontes, textura e modelo são servidos localmente; não há dependência de um serviço externo para a experiência.

## Estrutura

- `src/App.tsx`: composição editorial e controles acessíveis em HTML.
- `src/FlowerScene.tsx`: carregamento do GLB, materiais físicos, iluminação, câmera e interação.
- `src/styles.css`: prancha, margens, tipografia e adaptações responsivas.
- `public/models/Flor_Translucida.glb`: arquivo original, copiado sem alteração.

## Interação

- Arraste horizontalmente ou verticalmente com o mouse para inspecionar o conjunto. Os ângulos são limitados para conservar o enquadramento.
- No celular, arraste horizontalmente para girar; o gesto vertical continua disponível para percorrer a prancha.
- Com o canvas em foco, use as setas para girar e `Home` para restaurar a vista.
- **Pausar movimento** interrompe a flutuação automática; a inspeção manual continua disponível.
- **Exibir nervuras** alterna a visibilidade da peça original `Nervuras_Finas`.
- **Restaurar vista** retorna à orientação e ao enquadramento iniciais.
- **Notas da prancha** abre as quatro colunas editoriais sobre a composição, sem mudar o enquadramento. `Esc` fecha o painel.
- O rodapé permite baixar o mesmo arquivo GLB usado na cena.

## Modelo, materiais e limites da referência

O carregamento confirma os seis nomes reais antes de usá-los: `Petalas_Iridescentes`, `Folhas_Translucidas`, `Caule_e_Sepalas`, `Estames_e_Pistilo`, `Anteras_Peroladas` e `Nervuras_Finas`. São 50.576 triângulos. O arquivo inclui uma textura de cor embutida e as extensões `KHR_materials_transmission`, `KHR_materials_ior` e `KHR_materials_clearcoat`. O GLTFLoader utilizado também suporta `KHR_materials_iridescence`; essa extensão não está no arquivo e a iridescência é acrescentada aos materiais físicos carregados.

Os materiais são clonados a partir dos originais e a textura de cor é preservada. Mapas procedurais de espessura óptica e normal acrescentam variação à película, sem deformar ou substituir a geometria. Transmissão, refração, iridescência, reflexão e transparência são combinadas para aproximar a aparência de uma membrana. Uma modulação artística do shader acentua as faixas de arco-íris somente na luz especular refletida, em função da espessura da película e do ângulo de visão. Ela não altera a opacidade nem acrescenta emissão. Um halo suave estende as cores reais do quadro para fora do contorno: uma cópia em canvas 2D de baixa resolução recebe desfoque e saturação em CSS, sem renderizar o modelo uma segunda vez. O halo acompanha a rotação, a visibilidade das peças e a pausa da cena.

Uma cena separada de estúdio, com grandes superfícies luminosas em ciano, azul, violeta, rosa e branco, gera o ambiente de reflexão por PMREM. O fundo da prancha permanece quase preto. A câmera olha pela face +Z, onde estão os estames e as anteras, e calcula a distância a partir dos vértices reais transformados e dos limites do modelo.

**A geometria fornecida tem pétalas mais pontudas, menos onduladas e uma disposição de folhas diferente da imagem de referência.** Assim, a silhueta não é idêntica à fotografia. O arquivo não possui rig, morph targets ou animações; somente o conjunto recebe rotação e flutuação suaves. O pequeno diagrama no canto é um esquema radial em SVG, identificado como tal, não uma segunda flor substituindo o GLB.

## Desempenho e acessibilidade

- Resolução limitada a 1,75×; em celulares ou dispositivos de menor capacidade, 1,5× e ambiente PMREM de menor resolução.
- Sem passes de pós-processamento WebGL ou sombras em tempo real. O halo reutiliza o quadro renderizado, com no máximo 512 px no maior lado (256 px no modo econômico), e acompanha a mesma pausa de renderização.
- O desenho para quando a aba fica oculta ou a cena sai da tela. Quando o movimento é pausado ou reduzido pelo sistema, só redesenha por interação ou redimensionamento.
- `prefers-reduced-motion` desliga a flutuação e a inclinação automática.
- Carregamento, falha do modelo, indisponibilidade do WebGL e perda de contexto têm mensagens HTML e opção de tentar novamente.
- Textos, botões, estados e download ficam fora do canvas. Há foco visível e link para pular até os controles.

## Validação

As verificações de navegador executadas e seus limites são registrados em `VALIDACAO.md`.
