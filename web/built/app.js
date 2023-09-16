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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _ComfyApp_instances, _ComfyApp_queueItems, _ComfyApp_processingQueue, _ComfyApp_loadExtensions, _ComfyApp_invokeExtensionsAsync, _ComfyApp_invokeExtensions, _ComfyApp_formatRunnerError, _ComfyApp_formatExecutionError, _ComfyApp_addApiUpdateHandlers, _ComfyApp_addDropHandler, _ComfyApp_addDrawBackgroundHandler, _ComfyApp_addDrawNodeHandler;
import { api } from './api.js';
import { ComfyWidgets } from './widgets.js';
import { ComfyNode } from './node.js';
import { ComfyUI, $el } from './ui.js';
import { defaultGraph } from './defaultGraph.js';
import { LGraph, LGraphCanvas, LiteGraph } from '../types/litegraph.js';
import { ComfyLogging } from './logging.js';
export class ComfyApp {
    constructor() {
        _ComfyApp_instances.add(this);
        _ComfyApp_queueItems.set(this, []);
        _ComfyApp_processingQueue.set(this, false);
        this.ui = new ComfyUI(this);
        this.logging = new ComfyLogging(this);
        this.extensions = [];
        this.nodeOutputs = {};
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _ComfyApp_instances, "m", _ComfyApp_loadExtensions).call(this);
            const mainCanvas = document.createElement('canvas');
            mainCanvas.style.touchAction = 'none';
            const canvasEl = (this.canvasEl = Object.assign(mainCanvas, {
                id: 'graph-canvas'
            }));
            canvasEl.tabIndex = 1;
            document.body.prepend(canvasEl);
            this.graph = new LGraph();
            const canvas = (this.canvas = new LGraphCanvas(canvasEl, this.graph));
            this.ctx = canvasEl.getContext('2d');
            LiteGraph.release_link_on_empty_shows_menu = true;
            LiteGraph.alt_drag_do_clone_nodes = true;
            this.graph.start();
            function resizeCanvas() {
                const scale = Math.max(window.devicePixelRatio, 1);
                const { width, height } = canvasEl.getBoundingClientRect();
                canvasEl.width = Math.round(width * scale);
                canvasEl.height = Math.round(height * scale);
                canvasEl.getContext('2d').scale(scale, scale);
                canvas.draw(true, true);
            }
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            yield __classPrivateFieldGet(this, _ComfyApp_instances, "m", _ComfyApp_invokeExtensionsAsync).call(this, 'init');
            yield this.registerNodes();
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
            setInterval(() => localStorage.setItem('workflow', JSON.stringify(this.graph.serialize())), 1000);
            __classPrivateFieldGet(this, _ComfyApp_instances, "m", _ComfyApp_addDrawNodeHandler).call(this);
            __classPrivateFieldGet(this, _ComfyApp_instances, "m", _ComfyApp_addApiUpdateHandlers).call(this);
            __classPrivateFieldGet(this, _ComfyApp_instances, "m", _ComfyApp_addDropHandler).call(this);
            yield __classPrivateFieldGet(this, _ComfyApp_instances, "m", _ComfyApp_invokeExtensionsAsync).call(this, 'setup');
        });
    }
    registerNodes() {
        return __awaiter(this, void 0, void 0, function* () {
            const app = this;
            const defs = yield api.getNodeDefs();
            yield this.registerNodesFromDefs(defs);
            yield __classPrivateFieldGet(this, _ComfyApp_instances, "m", _ComfyApp_invokeExtensionsAsync).call(this, 'registerCustomNodes');
        });
    }
    registerNodesFromDefs(defs) {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _ComfyApp_instances, "m", _ComfyApp_invokeExtensionsAsync).call(this, 'addCustomNodeDefs', defs);
            const widgets = Object.assign({}, ComfyWidgets, ...(yield __classPrivateFieldGet(this, _ComfyApp_instances, "m", _ComfyApp_invokeExtensionsAsync).call(this, 'getCustomWidgets')).filter(Boolean));
            for (const nodeId in defs) {
                const nodeData = defs[nodeId];
                const node = Object.assign(new ComfyNode(nodeData, widgets, this), {
                    title: nodeData.display_name || nodeData.name,
                    comfyClass: nodeData.name,
                    category: nodeData.category
                });
                node.comfyClass = nodeData.name;
                __classPrivateFieldGet(this, _ComfyApp_instances, "m", _ComfyApp_addDrawBackgroundHandler).call(this, node);
                yield __classPrivateFieldGet(this, _ComfyApp_instances, "m", _ComfyApp_invokeExtensionsAsync).call(this, 'beforeRegisterNodeDef', node, nodeData);
                LiteGraph.registerNodeType(nodeId, node);
            }
        });
    }
    registerExtension(extension) {
        if (!extension.name) {
            throw new Error("Extensions must have a 'name' property.");
        }
        if (this.extensions.find((ext) => ext.name === extension.name)) {
            throw new Error(`Extension named '${extension.name}' already registered.`);
        }
        this.extensions.push(extension);
    }
    queueRunner(number, batchCount = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Queueing runner', number, batchCount);
            __classPrivateFieldGet(this, _ComfyApp_queueItems, "f").push({ number, batchCount });
            if (__classPrivateFieldGet(this, _ComfyApp_processingQueue, "f")) {
                return;
            }
            __classPrivateFieldSet(this, _ComfyApp_processingQueue, true, "f");
            this.lastNodeErrors = null;
            try {
                while (__classPrivateFieldGet(this, _ComfyApp_queueItems, "f").length) {
                    ;
                    ({ number, batchCount } = __classPrivateFieldGet(this, _ComfyApp_queueItems, "f").pop());
                    for (let i = 0; i < batchCount; i++) {
                        const p = yield this.graphToRunner();
                        try {
                            const res = yield api.queueRunner(number, p);
                            this.lastNodeErrors = res.node_errors;
                            if (this.lastNodeErrors.length > 0) {
                                this.canvas.draw(true, true);
                            }
                        }
                        catch (error) {
                            const formattedError = __classPrivateFieldGet(this, _ComfyApp_instances, "m", _ComfyApp_formatRunnerError).call(this, error);
                            this.ui.dialog.show(formattedError);
                            if (error.response) {
                                this.lastNodeErrors = error.response.node_errors;
                                this.canvas.draw(true, true);
                            }
                            break;
                        }
                        for (const n of p.workflow.nodes) {
                            const node = app.graph.getNodeById(n.id);
                            if (node.widgets) {
                                for (const w of node.widgets) {
                                    const widget = w;
                                    if (widget.afterQueued) {
                                        widget.afterQueued();
                                    }
                                }
                            }
                        }
                        this.canvas.draw(true, true);
                        yield this.ui.queue.update();
                    }
                }
            }
            finally {
                __classPrivateFieldSet(this, _ComfyApp_processingQueue, false, "f");
            }
        });
    }
    graphToRunner() {
        return __awaiter(this, void 0, void 0, function* () {
            const workflow = this.graph.serialize();
            const output = {};
            for (const node of this.graph.computeExecutionOrder(false, 0)) {
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
                    let parent = node.getInputNode(Number(i));
                    if (parent) {
                        let link = node.getInputLink(Number(i));
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
                                    all_inputs = all_inputs.concat(Object.keys(parent.inputs).map((key) => Number(key)));
                                    for (let parent_input of all_inputs) {
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
                                link.origin_slot
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
    loadGraphData(graphData) {
        var _a;
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
            this.graph.configure(graphData);
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
            this.ui.dialog.show($el('div', [
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
        for (const node of this.graph._nodes) {
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
            __classPrivateFieldGet(this, _ComfyApp_instances, "m", _ComfyApp_invokeExtensions).call(this, 'loadedGraphNode', node);
        }
        if (missingNodeTypes.length) {
            this.ui.dialog.show(`When loading the graph, the following node types were not found: <ul>${Array.from(new Set(missingNodeTypes))
                .map((t) => `<li>${t}</li>`)
                .join('')}</ul>Nodes that have failed to load will show as red on the graph.`);
            this.logging.addEntry('Comfy.App', 'warn', {
                MissingNodes: missingNodeTypes
            });
        }
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
    getPreviewFormatParam() {
        let preview_format = this.ui.settings.getSettingValue('Comfy.PreviewFormat');
        if (preview_format)
            return `&preview=${preview_format}`;
        else
            return '';
    }
    clean() {
        this.nodeOutputs = {};
        this.lastNodeErrors = null;
        this.lastExecutionError = null;
        this.runningNodeId = null;
    }
}
_ComfyApp_queueItems = new WeakMap(), _ComfyApp_processingQueue = new WeakMap(), _ComfyApp_instances = new WeakSet(), _ComfyApp_loadExtensions = function _ComfyApp_loadExtensions() {
    return __awaiter(this, void 0, void 0, function* () {
        const extensions = yield api.getExtensions();
        for (const ext of extensions) {
            try {
                yield import(api.apiURL(ext));
            }
            catch (error) {
                console.error('Error loading extension', ext, error);
            }
        }
    });
}, _ComfyApp_invokeExtensionsAsync = function _ComfyApp_invokeExtensionsAsync(method, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield Promise.all(this.extensions.map((ext) => __awaiter(this, void 0, void 0, function* () {
            if (method in ext) {
                try {
                    return yield ext[method](...args, this);
                }
                catch (error) {
                    console.error(`Error calling extension '${ext.name}' method '${method}'`, { error }, { extension: ext }, { args });
                }
            }
        })));
    });
}, _ComfyApp_invokeExtensions = function _ComfyApp_invokeExtensions(method, ...args) {
    let results = [];
    for (const ext of this.extensions) {
        if (method in ext) {
            try {
                results.push(ext[method](...args, this));
            }
            catch (error) {
                console.error(`Error calling extension '${ext.name}' method '${method}'`, { error }, { extension: ext }, { args });
            }
        }
    }
    return results;
}, _ComfyApp_formatRunnerError = function _ComfyApp_formatRunnerError(error) {
    if (error == null) {
        return '(unknown error)';
    }
    else if (typeof error === 'string') {
        return error;
    }
    else if (error.stack && error.message) {
        return error.toString();
    }
    else if (error.response) {
        let message = error.response.error.message;
        if (error.response.error.details)
            message += ': ' + error.response.error.details;
        for (const [nodeID, nodeError] of Object.entries(error.response.node_errors)) {
            message += '\n' + nodeError.class_type + ':';
            for (const errorReason of nodeError.errors) {
                message +=
                    '\n    - ' + errorReason.message + ': ' + errorReason.details;
            }
        }
        return message;
    }
    return '(unknown error)';
}, _ComfyApp_formatExecutionError = function _ComfyApp_formatExecutionError(error) {
    if (error == null) {
        return '(unknown error)';
    }
    const traceback = error.traceback.join('');
    const nodeId = error.node_id;
    const nodeType = error.node_type;
    return `Error occurred when executing ${nodeType}:\n\n${error.exception_message}\n\n${traceback}`;
}, _ComfyApp_addApiUpdateHandlers = function _ComfyApp_addApiUpdateHandlers() {
    api.addEventListener('status', ({ detail }) => {
        this.ui.setStatus(detail);
    });
    api.addEventListener('reconnecting', () => {
        this.ui.dialog.show('Reconnecting...');
    });
    api.addEventListener('reconnected', () => {
        this.ui.dialog.close();
    });
    api.addEventListener('progress', ({ detail }) => {
        this.progress = detail;
        this.graph.setDirtyCanvas(true, false);
    });
    api.addEventListener('executing', ({ detail }) => {
        this.progress = null;
        this.runningNodeId = detail;
        this.graph.setDirtyCanvas(true, false);
        delete this.nodePreviewImages[this.runningNodeId];
    });
    api.addEventListener('executed', ({ detail }) => {
        this.nodeOutputs[detail.node] = detail.output;
        const node = this.graph.getNodeById(detail.node);
        if (node) {
            if (node.onExecuted)
                node.onExecuted(detail.output);
        }
    });
    api.addEventListener('execution_start', ({ detail }) => {
        this.runningNodeId = null;
        this.lastExecutionError = null;
    });
    api.addEventListener('execution_error', ({ detail }) => {
        this.lastExecutionError = detail;
        const formattedError = __classPrivateFieldGet(this, _ComfyApp_instances, "m", _ComfyApp_formatExecutionError).call(this, detail);
        this.ui.dialog.show(formattedError);
        this.canvas.draw(true, true);
    });
    api.addEventListener('b_preview', ({ detail }) => {
        const id = this.runningNodeId;
        if (id == null)
            return;
        const blob = detail;
        const blobUrl = URL.createObjectURL(blob);
        this.nodePreviewImages[id] = [blobUrl];
    });
    api.init();
}, _ComfyApp_addDropHandler = function _ComfyApp_addDropHandler() {
    document.addEventListener('drop', (event) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        event.preventDefault();
        event.stopPropagation();
        const n = this.dragOverNode;
        this.dragOverNode = null;
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
    this.canvasEl.addEventListener('dragleave', () => __awaiter(this, void 0, void 0, function* () {
        if (this.dragOverNode) {
            this.dragOverNode = null;
            this.graph.setDirtyCanvas(false, true);
        }
    }));
    this.canvasEl.addEventListener('dragover', (e) => {
        this.canvas.adjustMouseEvent(e);
        const node = this.graph.getNodeOnPos(e.canvasX, e.canvasY);
        if (node) {
            if (node.onDragOver && node.onDragOver(e)) {
                this.dragOverNode = node;
                requestAnimationFrame(() => {
                    this.graph.setDirtyCanvas(false, true);
                });
                return;
            }
        }
        this.dragOverNode = null;
    }, false);
}, _ComfyApp_addDrawBackgroundHandler = function _ComfyApp_addDrawBackgroundHandler(node) {
    const app = this;
    function getImageTop(node) {
        var _a;
        let shiftY;
        if (node.imageOffset != null) {
            shiftY = node.imageOffset;
        }
        else {
            if ((_a = node.widgets) === null || _a === void 0 ? void 0 : _a.length) {
                const w = node.widgets[node.widgets.length - 1];
                shiftY = w.last_y;
                if (w.computeSize) {
                    shiftY += w.computeSize()[1] + 4;
                }
                else if (w.computedHeight) {
                    shiftY += w.computedHeight;
                }
                else {
                    shiftY += LiteGraph.NODE_WIDGET_HEIGHT + 4;
                }
            }
            else {
                shiftY = node.computeSize()[1];
            }
        }
        return shiftY;
    }
    node.prototype.setSizeForImage = function () {
        if (this.inputHeight) {
            this.setSize(this.size);
            return;
        }
        const minHeight = getImageTop(this) + 220;
        if (this.size[1] < minHeight) {
            this.setSize([this.size[0], minHeight]);
        }
    };
    node.prototype.onDrawBackground = function (ctx) {
        if (!this.flags.collapsed) {
            let imgURLs = [];
            let imagesChanged = false;
            const output = app.nodeOutputs[this.id + ''];
            if (output && output.images) {
                if (this.images !== output.images) {
                    this.images = output.images;
                    imagesChanged = true;
                    imgURLs = imgURLs.concat(output.images.map((params) => {
                        return api.apiURL('/view?' +
                            new URLSearchParams(params).toString() +
                            app.getPreviewFormatParam());
                    }));
                }
            }
            const preview = app.nodePreviewImages[this.id + ''];
            if (this.preview !== preview) {
                this.preview = preview;
                imagesChanged = true;
                if (preview != null) {
                    imgURLs.push(preview);
                }
            }
            if (imagesChanged) {
                this.imageIndex = null;
                if (imgURLs.length > 0) {
                    Promise.all(imgURLs.map((src) => {
                        return new Promise((r) => {
                            const img = new Image();
                            img.onload = () => r(img);
                            img.onerror = () => r(null);
                            img.src = src;
                        });
                    })).then((imgs) => {
                        var _a;
                        if ((!output || this.images === output.images) &&
                            (!preview || this.preview === preview)) {
                            this.imgs = imgs.filter(Boolean);
                            (_a = this.setSizeForImage) === null || _a === void 0 ? void 0 : _a.call(this);
                            app.graph.setDirtyCanvas(true);
                        }
                    });
                }
                else {
                    this.imgs = null;
                }
            }
            if (this.imgs && this.imgs.length) {
                const canvas = this.graph.list_of_graphcanvas[0];
                const mouse = canvas.graph_mouse;
                if (!canvas.pointer_is_down && this.pointerDown) {
                    if (mouse[0] === this.pointerDown.pos[0] &&
                        mouse[1] === this.pointerDown.pos[1]) {
                        this.imageIndex = this.pointerDown.index;
                    }
                    this.pointerDown = null;
                }
                let w = this.imgs[0].naturalWidth;
                let h = this.imgs[0].naturalHeight;
                let imageIndex = this.imageIndex;
                const numImages = this.imgs.length;
                if (numImages === 1 && !imageIndex) {
                    this.imageIndex = imageIndex = 0;
                }
                const shiftY = getImageTop(this);
                let dw = this.size[0];
                let dh = this.size[1];
                dh -= shiftY;
                if (imageIndex == null) {
                    let best = 0;
                    let cellWidth;
                    let cellHeight;
                    let cols = 0;
                    let shiftX = 0;
                    for (let c = 1; c <= numImages; c++) {
                        const rows = Math.ceil(numImages / c);
                        const cW = dw / c;
                        const cH = dh / rows;
                        const scaleX = cW / w;
                        const scaleY = cH / h;
                        const scale = Math.min(scaleX, scaleY, 1);
                        const imageW = w * scale;
                        const imageH = h * scale;
                        const area = imageW * imageH * numImages;
                        if (area > best) {
                            best = area;
                            cellWidth = imageW;
                            cellHeight = imageH;
                            cols = c;
                            shiftX = c * ((cW - imageW) / 2);
                        }
                    }
                    let anyHovered = false;
                    this.imageRects = [];
                    for (let i = 0; i < numImages; i++) {
                        const img = this.imgs[i];
                        const row = Math.floor(i / cols);
                        const col = i % cols;
                        const x = col * cellWidth + shiftX;
                        const y = row * cellHeight + shiftY;
                        if (!anyHovered) {
                            anyHovered = LiteGraph.isInsideRectangle(mouse[0], mouse[1], x + this.pos[0], y + this.pos[1], cellWidth, cellHeight);
                            if (anyHovered) {
                                this.overIndex = i;
                                let value = 110;
                                if (canvas.pointer_is_down) {
                                    if (!this.pointerDown || this.pointerDown.index !== i) {
                                        this.pointerDown = { index: i, pos: [...mouse] };
                                    }
                                    value = 125;
                                }
                                ctx.filter = `contrast(${value}%) brightness(${value}%)`;
                                canvas.canvas.style.cursor = 'pointer';
                            }
                        }
                        this.imageRects.push([x, y, cellWidth, cellHeight]);
                        ctx.drawImage(img, x, y, cellWidth, cellHeight);
                        ctx.filter = 'none';
                    }
                    if (!anyHovered) {
                        this.pointerDown = null;
                        this.overIndex = null;
                    }
                }
                else {
                    const scaleX = dw / w;
                    const scaleY = dh / h;
                    const scale = Math.min(scaleX, scaleY, 1);
                    w *= scale;
                    h *= scale;
                    let x = (dw - w) / 2;
                    let y = (dh - h) / 2 + shiftY;
                    ctx.drawImage(this.imgs[imageIndex], x, y, w, h);
                    const drawButton = (x, y, sz, text) => {
                        const hovered = LiteGraph.isInsideRectangle(mouse[0], mouse[1], x + this.pos[0], y + this.pos[1], sz, sz);
                        let fill = '#333';
                        let textFill = '#fff';
                        let isClicking = false;
                        if (hovered) {
                            canvas.canvas.style.cursor = 'pointer';
                            if (canvas.pointer_is_down) {
                                fill = '#1e90ff';
                                isClicking = true;
                            }
                            else {
                                fill = '#eee';
                                textFill = '#000';
                            }
                        }
                        else {
                            this.pointerWasDown = null;
                        }
                        ctx.fillStyle = fill;
                        ctx.beginPath();
                        ctx.roundRect(x, y, sz, sz, [4]);
                        ctx.fill();
                        ctx.fillStyle = textFill;
                        ctx.font = '12px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(text, x + 15, y + 20);
                        return isClicking;
                    };
                    if (numImages > 1) {
                        if (drawButton(x + w - 35, y + h - 35, 30, `${this.imageIndex + 1}/${numImages}`)) {
                            let i = this.imageIndex + 1 >= numImages ? 0 : this.imageIndex + 1;
                            if (!this.pointerDown || !this.pointerDown.index === i) {
                                this.pointerDown = { index: i, pos: [...mouse] };
                            }
                        }
                        if (drawButton(x + w - 35, y + 5, 30, `x`)) {
                            if (!this.pointerDown || !this.pointerDown.index === null) {
                                this.pointerDown = { index: null, pos: [...mouse] };
                            }
                        }
                    }
                }
            }
        }
    };
}, _ComfyApp_addDrawNodeHandler = function _ComfyApp_addDrawNodeHandler() {
    const origDrawNodeShape = LGraphCanvas.prototype.drawNodeShape;
    const self = this;
    LGraphCanvas.prototype.drawNodeShape = function (node, ctx, size, fgcolor, bgcolor, selected, mouse_over) {
        var _a;
        const res = origDrawNodeShape.apply(this, arguments);
        const nodeErrors = (_a = self.lastNodeErrors) === null || _a === void 0 ? void 0 : _a[node.id];
        let color = null;
        let lineWidth = 1;
        if (node.id === +self.runningNodeId) {
            color = '#0f0';
        }
        else if (self.dragOverNode && node.id === self.dragOverNode.id) {
            color = 'dodgerblue';
        }
        else if (nodeErrors === null || nodeErrors === void 0 ? void 0 : nodeErrors.errors) {
            color = 'red';
            lineWidth = 2;
        }
        else if (self.lastExecutionError &&
            +self.lastExecutionError.node_id === node.id) {
            color = '#f0f';
            lineWidth = 2;
        }
        if (color) {
            const shape = node._shape || node.shape || LiteGraph.ROUND_SHAPE;
            ctx.lineWidth = lineWidth;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            if (shape == LiteGraph.BOX_SHAPE)
                ctx.rect(-6, -6 - LiteGraph.NODE_TITLE_HEIGHT, 12 + size[0] + 1, 12 + size[1] + LiteGraph.NODE_TITLE_HEIGHT);
            else if (shape == LiteGraph.ROUND_SHAPE ||
                (shape == LiteGraph.CARD_SHAPE && node.flags.collapsed))
                ctx.roundRect(-6, -6 - LiteGraph.NODE_TITLE_HEIGHT, 12 + size[0] + 1, 12 + size[1] + LiteGraph.NODE_TITLE_HEIGHT, this.round_radius * 2);
            else if (shape == LiteGraph.CARD_SHAPE)
                ctx.roundRect(-6, -6 - LiteGraph.NODE_TITLE_HEIGHT, 12 + size[0] + 1, 12 + size[1] + LiteGraph.NODE_TITLE_HEIGHT, [this.round_radius * 2, this.round_radius * 2, 2, 2]);
            else if (shape == LiteGraph.CIRCLE_SHAPE)
                ctx.arc(size[0] * 0.5, size[1] * 0.5, size[0] * 0.5 + 6, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.stroke();
            ctx.strokeStyle = fgcolor;
            ctx.globalAlpha = 1;
        }
        if (self.progress && node.id === +self.runningNodeId) {
            ctx.fillStyle = 'green';
            ctx.fillRect(0, 0, size[0] * (self.progress.value / self.progress.max), 6);
            ctx.fillStyle = bgcolor;
        }
        if (nodeErrors) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'red';
            for (const error of nodeErrors.errors) {
                if (error.extra_info && error.extra_info.input_name) {
                    const inputIndex = node.findInputSlot(error.extra_info.input_name);
                    if (inputIndex !== -1) {
                        let pos = node.getConnectionPos(true, inputIndex);
                        ctx.beginPath();
                        ctx.arc(pos[0] - node.pos[0], pos[1] - node.pos[1], 12, 0, 2 * Math.PI, false);
                        ctx.stroke();
                    }
                }
            }
        }
        return res;
    };
    const origDrawNode = LGraphCanvas.prototype.drawNode;
    LGraphCanvas.prototype.drawNode = function (node, ctx) {
        var editor_alpha = this.editor_alpha;
        var old_color = node.bgcolor;
        if (node.mode === 2) {
            this.editor_alpha = 0.4;
        }
        if (node.mode === 4) {
            node.bgcolor = '#FF00FF';
            this.editor_alpha = 0.2;
        }
        const res = origDrawNode.apply(this, arguments);
        this.editor_alpha = editor_alpha;
        node.bgcolor = old_color;
        return res;
    };
};
export const app = new ComfyApp();
