#!/usr/bin/env node
/**
 * Generate Supabase JWT keys (anon and service_role)
 * 
 * Usage: node scripts/generate-keys.js YOUR_JWT_SECRET
 */

const crypto = require('crypto');

const secret = process.argv[2];

if (!secret) {
  console.log('Usage: node scripts/generate-keys.js YOUR_JWT_SECRET');
  console.log('');
  console.log('Example: node scripts/generate-keys.js "super-secret-jwt-token-with-at-least-32-characters"');
  process.exit(1);
}

function createJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(headerB64 + '.' + payloadB64)
    .digest('base64url');
  return `${headerB64}.${payloadB64}.${signature}`;
}

// Anon key - limited permissions, safe for client-side
const anonPayload = {
  role: 'anon',
  iss: 'supabase',
  iat: 1704067200,  // Jan 1, 2024
  exp: 1861920000   // Jan 1, 2029
};

// Service role key - full permissions, server-side only
const servicePayload = {
  role: 'service_role',
  iss: 'supabase',
  iat: 1704067200,
  exp: 1861920000
};

const anonKey = createJWT(anonPayload, secret);
const serviceKey = createJWT(servicePayload, secret);

console.log('');
console.log('=== Generated Supabase Keys ===');
console.log('');
console.log('Add these to your supabase/.env:');
console.log('');
console.log(`ANON_KEY=${anonKey}`);
console.log('');
console.log(`SERVICE_ROLE_KEY=${serviceKey}`);
console.log('');
console.log('Add this to your apps/web/.env:');
console.log('');
console.log(`VITE_SUPABASE_ANON_KEY=${anonKey}`);
console.log('');
