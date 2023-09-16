import { ComfyUI } from "./ui.js";
import type { ComfyExtension } from "../types/comfy.js";
import { LGraph, LGraphCanvas } from "../types/litegraph.js";
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
    constructor();
    setup(): Promise<void>;
    registerNodes(): Promise<void>;
    registerNodesFromDefs(defs: {
        [x: string]: any;
    }): Promise<void>;
    registerExtension(extension: any): void;
    queueRunner(number: any, batchCount?: number | string): Promise<void>;
    graphToRunner(): Promise<{
        workflow: import("../types/litegraph.js").serializedLGraph<import("../types/litegraph.js").SerializedLGraphNode<import("../types/litegraph.js").LGraphNode>, [number, number, number, number, number, string], import("../types/litegraph.js").SerializedLGraphGroup>;
        output: {};
    }>;
    loadGraphData(graphData: any): void;
    clean(): void;
}
export declare const app: ComfyApp;
