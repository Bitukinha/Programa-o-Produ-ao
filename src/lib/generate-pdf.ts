import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SECTOR_LABEL, STATUS_LABEL, type Order, type Sector } from "./orders";
import logoUrl from "@/assets/nutrimilho-logo.png";

const GREEN: [number, number, number] = [34, 110, 50];
const GREEN_DARK: [number, number, number] = [20, 70, 32];
const MUTED: [number, number, number] = [102, 102, 102];

const STATUS_BG: Record<Order["status"], [number, number, number]> = {
  em_producao: [255, 241, 214],
  pendente: [238, 238, 238],
  concluida: [214, 245, 227],
};
const STATUS_FG: Record<Order["status"], [number, number, number]> = {
  em_producao: [180, 83, 9],
  pendente: [68, 68, 68],
  concluida: [21, 128, 61],
};

const SECTOR_TITLE: Record<Sector, string> = {
  extrusora: "EXTRUSORA – PRODUÇÃO",
  moagem: "MOAGEM – PRODUÇÃO",
};

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "numeric" });
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function buildTodayAndTomorrowLabel() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const sameMonth = today.getMonth() === tomorrow.getMonth();
  const sameYear = today.getFullYear() === tomorrow.getFullYear();
  const dayPart = `${formatDate(today)} e ${formatDate(tomorrow)}`;
  const monthYear = formatMonthYear(today);
  if (sameMonth && sameYear) {
    return `${dayPart} de ${monthYear}`;
  }
  return `${dayPart} de ${formatMonthYear(today)} / ${formatMonthYear(tomorrow)}`;
}

function buildShortLabel() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return `${today.toLocaleDateString("pt-BR")} - ${tomorrow.toLocaleDateString("pt-BR")}`;
}

async function loadLogoDataUrl(): Promise<string> {
  const res = await fetch(logoUrl);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generateProductionPdf(orders: Order[], dateLabel = buildTodayAndTomorrowLabel()) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;

  // Logo
  try {
    const logo = await loadLogoDataUrl();
    const logoW = 110;
    const logoH = 36;
    doc.addImage(logo, "PNG", margin, 30, logoW, logoH);
  } catch {
    // ignore logo errors
  }

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...GREEN);
  doc.text("Programação de Produção", pageW / 2, 60, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text(dateLabel, pageW / 2, 78, { align: "center" });

  let cursorY = 105;


  const sectors: Sector[] = ["extrusora", "moagem"];
  for (const sector of sectors) {
    const list = orders.filter((o) => o.sector === sector);
    if (list.length === 0) continue;

    cursorY = ensureSpace(doc, cursorY, 60);
    // Sector banner
    doc.setFillColor(...GREEN);
    doc.rect(margin, cursorY, pageW - margin * 2, 28, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(SECTOR_TITLE[sector], margin + 12, cursorY + 18);
    cursorY += 40;

    for (const op of list) {
      cursorY = renderOrder(doc, op, cursorY, margin, pageW);
    }
    cursorY += 6;
  }

  // Footer page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Programação de Produção – ${buildShortLabel()}`, margin, doc.internal.pageSize.getHeight() - 20);
    doc.text(`Página ${i} de ${pageCount}`, pageW - margin, doc.internal.pageSize.getHeight() - 20, {
      align: "right",
    });
  }

  doc.save(`programacao-producao-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 40) {
    doc.addPage();
    return 50;
  }
  return y;
}

function renderOrder(doc: jsPDF, op: Order, startY: number, margin: number, pageW: number): number {
  // Order title
  let y = ensureSpace(doc, startY, 80);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...GREEN);
  const titleParts = `${op.sequence}ª Ordem de Produção`;
  doc.text(titleParts, margin, y);
  if (op.status === "em_producao") {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(233, 120, 37);
    const w = doc.getTextWidth(titleParts);
    doc.text(" (Em produção)", margin + w + 4, y);
  }

  // Status pill (right)
  const pillW = 90;
  const pillH = 16;
  const pillX = pageW - margin - pillW;
  const pillY = y - 12;
  doc.setFillColor(...STATUS_BG[op.status]);
  doc.roundedRect(pillX, pillY, pillW, pillH, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...STATUS_FG[op.status]);
  doc.text(STATUS_LABEL[op.status].toUpperCase(), pillX + pillW / 2, pillY + 11, { align: "center" });

  y += 8;

  // Info table
  const rows: [string, string][] = [];
  const add = (label: string, value?: string | null) => {
    if (value) rows.push([label, value]);
  };
  add("OP Nº", op.op_number);
  add("Peneira", op.peneira);
  add("Cliente", op.cliente);
  add("Produto", op.produto);
  add("Linha de envase", op.linha_envase);
  add("Total do Pedido", op.total_pedido);
  add("Embalagem", op.embalagem);
  if (op.turno) add("Turno", op.turno);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: rows,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 5, textColor: [20, 20, 20], lineColor: [221, 221, 221] },
    columnStyles: {
      0: { fontStyle: "bold", textColor: MUTED, fillColor: [248, 248, 248], cellWidth: 110 },
      1: { fontStyle: "normal" },
    },
    didParseCell: (data) => {
      if (data.column.index === 1 && data.row.raw && (data.row.raw as string[])[0] === "Cliente") {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 4;

  if (op.observacao) {
    y = ensureSpace(doc, y, 30);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    const text = `Obs.: ${op.observacao}`;
    const wrapped = doc.splitTextToSize(text, pageW - margin * 2);
    doc.text(wrapped, margin, y + 8);
    y += 8 + wrapped.length * 11;
  }

  return y + 12;
}
