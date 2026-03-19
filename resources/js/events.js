class EventBus {
    constructor() {
        this.events = {};
    }

    subscribe(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    publish(eventName, data) {
        if (!this.events[eventName]) {
            return;
        }
        this.events[eventName].forEach(callback => callback(data));
    }
}

// Export a single instance to be used across the application
export const eventBus = new EventBus();