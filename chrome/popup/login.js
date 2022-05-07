/* initialise variables */
console.log("App loading");
loadingDiv(true);

var inputUsername = document.querySelector('#username');
var inputPassword = document.querySelector('#password');
var inputLoginAddress = document.querySelector('#login-address');
var currentAuthDropdown = document.getElementById("current-auth-dropdown")
var refreshAuth = document.getElementById("refresh-auth")
var logoutButton = document.getElementById("delete-auth")
var loginButton = document.getElementById('login-btn');
var copyToClipboardButton = document.querySelector('#copy-to-clipboard');

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

function appStart() {
    try {
        appBrowserGlobal = chrome;
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

function initialize() {
    document.querySelector('span.current-site-name').textContent = currentHost;
    appBrowserGlobal.storage.local.get(currentHost, function (savedItem) {
        console.log(savedItem);
        if (savedItem !== undefined && savedItem[currentHost] !== undefined) {
            authInfoGlobal = savedItem;
            renderCurrentAuthDropdown();
            clearAndHideLoginShowLogout();
        }
    });
    document.querySelector("div.page-content").style.display = "block";
    loadingDiv(false);
}

function onError(error) {
    console.log(error);
    loadingDiv(false);
}

function authAndSaveUserInfo() {
    let authRequestUrl = currentSite.origin + inputLoginAddress.value;
    let gettingItem = appBrowserGlobal.storage.local.get(currentHost);

    gettingItem.then((result) => {
        let objTest = Object.keys(result);
        if (objTest.length < 1 && username !== '' && password !== '' || (objTest.length > 0 && objTest[currentHost] == undefined)) {
            authInfoGlobal[currentHost][inputUsername.value] = {
                "username": inputUsername.value,
                "password": inputPassword.value,
                "url": authRequestUrl,
                "token": ""
            };
            selectedAuth = authInfoGlobal[currentHost][inputUsername.value];
            triggerAuth();
        }
    }, onError);
}

function removeSelectedUser() {
    showLoginHideLogout();
    delete authInfoGlobal[currentHost][selectedAuth]
    let dbSetCallBack = appBrowserGlobal.storage.local.set(authInfoGlobal);
    dbSetCallBack.then(() => {
        renderCurrentAuthDropdown()
    }, onError);
}

function clearAndHideLoginShowLogout() {
    inputUsername.value = '';
    inputPassword.value = '';
    document.querySelector('.current-auth-content').classList.remove('hidden')
    document.querySelector('.login-form').classList.add('hidden');
}

function showLoginHideLogout() {
    document.querySelector('.login-form').classList.remove('hidden');
    document.querySelector('.current-auth-content').classList.add('hidden');
}

function authUserDropDownChanged() {
    selectedAuth = currentAuthDropdown.value;
    triggerAuth()
}

async function triggerAuth() {
    loadingDiv(true);
    let authUserInfo = authInfoGlobal[currentHost][selectedAuth];
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
    authInfoGlobal[currentHost][selectedAuth] = selectedAuth;
    var storingUserInfo = appBrowserGlobal.storage.local.set(authInfoGlobal);
    storingUserInfo.then(() => {
        renderCurrentAuthDropdown()
    }, onError);
}

function renderCurrentAuthDropdown() {
    var dropDown = document.getElementById("current-auth-dropdown");
    while (dropDown.options.length) {
        dropDown.remove(0);
    }
    for (var user in authInfoGlobal[currentHost]) {
        var option = document.createElement("option");
        option.text = user;
        dropDown.add(option);
    }
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
