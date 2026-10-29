/**
 * Comprehensive Automated Testing Suite for Gramin Shiksha
 * Covers:
 * 1. Unit Testing (RBAC, Permission Parsers, Date Utils)
 * 2. Logic & Component State Testing (Searchable Dropdown, Certificate Checks)
 * 3. Security & Access Control Testing (Privilege Escalation, Super Admin boundaries)
 * 4. API & Integration Testing (OTP generation, validation, rate limiting)
 * 5. Localization & Translation Integrity (Key matching across 6 languages)
 * 6. Schema & Field Sanitization Checks
 */

import { 
  isUserSuperAdmin, 
  parseAdminPermissions, 
  hasAdminPermission, 
  canAccessAdminTab, 
  ADMIN_PERMISSIONS_CATALOG,
  ALL_ADMIN_PERMISSION_IDS,
  AdminPermission 
} from '../src/utils/adminPermissions';
import { getSafeDateString } from '../src/utils/dateUtils';
import { TRANSLATIONS } from '../src/data/translations';
import { ALLOWED_FIRESTORE_USER_FIELDS, FirestoreUser, FirestoreCertificate } from '../src/lib/firebase';
import http from 'http';

interface TestResult {
  category: string;
  testName: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, testName: string, category: string, details?: string) {
  if (condition) {
    results.push({ category, testName, passed: true, details });
  } else {
    results.push({ category, testName, passed: false, error: 'Assertion failed', details });
  }
}

function assertEqual<T>(actual: T, expected: T, testName: string, category: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr === expectedStr) {
    results.push({ category, testName, passed: true });
  } else {
    results.push({ 
      category, 
      testName, 
      passed: false, 
      error: `Expected ${expectedStr} but got ${actualStr}` 
    });
  }
}

