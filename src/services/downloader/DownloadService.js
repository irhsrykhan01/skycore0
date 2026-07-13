import fs from "fs-extra";

import Logger from "../../core/Logger.js";
import BaseService from "../BaseService.js";
import YtDlpProvider from "./providers/YtDlpProvider.js";

class DownloaderService extends BaseService {

    constructor() {
        super("DownloaderService");

        this.provider = YtDlpProvider;
    }

    async init() {
        if (this.isReady()) return;

        await this.provider.init();

        await super.init();
    }

    async getInfo(url) {
        await this.init();
        return this.provider.getInfo(url);
    }

    async downloadVideo(url, options = {}) {
        await this.init();
        return this.provider.downloadVideo(url, options);
    }

    async downloadAudio(url, options = {}) {
        await this.init();
        return this.provider.downloadAudio(url, options);
    }

    async download(url, type = "video", options = {}) {
        await this.init();
        return this.provider.download(url, type, options);
    }

    async getThumbnail(url) {
        await this.init();
        return this.provider.getThumbnail(url);
    }

    async sendResult(client, jid, result, quoted = null) {

        this.ensureInitialized();

        if (!client)
            throw new Error("Client is required.");

        if (!jid)
            throw new Error("JID is required.");

        if (!result)
            throw new Error("Download result is empty.");

        const exists = await fs.pathExists(result.filePath);

        if (!exists)
            throw new Error("Downloaded file not found.");

        const message = {};

        if (result.type === "audio") {

            message.audio = {
                url: result.filePath
            };

            message.mimetype = "audio/mpeg";
            message.fileName = `${result.title}.mp3`;

        } else {

            message.video = {
                url: result.filePath
            };

            message.mimetype = "video/mp4";
            message.fileName = `${result.title}.mp4";

        }

        if (result.title) {
            message.caption = result.title;
        }

        await client.sendMessage(
            jid,
            message,
            { quoted }
        );

        return true;
    }

    async cleanup(result) {

        if (!result?.filePath)
            return false;

        try {

            await this.provider.cleanup(result.filePath);

            return true;

        } catch (error) {

            Logger.warn(
                `Cleanup failed: ${error.message}`
            );

            return false;

        }

    }

}

export default new DownloaderService();
