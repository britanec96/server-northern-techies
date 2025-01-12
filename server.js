import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import bodyParser from "body-parser";
import expressRateLimit from "express-rate-limit";

const app = express();
const PORT = process.env.PORT || 5000; // Railway передает порт в переменную PORT

// Разрешённые домены
const allowedDomains = ["https://northerntechies.com", "http://localhost:3000", "https://localhost:3000"];

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
    methods: ["GET", "POST"], // Разрешенные методы
    allowedHeaders: ["Content-Type"], // Разрешенные заголовки
  })
);

app.use(bodyParser.json());

// Настройка лимита запросов
const formLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // Максимум 10 запросов с одного IP
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

// Проверка CAPTCHA с ограничением запросов
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
        errors: data["error-codes"], // Передача ошибок для отладки
      });
    }
  } catch (error) {
    console.error("Server error during CAPTCHA verification:", error.message);
    res.status(500).json({ success: false, message: "Server error during CAPTCHA verification." });
  }
});

// Запуск сервера
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
