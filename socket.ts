import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import prisma from "./lib/db";

export function startSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    pingTimeout: 60000,
    cors: {
      origin: [
        "https://alanistilawa.com",
        "https://www.alanistilawa.com",
        "http://alanistilawa.com",
        "https://alanisquran.com",
        "https://www.alanisquran.com",
        "http://alanisquran.com",
        "http://localhost",
        "https://localhost",
        /^http:\/\/localhost:\d+$/,
        /^https:\/\/localhost:\d+$/,
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    socket.data.id = socket.handshake.auth.id;
    next();
  });

  io.on("connection", async (socket) => {
    console.log("connect", socket.id);
    if (socket.data.id) {
      socket.except(socket.id).emit("user:+", socket.data.id);
      await prisma.user.update({
        where: { id: socket.data.id },
        data: { socket: socket.id },
      });
    }

    socket.on(
      "message",
      async ({
        tempId,
        toId,
        message,
      }: {
        tempId: string;
        toId: string;
        message: string;
      }) => {
        const user = await prisma.user.findFirst({
          where: { id: toId },
          select: { id: true, socket: true },
        });
        if (socket.data.id && user) {
          const chat = await prisma.chat.create({
            data: { fromId: socket.data.id, toId: user.id, message },
          });
          if (user.socket) {
            socket.to(user.socket).emit("message", {
              id: chat.id,
              createdAt: chat.createdAt,
              message: chat.message,
              self: false,
            });
          }
          io.to(socket.id).emit("id", tempId, chat.id);
          console.log("MSG >> ", socket.data.id, toId);
        }
      }
    );

    socket.on(
      "update",
      async ({ id, message }: { id: string; message: string }) => {
        if (socket.data.id) {
          const data = await prisma.chat.update({
            where: { id },
            data: { message },
            select: {
              from: { select: { id: true, socket: true } },
              to: { select: { id: true, socket: true } },
            },
          });
          let socketId = "";
          if (data.from.id == socket.data.id && data.to.socket) {
            socketId = data.to.socket;
          } else if (data.from.id == socket.data.id && data.from.socket) {
            socketId = data.from.socket;
          }
          if (socketId) {
            socket.to(socketId).emit("update", { id, message });
          }
        }
      }
    );

    socket.on("delete", async (toId: string, id: string) => {
      const user = await prisma.user.findFirst({
        where: { id: toId },
        select: { id: true, socket: true },
      });
      if (socket.data.id && user?.socket) {
        socket.to(user.socket).emit("delete", id);
      }
    });

    socket.on("disconnect", async (reason) => {
      console.log("DISCONNECT >> ", reason);
      if (socket.data.id) {
        socket.except(socket.id).emit("user:-", socket.data.id);
        await prisma.user.update({
          where: { id: socket.data.id },
          data: { socket: "" },
        });
      }
    });

    socket.on("error", (err) => {
      console.log("error-message ", err.message);
      console.log("error-cause ", err.cause);
    });
  });
}
