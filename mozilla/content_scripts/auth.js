console.log("app loaded")
var contentToken = ""

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    // Handle message.
    // In this example, message === 'whatever value; String, object, whatever'
    console.log(message);
    console.log(sender);
    console.log(sendResponse);
    if (message["token"] != undefined) {
        contentToken = message["token"];
        login();
    }
});

function login() {
    logoutOldSwagger();
    addTokenToInput();

}

function logoutOldSwagger() {
    let logoutModalBtn = document.querySelector(".btn.authorize.locked");
    if (logoutModalBtn != null && logoutModalBtn != undefined) {
        logoutModalBtn.click();
    }

    let logoutButton = document.querySelector(".btn.modal-btn.auth.button");
    if (logoutButton != null && logoutButton != undefined) {
        logoutButton.click();
    }
}

function addTokenToInput() {
    let closestDiv = document.querySelector(".btn.authorize.unlocked").closest("div.auth-wrapper");
    let loginPopupButton = document.querySelector(".btn.authorize.unlocked");

    if (closestDiv != null && closestDiv != undefined) {
        loginPopupButton.click();
    }
    let tokenInput = closestDiv.querySelector("input");

    if (tokenInput != null && tokenInput != undefined) {
        tokenInput.value = contentToken;
        tokenInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    document.querySelector(".btn.modal-btn.auth.authorize.button").click();
    setTimeout(function () {
        document.querySelector(".btn.modal-btn.auth.btn-done.button").click();
    }, 500)
}