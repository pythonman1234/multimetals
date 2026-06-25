export function calculateFloorPrice(grade, prices, spread) {
  let metalCost = 0;

  metalCost += ((grade.copper || 0) * prices.copper) / 100;

  metalCost += ((grade.nickel || 0) * prices.nickel) / 100;

  metalCost += ((grade.zinc || 0) * prices.zinc) / 100;

  metalCost += ((grade.tin || 0) * prices.tin) / 100;

  metalCost += ((grade.aluminium || 0) * prices.aluminium) / 100;

  metalCost += ((grade.iron || 0) * prices.iron) / 100;

  const meltLoss = metalCost * 0.03;

  const floorPrice = metalCost + meltLoss + spread;

  return {
    metalCost,
    meltLoss,
    floorPrice,
  };
}
