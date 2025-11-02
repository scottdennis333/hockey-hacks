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
	var playingToday []yahoo.Player
	var healthyNotPlaying []yahoo.Player
	var others []yahoo.Player

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
			if rosterPlayer.Status == "" {
				if playingTeams[rosterPlayer.TeamAbbr] {
					playingToday = append(playingToday, rosterPlayer)
				} else {
					healthyNotPlaying = append(healthyNotPlaying, rosterPlayer)
				}
			} else {
				others = append(others, rosterPlayer)
			}
		}
	}

	// Add any roster players not in the priority list (e.g., new adds)
	prioritySet := make(map[string]bool)
	for _, p := range priorityList.Players {
		prioritySet[p.Name] = true
	}
	for _, player := range roster.PlayerList {
		if !prioritySet[player.Name.Full] {
			if player.Status == "" {
				if playingTeams[player.TeamAbbr] {
					playingToday = append(playingToday, player)
				} else {
					healthyNotPlaying = append(healthyNotPlaying, player)
				}
			} else {
				others = append(others, player)
			}
		}
	}

	// Return all players: healthy playing today, then healthy not playing, then all others
	return append(append(playingToday, healthyNotPlaying...), others...)
}
