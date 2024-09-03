TODO:
- Allow arq jobs to expire if they are enqueued and not processed
- Expire keys in unprocessable users and thread redis group
- Option to only run extension on specified subreddits
- Add option to hide comments for unprocessable redditors (they have only created threads or their comments are all less than 120 characters)
- Add option to hide thread posts for users with no comments (bots posting articles?)
- Add sign-up page
- Cache data locally (with expiration time) and only fetch data for things not in local cache
- Track auth token expiration date locally so we know when a user must reauthenticate.
- subreddit specific settings

Firefox extension that:
- Scans all usernames on the current page of old.reddit.com (does not work on new layout)
- Posts them to a local server to analyze all submissions made by that user
- The server provide stats for each user based on analysis of their posts
- The extension then injects the stats so they appear beside each username
- The stats currently include age and IQ

Installation / Setup
- In firefox, go to about:debugging#/runtime/this-firefox
- Click "Load Temporary Add-..." button
- Select app/extension/manifest.json
- Change extension/background.js `baseUrl` default to 'http://127.0.0.1:8888'
- Open terminal and run
```bash
cd app
docker compose up --build
```

View Logs
```bash
docker exec -it reecon-app-1 tail -f /var/log/app/api.log
```

Debugging
```bash
docker exec -it reecon-app-1 bash -c 'supervisorctl stop app; uvicorn --app-dir=/app --host=127.0.0.1 --port=8000 api.main:app'
```

TODO
- Add option to disable processing of new usernames and only serve up existing db entries that can be toggled from the browser
