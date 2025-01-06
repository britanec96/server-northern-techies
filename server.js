import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 5000; // Railway передает порт в переменную PORT

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Проверка CAPTCHA
app.post("/verify-captcha", async (req, res) => {
  const { token } = req.body;
  const secretKey = "6Ld2568qAAAAADTk3p4-bWURNJm9NzRJeFcTA3hZ"; 

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