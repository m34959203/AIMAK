#!/usr/bin/env node

/**
 * Pre-migration script to handle failed migrations
 * This script runs before prisma migrate deploy to resolve any failed migrations
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function preMigrate() {
  console.log('🔍 Resolving failed migrations...');

  // List of known problematic migrations to clean up
  const problematicMigrations = [
    '20251118000000_init',
    '20251121165811_remove_year_month_description_fields'
  ];

  // If prisma migrate resolve fails, try direct SQL approach
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not found, skipping database cleanup');
    console.log('ℹ️  Migration may still fail - manual intervention may be required');
    return;
  }

  try {
    // Use psql to directly delete ALL failed migration records
    const deleteCommand = `psql "${process.env.DATABASE_URL}" -c "DELETE FROM _prisma_migrations WHERE finished_at IS NULL OR (migration_name IN ('${problematicMigrations.join("','")}'));"`;

    await execAsync(deleteCommand);
    console.log('✅ Failed migration records removed from database');
  } catch (dbError) {
    console.log('⚠️  Could not clean failed migrations from database');
    console.log('ℹ️  Error:', dbError.message);

    // Try one by one with prisma migrate resolve
    for (const migration of problematicMigrations) {
      try {
        console.log(`⚠️  Attempting to resolve migration ${migration}...`);
        await execAsync(`npx prisma migrate resolve --rolled-back ${migration}`, {
          cwd: __dirname + '/..',
        });
        console.log(`✅ Migration ${migration} marked as rolled back`);
      } catch (resolveError) {
        console.log(`⚠️  Could not resolve ${migration}`);
      }
    }
  }
}

preMigrate()
  .then(() => {
    console.log('✅ Pre-migration check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Pre-migration check failed:', error);
    process.exit(1);
  });
