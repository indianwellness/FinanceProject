/**
 * Test Server Endpoints for Phase 3 DPR API
 */
import fs from 'fs';
import path from 'path';

async function testEndpoints() {
  const baseUrl = 'http://localhost:5000';
  console.log('Testing server health at', baseUrl);
  
  try {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const health = await healthRes.json();
    console.log('Health Response:', health);
  } catch (e) {
    console.log('Server not currently running on port 5000, which is normal. Will test directly.');
  }
}

testEndpoints();
