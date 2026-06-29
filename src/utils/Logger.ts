import { createLogger, format, transports } from "winston";
import * as fs from "fs";
import * as path from "path";

const logsDir = path.resolve("logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
});

export const Logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  transports: [
    new transports.Console({
      format: combine(colorize(), timestamp({ format: "HH:mm:ss" }), logFormat),
    }),
    new transports.File({
      filename: process.env.LOG_FILE || "logs/test-run.log",
      maxsize: 5_000_000,
      maxFiles: 5,
    }),
  ],
});
