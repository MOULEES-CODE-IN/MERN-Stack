@echo off
title Placement Management System

echo Starting Backend...
start cmd /k "cd /d %~dp0server && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend...
start cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 5 /nobreak >nul

start http://localhost:5173/

echo.
echo Placement Management System Started!
pause