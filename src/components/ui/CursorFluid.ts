import { CursorForegroundMask } from './CursorForegroundMask'
import { fragments, vertexShader } from './cursorFluidShaders'
import styles from './GlobalCursor.module.css'

type Target = { texture: WebGLTexture; buffer: WebGLFramebuffer; width: number; height: number }
type Pair = { read: Target; write: Target }
type Pass = { program: WebGLProgram; uniforms: Map<string, WebGLUniformLocation | null> }
type Stroke = { x0: number; y0: number; x1: number; y1: number; dx: number; dy: number; amount: number; radius: number; phase: number }

const MAX_STROKES = 8
const swap = (pair: Pair) => { [pair.read, pair.write] = [pair.write, pair.read] }

/** One persistent simulation and one viewport presentation. A foreground depth
 * mask keeps actual UI above the field without inheriting section clipping. */
export class CursorFluid {
  private canvas = document.createElement('canvas')
  private gl: WebGL2RenderingContext
  private passes = new Map<keyof typeof fragments, Pass>()
  private targets: Target[] = []
  private foreground: CursorForegroundMask | null = null
  private foregroundTexture: WebGLTexture | null = null
  private velocity!: Pair
  private dye!: Pair
  private dyeForward!: Target
  private dyeReverse!: Target
  private pressure!: Pair
  private curl!: Target
  private divergence!: Target
  private strokes: Stroke[] = []
  private paths = new Float32Array(MAX_STROKES * 4)
  private impulses = new Float32Array(MAX_STROKES * 4)
  private colors = new Float32Array(MAX_STROKES * 3)
  private width = 1
  private height = 1
  private lastInput = -10
  private elapsed = 0
  private lost = false
  private disposed = false
  private light = navigator.hardwareConcurrency <= 4

  constructor() {
    const gl = this.canvas.getContext('webgl2', {
      alpha: true, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: false, preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    })
    if (!gl) throw new Error('Cursor fluid WebGL is unavailable')
    this.gl = gl
    try {
      if (!gl.getExtension('EXT_color_buffer_float')) {
        throw new Error('Cursor fluid float targets are unavailable')
      }
      for (const name of Object.keys(fragments) as (keyof typeof fragments)[]) {
        this.passes.set(name, this.createPass(fragments[name]))
      }
      gl.disable(gl.BLEND)
      gl.disable(gl.DEPTH_TEST)
      this.foreground = new CursorForegroundMask()
      this.foregroundTexture = gl.createTexture()
      if (!this.foregroundTexture) throw new Error('Cursor foreground texture allocation failed')
      this.canvas.className = styles.fluidField
      this.canvas.setAttribute('aria-hidden', 'true')
      this.canvas.dataset.cursorFluid = 'global'
      this.resize()
      document.getElementById('root')!.appendChild(this.canvas)
      this.canvas.addEventListener('webglcontextlost', this.contextLost)
    } catch (error) {
      this.dispose()
      throw error
    }
  }

  private contextLost = (event: Event) => {
    event.preventDefault()
    this.lost = true
    this.clearPresentation()
  }

