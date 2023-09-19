export declare class StateHandler implements Module {
    #private;
    static clipspace: any;
    static clipspace_invalidate_handler: any;
    static clipspace_return_node: any;
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
    static onClipspaceEditorSave(): void;
    static onClipspaceEditorClosed(): void;
    static copyToClipspace(node: any): void;
    static pasteFromClipspace(node: any): void;
}
