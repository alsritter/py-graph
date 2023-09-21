import { app } from '../../scripts/app.js'
import { ComfyWidgets } from '../../scripts/node-manager/widgets.js'
// Node that add notes to your project

app.registerExtension({
  name: 'Comfy.NoteNode',
  registerCustomNodes() {
    class NoteNode {
      static category: string

      properties: any
      serialize_widgets: boolean
      isVirtualNode: boolean

      color = LGraphCanvas.node_colors.yellow.color
      bgcolor = LGraphCanvas.node_colors.yellow.bgcolor
      groupcolor = LGraphCanvas.node_colors.yellow.groupcolor

      constructor() {
        if (!this.properties) {
          this.properties = {}
          this.properties.text = ''
        }

        ComfyWidgets.STRING(
          this as any,
          '',
          ['', { default: this.properties.text, multiline: true }],
          app
        )

        this.serialize_widgets = true
        this.isVirtualNode = true
      }
    }

    // Load default visibility

    LiteGraph.registerNodeType(
      'Note',
      Object.assign(NoteNode, {
        title_mode: LiteGraph.NORMAL_TITLE,
        title: 'Note',
        collapsable: true
      })
    )

    NoteNode.category = 'utils'
  }
})
