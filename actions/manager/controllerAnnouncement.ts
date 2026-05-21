"use server";

import prisma from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegram";
import { ControllerAnnouncementSchema } from "@/lib/zodSchema";

async function getTargetControllers(forUser: string[]) {
  return prisma.user.findMany({
    where: {
      role: "controller",
      ...(forUser.length > 0 ? { id: { in: forUser } } : {}),
    },
    select: { id: true, chatId: true },
  });
}

export async function registerControllerAnnouncement({
  id,
  text,
  lastDate,
  forUser,
}: ControllerAnnouncementSchema) {
  try {
    if (id) {
      await prisma.controllerAnnouncementData.update({
        where: { id },
        data: { text, lastDate },
      });

      await prisma.announcementController.deleteMany({
        where: { controllerAnnouncementDataId: id },
      });

      const controllers = await getTargetControllers(forUser);

      if (controllers.length > 0) {
        await prisma.announcementController.createMany({
          data: controllers.map(({ id: controllerId }) => ({
            controllerId,
            controllerAnnouncementDataId: id,
          })),
        });
      }
    } else {
      const controllers = await getTargetControllers(forUser);

      await Promise.all(
        controllers.map(async ({ chatId }) => {
          await sendTelegramMessage(chatId, text);
        })
      );

      await prisma.controllerAnnouncementData.create({
        data: {
          text,
          lastDate,
          announcementController: {
            create: controllers.map(({ id: controllerId }) => ({
              controllerId,
            })),
          },
        },
      });
    }

    return {
      status: true,
      message: "successfully register controller announcement",
    };
  } catch (error) {
    console.error("Error registering controller announcement:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to register controller announcement",
    };
  }
}

export async function deleteControllerAnnouncement(id: string) {
  try {
    await prisma.announcementController.deleteMany({
      where: { controllerAnnouncementDataId: id },
    });

    await prisma.controllerAnnouncementData.delete({ where: { id } });
    return {
      status: true,
      message: "successfully delete controller announcement",
    };
  } catch (error) {
    console.error("Error deleting controller announcement:", error);
    return {
      status: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete controller announcement",
    };
  }
}

export async function getControllerAnnouncements() {
  const [data, totalControllers] = await Promise.all([
    prisma.controllerAnnouncementData.findMany({
      include: {
        announcementController: {
          select: {
            controller: {
              select: {
                id: true,
                firstName: true,
                fatherName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    }),
    prisma.user.count({ where: { role: "controller" } }),
  ]);

  return data.map(({ announcementController, ...rest }) => ({
    ...rest,
    forAll:
      totalControllers > 0 &&
      announcementController.length === totalControllers,
    forUser: announcementController.map(({ controller }) => ({
      id: controller.id,
      name: `${controller.firstName} ${controller.fatherName} ${controller.lastName}`,
    })),
  }));
}
