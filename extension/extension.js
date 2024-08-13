let userLinkElements = document.getElementsByClassName('author');

let userName_linkElement_map = {};

// Map each userName to an empty array
for (let el of userLinkElements) {
	userName_linkElement_map[el.innerText] = [];
}

// Append all the linkElements for each user's comments to that array.
// The user may have commented posted multiple times in the same thread.
for (let el of userLinkElements) {
	userName_linkElement_map[el.innerText].push(el);
}

// Take the response containing a list of [{"<username>": {"age": 1, "intelligence": "99%"}} ...]
// entries and create a new <span> element to insert after each username link that appears in
// the DOM.
function updateDOM(response) {
	 for (let [userName, linkElements] of Object.entries(userName_linkElement_map)) {
		 if (userName in response) {
			 const stats = response[userName];

			 for (let linkElement of linkElements) {
				 let statsSpan = document.createElement('span');
				 statsSpan.style.color = "yellow";
				 statsSpan.innerText = ` [age=${stats['age']}, iq=${stats['iq']}]`;
				 linkElement.parentElement.insertAdjacentElement("beforeend", statsSpan);
			 }
		 }
	 }
}

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
	.then(res => updateDOM(res));
