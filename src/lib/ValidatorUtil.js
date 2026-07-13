import UrlUtil from "./UrlUtil.js";
import JidUtil from "./JidUtil.js";

class ValidatorUtil {

    static isString(value) {
        return typeof value === "string";
    }

    static isNumber(value) {
        return typeof value === "number" && !Number.isNaN(value);
    }

    static isBoolean(value) {
        return typeof value === "boolean";
    }

    static isObject(value) {
        return value !== null &&
            typeof value === "object" &&
            !Array.isArray(value);
    }

    static isArray(value) {
        return Array.isArray(value);
    }

    static isFunction(value) {
        return typeof value === "function";
    }

    static isEmpty(value) {

        if (value === null || value === undefined)
            return true;

        if (typeof value === "string")
            return value.trim().length === 0;

        if (Array.isArray(value))
            return value.length === 0;

        if (this.isObject(value))
            return Object.keys(value).length === 0;

        return false;
    }

    static isUrl(value) {
        return UrlUtil.isValidUrl(value);
    }

    static isYoutubeUrl(value) {
        return UrlUtil.isYoutubeUrl(value);
    }

    static isTikTokUrl(value) {
        return UrlUtil.isTikTokUrl(value);
    }

    static isInstagramUrl(value) {
        return UrlUtil.isInstagramUrl(value);
    }

    static isFacebookUrl(value) {
        return UrlUtil.isFacebookUrl(value);
    }

    static isJid(value) {
        return JidUtil.isUser(value) ||
               JidUtil.isGroup(value);
    }

    static isUserJid(value) {
        return JidUtil.isUser(value);
    }

    static isGroupJid(value) {
        return JidUtil.isGroup(value);
    }

    static has
