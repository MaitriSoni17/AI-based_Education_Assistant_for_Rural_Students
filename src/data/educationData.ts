export const STATES = [
  "Gujarat",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi (NCT)",
  "Jammu & Kashmir",
  "Chandigarh",
  "Ladakh",
  "Puducherry",
  "Other / Outside India"
];

export interface StandardOption {
  value: string;
  label: string;
  group?: string;
}

export const STANDARDS: StandardOption[] = [
  { value: "Class 1", label: "Class 1" },
  { value: "Class 2", label: "Class 2" },
  { value: "Class 3", label: "Class 3" },
  { value: "Class 4", label: "Class 4" },
  { value: "Class 5", label: "Class 5" },
  { value: "Class 6", label: "Class 6" },
  { value: "Class 7", label: "Class 7" },
  { value: "Class 8", label: "Class 8" },
  { value: "Class 9", label: "Class 9" },
  { value: "Class 10", label: "Class 10" },
  { value: "Class 11 (Science)", label: "Class 11 (Science)", group: "Class 11" },
  { value: "Class 11 (Commerce)", label: "Class 11 (Commerce)", group: "Class 11" },
  { value: "Class 11 (Arts)", label: "Class 11 (Arts)", group: "Class 11" },
  { value: "Class 12 (Science)", label: "Class 12 (Science)", group: "Class 12" },
  { value: "Class 12 (Commerce)", label: "Class 12 (Commerce)", group: "Class 12" },
  { value: "Class 12 (Arts)", label: "Class 12 (Arts)", group: "Class 12" },
];

export interface BoardOption {
  value: string;
  label: string;
  group: string;
}

export const BOARDS: BoardOption[] = [
  { value: "Gujarat: GSEB", label: "Gujarat: GSEB", group: "State Boards" },
  { value: "CBSE", label: "CBSE (NCERT Standards)", group: "National Boards" },
  { value: "ICSE", label: "ICSE (CISCE Standards)", group: "National Boards" },
  { value: "Andhra Pradesh: BIEAP & BSEAP", label: "Andhra Pradesh: BIEAP & BSEAP", group: "State Boards" },
  { value: "Assam: AHSEC & SEBA", label: "Assam: AHSEC & SEBA", group: "State Boards" },
  { value: "Bihar: BSEB", label: "Bihar: BSEB", group: "State Boards" },
  { value: "Chhattisgarh: CGBSE", label: "Chhattisgarh: CGBSE", group: "State Boards" },
  { value: "Goa: GBSHSE", label: "Goa: GBSHSE", group: "State Boards" },
  { value: "Haryana: HBSE", label: "Haryana: HBSE", group: "State Boards" },
  { value: "Himachal Pradesh: HPBOSE", label: "Himachal Pradesh: HPBOSE", group: "State Boards" },
  { value: "Jammu & Kashmir: JKBOSE", label: "Jammu & Kashmir: JKBOSE", group: "State Boards" },
  { value: "Jharkhand: JAC", label: "Jharkhand: JAC", group: "State Boards" },
  { value: "Karnataka: KSEAB", label: "Karnataka: KSEAB", group: "State Boards" },
  { value: "Kerala: DHSE & Pareeksha Bhavan", label: "Kerala: DHSE & Pareeksha Bhavan", group: "State Boards" },
  { value: "Madhya Pradesh: MPBSE", label: "Madhya Pradesh: MPBSE", group: "State Boards" },
  { value: "Maharashtra: MSBSHSE", label: "Maharashtra: MSBSHSE", group: "State Boards" },
  { value: "Manipur: BSEM & COHSEM", label: "Manipur: BSEM & COHSEM", group: "State Boards" },
  { value: "Meghalaya: MBOSE", label: "Meghalaya: MBOSE", group: "State Boards" },
  { value: "Mizoram: MBSE", label: "Mizoram: MBSE", group: "State Boards" },
  { value: "Nagaland: NBSE", label: "Nagaland: NBSE", group: "State Boards" },
  { value: "Odisha: BSE Odisha & CHSE Odisha", label: "Odisha: BSE Odisha & CHSE Odisha", group: "State Boards" },
  { value: "Punjab: PSEB", label: "Punjab: PSEB", group: "State Boards" },
  { value: "Rajasthan: RBSE", label: "Rajasthan: RBSE", group: "State Boards" },
  { value: "Tamil Nadu: DGE TN", label: "Tamil Nadu: DGE TN", group: "State Boards" },
  { value: "Telangana: TSBIE", label: "Telangana: TSBIE", group: "State Boards" },
  { value: "Tripura: TBSE", label: "Tripura: TBSE", group: "State Boards" },
  { value: "Uttar Pradesh: UPMSP", label: "Uttar Pradesh: UPMSP", group: "State Boards" },
  { value: "Uttarakhand: UBSE", label: "Uttarakhand: UBSE", group: "State Boards" },
  { value: "West Bengal: WBBSE & WBCHSE", label: "West Bengal: WBBSE & WBCHSE", group: "State Boards" },
];
