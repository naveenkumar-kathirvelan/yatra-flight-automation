import * as fs from "fs";
import * as path from "path";
import { Logger } from "./Logger";

export class JsonReader {
  static read<T>(fileName: string): T {
    const filePath = path.resolve("test-data", fileName);
    Logger.debug(`Reading test data from: ${filePath}`);
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  }

  static readAll<T>(fileName: string): T[] {
    return this.read<T[]>(fileName);
  }
}
