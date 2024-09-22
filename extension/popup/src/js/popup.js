import '../scss/styles.scss';
import * as bootstrap from 'bootstrap';
import { apiRequest, getAccessToken, getApiStatus } from "../../../src/js/util";


function saveSettings() {
    browser.storage.local.set({
        disableExtension: document.getElementById("disableExtension").checked || false,
        enableRedditorProcessing: document.getElementById("enableRedditorProcessing").checked || false,
        enableThreadProcessing: document.getElementById("enableThreadProcessing").checked || false,
        hideBadJujuThreads: document.getElementById("hideBadJujuThreads").checked || false,
        minThreadSentiment: parseFloat(document.getElementById("minThreadSentiment").value || '0.05'),
        minUserAge: parseInt(document.getElementById("minUserAge").value || '0'),
        minUserIQ: parseInt(document.getElementById("minUserIQ").value || '0')
    });
}


function changeElementVisibility(element_id, visible) {
    let element = document.getElementById(element_id);
    if (visible) {
        element.style.display = 'block';
    } else {
        element.style.display = 'none';
    }
}


function createAlert(message, alertClass, clear = false) {
    // Delete existing alerts
    if (clear) {
        document.querySelectorAll(".alert").forEach(el => el.remove());
    }

    let alertDiv = document.createElement("div");
    alertDiv.classList.add("alert", alertClass);
    alertDiv.setAttribute("role", "alert");
    alertDiv.innerText = message;
    return alertDiv;
}


function createAlerts(messages, alertClass, clear = false) {
    // Delete existing alerts
    if (clear) {
        document.querySelectorAll(".alert").forEach(el => el.remove());
    }

    let alertDivs = [];
    for (let message of messages) {
        const alertDiv = createAlert(message, alertClass);
        alertDivs.push(alertDiv);
    }
    return alertDivs;
}


function displayStatusMessages(messages, alertClass = "alert-info") {
    let alertsContainer = document.getElementById("alertsContainer");
    for (let alertDiv of createAlerts(messages, alertClass, true)) {
        alertsContainer.prepend(alertDiv);
    }
}


function showLoginForm() {
    changeElementVisibility("signupForm", false);
    changeElementVisibility("settingsForm", false);
    changeElementVisibility("loginForm", true);

    let loginForm = document.getElementById("loginForm");
    const loginUsername = document.getElementById("loginUsername");
    const loginPassword = document.getElementById("loginPassword");
    const signupNavButton = document.getElementById("signupNavButton");

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        apiRequest(
            '/api/v1/auth/token/',
            'post',
            {
                username: loginUsername.value,
                password: loginPassword.value,
            }
        ).then(response => {
            if (response.ok) {
                return response.json();
            } else if (response.status === 401) {
                response.json().then(invalidCredentialsResponse => {
                    loginForm.prepend(
                        createAlert(invalidCredentialsResponse.detail, "alert-danger", true)
                    );
                })
            } else {
                loginForm.prepend(
                    createAlert(
                        `${response.status} error occurred when attempting to login.`,
                        "alert-danger",
                        true,
                    )
                );
                throw new Error(response);
            }
        }).then(respJson => {
            browser.storage.local.set({
                accessToken: respJson.access,
                refreshToken: respJson.refresh,
            }).then(() => {
                showSettingsForm();
            });
        }).catch(error => {
            console.log(error);
        });
    })

    signupNavButton.addEventListener("click", (e) => {
        showSignupForm();
    })
}


