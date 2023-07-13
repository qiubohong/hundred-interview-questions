class EventBus {
    constructor() {
        // 消息队列 存储事件和回调
        this.listeners = new Map();
    }
    /**
     * 订阅事件
     * @param {*} event 
     * @param {*} callback 
     */
    on(event, callback) {
        if (!this.listeners.get(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * 注销事件
     * @param {*} event 
     * @param {*} callback 
     * @returns 
     */
    off(event, callback) {
        if (!this.listeners.get(event)) {
            return;
        }
        const callbacks = this.listeners.get(event);
        const index = callbacks.findIndex(cb => cb === callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
        }
        this.listeners.set(event, callbacks);
    }

    /**
     * 发布触发事件
     * @param {*} event 
     * @param  {...any} args 
     * @returns 
     */
    emit(event, ...args) {
        if (!this.listeners.get(event)) {
            return;
        }
        this.listeners.get(event).forEach(listener => listener(...args));
    }

    /**
     * 只触发一次的事件
     * @param {*} event 
     * @param {*} callback 
     */
    once(event, callback) {
        if (!this.listeners.get(event)) {
            this.listeners.set(event, []);
        }
        const onceCallback = (...args) => {
            callback(...args);
            this.off(event, onceCallback);
        }
        this.listeners.get(event).push(onceCallback);
    }

    /**
     * 注销某个事件的所有回调
     * @param {*} event 
     * @returns 
     */
    offAll(event) {
        if (!this.listeners.get(event)) {
            return;
        }
        this.listeners.delete(event);
    }

    /**
     * 获取所有事件名
     * @returns 
     */
    getListeners() {
        return this.listeners.keys();
    }
}

; (function () {
    const eventBus = new EventBus();
    eventBus.on('test', (a, b) => {
        console.log(a, b);
    });
    setTimeout(() => {
        eventBus.emit('test', 1, 2);
    });
})()