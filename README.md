# 🚀 Campus Complaint Management System (CMS)

A **full-stack web application** designed to streamline complaint handling in a university environment.
It enables students to report issues efficiently while providing administrators with powerful tools to track, manage, and resolve them.

---

## 🌟 Key Highlights

* 🔐 Role-based access (Admin & Student)
* 📊 Real-time dashboard with analytics (Chart.js)
* 📂 File upload support (images, PDFs, documents)
* 🧾 Audit logging for transparency
* 🎯 Clean and modern UI (Dark Theme)
* ⚡ Full-stack architecture (Frontend + Backend + Database)

---

## 🏗️ System Architecture

```
Frontend (HTML, CSS, JS)
        ↓
REST API (Node.js + Express)
        ↓
Database (MySQL)
```

* Frontend communicates with backend via REST APIs
* Backend handles business logic, validation, and security
* MySQL stores complaints, users, and audit logs

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript
* Chart.js

### Backend

* Node.js
* Express.js

### Database

* MySQL

### Additional Libraries

* Multer (file uploads)
* dotenv (environment variables)
* cors

---

## 🔐 Authentication & Authorization

* Role-based system:

  * 👨‍🎓 Student
  * 👨‍💼 Admin
* Role validation using request headers (`x-role`)
* Session handled using `sessionStorage` (Frontend)

> ⚠️ Note: Authentication is implemented for demonstration purposes.
> In production, use **JWT + bcrypt hashing + secure sessions**

---

## 👨‍🎓 Student Features

* Submit complaints with priority and category
* Upload attachments (optional)
* View only their complaints
* Track complaint status
* Filter and search complaints

---

## 👨‍💼 Admin Features

* View all complaints
* Update complaint status:

  * Pending
  * In Progress
  * Resolved
* Modify priority
* Delete complaints
* Access audit logs

---

## 📊 Dashboard & Analytics

* Total complaints
* Status-wise distribution
* Priority-based insights
* Department/category analytics
* Trend visualization (Chart.js)

---

## 🛡️ Security Features

* Input validation on backend
* File type and size restriction (Multer)
* Role-based route protection
* Audit logging for all critical actions
* Environment variables for sensitive data

---

## 🔌 API Endpoints

### Complaints

* `GET /complaints`
  → Fetch all complaints

* `POST /complaints`
  → Submit a new complaint

* `PUT /complaints/:id`
  → Update complaint status/priority (Admin only)

---

## 📂 Project Structure

```
├── public/
│   ├── index.html
│   ├── login.html
│   ├── style.css
│   ├── script.js
├── uploads/
├── server.js
├── schema.sql
├── .env
├── package.json
└── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone <your-repo-url>
cd <project-folder>
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Setup Database

* Start MySQL server
* Run `schema.sql` to create tables

### 4️⃣ Configure Environment Variables

Create a `.env` file:

```
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=college_complaints
PORT=3000
```

### 5️⃣ Run the Server

```bash
npm start
```

### 6️⃣ Open in Browser

```
http://localhost:3000
```

---

## 📸 Screenshots

> Add screenshots here (Dashboard, Login, Complaint Page)

Example:

```
/screenshots/dashboard.png
/screenshots/login.png
```

---

## 🚧 Future Improvements

* 🔑 JWT-based authentication
* 🔒 Password hashing using bcrypt
* 🛡️ Rate limiting & security headers (Helmet.js)
* 📧 Email notifications
* 📱 Mobile responsiveness enhancements

---

## 🎯 Project Objective

To build a **secure, scalable, and user-friendly complaint management system** that demonstrates:

* Full-stack development skills
* Role-based access control
* Backend security practices
* Data visualization techniques

---

## 👤 Author

**Mahan Sashank Yadav**
🎓 Cybersecurity Student
🏫 Chandigarh University

---

## ⭐ Support

If you found this project useful:

* ⭐ Star the repository
* 🍴 Fork it
* 🤝 Contribute improvements

---
