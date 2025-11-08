import prisma from "../lib/db";

const REPORTER_PASSWORD_HASH =
  "$2b$12$G4rEgwXCTi3mAb.nUMQWpOlgZ4xClymKMqpcdwI.s0wgfo15dCHVm";

const reporter = {
  firstName: "Mohammed",
  fatherName: "Ahmend",
  lastName: "",
  gender: "Male" as const,
  age: 0,
  phoneNumber: "",
  country: "",
  username: "reporter",
  role: "reporter" as const,
  password: REPORTER_PASSWORD_HASH,
  status: "active" as const,
};

async function seedReporters() {
  await prisma.user.upsert({
    where: { username: reporter.username },
    update: reporter,
    create: reporter,
  });
}

seedReporters()
  .then(() => {
    console.log("Reporter profiles seeded successfully 👌");
  })
  .catch((error) => {
    console.error("Failed to seed reporter profiles 😞", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
