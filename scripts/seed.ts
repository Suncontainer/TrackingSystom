import { closeDb } from "@/db/client-core";
import { seedDevelopmentData } from "@/db/seed";

async function main() {
  await seedDevelopmentData();
  console.info("Development seed data complete.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
