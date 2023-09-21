import {
  ComfyWidgets,
  addValueControlWidget
} from '../../scripts/node-manager/widgets.js'
import { app } from '../../scripts/app.js'
import type { ComfyApp } from '../../scripts/app.js'
const CONVERTED_TYPE = 'converted-widget'
const VALID_TYPES = ['STRING', 'combo', 'number', 'BOOLEAN']

function isConvertableWidget(widget, config) {
  return VALID_TYPES.includes(widget.type) || VALID_TYPES.includes(config[0])
}

/**
 * 隐藏一个小部件及其所有链接的小部件。
 * @param node - 包含小部件的节点。
 * @param widget - 要隐藏的小部件。
 * @param suffix - 要添加到小部件类型的后缀。
 */
function hideWidget(node: LGraphNode, widget: IWidget, suffix = '') {
  // 保存原始小部件属性
  widget.origType = widget.type
  widget.origComputeSize = widget.computeSize
  widget.origSerializeValue = widget.serializeValue

  widget.computeSize = () => [0, -4]

  // 这里是通过修改 widget.type 来隐藏小部件的
  // widget 的 type 只能为以下定义的类型，否则它会被隐藏：
  // https://github.com/jagenjo/litegraph.js/blob/master/guides/README.md#node-widgets
  // @ts-ignore
  widget.type = CONVERTED_TYPE + suffix
  widget.serializeValue = () => {
    // 如果没有链接输入，则防止序列化小部件
    const { link } = node.inputs?.find(
      (i) => i.widget?.name === widget.name
    ) as INodeInputSlot
    if (link == null) {
      return undefined
    }

    return widget.origSerializeValue
      ? widget.origSerializeValue()
      : widget.value
  }

  // 隐藏任何链接的小部件
  if (widget.linkedWidgets) {
    for (const w of widget.linkedWidgets) {
      hideWidget(node, w, ':' + widget.name)
    }
  }
}

function showWidget(widget) {
  widget.type = widget.origType
  widget.computeSize = widget.origComputeSize
  widget.serializeValue = widget.origSerializeValue

  delete widget.origType
  delete widget.origComputeSize
  delete widget.origSerializeValue

  // Hide any linked widgets
  if (widget.linkedWidgets) {
    for (const w of widget.linkedWidgets) {
      showWidget(w)
    }
  }
}

function convertToInput(node, widget, config) {
  hideWidget(node, widget)

  const { linkType } = getWidgetType(config)

  // Add input and store widget config for creating on primitive node
  const sz = node.size
  node.addInput(widget.name, linkType, {
    widget: { name: widget.name, config }
  })

  for (const widget of node.widgets) {
    widget.last_y += LiteGraph.NODE_SLOT_HEIGHT
  }

  // Restore original size but grow if needed
  node.setSize([Math.max(sz[0], node.size[0]), Math.max(sz[1], node.size[1])])
}

function convertToWidget(node, widget) {
  showWidget(widget)
  const sz = node.size
  node.removeInput(node.inputs.findIndex((i) => i.widget?.name === widget.name))

  for (const widget of node.widgets) {
    widget.last_y -= LiteGraph.NODE_SLOT_HEIGHT
  }

  // Restore original size but grow if needed
  node.setSize([Math.max(sz[0], node.size[0]), Math.max(sz[1], node.size[1])])
}

function getWidgetType(config) {
  // Special handling for COMBO so we restrict links based on the entries
  let type = config[0]
  let linkType = type
  if (type instanceof Array) {
    type = 'COMBO'
    linkType = linkType.join(',')
  }
  return { type, linkType }
}