  private createPass(fragment: string): Pass {
    const gl = this.gl
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) throw new Error('Cursor shader allocation failed')
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader)
        gl.deleteShader(shader)
        throw new Error(message ?? 'Cursor shader compilation failed')
      }
      return shader
    }
    const vertex = compile(gl.VERTEX_SHADER, vertexShader)
    let pixel: WebGLShader | null = null
    let program: WebGLProgram | null = null
    try {
      pixel = compile(gl.FRAGMENT_SHADER, fragment)
      program = gl.createProgram()
      if (!program) throw new Error('Cursor program allocation failed')
      gl.attachShader(program, vertex)
      gl.attachShader(program, pixel)
      gl.linkProgram(program)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) ?? 'Cursor shader link failed')
      }
      return { program, uniforms: new Map() }
    } catch (error) {
      if (program) gl.deleteProgram(program)
      throw error
    } finally {
      gl.deleteShader(vertex)
      if (pixel) gl.deleteShader(pixel)
    }
  }

  private createTarget(width: number, height: number): Target {
    const gl = this.gl
    const texture = gl.createTexture()
    const buffer = gl.createFramebuffer()
    if (!texture || !buffer) {
      gl.deleteTexture(texture)
      gl.deleteFramebuffer(buffer)
      throw new Error('Cursor target allocation failed')
    }
    const target = { texture, buffer, width, height }
    this.targets.push(target)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, buffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('Cursor float framebuffer is incomplete')
    }
    gl.viewport(0, 0, width, height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    return target
  }

  private uniform(pass: Pass, name: string) {
    if (!pass.uniforms.has(name)) {
      pass.uniforms.set(name, this.gl.getUniformLocation(pass.program, name))
    }
    return pass.uniforms.get(name) ?? null
  }

  private use(name: keyof typeof fragments, target: Target | null, source: Target) {
    const gl = this.gl
    const pass = this.passes.get(name)!
    gl.useProgram(pass.program)
    gl.bindFramebuffer(gl.FRAMEBUFFER, target?.buffer ?? null)
    gl.viewport(0, 0, target?.width ?? this.canvas.width, target?.height ?? this.canvas.height)
    this.texture(pass, 'source', source, 0)
    gl.uniform2f(this.uniform(pass, 'texel'), 1 / this.velocity.read.width, 1 / this.velocity.read.height)
    return pass
  }

  private texture(pass: Pass, name: string, target: Target, unit: number) {
    const gl = this.gl
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, target.texture)
    gl.uniform1i(this.uniform(pass, name), unit)
  }

  private draw() { this.gl.drawArrays(this.gl.TRIANGLES, 0, 3) }

  resize() {
    if (this.lost || this.disposed) return
    this.width = document.documentElement.clientWidth
    this.height = window.innerHeight
    const aspect = this.width / this.height
    const short = this.light ? 112 : 160
    const dyeShort = this.light ? 320 : 512
    const dimensions = (base: number) => aspect >= 1
      ? [Math.round(base * aspect), base] : [base, Math.round(base / aspect)]
    const [sw, sh] = dimensions(short)
    const [dw, dh] = dimensions(dyeShort)
    this.releaseTargets()
    const pair = (w: number, h: number): Pair => ({ read: this.createTarget(w, h), write: this.createTarget(w, h) })
    this.velocity = pair(sw, sh)
    this.dye = pair(dw, dh)
    this.dyeForward = this.createTarget(dw, dh)
    this.dyeReverse = this.createTarget(dw, dh)
    this.pressure = pair(sw, sh)
    this.curl = this.createTarget(sw, sh)
    this.divergence = this.createTarget(sw, sh)
    // Output never scales with hardware DPR. Simulation stays smaller still.
    const scale = Math.min(1, (this.light ? 900 : 1280) / Math.max(this.width, this.height))
    this.canvas.width = Math.round(this.width * scale)
    this.canvas.height = Math.round(this.height * scale)
    this.canvas.style.width = `${this.width}px`
    this.canvas.style.height = `${this.height}px`
    this.foreground?.resize(this.width, this.height, this.canvas.width, this.canvas.height)
    const gl = this.gl
    gl.bindTexture(gl.TEXTURE_2D, this.foregroundTexture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.canvas.width, this.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    this.strokes.length = 0
    this.lastInput = -10
    this.clearPresentation()
  }

  addMovement(x0: number, y0: number, x1: number, y1: number, milliseconds: number) {
    if (this.lost || this.disposed) return
    const dx = x1 - x0
    const dy = y1 - y0
    const distance = Math.hypot(dx, dy)
    if (distance < 0.15) return
    const speed = distance / Math.max(8, milliseconds)
    const force = 19.0 * Math.min(1, 100 / Math.max(distance, 1))
    const stroke: Stroke = {
      x0: x0 / this.width, y0: 1 - y0 / this.height,
      x1: x1 / this.width, y1: 1 - y1 / this.height,
      dx: dx * this.velocity.read.width / this.width * force,
      dy: -dy * this.velocity.read.height / this.height * force,
      amount: Math.min(0.95, 0.1 + distance * 0.031),
      radius: 34 + Math.min(9, speed * 3), phase: this.elapsed * 1.15 + x1 * 0.0025 + y1 * 0.001,
    }
    // Bounded queue: preserve the travelled segment on high-rate devices.
    if (this.strokes.length === MAX_STROKES) {
      const last = this.strokes[MAX_STROKES - 1]
      last.x1 = stroke.x1
      last.y1 = stroke.y1
      last.dx += stroke.dx
      last.dy += stroke.dy
      last.amount = Math.min(1.15, last.amount + stroke.amount)
    } else this.strokes.push(stroke)
    this.lastInput = this.elapsed
  }

  private inject(pair: Pair, dye: boolean) {
    const gl = this.gl
    const pass = this.use('splat', pair.write, pair.read)
    gl.uniform2f(this.uniform(pass, 'viewport'), this.width, this.height)
    gl.uniform4fv(this.uniform(pass, 'paths[0]'), this.paths)
    gl.uniform4fv(this.uniform(pass, 'impulses[0]'), this.impulses)
    gl.uniform3fv(this.uniform(pass, 'colors[0]'), this.colors)
    gl.uniform1i(this.uniform(pass, 'count'), this.strokes.length)
    gl.uniform1i(this.uniform(pass, 'dye'), dye ? 1 : 0)
    this.draw()
    swap(pair)
  }

  update(dt: number): boolean {
    if (this.lost || this.disposed) return false
    this.elapsed += dt
    if (this.elapsed - this.lastInput > 5.2) {
      this.clearPresentation()
      return false
    }
    const gl = this.gl
    const advect = (pair: Pair, decay: number) => {
      const pass = this.use('advect', pair.write, pair.read)
      this.texture(pass, 'velocity', this.velocity.read, 1)
      gl.uniform1f(this.uniform(pass, 'dt'), dt)
      gl.uniform1f(this.uniform(pass, 'decay'), decay)
      this.draw()
      swap(pair)
    }
    advect(this.velocity, 1.85)
    if (this.strokes.length) {
      this.strokes.forEach((s, i) => {
        this.paths.set([s.x0, s.y0, s.x1, s.y1], i * 4)
        this.impulses.set([s.dx, s.dy, s.amount, s.radius], i * 4)
        // Violet base, warm/magenta and blue accents, carried by the dye itself.
        const warm = Math.pow(0.5 + Math.sin(s.phase) * 0.5, 3)
        const cool = Math.pow(0.5 + Math.cos(s.phase * 0.83) * 0.5, 3)
        this.colors.set([0.52 + warm * 0.42 - cool * 0.18, 0.15 + warm * 0.1 + cool * 0.2, 0.83 - warm * 0.59 + cool * 0.13], i * 3)
      })
      this.inject(this.velocity, false)
    }
    this.use('curl', this.curl, this.velocity.read)
    this.draw()
    let pass = this.use('vorticity', this.velocity.write, this.velocity.read)
    this.texture(pass, 'curl', this.curl, 1)
    gl.uniform1f(this.uniform(pass, 'dt'), dt)
    this.draw()
    swap(this.velocity)
    this.use('divergence', this.divergence, this.velocity.read)
    this.draw()
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pressure.read.buffer)
    gl.clear(gl.COLOR_BUFFER_BIT)
    for (let i = 0; i < (this.light ? 6 : 10); i++) {
      pass = this.use('pressure', this.pressure.write, this.pressure.read)
      this.texture(pass, 'divergence', this.divergence, 1)
      this.draw()
      swap(this.pressure)
    }
    pass = this.use('project', this.velocity.write, this.velocity.read)
    this.texture(pass, 'pressure', this.pressure.read, 1)
    this.draw()
    swap(this.velocity)
    // Correct semi-Lagrangian diffusion so the dye retains thin folded wisps.
    pass = this.use('advect', this.dyeForward, this.dye.read)
    this.texture(pass, 'velocity', this.velocity.read, 1)
    gl.uniform1f(this.uniform(pass, 'dt'), dt)
    gl.uniform1f(this.uniform(pass, 'decay'), 0)
    this.draw()
    pass = this.use('advect', this.dyeReverse, this.dyeForward)
    this.texture(pass, 'velocity', this.velocity.read, 1)
    gl.uniform1f(this.uniform(pass, 'dt'), -dt)
    gl.uniform1f(this.uniform(pass, 'decay'), 0)
    this.draw()
    pass = this.use('correct', this.dye.write, this.dyeForward)
    this.texture(pass, 'original', this.dye.read, 1)
    this.texture(pass, 'reverse', this.dyeReverse, 2)
    this.texture(pass, 'velocity', this.velocity.read, 3)
    gl.uniform2f(this.uniform(pass, 'dyeTexel'), 1 / this.dye.read.width, 1 / this.dye.read.height)
    gl.uniform1f(this.uniform(pass, 'dt'), dt)
    this.draw()
    swap(this.dye)
    if (this.strokes.length) this.inject(this.dye, true)
    this.strokes.length = 0
    this.foreground?.update()
    pass = this.use('display', null, this.dye.read)
    gl.activeTexture(gl.TEXTURE4)
    gl.bindTexture(gl.TEXTURE_2D, this.foregroundTexture)
    if (this.foreground) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.foreground.canvas)
    gl.uniform1i(this.uniform(pass, 'foreground'), 4)
    this.draw()
    this.canvas.style.visibility = 'visible'
    return true
  }

  private clearPresentation() {
    this.canvas.style.visibility = 'hidden'
  }

  reset() {
    if (this.lost || this.disposed) return
    for (const target of this.targets) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, target.buffer)
      this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    }
    this.strokes.length = 0
    this.lastInput = -10
    this.clearPresentation()
  }

  private releaseTargets() {
    for (const target of this.targets) {
      this.gl.deleteTexture(target.texture)
      this.gl.deleteFramebuffer(target.buffer)
    }
    this.targets.length = 0
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.canvas.removeEventListener('webglcontextlost', this.contextLost)
    this.foreground?.dispose()
    this.gl.deleteTexture(this.foregroundTexture)
    this.canvas.remove()
    this.releaseTargets()
    for (const pass of this.passes.values()) this.gl.deleteProgram(pass.program)
    this.passes.clear()
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}
