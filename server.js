import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 5000; // Railway передает порт в переменную PORT

// Middleware
app.use(
  cors({
    origin: ["https://northerntechies.com", "localhost:3000"], // Разрешение для фронтенда и локального хоста
    methods: ["GET", "POST"], // Разрешенные методы
    allowedHeaders: ["Content-Type"], // Разрешенные заголовки
  })
);

app.use(bodyParser.json());

// Проверка CAPTCHA
app.post("/", async (req, res) => {
  const { token } = req.body;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
      { method: "POST" }
    );
    const data = await response.json();

    if (data.success) {
      res.status(200).json({ success: true, message: "Captcha verified." });
    } else {
      res.status(400).json({ success: false, message: "Captcha verification failed." });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});


// Запуск сервера
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));