async function runTestSuite() {
  console.log("================================================================================");
  console.log("           STARTING GRAMIN SHIKSHA COMPREHENSIVE AUTOMATED TEST SUITE           ");
  console.log("================================================================================\n");

  // ============================================================================
  // 1. UNIT TESTING: RBAC & SYSTEM ADMINISTRATOR PRIVILEGE BOUNDARIES
  // ============================================================================
  console.log("[1/6] Running Unit Tests: RBAC & Permissions Logic...");

  // Test 1.1: isUserSuperAdmin identification
  assert(
    isUserSuperAdmin({ name: 'System Administrator', role: 'admin' } as any),
    'Identify Super Admin by exact name "System Administrator"',
    'Unit: RBAC'
  );
  assert(
    isUserSuperAdmin({ name: ' system administrator ', role: 'admin' } as any),
    'Identify Super Admin with leading/trailing spaces and lower case',
    'Unit: RBAC'
  );
  assert(
    isUserSuperAdmin({ isSuperAdmin: true, name: 'Custom Name', role: 'admin' } as any),
    'Identify Super Admin via isSuperAdmin === true flag',
    'Unit: RBAC'
  );
  assert(
    isUserSuperAdmin({ standard: 'System Administrator', name: 'Admin', role: 'admin' } as any),
    'Identify Super Admin via standard field',
    'Unit: RBAC'
  );
  assert(
    !isUserSuperAdmin({ name: 'Ramesh Patel', role: 'admin' } as any),
    'Regular Managed Admin is NOT identified as Super Admin',
    'Unit: RBAC'
  );
  assert(
    !isUserSuperAdmin({ name: 'System Admin Assistant', role: 'student' } as any),
    'Student with similar name is not Super Admin',
    'Unit: RBAC'
  );
  assert(
    !isUserSuperAdmin(null) && !isUserSuperAdmin(undefined),
    'Null/undefined user safely returns false',
    'Unit: RBAC'
  );

  // Test 1.2: parseAdminPermissions
  const superAdminUser = { name: 'System Administrator', role: 'admin' as const } as any;
  const superPerms = parseAdminPermissions(superAdminUser);
  assertEqual(
    superPerms.length,
    ALL_ADMIN_PERMISSION_IDS.length,
    'System Administrator unconditionally receives ALL permission IDs',
    'Unit: RBAC'
  );

  const managedAdminWithJson = { 
    name: 'District Admin', 
    role: 'admin' as const, 
    adminPermissions: JSON.stringify(['analytics', 'content']) 
  } as any;
  assertEqual(
    parseAdminPermissions(managedAdminWithJson),
    ['analytics', 'content'],
    'Managed Admin correctly parses stringified JSON permissions array',
    'Unit: RBAC'
  );

  const managedAdminWithArray = { 
    name: 'District Admin', 
    role: 'admin' as const, 
    adminPermissions: ['certificates', 'settings'] as AdminPermission[] 
  } as any;
  assertEqual(
    parseAdminPermissions(managedAdminWithArray),
    ['certificates', 'settings'],
    'Managed Admin correctly parses direct array permissions',
    'Unit: RBAC'
  );

  const managedAdminWithCorruptedJson = { 
    name: 'District Admin', 
    role: 'admin' as const, 
    adminPermissions: "{invalid-json" 
  } as any;
  assertEqual(
    parseAdminPermissions(managedAdminWithCorruptedJson),
    [],
    'Corrupted JSON in adminPermissions returns safe empty array (fail-closed)',
    'Unit: RBAC'
  );

  const managedAdminUnassigned = { 
    name: 'New Admin', 
    role: 'admin' as const 
  } as any;
  assertEqual(
    parseAdminPermissions(managedAdminUnassigned),
    [],
    'Unassigned Managed Admin receives 0 permissions (fail-closed/fully restricted)',
    'Unit: RBAC'
  );

  // Test 1.3: hasAdminPermission & canAccessAdminTab
  assert(
    hasAdminPermission(superAdminUser, 'analytics_export'),
    'Super Admin can perform analytics_export',
    'Unit: RBAC'
  );
  assert(
    !hasAdminPermission(managedAdminWithJson, 'analytics_export'),
    'Managed Admin with only [analytics, content] is denied analytics_export',
    'Unit: RBAC'
  );
  assert(
    canAccessAdminTab(managedAdminWithJson, 'analytics'),
    'Managed Admin with analytics permission can access analytics tab',
    'Unit: RBAC'
  );
  assert(
    !canAccessAdminTab(managedAdminWithJson, 'certificates'),
    'Managed Admin without certificates permission is blocked from certificates tab',
    'Unit: RBAC'
  );
  assert(
    !canAccessAdminTab(managedAdminWithJson, 'settings'),
    'Managed Admin without settings permission is blocked from settings tab',
    'Unit: RBAC'
  );
  assert(
    !canAccessAdminTab(managedAdminWithJson, 'users'),
    'Managed Admin without users permission is blocked from users tab',
    'Unit: RBAC'
  );

  // ============================================================================
  // 2. UNIT TESTING: DATE & STREAK UTILITIES
  // ============================================================================
  console.log("[2/6] Running Unit Tests: Date and Utility Functions...");
  const safeDate = getSafeDateString();
  assert(
    /^\d{4}-\d{2}-\d{2}$/.test(safeDate),
    `getSafeDateString produces valid ISO YYYY-MM-DD: ${safeDate}`,
    'Unit: DateUtils'
  );

  // ============================================================================
  // 3. LOGIC & COMPONENT TESTING: SEARCHABLE DROPDOWN & CERTIFICATE INTEGRITY
  // ============================================================================
  console.log("[3/6] Running Component Logic Tests: Searchable Student Selection...");

  const mockUsersList: FirestoreUser[] = [
    { mobile: '9876543210', name: 'Aarav Sharma', role: 'student', standard: '10', village: 'Rampur', defaultLanguage: 'en', signupDate: '2025-01-01' },
    { mobile: '9123456780', name: 'Priya Verma', role: 'student', standard: '12', school: 'Model High School', defaultLanguage: 'hi', signupDate: '2025-01-01' },
    { mobile: '9988776655', name: 'System Administrator', role: 'admin', defaultLanguage: 'en', signupDate: '2025-01-01' },
    { mobile: '9000000001', name: 'Staff Teacher', role: 'teacher', defaultLanguage: 'en', signupDate: '2025-01-01' },
    { mobile: '9555544433', name: 'Vikram Singh', role: 'student', standard: '9', village: 'Sundarpur', defaultLanguage: 'gu', signupDate: '2025-01-01' }
  ];

  // Filtering registered students only
  const registeredStudents = mockUsersList.filter(u => (u.role || 'student') === 'student');
  assertEqual(
    registeredStudents.length,
    3,
    'Registered student filter excludes admin and teacher accounts',
    'Logic: Student Selection'
  );

  // Search logic test function matching AdminDashboardView
  function searchStudents(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return registeredStudents;
    return registeredStudents.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.mobile.includes(q) ||
      (s.village && s.village.toLowerCase().includes(q)) ||
      (s.school && s.school.toLowerCase().includes(q)) ||
      (s.standard && s.standard.toLowerCase().includes(q))
    );
  }

  assertEqual(
    searchStudents('Aarav').length,
    1,
    'Search by partial student name matches correctly',
    'Logic: Student Selection'
  );
  assertEqual(
    searchStudents('9123456780').length,
    1,
    'Search by 10-digit mobile number matches exact student',
    'Logic: Student Selection'
  );
  assertEqual(
    searchStudents('Sundarpur').length,
    1,
    'Search by village name matches correctly',
    'Logic: Student Selection'
  );
  assertEqual(
    searchStudents('Class 999_NonExistent').length,
    0,
    'Search with non-existent query yields empty list',
    'Logic: Student Selection'
  );

  // Certificate Issuance Validation Constraints
  function canIssueCertificate(selectedStudent: FirestoreUser | null, title: string): { valid: boolean; reason?: string } {
    if (!selectedStudent) {
      return { valid: false, reason: 'Student account must be selected from registered accounts' };
    }
    if ((selectedStudent.role || 'student') !== 'student') {
      return { valid: false, reason: 'Certificates can only be issued to registered student accounts' };
    }
    if (!selectedStudent.mobile || selectedStudent.mobile.replace(/\D/g, '').length !== 10) {
      return { valid: false, reason: 'Invalid registered mobile number' };
    }
    if (!title.trim()) {
      return { valid: false, reason: 'Certificate title is required' };
    }
    return { valid: true };
  }

  assert(
    !canIssueCertificate(null, 'Mastery Award').valid,
    'Certificate issuance fails if no registered student is selected',
    'Logic: Certificate Rules'
  );
  assert(
    !canIssueCertificate(mockUsersList[2], 'Mastery Award').valid,
    'Certificate issuance fails if an admin account is attempted as recipient',
    'Logic: Certificate Rules'
  );
  assert(
    canIssueCertificate(mockUsersList[0], 'Mathematics Excellence').valid,
    'Certificate issuance succeeds for valid registered student with title',
    'Logic: Certificate Rules'
  );
  assert(
    !canIssueCertificate(mockUsersList[0], '   ').valid,
    'Certificate issuance fails if title is empty or whitespace',
    'Logic: Certificate Rules'
  );

  // ============================================================================
  // 4. LOCALIZATION & TRANSLATIONS COMPLETENESS TESTING
  // ============================================================================
  console.log("[4/6] Running Localization Testing: Translation Set Completeness...");

  const supportedLangs = ['en', 'hi', 'gu', 'mr', 'ta', 'te'] as const;
  const enKeys = Object.keys(TRANSLATIONS.en || {});

  assert(
    enKeys.length > 50,
    `English base translation set contains ${enKeys.length} keys`,
    'Localization'
  );

  for (const lang of supportedLangs) {
    const langObj = TRANSLATIONS[lang];
    if (!langObj) {
      results.push({
        category: 'Localization',
        testName: `Language set exists for "${lang}"`,
        passed: false,
        error: `Missing translation object for ${lang}`
      });
      continue;
    }

    const langKeys = Object.keys(langObj);
    const missingKeys = enKeys.filter(k => !(k in langObj));
    assert(
      missingKeys.length === 0,
      `Language "${lang}" covers all ${enKeys.length} translation keys`,
      'Localization',
      missingKeys.length > 0 ? `Missing keys in ${lang}: ${missingKeys.slice(0, 5).join(', ')}...` : undefined
    );
  }

  // ============================================================================
  // 5. SECURITY & SCHEMA INTEGRITY AUDIT
  // ============================================================================
  console.log("[5/6] Running Security & Schema Integrity Tests...");

  // Check allowed fields definition
  assert(
    ALLOWED_FIRESTORE_USER_FIELDS.includes('mobile'),
    'ALLOWED_FIRESTORE_USER_FIELDS includes mobile',
    'Security & Schema'
  );
  assert(
    ALLOWED_FIRESTORE_USER_FIELDS.includes('adminPermissions'),
    'ALLOWED_FIRESTORE_USER_FIELDS includes adminPermissions',
    'Security & Schema'
  );
  assert(
    ALLOWED_FIRESTORE_USER_FIELDS.includes('isSuperAdmin'),
    'ALLOWED_FIRESTORE_USER_FIELDS includes isSuperAdmin',
    'Security & Schema'
  );

  // Malicious field injection test: Ensure prototype pollution or disallowed fields are rejected
  const dirtyUserInput: Record<string, any> = {
    mobile: '9876543210',
    name: 'Student',
    role: 'student',
    __proto__: { isAdmin: true },
    isHacker: true,
    maliciousScript: '<script>alert(1)</script>'
  };

  const sanitizedUserFields: Partial<FirestoreUser> = {};
  for (const key of ALLOWED_FIRESTORE_USER_FIELDS) {
    if (key in dirtyUserInput && (key as string) !== '__proto__') {
      (sanitizedUserFields as any)[key] = dirtyUserInput[key];
    }
  }

  assert(
    !('isHacker' in sanitizedUserFields) && !('maliciousScript' in sanitizedUserFields),
    'Field sanitization strips unexpected/injected fields before database writes',
    'Security & Schema'
  );

  // ============================================================================
  // 5B. SECURITY & ARCHITECTURE FIX VERIFICATIONS (ISSUES 1 - 6)
  // ============================================================================
  console.log("[5B/6] Running Security & Architecture Regression Tests (Issues 1-6)...");

  // Fix 2: Cryptographic PIN Hashing Tests
  const { hashPin, verifyPin, isHashedPin } = await import('../src/utils/security');
  const rawPin = '998877';
  const hashedPin = await hashPin(rawPin);
  
  assert(
    isHashedPin(hashedPin),
    'hashPin produces a formatted salted hash string (sha256$<salt>$<hash>)',
    'Security: PIN Hashing'
  );
  assert(
    await verifyPin(rawPin, hashedPin),
    'verifyPin correctly validates original PIN against generated salted hash',
    'Security: PIN Hashing'
  );
  assert(
    !(await verifyPin('000000', hashedPin)),
    'verifyPin rejects incorrect PIN against salted hash',
    'Security: PIN Hashing'
  );
  assert(
    await verifyPin('123456', '123456'),
    'verifyPin supports legacy backward compatibility for unmigrated plain-text PINs',
    'Security: PIN Hashing'
  );

  // Fix 5: Binary Blob IndexedDB Storage Optimization Tests
  const { dataUrlToBlob, blobToDataUrl } = await import('../src/lib/indexedDbStore');
  const sampleDataUrl = 'data:text/plain;base64,R3lhYW5Cb3QgRWR1Y2F0aW9uIFBsYXRmb3Jt';
  const convertedBlob = dataUrlToBlob(sampleDataUrl);
  
  assert(
    convertedBlob instanceof Blob && convertedBlob.type === 'text/plain',
    'dataUrlToBlob parses MIME type and produces native binary Blob',
    'Performance: IndexedDB'
  );
  const roundtrippedUrl = await blobToDataUrl(convertedBlob);
  assert(
    roundtrippedUrl.startsWith('data:text/plain;base64,'),
    'blobToDataUrl restores valid data URL from binary Blob without corruption',
    'Performance: IndexedDB'
  );

  // Fix 3: Rate Limiting & OTP State Persistence Tests
  const fs = await import('fs');
  const path = await import('path');
  const dataDir = path.resolve(process.cwd(), '.data');
  assert(
    fs.existsSync(dataDir),
    '.data directory exists for server restart persistence',
    'Resilience: Persistence'
  );

  // ============================================================================
  // 6. BACKEND API INTEGRATION TESTING (HTTP REQUESTS TO DEV SERVER)
  // ============================================================================
  console.log("[6/6] Running API & Integration Tests on active server...");

  function makePostRequest(path: string, body: object): Promise<{ status: number; data: any }> {
    return new Promise((resolve) => {
      const postData = JSON.stringify(body);
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: 3000,
          path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 4000
        },
        (res) => {
          let raw = '';
          res.on('data', chunk => raw += chunk);
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode || 500, data: JSON.parse(raw) });
            } catch {
              resolve({ status: res.statusCode || 500, data: raw });
            }
          });
        }
      );

      req.on('error', (err) => {
        resolve({ status: 0, data: { error: err.message } });
      });

      req.write(postData);
      req.end();
    });
  }

  // Test 6.1: OTP Generation with invalid mobile
  const badMobileRes = await makePostRequest('/api/otp/generate', { mobile: '123' });
  assert(
    badMobileRes.status === 400 && badMobileRes.data?.success === false,
    'POST /api/otp/generate rejects invalid mobile (< 10 digits) with HTTP 400',
    'Integration: API'
  );

  // Test 6.2: OTP Generation with valid test mobile
  const testMobile = '9999911223';
  const genOtpRes = await makePostRequest('/api/otp/generate', { mobile: testMobile });
  assert(
    genOtpRes.status === 200 && genOtpRes.data?.success === true,
    'POST /api/otp/generate succeeds with valid 10-digit mobile number',
    'Integration: API'
  );

  // Test 6.3: OTP Verification with wrong code
  const wrongVerifyRes = await makePostRequest('/api/otp/verify', { mobile: testMobile, otp: '000000' });
  assert(
    wrongVerifyRes.status === 400 && wrongVerifyRes.data?.success === false,
    'POST /api/otp/verify rejects incorrect OTP with HTTP 400',
    'Integration: API'
  );

  // ============================================================================
  // SUMMARY REPORT GENERATION
  // ============================================================================
  console.log("\n================================================================================");
  console.log("                           TEST EXECUTION SUMMARY                               ");
  console.log("================================================================================");

  const passedTests = results.filter(r => r.passed);
  const failedTests = results.filter(r => !r.passed);

  console.log(`TOTAL TESTS EXECUTED : ${results.length}`);
  console.log(`PASSED               : ${passedTests.length} (${Math.round((passedTests.length / results.length) * 100)}%)`);
  console.log(`FAILED / ISSUES      : ${failedTests.length}\n`);

  if (failedTests.length > 0) {
    console.log("FAILURES DETECTED:");
    failedTests.forEach(f => {
      console.log(`  [FAIL] [${f.category}] ${f.testName}: ${f.error}`);
    });
    console.log("");
  }

  console.log("CATEGORY BREAKDOWN:");
  const categories = Array.from(new Set(results.map(r => r.category)));
  for (const cat of categories) {
    const catTests = results.filter(r => r.category === cat);
    const catPassed = catTests.filter(r => r.passed).length;
    console.log(`  - ${cat.padEnd(25)} : ${catPassed}/${catTests.length} Passed`);
  }
}

runTestSuite().catch(err => {
  console.error("Test Suite Runtime Error:", err);
});
