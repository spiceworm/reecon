function saveSettings(e) {
    e.preventDefault();

    browser.storage.sync.set({
        baseUrl: document.getElementById("baseUrl").value,
        enableThreadProcessing: document.getElementById("enableThreadProcessing").checked,
        enableUserProcessing: document.getElementById("enableUserProcessing").checked,
        hideBadJujuThreads: document.getElementById("hideBadJujuThreads").checked,
        minThreadSentiment: parseFloat(document.getElementById("minThreadSentiment").value),
        minUserAge: parseInt(document.getElementById("minUserAge").value),
        minUserIQ: parseInt(document.getElementById("minUserIQ").value)
    });

    // Close the settings popup window
    window.close();
}


async function testAccessToken(baseUrl, accessToken) {
    return fetch(`${baseUrl}/auth/token`, {
        method: 'get',
        headers: new Headers({
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        })
    }).then((response) => {
        return response.ok;
    })
}


function loadPopup() {
    async function _loadPopup(settings) {
        let accessToken = settings.accessToken;

        if (accessToken !== null) {
            if (!(await testAccessToken(settings.baseUrl, settings.accessToken))) {
                accessToken = null;
                browser.storage.sync.set({accessToken: accessToken});
            }
        }

        if (accessToken === null) {
            // Hide settings form which is shown by default.
            let settingsForm = document.getElementById('settingsForm');
            settingsForm.style.display = 'none';

            // Create login form.
            let loginForm = document.createElement('form');

            let usernameInput = document.createElement('input');
            usernameInput.setAttribute("placeholder", "Username");

            let passwordInput = document.createElement('input');
            passwordInput.setAttribute("placeholder", "Password");

            let submitButton = document.createElement("button");
            submitButton.setAttribute("type", "submit");
            submitButton.innerText = "Submit";

            loginForm.append(
                usernameInput,
                document.createElement("br"),
                passwordInput,
                document.createElement("br"),
                submitButton,
            )

            // Inject login form into the popup.
            document.body.appendChild(loginForm);

            // Make it so you can start typing username as soon as popup appears without having
            // to click inside the input field.
            usernameInput.focus();

            loginForm.addEventListener("submit", (e) => {
                e.preventDefault();

                let form = new FormData();
                form.append('username', usernameInput.value);
                form.append('password', passwordInput.value);
                form.append('grant_type', 'password');

                // Manually submit the login form so we can grab the token from the response.
                fetch(`${settings.baseUrl}/auth/token`, {
                    method: "post",
                    body: form,
                })
                    .then((response) => {
                        if (response.ok) {
                            return response.json();
                        } else if (response.status === 401) {
                            throw new Error("Invalid login credentials");
                        } else {
                            throw new Error(`${response.status} status code`);
                        }
                    })
                    .then((responseJson) => {
                        // Save the token from the response.
                        browser.storage.sync.set({accessToken: responseJson.access_token});

                        // Hide the login form since it is no longer needed.
                        loginForm.style.display = 'none';

                        // Make the settings form visible again.
                        settingsForm.style.display = 'block';
                    })
                    .catch(error => {
                        loginForm.innerText = error;
                    });
            })
        }

        // Populate settings fields in the popup window to previously defined settings.
        document.getElementById("baseUrl").value = settings.baseUrl;
        document.getElementById("enableThreadProcessing").checked = settings.enableThreadProcessing;
        document.getElementById("enableUserProcessing").checked = settings.enableUserProcessing;
        document.getElementById("hideBadJujuThreads").checked = settings.hideBadJujuThreads;
        document.getElementById("minThreadSentiment").value = settings.minThreadSentiment;
        document.getElementById("minUserAge").value = settings.minUserAge;
        document.getElementById("minUserIQ").value = settings.minUserIQ;
    }

    async function onError(error) {
        console.log(`Error: ${error}`);
    }

    let getting = browser.storage.sync.get();
    getting.then(_loadPopup, onError);
}


document.addEventListener("DOMContentLoaded", loadPopup);
document.getElementById("settingsForm").addEventListener("submit", saveSettings);
