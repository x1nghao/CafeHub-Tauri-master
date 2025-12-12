# CafeHub - Self-Service Cafe Management System

[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-blue)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/language-Rust-orange)](https://www.rust-lang.org/)
[![Tauri](https://img.shields.io/badge/framework-Tauri-green)](https://tauri.app/)
[![React](https://img.shields.io/badge/library-React-blue)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL%20%7C%20OpenGauss-blue)](https://www.postgresql.org/)

English | [简体中文](README.zh-CN.md)

This is a comprehensive desktop application for managing a self-service cafe, built with modern web technologies and a high-performance Rust backend.

## Project Overview

CafeHub utilizes Tauri to deliver a lightweight, secure, and performant desktop experience. The frontend is built with React and Ant Design, ensuring a modern and responsive user interface. The backend leverages Rust for robust business logic and secure database interactions.

## Features

### 👤 Customer Features
- **Account Management**: View and edit personal profile, change password securely.
- **Product Browsing & Purchasing**: Interactive product catalog with a shopping cart system.
- **Wallet System**: Check balance and recharge account.
- **Lost & Found**: Report lost items and claim found items with status tracking.
- **Messaging**: Direct communication channel with administrators.
- **Consumption History**: Visual charts of monthly spending habits.

### 🛡️ Administrator Features
- **Dashboard**: Overview of total users, new registrations, and sales statistics.
- **Product Management**: Add, edit, and update stock for cafe products.
- **Lost & Found Management**: Oversee all reported items and claim statuses.
- **Message Center**: Receive and reply to customer inquiries.
- **Data Visualization**: Charts for product sales distribution and monthly revenue.

### ⚙️ System Features
- **Dynamic Database Configuration**: Configure PostgreSQL/OpenGauss connection directly from the login screen.
- **Secure Authentication**: Password hashing (bcrypt) and secure session management.
- **Cross-Platform**: Optimized for macOS and Windows.

## Technology Stack

- **Frontend**: 
  - React 18
  - TypeScript
  - Vite
  - Ant Design (UI Component Library)
  - Recharts / Ant Design Charts
- **Backend**: 
  - Rust
  - Tauri 2.0
  - Postgres crate (for PostgreSQL/OpenGauss)
- **Database**: 
  - PostgreSQL / OpenGauss

## Getting Started

### Prerequisites

- **Node.js**: v16 or higher
- **Rust**: Latest stable version
- **Database**: PostgreSQL or OpenGauss server running

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RainAllln/CafeHub-Tauri.git
   cd CafeHub-Tauri
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Install Rust dependencies:**
   The build process will automatically handle this, but you can manually verify:
   ```bash
   cd src-tauri
   cargo check
   ```

### Running Development Server

Start the application in development mode with hot-reloading:
```bash
npm run dev
# or
npx tauri dev
```

### Building for Production

Create an optimized release build for your operating system:
```bash
npm run build
# or
npx tauri build
```
The output installer/executable will be located in `src-tauri/target/release/bundle/`.

### Database Configuration

1. **Initial Setup**: Ensure your PostgreSQL/OpenGauss database is running.
2. **Schema**: Execute the SQL scripts in `database/` (if provided) to create necessary tables (`account`, `goods`, `consumption`, `lost_items`, `message`).
3. **Connection**: 
   - Launch the app.
   - Click the **Gear Icon (⚙️)** on the login screen.
   - Enter your connection string (e.g., `postgresql://user:pass@localhost:5432/cafehub`).
   - Test and Save.

## CI/CD with GitHub Actions

This repository includes a GitHub Actions workflow (`.github/workflows/release.yml`) that automatically builds and releases the application for macOS and Windows.

**How to trigger a release:**
1. Commit your changes.
2. Tag your commit with a version number starting with `v` (e.g., `v1.0.0`).
3. Push the tag to GitHub:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. GitHub Actions will automatically start building the application for both macOS and Windows.
5. Once finished, the executables (installer, dmg, etc.) will be available in the "Releases" section of your GitHub repository.

## Project Structure

```
CafeHub-Tauri/
├── .github/                # GitHub Actions workflows
├── src/                    # React Frontend Source
│   ├── api/                # API connectors calling Tauri commands
│   ├── assets/             # Static assets (images, styles)
│   ├── components/         # Reusable UI components
│   ├── directory/          # Page components (Views)
│   ├── router/             # React Router configuration
│   └── App.tsx             # Main App component
├── src-tauri/              # Rust Backend Source
│   ├── src/
│   │   ├── commands.rs     # Tauri commands (API endpoints)
│   │   ├── db_config.rs    # Database configuration logic
│   │   ├── lib.rs          # Application entry point & setup
│   │   ├── main.rs         # Binary entry point
│   │   └── models.rs       # Rust structs matching DB tables
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
└── package.json            # Node dependencies
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Acknowledgements

- [Tauri](https://tauri.app/)
- [Ant Design](https://ant.design/)
- [Rust](https://www.rust-lang.org/)
