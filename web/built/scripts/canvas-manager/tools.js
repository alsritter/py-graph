export function $el(tag, propsOrChildren, children) {
    const split = tag.split('.');
    const element = document.createElement(split.shift());
    if (split.length > 0) {
        element.classList.add(...split);
    }
    if (propsOrChildren) {
        if (Array.isArray(propsOrChildren)) {
            element.append(...propsOrChildren);
        }
        else {
            const { parent, $: cb, dataset, style } = propsOrChildren;
            delete propsOrChildren.parent;
            delete propsOrChildren.$;
            delete propsOrChildren.dataset;
            delete propsOrChildren.style;
            if (Object.hasOwn(propsOrChildren, 'for')) {
                element.setAttribute('for', propsOrChildren.for);
            }
            if (style) {
                Object.assign(element.style, style);
            }
            if (dataset) {
                Object.assign(element.dataset, dataset);
            }
            Object.assign(element, propsOrChildren);
            if (children) {
                element.append(...children);
            }
            if (parent) {
                parent.append(element);
            }
            if (cb) {
                cb(element);
            }
        }
    }
    return element;
}
//# sourceMappingURL=tools.js.map