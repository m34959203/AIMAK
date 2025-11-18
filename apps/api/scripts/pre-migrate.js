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

  // Try to mark the known failed migration as rolled back
  try {
    console.log('⚠️  Attempting to resolve migration 20251118000000_init...');
    await execAsync('npx prisma migrate resolve --rolled-back 20251118000000_init', {
      cwd: __dirname + '/..',
    });
    console.log('✅ Migration marked as rolled back successfully');
    return;
  } catch (resolveError) {
    console.log('⚠️  Prisma migrate resolve failed, trying direct database cleanup...');
  }

  // If prisma migrate resolve fails, try direct SQL approach
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not found, skipping database cleanup');
    console.log('ℹ️  Migration may still fail - manual intervention may be required');
    return;
  }

  try {
    // Use psql to directly delete the failed migration record
    const deleteCommand = `psql "${process.env.DATABASE_URL}" -c "DELETE FROM _prisma_migrations WHERE migration_name = '20251118000000_init' AND finished_at IS NULL;"`;

    await execAsync(deleteCommand);
    console.log('✅ Failed migration record removed from database');
  } catch (dbError) {
    console.log('⚠️  Could not clean failed migration from database');
    console.log('ℹ️  Error:', dbError.message);
    console.log('ℹ️  Deployment may fail - manual database cleanup may be required');
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
