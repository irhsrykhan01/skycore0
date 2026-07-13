class TimeUtil {

    static now() {
        return Date.now();
    }

    static unix() {
        return Math.floor(Date.now() / 1000);
    }

    static sleep(ms = 1000) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static format(ms = 0) {

        ms = Number(ms);

        const days = Math.floor(ms / 86400000);
        const hours = Math.floor((ms % 86400000) / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);

        const result = [];

        if (days) result.push(`${days}d`);
        if (hours) result.push(`${hours}h`);
        if (minutes) result.push(`${minutes}m`);
        result.push(`${seconds}s`);

        return result.join(" ");
    }

    static runtime() {
        return this.format(process.uptime() * 1000);
    }

    static timestamp() {
        return new Date().toISOString();
    }

    static date(date = new Date()) {
        return new Intl.DateTimeFormat("id-ID", {
            dateStyle: "full"
        }).format(date);
    }

    static time(date = new Date()) {
        return new Intl.DateTimeFormat
