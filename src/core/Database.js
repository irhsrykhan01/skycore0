import path from "path";
import fs from "fs-extra";
import { JSONFilePreset } from "lowdb/node";
import config from "../config/config.js";
import Logger from "./Logger.js";

const DEFAULT_USERS = {
    users: {}
};

const DEFAULT_GROUPS = {
    groups: {}
};

const DEFAULT_SETTINGS = {
    bot: {
        prefix: config.bot.prefix,
        language: "id",
        autoRead: config.features.autoRead,
        autoTyping: config.features.autoTyping,
        autoReconnect: config.features.autoReconnect,
        autoRestart: config.features.autoRestart
    }
};

class Database {
    constructor() {
        this.ready = false;
        this.baseDir = path.resolve(process.cwd(), config.database.folder);
        this.usersPath = path.join(this.baseDir, config.database.users);
        this.groupsPath = path.join(this.baseDir, config.database.groups);
        this.settingsPath = path.join(this.baseDir, config.database.settings);

        this.usersDb = null;
        this.groupsDb = null;
        this.settingsDb = null;
    }

    async init() {
        if (this.ready) return this;

        await fs.ensureDir(this.baseDir);

        this.usersDb = await JSONFilePreset(this.usersPath, DEFAULT_USERS);
        this.groupsDb = await JSONFilePreset(this.groupsPath, DEFAULT_GROUPS);
        this.settingsDb = await JSONFilePreset(this.settingsPath, DEFAULT_SETTINGS);

        await this.ensureStructure();

        this.ready = true;
        Logger.success("Database loaded successfully");
        return this;
    }

    async ensureStructure() {
        if (!this.usersDb.data || typeof this.usersDb.data !== "object") {
            this.usersDb.data = DEFAULT_USERS;
        }

        if (!this.groupsDb.data || typeof this.groupsDb.data !== "object") {
            this.groupsDb.data = DEFAULT_GROUPS;
        }

        if (!this.settingsDb.data || typeof this.settingsDb.data !== "object") {
            this.settingsDb.data = DEFAULT_SETTINGS;
        }

        this.usersDb.data.users ??= {};
        this.groupsDb.data.groups ??= {};
        this.settingsDb.data.bot ??= {};

        this.settingsDb.data.bot.prefix ??= config.bot.prefix;
        this.settingsDb.data.bot.language ??= "id";
        this.settingsDb.data.bot.autoRead ??= config.features.autoRead;
        this.settingsDb.data.bot.autoTyping ??= config.features.autoTyping;
        this.settingsDb.data.bot.autoReconnect ??= config.features.autoReconnect;
        this.settingsDb.data.bot.autoRestart ??= config.features.autoRestart;

        await this.save();
    }

    async save() {
        if (this.usersDb) await this.usersDb.write();
        if (this.groupsDb) await this.groupsDb.write();
        if (this.settingsDb) await this.settingsDb.write();
    }

    async reload() {
        if (!this.ready) return this.init();

        await this.usersDb.read();
        await this.groupsDb.read();
        await this.settingsDb.read();

        await this.ensureStructure();
        return this;
    }

    normalizeJid(jid) {
        if (!jid) return jid;
        return jid.replace(/:\d+@/g, "@").trim();
    }

    getUser(jid) {
        jid = this.normalizeJid(jid);

        this.usersDb.data.users[jid] ??= {
            jid,
            name: "",
            xp: 0,
            level: 0,
            warnings: 0,
            premium: false,
            banned: false,
            lastSeen: Date.now(),
            createdAt: Date.now()
        };

        return this.usersDb.data.users[jid];
    }

    setUser(jid, data = {}) {
        jid = this.normalizeJid(jid);
        const current = this.getUser(jid);

        this.usersDb.data.users[jid] = {
            ...current,
            ...data,
            jid
        };

        return this.usersDb.data.users[jid];
    }

    updateUser(jid, updater = {}) {
        return this.setUser(jid, updater);
    }

    deleteUser(jid) {
        jid = this.normalizeJid(jid);
        delete this.usersDb.data.users[jid];
    }

    getGroup(jid) {
        jid = this.normalizeJid(jid);

        this.groupsDb.data.groups[jid] ??= {
            jid,
            name: "",
            mute: false,
            antiLink: config.features.antiLink,
            welcome: true,
            goodbye: true,
            nsfw: false,
            premiumOnly: false,
            admins: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        return this.groupsDb.data.groups[jid];
    }

    setGroup(jid, data = {}) {
        jid = this.normalizeJid(jid);
        const current = this.getGroup(jid);

        this.groupsDb.data.groups[jid] = {
            ...current,
            ...data,
            jid,
            updatedAt: Date.now()
        };

        return this.groupsDb.data.groups[jid];
    }

    updateGroup(jid, updater = {}) {
        return this.setGroup(jid, updater);
    }

    deleteGroup(jid) {
        jid = this.normalizeJid(jid);
        delete this.groupsDb.data.groups[jid];
    }

    getSettings() {
        this.settingsDb.data.bot ??= {};
        return this.settingsDb.data.bot;
    }

    setSettings(data = {}) {
        this.settingsDb.data.bot = {
            ...this.getSettings(),
            ...data
        };
        return this.settingsDb.data.bot;
    }

    getPrefix() {
        return this.getSettings().prefix || config.bot.prefix;
    }

    setPrefix(prefix) {
        return this.setSettings({ prefix });
    }

    getStats() {
        const users = Object.keys(this.usersDb.data.users || {}).length;
        const groups = Object.keys(this.groupsDb.data.groups || {}).length;

        return {
            users,
            groups,
            ready: this.ready
        };
    }
}

export default new Database();
