import { BadRequestException } from "@nestjs/common";
import { DIRECTORY_ROLES, Role } from "src/core/common/constants/roles";
import { DirectoryRole } from "../entity/enums/directory-role.enum";

export interface DirectoryCsvRow {
  rowNumber: number;
  usn: string;
  fullName: string;
  collegeEmail: string;
  personalEmail: string | null;
  personalEmailProvided: boolean;
  mobile: string | null;
  mobileProvided: boolean;
  password: string | null;
  department: string | null;
  batch: string | null;
  program: string | null;
  isHostelite: boolean;
  role: DirectoryRole;
}

export interface DirectoryCsvError {
  row: number;
  message: string;
}

export interface ParsedDirectoryCsv {
  rows: DirectoryCsvRow[];
  errors: DirectoryCsvError[];
}

const HEADER_MAP: Record<string, keyof Omit<DirectoryCsvRow, "rowNumber">> = {
  usn: "usn",
  roll: "usn",
  rollnumber: "usn",
  fullname: "fullName",
  name: "fullName",
  collegeemail: "collegeEmail",
  email: "collegeEmail",
  personalemail: "personalEmail",
  mobile: "mobile",
  mobilenumber: "mobile",
  phone: "mobile",
  password: "password",
  department: "department",
  batch: "batch",
  program: "program",
  hostelite: "isHostelite",
  ishostelite: "isHostelite",
  role: "role",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseDirectoryCsv(text: string, emailDomain: string): ParsedDirectoryCsv {
  const table = parseCsv(text.replace(/^\uFEFF/, ""));
  const headerIndex = table.findIndex((cells) => cells.some((cell) => cell.trim()));
  if (headerIndex < 0) {
    throw new BadRequestException("The file is empty");
  }
  const columns = table[headerIndex].map((cell) => HEADER_MAP[normalizeHeader(cell)]);
  for (const name of ["usn", "fullName", "collegeEmail", "role"] as const) {
    if (!columns.includes(name)) {
      throw new BadRequestException(`Missing column: ${name}`);
    }
  }

  const rows: DirectoryCsvRow[] = [];
  const errors: DirectoryCsvError[] = [];
  for (let index = headerIndex + 1; index < table.length; index += 1) {
    const cells = table[index];
    if (cells.every((cell) => !cell.trim())) {
      continue;
    }
    const rowNumber = index + 1;
    const read = (name: (typeof columns)[number]): string => {
      const at = columns.indexOf(name);
      return at >= 0 ? (cells[at] ?? "").trim() : "";
    };
    const problem = validateRow(rowNumber, read, {
      personalEmailProvided: columns.includes("personalEmail"),
      mobileProvided: columns.includes("mobile"),
      passwordProvided: columns.includes("password"),
      emailDomain,
    });
    if (typeof problem === "string") {
      errors.push({ row: rowNumber, message: problem });
      continue;
    }
    rows.push(problem);
  }
  if (!rows.length && !errors.length) {
    throw new BadRequestException("The file has no data rows");
  }
  return { rows, errors };
}

function validateRow(
  rowNumber: number,
  read: (name: keyof Omit<DirectoryCsvRow, "rowNumber" | "personalEmailProvided" | "mobileProvided">) => string,
  flags: { personalEmailProvided: boolean; mobileProvided: boolean; passwordProvided: boolean; emailDomain: string },
): DirectoryCsvRow | string {
  const role = mapRole(read("role"));
  if (!role) {
    return "Role must be STUDENT, FACULTY, ALUMNI, WARDEN, or SUPER_ADMIN";
  }
  const hosteliteRaw = read("isHostelite");
  const hostelite = hosteliteRaw ? parseHostelite(hosteliteRaw) : false;
  if (hostelite === null) {
    return "Hostelite must be yes or no";
  }
  if (hostelite && role !== DirectoryRole.STUDENT) {
    return "Hostelite applies only to students";
  }
  const collegeEmail = read("collegeEmail").toLowerCase();
  const personal = read("personalEmail").toLowerCase();
  const domain = flags.emailDomain;
  if (!EMAIL.test(collegeEmail) || !collegeEmail.endsWith(`@${domain}`)) {
    return `College email must end with @${domain}`;
  }
  if (personal && !EMAIL.test(personal)) {
    return "Personal email is not valid";
  }
  const mobileRaw = flags.mobileProvided ? read("mobile") : "";
  const mobile = mobileRaw ? mobileRaw.replace(/\D/g, "") : null;
  if (mobileRaw && (!mobile || mobile.length < 10 || mobile.length > 15)) {
    return "Mobile number is not valid";
  }
  const password = flags.passwordProvided ? read("password") : "";
  const collegeRole = role !== DirectoryRole.ALUMNI;
  if (collegeRole && password.length < 6) {
    return "College password is required";
  }
  const usn = read("usn").toUpperCase();
  const fullName = read("fullName");
  if (!usn || !fullName) {
    return "USN and full name are required";
  }
  return {
    rowNumber,
    usn,
    fullName,
    collegeEmail,
    personalEmail: flags.personalEmailProvided ? personal || null : null,
    personalEmailProvided: flags.personalEmailProvided,
    mobile,
    mobileProvided: flags.mobileProvided,
    password: collegeRole && password ? password : null,
    department: read("department") || null,
    batch: read("batch") || null,
    program: read("program") || null,
    isHostelite: role === DirectoryRole.STUDENT ? hostelite : false,
    role,
  };
}

function mapRole(raw: string): DirectoryRole | null {
  const value = raw.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (value === "ADMIN" || value === "SUPER_ADMIN" || value === "SUPERADMIN") {
    return DirectoryRole.SUPER_ADMIN;
  }
  if (value === "WARDEN") {
    return DirectoryRole.WARDEN;
  }
  if (!DIRECTORY_ROLES.includes(value as Role)) {
    return null;
  }
  return value as DirectoryRole;
}

function parseHostelite(raw: string): boolean | null {
  const value = raw.trim().toLowerCase();
  if (["yes", "true", "1", "y"].includes(value)) {
    return true;
  }
  if (["no", "false", "0", "n"].includes(value)) {
    return false;
  }
  return null;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
