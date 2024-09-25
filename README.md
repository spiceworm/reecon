TODO:
- Add option to hide thread posts for users with no comments (bots posting articles?)
- Verify email when creating user account
- Allow/require user to enter their own openai api key for user processing
- Have some way to inspect list of hidden threads
- Allow users to define more conditions (e.g. User Age Filter >,<,= number)
- Trigger that causes the extension to execute is still bad. (cache a last run time and check if before running again)
- Extension does not run when viewing a specific thread
- If you filter by e.g. age and then undo that filter by setting it back to 0, all previously collapsed comments remain collapsed.
- Add button to expand all comments.
- Track submission count since last redditor/thread processing event. Do no reprocess unless some number of new submissions have been made. Few or no new submissions does not warrant reprocessing unless the processing is done by a new model.
- Recommend threads to users based on their interests determined from their submissions history.

Firefox extension that:
- Scans all usernames and threads on the current page of old reddit.com layout (does not currently support new layout)
- The usernames and thread paths are sent to server for processing of submissions
- Based on found submissions, the server generates data for each redditor and thread using natural language processing and large language models
- The extension then injects the generated data onto the page so it is visible when browsing
- Data currently include age, IQ, sentiment polarity, and a brief summary about the user based on their submissions.

# Development
- In extension/webpack.config.js, change BASE_URL to 'http://127.0.0.1:8888'
```bash
cd reecon/extension
npm install
npm run build
```
- In firefox, go to about:debugging#/runtime/this-firefox
- Click "Load Temporary Add-..." button
- Open terminal and run
```bash
cd reecon/backend
docker compose up --build
```
- The browser extension will now send requests to the local dev server.

### View Logs
```bash
docker exec -it reecon-server-1 tail -f /var/log/supervisor/app/api.log
```

### Debugging
```bash
# DigitalOcean currently has a bug - https://www.digitalocean.com/community/questions/app-platform-supervisor-error
# For a local dev instance, uncomment unix_http_server lines at top of reecon/app/supervisord.conf
# in order to use `supervisorctl`.
docker exec -it reecon-server-1 ./debug.sh
```

# Environment Variables
### These are all required for dev and prod
```
APP_NAME=reecon
CONTAINER_REPO=<container-repo-name-in-container-registry>
DESCRIPTION=<description>
OPENAI_API_KEY=<api-key>
OPENAI_MODEL=<whichever-model-you-want>
OPENAI_MODEL_MAX_TOKENS=<max-tokens-for-chosen-model>
POSTGRES_DB=<name>
POSTGRES_HOST=<host>
POSTGRES_PASSWORD=<password>
POSTGRES_PORT=<port>
POSTGRES_SSL=require / disable
POSTGRES_USER=<user>
REDDIT_API_CLIENT_ID=<api-client-id>
REDDIT_API_CLIENT_SECRET=<api-client-secret>
REDDIT_API_PASSWORD=<api-password>
REDDIT_API_USERNAME=<api-username>
REDDIT_API_USER_AGENT=${APP_NAME} <version> by /u/${REDDIT_API_USERNAME} <github-repo-url>
REGISTRY_URL=<container-registry-url>
SECRET_KEY=<secret-key>
VERSION=<semantic-version>
```

### Set these for dev instance
```
DEBUG=1
LOG_LEVEL=DEBUG
POSTGRES_DB=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_SSL=disable
POSTGRES_USER=postgres
REDIS_HOST=redis
```

### Set these for prod instance
```
PRODUCTION=True
REDIS_HOST=<host>
REDIS_PASSWORD=<password>
REDIS_PORT=<port>
REDIS_SSL=True / False
```
