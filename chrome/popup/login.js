/* initialise variables */
console.log("App started");
var inputUsername = document.querySelector('#username');
var inputPassword = document.querySelector('#password');
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

function onError(error) {
    console.log(error);
}

function initialize() {
    console.log("app starting..")
    console.log("currentSite: " + currentSite);
    document.querySelector('span.current-site-name').innerHTML = currentHost;
    chrome.storage.local.get(currentHost, function (savedItem) {
        console.log(savedItem);
        if (savedItem !== undefined) {
            authInfo = savedItem;
            clearLoginInputHideLoginShowLogout();
        }
    });
}

function saveAuthInfoForCurrentSite() {
    console.log("credentials are saving")
    var username = inputUsername.value;
    var password = inputPassword.value;
    var gettingItem = chrome.storage.local.get(currentHost);
    console.log("username: " + username + " password: ****");
    gettingItem.then((result) => {
        var objTest = Object.keys(result);
        if (objTest.length < 1 && username !== '' && password !== '') {
            storeUserForSite(username, password);
        }
        clearLoginInputHideLoginShowLogout()
    }, onError);
}

function storeUserForSite(username, password) {
    authInfo[currentHost] = { "username": username, "password": password };
    var storingUserInfo = chrome.storage.local.set(authInfo);
    storingUserInfo.then(() => {
        triggerAuth(username, password);
    }, onError);
}

function logoutForCurrentSite() {
    showLoginHideLogout();
    authInfo[currentHost] = {}
    chrome.storage.local.set({ authInfo });
}

function clearLoginInputHideLoginShowLogout() {
    console.log(inputUsername + " " + inputPassword + " " + authInfo[currentHost].username);
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

function triggerAuth(username, password) {
    //Auth to swagger 
    console.log("triggerAuth" + username + " " + password);
}

function injectScriptToTab() {
    chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        files: ['content_scripts/auth.js']
    });
}

console.log("App ended");