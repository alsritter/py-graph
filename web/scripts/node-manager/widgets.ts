import { api } from '../api.js'

function getNumberDefaults(inputData, defaultStep) {
  let defaultVal = inputData[1]['default']
  let { min, max, step } = inputData[1]

  if (defaultVal == undefined) defaultVal = 0
  if (min == undefined) min = 0
  if (max == undefined) max = 2048
  if (step == undefined) step = defaultStep

  inputData[1].min = min
  inputData[1].max = max
  inputData[1].step = 10.0 * step

  return { val: defaultVal, config: { ...inputData[1] } }
}

/**
 * 添加种子值控制 Widget 到节点上。
 * @param node 目标节点。
 * @param targetWidget 目标 Widget，需要受控制的 Widget。
 * @param defaultValue 默认值，控制模式的初始设置。可选值包括 "fixed", "increment", "decrement", "randomize"。
 * @param values 控制模式的可选值。默认为 ["fixed", "increment", "decrement", "randomize"]。
 * @returns 返回创建的值控制Widget。
 */
export function addValueSeedControlWidget(
  node: LGraphNode,
  targetWidget: IWidget,
  defaultValue = 'randomize'
) {
  const valueControl = node.addWidget(
    'combo',
    'control_after_generate',
    defaultValue,
    function (v) {},
    {
      values: ['fixed', 'increment', 'decrement', 'randomize'],
      serialize: false
    }
  )

  valueControl.afterQueued = () => {
    var v = valueControl.value
    if (targetWidget.type == 'combo' && v !== 'fixed') {
      let current_index = targetWidget.options.values.indexOf(
        targetWidget.value
      )
      let current_length = targetWidget.options.values.length

      switch (v) {
        case 'increment':
          current_index += 1
          break
        case 'decrement':
          current_index -= 1
          break
        case 'randomize':
          current_index = Math.floor(Math.random() * current_length)
        default:
          break
      }

      current_index = Math.max(0, current_index)
      current_index = Math.min(current_length - 1, current_index)
      if (current_index >= 0) {
        let value = targetWidget.options.values[current_index]
        targetWidget.value = value
        targetWidget.callback(value)
      }
    } else {
      //number
      let min = targetWidget.options.min
      let max = targetWidget.options.max
      // limit to something that javascript can handle
      max = Math.min(1125899906842624, max)
      min = Math.max(-1125899906842624, min)
      let range = (max - min) / (targetWidget.options.step / 10)

      //adjust values based on valueControl Behaviour
      switch (v) {
        case 'fixed':
          break
        case 'increment':
          targetWidget.value += targetWidget.options.step / 10
          break
        case 'decrement':
          targetWidget.value -= targetWidget.options.step / 10
          break
        case 'randomize':
          targetWidget.value =
            Math.floor(Math.random() * range) *
              (targetWidget.options.step / 10) +
            min
        default:
          break
      }
      /*check if values are over or under their respective
       * ranges and set them to min or max.*/
      if (targetWidget.value < min) targetWidget.value = min

      if (targetWidget.value > max) targetWidget.value = max
    }
  }
  return valueControl
}

const MultilineSymbol = Symbol()
const MultilineResizeSymbol = Symbol()

/**
 * 在 LiteGraph 节点上添加多行 Widget，自动计算布局和尺寸。
 * @param node - 要添加 Widget 的 LiteGraph 节点对象。
 * @param name - Widget的名称。
 * @param opts - Widget的选项。
 * @param opts.defaultVal - 默认值
 * @param opts.placeholder - 占位符
 * @param app - 应用程序的上下文。
 */
