@echo off
call docker build -t sedrad/versionstack-frontend:v2 -f client/Dockerfile.prod client
call docker push sedrad/versionstack-frontend:v2