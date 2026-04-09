export interface ImportInputs {
  // Dados da Mercadoria (Identificação)
  productName: string;
  ncm: string;
  volume: string;
  destination: string;

  // Dados Financeiros (Inputs Manuais)
  unitPriceUsd: number;
  quantityPerContainer: number;
  containerQuantity: number;
  internationalFreightUsd: number; // Per container
  insuranceUsd: number;
  dollarRate: number;
  
  // Alíquotas de Impostos (%)
  iiRate: number;
  ipiRate: number;
  pisRate: number;
  cofinsRate: number;
  icmsRate: number;
  
  // Despesas Operacionais (R$)
  siscomex: number;
  thc: number; // Capatazias
  blRelease: number;
  customsBroker: number; // Despachante
  storageRate: number; // Alíquota Armazenagem (%)
  lifting: number; // Levantes
  weighing: number; // Pesagem Container
  roadFreight: number; // Frete Rodoviário (Porto -> Estoque)
  otherExpenses: number;
  
  // Configurações de Crédito
  recoverPis: boolean;
  recoverCofins: boolean;
  recoverIpi: boolean;
  recoverIcms: boolean;
  recoverRoadFreightTax: boolean; // Crédito PIS/COFINS sobre Frete Rodoviário
}

export interface ImportResults {
  valorFobBrl: number;
  freteInternacionalBrl: number;
  seguroBrl: number;
  valorAduaneiroBrl: number; // Base II, PIS, COFINS
  
  // Bases de Cálculo
  iiBase: number;
  ipiBase: number;
  pisBase: number;
  cofinsBase: number;
  icmsBase: number;
  
  // Impostos
  iiValue: number;
  ipiValue: number;
  pisValue: number;
  cofinsValue: number;
  icmsValue: number;
  totalTaxes: number;
  
  // Despesas
  totalOperationalExpenses: number;
  finalAfrmm: number;
  finalStorage: number;
  
  // Totais
  totalImportCost: number;
  totalRecoverableTaxes: number;
  netAccountingCost: number;
  unitAccountingCost: number;
  importFactor: number;
}
