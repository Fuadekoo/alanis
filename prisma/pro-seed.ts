import prisma from "../lib/db";

(async () => {
  // manager
  await prisma.user.create({
    data: {
      role: "manager",
      firstName: "Abdelhamid Abdullah",
      username: "0912917270",
      password: "$2a$12$2s7x0TYyod3VC.RBO.pBS.KmRr5S217JxoyaYGRq9GJcdx1Ps.6La",
    },
  });

  // scanner
  await prisma.user.create({
    data: {
      role: "scanner",
      firstName: "Abdelhamid Abdullah",
      username: "0924232389",
      password: "$2a$12$hkw3hZ0ZDXLVew1IEuDn7ehw4c2IS3Mg5hyEKB2EzvPpPKZw2re9a",
    },
  });

  // controller
  await prisma.user.create({
    data: {
      firstName: "Abdelhamid Abdullah",
      role: "controller",
      username: "0920236783",
      password: "$2a$12$GqpDx/96EBnkrczr64VQ6eSIpBGUsAr3NbSYlKmqAu721siUBNpOu",
    },
  });
})()
  .then(() => {
    console.log("Seed Successfully 👌");
  })
  .catch(() => {
    console.log("Failed to Seed 😞");
  });
