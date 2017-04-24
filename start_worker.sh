#!/bin/bash
cd /app
chmod 0777 /var/run/docker.sock
su -c "npm run worker" hawkeye
