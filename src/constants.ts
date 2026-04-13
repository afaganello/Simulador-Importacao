import { ImportInputs } from "./types";

export const DEFAULT_INPUTS: ImportInputs = {
  productCode: "",
  productDescription: "",
  ncm: "",
  volume: "",
  destination: "",

  unitPriceUsd: 0,
  quantityPerContainer: 0,
  containerQuantity: 0,
  internationalFreightUsd: 0,
  insuranceUsd: 0,
  dollarRate: 0,
  
  iiRate: 0,
  ipiRate: 0,
  pisRate: 0,
  cofinsRate: 0,
  icmsRate: 0,
  
  siscomex: 0,
  thc: 0,
  blRelease: 550.00,
  customsBroker: 1200.00,
  storageRate: 0.23,
  lifting: 0,
  weighing: 0,
  roadFreight: 0,
  otherExpenses: 600.00,
  
  recoverPis: true,
  recoverCofins: true,
  recoverIpi: true,
  recoverIcms: true,
  recoverRoadFreightTax: true,
};
