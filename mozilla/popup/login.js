/* initialise variables */
console.log("App loading");
loadingDiv(true);

var inputUsername = document.querySelector('#username');
var inputPassword = document.querySelector('#password');
var inputLoginAddress = document.querySelector('#login-address');
var currentSite = undefined;
var currentTab = undefined;
var currentHost = undefined;
var authInfoGlobal = {}
var appBrowserGlobal = undefined;


function appStart() {
    try {
        appBrowserGlobal = browser;
        appBrowserGlobal.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
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
    } catch (e) {
        onError(e)
    }
}

var triggerAuthButton = document.getElementById("trigger-auth")
var logoutButton = document.getElementById("delete-auth")
var saveButton = document.getElementById('save-auth-btn');

saveButton.addEventListener('click', authAndSaveUserInfo);
logoutButton.addEventListener('click', logoutForCurrentSite);
triggerAuthButton.addEventListener('click', triggerAuth)

function onError(error) {
    console.log(error);
    loadingDiv(false);
}

function initialize() {
    document.querySelector('span.current-site-name').innerHTML = currentHost;
    appBrowserGlobal.storage.local.get(currentHost, function (savedItem) {
        console.log(savedItem);

        if (savedItem !== undefined && savedItem[currentHost] !== undefined && savedItem[currentHost].username !== undefined && savedItem[currentHost].password !== undefined) {
            authInfoGlobal = savedItem;
            clearLoginInputHideLoginShowLogout();
        }
    });
    document.querySelector("div.page-content").style.display = "block";
    loadingDiv(false);
}

function authAndSaveUserInfo() {
    let authRequestUrl = currentSite.origin + inputLoginAddress.value;
    let gettingItem = appBrowserGlobal.storage.local.get(currentHost);

    gettingItem.then((result) => {
        let objTest = Object.keys(result);
        if (objTest.length < 1 && username !== '' && password !== '' || (objTest.length > 0 && objTest[currentHost] == undefined)) {
            authInfoGlobal[currentHost] = {
                "username": inputUsername.value,
                "password": inputPassword.value,
                "url": authRequestUrl
            };
            triggerAuth();
        }
    }, onError);
}

function logoutForCurrentSite() {
    showLoginHideLogout();
    authInfoGlobal[currentHost] = {}
    appBrowserGlobal.storage.local.set(authInfoGlobal);
}

function clearLoginInputHideLoginShowLogout() {
    document.querySelector('span#auth-username').innerHTML = authInfoGlobal[currentHost].username;
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

    await fetch(authInfoGlobal[currentHost]["url"], {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({ "username": authInfoGlobal[currentHost]["username"], "password": authInfoGlobal[currentHost]["password"] })
    })
        .then(response => {
            if (response.status == 200) {
                return response.json();
            }
            return response.json().then(res => { throw new Error(res.message) });
        })
        .then(response => {
            storeUserForSite();
            injectTokenToTab(response["data"]["token"])
            clearLoginInputHideLoginShowLogout();
        })
        .catch((error) => {
            console.log(error);
            showLoginErrors(error.message);
        });

    loadingDiv(false);
}

function showLoginErrors(message) {
    document.getElementById('error-content').classList.remove('hidden');
    document.getElementById('error-message').innerHTML = message;
    setTimeout(function () {
        document.getElementById('error-content').classList.add('hidden');
    }, 3000)
}


function storeUserForSite() {
    var storingUserInfo = appBrowserGlobal.storage.local.set(authInfoGlobal);
    storingUserInfo.then(() => {
        console.log("user info stored");
    }, onError);
}

function injectTokenToTab(token) {
    let message = { token: token }
    appBrowserGlobal.tabs.sendMessage(currentTab.id, message, function (response) {
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
appStart();
