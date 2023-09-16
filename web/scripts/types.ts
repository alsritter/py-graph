import type {
  IWidget,
  LGraphNode,
  widgetTypes,
  LGraphCanvas,
  Vector2
} from '../types/litegraph'

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
  LGraphNode,
  {
    imgs?: string[]
    inputHeight?: number
    widgets?: CustomWidget[]

    addWidget<T extends CustomWidget>(
      type: T['type'],
      name: string,
      value: T['value'],
      callback?: CustomWidgetCallback<T> | string,
      options?: T['options']
    ): T

    addCustomWidget<T extends CustomWidget>(customWidget: T): T

    onResize?: (size?: number) => void
  }
>
