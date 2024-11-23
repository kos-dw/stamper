export class StamperError extends Error {
    static {
        this.prototype.name = "StamperError";
    }

    constructor(message: string) {
        const stackLine = (new Error().stack?.split("\n")[2] || "").trim();
        super(`StamperError:\n${message}\n\n${stackLine}`);
    }
}