function showSignupForm() {
    changeElementVisibility("loginForm", false);
    changeElementVisibility("settingsForm", false);
    changeElementVisibility("signupForm", true);

    let signupForm = document.getElementById("signupForm");
    const signupUsername = document.getElementById("signupUsername");
    const signupEmail = document.getElementById("signupEmail");
    const signupPassword = document.getElementById("signupPassword");
    const loginNavButton = document.getElementById("loginNavButton");

    signupForm.addEventListener("submit", (e) => {
        e.preventDefault();

        apiRequest(
            '/api/v1/auth/signup/',
            'post',
            {
                username: signupUsername.value,
                email: signupEmail.value,
                password: signupPassword.value,
            }
        ).then(signupResponse => {
            if (signupResponse.ok) {
                return signupResponse.json();
            } else if (signupResponse.status === 400) {
                signupResponse.json().then(invalidSignupResponse => {
                    signupForm.prepend(
                        createAlert(invalidSignupResponse.detail, "alert-danger", true)
                    );
                })
            } else {
                signupForm.prepend(
                    createAlert(
                        `${signupResponse.status} error occurred when attempting to signup.`,
                        "alert-danger",
                        true,
                    )
                );
                throw new Error(signupResponse)
            }
        }).then(signupJson => {
            apiRequest(
                '/api/v1/auth/token/',
                'post',
                {
                    username: signupUsername.value,
                    password: signupPassword.value,
                }
            ).then(tokenResponse => {
                if (tokenResponse.ok) {
                    return tokenResponse.json();
                } else {
                    signupForm.prepend(
                        createAlert(
                            `${tokenResponse.status} error occurred when fetching JWT.`,
                            "alert-danger",
                            true,
                        )
                    );
                    throw new Error(tokenResponse)
                }
            }).then(tokenJson => {
                browser.storage.local.set({
                    accessToken: tokenJson.access,
                    refreshToken: tokenJson.refresh,
                    username: signupJson.username,
                }).then(() => {
                    showSettingsForm();
                });
            })
        }).catch(error => {
            console.log(error);
        });
    })

    loginNavButton.addEventListener("click", (e) => {
        showLoginForm();
    })
}


function showSettingsForm() {
    browser.storage.local.get().then(settings => {
        changeElementVisibility("loginForm", false);
        changeElementVisibility("signupForm", false);
        changeElementVisibility("settingsForm", true);

        let disableExtension = document.getElementById("disableExtension");
        let enableRedditorProcessing = document.getElementById("enableRedditorProcessing");
        let enableThreadProcessing = document.getElementById("enableThreadProcessing");
        let hideBadJujuThreads = document.getElementById("hideBadJujuThreads");
        let minThreadSentiment = document.getElementById("minThreadSentiment");
        let minUserAge = document.getElementById("minUserAge");
        let minUserIQ = document.getElementById("minUserIQ");

        let options = [
            enableRedditorProcessing,
            enableThreadProcessing,
            hideBadJujuThreads,
            minThreadSentiment,
            minUserAge,
            minUserIQ
        ];

        disableExtension.onchange = function(e) {
            // Enable / disable option when disableExtension is checked
            for (let option of options) {
                option.disabled = e.target.checked;
            }
        };

        disableExtension.checked = settings.disableExtension;
        enableRedditorProcessing.checked = settings.enableRedditorProcessing;
        enableThreadProcessing.checked = settings.enableThreadProcessing;
        hideBadJujuThreads.checked = settings.hideBadJujuThreads;
        minThreadSentiment.value = settings.minThreadSentiment;
        minUserAge.value = settings.minUserAge;
        minUserIQ.value = settings.minUserIQ;

        // Enable / disable option when settings page is shown
        for (let option of options) {
            option.disabled = disableExtension.checked;
        }
    })
}


function loadPopup() {
    getApiStatus().then(statusJson => {
        displayStatusMessages(statusJson.messages);

        getAccessToken().then(accessToken => {
            if (accessToken === null) {
                showLoginForm();
            } else {
                showSettingsForm();
            }
        })
    }).catch(error => {
        displayStatusMessages(
            [`Unable to contact server at ${process.env.BASE_URL}`],
            "alert-danger",
            );
        console.log(error);
    })
}


if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadPopup, { once: true });
}


// Automatically save settings when the popup is closed.
// Saving the settings triggers a `browser.storage.onChanged` event in background.js which causes the extension to run.
window.addEventListener("unload", function(){
    // Only save settings if the settingsForm is visible.
    if (document.getElementById('settingsForm').style.display === 'block') {
        saveSettings();
    }
});


// Close the popup if the settings form is visible and the user presses the Enter key.
// This will trigger an 'unload' event causing the settings to be saved.
// Saving the settings triggers a `browser.storage.onChanged` event in background.js which causes the extension to run.
window.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        if (document.getElementById('settingsForm').style.display === 'block') {
            window.close();
        }
    }
});
