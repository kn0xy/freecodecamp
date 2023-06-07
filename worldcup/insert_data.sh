#! /bin/bash

if [[ $1 == "test" ]]
then
  PSQL="psql --username=postgres --dbname=worldcuptest -t --no-align -c"
else
  PSQL="psql --username=freecodecamp --dbname=worldcup -t --no-align -c"
fi

# Do not change code above this line. Use the PSQL variable above to query your database.

# Declare temp array to keep track of unique teams
declare -A unique_teams

# Function to generate SQL insert statements
generate_insert_statement() {
    local table_name=$1
    shift
    local columns=("$@")

    
    local values=()
    local vals_added=0

    if [[ $table_name == 'teams' ]]; then
        for value in "${columns[@]}"; do
            values+=("'$value'")
        done
        echo "INSERT INTO teams (name) VALUES (${values[*]});"
    else
        for value in "${columns[@]}"; do
            values+=("'$value'")
            vals_added=$((vals_added+1))
            if [[ $vals_added < 6 ]]; then
                values+=(",")
            else
                vals_added=0
            fi
        done
        echo "INSERT INTO games (year,round,winner_id,opponent_id,winner_goals,opponent_goals)  VALUES (${values[*]});"
    fi
}


# Read the CSV file line by line
csv_file="games.csv"
while IFS=',' read -r year round winner opponent winner_goals opponent_goals; do
    # Ignore header line
    if [[ $year == 'year' ]]; then
        continue
    fi

    # Check if the winner team is already added to the teams table
    if [[ ! ${unique_teams[$winner]} ]]; then
        # Generate SQL insert statement for the teams table
        add_team=$(generate_insert_statement "teams" "$winner")
        $PSQL "$add_team"

        # Retrieve the team_id of the newly inserted team
        team_id=$($PSQL "SELECT team_id FROM teams WHERE name = '$winner';")

        # Add the team to the unique_teams array
        unique_teams[$winner]=$team_id
    fi

    # Check if the opponent team is already added to the teams table
    if [[ ! ${unique_teams[$opponent]} ]]; then
        # Generate SQL insert statement for the teams table
        add_team=$(generate_insert_statement "teams" "$opponent")
        $PSQL "$add_team"

        # Retrieve the team_id of the newly inserted team
        team_id=$($PSQL "SELECT team_id FROM teams WHERE name = '$opponent';")

        # Add the team to the unique_teams array
        unique_teams[$opponent]=$team_id
    fi

    # Retrieve the winner_id and opponent_id of the corresponding teams
    winner_id=${unique_teams[$winner]}
    opponent_id=${unique_teams[$opponent]}

    # Generate SQL insert statement for the games table
    game_query=$(generate_insert_statement "games" "$year" "$round" "$winner_id" "$opponent_id" "$winner_goals" "$opponent_goals")
    $PSQL "$game_query"
done < "$csv_file"
