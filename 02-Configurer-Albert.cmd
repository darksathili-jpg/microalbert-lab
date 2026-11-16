@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0serveur\MicroAlbert.ps1" -Action Configurer
pause
