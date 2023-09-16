import { LGraphNode, IWidget } from './litegraph'
import { ComfyApp } from '../scripts/app'

type Merge<M, N> = Omit<M, Extract<keyof M, keyof N>> & N

export interface Position {
  x: number
  y: number
}

export type CustomEvent = Merge<
  Event,
  {
    target?: {
      value?: any
      checked?: boolean
    } & EventTarget &
      Element
  }
>

export type CustomElement = Merge<
  Partial<HTMLElement>,
  {
    parent?: CustomElement | Element
    $?: (element: CustomElement) => void
    dataset?: Record<string, string>
    style?: {
      [key: string]: any
    }

    // Override the following properties types to allow for custom elements
    classList?: DOMTokenList

    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLElement/input_event) */
    oninput?: ((this: GlobalEventHandlers, ev: CustomEvent) => any) | null

    /**
     * Fires when the contents of the object or selection have changed.
     * @param ev The event.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/HTMLElement/change_event)
     */
    onchange?: ((this: GlobalEventHandlers, ev: CustomEvent) => any) | null

    [key: string]: any
  }
>

export type NodeError = {
  class_type: string
  errors: {
    message: string
    details: string
    extra_info: {
      input_name: string
    }
  }[]
}

// ============== litegraph =============== //

export type customWidgetTypes = widgetTypes | 'customtext'

export type CustomWidgetCallback<T extends CustomWidget = CustomWidget> = (
  this: T,
  value: T['value'],
  graphCanvas?: LGraphCanvas,
  node?: LGraphNode,
  pos?: Vector2,
  event?: MouseEvent
) => void

export type CustomWidget = Merge<
  IWidget,
  {
    parent?: CustomGraphNode
    type?: customWidgetTypes
    inputEl?: HTMLTextAreaElement
    computedHeight?: number

    onRemove?: () => void

    callback?: CustomWidgetCallback

    /**
     * 在排队后执行的操作
     */
    afterQueued?: () => void
  }
>

export type CustomGraphNode = Merge<
  Partial<LGraphNode>,
  {
    imgs?: Record<string, any>
    inputHeight?: number
    widgets?: CustomWidget[]
    comfyClass?: string

    addWidget<T extends CustomWidget>(
      type: T['type'],
      name: string,
      value: T['value'],
      callback?: CustomWidgetCallback<T> | string,
      options?: T['options']
    ): T

    addCustomWidget<T extends CustomWidget>(customWidget: T): T

    setSizeForImage?: () => void

    callback?: (...argArray: any[]) => void

    onDrawBackground?: (ctx: CanvasRenderingContext2D) => void

    /**
     * 如果是存前端的 Node 可以添加这个回调
     * @param event
     * @returns
     */
    onExecuted?: (event: any) => void

    /**
     * On drop upload files
     * @param event
     * @returns
     */
    onDragDrop?: (event: DragEvent) => boolean

    /**
     * Add handler to check if an image is being dragged over our node
     * @param event
     * @returns
     */
    onDragOver?: (event: DragEvent) => boolean

    /**
     * 重新计算节点的高度
     * @param size
     * @returns
     */
    onResize?: (size?: number) => void
  }
>


export interface ComfyExtension {
  /**
   * The name of the extension
   */
  name: string
  /**
   * Allows any initialisation, e.g. loading resources. Called after the canvas is created but before nodes are added
   * @param app The ComfyUI app instance
   */
  init?: ((app: ComfyApp) => Promise<void>) | ((app: ComfyApp) => void)
  /**
   * Allows any additonal setup, called after the application is fully set up and running
   * @param app The ComfyUI app instance
   */
  setup?: ((app: ComfyApp) => Promise<void>) | ((app: ComfyApp) => void)
  /**
   * Called before nodes are registered with the graph
   * @param defs The collection of node definitions, add custom ones or edit existing ones
   * @param app The ComfyUI app instance
   */
  addCustomNodeDefs?(
    defs: Record<string, ComfyObjectInfo>,
    app: ComfyApp
  ): Promise<void>
  /**
   * Allows the extension to add custom widgets
   * @param app The ComfyUI app instance
   * @returns An array of {[widget name]: widget data}
   */
  getCustomWidgets?(
    app: ComfyApp
  ): Promise<
    Record<
      string,
      (
        node,
        inputName,
        inputData,
        app
      ) => { widget?: IWidget; minWidth?: number; minHeight?: number }
    >
  >
  /**
   * Allows the extension to add additional handling to the node before it is registered with LGraph
   * @param nodeType The node class (not an instance)
   * @param nodeData The original node object info config object
   * @param app The ComfyUI app instance
   */
  beforeRegisterNodeDef?(
    nodeType: CustomGraphNode,
    nodeData: ComfyObjectInfo,
    app: ComfyApp
  ): Promise<void>
  /**
   * Allows the extension to register additional nodes with LGraph after standard nodes are added
   * @param app The ComfyUI app instance
   */
  registerCustomNodes?:
    | ((app: ComfyApp) => Promise<void>)
    | ((app: ComfyApp) => void)
  /**
   * Allows the extension to modify a node that has been reloaded onto the graph.
   * If you break something in the backend and want to patch workflows in the frontend
   * This is the place to do this
   * @param node The node that has been loaded
   * @param app The ComfyUI app instance
   */
  loadedGraphNode?(node: CustomGraphNode, app: ComfyApp)
  /**
   * Allows the extension to run code after the constructor of the node
   * @param node The node that has been created
   * @param app The ComfyUI app instance
   */
  nodeCreated?(node: CustomGraphNode, app: ComfyApp)

  [key: string]: any
}

export type ComfyObjectInfo = {
  name: string
  display_name?: string
  description?: string
  category: string
  input?: {
    required?: Record<string, ComfyObjectInfoConfig>
    optional?: Record<string, ComfyObjectInfoConfig>
  }
  output?: string[]
  output_name: string[]
}

export type ComfyObjectInfoConfig = [string | any[]] | [string | any[], any]
