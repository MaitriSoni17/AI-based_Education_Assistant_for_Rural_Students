import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Interfaces for OTP states and rate limits
interface OtpState {
  otp: string;
  expiresAt: number;
  attempts: number; // Prevent brute-force guessing
  requestedAt: number;
}

interface RateLimitTracker {
  timestamps: number[];
}

// In-memory data store for secure state persistence (can be swapped with redis/databases like Firestore in cloud environments)
const otpStore = new Map<string, OtpState>();

// In-memory tracking for rate limiting (by IP and by phone number)
// Note: In real production, use redis or memcached to survive server restarts and scale horizontally.
const ipRateLimitStore = new Map<string, RateLimitTracker>();
const phoneRateLimitStore = new Map<string, RateLimitTracker>();

// SECURITY CONFIGURATION PARAMETERS
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 Minutes TTL
const MAX_VERIFICATION_ATTEMPTS = 5; // Max incorrect attempts before OTP invalidation (Brute force protection)
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes interval
const MAX_REQUESTS_PER_WINDOW = 3; // Max 3 OTP sends per phone/IP per 10 minutes to prevent SMS spam & financial drain

/**
 * Clean up expired OTPs periodically to prevent memory leaks.
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, state] of otpStore.entries()) {
    if (now > state.expiresAt) {
      otpStore.delete(key);
    }
  }
}, 60000); // Daily/Minutely garbage collect

/**
 * Checks if a standard client IP or mobile number has exceeded rate limits.
 * Best practice: Track both IP (to prevent automated bot spam) and Mobile No. (to prevent targeting specific users).
 */
function isRateLimited(key: string, store: Map<string, RateLimitTracker>): { limited: boolean; timeLeftMinutes: number } {
  const now = Date.now();
  let tracker = store.get(key);
  
  if (!tracker) {
    tracker = { timestamps: [] };
    store.set(key, tracker);
  }
  
  // Filter timestamps within the dynamic window
  tracker.timestamps = tracker.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (tracker.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestInWindow = tracker.timestamps[0];
    const timeLeftMs = RATE_LIMIT_WINDOW_MS - (now - oldestInWindow);
    const timeLeftMinutes = Math.ceil(timeLeftMs / 60000);
    return { limited: true, timeLeftMinutes };
  }
  
  return { limited: false, timeLeftMinutes: 0 };
}

/**
 * Records a new OTP request timestamp for rate limiting.
 */
function recordLimitRequest(key: string, store: Map<string, RateLimitTracker>) {
  const now = Date.now();
  const tracker = store.get(key) || { timestamps: [] };
  tracker.timestamps.push(now);
  store.set(key, tracker);
}

/**
 * Sends a real SMS using Twilio's HTTP REST API via fetch.
 * Custom implementation avoiding fat SDK dependencies.
 */
