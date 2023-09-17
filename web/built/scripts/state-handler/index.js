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
export class StateHandler {
    constructor() {
        _StateHandler_instances.add(this);
        _StateHandler_queueItems.set(this, []);
        _StateHandler_processingQueue.set(this, false);
    }
    setup(config) {
        this.workflowManager = config.workflowManager;
        this.canvasManager = config.canvasManager;
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
        this.progressManager.progress = detail;
        this.canvasManager.graph.setDirtyCanvas(true, false);
    });
    api.addEventListener('executing', ({ detail }) => {
        this.progressManager.progress = null;
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
