import path from "path";
import fs from "fs-extra";
import EventEmitter from "events";
import pino from "pino";
import {
    default as makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    useMultiFileAuthState
} from "@whiskeysockets/baileys";

import config from "../config/config.js";
import Logger from "./Logger.js";

class Client extends EventEmitter {
    constructor({ database }) {
        super();

        this.database = database;
        this.sock = null;
        this.connected = false;
        this.reconnecting = false;
        this.connectionAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.sessionDir = path.resolve(process.cwd(), config.session.folder);
    }

    async connect() {
        await fs.ensureDir(this.sessionDir);

        const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);
        const { version } = await fetchLatestBaileysVersion();

        Logger.info(`Using Baileys version ${version.join(".")}`);
        Logger.info("Connecting to WhatsApp...");

        this.sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: true,
            browser: ["SkyCore", "Chrome", "1.0.0"],
            logger: pino({ level: "silent" }),
            generateHighQualityLinkPreview: true,
            markOnlineOnConnect: false,
            syncFullHistory: false,
            emitOwnEvents: false
        });

        this.bindSocketEvents(saveCreds);
        this.connected = true;

        return this.sock;
    }

    bindSocketEvents(saveCreds) {
        this.sock.ev.on("creds.update", saveCreds);

        this.sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "open") {
                this.connected = true;
                this.reconnecting = false;
                this.connectionAttempts = 0;

                Logger.success("WhatsApp connection opened");
                this.emit("connection.open", update);
                return;
            }

            if (connection === "close") {
                this.connected = false;

                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                Logger.warn(`WhatsApp connection closed. Status: ${statusCode || "unknown"}`);

                this.emit("connection.close", {
                    ...update,
                    shouldReconnect
                });

                if (shouldReconnect) {
                    await this.reconnect();
                } else {
                    Logger.error("Logged out from WhatsApp session. Please re-scan QR.");
                }
            }
        });

        this.sock.ev.on("messages.upsert", (payload) => {
            this.emit("messages.upsert", payload);
        });

        this.sock.ev.on("group-participants.update", (payload) => {
            this.emit("group-participants.update", payload);
        });

        this.sock.ev.on("groups.update", (payload) => {
            this.emit("groups.update", payload);
        });

        this.sock.ev.on("presence.update", (payload) => {
            this.emit("presence.update", payload);
        });

        this.sock.ev.on("call", (payload) => {
            this.emit("call", payload);
        });
    }

    async reconnect() {
        if (this.reconnecting) return;
        if (this.connectionAttempts >= this.maxReconnectAttempts) {
            Logger.error("Maximum reconnect attempts reached. Stopping reconnect loop.");
            return;
        }

        this.reconnecting = true;
        this.connectionAttempts += 1;

        Logger.warn(`Reconnecting WhatsApp... Attempt ${this.connectionAttempts}/${this.maxReconnectAttempts}`);

        try {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            await this.connect();
            Logger.success("Reconnected successfully");
        } catch (error) {
            Logger.error("Reconnect failed", error);
            this.reconnecting = false;

            if (this.connectionAttempts < this.maxReconnectAttempts) {
                await this.reconnect();
            }
        }
    }

    async sendMessage(jid, content, options = {}) {
        if (!this.sock) {
            throw new Error("WhatsApp socket is not initialized");
        }

        return this.sock.sendMessage(jid, content, options);
    }

    async relayMessage(jid, message, options = {}) {
        if (!this.sock) {
            throw new Error("WhatsApp socket is not initialized");
        }

        return this.sock.relayMessage(jid, message, options);
    }

    async groupMetadata(jid) {
        if (!this.sock) {
            throw new Error("WhatsApp socket is not initialized");
        }

        return this.sock.groupMetadata(jid);
    }

    async profilePictureUrl(jid) {
        if (!this.sock) {
            throw new Error("WhatsApp socket is not initialized");
        }

        return this.sock.profilePictureUrl(jid, "image");
    }

    async setStatus(status) {
        if (!this.sock) {
            throw new Error("WhatsApp socket is not initialized");
        }

        return this.sock.updateProfileStatus(status);
    }

    async disconnect() {
        try {
            if (this.sock?.ws) {
                this.sock.ws.close();
            }

            this.connected = false;
            Logger.warn("WhatsApp connection closed manually");
        } catch (error) {
            Logger.error("Failed to disconnect client", error);
        }
    }

    isConnected() {
        return this.connected;
    }

    getSocket() {
        return this.sock;
    }
}

export default Client;
