import { useState, useEffect, useMemo, ReactNode, MouseEvent } from 'react';
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
  Ship,
  Plus,
  Trash2,
  LayoutDashboard,
  FileSpreadsheet,
  Settings2,
  X,
  Users,
  Briefcase,
  History,
  Save,
  FileCheck,
  MapPin,
  Mail,
  Phone,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImportInputs, ImportResults, Simulation, ClientData, ProposalData, Draft } from './types';
import { DEFAULT_INPUTS } from './constants';
import { calculateImportCosts } from './utils/calculations';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function App() {
  const [simulations, setSimulations] = useState<Simulation[]>(() => {
    const saved = localStorage.getItem('cetus_simulations');
    return saved ? JSON.parse(saved) : [
      { id: crypto.randomUUID(), name: 'NOVO PRODUTO', inputs: DEFAULT_INPUTS }
    ];
  });
  const [activeIndex, setActiveIndex] = useState(() => {
    const saved = localStorage.getItem('cetus_active_index');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [activeView, setActiveView] = useState<'simulator' | 'summary' | 'client' | 'proposal' | 'pre-proposal' | 'drafts'>('simulator');
  const [copied, setCopied] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [editingName, setEditingName] = useState<number | null>(null);

  const [clientData, setClientData] = useState<ClientData>(() => {
    const saved = localStorage.getItem('cetus_client_data');
    return saved ? JSON.parse(saved) : {
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: ''
    };
  });

  const [proposalData, setProposalData] = useState<ProposalData>({
    observations: '• Prazo de Entrega: aproximadamente 45 dias\n• Condições de Pagamento: 30% no pedido, 70% no embarque\n• Incoterm: FOB',
    terms: 'Proposta válida por 30 dias. Sujeita a confirmação de disponibilidade de produtos e cotações junto a fornecedores. Prazo de entrega e condições de pagamento conforme acordado.',
    signer: 'CETUS HONG KONG LTD',
    adjustedQuantities: {}
  });

  const [drafts, setDrafts] = useState<Draft[]>(() => {
    const saved = localStorage.getItem('cetus_drafts');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cetus_client_data', JSON.stringify(clientData));
  }, [clientData]);

  useEffect(() => {
    localStorage.setItem('cetus_simulations', JSON.stringify(simulations));
  }, [simulations]);

  useEffect(() => {
    localStorage.setItem('cetus_active_index', activeIndex.toString());
  }, [activeIndex]);

  useEffect(() => {
    localStorage.setItem('cetus_drafts', JSON.stringify(drafts));
  }, [drafts]);

  const currentSimulation = simulations[activeIndex];
  const inputs = currentSimulation.inputs;

  const results = useMemo(() => {
    return calculateImportCosts(inputs);
  }, [inputs]);

  const allResults = useMemo(() => {
    return simulations.map(s => ({
      simulation: s,
      results: calculateImportCosts(s.inputs)
    }));
  }, [simulations]);

  const handleInputChange = (field: keyof ImportInputs, value: any) => {
    setSimulations(prev => {
      const next = [...prev];
      next[activeIndex] = {
        ...next[activeIndex],
        inputs: { ...next[activeIndex].inputs, [field]: value }
      };
      return next;
    });
  };

  const addSimulation = () => {
    const baseInputs = simulations[activeIndex]?.inputs || DEFAULT_INPUTS;
    const newName = `NOVO PRODUTO ${simulations.length + 1}`;
    
    const newSim: Simulation = {
      id: crypto.randomUUID(),
      name: newName,
      inputs: { 
        ...baseInputs, 
        productCode: newName, 
        productDescription: '',
        ncm: '',
        unitPriceUsd: 0,
        quantityPerContainer: 0,
        // We keep containerQuantity, freight, dollar, and taxes from the previous one
      }
    };
    setSimulations([...simulations, newSim]);
    setActiveIndex(simulations.length);
    setActiveView('simulator');
  };

  const removeSimulation = (index: number, e: MouseEvent) => {
    e.stopPropagation();
    if (simulations.length === 1) return;
    const next = simulations.filter((_, i) => i !== index);
    setSimulations(next);
    if (activeIndex >= next.length) {
      setActiveIndex(next.length - 1);
    }
  };

  const renameSimulation = (index: number, name: string) => {
    setSimulations(prev => {
      const next = [...prev];
      next[index] = { ...next[index], name };
      return next;
    });
  };

  const duplicateSimulation = () => {
    const current = simulations[activeIndex];
    const newSim: Simulation = {
      ...current,
      id: crypto.randomUUID(),
      name: `${current.name} (Cópia)`
    };
    setSimulations([...simulations, newSim]);
    setActiveIndex(simulations.length);
    setActiveView('simulator');
  };

  const resetSimulation = () => {
    setSimulations(prev => {
      const next = [...prev];
      // Reset only manual inputs for the current simulation
      // Keeping operational expenses (siscomex, thc, etc.) as they are pre-filled/standard
      next[activeIndex] = {
        ...next[activeIndex],
        name: 'NOVA SIMULAÇÃO',
        inputs: {
          ...next[activeIndex].inputs,
          productCode: '',
          productDescription: '',
          ncm: '',
          unitPriceUsd: 0,
          quantityPerContainer: 0,
          containerQuantity: 1,
          internationalFreightUsd: 0,
          dollarRate: DEFAULT_INPUTS.dollarRate, // Keep current rate or default
          // Operational expenses are kept as is from current state
        }
      };
      return next;
    });
  };

  const merchandiseValueUsd = inputs.unitPriceUsd * inputs.quantityPerContainer * inputs.containerQuantity;

  const formatCurrency = (value: number, currency: 'BRL' | 'USD' = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(value);
  };

  const resetInputs = () => {
    setSimulations(prev => {
      const next = [...prev];
      next[activeIndex] = { ...next[activeIndex], inputs: DEFAULT_INPUTS };
      return next;
    });
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Resumo Geral');

    // Add Header Info
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'CETUS CONSULTORIA DE IMPORTAÇÃO - RESUMO GERAL';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }; // brand-blue
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // Add Client Info if available
    if (clientData.companyName) {
      worksheet.mergeCells('A2:G2');
      const clientCell = worksheet.getCell('A2');
      clientCell.value = `Cliente: ${clientData.companyName}`;
      clientCell.font = { bold: true };
      worksheet.getRow(2).height = 20;
    }

    // Add Table Headers
    const headerRow = worksheet.addRow([
      'ITEM',
      'CÓD. PRODUTO',
      'DESCRIÇÃO',
      'NCM',
      'PREÇO UNIT. (USD)',
      'CUSTO UNIT. (BRL)',
      'CUSTO TOTAL (BRL)',
      'FATOR'
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } }; // gray-700
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add Data
    allResults.forEach((r, idx) => {
      const row = worksheet.addRow([
        idx + 1,
        r.simulation.name,
        r.simulation.inputs.productDescription,
        r.simulation.inputs.ncm,
        r.simulation.inputs.unitPriceUsd,
        r.results.unitAccountingCost,
        r.results.totalImportCost,
        r.results.importFactor
      ]);

      row.getCell(5).numFmt = '"$"#,##0.00';
      row.getCell(6).numFmt = '"R$"#,##0.00';
      row.getCell(7).numFmt = '"R$"#,##0.00';
      row.getCell(8).numFmt = '0.0000';

      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Set column widths
    worksheet.getColumn(1).width = 8;
    worksheet.getColumn(2).width = 20;
    worksheet.getColumn(3).width = 40;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 20;
    worksheet.getColumn(6).width = 20;
    worksheet.getColumn(7).width = 20;
    worksheet.getColumn(8).width = 15;

    // Add Summary Totals
    const totalBrl = allResults.reduce((acc, curr) => acc + curr.results.totalImportCost, 0);
    const summaryRow = worksheet.addRow([]);
    const totalLabelCell = worksheet.getCell(`G${summaryRow.number}`);
    totalLabelCell.value = 'TOTAL GERAL:';
    totalLabelCell.font = { bold: true };
    
    const totalValueCell = worksheet.getCell(`H${summaryRow.number}`);
    totalValueCell.value = totalBrl;
    totalValueCell.font = { bold: true };
    totalValueCell.numFmt = '"R$"#,##0.00';

    // Generate and save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Simulacao_Importacao_CETUS_${new Date().getTime()}.xlsx`);
  };

  const exportPreProposalToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pré-Proposta');

    // Add Header Info
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'CETUS CONSULTORIA DE IMPORTAÇÃO - PRÉ-PROPOSTA COMERCIAL';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }; // brand-blue
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // Add Client Info
    if (clientData.companyName) {
      worksheet.mergeCells('A2:H2');
      const clientCell = worksheet.getCell('A2');
      clientCell.value = `Cliente: ${clientData.companyName}`;
      clientCell.font = { bold: true };
      worksheet.getRow(2).height = 20;
    }

    // Add Table Headers
    const headerRow = worksheet.addRow([
      'ITEM',
      'CÓD. PRODUTO',
      'DESCRIÇÃO',
      'NCM',
      'QUANTIDADE',
      'VALOR FOB (USD)',
      'UNIT (BRL)',
      'SUBTOTAL (BRL)',
      'FATOR'
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } }; // gray-700
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add Data
    allResults.forEach((item, idx) => {
      const adjustedQty = proposalData.adjustedQuantities[item.simulation.id] ?? (item.simulation.inputs.quantityPerContainer * item.simulation.inputs.containerQuantity);
      const unitBrl = item.results.unitAccountingCost;
      const subtotal = unitBrl * adjustedQty;

      const row = worksheet.addRow([
        idx + 1,
        item.simulation.name,
        item.simulation.inputs.productDescription,
        item.simulation.inputs.ncm,
        adjustedQty,
        item.simulation.inputs.unitPriceUsd * adjustedQty, // Total FOB for the item
        unitBrl,
        subtotal,
        item.results.importFactor
      ]);

      row.getCell(5).numFmt = '#,##0';
      row.getCell(6).numFmt = '"$"#,##0.00';
      row.getCell(7).numFmt = '"R$"#,##0.00';
      row.getCell(8).numFmt = '"R$"#,##0.00';
      row.getCell(9).numFmt = '0.0000';

      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Set column widths
    worksheet.getColumn(1).width = 8;
    worksheet.getColumn(2).width = 20;
    worksheet.getColumn(3).width = 40;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 20;
    worksheet.getColumn(7).width = 20;
    worksheet.getColumn(8).width = 20;
    worksheet.getColumn(9).width = 15;

    // Add Summary Totals
    const totals = allResults.reduce((acc, curr) => {
      const adjustedQty = proposalData.adjustedQuantities[curr.simulation.id] ?? (curr.simulation.inputs.quantityPerContainer * curr.simulation.inputs.containerQuantity);
      const originalQty = curr.simulation.inputs.quantityPerContainer * curr.simulation.inputs.containerQuantity;
      const ratio = originalQty > 0 ? adjustedQty / originalQty : 0;
      return acc + (curr.results.netAccountingCost * ratio);
    }, 0);

    const summaryRow = worksheet.addRow([]);
    const totalLabelCell = worksheet.getCell(`H${summaryRow.number}`);
    totalLabelCell.value = 'PREVISÃO CUSTO FINAL:';
    totalLabelCell.font = { bold: true };
    
    const totalValueCell = worksheet.getCell(`I${summaryRow.number}`);
    totalValueCell.value = totals;
    totalValueCell.font = { bold: true };
    totalValueCell.numFmt = '"R$"#,##0.00';

    // Generate and save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Pre_Proposta_CETUS_${new Date().getTime()}.xlsx`);
  };

  const generateSummaryPDF = () => {
    if (simulations.length === 0) {
      alert('Por favor, adicione pelo menos um produto simulado.');
      setActiveView('simulator');
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4');
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const ddmmaaaa = now.getDate().toString().padStart(2, '0') + (now.getMonth() + 1).toString().padStart(2, '0') + now.getFullYear();

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('RELATÓRIO COMPARATIVO DE IMPORTAÇÃO', 148.5, 20, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`CETUS HONG KONG LTD | Data de Emissão: ${dateStr}`, 148.5, 27, { align: 'center' });
    
    doc.setDrawColor(230);
    doc.line(14, 35, 282, 35);

    // Table Data
    const tableData = allResults.map((r) => {
      const qty = r.simulation.inputs.quantityPerContainer * r.simulation.inputs.containerQuantity;
      const unitTaxes = r.results.totalTaxes / qty;
      const unitOp = r.results.totalOperationalExpenses / qty;
      const unitCredits = r.results.totalRecoverableTaxes / qty;

      return [
        r.simulation.name,
        r.simulation.inputs.productDescription,
        r.simulation.inputs.ncm,
        formatCurrency(r.simulation.inputs.unitPriceUsd, 'USD'),
        `R$ ${r.simulation.inputs.dollarRate.toFixed(2).replace('.', ',')}`,
        formatCurrency(r.results.unitAccountingCost),
        formatCurrency(unitTaxes),
        formatCurrency(unitOp),
        formatCurrency(unitCredits),
        r.results.importFactor.toFixed(4).replace('.', ',')
      ];
    });

    autoTable(doc, {
      startY: 45,
      head: [['CÓDIGO', 'DESCRIÇÃO', 'NCM', 'FOB (USD)', 'CÂMBIO', 'CUSTO UNIT (BRL)', 'IMPOSTOS (UN)', 'OPERAC. (UN)', 'CRÉDITOS (UN)', 'FATOR']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 7, cellPadding: 3, font: 'helvetica', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 25, halign: 'left' },
        1: { cellWidth: 50, halign: 'left' },
        2: { cellWidth: 20 },
        3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 22, halign: 'right' },
        7: { cellWidth: 22, halign: 'right' },
        8: { cellWidth: 22, halign: 'right' },
        9: { cellWidth: 15, halign: 'center' }
      },
      alternateRowStyles: { fillColor: [250, 250, 250] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    // Summary Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 51, 102);
    doc.text('RESUMO CONSOLIDADO', 14, finalY);
    
    const totalCredits = allResults.reduce((acc, curr) => acc + curr.results.totalRecoverableTaxes, 0);
    const totalBrl = allResults.reduce((acc, curr) => acc + curr.results.totalImportCost, 0);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Total de Créditos Recuperáveis Estimados:`, 14, finalY + 8);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(totalCredits), 85, finalY + 8);

    doc.setFont('helvetica', 'normal');
    doc.text(`Investimento Total Estimado (BRL):`, 14, finalY + 14);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(totalBrl), 85, finalY + 14);

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`CETUS HONG KONG LTD | Relatório Comparativo | Página ${i} de ${pageCount}`, 148.5, 200, { align: 'center' });
    }

    doc.save(`comparativo_importacao_${ddmmaaaa}.pdf`);
  };

  const generateProposalPDF = () => {
    if (!clientData.companyName) {
      alert('Por favor, preencha o Nome da Empresa nos Dados do Cliente.');
      setActiveView('client');
      return;
    }
    if (simulations.length === 0) {
      alert('Por favor, adicione pelo menos um produto simulado.');
      setActiveView('simulator');
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const ddmmaaaa = now.getDate().toString().padStart(2, '0') + (now.getMonth() + 1).toString().padStart(2, '0') + now.getFullYear();
    const proposalNo = `PRO-${ddmmaaaa}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;

    // Header - International Standard
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('CETUS HONG KONG LTD', 14, 20);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text('Escritório Ásia-Pacífico:', 14, 26);
    doc.text('3/F, Building 1, No. 11 Hongtai 4th Rd.,', 14, 30);
    doc.text('Xiaoshan EDZ, Hangzhou, Zhejiang 311200, China', 14, 34);
    
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.line(14, 40, 196, 40);

    // Proposal Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`PROPOSTA COMERCIAL: ${proposalNo}`, 14, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${dateStr}`, 14, 55);
    doc.text('Validade: 30 dias', 14, 60);

    // Client Info
    doc.setFillColor(245, 247, 250);
    doc.rect(14, 68, 182, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', 18, 74);
    doc.setFont('helvetica', 'normal');
    doc.text(clientData.companyName, 40, 74);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Aos cuidados de:', 18, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(clientData.contactPerson || '-', 40, 80);
    
    doc.setFont('helvetica', 'bold');
    doc.text('E-mail:', 120, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(clientData.email || '-', 135, 80);

    // Product Table
    let totalFobUsd = 0;
    let totalEstimatedBrl = 0;

    const tableData = allResults.map((r, idx) => {
      const adjustedQty = proposalData.adjustedQuantities[r.simulation.id] ?? (r.simulation.inputs.quantityPerContainer * r.simulation.inputs.containerQuantity);
      const unitBrl = r.results.unitAccountingCost;
      const subtotalBrl = unitBrl * adjustedQty;
      const subtotalFobUsd = r.simulation.inputs.unitPriceUsd * adjustedQty;

      totalFobUsd += subtotalFobUsd;
      totalEstimatedBrl += subtotalBrl;
      
      return [
        idx + 1,
        r.simulation.name,
        r.simulation.inputs.productDescription,
        r.simulation.inputs.ncm,
        formatNumber(adjustedQty),
        r.simulation.inputs.unitPriceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        unitBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        subtotalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      ];
    });

    autoTable(doc, {
      startY: 95,
      head: [['ITEM', 'CÓDIGO', 'DESCRIÇÃO', 'NCM', 'QTD', 'FOB USD', 'UNITÁRIO (BRL)', 'TOTAL (BRL)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 7, cellPadding: 3, font: 'helvetica', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25, halign: 'left' },
        2: { cellWidth: 55, halign: 'left' },
        3: { cellWidth: 18 },
        4: { cellWidth: 15, halign: 'right' },
        5: { cellWidth: 18, halign: 'right' },
        6: { cellWidth: 20, halign: 'right' },
        7: { cellWidth: 21, halign: 'right' }
      },
      alternateRowStyles: { fillColor: [250, 250, 250] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Simple Totals
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`TOTAL FOB (USD): US$ ${totalFobUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 196, finalY, { align: 'right' });
    doc.text(`TOTAL ESTIMADO (BRL): R$ ${totalEstimatedBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 196, finalY + 6, { align: 'right' });

    // Observations
    const obsY = finalY + 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('OBSERVAÇÕES COMERCIAIS', 14, obsY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60);
    const splitObs = doc.splitTextToSize(proposalData.observations || 'Nenhuma observação adicional.', 180);
    doc.text(splitObs, 14, obsY + 6);

    // Terms
    const termsY = obsY + 35;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 51, 102);
    doc.text('TERMOS E CONDIÇÕES', 14, termsY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100);
    const splitTerms = doc.splitTextToSize(proposalData.terms, 180);
    doc.text(splitTerms, 14, termsY + 6);

    // Signature
    const sigY = 260;
    doc.setDrawColor(200);
    doc.line(14, sigY, 80, sigY);
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`${proposalData.signer}`, 14, sigY + 6);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Assinatura Autorizada`, 14, sigY + 10);
    doc.text(`Data: ${dateStr}`, 14, sigY + 14);

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`CETUS HONG KONG LTD | Proposta Comercial ${proposalNo} | Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
    }

    const fileName = `proposta_${clientData.companyName.replace(/\s+/g, '_')}_${ddmmaaaa}.pdf`;
    doc.save(fileName);
  };

  const saveDraft = () => {
    const newDraft: Draft = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      clientData,
      proposalData,
      simulations
    };
    setDrafts([newDraft, ...drafts]);
    alert('Rascunho salvo com sucesso!');
  };

  const loadDraft = (draft: Draft) => {
    setClientData(draft.clientData);
    setProposalData(draft.proposalData);
    setSimulations(draft.simulations);
    setActiveIndex(0);
    setActiveView('simulator');
    alert('Rascunho carregado!');
  };

  const deleteDraft = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setDrafts(drafts.filter(d => d.id !== id));
  };

  const clearClientData = () => {
    setClientData({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: ''
    });
    alert('Dados do cliente limpos.');
  };

  const copyResults = () => {
    const text = `
Simulação de Importação: ${inputs.productName}
-----------------------
Custo Unitário: ${formatCurrency(results.unitAccountingCost)}
Custo Total: ${formatCurrency(results.totalImportCost)}
Fator: ${results.importFactor.toFixed(4).replace('.', ',')}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <Ship className="w-8 h-8 text-brand-blue" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-blue rounded-full border-2 border-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter text-brand-blue leading-none">CETUS</span>
                <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">Logistics Pro</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveView('simulator')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'simulator' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                SIMULADOR
              </button>
              <button 
                onClick={() => setActiveView('summary')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'summary' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                RESUMO
              </button>
              <button 
                onClick={() => setActiveView('client')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'client' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Users className="w-3.5 h-3.5" />
                CLIENTE
              </button>
              <button 
                onClick={() => setActiveView('proposal')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'proposal' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                PROPOSTA
              </button>
              <button 
                onClick={() => {
                  if (simulations.length === 0) {
                    alert('Adicione pelo menos um produto para acessar a pré-proposta.');
                    return;
                  }
                  setActiveView('pre-proposal');
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'pre-proposal' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FileText className="w-3.5 h-3.5" />
                PRÉ-PROPOSTA
              </button>
              <button 
                onClick={() => setActiveView('drafts')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeView === 'drafts' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <History className="w-3.5 h-3.5" />
                RASCUNHOS
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={resetSimulation}
              className="flex items-center gap-2 text-gray-500 hover:text-orange-600 transition-colors p-2 rounded-lg hover:bg-orange-50"
              title="Nova Simulação (Zerar Campos)"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Nova Simulação</span>
            </button>
            <button 
              onClick={saveDraft}
              className="flex items-center gap-2 text-gray-500 hover:text-brand-blue transition-colors p-2 rounded-lg hover:bg-gray-50"
              title="Salvar Rascunho"
            >
              <Save className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <button 
              onClick={generateProposalPDF}
              className="flex items-center gap-2 bg-brand-blue text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
            >
              <FileCheck className="w-4 h-4" />
              GERAR PROPOSTA PDF
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Bar */}
      {activeView === 'simulator' && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2 scrollbar-hide">
            {simulations.map((sim, idx) => (
              <div 
                key={sim.id}
                onClick={() => setActiveIndex(idx)}
                className={`group flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition-all border whitespace-nowrap ${activeIndex === idx ? 'bg-brand-blue border-brand-blue text-white shadow-md' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
              >
                {editingName === idx ? (
                  <input 
                    autoFocus
                    type="text"
                    value={sim.name}
                    onChange={(e) => renameSimulation(idx, e.target.value)}
                    onBlur={() => setEditingName(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingName(null)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white text-brand-blue px-2 py-0.5 rounded border-none outline-none font-bold text-sm w-32"
                  />
                ) : (
                  <div className="flex flex-col items-start gap-0.5">
                    <div className="flex items-center gap-2">
                      <span 
                        onDoubleClick={() => setEditingName(idx)}
                        className={`font-bold text-sm ${activeIndex === idx ? 'text-white' : 'text-gray-700'}`}
                      >
                        {sim.name}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingName(idx); }}
                        className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 transition-all ${activeIndex === idx ? 'text-white' : 'text-gray-400'}`}
                      >
                        <Settings2 className="w-3 h-3" />
                      </button>
                    </div>
                    {sim.inputs.productDescription && (
                      <span className={`text-[10px] font-medium truncate max-w-[120px] ${activeIndex === idx ? 'text-blue-100' : 'text-gray-400'}`}>
                        {sim.inputs.productDescription}
                      </span>
                    )}
                  </div>
                )}
                {simulations.length > 1 && (
                  <button 
                    onClick={(e) => removeSimulation(idx, e)}
                    className={`p-1 rounded-md transition-colors ${activeIndex === idx ? 'hover:bg-white/20 text-white' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            <button 
              onClick={addSimulation}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-brand-blue hover:text-brand-blue transition-all text-sm font-bold"
            >
              <Plus className="w-4 h-4" />
              NOVO PRODUTO
            </button>
            <button 
              onClick={duplicateSimulation}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-brand-blue hover:text-brand-blue transition-all text-sm font-bold"
              title="Duplicar Simulação Atual"
            >
              <Copy className="w-4 h-4" />
              DUPLICAR
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {showBreakdown && (
            <BreakdownModal 
              isOpen={showBreakdown} 
              onClose={() => setShowBreakdown(false)} 
              results={results} 
              inputs={inputs} 
            />
          )}
          {activeView === 'summary' ? (
            <motion.div 
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-brand-blue tracking-tight">RESUMO GERAL DE CUSTOS</h2>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={exportToExcel}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    EXCEL
                  </button>
                  <button 
                    onClick={generateSummaryPDF}
                    className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </button>
                  <div className="text-sm text-gray-500 font-medium">Total de {simulations.length} produtos simulados</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Cód. Produto</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Descrição</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">NCM</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Preço Unit. (USD)</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Custo Unit. (BRL)</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Fator</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allResults.map((item, idx) => (
                        <tr key={item.simulation.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-bold text-brand-dark">{item.simulation.name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.simulation.inputs.productDescription}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.simulation.inputs.ncm}</td>
                          <td className="px-6 py-4 text-sm font-medium text-right text-gray-600">
                            {formatCurrency(item.simulation.inputs.unitPriceUsd, 'USD')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-black text-brand-blue">
                              {formatCurrency(item.results.unitAccountingCost)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-right text-gray-900">
                            {item.results.importFactor.toFixed(4).replace('.', ',')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => {
                                setActiveIndex(idx);
                                setActiveView('simulator');
                              }}
                              className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Settings2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Créditos Recuperáveis</div>
                  <div className="text-2xl font-black text-green-600">
                    {formatCurrency(allResults.reduce((acc, curr) => acc + curr.results.totalRecoverableTaxes, 0))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeView === 'client' ? (
            <motion.div 
              key="client"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-8 space-y-8">
                <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-400" />
                      <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-xs">Dados do Cliente</h2>
                    </div>
                    <button 
                      onClick={clearClientData}
                      className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      LIMPAR DADOS
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Nome da Empresa</label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input 
                            type="text"
                            value={clientData.companyName}
                            onChange={(e) => setClientData({...clientData, companyName: e.target.value})}
                            placeholder="Ex: Cetus Logistics LTDA"
                            className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Contato / Responsável</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input 
                            type="text"
                            value={clientData.contactPerson}
                            onChange={(e) => setClientData({...clientData, contactPerson: e.target.value})}
                            placeholder="Nome do responsável"
                            className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input 
                            type="email"
                            value={clientData.email}
                            onChange={(e) => setClientData({...clientData, email: e.target.value})}
                            placeholder="email@empresa.com.br"
                            className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Telefone</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input 
                            type="text"
                            value={clientData.phone}
                            onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                            placeholder="(11) 99999-9999"
                            className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Endereço (Opcional)</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                        <textarea 
                          value={clientData.address}
                          onChange={(e) => setClientData({...clientData, address: e.target.value})}
                          placeholder="Endereço completo da empresa"
                          rows={3}
                          className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                  <h3 className="font-bold text-brand-blue mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Dica
                  </h3>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    Os dados do cliente serão salvos automaticamente no seu navegador e incluídos no cabeçalho da proposta comercial.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : activeView === 'drafts' ? (
            <motion.div 
              key="drafts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-brand-blue tracking-tight">MEUS RASCUNHOS</h2>
                <div className="text-sm text-gray-500 font-medium">{drafts.length} rascunhos salvos</div>
              </div>
              <DraftsList drafts={drafts} onLoad={loadDraft} onDelete={deleteDraft} />
            </motion.div>
          ) : activeView === 'proposal' ? (
            <motion.div 
              key="proposal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-8 space-y-8">
                <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-gray-400" />
                    <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-xs">Configurações da Proposta</h2>
                  </div>
                  <div className="p-6 space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Observações Comerciais</label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setProposalData({...proposalData, observations: proposalData.observations + (proposalData.observations ? '\n' : '') + '• Prazo: 30 dias após emissão'})}
                            className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors"
                          >
                            + Prazo
                          </button>
                          <button 
                            onClick={() => setProposalData({...proposalData, observations: proposalData.observations + (proposalData.observations ? '\n' : '') + '• Pagamento: 50% adiantado, 50% na entrega'})}
                            className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors"
                          >
                            + Pagamento
                          </button>
                          <button 
                            onClick={() => setProposalData({...proposalData, observations: proposalData.observations + (proposalData.observations ? '\n' : '') + '• Forma de envio: CIF/FOB'})}
                            className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors"
                          >
                            + Envio
                          </button>
                        </div>
                      </div>
                      <textarea 
                        value={proposalData.observations}
                        onChange={(e) => setProposalData({...proposalData, observations: e.target.value})}
                        placeholder="Adicione observações específicas para esta proposta..."
                        rows={6}
                        className="w-full border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all resize-none"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Termos e Condições</label>
                      <textarea 
                        value={proposalData.terms}
                        onChange={(e) => setProposalData({...proposalData, terms: e.target.value})}
                        rows={4}
                        className="w-full border border-gray-100 bg-gray-50/50 rounded-xl py-3 px-4 text-xs font-medium text-gray-600 outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all resize-none"
                      />
                    </div>

                    <div className="space-y-2 max-w-md">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Responsável / Assinante</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                          type="text"
                          value={proposalData.signer}
                          onChange={(e) => setProposalData({...proposalData, signer: e.target.value})}
                          className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
              <div className="lg:col-span-4">
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                  <h3 className="font-bold text-amber-700 mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Validação
                  </h3>
                  <p className="text-sm text-amber-800 leading-relaxed mb-4">
                    Para gerar uma proposta profissional, certifique-se de que todos os produtos foram simulados corretamente.
                  </p>
                  <ul className="text-xs text-amber-700 space-y-2 list-disc pl-4">
                    <li>Produtos simulados: {simulations.length}</li>
                    <li>Cliente preenchido: {clientData.companyName ? 'Sim' : 'Não'}</li>
                    <li>Observações: {proposalData.observations ? 'Sim' : 'Não'}</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          ) : activeView === 'pre-proposal' ? (
            <motion.div 
              key="pre-proposal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-brand-blue tracking-tight">PRÉ-PROPOSTA COMERCIAL</h2>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveView('proposal')}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all flex items-center gap-2"
                  >
                    VOLTAR
                  </button>
                  <button 
                    onClick={exportPreProposalToExcel}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-green-600 text-white hover:bg-green-700 transition-all shadow-md flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    EXCEL
                  </button>
                  <button 
                    onClick={generateProposalPDF}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-brand-blue text-white hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
                  >
                    <FileCheck className="w-4 h-4" />
                    GERAR PROPOSTA PDF
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Cód. Produto</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Descrição</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">NCM</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Quantidade</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Valor FOB USD</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Unit BRL</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Subtotal BRL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allResults.map((item, idx) => {
                        const adjustedQty = proposalData.adjustedQuantities[item.simulation.id] ?? (item.simulation.inputs.quantityPerContainer * item.simulation.inputs.containerQuantity);
                        const unitBrl = item.results.unitAccountingCost;
                        const subtotal = unitBrl * adjustedQty;

                        return (
                          <tr key={item.simulation.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-brand-dark">{item.simulation.name}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {item.simulation.inputs.productDescription}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{item.simulation.inputs.ncm}</td>
                            <td className="px-6 py-4">
                              <input 
                                type="text"
                                defaultValue={formatNumber(adjustedQty)}
                                onBlur={(e) => {
                                  const rawValue = e.target.value.replace(/\D/g, '');
                                  const val = parseInt(rawValue, 10) || 0;
                                  setProposalData({
                                    ...proposalData,
                                    adjustedQuantities: {
                                      ...proposalData.adjustedQuantities,
                                      [item.simulation.id]: val
                                    }
                                  });
                                  e.target.value = formatNumber(val);
                                }}
                                className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-brand-blue outline-none text-center"
                              />
                            </td>
                            <td className="px-6 py-4 text-sm text-right text-gray-500">
                              {formatCurrency(item.simulation.inputs.unitPriceUsd, 'USD')}
                            </td>
                            <td className="px-6 py-4 text-sm text-right text-gray-500">
                              {formatCurrency(unitBrl)}
                            </td>
                            <td className="px-6 py-4 text-sm font-black text-right text-brand-blue">
                              {formatCurrency(subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Consolidated Summary for Pre-Proposal */}
              <div className="grid grid-cols-1 gap-6">
                {(() => {
                  const totals = allResults.reduce((acc, curr) => {
                    const adjustedQty = proposalData.adjustedQuantities[curr.simulation.id] ?? (curr.simulation.inputs.quantityPerContainer * curr.simulation.inputs.containerQuantity);
                    const originalQty = curr.simulation.inputs.quantityPerContainer * curr.simulation.inputs.containerQuantity;
                    const ratio = originalQty > 0 ? adjustedQty / originalQty : 0;

                    return {
                      usd: acc.usd + (curr.simulation.inputs.unitPriceUsd * adjustedQty),
                      brl: acc.brl + (curr.results.totalImportCost * ratio),
                      credits: acc.credits + (curr.results.totalRecoverableTaxes * ratio),
                      net: acc.net + (curr.results.netAccountingCost * ratio)
                    };
                  }, { usd: 0, brl: 0, credits: 0, net: 0 });

                  return (
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Previsão de Custo Final líquido em Estoque</div>
                      <div className={`font-black text-brand-blue ${formatCurrency(totals.net).length > 15 ? 'text-xl' : 'text-2xl'}`}>
                        {formatCurrency(totals.net)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="simulator"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
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
                  label="Código Produto" 
                  value={inputs.productCode}
                  onChange={(v) => {
                    handleInputChange('productCode', v);
                    renameSimulation(activeIndex, v);
                  }}
                  isManual
                />
                <TextInputGroup 
                  label="Descrição do Produto" 
                  value={inputs.productDescription}
                  onChange={(v) => handleInputChange('productDescription', v)}
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
                  isQuantity
                  isManual
                />
                <InputGroup 
                  label="Quantidade de Containers" 
                  icon={<Package className="w-4 h-4" />}
                  value={inputs.containerQuantity}
                  onChange={(v) => handleInputChange('containerQuantity', v)}
                  isQuantity
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
                  label="Total de Itens" 
                  icon={<Package className="w-4 h-4" />}
                  value={inputs.quantityPerContainer * inputs.containerQuantity}
                  onChange={() => {}}
                  isQuantity
                  readOnly
                />
                <InputGroup 
                  label="Frete Internacional / Container (USD)" 
                  icon={<Truck className="w-4 h-4" />}
                  value={inputs.internationalFreightUsd}
                  onChange={(v) => handleInputChange('internationalFreightUsd', v)}
                  isManual
                  percentage={(results.freteInternacionalBrl / results.totalImportCost) * 100}
                />
                <InputGroup 
                  label="Seguro (BRL - 0,185% CIF)" 
                  icon={<ShieldCheck className="w-4 h-4" />}
                  value={results.seguroBrl}
                  onChange={() => {}}
                  readOnly
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
                  tooltip="Alíquota de ICMS aplicada sobre a base de cálculo 'por dentro'."
                />
              </div>
              
              {/* Recovery Toggles */}
              <div className="px-6 py-4 bg-blue-50/30 border-t border-gray-100">
                <h3 className="text-xs font-bold text-brand-blue uppercase tracking-widest mb-4">Recuperação de Créditos (Lucro Real)</h3>
                <div className="flex flex-wrap gap-6">
                  <Checkbox label="PIS" checked={inputs.recoverPis} onChange={(v) => handleInputChange('recoverPis', v)} />
                  <Checkbox label="COFINS" checked={inputs.recoverCofins} onChange={(v) => handleInputChange('recoverCofins', v)} />
                  <Checkbox label="IPI" checked={inputs.recoverIpi} onChange={(v) => handleInputChange('recoverIpi', v)} />
                  <Checkbox label="ICMS" checked={inputs.recoverIcms} onChange={(v) => handleInputChange('recoverIcms', v)} />
                  <Checkbox label="Frete Rodov. (PIS/COFINS)" checked={inputs.recoverRoadFreightTax} onChange={(v) => handleInputChange('recoverRoadFreightTax', v)} />
                </div>
              </div>
            </section>

            {/* Operational Expenses Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-xs">Despesas Operacionais (R$)</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex flex-col gap-4 col-span-1">
                  <InputGroup 
                    label="Siscomex" 
                    value={inputs.siscomex} 
                    onChange={(v) => handleInputChange('siscomex', v)} 
                    prefix="R$" 
                  />
                  <InputGroup 
                    label="AFRMM (8%)" 
                    value={results.finalAfrmm} 
                    onChange={() => {}} 
                    prefix="R$" 
                    readOnly 
                    percentage={(results.finalAfrmm / results.totalImportCost) * 100}
                  />
                </div>
                <div className="flex flex-col gap-4 col-span-1">
                  <InputGroup label="Capatazias / Cont." value={inputs.thc} onChange={(v) => handleInputChange('thc', v)} prefix="R$" />
                  <InputGroup label="Total THC" value={results.finalThc} onChange={() => {}} prefix="R$" readOnly />
                </div>
                <InputGroup label="Liberação BL" value={550} onChange={() => {}} prefix="R$" readOnly />
                <InputGroup label="Despachante" value={1200} onChange={() => {}} prefix="R$" readOnly />
                <div className="flex flex-col gap-4 col-span-1">
                  <InputGroup 
                    label="Armazenagem (%)" 
                    value={0.23} 
                    onChange={() => {}} 
                    suffix="%" 
                    readOnly 
                  />
                  <InputGroup 
                    label="Total Armaz." 
                    value={results.finalStorage} 
                    onChange={() => {}} 
                    prefix="R$" 
                    readOnly 
                    percentage={(results.finalStorage / results.totalImportCost) * 100}
                  />
                </div>
                <div className="flex flex-col gap-4 col-span-1">
                  <InputGroup label="Levante / Cont." value={inputs.lifting} onChange={(v) => handleInputChange('lifting', v)} prefix="R$" />
                  <InputGroup 
                    label="Total Levante" 
                    value={results.finalLifting} 
                    onChange={() => {}} 
                    prefix="R$" 
                    readOnly 
                    percentage={(results.finalLifting / results.totalImportCost) * 100}
                  />
                </div>
                <div className="flex flex-col gap-4 col-span-1">
                  <InputGroup label="Pesagem / Cont." value={inputs.weighing} onChange={(v) => handleInputChange('weighing', v)} prefix="R$" />
                  <InputGroup 
                    label="Total Pesagem" 
                    value={results.finalWeighing} 
                    onChange={() => {}} 
                    prefix="R$" 
                    readOnly 
                    percentage={(results.finalWeighing / results.totalImportCost) * 100}
                  />
                </div>
                <InputGroup label="Frete Rodoviário" value={inputs.roadFreight} onChange={(v) => handleInputChange('roadFreight', v)} prefix="R$" />
                <InputGroup label="Outras Despesas" value={600} onChange={() => {}} prefix="R$" readOnly />
              </div>
            </section>
          </div>

          {/* Right Column: Results Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              {/* Main Result Card */}
              <motion.div 
                layout
                className="bg-brand-blue rounded-2xl shadow-xl shadow-blue-200 p-8 text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <span className="text-blue-50 font-bold text-xs uppercase tracking-widest">Custo Unitário Final</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowBreakdown(true)}
                      className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-all flex items-center gap-1"
                    >
                      <TrendingUp className="w-3 h-3" />
                      VER COMPOSIÇÃO
                    </button>
                    <button 
                      onClick={copyResults}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-300" /> : <Copy className="w-5 h-5 text-blue-100" />}
                    </button>
                  </div>
                </div>
                <div className="mb-8 relative z-10">
                  <div className={`font-black mb-1 tracking-tighter transition-all duration-300 ${
                    formatCurrency(results.unitAccountingCost).length > 15 ? 'text-4xl' :
                    formatCurrency(results.unitAccountingCost).length > 12 ? 'text-5xl' :
                    formatCurrency(results.unitAccountingCost).length > 10 ? 'text-6xl' : 'text-7xl'
                  }`}>
                    {formatCurrency(results.unitAccountingCost)}
                  </div>
                  <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest opacity-80">Custo líquido por unidade</p>
                </div>
                
                <div className="space-y-3 pt-6 border-t border-white/10 relative z-10">
                  <ResultRow label="Custo Total (BRL)" value={formatCurrency(results.totalImportCost)} />
                  <ResultRow label="Total Créditos" value={formatCurrency(results.totalRecoverableTaxes)} isCredit />
                  <div className="my-2 border-t border-white/5" />
                  <ResultRow label="Custo Contábil" value={formatCurrency(results.netAccountingCost)} bold />
                  <ResultRow 
                    label="Fator de Importação" 
                    value={results.importFactor.toFixed(4).replace('.', ',')} 
                    secondary 
                    tooltip="Multiplicador aplicado ao valor FOB para chegar ao custo final."
                  />
                </div>
              </motion.div>

              {/* Insights Card */}
              <SimulationInsights results={results} inputs={inputs} />

              {/* Breakdown Mini Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resumo Aduaneiro</h3>
                <div className="space-y-3">
                  <MiniResultRow label="Valor FOB" value={formatCurrency(results.valorFobBrl)} />
                  <MiniResultRow 
                    label="Frete Internacional" 
                    value={formatCurrency(results.freteInternacionalBrl)} 
                    percentage={(results.freteInternacionalBrl / results.valorAduaneiroBrl) * 100}
                    percentageLabel="do CIF"
                  />
                  <MiniResultRow 
                    label="Seguro" 
                    value={formatCurrency(results.seguroBrl)} 
                    percentage={(results.seguroBrl / results.valorAduaneiroBrl) * 100}
                    percentageLabel="do CIF"
                  />
                  <div className="border-t border-gray-50 my-1" />
                  <MiniResultRow 
                    label="Valor Aduaneiro (CIF)" 
                    value={formatCurrency(results.valorAduaneiroBrl)} 
                    tooltip="Soma do FOB + Frete + Seguro. Base para impostos federais."
                  />
                  <MiniResultRow 
                    label="Total Impostos" 
                    value={formatCurrency(results.totalTaxes)} 
                    percentage={(results.totalTaxes / results.valorAduaneiroBrl) * 100}
                    percentageLabel="do CIF"
                  />
                  <MiniResultRow 
                    label="Despesas Operacionais" 
                    value={formatCurrency(results.totalOperationalExpenses)} 
                    percentage={(results.totalOperationalExpenses / results.totalImportCost) * 100}
                    percentageLabel="do custo"
                  />
                </div>
              </div>

              {/* Info Tip */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3">
                <Info className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  Os cálculos de ICMS utilizam a modalidade "por dentro", conforme legislação brasileira vigente para importações.
                  <Tooltip text="O imposto faz parte da sua própria base de cálculo." />
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown Table */}
            <section className="lg:col-span-12 mt-12 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <h2 className="font-semibold text-gray-700 uppercase tracking-wider text-xs">Detalhamento de Custos</h2>
                </div>
                <button className="text-brand-blue hover:text-blue-700 text-xs font-bold flex items-center gap-1">
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
                    <TableRow label="Frete Rodoviário" value={inputs.roadFreight} total={results.totalImportCost} />
                    <TableRow label="Despesas Operacionais" value={results.totalOperationalExpenses - inputs.roadFreight} total={results.totalImportCost} />
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
          </motion.div>
        )}
      </AnimatePresence>
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
function InputGroup({ label, value, onChange, icon, prefix, suffix, isManual, readOnly, isQuantity, percentage, tooltip }: { 
  label: string, 
  value: number, 
  onChange: (v: number) => void,
  icon?: ReactNode,
  prefix?: string,
  suffix?: string,
  isManual?: boolean,
  readOnly?: boolean,
  isQuantity?: boolean,
  percentage?: number,
  tooltip?: string
}) {
  const formatNumber = (v: number) => {
    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: isQuantity ? 0 : 2,
      minimumFractionDigits: isQuantity ? 0 : 2,
    }).format(v);
  };

  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(formatNumber(value));

  useEffect(() => {
    if (!isFocused) {
      const formatted = formatNumber(value);
      if (localValue !== formatted) {
        setLocalValue(formatted);
      }
    }
  }, [value, isQuantity, isFocused]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
          {label}
          {tooltip && <Tooltip text={tooltip} />}
        </label>
        {isManual && <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">Manual</span>}
      </div>
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
          type="text"
          value={localValue}
          placeholder="0"
          readOnly={readOnly}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => {
            const inputValue = e.target.value;
            setLocalValue(inputValue);
            
            let val: number;
            if (isQuantity) {
              // Remove all non-digits for quantities
              const cleaned = inputValue.replace(/\D/g, '');
              val = parseInt(cleaned, 10) || 0;
            } else {
              // Remove thousand separators (dots) and use comma as decimal
              const normalized = inputValue.replace(/\./g, '').replace(',', '.');
              val = parseFloat(normalized) || 0;
            }
            
            if (!isNaN(val)) onChange(val);
          }}
          onBlur={() => {
            setIsFocused(false);
            setLocalValue(formatNumber(value));
          }}
          className={`w-full border rounded-xl py-2.5 px-4 text-sm font-bold outline-none transition-all 
            ${readOnly ? 'bg-gray-50 border-gray-100 cursor-not-allowed text-gray-400' : 'border-gray-200 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-gray-900'}
            ${isManual ? 'bg-yellow-50/50 border-yellow-100' : 'bg-white'}
            ${icon || prefix ? 'pl-10' : ''} ${suffix || percentage !== undefined ? 'pr-24' : ''}`}
        />
        {(suffix || percentage !== undefined) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {percentage !== undefined && (
              <span className="text-[10px] font-black text-brand-blue bg-blue-50 px-1.5 py-0.5 rounded">
                {percentage.toFixed(1)}%
              </span>
            )}
            {suffix && <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{suffix}</span>}
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
      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${checked ? 'bg-brand-blue border-brand-blue' : 'bg-white border-gray-300 group-hover:border-brand-blue'}`}>
        {checked && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="hidden" />
      <span className={`text-sm font-semibold ${checked ? 'text-brand-blue' : 'text-gray-500'}`}>{label}</span>
    </label>
  );
}

function ResultRow({ label, value, bold, isCredit, secondary, tooltip }: { 
  label: string, 
  value: string, 
  bold?: boolean, 
  isCredit?: boolean, 
  secondary?: boolean,
  tooltip?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`flex items-center gap-1 ${bold ? 'text-sm font-bold text-white' : secondary ? 'text-[10px] font-medium text-blue-300' : 'text-xs font-medium text-blue-100'}`}>
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </span>
      <span className={`
        ${bold ? (value.length > 15 ? 'text-base' : 'text-xl') + ' font-black text-white' : secondary ? 'text-xs font-bold text-blue-200' : (value.length > 15 ? 'text-xs' : 'text-sm') + ' font-bold text-blue-50'}
        ${isCredit ? 'text-green-400' : ''}
      `}>
        {isCredit ? `- ${value}` : value}
      </span>
    </div>
  );
}

function MiniResultRow({ label, value, percentage, percentageLabel, tooltip }: { 
  label: string, 
  value: string, 
  percentage?: number, 
  percentageLabel?: string,
  tooltip?: string
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500 flex items-center gap-1">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-gray-900">{value}</span>
        {percentage !== undefined && (
          <span className="text-[10px] font-black text-brand-blue bg-blue-50 px-1.5 py-0.5 rounded">
            {percentage.toFixed(1)}% {percentageLabel || ''}
          </span>
        )}
      </div>
    </div>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-block">
      <Info className="w-3 h-3 text-current opacity-60 cursor-help" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-[10px] rounded shadow-xl z-[110] leading-tight font-normal normal-case">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </span>
  );
}

function SimulationInsights({ results, inputs }: { results: ImportResults, inputs: ImportInputs }) {
  const freightPercentage = (results.freteInternacionalBrl / results.totalImportCost) * 100;
  const taxPercentageOfCif = (results.totalTaxes / results.valorAduaneiroBrl) * 100;
  const totalQuantity = inputs.quantityPerContainer * inputs.containerQuantity;

  const insights = [];

  if (freightPercentage > 25) {
    insights.push({
      type: 'warning',
      text: `Frete elevado: ${freightPercentage.toFixed(1)}% do custo total`,
      icon: <span className="text-orange-500">⚠️</span>
    });
  }

  if (taxPercentageOfCif > 30) {
    insights.push({
      type: 'warning',
      text: `Carga tributária elevada: ${taxPercentageOfCif.toFixed(1)}% do CIF`,
      icon: <span className="text-orange-500">⚠️</span>
    });
  }

  if (totalQuantity > 150000) {
    insights.push({
      type: 'success',
      text: `Volume contribui para diluição de custos fixos`,
      icon: <span className="text-green-500">✅</span>
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Insights da Simulação</h3>
      <div className="space-y-3">
        {insights.length === 0 && (
          <p className="text-xs text-gray-400 italic">Nenhum alerta relevante para esta configuração.</p>
        )}
        {insights.map((insight, idx) => (
          <div key={idx} className="flex items-start gap-3 text-xs font-bold text-gray-700 leading-tight">
            {insight.icon}
            <span>{insight.text}</span>
          </div>
        ))}
        <div className="flex items-start gap-3 text-[10px] font-bold text-gray-400 pt-3 border-t border-gray-50 uppercase tracking-wider">
          <DollarSign className="w-3 h-3" />
          <span>Câmbio considerado: R$ {inputs.dollarRate.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>
    </div>
  );
}

function BreakdownModal({ isOpen, onClose, results, inputs }: { isOpen: boolean, onClose: () => void, results: ImportResults, inputs: ImportInputs }) {
  if (!isOpen) return null;

  const totalQuantity = inputs.quantityPerContainer * inputs.containerQuantity;
  const unitFob = results.valorFobBrl / totalQuantity;
  const unitFreight = results.freteInternacionalBrl / totalQuantity;
  const unitInsurance = results.seguroBrl / totalQuantity;
  const unitTaxes = results.totalTaxes / totalQuantity;
  const unitOperational = results.totalOperationalExpenses / totalQuantity;
  const unitCredits = results.totalRecoverableTaxes / totalQuantity;

  // Ensure the sum matches exactly by using the same unit cost calculation
  const unitFinalCost = results.unitAccountingCost;

  const format = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
      >
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">Composição do Custo</h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Detalhamento Unitário</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-all">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-8">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="text-left pb-4 font-bold">Item</th>
                <th className="text-right pb-4 font-bold">Valor (R$ / un)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <BreakdownRow label="Produto (FOB unitário)" value={unitFob} />
              <BreakdownRow label="Frete internacional unitário" value={unitFreight} />
              <BreakdownRow label="Seguro unitário" value={unitInsurance} />
              <BreakdownRow label="Impostos unitários" value={unitTaxes} />
              <BreakdownRow label="Despesas operacionais unitárias" value={unitOperational} />
              <BreakdownRow label="Créditos unitários" value={-unitCredits} isNegative />
              <tr>
                <td colSpan={2} className="py-4">
                  <div className="border-t-2 border-dashed border-gray-100" />
                </td>
              </tr>
              <tr className="bg-brand-blue/5">
                <td className="py-4 px-3 font-black text-brand-blue text-sm uppercase tracking-tight">Custo Unitário Final</td>
                <td className={`py-4 px-3 font-black text-brand-blue text-right tracking-tighter ${format(unitFinalCost).length > 15 ? 'text-sm' : 'text-lg'}`}>{format(unitFinalCost)}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="mt-8 pt-6 border-t border-gray-50 flex flex-col items-center gap-2">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center leading-relaxed">
              Valores calculados com base nos parâmetros<br />informados na simulação.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function BreakdownRow({ label, value, isNegative }: { label: string, value: number, isNegative?: boolean }) {
  const format = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  return (
    <tr className="group hover:bg-gray-50/50 transition-colors">
      <td className="py-4 text-xs text-gray-600 font-semibold">{label}</td>
      <td className={`py-4 text-right font-bold tracking-tight ${format(Math.abs(value)).length > 15 ? 'text-xs' : 'text-sm'} ${isNegative ? 'text-green-600' : 'text-gray-900'}`}>
        {isNegative ? `- ${format(Math.abs(value))}` : format(value)}
      </td>
    </tr>
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

function DraftsList({ drafts, onLoad, onDelete }: { 
  drafts: Draft[], 
  onLoad: (d: Draft) => void, 
  onDelete: (id: string, e: MouseEvent) => void 
}) {
  if (drafts.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <History className="w-4 h-4 text-gray-400" />
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rascunhos Salvos</h3>
      </div>
      <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
        {drafts.map((draft) => (
          <div 
            key={draft.id}
            onClick={() => onLoad(draft)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group flex items-center justify-between"
          >
            <div className="min-w-0">
              <div className="font-bold text-sm text-gray-900 truncate">{draft.clientData.companyName || 'Sem Nome'}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-tighter">
                {new Date(draft.timestamp).toLocaleString('pt-BR')} • {draft.simulations.length} itens
              </div>
            </div>
            <button 
              onClick={(e) => onDelete(draft.id, e)}
              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
