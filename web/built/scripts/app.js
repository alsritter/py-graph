var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CanvasManager } from './canvas-manager/index.js';
import { ExtensionsManager } from './extension-manager/index.js';
import { WorkflowManager } from './workflow-manager/index.js';
import { NodeManager } from './node-manager/index.js';
import { EventManager } from './event.js';
import { StateHandler } from './state-handler/index.js';
import { Logger } from './logger/index.js';
export class ComfyApp {
    constructor() { }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            const eventManager = new EventManager();
            this.logger = new Logger();
            this.nodeManager = new NodeManager(eventManager);
            this.extensionsManager = new ExtensionsManager(eventManager);
            this.canvasManager = new CanvasManager(eventManager);
            this.stateHandler = new StateHandler();
            this.workflowManager = new WorkflowManager(eventManager);
            const modules = [
                this.extensionsManager,
                this.canvasManager,
                this.stateHandler,
                this.nodeManager,
                this.workflowManager,
                this.logger
            ];
            for (const module of modules) {
                yield module.init({
                    logger: this.logger,
                    nodeManager: this.nodeManager,
                    extensionsManager: this.extensionsManager,
                    canvasManager: this.canvasManager,
                    stateHandler: this.stateHandler,
                    workflowManager: this.workflowManager,
                });
            }
            for (const module of modules) {
                yield module.setup();
            }
            yield eventManager.invokeExtensions('setup', this);
        });
    }
    registerExtension(extension) {
        this.extensionsManager.registerExtension(extension);
    }
}
export const app = new ComfyApp();
//# sourceMappingURL=app.js.map