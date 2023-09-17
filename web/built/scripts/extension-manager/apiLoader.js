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
export class ExtensionsLoader {
    constructor(eventManager) {
        this.eventManager = eventManager;
    }
    setup(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const extensions = yield api.getExtensions();
            for (const ext of extensions) {
                try {
                    yield import(api.apiURL(ext));
                }
                catch (error) {
                    console.error('Error loading extension', ext, error);
                }
            }
        });
    }
}
