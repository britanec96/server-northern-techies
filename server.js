import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import bodyParser from "body-parser";
import expressRateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 5000;

const allowedDomains = ["https://www.northerntechies.com", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedDomains.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());

const formLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 4, // 4 запроса с одного IP за 15 минут
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => { // Обработчик превышения лимита
    res.status(429).json({
      success: false,
      message: "Too many requests from this IP, please try again later.",
    });
  },
});

app.options("*", cors());

app.post("/", formLimiter, async (req, res) => {
  const { token } = req.body;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!token) {
    return res.status(400).json({ success: false, message: "No CAPTCHA token provided." });
  }

  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
      { method: "POST" }
    );
    const data = await response.json();

    if (data.success) {
      return res.status(200).json({ success: true, message: "Captcha verified." });
    } else {
      console.error("CAPTCHA verification error:", data["error-codes"]);
      return res.status(400).json({
        success: false,
        message: "Captcha verification failed.",
        errors: data["error-codes"],
      });
    }
  } catch (error) {
    console.error("Server error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during CAPTCHA verification." });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));