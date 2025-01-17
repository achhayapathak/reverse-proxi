import fs from "node:fs/promises";
import { parse } from "yaml";
import rootConfigSchema from "./config-schema";

async function parseFromYaml(filepath: string) {
  const configFileContent = await fs.readFile(filepath, "utf-8");
  const configParsed = parse(configFileContent);
  return JSON.stringify(configParsed);
}

async function validateConfig(config: string) {
  const validateConfig = await rootConfigSchema.parseAsync(JSON.parse(config));
  return validateConfig;
}

export { parseFromYaml, validateConfig };
