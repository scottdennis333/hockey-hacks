#!/bin/bash

# Simple deployment script for VPS cron job
# Run this on a $2.50/month Vultr or $4/month DigitalOcean droplet

# 1. Install Go on your VPS:
# wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
# sudo tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
# echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc

# 2. Clone your repository:
# git clone https://github.com/scottdennis333/hockey-hacks.git
# cd hockey-hacks

# 3. Create environment file:
# nano .env
# # Add your Yahoo API credentials

# 4. Add to crontab (crontab -e):
# 0 12 * * * /home/user/hockey-hacks/run-goalies.sh
# 0 22 * * * /home/user/hockey-hacks/run-goalies.sh

# This script runs your Go program:
#!/bin/bash
cd /home/user/hockey-hacks/cmd/startingGoalies
/usr/local/go/bin/go run main.go >> /home/user/hockey-hacks/cron.log 2>&1