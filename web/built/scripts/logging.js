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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _ComfyLogging_enabled, _ComfyLogging_console;
import { $el, ComfyDialog } from './ui.js';
import { api } from './api.js';
$el('style', {
    textContent: `
        .comfy-logging-logs {
            display: grid;
            color: var(--fg-color);
            white-space: pre-wrap;
        }
        .comfy-logging-log {
            display: contents;
        }
        .comfy-logging-title {
            background: var(--tr-even-bg-color);
            font-weight: bold;
            margin-bottom: 5px;
            text-align: center;
        }
        .comfy-logging-log div {
            background: var(--row-bg);
            padding: 5px;
        }
    `,
    parent: document.body
});
function stringify(val, depth, replacer, space, onGetObjID) {
    depth = isNaN(+depth) ? 1 : depth;
    var recursMap = new WeakMap();
    function _build(val, depth, o, a, r) {
        return !val || typeof val != 'object'
            ? val
            : ((r = recursMap.has(val)),
                recursMap.set(val, true),
                (a = Array.isArray(val)),
                r
                    ? (o = (onGetObjID && onGetObjID(val)) || null)
                    : JSON.stringify(val, function (k, v) {
                        if (a || depth > 0) {
                            if (replacer)
                                v = replacer(k, v);
                            if (!k)
                                return (a = Array.isArray(v)), (val = v);
                            !o && (o = a ? [] : {});
                            o[k] = _build(v, a ? depth : depth - 1);
                        }
                    }),
                o === void 0 ? (a ? [] : {}) : o);
    }
    return JSON.stringify(_build(val, depth), null, space);
}
const jsonReplacer = (k, v, ui) => {
    if (v instanceof Array && v.length === 1) {
        v = v[0];
    }
    if (v instanceof Date) {
        v = v.toISOString();
        if (ui) {
            v = v.split('T')[1];
        }
    }
    if (v instanceof Error) {
        let err = '';
        if (v.name)
            err += v.name + '\n';
        if (v.message)
            err += v.message + '\n';
        if (v.stack)
            err += v.stack + '\n';
        if (!err) {
            err = v.toString();
        }
        v = err;
    }
    return v;
};
const fileInput = $el('input', {
    type: 'file',
    accept: '.json',
    style: { display: 'none' },
    parent: document.body
});
class ComfyLoggingDialog extends ComfyDialog {
    constructor(logging) {
        super();
        this.logging = logging;
    }
    clear() {
        this.logging.clear();
        this.show();
    }
    export() {
        const blob = new Blob([stringify([...this.logging.entries], 20, jsonReplacer, '\t')], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = $el('a', {
            href: url,
            download: `comfyui-logs-${Date.now()}.json`,
            style: { display: 'none' },
            parent: document.body
        });
        a.click();
        setTimeout(function () {
            a.remove();
            window.URL.revokeObjectURL(url);
        }, 0);
    }
    import() {
        fileInput.onchange = () => {
            const reader = new FileReader();
            reader.onload = () => {
                fileInput.remove();
                try {
                    const obj = JSON.parse(reader.result);
                    if (obj instanceof Array) {
                        this.show(obj);
                    }
                    else {
                        throw new Error('Invalid file selected.');
                    }
                }
                catch (error) {
                    alert('Unable to load logs: ' + error.message);
                }
            };
            reader.readAsText(fileInput.files[0]);
        };
        fileInput.click();
    }
    createButtons() {
        return [
            $el('button', {
                type: 'button',
                textContent: 'Clear',
                onclick: () => this.clear()
            }),
            $el('button', {
                type: 'button',
                textContent: 'Export logs...',
                onclick: () => this.export()
            }),
            $el('button', {
                type: 'button',
                textContent: 'View exported logs...',
                onclick: () => this.import()
            }),
            ...super.createButtons()
        ];
    }
    getTypeColor(type) {
        switch (type) {
            case 'error':
                return 'red';
            case 'warn':
                return 'orange';
            case 'debug':
                return 'dodgerblue';
        }
    }
    show(entries) {
        if (!entries)
            entries = this.logging.entries;
        this.element.style.width = '100%';
        const cols = {
            source: 'Source',
            type: 'Type',
            timestamp: 'Timestamp',
            message: 'Message'
        };
        const keys = Object.keys(cols);
        const headers = Object.values(cols).map((title) => $el('div.comfy-logging-title', {
            textContent: title
        }));
        const rows = entries.map((entry, i) => {
            return $el('div.comfy-logging-log', {
                $: (el) => el.style.setProperty('--row-bg', `var(--tr-${i % 2 ? 'even' : 'odd'}-bg-color)`)
            }, keys.map((key) => {
                let v = entry[key];
                let color;
                if (key === 'type') {
                    color = this.getTypeColor(v);
                }
                else {
                    v = jsonReplacer(key, v, true);
                    if (typeof v === 'object') {
                        v = stringify(v, 5, jsonReplacer, '  ');
                    }
                }
                return $el('div', {
                    style: {
                        color
                    },
                    textContent: v
                });
            }));
        });
        const grid = $el('div.comfy-logging-logs', {
            style: {
                gridTemplateColumns: `repeat(${headers.length}, 1fr)`
            }
        }, [...headers, ...rows]);
        const els = [grid];
        if (!this.logging.enabled) {
            els.unshift($el('h3', {
                style: { textAlign: 'center' },
                textContent: 'Logging is disabled'
            }));
        }
        super.show($el('div', els));
    }
}
export class ComfyLogging {
    get enabled() {
        return __classPrivateFieldGet(this, _ComfyLogging_enabled, "f");
    }
    set enabled(value) {
        if (value === __classPrivateFieldGet(this, _ComfyLogging_enabled, "f"))
            return;
        if (value) {
            this.patchConsole();
        }
        else {
            this.unpatchConsole();
        }
        __classPrivateFieldSet(this, _ComfyLogging_enabled, value, "f");
    }
    constructor(app) {
        this.entries = [];
        _ComfyLogging_enabled.set(this, void 0);
        _ComfyLogging_console.set(this, {});
        this.app = app;
        this.dialog = new ComfyLoggingDialog(this);
        this.addSetting();
        this.catchUnhandled();
        this.addInitData();
    }
    addSetting() {
        const settingId = 'Comfy.Logging.Enabled';
        const htmlSettingId = settingId.replaceAll('.', '-');
        const setting = this.app.ui.settings.addSetting({
            id: settingId,
            name: settingId,
            defaultValue: true,
            type: (name, setter, value) => {
                return $el('tr', [
                    $el('td', [
                        $el('label', {
                            textContent: 'Logging',
                            for: htmlSettingId
                        })
                    ]),
                    $el('td', [
                        $el('input', {
                            id: htmlSettingId,
                            type: 'checkbox',
                            checked: value,
                            onchange: (event) => {
                                setter((this.enabled = event.target.checked));
                            }
                        }),
                        $el('button', {
                            textContent: 'View Logs',
                            onclick: () => {
                                this.app.ui.settings.element.close();
                                this.dialog.show();
                            },
                            style: {
                                fontSize: '14px',
                                display: 'block',
                                marginTop: '5px'
                            }
                        })
                    ])
                ]);
            }
        });
        this.enabled = setting.value;
    }
    patchConsole() {
        const self = this;
        for (const type of ['log', 'warn', 'error', 'debug']) {
            const orig = console[type];
            __classPrivateFieldGet(this, _ComfyLogging_console, "f")[type] = orig;
            console[type] = function () {
                orig.apply(console, arguments);
                self.addEntry('console', type, ...arguments);
            };
        }
    }
    unpatchConsole() {
        for (const type of Object.keys(__classPrivateFieldGet(this, _ComfyLogging_console, "f"))) {
            console[type] = __classPrivateFieldGet(this, _ComfyLogging_console, "f")[type];
        }
        __classPrivateFieldSet(this, _ComfyLogging_console, {}, "f");
    }
    catchUnhandled() {
        window.addEventListener('error', (e) => {
            var _a;
            this.addEntry('window', 'error', (_a = e.error) !== null && _a !== void 0 ? _a : 'Unknown error');
            return false;
        });
        window.addEventListener('unhandledrejection', (e) => {
            var _a;
            this.addEntry('unhandledrejection', 'error', (_a = e.reason) !== null && _a !== void 0 ? _a : 'Unknown error');
        });
    }
    clear() {
        this.entries = [];
    }
    addEntry(source, type, ...args) {
        if (this.enabled) {
            this.entries.push({
                source,
                type,
                timestamp: new Date(),
                message: args
            });
        }
    }
    log(source, ...args) {
        this.addEntry(source, 'log', ...args);
    }
    addInitData() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.enabled)
                return;
            const source = 'ComfyUI.Logging';
            this.addEntry(source, 'debug', { UserAgent: navigator.userAgent });
            const systemStats = yield api.getSystemStats();
            this.addEntry(source, 'debug', systemStats);
        });
    }
}
_ComfyLogging_enabled = new WeakMap(), _ComfyLogging_console = new WeakMap();
