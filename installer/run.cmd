@echo off
REM Run the Halcyon installer GUI without building an .exe.
REM This is the recommended, AV-friendly way to run it.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0HalcyonInstaller.ps1" %*
