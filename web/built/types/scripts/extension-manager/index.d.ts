import { EventManager } from '../eventManager.js';
export declare class ExtensionsManager implements Module {
    private eventManager;
    extensions: ComfyExtension[];
    constructor(eventManager: EventManager);
    init(config: ComfyCenter): void;
    setup(): Promise<void>;
    listenAndForwardEvents(): void;
    registerExtension(extension: ComfyExtension): void;
}
