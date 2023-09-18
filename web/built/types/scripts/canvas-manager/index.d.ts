import { EventManager } from '../event.js';
import { ComfyUI } from './ui.js';
export declare class CanvasManager implements Module {
    private eventManager;
    center: ComfyCenter;
    ui: ComfyUI;
    canvasEl: HTMLCanvasElement;
    graph: LGraph;
    canvas: LGraphCanvas;
    ctx: CanvasRenderingContext2D;
    constructor(eventManager: EventManager);
    init(center: ComfyCenter): void;
    setup(): Promise<void>;
    getPreviewFormatParam(): string;
}
