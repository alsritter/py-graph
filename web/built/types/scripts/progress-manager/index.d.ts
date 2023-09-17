import { StateHandler } from '../state-handler/index.js';
export declare class ProgressManager implements Module {
    stateHandler: StateHandler;
    progress: {
        value: number;
        max: number;
    };
    setup(config: ComfyCenter): void;
}