function addMultilineWidget(
  node: LGraphNode,
  name: string,
  opts: { [key: string]: any },
  app: ComfyCenter
) {
  const MIN_SIZE = 50

  function computeSize(size) {
    if (node.widgets[0].last_y == null) return

    let y = node.widgets[0].last_y
    let freeSpace = size[1] - y

    // Compute the height of all non customtext widgets
    let widgetHeight = 0
    const multi = []
    for (let i = 0; i < node.widgets.length; i++) {
      const w = node.widgets[i]
      if (w.type === 'customtext') {
        multi.push(w)
      } else {
        if (w.computeSize) {
          widgetHeight += w.computeSize(null)[1] + 4
        } else {
          widgetHeight += LiteGraph.NODE_WIDGET_HEIGHT + 4
        }
      }
    }

    // See how large each text input can be
    freeSpace -= widgetHeight
    freeSpace /= multi.length + (node.imgs?.length || 0)

    if (freeSpace < MIN_SIZE) {
      // There isnt enough space for all the widgets, increase the size of the node
      freeSpace = MIN_SIZE
      node.size[1] =
        y + widgetHeight + freeSpace * (multi.length + (node.imgs?.length || 0))
      node.graph.setDirtyCanvas(true)
    }

    // Position each of the widgets
    for (const w of node.widgets) {
      w.y = y
      if (w.type === 'customtext') {
        y += freeSpace
        w.computedHeight = freeSpace - multi.length * 4
      } else if (w.computeSize) {
        y += w.computeSize()[1] + 4
      } else {
        y += LiteGraph.NODE_WIDGET_HEIGHT + 4
      }
    }

    node.inputHeight = freeSpace
  }

  const widget: IWidget = {
    type: 'customtext',
    name,
    get value() {
      return this.inputEl.value
    },
    set value(x) {
      this.inputEl.value = x
    },
    draw: function (ctx, _, widgetWidth, y, widgetHeight) {
      if (!this.parent.inputHeight) {
        // If we are initially offscreen when created we wont have received a resize event
        // Calculate it here instead
        computeSize(node.size)
      }
      const visible =
        app.canvasManager.canvas.ds.scale > 0.5 && this.type === 'customtext'
      const margin = 10
      const elRect = ctx.canvas.getBoundingClientRect()
      const transform = new DOMMatrix()
        .scaleSelf(
          elRect.width / ctx.canvas.width,
          elRect.height / ctx.canvas.height
        )
        .multiplySelf(ctx.getTransform())
        .translateSelf(margin, margin + y)

      const scale = new DOMMatrix().scaleSelf(transform.a, transform.d)
      Object.assign(this.inputEl.style, {
        transformOrigin: '0 0',
        transform: scale,
        left: `${transform.a + transform.e}px`,
        top: `${transform.d + transform.f}px`,
        width: `${widgetWidth - margin * 2}px`,
        height: `${this.parent.inputHeight - margin * 2}px`,
        position: 'absolute',
        background: !node.color ? '' : node.color,
        color: !node.color ? '' : 'white',
        zIndex: app.canvasManager.graph._nodes.indexOf(node)
      })
      this.inputEl.hidden = !visible
    }
  }

  widget.inputEl = document.createElement('textarea')
  widget.inputEl.className = 'comfy-multiline-input'
  widget.inputEl.value = opts.defaultVal
  widget.inputEl.placeholder = opts.placeholder || ''
  document.addEventListener('mousedown', function (event) {
    if (!widget.inputEl.contains(event.target as Node)) {
      widget.inputEl.blur()
    }
  })
  widget.parent = node
  document.body.appendChild(widget.inputEl)

  node.addCustomWidget(widget)

  app.canvasManager.canvas.onDrawBackground = function () {
    // Draw node isnt fired once the node is off the screen
    // if it goes off screen quickly, the input may not be removed
    // this shifts it off screen so it can be moved back if the node is visible.
    for (let i in app.canvasManager.graph._nodes) {
      const n = app.canvasManager.graph._nodes[i]
      for (let w in n.widgets) {
        let wid = n.widgets[w]
        if (Object.hasOwn(wid, 'inputEl')) {
          wid.inputEl.style.left = -8000 + 'px'
          wid.inputEl.style.position = 'absolute'
        }
      }
    }
  }

  node.onRemoved = function () {
    // When removing this node we need to remove the input from the DOM
    for (let y in this.widgets) {
      if (this.widgets[y].inputEl) {
        this.widgets[y].inputEl.remove()
      }
    }
  }

  widget.onRemove = () => {
    widget.inputEl?.remove()

    // Restore original size handler if we are the last
    if (!--node[MultilineSymbol]) {
      node.onResize = node[MultilineResizeSymbol]
      delete node[MultilineSymbol]
      delete node[MultilineResizeSymbol]
    }
  }

  if (node[MultilineSymbol]) {
    node[MultilineSymbol]++
  } else {
    node[MultilineSymbol] = 1
    const onResize = (node[MultilineResizeSymbol] = node.onResize)

    node.onResize = function (size) {
      computeSize(size)

      // Call original resizer handler
      if (onResize) {
        onResize.apply(this, arguments)
      }
    }
  }

  return { minWidth: 400, minHeight: 200, widget }
}

