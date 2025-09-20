import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { Bot, GrammyError, HttpError } from "grammy";
import prisma from "./lib/db.js";
import dotenv from "dotenv";

dotenv.config();

export const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

declare global {
  var bot: Bot;
}

global.bot = bot;

export async function startBot() {
  bot.command("start", async (ctx) => {
    await sendLogs(
      `${
        ctx?.chat?.first_name ?? ctx?.chat?.username ?? "someone"
      } ቦቱን እያናገረ ነው መለያ ቁጥር ተጠይቋል  \n\n${
        ctx?.chat?.username ? "https://t.me/" + ctx.chat.username : ""
      }`
    );
    ctx.reply(`እንኳን ወደ አል አኒስ የቁርዓን ማዕከል በደህና መጡ\nለመቀጠል እባክዎን መለያ ቁጥሮዎን ይላኩ`);
  });

  // bot.on("message", (ctx) => {
  //   console.log("message >> ", ctx.chat.id, ctx.message.message_id);
  // });

  bot.on("message:text", async (ctx) => {
    if (ctx.chat.type == "private") {
      const user = await prisma.user.findFirst({
        where: { username: ctx.msg.text },
        select: {
          id: true,
          username: true,
          firstName: true,
          fatherName: true,
          gender: true,
          role: true,
          chatId: true,
          // groupTeacher: { select: { group: { select: { chatId: true } } } },
          // groupStudent: { select: { group: { select: { chatId: true } } } },
        },
      });
      if (user) {
        if (user.role === "recordTeacher" || user.role === "recordStudent") {
          // await prisma.user.updateMany({
          //   where: { username: ctx.msg.text },
          //   data: { chatId: ctx.chat.id + "" },
          // });
          // const groupId =
          //   user.role === "recordTeacher"
          //     ? user.groupTeacher[0]?.group.chatId
          //     : user.groupStudent[0]?.group.chatId;
          // if (groupId) {
          //   const link = await bot.api.createChatInviteLink(groupId, {
          //     member_limit: 1,
          //     creates_join_request: false,
          //     expire_date: Math.floor(Date.now() / 1000) + 604800,
          //     name: "Invited by Al Anis Quran Center",
          //   });
          //   await ctx.reply(
          //     `${
          //       user.gender == "Female"
          //         ? "እህት"
          //         : user.gender == "Male"
          //         ? "ወንድም"
          //         : ""
          //     } ${user.firstName ?? ""} ${
          //       user.fatherName ?? ""
          //     } እንኳን ወደ አል አኒስ የቁርዓን ማዕከል በደህና ${
          //       user.gender == "Female"
          //         ? "መጣሽ"
          //         : user.gender == "Male"
          //         ? "መጣህ"
          //         : ""
          //     } \n\nለመግባት ከታች ያለውን ሊንክ ይጫኑ\n\n${link.invite_link}}`
          //   );
          // }
          // register chat_id and generate private group link
        } else {
          const password = randomBytes(4).toString("hex");
          await prisma.user.update({
            where: { id: user.id },
            data: {
              chatId: ctx.chat.id + "",
              password: await bcrypt.hash(password, 12),
            },
          });

          await ctx.reply(
            `${
              user.gender == "Female"
                ? "እህት"
                : user.gender == "Male"
                ? "ወንድም"
                : ""
            } ${user.firstName ?? ""} ${
              user.fatherName ?? ""
            } እንኳን ወደ አል አኒስ የቁርዓን ማዕከል በደህና ${
              user.gender == "Female"
                ? "መጣሽ"
                : user.gender == "Male"
                ? "መጣህ"
                : ""
            } \n\nለመግባት ከታች ያለውን ሊንክ ይጫኑ\n\n${`${process.env.AUTH_URL}/am/login/${user.username}/${password}`}`
          );

          await sendLogs(
            `${
              ctx?.chat?.first_name ?? ctx?.chat?.username ?? "someone"
            } ገብቷል \n\nhttps://t.me/${ctx?.chat?.username ?? ""}`
          );
        }
      } else {
        ctx.reply("የላኩት መለያ ቁጥር የተሳሳተ ነው \nደግመው ይሞክሩ");
        await sendLogs(
          `${
            ctx?.chat?.first_name ?? ctx?.chat?.username ?? "someone"
          } መልዕክት ልኳል "${ctx.msg.text ?? ""}" \n\nhttps://t.me/${
            ctx?.chat?.username ?? ""
          }`
        );
      }
    } else {
      // for group text message
      console.log("for group text message");
    }
  });

  // bot.on(["message:media"], (ctx) => {
  //   console.log(
  //     "message:media >> ",
  //     ctx.message.video_note,
  //     ctx.message.video,
  //     ctx.message.audio,
  //     ctx.chat.type
  //   );
  // });

  // bot.on(["message:video", "message:file:is_video"], (ctx) => {
  //   console.log("message:video >> ", ctx.chat.type);
  // });

  // bot.on(
  //   ["message:voice", "message:audio", "message:video_note"],
  //   async (ctx) => {
  //     console.log("MEdia >> ", ctx.chat.type, ctx.message.chat.type);
  //     if (ctx.chat.type == "group") {
  //       // const groupId = ctx.chat.id;
  //       const senderId = ctx.message.from.id;
  //       const messageId = ctx.message.message_id;
  //       const forId = ctx.message.reply_to_message?.from?.id;
  //       const replayMessageId = ctx.message.reply_to_message?.message_id;

  //       console.log(">> ", senderId, messageId, forId, replayMessageId);

  //       if (forId) {
  //         const teacher = await prisma.user.findFirst({
  //           where: {
  //             role: "recordTeacher",
  //             chatId: senderId + "",
  //           },
  //         });

  //         if (teacher) {
  //           const progress = await prisma.progress.findFirst({
  //             where: {
  //               student: { chatId: forId + "" },
  //               sentMessageId: replayMessageId + "",
  //             },
  //           });
  //           if (progress) {
  //             await prisma.progress.update({
  //               where: { id: progress.id },
  //               data: {
  //                 status: "replayed",
  //                 replayedTime: new Date(),
  //                 replayedMessageId: messageId + "",
  //               },
  //             });
  //           }
  //         } else {
  //         }
  //       } else {
  //         const student = await prisma.user.findFirst({
  //           where: {
  //             role: "recordStudent",
  //             chatId: senderId + "",
  //           },
  //         });
  //         if (student) {
  //           await prisma.progress.create({
  //             data: {
  //               studentId: student.id,
  //               sentMessageId: messageId + "",
  //             },
  //           });
  //         }
  //       }

  //       // check if the sender is teacher
  //       // ifnot check if it replayed message

  //       // save data
  //     } else {
  //     }
  //   }
  // );

  // bot.on("message:new_chat_title", async (ctx) => {
  //   console.log(
  //     "group name change",
  //     ctx.message.chat.id,
  //     ctx.message.new_chat_title
  //   );
  //   await prisma.group.updateMany({
  //     where: {
  //       chatId: ctx.message.chat.id + "",
  //     },
  //     data: { name: ctx.message.new_chat_title },
  //   });
  // });

  bot.on("my_chat_member", async (ctx) => {
    console.log(
      "my_chat_member >> ",
      ctx.myChatMember.new_chat_member.status,
      ctx.myChatMember.chat.type
    );
    if (ctx.myChatMember.chat.type == "group") {
      // if (ctx.myChatMember.new_chat_member.status == "administrator") {
      //   // check if the groups was register ifnot register the groups
      //   const group = await prisma.group.findFirst({
      //     where: { chatId: ctx.chat.id + "" },
      //   });
      //   if (!group) {
      //     await prisma.group.create({
      //       data: {
      //         chatId: ctx.chat.id + "",
      //         username: ctx.chat.username ?? "",
      //         name: ctx.chat.title ?? "",
      //       },
      //     });
      //   }
      // }
    } else {
      // left the groups
      await ctx.api.leaveChat(ctx.myChatMember.chat.id);
    }
  });

  bot.on("chat_member", async (ctx) => {
    const status = ctx.chatMember.new_chat_member.status;
    const chatId = ctx.chatMember.new_chat_member.user.id;
    // console.log("chat_member >> ", status);
    if (status == "member") {
      // check if registered
      const user = await prisma.user.findFirst({
        where: { chatId: chatId + "" },
      });
      if (user) {
        // welcome the student maybe
      } else {
        await ctx.api.banChatMember(ctx.chat.id, chatId);
        await ctx.api.unbanChatMember(ctx.chat.id, chatId);
      }
    } else {
      //
    }
  });

  bot.catch(({ error, ctx, name }) => {
    console.error(
      `Error while handling update ${ctx.update.update_id} : ${name}`
    );
    if (error instanceof GrammyError) {
      console.error("Error in request:", error.description);
    } else if (error instanceof HttpError) {
      console.error("Could not contact Telegram:", error);
    } else {
      console.error("Unknown error:", error);
    }
  });

  async function sendLogs(msg: string) {
    await bot.api.sendMessage(process.env.MANAGER_CHAT_ID ?? "", msg);
  }

  await bot
    .start({
      allowed_updates: [
        "business_connection",
        "business_message",
        "callback_query",
        "channel_post",
        "chat_boost",
        "chat_join_request",
        "chat_member",
        "chosen_inline_result",
        "deleted_business_messages",
        "edited_business_message",
        "edited_channel_post",
        "edited_message",
        "inline_query",
        "message",
        "message_reaction",
        "message_reaction_count",
        "my_chat_member",
        "poll",
        "poll_answer",
        "pre_checkout_query",
        "purchased_paid_media",
        "removed_chat_boost",
        "shipping_query",
      ],
      onStart() {
        // console.log(`Bot | ${botInfo.first_name ?? botInfo.last_name} start`);
        // const now = new Date();
        // now.setHours(14);
        // now.setMinutes(0);
        // const timezoneOffset = now.getTimezoneOffset();
        // const totalMinute =
        //   now.getHours() * 60 + now.getMinutes() + (-180 - timezoneOffset);
        // const hours = Math.floor(totalMinute / 60);
        // const minutes = totalMinute % 60;
        // cron.schedule(`0 ${minutes} ${hours} * * *`, async () => {
        //   console.log("running a cron job");
        //   const teachers = await prisma.user.findMany({
        //     where: { role: "recordTeacher" },
        //     select: {
        //       id: true,
        //       chatId: true,
        //       groupTeacher: {
        //         select: { group: { select: { id: true, chatId: true } } },
        //       },
        //     },
        //   });
        //   for (const teacher of teachers) {
        //     const group = teacher.groupTeacher[0]?.group;
        //     if (group && teacher.chatId) {
        //       const students = await prisma.user
        //         .findMany({
        //           where: { groupStudent: { every: { groupId: group.id } } },
        //           select: { id: true },
        //         })
        //         .then(
        //           async (res) =>
        //             await Promise.all(
        //               res.map(async (v) => {
        //                 const startDate = new Date();
        //                 startDate.setHours(0);
        //                 startDate.setMinutes(0);
        //                 const endDate = new Date();
        //                 endDate.setHours(23);
        //                 endDate.setMinutes(59);
        //                 const progress = await prisma.progress.findFirst({
        //                   where: {
        //                     studentId: v.id,
        //                     sentTime: { gte: startDate, lte: endDate },
        //                   },
        //                 });
        //                 return {
        //                   status: progress
        //                     ? progress.status
        //                       ? "sent"
        //                       : "replayed"
        //                     : "not sent",
        //                 };
        //               })
        //             )
        //         );
        //       const totalAttend = students.filter(
        //         (v) => v.status !== "not sent"
        //       );
        //       const getAnswer = students.filter((v) => v.status == "replayed");
        //       await bot.api.sendMessage(
        //         teacher.chatId,
        //         `
        //         ዉድ መምህር,
        //         ${students.length} ተማሪዎች አሎዎት
        //         ከ ${students.length}  ${totalAttend.length} ተገኝተዋል
        //         ከ ${totalAttend.length} ${getAnswer.length} አስተምረዋል ${
        //           totalAttend.length - getAnswer.length
        //         } አልስተማሩም
        //         ${
        //           (getAnswer.length / totalAttend.length) * 100
        //         }% የዉሎ የስራ አፈፃፀም አሎዎት
        //         `
        //       );
        //     } else {
        //     }
        //   }
        // });
      },
    })
    .catch((error) => {
      console.error("Error starting bot:", error);
    });
}

startBot();

// 1 start the bot and get group link
// 2 send record in the group and wait the answer

// 1 start the bot and get group link
// 1 replay for the student message
// 2 get message from the bot every day at 09:00 Am about his daily progress

// 1 when the bot join the private group, the bot register the group in the database
// 2 when the student send the message into the group, the bot will register the message with the status of "sent"
// 3 when the teacher replay the student message the the student message status change from "sent" to "replayed"

// 1 register groups
// 2 register teacher
// 3 register student
