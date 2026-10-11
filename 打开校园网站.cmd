@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js and try again.
  pause
  exit /b 1
)
if not exist dist\index.html (
  echo The website has not been built. Building now...
  call npm.cmd run build
  if errorlevel 1 (
    echo Build failed. Please check the error above.
    pause
    exit /b 1
  )
)
node scripts\open-local.mjs
if errorlevel 1 pause
