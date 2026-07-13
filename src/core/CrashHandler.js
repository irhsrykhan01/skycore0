import Logger from "./Logger.js";

class CrashHandler {
    static registered = false;

    static register() {
        if (this.registered) return;

        this.registered = true;

        process.on("uncaughtException", (error) => {
            Logger.error("Uncaught Exception", error);
        });

        process.on("unhandledRejection", (reason) => {
            Logger.error("Unhandled Promise Rejection", reason);
        });

        process.on("warning", (warning) => {
            Logger.warn(
                `${warning.name}: ${warning.message}`
            );
        });

        process.on("SIGINT", async () => {
            Logger.warn("Received SIGINT. Shutting down...");

            process.exit(0);
        });

        process.on("SIGTERM", async () => {
            Logger.warn("Received SIGTERM. Shutting down...");

            process.exit(0);
        });

        Logger.success("Crash Handler Initialized");
    }
}

export default CrashHandler;
