var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { $el } from '../ui.js';
import { defaultGraph } from './defaultGraph.js';
export class WorkflowManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
    }
    setup(config) {
        this.canvasManager = config.canvasManager;
        this.logging = config.logger;
    }
    loadGraphData(graphData) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.clean();
            let reset_invalid_values = false;
            if (!graphData) {
                graphData = structuredClone(defaultGraph);
                reset_invalid_values = true;
            }
            const missingNodeTypes = [];
            for (let n of graphData.nodes) {
                if (!(n.type in LiteGraph.registered_node_types)) {
                    missingNodeTypes.push(n.type);
                }
            }
            try {
                this.canvasManager.graph.configure(graphData);
            }
            catch (error) {
                let errorHint = [];
                const filename = error.fileName ||
                    ((_a = (error.stack || '').match(/(\/extensions\/.*\.js)/)) === null || _a === void 0 ? void 0 : _a[1]);
                const pos = (filename || '').indexOf('/extensions/');
                if (pos > -1) {
                    errorHint.push($el('span', {
                        textContent: 'This may be due to the following script:'
                    }), $el('br'), $el('span', {
                        style: {
                            fontWeight: 'bold'
                        },
                        textContent: filename.substring(pos)
                    }));
                }
                this.canvasManager.ui.dialog.show($el('div', [
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
                ]).outerHTML);
                return;
            }
            for (const node of this.canvasManager.graph._nodes) {
                const size = node.computeSize();
                size[0] = Math.max(node.size[0], size[0]);
                size[1] = Math.max(node.size[1], size[1]);
                node.size = size;
                if (node.widgets) {
                    for (let widget of node.widgets) {
                        if (reset_invalid_values) {
                            if (widget.type == 'combo') {
                                if (!widget.options.values.includes(widget.value) &&
                                    widget.options.values.length > 0) {
                                    widget.value = widget.options.values[0];
                                }
                            }
                        }
                    }
                }
                yield this.eventManager.invokeExtensions('loadedGraphNode', node);
            }
            if (missingNodeTypes.length) {
                this.canvasManager.ui.dialog.show(`When loading the graph, the following node types were not found: <ul>${Array.from(new Set(missingNodeTypes))
                    .map((t) => `<li>${t}</li>`)
                    .join('')}</ul>Nodes that have failed to load will show as red on the graph.`);
                this.logging.addEntry('Comfy.App', 'warn', {
                    MissingNodes: missingNodeTypes
                });
            }
        });
    }
    clean() {
        this.nodeOutputs = {};
        this.lastNodeErrors = null;
        this.lastExecutionError = null;
        this.runningNodeId = null;
    }
}
