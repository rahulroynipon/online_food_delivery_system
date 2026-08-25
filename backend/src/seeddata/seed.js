import sequelize from '../config/db.js';
import { User, PlatformCategory } from '../models/index.js';
import { UserRole, UserStatus, ActiveStatus } from '../enums/index.js';
import { configureAssociations } from '../utils/syncModels.js';
import { hashPassword } from '../utils/hash.js';
import { slugify } from '../utils/slugify.js';
import { ensureDatabaseExists } from '../utils/ensureDb.js';

const seed = async () => {
  try {
    // Ensure database exists before seeding
    await ensureDatabaseExists();

    console.log('Connecting to database for seeding...');
    configureAssociations(); // Ensure foreign key constraints and relations are configured
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // 1. Seed Default Admin User
    const adminEmail = 'admin@fooddelivery.com';
    const adminExists = await User.findOne({ where: { email: adminEmail } });

    if (!adminExists) {
      console.log('Seeding default system admin user...');
      const hashedPassword = await hashPassword('admin123');

      await User.create({
        name: 'System Admin',
        email: adminEmail,
        phone: '+15550199',
        password: hashedPassword,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });
      console.log('System Admin user seeded successfully.');
      console.log('Credentials: admin@fooddelivery.com / admin123');
    } else {
      console.log('System Admin user already exists. Skipping...');
    }

    // 2. Seed Default Platform Categories
    const categoriesCount = await PlatformCategory.count();
    if (categoriesCount === 0) {
      console.log('Seeding default platform categories...');
      const defaultCategories = [
        { name: 'Burgers & Fast Food', slug: slugify('Burgers & Fast Food'), image: 'uploads/categories/burgers.png', status: ActiveStatus.ACTIVE },
        { name: 'Pizza & Italian', slug: slugify('Pizza & Italian'), image: 'uploads/categories/pizza.png', status: ActiveStatus.ACTIVE },
        { name: 'Asian & Noodles', slug: slugify('Asian & Noodles'), image: 'uploads/categories/asian.png', status: ActiveStatus.ACTIVE },
        { name: 'Desserts & Ice Cream', slug: slugify('Desserts & Ice Cream'), image: 'uploads/categories/dessert.png', status: ActiveStatus.ACTIVE },
        { name: 'Beverages & Coffee', slug: slugify('Beverages & Coffee'), image: 'uploads/categories/drinks.png', status: ActiveStatus.ACTIVE },
        { name: 'Healthy & Salads', slug: slugify('Healthy & Salads'), image: 'uploads/categories/healthy.png', status: ActiveStatus.ACTIVE },
      ];
      await PlatformCategory.bulkCreate(defaultCategories);
      console.log('Default platform categories seeded successfully.');
    } else {
      console.log('Platform categories already exist. Skipping...');
    }

    console.log('Seeding script completed.');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during database seeding:', error);
    process.exit(1);
  }
};

seed();
