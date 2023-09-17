import { EventManager } from '../eventManager.js';
export declare class ExtensionsLoader implements Module {
    private eventManager;
    constructor(eventManager: EventManager);
    setup(config: any): Promise<void>;
}
