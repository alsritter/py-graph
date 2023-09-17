import { api } from '../api.js'
import { WorkflowManager } from '../workflow-manager/index.js'
import { CanvasManager } from '../canvas-manager/index.js'
import { NodeManager } from '../node-manager/index.js'
import { ProgressManager } from '../progress-manager/index.js'
import { Logger } from '../logger/index.js'

export class StateHandler implements Module {
  private workflowManager: WorkflowManager
  private nodeManager: NodeManager
  private canvasManager: CanvasManager
  private progressManager: ProgressManager
  private logger: Logger

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

  setup(config: ComfyCenter) {
    this.workflowManager = config.workflowManager
    this.canvasManager = config.canvasManager

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
      this.progressManager.progress = detail
      // Clear the preview image for the node
      this.canvasManager.graph.setDirtyCanvas(true, false)
    })

    api.addEventListener('executing', ({ detail }) => {
      this.progressManager.progress = null
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
}
