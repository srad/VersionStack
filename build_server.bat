@echo off
call docker build -t sedrad/versionstack-backend:v2 -f server/Dockerfile.prod server
call docker push sedrad/versionstack-backend:v2