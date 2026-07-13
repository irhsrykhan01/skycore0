import config from "../config/config.js";
import Logger from "./Logger.js";
import CommandHandler from "./CommandHandler.js";

class EventManager {
    constructor({ client, database, plugins }) {
        this.client = client;
        this.database = database;
        this.plugins = plugins || new Map();

        this.commandHandler = new CommandHandler({
            client: this.client,
            database: this.database,
            plugins: this.plugins
        });

        this.registered = false;
        this.saveTimer = null;
        this.saveDelay = 1500;
    }

    async register() {
        if (this.registered) return this;

        if (!this.client) {
            throw new Error("Client is required for EventManager");
        }

        this.registered = true;

        this.client.on("messages.upsert", (payload) => {
            this.handleMessagesUpsert(payload).catch((error) => {
                Logger.error("Failed handling messages.upsert", error);
            });
        });

        this.client.on("groups.update", (payload) => {
            this.handleGroupsUpdate(payload).catch((error) => {
                Logger.error("Failed handling groups.update", error);
            });
        });

        this.client.on("group-participants.update", (payload) => {
            this.handleGroupParticipantsUpdate(payload).catch((error) => {
                Logger.error("Failed handling group-participants.update", error);
            });
        });

        this.client.on("connection.open", (payload) => {
            this.handleConnectionOpen(payload).catch((error) => {
                Logger.error("Failed handling connection.open", error);
            });
        });

        this.client.on("connection.close", (payload) => {
            this.handleConnectionClose(payload).catch((error) => {
                Logger.error("Failed handling connection.close", error);
            });
        });

        this.client.on("call", (payload) => {
            this.handleCall(payload).catch((error) => {
                Logger.error("Failed handling call event", error);
            });
        });

        Logger.success("EventManager registered successfully");
        return this;
    }

    normalizeJid(jid) {
        if (!jid) return jid;
        return String(jid).replace(/:\d+@/g, "@").trim();
    }

    isGroupJid(jid) {
        return typeof jid === "string" && jid.endsWith("@g.us");
    }

    unwrapMessage(message) {
        const msg = message?.message || null;
        if (!msg) return null;

        if (msg.ephemeralMessage?.message) return msg.ephemeralMessage.message;
        if (msg.viewOnceMessage?.message) return msg.viewOnceMessage.message;
        if (msg.viewOnceMessageV2?.message) return msg.viewOnceMessageV2.message;
        if (msg.viewOnceMessageV2Extension?.message) return msg.viewOnceMessageV2Extension.message;

        return msg;
    }

    extractText(message) {
        const msg = this.unwrapMessage(message);
        if (!msg) return "";

        return (
            msg.conversation ||
            msg.extendedTextMessage?.text ||
            msg.imageMessage?.caption ||
            msg.videoMessage?.caption ||
            msg.buttonsResponseMessage?.selectedButtonId ||
            msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
            msg.templateButtonReplyMessage?.selectedId ||
            msg.interactiveResponseMessage?.body?.text ||
            msg.messageContextInfo?.quotedMessage?.conversation ||
            ""
        ).trim();
    }

    getSenderJid(message) {
        const remoteJid = this.normalizeJid(message?.key?.remoteJid || "");
        const participant = this.normalizeJid(message?.key?.participant || "");

        if (this.isGroupJid(remoteJid)) {
            return participant || remoteJid;
        }

        return remoteJid;
    }

    getChatJid(message) {
        return this.normalizeJid(message?.key?.remoteJid || "");
    }

    async getGroupMetadata(chatJid) {
        if (!this.isGroupJid(chatJid)) return null;

        try {
            return await this.client.groupMetadata(chatJid);
        } catch {
            return null;
        }
    }

    isParticipantAdmin(metadata, jid) {
        const target = this.normalizeJid(jid);
        const participant = metadata?.participants?.find((item) => {
            return this.normalizeJid(item.id) === target;
        });

        return Boolean(participant?.admin);
    }

    buildReply(message) {
        const chatJid = this.getChatJid(message);

        return async (text, options = {}) => {
            if (!chatJid) return null;

            return this.client.sendMessage(
                chatJid,
                {
                    text,
                    ...options
                },
                {
                    quoted: message
                }
            );
        };
    }

    calculateLevel(xp) {
        return Math.floor(Number(xp || 0) / 100);
    }

    scheduleDatabaseSave() {
        if (!this.database?.save) return;

        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }

