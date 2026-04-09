import { ImportInputs } from "./types";

export const DEFAULT_INPUTS: ImportInputs = {
  productName: "TP-A55-10B-005",
  ncm: "8539.52.00",
  volume: "40'HQ",
  destination: "Navegantes, SC",

  unitPriceUsd: 0.194,
  quantityPerContainer: 191777,
  containerQuantity: 1,
  internationalFreightUsd: 2300.00,
  insuranceUsd: 73.08,
  dollarRate: 5.15,
  
  iiRate: 10.80,
  ipiRate: 6.50,
  pisRate: 2.10,
  cofinsRate: 9.65,
  icmsRate: 18.00, // Common rate, image had 0% (deferred)
  
  siscomex: 154.23,
  thc: 1050.00,
  blRelease: 550.00,
  customsBroker: 1200.00,
  storageRate: 0.23,
  lifting: 450.00,
  weighing: 250.00,
  roadFreight: 1800.00,
  otherExpenses: 559.17,
  
  recoverPis: true,
  recoverCofins: true,
  recoverIpi: true,
  recoverIcms: true,
  recoverRoadFreightTax: true,
};
