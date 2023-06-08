#!/bin/bash

PSQL="psql --username=freecodecamp --dbname=number_guess -tA -c "
SECRET_NUMBER=$((1 + RANDOM % 1000))
GUESSES=0

# Function to lookup the username in the database
check_username() {
    USER=$1
    USER_INFO=$($PSQL "SELECT played,best FROM users WHERE name='$USER'")
    if [[ -n "$USER_INFO" ]]; then
        while IFS='|' read played best; do
            echo "Welcome back, $USER! You have played $played games, and your best game took $best guesses."
            GAMES_PLAYED=$played
            BEST_GAME=$best
            NEW_USER=false
        done <<< "$USER_INFO"
    else
        echo "Welcome, $USER! It looks like this is your first time here."
        GAMES_PLAYED=0
        BEST_GAME=0
        NEW_USER=true
    fi
}

# Function to update user games in the database
update_user() {
    if [ $NEW_USER = true ]; then
        $PSQL "INSERT INTO users (name,played,best) VALUES ('$USER', 1, $GUESSES)" > /dev/null
    else
        (( GAMES_PLAYED++ ))
        local sql="UPDATE users SET played=$GAMES_PLAYED"
        if (( $GUESSES < $BEST_GAME )) || [ $BEST_GAME = 0 ]; then
            sql="$sql, best=$GUESSES"
        fi
        sql="$sql WHERE name='$USER'"
        $PSQL "$sql" > /dev/null
    fi
}


# Function to validate user input
check_number() {
    local re='^[0-9]+$'
    if ! [[ $1 =~ $re ]]; then
        echo false
    else
        echo true
    fi
}

# Function to check the user's guess
check_guess() {
    local guess=$1
    if [ $guess != $SECRET_NUMBER ]; then
        if (( $guess < $SECRET_NUMBER )); then
            prompt_guess "It's higher than that, guess again:"
        else
            prompt_guess "It's lower than that, guess again:"
        fi
    else
        echo
        echo "You guessed it in $GUESSES tries. The secret number was $SECRET_NUMBER. Nice job!"
        update_user
    fi
}

# Function to prompt user to guess a number
prompt_guess() {
    local msg=$1
    [[ ! $1 ]] && msg="Guess the secret number between 1 and 1000:"
    echo
    echo $msg
    read user_guess
    (( GUESSES++ ))
    local is_number=$(check_number $user_guess)
    if [ $is_number = true ]; then
        check_guess $user_guess
    else
        prompt_guess "That is not an integer, guess again:"
    fi
}

# Function to prompt user to enter a username
get_username() {
    echo "Enter your username:"
    read username
    echo
    if ! [ $username ]; then
        get_username
    else
        check_username $username
        prompt_guess
    fi
}

get_username