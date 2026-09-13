@echo off
REM Fix EPERM on .next\trace. Run: npm run dev:fresh
REM Dev uses .next-dev (see next.config) so locked .next is ignored.

cd /d "%~dp0\.."

echo [dev:fresh] Stopping Node processes...
taskkill /F /IM node.exe 2>nul
ping -n 3 127.0.0.1 >nul

echo [dev:fresh] Removing .next-dev (dev build dir)...
if exist .next-dev rmdir /s /q .next-dev

echo [dev:fresh] Starting dev server...
npm run dev