        this.saveTimer = setTimeout(async () => {
            try {
                await this.database.save();
            } catch (error) {
                Logger.error("Failed saving database", error);
            }
        }, this.saveDelay);
    }

    async awardXp(senderJid) {
        if (!config.level?.enabled) return;

        const user = this.database.getUser(senderJid);
        const gain = Number(config.level.xpPerMessage || 5);

        user.xp = Number(user.xp || 0) + gain;

        const newLevel = this.calculateLevel(user.xp);
        if (newLevel > Number(user.level || 0)) {
            user.level = newLevel;
        }

        user.lastSeen = Date.now();
        this.scheduleDatabaseSave();
    }

    async handleMessagesUpsert(payload) {
        const messages = payload?.messages || [];
        if (!Array.isArray(messages) || messages.length === 0) return;

        for (const message of messages) {
            if (!message?.message) continue;
            if (message.key?.fromMe) continue;

            const chatJid = this.getChatJid(message);
            if (!chatJid || chatJid === "status@broadcast") continue;

            const senderJid = this.getSenderJid(message);
            const isGroup = this.isGroupJid(chatJid);
            const text = this.extractText(message);

            const reply = this.buildReply(message);
            const userData = this.database.getUser(senderJid);
            userData.lastSeen = Date.now();

            let groupMetadata = null;
            let isGroupAdmin = false;
            let isBotAdmin = false;

            if (isGroup) {
                groupMetadata = await this.getGroupMetadata(chatJid);

                if (groupMetadata) {
                    isGroupAdmin = this.isParticipantAdmin(groupMetadata, senderJid);

                    const botJid = this.normalizeJid(this.client.getSocket()?.user?.id || "");
                    isBotAdmin = this.isParticipantAdmin(groupMetadata, botJid);
                }
            }

            const context = {
                client: this.client,
                database: this.database,
                plugins: this.plugins,
                message,
                chatJid,
                senderJid,
                isGroup,
                isGroupAdmin,
                isBotAdmin,
                groupMetadata,
                text,
                reply,
                pushName: message.pushName || "",
                timestamp: message.messageTimestamp || Date.now()
            };

            if (text) {
                await this.commandHandler.execute(message, context);
                await this.awardXp(senderJid);
            }
        }

        this.scheduleDatabaseSave();
    }

    async handleGroupsUpdate(payload) {
        const updates = Array.isArray(payload) ? payload : [payload];

        for (const update of updates) {
            const jid = this.normalizeJid(update?.id || update?.jid || "");
            if (!jid) continue;

            const group = this.database.getGroup(jid);

            if (typeof update?.subject === "string" && update.subject.trim()) {
                group.name = update.subject.trim();
            }

            if (typeof update?.desc === "string") {
                group.description = update.desc;
            }

            if (typeof update?.announce === "boolean") {
                group.announce = update.announce;
            }

            if (typeof update?.restrict === "boolean") {
                group.restrict = update.restrict;
            }

            group.updatedAt = Date.now();
        }

        this.scheduleDatabaseSave();
        Logger.group?.("Group metadata updated");
    }

    async handleGroupParticipantsUpdate(payload) {
        const chatJid = this.normalizeJid(payload?.id || "");
        const action = payload?.action || "";
        const participants = Array.isArray(payload?.participants)
            ? payload.participants
            : [];

        if (!chatJid || participants.length === 0) return;

        const group = this.database.getGroup(chatJid);
        const metadata = await this.getGroupMetadata(chatJid).catch(() => null);

        for (const participant of participants) {
            const jid = this.normalizeJid(participant);
            const user = this.database.getUser(jid);
            user.lastSeen = Date.now();

            if (action === "add" || action === "invite") {
                if (group.welcome) {
                    const name = metadata?.subject || group.name || "Group";
                    const text = `Selamat datang @${jid.split("@")[0]} di ${name}!`;

                    try {
                        await this.client.sendMessage(
                            chatJid,
                            { text, mentions: [jid] },
                            {}
                        );
                    } catch {}
                }
            }

            if (action === "remove" || action === "leave") {
                if (group.goodbye) {
                    const name = metadata?.subject || group.name || "Group";
                    const text = `Sampai jumpa @${jid.split("@")[0]} dari ${name}!`;

                    try {
                        await this.client.sendMessage(
                            chatJid,
                            { text, mentions: [jid] },
                            {}
                        );
                    } catch {}
                }
            }
        }

        group.updatedAt = Date.now();
        this.scheduleDatabaseSave();
        Logger.group?.(`Participants update: ${action}`);
    }

    async handleConnectionOpen() {
        Logger.success("WhatsApp connection opened");
        if (config.features?.autoTyping) {
            try {
                await this.client.setStatus("SkyCore is online");
            } catch {}
        }
    }

    async handleConnectionClose(payload) {
        Logger.warn("WhatsApp connection closed");

        const shouldReconnect = Boolean(payload?.shouldReconnect);
        if (shouldReconnect) {
            Logger.warn("Reconnect scheduled by Client");
        }
    }

    async handleCall(payload) {
        if (!payload) return;
        Logger.warn("Incoming call detected");

        // Aman untuk tahap awal: hanya log dulu.
        // Nanti bisa ditambah auto-reject atau blacklist lewat service terpisah.
    }
}

export default EventManager;
