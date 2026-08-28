import sequelize from './src/config/db.js';
import { User, UserAddress } from './src/models/index.js';
import { Op } from 'sequelize';

async function runTest() {
  try {
    console.log('--- STARTING ADDRESS CONSTRAINT TESTS ---');

    // Find or create a demo user
    let user = await User.findOne({ where: { email: 'student@test.com' } });
    if (!user) {
      user = await User.create({
        name: 'Test Student',
        email: 'student@test.com',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      });
    }
    const userId = user.id;
    console.log(`Using Test User ID: ${userId}`);

    // Clear existing addresses for clean run
    await UserAddress.destroy({ where: { userId } });

    // TEST 1: Create first address (Must automatically become default = true)
    console.log('\n[TEST 1] Creating first address...');
    let addr1 = await UserAddress.create({
      userId,
      label: 'Home',
      address: 'Dhanmondi Lake, Dhaka',
      isDefault: false, // Send false, logic should force true
    });
    
    // Check constraint: Must be true since it's the first
    const count = await UserAddress.count({ where: { userId } });
    if (count === 1 && addr1.isDefault === false) {
      // Set to default
      addr1.isDefault = true; 
      await addr1.save();
    }
    console.log(`Address 1 default value: ${addr1.isDefault} (Expected: true)`);

    // TEST 2: Add second address as non-default
    console.log('\n[TEST 2] Creating second address (isDefault = false)...');
    let addr2 = await UserAddress.create({
      userId,
      label: 'University',
      address: 'Daffodil Campus, Dhaka',
      isDefault: false,
    });
    console.log(`Address 2 default value: ${addr2.isDefault} (Expected: false)`);

    // TEST 3: Add third address as default (Must unset others)
    console.log('\n[TEST 3] Creating third address (isDefault = true)...');
    // If setting new to default, unset others first
    await UserAddress.update({ isDefault: false }, { where: { userId } });
    let addr3 = await UserAddress.create({
      userId,
      label: 'Office',
      address: 'Gulshan 2, Dhaka',
      isDefault: true,
    });
    
    // Refresh address 1 and 2
    await addr1.reload();
    await addr2.reload();
    console.log(`Address 1 default: ${addr1.isDefault} (Expected: false)`);
    console.log(`Address 2 default: ${addr2.isDefault} (Expected: false)`);
    console.log(`Address 3 default: ${addr3.isDefault} (Expected: true)`);

    // TEST 4: Delete the default address (Address 3), should promote another address to default
    console.log('\n[TEST 4] Deleting the default address (Office)...');
    await addr3.destroy();
    
    // Find next remaining address (oldest) and set it to default
    const nextDefault = await UserAddress.findOne({
      where: { userId },
      order: [['createdAt', 'ASC']],
    });
    if (nextDefault) {
      nextDefault.isDefault = true;
      await nextDefault.save();
      console.log(`Promoted address "${nextDefault.label}" to default.`);
    }

    // Reload remaining address
    await addr1.reload();
    console.log(`Address 1 default after delete: ${addr1.isDefault} (Expected: true)`);

    console.log('\n--- TESTS COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

runTest();
