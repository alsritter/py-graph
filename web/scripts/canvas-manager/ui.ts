import { api } from '../api.js'
import { $el } from './tools.js'

export class ComfyUI {
  menuContainer: CustomElement
  app: ComfyCenter
  dialog: ComfyDialog
  settings: ComfySettingsDialog
  queue: ComfyList
  history: ComfyList
  queueSize: CustomElement
  lastQueueSize: number | string = 0
  batchCount: number = 0

  /**
   * Represents the UI of the application.
   * 
   * !! 注意这里的 id，是可以通过 document.querySelector 取得元素的，例如保存之类的快捷键就是通过这个来实现的。
   * https://vscode.dev/github/alsritter/py-graph/blob/type/web/extensions/core/keybinds.ts#L21
   * 
   * @constructor
   * @param app - The main application object.
   */
  constructor(app: ComfyCenter) {
    this.app = app
    this.dialog = new ComfyDialog()
    this.settings = new ComfySettingsDialog()
    this.queue = new ComfyList('Queue', app)
    this.history = new ComfyList('History', app)

    const confirmClear = this.settings.addSetting({
      id: 'Comfy.ConfirmClear',
      name: 'Require confirmation when clearing workflow',
      type: 'boolean',
      defaultValue: true
    })

    const promptFilename = this.settings.addSetting({
      id: 'Comfy.PromptFilename',
      name: 'Runner for filename when saving workflow',
      type: 'boolean',
      defaultValue: true
    })

    const fileInput = $el('input', {
      id: 'comfy-file-input',
      type: 'file',
      accept: '.json,image/png,.latent,.safetensors',
      style: { display: 'none' },
      parent: document.body,
      onchange: () => {
        app.workflowManager.handleFile(fileInput.files[0])
      }
    })

    api.addEventListener('status', () => {
      this.queue.update()
      this.history.update()
    })

    // 创建菜单容器
    this.menuContainer = $el('div.comfy-menu', { parent: document.body }, [
      // 注意，这个 class 名称是有对应样式的
      $el(
        'div.drag-handle',
        {
          style: {
            position: 'relative',
            width: '100%',
            cursor: 'default'
          }
        },
        [
          $el('span.drag-handle'),
          $el('span', { $: (q) => (this.queueSize = q) }),
          $el('button.comfy-settings-btn', {
            textContent: '⚙️',
            onclick: () => this.settings.show()
          })
        ]
      ),
      $el('button.comfy-queue-btn', {
        id: 'queue-button',
        textContent: 'Queue Runner',
        onclick: () => app.stateHandler.queueRunner(0, this.batchCount)
      }),
      $el('div', {}, [
        $el('label', { innerHTML: 'Extra options' }, [
          $el('input', {
            type: 'checkbox',
            onchange: (i) => {
              document.getElementById('extraOptions').style.display = i.target
                .checked
                ? 'block'
                : 'none'
              this.batchCount = i.target.checked
                ? Number(
                    (
                      document.getElementById(
                        'batchCountInputRange'
                      ) as HTMLInputElement
                    ).value
                  )
                : 1

              const element = document.getElementById(
                'autoQueueCheckbox'
              ) as HTMLInputElement
              element.checked = false
            }
          })
        ])
      ]),
      $el(
        'div',
        { id: 'extraOptions', style: { width: '100%', display: 'none' } },
        [
          $el('label', { innerHTML: 'Batch count' }, [
            $el('input', {
              id: 'batchCountInputNumber',
              type: 'number',
              value: this.batchCount,
              min: '1',
              style: { width: '35%', 'margin-left': '0.4em' },
              oninput: (i) => {
                this.batchCount = i.target.value(
                  document.getElementById(
                    'batchCountInputRange'
                  ) as HTMLInputElement
                ).value = this.batchCount
              }
            }),
            $el('input', {
              id: 'batchCountInputRange',
              type: 'range',
              min: '1',
              max: '100',
              value: this.batchCount,
              oninput: (i) => {
                this.batchCount = i.target.value
                const element = document.getElementById(
                  'batchCountInputNumber'
                ) as HTMLInputElement
                element.value = i.target.value
              }
            }),
            $el('input', {
              id: 'autoQueueCheckbox',
              type: 'checkbox',
              checked: false,
              title: 'automatically queue runner when the queue size hits 0'
            })
          ])
        ]
      ),
      $el('div.comfy-menu-btns', [
        $el('button', {
          id: 'queue-front-button',
          textContent: 'Queue Front',
          onclick: () => app.stateHandler.queueRunner(-1, this.batchCount)
        }),
        $el('button', {
          $: (b) => (this.queue.button = b),
          id: 'comfy-view-queue-button',
          textContent: 'View Queue',
          onclick: () => {
            this.history.hide()
            this.queue.toggle()
          }
        }),
        $el('button', {
          $: (b) => (this.history.button = b),
          id: 'comfy-view-history-button',
          textContent: 'View History',
          onclick: () => {
            this.queue.hide()
            this.history.toggle()
          }
        })
      ]),
      this.queue.element,
      this.history.element,
      $el('button', {
        id: 'comfy-save-button',
        textContent: 'Save',
        onclick: () => {
          let filename = 'workflow.json'
          if (promptFilename.value) {
            filename = prompt('Save workflow as:', filename)
            if (!filename) return
            if (!filename.toLowerCase().endsWith('.json')) {
              filename += '.json'
            }
          }
          const json = JSON.stringify(
            app.canvasManager.graph.serialize(),
            null,
            2
          ) // convert the data to a JSON string
          const blob = new Blob([json], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = $el('a', {
            href: url,
            download: filename,
            style: { display: 'none' },
            parent: document.body
          })
          a.click()
          setTimeout(function () {
            a.remove()
            window.URL.revokeObjectURL(url)
          }, 0)
        }
      }),
      $el('button', {
        id: 'comfy-dev-save-api-button',
        textContent: 'Save (API Format)',
        style: { width: '100%', display: 'none' },
        onclick: () => {
          let filename = 'workflow_api.json'
          if (promptFilename.value) {
            filename = prompt('Save workflow (API) as:', filename)
            if (!filename) return
            if (!filename.toLowerCase().endsWith('.json')) {
              filename += '.json'
            }
          }
          app.workflowManager.graphToRunner().then((p) => {
            const json = JSON.stringify(p.output, null, 2) // convert the data to a JSON string
            const blob = new Blob([json], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = $el('a', {
              href: url,
              download: filename,
              style: { display: 'none' },
              parent: document.body
            })
            a.click()
            setTimeout(function () {
              a.remove()
              window.URL.revokeObjectURL(url)
            }, 0)
          })
        }
      }),
      $el('button', {
        id: 'comfy-load-button',
        textContent: 'Load',
        onclick: () => fileInput.click()
      }),
      $el('button', {
        id: 'comfy-clear-button',
        textContent: 'Clear',
        onclick: () => {
          if (!confirmClear.value || confirm('Clear workflow?')) {
            app.stateHandler.clean()
            app.canvasManager.graph.clear()
          }
        }
      }),
      $el('button', {
        id: 'comfy-load-default-button',
        textContent: 'Load Default',
        onclick: () => {
          if (!confirmClear.value || confirm('Load default workflow?')) {
            app.workflowManager.loadGraphData()
          }
        }
      })
    ])

    this.dragElement(this.menuContainer, this.settings)

    this.setStatus({ exec_info: { queue_remaining: 'X' } })
  }

  /**
   * 更新队列大小的显示。
   * @param status
   */
  setStatus(status) {
    this.queueSize.textContent =
      'Queue size: ' + (status ? status.exec_info.queue_remaining : 'ERR')
    if (status) {
      if (
        this.lastQueueSize != 0 &&
        status.exec_info.queue_remaining == 0 &&
        (document.getElementById('autoQueueCheckbox') as HTMLInputElement)
          .checked
      ) {
        this.app.stateHandler.queueRunner(0, this.batchCount)
      }
      this.lastQueueSize = status.exec_info.queue_remaining
    }
  }

  /**
   * 实现拖拽功能的函数，用于让指定元素可以通过鼠标拖动来改变其位置。
   *
   * @param {HTMLElement} dragEl - 要应用拖拽功能的元素。
   * @param {ComfySettingsDialog} settings - 可选参数，用于设置选项弹窗的位置。
   */
  dragElement(dragEl: CustomElement, settings: ComfySettingsDialog) {
    // 内部变量初始化
    var posDiffX = 0,
      posDiffY = 0,
      posStartX = 0,
      posStartY = 0,
      newPosX = 0,
      newPosY = 0

    // 绑定鼠标按下事件，启动拖拽
    if (dragEl.getElementsByClassName('drag-handle')[0]) {
      // 如果有拖拽手柄，从手柄进行拖拽
      ;(
        dragEl.getElementsByClassName('drag-handle')[0] as HTMLElement
      ).onmousedown = dragMouseDown
    } else {
      // 否则，从元素内任意位置进行拖拽
      dragEl.onmousedown = dragMouseDown
    }

    // 设置当元素大小发生改变时，保持在窗口内部
    const resizeObserver = new ResizeObserver(() => {
      ensureInBounds()
    }).observe(dragEl as Element)

    /**
     * 确保元素在窗口内部，如果有手动设置位置的类
     */
    function ensureInBounds() {
      // 只有在拥有 "comfy-menu-manual-pos" 类时才进行边界检查和调整
      if (dragEl.classList.contains('comfy-menu-manual-pos')) {
        newPosX = Math.min(
          document.body.clientWidth - dragEl.clientWidth,
          Math.max(0, dragEl.offsetLeft)
        )
        newPosY = Math.min(
          document.body.clientHeight - dragEl.clientHeight,
          Math.max(0, dragEl.offsetTop)
        )

        positionElement()
      }
    }

    /**
     * 根据位置设置元素样式
     */
    function positionElement() {
      const halfWidth = document.body.clientWidth / 2
      const anchorRight = newPosX + dragEl.clientWidth / 2 > halfWidth

      if (anchorRight) {
        // 如果位置在右侧，将元素向右对齐
        dragEl.style.left = 'unset'
        dragEl.style.right =
          document.body.clientWidth - newPosX - dragEl.clientWidth + 'px'
      } else {
        // 否则，将元素向左对齐
        dragEl.style.left = newPosX + 'px'
        dragEl.style.right = 'unset'
      }

      dragEl.style.top = newPosY + 'px'
      dragEl.style.bottom = 'unset'

      // 保存位置信息到本地存储
      if (savePos) {
        localStorage.setItem(
          'Comfy.MenuPosition',
          JSON.stringify({
            x: dragEl.offsetLeft,
            y: dragEl.offsetTop
          })
        )
      }
    }

    /**
     * 从本地存储恢复位置信息
     */
    function restorePos() {
      const posStr = localStorage.getItem('Comfy.MenuPosition')
      if (posStr) {
        const pos: Position = JSON.parse(posStr)
        newPosX = pos.x
        newPosY = pos.y
        positionElement()
        ensureInBounds()
      }
    }

    /**
     * 鼠标按下事件处理函数，启动元素拖拽
     */
    function dragMouseDown(e) {
      e = e || window.event
      e.preventDefault()

      // 记录鼠标按下时的初始位置
      posStartX = e.clientX
      posStartY = e.clientY

      // 鼠标按下后绑定事件，启动元素拖拽
      document.onmouseup = closeDragElement
      document.onmousemove = elementDrag
    }

    /**
     * 鼠标移动事件处理函数，实现元素拖拽
     */
    function elementDrag(e) {
      e = e || window.event
      e.preventDefault()

      // 添加类以标记元素被手动调整过位置
      dragEl.classList.add('comfy-menu-manual-pos')

      // 计算鼠标移动的差值
      posDiffX = e.clientX - posStartX
      posDiffY = e.clientY - posStartY
      posStartX = e.clientX
      posStartY = e.clientY

      // 计算新的位置并进行边界检查
      newPosX = Math.min(
        document.body.clientWidth - dragEl.clientWidth,
        Math.max(0, dragEl.offsetLeft + posDiffX)
      )
      newPosY = Math.min(
        document.body.clientHeight - dragEl.clientHeight,
        Math.max(0, dragEl.offsetTop + posDiffY)
      )

      // 更新元素位置
      positionElement()
    }

    // 在窗口大小调整时，确保元素在窗口内部
    window.addEventListener('resize', () => {
      ensureInBounds()
    })

    /**
     * 鼠标释放事件处理函数，停止元素拖拽
     */
    function closeDragElement() {
      // 停止拖拽
      document.onmouseup = null
      document.onmousemove = null
    }

    // 用于保存位置信息设置
    let savePos = undefined
    settings.addSetting({
      id: 'Comfy.MenuPosition',
      name: 'Save menu position',
      type: 'boolean',
      defaultValue: savePos,
      onChange(value, oldVal) {
        if (savePos === undefined && value) {
          restorePos()
        }
        savePos = value
      }
    })
  }
}

/**
 * Represents a list of items with a custom remove action and load action.
 */
export class ComfyList {
  #type: string // The type of the list.
  #text: string // The text to display in the list.
  element: CustomElement // The list element.
  button: CustomElement // The button to toggle the list.
  app: ComfyCenter

  /**
   * Creates a new ComfyList instance.
   * @param {string} text - The text to display in the list.
   * @param {string} [type] - The type of the list. Defaults to the lowercase version of the text.
   */
  constructor(text: string, app: ComfyCenter, type?: string) {
    this.#text = text
    this.#type = type || text.toLowerCase()
    this.element = $el('div.comfy-list')
    this.element.style.display = 'none'
    this.app = app
  }

  /**
   * Gets whether the list is currently visible.
   * @returns {boolean} - True if the list is visible, false otherwise.
   */
  get visible(): boolean {
    return this.element.style.display !== 'none'
  }

  /**
   * Loads the items in the list from the API.
   */
  async load() {
    const items = await api.getItems(this.#type)
    this.element.replaceChildren(
      ...Object.keys(items).flatMap(
        (section) =>
          [
            $el('h4', {
              textContent: section
            }),
            $el('div.comfy-list-items', [
              ...items[section].map((item) => {
                // Allow items to specify a custom remove action (e.g. for interrupt current prompt)
                const removeAction = item.remove || {
                  name: 'Delete',
                  cb: () => api.deleteItem(this.#type, item.prompt[1])
                }
                return $el('div', { textContent: item.prompt[0] + ': ' }, [
                  $el('button', {
                    textContent: 'Load',
                    onclick: () => {
                      this.app.workflowManager.loadGraphData(
                        item.prompt[3].extra_pnginfo.workflow
                      )
                      if (item.outputs) {
                        this.app.stateHandler.nodeOutputs = item.outputs
                      }
                    }
                  }),
                  $el('button', {
                    textContent: removeAction.name,
                    onclick: async () => {
                      await removeAction.cb()
                      await this.update()
                    }
                  })
                ])
              })
            ])
          ] as Node[]
      ),
      $el('div.comfy-list-actions', [
        $el('button', {
          textContent: 'Clear ' + this.#text,
          onclick: async () => {
            await api.clearItems(this.#type)
            await this.load()
          }
        }),
        $el('button', { textContent: 'Refresh', onclick: () => this.load() })
      ]) as Node
    )
  }

  /**
   * Updates the list if it is currently visible.
   */
  async update() {
    if (this.visible) {
      await this.load()
    }
  }

  /**
   * Shows the list.
   */
  async show() {
    this.element.style.display = 'block'
    this.button.textContent = 'Close'

    await this.load()
  }

  /**
   * Hides the list.
   */
  hide() {
    this.element.style.display = 'none'
    this.button.textContent = 'View ' + this.#text
  }

  /**
   * Toggles the visibility of the list.
   * @returns {boolean} - True if the list is now visible, false otherwise.
   */
  toggle(): boolean {
    if (this.visible) {
      this.hide()
      return false
    } else {
      this.show()
      return true
    }
  }
}

/**
 * 表示一个对话框的基类，用于创建和控制一个可自定义内容的对话框。
 */
export class ComfyDialog {
  element: CustomElement = null
  textElement: CustomElement = null

  constructor() {
    // 创建对话框的外层容器元素
    this.element = $el('div.comfy-modal', { parent: document.body }, [
      $el('div.comfy-modal-content', [
        $el('p', { $: (p) => (this.textElement = p) }),
        ...this.createButtons()
      ])
    ])
  }

  /**
   * 创建对话框中的按钮。
   * @returns 包含一个 "Close" 按钮的数组。
   */
  createButtons(): Array<CustomElement> {
    return [
      $el('button', {
        type: 'button',
        textContent: 'Close',
        onclick: () => this.close()
      })
    ]
  }

  /**
   * 关闭对话框，隐藏它的显示。
   */
  close() {
    this.element.style.display = 'none'
  }

  /**
   * 显示对话框，可以通过传递 HTML 内容或 HTMLElement 来自定义显示内容。
   * @param html - 要显示的 HTML 内容或 HTMLElement。
   */
  show(html: string | CustomElement) {
    if (typeof html === 'string') {
      // 如果传递的是字符串，将其设置为对话框的文本内容
      this.textElement.innerHTML = html
    } else {
      // 否则，使用传递的 HTMLElement 替换对话框的文本内容
      this.textElement.replaceChildren(html)
    }

    // 显示对话框
    this.element.style.display = 'flex'
  }
}

/**
 * 表示一个设置对话框的扩展类，用于创建和管理可自定义设置的模态对话框。
 * 继承自 ComfyDialog 类。
 */
export class ComfySettingsDialog extends ComfyDialog {
  settings = []

  constructor() {
    super()
    // 创建设置对话框的外层容器元素
    this.element = $el(
      'dialog',
      {
        id: 'comfy-settings-dialog',
        parent: document.body
      },
      [
        $el('table.comfy-modal-content.comfy-table', [
          $el('caption', { textContent: 'Settings' }),
          $el('tbody', { $: (tbody) => (this.textElement = tbody) }),
          $el('button', {
            type: 'button',
            textContent: 'Close',
            style: {
              cursor: 'pointer'
            },
            onclick: () => {
              this.element.close()
            }
          })
        ])
      ]
    )
    this.settings = []
  }

  /**
   * 获取指定设置的值。
   * @param {string} id - 设置的唯一标识符。
   * @param {any} defaultValue - 默认值，如果没有保存的设置值时使用。
   * @returns {*} - 设置的值，如果不存在则返回默认值。
   */
  getSettingValue(id: string, defaultValue?: any): any {
    const settingId = 'Comfy.Settings.' + id
    const v = localStorage[settingId]
    return v == null ? defaultValue : JSON.parse(v)
  }

  /**
   * 设置指定设置的值。
   * @param {string} id - 设置的唯一标识符。
   * @param {*} value - 要设置的值。
   */
  setSettingValue(id: string, value: any) {
    const settingId = 'Comfy.Settings.' + id
    localStorage[settingId] = JSON.stringify(value)
  }

  /**
   * 添加一个设置选项，并根据提供的参数自动生成设置项的UI。
   * @param {Object} param - 设置选项的参数。
   *   @property {string} id - 设置的唯一标识符。
   *   @property {string} name - 设置的名称。
   *   @property {string} type - 设置的类型，例如 "boolean"、"number" 等。
   *   @property {*} defaultValue - 默认值，如果没有保存的设置值时使用。
   *   @property {function} onChange - 当设置值发生变化时的回调函数。
   *   @property {Object} attrs - 可选，用于设置输入元素的其他属性。
   *   @property {string} tooltip - 可选，设置的工具提示文本。
   *   @property {Array|function} options - 可选，用于 "combo" 类型的下拉选项。
   * @returns {Object} - 返回具有 `value` 属性的对象，用于获取和设置设置项的值。
   */
  addSetting({
    id,
    name,
    type,
    defaultValue,
    onChange = (newValue, oldValue?) => {},
    attrs = {},
    tooltip = '',
    options = undefined
  }) {
    // 验证参数是否合法
    if (!id) {
      throw new Error('Settings must have an ID')
    }

    if (this.settings.find((s) => s.id === id)) {
      throw new Error(`Setting ${id} of type ${type} must have a unique ID.`)
    }

    // 构建设置项的唯一标识符
    const settingId = `Comfy.Settings.${id}`
    const v = localStorage[settingId]
    let value = v == null ? defaultValue : JSON.parse(v)

    // 触发初始设置值的回调
    if (onChange) {
      onChange(value, undefined)
    }

    // 添加设置项到列表
    this.settings.push({
      render: () => {
        // 设置值的处理函数
        const setter = (v) => {
          if (onChange) {
            onChange(v, value)
          }
          localStorage[settingId] = JSON.stringify(v)
          value = v
        }
        value = this.getSettingValue(id, defaultValue)

        let element: CustomElement
        const htmlID = id.replaceAll('.', '-')
        // 创建标签单元格
        const labelCell = $el('td', [
          $el('label', {
            for: htmlID,
            // @ts-ignore
            classList: [tooltip !== '' ? 'comfy-tooltip-indicator' : ''],
            textContent: name
          })
        ])

        // 根据类型创建设置项的UI元素
        if (typeof type === 'function') {
          element = type(name, setter, value, attrs)
        } else {
          switch (type) {
            case 'boolean':
              element = $el('tr', [
                labelCell,
                $el('td', [
                  $el('input', {
                    id: htmlID,
                    type: 'checkbox',
                    checked: value,
                    onchange: (event) => {
                      const isChecked = event.target.checked
                      if (onChange !== undefined) {
                        onChange(isChecked)
                      }
                      this.setSettingValue(id, isChecked)
                    }
                  })
                ])
              ])
              break
            case 'number':
              // 创建数字输入框设置项
              element = $el('tr', [
                labelCell,
                $el('td', [
                  $el('input', {
                    type,
                    value,
                    id: htmlID,
                    oninput: (e) => {
                      setter(e.target.value)
                    },
                    ...attrs
                  })
                ])
              ])
              break
            case 'slider':
              // 创建滑块设置项
              element = $el('tr', [
                labelCell,
                $el('td', [
                  $el(
                    'div',
                    {
                      style: {
                        display: 'grid',
                        gridAutoFlow: 'column'
                      }
                    },
                    [
                      $el('input', {
                        ...attrs,
                        value,
                        type: 'range',
                        oninput: (e) => {
                          setter(e.target.value)
                          ;(
                            e.target.nextElementSibling as HTMLInputElement
                          ).value = e.target.value
                        }
                      }),
                      $el('input', {
                        ...attrs,
                        value,
                        id: htmlID,
                        type: 'number',
                        style: { maxWidth: '4rem' },
                        oninput: (e) => {
                          setter(e.target.value)
                          ;(
                            e.target.nextElementSibling as HTMLInputElement
                          ).value = e.target.value
                        }
                      })
                    ]
                  )
                ])
              ])
              break
            case 'combo':
              // 创建下拉框设置项
              element = $el('tr', [
                labelCell,
                $el('td', [
                  $el(
                    'select',
                    {
                      oninput: (e) => {
                        setter(e.target.value)
                      }
                    },
                    (typeof options === 'function'
                      ? options(value)
                      : options || []
                    ).map((opt) => {
                      if (typeof opt === 'string') {
                        opt = { text: opt }
                      }
                      const v = opt.value ?? opt.text
                      return $el('option', {
                        value: v,
                        textContent: opt.text,
                        selected: value + '' === v + ''
                      })
                    })
                  )
                ])
              ])
              break
            case 'text':
            default:
              // 创建文本输入框设置项
              if (type !== 'text') {
                console.warn(
                  `Unsupported setting type '${type}, defaulting to text`
                )
              }

              element = $el('tr', [
                labelCell,
                $el('td', [
                  $el('input', {
                    value,
                    id: htmlID,
                    oninput: (e) => {
                      setter(e.target.value)
                    },
                    ...attrs
                  })
                ])
              ])
              break
          }
        }
        if (tooltip) {
          element.title = tooltip
        }

        return element
      }
    })

    // 返回对象，允许获取和设置设置项的值
    const self = this
    return {
      get value() {
        return self.getSettingValue(id, defaultValue)
      },
      set value(v) {
        self.setSettingValue(id, v)
      }
    }
  }

  show() {
    this.textElement.replaceChildren(
      $el(
        'tr',
        {
          style: { display: 'none' }
        },
        [$el('th'), $el('th', { style: { width: '33%' } })]
      ) as Node,
      ...this.settings.map((s) => s.render())
    )
    this.element.showModal()
  }
}
