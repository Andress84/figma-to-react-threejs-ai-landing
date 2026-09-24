// Foreground depth for the cursor compositor. Mask actual UI objects and text
// glyphs, never section/container rectangles. Existing stacking contexts and
// GSAP transforms remain entirely owned by their original components.
const SURFACES = [
  '[data-scroll-feature-card] article',
  '[data-pricing-card]',
  '[data-cta-panel]',
  '[data-faq-row]',
  '[data-pricing-billing]',
  '[data-cursor-surface]',
  'input',
  'textarea',
  'select',
  '#site-mobile-navigation[data-visible="true"]',
].join(', ')

type TextMask = {
  node: Text
  parent: HTMLElement
  range: Range
  bitmap: HTMLCanvasElement | null
  signature: string
  width: number
  height: number
}
type StyleState = { style: CSSStyleDeclaration; opacity: number }

export class CursorForegroundMask {
  readonly canvas = document.createElement('canvas')
  private context: CanvasRenderingContext2D
  private root: HTMLElement
  private surfaces: HTMLElement[] = []
  private texts: TextMask[] = []
  private dirty = true
  private observer: MutationObserver
  private states = new Map<HTMLElement, StyleState>()
  private width = 1
  private height = 1
  private disposed = false

  constructor() {
    const context = this.canvas.getContext('2d', { alpha: true })
    const root = document.getElementById('root')
    if (!context || !root) throw new Error('Cursor foreground mask is unavailable')
    this.context = context
    this.root = root
    this.observer = new MutationObserver(() => { this.dirty = true })
    this.observer.observe(root, {
      subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: ['hidden', 'aria-hidden', 'data-visible'],
    })
    void document.fonts.ready.then(() => {
      if (!this.disposed) this.invalidate()
    })
  }

  resize(width: number, height: number, outputWidth: number, outputHeight: number) {
    this.width = width
    this.height = height
    this.canvas.width = outputWidth
    this.canvas.height = outputHeight
    this.invalidate()
  }

  private invalidate() {
    for (const text of this.texts) text.signature = ''
    this.dirty = true
  }

  private collect() {
    // Reuse glyph rasters when React changes unrelated content or counters.
    const previous = new Map(this.texts.map(text => [text.node, text]))
    // Keep nested controls: the Final CTA button deliberately extends beyond
    // its panel and must occlude the field in that exposed area as well.
    this.surfaces = Array.from(this.root.querySelectorAll<HTMLElement>(SURFACES))
    this.texts = []
    const walker = document.createTreeWalker(this.root, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const text = node as Text
      const parent = text.parentElement
      if (parent && text.data.trim() &&
        !parent.closest(`${SURFACES}, script, style`)) {
        const cached = previous.get(text)
        if (cached) this.texts.push(cached)
        else {
          const range = document.createRange()
          range.selectNodeContents(text)
          this.texts.push({ node: text, parent, range, bitmap: null, signature: '', width: 0, height: 0 })
        }
      }
      node = walker.nextNode()
    }
    this.dirty = false
  }

  private state(element: HTMLElement): StyleState {
    const cached = this.states.get(element)
    if (cached) return cached
    const style = getComputedStyle(element)
    const visible = style.display !== 'none' && style.visibility !== 'hidden' && !element.hidden
    const ancestor = element.parentElement
    const opacity = visible ? Number(style.opacity) *
      (ancestor && element !== this.root ? this.state(ancestor).opacity : 1) : 0
    const state = { style, opacity }
    this.states.set(element, state)
    return state
  }

  private visible(rect: DOMRect) {
    return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0 &&
      rect.left < this.width && rect.top < this.height
  }

