/* initialise variables */
console.log("App loading");
loadingDiv(true);

var inputUsername = document.querySelector('#username');
var inputPassword = document.querySelector('#password');
var inputLoginAddress = document.querySelector('#login-address');
var currentSite = undefined;
var currentTab = undefined;
var currentHost = undefined;
var authInfo = {}

chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
    let tab = tabs[0]
    var currentTabUrl = "";
    if (tab == undefined || tab.url == undefined) {
        currentTabUrl = 'https://google.com'
    } else {
        currentTabUrl = tab.url;
    }
    currentSite = new URL(currentTabUrl);
    currentTab = tabs[0];
    currentHost = currentSite.hostname;
    initialize();
});

var triggerAuthButton = document.getElementById("trigger-auth")
var logoutButton = document.getElementById("delete-auth")
var saveButton = document.getElementById('save-auth-btn');

saveButton.addEventListener('click', saveAuthInfoForCurrentSite);
logoutButton.addEventListener('click', logoutForCurrentSite);
triggerAuthButton.addEventListener('click', triggerAuth)

function onError(error) {
    console.log(error);
    loadingDiv(false);
}

var ff = "";
function initialize() {
    console.log("app starting..")
    console.log("currentSite: " + currentSite);
    document.querySelector('span.current-site-name').innerHTML = currentHost;
    chrome.storage.local.get(currentHost, function (savedItem) {
        console.log(savedItem);

        if (savedItem !== undefined && savedItem[currentHost] !== undefined && savedItem[currentHost].username !== undefined && savedItem[currentHost].password !== undefined) {
            authInfo = savedItem;
            clearLoginInputHideLoginShowLogout();
        }
    });
    document.querySelector("div.page-content").style.display = "block";
    loadingDiv(false);
}

function saveAuthInfoForCurrentSite() {
    console.log("credentials are saving")
    let username = inputUsername.value;
    let password = inputPassword.value;
    let loginUrl = inputLoginAddress.value;
    let gettingItem = browser.storage.local.get(currentHost);
    console.log("username: " + username + " password: ****");
    gettingItem.then((result) => {
        let objTest = Object.keys(result);
        if (objTest.length < 1 && username !== '' && password !== '' ||
            (objTest.length > 0 && objTest[currentHost] == undefined)) {
            let authRequestUrl = currentSite.origin + loginUrl;
            storeUserForSite(username, password, authRequestUrl);
        }
        clearLoginInputHideLoginShowLogout()
    }, onError);
}

function storeUserForSite(username, password, url) {
    authInfo[currentHost] = { "username": username, "password": password, "url": url };
    var storingUserInfo = browser.storage.local.set(authInfo);
    storingUserInfo.then(() => {
        triggerAuth();
    }, onError);
}

function logoutForCurrentSite() {
    showLoginHideLogout();
    authInfo[currentHost] = {}
    browser.storage.local.set(authInfo);
}

function clearLoginInputHideLoginShowLogout() {
    console.log(authInfo[currentHost].username);
    document.querySelector('span#auth-username').innerHTML = authInfo[currentHost].username;
    inputUsername.value = '';
    inputPassword.value = '';
    document.querySelector('.current-auth').classList.remove('hidden')
    document.querySelector('.login-form').classList.add('hidden');
}

function showLoginHideLogout() {
    document.querySelector('span#auth-username').innerHTML = "";
    document.querySelector('.login-form').classList.remove('hidden');
    document.querySelector('.current-auth').classList.add('hidden');
}

async function triggerAuth() {
    loadingDiv(true);
    var authResult = await fetch(authInfo[currentHost]["url"], {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({ "username": authInfo[currentHost]["username"], "password": authInfo[currentHost]["password"] })
    });

    if (authResult.status === 200) {
        authResult.json().then(function (response) {
            injectTokenToTab(response["data"]["token"])
        }).catch(function (error) {
            console.log(error)
        });
    } else {
        showLoginErrors(authResult.status + ":" + authResult.statusText);
    }
    loadingDiv(false);
}

function showLoginErrors(message) {
    document.getElementById('error-content').classList.remove('hidden');
    document.getElementById('error-message').innerHTML = message;
    setInterval(function () {
        document.getElementById('error-content').classList.add('hidden');
    }, 3000)
}

function injectTokenToTab(token) {
    let message = { token: token }
    chrome.tabs.sendMessage(currentTab.id, message, function (response) {
        console.log("token injected");
        loadingDiv(false);
    });

}

function loadingDiv(show) {
    if (show)
        document.querySelector('.loading-div').classList.remove('hidden');
    else
        document.querySelector('.loading-div').classList.add('hidden');
}

console.log("load complete");

