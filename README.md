# 💊 MediTrack - Medicine Inventory Management System

A modern, responsive web application for managing medicine inventory with expiry tracking and user authentication.

## 🚀 Features

- **User Authentication** - Secure login/registration system
- **Medicine Management** - Add, view, and manage medicine inventory
- **Expiry Tracking** - Monitor medicine expiration dates with alerts
- **Modern UI** - Beautiful, responsive design with animations
- **Dashboard** - Comprehensive overview with statistics and charts

## 📁 Project Structure

```
Project1/
├── backend/                 # Node.js Backend
│   ├── middleware/         
│   │   └── auth.js         # Authentication middleware
│   ├── models/             
│   │   ├── Medicine.js     # Medicine data model
│   │   └── User.js         # User data model
│   ├── routes/             
│   │   ├── medicineRoutes.js # Medicine API routes
│   │   └── userRoutes.js   # User API routes
│   ├── package.json        # Backend dependencies
│   ├── package-lock.json   # Dependency lock file
│   └── server.js           # Main server file
│
└── frontend/               # Frontend Files
    ├── css/
    │   └── style.css       # Main stylesheet
    ├── html/
    │   ├── index.html      # Login page
    │   ├── dashboard.html  # Main dashboard
    │   ├── add-medicine.html # Add medicine form
    │   ├── inventory.html  # Inventory management
    │   └── expiry.html     # Expiry tracker
    └── js/
        ├── login.js        # Login functionality
        ├── dashboard.js    # Dashboard logic
        ├── add-medicine.js # Add medicine logic
        ├── inventory.js    # Inventory management
        └── expiry.js       # Expiry tracking
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Modern web browser

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with:
   ```
   MONGODB_URI=mongodb://localhost:27017/meditrack
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Install http-server globally:
   ```bash
   npm install -g http-server
   ```

2. Start frontend server:
   ```bash
   npx http-server frontend -p 3000 --cors
   ```

## 🌐 Access the Application

- **Frontend**: http://127.0.0.1:3000/html/index.html
- **Backend API**: http://localhost:5000/api

## 👤 Default Login Credentials

- **Username**: Shagun
- **Password**: Shagun123

## 🎨 Key Features

### Modern Dashboard
- Real-time statistics cards
- Interactive charts
- Quick action buttons
- Responsive design

### Expiry Tracker
- Tab-based navigation
- Color-coded status indicators
- Detailed medicine cards
- Smart filtering

### Inventory Management
- Comprehensive medicine listing
- Search and filter functionality
- Detailed medicine information
- Easy management interface

## 🔧 Technologies Used

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Authentication**: JWT (JSON Web Tokens)
- **UI**: Font Awesome icons, Custom CSS animations
- **Database**: MongoDB with Mongoose ODM

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile devices

---

**Developed with ❤️ for efficient medicine inventory management**