function isSlider(display: string, app: ComfyCenter) {
  if (app.canvasManager.ui.settings.getSettingValue('Comfy.DisableSliders')) {
    return 'number'
  }
  return display === 'slider' ? 'slider' : 'number'
}

function seedWidget(node, inputName, inputData, app) {
	const seed = ComfyWidgets.INT(node, inputName, inputData, app);
	const seedControl = addValueSeedControlWidget(node, seed.widget, "randomize");

	seed.widget.linkedWidgets = [seedControl];
	return seed;
}

/**
 * ComfyWidgets 是一个包含不同类型Widget生成函数的对象，用于在 LiteGraph 节点上添加各种类型的交互Widget。
 * 参考官方的文档：
 * https://github.com/jagenjo/litegraph.js/blob/master/guides/README.md#node-widgets
 */
export const ComfyWidgets = {
  "INT:seed": seedWidget,
  FLOAT(node: LGraphNode, inputName, inputData, app: ComfyCenter) {
    let widgetType = isSlider(inputData[1]['display'], app) as widgetTypes
    let { val, config } = getNumberDefaults(inputData, 0.5)
    return {
      widget: node.addWidget(widgetType, inputName, val, () => {}, config)
    }
  },
  INT(node, inputName, inputData, app) {
    let widgetType = isSlider(inputData[1]['display'], app)
    const { val, config } = getNumberDefaults(inputData, 1)
    Object.assign(config, { precision: 0 })
    return {
      widget: node.addWidget(
        widgetType,
        inputName,
        val,
        function (v) {
          const s = this.options.step / 10
          this.value = Math.round(v / s) * s
        },
        config
      )
    }
  },
  BOOLEAN(node, inputName, inputData) {
    let defaultVal = inputData[1]['default']
    return {
      widget: node.addWidget('toggle', inputName, defaultVal, () => {}, {
        on: inputData[1].label_on,
        off: inputData[1].label_off
      })
    }
  },
  /**
   * 字符串类型
   */
  STRING(node: LGraphNode, inputName, inputData, app: ComfyCenter) {
    const defaultVal = inputData[1].default || ''
    const multiline = !!inputData[1].multiline

    let res: { widget: any; minWidth?: number; minHeight?: number }
    if (multiline) {
      res = addMultilineWidget(
        node,
        inputName,
        { defaultVal, ...inputData[1] },
        app
      )
    } else {
      res = {
        widget: node.addWidget('text', inputName, defaultVal, () => {}, {})
      }
    }

    if (inputData[1].dynamicPrompts != undefined)
      res.widget.dynamicPrompts = inputData[1].dynamicPrompts

    return res
  },
  /**
   * 枚举类型
   */
  COMBO(node, inputName, inputData, app: ComfyCenter) {
    const type = inputData[0]
    let defaultValue = type[0]
    if (inputData[1] && inputData[1].default) {
      defaultValue = inputData[1].default
    }
    return {
      widget: node.addWidget('combo', inputName, defaultValue, () => {}, {
        values: type // e.g. ["red","green","blue"] or  { "title1":value1, "title2":value2 }
      })
    }
  },
  IMAGEUPLOAD(node: LGraphNode, inputName, inputData, app: ComfyCenter) {
    const imageWidget = node.widgets.find((w) => w.name === 'image')
    let uploadWidget

    function showImage(name) {
      const img = new Image()
      img.onload = () => {
        node.imgs = [img]
        app.canvasManager.graph.setDirtyCanvas(true)
      }
      let folder_separator = name.lastIndexOf('/')
      let subfolder = ''
      if (folder_separator > -1) {
        subfolder = name.substring(0, folder_separator)
        name = name.substring(folder_separator + 1)
      }
      img.src = api.apiURL(
        `/view?filename=${name}&type=input&subfolder=${subfolder}${app.canvasManager.getPreviewFormatParam()}`
      )
      node.setSizeForImage?.()
    }

    var default_value = imageWidget.value
    Object.defineProperty(imageWidget, 'value', {
      set: function (value) {
        this._real_value = value
      },

      get: function () {
        let value
        if (this._real_value) {
          value = this._real_value
        } else {
          return default_value
        }

        if (value.filename) {
          let real_value = value
          value = ''
          if (real_value.subfolder) {
            value = real_value.subfolder + '/'
          }

          value += real_value.filename

          if (real_value.type && real_value.type !== 'input')
            value += ` [${real_value.type}]`
        }
        return value
      }
    })

    // Add our own callback to the combo widget to render an image when it changes
    const cb = node.callback
    imageWidget.callback = function () {
      showImage(imageWidget.value)
      if (cb) {
        return cb.apply(this, arguments)
      }
    }

    // On load if we have a value then render the image
    // The value isnt set immediately so we need to wait a moment
    // No change callbacks seem to be fired on initial setting of the value
    requestAnimationFrame(() => {
      if (imageWidget.value) {
        showImage(imageWidget.value)
      }
    })

    async function uploadFile(file, updateNode) {
      try {
        // Wrap file in formdata so it includes filename
        const body = new FormData()
        body.append('image', file)
        const resp = await api.fetchApi('/upload/image', {
          method: 'POST',
          body
        })

        if (resp.status === 200) {
          const data = await resp.json()
          // Add the file as an option and update the widget value
          if (!imageWidget.options.values.includes(data.name)) {
            imageWidget.options.values.push(data.name)
          }

          if (updateNode) {
            showImage(data.name)

            imageWidget.value = data.name
          }
        } else {
          alert(resp.status + ' - ' + resp.statusText)
        }
      } catch (error) {
        alert(error)
      }
    }

    const fileInput = document.createElement('input')
    Object.assign(fileInput, {
      type: 'file',
      accept: 'image/jpeg,image/png,image/webp',
      style: 'display: none',
      onchange: async () => {
        if (fileInput.files.length) {
          await uploadFile(fileInput.files[0], true)
        }
      }
    })
    document.body.append(fileInput)

    // Create the button widget for selecting the files
    uploadWidget = node.addWidget(
      'button',
      'choose file to upload',
      'image',
      () => {
        fileInput.click()
      }
    )
    uploadWidget.serialize = false

    // Add handler to check if an image is being dragged over our node
    node.onDragOver = function (e: LDragEvent) {
      if (e.dataTransfer && e.dataTransfer.items) {
        const image = [...e.dataTransfer.items].find((f) => f.kind === 'file')
        return !!image
      }

      return false
    }

    // On drop upload files
    node.onDragDrop = function (e: LDragEvent) {
      console.log('onDragDrop called')
      let handled = false
      for (const file of e.dataTransfer.files) {
        if (file.type.startsWith('image/')) {
          uploadFile(file, !handled) // Dont await these, any order is fine, only update on first one
          handled = true
        }
      }

      return handled
    }

    return { widget: uploadWidget }
  }
}

export type ComfyWidgetsType = typeof ComfyWidgets
