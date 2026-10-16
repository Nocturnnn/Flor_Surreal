import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export type PartName = 'Petalas_Iridescentes' | 'Folhas_Translucidas' | 'Caule_e_Sepalas' | 'Estames_e_Pistilo' | 'Anteras_Peroladas' | 'Nervuras_Finas'
export type SceneInfo = { parts: string[]; triangles: number; extensions: string[]; hasAnimation: boolean }
type Options = { paused: boolean; veins: boolean; selected: PartName | null; reset: number }
type Props = Options & { onReady: (info: SceneInfo) => void }
type SceneApi = { update: (options: Options) => void }

// The six names are verified against the loaded scene before they are addressed.
const EXPECTED_PARTS: PartName[] = ['Petalas_Iridescentes', 'Folhas_Translucidas', 'Caule_e_Sepalas', 'Estames_e_Pistilo', 'Anteras_Peroladas', 'Nervuras_Finas']

// Optical surface detail only: the supplied geometry and its color texture stay intact.
function makeMembraneMaps() {
  const size = 256
  const thickness = new Uint8Array(size * size * 4)
  const normal = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      const offset = (y * size + x) * 4
      const film = 0.5 + 0.5 * Math.sin(v * 18 + Math.sin(u * 9) * 2.8 + u * 5)
      thickness[offset] = thickness[offset + 1] = thickness[offset + 2] = Math.round(film * 255)
      thickness[offset + 3] = 255
      const ridge = Math.cos(u * Math.PI * 62 + Math.sin(v * 9) * 1.6)
      normal[offset] = Math.round(128 + ridge * 29)
      normal[offset + 1] = Math.round(128 + Math.sin(v * 19 + u * 8) * 11)
      normal[offset + 2] = 250
      normal[offset + 3] = 255
    }
  }
  const filmMap = new THREE.DataTexture(thickness, size, size)
  const normalMap = new THREE.DataTexture(normal, size, size)
  ;[filmMap, normalMap].forEach(map => {
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.magFilter = THREE.LinearFilter
    map.minFilter = THREE.LinearMipmapLinearFilter
    map.generateMipmaps = true
    map.needsUpdate = true
  })
  return { filmMap, normalMap }
}

function makeEnvironment(renderer: THREE.WebGLRenderer, economical: boolean) {
  const studio = new THREE.Scene()
  studio.background = new THREE.Color(0x030407)
  const panels: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = []
  const panel = (color: string, intensity: number, size: [number, number], position: [number, number, number]) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...size), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }))
    mesh.position.set(...position)
    mesh.lookAt(0, 0, 0)
    studio.add(mesh)
    panels.push(mesh)
  }
  // Large luminous surfaces form a soft studio reflection, independent of the black background.
  panel('#c3ebff', 2, [1.5, 6], [-4, 2, 4])
  panel('#40ffe9', 12, [1, 6], [4, 0, 2])
  panel('#9c72ff', 3, [1.3, 5], [-3, -1, -4])
  panel('#ff86ce', 9, [1, 5], [4, 2, -3])
  panel('#56efff', 8, [4, 0.5], [0, 1, 5])
  panel('#805aff', 6, [0.55, 6], [-2, 0, 5])
  panel('#bce4ff', 2, [4, 0.7], [0, 5, 1])
  panel('#4c8fff', 2, [3, 0.5], [0, -4, 2])
  const pmrem = new THREE.PMREMGenerator(renderer)
  const target = pmrem.fromScene(studio, 0.06, 0.1, 50, { size: economical ? 128 : 256 })
  pmrem.dispose()
  panels.forEach(mesh => { mesh.geometry.dispose(); mesh.material.dispose() })
  return target
}

