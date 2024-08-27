TODO:
- More elegantly share settings between popup and main extension script without code duplication
- Allow arq jobs to expire if they are enqueued and not processed
- Expire keys in unprocessable users and thread redis group
- Option to only run extension on specified subreddits
- Hide comments from unprocessable users (they have only created threads or their comments are all less than 120 characters)
- Hide thread posts for users with no comments (bots posting articles?)

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
- Open terminal and run
```bash
cd app
docker compose up --build
```

View Logs
```bash
docker exec -it recon-app-1 tail -f /var/log/app/api.log
```

Debugging
```bash
docker exec -it recon-app-1 bash -c 'supervisorctl stop app; uvicorn --app-dir=/app --host=127.0.0.1 --port=8000 api.main:app'
```

TODO
- Add option to disable processing of new usernames and only serve up existing db entries that can be toggled from the browser