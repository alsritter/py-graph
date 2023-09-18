var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { api } from '../api.js';
export class ExtensionsManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
    }
    init(config) {
        return __awaiter(this, void 0, void 0, function* () {
            this.extensions = [];
            const extensions = yield api.getExtensions();
            for (const ext of extensions) {
                try {
                    yield import(api.apiURL(ext));
                }
                catch (error) {
                    console.error('Error loading extension', ext, error);
                }
            }
            this.listenAndForwardEvents();
        });
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    listenAndForwardEvents() {
        const events = [
            'init',
            'setup',
            'addCustomNodeDefs',
            'getCustomWidgets',
            'beforeRegisterNodeDef',
            'registerCustomNodes',
            'loadedGraphNode',
            'nodeCreated'
        ];
        for (const key of events) {
            this.eventManager.addEventListener(key, (method, ...args) => __awaiter(this, void 0, void 0, function* () {
                return yield Promise.all(this.extensions.map((ext) => __awaiter(this, void 0, void 0, function* () {
                    console.log(`Calling extension '${ext.name}' method '${key}'`);
                    if (method in ext) {
                        try {
                            return yield ext[key](...args, this);
                        }
                        catch (error) {
                            console.error(`Error calling extension '${ext.name}' method '${method}'`, { error }, { extension: ext }, { args });
                        }
                    }
                })));
            }));
        }
    }
    registerExtension(extension) {
        if (!extension.name) {
            throw new Error("Extensions must have a 'name' property.");
        }
        if (this.extensions.find((ext) => ext.name === extension.name)) {
            throw new Error(`Extension named '${extension.name}' already registered.`);
        }
        this.extensions.push(extension);
    }
}
//# sourceMappingURL=index.js.map