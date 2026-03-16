@echo off
TITLE Skarya Pulse - Automated Launcher
SETLOCAL EnableDelayedExpansion

:: Clear screen for a fresh start
CLS

:: --- BEAUTIFUL HEADER ---
echo.
echo  [94m======================================================[0m
echo  [94m   S K A R Y A   P U L S E   -   L A U N C H E R      [0m
echo  [94m======================================================[0m
echo.

:: --- STEP 1: AUTHENTICATION ---
echo  [93m[1/2] 🔐 Refreshing Authentication Token...[0m
echo  ------------------------------------------------------
echo.

node dataagent\agents\authenticator.js

IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [91m[!] ❌ FAILED: Authentication agent exited with error.[0m
    echo  [!] Please check your .env credentials in the root directory.
    echo.
    pause
    exit /b %ERRORLEVEL%
)

:: --- STEP 2: NEXT.JS SERVER ---
echo.
echo  [92m[2/2] ✅ Authentication Successful![0m
echo  [92m🚀 Starting Development Server (npm run dev)...[0m
echo  ------------------------------------------------------
echo.

:: Run npm run dev. This will take over the terminal.
npm run dev

:: Fallback if the process ever terminates
echo.
echo  [i] Process terminated.
pause
ENDLOCAL
