# Hockey Hacks - Fantasy Hockey Goalie Automation

A Go application that automatically manages starting goalies in Yahoo Fantasy Hockey by fetching daily NHL starting goalie information and updating your fantasy roster accordingly.

## Features

- 🏒 **Automated Goalie Management**: Automatically sets starting goalies and benches non-starting ones
- 📊 **Real-time Data**: Fetches daily starting goalie information from SportsData.io API
- 🔄 **Yahoo Integration**: Seamlessly integrates with Yahoo Fantasy Sports API
- 📧 **Error Notifications**: Email alerts when errors occur
- 🔐 **OAuth2 Authentication**: Secure Yahoo API authentication with automatic token refresh
- 📝 **Comprehensive Logging**: Detailed logging for troubleshooting

## How It Works

1. **Data Fetching**: Retrieves daily starting goalie projections from SportsData.io
2. **Team Filtering**: Filters for goalies from your configured teams
3. **Roster Management**: Automatically sets active/bench positions for your goalies based on who's starting
4. **Yahoo Update**: Updates your Yahoo Fantasy roster via their API

## Prerequisites

- Go 1.19 or higher
- Yahoo Fantasy Sports account with an active hockey league
- SportsData.io API account
- Gmail account for error notifications (or modify email settings)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hockey-hacks
```

2. Install dependencies:
```bash
go mod download
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with the required API keys and settings (see Configuration section below).

## Configuration

### Yahoo Fantasy API Setup

1. Go to [Yahoo Developer Network](https://developer.yahoo.com/)
2. Create a new app with Fantasy Sports API access
3. Get your Client ID and Client Secret and update the `.env`
4. Generate a refresh token using OAuth2 flow (see detailed steps below)
5. Find your League ID and Team ID from your Yahoo Fantasy URL (see detailed steps below)

#### Getting a Yahoo Refresh Token, League ID and Team ID

For detailed instructions on obtaining your Yahoo refresh token, league ID, and team ID, see the [Server README](server/README.md).

The server directory contains a standalone OAuth2 server that automates the Yahoo authentication flow and helps you extract the required IDs from the Yahoo Fantasy Sports API.

### SportsData.io Setup

1. Sign up for a free trail at [SportsData.io](https://sportsdata.io/)
2. Subscribe to the NHL API
3. Get your API key from the dashboard

## Usage

### Running the Application

From the project root directory:

```bash
go run cmd/startingGoalies/main.go
```

### Logs

The application generates logs in `cmd/startingGoalies/logs.log` for debugging and monitoring.

## GitHub Actions Workflows

This project includes automated GitHub Actions workflows for continuous integration and automated execution:

### 🏗️ Build Binary Workflow

**File**: `.github/workflows/build-binary.yml`

**Triggers**:
- Push to code paths (`cmd/startingGoalies/**`, `pkg/**`, `go.mod`, `go.sum`)
- Pull requests affecting the same paths
- Manual trigger via workflow dispatch

**Purpose**: Builds the starting goalies binary and caches it for use by the scheduler workflow.

**Features**:
- Builds optimized binary for Linux
- Uploads binary as GitHub artifact (30-day retention)
- Caches binary for faster scheduler execution

### 🕐 Starting Goalies Scheduler

**File**: `.github/workflows/starting-goalies.yml`

**Schedule**: Runs automatically at:
- Every 15 minutes from 12:45 AM - 2:59 AM ET (early morning games)
- Every 15 minutes from 3:45 PM - 11:59 PM ET (regular games)

**Manual Triggers**:
- Repository dispatch event with type `run-goalies`
- Manual workflow dispatch

**Purpose**: Automatically runs the goalie management application to update your fantasy roster.

**Features**:
- Uses cached/pre-built binary for faster execution
- Falls back to building from source if needed
- Manages environment variables via GitHub Secrets
- Uploads execution logs as artifacts (7-day retention)

### Setting Up GitHub Actions

1. **Configure Secrets**: Add a repository secret named `SECRETS` containing a JSON object with all your `.env`
2. **Enable Actions**: Ensure GitHub Actions are enabled in your repository settings

