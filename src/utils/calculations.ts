import { ImportInputs, ImportResults } from "../types";

export function calculateImportCosts(inputs: ImportInputs): ImportResults {
  const {
    unitPriceUsd,
    quantityPerContainer,
    containerQuantity,
    internationalFreightUsd,
    insuranceUsd,
    dollarRate,
    iiRate,
    ipiRate,
    pisRate,
    cofinsRate,
    icmsRate,
    siscomex,
    thc,
    blRelease,
    customsBroker,
    storageRate,
    lifting,
    weighing,
    roadFreight,
    otherExpenses,
    recoverPis,
    recoverCofins,
    recoverIpi,
    recoverIcms,
    recoverRoadFreightTax,
  } = inputs;

  // Cálculos de Base
  const totalQuantity = quantityPerContainer * containerQuantity;
  const merchandiseValueUsd = unitPriceUsd * totalQuantity;
  
  // Conversões para BRL
  const valorFobBrl = merchandiseValueUsd * dollarRate;
  const freteInternacionalBrl = internationalFreightUsd * containerQuantity * dollarRate;
  
  // Valor Aduaneiro (CIF)
  // Seguro = 0.185% do CIF -> Seguro = (0.00185 * (FOB + Frete)) / (1 - 0.00185)
  const seguroBrl = (0.00185 * (valorFobBrl + freteInternacionalBrl)) / (1 - 0.00185);
  const valorAduaneiroBrl = valorFobBrl + freteInternacionalBrl + seguroBrl;

  // AFRMM (Marinha Mercante) - 8% sobre o frete internacional (Sempre Marítimo agora)
  const finalAfrmm = freteInternacionalBrl * 0.08;

  // Armazenagem - 0.23% sobre o Valor Aduaneiro (CIF)
  const finalStorage = valorAduaneiroBrl * (0.23 / 100);

  // Impostos Federais
  const iiBase = valorAduaneiroBrl;
  const iiValue = iiBase * (iiRate / 100);

  const ipiBase = valorAduaneiroBrl + iiValue;
  const ipiValue = ipiBase * (ipiRate / 100);

  const pisBase = valorAduaneiroBrl;
  const pisValue = pisBase * (pisRate / 100);

  const cofinsBase = valorAduaneiroBrl;
  const cofinsValue = cofinsBase * (cofinsRate / 100);

  // Despesas Operacionais
  const finalThc = thc * containerQuantity;
  const finalLifting = lifting * containerQuantity;
  const finalWeighing = weighing * containerQuantity;
  
  const blReleaseFixed = 550;
  const customsBrokerFixed = 1200;
  const otherExpensesFixed = 600;

  const totalOperationalExpenses = siscomex + finalAfrmm + finalStorage + finalThc + blReleaseFixed + customsBrokerFixed + finalLifting + finalWeighing + roadFreight + otherExpensesFixed;

  // ICMS (Cálculo "por dentro")
  // Base ICMS = (Valor Aduaneiro + II + IPI + PIS + COFINS + Despesas Aduaneiras) / (1 - Alíquota ICMS)
  const icmsBase = (valorAduaneiroBrl + iiValue + ipiValue + pisValue + cofinsValue + totalOperationalExpenses) / (1 - (icmsRate / 100));
  const icmsValue = icmsBase * (icmsRate / 100);

  const totalTaxes = iiValue + ipiValue + pisValue + cofinsValue + icmsValue;
  
  // Custo Total de Importação
  const totalImportCost = valorAduaneiroBrl + totalTaxes + totalOperationalExpenses;

  // Créditos Tributários (Recuperação)
  let totalRecoverableTaxes = 0;
  if (recoverPis) totalRecoverableTaxes += pisValue;
  if (recoverCofins) totalRecoverableTaxes += cofinsValue;
  if (recoverIpi) totalRecoverableTaxes += ipiValue;
  if (recoverIcms) totalRecoverableTaxes += icmsValue;

  // Crédito PIS/COFINS sobre Frete Rodoviário (Lucro Real)
  if (recoverRoadFreightTax) {
    // Geralmente 1.65% PIS e 7.6% COFINS, mas usamos as alíquotas informadas para consistência
    totalRecoverableTaxes += roadFreight * (pisRate / 100);
    totalRecoverableTaxes += roadFreight * (cofinsRate / 100);
  }

  // Custo Contábil (Líquido)
  const netAccountingCost = totalImportCost - totalRecoverableTaxes;
  
  // Custo Unitário
  const unitAccountingCost = totalQuantity > 0 ? netAccountingCost / totalQuantity : 0;
  
  // Fator de Importação (Custo Total BRL / Valor FOB BRL)
  const importFactor = valorFobBrl > 0 ? netAccountingCost / valorFobBrl : 0;

  return {
    valorFobBrl,
    freteInternacionalBrl,
    seguroBrl,
    valorAduaneiroBrl,
    iiBase,
    ipiBase,
    pisBase,
    cofinsBase,
    icmsBase,
    iiValue,
    ipiValue,
    pisValue,
    cofinsValue,
    icmsValue,
    totalTaxes,
    totalOperationalExpenses,
    finalAfrmm,
    finalStorage,
    finalThc,
    finalLifting,
    finalWeighing,
    totalImportCost,
    totalRecoverableTaxes,
    netAccountingCost,
    unitAccountingCost,
    importFactor,
  };
}
