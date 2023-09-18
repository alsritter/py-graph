import { CanvasManager } from '../canvas-manager/index.js';
import { StateHandler } from '../state-handler/index.js';
import { EventManager } from '../event.js';
export declare class NodeManager implements Module {
    #private;
    private eventManager;
    nodePreviewImages: Record<string, string[]>;
    dragOverNode: LGraphNode;
    canvasManager: CanvasManager;
    stateHandler: StateHandler;
    center: ComfyCenter;
    constructor(eventManager: EventManager);
    init(center: ComfyCenter): void;
    setup(): Promise<void>;
    registerNodesFromDefs(defs: {
        [x: string]: any;
    }): Promise<void>;
}
