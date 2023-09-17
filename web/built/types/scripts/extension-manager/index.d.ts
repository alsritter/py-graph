import { EventManager } from '../eventManager.js';
export declare class ExtensionsManager implements Module {
    private eventManager;
    extensions: ComfyExtension[];
    constructor(eventManager: EventManager);
    setup(config: any): Promise<void>;
    listenAndForwardEvents(): void;
    registerExtension(extension: ComfyExtension): void;
}
