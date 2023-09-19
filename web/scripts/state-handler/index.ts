import { api } from '../api.js'
import { app } from '../app.js'
import { WorkflowManager } from '../workflow-manager/index.js'
import { CanvasManager } from '../canvas-manager/index.js'
import { NodeManager } from '../node-manager/index.js'
import { Logger } from '../logger/index.js'

export class StateHandler implements Module {
  /**
   * Content Clipboard
   * @type {serialized node object}
   */
  static clipspace = null
  static clipspace_invalidate_handler = null
  static clipspace_return_node = null

  private workflowManager: WorkflowManager
  private nodeManager: NodeManager
  private canvasManager: CanvasManager
  private logger: Logger

  /**
   * Progress information object, including current value and maximum value
   */
  progress: { value: number; max: number }

  /**
   * List of entries to queue
   * @type {{number: number, batchCount: number}[]}
   */
  #queueItems: { number: number; batchCount: number }[] = []

  /**
   * If the queue is currently being processed
   * @type {boolean}
   */
  #processingQueue: boolean = false

  /**
   * An array that stores the errors of the last executed node
   */
  lastNodeErrors: []

  /**
   * Stores the execution output data for each node
   */
  nodeOutputs: Record<string, any>

  /**
   * The last execution error
   */
  lastExecutionError: any

  /**
   * The ID of the currently running node
   */
  runningNodeId: any

  /**
   * If the shift key on the keyboard is pressed
   */
  shiftDown: boolean = false

  init(config: ComfyCenter) {
    this.workflowManager = config.workflowManager
    this.canvasManager = config.canvasManager
  }

  setup() {
    this.#addApiUpdateHandlers()
  }

  /**
   * 执行当前图形工作流。
   */
  async queueRunner(number, batchCount = 1) {
    console.log('Queueing runner', number, batchCount)
    this.#queueItems.push({ number, batchCount })

    // Only have one action process the items so each one gets a unique seed correctly
    if (this.#processingQueue) {
      return
    }

    this.#processingQueue = true
    this.lastNodeErrors = null

    try {
      while (this.#queueItems.length) {
        ;({ number, batchCount } = this.#queueItems.pop())

        for (let i = 0; i < batchCount; i++) {
          const p = await this.workflowManager.graphToRunner()

          try {
            const res = await api.queueRunner(number, p)
            this.lastNodeErrors = res.node_errors
            if (this.lastNodeErrors.length > 0) {
              this.canvasManager.canvas.draw(true, true)
            }
          } catch (error) {
            const formattedError = this.logger.formatRunnerError(error)
            this.canvasManager.ui.dialog.show(formattedError)
            if (error.response) {
              this.lastNodeErrors = error.response.node_errors
              this.canvasManager.canvas.draw(true, true)
            }
            break
          }

          for (const n of p.workflow.nodes) {
            const node = this.canvasManager.graph.getNodeById(n.id)
            if (node.widgets) {
              for (const w of node.widgets) {
                const widget = w
                // Allow widgets to run callbacks after a prompt has been queued
                // e.g. random seed after every gen
                if (widget.afterQueued) {
                  widget.afterQueued()
                }
              }
            }
          }

          this.canvasManager.canvas.draw(true, true)
          await this.canvasManager.ui.queue.update()
        }
      }
    } finally {
      this.#processingQueue = false
    }
  }

  /**
   * Handles updates from the API socket
   */
  #addApiUpdateHandlers() {
    api.addEventListener('status', ({ detail }) => {
      this.canvasManager.ui.setStatus(detail)
    })

    api.addEventListener('reconnecting', () => {
      this.canvasManager.ui.dialog.show('Reconnecting...')
    })

    api.addEventListener('reconnected', () => {
      this.canvasManager.ui.dialog.close()
    })

    api.addEventListener('progress', ({ detail }) => {
      this.progress = detail
      // Clear the preview image for the node
      this.canvasManager.graph.setDirtyCanvas(true, false)
    })

    api.addEventListener('executing', ({ detail }) => {
      this.progress = null
      this.runningNodeId = detail
      // Clear the preview image for the node
      this.canvasManager.graph.setDirtyCanvas(true, false)
      delete this.nodeManager.nodePreviewImages[this.runningNodeId]
    })

    api.addEventListener('executed', ({ detail }) => {
      this.nodeOutputs[detail.node] = detail.output
      const node = this.canvasManager.graph.getNodeById(detail.node)
      if (node) {
        if (node.onExecuted) node.onExecuted(detail.output)
      }
    })

    api.addEventListener('execution_start', ({ detail }) => {
      this.runningNodeId = null
      this.lastExecutionError = null
    })

    api.addEventListener('execution_error', ({ detail }) => {
      this.lastExecutionError = detail
      const formattedError = this.logger.formatExecutionError(detail)
      this.canvasManager.ui.dialog.show(formattedError)
      this.canvasManager.canvas.draw(true, true)
    })

    api.addEventListener('b_preview', ({ detail }) => {
      const id = this.runningNodeId
      if (id == null) return

      const blob = detail
      const blobUrl = URL.createObjectURL(blob)
      this.nodeManager.nodePreviewImages[id] = [blobUrl]
    })

    api.init()
  }

