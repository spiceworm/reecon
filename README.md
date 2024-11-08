# reecon
Firefox browser extension that:
- Scans all usernames and threads on the current page of old reddit.com layout (does not support new layout)
- The usernames and thread paths are sent to server for processing of submissions
- Based on found submissions, the server generates data for each redditor and thread using natural language processing and large language models
- The extension then injects the generated data onto the page so it is visible when browsing
- Data currently include age, IQ, sentiment polarity, and a brief summary about the user based on their submissions.

# Admin Views
- Django admin - http://127.0.0.1:8888/admin/
- RQ stats - http://127.0.0.1:8888/admin/django_rq/queue/
- Constance - http://127.0.0.1:8888/admin/constance/config/

# Documentation Views
- Swagger API v1 Docs - http://127.0.0.1:8888/api/v1/docs/
- Redoc API v1 Docs - http://127.0.0.1:8888/api/v1/docs/redoc/

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
```

### Debugging Tools
```bash
# DigitalOcean currently has a bug - https://www.digitalocean.com/community/questions/app-platform-supervisor-error
# For a local dev instance, uncomment unix_http_server lines at top of reecon/app/supervisord.conf
# in order to use `supervisorctl`.
docker exec -it reecon-backend-server-1 ./db.sh
docker exec -it reecon-backend-server-1 ./debug.sh
docker exec -it reecon-backend-server-1 ./redis.sh
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
- Make `producer_settings` a pydantic model so it can be used in type annotations. This is better than `typing.Dict`
- Store extension auth and producer settings using plasmo's SecureStorage

Enhancements:
- Use batching API for processing redditors because they don't have to be processed immediately especially in the beginning. Then a job can just check the ones that are expired and resubmit them to the batch processing API again in the future
- Add option to collapse comments for unprocessable redditors
- (?) Add button to expand all comments
- Have some way to inspect list of hidden threads
- Recommend threads to users based on their interests determined from their submissions history.
- Allow users to submit AI queries within the context of a thread or redditor comments. For example: "what are the largest concerns users have about about the topic discussed in this thread?", "what industry do you think this redditor works in?"
- Allow users to report other users that they suspect are bots that should be added as an IgnoredRedditor
