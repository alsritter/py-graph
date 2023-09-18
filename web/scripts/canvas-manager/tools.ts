
/**
 * 创建并渲染HTML元素，并根据提供的参数设置其属性和内容。
 *
 * @param {string} tag - 要创建的HTML元素的标签名称，可以包含类名，如 "div.my-class".
 */
export function $el(
  tag: string,
  propsOrChildren?: CustomElement[] | CustomElement,
  children?: CustomElement[]
): CustomElement {
  const split = tag.split('.')
  const element = document.createElement(split.shift())
  if (split.length > 0) {
    element.classList.add(...split)
  }

  if (propsOrChildren) {
    if (Array.isArray(propsOrChildren)) {
      element.append(...(propsOrChildren as Node[]))
    } else {
      const { parent, $: cb, dataset, style } = propsOrChildren
      delete propsOrChildren.parent
      delete propsOrChildren.$
      delete propsOrChildren.dataset
      delete propsOrChildren.style

      if (Object.hasOwn(propsOrChildren, 'for')) {
        element.setAttribute('for', propsOrChildren.for)
      }

      if (style) {
        Object.assign(element.style, style)
      }

      if (dataset) {
        Object.assign(element.dataset, dataset)
      }

      Object.assign(element, propsOrChildren)
      if (children) {
        element.append(...(children as Node[]))
      }

      if (parent) {
        parent.append(element)
      }

      if (cb) {
        cb(element as CustomElement)
      }
    }
  }

  return element as CustomElement
}
