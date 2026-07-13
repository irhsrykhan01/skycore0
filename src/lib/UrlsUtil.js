class UrlUtil {
    static isValidUrl(input) {
        if (!input || typeof input !== "string") return false;

        try {
            const url = new URL(input.trim());
            return Boolean(url.protocol && url.hostname);
        } catch {
            return false;
        }
    }

    static ensureProtocol(input) {
        if (!input || typeof input !== "string") return "";

        const value = input.trim();
        if (!value) return "";

        if (/^https?:\/\//i.test(value)) return value;
        return `https://${value}`;
    }

    static normalize(input) {
        const withProtocol = this.ensureProtocol(input);
        if (!withProtocol) return "";

        try {
            const url = new URL(withProtocol);
            url.hash = "";
            return url.toString();
        } catch {
            return "";
        }
    }

    static getHostname(input) {
        const normalized = this.normalize(input);
        if (!normalized) return "";

        try {
            return new URL(normalized).hostname.replace(/^www\./i, "");
        } catch {
            return "";
        }
    }

    static isHttpUrl(input) {
        const normalized = this.normalize(input);
        if (!normalized) return false;

        try {
            const url = new URL(normalized);
            return url.protocol === "http:" || url.protocol === "https:";
        } catch {
            return false;
        }
    }

    static isYoutubeUrl(input) {
        const host = this.getHostname(input);
        return [
            "youtube.com",
            "youtu.be",
            "m.youtube.com",
            "music.youtube.com"
        ].includes(host);
    }

    static isTikTokUrl(input) {
        const host = this.getHostname(input);
        return [
            "tiktok.com",
            "vt.tiktok.com",
            "vm.tiktok.com"
        ].includes(host);
    }

    static isInstagramUrl(input) {
        const host = this.getHostname(input);
        return [
            "instagram.com",
            "www.instagram.com",
            "m.instagram.com"
        ].includes(host);
    }

    static isFacebookUrl(input) {
        const host = this.getHostname(input);
        return [
            "facebook.com",
            "www.facebook.com",
            "m.facebook.com",
            "fb.watch"
        ].includes(host);
    }

    static isMediaUrl(input) {
        return (
            this.isYoutubeUrl(input) ||
            this.isTikTokUrl(input) ||
            this.isInstagramUrl(input) ||
            this.isFacebookUrl(input)
        );
    }

    static extractUrl(text = "") {
        if (typeof text !== "string") return null;

        const match = text.match(
            /(https?:\/\/[^\s]+)/i
        );

        if (!match) return null;

        return this.normalize(match[1]);
    }
}

export default UrlUtil;
