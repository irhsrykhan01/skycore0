import fs from "fs-extra";
import path from "path";
import crypto from "crypto";

class FileUtil {

    static async ensureDir(dir) {
        await fs.ensureDir(dir);
        return dir;
    }

    static async exists(file) {
        return fs.pathExists(file);
    }

    static async remove(file) {
        if (await fs.pathExists(file)) {
            await fs.remove(file);
            return true;
        }

        return false;
    }

    static async readJSON(file, fallback = {}) {
        try {
            return await fs.readJson(file);
        } catch {
            return fallback;
        }
    }

    static async writeJSON(file, data) {
        await fs.outputJson(file, data, {
            spaces: 2
        });

        return true;
    }

    static async readText(file) {
        return fs.readFile(file, "utf8");
    }

    static async writeText(file, text) {
        await fs.outputFile(file, text, "utf8");
        return true;
    }

    static async copy(source, destination) {
        await fs.copy(source, destination);
        return destination;
    }

    static async move(source, destination) {
        await fs.move(source, destination, {
            overwrite: true
        });

        return destination;
    }

    static getExtension(file) {
        return path.extname(file).replace(".", "");
    }

    static getFileName(file) {
        return path.basename(file);
    }

    static getNameWithoutExt(file) {
        return path.parse(file).name;
    }

    static join(...paths) {
        return path.join(...paths);
    }

    static resolve(...paths) {
        return path.resolve(...paths);
    }

    static randomName(length = 12) {
        return crypto
            .randomBytes(length)
            .toString("hex");
    }

    static tempFile(ext = "") {
        const name = this.randomName(8);

        if (!ext)
            return name;

        ext = ext.replace(".", "");

        return `${name}.${ext}`;
    }

    static async size(file) {
        const stat = await fs.stat(file);
        return stat.size;
    }

    static async list(directory) {
        return fs.readdir(directory);
    }

    static async clearDirectory(directory) {

        if (!(await fs.pathExists(directory)))
            return;

        const files = await fs.readdir(directory);

        for (const file of files) {

            await fs.remove(
                path.join(directory, file)
            );

        }

    }

}

export default FileUtil;
