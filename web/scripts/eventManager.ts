export class EventManager {
  private listeners: { [eventName: string]: Function[] } = {}

  addEventListener(eventName: string, callback: Function) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = []
    }
    this.listeners[eventName].push(callback)
  }

  removeEventListener(eventName: string, callback: Function) {
    const eventListeners = this.listeners[eventName]
    if (eventListeners) {
      const index = eventListeners.indexOf(callback)
      if (index !== -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  invokeExtensionsAsync(eventName: string, ...args: any[]) {
    const eventListeners = this.listeners[eventName]
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        listener(eventName, ...args)
      })
    }
  }

  async invokeExtensions(eventName: string, ...args: any[]) {
    const eventListeners = this.listeners[eventName]
    if (eventListeners) {
      const promises = eventListeners.map((listener) =>
        Promise.resolve(listener(eventName, ...args))
      )
      return await Promise.all(promises)
    }
    return []
  }
}
