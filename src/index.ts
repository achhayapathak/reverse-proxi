import { log } from "node:console";
import { program } from "commander";
import os from 'os';
import { parseFromYaml, validateConfig } from "./config/config";
import createServer from "./server/server";
import { ConfigSchemaType } from "./config/config-schema";

async function main() {
  program.option("--config <path>");
  program.parse();

  const options = program.opts(); 

  if (options && "config" in options) {
    const config = await parseFromYaml(options.config);
    const validatedConfig = await validateConfig(config)
    await createServer({
        port: validatedConfig.server.listen,
        workerCount: validatedConfig.server.workers ?? os.cpus().length,
        config: validatedConfig
    })
  }
}

main();
