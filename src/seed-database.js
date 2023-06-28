const { Item, Category, ItemCategory, Coupon } = require('./database/models');

(async () => {
  console.log("[db-seeding]: Starting");
  const itemCount = await Item.getCount();
  if (!itemCount) {
    console.log("[db-seeding]: Seeding 'shopping-items'");
    await Item.insertOne({ id: 1000, name: "Teclado", price: 120 })
    await Item.insertOne({ id: 1001, name: "Xiaomi POCO X3 Pro", price: 400 })
    await Item.insertOne({ id: 1002, name: "Acer Nitro 5 AN515-51", price: 600 })
    await Item.insertOne({ id: 1003, name: "Yamaha YZF-R1", price: 6600 })
  }

  const categoriesCount = await Category.getCount();
  if (!categoriesCount) {
    console.log("[db-seeding]: Seeding 'categories'");
    await Category.insertOne({ id: 50, name: "Componentes de PC" });
    await Category.insertOne({ id: 51, name: "Teclados" });
    await Category.insertOne({ id: 52, name: "Equipos portátiles" });
    await Category.insertOne({ id: 53, name: "Computadoras" });
    await Category.insertOne({ id: 54, name: "Celulares" });
    await Category.insertOne({ id: 55, name: "Vehiculos" });
    await Category.insertOne({ id: 56, name: "Motocicletas" });
  }

  const itemCategoriesCount = await ItemCategory.getCount();
  if (!itemCategoriesCount) {
    console.log("[db-seeding]: Seeding 'item-categories'");
    await ItemCategory.insertOne({ itemId: 1000, categoryId: 50 });
    await ItemCategory.insertOne({ itemId: 1000, categoryId: 51 });
    await ItemCategory.insertOne({ itemId: 1001, categoryId: 54 }); // Sólo tiene una categoría
    await ItemCategory.insertOne({ itemId: 1002, categoryId: 52 });
    await ItemCategory.insertOne({ itemId: 1002, categoryId: 53 });
    await ItemCategory.insertOne({ itemId: 1003, categoryId: 55 });
    await ItemCategory.insertOne({ itemId: 1000, categoryId: 56 });
  }

  const couponCount = await Coupon.getCount();
  if (!couponCount) {
    console.log("[db-seeding]: Seeding 'coupons'");
    const currentDate = new Date;

    // Set expiration to 8 hours from current time
    const expirationDate = new Date(currentDate.getTime() + 8 * 60 * 60 * 1000);

    await Coupon.insertOne({ id: "BIGSPECIAL30", discount: 30, expiresAt: expirationDate })
    await Coupon.insertOne({ id: "SOLSTICE60", discount: 60, expiresAt: expirationDate })
    await Coupon.insertOne({ id: "BLACK80", discount: 80, expiresAt: expirationDate })
    await Coupon.insertOne({ id: "CRAZINESS100", discount: 100, expiresAt: new Date })
  }

  console.log("[db-seeding]: OK");
})();

module.exports = {}