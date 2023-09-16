import { LGraphNode, IWidget, Vector2 } from './litegraph'
import { ComfyApp } from '../scripts/app'

type Merge<M, N> = Omit<M, Extract<keyof M, keyof N>> & N

declare global {
  interface Position {
    x: number
    y: number
  }

  type CustomEvent = Merge<
    Event,
    {
      target?: {
        value?: any
        checked?: boolean
      } & EventTarget &
        Element
    }
  >

  type CustomElement = Merge<
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

  type NodeError = {
    class_type: string
    errors: {
      message: string
      details: string
      extra_info: {
        input_name: string
      }
    }[]
  }

  interface ComfyExtension {
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
    getIWidgets?(
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
      nodeType: LGraphNode,
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
    loadedGraphNode?(node: LGraphNode, app: ComfyApp)
    /**
     * Allows the extension to run code after the constructor of the node
     * @param node The node that has been created
     * @param app The ComfyUI app instance
     */
    nodeCreated?(node: LGraphNode, app: ComfyApp)

    [key: string]: any
  }

  type ComfyObjectInfo = {
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

  type ComfyObjectInfoConfig = [string | any[]] | [string | any[], any]
}
