var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ComfyUI } from './ui.js';
export class CanvasManager {
    constructor(eventManager) {
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
        this.center = center;
        this.ui = new ComfyUI(center);
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.eventManager.invokeExtensions('init', this.center);
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
//# sourceMappingURL=index.js.map