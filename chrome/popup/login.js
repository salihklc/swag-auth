/* initialise variables */
console.log("App loading");
var inputUsername = document.querySelector('#username');
var inputPassword = document.querySelector('#password');
var inputLoginAddress = document.querySelector('#login-address');
var currentAuthDropdown = document.getElementById("current-auth-dropdown")
var refreshAuth = document.getElementById("refresh-auth")
var logoutButton = document.getElementById("delete-auth")
var loginButton = document.getElementById('login-btn');
var copyToClipboardButton = document.querySelector('#copy-to-clipboard');
var backToLogin = document.getElementById("back-to-login");

var currentSite = undefined;
var currentTab = undefined;
var currentHost = undefined;
var currentToken = undefined;
var authInfoGlobal = {}
var appBrowserGlobal = undefined;
var selectedAuth = undefined;


loginButton.addEventListener('click', authAndSaveUserInfo);
logoutButton.addEventListener('click', removeSelectedUser);
refreshAuth.addEventListener('click', triggerAuth)
copyToClipboardButton.addEventListener('click', copyToClipboard)
currentAuthDropdown.addEventListener('change', authUserDropDownChanged)
backToLogin.addEventListener('click', backToLoginClicked)

function appStart() {
    try {
        loadingDiv(true);
        appBrowserGlobal = chrome;
        initialize();
    } catch (e) {
        onError(e)
    }
}

function initialize() {
    setCurrentHost(startAppByState)
}

function startAppByState() {
    appBrowserGlobal.storage.local.get(currentHost, function (result) {
        savedItem = result[currentHost];
        if (savedItem !== undefined && Object.keys(savedItem).length !== 0) {
            authInfoGlobal = savedItem;
            renderCurrentAuthDropdown();
            clearAndHideLoginShowLogout();
        }
    });
    document.querySelector("div.page-content").classList.remove('hidden');
    loadingDiv(false);
}

function setCurrentHost(callback) {
    appBrowserGlobal.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
        let tab = tabs[0]
        var currentTabUrl = "";
        if (tab == undefined || tab.url == undefined) {
            currentTabUrl = 'https://google.com'
        } else {
            currentTabUrl = tab.url;
        }
        currentSite = new URL(currentTabUrl);
        currentTab = tab;
        currentHost = currentSite.hostname;
        document.querySelector('span.current-site-name').textContent = currentHost;
        callback()
    });
}

function onError(error) {
    console.log(error);
    loadingDiv(false);
}

function authAndSaveUserInfo() {
    let authRequestUrl = currentSite.origin + inputLoginAddress.value;
    let gettingItem = appBrowserGlobal.storage.local.get(currentHost);

    gettingItem.then((result) => {
        savedItem = result[currentHost];

        if (savedItem[inputUsername.value] === undefined) {
            authInfoGlobal[inputUsername.value] = {
                "username": inputUsername.value,
                "password": inputPassword.value,
                "url": authRequestUrl,
                "token": ""
            };
            selectedAuth = inputUsername.value;
            triggerAuth();
        }
    }, onError);
}

function removeSelectedUser() {
    authInfoGlobal[selectedAuth] = undefined
    delete authInfoGlobal[selectedAuth]
    storeUserForSite()
    if (authInfoGlobal.length < 0)
        showLoginHideLogout();
}

function clearAndHideLoginShowLogout() {
    inputUsername.value = '';
    inputPassword.value = '';
    document.querySelector('.current-auth-content').classList.remove('hidden')
    document.querySelector('.login-content').classList.add('hidden');
}

function showLoginHideLogout() {
    document.querySelector('.login-content').classList.remove('hidden');
    document.querySelector('.current-auth-content').classList.add('hidden');
}

function authUserDropDownChanged() {
    selectedAuth = currentAuthDropdown.value;
    triggerAuth()
}

function backToLoginClicked() {
    showLoginHideLogout();
}

async function triggerAuth() {
    loadingDiv(true);
    let authUserInfo = authInfoGlobal[selectedAuth];

    if (authUserInfo == undefined) {
        showMessages("No valid auth selected, you can remove the selected auth from the dropdown")
        loadingDiv(false);
        return
    }

    await fetch(authUserInfo["url"], {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({ "username": authUserInfo["username"], "password": authUserInfo["password"] })
    })
        .then(response => {
            if (response.status == 200) {
                return response.json();
            }
            return response.json().then(res => { throw new Error(res.message) });
        })
        .then(response => {
            authUserInfo["token"] = response["data"]["token"];
            storeUserForSite();
            injectTokenToTab(response["data"]["token"])
            clearAndHideLoginShowLogout();
        })
        .catch((error) => {
            console.log(error);
            showMessages(error.message);
        });

    loadingDiv(false);
}

async function copyToClipboard() {
    if (currentToken != undefined) {
        await navigator.clipboard.writeText(currentToken).then(() => {
            showMessages("token copied to clipboard")
        });
    } else {
        showMessages("cannot copy to clipboard")
    }
}

function showMessages(message) {
    document.getElementById('error-content').classList.remove('hidden');
    document.getElementById('error-message').innerHTML = message;
    setTimeout(function () {
        document.getElementById('error-content').classList.add('hidden');
    }, 3000)
}

function storeUserForSite() {
    let objToStoreBySiteName = {};
    objToStoreBySiteName[currentHost] = authInfoGlobal;
    var storingUserInfo = appBrowserGlobal.storage.local.set(objToStoreBySiteName);
    storingUserInfo.then(() => {
        renderCurrentAuthDropdown()
    }, onError);
}

function renderCurrentAuthDropdown() {
    var dropDown = document.getElementById("current-auth-dropdown");
    currentSelectedValue = selectedAuth;
    while (dropDown.options.length) {
        dropDown.remove(0);
    }
    for (var user in authInfoGlobal) {
        var option = document.createElement("option");
        option.text = user;
        dropDown.add(option);
    }
    if (currentSelectedValue != undefined)
        currentAuthDropdown.value = currentSelectedValue;
    else
        currentAuthDropdown.value = dropDown.options[0].value
}

function injectTokenToTab(token) {
    let message = { token: token }
    currentToken = token
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
