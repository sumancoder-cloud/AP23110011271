export function solveVehicleMaintenance(tasks, mechanicHours) {
  const itemCount = tasks.length;
  const dp = Array.from({ length: itemCount + 1 }, () => Array(mechanicHours + 1).fill(0));
  const keep = Array.from({ length: itemCount + 1 }, () => Array(mechanicHours + 1).fill(false));

  for (let index = 1; index <= itemCount; index += 1) {
    const task = tasks[index - 1];

    for (let hours = 0; hours <= mechanicHours; hours += 1) {
      const skip = dp[index - 1][hours];
      const take = task.duration <= hours ? task.impact + dp[index - 1][hours - task.duration] : 0;

      if (take > skip) {
        dp[index][hours] = take;
        keep[index][hours] = true;
      } else {
        dp[index][hours] = skip;
      }
    }
  }

  const selectedTaskIds = [];
  let hours = mechanicHours;

  for (let index = itemCount; index >= 1; index -= 1) {
    if (keep[index][hours]) {
      const task = tasks[index - 1];
      selectedTaskIds.push(task.taskId);
      hours -= task.duration;
    }
  }

  return {
    maxImpact: dp[itemCount][mechanicHours],
    selectedTaskIds: selectedTaskIds.reverse()
  };
}
