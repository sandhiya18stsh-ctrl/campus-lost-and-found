$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\backend"

if (!(Test-Path "venv")) {
    python -m venv venv
}

.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe main.py
