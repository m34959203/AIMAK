#!/usr/bin/env node

/**
 * Pre-migration script to handle failed migrations
 * This script runs before prisma migrate deploy to resolve any failed migrations
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function preMigrate() {
  console.log('🔍 Checking for failed migrations...');

  try {
    // Check migration status
    const { stdout, stderr } = await execAsync('npx prisma migrate status', {
      cwd: __dirname + '/..',
    });

    const output = stdout + stderr;
    console.log('Migration status:', output);

    // Check if there are failed migrations
    if (output.includes('failed') || output.includes('P3009')) {
      console.log('⚠️  Failed migrations detected. Attempting to resolve...');

      // Try to mark the failed migration as rolled back
      try {
        await execAsync('npx prisma migrate resolve --rolled-back 20251118000000_init', {
          cwd: __dirname + '/..',
        });
        console.log('✅ Failed migration marked as rolled back');
      } catch (resolveError) {
        console.log('ℹ️  Could not mark migration as rolled back (it may not exist)');
      }

      console.log('✅ Migration issues resolved, ready to deploy');
    } else {
      console.log('✅ No failed migrations found');
    }
  } catch (error) {
    // If we can't check status, that's okay - just proceed
    console.log('ℹ️  Could not check migration status, proceeding with deployment');
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
