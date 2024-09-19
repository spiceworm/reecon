TODO:
- Add option to hide comments for unprocessable redditors (they have only created threads or their comments are all less than 120 characters)
- Add option to hide thread posts for users with no comments (bots posting articles?)
- subreddit specific settings
- Verify email when creating user account
- Allow/require user to enter their own openai api key for user processing
- Have some way to inspect list of hidden threads
- Add toggle to auto collapse ignored user (e.g. AutoModerator) comments
- Allow users to define more conditions (e.g. User Age Filter >,<,= number)
- Look into reddit api rate limits.
- Extension does not display error messages.
- Trigger that causes the extension to execute is still bad. (cache a last run time and check if before running again)
- Extension does not run when viewing a specific thread
- Only process threads that have a positive upvote count ( > 2 ?) because you wouldnt read downvoted comments anyways.
- If you filter by e.g. age and then undo that filter by setting it back to 0, all previously collapsed comments remain collapsed.
- All button to expand all comments.
- Add extension hot keys to quickly change settings?
- Track submission count since last redditor/thread processing event. Do no reprocess unless some number of new submissions have been made. Few or no new submissions does not warrant reprocessing unless the processing is done by a new model.
- Use https://github.com/openai/tiktoken to count number of tokens when determining how many submissions to fetch.

Firefox extension that:
- Scans all usernames on the current page of old reddit.com layout (does not work on new layout)
- Posts them to a local server to analyze all submissions made by that user
- The server provide stats for each user based on analysis of their posts
- The extension then injects the stats so they appear beside each username
- The stats currently include age and IQ

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
