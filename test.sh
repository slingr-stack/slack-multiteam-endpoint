#!/bin/sh

echo "------------------------------------------------------------------------"
echo " SLACK endpoint - tests"
echo "------------------------------------------------------------------------"
cd $IDEA2_HOME/platform/integrations/endpoints/slack

# System properties
export _endpoint_name=slack
export _app_name=test1
export _environment=dev
export _pod_id=id
export _profile=default
export _custom_domain=

export _debug=true
export _local_deployment=false

export _webservices_port=10000
export _base_domain=localhost:8000
export _endpoints_services_api=http://localhost:2233/api
export _token=test1/dev/slack

# export LOGENTRIES_TOKEN=2e47ebe8-46ae-48db-90ca-63fbb2a16924

# Endpoint specific properties
export _endpoint_config="{\"botApiToken\":\"xoxb-5120336017-qQio0GZWTBVQ8vbdTD14AcLj\",\"slashCommandsToken\":\"rQleuiNAX8B8JB3nL0vAvZ8U\"}"

echo "Execute [npm install] and [npm install mocha --global] before to run for first time "
mocha --timeout 100000
echo "------------------------------------------------------------------------"
echo " END - SLACK endpoint - tests"
echo "------------------------------------------------------------------------"

