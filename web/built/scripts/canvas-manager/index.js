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
var _CanvasManager_instances, _CanvasManager_addKeyboardHandler, _CanvasManager_addProcessMouseHandler, _CanvasManager_addProcessKeyHandler;
import { ComfyUI } from './ui.js';
export class CanvasManager {
    constructor(eventManager) {
        _CanvasManager_instances.add(this);
        this.eventManager = eventManager;
    }
    init(center) {
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
        this.stateHandler = center.stateHandler;
        this.center = center;
        this.ui = new ComfyUI(center);
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.eventManager.invokeExtensions('init', this.center);
            __classPrivateFieldGet(this, _CanvasManager_instances, "m", _CanvasManager_addKeyboardHandler).call(this);
            __classPrivateFieldGet(this, _CanvasManager_instances, "m", _CanvasManager_addProcessMouseHandler).call(this);
            __classPrivateFieldGet(this, _CanvasManager_instances, "m", _CanvasManager_addProcessKeyHandler).call(this);
        });
    }
    getPreviewFormatParam() {
        let preview_format = this.ui.settings.getSettingValue('Comfy.PreviewFormat');
        if (preview_format)
            return `&preview=${preview_format}`;
        else
            return '';
    }
}
_CanvasManager_instances = new WeakSet(), _CanvasManager_addKeyboardHandler = function _CanvasManager_addKeyboardHandler() {
    window.addEventListener('keydown', (e) => {
        this.stateHandler.shiftDown = e.shiftKey;
    });
    window.addEventListener('keyup', (e) => {
        this.stateHandler.shiftDown = e.shiftKey;
    });
}, _CanvasManager_addProcessMouseHandler = function _CanvasManager_addProcessMouseHandler() {
    const self = this;
    const origProcessMouseDown = LGraphCanvas.prototype.processMouseDown;
    LGraphCanvas.prototype.processMouseDown = function (e) {
        const res = origProcessMouseDown.apply(this, arguments);
        this.selected_group_moving = false;
        if (this.selected_group && !this.selected_group_resizing) {
            var font_size = this.selected_group.font_size || LiteGraph.DEFAULT_GROUP_FONT_SIZE;
            var height = font_size * 1.4;
            if (LiteGraph.isInsideRectangle(e.canvasX, e.canvasY, this.selected_group.pos[0], this.selected_group.pos[1], this.selected_group.size[0], height)) {
                this.selected_group_moving = true;
            }
        }
        return res;
    };
    const origProcessMouseMove = LGraphCanvas.prototype.processMouseMove;
    LGraphCanvas.prototype.processMouseMove = function (e) {
        const orig_selected_group = this.selected_group;
        if (this.selected_group &&
            !this.selected_group_resizing &&
            !this.selected_group_moving) {
            this.selected_group = null;
        }
        const res = origProcessMouseMove.apply(this, arguments);
        if (orig_selected_group &&
            !this.selected_group_resizing &&
            !this.selected_group_moving) {
            this.selected_group = orig_selected_group;
        }
        return res;
    };
}, _CanvasManager_addProcessKeyHandler = function _CanvasManager_addProcessKeyHandler() {
    const self = this;
    const origProcessKey = LGraphCanvas.prototype.processKey;
    LGraphCanvas.prototype.processKey = function (e) {
        const res = origProcessKey.apply(this, arguments);
        console.log('Ctrl + M', e);
        if (res === false) {
            return res;
        }
        if (!this.graph) {
            return;
        }
        var block_default = false;
        if (e.target.localName == 'input') {
            return;
        }
        if (e.type == 'keydown') {
            console.log('Ctrl + M');
            if (e.keyCode == 77 && e.ctrlKey) {
                if (this.selected_nodes) {
                    for (var i in this.selected_nodes) {
                        if (this.selected_nodes[i].mode === 2) {
                            this.selected_nodes[i].mode = 0;
                        }
                        else {
                            this.selected_nodes[i].mode = 2;
                        }
                    }
                }
                block_default = true;
            }
            if (e.keyCode == 66 && e.ctrlKey) {
                if (this.selected_nodes) {
                    for (var i in this.selected_nodes) {
                        if (this.selected_nodes[i].mode === 4) {
                            this.selected_nodes[i].mode = 0;
                        }
                        else {
                            this.selected_nodes[i].mode = 4;
                        }
                    }
                }
                block_default = true;
            }
        }
        this.graph.change();
        if (block_default) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        }
        return res;
    };
};
//# sourceMappingURL=index.js.map