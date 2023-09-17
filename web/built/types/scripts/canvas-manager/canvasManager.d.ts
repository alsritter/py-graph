import { EventManager } from '../eventManager.js';
import { ComfyUI } from '../ui.js';
export declare class CanvasManager implements Module {
    private eventManager;
    ui: ComfyUI;
    canvasEl: HTMLCanvasElement;
    graph: LGraph;
    canvas: LGraphCanvas;
    ctx: CanvasRenderingContext2D;
    constructor(eventManager: EventManager);
    setup(config: any): Promise<void>;
}
