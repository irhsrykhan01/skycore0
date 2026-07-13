import SkyCore from "./src/core/SkyCore.js";

async function bootstrap() {
    const app = new SkyCore();

    try {
        await app.start();
    } catch (error) {
        console.error("\n[SkyCore] Fatal Error");
        console.error(error);

        process.exit(1);
    }
}

bootstrap();