  /**
   * Clean current state
   */
  clean() {
    this.nodeOutputs = {}
    this.lastNodeErrors = null
    this.lastExecutionError = null
    this.runningNodeId = null
  }

  static onClipspaceEditorSave() {
    if (StateHandler.clipspace_return_node) {
      StateHandler.pasteFromClipspace(StateHandler.clipspace_return_node)
    }
  }

  static onClipspaceEditorClosed() {
    StateHandler.clipspace_return_node = null
  }

  /**
   * 把当前节点的内容复制到剪贴板（例如数值之类的）
   */
  static copyToClipspace(node) {
    var widgets = null
    if (node.widgets) {
      widgets = node.widgets.map(({ type, name, value }) => ({
        type,
        name,
        value
      }))
    }

    var imgs = undefined
    var orig_imgs = undefined
    if (node.imgs != undefined) {
      imgs = []
      orig_imgs = []

      for (let i = 0; i < node.imgs.length; i++) {
        imgs[i] = new Image()
        imgs[i].src = node.imgs[i].src
        orig_imgs[i] = imgs[i]
      }
    }

    var selectedIndex = 0
    if (node.imageIndex) {
      selectedIndex = node.imageIndex
    }

    StateHandler.clipspace = {
      widgets: widgets,
      imgs: imgs,
      original_imgs: orig_imgs,
      images: node.images,
      selectedIndex: selectedIndex,
      img_paste_mode: 'selected' // reset to default im_paste_mode state on copy action
    }

    StateHandler.clipspace_return_node = null

    if (StateHandler.clipspace_invalidate_handler) {
      StateHandler.clipspace_invalidate_handler()
    }
  }

  /**
   * 把剪贴板里面的 Node 内容粘贴到当前节点（例如数值之类的）
   */
  static pasteFromClipspace(node) {
    if (StateHandler.clipspace) {
      // image paste
      if (StateHandler.clipspace.imgs && node.imgs) {
        if (node.images && StateHandler.clipspace.images) {
          if (StateHandler.clipspace['img_paste_mode'] == 'selected') {
            node.images = [
              StateHandler.clipspace.images[
                StateHandler.clipspace['selectedIndex']
              ]
            ]
          } else {
            node.images = StateHandler.clipspace.images
          }

          if (app.stateHandler.nodeOutputs[node.id + ''])
            app.stateHandler.nodeOutputs[node.id + ''].images = node.images
        }

        if (StateHandler.clipspace.imgs) {
          // deep-copy to cut link with clipspace
          if (StateHandler.clipspace['img_paste_mode'] == 'selected') {
            const img = new Image()
            img.src =
              StateHandler.clipspace.imgs[
                StateHandler.clipspace['selectedIndex']
              ].src
            node.imgs = [img]
            node.imageIndex = 0
          } else {
            const imgs = []
            for (let i = 0; i < StateHandler.clipspace.imgs.length; i++) {
              imgs[i] = new Image()
              imgs[i].src = StateHandler.clipspace.imgs[i].src
              node.imgs = imgs
            }
          }
        }
      }

      if (node.widgets) {
        if (StateHandler.clipspace.images) {
          const clip_image =
            StateHandler.clipspace.images[
              StateHandler.clipspace['selectedIndex']
            ]
          const index = node.widgets.findIndex((obj) => obj.name === 'image')
          if (index >= 0) {
            if (
              node.widgets[index].type != 'image' &&
              typeof node.widgets[index].value == 'string' &&
              clip_image.filename
            ) {
              node.widgets[index].value =
                (clip_image.subfolder ? clip_image.subfolder + '/' : '') +
                clip_image.filename +
                (clip_image.type ? ` [${clip_image.type}]` : '')
            } else {
              node.widgets[index].value = clip_image
            }
          }
        }
        if (StateHandler.clipspace.widgets) {
          StateHandler.clipspace.widgets.forEach(({ type, name, value }) => {
            const prop = Object.values(node.widgets).find(
              (obj: any) => obj.type === type && obj.name === name
            ) as IWidget

            if (prop && prop.type != 'button') {
              if (
                prop.type != 'image' &&
                typeof prop.value == 'string' &&
                value.filename
              ) {
                prop.value =
                  (value.subfolder ? value.subfolder + '/' : '') +
                  value.filename +
                  (value.type ? ` [${value.type}]` : '')
              } else {
                prop.value = value
                prop.callback(value)
              }
            }
          })
        }
      }

      app.canvasManager.graph.setDirtyCanvas(true)
    }
  }
}
