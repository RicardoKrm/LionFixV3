/**
 * Utilidad para exportar datos a formato compatible con Microsoft Excel (CSV con UTF-8 BOM).
 * Abre directamente en Excel en español sin problemas de tildes o caracteres especiales.
 */

export function exportToExcel(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  // Escapar celdas para evitar problemas con comas, saltos de línea o comillas
  const formatCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // En Excel en español el separador estándar es punto y coma (;)
  const headerLine = headers.map(formatCell).join(";");
  const dataLines = rows.map((row) => row.map(formatCell).join(";")).join("\r\n");

  const csvContent = "\uFEFF" + headerLine + "\r\n" + dataLines;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
