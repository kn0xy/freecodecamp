#! /bin/bash

PSQL="psql --username=freecodecamp --dbname=periodic_table -tA -c "
KSQL=$(cat << END
SELECT properties.atomic_number, properties.atomic_mass, properties.melting_point_celsius, 
properties.boiling_point_celsius, elements.name, elements.symbol, types.type FROM properties 
JOIN elements ON properties.atomic_number = elements.atomic_number 
JOIN types ON properties.type_id = types.type_id 
WHERE properties.atomic_number=
END
)

# Function to check if user input is a number
check_number() {
    local re='^[0-9]+$'
    if ! [[ $1 =~ $re ]]; then
        echo false
    else
        echo true
    fi
}

# Function to lookup value in the database
db_lookup() {
    if [ $IS_NUMBER = true ]; then
        ATOMIC_NUMBER=$USER_INPUT
    else
        # Find the atomic number based on provided value
        ATOMIC_NUMBER=$($PSQL "SELECT atomic_number FROM elements WHERE name='$USER_INPUT' OR symbol='$USER_INPUT'")
        if ! [[ -n "$ATOMIC_NUMBER" ]]; then
            echo "I could not find that element in the database."
            exit 0
        fi
    fi
    QUERY_RESULT=$($PSQL "$KSQL$ATOMIC_NUMBER")
    display_info
}

# Function to display information fetched from the database
display_info() {
    while IFS='|' read num mass melting boiling name symbol type; do
       s1="The element with atomic number $num is $name ($symbol). "
       s2="It's a $type, with a mass of $mass amu. "
       s3="$name has a melting point of $melting celsius and a boiling point of $boiling celsius."
       echo "$s1$s2$s3"
    done <<< "$QUERY_RESULT"
}


# Script entry point
if [[ ! $1 ]]; then
    echo "Please provide an element as an argument."
else
    USER_INPUT=$1
    IS_NUMBER=$(check_number $USER_INPUT)
    db_lookup
fi