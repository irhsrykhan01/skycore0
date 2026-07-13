import chalk from "chalk";

class Logger {
    constructor() {
        this.timeFormat = new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
    }

    timestamp() {
        return this.timeFormat.format(new Date());
    }

    print(level, color, message, ...args) {
        const time = chalk.gray(`[${this.timestamp()}]`);
        const tag = color(`[${level}]`);

        console.log(
            time,
            tag,
            message,
            ...args
        );
    }

    info(message, ...args) {
        this.print(
            "INFO",
            chalk.cyan,
            message,
            ...args
        );
    }

    success(message, ...args) {
        this.print(
            "SUCCESS",
            chalk.green,
            message,
            ...args
        );
    }

    warn(message, ...args) {
        this.print(
            "WARN",
            chalk.yellow,
            message,
            ...args
        );
    }

    error(message, error = null) {
        this.print(
            "ERROR",
            chalk.red,
            message
        );

        if (error) {
            console.error(error);
        }
    }

    debug(message, ...args) {
        if (process.env.NODE_ENV !== "production") {
            this.print(
                "DEBUG",
                chalk.magenta,
                message,
                ...args
            );
        }
    }

    system(message, ...args) {
        this.print(
            "SYSTEM",
            chalk.blueBright,
            message,
            ...args
        );
    }

    plugin(message, ...args) {
        this.print(
            "PLUGIN",
            chalk.hex("#9b59b6"),
            message,
            ...args
        );
    }

    command(message, ...args) {
        this.print(
            "COMMAND",
            chalk.hex("#00c853"),
            message,
            ...args
        );
    }

    downloader(message, ...args) {
        this.print(
            "DOWNLOADER",
            chalk.hex("#ff9800"),
            message,
            ...args
        );
    }
}

export default new Logger();
