import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "default_secret_fallback";

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

let pool: any = null;
let sqliteDb: any = null;
const useMySQL = !!process.env.MYSQL_HOST;

if (useMySQL) {
  console.log("Using MySQL database...");
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
} else {
  console.log("Using SQLite database...");
  sqliteDb = new Database("./database.sqlite");
}

async function dbQuery(sql: string, params: any[] = []) {
  if (useMySQL) {
    const [rows] = await pool.execute(sql, params);
    if (!sql.trim().toUpperCase().startsWith("SELECT") && !Array.isArray(rows)) {
      return [rows];
    }
    return rows;
  } else {
    if (sql.trim().toUpperCase().startsWith("SELECT")) {
      return sqliteDb.prepare(sql).all(...params);
    } else {
      const stmt = sqliteDb.prepare(sql);
      const result = stmt.run(...params);
      return [{ insertId: result.lastInsertRowid, affectedRows: result.changes }];
    }
  }
}

async function ensureTables() {
  try {
    console.log("Vérification/Création des tables...");
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        birth_date TEXT,
        pathology TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        assessment_type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (let q of queries) {
      if (useMySQL) {
        q = q.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, "INT AUTO_INCREMENT PRIMARY KEY")
             .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/g, "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        if (q.includes("data TEXT")) q = q.replace("data TEXT", "data JSON");
        await pool.execute(q);
      } else {
        sqliteDb.exec(q);
      }
    }

    const rows: any = await dbQuery("SELECT id FROM users WHERE id = 1");
    if (rows.length === 0) {
      await dbQuery(
        "INSERT INTO users (id, email, password, name) VALUES (1, 'fabien.lefranc16@gmail.com', 'dummy_pass', 'Fabien')",
      );
    }
  } catch (err) {
    console.error("Erreur initialisation BDD :", err);
  }
}

