# 🚀 GitHub Setup Guide

## Quick Upload Method

**Run the batch script:**
```bash
upload-to-github.bat
```

This will automatically prepare your repository for upload.

## Manual Method

If you prefer to do it manually, here are the exact steps:

### 1. Create GitHub Repository
1. Go to https://github.com
2. Click **"+"** → **"New repository"**
3. Settings:
   - **Name**: `ddg-prisonrp-rules`
   - **Description**: `DigitalDeltaGaming PrisonRP Rules & MOTD System`
   - **Private** repository ✅
   - **DON'T** add README (we have one)
4. Click **"Create repository"**

### 2. Upload Your Code

**In PowerShell (in D:\DDGMOTD directory):**

```bash
# Initialize Git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: DigitalDeltaGaming PrisonRP Rules System"

# Set main branch
git branch -M main

# Add your GitHub repository (replace with YOUR URL)
git remote add origin https://github.com/yourusername/ddg-prisonrp-rules.git

# Push to GitHub
git push -u origin main
```

## 📁 What Gets Uploaded

### ✅ **Included Files:**
- All source code (frontend + backend)
- Documentation (README, checklist, plan)
- Configuration files
- Database schema (but NOT the actual .db file)

### ❌ **Excluded Files (via .gitignore):**
- `node_modules/` directories
- `.env` files (secrets)
- Database files (`*.db`)
- Log files
- Build artifacts

## 🔒 Security Notes

- The `.env` files are **NOT uploaded** (they contain secrets)
- Database files are **NOT uploaded** (they contain user data)
- Only source code and documentation are shared

## 🎯 After Upload

Once uploaded, others can clone and run your project with:

```bash
git clone https://github.com/yourusername/ddg-prisonrp-rules.git
cd ddg-prisonrp-rules
cd backend && npm install
cd ../frontend && npm install
cd ../backend && npm start
# In another terminal:
cd frontend && npm start
```

## 🔧 Future Updates

To update your GitHub repository after making changes:

```bash
git add .
git commit -m "Description of your changes"
git push
```

---

**Your professional rules system is ready for GitHub! 🎮** 