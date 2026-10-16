import { useCallback, useState } from 'react'
import FlowerScene from './FlowerScene'
import type { SceneInfo } from './FlowerScene'

function PlateDrawing() {
  return <svg className="plate-drawing" viewBox="0 0 1000 1100" preserveAspectRatio="none" fill="none" aria-hidden="true">
    <g className="construction-lines">
      <path d="M16 15V1080H984V15M42 270H956V820H42ZM500 7V1055M10 450H990M23 627H978M78 890L201 110L862 750L82 890ZM130 387L875 108L664 1010ZM284 65L901 383L166 681Z" />
      <path d="M196 290L829 61L756 897L181 951ZM73 490V170H918V962H73ZM366 77H650M366 1024H650M265 200L810 646M237 693L791 201" />
      <circle cx="500" cy="383" r="278" /><ellipse cx="500" cy="383" rx="252" ry="266" />
      <path strokeDasharray="3 6" d="M500 37C930 63 970 705 500 733C40 717 56 60 500 37Z" />
      <path d="M800 53H941M864 39V113M819 53L864 99V53M864 99H916V53M823 116H941M48 954H116V987H48ZM169 948H232V1009H169ZM156 974H268V1041H156M196 926V1065M109 1037H152M110 1037V998M89 1041V1018M77 1041V1025" />
      <path d="M676 824H955V1057H676ZM688 837H944V1046H688M704 850H928V1031H704M676 874H955M676 1009H955M718 824V1057M906 824V1057" />
    </g>
    <g className="measurement-lines">
      <path d="M29 30V1010M972 29V1061M75 1071H952" />
      {Array.from({ length: 56 }, (_, i) => <path key={i} d={`M${i % 5 === 0 ? 20 : 25} ${45 + i * 17}H30M970 ${45 + i * 17}H${i % 5 === 0 ? 981 : 976}`} />)}
      {Array.from({ length: 45 }, (_, i) => <path key={i} d={`M${80 + i * 19} 1070V${i % 5 === 0 ? 1079 : 1075}`} />)}
      {[['42','170'],['956','170'],['42','820'],['956','820'],['500','450'],['196','290'],['756','897']].map(([x,y]) => <g key={`${x}${y}`} transform={`translate(${x} ${y})`}><path d="M-6 0H6M0-6V6" /><circle r="2" /></g>)}
    </g>
  </svg>
}

function Topology() {
  return <svg viewBox="0 0 200 200" className="topology-svg" fill="none" aria-hidden="true">
    <g className="topology-grid"><path d="M12 12H188V188H12ZM0 100H200M100 0V200M20 20H180V180H20ZM50 12V188M150 12V188M12 50H188M12 150H188" /><circle cx="100" cy="100" r="84" /><circle cx="100" cy="100" r="57" /></g>
    {[0,72,144,216,288].map(angle => <g key={angle} transform={`rotate(${angle} 100 100)`}>
      <path className="petal-outline" d="M100 100C84 84 54 65 62 37C65 26 77 31 83 23C90 14 94 24 100 17C106 24 110 14 117 23C123 31 135 26 138 37C146 65 116 84 100 100Z" />
      {Array.from({length:11},(_,i) => <path key={i} className="topology-vein" d={`M100 100Q${66+i*6.8} 67 ${65+i*7} ${37-Math.sin(i/10*Math.PI)*17}`} />)}
      {[.28,.44,.6,.76].map((scale,i) => <path key={i} className="topology-vein" d={`M${100-38*scale} ${100-68*scale}Q100 ${100-90*scale} ${100+38*scale} ${100-68*scale}`} />)}
    </g>)}
    <circle className="petal-outline" cx="100" cy="100" r="10" /><circle className="petal-outline" cx="100" cy="100" r="4" />
  </svg>
}

