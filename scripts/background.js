var signed_in = false;
var google_drive_flag = true;
var logged_out_flag = false;

/**
* Get users access_token.
*
* @param {object} options
*   @value {boolean} interactive - If user is not authorized, should auth UI be displayed.
*   @value {function} callback - Async function to receive getAuthToken result.
*/
function getAuthToken(options) {
    chrome.identity.getAuthToken({ 'interactive': options.interactive }, options.callback);
}


/**
* Get users access_token or show authorize UI if access has not been granted.
*/
function getAuthTokenInteractive() {
    getAuthToken({
        'interactive': true,
        'callback': getAuthTokenInteractiveCallback,
    });
}


/**
* User finished authorizing, start sending google drive api.
*
* @param {string} token - Current users access_token.
*/
function getAuthTokenInteractiveCallback(token) {
    google_drive_api(token);
}


/** 
* get api call
*
*
* @param {string} token - Current users access_token.
*/
function google_drive_api(token) {
    get({
        'url': 'https://www.googleapis.com/drive/v3/files?key={YOUR_API_KEY}',
        //'url': 'https://www.googleapis.com/drive/v3/',
        'callback': google_drive_api_callback,
        'token': token,
    });
}

/**
* Got users Google drive file details for test purpose .
*
*
* @param {object} user - google drive account.
*/
function google_drive_api_callback(user) {
    console.log("show api response");
    console.log(user.files);
}

/**
* Make an authenticated HTTP GET request.
*
* @param {object} options
*   @value {string} url - URL to make the request to. Must be whitelisted in manifest.json
*   @value {string} token - Google access_token to authenticate request with.
*   @value {function} callback - Function to receive response.
*/
function get(options) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            // JSON response assumed. Other APIs may have different responses.
            options.callback(JSON.parse(xhr.responseText));
            // green
            google_drive_flag = true;
        } else {
            if (xhr.status != 200 && xhr.status != 0) {
                google_drive_flag = false;
                console.log('get', xhr.readyState, xhr.status, xhr.responseText);
                console.log("there is a error");
            }
        }
    };
    xhr.open("GET", options.url, true);
    // Set standard Google APIs authentication header.
    xhr.setRequestHeader('Authorization', 'Bearer ' + options.token);
    xhr.send();
}


// pop up a login panel for not logged in user to log in
getAuthTokenInteractive();
chrome.identity.getAuthToken({ interactive: false }, function (token) {
    if (!token) {
        if (chrome.runtime.lastError.message.match(/not signed in/)) {
            signed_in = false;
        } else {
            signed_in = true;
        }
    }
});
console.log("begin sign in ", signed_in);


chrome.runtime.onInstalled.addListener(function (callback) {
    if (callback.reason == "install") {
        //call a function to handle a first install
        var message = "Extension installed at: ";
        message += timeStamp();
        console.log(message);
        addToLog(message);
    }
    else if (callback.reason == "update") {
        //call a function to handle an update
        var message = "Extension updated at: ";
        message += timeStamp();
        console.log(message);
        addToLog(message);
    }
});


var flag = true; // for internet connection
var trueCondition;
var prev_condition = "grey";

var HttpClient = function () {
    this.get = function (aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function () {
            if (anHttpRequest.readyState === 4)
                aCallback(anHttpRequest.status);
        }
        anHttpRequest.open("GET", aUrl, true);
        anHttpRequest.send();
    }
}

function timeStamp() {
    // Create a date object with the current time
    var now = new Date();
    // Create an array with the current month, day and time
    var date = [now.getMonth() + 1, now.getDate(), now.getFullYear()];
    // Create an array with the current hour, minute and second
    var time = [now.getHours(), now.getMinutes(), now.getSeconds()];
    // Determine AM or PM suffix based on the hour
    var suffix = (time[0] < 12) ? "AM" : "PM";
    // Convert hour from military time
    time[0] = (time[0] < 12) ? time[0] : time[0] - 12;
    // If hour is 0, set it to 12
    time[0] = time[0] || 12;
    // If seconds and minutes are less than 10, add a zero
    for (var i = 1; i < 3; i++) {
        if (time[i] < 10) {
            time[i] = "0" + time[i];
        }
    }
    // Return the formatted string
    return date.join("/") + " " + time.join(":") + " " + suffix;
}

function addToLog(message) {
    chrome.storage.local.get(['log'], function (result) {
        var arr = result['log'];
        if (arr.length === 10) {
            arr.shift();
            arr.push(message);
        }
        else if (arr.length < 10) {
            arr.push(message);
        }
        chrome.storage.local.set({ 'log': arr });
    });
}

var client = new HttpClient();
var info = []

chrome.storage.local.get(['log'], function (result) {
    if (typeof result.log === "undefined") {
        chrome.storage.local.set({ 'log': info });
    }
    window.setInterval(() => {
        client.get('http://www.google.com', function (response) {
            if (response === 200) {
                console.log("internet success");
                console.log("sign in ", signed_in);
                flag = true;
            } else {
                flag = false;
            }
        });
        if (flag === false) {
            trueCondition = "yellow";
            if (trueCondition !== prev_condition) {
                var message = "Internet offline at: ";
                message += timeStamp();
                console.log(message);
                addToLog(message);
            }
            prev_condition = trueCondition;
        } else {
            chrome.identity.getAuthToken({ interactive: false }, function (token) {
                if (!token) {
                    //use this to detect whether user is offline by setting a new flag
                    //if logged_out_flag is true, even though setinterval is working, nothing will pop up
                    //the program works again when user click on sign in button
                    if (chrome.runtime.lastError.message.match(/not signed in/)) {
                        console.log("not signed in");
                        signed_in = false;
                        logged_out_flag = true;
                        chrome.storage.local.set({'sign_in': signed_in});
                    }
                }
                else {
                    google_drive_api(token);
                    signed_in = true;
                    logged_out_flag = false;
                    chrome.storage.local.set({'sign_in': signed_in});
                }
            });

            if (logged_out_flag === true) {
                trueCondition = "grey";
                if (trueCondition !== prev_condition) {
                    var message = "User is logged out at: ";
                    message += timeStamp();
                    console.log(message);
                    addToLog(message);
                }
                prev_condition = trueCondition;
            }

            else if (google_drive_flag === true) {
                trueCondition = "green";
                if (trueCondition !== prev_condition) {
                    var message = "Google drive is up at: ";
                    message += timeStamp();
                    console.log(message);
                    addToLog(message);
                }
                prev_condition = trueCondition;
            } else {
                trueCondition = "red";
                if (trueCondition !== prev_condition) {
                    var message = "Google drive is down at: ";
                    message += timeStamp();
                    console.log(message);
                    addToLog(message);
                }
                prev_condition = trueCondition;
            }
        }
        chrome.browserAction.setIcon({ path: "img/" + trueCondition + ".png" });
    }, 1000);
});