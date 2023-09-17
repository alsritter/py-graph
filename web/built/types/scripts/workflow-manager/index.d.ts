import { EventManager } from '../eventManager.js';
export declare class WorkflowManager implements Module {
    #private;
    private eventManager;
    private canvasManager;
    private logging;
    private stateHandler;
    private nodeManager;
    constructor(eventManager: EventManager);
    setup(config: ComfyCenter): void;
    loadGraphData(graphData: any): Promise<void>;
    graphToRunner(): Promise<{
        workflow: serializedLGraph<SerializedLGraphNode<LGraphNode>, [number, number, number, number, number, string], SerializedLGraphGroup>;
        output: {};
    }>;
    handleFile(file: any): Promise<void>;
}
