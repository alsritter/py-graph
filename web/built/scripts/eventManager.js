var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class EventManager {
    constructor() {
        this.listeners = {};
    }
    addEventListener(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }
    removeEventListener(eventName, callback) {
        const eventListeners = this.listeners[eventName];
        if (eventListeners) {
            const index = eventListeners.indexOf(callback);
            if (index !== -1) {
                eventListeners.splice(index, 1);
            }
        }
    }
    invokeExtensionsAsync(eventName, ...args) {
        const eventListeners = this.listeners[eventName];
        if (eventListeners) {
            eventListeners.forEach((listener) => {
                listener(eventName, ...args);
            });
        }
    }
    invokeExtensions(eventName, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const eventListeners = this.listeners[eventName];
            if (eventListeners) {
                const promises = eventListeners.map((listener) => Promise.resolve(listener(eventName, ...args)));
                return yield Promise.all(promises);
            }
            return [];
        });
    }
}
//# sourceMappingURL=eventManager.js.map