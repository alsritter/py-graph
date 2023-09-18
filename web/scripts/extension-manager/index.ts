import { api } from '../api.js'
import { EventManager } from '../eventManager.js'

export class ExtensionsManager implements Module {
  /**
   * List of extensions that are registered with the app
   */
  extensions: ComfyExtension[]

  // 实现 API 加载逻辑

  constructor(private eventManager: EventManager) {}

  async init(config: ComfyCenter) {
    this.extensions = []
    const extensions = await api.getExtensions()
    for (const ext of extensions) {
      try {
        await import(api.apiURL(ext))
      } catch (error) {
        console.error('Error loading extension', ext, error)
      }
    }
    this.listenAndForwardEvents()
  }

  /**
   * 从 API URL 加载扩展
   */
  async setup() {}

  /**
   * 监听全部事件并转发给 invokeExtensionsAsync 函数调用
   */
  listenAndForwardEvents() {
    const events = [
      'init',
      'setup',
      'addCustomNodeDefs',
      'getCustomWidgets',
      'beforeRegisterNodeDef',
      'registerCustomNodes',
      'loadedGraphNode',
      'nodeCreated'
    ]

    for (const key of events) {
      this.eventManager.addEventListener(key, async (method: string, ...args: any[]) => {
        // 这里传入的是一个自定义插件的不同执行阶段的函数名称
        // 具体参考 logging.js.example 文件的说明
        return await Promise.all(
          this.extensions.map(async (ext) => {
            console.log(`Calling extension '${ext.name}' method '${key}'`)
            if (method in ext) {
              try {
                return await ext[key](...args, this)
              } catch (error) {
                console.error(
                  `Error calling extension '${ext.name}' method '${method}'`,
                  { error },
                  { extension: ext },
                  { args }
                )
              }
            }
          })
        )
      })
    }
  }

  /**
   * Registers extension with the app
   * @param {ComfyExtension} extension
   */
  registerExtension(extension: ComfyExtension) {
    if (!extension.name) {
      throw new Error("Extensions must have a 'name' property.")
    }
    if (this.extensions.find((ext) => ext.name === extension.name)) {
      throw new Error(`Extension named '${extension.name}' already registered.`)
    }
    this.extensions.push(extension)
  }
}
