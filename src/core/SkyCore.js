import Logger from "./Logger.js";
import Database from "./Database.js";
import CrashHandler from "./CrashHandler.js";
import Client from "./Client.js";
import PluginLoader from "./PluginLoader.js";
import EventManager from "./EventManager.js";

export default class SkyCore {
    constructor() {
        this.startedAt = Date.now();
        this.client = null;
        this.database = null;
        this.plugins = new Map();
        this.events = null;
        this.ready = false;
    }

    async start() {
        CrashHandler.register();

        Logger.info("Booting SkyCore...");

        try {
            await this.initDatabase();
            await this.initClient();
            await this.loadPlugins();
            await this.registerEvents();

            this.ready = true;

            const uptime = Date.now() - this.startedAt;
            Logger.success(`SkyCore is online. Boot completed in ${uptime} ms`);
            return this;
        } catch (error) {
            Logger.error("SkyCore failed to start:", error);
            throw error;
        }
    }

    async initDatabase() {
        this.database = await Database.init();
        Logger.info("Database initialized");
        return this.database;
    }

    async initClient() {
        this.client = new Client({
            database: this.database
        });

        await this.client.connect();
        Logger.info("WhatsApp client connected");
        return this.client;
    }

    async loadPlugins() {
        this.plugins = await PluginLoader.loadAll({
            client: this.client,
            database: this.database
        });

        Logger.info(`Loaded ${this.plugins.size} plugins`);
        return this.plugins;
    }

    async registerEvents() {
        this.events = new EventManager({
            client: this.client,
            database: this.database,
            plugins: this.plugins
        });

        await this.events.register();
        Logger.info("Event handlers registered");
        return this.events;
    }

    getUptime() {
        return Date.now() - this.startedAt;
    }

    isReady() {
        return this.ready;
    }

    async stop() {
        try {
            Logger.warn("Stopping SkyCore...");

            if (this.client && typeof this.client.disconnect === "function") {
                await this.client.disconnect();
            }

            if (this.database && typeof this.database.save === "function") {
                await this.database.save();
            }

            this.ready = false;
            Logger.success("SkyCore stopped safely");
        } catch (error) {
            Logger.error("Error while stopping SkyCore:", error);
        }
    }
          }
