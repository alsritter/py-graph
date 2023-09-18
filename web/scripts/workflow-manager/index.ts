import { $el } from '../canvas-manager/tools.js'
import { EventManager } from '../event.js'
import { defaultGraph } from './defaultGraph.js'
import { CanvasManager } from '../canvas-manager/index.js'
import { StateHandler } from '../state-handler/index.js'
import { Logger } from '../logger/index.js'
import { NodeManager } from '../node-manager/index.js'

export class WorkflowManager implements Module {
  private canvasManager: CanvasManager
  private logging: Logger
  private stateHandler: StateHandler
  private nodeManager: NodeManager

  center: ComfyCenter

  constructor(private eventManager: EventManager) {}

  init(center: ComfyCenter) {
    this.canvasManager = center.canvasManager
    this.logging = center.logger
    this.stateHandler = center.stateHandler
    this.center = center
  }

  setup() {
    // Load previous workflow
    let restored = false
    try {
      const json = localStorage.getItem('workflow')
      if (json) {
        const workflow = JSON.parse(json)
        this.loadGraphData(workflow)
        restored = true
      }
    } catch (err) {
      console.error('Error loading previous workflow', err)
    }

    // We failed to restore a workflow so load the default
    if (!restored) {
      this.loadGraphData(null)
    }

    // Save current workflow automatically
    setInterval(
      () =>
        localStorage.setItem(
          'workflow',
          JSON.stringify(this.canvasManager.graph.serialize())
        ),
      1000
    )

    this.#addDropHandler()
  }

  /**
   * Populates the graph with the specified workflow data
   * @param graphData A serialized graph object
   */
  async loadGraphData(graphData) {
    this.stateHandler.clean()

    let reset_invalid_values = false
    if (!graphData) {
      graphData = structuredClone(defaultGraph)
      reset_invalid_values = true
    }

    const missingNodeTypes = []
    for (let n of graphData.nodes) {
      // Find missing node types
      if (!(n.type in LiteGraph.registered_node_types)) {
        missingNodeTypes.push(n.type)
      }
    }

    try {
      this.canvasManager.graph.configure(graphData)
    } catch (error) {
      let errorHint = []
      // Try extracting filename to see if it was caused by an extension script
      const filename =
        error.fileName ||
        (error.stack || '').match(/(\/extensions\/.*\.js)/)?.[1]
      const pos = (filename || '').indexOf('/extensions/')
      if (pos > -1) {
        errorHint.push(
          $el('span', {
            textContent: 'This may be due to the following script:'
          }),
          $el('br'),
          $el('span', {
            style: {
              fontWeight: 'bold'
            },
            textContent: filename.substring(pos)
          })
        )
      }

      // Show dialog to let the user know something went wrong loading the data
      this.canvasManager.ui.dialog.show(
        $el('div', [
          $el('p', {
            textContent: 'Loading aborted due to error reloading workflow data'
          }),
          $el('pre', {
            style: { padding: '5px', backgroundColor: 'rgba(255,0,0,0.2)' },
            textContent: error.toString()
          }),
          $el('pre', {
            style: {
              padding: '5px',
              color: '#ccc',
              fontSize: '10px',
              maxHeight: '50vh',
              overflow: 'auto',
              backgroundColor: 'rgba(0,0,0,0.2)'
            },
            textContent: error.stack || 'No stacktrace available'
          }),
          ...errorHint
        ]).outerHTML
      )

      return
    }

    for (const node of this.canvasManager.graph._nodes) {
      const size = node.computeSize()
      size[0] = Math.max(node.size[0], size[0])
      size[1] = Math.max(node.size[1], size[1])
      node.size = size

      if (node.widgets) {
        // If you break something in the backend and want to patch workflows in the frontend
        // This is the place to do this
        for (let widget of node.widgets) {
          if (reset_invalid_values) {
            if (widget.type == 'combo') {
              if (
                !widget.options.values.includes(widget.value) &&
                widget.options.values.length > 0
              ) {
                widget.value = widget.options.values[0]
              }
            }
          }
        }
      }

      await this.eventManager.invokeExtensions('loadedGraphNode', node, this.center)
    }

    if (missingNodeTypes.length) {
      this.canvasManager.ui.dialog.show(
        `When loading the graph, the following node types were not found: <ul>${Array.from(
          new Set(missingNodeTypes)
        )
          .map((t) => `<li>${t}</li>`)
          .join(
            ''
          )}</ul>Nodes that have failed to load will show as red on the graph.`
      )
      this.logging.addEntry('Comfy.App', 'warn', {
        MissingNodes: missingNodeTypes
      })
    }
  }

