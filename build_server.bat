@echo off
call docker build -t sedrad/versionstack-backend:latest -f server/Dockerfile.prod server
call docker push sedrad/versionstack-backend:latest