// 注册拓展服务
app.registerExtension({
  name: 'Comfy.WidgetInputs',

  /**
   * 在注册节点定义之前调用的异步函数。
   * @param nodeType - 要注册的节点类型。
   * @param nodeData - 节点数据对象。
   * @param app - 应用程序对象。
   * @returns - 异步操作的 Promise 对象。
   */
  async beforeRegisterNodeDef(nodeType, nodeData, app: ComfyApp) {
    // nodeType 的这些函数可以在 litegraph.core 里找到
    // web/lib/litegraph.core.js#L2404
    const nodeTypePrototype = nodeType.prototype as LGraphNode
    const origOnAdd = nodeTypePrototype.onAdded
    const newOnAdd = function () {
      const r = origOnAdd ? origOnAdd.apply(this, arguments) : undefined

      if (this.widgets) {
        for (const w of this.widgets) {
          if (w?.options?.defaultInput) {
            const config = nodeData?.input?.required?.[w.name] ||
              nodeData?.input?.optional?.[w.name] || [w.type, w.options || {}]
            // convertToInput(this, w, config)
            hideWidget(this, w)
            const { linkType } = getWidgetType(config)
            this.addInput(w.name, linkType)
          }
        }
      }

      return r
    }

    // 这个 getExtraMenuOptions 会在 Node 上面右键触发
    const origGetExtraMenuOptions = nodeTypePrototype.getExtraMenuOptions
    const newGetExtraMenuOptions = function (_, options) {
      const r = origGetExtraMenuOptions
        ? origGetExtraMenuOptions.apply(this, arguments)
        : undefined

      if (this.widgets) {
        const toInput: IContextMenuOptions[] = []
        const toWidget: IContextMenuOptions[] = []

        for (const w of this.widgets) {
          // 正常情况下，点击把小部件转成输入后，这里的 w.type 会变成 converted-widget
          if (w.type === CONVERTED_TYPE) {
            toWidget.push({
              content: `Convert ${w.name} to widget`,
              callback: () => {
                this.flags[`widget_${w.name}`] = true
                convertToWidget(this, w)
              }
            })
          } else {
            // 否则这里的 w.type 会是原来的类型（number 之类的...）
            const config = nodeData?.input?.required?.[w.name] ||
              nodeData?.input?.optional?.[w.name] || [w.type, w.options || {}]

            // 检查输入的类型是否可以转换成小部件
            if (isConvertableWidget(w, config)) {
              toInput.push({
                content: `Convert ${w.name} to input`,
                callback: () => {
                  this.flags[`widget_${w.name}`] = false
                  convertToInput(this, w, config)
                }
              })
            }
          }
        }
        if (toInput.length) {
          options.push(...toInput, null)
        }

        if (toWidget.length) {
          options.push(...toWidget, null)
        }
      }

      return r
    }

    // 从配置文件里面加载出来的恢复之前的节点（这个函数会在根据配置重新加载时调用）
    const origOnConfigure = nodeTypePrototype.onConfigure
    const newOnConfigure = function () {
      const r = origOnConfigure
        ? origOnConfigure.apply(this, arguments)
        : undefined

      // 创建一个空数组，用于存储所有以'widget_'开头的属性值
      const flags = this.flags
      const widgetValues = []
      for (const key in flags) {
        if (key.startsWith('widget_')) {
          widgetValues.push(flags[key])
        }
      }

      if (this.inputs) {
        for (const input of this.inputs) {
          if (input.widget) {
            // 在节点的小部件中查找与输入小部件同名的小部件
            const w = this.widgets.find((w) => w.name === input.widget.name)
            if (w) {
              // 如果找到了同名小部件隐藏该小部件
              hideWidget(this, w)
            } else {
              // 否则将该输入转换为小部件
              convertToWidget(this, input)
              // if (
              //   widgetValues[input.name] !== undefined &&
              //   !widgetValues[input.name] &&
              //   input?.config?.defaultInput
              // ) {
              // } else {

              // }
            }
          }
        }
      }
      return r
    }

    function isNodeAtPos(pos) {
      for (const n of app.canvasManager.graph._nodes) {
        if (n.pos[0] === pos[0] && n.pos[1] === pos[1]) {
          return true
        }
      }
      return false
    }

    const ignoreDblClick = Symbol()

    /**
     * 双击小部件输入以自动连接一个原始节点。
     * @param {number} slot - 输入插槽的索引。
     * @returns {*} - 原始 onInputDblClick 方法的返回值。
     */
    const origOnInputDblClick = nodeTypePrototype.onInputDblClick
    const newOnInputDblClick = function (slot) {
      const r = origOnInputDblClick
        ? origOnInputDblClick.apply(this, arguments)
        : undefined

      const input = this.inputs[slot]
      if (!input.widget || !input[ignoreDblClick]) {
        // 不是小部件输入或已处理的输入
        if (
          !(input.type in ComfyWidgets) &&
          !(input.widget.config?.[0] instanceof Array)
        ) {
          return r // 也不是 ComfyWidgets 输入或组合（不执行任何操作）
        }
      }

      // 创建一个原始节点
      const node = LiteGraph.createNode('PrimitiveNode')
      app.canvasManager.graph.add(node)

      // 计算一个不会直接重叠其他节点的位置
      const pos = [this.pos[0] - node.size[0] - 30, this.pos[1]]
      while (isNodeAtPos(pos)) {
        pos[1] += LiteGraph.NODE_TITLE_HEIGHT
      }

      node.pos = pos
      node.connect(0, this, slot)
      node.title = input.name

      // 防止由于三次点击而添加重复项
      input[ignoreDblClick] = true
      setTimeout(() => {
        delete input[ignoreDblClick]
      }, 300)

      return r
    }

    nodeType.prototype.onAdded = newOnAdd
    nodeType.prototype.onConfigure = newOnConfigure
    nodeType.prototype.onInputDblClick = newOnInputDblClick
    nodeType.prototype.getExtraMenuOptions = newGetExtraMenuOptions
  },

  registerCustomNodes() {
    class PrimitiveNode extends LGraphNode {
      static category: 'utils'
      isVirtualNode: boolean

      constructor() {
        super()
        this.addOutput('connect to widget input', '*')
        this.serialize_widgets = true
        this.isVirtualNode = true
      }

      applyToGraph() {
        if (!this.outputs[0].links?.length) return

        function get_links(node: LGraphNode) {
          let links: number[] = []
          if (!node.outputs[0].links?.length) return links

          for (const l of node.outputs[0].links) {
            const linkInfo = app.canvasManager.graph.links[l]
            const n = node?.graph?.getNodeById(linkInfo.target_id)
            if (n && n.type == 'Reroute') {
              links = links.concat(get_links(n))
            } else {
              links.push(l)
            }
          }
          return links
        }

        let links = get_links(this)
        // For each output link copy our value over the original widget value
        for (const l of links) {
          const linkInfo = app.canvasManager.graph.links[l]
          const node = this.graph?.getNodeById(linkInfo.target_id)
          const input = node?.inputs[linkInfo.target_slot]
          const widgetName = input?.widget?.name
          if (widgetName) {
            const widget = node?.widgets.find((w) => w.name === widgetName)
            if (widget) {
              widget.value = this.widgets[0].value
              if (widget.callback) {
                widget.callback(
                  widget.value,
                  app.canvasManager.canvas,
                  node as LGraphNode,
                  app.canvasManager.canvas.graph_mouse
                )
              }
            }
          }
        }
      }

      onConnectionsChange(_, index, connected) {
        if (connected) {
          if (this.outputs[0].links?.length) {
            if (!this.widgets?.length) {
              this.#onFirstConnection()
            }
            if (!this.widgets?.length && this.outputs[0].widget) {
              // On first load it often cant recreate the widget as the other node doesnt exist yet
              // Manually recreate it from the output info
              this.#createWidget(this.outputs[0].widget.config)
            }
          }
        } else if (!this.outputs[0].links?.length) {
          this.#onLastDisconnect()
        }
      }

      onConnectOutput(
        slot: number,
        type: INodeInputSlot['type'],
        input: INodeInputSlot,
        target_node: LGraphNode,
        target_slot: number
      ) {
        // Fires before the link is made allowing us to reject it if it isn't valid

        // No widget, we cant connect
        if (!input.widget) {
          if (!input.type || !(input.type in ComfyWidgets)) return false
        }

        if (this.outputs[slot].links?.length) {
          return this.#isValidConnection(input)
        }

        return true
      }

      #onFirstConnection() {
        // First connection can fire before the graph is ready on initial load so random things can be missing
        const linkId = this?.outputs?.[0]?.links?.[0]
        if (!linkId || !this.graph) return
        const link = this.graph?.links[linkId]
        if (!link) return

        const theirNode = this.graph.getNodeById(link.target_id)
        if (!theirNode || !theirNode.inputs) return

        const input = theirNode.inputs[link.target_slot]
        if (!input) return

        var _widget
        if (!input.widget) {
          if (!input.type || !(input.type in ComfyWidgets)) return
          _widget = { name: input.name, config: [input.type, {}] } //fake widget
        } else {
          _widget = input.widget
        }

        const widget = _widget
        const { type, linkType } = getWidgetType(widget.config)
        // Update our output to restrict to the widget type
        this.outputs[0].type = linkType
        this.outputs[0].name = type
        this.outputs[0].widget = widget

        this.#createWidget(widget.config, theirNode, widget.name)
      }

      #createWidget(inputData, node?, widgetName?) {
        let type = inputData[0]

        if (type instanceof Array) {
          type = 'COMBO'
        }

        let widget
        if (type in ComfyWidgets) {
          widget = (ComfyWidgets[type](this, 'value', inputData, app) || {})
            .widget
        } else {
          widget = this.addWidget(type, 'value', null, () => {}, {})
        }

        if (node?.widgets && widget) {
          const theirWidget = node.widgets.find((w) => w.name === widgetName)
          if (theirWidget) {
            widget.value = theirWidget.value
          }
        }

        if (widget.type === 'number' || widget.type === 'combo') {
          // @ts-ignore
          addValueControlWidget(this, widget, 'fixed')
        }

        // When our value changes, update other widgets to reflect our changes
        // e.g. so LoadImage shows correct image
        const callback = widget.callback
        const self = this
        widget.callback = function () {
          const r = callback ? callback.apply(this, arguments) : undefined
          self.applyToGraph()
          return r
        }

        // Grow our node if required
        const sz = this.computeSize()
        if (this.size[0] < sz[0]) {
          this.size[0] = sz[0]
        }
        if (this.size[1] < sz[1]) {
          this.size[1] = sz[1]
        }

        requestAnimationFrame(() => {
          if (this.onResize) {
            this.onResize(this.size)
          }
        })
      }

      #isValidConnection(input) {
        // Only allow connections where the configs match
        const config1 = this.outputs?.[0]?.widget?.config
        const config2 = input.widget.config

        if (config1[0] instanceof Array) {
          // These checks shouldnt actually be necessary as the types should match
          // but double checking doesn't hurt

          // New input isnt a combo
          if (!(config2[0] instanceof Array)) return false
          // New imput combo has a different size
          if (config1[0].length !== config2[0].length) return false
          // New input combo has different elements
          if (config1[0].find((v, i) => config2[0][i] !== v)) return false
        } else if (config1[0] !== config2[0]) {
          // Configs dont match
          return false
        }

        for (const k in config1[1]) {
          if (k !== 'default') {
            if (config1[1][k] !== config2[1][k]) {
              return false
            }
          }
        }

        return true
      }

      #onLastDisconnect() {
        // We cant remove + re-add the output here as if you drag a link over the same link
        // it removes, then re-adds, causing it to break
        this.outputs[0].type = '*'
        this.outputs[0].name = 'connect to widget input'
        delete this.outputs[0].widget

        if (this.widgets) {
          // Allow widgets to cleanup
          for (const w of this.widgets) {
            if (w.onRemove) {
              w.onRemove()
            }
          }
          this.widgets.length = 0
        }
      }
    }

    LiteGraph.registerNodeType(
      'PrimitiveNode',
      Object.assign(PrimitiveNode, {
        title: 'Primitive'
      })
    )
  }
})
