import { jwtDecode } from "jwt-decode";
import lscache from "lscache";


export function apiAuthRequest(urlPath, type, accessToken, body) {
    return fetch(`${process.env.BASE_URL}${urlPath}`, {
            method: type,
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        }
    )
}


export function apiRequest(urlPath, type, body) {
    return fetch(`${process.env.BASE_URL}${urlPath}`, {
            method: type,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        }
    )
}


function createFilterTableContext(name, rowType, prefix, readOnly) {
    const span = prefix !== null ? `<span class="input-group-text">${prefix}</span>` : '';

    let input = document.createElement('input');
    input.type = 'text';
    input.classList.add('form-control', `${rowType}-filter`);
    input.id = 'filterContext';
    input.title = name;
    input.setAttribute('value', name);
    input.readOnly = readOnly;
    input.disabled = readOnly;

    return span + input.outerHTML;
}


function createFilterTableAge(value, rowType, readOnly) {
    let input = document.createElement('input');
    input.type = 'number';
    input.classList.add('form-control', `${rowType}-filter`);
    input.id = 'filterAge';
    input.setAttribute('value', value);
    input.readOnly = readOnly;
    input.disabled = readOnly;
    return input.outerHTML;
}


function createFilterTableIq(value, rowType, readOnly) {
    let input = document.createElement('input');
    input.type = 'number';
    input.classList.add('form-control', `${rowType}-filter`);
    input.id = 'filterIq';
    input.setAttribute('value', value);
    input.readOnly = readOnly;
    input.disabled = readOnly;
    return input.outerHTML;
}


function createFilterTableSentiment(value, rowType, readOnly) {
    let input = document.createElement('input');
    input.type = 'number';
    input.step = "0.001"
    input.classList.add('form-control', `${rowType}-filter`);
    input.id = 'filterSentiment';
    input.setAttribute('value', value);
    input.readOnly = readOnly;
    input.disabled = readOnly;
    return input.outerHTML;
}


function createFilterTableActionButton(rowType) {
    if (rowType === 'new') {
        return `<button type="button" class="btn btn-success" id="addFilterBtn"><i class="bi bi-plus-square"></i></button>`;
    } else if (rowType === 'custom') {
        return `<button type="button" class="btn btn-danger" name="deleteFilterBtn"><i class="bi bi-trash"></i></button>`;
    } else {
        return '';
    }
}


export function createFilterTableRow(context, age, iq, sentiment, rowType, readOnlyFields=[], includeActionBtn=true) {
    const contextInputPrefix = ['default', 'home'].includes(rowType) ? null : '/r/';
    const readonlyContext = readOnlyFields.includes('context');
    const readonlyAge = readOnlyFields.includes('age');
    const readonlyIq = readOnlyFields.includes('iq');
    const readonlySentiment = readOnlyFields.includes('sentiment');

    return `
        <tr>
            <th>
                <div class="input-group mb-3">
                    ${createFilterTableContext(context, rowType, contextInputPrefix, readonlyContext)}
                </div>
            </th>
            <th>
                <div class="input-group mb-3">
                    <span class="input-group-text">&gt=</span>
                    ${createFilterTableAge(age, rowType, readonlyAge)}
                </div>
            </th>
            <th>
                <div class="input-group mb-3">
                    <span class="input-group-text">&gt=</span>
                    ${createFilterTableIq(iq, rowType, readonlyIq)}
                </div>
            </th>
            <th>
                <div class="input-group mb-3">
                    <span class="input-group-text">&gt=</span>
                    ${createFilterTableSentiment(sentiment, rowType, readonlySentiment)}
                </div>
            </th>
            ${includeActionBtn ? `<th>${createFilterTableActionButton(rowType)}</th>` : ''}
        </tr>
    `;
}


export function jwtIsValid(token) {
    if (token === null) {
        return false;
    } else {
        const jwt = jwtDecode(token);
        return Date.now() < jwt.exp * 1000;
    }
}


export async function getAccessToken() {
    return browser.storage.local.get(['accessToken', 'refreshToken']).then(settings => {
        if (jwtIsValid(settings.accessToken)) {
            return settings.accessToken;
        } else if (jwtIsValid(settings.refreshToken)) {
            return apiRequest(
                '/api/v1/auth/token/refresh/',
                'post',
                {
                    'refresh': settings.refreshToken,
                }
            ).then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(response)
                }
            }).then(refreshJson => {
                return browser.storage.local.set({accessToken: refreshJson.access}).then(() => {
                    return refreshJson.access;
                });
            }).catch(error => {
                console.log(error);
            })
        } else {
            return browser.storage.local.set({accessToken: null, refreshToken: null}).then(() => {
                return null;
            });
        }
    })
}


export async function getApiStatus() {
    return apiRequest(
        '/api/v1/status/',
        'get',
    ).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(response)
        }
    })
}


export async function getContentFilter(url=null) {
    return browser.storage.local.get(['contentFilters']).then(settings => {
        function getFilterFromUrl(__url) {
            // this will be the subreddit name if we are viewing a sub or an empty string if viewing home
            const context = __url.pathname.split('/r/').at(-1).split('/')[0];

            if (context === '') {
                return settings.contentFilters.home;
            } else if (context in settings.contentFilters.custom) {
                return settings.contentFilters.custom[context];
            } else {
                return settings.contentFilters.default;
            }
        }

        if (url !== null) {
            return getFilterFromUrl(url);
        } else {
            return browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
                const _url = new URL(tabs[0].url);
                return getFilterFromUrl(_url);
            })
        }
    })
}


export async function getIgnoredRedditors(accessToken) {
    lscache.setBucket('api-data');
    lscache.flushExpired();
    let cachedIgnoredRedditorObjects = lscache.get('ignoredRedditors');

    if (cachedIgnoredRedditorObjects === null) {
        return apiAuthRequest(
            '/api/v1/reddit/redditors/ignored/',
            'GET',
            accessToken,
        ).then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(response)
            }
        }).then(ignoredRedditorObjects => {
            lscache.set('ignoredRedditors', ignoredRedditorObjects, 10080);
            return ignoredRedditorObjects;
        })
    }

    else {
        return cachedIgnoredRedditorObjects;
    }
}
