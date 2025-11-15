# 🛒 E-Commerce Web Application  
A full-stack e-commerce platform built using **React (Vite) + Node.js + Express + PostgreSQL + Redis + JWT Authentication**.  
This project includes user authentication, product browsing, cart system, orders, search with caching, and Google OAuth.

---

## 🚀 Live Demo
**Frontend:** https://e-commerce-chi-three-69.vercel.app  
**API Server:** this is a private url and can be accessed in the code itself  
**Gateway Server:** https://e-commerce-server-xezh.onrender.com

---

## 🔑 Demo Login (For Recruiters Only)

Use the following demo credentials to access the application:

Email: saicharan.demo@gmail.com
Password: demo@1234


> ⚠️ **Note:** Google OAuth is enabled only for testing.  
Please use the above demo credentials to log in.

---

## 🧠 Overview  
This project demonstrates:

- Full-stack development using modern technologies  
- Clean API architecture (Frontend → Gateway → API Server → DB → Redis caching)  
- JWT authentication  
- Google OAuth  
- Real-time product search with Redis caching  
- Fully responsive UI  
- Production deployments on Vercel + Render  
- Error handling, caching strategy, environment variables  

---

## 🛠️ Tech Stack

### **Frontend**
- React (Vite)
- Material UI
- Axios
- React Router
- Context API

### **Backend (Gateway Server)**
- Node.js + Express
- Axios (proxy routing)
- Redis (Upstash)
- JWT Middleware

### **Backend (API Server)**
- Node.js + Express
- PostgreSQL (Supabase/Render)
- JWT Auth
- CORS
- Google OAuth

### **Database**
- PostgreSQL

### **Cache Layer**
- Upstash Redis (Global)

---

## ✨ Features

### 🔐 Authentication
- Email/Password login  
- JWT-based auth  
- Google OAuth login  
- Protected routes  
- Demo recruiter account  

### 🛒 E-Commerce Features
- Product listing  
- Product details page  
- Add to Cart  
- Remove from Cart  
- Order page  
- Responsive UI  

### 🔍 Search with Caching
- Live product search  
- Debounce (500ms)
- Redis caching for fast repeat searches  
- Automatic cache clearing for invalid data  

### 👤 User Features
- Profile page  
- Profile editing  
- View orders  
- Logout session  

---

## 🏛️ Architecture Diagram

Frontend (Vercel)
↓
Gateway Server (Render)
↓
API Server (Render)
↓
PostgreSQL (DB)
↓
Redis Cache (Upstash)


The gateway handles:

- Authorization header forwarding  
- Redis caching  
- Error handling  
- API rate control  

---

## 📂 Folder Structure

E_Commerce/
│
├── my-app/ # Frontend (React)
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── styles/
│ │ └── App.jsx
│ ├── package.json
│ └── vite.config.js
│
├── server/ # Gateway Server
│ ├── server.js
│ ├── package.json
│ ├── .env
│ └── utils/
│
├── Api/ # API Server
│ ├── server.js
│ ├── database/
│ ├── .env
│ └── routes/
│
└── README.md


---

## ⚙️ Environment Variables

### **Frontend (.env)**
VITE_API_URL_3000=https://e-commerce-server-xezh.onrender.com

### **Gateway Server (.env)**
API_URL=your-api-url
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-secret-token
JWT_SECRET=your-jwt-secret


### **API Server (.env)**
DATABASE_URL=postgres-url
JWT_SECRET=jwt-secret
GOOGLE_CLIENT_ID=client-id
GOOGLE_CLIENT_SECRET=client-secret

---

## 📥 Installation & Setup

### 1. Clone the repository

###bash
git clone https://github.com/saicharan4316/E_Commerce.git
cd E_Commerce
cd my-app
npm install
npm run dev
#gateway server:
cd server
npm install
node server.js
#api server:
cd Api
npm install
node server.js

## 📸 Screenshots

### 🏠 Home Page  
![Home Page](https://github.com/user-attachments/assets/daab73e7-46d6-4be9-862e-b2a103390246)

### 🔍 Search Page  
![Search Page](https://github.com/user-attachments/assets/c90c0aff-fa70-4e3b-9fab-77a8f97ddaa1)

### 🛒 Cart Page  
![Cart Page](https://github.com/user-attachments/assets/cdb6f74b-d3f4-4f4c-a873-97d99cfa770e)

### 🔐 Login Page  
![Login Page](https://github.com/user-attachments/assets/3aa612de-abcb-49c3-a8cb-f3c6090f792e)
## 👨‍💻 Author

**Sai Charan**  
Full-Stack PERN Developer  

📧 Email: utukurisaicharan123@gmail.com  
🐙 GitHub: https://github.com/saicharan4316  
💼 LinkedIn: http://www.linkedin.com/in/sai-charan-206124303



