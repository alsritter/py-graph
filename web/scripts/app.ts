import { CanvasManager } from './canvas-manager/index.js'
import { ExtensionsManager } from './extension-manager/index.js'
import { WorkflowManager } from './workflow-manager/index.js'
import { NodeManager } from './node-manager/index.js'
import { EventManager } from './event.js'
import { StateHandler } from './state-handler/index.js'
import { Logger } from './logger/index.js'

export class ComfyApp {
  logger: Logger
  nodeManager: NodeManager
  extensionsManager: ExtensionsManager
  canvasManager: CanvasManager
  stateHandler: StateHandler
  workflowManager: WorkflowManager

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

    // 注意这个加载顺序
    const modules: Module[] = [
      this.extensionsManager,
      this.canvasManager,
      this.stateHandler,
      this.nodeManager,
      this.workflowManager,
      this.logger
    ]

    // 初始化阶段
    for (const module of modules) {
      await module.init({
        logger: this.logger,
        nodeManager: this.nodeManager,
        extensionsManager: this.extensionsManager,
        canvasManager: this.canvasManager,
        stateHandler: this.stateHandler,
        workflowManager: this.workflowManager
      })
    }

    // 启动各个模块
    for (const module of modules) {
      await module.setup()
    }

    await eventManager.invokeExtensions('setup', this)
  }

  registerExtension(extension: ComfyExtension) {
    this.extensionsManager.registerExtension(extension)
  }
}

export const app = new ComfyApp()
