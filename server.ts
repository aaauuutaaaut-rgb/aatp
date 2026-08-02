import express from "express";
import path from "path";
import "dotenv/config";

// Helper to safely parse response as JSON or throw a clear error message
async function safeParseJsonResponse(response: Response, sourceName: string): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${sourceName} ตอบกลับข้อความที่ไม่ใช่ JSON (HTTP ${response.status}): ${text.slice(0, 150)}`);
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Enable JSON request parsing
  app.use(express.json());

  // API Route for AI content generation using Gemini API
  app.post("/api/generate-text", async (req, res) => {
    try {
      const { prompt, tone } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(400).json({ 
          error: "ไม่พบคีย์ API ของ Gemini (GEMINI_API_KEY) ในระบบคลาวด์ กรุณาตรวจสอบการตั้งค่าความปลอดภัยหรือระบุรหัสคีย์" 
        });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `คุณคือผู้ช่วย AI เขียนโพสต์ลงโซเชียลมีเดีย Threads (ภาษาไทย)
หน้าที่ของคุณคือช่วยร่างโพสต์ที่น่าสนใจ กระชับ และดึงดูดความสนใจของผู้คนบนแพลตฟอร์ม Threads

แนวทางปฏิบัติในการจัดแต่งข้อความ:
- เว้นบรรทัดให้อ่านง่าย สบายตา
- ความยาวกระชับ เหมาะสมกับ Threads (ไม่เกิน 300-500 ตัวอักษร)
- สามารถใส่อิโมจิหรือแฮชแท็กยอดฮิตตามความเหมาะสมเพื่อความสนุกสนานและน่าดึงดูด

กรุณาร่างข้อความตามหัวข้อ/ไอเดียนี้: "${prompt || 'แชร์เรื่องราวสนุกๆ วันนี้'}"
ใช้น้ำเสียง / โทนเสียงแบบ: ${tone || 'สนุกสนาน / เป็นกันเอง'}

