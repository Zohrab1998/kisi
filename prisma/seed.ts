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
      serviceFeePercent: 10,
      orderingEnabled: true,
      menuCategories: {
        create: [{ name: "Starters" }, { name: "Mains" }, { name: "Drinks" }],
      },
      tables: {
        create: [{ name: "Table 1" }, { name: "Table 2" }, { name: "Patio 3" }],
      },
    },
    include: { tables: true, menuCategories: true },
  });

  const starters = business.menuCategories.find((c) => c.name === "Starters")!;
  const mains = business.menuCategories.find((c) => c.name === "Mains")!;
  const drinks = business.menuCategories.find((c) => c.name === "Drinks")!;

  const menuItems = await Promise.all(
    [
      { name: "Lavash", priceAmd: 500, categoryId: starters.id },
      { name: "Dolma", priceAmd: 3200, categoryId: starters.id },
      { name: "Khinkali (4 pcs)", priceAmd: 2800, categoryId: mains.id },
      { name: "Grilled Trout", priceAmd: 4500, categoryId: mains.id },
      { name: "Armenian coffee", priceAmd: 1000, categoryId: drinks.id },
      { name: "Ararat brandy (50ml)", priceAmd: 2500, categoryId: drinks.id },
    ].map((data) => db.menuItem.create({ data: { ...data, businessId: business.id } }))
  );

  const table1 = business.tables.find((t) => t.name === "Table 1")!;
  const lavash = menuItems.find((m) => m.name === "Lavash")!;
  const dolma = menuItems.find((m) => m.name === "Dolma")!;
  const khinkali = menuItems.find((m) => m.name === "Khinkali (4 pcs)")!;

  await db.bill.create({
    data: {
      businessId: business.id,
      tableId: table1.id,
      items: {
        create: [
          { menuItemId: khinkali.id, name: khinkali.name, unitPriceAmd: khinkali.priceAmd, quantity: 2 },
          { menuItemId: lavash.id, name: lavash.name, unitPriceAmd: lavash.priceAmd, quantity: 3 },
          { menuItemId: dolma.id, name: dolma.name, unitPriceAmd: dolma.priceAmd, quantity: 1 },
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
