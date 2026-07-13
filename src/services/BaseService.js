import Logger from "../core/Logger.js";

class BaseService {
    constructor(name = "Service") {
        this.name = name;
        this.initialized = false;
        this.startedAt = null;
    }

    async init() {
        if (this.initialized) {
            return;
        }

        this.startedAt = Date.now();
        this.initialized = true;

        Logger.info(`[${this.name}] initialized.`);
    }

    async destroy() {
        if (!this.initialized) {
            return;
        }

        this.initialized = false;

        Logger.info(`[${this.name}] destroyed.`);
    }

    ensureInitialized() {
        if (!this.initialized) {
            throw new Error(`${this.name} has not been initialized.`);
        }
    }

    isReady() {
        return this.initialized;
    }

    uptime() {
        if (!this.startedAt) {
            return 0;
        }

        return Date.now() - this.startedAt;
    }

    async safeExecute(task, fallback = null) {
        try {
            return await task();
        } catch (error) {
            Logger.error(`[${this.name}] ${error.stack || error.message}`);
            return fallback;
        }
    }
}

export default BaseService;
