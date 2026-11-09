@echo off
REM Lanza un servidor local SIN cache y abre el juego (los modulos JS no funcionan con doble clic en index.html).
cd /d "%~dp0"
where python >nul 2>nul && (python serve.py & exit /b 0)
where py >nul 2>nul && (py serve.py & exit /b 0)
echo No se encontro Python. Alternativas: extension "Live Server" de VS Code, o "npx serve".
pause
