import { EventManager } from '../eventManager.js';
export declare class WorkflowManager implements Module {
    #private;
    private eventManager;
    private canvasManager;
    private logging;
    private stateHandler;
    private nodeManager;
    constructor(eventManager: EventManager);
    init(config: ComfyCenter): void;
    setup(): void;
    loadGraphData(graphData: any): Promise<void>;
    graphToRunner(): Promise<{
        workflow: serializedLGraph<SerializedLGraphNode<LGraphNode>, [number, number, number, number, number, string], SerializedLGraphGroup>;
        output: {};
    }>;
    handleFile(file: any): Promise<void>;
}