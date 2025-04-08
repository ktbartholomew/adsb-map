#!/bin/bash


# Start the data socket process
npm run socket:start &

# Start the frontend
npm run start &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?