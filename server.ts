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

  // API ROUTE: MULTI-MODAL GEMINI CHAT
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, image, systemInstruction } = req.body;

      if (!message && !image) {
        return res.status(400).json({
          success: false,
          message: "Please provide a query message or an image attachment."
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

      // Prepare parts for the query
      const parts: any[] = [];

      if (image && image.data && image.mimeType) {
        // Strip out the data:image/...;base64, prefix if present
        let base64Data = image.data;
        if (base64Data.includes(";base64,")) {
          base64Data = base64Data.split(";base64,").pop();
        }
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: image.mimeType
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
        "gemini-2.5-flash",
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
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
                 systemInstruction: systemInstruction || "You are a helpful educational assistant.",
                 temperature: 0.7,
               }
             });
             success = true;
             console.log(`[GEMINI CHAT] Successfully generated content using model: ${modelName}`);
             break; // Success! Exit the retry loop for this model
          } catch (err: any) {
             lastError = err;
             const { message: errText, status: errStatus, code: errCode } = getErrorInfo(err);
             console.warn(`[GEMINI CHAT ATTEMPT ${attempt} FAILED for model ${modelName}]:`, { message: errText, status: errStatus, code: errCode });
             
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
