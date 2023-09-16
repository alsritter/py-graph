import type { ComfyApp } from './app.js';
import type { ComfyWidgetsType } from './widgets.js';
export declare class ComfyNode extends LGraphNode {
    imgs?: Record<string, any>;
    inputHeight?: number;
    widgets: IWidget[];
    comfyClass?: string;
    imageOffset?: number;
    constructor(nodeData: ComfyObjectInfo, widgets: ComfyWidgetsType, app: ComfyApp);
}
