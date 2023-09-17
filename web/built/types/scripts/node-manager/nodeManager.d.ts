import { EventManager } from '../eventManager.js';
export declare class NodeManager implements Module {
    #private;
    private eventManager;
    constructor(eventManager: EventManager);
    setup(config: any): void;
    registerNodesFromDefs(defs: {
        [x: string]: any;
    }): Promise<void>;
    getPreviewFormatParam(): string;
}
