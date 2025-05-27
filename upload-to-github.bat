@echo off
echo ==========================================
echo DigitalDeltaGaming PrisonRP - GitHub Upload
echo ==========================================
echo.

echo Step 1: Initializing Git repository...
git init

echo.
echo Step 2: Adding all files to Git...
git add .

echo.
echo Step 3: Creating initial commit...
git commit -m "Initial commit: DigitalDeltaGaming PrisonRP Rules System

- Complete backend API with Node.js/Express
- React frontend with dark industrial theme  
- SQLite database with hierarchical rule system
- Real-time search with autocomplete
- Automatic rule numbering (A.1, A.1.1, A.1.1a)
- Copy-to-clipboard functionality
- Professional 404 error handling
- Responsive design for mobile/desktop
- Sample rules and categories populated"

echo.
echo Step 4: Setting up main branch...
git branch -M main

echo.
echo ==========================================
echo MANUAL STEP REQUIRED:
echo.
echo 1. Create a new repository on GitHub:
echo    - Go to https://github.com
echo    - Click '+' then 'New repository'
echo    - Name: ddg-prisonrp-rules
echo    - Make it PRIVATE
echo    - DON'T add README (we have one)
echo.
echo 2. Copy the repository URL (it will look like):
echo    https://github.com/yourusername/ddg-prisonrp-rules.git
echo.
echo 3. Run this command with YOUR repository URL:
echo    git remote add origin https://github.com/yourusername/ddg-prisonrp-rules.git
echo.
echo 4. Then run:
echo    git push -u origin main
echo.
echo ==========================================

pause 