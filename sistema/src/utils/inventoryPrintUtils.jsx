/* ============================================================
   INVENTORY PRINT UTILS — IMPÉRIO SUCATA
   Relatório de estoque A4 profissional e moderno
   ============================================================ */

const D = {
  navy: "#0f172a",
  slate: "#334155",
  muted: "#64748b",
  light: "#94a3b8",
  hairline: "#e2e8f0",
  bg: "#f8fafc",
  green: "#059669",
  greenBg: "#ecfdf5",
  greenText: "#065f46",
  red: "#dc2626",
  redBg: "#fef2f2",
  redText: "#7f1d1d",
  blue: "#2563eb",
  white: "#ffffff",
};

const fmtR = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0,
  );

export const printInventory = (inventory, materials) => {
  const win = window.open("", "_blank");
  if (!win) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let totalValue = 0;
  let totalQuantity = 0;
  let lowCount = 0;

  const rows = materials
    .map((m) => {
      const item = inventory[m.key] || {
        quantidade: 0,
        precoCompra: 0,
        precoVenda: 0,
      };
      const value = item.quantidade * item.precoCompra;
      const isLow = item.quantidade <= m.minStock;
      totalValue += value;
      totalQuantity += item.quantidade;
      if (isLow) lowCount++;
      return { ...m, ...item, value, isLow };
    })
    .sort((a, b) => b.value - a.value);

  /* ── HTML/CSS do documento ─────────────────────────────── */
  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Estoque — Império Sucata</title>
  <style>
    /* Reset e base */
    @page { size: A4; margin: 14mm 14mm 18mm; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 9pt;
      line-height: 1.5;
      color: ${D.slate};
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Cabeçalho ── */
    .header {
      background: ${D.navy};
      color: white;
      padding: 12pt 16pt 10pt;
      margin: -14mm -14mm 0;   /* sangra até a margem de @page */
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .header-accent {
      height: 3pt;
      background: ${D.blue};
      margin: 0 -14mm 16pt;
    }

    .header-company { }
    .header-company h1 {
      font-size: 20pt;
      font-weight: 800;
      letter-spacing: -0.5pt;
      line-height: 1;
    }
    .header-company p {
      font-size: 7.5pt;
      color: #94a3b8;
      margin-top: 2pt;
    }

    .header-meta {
      text-align: right;
    }
    .header-meta .report-title {
      font-size: 11pt;
      font-weight: 700;
      color: white;
    }
    .header-meta .report-sub {
      font-size: 7.5pt;
      color: #94a3b8;
      margin-top: 3pt;
    }

    /* ── KPIs ── */
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8pt;
      margin-bottom: 16pt;
    }

    .kpi {
      background: ${D.bg};
      border-radius: 5pt;
      padding: 8pt 10pt;
      position: relative;
      overflow: hidden;
    }

    .kpi::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3pt;
    }

    .kpi.green::before { background: ${D.green}; }
    .kpi.blue::before  { background: ${D.blue}; }
    .kpi.red::before   { background: ${D.red}; }
    .kpi.navy::before  { background: ${D.navy}; }

    .kpi-label {
      font-size: 6.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      color: ${D.light};
      margin-bottom: 4pt;
    }

    .kpi-value {
      font-size: 13pt;
      font-weight: 800;
      line-height: 1;
    }

    .kpi.green .kpi-value { color: ${D.greenText}; }
    .kpi.blue  .kpi-value { color: ${D.slate}; }
    .kpi.red   .kpi-value { color: ${D.redText}; }
    .kpi.navy  .kpi-value { color: ${D.navy}; }

    /* ── Seção ── */
    .section-title {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      color: ${D.navy};
      display: flex;
      align-items: center;
      gap: 8pt;
      margin-bottom: 8pt;
    }

    .section-title::after {
      content: '';
      flex: 1;
      height: 0.5pt;
      background: ${D.hairline};
    }

    .section-title::before {
      content: '';
      width: 20pt;
      height: 2pt;
      background: ${D.blue};
      flex-shrink: 0;
    }

    /* ── Tabela ── */
    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead th {
      background: ${D.navy};
      color: white;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4pt;
      padding: 5pt 6pt;
      text-align: left;
    }

    thead th.r { text-align: right; }
    thead th.c { text-align: center; }

    tbody td {
      padding: 5pt 6pt;
      font-size: 8.5pt;
      border-bottom: 0.5pt solid ${D.hairline};
      vertical-align: middle;
    }

    tbody tr:nth-child(even) td { background: ${D.bg}; }

    tbody tr.low-stock td {
      background: ${D.redBg} !important;
      color: ${D.red};
    }

    tbody tr.low-stock .material-name { color: ${D.redText}; font-weight: 700; }

    .material-name { font-weight: 600; color: ${D.slate}; }
    .material-cat  { font-size: 7pt; color: ${D.light}; margin-top: 1pt; }

    .badge-low {
      display: inline-block;
      background: ${D.red};
      color: white;
      font-size: 5.5pt;
      font-weight: 800;
      padding: 1pt 4pt;
      border-radius: 3pt;
      text-transform: uppercase;
      letter-spacing: 0.3pt;
      margin-left: 4pt;
    }

    .text-right  { text-align: right; }
    .text-center { text-align: center; }
    .font-bold   { font-weight: 700; }
    .text-green  { color: ${D.greenText}; }
    .text-red    { color: ${D.redText}; }
    .text-muted  { color: ${D.muted}; }

    /* ── Rodapé da tabela ── */
    tfoot td {
      background: ${D.navy} !important;
      color: white !important;
      font-weight: 700;
      font-size: 8.5pt;
      padding: 6pt;
    }
    tfoot td.r { text-align: right; }

    /* ── Rodapé da página ── */
    .page-footer {
      position: fixed;
      bottom: -14mm;
      left: -14mm;
      right: -14mm;
      padding: 4pt 14mm;
      border-top: 0.5pt solid ${D.hairline};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-footer p {
      font-size: 6.5pt;
      color: ${D.light};
    }

    /* ── Print ── */
    @media print {
      .no-print { display: none !important; }
      body { background: white; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- Cabeçalho -->
  <div class="header">
    <div class="header-company">
      <h1>IMPÉRIO SUCATA</h1>
      <p>Gestão de Reciclagem e Resíduos</p>
    </div>
    <div class="header-meta">
      <div class="report-title">Relatório de Estoque</div>
      <div class="report-sub">Emitido em ${dateStr} às ${timeStr}</div>
    </div>
  </div>

  <div class="header-accent"></div>

  <!-- KPIs -->
  <div class="kpi-strip">
    <div class="kpi green">
      <div class="kpi-label">Valor em Estoque</div>
      <div class="kpi-value">${fmtR(totalValue)}</div>
    </div>
    <div class="kpi blue">
      <div class="kpi-label">Peso Total</div>
      <div class="kpi-value">${totalQuantity.toFixed(2)} kg</div>
    </div>
    <div class="kpi navy">
      <div class="kpi-label">Materiais</div>
      <div class="kpi-value">${materials.length}</div>
    </div>
    <div class="kpi ${lowCount > 0 ? "red" : "green"}">
      <div class="kpi-label">Alertas de Estoque</div>
      <div class="kpi-value">${lowCount}</div>
    </div>
  </div>

  <!-- Tabela de materiais -->
  <div class="section-title">Inventário Detalhado</div>

  <table>
    <thead>
      <tr>
        <th style="width:32%">Material</th>
        <th class="r" style="width:14%">Quantidade</th>
        <th class="r" style="width:16%">Preço Compra</th>
        <th class="r" style="width:16%">Preço Venda</th>
        <th class="r" style="width:14%">Margem</th>
        <th class="r" style="width:18%">Valor (Custo)</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map((item) => {
          const margin =
            item.precoCompra > 0
              ? (
                  ((item.precoVenda - item.precoCompra) / item.precoCompra) *
                  100
                ).toFixed(1)
              : "—";
          const margemNum = parseFloat(margin) || 0;
          const margemColor =
            margemNum >= 20
              ? D.greenText
              : margemNum >= 10
                ? "#92400e"
                : D.redText;

          return `
          <tr class="${item.isLow ? "low-stock" : ""}">
            <td>
              <div class="material-name">
                ${item.name}
                ${item.isLow ? '<span class="badge-low">Baixo</span>' : ""}
              </div>
              <div class="material-cat">${item.category || ""}</div>
            </td>
            <td class="text-right font-bold">${item.quantidade.toFixed(2)} kg</td>
            <td class="text-right text-muted">${fmtR(item.precoCompra)}</td>
            <td class="text-right text-muted">${fmtR(item.precoVenda)}</td>
            <td class="text-right font-bold" style="color: ${margemColor}">
              ${margin !== "—" ? margin + "%" : "—"}
            </td>
            <td class="text-right font-bold">${fmtR(item.value)}</td>
          </tr>
        `;
        })
        .join("")}
    </tbody>
    <tfoot>
      <tr>
        <td class="font-bold">${materials.length} materiais</td>
        <td class="r font-bold">${totalQuantity.toFixed(2)} kg</td>
        <td colspan="3"></td>
        <td class="r font-bold">${fmtR(totalValue)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- Rodapé fixo -->
  <div class="page-footer no-print">
    <p>Império Sucata — Documento de uso interno gerado automaticamente</p>
    <p>${dateStr}</p>
  </div>

</body>
</html>`);

  win.document.close();
  setTimeout(() => win.print(), 600);
};

/* ── Exportação CSV (mantida sem alteração) ──────────────── */
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
    ...rows.map((row) => row.map((f) => `"${f}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `estoque_${new Date().toISOString().split("T")[0]}.csv`;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