  /**
   * 将当前图形工作流转换为适合发送至 API 的格式。
   * @returns 包含序列化后的工作流和节点连接的对象。
   */
  async graphToRunner() {
    // 序列化图形工作流
    const workflow = this.canvasManager.graph.serialize()
    const output = {}

    // 按执行顺序处理节点
    for (const node of this.canvasManager.graph.computeExecutionOrder(
      false,
      0
    ) as LGraphNode[]) {
      const n = workflow.nodes.find((n) => n.id === node.id)

      if (node.isVirtualNode) {
        // 不序列化仅在前端使用的节点，但允许它们进行更改
        if (node.applyToGraph) {
          node.applyToGraph(workflow)
        }
        continue
      }

      if (node.mode === 2 || node.mode === 4) {
        // 不序列化已静音的节点
        continue
      }

      const inputs = {}
      const widgets = node.widgets

      // 存储所有小部件的值
      if (widgets) {
        for (const i in widgets) {
          const widget = widgets[i]
          if (!widget.options || widget.options.serialize !== false) {
            inputs[widget.name] = widget.serializeValue
              ? await widget.serializeValue(n, i)
              : widget.value
          }
        }
      }

      // 存储所有节点连接
      for (let i in node.inputs) {
        // @ts-ignore
        let parent = node.getInputNode(i)
        if (parent) {
          // @ts-ignore
          let link = node.getInputLink(i)
          while (parent.mode === 4 || parent.isVirtualNode) {
            let found = false
            if (parent.isVirtualNode) {
              link = parent.getInputLink(link.origin_slot)
              if (link) {
                parent = parent.getInputNode(link.target_slot)
                if (parent) {
                  found = true
                }
              }
            } else if (link && parent.mode === 4) {
              let all_inputs = [link.origin_slot]
              if (parent.inputs) {
                // @ts-ignore
                all_inputs = all_inputs.concat(Object.keys(parent.inputs))
                for (let parent_input in all_inputs) {
                  // @ts-ignore
                  parent_input = all_inputs[parent_input]
                  if (
                    parent.inputs[parent_input].type === node.inputs[i].type
                  ) {
                    // @ts-ignore
                    link = parent.getInputLink(parent_input)
                    if (link) {
                      // @ts-ignore
                      parent = parent.getInputNode(parent_input)
                    }
                    found = true
                    break
                  }
                }
              }
            }

            if (!found) {
              break
            }
          }

          if (link) {
            inputs[node.inputs[i].name] = [
              String(link.origin_id),
              // @ts-ignore
              parseInt(link.origin_slot)
            ]
          }
        }
      }

      output[String(node.id)] = {
        inputs,
        class_type: node.comfyClass
      }
    }

    // 移除与已删除节点连接的输入
    for (const o in output) {
      for (const i in output[o].inputs) {
        if (
          Array.isArray(output[o].inputs[i]) &&
          output[o].inputs[i].length === 2 &&
          !output[output[o].inputs[i][0]]
        ) {
          delete output[o].inputs[i]
        }
      }
    }

    return { workflow, output }
  }

  /**
   * Adds a handler allowing drag+drop of files onto the window to load workflows
   */
  #addDropHandler() {
    // Get prompt from dropped PNG or json
    document.addEventListener('drop', async (event) => {
      event.preventDefault()
      event.stopPropagation()

      const n = this.nodeManager.dragOverNode
      this.nodeManager.dragOverNode = null
      // Node handles file drop, we dont use the built in onDropFile handler as its buggy
      // If you drag multiple files it will call it multiple times with the same file
      if (n && n.onDragDrop && (await n.onDragDrop(event))) {
        return
      }
      // Dragging from Chrome->Firefox there is a file but its a bmp, so ignore that
      if (
        event.dataTransfer.files.length &&
        event.dataTransfer.files[0].type !== 'image/bmp'
      ) {
        await this.handleFile(event.dataTransfer.files[0])
      } else {
        // Try loading the first URI in the transfer list
        const validTypes = ['text/uri-list', 'text/x-moz-url']
        const match = [...event.dataTransfer.types].find((t) =>
          validTypes.find((v) => t === v)
        )
        if (match) {
          const uri = event.dataTransfer.getData(match)?.split('\n')?.[0]
          if (uri) {
            await this.handleFile(await (await fetch(uri)).blob())
          }
        }
      }
    })

    // Always clear over node on drag leave
    this.canvasManager.canvasEl.addEventListener('dragleave', async () => {
      if (this.nodeManager.dragOverNode) {
        this.nodeManager.dragOverNode = null
        this.canvasManager.graph.setDirtyCanvas(false, true)
      }
    })

    // Add handler for dropping onto a specific node
    this.canvasManager.canvasEl.addEventListener(
      'dragover',
      (e) => {
        this.canvasManager.canvas.adjustMouseEvent(e)
        // @ts-ignore
        const node = this.graph.getNodeOnPos(
          // @ts-ignore
          e.canvasX,
          // @ts-ignore
          e.canvasY
        ) as LGraphNode
        if (node) {
          if (node.onDragOver && node.onDragOver(e)) {
            this.nodeManager.dragOverNode = node

            // dragover event is fired very frequently, run this on an animation frame
            requestAnimationFrame(() => {
              this.canvasManager.graph.setDirtyCanvas(false, true)
            })
            return
          }
        }
        this.nodeManager.dragOverNode = null
      },
      false
    )
  }

  /**
   * Loads workflow data from the specified file
   * @param {File} file
   */
  async handleFile(file) {
    if (file.type === 'application/json' || file.name?.endsWith('.json')) {
      const reader = new FileReader()
      reader.onload = () => {
        this.loadGraphData(JSON.parse(reader.result as string))
      }
      reader.readAsText(file)
    }
  }
}
