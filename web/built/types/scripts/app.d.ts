import { CanvasManager } from './canvas-manager/index.js';
import { ExtensionsManager } from './extension-manager/index.js';
import { WorkflowManager } from './workflow-manager/index.js';
import { NodeManager } from './node-manager/index.js';
import { StateHandler } from './state-handler/index.js';
import { ProgressManager } from './progress-manager/index.js';
import { Logger } from './logger/index.js';
export declare class ComfyApp {
    logger: Logger;
    nodeManager: NodeManager;
    extensionsManager: ExtensionsManager;
    canvasManager: CanvasManager;
    stateHandler: StateHandler;
    workflowManager: WorkflowManager;
    progressManager: ProgressManager;
    constructor();
    setup(): Promise<void>;
    registerExtension(extension: ComfyExtension): void;
}
export declare const app: ComfyApp;
