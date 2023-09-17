import { CanvasManager } from './canvas-manager/index.js'
import { ExtensionsManager } from './extension-manager/index.js'
import { WorkflowManager } from './workflow-manager/index.js'
import { NodeManager } from './node-manager/index.js'
import { EventManager } from './eventManager.js'
import { StateHandler } from './state-handler/index.js'
import { ProgressManager } from './progress-manager/index.js'
import { Logger } from './logger/index.js'

export class ComfyApp {
  logger: Logger
  nodeManager: NodeManager
  extensionsManager: ExtensionsManager
  canvasManager: CanvasManager
  stateHandler: StateHandler
  workflowManager: WorkflowManager
  progressManager: ProgressManager

  /**
   * Constructor for the class
   */
  constructor() {}

  /**
   * Set up the app on the page
   */
  async setup() {
    const eventManager = new EventManager()

    this.logger = new Logger()
    this.nodeManager = new NodeManager(eventManager)
    this.extensionsManager = new ExtensionsManager(eventManager)
    this.canvasManager = new CanvasManager(eventManager)
    this.stateHandler = new StateHandler()
    this.workflowManager = new WorkflowManager(eventManager)
    this.progressManager = new ProgressManager()

    // 注意这个加载顺序
    const modules: Module[] = [
      this.extensionsManager,
      this.canvasManager,
      this.stateHandler,
      this.nodeManager,
      this.progressManager,
      this.workflowManager,
      this.logger
    ]

    for (const module of modules) {
      await module.setup({
        logger: this.logger,
        nodeManager: this.nodeManager,
        extensionsManager: this.extensionsManager,
        canvasManager: this.canvasManager,
        stateHandler: this.stateHandler,
        workflowManager: this.workflowManager,
        progressManager: this.progressManager
      })
    }

    await eventManager.invokeExtensions('setup')
  }

  registerExtension(extension: ComfyExtension) {
    this.extensionsManager.registerExtension(extension)
  }
}

export const app = new ComfyApp()
