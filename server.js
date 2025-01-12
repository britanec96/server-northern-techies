import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import bodyParser from "body-parser";
import expressRateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 5000;

// Разрешённые домены
const allowedDomains = ["https://www.northerntechies.com", "http://localhost:3000"];

// Middleware
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

// Лимит запросов
const formLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

// Обработка OPTIONS-запросов
app.options("*", cors());

// Проверка CAPTCHA
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
      res.status(200).json({ success: true, message: "Captcha verified." });
    } else {
      console.error("CAPTCHA verification error:", data["error-codes"]);
      res.status(400).json({
        success: false,
        message: "Captcha verification failed.",
        errors: data["error-codes"],
      });
    }
  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({ success: false, message: "Server error during CAPTCHA verification." });
  }
});

// Запуск сервера
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
