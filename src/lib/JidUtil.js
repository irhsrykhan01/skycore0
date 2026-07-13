class JidUtil {

    static normalize(jid = "") {
        if (!jid) return "";

        return String(jid)
            .trim()
            .replace(/:\d+@/g, "@");
    }

    static decode(jid = "") {
        return this.normalize(jid);
    }

    static encode(number = "") {
        number = String(number).replace(/\D/g, "");

        if (!number)
            return "";

        return `${number}@s.whatsapp.net`;
    }

    static number(jid = "") {
        jid = this.normalize(jid);

        if (!jid)
            return "";

        return jid
            .split("@")[0]
            .replace(/:\d+/g, "");
    }

    static isUser(jid = "") {
        jid = this.normalize(jid);

        return jid.endsWith("@s.whatsapp.net");
    }

    static isGroup(jid = "") {
        jid = this.normalize(jid);

        return jid.endsWith("@g.us");
    }

    static isBroadcast(jid = "") {
        jid = this.normalize(jid);

        return jid.endsWith("@broadcast");
    }

    static isStatus(jid = "") {
        return this.normalize(jid) === "status@broadcast";
    }

    static isNewsletter(jid = "") {
        jid = this.normalize(jid);

        return jid.endsWith("@newsletter");
    }

    static isLid(jid = "") {
        jid = this.normalize(jid);

        return jid.includes("@lid");
    }

    static mention(jid = "") {
        return `@${this.number(jid)}`;
    }

    static mentions(list = []) {

        if (!Array.isArray(list))
            return [];

        return list.map(jid => this.normalize(jid));

    }

    static unique(list = []) {

        return [
            ...new Set(
                list.map(jid => this.normalize(jid))
            )
        ];

    }

    static equals(a = "", b = "") {

        return (
            this.normalize(a) ===
            this.normalize(b)
        );

    }

}

export default JidUtil;
