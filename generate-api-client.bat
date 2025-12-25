@echo off
setlocal

echo ========================================
echo  VersionStack API Client Generator
echo ========================================
echo.

:: Configuration
set API_URL=http://localhost/api/openapi.json
set SPEC_FILE=openapi-spec.json
set OUTPUT_DIR=client\src\api\generated

:: Step 1: Start services with docker-compose
echo [1/6] Starting services...
docker-compose up -d --build backend nginx
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to start services
    exit /b 1
)

:: Step 2: Wait for server to be ready (check for HTTP 200)
echo [2/6] Waiting for API to be ready...
set RETRIES=60
:wait_loop
timeout /t 2 /nobreak >nul

:: Use curl to check HTTP status code
for /f %%i in ('curl -s -o nul -w "%%{http_code}" %API_URL%') do set HTTP_CODE=%%i

if "%HTTP_CODE%"=="200" goto server_ready
set /a RETRIES-=1
echo    Status: %HTTP_CODE% - Waiting... (%RETRIES% retries left)
if %RETRIES% gtr 0 goto wait_loop

echo ERROR: API did not become ready in time (last status: %HTTP_CODE%)
echo.
echo Showing backend logs:
docker-compose logs --tail=50 backend
docker-compose down
exit /b 1

:server_ready
echo    API is ready! (HTTP %HTTP_CODE%)

:: Step 3: Download the OpenAPI spec to a file
echo [3/6] Downloading OpenAPI specification...
curl -s -o %SPEC_FILE% %API_URL%
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to download OpenAPI spec
    docker-compose down
    exit /b 1
)

:: Step 4: Create output directory
echo [4/6] Creating output directory...
if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%"

:: Step 5: Generate API client from local file
echo [5/6] Generating TypeScript API client...
call npx --yes @openapitools/openapi-generator-cli generate ^
    -i %SPEC_FILE% ^
    -g typescript-axios ^
    -o %OUTPUT_DIR% ^
    --additional-properties=supportsES6=true,npmVersion=9.0.0,typescriptThreePlus=true

set GEN_RESULT=%ERRORLEVEL%

:: Cleanup spec file
del %SPEC_FILE% 2>nul

if %GEN_RESULT% neq 0 (
    echo ERROR: API client generation failed
    docker-compose down
    exit /b 1
)

:: Step 6: Cleanup
echo [6/6] Stopping containers...
docker-compose down

echo.
echo ========================================
echo  Done! API client generated at:
echo  %OUTPUT_DIR%
echo ========================================
echo.
echo Usage example:
echo.
echo   import { AppsApi, AuthenticationApi, Configuration } from './api/generated';
echo.
echo   const config = new Configuration({
echo     basePath: '/api/v1',
echo     accessToken: localStorage.getItem('token') ^|^| undefined,
echo   });
echo.
echo   const appsApi = new AppsApi(config);
echo   const apps = await appsApi.appsList();
echo.

endlocal
