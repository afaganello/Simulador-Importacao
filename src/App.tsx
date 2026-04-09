import { useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  Truck, 
  ShieldCheck, 
  Info, 
  ChevronDown, 
  ChevronUp,
  Download,
  RefreshCw,
  TrendingUp,
  Package,
  FileText,
  Copy,
  Check,
  Ship
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImportInputs, ImportResults } from './types';
import { DEFAULT_INPUTS } from './constants';
import { calculateImportCosts } from './utils/calculations';

export default function App() {
  const [inputs, setInputs] = useState<ImportInputs>(DEFAULT_INPUTS);
  const [results, setResults] = useState<ImportResults>(calculateImportCosts(DEFAULT_INPUTS));
  const [copied, setCopied] = useState(false);

  // Update results whenever inputs change
  useEffect(() => {
    setResults(calculateImportCosts(inputs));
  }, [inputs]);

  const handleInputChange = (field: keyof ImportInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const merchandiseValueUsd = inputs.unitPriceUsd * inputs.quantityPerContainer * inputs.containerQuantity;

  const formatCurrency = (value: number, currency: 'BRL' | 'USD' = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const resetInputs = () => {
    setInputs(DEFAULT_INPUTS);
  };

  const copyResults = () => {
    const text = `
Simulação de Importação: ${inputs.productName}
-----------------------
Custo Unitário: ${formatCurrency(results.unitAccountingCost)}
Custo Total: ${formatCurrency(results.totalImportCost)}
Fator: ${results.importFactor.toFixed(2)}
Valor Aduaneiro: ${formatCurrency(results.valorAduaneiroBrl)}
Total Impostos: ${formatCurrency(results.totalTaxes)}
    `.trim();
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Simulador de Importação <span className="text-blue-600">Pro</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={resetInputs}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Resetar
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Fator: {results.importFactor.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Inputs */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Identification Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-xs">Identificação</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextInputGroup 
                  label="Produto" 
                  value={inputs.productName}
                  onChange={(v) => handleInputChange('productName', v)}
                  isManual
                />
                <TextInputGroup 
                  label="NCM" 
                  value={inputs.ncm}
                  onChange={(v) => handleInputChange('ncm', v)}
                  isManual
                />
                <TextInputGroup 
                  label="Volume / Container" 
                  value={inputs.volume}
                  onChange={(v) => handleInputChange('volume', v)}
                  isManual
                />
                <TextInputGroup 
                  label="Destino" 
                  value={inputs.destination}
                  onChange={(v) => handleInputChange('destination', v)}
                  isManual
                />
              </div>
            </section>

            {/* Main Data Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-xs">Dados da Mercadoria</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup 
                  label="Preço Unitário (FOB USD)" 
                  icon={<DollarSign className="w-4 h-4" />}
                  value={inputs.unitPriceUsd}
                  onChange={(v) => handleInputChange('unitPriceUsd', v)}
                  isManual
                />
                <InputGroup 
                  label="Quantidade (PCS) por Container" 
                  icon={<Package className="w-4 h-4" />}
                  value={inputs.quantityPerContainer}
                  onChange={(v) => handleInputChange('quantityPerContainer', v)}
                  isManual
                />
                <InputGroup 
                  label="Quantidade de Containers" 
                  icon={<Package className="w-4 h-4" />}
                  value={inputs.containerQuantity}
                  onChange={(v) => handleInputChange('containerQuantity', v)}
                  isManual
                />
                <InputGroup 
                  label="Valor da Mercadoria (USD)" 
                  icon={<DollarSign className="w-4 h-4" />}
                  value={merchandiseValueUsd}
                  onChange={() => {}}
                  readOnly
                />
                <InputGroup 
                  label="Frete Internacional / Container (USD)" 
                  icon={<Truck className="w-4 h-4" />}
                  value={inputs.internationalFreightUsd}
                  onChange={(v) => handleInputChange('internationalFreightUsd', v)}
                  isManual
                />
                <InputGroup 
                  label="Seguro (USD)" 
                  icon={<ShieldCheck className="w-4 h-4" />}
                  value={inputs.insuranceUsd}
                  onChange={(v) => handleInputChange('insuranceUsd', v)}
                  isManual
                />
                <InputGroup 
                  label="Taxa do Dólar (BRL/USD)" 
                  icon={<TrendingUp className="w-4 h-4" />}
                  value={inputs.dollarRate}
                  onChange={(v) => handleInputChange('dollarRate', v)}
                  isManual
                />
              </div>
            </section>

            {/* Taxes Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Percent className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-xs">Impostos e Alíquotas (%)</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputGroup 
                  label="II (Imp. Importação)" 
                  value={inputs.iiRate}
                  onChange={(v) => handleInputChange('iiRate', v)}
                  suffix="%"
                  isManual
                />
                <InputGroup 
                  label="IPI" 
                  value={inputs.ipiRate}
                  onChange={(v) => handleInputChange('ipiRate', v)}
                  suffix="%"
                  isManual
                />
                <InputGroup 
                  label="PIS" 
                  value={inputs.pisRate}
                  onChange={(v) => handleInputChange('pisRate', v)}
                  suffix="%"
                  isManual
                />
                <InputGroup 
                  label="COFINS" 
                  value={inputs.cofinsRate}
                  onChange={(v) => handleInputChange('cofinsRate', v)}
                  suffix="%"
                  isManual
                />
                <InputGroup 
                  label="ICMS" 
                  value={inputs.icmsRate}
                  onChange={(v) => handleInputChange('icmsRate', v)}
                  suffix="%"
                  isManual
                />
              </div>
              
              {/* Recovery Toggles */}
              <div className="px-6 py-4 bg-blue-50/50 border-t border-gray-100">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Recuperação de Créditos (Lucro Real)</h3>
                <div className="flex flex-wrap gap-6">
                  <Checkbox label="PIS" checked={inputs.recoverPis} onChange={(v) => handleInputChange('recoverPis', v)} />
                  <Checkbox label="COFINS" checked={inputs.recoverCofins} onChange={(v) => handleInputChange('recoverCofins', v)} />
                  <Checkbox label="IPI" checked={inputs.recoverIpi} onChange={(v) => handleInputChange('recoverIpi', v)} />
                  <Checkbox label="ICMS" checked={inputs.recoverIcms} onChange={(v) => handleInputChange('recoverIcms', v)} />
                </div>
              </div>
            </section>

            {/* Operational Expenses Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-xs">Despesas Operacionais (R$)</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputGroup label="Siscomex" value={inputs.siscomex} onChange={(v) => handleInputChange('siscomex', v)} prefix="R$" isManual />
                <InputGroup label="AFRMM (8%)" value={results.finalAfrmm} onChange={() => {}} prefix="R$" readOnly />
                <InputGroup label="Capatazias (THC)" value={inputs.thc} onChange={(v) => handleInputChange('thc', v)} prefix="R$" isManual />
                <InputGroup label="Liberação BL" value={inputs.blRelease} onChange={(v) => handleInputChange('blRelease', v)} prefix="R$" isManual />
                <InputGroup label="Despachante" value={inputs.customsBroker} onChange={(v) => handleInputChange('customsBroker', v)} prefix="R$" isManual />
                <InputGroup label="Armazenagem (%)" value={inputs.storageRate} onChange={(v) => handleInputChange('storageRate', v)} suffix="%" isManual />
                <InputGroup label="Armazenagem (R$)" value={results.finalStorage} onChange={() => {}} prefix="R$" readOnly />
                <InputGroup label="Levantes" value={inputs.lifting} onChange={(v) => handleInputChange('lifting', v)} prefix="R$" isManual />
                <InputGroup label="Pesagem Container" value={inputs.weighing} onChange={(v) => handleInputChange('weighing', v)} prefix="R$" isManual />
                <InputGroup label="Outras Despesas" value={inputs.otherExpenses} onChange={(v) => handleInputChange('otherExpenses', v)} prefix="R$" isManual />
              </div>
            </section>
          </div>

          {/* Right Column: Results Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              {/* Main Result Card */}
              <motion.div 
                layout
                className="bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 p-8 text-white"
              >
                <div className="flex items-center justify-between mb-8">
                  <span className="text-blue-100 font-medium text-sm uppercase tracking-wider">Custo Unitário Final</span>
                  <button 
                    onClick={copyResults}
                    className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-300" /> : <Copy className="w-5 h-5 text-blue-200" />}
                  </button>
                </div>
                <div className="mb-8">
                  <div className="text-5xl font-bold mb-2">
                    {formatCurrency(results.unitAccountingCost)}
                  </div>
                  <p className="text-blue-100 text-sm">Custo líquido por unidade após créditos</p>
                </div>
                
                <div className="space-y-4 pt-6 border-t border-blue-500/50">
                  <ResultRow label="Custo Total (BRL)" value={formatCurrency(results.totalImportCost)} />
                  <ResultRow label="Total Créditos" value={formatCurrency(results.totalRecoverableTaxes)} />
                  <ResultRow label="Custo Contábil" value={formatCurrency(results.netAccountingCost)} bold />
                </div>
              </motion.div>

              {/* Breakdown Mini Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Resumo Aduaneiro</h3>
                <div className="space-y-3">
                  <MiniResultRow label="Valor FOB" value={formatCurrency(results.valorFobBrl)} />
                  <MiniResultRow label="Valor Aduaneiro (CIF)" value={formatCurrency(results.valorAduaneiroBrl)} />
                  <MiniResultRow label="Total Impostos" value={formatCurrency(results.totalTaxes)} />
                  <MiniResultRow label="Despesas Operacionais" value={formatCurrency(results.totalOperationalExpenses)} />
                </div>
              </div>

              {/* Info Tip */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3">
                <Info className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Os cálculos de ICMS utilizam a modalidade "por dentro", conforme legislação brasileira vigente para importações.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Detailed Breakdown Table */}
        <section className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-xs">Detalhamento de Custos</h2>
            </div>
            <button className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1">
              <Download className="w-3 h-3" />
              EXPORTAR PDF
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Base de Cálculo</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Valor (BRL)</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Participação (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <TableRow label="Valor FOB da Mercadoria" value={results.valorFobBrl} total={results.totalImportCost} />
                <TableRow label="Frete Internacional" value={results.freteInternacionalBrl} total={results.totalImportCost} />
                <TableRow label="Seguro Internacional" value={results.seguroBrl} total={results.totalImportCost} />
                <TableRow label="Imposto de Importação (II)" value={results.iiValue} total={results.totalImportCost} base={results.iiBase} />
                <TableRow label="IPI" value={results.ipiValue} total={results.totalImportCost} base={results.ipiBase} />
                <TableRow label="PIS" value={results.pisValue} total={results.totalImportCost} base={results.pisBase} />
                <TableRow label="COFINS" value={results.cofinsValue} total={results.totalImportCost} base={results.cofinsBase} />
                <TableRow label="ICMS" value={results.icmsValue} total={results.totalImportCost} base={results.icmsBase} />
                <TableRow label="Despesas Operacionais" value={results.totalOperationalExpenses} total={results.totalImportCost} />
                <tr className="bg-gray-50 font-bold">
                  <td className="px-6 py-4 text-sm text-gray-900">TOTAL GERAL</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">-</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">{formatCurrency(results.totalImportCost)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-200 mt-12">
        <p className="text-center text-gray-400 text-xs tracking-widest uppercase">
          Simulador de Importação Pro &copy; 2026 • Desenvolvido para precisão tributária
        </p>
      </footer>
    </div>
  );
}

// Helper Components
function InputGroup({ label, value, onChange, icon, prefix, suffix, isManual, readOnly }: { 
  label: string, 
  value: number, 
  onChange: (v: number) => void,
  icon?: ReactNode,
  prefix?: string,
  suffix?: string,
  isManual?: boolean,
  readOnly?: boolean
}) {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    if (parseFloat(localValue) !== value) {
      setLocalValue(value.toFixed(2));
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        {prefix && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
            {prefix}
          </div>
        )}
        <input 
          type="number" 
          step="0.01"
          value={localValue}
          placeholder="0.00"
          readOnly={readOnly}
          onChange={(e) => {
            setLocalValue(e.target.value);
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) onChange(val);
          }}
          onBlur={() => setLocalValue(value.toFixed(2))}
          className={`w-full border rounded-xl py-2.5 px-4 text-sm font-medium outline-none transition-all 
            ${readOnly ? 'bg-white border-gray-100 cursor-not-allowed' : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}
            ${isManual ? 'bg-yellow-50/50' : 'bg-white'}
            ${icon || prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''}`}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}

function TextInputGroup({ label, value, onChange, isManual, readOnly }: { 
  label: string, 
  value: string, 
  onChange: (v: string) => void,
  isManual?: boolean,
  readOnly?: boolean
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <input 
        type="text" 
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded-xl py-2.5 px-4 text-sm font-medium outline-none transition-all 
          ${readOnly ? 'bg-white border-gray-100 cursor-not-allowed' : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}
          ${isManual ? 'bg-yellow-50/50' : 'bg-white'}`}
      />
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}>
        {checked && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="hidden" />
      <span className={`text-sm font-semibold ${checked ? 'text-blue-700' : 'text-gray-500'}`}>{label}</span>
    </label>
  );
}

function ResultRow({ label, value, bold }: { label: string, value: string, bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? 'font-bold text-white' : 'text-blue-100'}`}>{label}</span>
      <span className={`text-lg ${bold ? 'font-black text-white' : 'font-semibold text-blue-50'}`}>{value}</span>
    </div>
  );
}

function MiniResultRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}

function TableRow({ label, value, total, base }: { label: string, value: number, total: number, base?: number }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const format = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  
  return (
    <tr>
      <td className="px-6 py-4 text-sm text-gray-600">{label}</td>
      <td className="px-6 py-4 text-sm text-gray-400 text-right italic">
        {base !== undefined ? format(base) : '-'}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900 font-medium text-right">
        {format(value)}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 text-right">{percentage.toFixed(1)}%</td>
    </tr>
  );
}
