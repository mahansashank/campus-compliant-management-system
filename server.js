require('dotenv').config();
const express = require('express');
const mysql   = require('mysql2');
const cors    = require('cors');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ── File upload config ───────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename:    (req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, Date.now() + '_' + safe);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg','image/png','image/gif','application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'];
        allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Unsupported file type'));
    }
});

app.use('/uploads', express.static(UPLOADS_DIR));

// ── DB Connection ────────────────────────────────────────────
const db = mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) { console.error('DB connection error:', err); return; }
    console.log('DB connected');
});

// ── Middleware ───────────────────────────────────────────────
const checkAdmin = (req, res, next) => {
    if (req.headers['x-role'] !== 'Admin')
        return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    next();
};

// ── GET /complaints ──────────────────────────────────────────
app.get('/complaints', (req, res) => {
    const sql = `
        SELECT c.complaint_id,
               s.name       AS student_name,
               d.dept_name,
               cat.category_name,
               c.description,
               c.priority,
               c.status,
               c.date_filed
        FROM   Complaints c
        JOIN   Students    s   ON c.student_id   = s.student_id
        JOIN   Departments d   ON c.dept_id       = d.dept_id
        LEFT JOIN Categories cat ON c.category_id = cat.category_id
        ORDER  BY c.complaint_id DESC
    `;
    db.query(sql, (err, rows) => {
        if (err) { console.error(err); return res.status(500).json({ error: 'Internal Server Error' }); }
        res.json(rows);
    });
});

// ── POST /complaints ─────────────────────────────────────────
app.post('/complaints', upload.single('attachment'), (req, res) => {
    const { student_id, dept_id, category_id, description, priority } = req.body;
    const validPriorities = ['Low', 'Medium', 'High'];

    if (!student_id || !dept_id || !description || description.trim() === '')
        return res.status(400).json({ error: 'All fields are required.' });

    const safePriority  = validPriorities.includes(priority) ? priority : 'Medium';
    const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = `
        INSERT INTO Complaints (student_id, dept_id, category_id, description, priority, status, date_filed, attachment_url)
        VALUES (?, ?, ?, ?, ?, 'Pending', CURDATE(), ?)
    `;
    db.query(sql, [student_id, dept_id, category_id || null, description, safePriority, attachmentUrl], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ error: 'Internal Server Error' }); }

        const logSql = `INSERT INTO AuditLog (complaint_id, action, performed_by, new_value) VALUES (?, 'Complaint Filed', ?, 'Pending')`;
        db.query(logSql, [result.insertId, req.headers['x-username'] || 'student']);

        res.json({ message: 'Complaint submitted successfully.' });
    });
});

// ── PUT /complaints/:id ──────────────────────────────────────
app.put('/complaints/:id', checkAdmin, (req, res) => {
    const { status, priority } = req.body;
    const validStatuses   = ['Pending', 'In Progress', 'Resolved'];
    const validPriorities = ['Low', 'Medium', 'High'];

    if (status   && !validStatuses.includes(status))
        return res.status(400).json({ error: 'Invalid status value.' });
    if (priority && !validPriorities.includes(priority))
        return res.status(400).json({ error: 'Invalid priority value.' });

    // Fetch old values for audit
    db.query('SELECT status, priority FROM Complaints WHERE complaint_id = ?', [req.params.id], (err, rows) => {
        if (err || rows.length === 0) return res.status(404).json({ error: 'Not found.' });
        const old = rows[0];

        const updates = [];
        const params  = [];
        if (status)   { updates.push('status = ?');   params.push(status); }
        if (priority) { updates.push('priority = ?'); params.push(priority); }
        if (!updates.length) return res.status(400).json({ error: 'Nothing to update.' });

        params.push(req.params.id);
        db.query(`UPDATE Complaints SET ${updates.join(', ')} WHERE complaint_id = ?`, params, err2 => {
            if (err2) { console.error(err2); return res.status(500).json({ error: 'Internal Server Error' }); }

            const performer = req.headers['x-username'] || 'admin';
            if (status && status !== old.status) {
                db.query(
                    `INSERT INTO AuditLog (complaint_id, action, performed_by, old_value, new_value) VALUES (?, 'Status Changed', ?, ?, ?)`,
                    [req.params.id, performer, old.status, status]
                );
            }
            if (priority && priority !== old.priority) {
                db.query(
                    `INSERT INTO AuditLog (complaint_id, action, performed_by, old_value, new_value) VALUES (?, 'Priority Changed', ?, ?, ?)`,
                    [req.params.id, performer, old.priority, priority]
                );
            }

            res.json({ message: 'Updated successfully.' });
        });
    });
});

// ── DELETE /complaints/:id ───────────────────────────────────
app.delete('/complaints/:id', checkAdmin, (req, res) => {
    db.query('SELECT complaint_id FROM Complaints WHERE complaint_id = ?', [req.params.id], (err, rows) => {
        if (err || rows.length === 0) return res.status(404).json({ error: 'Not found.' });

        db.query('DELETE FROM Complaints WHERE complaint_id = ?', [req.params.id], err2 => {
            if (err2) { console.error(err2); return res.status(500).json({ error: 'Internal Server Error' }); }

            db.query(
                `INSERT INTO AuditLog (complaint_id, action, performed_by) VALUES (?, 'Complaint Deleted', ?)`,
                [req.params.id, req.headers['x-username'] || 'admin']
            );
            res.json({ message: 'Complaint deleted.' });
        });
    });
});

