import ExcelJS from "exceljs";
import { BadRequestException } from "@nestjs/common";
import { parseDirectoryTable, ParsedDirectoryCsv } from "./directory-csv";

/** Columns on the Directory sheet — same keys as CSV import. */
export const DIRECTORY_EXCEL_COLUMNS = [
  { key: "usn", header: "usn", width: 16 },
  { key: "fullName", header: "fullName", width: 22 },
  { key: "collegeEmail", header: "collegeEmail", width: 32 },
  { key: "password", header: "password", width: 18 },
  { key: "department", header: "department", width: 14 },
  { key: "batch", header: "batch", width: 14 },
  { key: "program", header: "program", width: 12 },
  { key: "hostelite", header: "hostelite", width: 12 },
  { key: "role", header: "role", width: 12 },
  { key: "mobile", header: "mobile", width: 14 },
] as const;

export const DIRECTORY_EXCEL_TEMPLATE_FILENAME = "campus-directory-template.xlsx";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function directoryExcelMimeType(): string {
  return XLSX_MIME;
}

const blackBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF000000" } },
  left: { style: "thin", color: { argb: "FF000000" } },
  bottom: { style: "thin", color: { argb: "FF000000" } },
  right: { style: "thin", color: { argb: "FF000000" } },
};

/**
 * CDRMS-style workbook: green title, yellow headers, empty rows to type into (no sample data).
 */
export async function buildDirectoryExcelTemplate(title = "Campus Directory"): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Supercampus";
  const sheet = workbook.addWorksheet("Directory");
  const lastCol = DIRECTORY_EXCEL_COLUMNS.length;

  const greenFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF92D050" },
  };
  const yellowFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFFF00" },
  };

  sheet.mergeCells(1, 1, 1, lastCol);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FF000000" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = greenFill;
  sheet.getRow(1).height = 24;
  for (let col = 1; col <= lastCol; col += 1) {
    const cell = sheet.getCell(1, col);
    cell.border = blackBorder;
    cell.fill = greenFill;
    cell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FF000000" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  }

  DIRECTORY_EXCEL_COLUMNS.forEach((column, index) => {
    const cell = sheet.getCell(2, index + 1);
    cell.value = column.header;
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF000000" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = blackBorder;
    cell.fill = yellowFill;
    sheet.getColumn(index + 1).width = column.width;
  });
  sheet.getRow(2).height = 28;

  // Empty typed area (like CDRMS — admin fills manually)
  for (let row = 3; row <= 52; row += 1) {
    for (let col = 1; col <= lastCol; col += 1) {
      const cell = sheet.getCell(row, col);
      cell.border = blackBorder;
      cell.font = { name: "Calibri", size: 11 };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function parseDirectoryExcel(buffer: Buffer, emailDomain: string): Promise<ParsedDirectoryCsv> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  } catch {
    throw new BadRequestException("Could not read that Excel file. Download the template and try again.");
  }

  const sheet =
    workbook.getWorksheet("Directory") ||
    workbook.worksheets.find((item) => item.name.toLowerCase() !== "rules") ||
    workbook.worksheets[0];

  if (!sheet) {
    throw new BadRequestException("The workbook has no sheet to read. Download the template and fill it.");
  }

  const table: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cells: string[] = [];
    for (let col = 1; col <= DIRECTORY_EXCEL_COLUMNS.length; col += 1) {
      const value = row.getCell(col).value;
      cells.push(cellToString(value));
    }
    // Pad index so rowNumber maps 1:1 with Excel row (CSV parser uses 1-based index+1 from table)
    while (table.length < rowNumber - 1) {
      table.push([]);
    }
    table[rowNumber - 1] = cells;
  });

  return parseDirectoryTable(table, emailDomain);
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value == null) {
    return "";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return value.text.trim();
    }
    if ("result" in value && value.result != null) {
      return String(value.result).trim();
    }
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("").trim();
    }
  }
  return String(value).trim();
}
