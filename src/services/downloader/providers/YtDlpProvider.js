import { spawn } from "child_process";
import fs from "fs-extra";
import path from "path";
import crypto from "crypto";
import config from "../../../config/config.js";
import Logger from "../../../core/Logger.js";

class YtDlpProvider {
    constructor(options = {}) {
        this.tempDir = path.resolve(
            process.cwd(),
            options.tempDir || config.temp?.folder || "temp"
        );

        this.timeoutMs = options.timeoutMs || config.downloader?.timeout || 60000;
        this.binary = options.binary || "yt-dlp";
        this.ready = false;
    }

    async init() {
        await fs.ensureDir(this.tempDir);
        await this.checkBinary();
        this.ready = true;
        return this;
    }

    async checkBinary() {
        return new Promise((resolve, reject) => {
            const proc = spawn(this.binary, ["--version"], {
                shell: false,
                windowsHide: true
            });

            let stdout = "";
            let stderr = "";

            proc.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            proc.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            proc.on("error", (error) => {
                reject(
                    new Error(
                        `yt-dlp binary not found or not executable: ${error.message}`
                    )
                );
            });

            proc.on("close", (code) => {
                if (code !== 0) {
                    reject(
                        new Error(
                            `yt-dlp version check failed (code ${code}): ${stderr.trim()}`
                        )
                    );
                    return;
                }

                resolve(stdout.trim());
            });
        });
    }

    async run(args, options = {}) {
        const timeoutMs = options.timeoutMs || this.timeoutMs;

        return new Promise((resolve, reject) => {
            const proc = spawn(this.binary, args, {
                shell: false,
                windowsHide: true
            });

            let stdout = "";
            let stderr = "";
            let timer = null;
            let finished = false;

            const done = (err, result) => {
                if (finished) return;
                finished = true;

                if (timer) clearTimeout(timer);

                if (err) reject(err);
                else resolve(result);
            };

            proc.stdout.on("data", (data) => {
                stdout += data.toString();
            });

            proc.stderr.on("data", (data) => {
                stderr += data.toString();
            });

            proc.on("error", (error) => {
                done(
                    new Error(`Failed to execute yt-dlp: ${error.message}`)
                );
            });

            proc.on("close", (code) => {
                if (code !== 0) {
                    done(
                        new Error(
                            `yt-dlp exited with code ${code}: ${stderr.trim()}`
                        )
                    );
                    return;
                }

                done(null, {
                    stdout: stdout.trim(),
                    stderr: stderr.trim()
                });
            });

            timer = setTimeout(() => {
                try {
                    proc.kill("SIGKILL");
                } catch {}

                done(
                    new Error(
                        `yt-dlp timeout after ${timeoutMs}ms`
                    )
                );
            }, timeoutMs);
        });
    }

    async getInfo(url) {
        if (!url) {
            throw new Error("URL is required");
        }

        const { stdout } = await this.run([
            "--no-playlist",
            "--dump-single-json",
            "--skip-download",
            url
        ]);

        try {
            return JSON.parse(stdout);
        } catch (error) {
            throw new Error(`Failed to parse yt-dlp info JSON: ${error.message}`);
        }
    }

    makeTempFileName(info = {}, ext = "mp4") {
        const title = String(info?.title || "media")
            .replace(/[^\w\s.-]/g, "")
            .trim()
            .replace(/\s+/g, "_")
            .slice(0, 60) || "media";

        const random = crypto.randomBytes(4).toString("hex");
        return path.join(this.tempDir, `${title}_${random}.${ext}`);
    }

    async downloadVideo(url, options = {}) {
        if (!url) {
            throw new Error("URL is required");
        }

        const info = options.info || await this.getInfo(url);
        const outputPath = options.outputPath || this.makeTempFileName(info, "mp4");

        const format = options.format || "bv*+ba/b";
        const args = [
            "--no-playlist",
            "-f",
            format,
            "--merge-output-format",
            "mp4",
            "-o",
            outputPath,
            url
        ];

        Logger.downloader(`Downloading video: ${info?.title || url}`);

        await this.run(args, {
            timeoutMs: options.timeoutMs || this.timeoutMs
        });

        const exists = await fs.pathExists(outputPath);
        if (!exists) {
            throw new Error("yt-dlp finished but output file was not created");
        }

        return {
            type: "video",
            url,
            info,
            filePath: outputPath,
            ext: "mp4",
            title: info?.title || "video"
        };
    }

    async downloadAudio(url, options = {}) {
        if (!url) {
            throw new Error("URL is required");
        }

        const info = options.info || await this.getInfo(url);
        const outputPath = options.outputPath || this.makeTempFileName(info, "mp3");

        const audioFormat = options.audioFormat || "mp3";
        const quality = options.quality || "0";

        const args = [
            "--no-playlist",
            "-x",
            "--audio-format",
            audioFormat,
            "--audio-quality",
            quality,
            "-o",
            outputPath,
            url
        ];

        Logger.downloader(`Downloading audio: ${info?.title || url}`);

        await this.run(args, {
            timeoutMs: options.timeoutMs || this.timeoutMs
        });

        const exists = await fs.pathExists(outputPath);
        if (!exists) {
            throw new Error("yt-dlp finished but audio file was not created");
        }

        return {
            type: "audio",
            url,
            info,
            filePath: outputPath,
            ext: audioFormat,
            title: info?.title || "audio"
        };
    }

    async download(url, mode = "video", options = {}) {
        const normalizedMode = String(mode || "video").toLowerCase();

        if (normalizedMode === "audio" || normalizedMode === "mp3") {
            return this.downloadAudio(url, options);
        }

        return this.downloadVideo(url, options);
    }

    async getThumbnail(url, options = {}) {
        const info = options.info || await this.getInfo(url);
        const thumb = info?.thumbnail || info?.thumbnails?.at?.(-1)?.url || null;

        return {
            url,
            thumbnail: thumb,
            info
        };
    }

    async cleanup(filePath) {
        if (!filePath) return false;

        try {
            if (await fs.pathExists(filePath)) {
                await fs.remove(filePath);
                return true;
            }
            return false;
        } catch (error) {
            Logger.warn(`Failed to cleanup file: ${filePath}`);
            Logger.debug(error?.message || error);
            return false;
        }
    }
}

export default new YtDlpProvider();
