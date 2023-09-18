var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _WorkflowManager_instances, _WorkflowManager_addDropHandler;
import { $el } from '../canvas-manager/tools.js';
import { defaultGraph } from './defaultGraph.js';
export class WorkflowManager {
    constructor(eventManager) {
        _WorkflowManager_instances.add(this);
        this.eventManager = eventManager;
    }
    init(center) {
        this.canvasManager = center.canvasManager;
        this.logging = center.logger;
        this.stateHandler = center.stateHandler;
        this.center = center;
    }
    setup() {
        let restored = false;
        try {
            const json = localStorage.getItem('workflow');
            if (json) {
                const workflow = JSON.parse(json);
                this.loadGraphData(workflow);
                restored = true;
            }
        }
        catch (err) {
            console.error('Error loading previous workflow', err);
        }
        if (!restored) {
            this.loadGraphData(null);
        }
        setInterval(() => localStorage.setItem('workflow', JSON.stringify(this.canvasManager.graph.serialize())), 1000);
        __classPrivateFieldGet(this, _WorkflowManager_instances, "m", _WorkflowManager_addDropHandler).call(this);
    }
    loadGraphData(graphData) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.stateHandler.clean();
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
                yield this.eventManager.invokeExtensions('loadedGraphNode', node, this.center);
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
    graphToRunner() {
        return __awaiter(this, void 0, void 0, function* () {
            const workflow = this.canvasManager.graph.serialize();
            const output = {};
            for (const node of this.canvasManager.graph.computeExecutionOrder(false, 0)) {
                const n = workflow.nodes.find((n) => n.id === node.id);
                if (node.isVirtualNode) {
                    if (node.applyToGraph) {
                        node.applyToGraph(workflow);
                    }
                    continue;
                }
                if (node.mode === 2 || node.mode === 4) {
                    continue;
                }
                const inputs = {};
                const widgets = node.widgets;
                if (widgets) {
                    for (const i in widgets) {
                        const widget = widgets[i];
                        if (!widget.options || widget.options.serialize !== false) {
                            inputs[widget.name] = widget.serializeValue
                                ? yield widget.serializeValue(n, i)
                                : widget.value;
                        }
                    }
                }
                for (let i in node.inputs) {
                    let parent = node.getInputNode(i);
                    if (parent) {
                        let link = node.getInputLink(i);
                        while (parent.mode === 4 || parent.isVirtualNode) {
                            let found = false;
                            if (parent.isVirtualNode) {
                                link = parent.getInputLink(link.origin_slot);
                                if (link) {
                                    parent = parent.getInputNode(link.target_slot);
                                    if (parent) {
                                        found = true;
                                    }
                                }
                            }
                            else if (link && parent.mode === 4) {
                                let all_inputs = [link.origin_slot];
                                if (parent.inputs) {
                                    all_inputs = all_inputs.concat(Object.keys(parent.inputs));
                                    for (let parent_input in all_inputs) {
                                        parent_input = all_inputs[parent_input];
                                        if (parent.inputs[parent_input].type === node.inputs[i].type) {
                                            link = parent.getInputLink(parent_input);
                                            if (link) {
                                                parent = parent.getInputNode(parent_input);
                                            }
                                            found = true;
                                            break;
                                        }
                                    }
                                }
                            }
                            if (!found) {
                                break;
                            }
                        }
                        if (link) {
                            inputs[node.inputs[i].name] = [
                                String(link.origin_id),
                                parseInt(link.origin_slot)
                            ];
                        }
                    }
                }
                output[String(node.id)] = {
                    inputs,
                    class_type: node.comfyClass
                };
            }
            for (const o in output) {
                for (const i in output[o].inputs) {
                    if (Array.isArray(output[o].inputs[i]) &&
                        output[o].inputs[i].length === 2 &&
                        !output[output[o].inputs[i][0]]) {
                        delete output[o].inputs[i];
                    }
                }
            }
            return { workflow, output };
        });
    }
    handleFile(file) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (file.type === 'application/json' || ((_a = file.name) === null || _a === void 0 ? void 0 : _a.endsWith('.json'))) {
                const reader = new FileReader();
                reader.onload = () => {
                    this.loadGraphData(JSON.parse(reader.result));
                };
                reader.readAsText(file);
            }
        });
    }
}
_WorkflowManager_instances = new WeakSet(), _WorkflowManager_addDropHandler = function _WorkflowManager_addDropHandler() {
    document.addEventListener('drop', (event) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        event.preventDefault();
        event.stopPropagation();
        const n = this.nodeManager.dragOverNode;
        this.nodeManager.dragOverNode = null;
        if (n && n.onDragDrop && (yield n.onDragDrop(event))) {
            return;
        }
        if (event.dataTransfer.files.length &&
            event.dataTransfer.files[0].type !== 'image/bmp') {
            yield this.handleFile(event.dataTransfer.files[0]);
        }
        else {
            const validTypes = ['text/uri-list', 'text/x-moz-url'];
            const match = [...event.dataTransfer.types].find((t) => validTypes.find((v) => t === v));
            if (match) {
                const uri = (_b = (_a = event.dataTransfer.getData(match)) === null || _a === void 0 ? void 0 : _a.split('\n')) === null || _b === void 0 ? void 0 : _b[0];
                if (uri) {
                    yield this.handleFile(yield (yield fetch(uri)).blob());
                }
            }
        }
    }));
    this.canvasManager.canvasEl.addEventListener('dragleave', () => __awaiter(this, void 0, void 0, function* () {
        if (this.nodeManager.dragOverNode) {
            this.nodeManager.dragOverNode = null;
            this.canvasManager.graph.setDirtyCanvas(false, true);
        }
    }));
    this.canvasManager.canvasEl.addEventListener('dragover', (e) => {
        this.canvasManager.canvas.adjustMouseEvent(e);
        const node = this.graph.getNodeOnPos(e.canvasX, e.canvasY);
        if (node) {
            if (node.onDragOver && node.onDragOver(e)) {
                this.nodeManager.dragOverNode = node;
                requestAnimationFrame(() => {
                    this.canvasManager.graph.setDirtyCanvas(false, true);
                });
                return;
            }
        }
        this.nodeManager.dragOverNode = null;
    }, false);
};
//# sourceMappingURL=index.js.map