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
### Required for dev and prod
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

### Additional env vars for dev instance
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

### Additional env vars for prod instance
```
PRODUCTION=True
REDIS_HOST=<host>
REDIS_PASSWORD=<password>
REDIS_PORT=<port>
REDIS_SSL=True / False
```

# Bump version
### Change version variable in:
- backend/.env
- backend/.env.production
- extension/package.json
- reinstall reecon python package for local virtualenv
  - `cd reecon/backend/reecon`
  - `export VERSION=<new-version>; python -m build && pip install dist/reecon-${VERSION}.tar.gz`
- Tag latest commit with version

# Deploy to Production
```
$ cd ~/backend
$ . ~/venv/reecon/bin/activate
(reecon) $ ./deploy.py
```

# Going public blockers
- Make nlp sentiment values human readable

# TODO:
- Think about how to handle local settings after logout. Logging back in as a different user will currently load the initial users settings
    - Add option to back up settings to file and another option to import from file
- Generate a bell curve using recent processed redditor data to determine high, medium, and low values for sentiment polarity and subjectivity
- Make annotated data render nicer
- Implement password reset bot for reecon-admin
    - User sends DM that says "forgot password" and bot responds back with a password reset link
- Lookup how extension updates are performed and stored keys are impacted (new and existing ones)
- Auto updates to the DOM that change 'pending' to something else causes a collapsed comment with any pending child comments to uncollapse when the update occurs
- Add terms of service aggreements checkbox that links to a TOS document
    - All data generated using user api keys is owned by me
    - There should be no expectation of accuracy for generated data
    - All generated data should be relied upon for entertainment purposes only
- Run content script once and then only continue running it on the active tab. If there are 5 tabs for large tabs open that will be a lot of browser processing happening.
- Redo storage initialization so variables are only set to defaults if the storage key is currently unset (or lookup the proper way to do this so extension updates work without accidentally modifying existing storage values)
- Only return objects from redis cache from api requests and enqueue eveything else. Queued entries will either result in a refreshing of the redis entry or processing
- If an already processed entity is submitted and needs to be re-processed because it is stale, but that job in the low priority queue

# Enhancements:
- Add option to hide comments for unprocessable redditors
- Have some way to inspect list of hidden threads
- Recommend threads to users based on their interests determined from their submissions history.
- Hide thread posts from redditors that trigger filter rule for current context
- Do not expose producer api keys when looking at RQ job arguments in admin panel
- Add contributions tab that shows how many submissions the user has paid for with their key
- Show contribution rank next to each redditors username
- Add way for users to report suspected bot accounts so they get added to the ignored redditors list
- Add UI endpoint to render processed data for individual redditors / threads. This could be used when people share processed information as a link or could be incorporated into a search feature of the site one day
- Allow users to contribute anonymously or have a checkbox to hide their username from contributions (while still being associated with them)
- Add pagination and search to context-query history
- When looking at a thread or user comment/thread history page, show one of those little agent chat windows in the bottom right of the page where you can submit a context-query for the current page entity
- Use VPC database connections when digitalocean app connections within a VPC is made available
  - https://ideas.digitalocean.com/app-platform/p/vpc-with-apps-droplets-and-managed-databases
