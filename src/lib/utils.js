import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Helper interno para garantir números seguros
const safeNum = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  // Tratamento para strings (ex: "1.200,50" ou "1200.50")
  if (typeof value === 'string') {
    const clean = value.replace(/[^\d.,-]/g, '').replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(safeNum(value));
};

export const formatPercent = (value) => {
  // Limita estritamente a 1 casa decimal e trata o erro de NaN
  const num = safeNum(value);
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(num) + '%';
};

export const formatWeight = (value) => {
  const num = safeNum(value);
  // Se for inteiro, não mostra decimais. Se tiver fração, mostra até 2.
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num) + 'kg';
};

export const formatNumber = (value, decimals = 0) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(safeNum(value));
};

export const formatDate = (dateString) => {
  if (!dateString) return '--/--/----';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR');
  } catch (e) { return '--/--/----'; }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (e) { return ''; }
};

export const exportToCSV = (data, filename = 'relatorio.csv') => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(';'),
    ...data.map(row => 
      headers.map(fieldName => 
        JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value)
      ).join(';')
    )
  ];

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.click();
  }
};

export const printInventory = (inventory, materials) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Por favor, permita popups para imprimir.');
    
    const rows = materials.map(material => {
      const item = inventory[material.key] || { quantidade: 0, precoCompra: 0, precoVenda: 0 };
      const total = (item.quantidade || 0) * (item.precoCompra || 0);
      
      return `
        <tr>
          <td>${material.name}</td>
          <td>${material.category}</td>
          <td style="text-align: right">${formatWeight(item.quantidade)}</td>
          <td style="text-align: right">${formatCurrency(item.precoCompra)}</td>
          <td style="text-align: right">${formatCurrency(item.precoVenda)}</td>
          <td style="text-align: right; font-weight: bold;">${formatCurrency(total)}</td>
        </tr>
      `;
    }).join('');
  
    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Estoque - Império Sucata</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            h1 { color: #0f172a; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
            .header-info { margin-bottom: 30px; font-size: 14px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #f8fafc; text-align: left; padding: 12px 8px; border-bottom: 2px solid #e2e8f0; font-weight: 700; color: #475569; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { margin-top: 30px; text-align: right; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Relatório de Estoque</h1>
          <div class="header-info">
            <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Categoria</th>
                <th style="text-align: right">Qtd. Estoque</th>
                <th style="text-align: right">Preço Compra</th>
                <th style="text-align: right">Preço Venda</th>
                <th style="text-align: right">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div class="footer">
            Sistema de Gestão Império Sucata
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  
  export const exportInventoryToCSV = (inventory, materials) => {
    if (!materials || materials.length === 0) return;
  
    const headers = ['Material', 'Categoria', 'Quantidade (kg)', 'Preço Compra', 'Preço Venda', 'Valor Total'];
    
    const rows = materials.map(material => {
      const item = inventory[material.key] || { quantidade: 0, precoCompra: 0, precoVenda: 0 };
      const total = (item.quantidade || 0) * (item.precoCompra || 0);
      
      return [
        material.name,
        material.category,
        (item.quantidade || 0).toFixed(2).replace('.', ','),
        (item.precoCompra || 0).toFixed(2).replace('.', ','),
        (item.precoVenda || 0).toFixed(2).replace('.', ','),
        total.toFixed(2).replace('.', ',')
      ].join(';');
    });
  
    const csvContent = [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `estoque_imperio_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };