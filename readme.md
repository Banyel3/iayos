# 🚀 Project Setup Guide

Follow these steps to get the project running on your local machine.

---

## Prerequisites

Before you begin, make sure you have the following installed:

### Install Node.js

**Windows:**
1. Download the installer from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the setup wizard
3. Verify installation by opening Command Prompt and running:
```bash
node --version
npm --version
```

**Mac:**
Using Homebrew (recommended):
```bash
brew install node
```

Or download the installer from [nodejs.org](https://nodejs.org/)

### Install Python

**Windows:**
1. Download Python 3.8+ from [python.org](https://www.python.org/downloads/)
2. **Important:** Check "Add Python to PATH" during installation
3. Verify installation:
```bash
python --version
```

**Mac:**
Using Homebrew (recommended):
```bash
brew install python@3
```

> **Required versions:** Node.js 16+ and Python 3.8+

---

## 1. Install Dependencies

At the project root, run:

```bash
npm install
```

---

## 2. Setup Backend

Navigate into the backend folder:

```bash
cd apps/backend
```

### Create and Activate Virtual Environment

```bash
python -m venv venv
./venv/Scripts/activate
```

> **Note for Mac/Linux users:** Use `source venv/bin/activate` instead

### Add Environment Variables

Get the `.env` file from our group chat and place it inside `apps/backend/`.

### Run the Backend

```bash
cd src
python manage.py runserver
```

---

## 3. Setup Frontend (Web)

Go back to `apps`:

```bash
cd ../..
cd apps/frontend_web
```

Install frontend dependencies:

```bash
npm install
```

---

## 4. Run the Whole Project

Navigate back to the root folder:

```bash
cd ../..
```

Run everything with Turbo:

```bash
npx turbo run dev
```

---

## ✅ You're Ready!

Your development environment is now set up and running.

---

## 🛠️ Troubleshooting

### Virtual Environment Activation Issues

**Windows (PowerShell):**
If you get an execution policy error, run:
```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Mac/Linux:**
Use `source` instead of `./`:
```bash
source venv/bin/activate
```

### Missing `.env` File

Make sure you've placed the `.env` file in `apps/backend/` directory. Without it, the backend won't have the necessary configuration.

### Port Already in Use

If port 8000 (Django) or 3000 (frontend) is already in use, you can:
- Stop the process using that port
- Or specify a different port when running the servers

### Module Not Found Errors

Make sure you've:
- Activated the virtual environment before running the backend
- Run `npm install` in both root and `apps/frontend_web`
- Installed Python dependencies if there's a `requirements.txt` in the backend folder

### Turbo Command Not Found

If `npx turbo run dev` fails, try:
```bash
npm install turbo --global
```

Or use:
```bash
npm run dev
```

---

## 📝 Additional Notes

- Make sure you have **Python 3.8+** and **Node.js 16+** installed
- Keep your virtual environment activated when working with the backend
- If you encounter any other issues, reach out in the group chat
