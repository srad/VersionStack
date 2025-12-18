@echo off
call docker build -t sedrad/versionstack-frontend:latest -f client/Dockerfile.prod client
call docker push sedrad/versionstack-frontend:latest