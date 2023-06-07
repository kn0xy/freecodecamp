#! /bin/bash

PSQL="psql --username=freecodecamp --dbname=salon -tA -c "

# Function to fetch the list of services from the database
fetch_services() {
    SERVICES=("_")
    dbServices=$($PSQL "SELECT name FROM services")
    while IFS= read -r row; do
        SERVICES+=("$row")
    done <<< "$dbServices"
}

# Function to display the services menu
display_menu() {
    if [[ ! $1 ]]; then
        echo "~~~~~ MY SALON ~~~~~"
        echo
        echo "Welcome to My Salon, how can I help you?"
        echo
    else
        echo
        echo "I could not find that service. What would you like today?"
    fi
    for i in ${!SERVICES[@]}; do
        [[ $i > 0 ]] && echo "$i) ${SERVICES[$i]}"
    done
}

# Function to save appointment to the database
save_appointment() {
    CUSTOMER_ID=$($PSQL "SELECT customer_id FROM customers WHERE phone='$CUSTOMER_PHONE'")
    APPT_VALS="'$SERVICE_TIME', '$CUSTOMER_ID', '$SERVICE_ID_SELECTED'"
    $PSQL "INSERT INTO appointments (time,customer_id,service_id) VALUES ($APPT_VALS)" > /dev/null
}

# Function to read user's desired appointment time
read_appt_time() {
    echo
    echo "What time would you like your $CUSTOMER_SERVICE, $CUSTOMER_NAME?"
    read SERVICE_TIME
    echo
    save_appointment
    echo "I have put you down for a $CUSTOMER_SERVICE at $SERVICE_TIME, $CUSTOMER_NAME."
    echo
}

# Function to read user's name
read_user_name() {
    echo
    echo "I don't have a record for that phone number, what's your name?"
    read CUSTOMER_NAME
    $PSQL "INSERT INTO customers (name,phone) VALUES ('$CUSTOMER_NAME', '$CUSTOMER_PHONE')" > /dev/null
}

# Function to read user's phone number
read_phone_number() {
    echo
    echo "What's your phone number?"
    read CUSTOMER_PHONE
    local name=$($PSQL "SELECT name FROM customers WHERE phone='$CUSTOMER_PHONE'")

    if [[ -n "$name" ]]; then
        # Phone number exists
        CUSTOMER_NAME=$name
    else
        # Phone number does not exist
        read_user_name
    fi
    read_appt_time
}

# Function to read user's service selection
read_menu_selection() {
    read SERVICE_ID_SELECTED
    if (( SERVICE_ID_SELECTED >= 1 && SERVICE_ID_SELECTED <= 5 )); then
        CUSTOMER_SERVICE=${SERVICES[$SERVICE_ID_SELECTED]}
        read_phone_number
    else
        display_menu true
        read_menu_selection
    fi
}

# Main script
fetch_services
display_menu
read_menu_selection