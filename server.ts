import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

import multer from "multer";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });

const db = new Database("leaderboard.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    score REAL NOT NULL,
    total REAL NOT NULL,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS written_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    module_key TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS peer_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    reviewer_name TEXT NOT NULL,
    reviewer_email TEXT NOT NULL,
    grammar INTEGER NOT NULL,
    vocab INTEGER NOT NULL,
    clarity INTEGER NOT NULL,
    fluency INTEGER NOT NULL,
    completion INTEGER NOT NULL,
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(task_id) REFERENCES written_tasks(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/leaderboard", (req, res) => {
    try {
      const rows = db.prepare("SELECT name, email, score, total, date FROM leaderboard ORDER BY score DESC LIMIT 50").all();
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  app.post("/api/leaderboard", (req, res) => {
    const { name, email, score, total, date } = req.body;
    if (!name || score === undefined) {
      return res.status(400).json({ error: "Missing name or score" });
    }
    try {
      db.prepare("INSERT INTO leaderboard (name, email, score, total, date) VALUES (?, ?, ?, ?, ?)").run(name, email, score, total, date);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save entry" });
    }
  });

  // Written Tasks API
  app.post("/api/tasks", (req, res) => {
    const { student_name, student_email, module_key, content } = req.body;
    try {
      const result = db.prepare("INSERT INTO written_tasks (student_name, student_email, module_key, content) VALUES (?, ?, ?, ?)").run(student_name, student_email, module_key, content);
      res.json({ success: true, taskId: result.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: "Failed to save task" });
    }
  });

  app.get("/api/tasks/pending", (req, res) => {
    const { email, module_key } = req.query;
    try {
      // Find a task from the same module that wasn't written by this student and hasn't been reviewed by them
      const task = db.prepare(`
        SELECT * FROM written_tasks 
        WHERE module_key = ? 
        AND student_email != ? 
        AND id NOT IN (SELECT task_id FROM peer_reviews WHERE reviewer_email = ?)
        ORDER BY RANDOM() LIMIT 1
      `).get(module_key, email, email);
      res.json(task || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending task" });
    }
  });

  app.post("/api/reviews", (req, res) => {
    const { task_id, reviewer_name, reviewer_email, grammar, vocab, clarity, fluency, completion, feedback } = req.body;
    try {
      db.prepare(`
        INSERT INTO peer_reviews (task_id, reviewer_name, reviewer_email, grammar, vocab, clarity, fluency, completion, feedback)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(task_id, reviewer_name, reviewer_email, grammar, vocab, clarity, fluency, completion, feedback);
      
      // Update task status
      db.prepare("UPDATE written_tasks SET status = 'reviewed' WHERE id = ?").run(task_id);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save review" });
    }
  });

  app.get("/api/tasks/status", (req, res) => {
    const { email, module_key } = req.query;
    try {
      const task = db.prepare("SELECT * FROM written_tasks WHERE student_email = ? AND module_key = ? ORDER BY created_at DESC LIMIT 1").get(email, module_key);
      if (!task) return res.json({ hasTask: false });

      const review = db.prepare("SELECT * FROM peer_reviews WHERE task_id = ?").get(task.id);
      const userReviewCount = db.prepare("SELECT COUNT(*) as count FROM peer_reviews WHERE reviewer_email = ? AND task_id IN (SELECT id FROM written_tasks WHERE module_key = ?)").get(email, module_key);

      res.json({
        hasTask: true,
        taskStatus: task.status,
        review: review || null,
        userReviewCount: userReviewCount.count
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch status" });
    }
  });

  app.post("/api/send-recording", upload.single("video"), async (req, res) => {
    const { studentName, studentEmail, nightTitle, score, total } = req.body;
    const videoFile = req.file;

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'placeholder@gmail.com',
          pass: process.env.EMAIL_PASS || 'placeholder_pass',
        },
      });

      const attachments = [];
      if (videoFile) {
        attachments.push({
          filename: `recording-${Date.now()}.webm`,
          content: videoFile.buffer,
        });
      }

      const mailOptions = {
        from: process.env.EMAIL_USER || 'placeholder@gmail.com',
        to: ["omarzoog@mercy.edu", "othmanabdullahmarzoog@gmail.com"],
        subject: `Reading Results: ${studentName} - ${nightTitle}`,
        text: `Student Name: ${studentName}\nStudent Email: ${studentEmail}\nNight: ${nightTitle}\nQuiz Score: ${score}/${total}\n\n${videoFile ? "A video recording of the reading is attached." : "No video recording was provided."}`,
        attachments: attachments,
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to send email:", error);
      res.json({ success: true, warning: "Email sending failed, but data received." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
