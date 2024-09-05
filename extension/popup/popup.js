function saveSettings(e) {
    e.preventDefault();

    browser.storage.local.set({
        enableThreadProcessing: document.getElementById("enableThreadProcessing").checked,
        enableUserProcessing: document.getElementById("enableUserProcessing").checked,
        hideBadJujuThreads: document.getElementById("hideBadJujuThreads").checked,
        minThreadSentiment: parseFloat(document.getElementById("minThreadSentiment").value),
        minUserAge: parseInt(document.getElementById("minUserAge").value),
        minUserIQ: parseInt(document.getElementById("minUserIQ").value)
    });

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


function createLoginForm(settings) {
    let loginForm = document.createElement('form');
    loginForm.setAttribute('id', 'loginForm');

    let usernameInput = document.createElement('input');
    usernameInput.setAttribute("placeholder", "Username");
    usernameInput.setAttribute('required', "");

    let passwordInput = document.createElement('input');
    passwordInput.setAttribute("placeholder", "Password");
    passwordInput.setAttribute("type", "password");
    passwordInput.setAttribute('required', "");

    let submitButton = document.createElement("button");
    submitButton.setAttribute("type", "submit");
    submitButton.innerText = "Login";

    loginForm.append(
        usernameInput,
        document.createElement("br"),
        passwordInput,
        document.createElement("br"),
        submitButton,
        document.createElement("hr"),
    )

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
                browser.storage.local.set({accessToken: responseJson.access_token});

                changeElementVisibility('loginForm', false);
                changeElementVisibility('signupForm', false);
                changeElementVisibility('settingsForm', true);
            })
            .catch(error => {
                let errorElement = document.createElement("p")
                errorElement.innerText = error;
                loginForm.prepend(errorElement);
            });
    })

    return loginForm;
}


function createSignupForm(settings) {
    let signupForm = document.createElement('form');
    signupForm.setAttribute('id', 'signupForm');

    let usernameInput = document.createElement('input');
    usernameInput.setAttribute("placeholder", "Username");

    let emailInput = document.createElement('input');
    emailInput.setAttribute("placeholder", "Email");
    emailInput.setAttribute("type", "email");

    let passwordInput = document.createElement('input');
    passwordInput.setAttribute("placeholder", "Password");
    passwordInput.setAttribute("type", "password");

    let signupButton = document.createElement("button");
    signupButton.setAttribute("type", "submit");
    signupButton.innerText = "Create Account";

    signupForm.append(
        usernameInput,
        document.createElement("br"),
        emailInput,
        document.createElement("br"),
        passwordInput,
        document.createElement("br"),
        signupButton,
    )

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
                username: usernameInput.value,
                email: emailInput.value,
                password: passwordInput.value,
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

                changeElementVisibility('loginForm', false);
                changeElementVisibility('signupForm', false);
                changeElementVisibility('settingsForm', true);
            })
            .catch(error => {
                let errorElement = document.createElement("p")
                errorElement.innerText = error;
                signupForm.prepend(errorElement);
            });
    })

    return signupForm;
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
            changeElementVisibility('settingsForm', false);
            const loginForm = createLoginForm(settings);
            const signupForm = createSignupForm(settings);
            document.body.append(loginForm, signupForm);
        }

        // Populate settings fields in the popup window to previously defined settings.
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

    let getting = browser.storage.local.get();
    getting.then(_loadPopup, onError);
}


document.addEventListener("DOMContentLoaded", loadPopup);
document.getElementById("settingsForm").addEventListener("submit", saveSettings);