function Instrument({ type }: { type: 'wave' | 'angles' | 'scale' }) {
  return <svg viewBox="0 0 130 46" className="instrument" fill="none" aria-hidden="true">
    {type === 'wave' && <><path d="M0 23H130M2 6V42M128 6V42" /><path d="M2 23Q9-6 16 23T30 23T44 23T58 23T72 23T86 23T100 23T114 23T128 23" /><path d="M2 23Q16 0 30 23T58 23T86 23T114 23" /></>}
    {type === 'angles' && <><path d="M12 39H120M24 42V4M24 39L86 7L101 39ZM86 7V39M24 39L113 21M79 39A55 55 0 0 0 71 16" /><circle cx="24" cy="39" r="2" /></>}
    {type === 'scale' && <><path d="M2 32H128M2 12V37M128 12V37M65 12V37" />{Array.from({length:25},(_,i)=><path key={i} d={`M${5+i*5} 32V${i%5===0?15:24}`} />)}</>}
  </svg>
}

function ControlIcon({ kind }: { kind: 'pause' | 'play' | 'veins' | 'reset' }) {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true">
    {kind==='pause' && <path d="M5 3V13M11 3V13" />}
    {kind==='play' && <path d="M5 3L12 8L5 13Z" />}
    {kind==='veins' && <path d="M3 13C0 5 7 2 13 2C14 9 11 15 3 13ZM3 13L11 4M7 9V5M7 9H11" />}
    {kind==='reset' && <path d="M3 6A5.2 5.2 0 1 1 3 11M3 2V6H7" />}
  </svg>
}

