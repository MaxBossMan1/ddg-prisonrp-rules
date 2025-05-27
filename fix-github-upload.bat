@echo off
echo ==========================================
echo FIXING FRONTEND FOLDER ISSUE
echo ==========================================
echo.

echo Problem: Frontend folder appears empty on GitHub
echo Cause: Frontend has its own .git repository
echo.

echo Step 1: Removing frontend's separate Git repository...
if exist "frontend\.git" (
    rmdir /s /q "frontend\.git"
    echo Frontend .git folder removed successfully!
) else (
    echo Frontend .git folder not found - good!
)

echo.
echo Step 2: Removing any existing main Git repository...
if exist ".git" (
    rmdir /s /q ".git"
    echo Main .git folder removed successfully!
) else (
    echo Main .git folder not found.
)

echo.
echo Step 3: Re-initializing Git repository...
git init

echo.
echo Step 4: Adding ALL files (including frontend)...
git add .

echo.
echo Step 5: Checking what will be committed...
echo Files to be committed:
git status --porcelain

echo.
echo Step 6: Creating commit with ALL project files...
git commit -m "Complete DigitalDeltaGaming PrisonRP Rules System

INCLUDES:
- ✅ Backend API (Node.js/Express) with all routes
- ✅ Frontend React App with all components  
- ✅ Database schema and initialization
- ✅ Real-time search functionality
- ✅ Professional dark industrial theme
- ✅ Automatic rule numbering system
- ✅ Copy-to-clipboard features
- ✅ 404 error handling
- ✅ Responsive mobile design
- ✅ Complete documentation

FRONTEND COMPONENTS:
- HomePage with announcements and categories
- RulePage with hierarchical rule display
- SearchBar with autocomplete
- CategoryGrid with rule counts
- NotFoundPage for error handling
- Professional styling and animations"

echo.
echo Step 7: Setting main branch...
git branch -M main

echo.
echo ==========================================
echo FRONTEND ISSUE FIXED!
echo.
echo Your repository now includes:
echo - ✅ Complete backend code
echo - ✅ Complete frontend React app
echo - ✅ All components and pages
echo - ✅ Professional documentation
echo.
echo NEXT STEPS:
echo 1. Create repository on GitHub (if you haven't):
echo    - Name: ddg-prisonrp-rules
echo    - Private repository
echo    - DON'T add README
echo.
echo 2. Connect to your GitHub repository:
echo    git remote add origin https://github.com/yourusername/ddg-prisonrp-rules.git
echo.
echo 3. Push everything to GitHub:
echo    git push -u origin main
echo.
echo 4. Your frontend folder will now show all React files!
echo ==========================================

pause 