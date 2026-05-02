import { Router } from 'express';
import { ScheduleRun } from '../models/scheduleRun.js';
import { fetchProtectedResource } from '../services/evaluationApi.js';
import { solveVehicleMaintenance } from '../services/schedulerService.js';

const demoDepots = {
  depots: [
    { ID: 1, MechanicHours: 60 }
  ]
};

const demoVehicles = {
  vehicles: [
    { TaskID: 'demo-task-1', Duration: 8, Impact: 9 },
    { TaskID: 'demo-task-2', Duration: 6, Impact: 7 },
    { TaskID: 'demo-task-3', Duration: 5, Impact: 6 },
    { TaskID: 'demo-task-4', Duration: 4, Impact: 4 }
  ]
};

export const evaluationRouter = Router();

evaluationRouter.get('/vehicle-schedule', async (req, res, next) => {
  try {
    const useDemoMode = process.env.DEMO_MODE === '1' || req.query.demo === 'true';
    const token = process.env.EVALUATION_BEARER_TOKEN;

    if (!useDemoMode && !token) {
      return res.status(400).json({ message: 'Missing evaluation token' });
    }

    const depots = useDemoMode ? demoDepots : await fetchProtectedResource('/depots', token);
    const vehicles = useDemoMode ? demoVehicles : await fetchProtectedResource('/vehicles', token);

    const schedulerInput = (vehicles.vehicles || []).map((vehicle) => ({
      taskId: vehicle.TaskID,
      duration: vehicle.Duration,
      impact: vehicle.Impact
    }));

    const result = solveVehicleMaintenance(schedulerInput, depots.depots?.[0]?.MechanicHours || 0);

    if (process.env.MONGODB_URI) {
      await ScheduleRun.create({
        depotsSnapshot: depots,
        vehiclesSnapshot: vehicles,
        result
      });
    }

    return res.json({ mode: useDemoMode ? 'demo' : 'live', depots, vehicles, result });
  } catch (error) {
    next(error);
  }
});
