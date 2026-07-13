class StringUtil {
    static trim(value = "") {
        return String(value).trim();
    }

    static isEmpty(value = "") {
        return this.trim(value).length === 0;
    }

    static toTitleCase(value = "") {
        return this.trim(value)
            .split(/\s+/g)
            .filter(Boolean)
            .map((word) => {
                if (!word) return "";
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(" ");
    }

    static capitalize(value = "") {
        const text = this.trim(value);
        if (!text) return "";
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    static lowercase(value = "") {
        return String(value).toLowerCase();
    }

    static uppercase(value = "") {
        return String(value).toUpperCase();
    }

    static truncate(value = "", length = 50, suffix = "...") {
        const text = String(value);
        if (text.length <= length) return text;
        return text.slice(0, Math.max(0, length - suffix.length)) + suffix;
    }

    static slugify(value = "") {
        return String(value)
            .toLowerCase()
            .trim()
            .replace(/[\s_]+/g, "-")
            .replace(/[^\w-]+/g, "")
            .replace(/--+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    static removeExtraSpaces(value = "") {
        return String(value).replace(/\s+/g, " ").trim();
    }

    static escapeRegExp(value = "") {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    static mask(value = "", visibleStart = 3, visibleEnd = 2, maskChar = "*") {
        const text = String(value);
        if (!text) return "";

        if (text.length <= visibleStart + visibleEnd) {
            return maskChar.repeat(text.length);
        }

        const start = text.slice(0, visibleStart);
        const end = text.slice(-visibleEnd);
        const middle = maskChar.repeat(Math.max(0, text.length - visibleStart - visibleEnd));

        return `${start}${middle}${end}`;
    }

    static repeat(value = "", times = 1, separator = "") {
        const count = Math.max(0, Number(times) || 0);
        if (count === 0) return "";
        return Array.from({ length: count }, () => String(value)).join(separator);
    }

    static randomChoice(list = []) {
        if (!Array.isArray(list) || list.length === 0) return null;
        return list[Math.floor(Math.random() * list.length)] ?? null;
    }

    static splitLines(value = "") {
        return String(value)
            .split(/\r?\n/g)
            .map((line) => line.trim());
    }

    static removeWhitespace(value = "") {
        return String(value).replace(/\s+/g, "");
    }

    static normalizeNewlines(value = "") {
        return String(value).replace(/\r\n/g, "\n");
    }
}

export default StringUtil;
