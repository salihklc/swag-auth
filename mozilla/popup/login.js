/* initialise variables */

var inputUsername = document.querySelector('#username');
var inputPassword = document.querySelector('#password');
var currentSite = window.location.origin;


var triggerAuthButton = document.getElementById("trigger-auth")
var logoutButton = document.getElementById("delete-auth")
var saveButton = document.querySelector('#save-auth-btn');

/*  add event listeners to buttons */
saveButton.addEventListener('click', saveAuthInfoForCurrentSite);
logoutButton.addEventListener('click', logoutForCurrentSite);
console.log("initializing");
/* generic error handler */
function onError(error) {
    console.log(error);
}

/* display previously-saved stored notes on startup */

initialize();

function initialize() {
    console.log("app starting..")
    console.log("currentSite is " + currentSite);
    var currentSiteAuthInfos = browser.storage.local.get(currentSite);
    if (currentSiteAuthInfos !== undefined) {
        console.log(currentSiteAuthInfos);
        hideLoginShowLogout();
    }
}

/* Add a note to the display, and storage */
function saveAuthInfoForCurrentSite() {
    console.log("credentials are saving")
    var username = inputUsername.value;
    var password = inputPassword.value;
    var gettingItem = browser.storage.local.get(currentSite);
    console.log("username: " + username + " password: ****");
    gettingItem.then((result) => {
        var objTest = Object.keys(result);
        if (objTest.length < 1 && username !== '' && password !== '') {
            clearLoginInputHideLoginShowLogout()
            storeUserForSite(username, password);
        }
    }, onError);
}

/* function to store a new note in storage */

function storeUserForSite(username, password) {
    var storingUserInfo = browser.storage.local.set(currentSite, { "username": username, "password": password });
    storingUserInfo.then(() => {
        triggerAuth(username, password);
    }, onError);
}

/* Clear storage, remove user label */
function logoutForCurrentSite() {
    ShowLoginHideLogout();
    browser.storage.local.set(currentSite, {});
}

function clearLoginInputHideLoginShowLogout() {
    document.querySelector('#current-auth-content > #"auth-username').value = inputUsername;
    inputUsername.value = '';
    inputPassword.value = '';
    document.querySelector('.login-form').classList.add('hidden');
    document.querySelector('.current-auth').classList.remove('hidden');
}

function ShowLoginHideLogout() {
    document.querySelector('#current-auth-content > #"auth-username').value = "";
    document.querySelector('.login-form').classList.remove('hidden');
    document.querySelector('.current-auth').classList.add('hidden');
}

function triggerAuth() {
    //Auth to swagger 
}

browser.tabs.executeScript({ file: "/content_scripts/auth.js" })
    .then(listenForClicks)
    .catch(reportExecuteScriptError);