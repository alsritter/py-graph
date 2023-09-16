import { ComfyUI } from './ui.js';
import { ComfyLogging } from './logging.js';
export declare class ComfyApp {
    #private;
    ui: ComfyUI;
    extensions: ComfyExtension[];
    nodeOutputs: Record<string, any>;
    canvasEl: HTMLCanvasElement;
    graph: LGraph;
    canvas: LGraphCanvas;
    ctx: CanvasRenderingContext2D;
    lastNodeErrors: [];
    lastExecutionError: any;
    runningNodeId: any;
    progress: {
        value: number;
        max: number;
    };
    dragOverNode: LGraphNode;
    logging: ComfyLogging;
    nodePreviewImages: Record<string, string[]>;
    constructor();
    setup(): Promise<void>;
    registerNodes(): Promise<void>;
    registerNodesFromDefs(defs: {
        [x: string]: any;
    }): Promise<void>;
    registerExtension(extension: ComfyExtension): void;
    queueRunner(number: any, batchCount?: number): Promise<void>;
    graphToRunner(): Promise<{
        workflow: serializedLGraph<SerializedLGraphNode<LGraphNode>, [number, number, number, number, number, string], SerializedLGraphGroup>;
        output: {};
    }>;
    loadGraphData(graphData: any): void;
    handleFile(file: any): Promise<void>;
    getPreviewFormatParam(): string;
    clean(): void;
}
export declare const app: ComfyApp;