  private clipAncestors(element: HTMLElement) {
    const ctx = this.context
    let ancestor: HTMLElement | null = element
    while (ancestor && ancestor !== this.root) {
      const { style } = this.state(ancestor)
      const clipped = ['hidden', 'clip'].includes(style.overflowX) || ['hidden', 'clip'].includes(style.overflowY)
      const inset = /^inset\(([^)]+)\)/.exec(style.clipPath)
      if (clipped || inset) {
        const b = ancestor.getBoundingClientRect()
        let top = 0, right = 0, bottom = 0, left = 0
        if (inset) {
          const values = inset[1].split(' round ')[0].trim().split(/\s+/)
          const pixels = (value: string, size: number) => parseFloat(value) * (value.endsWith('%') ? size / 100 : 1)
          top = pixels(values[0], b.height)
          right = pixels(values[1] ?? values[0], b.width)
          bottom = pixels(values[2] ?? values[0], b.height)
          left = pixels(values[3] ?? values[1] ?? values[0], b.width)
        }
        ctx.beginPath()
        ctx.rect(b.left + left, b.top + top, Math.max(0, b.width - left - right), Math.max(0, b.height - top - bottom))
        ctx.clip()
      }
      ancestor = ancestor.parentElement
    }
  }

  private rasterize(text: TextMask, bounds: DOMRect, style: CSSStyleDeclaration) {
    const bitmap = text.bitmap ?? document.createElement('canvas')
    bitmap.width = Math.ceil(bounds.width + 6)
    bitmap.height = Math.ceil(bounds.height + 6)
    const ctx = bitmap.getContext('2d')!
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2.2
    ctx.lineJoin = 'round'
    const ascent = ctx.measureText('Mg').fontBoundingBoxAscent
    const glyphRange = document.createRange()
    let offset = 0
    for (const character of text.node.data) {
      glyphRange.setStart(text.node, offset)
      offset += character.length
      glyphRange.setEnd(text.node, offset)
      if (!character.trim()) continue
      const rect = glyphRange.getBoundingClientRect()
      const glyph = style.textTransform === 'uppercase' ? character.toUpperCase() : character
      const x = rect.left - bounds.left + 3
      const y = rect.top - bounds.top + 3 + ascent
      ctx.strokeText(glyph, x, y)
      ctx.fillText(glyph, x, y)
    }
    text.bitmap = bitmap
    text.width = bounds.width
    text.height = bounds.height
  }

  update() {
    if (this.dirty) this.collect()
    this.states.clear()
    const ctx = this.context
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.setTransform(this.canvas.width / this.width, 0, 0, this.canvas.height / this.height, 0, 0)
    ctx.fillStyle = '#fff'

    for (const element of this.surfaces) {
      const bounds = element.getBoundingClientRect()
      if (!this.visible(bounds)) continue
      const { style, opacity } = this.state(element)
      if (opacity < 0.01) continue
      ctx.save()
      this.clipAncestors(element.parentElement ?? this.root)
      // UI surfaces occlude the field as objects, even while their own entry
      // animation fades. Their existing animation is never repainted here.
      ctx.globalAlpha = Math.min(1, opacity * 4)
      const radius = Math.min(parseFloat(style.borderTopLeftRadius) || 0, bounds.width / 2, bounds.height / 2)
      ctx.beginPath()
      ctx.roundRect(bounds.left - 0.5, bounds.top - 0.5, bounds.width + 1, bounds.height + 1, radius)
      ctx.fill()
      ctx.restore()
    }

    for (const text of this.texts) {
      text.range.selectNodeContents(text.node)
      const bounds = text.range.getBoundingClientRect()
      if (!this.visible(bounds)) continue
      const { style, opacity } = this.state(text.parent)
      // Animated counters can be aria-hidden while still visually foreground.
      // Their separate screen-reader copy is clipped and must not be rasterized.
      if (opacity < 0.01 || style.clip !== 'auto') continue
      const signature = [text.node.data, style.fontFamily, style.fontSize, style.fontWeight,
        style.fontStyle, style.letterSpacing, style.textTransform].join('|')
      if (signature !== text.signature || Math.abs(bounds.width - text.width) > 0.75 ||
        Math.abs(bounds.height - text.height) > 0.75) {
        this.rasterize(text, bounds, style)
        text.signature = signature
      }
      if (!text.bitmap) continue
      ctx.save()
      this.clipAncestors(text.parent)
      ctx.globalAlpha = opacity
      ctx.drawImage(text.bitmap, bounds.left - 3, bounds.top - 3, bounds.width + 6, bounds.height + 6)
      ctx.restore()
    }
  }

  dispose() {
    this.disposed = true
    this.observer.disconnect()
    this.texts.length = 0
    this.surfaces.length = 0
    this.states.clear()
    this.canvas.width = this.canvas.height = 1
  }
}
