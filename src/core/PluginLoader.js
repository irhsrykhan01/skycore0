import fs from "fs-extra";
import path from "path";
import { pathToFileURL } from "url";

import config from "../config/config.js";
import Logger from "./Logger.js";

class PluginLoader {
    async loadAll(context = {}) {
        const plugins = new Map();

        const root = path.resolve(
            process.cwd(),
            config.plugins.folder
        );

        await this.scanDirectory(root, plugins);

        Logger.success(
            `${plugins.size} plugin(s) loaded successfully`
        );

        return plugins;
    }

    async scanDirectory(directory, plugins) {
        const entries = await fs.readdir(directory, {
            withFileTypes: true
        });

        for (const entry of entries) {

            const fullPath = path.join(
                directory,
                entry.name
            );

            if (entry.isDirectory()) {
                await this.scanDirectory(
                    fullPath,
                    plugins
                );
                continue;
            }

            if (!entry.name.endsWith(".js"))
                continue;

            await this.loadPlugin(
                fullPath,
                plugins
            );
        }
    }

    async loadPlugin(file, plugins) {

        try {

            const module = await import(
                pathToFileURL(file).href +
                `?update=${Date.now()}`
            );

            const plugin = module.default;

            if (!plugin)
                throw new Error(
                    "Plugin has no default export."
                );

            if (!plugin.name)
                throw new Error(
                    "Plugin name is missing."
                );

            plugin.aliases ??= [];
            plugin.category ??= "misc";
            plugin.description ??= "-";

            plugin.permissions ??= {};

            plugin.permissions.owner ??= false;
            plugin.permissions.admin ??= false;
            plugin.permissions.group ??= false;
            plugin.permissions.private ??= true;
            plugin.permissions.premium ??= false;

            plugin.cooldown ??= 3;

            if (typeof plugin.execute !== "function") {
                throw new Error(
                    "execute() is required."
                );
            }

            plugins.set(
                plugin.name.toLowerCase(),
                plugin
            );

            for (const alias of plugin.aliases) {
                plugins.set(
                    alias.toLowerCase(),
                    plugin
                );
            }

            Logger.plugin(
                `Loaded ${plugin.name}`
            );

        } catch (err) {

            Logger.error(
                `Failed loading plugin: ${file}`,
                err
            );

        }

    }

}

export default new PluginLoader();
