package lineup

import (
	"hockey-hacks/pkg/yahoo"
)

const (
	// Roster spot counts
	maxCenters   = 3
	maxLeftWings = 2
	maxRightWings = 2
	maxDefensemen = 3
	maxUtils      = 1
)

// OptimizedLineup represents the final, optimized lineup.
type OptimizedLineup struct {
	C  []yahoo.Player
	LW []yahoo.Player
	RW []yahoo.Player
	D  []yahoo.Player
	Util []yahoo.Player
	BN []yahoo.Player
}

// OptimizeLineup takes a sorted list of players and returns the optimized lineup.
func OptimizeLineup(sortedPlayers []yahoo.Player) OptimizedLineup {
	var lineup OptimizedLineup

	// Keep track of the number of players in each position
	centerCount := 0
	leftWingCount := 0
	rightWingCount := 0
	defensemenCount := 0
	utilCount := 0

	// Create a set of players who have already been assigned a spot
	assignedPlayers := make(map[string]bool)

	// Iterate through the sorted players and assign them to the best possible spot
	for _, player := range sortedPlayers {
		if _, ok := assignedPlayers[player.Name.Full]; ok {
			continue // Skip players who have already been assigned a spot
		}

		isAssigned := false

		// Try to assign the player to their primary position first
		for _, position := range player.EligiblePositions.Positions {
			switch position {
			case "C":
				if centerCount < maxCenters {
					lineup.C = append(lineup.C, player)
					centerCount++
					isAssigned = true
				}
			case "LW":
				if leftWingCount < maxLeftWings {
					lineup.LW = append(lineup.LW, player)
					leftWingCount++
					isAssigned = true
				}
			case "RW":
				if rightWingCount < maxRightWings {
					lineup.RW = append(lineup.RW, player)
					rightWingCount++
					isAssigned = true
				}
			case "D":
				if defensemenCount < maxDefensemen {
					lineup.D = append(lineup.D, player)
					defensemenCount++
					isAssigned = true
				}
			}
			if isAssigned {
				break
			}
		}

		// If the player couldn't be assigned to their primary position, try to assign them to Util
		if !isAssigned && utilCount < maxUtils {
			lineup.Util = append(lineup.Util, player)
			utilCount++
			isAssigned = true
		}

		// If the player still hasn't been assigned, put them on the bench
		if !isAssigned {
			lineup.BN = append(lineup.BN, player)
		}

		assignedPlayers[player.Name.Full] = true
	}

	return lineup
}
