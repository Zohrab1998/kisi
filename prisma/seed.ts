import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";

function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  const email = "demo@qrpay.am";
  const existing = await db.business.findUnique({ where: { email } });
  if (existing) {
    console.log("Demo business already seeded:", existing.id);
    return;
  }

  const business = await db.business.create({
    data: {
      name: "Cascade Cafe",
      email,
      passwordHash: await hashPassword("password123"),
      feePercent: 2.0,
      orderingEnabled: true,
      menuItems: {
        create: [
          { name: "Khinkali (4 pcs)", priceAmd: 2800 },
          { name: "Lavash", priceAmd: 500 },
          { name: "Dolma", priceAmd: 3200 },
          { name: "Armenian coffee", priceAmd: 1000 },
          { name: "Ararat brandy (50ml)", priceAmd: 2500 },
        ],
      },
      tables: {
        create: [{ name: "Table 1" }, { name: "Table 2" }, { name: "Patio 3" }],
      },
    },
    include: { tables: true, menuItems: true },
  });

  const table1 = business.tables.find((t) => t.name === "Table 1")!;
  const [khinkali, lavash, dolma] = business.menuItems;

  await db.bill.create({
    data: {
      businessId: business.id,
      tableId: table1.id,
      items: {
        create: [
          { name: khinkali.name, unitPriceAmd: khinkali.priceAmd, quantity: 2 },
          { name: lavash.name, unitPriceAmd: lavash.priceAmd, quantity: 3 },
          { name: dolma.name, unitPriceAmd: dolma.priceAmd, quantity: 1 },
        ],
      },
    },
  });

  console.log("Seeded business:", business.email, "/ password123");
  console.log("Table 1 QR token:", table1.qrToken);
}

main()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  });
