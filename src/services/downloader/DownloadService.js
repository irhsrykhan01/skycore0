import fs from "fs-extra";
import path from "path";

import Logger from "../../core/Logger.js";
import config from "../../config/config.js";
import YtDlpProvider from "./providers/YtDlpProvider.js";

class DownloaderService {

    constructor() {

        this.provider = YtDlpProvider;

        this.initialized = false;

    }

    async init() {

        if (this.initialized)
            return;

        await this.provider.init();

        this.initialized = true;

        Logger.success(
            "Downloader Service Initialized"
        );

    }

    async getInfo(url) {

        await this.init();

        return this.provider.getInfo(url);

    }

    async downloadVideo(url, options = {}) {

        await this.init();

        return this.provider.downloadVideo(
            url,
            options
        );

    }

    async downloadAudio(url, options = {}) {

        await this.init();

        return this.provider.downloadAudio(
            url,
            options
        );

    }

    async download(url, type = "video", options = {}) {

        await this.init();

        return this.provider.download(
            url,
            type,
            options
        );

    }

    async getThumbnail(url) {

        await this.init();

        return this.provider.getThumbnail(
            url
        );

    }

    async sendResult(client, jid, result, quoted = null) {

        if (!result)
            throw new Error(
                "Download result is empty."
            );

        const exists =
            await fs.pathExists(
                result.filePath
            );

        if (!exists)
            throw new Error(
                "Downloaded file not found."
            );

        const message = {};

        if (result.type === "audio") {

            message.audio = {
                url: result.filePath
            };

            message.mimetype =
                "audio/mpeg";

            message.fileName =
                `${result.title}.mp3`;

        } else {

            message.video = {
                url: result.filePath
            };

            message.mimetype =
                "video/mp4";

            message.fileName =
                `${result.title}.mp4`;

        }

        message.caption =
            result.title;

        await client.sendMessage(
            jid,
            message,
            {
                quoted
            }
        );

        return true;

    }

    async cleanup(result) {

        if (!result)
            return;

        try {

            await this.provider.cleanup(
                result.filePath
            );

        } catch (err) {

            Logger.warn(
                "Failed cleaning temporary file."
            );

        }

    }

}

export default new DownloaderService();
