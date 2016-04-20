/**
 * @file twitch.js
 * Created by john varney on 4/8/2016, for FreeCodeCamp Zipline: "Use the TwitchTV JSON API"
 *   Features:
 *   - Builds UI demonstrating manipulation of the Twitch API.
 *   - User stories:
 *   - 1. See whether FCC is currently streaming.
 *   - 2. I can click the status indicator and be sent directly to FCC's channel.
 *   - 3. If a user is currently streaming, I can see additional details.
 *   - 4. I will see a placeholder notification if a streamer has closed their account,
 *          or the account never existed.
 *   - Notes: Error checking is minimal as this is for demonstration purposes.
 *   - Dependent Files: twitch.htm, twitch.css
 *
 *  @author John Varney, jdvarney@(nospam).msn.com
 */

"use strict";

// single repository for user data
var streamerInfoArray = [];

$("#tabs").tabs();


/**
 * @function document.ready
 */

$(document).ready(
    function () {

        // todo: handle error
        Twitch.init(
            {clientId: '7ta7d8vv7ancnir64zql6gd0p8gzxlh'}, function (error, status) {
                if (error == null) {
                    console.log("Twitch API successfully initialized");
                }
            });

        var streamerArray = [
            "FreeCodeCamp",
            "johnnyRaved",
            "storbeck",
            "terakilobyte",
            "habathcx",
            "RobotCaleb",
            "comster404",
            "brunofin",
            "thomasballinger",
            "noobs2ninjas",
            "beohoff"
        ];

        buildTabs(streamerArray);


    }); // end of document ready

/**
 * @function buildTabs is the main for this page.
 * @param userArray
 */
function buildTabs(userArray) {
    var amr = asyncMultiReceiver();
    getUserInfo(
        userArray, amr, function (data) {
            streamerInfoArray = data;

            amr.reset();

            getUserStreams(
                userArray, amr, function (data) {
                    var tempArray = [];
                    data.forEach(
                        function (element, index) {
                            tempArray.push(mergeProps(streamerInfoArray[index], element));
                        });
                    userArray = [];
                    streamerInfoArray = tempArray;
                    var presentationHTML = processTabData(streamerInfoArray);
                    presentUserData(presentationHTML);
                });
        });
}

function mergeProps(obj, src) {
    Object.keys(src).forEach(
        function (key) {
            obj[key] = src[key];
        });
    return obj;
}

/**
 * @function asyncMultiReceiver marshalls multiple async calls.
 * @returns single callback with collected results.
 */
var asyncMultiReceiver = function () {
    var callIndex = 0;
    var callCount;
    var sumArray = [];
    var amrCallback;

    return {
        reset: function () {
            callIndex = 0;
            sumArray = [];
        },
        setCount: function (count) {
            callCount = count;
        },
        setCallback: function (callback) {
            amrCallback = callback;
        },
        incrementCount: function () {
            callIndex++;
            if (callIndex == callCount) {
                amrCallback(sumArray);
            }
        },
        addElement: function (element) {
            sumArray.push(element);
        }
    }
};

/**
 * @function getUserInfo processes the userArray
 * @param userArray, typically the streamerInfoArray
 * @param asyncReceiver marshall async calls for callback
 * @param callback function receives the updated array
 */
function getUserInfo(userArray, asyncReceiver, callback) {
    asyncReceiver.setCount(userArray.length);
    asyncReceiver.setCallback(callback);
    userArray.forEach(
        function (streamer) {
            $.getJSON(
                'https://api.twitch.tv/kraken/users/' + streamer + '?callback=?',
                function (user) {
                    var uName = "";
                    var uLogo = "";
                    if (typeof user.name === 'undefined') {
                        uName = "";
                    }
                    else {
                        uName = user.name;
                    }

                    if (typeof user.logo === 'undefined') {
                        uLogo = "";
                    }
                    else {
                        uLogo = user.logo;
                    }

                    asyncReceiver.addElement({"userName": uName, "logo": uLogo});
                    asyncReceiver.incrementCount();
                });
        });
}
/**
 * function getUserStreams returns stream related data in userArray
 * @param userArray
 * @param asyncReceiver
 * @param callback
 */
