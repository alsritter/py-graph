export declare class EventManager {
    private listeners;
    addEventListener(eventName: string, callback: Function): void;
    removeEventListener(eventName: string, callback: Function): void;
    invokeExtensionsAsync(eventName: string, ...args: any[]): void;
    invokeExtensions(eventName: string, ...args: any[]): Promise<any[]>;
}
