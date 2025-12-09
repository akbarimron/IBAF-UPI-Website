@echo off
REM Quick Deploy Cloud Functions for IBAF Website
echo.
echo ========================================
echo  IBAF Cloud Functions Deploy Script
echo ========================================
echo.

echo [1/3] Checking Firebase CLI...
where firebase >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Firebase CLI not found!
    echo.
    echo Please install Firebase CLI first:
    echo npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)
echo Firebase CLI found!
echo.

echo [2/3] Installing dependencies...
cd functions
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
cd ..
echo Dependencies installed!
echo.

echo [3/3] Deploying functions to Firebase...
call firebase deploy --only functions
if %errorlevel% neq 0 (
    echo ERROR: Deployment failed!
    echo.
    echo Try manual deploy:
    echo firebase deploy --only functions --force
    echo.
    pause
    exit /b 1
)
echo.
echo ========================================
echo  SUCCESS! Functions deployed!
echo ========================================
echo.
echo Your Cloud Functions are now live!
echo.
echo What happens now:
echo - User deleted from Firestore
echo   ^> Automatically deleted from Authentication too!
echo.
echo Check logs: firebase functions:log
echo.
pause
