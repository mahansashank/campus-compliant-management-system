-- ============================================================
--  Campus Complaint Management System — Upgraded Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS college_complaints;
USE college_complaints;

-- Drop in safe order (children before parents)
DROP TABLE IF EXISTS AuditLog;
DROP TABLE IF EXISTS Complaints;
DROP TABLE IF EXISTS Students;
DROP TABLE IF EXISTS Departments;
DROP TABLE IF EXISTS Categories;

-- ── Departments ──────────────────────────────────────────────
CREATE TABLE Departments (
    dept_id   INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL
);

-- ── Categories ───────────────────────────────────────────────
CREATE TABLE Categories (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL
);

-- ── Students ─────────────────────────────────────────────────
CREATE TABLE Students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(100) UNIQUE NOT NULL
);

-- ── Complaints ───────────────────────────────────────────────
CREATE TABLE Complaints (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id   INT,
    dept_id      INT,
    category_id  INT,
    description  TEXT,
    priority     ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    status       ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending',
    date_filed   DATE,
    FOREIGN KEY (student_id)  REFERENCES Students(student_id)   ON DELETE CASCADE,
    FOREIGN KEY (dept_id)     REFERENCES Departments(dept_id)   ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
);

-- ── Audit Log ────────────────────────────────────────────────
CREATE TABLE AuditLog (
    log_id       INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT,
    action       VARCHAR(100) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    old_value    VARCHAR(100),
    new_value    VARCHAR(100),
    timestamp    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES Complaints(complaint_id) ON DELETE CASCADE
);

-- ── Seed Data ────────────────────────────────────────────────
INSERT INTO Departments (dept_name) VALUES
('Computer Science'),
('Electrical Engineering'),
('Mechanical Engineering'),
('Civil Engineering');

INSERT INTO Categories (category_name) VALUES
('Infrastructure'),
('Academic'),
('IT / Network'),
('Equipment'),
('Safety'),
('Other');

INSERT INTO Students (name, email) VALUES
('Ravi Kumar',      'ravi@example.com'),
('Ananya Iyer',     'ananya@example.com'),
('Suresh Reddy',    'suresh@example.com'),
('Rahul Sharma',    'rahul@example.com'),
('Priya Verma',     'priya@example.com'),
('Aman Gupta',      'aman@example.com'),
('Lakshmi Nair',    'lakshmi@example.com'),
('Arjun Patel',     'arjun@example.com'),
('Neha Singh',      'neha@example.com');

INSERT INTO Complaints
    (student_id, dept_id, category_id, description, priority, status, date_filed)
VALUES
(1, 1, 3, 'Lab PC not working.',               'High',   'Pending',     DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
(2, 2, 1, 'Projector issue in classroom.',      'Medium', 'In Progress', DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
(3, 1, 3, 'Internet connectivity problem.',     'High',   'Resolved',    DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
(4, 1, 3, 'WiFi not working in hostel.',        'Medium', 'Pending',     DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
(5, 2, 4, 'Electrical lab equipment damaged.',  'High',   'In Progress', DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
(6, 3, 4, 'Workshop machines need maintenance.','Low',    'Resolved',    DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(7, 4, 5, 'Water leakage in civil block.',      'High',   'Pending',     DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(8, 1, 1, 'Classroom AC not functioning.',      'Medium', 'In Progress', DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(9, 2, 4, 'Power outage during lectures.',      'High',   'Resolved',    DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(4, 2, 4, 'Broken switchboard in lab.',         'Medium', 'Resolved',    DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(5, 1, 2, 'System software outdated.',          'Low',    'In Progress', DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(6, 3, 5, 'Noise disturbance near workshop.',   'Low',    'Pending',     CURDATE());

INSERT INTO AuditLog (complaint_id, action, performed_by, old_value, new_value)
VALUES
(2,  'Status Changed', 'mahan', 'Pending',     'In Progress'),
(3,  'Status Changed', 'mahan', 'In Progress', 'Resolved'),
(5,  'Status Changed', 'mahan', 'Pending',     'In Progress'),
(9,  'Status Changed', 'mahan', 'Pending',     'Resolved'),
(10, 'Status Changed', 'mahan', 'Pending',     'Resolved');