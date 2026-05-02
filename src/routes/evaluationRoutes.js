import { Router } from 'express';
import { ScheduleRun } from '../models/scheduleRun.js';
import { fetchProtectedResource } from '../services/evaluationApi.js';
import { solveVehicleMaintenance } from '../services/schedulerService.js';

export const evaluationRouter = Router();

evaluationRouter.get('/vehicle-schedule', async (req, res, next) => {
  try {
    const token = process.env.EVALUATION_BEARER_TOKEN;

    if (!token) {
      return res.status(400).json({ message: 'Missing evaluation token' });
    }

    const depots = await fetchProtectedResource('/depots', token);
    const vehicles = await fetchProtectedResource('/vehicles', token);

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

    return res.json({ depots, vehicles, result });
  } catch (error) {
    next(error);
  }
});
