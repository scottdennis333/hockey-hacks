package lineup

import (
	"encoding/json"
	"hockey-hacks/pkg/sportsData"
	"hockey-hacks/pkg/yahoo"
	"io"
	"os"
)

type PlayerPriority struct {
	Name string `json:"name"`
	Team string `json:"team"`
}

type PlayerPriorityList struct {
	Players []PlayerPriority `json:"players"`
}

func GetPlayerPriority() (PlayerPriorityList, error) {
	jsonFile, err := os.Open("player_priority.json")
	if err != nil {
		return PlayerPriorityList{}, err
	}
	defer jsonFile.Close()

	byteValue, _ := io.ReadAll(jsonFile)

	var playerPriorityList PlayerPriorityList
	json.Unmarshal(byteValue, &playerPriorityList)

	return playerPriorityList, nil
}

func GetRoster(yc *yahoo.YahooClient) (yahoo.Players, error) {
	return yc.GetRosterPlayers()
}

// GetSortedPlayers takes the player priority list, the roster, and the list of games for the day,
// and returns a sorted list of active players.
func GetSortedPlayers(priorityList PlayerPriorityList, roster yahoo.Players, games sportsData.Games) []yahoo.Player {
	var sortedPlayers []yahoo.Player

	// Create a map of teams that are playing today for quick lookup
	playingTeams := make(map[string]bool)
	for _, game := range games {
		playingTeams[game.HomeTeam] = true
		playingTeams[game.AwayTeam] = true
	}

	// Create a map for quick lookup of roster players by name
	rosterMap := make(map[string]yahoo.Player)
	for _, player := range roster.PlayerList {
		rosterMap[player.Name.Full] = player
	}

	// Iterate through the priority list and add the corresponding roster players to the sorted list
	for _, priorityPlayer := range priorityList.Players {
		if rosterPlayer, ok := rosterMap[priorityPlayer.Name]; ok {
			// Filter out players with a non-empty status (e.g., "IR", "DTD")
			if rosterPlayer.Status == "" {
				// Check if the player's team is playing today
				if _, ok := playingTeams[rosterPlayer.TeamAbbr]; ok {
					sortedPlayers = append(sortedPlayers, rosterPlayer)
				}
			}
		}
	}

	return sortedPlayers
}
