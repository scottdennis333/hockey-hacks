import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

 # URL for today's probable goalies on DailyFaceoff
url = "https://www.dailyfaceoff.com/starting-goalies/"
headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"
}

# Fetch the page
response = requests.get(url, headers=headers)
if response.status_code != 200:
    raise Exception(f"Failed to fetch page: {response.status_code}")

soup = BeautifulSoup(response.text, "html.parser")

# Container for all games
games_data = []

# Find each game container
games = soup.find_all("div", class_="game-lineup-container")
for game in games:
    # Teams
    teams = game.find("div", class_="matchup").get_text(strip=True)
    if "@" in teams:
        away_team, home_team = [t.strip() for t in teams.split("@")]
    else:
        continue  # skip if format unexpected

    # Goalies
    goalies = game.find_all("div", class_="goalie")
    away_goalie = goalies[0].get_text(strip=True) if len(goalies) > 0 else None
    home_goalie = goalies[1].get_text(strip=True) if len(goalies) > 1 else None

    games_data.append({
        "game": f"{away_team} @ {home_team}",
        "probable_starting_goalies": {
            "away": away_goalie,
            "home": home_goalie
        }
    })

# Wrap in date
today_str = datetime.now().strftime("%Y-%m-%d")
output = {today_str: games_data}

# Print JSON
print(json.dumps(output, indent=2))
