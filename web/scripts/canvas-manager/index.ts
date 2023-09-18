import { EventManager } from '../eventManager.js'
import { ComfyUI } from './ui.js'

/**
 * 负责创建 LGraph 画布、调整窗口大小以及基础画布设置。
 */
export class CanvasManager implements Module {
  center: ComfyCenter

  /**
   * User interface (UI) instance for the app
   */
  ui: ComfyUI

  /**
   * Reference to the graph canvas element
   */
  canvasEl: HTMLCanvasElement

  /**
   * Litegraph graph instance
   */
  graph: LGraph

  /**
   * Litegraph canvas context
   */
  canvas: LGraphCanvas

  /**
   * 2D rendering context for the canvas
   */
  ctx: CanvasRenderingContext2D

  constructor(private eventManager: EventManager) {}

  init(center: ComfyCenter) {
    const mainCanvas = document.createElement('canvas')
    mainCanvas.style.touchAction = 'none'
    const canvasEl = (this.canvasEl = Object.assign(mainCanvas, {
      id: 'graph-canvas'
    }))
    canvasEl.tabIndex = 1
    document.body.prepend(canvasEl)

    this.graph = new LGraph()
    const canvas = (this.canvas = new LGraphCanvas(canvasEl, this.graph))
    this.ctx = canvasEl.getContext('2d')

    LiteGraph.release_link_on_empty_shows_menu = true
    LiteGraph.alt_drag_do_clone_nodes = true

    this.graph.start()

    function resizeCanvas() {
      // Limit minimal scale to 1, see https://github.com/comfyanonymous/ComfyUI/pull/845
      const scale = Math.max(window.devicePixelRatio, 1)
      const { width, height } = canvasEl.getBoundingClientRect()
      canvasEl.width = Math.round(width * scale)
      canvasEl.height = Math.round(height * scale)
      canvasEl.getContext('2d').scale(scale, scale)
      canvas.draw(true, true)
    }

    // Ensure the canvas fills the window
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    this.center = center
    this.ui = new ComfyUI(center)
  }

  async setup() {
    await this.eventManager.invokeExtensions('init', this.center)
  }

  getPreviewFormatParam() {
    let preview_format = this.ui.settings.getSettingValue('Comfy.PreviewFormat')
    if (preview_format) return `&preview=${preview_format}`
    else return ''
  }
}
