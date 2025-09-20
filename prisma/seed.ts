import prisma from "../lib/db";

(async () => {
  // manager
  await prisma.user.create({
    data: {
      firstName: "abdelkerim",
      role: "manager",
      username: "manager",
      password: "$2a$12$GVwlA4K4Ri//GhKvmXMpte0tFjwJyY8i30lbVbf8WMm0ASPdF.cBG",
    },
  });

  // scanner
  await prisma.user.create({
    data: {
      firstName: "abdelkerim",
      role: "scanner",
      username: "scanner",
      password: "$2a$12$qoqJNW0DESz45IrvZpvkiOwyc6sS5HyUiUWIksP//BUBbyG5rHUwy",
    },
  });

  // controller
  await prisma.user.create({
    data: {
      firstName: "abdelkerim",
      role: "controller",
      username: "controller",
      password: "$2a$12$DEY39BwzfWLrc5g4Br1ZZuJZ5MA8P58Lz5bKhm5MG2SFNVtAQVJR.",
    },
  });

  // teacher
  await prisma.user.create({
    data: {
      firstName: "abdelkerim",
      role: "teacher",
      username: "teacher",
      password: "$2a$12$uBpLoJD8y92TjZreNeCkFOomFSPFKMvbx32Hz9PaK5S.naMDOutKy",
    },
  });

  // student
  await prisma.user.create({
    data: {
      firstName: "abdelkerim",
      role: "student",
      username: "student",
      password: "$2a$12$VKHemEETruwEP2v.XctiX.3m0JKyzzK/WF9Q5EOIsms1fhpmC4kzS",
    },
  });
})()
  .then(() => {
    console.log("Seed Successfully 👌");
  })
  .catch(() => {
    console.log("Failed to Seed 😞");
  });
