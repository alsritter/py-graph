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
var _StateHandler_instances, _StateHandler_queueItems, _StateHandler_processingQueue, _StateHandler_addApiUpdateHandlers;
import { api } from '../api.js';
import { app } from '../app.js';
export class StateHandler {
    constructor() {
        _StateHandler_instances.add(this);
        _StateHandler_queueItems.set(this, []);
        _StateHandler_processingQueue.set(this, false);
        this.shiftDown = false;
    }
    init(config) {
        this.workflowManager = config.workflowManager;
        this.canvasManager = config.canvasManager;
    }
    setup() {
        __classPrivateFieldGet(this, _StateHandler_instances, "m", _StateHandler_addApiUpdateHandlers).call(this);
    }
    queueRunner(number, batchCount = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Queueing runner', number, batchCount);
            __classPrivateFieldGet(this, _StateHandler_queueItems, "f").push({ number, batchCount });
            if (__classPrivateFieldGet(this, _StateHandler_processingQueue, "f")) {
                return;
            }
            __classPrivateFieldSet(this, _StateHandler_processingQueue, true, "f");
            this.lastNodeErrors = null;
            try {
                while (__classPrivateFieldGet(this, _StateHandler_queueItems, "f").length) {
                    ;
                    ({ number, batchCount } = __classPrivateFieldGet(this, _StateHandler_queueItems, "f").pop());
                    for (let i = 0; i < batchCount; i++) {
                        const p = yield this.workflowManager.graphToRunner();
                        try {
                            const res = yield api.queueRunner(number, p);
                            this.lastNodeErrors = res.node_errors;
                            if (this.lastNodeErrors.length > 0) {
                                this.canvasManager.canvas.draw(true, true);
                            }
                        }
                        catch (error) {
                            const formattedError = this.logger.formatRunnerError(error);
                            this.canvasManager.ui.dialog.show(formattedError);
                            if (error.response) {
                                this.lastNodeErrors = error.response.node_errors;
                                this.canvasManager.canvas.draw(true, true);
                            }
                            break;
                        }
                        for (const n of p.workflow.nodes) {
                            const node = this.canvasManager.graph.getNodeById(n.id);
                            if (node.widgets) {
                                for (const w of node.widgets) {
                                    const widget = w;
                                    if (widget.afterQueued) {
                                        widget.afterQueued();
                                    }
                                }
                            }
                        }
                        this.canvasManager.canvas.draw(true, true);
                        yield this.canvasManager.ui.queue.update();
                    }
                }
            }
            finally {
                __classPrivateFieldSet(this, _StateHandler_processingQueue, false, "f");
            }
        });
    }
    clean() {
        this.nodeOutputs = {};
        this.lastNodeErrors = null;
        this.lastExecutionError = null;
        this.runningNodeId = null;
    }
    static onClipspaceEditorSave() {
        if (StateHandler.clipspace_return_node) {
            StateHandler.pasteFromClipspace(StateHandler.clipspace_return_node);
        }
    }
    static onClipspaceEditorClosed() {
        StateHandler.clipspace_return_node = null;
    }
    static copyToClipspace(node) {
        var widgets = null;
        if (node.widgets) {
            widgets = node.widgets.map(({ type, name, value }) => ({
                type,
                name,
                value
            }));
        }
        var imgs = undefined;
        var orig_imgs = undefined;
        if (node.imgs != undefined) {
            imgs = [];
            orig_imgs = [];
            for (let i = 0; i < node.imgs.length; i++) {
                imgs[i] = new Image();
                imgs[i].src = node.imgs[i].src;
                orig_imgs[i] = imgs[i];
            }
        }
        var selectedIndex = 0;
        if (node.imageIndex) {
            selectedIndex = node.imageIndex;
        }
        StateHandler.clipspace = {
            widgets: widgets,
            imgs: imgs,
            original_imgs: orig_imgs,
            images: node.images,
            selectedIndex: selectedIndex,
            img_paste_mode: 'selected'
        };
        StateHandler.clipspace_return_node = null;
        if (StateHandler.clipspace_invalidate_handler) {
            StateHandler.clipspace_invalidate_handler();
        }
    }
    static pasteFromClipspace(node) {
        if (StateHandler.clipspace) {
            if (StateHandler.clipspace.imgs && node.imgs) {
                if (node.images && StateHandler.clipspace.images) {
                    if (StateHandler.clipspace['img_paste_mode'] == 'selected') {
                        node.images = [
                            StateHandler.clipspace.images[StateHandler.clipspace['selectedIndex']]
                        ];
                    }
                    else {
                        node.images = StateHandler.clipspace.images;
                    }
                    if (app.stateHandler.nodeOutputs[node.id + ''])
                        app.stateHandler.nodeOutputs[node.id + ''].images = node.images;
                }
                if (StateHandler.clipspace.imgs) {
                    if (StateHandler.clipspace['img_paste_mode'] == 'selected') {
                        const img = new Image();
                        img.src =
                            StateHandler.clipspace.imgs[StateHandler.clipspace['selectedIndex']].src;
                        node.imgs = [img];
                        node.imageIndex = 0;
                    }
                    else {
                        const imgs = [];
                        for (let i = 0; i < StateHandler.clipspace.imgs.length; i++) {
                            imgs[i] = new Image();
                            imgs[i].src = StateHandler.clipspace.imgs[i].src;
                            node.imgs = imgs;
                        }
                    }
                }
            }
            if (node.widgets) {
                if (StateHandler.clipspace.images) {
                    const clip_image = StateHandler.clipspace.images[StateHandler.clipspace['selectedIndex']];
                    const index = node.widgets.findIndex((obj) => obj.name === 'image');
                    if (index >= 0) {
                        if (node.widgets[index].type != 'image' &&
                            typeof node.widgets[index].value == 'string' &&
                            clip_image.filename) {
                            node.widgets[index].value =
                                (clip_image.subfolder ? clip_image.subfolder + '/' : '') +
                                    clip_image.filename +
                                    (clip_image.type ? ` [${clip_image.type}]` : '');
                        }
                        else {
                            node.widgets[index].value = clip_image;
                        }
                    }
                }
                if (StateHandler.clipspace.widgets) {
                    StateHandler.clipspace.widgets.forEach(({ type, name, value }) => {
                        const prop = Object.values(node.widgets).find((obj) => obj.type === type && obj.name === name);
                        if (prop && prop.type != 'button') {
                            if (prop.type != 'image' &&
                                typeof prop.value == 'string' &&
                                value.filename) {
                                prop.value =
                                    (value.subfolder ? value.subfolder + '/' : '') +
                                        value.filename +
                                        (value.type ? ` [${value.type}]` : '');
                            }
                            else {
                                prop.value = value;
                                prop.callback(value);
                            }
                        }
                    });
                }
            }
            app.canvasManager.graph.setDirtyCanvas(true);
        }
    }
}
_StateHandler_queueItems = new WeakMap(), _StateHandler_processingQueue = new WeakMap(), _StateHandler_instances = new WeakSet(), _StateHandler_addApiUpdateHandlers = function _StateHandler_addApiUpdateHandlers() {
    api.addEventListener('status', ({ detail }) => {
        this.canvasManager.ui.setStatus(detail);
    });
    api.addEventListener('reconnecting', () => {
        this.canvasManager.ui.dialog.show('Reconnecting...');
    });
    api.addEventListener('reconnected', () => {
        this.canvasManager.ui.dialog.close();
    });
    api.addEventListener('progress', ({ detail }) => {
        this.progress = detail;
        this.canvasManager.graph.setDirtyCanvas(true, false);
    });
    api.addEventListener('executing', ({ detail }) => {
        this.progress = null;
        this.runningNodeId = detail;
        this.canvasManager.graph.setDirtyCanvas(true, false);
        delete this.nodeManager.nodePreviewImages[this.runningNodeId];
    });
    api.addEventListener('executed', ({ detail }) => {
        this.nodeOutputs[detail.node] = detail.output;
        const node = this.canvasManager.graph.getNodeById(detail.node);
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
        const formattedError = this.logger.formatExecutionError(detail);
        this.canvasManager.ui.dialog.show(formattedError);
        this.canvasManager.canvas.draw(true, true);
    });
    api.addEventListener('b_preview', ({ detail }) => {
        const id = this.runningNodeId;
        if (id == null)
            return;
        const blob = detail;
        const blobUrl = URL.createObjectURL(blob);
        this.nodeManager.nodePreviewImages[id] = [blobUrl];
    });
    api.init();
};
StateHandler.clipspace = null;
StateHandler.clipspace_invalidate_handler = null;
StateHandler.clipspace_return_node = null;
//# sourceMappingURL=index.js.map