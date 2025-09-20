import express from "express";
import cors from "cors";
import { createServer } from "http";
import next from "next";
import { startBot } from "./bot";
import { startSocket } from "./socket";
import { config } from "dotenv";

config();

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev, turbo: true });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const expressApp = express();
  expressApp.use(express.json());
  expressApp.use(express.urlencoded({ extended: true }));
  expressApp.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  expressApp.use((req, res) => handle(req, res));

  const httpServer = createServer(expressApp);
  startSocket(httpServer);

  httpServer.listen(port, async () => {
    await startBot();
    console.log(
      `> Server listening at http://localhost:${port} as ${
        nextApp.options.dev ? "development" : "production"
      }`
    );
  });
});
