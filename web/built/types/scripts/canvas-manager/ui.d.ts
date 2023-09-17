export declare function $el(tag: string, propsOrChildren?: CustomElement[] | CustomElement, children?: CustomElement[]): CustomElement;
export declare class ComfyDialog {
    element: CustomElement;
    textElement: CustomElement;
    constructor();
    createButtons(): Array<CustomElement>;
    close(): void;
    show(html: string | CustomElement): void;
}
declare class ComfySettingsDialog extends ComfyDialog {
    settings: any[];
    constructor();
    getSettingValue(id: string, defaultValue?: any): any;
    setSettingValue(id: string, value: any): void;
    addSetting({ id, name, type, defaultValue, onChange, attrs, tooltip, options }: {
        id: any;
        name: any;
        type: any;
        defaultValue: any;
        onChange?: (newValue: any, oldValue?: any) => void;
        attrs?: {};
        tooltip?: string;
        options?: any;
    }): {
        value: any;
    };
    show(): void;
}
export declare class ComfyUI {
    menuContainer: any;
    app: ComfyCenter;
    dialog: ComfyDialog;
    settings: ComfySettingsDialog;
    queue: ComfyList;
    history: ComfyList;
    queueSize: CustomElement;
    lastQueueSize: number | string;
    batchCount: number;
    constructor(app: ComfyCenter);
    setStatus(status: any): void;
}
declare class ComfyList {
    #private;
    element: CustomElement;
    button: HTMLButtonElement;
    app: ComfyCenter;
    constructor(text: string, app: ComfyCenter, type?: string);
    get visible(): boolean;
    load(): Promise<void>;
    update(): Promise<void>;
    show(): Promise<void>;
    hide(): void;
    toggle(): boolean;
}
export {};
