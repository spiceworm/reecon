function run() {
    let threadCommentsLinkElements = document.getElementsByClassName('comments');
    let userLinkElements = document.getElementsByClassName('author');

    let threadCommentsURL_commentsLinkElement_map = {};
    let userName_linkElement_map = {};

    // Map each thread URL to the thread link element.
    // Make sure that they are old.reddit.com links.
    for (let el of threadCommentsLinkElements) {
        const url = el.href.replace("www.reddit.com", "old.reddit.com");
        threadCommentsURL_commentsLinkElement_map[url] = el;
    }

    // Map each userName to an empty array
    for (let el of userLinkElements) {userName_linkElement_map[el.innerText] = [];}

    // Append all the linkElements for each user's comments to that array.
    // The user may have commented posted multiple times in the same thread.
    for (let el of userLinkElements) {userName_linkElement_map[el.innerText].push(el);}

    function updateDOM_threads(response) {
        for (let [url, commentsLinkElement] of Object.entries(threadCommentsURL_commentsLinkElement_map)) {
            if (url in response) {
                const sentimentPolarity = response[url];

                const jujuSpanID = `thread-juju-${url}`;
                let jujuSpan = document.getElementById(jujuSpanID);
                if (jujuSpan === null) {
                    jujuSpan = document.createElement('span');
                    jujuSpan.setAttribute("id", jujuSpanID);
                    let threadTitleElement = commentsLinkElement.closest("div").firstElementChild;
                    threadTitleElement.insertAdjacentElement("beforeend", jujuSpan);
                }

                jujuSpan.title = sentimentPolarity;

                if (sentimentPolarity >= 0) {
                    jujuSpan.innerText = " [Juju: 😊]";
                } else {
                    jujuSpan.innerText = " [Juju: 🚨]" ;
                }
            }
        }
    }

    // Take the response containing a list of [{"<username>": {"age": 1, "intelligence": "99%"}} ...]
    // entries and create a new <span> element to insert after each username link that appears in
    // the DOM.
    function updateDOM_userNames(response) {
        for (let [userName, linkElements] of Object.entries(userName_linkElement_map)) {
            if (userName in response) {
                const stats = response[userName];
                const userStatsSpanID = `user-stats-${userName}`;
                for (let linkElement of linkElements) {
                    let statsSpan;
                    if (linkElement.parentElement.lastElementChild.id === userStatsSpanID) {
                        // There is an existing statsSpan that we just need to update the innerText
                        statsSpan = linkElement.parentElement.lastElementChild;
                    } else {
                        // There is no statsSpan yet. Create one and insert it into the DOM.
                        statsSpan = document.createElement('span');
                        statsSpan.setAttribute("id", userStatsSpanID);
                        statsSpan.style.color = "yellow";
                        linkElement.parentElement.insertAdjacentElement("beforeend", statsSpan);
                    }

                    if ("error" in stats) {
                        statsSpan.innerText = ` [error=${stats['error']}]`;
                        statsSpan.style.color = "red";
                    } else {
                        statsSpan.innerText = ` [age=${stats['age']}, iq=${stats['iq']}]`;
                    }
                }
            }
        }
    }

    fetch(
        'http://127.0.0.1:8888/api/v1/threads', {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(Object.keys(threadCommentsURL_commentsLinkElement_map)),
        }
    )
        .then(res => res.json())
        .then(res => updateDOM_threads(res));

    // POST all usernames detected on the current page to the endpoint.
    // It returns a response containing a list of
    // [{"<username>": {"age": "22", "iq": "120"}} ...] entries.
    fetch(
    	'http://127.0.0.1:8888/api/v1/users', {
    		method: 'POST',
    		headers: {
    			'Accept': 'application/json, text/plain, */*',
    			'Content-Type': 'application/json'
    		},
    		body: JSON.stringify(Object.keys(userName_linkElement_map)),
    	}
    )
    	.then(res => res.json())
    	.then(res => updateDOM_userNames(res));
}

// Executes every 1 second
window.setInterval(function () {
    run();
}, 10_000)
