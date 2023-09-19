import { EventManager } from '../event.js'
import { StateHandler } from '../state-handler/index.js'
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
   * The state handler instance
   */
  stateHandler: StateHandler

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

    // 注意，这个 processKey 函数使用了 this.processKey.bind(this); 返回了一个新函数给按键回调处理
    // 所以得放在实例化 LGraphCanvas 之前调用
    // 参考：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
    this.#addProcessKeyHandler()
    this.#addProcessMouseHandler()

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

    this.stateHandler = center.stateHandler
    this.center = center
    this.ui = new ComfyUI(center)
  }

  async setup() {
    await this.eventManager.invokeExtensions('init', this.center)
    this.#addKeyboardHandler()
  }

  getPreviewFormatParam() {
    let preview_format = this.ui.settings.getSettingValue('Comfy.PreviewFormat')
    if (preview_format) return `&preview=${preview_format}`
    else return ''
  }

  /**
   * Add keyboard handler
   */
  #addKeyboardHandler() {
    window.addEventListener('keydown', (e) => {
      this.stateHandler.shiftDown = e.shiftKey
    })
    window.addEventListener('keyup', (e) => {
      this.stateHandler.shiftDown = e.shiftKey
    })
  }

  /**
   * Handle mouse
   *
   * Move group by header
   */
  #addProcessMouseHandler() {
    const self = this

    const origProcessMouseDown = LGraphCanvas.prototype.processMouseDown
    LGraphCanvas.prototype.processMouseDown = function (e) {
      const res = origProcessMouseDown.apply(this, arguments)

      this.selected_group_moving = false

      if (this.selected_group && !this.selected_group_resizing) {
        var font_size =
          this.selected_group.font_size || LiteGraph.DEFAULT_GROUP_FONT_SIZE
        var height = font_size * 1.4

        // Move group by header
        if (
          LiteGraph.isInsideRectangle(
            e.canvasX,
            e.canvasY,
            this.selected_group.pos[0],
            this.selected_group.pos[1],
            this.selected_group.size[0],
            height
          )
        ) {
          this.selected_group_moving = true
        }
      }

      return res
    }

    const origProcessMouseMove = LGraphCanvas.prototype.processMouseMove
    LGraphCanvas.prototype.processMouseMove = function (e) {
      const orig_selected_group = this.selected_group

      // 如果有选定的组并且不在调整大小状态下并且不在移动状态下
      if (
        this.selected_group &&
        !this.selected_group_resizing &&
        !this.selected_group_moving
      ) {
        this.selected_group = null
      }

      const res = origProcessMouseMove.apply(this, arguments)

      // 如果之前有选定的组并且不在调整大小状态下并且不在移动状态下
      if (
        orig_selected_group &&
        !this.selected_group_resizing &&
        !this.selected_group_moving
      ) {
        this.selected_group = orig_selected_group
      }

      return res
    }
  }

  /**
   * 处理键盘事件
   *
   * Ctrl + M：静音/取消静音选定的节点
   * Ctrl + B：禁用/启用选定的节点
   *  具体参考：https://vscode.dev/github/alsritter/py-graph/blob/type/web/lib/litegraph.core.js#L70
   * LiteGraph 节点运行模式顺序如下：
   *    - ALWAYS (总是): 0 - 节点会始终运行，即使没有输入数据也会执行。这通常用于执行常规操作或发出事件。
   *    - ON_EVENT (事件触发): 1 - 节点会监听一个特定的事件，并在该事件触发时执行。这用于实现事件驱动的逻辑，例如响应鼠标点击或键盘事件。
   *    - NEVER (从不): 2 - 节点不会自动执行，必须手动触发。这在需要手动控制节点执行时很有用。
   *    - ON_TRIGGER (触发执行): 3 - 节点仅在收到来自输入连接的触发信号时才会执行。
   *    - ON_REQUEST (请求执行): 4 - 节点仅在收到来自输入连接的请求信号时才会执行。
   */
  #addProcessKeyHandler() {
    const self = this
    const origProcessKey = LGraphCanvas.prototype.processKey

    // 重写 LGraphCanvas 类的 processKey 方法
    LGraphCanvas.prototype.processKey = function (e) {
      const res = origProcessKey.apply(this, arguments)

      console.log('Ctrl + M', e)

      // 如果原始处理方法返回了 false，则终止继续处理
      if (res === false) {
        return res
      }

      // 如果没有绑定到图表，则不处理
      if (!this.graph) {
        return
      }

      var block_default = false

      // 获取事件触发元素的 HTML 标签名
      if ((e.target as Element).localName == 'input') {
        return
      }

      if (e.type == 'keydown') {
        // Ctrl + M：静音/取消静音
        if (e.keyCode == 77 && e.ctrlKey) {
          if (this.selected_nodes) {
            for (var i in this.selected_nodes) {
              if (this.selected_nodes[i].mode === 2) {
                // 从 "never" 切换到 "always"
                this.selected_nodes[i].mode = 0
              } else {
                // 从 "always" 切换到 "never"
                this.selected_nodes[i].mode = 2
              }
            }
          }
          block_default = true
        }

        // Ctrl + B：禁用/启用
        if (e.keyCode == 66 && e.ctrlKey) {
          if (this.selected_nodes) {
            for (var i in this.selected_nodes) {
              if (this.selected_nodes[i].mode === 4) {
                // 从 "never" 切换到 "always"
                this.selected_nodes[i].mode = 0
              } else {
                // 从 "always" 切换到 "never"
                this.selected_nodes[i].mode = 4
              }
            }
          }
          block_default = true
        }
      }

      // 触发图表的改变事件
      this.graph.change()

      // 如果需要阻止默认键盘事件的处理
      if (block_default) {
        e.preventDefault()
        e.stopImmediatePropagation()
        return false
      }

      return res
    }
  }
}
