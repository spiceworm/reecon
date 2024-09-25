import '../scss/styles.scss';
import * as bootstrap from 'bootstrap';
import { createFilterTableRow } from "../../../src/js/util";


function rowInputsToObject(inputs, rowType) {
    return {
        context: inputs[0].value,
        age: parseInt(inputs[1].value),
        iq: parseInt(inputs[2].value),
        sentiment: parseFloat(inputs[3].value),
        type: rowType,
    }
}


function rowInputsToObjects(rows, rowType) {
    let rowObjects = [];
    for (let i = 0; i < rows.length; i += 4) {
        const rowInputs = rows.slice(i, i + 4);
        const rowObject = rowInputsToObject(rowInputs, rowType);
        rowObjects.push(rowObject);
    }
    return rowObjects;
}


function addSettingsRow(element) {
    let newValuesRow = element.target.closest('tr');
    const inputs = [...newValuesRow.getElementsByTagName('input')];

    let contentFilterTableBody = document.getElementById("contentFilterTable").getElementsByTagName('tbody')[0];
    let contentFilterTableAddRowBody = document.getElementById("contentFilterTableAddRow").getElementsByTagName('tbody')[0];

    let customFilterRow = contentFilterTableBody.insertRow();
    const customFilter = rowInputsToObjects(inputs, 'custom')[0];
    customFilterRow.innerHTML = createFilterTableRow(
        customFilter.context,
        customFilter.age,
        customFilter.iq,
        customFilter.sentiment,
        customFilter.type,
    );
    customFilterRow.getElementsByTagName('button')[0].addEventListener('click', deleteSettingsRow);

    // delete row so it can be recreated below using the default values
    newValuesRow.remove();

    browser.storage.local.get(['contentFilters']).then(settings => {
        let addFilterRow = contentFilterTableAddRowBody.insertRow();
        addFilterRow.innerHTML = createFilterTableRow(
            '',
            settings.contentFilters.default.age,
            settings.contentFilters.default.iq,
            settings.contentFilters.default.sentiment,
            "new",
        );
    })
}


function deleteSettingsRow(element) {
    let row = element.target.closest('tr');
    row.remove();
}


function saveSettings() {
    const table = document.getElementById('contentFilterTable');

    const customFilterSettingsInputs = [...table.getElementsByClassName('custom-filter')];
    const defaultFilterSettingsInputs = [...table.getElementsByClassName('default-filter')];
    const homeFilterSettingsInputs = [...table.getElementsByClassName('home-filter')];

    let customFilterSettings = {}
    for (const filter of rowInputsToObjects(customFilterSettingsInputs, 'custom')) {
        customFilterSettings[filter.context] = filter;
    }

    const defaultFilterSettings = rowInputsToObjects(defaultFilterSettingsInputs, 'default')[0];
    const homeFilterSettings = rowInputsToObjects(homeFilterSettingsInputs, 'home')[0];

    browser.storage.local.set({
        contentFilters: {
            custom: customFilterSettings,
            default: defaultFilterSettings,
            home: homeFilterSettings,
        }
    }).then(() => {
        browser.tabs.reload().then()
    })
}


async function showSettings(settings) {
    let contentFilterTableBody = document.getElementById("contentFilterTable").getElementsByTagName('tbody')[0];
    let contentFilterTableAddRowBody = document.getElementById("contentFilterTableAddRow").getElementsByTagName('tbody')[0];

    let defaultFilterRow = contentFilterTableBody.insertRow();
    defaultFilterRow.innerHTML = createFilterTableRow(
        settings.contentFilters.default.context,
        settings.contentFilters.default.age,
        settings.contentFilters.default.iq,
        settings.contentFilters.default.sentiment,
        settings.contentFilters.default.type,
        ['context']
    );

    let homeFilterRow = contentFilterTableBody.insertRow();
    homeFilterRow.innerHTML = createFilterTableRow(
        settings.contentFilters.home.context,
        settings.contentFilters.home.age,
        settings.contentFilters.home.iq,
        settings.contentFilters.home.sentiment,
        settings.contentFilters.home.type,
        ['context']
    );

    for (const filter of Object.values(settings.contentFilters.custom)) {
        let customFilterRow = contentFilterTableBody.insertRow();
        customFilterRow.innerHTML = createFilterTableRow(
            filter.context,
            filter.age,
            filter.iq,
            filter.sentiment,
            filter.type,
        );
    }

    let newFilterRow = contentFilterTableAddRowBody.insertRow();
    newFilterRow.innerHTML = createFilterTableRow(
        '',
        settings.contentFilters.default.age,
        settings.contentFilters.default.iq,
        settings.contentFilters.default.sentiment,
        "new",
    );
}


function loadSettings() {
    browser.storage.local.get(['contentFilters'])
        .then(settings => showSettings(settings))
        .then(() => {
            document.getElementById('addFilterBtn').addEventListener('click', addSettingsRow);
            document.getElementsByName('deleteFilterBtn').forEach((element) => {
                element.addEventListener('click', deleteSettingsRow);
            })
            document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
        });
}


if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSettings, { once: true });
}