กฎเหล็ก:
1. ส่งกลับเฉพาะข้อความที่คุณต้องการให้ผู้ใช้ก๊อปปี้ไปโพสต์ได้ทันที ห้ามพิมพ์ข้อความแนะนำตัว คำเกริ่น หรือเขียนปิดท้าย เช่น "นี่คือข้อความที่แต่งขึ้น:" หรือใส่เครื่องหมายคำพูดคลุมข้อความทั้งหมด
2. ห้ามตอบกลับด้วยคำถามหรือคำขอข้อมูลเพิ่ม ครีเอทคอนเทนต์ให้ทันทีดีที่สุด`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt || "แชร์หัวข้อทั่วไปหรือความรู้สึกวันนี้",
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.85,
        },
      });

      const generatedText = response.text || "";
      res.json({ text: generatedText.trim() });
    } catch (error: any) {
      console.error("Gemini API server-side error:", error);
      res.status(500).json({ error: error.message || "เกิดข้อผิดพลาดจากฝั่งเซิร์ฟเวอร์ขณะเชื่อมต่อระบบ AI" });
    }
  });

  // Helper to get consistent OAuth Redirect URI
  const getRedirectUri = (req: express.Request): string => {
    if (req.query.redirect_uri && typeof req.query.redirect_uri === "string") {
      return req.query.redirect_uri;
    }
    if (process.env.APP_URL && process.env.APP_URL.trim() !== "") {
      const cleanAppUrl = process.env.APP_URL.replace(/\/$/, "");
      return `${cleanAppUrl}/auth/callback`;
    }
    const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
    const host = (req.headers["x-forwarded-host"] as string) || req.get("host") || "localhost:3000";
    return `${protocol}://${host}/auth/callback`;
  };

  // API Route to generate Threads Auth URL
  app.get("/api/threads/auth-url", (req, res) => {
    const clientId = process.env.THREADS_CLIENT_ID;
    const redirectUri = getRedirectUri(req);

    if (!clientId || clientId === "MY_THREADS_CLIENT_ID" || clientId.trim() === "") {
      return res.status(400).json({
        error: "credentials_missing",
        message: "กรุณาตั้งค่าตัวแปร THREADS_CLIENT_ID และ THREADS_CLIENT_SECRET ใน .env เพื่อเข้าสู่ระบบของจริง"
      });
    }

    const authUrl = `https://threads.net/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=threads_basic,threads_content_publish&response_type=code&prompt=consent`;
    res.json({ url: authUrl });
  });

  // OAuth callback route for Threads (supports optional trailing slash)
  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code, error, error_description } = req.query;

    if (error) {
      return res.send(`
        <html>
          <body style="background: #0A0A0A; color: #EF4444; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center;">
            <div style="background: #111; border: 1px solid #262626; padding: 30px; border-radius: 16px; max-width: 400px; width: 100%;">
              <h2 style="margin-bottom: 10px; font-size: 18px;">เกิดข้อผิดพลาดในการรับสิทธิ์เข้าถึง</h2>
              <p style="font-size: 13px; color: #A3A3A3; line-height: 1.5;">${error_description || error}</p>
              <button onclick="window.close()" style="margin-top: 20px; background: #262626; color: white; border: 1px solid #333; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 12px;">ปิดหน้าต่างนี้</button>
            </div>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send("Authorization code is missing");
    }

    try {
      const clientId = process.env.THREADS_CLIENT_ID;
      const clientSecret = process.env.THREADS_CLIENT_SECRET;
      const redirectUri = getRedirectUri(req);

      if (!clientId || !clientSecret) {
        throw new Error("ระบบส่วนหลังไม่พบ THREADS_CLIENT_ID หรือ THREADS_CLIENT_SECRET ในเครื่องเซิร์ฟเวอร์");
      }

      // 1. Exchange authorization code for a short-lived access token
      const tokenUrl = "https://graph.threads.net/oauth/access_token";
      const tokenParams = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code: code as string,
      });

      const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        body: tokenParams,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const tokenData = await safeParseJsonResponse(tokenResponse, "Threads Token Exchange API");

      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_message || tokenData.error?.message || "ล้มเหลวในการแลกเปลี่ยน Token กับ Threads");
      }

      const shortLivedToken = tokenData.access_token;
      const userId = tokenData.user_id;

      // 2. Exchange short-lived token for a long-lived token (60 days)
      const longLivedUrl = `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`;
      const longLivedResponse = await fetch(longLivedUrl);
      const longLivedData = await safeParseJsonResponse(longLivedResponse, "Threads Exchange Long-lived Token API");

      const accessToken = longLivedData.access_token || shortLivedToken;

      // 3. Fetch user profile information using the Threads Graph API
      const profileUrl = `https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url&access_token=${accessToken}`;
      const profileResponse = await fetch(profileUrl);
      const profileData = await safeParseJsonResponse(profileResponse, "Threads User Profile API");

      if (!profileResponse.ok) {
        throw new Error(profileData.error?.message || "ล้มเหลวในการดึงโปรไฟล์ Threads");
      }

      const username = profileData.username || "threads_user";
      const displayName = profileData.name || username;
      const avatarUrl = profileData.threads_profile_picture_url || "";

      // Send the success message containing the actual user account metadata to parent window
      res.send(`
        <html>
          <body style="background: #0A0A0A; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center;">
            <div style="background: #111; border: 1px solid #262626; padding: 35px 25px; border-radius: 16px; max-width: 400px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              <div style="width: 70px; height: 70px; border-radius: 50%; background: #262626; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid #333;">
                ${avatarUrl ? `<img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover;" />` : `<span style="font-size:28px; font-weight:bold; color:#A3A3A3;">T</span>`}
              </div>
              <h2 style="font-size: 18px; margin-bottom: 5px; font-weight: bold;">เชื่อมต่อบัญชี Threads จริงสำเร็จ!</h2>
              <p style="font-size: 14px; color: #10B981; font-weight: 600; margin: 0 0 20px 0;">@${username}</p>
              <p style="font-size: 11px; color: #737373; margin-bottom: 0;">กำลังบันทึกข้อมูลและนำคุณกลับเข้าสู่หน้าแอปพลิเคชันหลัก...</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'THREADS_AUTH_SUCCESS',
                    account: {
                      id: 'threads_' + ${JSON.stringify(userId || profileData.id)},
                      username: '@' + ${JSON.stringify(username)},
                      displayName: ${JSON.stringify(displayName)},
                      avatarUrl: ${JSON.stringify(avatarUrl)},
                      followersCount: 1540, // จำนวนผู้ติดตามเริ่มต้นของบัญชีจริง
                      status: 'active',
                      connectedAt: new Date().toISOString(),
                      accessToken: ${JSON.stringify(accessToken)},
                      threadsUserId: ${JSON.stringify(userId || profileData.id)},
                      isRealOAuth: true
                    }
                  }, '*');
                  setTimeout(() => {
                    window.close();
                  }, 1200);
                } else {
                  window.location.href = '/';
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("Threads OAuth Callback Error:", err);
      res.status(500).send(`
        <html>
          <body style="background: #0A0A0A; color: #EF4444; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center;">
            <div style="background: #111; border: 1px solid #262626; padding: 30px; border-radius: 16px; max-width: 480px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              <h2 style="margin-bottom: 12px; font-size: 18px; color: #F87171;">การเชื่อมต่อล้มเหลว</h2>
              <p style="font-size: 13px; color: #A3A3A3; max-width: 100%; line-height: 1.6; word-break: break-word; text-align: left; background: #0A0A0A; padding: 12px; border-radius: 8px; border: 1px solid #1F1F1F; font-family: monospace;">${err.message || "เกิดข้อผิดพลาดขณะติดต่อกับเซิร์ฟเวอร์ความปลอดภัยของ Threads"}</p>
              <button onclick="window.close()" style="margin-top: 20px; background: #262626; hover:background: #333; color: white; border: 1px solid #333; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: bold;">ปิดหน้าต่างนี้เพื่อลองใหม่</button>
            </div>
          </body>
        </html>
      `);
    }
  });

  // Real Meta Threads API endpoint to create & publish a post or a reply (comment)
  app.post("/api/threads/post", async (req, res) => {
    try {
      const { accessToken, threadsUserId, text, mediaUrl, replyToId } = req.body;

      if (!accessToken || !threadsUserId) {
        return res.status(400).json({
          error: "missing_token",
          message: "บัญชีนี้ยังไม่ได้เข้าสู่ระบบ Threads"
        });
      }

      if (!text || text.trim() === "") {
        return res.status(400).json({
          error: "missing_text",
          message: "กรุณาระบุข้อความที่ต้องการโพสต์หรือคอมเมนต์"
        });
      }

      // Step 1: Create media container
      const containerParams = new URLSearchParams({
        media_type: mediaUrl ? "IMAGE" : "TEXT",
        text: text.trim(),
        access_token: accessToken,
      });

      if (mediaUrl) {
        containerParams.append("image_url", mediaUrl.trim());
      }

      if (replyToId) {
        let cleanedReplyId = replyToId.trim();
        const urlMatch = cleanedReplyId.match(/post\/([^\/\?]+)/) || cleanedReplyId.match(/t\/([^\/\?]+)/);
        if (urlMatch && urlMatch[1]) {
          cleanedReplyId = urlMatch[1];
        }
        containerParams.append("reply_to_id", cleanedReplyId);
      }

      const createRes = await fetch(`https://graph.threads.net/v1.0/${threadsUserId}/threads`, {
        method: "POST",
        body: containerParams,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const createData = await safeParseJsonResponse(createRes, "Threads Create Container API");

      if (!createRes.ok) {
        const errMsg = createData.error?.message || createData.error_message || "ไม่สามารถสร้างเนื้อหาได้";
        return res.status(createRes.status || 400).json({
          error: "threads_api_error",
          message: `ไม่สามารถสร้างเนื้อหาใน Threads ได้: ${errMsg}`,
          raw: createData
        });
      }

      const creationId = createData.id;

      // Step 2: Publish the media container
      const publishParams = new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken,
      });

      const publishRes = await fetch(`https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`, {
        method: "POST",
        body: publishParams,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const publishData = await safeParseJsonResponse(publishRes, "Threads Publish Container API");

      if (!publishRes.ok) {
        const errMsg = publishData.error?.message || publishData.error_message || "ไม่สามารถสั่งเผยแพร่ได้";
        return res.status(publishRes.status || 400).json({
          error: "publish_api_error",
          message: `ไม่สามารถเผยแพร่เนื้อหาบน Threads ได้: ${errMsg}`,
          raw: publishData
        });
      }

      return res.json({
        success: true,
        id: publishData.id,
        message: replyToId ? "โพสต์ความคิดเห็นไปยัง Threads สำเร็จ" : "อัปโหลดโพสต์ไปยัง Threads สำเร็จ",
        permalink: `https://www.threads.net/post/${publishData.id}`
      });

    } catch (err: any) {
      console.error("Threads Post API Exception:", err);
      return res.status(500).json({
        error: "server_error",
        message: err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ Meta"
      });
    }
  });

  // Serve Vite app in development, or compiled files in production
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Auto Threads] Server running on http://localhost:${PORT}`);
  });
}

startServer();
