@echo off
title Proyecto Electricidad HH - Sistema de Devolucion de Productos y Desechos
cd /d "%~dp0"
if exist config-local.bat call config-local.bat
echo Iniciando servidor en http://localhost:3000 ...
start "" "http://localhost:3000"
node server.js
pause
