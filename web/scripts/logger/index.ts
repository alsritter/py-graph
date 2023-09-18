import { api } from '../api.js'
import { ComfyDialog } from '../canvas-manager/ui.js'
import { CanvasManager } from '../canvas-manager/index.js'
import { $el } from '../canvas-manager/tools.js'
import { stringify, jsonReplacer } from './tools.js'

$el('style', {
  textContent: `
        .comfy-logging-logs {
            display: grid;
            color: var(--fg-color);
            white-space: pre-wrap;
        }
        .comfy-logging-log {
            display: contents;
        }
        .comfy-logging-title {
            background: var(--tr-even-bg-color);
            font-weight: bold;
            margin-bottom: 5px;
            text-align: center;
        }
        .comfy-logging-log div {
            background: var(--row-bg);
            padding: 5px;
        }
    `,
  parent: document.body
})

export class Logger implements Module {
  private canvasManager: CanvasManager

  constructor() {
    this.dialog = new ComfyLoggingDialog(this)
  }

  init(config: ComfyCenter) {
    this.canvasManager = config.canvasManager
  }

  setup() {
    this.addSetting()
    this.catchUnhandled()
    this.addInitData()
  }

  /**
   * @type Array<{ source: string, type: string, timestamp: Date, message: any }>
   */
  entries: Array<{
    source: string
    type: string
    timestamp: Date
    message: any
  }> = []

  #enabled: boolean
  #console = {}

  dialog: ComfyLoggingDialog

  get enabled() {
    return this.#enabled
  }

