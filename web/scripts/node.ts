import type { ComfyApp } from './app.js'
import type { ComfyWidgetsType } from './widgets.js'

export class ComfyNode extends LGraphNode {
  imgs?: Record<string, any>
  inputHeight?: number
  widgets: IWidget[]
  comfyClass?: string
  imageOffset?: number

  constructor(
    nodeData: ComfyObjectInfo,
    widgets: ComfyWidgetsType,
    app: ComfyApp
  ) {
    super()
    var inputs = nodeData['input']['required']
    if (nodeData['input']['optional'] != undefined) {
      inputs = Object.assign(
        {},
        nodeData['input']['required'],
        nodeData['input']['optional']
      )
    }
    const config = { minWidth: 1, minHeight: 1 }
    for (const inputName in inputs) {
      const inputData = inputs[inputName]
      const type = inputData[0]

      if (inputData[1]?.forceInput) {
        this.addInput(inputName, type as string)
      } else {
        if (Array.isArray(type)) {
          // Enums
          Object.assign(
            config,
            widgets.COMBO(this, inputName, inputData, app) || {}
          )
        } else if (`${type}:${inputName}` in widgets) {
          // Support custom widgets by Type:Name
          Object.assign(
            config,
            widgets[`${type}:${inputName}`](this, inputName, inputData, app) ||
              {}
          )
        } else if (type in widgets) {
          // Standard type widgets
          Object.assign(
            config,
            widgets[type](this, inputName, inputData, app) || {}
          )
        } else {
          // Node connection inputs
          this.addInput(inputName, type)
        }
      }
    }

    for (const o in nodeData['output']) {
      const output = nodeData['output'][o]
      const outputName = nodeData['output_name'][o] || output
      const outputShape = nodeData['output_is_list'][o]
        ? LiteGraph.GRID_SHAPE
        : LiteGraph.CIRCLE_SHAPE
      this.addOutput(outputName, output, { shape: outputShape })
    }

    const s = this.computeSize()
    s[0] = Math.max(config.minWidth, s[0] * 1.5)
    s[1] = Math.max(config.minHeight, s[1])
    this.size = s
    this.serialize_widgets = true
  }
}
