export const printInventory = (inventory, materials) => {
  const printWindow = window.open("", "_blank");

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR");

  let totalValue = 0;
  let totalQuantity = 0;
  let lowStockCount = 0;

  const inventoryRows = materials
    .map((material) => {
      const item = inventory[material.key] || {
        quantidade: 0,
        precoCompra: 0,
        precoVenda: 0,
      };
      const value = item.quantidade * item.precoCompra;
      const isLowStock = item.quantidade <= material.minStock;

      totalValue += value;
      totalQuantity += item.quantidade;
      if (isLowStock) lowStockCount++;

      return {
        ...material,
        ...item,
        value,
        isLowStock,
      };
    })
    .sort((a, b) => b.value - a.value);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Estoque - Império Sucata</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; }
          body { 
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            font-size: 10pt; 
            line-height: 1.5; 
            color: #2c3e50; 
            background: white;
            padding: 0;
          }
          .header { 
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 20pt; 
            border-bottom: 2pt solid #2c3e50; 
            padding-bottom: 10pt; 
          }
          .header-info h1 { 
            color: #2c3e50; 
            font-size: 22pt; 
            margin: 0;
            letter-spacing: -1px;
          }
          .header-meta {
            text-align: right;
            font-size: 8pt;
            color: #7f8c8d;
          }
          .summary { 
            display: flex;
            justify-content: space-between;
            gap: 10pt;
            margin-bottom: 20pt;
          }
          .summary-item {
            flex: 1;
            padding: 10pt;
            background: #f8f9fa;
            border: 1pt solid #e9ecef;
            border-radius: 4pt;
            text-align: center;
          }
          .summary-label {
            font-size: 7pt;
            color: #7f8c8d;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 4pt;
          }
          .summary-value {
            font-size: 14pt;
            font-weight: bold;
            color: #2c3e50;
          }
          .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20pt; 
          }
          .table th { 
            background-color: #2c3e50; 
            color: white;
            font-weight: bold; 
            text-transform: uppercase;
            font-size: 8pt;
            padding: 8pt 5pt;
            text-align: left;
          }
          .table td { 
            border-bottom: 0.5pt solid #dee2e6; 
            padding: 6pt 5pt; 
            font-size: 9pt; 
          }
          .table tr:nth-child(even) { background-color: #fcfcfc; }
          .low-stock { background-color: #fff5f5 !important; }
          .low-stock td { color: #c0392b; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            font-size: 7pt;
            color: #bdc3c7;
            border-top: 0.5pt solid #eee;
            padding-top: 5pt;
          }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-info">
            <h1>IMPÉRIO SUCATA</h1>
            <p style="font-size: 11pt; color: #7f8c8d;">Relatório de Inventário e Estoque</p>
          </div>
          <div class="header-meta">
            <p>Emissão: ${dateStr} às ${timeStr}</p>
            <p>Sistema de Gestão de Resíduos</p>
          </div>
        </div>

        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Valor em Estoque</div>
            <div class="summary-value">${formatCurrency(totalValue)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Peso Total</div>
            <div class="summary-value">${totalQuantity.toFixed(1)} kg</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Itens Cadastrados</div>
            <div class="summary-value">${materials.length}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Alertas de Estoque</div>
            <div class="summary-value" style="color: ${lowStockCount > 0 ? "#c0392b" : "#27ae60"}">${lowStockCount}</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="width: 35%">Material</th>
              <th style="width: 15%" class="text-right">Quantidade</th>
              <th style="width: 15%" class="text-right">Preço Compra</th>
              <th style="width: 15%" class="text-right">Preço Venda</th>
              <th style="width: 20%" class="text-right">Total (Custo)</th>
            </tr>
          </thead>
          <tbody>
            ${inventoryRows
              .map(
                (item) => `
                <tr class="${item.isLowStock ? "low-stock" : ""}">
                  <td>
                    <span class="bold">${item.name}</span><br>
                    <span style="font-size: 7pt; color: #95a5a6;">${item.category}</span>
                  </td>
                  <td class="text-right">${item.quantidade.toFixed(2)} kg ${item.isLowStock ? ' <span style="font-size: 7pt;">[!]</span>' : ""}</td>
                  <td class="text-right">${formatCurrency(item.precoCompra)}</td>
                  <td class="text-right">${formatCurrency(item.precoVenda)}</td>
                  <td class="text-right bold">${formatCurrency(item.value)}</td>
                </tr>
              `,
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8f9fa;">
              <td class="bold">TOTAIS CONSOLIDADOS</td>
              <td class="text-right bold">${totalQuantity.toFixed(2)} kg</td>
              <td colspan="2"></td>
              <td class="text-right bold" style="font-size: 11pt;">${formatCurrency(totalValue)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="footer">
          Império Sucata - Documento Gerencial de Uso Interno - Gerado automaticamente pelo sistema
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  // Aguarda um pouco para carregar estilos antes de imprimir
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

export const exportInventoryToCSV = (inventory, materials) => {
  const headers = [
    "Material",
    "Categoria",
    "Quantidade (kg)",
    "Preco Compra (R$/kg)",
    "Preco Venda (R$/kg)",
    "Valor Total (R$)",
    "Status",
  ];

  const rows = materials.map((material) => {
    const item = inventory[material.key] || {
      quantidade: 0,
      precoCompra: 0,
      precoVenda: 0,
    };
    const value = item.quantidade * item.precoCompra;
    const isLowStock = item.quantidade <= material.minStock;

    return [
      material.name,
      material.category,
      item.quantidade.toFixed(2),
      item.precoCompra.toFixed(2),
      item.precoVenda.toFixed(2),
      value.toFixed(2),
      isLowStock ? "BAIXO" : "OK",
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((field) => `"${field}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `estoque_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
