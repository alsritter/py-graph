export declare class StateHandler implements Module {
    #private;
    private workflowManager;
    private nodeManager;
    private canvasManager;
    private logger;
    progress: {
        value: number;
        max: number;
    };
    lastNodeErrors: [];
    nodeOutputs: Record<string, any>;
    lastExecutionError: any;
    runningNodeId: any;
    shiftDown: boolean;
    init(config: ComfyCenter): void;
    setup(): void;
    queueRunner(number: any, batchCount?: number): Promise<void>;
    clean(): void;
}
