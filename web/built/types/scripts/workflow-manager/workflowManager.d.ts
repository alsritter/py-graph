import { EventManager } from '../eventManager.js';
export declare class WorkflowManager implements Module {
    private eventManager;
    private canvasManager;
    private logging;
    constructor(eventManager: EventManager);
    setup(config: ComfyCenter): void;
    loadGraphData(graphData: any): Promise<void>;
    clean(): void;
}
