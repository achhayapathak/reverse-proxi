import cluster, { Worker } from "node:cluster";
import { log } from "console";
import http from "node:http";
import rootConfigSchema, { ConfigSchemaType } from "../config/config-schema";
import {
  workerMessageResponseSchema,
  workerMessageResponseSchemaType,
  workerMessageSchema,
  workerMessageSchemaType,
} from "./server-schema";

interface CreateServerConfig {
  port: number;
  workerCount: number;
  config: ConfigSchemaType;
}

async function createServer(config: CreateServerConfig) {
  const { workerCount } = config;
  const Worker_Pool: Worker[] = [];

  if (cluster.isPrimary) {
    log("Master Process is up");

    for (let i = 0; i < workerCount; i++) {
      const w = cluster.fork({ config: JSON.stringify(config.config) });
      Worker_Pool.push(w);
    }

    const server = http.createServer((req, res) => {
      const index = Math.floor(Math.random() * Worker_Pool.length);
      const worker = Worker_Pool.at(index);

      if (!worker) throw new Error("Worker Not found!");

      const payload: workerMessageSchemaType = {
        requestType: "HTTP",
        headers: req.headers,
        body: null,
        path: `${req.url}`,
      };

      worker.send(JSON.stringify(payload));

      worker.once("message", async (workerReply: string) => {
        const reply = await workerMessageResponseSchema.parseAsync(
          JSON.parse(workerReply)
        );

        res.writeHead(reply.statusCode);
        res.end(reply.data);
        return;
      });
    });

    server.listen(config.port, function () {
      log(`Listening on port ${config.port}`);
    });
  } else {
    const config = await rootConfigSchema.parseAsync(
      JSON.parse(`${process.env.config}`)
    );

    process.on("message", async (message: string) => {
      const messageValidated = await workerMessageSchema.parseAsync(
        JSON.parse(message)
      );

      const requestURL = messageValidated.path;
      const rule = config.server.rules.find((e) => {
        const regex = new RegExp(`^${e.path}.*$`);
        return regex.test(requestURL);
      });

      if (!rule) {
        const reply: workerMessageResponseSchemaType = {
          statusCode: 404,
          data: "Error: Rule not found",
        };
        if (process.send) return process.send(JSON.stringify(reply));
      }

      const upstreamID = rule?.upstreams[0];
      const upstream = config.server.upstreams.find((e) => e.id === upstreamID);

      if (!upstream) {
        const reply: workerMessageResponseSchemaType = {
          statusCode: 500,
          data: "Error: Upstream not found",
        };
        if (process.send) return process.send(JSON.stringify(reply));
      }

      const request = http.request({ host: upstream?.url, path: requestURL }, (proxyRes) => {
        let body = "";

        proxyRes.on("data", (chunk) => {
          body += chunk;
        });

        proxyRes.on("end", () => {
          const reply: workerMessageResponseSchemaType = {
            statusCode: 200,
            data: body,
          };
          if (process.send) return process.send(JSON.stringify(reply));
        });
      })
      request.end();
    });
  }
}

export default createServer;
