import fs from 'node:fs/promises';
import path from 'node:path';
import axios from 'axios';
import dotenv from 'dotenv';
import { solveVehicleMaintenance } from '../src/services/schedulerService.js';

dotenv.config();

const baseUrl = process.env.EVALUATION_API_BASE_URL || 'http://20.244.56.144/evaluation-service';
let cachedAccessToken = null;

async function authenticate(outputDir) {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  const token = process.env.EVALUATION_BEARER_TOKEN;

  if (token) {
    cachedAccessToken = token;
    return token;
  }

  const requiredKeys = [
    'AUTH_EMAIL',
    'AUTH_NAME',
    'AUTH_ROLL_NO',
    'AUTH_ACCESS_CODE',
    'AUTH_CLIENT_ID',
    'AUTH_CLIENT_SECRET'
  ];

  for (const key of requiredKeys) {
    if (!process.env[key]) {
      throw new Error(`Missing ${key}`);
    }
  }

  const response = await axios.post(`${baseUrl}/auth`, {
    email: process.env.AUTH_EMAIL,
    name: process.env.AUTH_NAME,
    rollNo: process.env.AUTH_ROLL_NO,
    accessCode: process.env.AUTH_ACCESS_CODE,
    clientID: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET
  }, {
    timeout: 10000
  });

  if (outputDir) {
    await fs.writeFile(path.join(outputDir, 'auth-response.json'), JSON.stringify(response.data, null, 2));
  }

  cachedAccessToken = response.data.access_token;
  return cachedAccessToken;
}

async function fetchProtected(pathname, accessToken) {
  const response = await axios.get(`${baseUrl}${pathname}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    timeout: 10000
  });

  return response.data;
}

async function main() {
  const outputDir = path.resolve('artifacts');
  await fs.mkdir(outputDir, { recursive: true });

  const accessToken = await authenticate(outputDir);

  const depots = await fetchProtected('/depots', accessToken);
  const vehicles = await fetchProtected('/vehicles', accessToken);

  const schedulerInput = (vehicles.vehicles || []).map((vehicle) => ({
    taskId: vehicle.TaskID,
    duration: vehicle.Duration,
    impact: vehicle.Impact
  }));

  const schedule = solveVehicleMaintenance(schedulerInput, depots.depots?.[0]?.MechanicHours || 0);

  await fs.writeFile(path.join(outputDir, 'depots.json'), JSON.stringify(depots, null, 2));
  await fs.writeFile(path.join(outputDir, 'vehicles.json'), JSON.stringify(vehicles, null, 2));
  await fs.writeFile(path.join(outputDir, 'vehicle-schedule.json'), JSON.stringify(schedule, null, 2));
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});