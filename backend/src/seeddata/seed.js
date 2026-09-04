import sequelize from '../config/db.js';
import { 
  User, 
  Restaurant, 
  Rider, 
  PlatformCategory, 
  RestaurantCategory, 
  Food, 
  FoodVariant, 
  DeliveryZone, 
  RestaurantDeliveryZone, 
  Notification, 
  RestaurantAddon, 
  FoodAddon,
  PlatformSettings
} from '../models/index.js';
import { UserRole, UserStatus, RestaurantStatus, ActiveStatus } from '../enums/index.js';
import { configureAssociations } from '../utils/syncModels.js';
import { hashPassword } from '../utils/hash.js';
import { slugify } from '../utils/slugify.js';
import { ensureDatabaseExists } from '../utils/ensureDb.js';
import { Op } from 'sequelize';

const seed = async () => {
  try {
    await ensureDatabaseExists();

    console.log('Connecting to database for seeding...');
    configureAssociations();
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // 1. Database Cleanup
    console.log('Cleaning up table records...');

    // Seed global platform settings if not present
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      console.log('Seeding default platform settings...');
      await PlatformSettings.create({
        commissionRate: 15.00,
        riderBaseFee: 30.00,
        riderFeePerKm: 15.00,
        taxRate: 5.00,
      });
      console.log('Default platform settings seeded successfully.');
    }
    
    await FoodAddon.destroy({ where: {}, force: true });
    await RestaurantDeliveryZone.destroy({ where: {}, force: true });
    await FoodVariant.destroy({ where: {}, force: true });
    await Food.destroy({ where: {}, force: true });
    await RestaurantAddon.destroy({ where: {}, force: true });
    await RestaurantCategory.destroy({ where: {}, force: true });
    await Restaurant.destroy({ where: {}, force: true });
    await Rider.destroy({ where: {}, force: true });
    await Notification.destroy({ where: {}, force: true });
    await PlatformCategory.destroy({ where: {}, force: true });
    await DeliveryZone.destroy({ where: {}, force: true });
    
    // Delete all users EXCEPT the Admin user
    await User.destroy({
      where: {
        role: {
          [Op.ne]: UserRole.ADMIN
        }
      },
      force: true
    });
    console.log('Database cleanup completed.');

    // 2. Ensure Admin User exists
    const adminEmail = 'bitespeed@gmail.com';
    // Remove the old admin user if they exist
    await User.destroy({ where: { email: 'admin@fooddelivery.com' } });
    
    let admin = await User.findOne({ where: { email: adminEmail } });
    if (!admin) {
      console.log('Seeding system admin user...');
      const hashedPassword = await hashPassword('123456');
      admin = await User.create({
        name: 'System Admin',
        email: adminEmail,
        phone: '+8801700000000',
        password: hashedPassword,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });
      console.log('System Admin user seeded successfully.');
    }

    // 3. Seed Default Platform Categories (with real, beautiful food category images)
    console.log('Seeding platform categories...');
    const categoriesData = [
      {
        name: 'Burgers & Fast Food',
        slug: slugify('Burgers & Fast Food'),
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
        status: ActiveStatus.ACTIVE
      },
      {
        name: 'Pizza & Italian',
        slug: slugify('Pizza & Italian'),
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
        status: ActiveStatus.ACTIVE
      },
      {
        name: 'Asian & Noodles',
        slug: slugify('Asian & Noodles'),
        image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80',
        status: ActiveStatus.ACTIVE
      },
      {
        name: 'Desserts & Bakery',
        slug: slugify('Desserts & Bakery'),
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80',
        status: ActiveStatus.ACTIVE
      },
      {
        name: 'Beverages & Cafe',
        slug: slugify('Beverages & Cafe'),
        image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=80',
        status: ActiveStatus.ACTIVE
      }
    ];

    const platformCats = await PlatformCategory.bulkCreate(categoriesData, { returning: true });
    console.log('Platform categories seeded.');

    // Map categories for reference
    const categoryMap = {};
    platformCats.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    // 4. Seed Default Delivery Zones
    console.log('Seeding delivery zones...');
    const zonesData = [
      { 
        name: 'Dhanmondi', 
        slug: slugify('Dhanmondi'), 
        latitude: 23.7461, 
        longitude: 90.3742, 
        radiusKm: 3.0, 
        status: ActiveStatus.ACTIVE 
      },
      { 
        name: 'Gulshan', 
        slug: slugify('Gulshan'), 
        latitude: 23.7925, 
        longitude: 90.4156, 
        radiusKm: 3.5, 
        status: ActiveStatus.ACTIVE 
      },
      { 
        name: 'Banani', 
        slug: slugify('Banani'), 
        latitude: 23.7937, 
        longitude: 90.4042, 
        radiusKm: 3.0, 
        status: ActiveStatus.ACTIVE 
      },
      { 
        name: 'Uttara', 
        slug: slugify('Uttara'), 
        latitude: 23.8759, 
        longitude: 90.3795, 
        radiusKm: 5.0, 
        status: ActiveStatus.ACTIVE 
      }
    ];
    const deliveryZones = await DeliveryZone.bulkCreate(zonesData, { returning: true });
    console.log('Delivery zones seeded.');

    const zoneMap = {};
    deliveryZones.forEach(z => {
      zoneMap[z.name] = z.id;
    });

    // Hash common password
    const commonHashedPassword = await hashPassword('password123');

    // 5. Setup data templates for programmatically seeding 30 restaurants
    const restaurantTemplates = [
      // CATEGORY: Burgers & Fast Food (6 items)
      {
        name: 'Burger Legend',
        category: 'Burgers & Fast Food',
        description: 'Juicy gourmet burgers, crispy golden fries, and thick milkshakes prepared with fresh ingredients.',
        banner: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Firehouse Burgers',
        category: 'Burgers & Fast Food',
        description: 'Flame-grilled burgers featuring spicy house sauces and loaded jalapeno poppers.',
        banner: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'American Patty Co.',
        category: 'Burgers & Fast Food',
        description: 'Classic American diner burgers, curly french fries, and sweet malted milkshakes.',
        banner: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1547584385-edd90b9ad431?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'The Burger Club',
        category: 'Burgers & Fast Food',
        description: 'Artisanal smash burgers with house pickles and special secret sauce dip.',
        banner: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Crispy & Bun',
        category: 'Burgers & Fast Food',
        description: 'Crispy fried chicken burgers, loaded waffles, and chicken wings coated in hot glazed honey.',
        banner: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Diner Deluxe',
        category: 'Burgers & Fast Food',
        description: 'Late-night premium fast food, cheese loaded fries, wraps, and crispy onion rings.',
        banner: 'https://images.unsplash.com/photo-1547584385-edd90b9ad431?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=200&auto=format&fit=crop&q=80'
      },

      // CATEGORY: Pizza & Italian (6 items)
      {
        name: 'Pizza Roma',
        category: 'Pizza & Italian',
        description: 'Authentic wood-fired Neapolitan pizzas, freshly rolled handmade pastas, and Italian desserts.',
        banner: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Bella Italia',
        category: 'Pizza & Italian',
        description: 'Gourmet thin-crust Italian style pizzas, creamy fettuccine and fresh garlic breads.',
        banner: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1571066811602-716837d681de?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Tuscany Trattoria',
        category: 'Pizza & Italian',
        description: 'Traditional Italian pastas, lasagnas, tomato bruschetta, and red wines.',
        banner: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1555072956-7758afb20e8f?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Slice of Heaven',
        category: 'Pizza & Italian',
        description: 'Deep dish pizzas with stuffed crusts, pepperoni slices, and extra marinara dip.',
        banner: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Naples Pizzeria',
        category: 'Pizza & Italian',
        description: 'Classic Margherita pizza topped with fresh basil leaf and buffalo cheese slices.',
        banner: 'https://images.unsplash.com/photo-1571066811602-716837d681de?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Pasta & Crust',
        category: 'Pizza & Italian',
        description: 'Baked rigatoni, woodfire pizza rolls, and fresh garden salads.',
        banner: 'https://images.unsplash.com/photo-1555072956-7758afb20e8f?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=200&auto=format&fit=crop&q=80'
      },

      // CATEGORY: Asian & Noodles (6 items)
      {
        name: 'Koryo Noodle Bar',
        category: 'Asian & Noodles',
        description: 'Hot authentic ramen bowls, wok-tossed street style noodles, hand-rolled dumplings, and fresh bubble teas.',
        banner: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Tokyo Ramen House',
        category: 'Asian & Noodles',
        description: 'Delicious Tonkotsu ramen bowls, crispy gyoza, and warm misoshiru soup.',
        banner: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Wok N Roll',
        category: 'Asian & Noodles',
        description: 'Wok-fired Cantonese egg noodles, vegetable fried rice, and sweet-sour chicken.',
        banner: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Sichuan Palace',
        category: 'Asian & Noodles',
        description: 'Spicy Kung Pao dishes, Mapo tofu, Sichuan pepper hot pots, and chili oil wontons.',
        banner: 'https://images.unsplash.com/photo-1540648639573-8c848de23f0a?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Bangkok Kitchen',
        category: 'Asian & Noodles',
        description: 'Traditional Pad Thai rice noodles, green curry, and sweet mango sticky rice.',
        banner: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Dim Sum Garden',
        category: 'Asian & Noodles',
        description: 'Steamed shrimp crystal dumplings, chicken bao buns, and hot jasmine green tea.',
        banner: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1540648639573-8c848de23f0a?w=200&auto=format&fit=crop&q=80'
      },

      // CATEGORY: Desserts & Bakery (6 items)
      {
        name: 'Sweet Tooth Bakery',
        category: 'Desserts & Bakery',
        description: 'Artisanal baked cakes, fudge brownies, glazed donuts, and colorful custom cupcakes.',
        banner: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Velvet Cake Studio',
        category: 'Desserts & Bakery',
        description: 'Gourmet layered red velvet cakes, fruit cheesecakes, and sweet macarons.',
        banner: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Sugar High Cakes',
        category: 'Desserts & Bakery',
        description: 'Handcrafted buttercream custom cupcakes, cookies, and sweet pastry puffs.',
        banner: 'https://images.unsplash.com/photo-1614707267537-b85acf00c4b8?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Glazed Donuts Shop',
        category: 'Desserts & Bakery',
        description: 'Fresh hot fried donuts coated with chocolate fudge, caramel, and colorful sprinkles.',
        banner: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1614707267537-b85acf00c4b8?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'The French Pastry',
        category: 'Desserts & Bakery',
        description: 'Fresh butter croissants, chocolate pains, strawberry tarts, and baked eclairs.',
        banner: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1551849673-fc1458c090a2?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Bite Size Delights',
        category: 'Desserts & Bakery',
        description: 'Bite-sized sweet pastries, cake pops, and chocolate chip cookies.',
        banner: 'https://images.unsplash.com/photo-1551849673-fc1458c090a2?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80'
      },

      // CATEGORY: Beverages & Cafe (6 items)
      {
        name: 'The Daily Grind',
        category: 'Beverages & Cafe',
        description: 'Freshly roasted espresso blends, aromatic filter coffee, and delicious hot lattes.',
        banner: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Java Junction',
        category: 'Beverages & Cafe',
        description: 'Ice-blended frappes, cold brews, and sweet mocha lattes topped with cream.',
        banner: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Espresso Embassy',
        category: 'Beverages & Cafe',
        description: 'Single-origin pour overs, classic flat whites, and fresh tea leaves.',
        banner: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Matcha House',
        category: 'Beverages & Cafe',
        description: 'Organic Japanese Uji matcha lattes, green tea ice cream, and refreshing ice tea.',
        banner: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Bubble Boba Tea',
        category: 'Beverages & Cafe',
        description: 'Traditional brown sugar milk tea, taro milk tea, and fresh fruit teas with tapioca boba.',
        banner: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Brewed Awakenings',
        category: 'Beverages & Cafe',
        description: 'House-made iced teas, sparkling lemonades, and fresh baked biscuits.',
        banner: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
        logo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&auto=format&fit=crop&q=80'
      }
    ];

    // Rich Cuisines specific menus (4 to 5 categories per cuisine, and 4 to 6 items per category)
    const menuTemplates = {
      'Burgers & Fast Food': {
        menuCats: ['Gourmet Burgers', 'Crispy Chicken', 'Sides & Fries', 'Snacks & Bites', 'Beverages'],
        addons: [
          { name: 'Extra Cheddar Cheese Slice', price: 30.00 },
          { name: 'Smoked Crispy Beef Bacon', price: 60.00 },
          { name: 'Special Spicy BBQ Sauce Dip', price: 20.00 }
        ],
        foods: [
          // Gourmet Burgers
          {
            name: 'Classic Bacon Cheeseburger',
            description: '150g prime beef patty, melted cheddar cheese, smoked crispy bacon, fresh lettuce, tomato, and special sauce.',
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Size', price: 280.00 }, { name: 'Double Beef Patty', price: 420.00 }],
            catName: 'Gourmet Burgers'
          },
          {
            name: 'Spicy Jalapeno Fire Burger',
            description: 'Flayed beef patty, hot pepper jack cheese, house pickled jalapenos, spicy red onion, and fire chili sauce.',
            image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Size', price: 290.00 }, { name: 'Double Patty Flame', price: 440.00 }],
            catName: 'Gourmet Burgers'
          },
          {
            name: 'Mushroom Swiss Gourmet Burger',
            description: 'Sautéed forest mushrooms, melted Swiss emmental cheese, garlic-herb butter, caramelized onion, and black truffle mayo.',
            image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Size', price: 320.00 }, { name: 'Double Patty Swiss', price: 460.00 }],
            catName: 'Gourmet Burgers'
          },
          {
            name: 'BBQ Smokey Onion Burger',
            description: 'Flame-roasted beef patty, thick sweet BBQ sauce glaze, crispy onion rings, cheddar cheese, and pickles.',
            image: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Size', price: 310.00 }, { name: 'Double Patty BBQ', price: 450.00 }],
            catName: 'Gourmet Burgers'
          },

          // Crispy Chicken
          {
            name: 'Spicy Zinger Chicken Burger',
            description: 'Juicy chicken breast filet dipped in buttermilk and double breaded, crispy fried, with spicy mayo and lettuce.',
            image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Single Zinger Filet', price: 260.00 }, { name: 'Double Stacked Zinger', price: 390.00 }],
            catName: 'Crispy Chicken'
          },
          {
            name: 'Buffalo Glazed Chicken Wings',
            description: 'Deep-fried chicken wings tossed in tangy cayenne pepper buffalo hot sauce, served with blue cheese celery dip.',
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '6 Pieces Wings', price: 240.00 }, { name: '12 Pieces Sharing', price: 450.00 }],
            catName: 'Crispy Chicken'
          },
          {
            name: 'Crispy Chicken Tenders',
            description: 'Seasoned breaded chicken breast strips fried to a crisp golden finish, served with honey mustard sauce dip.',
            image: 'https://images.unsplash.com/photo-1547584385-edd90b9ad431?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '4 Pieces Tenders', price: 190.00 }, { name: '8 Pieces Large Pack', price: 360.00 }],
            catName: 'Crispy Chicken'
          },
          {
            name: 'Honey Garlic Crispy Drumsticks',
            description: 'Golden fried chicken drumsticks glazed in sweet honey and toasted garlic butter sauce.',
            image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '3 Drumsticks Box', price: 220.00 }, { name: '6 Drumsticks Share', price: 410.00 }],
            catName: 'Crispy Chicken'
          },

          // Sides & Fries
          {
            name: 'French Golden Fries',
            description: 'Premium cut golden potatoes, salted and fried to crispy perfection.',
            image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Size Cup', price: 110.00 }, { name: 'Large Size Box', price: 170.00 }],
            catName: 'Sides & Fries'
          },
          {
            name: 'Loaded Cheese Fries',
            description: 'Crispy skin-on french fries smothered in melted cheddar cheese sauce, garlic mayo, and green chives.',
            image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Portion', price: 180.00 }, { name: 'Jumbo Sharing Portion', price: 290.00 }],
            catName: 'Sides & Fries'
          },
          {
            name: 'Crispy Onion Rings',
            description: 'Thick-cut sweet white onions, batter-dipped and rolled in panko breadcrumbs, fried till crunchy.',
            image: 'https://images.unsplash.com/photo-1547584385-edd90b9ad431?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Cup (8 Pcs)', price: 130.00 }, { name: 'Large Box (16 Pcs)', price: 230.00 }],
            catName: 'Sides & Fries'
          },
          {
            name: 'Garlic French Bread Toast',
            description: 'Toasted baguette slices brushed with fresh garlic butter, parsley sprig, and grated parmesan.',
            image: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '4 Toast Slices', price: 140.00 }, { name: '8 Toast Slices Cheese', price: 240.00 }],
            catName: 'Sides & Fries'
          },

          // Snacks & Bites
          {
            name: 'Golden Chicken Nuggets',
            description: 'Tempura-battered crispy chicken nuggets served with fresh sweet sour dipping sauce.',
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '6 Nuggets Box', price: 150.00 }, { name: '12 Nuggets Share', price: 280.00 }],
            catName: 'Snacks & Bites'
          },
          {
            name: 'Mozzarella Sticks Wrap',
            description: 'Melty mozzarella string cheese breaded in seasoned breadcrumbs and fried, with rich marinara dip.',
            image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '4 Mozzarella Sticks', price: 160.00 }, { name: '8 Mozzarella Sticks', price: 290.00 }],
            catName: 'Snacks & Bites'
          },
          {
            name: 'Hot Popcorn Chicken Cup',
            description: 'Bite-sized chicken nuggets seasoned with house hot spices, fried to a crisp snap.',
            image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Popcorn Cup', price: 170.00 }, { name: 'Large Popcorn Sharing', price: 290.00 }],
            catName: 'Snacks & Bites'
          },
          {
            name: 'Tortilla Cheese Nachos',
            description: 'Crunchy tortilla chips loaded with hot liquid cheddar cheese, sliced jalapeno peppers, and tomato salsa.',
            image: 'https://images.unsplash.com/photo-1547584385-edd90b9ad431?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Single Nacho Bowl', price: 190.00 }, { name: 'Double Loaded Nachos', price: 340.00 }],
            catName: 'Snacks & Bites'
          },

          // Beverages
          {
            name: 'Coca Cola Soft Can',
            description: 'Chilled refreshing classic Coca-Cola soda.',
            image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '250ml Can', price: 50.00 }, { name: '1 Liter Bottle', price: 100.00 }, { name: '2 Liter Family Bottle', price: 180.00 }],
            catName: 'Beverages'
          },
          {
            name: 'Sprite Lemon Lime Can',
            description: 'Chilled clear lemon-lime flavored refreshing soda drink.',
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '250ml Can', price: 50.00 }, { name: '1 Liter Bottle', price: 100.00 }, { name: '2 Liter Family Bottle', price: 180.00 }],
            catName: 'Beverages'
          },
          {
            name: 'Fanta Orange Soda Can',
            description: 'Sweet, bright, orange-flavored bubbly cold beverage drink.',
            image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '250ml Can', price: 50.00 }, { name: '1 Liter Bottle', price: 100.00 }],
            catName: 'Beverages'
          },
          {
            name: 'Pure Chilled Mineral Water',
            description: 'Fresh and clean filtered drinking mineral water.',
            image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '500ml Small Bottle', price: 25.00 }, { name: '1.5 Liter Large Bottle', price: 50.00 }],
            catName: 'Beverages'
          }
        ]
      },
      'Pizza & Italian': {
        menuCats: ['Wood-Fired Pizza', 'Fresh Pastas', 'Sides & Garlic Breads', 'Italian Desserts', 'Soft Drinks'],
        addons: [
          { name: 'Extra Buffalo Mozzarella', price: 90.00 },
          { name: 'Spicy Beef Pepperoni Slices', price: 80.00 },
          { name: 'Creamy Garlic Herb Dip', price: 25.00 }
        ],
        foods: [
          // Wood-Fired Pizza
          {
            name: 'Classic Pizza Margherita',
            description: 'Hand-stretched dough, rich San Marzano tomato sauce, fresh mozzarella, extra virgin olive oil, and fresh basil leaves.',
            image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Personal Size 8"', price: 380.00 }, { name: 'Medium Sharing 12"', price: 680.00 }, { name: 'Large Family 16"', price: 990.00 }],
            catName: 'Wood-Fired Pizza'
          },
          {
            name: 'Spicy Pepperoni Feast',
            description: 'Rich tomato sauce, double mozzarella, premium beef pepperoni slices, chili flakes, and a drizzle of hot honey.',
            image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Personal Size 8"', price: 450.00 }, { name: 'Medium Sharing 12"', price: 790.00 }, { name: 'Large Family 16"', price: 1190.00 }],
            catName: 'Wood-Fired Pizza'
          },
          {
            name: 'Garden Veggie Supreme Pizza',
            description: 'Loaded with capsicums, red onions, mushrooms, black olives, cherry tomatoes, and fresh mozzarella cheese.',
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Personal Size 8"', price: 360.00 }, { name: 'Medium Sharing 12"', price: 630.00 }, { name: 'Large Family 16"', price: 920.00 }],
            catName: 'Wood-Fired Pizza'
          },
          {
            name: 'Four Cheese (Quattro Formaggi)',
            description: 'White base woodfired pizza loaded with mozzarella, gorgonzola, parmesan, and ricotta dollops.',
            image: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Personal Size 8"', price: 420.00 }, { name: 'Medium Sharing 12"', price: 740.00 }, { name: 'Large Family 16"', price: 1090.00 }],
            catName: 'Wood-Fired Pizza'
          },

          // Fresh Pastas
          {
            name: 'Fettuccine Alfredo',
            description: 'Thick flat noodles tossed in a rich, creamy butter and aged parmesan cheese sauce, topped with grilled garlic chicken.',
            image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Bowl', price: 420.00 }, { name: 'Double Chicken Bowl', price: 540.00 }],
            catName: 'Fresh Pastas'
          },
          {
            name: 'Spaghetti Bolognese Beef',
            description: 'Al dente spaghetti tossed in a rich, slow-simmered minced beef, red wine, and tomato ragu sauce.',
            image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Bowl', price: 390.00 }, { name: 'Large Size Meatier', price: 510.00 }],
            catName: 'Fresh Pastas'
          },
          {
            name: 'Cheesy Baked Rigatoni',
            description: 'Tube pasta baked in rich marinara tomato sauce, packed with Italian sausage chunks, topped with melted mozzarella crust.',
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Baking Dish', price: 430.00 }, { name: 'Double Cheesy Portion', price: 550.00 }],
            catName: 'Fresh Pastas'
          },
          {
            name: 'Beef Lasagna Classico',
            description: 'Layers of flat sheet pasta, seasoned minced beef sauce, creamy white bechamel sauce, baked with parmesan.',
            image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Square Cut', price: 460.00 }, { name: 'Large Double Cut Share', price: 790.00 }],
            catName: 'Fresh Pastas'
          },

          // Sides & Garlic Breads
          {
            name: 'Garlic Butter Toast with Mozzarella',
            description: 'Oven baked French baguette slices loaded with garlic butter, dried oregano, and bubbling mozzarella.',
            image: 'https://images.unsplash.com/photo-1571066811602-716837d681de?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '4 Pcs Cheesy Toast', price: 180.00 }, { name: '8 Pcs Sharing Board', price: 320.00 }],
            catName: 'Sides & Garlic Breads'
          },
          {
            name: 'Tomato Garlic Bruschetta',
            description: 'Grilled crusty Italian bread rubbed with garlic, topped with marinated diced Roma tomatoes, olive oil and fresh basil.',
            image: 'https://images.unsplash.com/photo-1555072956-7758afb20e8f?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '3 Pieces Platter', price: 160.00 }, { name: '6 Pieces Sharing Plate', price: 290.00 }],
            catName: 'Sides & Garlic Breads'
          },
          {
            name: 'Caprese Salad Bowl',
            description: 'Sliced fresh buffalo mozzarella cheese, ripe tomatoes, sweet basil leaves, drizzled with thick aged balsamic glaze.',
            image: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Salad Bowl', price: 290.00 }, { name: 'Sharing Platter Size', price: 490.00 }],
            catName: 'Sides & Garlic Breads'
          },
          {
            name: 'Mozzarella Garlic Doughballs',
            description: 'Puffy woodfired pizza doughballs stuffed with garlic cheese spread, served with marinara dipping cup.',
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '6 Cheesy Doughballs', price: 190.00 }, { name: '12 Doughballs Sharing', price: 340.00 }],
            catName: 'Sides & Garlic Breads'
          },

          // Italian Desserts
          {
            name: 'Classic Espresso Tiramisu',
            description: 'Coffee-dipped Italian ladyfinger biscuits layered with whipped sweet mascarpone cream and dusted with dark cocoa.',
            image: 'https://images.unsplash.com/photo-1571066811602-716837d681de?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Single Cup Dessert', price: 240.00 }, { name: 'Double Cup Sharing', price: 420.00 }],
            catName: 'Italian Desserts'
          },
          {
            name: 'Vanilla Bean Panna Cotta',
            description: 'Creamy cold Italian pudding set with gelatin, flavored with vanilla pod, topped with fresh raspberry compote.',
            image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Single Cup Panna Cotta', price: 190.00 }],
            catName: 'Italian Desserts'
          },
          {
            name: 'Sweet Chocolate Cannoli',
            description: 'Crispy fried pastry tube shells filled with sweet cream ricotta whip, dark chocolate chips, and orange zest.',
            image: 'https://images.unsplash.com/photo-1555072956-7758afb20e8f?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '2 Cannoli Plate', price: 180.00 }, { name: '4 Cannoli Board', price: 320.00 }],
            catName: 'Italian Desserts'
          },
          {
            name: 'Gourmet Gelato Cup',
            description: 'Creamy, dense Italian ice cream. Choose between Madagascar Vanilla, Dark Chocolate, or Sicilian Pistachio.',
            image: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Double Scoop Cup', price: 210.00 }, { name: 'Triple Scoop Cup', price: 290.00 }],
            catName: 'Italian Desserts'
          },

          // Soft Drinks
          {
            name: 'Coca Cola Soft Can',
            description: 'Chilled refreshing classic Coca-Cola soda.',
            image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '250ml Can', price: 50.00 }, { name: '1 Liter Bottle', price: 100.00 }],
            catName: 'Soft Drinks'
          },
          {
            name: 'Sprite Lemon Lime Can',
            description: 'Chilled clear lemon-lime flavored refreshing soda drink.',
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '250ml Can', price: 50.00 }, { name: '1 Liter Bottle', price: 100.00 }],
            catName: 'Soft Drinks'
          }
        ]
      },
      'Asian & Noodles': {
        menuCats: ['Ramen & Bowls', 'Wok Stir-Fries', 'Appetizers & Wontons', 'Sushi Rolls', 'Asiatic Teas'],
        addons: [
          { name: 'Marinated Soft Ramen Egg (Ajitama)', price: 40.00 },
          { name: 'Extra Pork/Chicken Chashu Slices', price: 120.00 },
          { name: 'House Chili Garlic Oil Drizzle', price: 15.00 }
        ],
        foods: [
          // Ramen & Bowls
          {
            name: 'Spicy Miso Tonkotsu Ramen',
            description: 'Slow-simmered rich broth, miso paste blend, fresh noodles, tender chashu pork slices, soft-boiled egg, nori sheet, and scallions.',
            image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Mild Regular Broth', price: 460.00 }, { name: 'Spicy level 3 Broth', price: 490.00 }],
            catName: 'Ramen & Bowls'
          },
          {
            name: 'Shoyu Chicken Ramen Bowl',
            description: 'Clear chicken soy-sauce soup base, fresh ramen noodles, tender sliced grilled chicken breast, bamboo shoots, egg, and nori.',
            image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Soy Bowl', price: 420.00 }, { name: 'Large Soy Bowl Double Meat', price: 540.00 }],
            catName: 'Ramen & Bowls'
          },
          {
            name: 'Traditional Vietnamese Beef Pho',
            description: 'Clear aromatic beef bone broth, flat rice noodles, paper thin raw beef brisket slices cooked instantly, fresh herbs, lime, sprouts.',
            image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Pho Bowl', price: 480.00 }, { name: 'Large Double Meat Pho', price: 590.00 }],
            catName: 'Ramen & Bowls'
          },
          {
            name: 'Thai Green Chicken Curry Bowl',
            description: 'Rich coconut milk curry flavored with green chili paste, lemongrass, tender chicken slices, eggplant, sweet basil, jasmine rice.',
            image: 'https://images.unsplash.com/photo-1540648639573-8c848de23f0a?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular curry bowl with rice', price: 380.00 }, { name: 'Jumbo double curry bowl', price: 520.00 }],
            catName: 'Ramen & Bowls'
          },

          // Wok Stir-Fries
          {
            name: 'Traditional Wok Pad Thai',
            description: 'Stir-fried flat rice noodles in tangy tamarind sauce with egg, fresh bean sprouts, green chives, and toasted peanuts.',
            image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Tofu & Vegetable Option', price: 340.00 }, { name: 'Crispy Garlic Shrimp Option', price: 480.00 }],
            catName: 'Wok Stir-Fries'
          },
          {
            name: 'Chicken Chow Mein Noodles',
            description: 'Stir-fried yellow egg noodles with shredded chicken, white cabbage, carrots, onion, in dark savory oyster soy sauce.',
            image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Chow Bowl', price: 290.00 }, { name: 'Jumbo Sharing Wok Size', price: 490.00 }],
            catName: 'Wok Stir-Fries'
          },
          {
            name: 'Szechuan Chili Beef Fried Rice',
            description: 'Fried jasmine rice tossed in hot Sichuan chili oil, sweet peas, eggs, carrot cubes, and tender sliced beef strips.',
            image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Portion', price: 320.00 }, { name: 'Large Box Sharing', price: 490.00 }],
            catName: 'Wok Stir-Fries'
          },
          {
            name: 'Sweet & Sour Crispy Chicken Rice',
            description: 'Battered crispy fried chicken chunks tossed in sweet pineapple red sauce with green peppers, served with white jasmine rice.',
            image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Standard Bento Plate', price: 340.00 }, { name: 'Double Entree Size Bowl', price: 490.00 }],
            catName: 'Wok Stir-Fries'
          },

          // Appetizers & Wontons
          {
            name: 'Steamed Chicken Momo',
            description: 'Hand-folded tender momo dumplings filled with minced spiced chicken, steamed hot, served with sweet tomato-sesame chutney.',
            image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '6 Momo Dumplings Box', price: 180.00 }, { name: '12 Momo Dumplings Box', price: 320.00 }],
            catName: 'Appetizers & Wontons'
          },
          {
            name: 'Pan-Fried Pork Gyoza Dumplings',
            description: 'Traditional Japanese dumplings filled with seasoned pork and chives, crispy pan-fried on one side, with soy-ginger dip.',
            image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '6 Gyoza Box', price: 210.00 }, { name: '12 Gyoza Family Pack', price: 380.00 }],
            catName: 'Appetizers & Wontons'
          },
          {
            name: 'Crispy Veggie Spring Rolls',
            description: 'Crispy deep-fried wrapper skins filled with sautéed glass noodles, cabbage, carrots, and sweet chili plum sauce.',
            image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '4 Crispy Rolls Plate', price: 130.00 }, { name: '8 Crispy Rolls Platter', price: 240.00 }],
            catName: 'Appetizers & Wontons'
          },
          {
            name: 'Spicy Szechuan Chili Oil Wontons',
            description: 'Boiled wonton dumplings stuffed with minced shrimp and pork, submerged in hot garlic soy chili oil sauce.',
            image: 'https://images.unsplash.com/photo-1540648639573-8c848de23f0a?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '6 Spicy Wontons Cup', price: 260.00 }, { name: '12 Spicy Wontons Bowl', price: 460.00 }],
            catName: 'Appetizers & Wontons'
          },

          // Sushi Rolls
          {
            name: 'California Sushi Roll',
            description: 'Inside-out sushi rolls wrapped in sesame, stuffed with crab sticks, avocado chunks, fresh cucumber, and sweet mayo.',
            image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '4 Sushi Pieces Plate', price: 220.00 }, { name: '8 Sushi Pieces Platter', price: 390.00 }],
            catName: 'Sushi Rolls'
          },
          {
            name: 'Tempura Crunchy Shrimp Roll',
            description: 'Crispy fried tempura shrimp, cucumber sticks, rolled with rice, covered in crunchy tempura flakes and unagi sweet eel sauce.',
            image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '4 Crunchy Pieces Plate', price: 260.00 }, { name: '8 Crunchy Pieces Board', price: 480.00 }],
            catName: 'Sushi Rolls'
          },
          {
            name: 'Spicy Salmon & Avocado Maki',
            description: 'Fresh Norwegian raw salmon sashimi, creamy avocado chunks, hot sriracha mayo sauce, rolled in seasoned sushi rice.',
            image: 'https://images.unsplash.com/photo-1540648639573-8c848de23f0a?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '4 Salmon Pieces Plate', price: 280.00 }, { name: '8 Salmon Pieces Board', price: 520.00 }],
            catName: 'Sushi Rolls'
          },
          {
            name: 'Spicy Tuna Cucumber Roll',
            description: 'Finely chopped yellowfin raw tuna, spicy mayo sauce, crisp cucumber slices, rolled in sushi seaweed nori sheets.',
            image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '4 Tuna Pieces Plate', price: 260.00 }, { name: '8 Tuna Pieces Board', price: 480.00 }],
            catName: 'Sushi Rolls'
          }
        ]
      },
      'Desserts & Bakery': {
        menuCats: ['Decadent Cakes', 'Gourmet Donuts', 'Macarons & Cupcakes', 'Bakery Croissants', 'Ice Creams'],
        addons: [
          { name: 'Extra Sweet Whipped Cream Cup', price: 30.00 },
          { name: 'Hot Fudge Chocolate Syrup Drizzle', price: 40.00 },
          { name: 'Colorful Sugar Sprinkles Scoop', price: 15.00 }
        ],
        foods: [
          // Decadent Cakes
          {
            name: 'Fudge Chocolate Cake Slice',
            description: 'Moist multi-layered chocolate sponge covered with rich milk chocolate ganache and chocolate curls.',
            image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Single Slice', price: 180.00 }, { name: 'Half KG Small Cake', price: 650.00 }, { name: 'One KG Whole Cake', price: 1200.00 }],
            catName: 'Decadent Cakes'
          },
          {
            name: 'New York Cream Cheesecake Slice',
            description: 'Rich, dense, and creamy cheesecake filling baked on sweet buttery graham cracker crust, topped with strawberry jam.',
            image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Single Slice', price: 220.00 }, { name: 'Half KG Small Cake', price: 780.00 }],
            catName: 'Decadent Cakes'
          },
          {
            name: 'Black Forest Cherry Cake',
            description: 'Chocolate sponge cake layers soaked in cherry juice, filled with fresh sweet cherries, whipped cream and chocolate flakes.',
            image: 'https://images.unsplash.com/photo-1614707267537-b85acf00c4b8?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Single Slice', price: 160.00 }, { name: 'Half KG Small Cake', price: 580.00 }],
            catName: 'Decadent Cakes'
          },
          {
            name: 'Red Velvet Cream Cheese Cake',
            description: 'Cocoa-infused bright red sponge layers filled and frosted with sweet vanilla bean cream cheese frosting.',
            image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Single Slice', price: 190.00 }, { name: 'Half KG Small Cake', price: 680.00 }],
            catName: 'Decadent Cakes'
          },

          // Gourmet Donuts
          {
            name: 'Chocolate Glazed Yeast Donut',
            description: 'Fluffy yeast donut fried golden, covered in sweet warm milk chocolate fudge glaze.',
            image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Single Donut', price: 85.00 }, { name: 'Box of 4 Donuts', price: 310.00 }, { name: 'Box of 6 Party Pack', price: 450.00 }],
            catName: 'Gourmet Donuts'
          },
          {
            name: 'Boston Cream Custard Donut',
            description: 'Puffy donut shell stuffed with sweet vanilla custard cream, glazed with rich dark chocolate fudge.',
            image: 'https://images.unsplash.com/photo-1614707267537-b85acf00c4b8?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Single Donut', price: 95.00 }, { name: 'Box of 4 Donuts', price: 350.00 }],
            catName: 'Gourmet Donuts'
          },
          {
            name: 'Strawberry Jelly Sugared Donut',
            description: 'Classic donut shell rolled in powdered sugar, filled with sweet liquid strawberry preserve jelly.',
            image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Single Donut', price: 90.00 }, { name: 'Box of 4 Donuts', price: 330.00 }],
            catName: 'Gourmet Donuts'
          },
          {
            name: 'Caramel Crunch Glazed Donut',
            description: 'Golden donut ring covered in sweet caramel glaze sauce, topped with crushed almond nut pieces.',
            image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Single Donut', price: 95.00 }, { name: 'Box of 4 Donuts', price: 350.00 }],
            catName: 'Gourmet Donuts'
          },

          // Macarons & Cupcakes
          {
            name: 'Assorted French Macarons Box',
            description: 'French meringue cookies with ganache filling. Box features Vanilla, Chocolate, Raspberry, Pistachio, and Lemon.',
            image: 'https://images.unsplash.com/photo-1551849673-fc1458c090a2?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Box of 6 Macarons', price: 380.00 }, { name: 'Box of 12 Macarons', price: 720.00 }],
            catName: 'Macarons & Cupcakes'
          },
          {
            name: 'Vanilla Buttercream Cupcake',
            description: 'Fluffy yellow vanilla cupcake sponge topped with a rich vanilla buttercream swirl and sugar pearl.',
            image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Single Cupcake', price: 90.00 }, { name: 'Box of 4 Cupcakes', price: 320.00 }],
            catName: 'Macarons & Cupcakes'
          },
          {
            name: 'Cream Cheese Red Velvet Cupcake',
            description: 'Cocoa-infused bright red sponge cupcake topped with a sweet cream cheese icing swirl.',
            image: 'https://images.unsplash.com/photo-1614707267537-b85acf00c4b8?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Single Cupcake', price: 95.00 }, { name: 'Box of 4 Cupcakes', price: 350.00 }],
            catName: 'Macarons & Cupcakes'
          },
          {
            name: 'Chocolate Fudge Decadent Cupcake',
            description: 'Rich dark chocolate sponge cupcake topped with chocolate fudge buttercream and dark chocolate chips.',
            image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Single Cupcake', price: 95.00 }, { name: 'Box of 4 Cupcakes', price: 350.00 }],
            catName: 'Macarons & Cupcakes'
          },

          // Bakery Croissants
          {
            name: 'Pure Butter Croissant',
            description: 'Flaky, golden-baked layered French puff pastry with pure cream butter aroma.',
            image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '1 Piece Pastry', price: 120.00 }, { name: '3 Pieces Sharing Pack', price: 320.00 }],
            catName: 'Bakery Croissants'
          },
          {
            name: 'Chocolate Pain au Chocolat',
            description: 'Layered buttery puff pastry dough rolled with two strips of rich semi-sweet dark Belgian chocolate.',
            image: 'https://images.unsplash.com/photo-1551849673-fc1458c090a2?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '1 Piece Pastry', price: 140.00 }, { name: '3 Pieces Sharing Pack', price: 380.00 }],
            catName: 'Bakery Croissants'
          },
          {
            name: 'Almond Cream Baked Croissant',
            description: 'Butter croissant filled with sweet almond frangipane cream, topped with sliced almonds and powdered sugar.',
            image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '1 Piece Pastry', price: 160.00 }, { name: '3 Pieces Sharing Pack', price: 440.00 }],
            catName: 'Bakery Croissants'
          },
          {
            name: 'Cinnamon Swirl Danish Roll',
            description: 'Laminated pastry dough rolled with brown sugar and sweet cinnamon glaze, drizzled with icing sugar.',
            image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '1 Piece Pastry', price: 130.00 }, { name: '3 Pieces Sharing Pack', price: 350.00 }],
            catName: 'Bakery Croissants'
          }
        ]
      },
      'Beverages & Cafe': {
        menuCats: ['Hot Espressos', 'Iced Blends', 'Fruit Teas & Bobas', 'Cafe Pastries', 'Refreshing Coolers'],
        addons: [
          { name: 'Extra Sweet Caramel Syrup Drizzle', price: 30.00 },
          { name: 'Organic Tapioca Boba Pearls', price: 40.00 },
          { name: 'Extra Shot Espresso roast', price: 50.00 }
        ],
        foods: [
          // Hot Espressos
          {
            name: 'Classic Cafe Latte Roast',
            description: 'Bold dark espresso shot mixed with fresh steamed milk, topped with a thin layer of velvety milk foam.',
            image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Size 12oz', price: 180.00 }, { name: 'Large Size 16oz', price: 240.00 }],
            catName: 'Hot Espressos'
          },
          {
            name: 'Foamy Cappuccino Cream',
            description: 'Rich dark espresso shot, equal parts hot steamed milk and thick bubbly aerated milk foam layer.',
            image: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Size 12oz', price: 180.00 }, { name: 'Large Size 16oz', price: 240.00 }],
            catName: 'Hot Espressos'
          },
          {
            name: 'Velvety Flat White Coffee',
            description: 'Double ristretto espresso shot blended with hot velvet microfoamed milk for a strong, smooth coffee cup.',
            image: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Size 12oz', price: 190.00 }, { name: 'Large Size 16oz', price: 250.00 }],
            catName: 'Hot Espressos'
          },
          {
            name: 'Robust Hot Americano Coffee',
            description: 'Premium double espresso shots diluted with hot pure water, preserving the rich crema and body.',
            image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Size 12oz', price: 140.00 }, { name: 'Large Size 16oz', price: 190.00 }],
            catName: 'Hot Espressos'
          },

          // Iced Blends
          {
            name: 'Iced Caramel Macchiato',
            description: 'Bold espresso shot poured over fresh milk, ice cubes, vanilla syrup, finished with buttery caramel drizzle.',
            image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Size 12oz', price: 220.00 }, { name: 'Large Size 16oz', price: 290.00 }],
            catName: 'Iced Blends'
          },
          {
            name: 'Chilled Ice Mocha Frappe',
            description: 'Dark roasted espresso shots blended with ice, cocoa fudge powder, milk, topped with whipped cream spray.',
            image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Size 12oz', price: 240.00 }, { name: 'Large Size 16oz', price: 310.00 }],
            catName: 'Iced Blends'
          },
          {
            name: 'Java Chip Ice Blended Frappe',
            description: 'Sweet espresso, milk, chocolate chips, ice, blended together, finished with chocolate sauce drizzle.',
            image: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Size 12oz', price: 250.00 }, { name: 'Large Size 16oz', price: 320.00 }],
            catName: 'Iced Blends'
          },
          {
            name: 'Creamy Vanilla Bean Frappe',
            description: 'White base creamy vanilla bean paste, fresh milk, and ice blended till smooth, with whipped cream cream.',
            image: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Size 12oz', price: 220.00 }, { name: 'Large Size 16oz', price: 290.00 }],
            catName: 'Iced Blends'
          },

          // Fruit Teas & Bobas
          {
            name: 'Brown Sugar Pearl Milk Tea',
            description: 'Rich assam black tea brewed with fresh milk, infused with house brown sugar syrup and chewy boba tapioca pearls.',
            image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Size 12oz', price: 230.00 }, { name: 'Large Size 16oz', price: 310.00 }],
            catName: 'Fruit Teas & Bobas'
          },
          {
            name: 'Uji Matcha Green Tea Latte',
            description: 'Pure organic Japanese matcha green tea whisked with warm water, mixed with sweet milk and ice cubes.',
            image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Size 12oz', price: 240.00 }, { name: 'Large Size 16oz', price: 320.00 }],
            catName: 'Fruit Teas & Bobas'
          },
          {
            name: 'Sweet Taro Bubble Milk Tea',
            description: 'Sweet purple taro root powder blended with milk, creamer, ice, served with tapioca boba pearls.',
            image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Size 12oz', price: 230.00 }, { name: 'Large Size 16oz', price: 310.00 }],
            catName: 'Fruit Teas & Bobas'
          },
          {
            name: 'Passion Fruit Jasmine Green Tea',
            description: 'Chilled brewed jasmine green tea shaken with fresh passion fruit syrup, lime slices and popping boba.',
            image: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: 'Regular Size 12oz', price: 190.00 }, { name: 'Large Size 16oz', price: 260.00 }],
            catName: 'Fruit Teas & Bobas'
          },

          // Cafe Pastries
          {
            name: 'Sweet Blueberry Muffin Cake',
            description: 'Soft and moist golden bakery muffin loaded with sweet wild blueberries, topped with sugar streusel crumble.',
            image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '1 Piece Muffin', price: 120.00 }, { name: '2 Pieces Share Pack', price: 220.00 }],
            catName: 'Cafe Pastries'
          },
          {
            name: 'Rich Chocolate Chip Muffin Cake',
            description: 'Fluffy cocoa muffin cake loaded with dark chocolate chips and a melted chocolate fudge core.',
            image: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '1 Piece Muffin', price: 120.00 }, { name: '2 Pieces Share Pack', price: 220.00 }],
            catName: 'Cafe Pastries'
          },
          {
            name: 'Oatmeal Honey Raisin Cookie',
            description: 'Chewy sweet cookie made with whole grain rolled oats, organic honey, and sweet golden raisins.',
            image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '2 Cookies Pack', price: 110.00 }, { name: '4 Cookies Sharing Pack', price: 200.00 }],
            catName: 'Cafe Pastries'
          },
          {
            name: 'Decadent Chocolate Fudge Brownie',
            description: 'Thick, dense, and chewy dark chocolate brownie baked with real cocoa and chocolate chunks.',
            image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80',
            variants: [{ name: '1 Piece Brownie', price: 130.00 }, { name: '2 Pieces Share Pack', price: 240.00 }],
            catName: 'Cafe Pastries'
          }
        ]
      }
    };

    // 6. Iterate and seed all 30 restaurants programmatically
    console.log(`Seeding ${restaurantTemplates.length} premium restaurants...`);
    
    // Distribute zones evenly among the 30 restaurants
    const zoneKeys = Object.keys(zoneMap); // ['Dhanmondi', 'Gulshan', 'Banani', 'Uttara']

    for (let i = 0; i < restaurantTemplates.length; i++) {
      const template = restaurantTemplates[i];
      const restIndex = i + 1;
      
      console.log(`[${restIndex}/30] Seeding Restaurant: ${template.name}...`);

      // 6a. Create unique merchant user
      const merchantEmail = `merchant${restIndex}@demo.com`;
      const merchantUser = await User.create({
        name: `Merchant ${restIndex} (${template.name})`,
        email: merchantEmail,
        phone: `+880175${String(restIndex).padStart(7, '0')}`,
        password: commonHashedPassword,
        role: UserRole.RESTAURANT,
        status: UserStatus.ACTIVE
      });

      // Generate random rating between 4.3 and 4.9
      const randomRating = (4.3 + Math.random() * 0.6).toFixed(1);

      const primaryZoneName = zoneKeys[i % zoneKeys.length];
      const primaryZoneObj = deliveryZones.find(z => z.name === primaryZoneName);
      const zoneLat = parseFloat(primaryZoneObj.latitude);
      const zoneLng = parseFloat(primaryZoneObj.longitude);
      
      // Small offset (approx 0.5-1km) from zone center
      const latOffset = (Math.random() - 0.5) * 0.01;
      const lngOffset = (Math.random() - 0.5) * 0.01;

      // 6b. Create Restaurant record
      const restaurant = await Restaurant.create({
        userId: merchantUser.id,
        name: template.name,
        slug: slugify(`${template.name}-${restIndex}`), // ensure slug uniqueness
        description: template.description,
        address: `${template.name} Outlet Road, ${primaryZoneName}, Dhaka`,
        phone: merchantUser.phone,
        latitude: zoneLat + latOffset,
        longitude: zoneLng + lngOffset,
        openingTime: '11:00:00',
        closingTime: '23:30:00',
        isOpen: true,
        status: RestaurantStatus.ACTIVE,
        banner: template.banner,
        logo: template.logo,
        rating: randomRating
      });

      // 6c. Link to Delivery Zone (assign to 1 or 2 zones based on index)
      await RestaurantDeliveryZone.create({
        restaurantId: restaurant.id,
        deliveryZoneId: zoneMap[primaryZoneName]
      });

      // Also assign a secondary adjacent zone for even indexes to provide overlapping deliveries
      if (i % 2 === 0) {
        const secondaryZoneName = zoneKeys[(i + 1) % zoneKeys.length];
        await RestaurantDeliveryZone.create({
          restaurantId: restaurant.id,
          deliveryZoneId: zoneMap[secondaryZoneName]
        });
      }

      // 6d. Load menu templates for this platform category
      const menuConfig = menuTemplates[template.category];
      const platformCategoryId = categoryMap[template.category];

      // 6e. Seed Restaurant Addons and keep reference
      const seededAddons = [];
      for (const add of menuConfig.addons) {
        const addon = await RestaurantAddon.create({
          name: add.name,
          slug: slugify(`${add.name}-${restaurant.id}`), // ensure addon slug uniqueness
          price: add.price,
          restaurantId: restaurant.id
        });
        seededAddons.push(addon);
      }

      // 6f. Seed Restaurant Menu Categories (4 to 5 categories)
      const seededMenuCats = {};
      for (const catName of menuConfig.menuCats) {
        const menuCategory = await RestaurantCategory.create({
          name: catName,
          slug: slugify(`${catName}-${restaurant.id}`), // ensure category slug uniqueness
          restaurantId: restaurant.id,
          platformCategoryId: platformCategoryId,
          status: ActiveStatus.ACTIVE
        });
        seededMenuCats[catName] = menuCategory.id;
      }

      // 6g. Seed Food items (4 to 6 items per category)
      for (const foodInfo of menuConfig.foods) {
        const food = await Food.create({
          name: foodInfo.name,
          slug: slugify(`${foodInfo.name}-${restaurant.id}`), // ensure food slug uniqueness
          description: foodInfo.description,
          image: foodInfo.image,
          restaurantId: restaurant.id,
          restaurantCategoryId: seededMenuCats[foodInfo.catName],
          platformCategoryId: platformCategoryId,
          status: 'ACTIVE'
        });

        // Seed Food Variants
        for (const variantInfo of foodInfo.variants) {
          await FoodVariant.create({
            name: variantInfo.name,
            price: variantInfo.price,
            foodId: food.id
          });
        }

        // Link all Restaurant Addons to this Food item
        for (const addon of seededAddons) {
          await FoodAddon.create({
            foodId: food.id,
            addonId: addon.id
          });
        }
      }
    }

    console.log('\n======================================================');
    console.log('Database seeding successfully finished!');
    console.log(`Seeded exactly 30 Restaurants with unique menus, variants, and addons.`);
    console.log(`Admin Credentials: bitespeed@gmail.com / 123456`);
    console.log(`Merchant Credentials range: merchant1@demo.com to merchant30@demo.com (Password: password123)`);
    console.log('======================================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during database seeding:', error);
    process.exit(1);
  }
};

seed();
