const { PrismaClient, Decimal } = require("../lib/generated/prisma");
const prisma = new PrismaClient();

async function main() {
  const account = await prisma.accounts.create({
    data: {
      email: "worker1@example.com",
      password: "hashed_password_here",
      isVerified: true,
      createdAt: new Date(),
      status: "ACTIVE",
      profile: {
        create: {
          firstName: "Juan",
          lastName: "Dela Cruz",
          username: "juandelacruz",
          contactNum: "09171234567",
          profileType: "WORKER",
          worker: {
            create: {
              profileImg: "https://placehold.co/100x100",
              hourlyRate: new Decimal(200.0),
              verifiedSkills: ["Gardening", "Cleaning"],
              responseTimeAvg: new Decimal(1.2),
              completionRate: new Decimal(98.5),
              bio: "Hardworking and reliable gardener",
              totalEarningGross: new Decimal(5000.0),
              withholdingBalance: new Decimal(500.0),
              description: "Expert in lawn care and landscaping",
              availabilityStatus: "AVAILABLE",
              freelancer_specialization: {
                create: {
                  specialization: {
                    create: { specializationName: "Gardener" },
                  },
                  experienceYears: 5,
                  certification: "TESDA NCII",
                },
              },
            },
          },
        },
      },
    },
  });

  console.log("Dummy data created:", account);
}
