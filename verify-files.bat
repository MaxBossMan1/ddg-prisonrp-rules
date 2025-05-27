@echo off
echo ==========================================
echo VERIFYING PROJECT FILES FOR GITHUB
echo ==========================================
echo.

echo 📁 ROOT DIRECTORY:
dir /b | findstr /v node_modules

echo.
echo 📁 BACKEND DIRECTORY:
dir backend /b | findstr /v node_modules

echo.
echo 📁 FRONTEND DIRECTORY:
dir frontend /b | findstr /v node_modules

echo.
echo 📁 FRONTEND/SRC DIRECTORY (React Components):
dir frontend\src /b

echo.
echo 📁 FRONTEND/SRC/COMPONENTS:
if exist frontend\src\components dir frontend\src\components /b

echo.
echo 📁 FRONTEND/SRC/PAGES:
if exist frontend\src\pages dir frontend\src\pages /b

echo.
echo 📁 BACKEND/ROUTES (API Endpoints):
if exist backend\routes dir backend\routes /b

echo.
echo 📁 BACKEND/DATABASE:
if exist backend\database dir backend\database /b

echo.
echo ==========================================
echo WHAT SHOULD BE ON GITHUB:
echo.
echo ✅ Root files: README.md, .gitignore, plan.txt, PROJECT_CHECKLIST.md
echo ✅ Backend: Complete Node.js API with all routes
echo ✅ Frontend: Complete React app with all components
echo ✅ Database: Schema and initialization scripts
echo ✅ Documentation: Setup guides and project info
echo.
echo ❌ Should NOT be on GitHub:
echo ❌ node_modules folders (dependencies)
echo ❌ .env files (secrets)
echo ❌ .db files (database data)
echo ❌ .git folders inside subdirectories
echo ==========================================

pause 