export default function App() {
  const [paused,setPaused]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [veins,setVeins]=useState(true)
  const [reset,setReset]=useState(0)
  const [info,setInfo]=useState<SceneInfo|null>(null)
  const onReady=useCallback((value:SceneInfo)=>setInfo(value),[])
  return <main className="editorial-plate" aria-labelledby="plate-title">
    <a className="skip-link" href="#specimen-controls">Ir para os controles</a>
    <header className="plate-masthead"><span className="archive-id">HERBARIUM / FUTURA</span><h1 id="plate-title">TRANSPARÊNCIA</h1><span className="plate-id">PRANCHA 001 — ESTUDO DIGITAL</span></header>
    <div className="observation-field">
      <PlateDrawing />
      <FlowerScene paused={paused} veins={veins} selected={null} reset={reset} onReady={onReady} />
      <aside className="field-block specimen-register" aria-label="Identificação do espécime"><span className="micro-heading">REGISTRO BOTÂNICO / 001</span><h2>Espécime 001</h2><p className="latin-name">Flora translucida</p><dl><div><dt>DOMÍNIO</dt><dd>Botânica especulativa</dd></div><div><dt>MATÉRIA</dt><dd>Membrana iridescente</dd></div><div><dt>ESTADO</dt><dd>Translúcido / digital</dd></div></dl><span className="register-rule" /><span className="micro-heading">FORMA VIRTUAL. LUZ EM TRÂNSITO.</span></aside>
      <aside className="field-block optical-register" aria-label="Dados ópticos"><Instrument type="angles" /><span className="micro-heading">ANÁLISE DE SUPERFÍCIE</span><dl><div><dt>TRANSMISSÃO</dt><dd>0.91</dd></div><div><dt>REFRAÇÃO / IOR</dt><dd>1.36</dd></div><div><dt>IRIDESCÊNCIA</dt><dd>0.92</dd></div></dl><div className="spectral-line" aria-hidden="true" /><div className="spectral-label" aria-hidden="true"><span>380</span><span>λ / nm</span><span>780</span></div></aside>
      <span className="figure-label label-membrane" aria-hidden="true">FIG. A / MEMBRANA<br /><i />PELÍCULA ÓPTICA</span>
      <span className="figure-label label-core" aria-hidden="true">02 / ANDROCEU<i /></span>
      <span className="figure-label label-stem" aria-hidden="true">EIXO ESTRUTURAL<br />Y + / 00.000<i /></span>
      <div className="left-marginalia" aria-hidden="true"><span>MORFOLOGIA / SECÇÃO LONGITUDINAL</span><span>01 — 06</span></div>
      <div className="right-marginalia" aria-hidden="true">OBSERVAÇÃO NÃO INVASIVA / SUPERFÍCIE CONTÍNUA</div>
      <aside className="field-block lower-register" aria-label="Nota sobre o espécime"><span className="micro-heading">OBS. 001 / LUZ INCIDENTE</span><p>A cor não pertence à superfície.<br />Acontece entre a matéria e o olhar.</p><Instrument type="wave" /><div className="coordinate-table" aria-hidden="true"><span>X &nbsp;+ 00.000</span><span>Y &nbsp;+ 00.000</span><span>Z &nbsp;+ FRONTAL</span></div><Instrument type="scale" /></aside>
      <figure className="topology-figure"><figcaption><span>FIG. B — ORGANIZAÇÃO RADIAL</span><span>VISTA ESQUEMÁTICA</span></figcaption><div className="topology-frame"><Topology /><span className="topology-cross top-left">+</span><span className="topology-cross bottom-right">+</span></div><div className="topology-caption"><span>PENTAMERIA / 5 LOBOS</span><span>SEM ESCALA</span></div></figure>
      <div className="field-baseline" aria-hidden="true"><span>SPECIMEN_001</span><span>0 &nbsp;— &nbsp;1 &nbsp;— &nbsp;2 &nbsp;— &nbsp;3 &nbsp;— &nbsp;4 &nbsp;— &nbsp;5 &nbsp;— &nbsp;6</span><span>AXONOMETRIA / Z+</span></div>
    </div>

    <footer className="plate-colophon">
      <div className="colophon-ruler" aria-hidden="true">{Array.from({length:30},(_,i)=><span key={i}>{String(i*10).padStart(3,'0')}</span>)}</div>
      <div className="editorial-columns">
        <section><h2>01 / TRANSPARÊNCIA</h2><p>Um herbário do que ainda não existe. Este espécime propõe outra natureza: delicada, sintética, atravessada pela luz.</p><p>Estudo artístico de botânica especulativa. Não representa uma espécie real.</p><span className="column-code">ARQUIVO VIRTUAL — VOL. 01</span></section>
        <section><h2>02 / MORFOLOGIA</h2><p>Pétalas iridescentes. Folhas translúcidas. Caule e sépalas. Estames e pistilo. Anteras peroladas. Nervuras finas.</p><dl className="colophon-data"><div><dt>COMPONENTES</dt><dd>{info?.parts.length.toString().padStart(2,'0')??'—'}</dd></div><div><dt>TRIÂNGULOS</dt><dd>{info?.triangles.toLocaleString('pt-BR')??'—'}</dd></div></dl></section>
        <section><h2>03 / COMPORTAMENTO ÓPTICO</h2><p>Uma película fina refrata e reflete o ambiente. Ciano, azul, violeta e rosa emergem conforme a incidência da luz e o ângulo de observação.</p><p>Transmissão · iridescência · clearcoat<br />Refração da membrana / IOR 1.36</p><span className="column-code">λ / ESPECTRO VISÍVEL</span></section>
        <section><h2>04 / PROTOCOLO DE OBSERVAÇÃO</h2><p>Arraste o espécime para inspecionar. Mova o cursor para alterar a perspectiva. Uma forma imóvel também revela outros estados da luz.</p><p>Teclado: setas para girar.<br />Home para restaurar a vista.</p><a className="specimen-download" href="/models/Flor_Translucida.glb" download>ARQUIVO DO ESPÉCIME / GLB <span>↗</span></a></section>
      </div>
      <div className="plate-bottom"><span className="live-status" role="status"><i />{info?'ESPÉCIME EM OBSERVAÇÃO':'PREPARANDO ESPÉCIME'}</span><div id="specimen-controls" className="specimen-controls" role="group" aria-label="Controles do espécime"><button aria-pressed={paused} onClick={()=>setPaused(value=>!value)}><ControlIcon kind={paused?'play':'pause'} />{paused?'Retomar movimento':'Pausar movimento'}</button><button aria-pressed={veins} onClick={()=>setVeins(value=>!value)}><ControlIcon kind="veins" />Exibir nervuras<span className={`control-state ${veins?'active':''}`} aria-hidden="true" /></button><button onClick={()=>setReset(value=>value+1)}><ControlIcon kind="reset" />Restaurar vista</button></div><span className="edition-stamp" aria-hidden="true">T / 001 &nbsp; © 2026</span></div>
    </footer>
  </main>
}
