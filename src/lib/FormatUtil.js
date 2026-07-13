class FormatUtil {

    static bytes(bytes = 0, decimals = 2) {

        if (!Number(bytes))
            return "0 B";

        const k = 1024;

        const dm = decimals < 0 ? 0 : decimals;

        const sizes = [
            "B",
            "KB",
            "MB",
            "GB",
            "TB"
        ];

        const i = Math.floor(
            Math.log(bytes) / Math.log(k)
        );

        return `${parseFloat(
            (bytes / Math.pow(k, i))
            .toFixed(dm)
        )} ${sizes[i]}`;

    }

    static duration(ms = 0) {

        ms = Number(ms);

        const sec = Math.floor(ms / 1000);

        const h = Math.floor(sec / 3600);

        const m = Math.floor(
            (sec % 3600) / 60
        );

        const s = sec % 60;

        return [
            h && `${h}h`,
            m && `${m}m`,
            `${s}s`
        ]
        .filter(Boolean)
        .join(" ");

    }

    static number(number = 0) {

        return new Intl.NumberFormat(
            "id-ID"
        ).format(number);

    }

    static compact(number = 0) {

        return new Intl.NumberFormat(
            "id-ID",
            {
                notation: "compact"
            }
        ).format(number);

    }

    static date(date = new Date()) {

        return new Intl.DateTimeFormat(
            "id-ID",
            {
                dateStyle: "medium"
            }
        ).format(date);

    }

    static time(date = new Date()) {

        return new Intl.DateTimeFormat(
            "id-ID",
            {
                timeStyle: "medium"
            }
        ).format(date);

    }

    static datetime(date = new Date()) {

        return new Intl.DateTimeFormat(
            "id-ID",
            {
                dateStyle: "medium",
                timeStyle: "medium"
            }
        ).format(date);

    }

}

export default FormatUtil;
