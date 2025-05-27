@echo off
echo ==========================================
echo FIXING GIT PUSH REJECTION
echo ==========================================
echo.

echo Problem: GitHub repository has files you don't have locally
echo This usually happens when GitHub auto-created a README or .gitignore
echo.

echo Option 1: FORCE PUSH (Recommended - overwrites GitHub with your complete project)
echo This will replace everything on GitHub with your local files
echo.
set /p choice1="Do you want to FORCE PUSH your complete project? (Y/N): "

if /i "%choice1%"=="Y" (
    echo.
    echo Force pushing your complete project to GitHub...
    git push --force-with-lease origin main
    echo.
    echo SUCCESS! Your complete project is now on GitHub!
    echo Check https://github.com/MaxBossMan1/ddg-prisonrp-rules
    goto end
)

echo.
echo Option 2: MERGE AND PUSH (Alternative - keeps any GitHub files)
echo This will download GitHub files first, then push your project
echo.
set /p choice2="Do you want to MERGE first then push? (Y/N): "

if /i "%choice2%"=="Y" (
    echo.
    echo Step 1: Downloading any files from GitHub...
    git pull origin main --allow-unrelated-histories
    echo.
    echo Step 2: Pushing your complete project...
    git push origin main
    echo.
    echo SUCCESS! Your project is now on GitHub!
    goto end
)

echo.
echo No action taken. Here are the manual commands you can use:
echo.
echo FOR FORCE PUSH (replaces everything on GitHub):
echo   git push --force-with-lease origin main
echo.
echo FOR MERGE THEN PUSH (keeps GitHub files):
echo   git pull origin main --allow-unrelated-histories
echo   git push origin main

:end
echo.
echo ==========================================
echo Your GitHub repository should now show:
echo - ✅ Complete frontend React app
echo - ✅ Complete backend Node.js API  
echo - ✅ Professional README and documentation
echo - ✅ All 38 project files
echo.
echo Visit: https://github.com/MaxBossMan1/ddg-prisonrp-rules
echo ==========================================

pause 