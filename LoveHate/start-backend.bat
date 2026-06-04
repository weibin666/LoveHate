@echo off
echo Starting LoveHate Backend...
cd /d "%~dp0backend"
D:\soft\anconda\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