// ── GET /students ────────────────────────────────────────────
app.get('/students', (req, res) => {
    const sql = `
        SELECT s.student_id, s.name, s.email,
               COUNT(c.complaint_id)                              AS total_complaints,
               COALESCE(SUM(c.status = 'Resolved'), 0)           AS resolved,
               COALESCE(SUM(c.status = 'Pending'), 0)            AS pending,
               COALESCE(SUM(c.status = 'In Progress'), 0)        AS in_progress
        FROM   Students s
        LEFT JOIN Complaints c ON s.student_id = c.student_id
        GROUP BY s.student_id
        ORDER BY total_complaints DESC
    `;
    db.query(sql, (err, rows) => {
        if (err) { console.error(err); return res.status(500).json({ error: 'Internal Server Error' }); }
        res.json(rows);
    });
});

// ── GET /departments ─────────────────────────────────────────
app.get('/departments', (req, res) => {
    db.query('SELECT * FROM Departments ORDER BY dept_name', (err, rows) => {
        if (err) { console.error(err); return res.status(500).json({ error: 'Internal Server Error' }); }
        res.json(rows);
    });
});

// ── GET /categories ──────────────────────────────────────────
app.get('/categories', (req, res) => {
    db.query('SELECT * FROM Categories ORDER BY category_name', (err, rows) => {
        if (err) { console.error(err); return res.status(500).json({ error: 'Internal Server Error' }); }
        res.json(rows);
    });
});

// ── GET /stats ───────────────────────────────────────────────
app.get('/stats', (req, res) => {
    const sql = `
        SELECT COUNT(*)                                  AS total,
               COALESCE(SUM(status='Pending'), 0)       AS pending,
               COALESCE(SUM(status='In Progress'), 0)   AS in_progress,
               COALESCE(SUM(status='Resolved'), 0)      AS resolved,
               COALESCE(SUM(priority='High'), 0)        AS high_priority,
               COALESCE(SUM(priority='Medium'), 0)      AS medium_priority,
               COALESCE(SUM(priority='Low'), 0)         AS low_priority
        FROM Complaints
    `;
    db.query(sql, (err, rows) => {
        if (err) { console.error(err); return res.status(500).json({ error: 'Internal Server Error' }); }
        res.json(rows[0]);
    });
});

// ── GET /analytics ───────────────────────────────────────────
app.get('/analytics', (req, res) => {
    const queries = {
        byDept: `
            SELECT d.dept_name,
                   COUNT(c.complaint_id)                    AS total,
                   COALESCE(SUM(c.status='Resolved'), 0)   AS resolved,
                   COALESCE(SUM(c.status='Pending'), 0)    AS pending,
                   COALESCE(SUM(c.status='In Progress'), 0) AS in_progress
            FROM   Departments d
            LEFT JOIN Complaints c ON d.dept_id = c.dept_id
            GROUP BY d.dept_id
            ORDER BY total DESC
        `,
        byCategory: `
            SELECT COALESCE(cat.category_name, 'Uncategorised') AS category_name,
                   COUNT(c.complaint_id) AS total
            FROM   Complaints c
            LEFT JOIN Categories cat ON c.category_id = cat.category_id
            GROUP BY cat.category_id
            ORDER BY total DESC
        `,
        byPriority: `
            SELECT priority, COUNT(*) AS total
            FROM   Complaints
            GROUP BY priority
        `,
        trend: `
            SELECT DATE_FORMAT(date_filed, '%Y-%m-%d') AS day,
                   COUNT(*) AS total
            FROM   Complaints
            WHERE  date_filed >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
            GROUP BY day
            ORDER BY day ASC
        `,
        resolutionRate: `
            SELECT ROUND(
                100.0 * SUM(status = 'Resolved') / NULLIF(COUNT(*), 0)
            , 1) AS rate FROM Complaints
        `
    };

    const results = {};
    const keys    = Object.keys(queries);
    let   done    = 0;

    keys.forEach(key => {
        db.query(queries[key], (err, rows) => {
            if (err) { console.error(err); results[key] = []; }
            else results[key] = rows;
            if (++done === keys.length) res.json(results);
        });
    });
});

// ── GET /audit-log ───────────────────────────────────────────
app.get('/audit-log', checkAdmin, (req, res) => {
    const sql = `
        SELECT a.log_id, a.complaint_id, a.action,
               a.performed_by, a.old_value, a.new_value,
               a.timestamp
        FROM   AuditLog a
        ORDER  BY a.timestamp DESC
        LIMIT  100
    `;
    db.query(sql, (err, rows) => {
        if (err) { console.error(err); return res.status(500).json({ error: 'Internal Server Error' }); }
        res.json(rows);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));