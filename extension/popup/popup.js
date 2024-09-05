function saveSettings() {
    browser.storage.local.set({
        enableThreadProcessing: document.getElementById("enableThreadProcessing").checked,
        enableUserProcessing: document.getElementById("enableUserProcessing").checked,
        hideBadJujuThreads: document.getElementById("hideBadJujuThreads").checked,
        minThreadSentiment: parseFloat(document.getElementById("minThreadSentiment").value),
        minUserAge: parseInt(document.getElementById("minUserAge").value),
        minUserIQ: parseInt(document.getElementById("minUserIQ").value)
    });
}

// TODO: Replace this with jwt-decode package
//
function parseJwt (token) {
    let base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}


function accessTokenIsValid(accessToken) {
    const jwt = parseJwt(accessToken);
    return Date.now() < jwt.exp * 1000;
}


function changeElementVisibility(element_id, visible) {
    let element = document.getElementById(element_id);
    if (visible) {
        element.style.display = 'block';
    } else {
        element.style.display = 'none';
    }
}


function makeAlert(message) {
    // Delete existing alerts
    for (let el of document.getElementsByClassName("alert")) {
        el.remove();
    }

    let alertDiv = document.createElement("div");
    alertDiv.classList.add("alert", "alert-danger");
    alertDiv.setAttribute("role", "alert");
    alertDiv.innerText = message;
    return alertDiv;
}


function showLoginForm(settings) {
    changeElementVisibility("signupForm", false);
    changeElementVisibility("settingsForm", false);
    changeElementVisibility("loginForm", true);

    let loginForm = document.getElementById("loginForm");
    const loginUsername = document.getElementById("loginUsername");
    const loginPassword = document.getElementById("loginPassword");
    const signupNavButton = document.getElementById("signupNavButton");

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        let form = new FormData();
        form.append('username', loginUsername.value);
        form.append('password', loginPassword.value);
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
                browser.storage.local.set({accessToken: responseJson.access_token});
                showSettingsForm(settings);
            })
            .catch(error => {
                loginForm.prepend(makeAlert(error));
            });
    })

    signupNavButton.addEventListener("click", (e) => {
        showSignupForm(settings);
    })
}


function showSignupForm(settings) {
    changeElementVisibility("loginForm", false);
    changeElementVisibility("settingsForm", false);
    changeElementVisibility("signupForm", true);
    const loginNavButton = document.getElementById("loginNavButton");

    let signupForm = document.getElementById("signupForm");
    const signupUsername = document.getElementById("signupUsername");
    const signupEmail = document.getElementById("signupEmail");
    const signupPassword = document.getElementById("signupPassword");

    signupForm.addEventListener("submit", (e) => {
        e.preventDefault();

        // Manually submit the login form so we can grab the token from the response.
        fetch(`${settings.baseUrl}/auth/signup`, {
            method: "post",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: signupUsername.value,
                email: signupEmail.value,
                password: signupPassword.value,
            }),
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
                browser.storage.local.set({accessToken: responseJson.access_token});
                showSettingsForm(settings);
            })
            .catch(error => {
                signupForm.prepend(makeAlert(error));
            });
    })

    loginNavButton.addEventListener("click", (e) => {
        showLoginForm(settings);
    })
}

function showSettingsForm(settings) {
    changeElementVisibility("loginForm", false);
    changeElementVisibility("signupForm", false);
    changeElementVisibility("settingsForm", true);

    document.getElementById("enableThreadProcessing").checked = settings.enableThreadProcessing;
    document.getElementById("enableUserProcessing").checked = settings.enableUserProcessing;
    document.getElementById("hideBadJujuThreads").checked = settings.hideBadJujuThreads;
    document.getElementById("minThreadSentiment").value = settings.minThreadSentiment;
    document.getElementById("minUserAge").value = settings.minUserAge;
    document.getElementById("minUserIQ").value = settings.minUserIQ;
}


function loadPopup() {
    async function _loadPopup(settings) {
        let accessToken = settings.accessToken;

        if (accessToken !== null) {
            if (!(accessTokenIsValid(accessToken))) {
                accessToken = null;
                browser.storage.local.set({accessToken: accessToken});
            }
        }

        if (accessToken === null) {
            showLoginForm(settings);
        } else {
            showSettingsForm(settings);
        }
    }

    async function onError(error) {
        console.log(`Error: ${error}`);
    }

    let getting = browser.storage.local.get();
    getting.then(_loadPopup, onError);
}

// Automatically save settings when the popup is closed
window.addEventListener("unload", function(){
    saveSettings()
});

document.addEventListener("DOMContentLoaded", loadPopup);
