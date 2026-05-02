import { Router } from 'express';
import { fetchProtectedResource } from '../services/evaluationApi.js';
import { solveVehicleMaintenance } from '../services/schedulerService.js';

export const evaluationRouter = Router();

evaluationRouter.get('/depots', async (req, res, next) => {
  try {
    const token = process.env.EVALUATION_BEARER_TOKEN;
    if (!token) return res.status(400).json({ message: 'Missing token' });
    const data = await fetchProtectedResource('/depots', token);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

evaluationRouter.get('/vehicles', async (req, res, next) => {
  try {
    const token = process.env.EVALUATION_BEARER_TOKEN;
    if (!token) return res.status(400).json({ message: 'Missing token' });
    const data = await fetchProtectedResource('/vehicles', token);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

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

    return res.json({ depots, vehicles, result });
  } catch (error) {
    next(error);
  }
});
