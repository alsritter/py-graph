import { CanvasManager } from '../canvas-manager/index.js';
import { StateHandler } from '../state-handler/index.js';
import { ProgressManager } from '../progress-manager/index.js';
import { EventManager } from '../eventManager.js';
export declare class NodeManager implements Module {
    #private;
    private eventManager;
    nodePreviewImages: Record<string, string[]>;
    dragOverNode: LGraphNode;
    canvasManager: CanvasManager;
    stateHandler: StateHandler;
    progressManager: ProgressManager;
    constructor(eventManager: EventManager);
    setup(config: ComfyCenter): Promise<void>;
    registerNodes(config: ComfyCenter): Promise<void>;
    registerNodesFromDefs(config: ComfyCenter, defs: {
        [x: string]: any;
    }): Promise<void>;
}
