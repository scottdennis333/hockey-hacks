#!/bin/bash

times=(10 11 12 13 14 15 16 17 18 19 20 21)
date=$(date +%k)
if printf '%s\0' "${times[@]}" | grep -Fxqz -- $date;
then
  go run cmd/main.go
else
  echo "Not in Time"
fi

#while [ true ]; do
#  if printf '%s\0' "${times[@]}" | grep -Fxqz -- $date;
#  then
#    go run cmd/main.go
#  else
#    echo "Not in Time"
#  fi
#  sleep 3600
#done