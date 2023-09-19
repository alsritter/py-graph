import { app } from '../../scripts/app.js';
import { ComfyDialog } from '../../scripts/canvas-manager/ui.js';
import { $el } from '../../scripts/canvas-manager/tools.js';
const id = 'Comfy.NodeTemplates';
class ManageTemplates extends ComfyDialog {
    constructor() {
        super();
        this.element.classList.add('comfy-manage-templates');
        this.templates = this.load();
    }
    createButtons() {
        const btns = super.createButtons();
        btns[0].textContent = 'Cancel';
        btns.unshift($el('button', {
            type: 'button',
            textContent: 'Save',
            onclick: () => this.save()
        }));
        return btns;
    }
    load() {
        const templates = localStorage.getItem(id);
        if (templates) {
            return JSON.parse(templates);
        }
        else {
            return [];
        }
    }
    save() {
        const inputs = this.element.querySelectorAll('input');
        const updated = [];
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            if (input.parentElement.style.display !== 'none') {
                const t = this.templates[i];
                t.name = input.value.trim() || input.getAttribute('data-name');
                updated.push(t);
            }
        }
        this.templates = updated;
        this.store();
        this.close();
    }
    store() {
        localStorage.setItem(id, JSON.stringify(this.templates));
    }
    show() {
        super.show($el('div', {
            style: {
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '5px'
            }
        }, this.templates.flatMap((t) => {
            let nameInput;
            return [
                $el('label', {
                    textContent: 'Name: '
                }, [
                    $el('input', {
                        value: t.name,
                        dataset: { name: t.name },
                        $: (el) => (nameInput = el)
                    })
                ]),
                $el('button', {
                    textContent: 'Delete',
                    style: {
                        fontSize: '12px',
                        color: 'red',
                        fontWeight: 'normal'
                    },
                    onclick: (e) => {
                        nameInput.value = '';
                        e.target.style.display = 'none';
                        e.target.previousElementSibling.style.display = 'none';
                    }
                })
            ];
        })));
    }
}
app.registerExtension({
    name: id,
    setup() {
        const manage = new ManageTemplates();
        const clipboardAction = (cb) => {
            const old = localStorage.getItem('litegrapheditor_clipboard');
            cb();
            localStorage.setItem('litegrapheditor_clipboard', old);
        };
        const orig = LGraphCanvas.prototype.getCanvasMenuOptions;
        LGraphCanvas.prototype.getCanvasMenuOptions = function () {
            const options = orig.apply(this, arguments);
            options.push(null);
            options.push({
                content: `Save Selected as Template`,
                disabled: !Object.keys(app.canvasManager.canvas.selected_nodes || {}).length,
                callback: () => {
                    const name = prompt('Enter name');
                    if (!name || !name.trim())
                        return;
                    clipboardAction(() => {
                        app.canvasManager.canvas.copyToClipboard();
                        manage.templates.push({
                            name,
                            data: localStorage.getItem('litegrapheditor_clipboard')
                        });
                        manage.store();
                    });
                }
            });
            const subItems = manage.templates.map((t) => ({
                content: t.name,
                callback: () => {
                    clipboardAction(() => {
                        localStorage.setItem('litegrapheditor_clipboard', t.data);
                        app.canvasManager.canvas.pasteFromClipboard();
                    });
                }
            }));
            if (subItems.length) {
                subItems.push(null, {
                    content: 'Manage',
                    callback: () => manage.show()
                });
                options.push({
                    content: 'Node Templates',
                    submenu: {
                        options: subItems
                    }
                });
            }
            return options;
        };
    }
});
//# sourceMappingURL=nodeTemplates.js.map