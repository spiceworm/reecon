TODO:
- Allow arq jobs to expire if they are enqueued and not processed
- Expire keys in unprocessable users and thread redis group
- Option to only run extension on specified subreddits
- Add option to hide comments for unprocessable redditors (they have only created threads or their comments are all less than 120 characters)
- Add option to hide thread posts for users with no comments (bots posting articles?)
- Cache data locally (with expiration time) and only fetch data for things not in local cache
- subreddit specific settings

Firefox extension that:
- Scans all usernames on the current page of old.reddit.com (does not work on new layout)
- Posts them to a local server to analyze all submissions made by that user
- The server provide stats for each user based on analysis of their posts
- The extension then injects the stats so they appear beside each username
- The stats currently include age and IQ

# Development
- In extension/background.js, change baseUrl to 'http://127.0.0.1:8888'
```bash
cd reecon/extension/popup
npm install
npm run build
```
- In firefox, go to about:debugging#/runtime/this-firefox
- Click "Load Temporary Add-..." button
- Open terminal and run
```bash
cd reecon/app
docker compose up --build
```
- The browser extension will now send requests to the local dev server.

### View Logs
```bash
docker exec -it reecon-app-1 tail -f /var/log/supervisor/app/api.log
```

### Debugging
```bash
# DigitalOcean currently has a bug - https://www.digitalocean.com/community/questions/app-platform-supervisor-error
# For a local dev instance, uncomment unix_http_server lines at top of reecon/app/supervisord.conf
# in order to use `supervisorctl`.
docker exec -it reecon-app-1 bash -c 'supervisorctl stop app; uvicorn --app-dir=/app --host=127.0.0.1 --port=8000 application.main:app'
```

# Environment Variables
### These are all required for dev and prod
```
APP_NAME=reecon
CONTAINER_REPO=<container-repo-name-in-container-registry>
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
PRODUCTION=1
REDIS_HOST=<host>
REDIS_PASSWORD=<password>
REDIS_PORT=<port>
REDIS_SSL=0 / 1
```
