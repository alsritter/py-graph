import { ComfyDialog } from './ui.js';
import type { ComfyApp } from './app.js';
declare class ComfyLoggingDialog extends ComfyDialog {
    logging: ComfyLogging;
    constructor(logging: ComfyLogging);
    clear(): void;
    export(): void;
    import(): void;
    createButtons(): CustomElement[];
    getTypeColor(type: any): "red" | "orange" | "dodgerblue";
    show(entries?: any): void;
}
export declare class ComfyLogging {
    #private;
    entries: Array<{
        source: string;
        type: string;
        timestamp: Date;
        message: any;
    }>;
    app: ComfyApp;
    dialog: ComfyLoggingDialog;
    get enabled(): boolean;
    set enabled(value: boolean);
    constructor(app: ComfyApp);
    addSetting(): void;
    patchConsole(): void;
    unpatchConsole(): void;
    catchUnhandled(): void;
    clear(): void;
    addEntry(source: string, type: string, ...args: {
        UserAgent?: string;
        MissingNodes?: any[];
    }[]): void;
    log(source: any, ...args: any[]): void;
    addInitData(): Promise<void>;
}
export {};
