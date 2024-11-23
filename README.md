# reecon
Browser extension that:
- Scans all usernames and threads on the current page of old reddit.com layout (does not support new layout)
- The usernames and thread paths are sent to server for processing of submissions
- Based on found submissions, the server generates data for each redditor and thread using natural language processing and large language models
- The extension then injects the generated data onto the page so it is visible when browsing
- Data currently include age, IQ, sentiment polarity, and a brief summary about the user based on their submissions.

# Admin View
- Django admin - https://reecon.xyz/admin/

# Documentation
- Swagger API v1 Docs - https://reecon.xyz/api/v1/docs/
- Redoc API v1 Docs - https://reecon.xyz/api/v1/docs/redoc/

# Development
## Start extension development server
```bash
cd reecon/extension
nvm install 21
nvm use 21
pnpm install
pnpm build --target=firefox-mv3  # `pnpm dev` is problematic after loading the extension into the browser so use `pnpm build`
```
- In firefox, go to about:debugging#/runtime/this-firefox
- Click "Load Temporary Add-..." and select reecon/build/firefox-mv3-prod/manifest.json

## Start backend development server
```bash
cd reecon/backend
docker compose up --build
```

### View Logs
```bash
docker exec -it reecon-backend-server-1 tail -f /var/log/supervisor/gunicorn/app.log
docker exec -it reecon-backend-server-1 tail -f /var/log/supervisor/rq-worker/worker.log

docker exec -it reecon-backend-worker-1 tail -f /var/log/supervisor/rq-worker/worker.log
```

### Debugging Tools
```bash
# DigitalOcean currently has a bug - https://www.digitalocean.com/community/questions/app-platform-supervisor-error
# For a local dev instance, uncomment unix_http_server lines at top of supervisord.conf for server and worker
# in order to use `supervisorctl`.

# These are available in the running server and worker containers
$ reecon-db.sh
$ reecon-debug.sh
$ reecon-redis.sh
```

# Environment Variables
### These are all required for dev and prod
```
ADMIN_PASSWORD=<admin-password>
APP_NAME=reecon
CONTAINER_REPO=<container-repo-name-in-container-registry>
DEFAULT_OPENAI_API_KEY=<api-key>
POSTGRES_DB=<name>
POSTGRES_HOST=<host>
POSTGRES_PASSWORD=<password>
POSTGRES_PORT=<port>
POSTGRES_SSL=require / disable
POSTGRES_USER=<user>
REDDIT_API_CLIENT_ID=<reddit-webapp-client-id>
REDDIT_API_CLIENT_SECRET=<reddit-webapp-client-secret>
REDDIT_API_USER_AGENT=${APP_NAME} <version> by /u/${REDDIT_API_USERNAME} <github-repo-url>
REGISTRY_URL=<container-registry-url>
SECRET_KEY=<secret-key>
VERSION=<semantic-version>
```

### Set these for dev instance
```
DEBUG=True
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

TODO:
- If going to an "aggregator" sub like /r/all and /r/popular, apply content filters to each individual thread based on the context of that thread
  - In settings popup, show all active content filters
- Think about how to handle local settings after logout. Logging back in as a different user will currently load the initial users settings
- storage watcher not always setting notification when openai key missing
- Allow users to contribute anonymously or have a checkbox to hide their username from contributions (while still being associated with them)
- Auto redirect reddit urls to old.reddit.com since the extension wont work otherwise
- Add toggle to subsidize all openai api requests so that users do not have to provide their own key
- Add way for extension to get settings from server
  - disabled context queries disables form elements
  - subsidized processing means producer API key does not need to be present in the extension

Enhancements:
- Add option to collapse comments for unprocessable redditors
- Have some way to inspect list of hidden threads
- Recommend threads to users based on their interests determined from their submissions history.
- Hide thread posts from redditors that trigger filter rule for current context
- Add some indication that the context script fired
- Do not show expose producer api keys when looking at RQ job arguments in admin panel
- update llm prompt to return keywords in order of relevance from most to least
- Store extension auth and producer settings using plasmo's SecureStorage
- Add contributions tab that shows how many submissions the user has paid for with their key
- Show contribution rank next to each redditors username
