@echo off
setlocal

set "ENV_FILE=.env"
set "ENV_EXAMPLE=.env.example"

echo Checking environment setup...

if exist "%ENV_FILE%" (
    echo [OK] .env file already exists. Skipping creation.
    exit /b 0
)

if not exist "%ENV_EXAMPLE%" (
    echo [ERROR] %ENV_EXAMPLE% not found. Please ensure it exists in the repository.
    exit /b 1
)

echo [WARNING] .env file not found. Creating from %ENV_EXAMPLE%...
copy "%ENV_EXAMPLE%" "%ENV_FILE%" >nul

echo [OK] Created .env from %ENV_EXAMPLE%.

:: NOTE REGARDING GITHUB SECRETS:
:: GitHub CLI (gh) is available on Windows, but it intentionally prevents 
:: extracting the plaintext values of Repository Secrets for security reasons.
:: You cannot automatically pull down production secrets to your local .env.

echo ============================================================
echo WARNING - ACTION REQUIRED:
echo Please open the .env file and fill in your actual local
echo development credentials. Production secrets cannot be
echo downloaded from GitHub for security reasons.
echo ============================================================