export default function FlowerScene({ paused, veins, selected, reset, onReady }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const api = useRef<SceneApi | null>(null)
  const optionsRef = useRef<Options>({ paused, veins, selected, reset })
  const readyRef = useRef(onReady)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => { readyRef.current = onReady }, [onReady])
  useEffect(() => {
    optionsRef.current = { paused, veins, selected, reset }
    api.current?.update(optionsRef.current)
  }, [paused, veins, selected, reset])

  useEffect(() => {
    const host = container.current!
    let disposed = false
    let renderer: THREE.WebGLRenderer
    let environment: THREE.WebGLRenderTarget | undefined
    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set<THREE.Material>()
    const textures = new Set<THREE.Texture>()
    let frame = 0
    let loaded = false
    let inView = true
    let sceneOptions = { ...optionsRef.current }
    let resetValue = sceneOptions.reset
    let elapsed = 0
    let lastTime = 0
    let activePointer: number | null = null
    let lastPointer = { x: 0, y: 0 }
    const mouse = new THREE.Vector2()
    const drag = new THREE.Vector2()
    const rotation = new THREE.Vector2()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const device = navigator as Navigator & { deviceMemory?: number }
    const economical = (device.deviceMemory ?? 8) <= 4 || navigator.hardwareConcurrency <= 4 || window.innerWidth < 700
    const scene = new THREE.Scene()
    // A transparent canvas reveals the technical drawing underneath; the page stays black.
    scene.background = null
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    const floatGroup = new THREE.Group()
    const modelGroup = new THREE.Group()
    floatGroup.add(modelGroup)
    scene.add(floatGroup)
    const parts = new Map<string, THREE.Mesh>()
    const neutralColors = new Map<THREE.MeshPhysicalMaterial, THREE.Color>()
    let modelBounds: THREE.Box3 | undefined
    const framingPoints: THREE.Vector3[] = []

    function fail(message: string) {
      if (disposed) return
      loaded = false
      cancelAnimationFrame(frame)
      frame = 0
      setError(message)
      setStatus('error')
      host.dataset.ready = 'false'
    }
    setStatus('loading')
    setProgress(0)
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
      renderer.setClearColor('#08090c', 0)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, economical ? 1.5 : 1.75))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 0.95
      renderer.domElement.setAttribute('aria-label', 'Flor translúcida em 3D. Arraste ou use as setas para girar. Tecla Home restaura a vista.')
      renderer.domElement.setAttribute('role', 'img')
      renderer.domElement.tabIndex = 0
      renderer.domElement.className = 'flower-canvas'
      host.appendChild(renderer.domElement)
      environment = makeEnvironment(renderer, economical)
      scene.environment = environment.texture
      scene.environmentIntensity = 0.85
      scene.add(new THREE.HemisphereLight('#c8e8ff', '#36243f', 0.12))
      const key = new THREE.DirectionalLight('#d9ffff', 0.75)
      key.position.set(-3, 5, 5)
      scene.add(key)
      const fill = new THREE.DirectionalLight('#bca6ff', 0.6)
      fill.position.set(4, 1, -2)
      scene.add(fill)
    } catch {
      fail('A visualização 3D não pôde ser iniciada. Verifique se o WebGL está habilitado no navegador e tente novamente.')
      renderer!?.dispose()
      return () => { disposed = true; renderer!?.domElement.remove() }
    }

    function schedule() {
      if (!disposed && loaded && !document.hidden && inView && !frame) frame = requestAnimationFrame(render)
    }
    function render(now: number) {
      frame = 0
      if (disposed || !loaded || document.hidden || !inView) return
      const dt = Math.min((now - (lastTime || now)) / 1000, 0.04)
      lastTime = now
      const moving = !sceneOptions.paused && !reduced.matches
      if (moving) elapsed += dt
      const targetX = drag.x + (reduced.matches ? 0 : mouse.y * 0.035)
      const targetY = drag.y + (reduced.matches ? 0 : mouse.x * 0.055)
      const smooth = reduced.matches ? 1 : 1 - Math.exp(-dt * 7)
      rotation.x = THREE.MathUtils.lerp(rotation.x, targetX, smooth)
      rotation.y = THREE.MathUtils.lerp(rotation.y, targetY, smooth)
      floatGroup.rotation.set(0.045 + rotation.x + Math.sin(elapsed * 0.43) * 0.012, -0.075 + rotation.y + Math.sin(elapsed * 0.28) * 0.025, -0.035)
      floatGroup.position.y = Math.sin(elapsed * 0.7) * 0.025
      renderer.render(scene, camera)
      host.dataset.rotation = `${rotation.x.toFixed(3)},${rotation.y.toFixed(3)}`
      host.dataset.motion = moving ? 'running' : 'paused'
      host.dataset.frames = String(Number(host.dataset.frames ?? 0) + 1)
      if (moving || Math.abs(rotation.x - targetX) + Math.abs(rotation.y - targetY) > 0.0001) schedule()
    }
    function fitCamera() {
      const width = host.clientWidth
      const height = host.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height)
      camera.aspect = width / height
      if (modelBounds) {
        const vFov = THREE.MathUtils.degToRad(camera.fov)
        const tangent = Math.tan(vFov / 2)
        // Fit the actual vertices along the open face, including their depth.
        // Unlike a bounding sphere this does not leave a large empty border around the stem.
        let distance = 0
        const pose = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.045, -0.075, -0.035))
        const point = new THREE.Vector3()
        for (const vertex of framingPoints) {
          point.copy(vertex).applyMatrix4(pose)
          distance = Math.max(distance, point.z + Math.max(Math.abs(point.y - 0.04) / tangent, Math.abs(point.x) / (tangent * camera.aspect)))
        }
        distance = distance * 1.055 + 0.13
        camera.position.set(0, 0.04, distance)
        camera.lookAt(0, 0.04, 0)
        camera.near = Math.max(0.01, distance / 100)
        camera.far = distance + 30
        host.dataset.distance = distance.toFixed(3)
      }
      camera.updateProjectionMatrix()
      schedule()
    }
    function update(options: Options) {
      sceneOptions = options
      parts.forEach((mesh, name) => {
        mesh.visible = name !== 'Nervuras_Finas' || options.veins
        const material = mesh.material as THREE.MeshPhysicalMaterial
        const base = neutralColors.get(material)
        if (base) {
          material.color.copy(base)
          // A restrained color lift locates a selected structure without replacing its material.
          if (options.selected === name) material.color.lerp(new THREE.Color('#d6fffa'), 0.36)
        }
      })
      host.dataset.veins = String(options.veins)
      host.dataset.selected = options.selected ?? ''
      if (resetValue !== options.reset) {
        resetValue = options.reset
        drag.set(0, 0)
        mouse.set(0, 0)
        elapsed = 0
        fitCamera()
      }
      schedule()
    }
    api.current = { update }

    const loader = new GLTFLoader()
    loader.load(`${import.meta.env.BASE_URL}models/Flor_Translucida.glb`, gltf => {
      // Track every resource even if an obsolete StrictMode load finishes after cleanup.
      gltf.scene.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return
        geometries.add(object.geometry)
        const originals = Array.isArray(object.material) ? object.material : [object.material]
        originals.forEach(original => {
          materials.add(original)
          Object.values(original).forEach(value => { if (value instanceof THREE.Texture) textures.add(value) })
        })
      })
      if (disposed) { disposeResources(); return }
      try {
        let triangles = 0
        const membraneMaps = makeMembraneMaps()
        textures.add(membraneMaps.filmMap)
        textures.add(membraneMaps.normalMap)
        gltf.scene.traverse(object => {
          if (!(object instanceof THREE.Mesh)) return
          parts.set(object.name, object)
          triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3
          const original = object.material as THREE.MeshPhysicalMaterial
          if (!original.isMeshPhysicalMaterial) throw new Error('Material físico não reconhecido no modelo.')
          const material = original.clone()
          materials.add(material)
          object.material = material
          if (object.name === 'Petalas_Iridescentes' || object.name === 'Folhas_Translucidas') {
            material.iridescence = 0.92
            material.iridescenceIOR = 1.72
            material.iridescenceThicknessRange = [110, 620]
            material.iridescenceThicknessMap = membraneMaps.filmMap
            material.normalMap = membraneMaps.normalMap
            material.normalScale.set(0.44, 0.24)
            material.color.setRGB(0.22, 0.29, 0.38)
            material.metalness = 0.1
            material.specularIntensity = 1.8
            material.transmission = 0.91
            material.thickness = 0.035
            material.roughness = 0.16
            material.clearcoat = 0.6
            material.clearcoatRoughness = 0.13
            material.envMapIntensity = 1.8
            material.transparent = true
            material.opacity = 0.72
            material.depthWrite = false
            material.forceSinglePass = true
          } else if (object.name === 'Nervuras_Finas') {
            material.color.set('#a9c7e0')
            material.metalness = 0.16
            material.roughness = 0.5
            material.transparent = true
            material.opacity = 0.32
            material.depthWrite = false
          } else if (object.name === 'Caule_e_Sepalas' || object.name === 'Estames_e_Pistilo') {
            material.thickness = 0.06
            material.iridescence = 0.45
            material.iridescenceThicknessRange = [200, 380]
            material.color.set('#93b4cc')
            material.transparent = true
            material.opacity = object.name === 'Caule_e_Sepalas' ? 0.5 : 0.76
            material.depthWrite = false
            material.forceSinglePass = true
          } else if (object.name === 'Anteras_Peroladas') {
            material.iridescence = 0.65
            material.roughness = 0.27
          }
          neutralColors.set(material, material.color.clone())
        })
        const missing = EXPECTED_PARTS.filter(name => !parts.has(name))
        if (missing.length) throw new Error(`Estruturas não encontradas: ${missing.join(', ')}`)
        // +Z contains the stamens/anthers: this is the open face of the supplied model.
        const originalBounds = new THREE.Box3().setFromObject(gltf.scene)
        gltf.scene.position.sub(originalBounds.getCenter(new THREE.Vector3()))
        modelGroup.add(gltf.scene)
        modelBounds = new THREE.Box3().setFromObject(modelGroup)
        modelGroup.updateMatrixWorld(true)
        parts.forEach(mesh => {
          const positions = mesh.geometry.attributes.position
          for (let i = 0; i < positions.count; i++) framingPoints.push(new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld))
        })
        loaded = true
        host.dataset.ready = 'true'
        host.dataset.parts = [...parts.keys()].join(',')
        host.dataset.quality = economical ? 'economical' : 'standard'
        console.info('[Transparência] GLB carregado:', [...parts.keys()])
        readyRef.current({ parts: [...parts.keys()], triangles, extensions: gltf.parser.json.extensionsUsed ?? [], hasAnimation: gltf.animations.length > 0 || gltf.parser.json.meshes.some((m: { primitives: { targets?: unknown[] }[] }) => m.primitives.some(p => !!p.targets?.length)) })
        update(optionsRef.current)
        fitCamera()
        setProgress(100)
        setStatus('ready')
      } catch (cause) {
        fail(cause instanceof Error ? cause.message : 'Não foi possível preparar o espécime.')
      }
    }, event => {
      if (!disposed && event.total) setProgress(Math.min(99, Math.round(event.loaded / event.total * 100)))
    }, () => fail('Não foi possível carregar a flor. Verifique sua conexão e tente novamente.'))

    function pointerDown(event: PointerEvent) {
      if (!loaded || activePointer !== null) return
      activePointer = event.pointerId
      lastPointer = { x: event.clientX, y: event.clientY }
      renderer.domElement.setPointerCapture(event.pointerId)
      host.classList.add('is-dragging')
    }
    function pointerMove(event: PointerEvent) {
      const rect = host.getBoundingClientRect()
      if (activePointer === event.pointerId) {
        drag.y = THREE.MathUtils.clamp(drag.y + (event.clientX - lastPointer.x) * 0.003, -0.48, 0.48)
        drag.x = THREE.MathUtils.clamp(drag.x + (event.clientY - lastPointer.y) * 0.0025, -0.22, 0.24)
        lastPointer = { x: event.clientX, y: event.clientY }
      }
      mouse.set((event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1)
      schedule()
    }
    function pointerUp(event: PointerEvent) {
      if (event.pointerId !== activePointer) return
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId)
      activePointer = null
      host.classList.remove('is-dragging')
    }
    function pointerLeave() { mouse.set(0, 0); schedule() }
    function keyDown(event: KeyboardEvent) {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return
      event.preventDefault()
      if (event.key === 'Home') { drag.set(0, 0); mouse.set(0, 0); elapsed = 0 }
      if (event.key === 'ArrowLeft') drag.y = Math.max(-0.48, drag.y - 0.08)
      if (event.key === 'ArrowRight') drag.y = Math.min(0.48, drag.y + 0.08)
      if (event.key === 'ArrowUp') drag.x = Math.max(-0.22, drag.x - 0.05)
      if (event.key === 'ArrowDown') drag.x = Math.min(0.24, drag.x + 0.05)
      schedule()
    }
    function visibilityChange() {
      if (document.hidden || !inView) { cancelAnimationFrame(frame); frame = 0; lastTime = 0 }
      else schedule()
    }
    function contextLost(event: Event) { event.preventDefault(); fail('A conexão com a placa gráfica foi interrompida. Reabra a visualização para continuar.') }
    const canvas = renderer.domElement
    canvas.addEventListener('pointerdown', pointerDown)
    canvas.addEventListener('pointermove', pointerMove)
    canvas.addEventListener('pointerup', pointerUp)
    canvas.addEventListener('pointercancel', pointerUp)
    canvas.addEventListener('lostpointercapture', pointerUp)
    canvas.addEventListener('pointerleave', pointerLeave)
    canvas.addEventListener('keydown', keyDown)
    canvas.addEventListener('webglcontextlost', contextLost)
    document.addEventListener('visibilitychange', visibilityChange)
    reduced.addEventListener('change', schedule)
    const resizeObserver = new ResizeObserver(fitCamera)
    resizeObserver.observe(host)
    const intersectionObserver = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; visibilityChange() })
    intersectionObserver.observe(host)
    fitCamera()

    function disposeResources() {
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(material => material.dispose())
      textures.forEach(texture => texture.dispose())
      textures.forEach(texture => { if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap) texture.image.close() })
    }
    return () => {
      disposed = true
      api.current = null
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', visibilityChange)
      reduced.removeEventListener('change', schedule)
      canvas.removeEventListener('pointerdown', pointerDown)
      canvas.removeEventListener('pointermove', pointerMove)
      canvas.removeEventListener('pointerup', pointerUp)
      canvas.removeEventListener('pointercancel', pointerUp)
      canvas.removeEventListener('lostpointercapture', pointerUp)
      canvas.removeEventListener('pointerleave', pointerLeave)
      canvas.removeEventListener('keydown', keyDown)
      canvas.removeEventListener('webglcontextlost', contextLost)
      disposeResources()
      environment?.dispose()
      renderer.dispose()
      canvas.remove()
    }
  }, [retry])

  return <div className="scene" ref={container} data-testid="flower-scene">
    {status === 'loading' && <div className="scene-message" role="status"><span className="loading-orbit" /><span>Preparando o espécime</span><span className="load-progress">{progress}%</span></div>}
    {status === 'error' && <div className="scene-message error-message" role="alert"><span className="mono">VISUALIZAÇÃO INDISPONÍVEL</span><p>{error}</p><button className="text-button" onClick={() => setRetry(value => value + 1)}>Tentar novamente <span aria-hidden="true">↗</span></button></div>}
  </div>
}
