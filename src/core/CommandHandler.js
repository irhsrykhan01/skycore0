import config from "../config/config.js";
import Logger from "./Logger.js";

class CommandHandler {
    constructor({ client, database, plugins }) {
        this.client = client;
        this.database = database;
        this.plugins = plugins;
        this.cooldowns = new Map();
    }

    setPlugins(plugins) {
        this.plugins = plugins;
        return this;
    }

    getPrefix() {
        return this.database?.getPrefix?.() || config.bot.prefix;
    }

    parseMessage(message = {}) {
        const rawText =
            message.text ||
            message.body ||
            message.caption ||
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            message.message?.videoMessage?.caption ||
            "";

        const prefix = this.getPrefix();

        if (!rawText.startsWith(prefix)) {
            return null;
        }

        const sliced = rawText.slice(prefix.length).trim();
        if (!sliced) return null;

        const parts = sliced.split(/\s+/g);
        const commandName = (parts.shift() || "").toLowerCase();
        const args = parts;

        return {
            prefix,
            rawText,
            commandName,
            args
        };
    }

    getPlugin(commandName) {
        if (!commandName || !this.plugins) return null;
        return this.plugins.get(commandName.toLowerCase()) || null;
    }

    isCooldownActive(jid, commandName, cooldownSeconds) {
        const key = `${jid}:${commandName}`;
        const now = Date.now();
        const expiry = this.cooldowns.get(key);

        if (!expiry) return false;
        if (now >= expiry) {
            this.cooldowns.delete(key);
            return false;
        }

        return true;
    }

    setCooldown(jid, commandName, cooldownSeconds) {
        const key = `${jid}:${commandName}`;
        const expiry = Date.now() + cooldownSeconds * 1000;
        this.cooldowns.set(key, expiry);
        return expiry;
    }

    async hasPermission(plugin, context) {
        const perms = plugin.permissions || {};
        const userJid = context.senderJid;
        const chatId = context.chatJid;
        const isGroup = context.isGroup;

        const userData = this.database?.getUser?.(userJid) || {};
        const groupData = isGroup ? (this.database?.getGroup?.(chatId) || {}) : {};

        const ownerNumbers = Array.isArray(config.owner.number) ? config.owner.number : [config.owner.number];
        const isOwner = ownerNumbers.some((num) => String(userJid || "").includes(String(num)));

        const isPremium = Boolean(userData.premium);
        const isGroupAdmin = Boolean(context.isGroupAdmin);
        const isBotAdmin = Boolean(context.isBotAdmin);

        if (perms.owner && !isOwner) return false;
        if (perms.premium && !isPremium) return false;
        if (perms.group && !isGroup) return false;
        if (perms.private && isGroup) return false;
        if (perms.admin && !isGroupAdmin) return false;

        if (plugin.requireBotAdmin && !isBotAdmin) return false;

        if (groupData.mute && !isOwner && !isGroupAdmin && !plugin.bypassMute) {
            return false;
        }

        return true;
    }

    async execute(message, meta = {}) {
        try {
            const parsed = this.parseMessage(message);
            if (!parsed) return false;

            const plugin = this.getPlugin(parsed.commandName);
            if (!plugin) return false;

            const context = {
                client: this.client,
                database: this.database,
                plugins: this.plugins,
                message,
                parsed,
                ...meta,
                commandName: parsed.commandName,
                args: parsed.args,
                prefix: parsed.prefix
            };

            const allowed = await this.hasPermission(plugin, context);
            if (!allowed) {
                Logger.warn(`Permission denied: ${parsed.commandName}`);
                return false;
            }

            const cooldownSeconds = Number(plugin.cooldown || 0);
            if (cooldownSeconds > 0) {
                const active = this.isCooldownActive(
                    context.senderJid,
                    parsed.commandName,
                    cooldownSeconds
                );

                if (active) {
                    Logger.debug(`Cooldown active: ${parsed.commandName}`);
                    return false;
                }
            }

            this.setCooldown(
                context.senderJid,
                parsed.commandName,
                cooldownSeconds || 0
            );

            Logger.command(
                `${parsed.commandName} executed by ${context.senderJid || "unknown"}`
            );

            await plugin.execute(context);

            return true;
        } catch (error) {
            Logger.error("Command execution failed", error);

            if (meta?.reply && typeof meta.reply === "function") {
                try {
                    await meta.reply("Terjadi kesalahan saat menjalankan perintah.");
                } catch {}
            }

            return false;
        }
    }

    clearCooldowns() {
        this.cooldowns.clear();
    }
}

export default CommandHandler;