function getUserStreams(userArray, asyncReceiver, callback) {
    asyncReceiver.setCount(userArray.length);
    asyncReceiver.setCallback(callback);
    userArray.forEach(
        function (name) {
            $.getJSON(
                'https://api.twitch.tv/kraken/streams/' + name + '?callback=?',
                function (channel) {
                    var obj = {};
                    if (channel["stream"] == null) {
                        obj.status = "offline";
                    }
                    else {
                        obj.status = "online";
                        obj.channel = channel.stream.channel.url;
                        obj.description = channel.stream.channel.status;
                    }
                    asyncReceiver.addElement(obj);
                    asyncReceiver.incrementCount();
                });
        });
}

/**
 * @function processTabData builds the output shown in tabs
 * @param tabData
 * @returns {{allHTML: string, onlineHTML: string, offlineHTML: string}}
 */
function processTabData(tabData) {

    var fq = '"'; // full-quote
    var userLogo = "";
    var userText = "";
    var statusMsg = "";
    var elementHTML = "";
    var allHTML = "";
    var onlineHTML = "";
    var offlineHTML = "";

    tabData.forEach(
        function (userInfo) {

            if (userInfo.userName === "") {
                userText = "Unknown User";
                userLogo = "images/unknownUser.png"; // Indicates user doesn't exist or cancelled account
                statusMsg = "Unknown user, or user unsubcribed."
            }
            else {
                if (userInfo.logo == '' || userInfo.logo == null) {
                    userLogo = "images/unknownUser.png";
                }
                else {
                    userLogo = userInfo.logo;
                }
                userText = userInfo.userName;
                statusMsg = "";
            }

            if (userInfo.online === "online") {
                statusMsg = userInfo.description;

                elementHTML =
                    '<div class="itemBox"><div class="imageClass"><img class="image" src=' +
                    fq + userLogo + '"></div><div class="textClass"><p class="text">' + userText +
                    '<br><span class="secondText">' + statusMsg + '</span></p></div>' +
                    '<div class="statusClass"><p class="statusClassTwitch classTwitch fa fa-twitch"' +
                    '></p></div></div>';

                allHTML += elementHTML;
                onlineHTML += elementHTML;
            }
            else { // offline

                elementHTML =
                    '<div class="itemBox"><div class="imageClass"><img class="image" src=' +
                    fq + userLogo + '"></div><div class="textClass"><p class="text"><span class="userName">' + userText +
                    '</span><br><span class="secondText">' + statusMsg + '</span></p></div>';

                if (userInfo.userName === "") {
                    elementHTML += '<div class="statusClass"><p class="statusClassError statusButton fa fa-exclamation-circle"' +
                        '></p></div></div>';
                }
                else {
                    elementHTML += '<div class="statusClass"><p class="statusClassTwitch classTwitch fa fa-twitch"' +
                        '></p></div></div>';
                }

                allHTML += elementHTML;
                offlineHTML += elementHTML;
            }
        });

    return {
        allHTML: allHTML,
        onlineHTML: onlineHTML,
        offlineHTML: offlineHTML
    };
}

/**
 * function presentUserData updates HTML AND processes clicks
 * @param data
 */
function presentUserData(data) {
    $("#all").html(data.allHTML);
    $("#online").html(data.onlineHTML);
    $("#offline").html(data.offlineHTML);

    var hoverItems = $(".secondText");

    hoverItems.hover(
        function () {
            $(this).css("color", "blue");
        }, function out() {
            $(this).css("color", "black");
        });

    hoverItems.click(
        function () {
            var clickText = $(".userName");
            var text = clickText.first().text();
            if (text == "Unknown User") {
                return;
            }
            for (var i = 0; i < streamerInfoArray.length; i++) {
                if (streamerInfoArray[i].userName == text) {
                    if (streamerInfArray[i].status == "online") {
                        location.href = streamerInfoArray[i].channel;
                    }
                }
            }
        });
    $(
        function () {
            $("#draggable").draggable();
        });
}

// enf of file
