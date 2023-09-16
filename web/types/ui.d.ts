import { ComfyApp } from './app'

export interface Position {
  x: number
  y: number
}

export interface CustomEvent extends Event {
  target?: {
    value?: any
    checked?: boolean
  } & EventTarget &
    Element
}

export interface CustomElement extends Partial<HTMLElement> {
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

/**
 * 表示一个对话框的基类，用于创建和控制一个可自定义内容的对话框。
 */
export declare class ComfyDialog {
  constructor()
  /**
   * 创建对话框中的按钮。
   * @returns {Array<HTMLElement>} - 包含一个 "Close" 按钮的数组。
   */
  createButtons(): Array<HTMLElement>
  /**
   * 关闭对话框，隐藏它的显示。
   */
  close(): void
  /**
   * 显示对话框，可以通过传递 HTML 内容或 HTMLElement 来自定义显示内容。
   * @param {string|HTMLElement} html - 要显示的 HTML 内容或 HTMLElement。
   */
  show(html: string | HTMLElement): void
}

export declare class ComfyUI {
  menuContainer: any
  /**
   * Represents the UI of the application.
   * @constructor
   * @param {ComfyApp} app - The main application object.
   */
  constructor(app: ComfyApp)
  setStatus(status: any): void
}
