var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _ComfyApi_instances, _ComfyApi_registered, _ComfyApi_createSocket, _ComfyApi_pollQueue, _ComfyApi_postItem;
class ComfyApi extends EventTarget {
    constructor() {
        super();
        _ComfyApi_instances.add(this);
        _ComfyApi_registered.set(this, new Set());
        this.api_base = '';
        this.api_host = '';
        this.socket = null;
        this.clientId = '';
        this.api_host = location.host;
        this.api_base = location.pathname.split('/').slice(0, -1).join('/');
    }
    apiURL(route) {
        return this.api_base + route;
    }
    fetchApi(route, options = {}) {
        return fetch(this.apiURL(route), options);
    }
    addEventListener(type, callback, options = {}) {
        super.addEventListener(type, callback, options);
        __classPrivateFieldGet(this, _ComfyApi_registered, "f").add(type);
    }
    init() {
        __classPrivateFieldGet(this, _ComfyApi_instances, "m", _ComfyApi_createSocket).call(this, true);
    }
    getNodeDefs() {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield this.fetchApi('/object_info', { cache: 'no-store' });
            return yield resp.json();
        });
    }
    getExtensions() {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield this.fetchApi('/extensions', { cache: 'no-store' });
            return yield resp.json();
        });
    }
    queueRunner(number, { output, workflow }) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = {
                client_id: this.clientId,
                runner: output,
                extra_data: { extra_pnginfo: { workflow } },
                front: false,
                number: 0
            };
            if (number === -1) {
                body.front = true;
            }
            else if (number != 0) {
                body.number = number;
            }
            const res = yield this.fetchApi('/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            if (res.status !== 200) {
                throw {
                    response: yield res.json()
                };
            }
            return yield res.json();
        });
    }
    getItems(type) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type === 'queue') {
                return this.getQueue();
            }
            return this.getHistory();
        });
    }
    getQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield this.fetchApi('/queue');
                const data = yield res.json();
                return {
                    Running: data.queue_running.map((runner) => ({
                        runner,
                        remove: { name: 'Cancel', cb: () => api.interrupt() }
                    })),
                    Pending: data.queue_pending.map((runner) => ({ runner }))
                };
            }
            catch (error) {
                console.error(error);
                return { Running: [], Pending: [] };
            }
        });
    }
    getHistory() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield this.fetchApi('/history');
                return { History: Object.values(yield res.json()) };
            }
            catch (error) {
                console.error(error);
                return { History: [] };
            }
        });
    }
    deleteItem(type, id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _ComfyApi_instances, "m", _ComfyApi_postItem).call(this, type, { delete: [id] });
        });
    }
    clearItems(type) {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _ComfyApi_instances, "m", _ComfyApi_postItem).call(this, type, { clear: true });
        });
    }
    interrupt() {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _ComfyApi_instances, "m", _ComfyApi_postItem).call(this, 'interrupt', null);
        });
    }
    getSystemStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.fetchApi('/system_stats');
            return yield res.json();
        });
    }
}
_ComfyApi_registered = new WeakMap(), _ComfyApi_instances = new WeakSet(), _ComfyApi_createSocket = function _ComfyApi_createSocket(isReconnect) {
    if (this.socket) {
        return;
    }
    let opened = false;
    let existingSession = window.name;
    if (existingSession) {
        existingSession = '?clientId=' + existingSession;
    }
    this.socket = new WebSocket(`ws${window.location.protocol === 'https:' ? 's' : ''}://${this.api_host}${this.api_base}/ws${existingSession}`);
    this.socket.binaryType = 'arraybuffer';
    this.socket.addEventListener('open', () => {
        opened = true;
        if (isReconnect) {
            this.dispatchEvent(new CustomEvent('reconnected'));
        }
    });
    this.socket.addEventListener('error', () => {
        if (this.socket)
            this.socket.close();
        if (!isReconnect && !opened) {
            __classPrivateFieldGet(this, _ComfyApi_instances, "m", _ComfyApi_pollQueue).call(this);
        }
    });
    this.socket.addEventListener('close', () => {
        setTimeout(() => {
            this.socket = null;
            __classPrivateFieldGet(this, _ComfyApi_instances, "m", _ComfyApi_createSocket).call(this, true);
        }, 300);
        if (opened) {
            this.dispatchEvent(new CustomEvent('status', { detail: null }));
            this.dispatchEvent(new CustomEvent('reconnecting'));
        }
    });
    this.socket.addEventListener('message', (event) => {
        try {
            if (event.data instanceof ArrayBuffer) {
                const view = new DataView(event.data);
                const eventType = view.getUint32(0);
                const buffer = event.data.slice(4);
                switch (eventType) {
                    case 1:
                        const view2 = new DataView(event.data);
                        const imageType = view2.getUint32(0);
                        let imageMime;
                        switch (imageType) {
                            case 1:
                            default:
                                imageMime = 'image/jpeg';
                                break;
                            case 2:
                                imageMime = 'image/png';
                        }
                        const imageBlob = new Blob([buffer.slice(4)], { type: imageMime });
                        this.dispatchEvent(new CustomEvent('b_preview', { detail: imageBlob }));
                        break;
                    default:
                        throw new Error(`Unknown binary websocket message of type ${eventType}`);
                }
            }
            else {
                const msg = JSON.parse(event.data);
                switch (msg.type) {
                    case 'status':
                        if (msg.data.sid) {
                            this.clientId = msg.data.sid;
                            window.name = this.clientId;
                        }
                        this.dispatchEvent(new CustomEvent('status', { detail: msg.data.status }));
                        break;
                    case 'progress':
                        this.dispatchEvent(new CustomEvent('progress', { detail: msg.data }));
                        break;
                    case 'executing':
                        this.dispatchEvent(new CustomEvent('executing', { detail: msg.data.node }));
                        break;
                    case 'executed':
                        this.dispatchEvent(new CustomEvent('executed', { detail: msg.data }));
                        break;
                    case 'execution_start':
                        this.dispatchEvent(new CustomEvent('execution_start', { detail: msg.data }));
                        break;
                    case 'execution_error':
                        this.dispatchEvent(new CustomEvent('execution_error', { detail: msg.data }));
                        break;
                    case 'execution_cached':
                        this.dispatchEvent(new CustomEvent('execution_cached', { detail: msg.data }));
                        break;
                    default:
                        if (__classPrivateFieldGet(this, _ComfyApi_registered, "f").has(msg.type)) {
                            this.dispatchEvent(new CustomEvent(msg.type, { detail: msg.data }));
                        }
                        else {
                            throw new Error(`Unknown message type ${msg.type}`);
                        }
                }
            }
        }
        catch (error) {
            console.warn('Unhandled message:', event.data, error);
        }
    });
}, _ComfyApi_pollQueue = function _ComfyApi_pollQueue() {
    setInterval(() => __awaiter(this, void 0, void 0, function* () {
        try {
            const resp = yield this.fetchApi('/runner');
            const status = yield resp.json();
            this.dispatchEvent(new CustomEvent('status', { detail: status }));
        }
        catch (error) {
            this.dispatchEvent(new CustomEvent('status', { detail: null }));
        }
    }), 1000);
}, _ComfyApi_postItem = function _ComfyApi_postItem(type, body) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield this.fetchApi('/' + type, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: body ? JSON.stringify(body) : undefined
            });
        }
        catch (error) {
            console.error(error);
        }
    });
};
export const api = new ComfyApi();
