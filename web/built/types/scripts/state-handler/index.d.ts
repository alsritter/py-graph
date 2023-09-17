export declare class StateHandler implements Module {
    #private;
    private workflowManager;
    private nodeManager;
    private canvasManager;
    private progressManager;
    private logger;
    lastNodeErrors: [];
    nodeOutputs: Record<string, any>;
    lastExecutionError: any;
    runningNodeId: any;
    setup(config: ComfyCenter): void;
    queueRunner(number: any, batchCount?: number): Promise<void>;
    clean(): void;
}