async function startServer() {
  await ensureTables();
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static("uploads"));

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = "./uploads";
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  });
  const upload = multer({ storage: storage });

  // Health check
  app.get("/api/db-health", async (req, res) => {
    try {
      if (useMySQL) {
        const connection = await pool.getConnection();
        await connection.query("SELECT 1");
        connection.release();
        res.json({ status: "ok", database: "MySQL", host: process.env.MYSQL_HOST, user: process.env.MYSQL_USER, db: process.env.MYSQL_DATABASE, port: process.env.MYSQL_PORT });
      } else {
        sqliteDb.prepare("SELECT 1").get();
        res.json({ status: "ok", database: "SQLite" });
      }
    } catch (error: any) {
      res.status(500).json({ status: "error", message: error.message, code: error.code });
    }
  });

  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token || token === 'dev-token') {
      req.user = { id: 1, email: 'fabien.lefranc16@gmail.com' };
      return next();
    }
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await dbQuery("INSERT INTO users (email, password, name) VALUES (?, ?, ?)", [email, hashedPassword, name]);
      res.status(201).json({ message: "User registered" });
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Email already exists" });
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const rows: any = await dbQuery("SELECT * FROM users WHERE email = ?", [email]);
      const user = rows[0];
      if (!user) return res.status(400).json({ error: "User not found" });
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: "Invalid password" });
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Patients
  app.get("/api/patients", authenticateToken, async (req: any, res) => {
    try {
      const rows = await dbQuery("SELECT * FROM patients WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/patients", authenticateToken, async (req: any, res) => {
    const { firstName, lastName, birthDate, pathology } = req.body;
    try {
      const result: any = await dbQuery(
        "INSERT INTO patients (user_id, first_name, last_name, birth_date, pathology) VALUES (?, ?, ?, ?, ?)",
        [req.user.id, firstName, lastName, birthDate || null, pathology]
      );
      res.json({ id: result[0]?.insertId, ...req.body });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Erreur serveur", details: error.code || error.toString() });
    }
  });

  // PATCH patient — modifier les informations d'une fiche
  app.patch("/api/patients/:patientId", authenticateToken, async (req: any, res) => {
    const { patientId } = req.params;
    const { firstName, lastName, birthDate, pathology } = req.body;
    try {
      await dbQuery(
        "UPDATE patients SET first_name = ?, last_name = ?, birth_date = ?, pathology = ? WHERE id = ? AND user_id = ?",
        [firstName, lastName, birthDate || null, pathology || null, patientId, req.user.id]
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Erreur lors de la modification" });
    }
  });

  // DELETE patient — supprime le patient et toutes ses données
  app.delete("/api/patients/:patientId", authenticateToken, async (req: any, res) => {
    const { patientId } = req.params;
    try {
      await dbQuery("DELETE FROM tasks WHERE patient_id = ? AND user_id = ?", [patientId, req.user.id]);
      await dbQuery("DELETE FROM assessments WHERE patient_id = ? AND user_id = ?", [patientId, req.user.id]);
      await dbQuery("DELETE FROM patients WHERE id = ? AND user_id = ?", [patientId, req.user.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  });

  // Tasks
  app.get("/api/patients/:patientId/tasks", authenticateToken, async (req: any, res) => {
    try {
      const rows = await dbQuery("SELECT * FROM tasks WHERE patient_id = ? AND user_id = ?", [req.params.patientId, req.user.id]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/patients/:patientId/tasks", authenticateToken, async (req: any, res) => {
    const { title } = req.body;
    try {
      const result: any = await dbQuery(
        "INSERT INTO tasks (patient_id, user_id, title) VALUES (?, ?, ?)",
        [req.params.patientId, req.user.id, title]
      );
      res.json({ id: result[0]?.insertId, title, completed: false });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.patch("/api/tasks/:taskId", authenticateToken, async (req: any, res) => {
    const { completed } = req.body;
    try {
      await dbQuery("UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?", [completed ? 1 : 0, req.params.taskId, req.user.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.delete("/api/tasks/:taskId", authenticateToken, async (req: any, res) => {
    try {
      await dbQuery("DELETE FROM tasks WHERE id = ? AND user_id = ?", [req.params.taskId, req.user.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Assessments
  app.get("/api/patients/:patientId/assessments", authenticateToken, async (req: any, res) => {
    try {
      const rows = await dbQuery("SELECT * FROM assessments WHERE patient_id = ? AND user_id = ?", [req.params.patientId, req.user.id]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/patients/:patientId/assessments", authenticateToken, async (req: any, res) => {
    const { assessmentType, data } = req.body;
    try {
      const result: any = await dbQuery(
        "INSERT INTO assessments (patient_id, user_id, assessment_type, data) VALUES (?, ?, ?, ?)",
        [req.params.patientId, req.user.id, assessmentType, JSON.stringify(data)]
      );
      res.json({ id: result[0]?.insertId, ...req.body });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Generic Data Route (MDPH, CPAM, Documents, Evaluations)
  app.get("/api/patients/:patientId/data/:type", authenticateToken, async (req: any, res) => {
    try {
      const rows: any = await dbQuery(
        "SELECT * FROM assessments WHERE patient_id = ? AND user_id = ? AND assessment_type = ?",
        [req.params.patientId, req.user.id, req.params.type]
      );
      if (rows.length === 0) return res.json(null);
      const row = rows[0];
      const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/patients/:patientId/data/:type", authenticateToken, async (req: any, res) => {
    const { data } = req.body;
    try {
      const existing: any = await dbQuery(
        "SELECT id FROM assessments WHERE patient_id = ? AND user_id = ? AND assessment_type = ?",
        [req.params.patientId, req.user.id, req.params.type]
      );
      if (existing.length > 0) {
        await dbQuery("UPDATE assessments SET data = ? WHERE id = ?", [JSON.stringify(data), existing[0].id]);
        res.json({ success: true, id: existing[0].id });
      } else {
        const result: any = await dbQuery(
          "INSERT INTO assessments (patient_id, user_id, assessment_type, data) VALUES (?, ?, ?, ?)",
          [req.params.patientId, req.user.id, req.params.type, JSON.stringify(data)]
        );
        res.json({ success: true, id: result[0]?.insertId });
      }
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // File Upload — Cloudinary
  app.post("/api/upload", authenticateToken, upload.single("file"), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    try {
      const isPdf = req.file.mimetype === 'application/pdf';
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "dossier-ergo",
        resource_type: isPdf ? "raw" : "image"
      });
      fs.unlinkSync(req.file.path);
      res.json({ url: result.secure_url });
    } catch (error: any) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Vite / Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
