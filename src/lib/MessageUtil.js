import JidUtil from "./JidUtil.js";

class MessageUtil {
    static unwrap(message) {
        const msg = message?.message || null;
        if (!msg) return null;

        if (msg.ephemeralMessage?.message) return msg.ephemeralMessage.message;
        if (msg.viewOnceMessage?.message) return msg.viewOnceMessage.message;
        if (msg.viewOnceMessageV2?.message) return msg.viewOnceMessageV2.message;
        if (msg.viewOnceMessageV2Extension?.message) return msg.viewOnceMessageV2Extension.message;

        return msg;
    }

    static getType(message) {
        const msg = this.unwrap(message);
        if (!msg) return "unknown";

        if (msg.conversation) return "conversation";
        if (msg.extendedTextMessage) return "extendedTextMessage";
        if (msg.imageMessage) return "imageMessage";
        if (msg.videoMessage) return "videoMessage";
        if (msg.audioMessage) return "audioMessage";
        if (msg.documentMessage) return "documentMessage";
        if (msg.stickerMessage) return "stickerMessage";
        if (msg.buttonsResponseMessage) return "buttonsResponseMessage";
        if (msg.listResponseMessage) return "listResponseMessage";
        if (msg.templateButtonReplyMessage) return "templateButtonReplyMessage";
        if (msg.interactiveResponseMessage) return "interactiveResponseMessage";
        if (msg.messageContextInfo?.quotedMessage) return "quotedMessage";

        return Object.keys(msg)[0] || "unknown";
    }

    static getText(message) {
        const msg = this.unwrap(message);
        if (!msg) return "";

        const text =
            msg.conversation ||
            msg.extendedTextMessage?.text ||
            msg.imageMessage?.caption ||
            msg.videoMessage?.caption ||
            msg.buttonsResponseMessage?.selectedButtonId ||
            msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
            msg.templateButtonReplyMessage?.selectedId ||
            msg.interactiveResponseMessage?.body?.text ||
            msg.selectedButtonId ||
            msg.selectedRowId ||
            "";

        return String(text).trim();
    }

    static getCaption(message) {
        const msg = this.unwrap(message);
        if (!msg) return "";

        return String(
            msg.imageMessage?.caption ||
            msg.videoMessage?.caption ||
            msg.documentMessage?.caption ||
            ""
        ).trim();
    }

    static getQuoted(message) {
        const msg = this.unwrap(message);
        const quoted = msg?.extendedTextMessage?.contextInfo?.quotedMessage
            || msg?.imageMessage?.contextInfo?.quotedMessage
            || msg?.videoMessage?.contextInfo?.quotedMessage
            || msg?.documentMessage?.contextInfo?.quotedMessage
            || msg?.audioMessage?.contextInfo?.quotedMessage
            || null;

        if (!quoted) return null;

        return quoted;
    }

    static getQuotedText(message) {
        const quoted = this.getQuoted(message);
        if (!quoted) return "";

        return String(
            quoted.conversation ||
            quoted.extendedTextMessage?.text ||
            quoted.imageMessage?.caption ||
            quoted.videoMessage?.caption ||
            quoted.documentMessage?.caption ||
            ""
        ).trim();
    }

    static getMentions(message) {
        const msg = this.unwrap(message);
        const mentions =
            msg?.extendedTextMessage?.contextInfo?.mentionedJid ||
            msg?.imageMessage?.contextInfo?.mentionedJid ||
            msg?.videoMessage?.contextInfo?.mentionedJid ||
            msg?.documentMessage?.contextInfo?.mentionedJid ||
            msg?.audioMessage?.contextInfo?.mentionedJid ||
            msg?.buttonsResponseMessage?.contextInfo?.mentionedJid ||
            msg?.listResponseMessage?.contextInfo?.mentionedJid ||
            [];

        if (!Array.isArray(mentions)) return [];
        return mentions.map((jid) => JidUtil.normalize(jid));
    }

    static hasMentions(message) {
        return this.getMentions(message).length > 0;
    }

    static getChatJid(message) {
        return JidUtil.normalize(message?.key?.remoteJid || "");
    }

    static getSenderJid(message) {
        const chatJid = this.getChatJid(message);
        const participant = JidUtil.normalize(message?.key?.participant || "");

        if (JidUtil.isGroup(chatJid)) {
            return participant || chatJid;
        }

        return chatJid;
    }

    static isImage(message) {
        return this.getType(message) === "imageMessage";
    }

    static isVideo(message) {
        return this.getType(message) === "videoMessage";
    }

    static isAudio(message) {
        return this.getType(message) === "audioMessage";
    }

    static isSticker(message) {
        return this.getType(message) === "stickerMessage";
    }

    static isDocument(message) {
        return this.getType(message) === "documentMessage";
    }

    static isText(message) {
        const type = this.getType(message);
        return type === "conversation" || type === "extendedTextMessage";
    }

    static isViewOnce(message) {
        const msg = message?.message || {};
        return Boolean(
            msg.viewOnceMessage ||
            msg.viewOnceMessageV2 ||
            msg.viewOnceMessageV2Extension
        );
    }

    static hasQuoted(message) {
        return Boolean(this.getQuoted(message));
    }

    static getMediaMessage(message) {
        const msg = this.unwrap(message);
        if (!msg) return null;

        return (
            msg.imageMessage ||
            msg.videoMessage ||
            msg.audioMessage ||
            msg.documentMessage ||
            msg.stickerMessage ||
            null
        );
    }

    static getFileName(message) {
        const media = this.getMediaMessage(message);
        if (!media) return "";

        return String(media.fileName || media.caption || media.title || "").trim();
    }

    static getMimeType(message) {
        const media = this.getMediaMessage(message);
        if (!media) return "";

        return String(media.mimetype || "").trim();
    }

    static getPushName(message) {
        return String(message?.pushName || "").trim();
    }

    static isCommand(message, prefix = ".") {
        const text = this.getText(message);
        return Boolean(text) && text.startsWith(prefix);
    }
}

export default MessageUtil;