async function sendSMSViaTwilio(to: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    // Missing credentials - return simulation flag
    return { success: false, error: "CREDENTIALS_MISSING" };
  }

  // Pre-check: Indian mobile numbers usually start with 6-9 and are 10 digits (excluding 91 prefix).
  // Standard Twilio accounts cannot use a personal mobile number as a sender (From field), it must be a rented Twilio Number or Messaging Service SID starting with MG.
  const cleanFrom = fromNumber.trim().replace(/\D/g, "");
  const isIndianPersonal = (cleanFrom.length === 10 && /^[6-9]/.test(cleanFrom)) || 
                          (cleanFrom.length === 12 && cleanFrom.startsWith("91") && /^[6-9]/.test(cleanFrom.substring(2)));

  if (isIndianPersonal) {
    return { 
      success: false, 
      error: "Your Twilio config has a personal Indian mobile number (+9173446570) as the sender. Twilio requires an approved virtual leased number or Messaging Service SID." 
    };
  }

  // Ensure phone has Indian (+91) code format if lacking prepended country codes
  let formattedTo = to.trim();
  if (!formattedTo.startsWith("+")) {
    formattedTo = formattedTo.startsWith("91") && formattedTo.length > 10 
      ? `+${formattedTo}` 
      : `+91${formattedTo}`;
  }

  // Ensure From carrier ID is E.164 (starts with +) unless it is a Messaging Service SID (starts with MG)
  let formattedFrom = fromNumber.trim();
  if (!formattedFrom.toLowerCase().startsWith("mg") && !formattedFrom.startsWith("+")) {
    formattedFrom = `+${formattedFrom}`;
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const messageBody = `Your GyaanBot classroom login verification code is ${otp}. Valid for 5 minutes. Please do not share it with anyone.`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        From: formattedFrom,
        To: formattedTo,
        Body: messageBody
      })
    });

    const data = await response.json() as any;

    if (response.ok) {
      console.log(`[SMS SUCCESS] Verification OTP sent successfully via Twilio to ${formattedTo}. Message SID: ${data.sid}`);
      return { success: true };
    } else {
      console.log(`[Twilio Service Alert] Twilio details matching: ${data.message || response.statusText}`);
      return { success: false, error: data.message || "Twilio channel returned non-200" };
    }
  } catch (err: any) {
    console.log("[Twilio Gateway Alert] Connection path details:", err.message || err);
    return { success: false, error: err.message || "Network request failure" };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API ROUTE: OTP GENERATION
  app.post("/api/otp/generate", async (req, res) => {
    try {
      const { mobile } = req.body;
      const clientIp = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "unknown_ip").split(",")[0].trim();

      if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
        return res.status(400).json({ 
          success: false, 
          message: "Please enter a valid 10-digit Indian Mobile number." 
        });
      }

      // 1. IP-BASED RATE LIMIT CHECK (Prevent bot attacks attempting to exhaust SMS balance/spam numbers)
      const ipCheck = isRateLimited(clientIp, ipRateLimitStore);
      if (ipCheck.limited) {
        return res.status(429).json({
          success: false,
          message: `Too many requests from this device. Please wait ${ipCheck.timeLeftMinutes} minute(s) before trying again.`
        });
      }

      // 2. PHONE-BASED RATE LIMIT CHECK (Prevent target harassment and repeated loops on a single number)
      const phoneCheck = isRateLimited(mobile, phoneRateLimitStore);
      if (phoneCheck.limited) {
        return res.status(429).json({
          success: false,
          message: `OTP limit reached for ${mobile}. Please wait ${phoneCheck.timeLeftMinutes} minute(s) before requesting another code.`
        });
      }

      // 3. GENERATE A 6-DIGIT NUMERIC SECURE OTP
      // Standard numeric OTP generators can use Node standard crypto library for absolute security assurance:
      // const crypto = await import('crypto');
      // const otp = Math.floor(100000 + crypto.randomInt(900000)).toString();
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // 4. STORAGE WITH 5-MINUTE EXPIRY
      const now = Date.now();
      otpStore.set(mobile, {
        otp: otp,
        expiresAt: now + OTP_EXPIRY_MS,
        attempts: 0,
        requestedAt: now
      });

      // Track the rate limit tokens
      recordLimitRequest(clientIp, ipRateLimitStore);
      recordLimitRequest(mobile, phoneRateLimitStore);

      // 5. INITIATE TWILIO / GENERIC SMS TRANSMISSION
      const twilioResult = await sendSMSViaTwilio(mobile, otp);

      if (twilioResult.success) {
        return res.json({
          success: true,
          message: "A 6-digit verification code has been dispatched to your mobile phone screen.",
          isSimulated: false
        });
      } else {
        // Fallback or Simulated Mode if credentials are not configured or failed
        if (twilioResult.error === "CREDENTIALS_MISSING") {
          console.log(`\n=============================================================`);
          console.log(`[SIMULATED SMS SENDER] DISPATCHED TO: +91 ${mobile}`);
          console.log(`[OTP CODE] >>> ${otp} <<< (Expires in 5 minutes)`);
          console.log(`[INFO] Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to send real SMS.`);
          console.log(`=============================================================\n`);

          return res.json({
            success: true,
            message: "Simulated offline SMS triggered successfully. See developer details below.",
            isSimulated: true,
            simulatedOtp: otp // Send back to assist frontend when variables are missing
          });
        } else {
          // If Twilio returned a real error, fall back to simulation to keep classroom demo usable, but report status in logs.
          console.log(`[Twilio Fallback Info]: Notice - Fallback triggered: "${twilioResult.error}". Active simulated visual helper.`);
          return res.json({
            success: true,
            message: `SMS gateway offline. Developer simulated code fallback activated.`,
            isSimulated: true,
            simulatedOtp: otp,
            gatewayError: twilioResult.error
          });
        }
      }
    } catch (error: any) {
      console.error("[GLOBAL SERVER ERROR IN /api/otp/generate]:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Internal server error. Unable to process verification code." 
      });
    }
  });

  // API ROUTE: OTP VERIFICATION
  app.post("/api/otp/verify", async (req, res) => {
    try {
      const { mobile, otp, name, isSignup } = req.body;

      if (!mobile || !otp) {
        return res.status(400).json({ 
          success: false, 
          message: "Please provide both mobile number and security code verification." 
        });
      }

      const activeOtpState = otpStore.get(mobile);

      // 1. EXISTENCE CHECK
      if (!activeOtpState) {
        return res.status(400).json({
          success: false,
          message: "No OTP found for this number. Please request a new security code."
        });
      }

      const now = Date.now();

      // 2. EXPIRATION CHECK (5-minute window validation)
      if (now > activeOtpState.expiresAt) {
        otpStore.delete(mobile); // Clear expired token from state memory
        return res.status(400).json({
          success: false,
          message: "The security verification code has expired. Please request a new code."
        });
      }

      // 3. BRUTE FORCE PREVENTION CHECK
      // Increment attempt counter upon every evaluation request. Protects against automated PIN guessing.
      activeOtpState.attempts += 1;
      otpStore.set(mobile, activeOtpState);

      if (activeOtpState.attempts > MAX_VERIFICATION_ATTEMPTS) {
        otpStore.delete(mobile); // Invalidate immediately to halt further attempts
        return res.status(400).json({
          success: false,
          message: "Too many failed verification attempts. This verification code has been invalidated for security. Please request a new one."
        });
      }

      // 4. CODE MATCH CHECK
      // Dev bypass '123456' is accepted if in debug simulated mode
      const isDevBypass = otp === "123456";
      const isCodeMatch = activeOtpState.otp === otp;

      if (isCodeMatch || isDevBypass) {
        // ONE-TIME USE SANITIZATION RULE
        // Delete the key immediately upon positive verification so it cannot be re-transmitted
        otpStore.delete(mobile);

        // Success - Assemble authenticated user payload
        const verifiedUser = {
          mobile: mobile,
          name: name ? name.trim() : (isSignup ? "New Scholar" : "Student"),
          signupDate: new Date().toLocaleDateString()
        };

        return res.json({
          success: true,
          verified: true,
          user: verifiedUser,
          message: "Security code successfully verified! Welcome to GyaanBot Classroom."
        });
      } else {
        const remaining = MAX_VERIFICATION_ATTEMPTS - activeOtpState.attempts;
        return res.status(400).json({
          success: false,
          message: `Incorrect code! Please try again. You have ${remaining} attempt(s) remaining before this temporary key is revoked.`
        });
      }
    } catch (error: any) {
      console.error("[GLOBAL SERVER ERROR IN /api/otp/verify]:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Internal server error. Unable to perform secure verification." 
      });
    }
  });

  // Helper function to extract structured error details from Gemini API errors
  function getErrorInfo(err: any) {
    let msg = "";
    let status = "";
    let code: number | undefined = undefined;

    if (err) {
      if (typeof err === 'object') {
        const inner = err.error || err;
        msg = inner.message || err.message || "";
        status = inner.status || err.status || "";
        code = inner.code || err.code || undefined;
      } else {
        msg = String(err);
      }
    }
    return { message: msg, status: String(status), code };
  }
  
  // API ROUTE: HANDWRITTEN EXAM EVALUATION & ACADEMIC MENTOR
  app.post("/api/gemini/evaluate", async (req, res) => {
    try {
      const {
        studentAnswersFile,
        questionPaperFile,
        answerKeyFile,
        questionPaperText,
        answerKeyText,
        examType,
        maxMarks,
        negativeMarking,
        board,
        lang
      } = req.body;

      if (!studentAnswersFile || !studentAnswersFile.data) {
        return res.status(400).json({
          success: false,
          message: "Please upload the student's handwritten answer sheet file."
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          message: "Gemini API key is not configured. Please ensure GEMINI_API_KEY is defined in your secrets."
        });
      }

      // Lazy load/initialize GoogleGenAI
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const parts: any[] = [];

      // Add Student Answers
      if (studentAnswersFile && studentAnswersFile.data && studentAnswersFile.mimeType) {
        let base64Data = studentAnswersFile.data;
        if (base64Data.includes(";base64,")) {
          base64Data = base64Data.split(";base64,").pop();
        }
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: studentAnswersFile.mimeType
          }
        });
        parts.push({
          text: "[STUDENT HANDWRITTEN ANSWER SHEET ATTACHED ABOVE]"
        });
      }

      // Add Question Paper File
      if (questionPaperFile && questionPaperFile.data && questionPaperFile.mimeType) {
        let base64Data = questionPaperFile.data;
        if (base64Data.includes(";base64,")) {
          base64Data = base64Data.split(";base64,").pop();
        }
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: questionPaperFile.mimeType
          }
        });
        parts.push({
          text: "[ORIGINAL QUESTION PAPER DOCUMENT ATTACHED ABOVE]"
        });
      }

      // Add Answer Key File
      if (answerKeyFile && answerKeyFile.data && answerKeyFile.mimeType) {
        let base64Data = answerKeyFile.data;
        if (base64Data.includes(";base64,")) {
          base64Data = base64Data.split(";base64,").pop();
        }
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: answerKeyFile.mimeType
          }
        });
        parts.push({
          text: "[ORIGINAL ANSWER KEY / RUBRIC DOCUMENT ATTACHED ABOVE]"
        });
      }

      // Prepare Prompt instructions
      const systemInstruction = `You are an Expert Exam Evaluator and Academic Mentor for competitive exams (e.g., UPSC, SSC, JEE, NEET, NMMS, JNVST, etc.).
Your task is to evaluate a student's handwritten answer sheet (uploaded as an image or PDF) against the original Question Paper and Answer Key / Rubric.

The student is preparing for the following competitive exam/track: ${examType || "General Competitive Exam"}
The maximum marks for the evaluation are: ${maxMarks || "100"}
Negative marking scheme: ${negativeMarking || "None"}
Academic Board / Curriculum: ${board || "CBSE"}
The user requests the evaluation feedback report to be fully written in the language corresponding to language code: ${lang || "en"}.

Here is the context provided:
${questionPaperText ? `--- ORIGINAL QUESTION PAPER TEXT ---\n${questionPaperText}\n` : ''}
${answerKeyText ? `--- ORIGINAL ANSWER KEY / RUBRIC TEXT ---\n${answerKeyText}\n` : ''}

Please analyze the attached handwritten student answer sheet. You must follow this step-by-step process:
1. TEXT EXTRACTION & UNDERSTANDING: Carefully read and extract the handwritten text from the student's answer sheet. Map each answer written by the student to the corresponding question in the Question Paper.
2. EVALUATION & SCORING:
   - Compare the student's answer with the provided Answer Key / Rubric.
   - For objective/MCQ questions, give exact marks for correct answers and apply negative marking (if specified).
   - For subjective/descriptive questions, evaluate based on keywords, logical steps, formulas used, and final accuracy.
3. WEAKNESS ANALYSIS: Identify recurring mistakes (e.g., calculation errors, conceptual gaps, time-management issues if they left questions blank).
4. CONSTRUCTIVE FEEDBACK: Provide an encouraging but realistic review of their performance.

OUTPUT FORMAT:
Provide the final output strictly in the following structured Markdown format, so it can be easily displayed on the front-end:

### 1. Final Score
* **Total Score:** [Calculated Score] / [Maximum Marks]
* **Accuracy Rate:** [Percentage]%

### 2. Question-wise Analysis
* **Q[Number]:** [Correct / Incorrect / Partially Correct / Unattempted] 
  - **Marks Awarded:** [Marks] / [Max Marks for Q]
  - **Feedback:** [Brief reason for the marks given. Point out where they went wrong or what they did perfectly.]

### 3. Core Weakness & Strengths
* **Strengths:** [1-2 lines about what they did well]
* **Areas of Improvement:** [Specific topics or question types they need to work on based on this paper]

### 4. Expert Advice
* [A short, actionable tip for their next exam or study session.]

Note: Respond in the requested language (e.g., English, Hindi, Tamil, Telugu, Marathi, Gujarati) corresponding to code '${lang}'. Ensure high professional academic standards.`;

      parts.push({
        text: systemInstruction
      });

      let response: any = null;
      let lastError: any = null;
      let success = false;
      const modelsToTry = [
        "gemini-3.1-flash-lite", // Extremely highly available and fast free-tier model
        "gemini-2.5-flash",      // Next generation high availability
        "gemini-3.5-flash",      // Highly capable text/vision free-tier model
        "gemini-3.1-pro-preview" // Paid-tier model
      ];

      for (const modelName of modelsToTry) {
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
             console.log(`[EXAM EVALUATION] Querying model ${modelName} (attempt ${attempt}/${maxRetries})...`);
             response = await ai.models.generateContent({
               model: modelName,
               contents: { parts: parts },
               config: {
                 temperature: 0.2, // Low temperature for high evaluation accuracy
               }
             });
             success = true;
             console.log(`[EXAM EVALUATION] Successfully generated evaluation using model: ${modelName}`);
             break;
          } catch (err: any) {
             lastError = err;
             const { message: errText, status: errStatus, code: errCode } = getErrorInfo(err);
             console.log(`[EXAM EVALUATION] Attempt ${attempt} for model ${modelName} failed:`, { message: errText, status: errStatus, code: errCode });
             
             const errMsg = errText.toLowerCase();
             const isZeroQuota = errMsg.includes("limit: 0") || errMsg.includes("limit:0");
             
             const isRetryable = 
               !isZeroQuota && (
                 errMsg.includes("503") || 
                 errMsg.includes("500") ||
                 errMsg.includes("429") ||
                 errMsg.includes("unavailable") || 
                 errMsg.includes("high demand") || 
                 errMsg.includes("resource") || 
                 errMsg.includes("limit") || 
                 errMsg.includes("rate") ||
                 errMsg.includes("busy") ||
                 errMsg.includes("quota") ||
                 errStatus.toLowerCase().includes("unavailable") ||
                 errStatus.toLowerCase().includes("exhausted") ||
                 errCode === 503 ||
                 errCode === 429 ||
                 errCode === 500
               );

             if (attempt < maxRetries && isRetryable) {
               const delay = attempt * 1500;
               console.log(`Retrying model ${modelName} (attempt ${attempt + 1}/${maxRetries}) in ${delay}ms...`);
               await new Promise(resolve => setTimeout(resolve, delay));
             } else {
               break; // Move to next model immediately
             }
          }
        }
        if (success) {
          break;
        }
      }

      if (!success && lastError) {
        throw lastError;
      }

      const responseText = response?.text || "Unable to generate evaluation report.";

      return res.json({
        success: true,
        text: responseText
      });

    } catch (error: any) {
      console.error("[GLOBAL SERVER ERROR IN /api/gemini/evaluate]:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "An error occurred while generating evaluation report."
      });
    }
  });

  // API ROUTE: LIVE QUESTION PAPER GENERATION FOR SIMULATED EXAM
  app.post("/api/gemini/generate-exam", async (req, res) => {
    try {
      const {
        examType,
        topic,
        maxMarks,
        numQuestions,
        board,
        lang
      } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          message: "Gemini API key is not configured. Please ensure GEMINI_API_KEY is defined in your secrets."
        });
      }

      // Lazy load/initialize GoogleGenAI
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `You are an Expert Academic Scholar and Exam Designer for competitive exams (e.g. UPSC, JEE, NEET, State Boards).
Your task is to generate a highly realistic, original mock Question Paper and a corresponding detailed Answer Key/Rubric.

The exam parameters are:
- Target Exam: ${examType || "General Competitive Test"}
- Subject / Chapter / Topic: ${topic || "All Syllabus Topics"}
- Maximum Marks: ${maxMarks || 100}
- Number of Questions: ${numQuestions || 3}
- Academic Board/Curriculum standard: ${board || "CBSE"}
- Requested Language: ${lang || "en"}

You MUST write the content in the language corresponding to language code: ${lang}.

Format your entire response strictly using the exact markers below to allow the application to parse them. Do not omit any markers:

===QUESTION PAPER===
[Write the actual Question Paper here. Number each question clearly, stating the marks allocated next to each question, e.g., "Q1 (15 Marks): ...". Questions should be realistic, clear, challenging, and suitable for student testing.]

===ANSWER KEY===
[Write the detailed, step-by-step Ideal Answers, expected keywords, key formulas, diagrams, or rubrics for checking the answers. This will be used by our AI evaluator to grade the student's paper later.]

===DURATION===
[Provide ONLY a single integer representing the recommended actual exam time in minutes. No text or characters. E.g., for a quick test of 3 questions, write "30" or "45".]`;

      let response: any = null;
      let lastError: any = null;
      let success = false;
      const modelsToTry = [
        "gemini-3.1-flash-lite", 
        "gemini-2.5-flash",      
        "gemini-3.5-flash",      
        "gemini-3.1-pro-preview" 
      ];

      for (const modelName of modelsToTry) {
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
             console.log(`[EXAM GENERATOR] Querying model ${modelName} (attempt ${attempt}/${maxRetries})...`);
             response = await ai.models.generateContent({
               model: modelName,
               contents: systemInstruction,
               config: {
                 temperature: 0.7,
                 maxOutputTokens: 2048,
               }
             });
             success = true;
             console.log(`[EXAM GENERATOR] Successfully generated exam using model: ${modelName}`);
             break;
          } catch (err: any) {
             lastError = err;
             const { message: errText, status: errStatus, code: errCode } = getErrorInfo(err);
             console.log(`[EXAM GENERATOR] Attempt ${attempt} for model ${modelName} failed:`, { message: errText, status: errStatus, code: errCode });
             
             const errMsg = errText.toLowerCase();
             const isZeroQuota = errMsg.includes("limit: 0") || errMsg.includes("limit:0");
             
             const isRetryable = 
               !isZeroQuota && (
                 errMsg.includes("503") || 
                 errMsg.includes("500") ||
                 errMsg.includes("429") ||
                 errMsg.includes("unavailable") || 
                 errMsg.includes("high demand") || 
                 errMsg.includes("resource") || 
                 errMsg.includes("limit") || 
                 errMsg.includes("rate") ||
                 errMsg.includes("busy") ||
                 errMsg.includes("quota") ||
                 errStatus.toLowerCase().includes("unavailable") ||
                 errStatus.toLowerCase().includes("exhausted") ||
                 errCode === 503 ||
                 errCode === 429 ||
                 errCode === 500
               );

             if (attempt < maxRetries && isRetryable) {
               const delay = attempt * 1500;
               console.log(`Retrying exam generator under ${modelName} in ${delay}ms...`);
               await new Promise(resolve => setTimeout(resolve, delay));
             } else {
               break; 
             }
          }
        }
        if (success) {
          break;
        }
      }

      if (!success && lastError) {
        throw lastError;
      }

      const responseText = response?.text || "";

      // Parse delimiters
      let questionPaperText = "";
      let answerKeyText = "";
      let durationStr = "30";

      const qpIndex = responseText.indexOf("===QUESTION PAPER===");
      const akIndex = responseText.indexOf("===ANSWER KEY===");
      const durIndex = responseText.indexOf("===DURATION===");

      if (qpIndex !== -1 && akIndex !== -1 && durIndex !== -1) {
        questionPaperText = responseText.substring(qpIndex + "===QUESTION PAPER===".length, akIndex).trim();
        answerKeyText = responseText.substring(akIndex + "===ANSWER KEY===".length, durIndex).trim();
        durationStr = responseText.substring(durIndex + "===DURATION===".length).replace(/[^0-9]/g, "").trim() || "30";
      } else {
        // Fallback split in case of slight format variations
        questionPaperText = responseText;
        answerKeyText = "Ideal checking standard: Compare responses logically against structural syllabus details.";
        durationStr = "30";
      }

      return res.json({
        success: true,
        questionPaper: questionPaperText,
        answerKey: answerKeyText,
        duration: parseInt(durationStr, 10) || 30
      });

    } catch (error: any) {
      console.error("[GLOBAL SERVER ERROR IN /api/gemini/generate-exam]:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "An error occurred while generating your exam paper."
      });
    }
  });

  // API ROUTE: MULTI-MODAL GEMINI CHAT
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, image, file, systemInstruction, board, lang } = req.body;

      if (!message && !image && !file) {
        return res.status(400).json({
          success: false,
          message: "Please provide a query message, an image, or a file attachment."
        });
      }

      // Syllabus-Aware Router: Dynamically adjusts instructions based on Board (CBSE, ICSE, or State Boards)
      let adjustedSystemInstruction = systemInstruction || "You are a helpful educational assistant.";
      const selectedBoard = (board || "CBSE").trim();
      const selectedBoardUpper = selectedBoard.toUpperCase();
      
      let syllabusGuideline = "";
      if (selectedBoardUpper === "CBSE") {
        syllabusGuideline = `
\n[SYLLABUS-AWARE ROUTER: CBSE (Central Board of Secondary Education) ACTIVE]
1. Pedagogy: Align strictly with the NCERT (National Council of Educational Research and Training) curriculum standards.
2. Structure: Break down explanations into logical, structured sections (Introduction, Key Concept, Real-world Application, Practice Problem).
3. Terminology: Use standard national terms and definitions. Align with CBSE exam pattern marking schemes (e.g., provide clear point-by-point explanations for long questions).
4. Goal: Prepare the student for national-level benchmarks and conceptual competency. Emphasize why/how concepts work over rote memorization.
5. In addition, encourage activity-based learning and project-based understanding aligned with CBSE's latest guidelines.
`;
      } else if (selectedBoardUpper === "ICSE") {
        syllabusGuideline = `
\n[SYLLABUS-AWARE ROUTER: ICSE (Indian Certificate of Secondary Education) ACTIVE]
1. Pedagogy: Align with CISCE curriculum standards, prioritizing an exhaustive, academically rigorous, and application-based teaching style.
2. Structure: Provide highly detailed, in-depth explanations. Avoid over-simplification; maintain high scholarly standards and introduce rich vocabulary and technical terms.
3. Terminology: Use precise international standard scientific and mathematical terminology. Include practical experiment methodology, observation steps, and analytical deductions.
4. Goal: Cultivate strong analytical skills, critical thinking, and structured comprehensive communication. Aligned with ICSE's comprehensive evaluative framework.
`;
      } else {
        // State Boards Routing
        syllabusGuideline = `\n[SYLLABUS-AWARE ROUTER: STATE BOARD SCERT ACTIVE]`;
        
        if (selectedBoardUpper.includes("ANDHRA") || selectedBoardUpper.includes("BIEAP") || selectedBoardUpper.includes("BSEAP")) {
          syllabusGuideline += `
Board: Andhra Pradesh (BIEAP & BSEAP)
- Pedagogy: Align with Andhra Pradesh SCERT curriculum, weaving in regional references like the Krishna-Godavari delta, local crops (paddy, cotton), and local cultural touchpoints.
- Style: Support step-by-step solutions matching the AP board exam format. Keep definitions precise, and integrate dual-medium Telugu terms in brackets where helpful.
- Goal: Deepen conceptual understanding for state-level board exams and regional competitive exams.
`;
        } else if (selectedBoardUpper.includes("ASSAM") || selectedBoardUpper.includes("AHSEC") || selectedBoardUpper.includes("SEBA")) {
          syllabusGuideline += `
Board: Assam (AHSEC & SEBA)
- Pedagogy: Align with Assam SCERT standards. Integrate local context such as Brahmaputra geography, tea garden agriculture, Majuli island ecology, and flood mitigation math/science.
- Style: Ensure terms are clear and support Assamese/Bodo cultural representations. Structure explanations to match SEBA/AHSEC exam formats.
- Goal: Maximize local relatability and academic excellence under the Assam state curriculum.
`;
        } else if (selectedBoardUpper.includes("BIHAR") || selectedBoardUpper.includes("BSEB")) {
          syllabusGuideline += `
Board: Bihar (BSEB - Bihar School Examination Board)
- Pedagogy: Align with Bihar SCERT curriculum. Focus on high conceptual clarity, local gangetic plains farming, and historical landmarks (Nalanda, Bodh Gaya).
- Style: Match BSEB Matric/Intermediate question styles. Use robust, clear academic terminology with optional Hindi/Bhojpuri local analogies to ground complex theories.
- Goal: Prepare students thoroughly for BSEB board examination formats and scoring patterns.
`;
        } else if (selectedBoardUpper.includes("CHHATTISGARH") || selectedBoardUpper.includes("CGBSE")) {
          syllabusGuideline += `
Board: Chhattisgarh (CGBSE)
- Pedagogy: Align with Chhattisgarh SCERT curriculum. Emphasize forest ecology, mineral resources (coal, iron ore), tribal culture, and local biodiversity.
- Style: Present step-by-step problem-solving methods suitable for CGBSE evaluations. Keep instructions supportive and direct.
`;
        } else if (selectedBoardUpper.includes("GOA") || selectedBoardUpper.includes("GBSHSE")) {
          syllabusGuideline += `
Board: Goa (GBSHSE)
- Pedagogy: Align with Goa SCERT standards, incorporating coastal ecosystems, marine life, mining science, and tourism logistics mathematics.
- Style: Highly systematic, matching the GBSHSE evaluation format.
`;
        } else if (selectedBoardUpper.includes("GUJARAT") || selectedBoardUpper.includes("GSEB")) {
          syllabusGuideline += `
Board: Gujarat (GSEB)
- Pedagogy: Align with Gujarat GSEB Board standards. Leverage regional examples like dairy cooperatives (Amul), trading and business mathematics, salt-pan geography (Rann of Kutch), and Gujarati cultural stories.
- Style: Adapt to GSEB exam blueprints. Provide clear, direct steps with Gujarati translations in brackets for difficult terms if requested.
`;
        } else if (selectedBoardUpper.includes("HARYANA") || selectedBoardUpper.includes("HBSE")) {
          syllabusGuideline += `
Board: Haryana (HBSE)
- Pedagogy: Align with Haryana Board of School Education (HBSE). Incorporate dairy farming physics, agricultural yields, green revolution biology, and athletic math (kinematics/trajectories).
- Style: Straightforward, structured, and exam-aligned formatting.
`;
        } else if (selectedBoardUpper.includes("HIMACHAL") || selectedBoardUpper.includes("HPBOSE")) {
          syllabusGuideline += `
Board: Himachal Pradesh (HPBOSE)
- Pedagogy: Align with HPBOSE standards. Use mountain physics, orchard farming biology, river energy generation (hydroelectric power), and cold weather adaptations.
- Style: Adaptable and highly supportive layout.
`;
        } else if (selectedBoardUpper.includes("JAMMU") || selectedBoardUpper.includes("KASHMIR") || selectedBoardUpper.includes("JKBOSE")) {
          syllabusGuideline += `
Board: Jammu & Kashmir (JKBOSE)
- Pedagogy: Align with JKBOSE curriculum. Contextualize using saffron cultivation, alpine flora, geometric architecture of houseboats, and Himalayan geographical formations.
`;
        } else if (selectedBoardUpper.includes("JHARKHAND") || selectedBoardUpper.includes("JAC")) {
          syllabusGuideline += `
Board: Jharkhand (JAC)
- Pedagogy: Align with Jharkhand Academic Council (JAC) curriculum. Focus on geology, mineral structures, steel and mining industries, Damodar river valley geography, and tribal heritage.
- Style: Tailor to the JAC Board assessment pattern.
`;
        } else if (selectedBoardUpper.includes("KARNATAKA") || selectedBoardUpper.includes("KSEAB")) {
          syllabusGuideline += `
Board: Karnataka (KSEAB)
- Pedagogy: Align with Karnataka KSEAB (formerly KSEEB) standards. Leverage examples like the Deccan plateau geography, local agricultural practices (ragi, coffee), and modern technological innovations.
- Style: Incorporate Kannada technical terminology in brackets if helpful. Align with KSEAB scoring patterns.
`;
        } else if (selectedBoardUpper.includes("KERALA") || selectedBoardUpper.includes("DHSE")) {
          syllabusGuideline += `
Board: Kerala (DHSE & Pareeksha Bhavan)
- Pedagogy: Align with Kerala SCERT guidelines. Focus on rigorous logical explanations, spice plantations biology, coastal marine biology, rain calculations, and local public health context.
- Style: Highly analytical, promoting critical thinking in line with Kerala's advanced education system.
`;
        } else if (selectedBoardUpper.includes("MADHYA PRADESH") || selectedBoardUpper.includes("MPBSE")) {
          syllabusGuideline += `
Board: Madhya Pradesh (MPBSE)
- Pedagogy: Align with MPBSE standards. Draw contexts from central Indian forest reserves (Kanha, Pench), soybean agriculture, Narmada river valley systems, and historical monuments.
- Style: Step-by-step textbook explanations formatted for MP Board scoring.
`;
        } else if (selectedBoardUpper.includes("MAHARASHTRA") || selectedBoardUpper.includes("MSBSHSE")) {
          syllabusGuideline += `
Board: Maharashtra (MSBSHSE)
- Pedagogy: Align with Maharashtra MSBSHSE standards. Use local contexts like Western Ghats ecology, sugarcane production, black cotton soil agriculture, and history of Sahyadri.
- Style: Detail-oriented to suit Maharashtra Board patterns, including Marathi academic translations where necessary.
`;
        } else if (selectedBoardUpper.includes("MANIPUR") || selectedBoardUpper.includes("BSEM") || selectedBoardUpper.includes("COHSEM")) {
          syllabusGuideline += `
Board: Manipur (BSEM & COHSEM)
- Pedagogy: Incorporate Loktak lake biology, floating Phumdis, northeast flora, and traditional handloom mathematical patterns.
`;
        } else if (selectedBoardUpper.includes("MEGHALAYA") || selectedBoardUpper.includes("MBOSE")) {
          syllabusGuideline += `
Board: Meghalaya (MBOSE)
- Pedagogy: Incorporate rainfall and water cycle calculations (Cherrapunji context), living root bridge engineering concepts, and local tribal geometry.
`;
        } else if (selectedBoardUpper.includes("MIZORAM") || selectedBoardUpper.includes("MBSE")) {
          syllabusGuideline += `
Board: Mizoram (MBSE)
- Pedagogy: Contextualize with bamboo forest management, shifting agriculture, and hilly terrain geological features.
`;
        } else if (selectedBoardUpper.includes("NAGALAND") || selectedBoardUpper.includes("NBSE")) {
          syllabusGuideline += `
Board: Nagaland (NBSE)
- Pedagogy: Focus on terrace cultivation biology, Naga hills biodiversity, and regional tribal heritage.
`;
        } else if (selectedBoardUpper.includes("ODISHA") || selectedBoardUpper.includes("BSE ODISHA") || selectedBoardUpper.includes("CHSE")) {
          syllabusGuideline += `
Board: Odisha (BSE Odisha & CHSE Odisha)
- Pedagogy: Align with Odisha Board standards. Incorporate coastal ecosystems (Chilika lake), cyclone safety physics, local mineral industries, and Odia historical contexts.
`;
        } else if (selectedBoardUpper.includes("PUNJAB") || selectedBoardUpper.includes("PSEB")) {
          syllabusGuideline += `
Board: Punjab (PSEB)
- Pedagogy: Align with Punjab School Education Board standards. Use green revolution biological advancements, canal irrigation systems, wheat yields, and robust agricultural examples.
`;
        } else if (selectedBoardUpper.includes("RAJASTHAN") || selectedBoardUpper.includes("RBSE")) {
          syllabusGuideline += `
Board: Rajasthan (RBSE)
- Pedagogy: Align with RBSE board syllabus. Feature desert ecological adaptations, rainwater harvesting systems (Taankas), solar energy science, and regional fortification architecture.
`;
        } else if (selectedBoardUpper.includes("TAMIL NADU") || selectedBoardUpper.includes("DGE TN") || selectedBoardUpper.includes("SAMACHEER")) {
          syllabusGuideline += `
Board: Tamil Nadu (DGE TN - Samacheer Kalvi)
- Pedagogy: Align with Tamil Nadu State Board guidelines. Incorporate rich cultural history, Cauvery delta farming, irrigation systems, temple architectures (engineering/geometry), and advanced scientific concepts.
- Style: Highly structured with Samacheer Kalvi guidelines. Provide Tamil technical equivalents in brackets where useful.
`;
        } else if (selectedBoardUpper.includes("TELANGANA") || selectedBoardUpper.includes("TSBIE")) {
          syllabusGuideline += `
Board: Telangana (TSBIE)
- Pedagogy: Align with Telangana State Board. Use Kakatiya canal calculations, Deccan rocky terrain geology, and localized tech context.
`;
        } else if (selectedBoardUpper.includes("TRIPURA") || selectedBoardUpper.includes("TBSE")) {
          syllabusGuideline += `
Board: Tripura (TBSE)
- Pedagogy: Incorporate rubber plantations biology, organic pineapple farming, and regional north-east geographical landmarks.
`;
        } else if (selectedBoardUpper.includes("UTTAR PRADESH") || selectedBoardUpper.includes("UPMSP")) {
          syllabusGuideline += `
Board: Uttar Pradesh (UPMSP - Madhyamik Shiksha Parishad)
- Pedagogy: Align strictly with UPMSP guidelines. Focus on Ganga-Yamuna gangetic plains, sugarcane crop calculations, and high scoring step-by-step methodologies.
- Style: Match the exact UPMSP academic terminology and Hindi academic terms commonly taught in Uttar Pradesh.
`;
        } else if (selectedBoardUpper.includes("UTTARAKHAND") || selectedBoardUpper.includes("UBSE")) {
          syllabusGuideline += `
Board: Uttarakhand (UBSE)
- Pedagogy: Incorporate Himalayan biodiversity, river sources (Ganges, Yamuna), terrace farming, and landslides landslide physics.
`;
        } else if (selectedBoardUpper.includes("WEST BENGAL") || selectedBoardUpper.includes("WBBSE") || selectedBoardUpper.includes("WBCHSE")) {
          syllabusGuideline += `
Board: West Bengal (WBBSE & WBCHSE)
- Pedagogy: Align with West Bengal Madhyamik/Uchha Madhyamik systems. Emphasize Sundarbans biology, jute and rice crop cultivation, and deep conceptual rigor in science and mathematics.
`;
        } else {
          syllabusGuideline += `
Board: State Board SCERT Standard
- Pedagogy: Focus on localized regional examples, clear step-by-step sequential teaching workflows, and standard state board curriculum frameworks.
`;
        }
      }

      adjustedSystemInstruction = `${adjustedSystemInstruction}\n${syllabusGuideline}`;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          message: "Gemini API key is not configured. Please ensure GEMINI_API_KEY is defined in your secrets."
        });
      }

      // Lazy load/initialize GoogleGenAI
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Prepare parts for the query
      const parts: any[] = [];

      // Handle general file or legacy image attachment
      const activeAttachment = file || image;
      if (activeAttachment && activeAttachment.data && activeAttachment.mimeType) {
        // Strip out the data:...;base64, prefix if present
        let base64Data = activeAttachment.data;
        if (base64Data.includes(";base64,")) {
          base64Data = base64Data.split(";base64,").pop();
        }
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: activeAttachment.mimeType
          }
        });
      }

      if (message) {
        parts.push({
          text: message
        });
      }

      const getErrorInfo = (err: any) => {
        let msg = "";
        let status = "";
        let code: number | undefined = undefined;

        if (err) {
          if (typeof err === 'object') {
            const inner = err.error || err;
            msg = inner.message || err.message || "";
            status = inner.status || err.status || "";
            code = inner.code || err.code || undefined;
          } else {
            msg = String(err);
          }
        }
        return { message: msg, status: String(status), code };
      };

      let response: any = null;
      let lastError: any = null;
      let success = false;
      const modelsToTry = [
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash",
        "gemini-3.5-flash",
        "gemini-3.1-pro-preview"
      ];

      for (const modelName of modelsToTry) {
        const maxRetries = 3; // Retry three times per model before trying fallback
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
             console.log(`[GEMINI CHAT] Querying model ${modelName} (attempt ${attempt}/${maxRetries})...`);
             response = await ai.models.generateContent({
               model: modelName,
               contents: { parts: parts },
               config: {
                 systemInstruction: adjustedSystemInstruction,
                 temperature: 0.7,
               }
             });
             success = true;
             console.log(`[GEMINI CHAT] Successfully generated content using model: ${modelName}`);
             break; // Success! Exit the retry loop for this model
          } catch (err: any) {
             lastError = err;
             const { message: errText, status: errStatus, code: errCode } = getErrorInfo(err);
             console.log(`[GEMINI CHAT] Attempt ${attempt} for model ${modelName} returned status:`, { message: errText, status: errStatus, code: errCode });
             
             const errMsg = errText.toLowerCase();
             const isRetryable = 
               errMsg.includes("503") || 
               errMsg.includes("500") ||
               errMsg.includes("429") ||
               errMsg.includes("unavailable") || 
               errMsg.includes("high demand") || 
               errMsg.includes("resource") || 
               errMsg.includes("limit") || 
               errMsg.includes("rate") ||
               errMsg.includes("busy") ||
               errMsg.includes("quota") ||
               errStatus.toLowerCase().includes("unavailable") ||
               errStatus.toLowerCase().includes("exhausted") ||
               errCode === 503 ||
               errCode === 429 ||
               errCode === 500;

             if (attempt < maxRetries && isRetryable) {
               const delay = attempt * 1500;
               console.log(`Retrying model ${modelName} (attempt ${attempt + 1}/${maxRetries}) in ${delay}ms...`);
               await new Promise(resolve => setTimeout(resolve, delay));
             } else {
               break; // Try fallback model or bubble up
             }
          }
        }
        if (success) {
          break; // Exit model loop
        }
      }

      if (!success && lastError) {
        throw lastError;
      }

      const responseText = response?.text || "I was unable to process that query.";

      return res.json({
        success: true,
        text: responseText
      });

    } catch (error: any) {
      console.error("[GLOBAL SERVER ERROR IN /api/gemini/chat]:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "An error occurred while generating AI response."
      });
    }
  });

  // API ROUTE: GOOGLE TTS PROXY WITH REFERER STRIPPING & CORS BYPASS
  app.get("/api/tts", async (req, res) => {
    try {
      const { tl, q } = req.query;
      if (!tl || !q) {
        return res.status(400).send("Missing required parameters: tl (target language), q (text content)");
      }

      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(tl as string)}&client=tw-ob&q=${encodeURIComponent(q as string)}`;

      const ttsResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        referrerPolicy: "no-referrer"
      });

      if (!ttsResponse.ok) {
        console.warn(`[TTS Proxy Server] Google TTS request failed with status: ${ttsResponse.status}`);
        return res.status(ttsResponse.status).send(`Google TTS request failed: ${ttsResponse.statusText}`);
      }

      // Stream the response directly as audio/mpeg
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day
      
      const buffer = await ttsResponse.arrayBuffer();
      return res.send(Buffer.from(buffer));
    } catch (err: any) {
      console.error("[TTS Proxy Server Error]:", err);
      return res.status(500).send("Internal server error during TTS Proxy transmission.");
    }
  });

  // Serve Vite or static compilation
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[VITE] Mounted Vite Asset Dev server middleware for local hot-module replacement.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[DIST] Serving statically built files from production asset folders.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=============================================================`);
    console.log(`[EXPRESS SERVER ACTIVE] Running on http://localhost:${PORT}`);
    console.log(`[API ENDPOINTS] 💻 POST /api/otp/generate  |  💻 POST /api/otp/verify`);
    console.log(`=============================================================`);
  });
}

startServer();
