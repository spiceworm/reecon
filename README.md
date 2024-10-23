TODO:
- Add option to collapse comments for unprocessable redditors
- Require user to enter their own openai api key for user processing
- Have some way to inspect list of hidden threads
- Add button to expand all comments.
- Track submission count since last redditor/thread processing event. Do no reprocess unless some number of new submissions have been made. Few or no new submissions does not warrant reprocessing unless the processing is done by a new model.
- Recommend threads to users based on their interests determined from their submissions history.
- Track tokens used to generate each object so you can determine how many tokens are being used as the prompts/generated data changes over time
- Allow users to submit AI queries within the context of a thread or redditor comments. For example: "what are the largest concerns users have about about the topic discussed in this thread?", "what industry do you think this redditor works in?"
- Post to openai batch api to update existing stale entries. Maybe new entries can be processed immediately, but a job can run in the background to refresh entries that are stale. This may only apply to stale users as stale threads are no longer relevant as no one is looking at or posting to them anymore
- Update threads and users api endpoints to return {threads: [...], unprocessable_threads: [...], pending_threads: [...]}
- (X) Log when tenacity retries requests so you can see how much rate limiting is occurring. Modify rq config to process jobs in smaller batches / slower to avoid rate limiting
- Fix generated documentation for api endpoints
- Implement signup/login flow how it is shown in examples at https://github.com/remix-run/react-router/blob/dev/examples/auth/src/App.tsx
- Remove option to enable/disable thread and redditor processing from extension popup
- Use batching API for processing redditors because they don't have to be processed immediately especially in the beginning. Then a job can just check the ones that are expired and resubmit them to the batch processing API again in the future

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
nvm install 21
nvm use 21
pnpm install
pnpm dev --target=firefox-mv2
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