  set enabled(value) {
    if (value === this.#enabled) return
    if (value) {
      this.patchConsole()
    } else {
      this.unpatchConsole()
    }
    this.#enabled = value
  }

  addSetting() {
    const settingId = 'Comfy.Logging.Enabled'
    const htmlSettingId = settingId.replaceAll('.', '-')
    const setting = this.canvasManager.ui.settings.addSetting({
      id: settingId,
      name: settingId,
      defaultValue: true,
      type: (name: any, setter: (arg0: boolean) => void, value: any) => {
        return $el('tr', [
          $el('td', [
            $el('label', {
              textContent: 'Logging',
              for: htmlSettingId
            })
          ]),
          $el('td', [
            $el('input', {
              id: htmlSettingId,
              type: 'checkbox',
              checked: value,
              onchange: (event) => {
                setter((this.enabled = event.target.checked))
              }
            }),
            $el('button', {
              textContent: 'View Logs',
              onclick: () => {
                this.canvasManager.ui.settings.element.close()
                this.dialog.show()
              },
              style: {
                fontSize: '14px',
                display: 'block',
                marginTop: '5px'
              }
            })
          ])
        ])
      }
    })
    this.enabled = setting.value
  }

  patchConsole() {
    // Capture common console outputs
    const self = this
    for (const type of ['log', 'warn', 'error', 'debug']) {
      const orig = console[type]
      this.#console[type] = orig
      console[type] = function () {
        orig.apply(console, arguments)
        self.addEntry('console', type, ...arguments)
      }
    }
  }

  unpatchConsole() {
    // Restore original console functions
    for (const type of Object.keys(this.#console)) {
      console[type] = this.#console[type]
    }
    this.#console = {}
  }

  catchUnhandled() {
    // Capture uncaught errors
    window.addEventListener('error', (e) => {
      this.addEntry('window', 'error', e.error ?? 'Unknown error')
      return false
    })

    window.addEventListener('unhandledrejection', (e) => {
      this.addEntry('unhandledrejection', 'error', e.reason ?? 'Unknown error')
    })
  }

  clear() {
    this.entries = []
  }

  addEntry(
    source: string,
    type: string,
    ...args: { UserAgent?: string; MissingNodes?: any[] }[]
  ) {
    if (this.enabled) {
      this.entries.push({
        source,
        type,
        timestamp: new Date(),
        message: args
      })
    }
  }

  log(source: string, ...args: any[]) {
    this.addEntry(source, 'log', ...args)
  }

  async addInitData() {
    if (!this.enabled) return
    const source = 'ComfyUI.Logging'
    this.addEntry(source, 'debug', { UserAgent: navigator.userAgent })
    const systemStats = await api.getSystemStats()
    this.addEntry(source, 'debug', systemStats)
  }

  formatRunnerError(error) {
    if (error == null) {
      return '(unknown error)'
    } else if (typeof error === 'string') {
      return error
    } else if (error.stack && error.message) {
      return error.toString()
    } else if (error.response) {
      let message = error.response.error.message
      if (error.response.error.details)
        message += ': ' + error.response.error.details
      for (const [nodeID, nodeError] of Object.entries(
        error.response.node_errors
      )) {
        message += '\n' + (nodeError as NodeError).class_type + ':'
        for (const errorReason of (nodeError as NodeError).errors) {
          message +=
            '\n    - ' + errorReason.message + ': ' + errorReason.details
        }
      }
      return message
    }
    return '(unknown error)'
  }

  formatExecutionError(error: {
    traceback: any[]
    node_id: any
    node_type: any
    exception_message: any
  }) {
    if (error == null) {
      return '(unknown error)'
    }

    const traceback = error.traceback.join('')
    const nodeId = error.node_id
    const nodeType = error.node_type

    return `Error occurred when executing ${nodeType}:\n\n${error.exception_message}\n\n${traceback}`
  }
}

class ComfyLoggingDialog extends ComfyDialog {
  logging: Logger
  fileInput: CustomElement

  constructor(logging: Logger) {
    super()
    this.logging = logging

    this.fileInput = $el('input', {
      type: 'file',
      accept: '.json',
      style: { display: 'none' },
      parent: document.body
    })
  }

  clear() {
    this.logging.clear()
    this.show()
  }

  export() {
    const blob = new Blob(
      [stringify([...this.logging.entries], 20, jsonReplacer, '\t')],
      {
        type: 'application/json'
      }
    )
    const url = URL.createObjectURL(blob)
    const a = $el('a', {
      href: url,
      download: `comfyui-logs-${Date.now()}.json`,
      style: { display: 'none' },
      parent: document.body
    })
    a.click()
    setTimeout(function () {
      a.remove()
      window.URL.revokeObjectURL(url)
    }, 0)
  }

  import() {
    this.fileInput.onchange = () => {
      const reader = new FileReader()
      reader.onload = () => {
        this.fileInput.remove()
        try {
          const obj = JSON.parse(reader.result as string)
          if (obj instanceof Array) {
            this.show(obj)
          } else {
            throw new Error('Invalid file selected.')
          }
        } catch (error) {
          alert('Unable to load logs: ' + error.message)
        }
      }
      reader.readAsText(this.fileInput.files[0])
    }
    this.fileInput.click()
  }

  createButtons() {
    return [
      $el('button', {
        type: 'button',
        textContent: 'Clear',
        onclick: () => this.clear()
      }),
      $el('button', {
        type: 'button',
        textContent: 'Export logs...',
        onclick: () => this.export()
      }),
      $el('button', {
        type: 'button',
        textContent: 'View exported logs...',
        onclick: () => this.import()
      }),
      ...super.createButtons()
    ]
  }

  getTypeColor(type) {
    switch (type) {
      case 'error':
        return 'red'
      case 'warn':
        return 'orange'
      case 'debug':
        return 'dodgerblue'
    }
  }

  show(entries?) {
    if (!entries) entries = this.logging.entries
    this.element.style.width = '100%'
    const cols = {
      source: 'Source',
      type: 'Type',
      timestamp: 'Timestamp',
      message: 'Message'
    }
    const keys = Object.keys(cols)
    const headers = Object.values(cols).map((title) =>
      $el('div.comfy-logging-title', {
        textContent: title
      })
    )
    const rows = entries.map((entry, i) => {
      return $el(
        'div.comfy-logging-log',
        {
          $: (el) =>
            el.style.setProperty(
              '--row-bg',
              `var(--tr-${i % 2 ? 'even' : 'odd'}-bg-color)`
            )
        },
        keys.map((key) => {
          let v = entry[key]
          let color
          if (key === 'type') {
            color = this.getTypeColor(v)
          } else {
            v = jsonReplacer(key, v, true)

            if (typeof v === 'object') {
              v = stringify(v, 5, jsonReplacer, '  ')
            }
          }

          return $el('div', {
            style: {
              color
            },
            textContent: v
          })
        })
      )
    })

    const grid = $el(
      'div.comfy-logging-logs',
      {
        style: {
          gridTemplateColumns: `repeat(${headers.length}, 1fr)`
        }
      },
      [...headers, ...rows]
    )
    const els = [grid]
    if (!this.logging.enabled) {
      els.unshift(
        $el('h3', {
          style: { textAlign: 'center' },
          textContent: 'Logging is disabled'
        })
      )
    }
    super.show($el('div', els))
  }
}
