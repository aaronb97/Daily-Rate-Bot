
'use strict';

require('dotenv').config({silent: true});

const https = require('https');

const RANGE = 'Rates and Daily Stats!A1:P1000';
const FORTUNE_RANGE = 'Rates and Daily Stats!AA1:AF1000';
const CARD_RANGE = 'Cards!A1:U100';
const google = require('googleapis');
const sheetsApi = google.sheets('v4');
const googleAuth = require('../auth');
require('dotenv').config({silent: true});
const DATE_SHIFT = parseInt(process.env.DATE_SHIFT);
const SPREADSHEET_ID = process.env.SPREADSHEET_ID; 

class Bot {
    /**
     * Called when the bot receives a message.
     *
     * @static
     * @param {Object} message The message data incoming from GroupMe
     * @return {string}
     */
    static checkMessage(message) {
        const messageText = message.text;
        const name = message.name;
        const moment = require('moment');
        var arr = messageText.split(" ");
        if (arr[0].charAt(0) == '/')
        {
            arr[0] = arr[0].toLowerCase();
        }
        var daterate;
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
        var date = new Date();
        date.setHours(date.getHours() - DATE_SHIFT);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - 1);
        var dateend = "th";

        if (date.getDate() == 1 || date.getDate() == 21 || date.getDate() == 31)
            dateend = "st";
        if (date.getDate() == 2 || date.getDate() == 22)
            dateend = "nd";
        if (date.getDate() == 3 || date.getDate() == 23)
            dateend = "rd";
        daterate = months[date.getMonth()] + " " + date.getDate() + dateend + ", " + date.getFullYear();
        var returnmessage = "";

        if (arr.length >= 2 && arr.length <= 5 && messageText.length < 30 && arr[0] == "/rate") {
            var rate = parseInt(arr[1]);
            var aDate;
            if (arr.length >= 3)
                var aDate = moment(arr[2], ["MM/DD/YYYY", "M/DD/YYYY", "M/D/YYYY", "MM/D/YYYY"], true);
            if (aDate != undefined && aDate.isValid()) 
                return "You probably meant to use /ratedate";
            if (isNaN(rate) || rate != parseFloat(arr[1]) || rate < 0 || rate > 10 || arr[1].length > 2)
                return "You are not allowed to rate " + messageText.substring(5); 
            else
            {
                Bot.rateEnter(message.user_id, name, rate, date, daterate, arr);
                console.log("Logged rate of " + arr[1] + " for " +  name + " for " + daterate)
            }
        }

        else if (arr.length >= 3 && messageText && arr[0] == "/ratedate" || arr[0] == "/daterate")
        {
            var rate = parseInt(arr[1]);
            if (isNaN(rate) || rate != parseFloat(arr[1]) || rate < 0 || rate > 10 || arr[1].length > 2)
                return "You are not allowed to rate " + messageText.subString(5);
            var datesplit = arr[2].split("/");
            if (parseInt(datesplit[2]) < 100)
            {
                console.log("test");
                datesplit[2] = "" + (parseInt(datesplit[2]) + 2000);
                arr[2] = datesplit[0] + "/" + datesplit[1] + "/" + datesplit[2];
            }
            var aDate = moment(arr[2], ["MM/DD/YYYY", "M/DD/YYYY", "M/D/YYYY", "MM/D/YYYY"], true);

            if (!aDate.isValid())
                return arr[2] + " is not a valid date";
            if (aDate.year() < 2018)
                return arr[2] + " predates the chart";

            if (aDate.date() == 1 || aDate.date() == 21 || aDate.date() == 31)
                dateend = "st";
            if (aDate.date() == 2 || aDate.date() == 22)
                dateend = "nd";
            if (aDate.date() == 3 || aDate.date() == 23)
                dateend = "rd";

            daterate = months[aDate.month()] + " " + aDate.date() + dateend + ", " + aDate.year();
            var date2 = new Date(aDate.year(), aDate.month(), aDate.date());
            if (date2 > date)
            {
                return "You may not rate into the future";
            }
            Bot.rateEnter(message.user_id, name, rate, date2, daterate, arr);
            console.log("Logged rate of " + arr[1] + " for " +  name + " on " + daterate)
        }
        else if (arr.length >= 2 && messageText && arr[0] == "/missing" && arr[1] == "all")
        {
            googleAuth.authorize()
                .then((auth) => {

                    var sheets = google.sheets('v4');
                    sheets.spreadsheets.values.get({
                        auth: auth,
                        spreadsheetId: SPREADSHEET_ID,
                        range: RANGE
                    }, function(err, response) {
                        if (err) {
                            console.log('The API returned an error: ' + err);
                            return;
                        }
                        var rows = response.values;
                        var x;
                        for (x = 0; rows[0][x] != undefined; x++)
                        {

                        }

                        var y;
                        var d = new Date();
                        d.setDate(d.getDate() - 1);
                        d.setHours(d.getHours() - DATE_SHIFT);
                        var date = d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getYear() - 100;
                        for (y = 4; rows[y][0] != undefined; y++)
                        {

                            var sheetdate = rows[y][0].split("/");
                            if (d.getMonth() + 1 == sheetdate[0] && d.getDate() == sheetdate[1] && d.getYear() - 100 == sheetdate[2])
                            {
                                break;
                            }

                        }
                        var tempmessage = ""; 
                        var w;
                        for (w = y; w > 4; w--)
                        {

                            var z;
                            for (z = 1; z < x; z++)
                            {

                                if ((rows[w][z] == undefined || rows[w][z] == "") && w > parseInt(rows[4][x]))
                                {
                                    tempmessage += rows[1][z] + "\n";
                                }
                            }
                            var arr = rows[w][0].split("/");
                            var date = arr[0] + "/" + arr[1] + "/20" + arr[2];
                            if (tempmessage.length > 0)
                            {
                                tempmessage = "Missing rates for " + date + ": \n" + tempmessage;
                                //Bot.sendMessage("Missing rates for " +  date + ": \n" + returnmessage);


                                returnmessage += tempmessage + "\n";
                            }
                            tempmessage = "";
                        }
                        Bot.sendMessage(returnmessage);

                    });

                })
                .catch((err) => {
                    console.log('auth error', err);
                });

        }
        else if (arr[0] == "/missing")
        {
            googleAuth.authorize()
                .then((auth) => {

                    var sheets = google.sheets('v4');
                    sheets.spreadsheets.values.get({
                        auth: auth,
                        spreadsheetId: SPREADSHEET_ID,
                        range: RANGE

                    }, function(err, response) {
                        if (err) {
                            console.log('The API returned an error: ' + err);
                            return;
                        }
                        var rows = response.values;
                        var x;
                        for (x = 0; rows[0][x] != undefined && rows[0][x] != message.user_id; x++)
                        {

                        }

                        var y;
                        var d = new Date();
                        d.setDate(d.getDate() - 1);
                        d.setHours(d.getHours() - DATE_SHIFT);
                        var date = d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getYear() - 100;
                        for (y = 4; rows[y][0] != undefined; y++)
                        {

                            var sheetdate = rows[y][0].split("/");
                            if (d.getMonth() + 1 == sheetdate[0] && d.getDate() == sheetdate[1] && d.getYear() - 100 == sheetdate[2])
                            {
                                break;
                            }
                        }

                        var z;
                        for (z = 4; z <= y; z++)
                        {
                            if ((rows[z][x] == undefined || rows[z][x] == "" ) && z >= rows[4][x])
                            {
                                var arr = rows[z][0].split("/");
                                var date = arr[0] + "/" + arr[1] + "/20" + arr[2];
                                returnmessage += date + "\n";
                            }
                        }

                        if (rows[0][x] == "" || rows[0][x] == undefined)
                            Bot.sendMessage("You are not in the chart");
                        else if (returnmessage != "")
                            Bot.sendMessage("Missing rates for " + rows[1][x] + ":\n" + returnmessage);
                        else
                            Bot.sendMessage(rows[1][x] + ", you are up to date");

                    });

                })
                .catch((err) => {
                    console.log('auth error', err);
                });
        }
        else if (arr.length == 1 && arr[0] == "/help")
        {
            return "/rate #\n/ratedate # mm/dd/yy\n/link\n/missing\n/speak\n/fortune\n/nag\n/rem\n/buy\n/cards\n/uh";
        }
        else if (arr.length == 1 && arr[0] == "/speak")
        {
            //var woofs = ["bark", "woof", "bow wow", "arf", "ruff", "awooooo", "bork", "grrr", "wuff", "snort", "yip"];
            var woofs = ["ribbit", "riiiibit", "ribit", "croak", "croooak", "crooaaaaaak", "Froggo thee frog here", "It is Wednesday my dudes"];
            var int = Math.floor(Math.random() * woofs.length);
            return woofs[int];
        }    
        else if (arr[0] == "/uh")
        {
            Bot.sendMessage("You need 1000 points to toggle uh");
        }
        else if (arr.length >= 1 && arr[0] == "/link") {
            console.log("Returned link")
            return "https://docs.google.com/spreadsheets/d/" + SPREADSHEET_ID;
        }
        else if (arr.length >= 1 && arr[0] == "/fortune")
        {
            googleAuth.authorize()
                .then((auth) => {
                    var sheets = google.sheets('v4');
                    sheets.spreadsheets.values.get({
                        auth: auth,
                        spreadsheetId: SPREADSHEET_ID,
                        range: FORTUNE_RANGE 

                    }, function(err, response) {
                        if (err) {
                            console.log('The API returned an error: ' + err);
                            Bot.sendMessage(err);
                            return;
                        }
                        var rows = response.values;
                        var x;
                        x = parseInt(rows[1][2]);
                        var z;
                        var w;
                        w = Math.floor(Math.random() * rows[1][3] + 2);
                        z = Math.floor(Math.random() * x) + 2;
                        console.log(z);
                        var numbers = [];
                        numbers.push(Math.floor(Math.random() * 69) + 1);
                        numbers.push(Math.floor(Math.random() * 69) + 1);
                        numbers.push(Math.floor(Math.random() * 69) + 1);
                        numbers.push(Math.floor(Math.random() * 69) + 1);
                        numbers.push(Math.floor(Math.random() * 69) + 1);
                        while (!isUnique(numbers))
                        {
                            numbers[Math.floor(Math.random() * 4)] = Math.floor(Math.random() * 69 + 1);    
                        }
                        numbers.sort(function(a, b){return a-b});
                        var powerball = Math.floor(Math.random() * 26) + 1;

                        if (x != 0)
                            Bot.sendMessage(rows[z][1] + "\n\n Learn Chinese: " + rows[w][3] + "\n Lucky numbers: " + numbers[0] + ", " + numbers[1] + ", " + numbers[2] + ", " + numbers[3] + ", " + numbers[4] + ", " + powerball + " ");
                        else
                            Bot.sendMessage("Out of fortunes. Refill");
                        rows[z][1] = rows[x + 1][1];
                        rows[x + 1][1] = "";
                        rows[1][2] = "=countA(AB3:AB10001)";
                        sheets.spreadsheets.values.update({
                            auth: auth,
                            spreadsheetId: SPREADSHEET_ID,
                            range: FORTUNE_RANGE, 
                            valueInputOption: 'USER_ENTERED',
                            resource: {range: FORTUNE_RANGE,
                                majorDimension: 'ROWS',
                                values: rows}
                        } ,(err, resp) => {

                            if (err) {
                                console.log('Data Error :', err)
                                reject(err);
                            }
                        });

                    });
                })
                .catch((err) => {
                    console.log('auth error', err);
                });
        }
        else if (arr[0] == "/powerball")
        {
            var numbers1 = [];
            var numbers2 = [];
            var p1, p2;
            if (arr.length >= 8 && arr[1] == "pick" && parseInt(arr[2]) != NaN && parseInt(arr[3]) != NaN && parseInt(arr[4]) != NaN && parseInt(arr[5]) != NaN && parseInt(arr[6]) != NaN && parseInt(arr[7]) != NaN)
            {
                numbers2.push(parseInt(arr[2]));
                numbers2.push(parseInt(arr[3]));
                numbers2.push(parseInt(arr[4]));
                numbers2.push(parseInt(arr[5]));
                numbers2.push(parseInt(arr[6]));
                p2 = parseInt(arr[7]);
                if (!isUnique(numbers2))
                    return "The numbers you picked are not unique. Pick 5 unique numbers from 1 to 69 and a number from 1 to 26";
                var i;
                for (i = 0; i < 6; i++)
                {
                    if (numbers2[i] < 1 || numbers2[i] > 69)
                        return "At least one of your white balls is not in the correct range. Pick 5 unique numbers from 1 to 69 and a number from 1 to 26";
                }
                if (p2 < 1 || p2 > 26)
                    return "Your powerball is not in the correct range. Pick 5 unique numbers from 1 to 69 and a number from 1 to 26";
            }
            else
            {

                p2 = Math.floor(Math.random() * 26 + 1);
                numbers2.push(Math.floor(Math.random() * 69) + 1);
                numbers2.push(Math.floor(Math.random() * 69) + 1);
                numbers2.push(Math.floor(Math.random() * 69) + 1);
                numbers2.push(Math.floor(Math.random() * 69) + 1);
                numbers2.push(Math.floor(Math.random() * 69) + 1);
                while (!isUnique(numbers2))
                {
                    numbers2[Math.floor(Math.random() * 4)] = Math.floor(Math.random() * 69 + 1);    
                }
            }
            p1 = Math.floor(Math.random() * 26 + 1);
            var pSame = false;
            var points = 0;
            if (p1 == p2)
                pSame = true;
            numbers1.push(Math.floor(Math.random() * 69) + 1);
            numbers1.push(Math.floor(Math.random() * 69) + 1);
            numbers1.push(Math.floor(Math.random() * 69) + 1);
            numbers1.push(Math.floor(Math.random() * 69) + 1);
            numbers1.push(Math.floor(Math.random() * 69) + 1);
            while (!isUnique(numbers1))
            {
                numbers1[Math.floor(Math.random() * 4)] = Math.floor(Math.random() * 69 + 1);    
            }
            numbers1.sort(function(a, b){return a-b});
            numbers2.sort(function(a, b){return a-b});
            var x, y;
            var same = 0;
            for (x = 0; x < 5; x++)
            {
                for (y = 0; y < 5; y++)
                {
                    if (numbers1[x] == numbers2[y])
                        same++;
                }
            }
            if (same == 5 && pSame)
                points = 420000000;
            else if (same == 5)
                points = 1000000;
            else if (same == 4 && pSame)
                points = 50000;
            else if (same == 4)
                points = 100;
            else if (same == 3 && pSame)
                points = 100;
            else if (same == 3)
                points = 7;
            else if (same == 2 && pSame)
                points = 7;
            else if (same == 2)
                points = 2;
            else if (same == 1 && pSame)
                points = 4;
            else if (pSame)
                points = 4;
            else if (same == 1)
                points = 1;

            console.log(points);
            googleAuth.authorize()
            .then((auth) => {

                var sheets = google.sheets('v4');
                sheets.spreadsheets.values.get({
                    auth: auth,
                    spreadsheetId: SPREADSHEET_ID,
                    range: CARD_RANGE

                }, function(err, response) {
                    if (err) {
                        console.log('The API returned an error: ' + err);
                        return;
                    }
                    var rows = response.values;
                    var x;
                    for (x = 0; rows[0][x] != message.user_id && rows[0][x] != undefined; x++);
                    var not = "";
                    if (!pSame)
                        not = "not";
                    if (parseInt(rows[2][x]) <= 0)
                        Bot.sendMessage("You need 1 point to play the powerball and you have no points.");
                    else
                    {
                        rows[2][x] = points + parseInt(rows[2][x]) - 1;
                        Bot.sendMessage("Powerball numbers: " + numbers1[0] + ", " + numbers1[1] + ", " + numbers1[2] + ", " + numbers1[3] + ", " + numbers1[4] + ", " + p1 + "\nYour numbers . . . . . :" + numbers2[0] + ", " + numbers2[1] + ", " + numbers2[2] + ", " + numbers2[3] + ", " + numbers2[4] + ", " + p2 + "\n " + same + " of the white balls matched, and the powerballs did " + not + " match. You have won " + points + " points. You now have " + rows[2][x] + " points.");
                    }
                    sheets.spreadsheets.values.update({
                        auth: auth,
                        spreadsheetId: SPREADSHEET_ID,
                        range: CARD_RANGE,
                        valueInputOption: 'USER_ENTERED',
                        resource: {range: CARD_RANGE,
                            majorDimension: 'ROWS',
                            values: rows}
                    } ,(err, resp) => {

                        if (err) {
                            console.log('Data Error :', err)
                            reject(err);
                        }
                    });


                });
            })
            .catch((err) => {
                console.log('auth error', err);
            });

        }
        else if (arr.length == 2 && arr[0] == "/play" && arr[1] == "dead")
        {
            Bot.sendMessage("x___x");
        }
        else if (arr[0] == "/good")
        {
            Bot.sendMessage("₍ᐢ•ﻌ•ᐢ₎");
        }
        else if (arr[0] == "/calc")
        {
            var query = messageText.substring(5);
            Bot.sendMessage("Calculating " + query + "...");
            var wolfram = require('wolfram').createClient(process.env.WOLF_ID);
            wolfram.query(query, function(err, result) {
                if(err) throw err
                console.log("Result: %j", result[1].subpods[0].value)
                console.log("Result: %j", result[0].subpods[0].value)
                var res = result[1].subpods[0].value;
                if (res== "")
                    res= result[0].subpods[0].value;
                Bot.sendMessage("Result: " + res);
            })
        }
        else if (arr[0] == "/nag")
        {
            googleAuth.authorize()
                .then((auth) => {

                    var sheets = google.sheets('v4');
                    sheets.spreadsheets.values.get({
                        auth: auth,
                        spreadsheetId: SPREADSHEET_ID,
                        range: RANGE

                    }, function(err, response) {
                        if (err) {
                            console.log('The API returned an error: ' + err);
                            return;
                        }
                        var rows = response.values;
                        var x;
                        for (x = 0; rows[0][x] != undefined && rows[0][x] != message.user_id; x++);

                        if (rows[0][x] == undefined)
                        {
                            Bot.sendMessage("You are not in the chart");
                        }
                        else if (rows[2][x] == "nag")
                        {
                            rows[2][x] = "nonag";
                            Bot.sendMessage("Turned off nagging for " + rows[1][x] + ". You better remember to rate");
                        }
                        else if (rows[2][x] == "nonag")
                        {
                            rows[2][x] = "nag";
                            Bot.sendMessage("Turned on nagging for " + rows[1][x]);
                        }

                        sheets.spreadsheets.values.update({
                            auth: auth,
                            spreadsheetId: SPREADSHEET_ID,
                            range: RANGE,
                            valueInputOption: 'USER_ENTERED',
                            resource: {range: RANGE,
                                majorDimension: 'ROWS',
                                values: rows}
                        } ,(err, resp) => {

                            if (err) {
                                console.log('Data Error :', err)
                                reject(err);
                            }
                        });

                    });
                })
                .catch((err) => {
                    console.log('auth error', err);
                });
        }
        else if (arr[0] == "/rem")
        {
            googleAuth.authorize()
                .then((auth) => {

                    var sheets = google.sheets('v4');
                    sheets.spreadsheets.values.get({
                        auth: auth,
                        spreadsheetId: SPREADSHEET_ID,
                        range: RANGE

                    }, function(err, response) {
                        if (err) {
                            console.log('The API returned an error: ' + err);
                            return;
                        }
                        var rows = response.values;
                        var x;
                        for (x = 0; rows[0][x] != undefined && rows[0][x] != message.user_id; x++);

                        if (rows[0][x] == undefined)
                        {
                            Bot.sendMessage("You are not in the chart");
                        }
                        else if (rows[3][x] == "rem")
                        {
                            rows[3][x] = "norem";
                            Bot.sendMessage("Turned off reminders for " + rows[1][x] + ". You better remember to rate");
                        }
                        else if (rows[3][x] == "norem")
                        {
                            rows[3][x] = "rem";
                            Bot.sendMessage("Turned on reminders for " + rows[1][x]);
                        }

                        sheets.spreadsheets.values.update({
                            auth: auth,
                            spreadsheetId: SPREADSHEET_ID,
                            range: RANGE,
                            valueInputOption: 'USER_ENTERED',
                            resource: {range: RANGE,
                                majorDimension: 'ROWS',
                                values: rows}
                        } ,(err, resp) => {

                            if (err) {
                                console.log('Data Error :', err)
                                reject(err);
                            }
                        });

                    });
                })
                .catch((err) => {
                    console.log('auth error', err);
                });
        }
        else if (arr.length >= 1 && arr[0] == "/random")
        {
            Bot.sendMessage("" + Math.floor(Math.random() * parseInt(arr[1]) + 1));
        }
        else if (arr[0] == "uh" || arr[0] == "Uh")
        {
            Bot.sendMessage("UH");
        }
        else if (arr[0] == "/buy")
        {
            googleAuth.authorize()
            .then((auth) => {

                var sheets = google.sheets('v4');
                sheets.spreadsheets.values.get({
                    auth: auth,
                    spreadsheetId: SPREADSHEET_ID,
                    range: CARD_RANGE

                }, function(err, response) {
                    if (err) {
                        console.log('The API returned an error: ' + err);
                        return;
                    }
                    var rows = response.values;
                    var x, y;
                    for (x = 0; rows[0][x] != message.user_id && rows[0][x] != undefined; x++);
                    var r = Math.floor(Math.random() * parseInt(rows[1][3]));

                    for (y = 3; parseInt(rows[y][2]) < r; y++);

                    if (parseInt(rows[2][x]) <= 0 || rows[2][x] == undefined || rows[2][x] == "")
                        Bot.sendMessage(message.name + ", you do not have enough points");
                    else
                    {
                        rows[2][x] = parseInt(rows[2][x]) - 1;
                        rows[y][x] = parseInt(rows[y][x]) + 1;
                        Bot.sendMessage(message.name + " drew a " + rows[y][0] + ". Points remaining: " + rows[2][x]);
                    }


                    sheets.spreadsheets.values.update({
                        auth: auth,
                        spreadsheetId: SPREADSHEET_ID,
                        range: CARD_RANGE,
                        valueInputOption: 'USER_ENTERED',
                        resource: {range: CARD_RANGE,
                            majorDimension: 'ROWS',
                            values: rows}
                    } ,(err, resp) => {

                        if (err) {
                            console.log('Data Error :', err)
                            reject(err);
                        }
                    });


                });
            })
            .catch((err) => {
                console.log('auth error', err);
            });
        }
        else if (arr[0] == "/cards")
        {
            googleAuth.authorize()
            .then((auth) => {

                var sheets = google.sheets('v4');
                sheets.spreadsheets.values.get({
                    auth: auth,
                    spreadsheetId: SPREADSHEET_ID,
                    range: CARD_RANGE

                }, function(err, response) {
                    if (err) {
                        console.log('The API returned an error: ' + err);
                        return;
                    }
                    var rows = response.values;
                    var x, y;
                    for (x = 0; rows[0][x] != message.user_id && rows[0][x] != undefined; x++);
                    var returnmessage = "You have " + rows[2][x] + " points. You have the following cards:\n";
                    for (y = 3; y < 58; y++)
                    {
                        if (parseInt(rows[y][x]) > 0)
                        {
                            returnmessage += rows[y][x] + " " + rows[y][0] + "\n";
                        }
                    }
                    Bot.sendMessage(returnmessage);
                });
            })

       }
        else {
            googleAuth.authorize()
                .then((auth) => {
                    var sheets = google.sheets('v4');
                    sheets.spreadsheets.values.get({
                        auth: auth,
                        spreadsheetId: SPREADSHEET_ID,
                        range: RANGE

                    }, function(err, response) {
                        if (err) {
                            console.log('The API returned an error: ' + err);
                            return;
                        }
                        var rows = response.values;
                        var x;
                        for (x = 0; rows[0][x] != undefined && rows[0][x] != message.user_id; x++)
                        {

                        }
                        var d = new Date();
                        d.setDate(d.getDate() - 1);
                        d.setHours(d.getHours() - DATE_SHIFT);
                        var y;
                        var date = d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getYear() - 100;
                        for (y = 2; rows[y][0] != undefined; y++)
                        {

                            var sheetdate = rows[y][0].split("/");
                            if (d.getMonth() + 1 == sheetdate[0] && d.getDate() == sheetdate[1] && d.getYear() - 100 == sheetdate[2])
                            {
                                break;
                            }
                        }
                        if (rows[0][x] != undefined && rows[0][x] != "" && rows[2][x] == "nag" && (rows[y][x] == undefined || rows[y][x] == "") && d.getHours() > 7)
                        {
                            Bot.sendMessage(rows[1][x] + ", please rate :( \nToggle nagging by typing /nag");
                        }               
                    });

                })
                .catch((err) => {
                    console.log('auth error', err);
                });
        }

        return returnmessage;
        function isUnique(arr) {
            for(var i = 0; i < arr.length; i++) {
                if (arr.indexOf(arr[i]) != i) return false;
            }
            return true;
        }

    };

    /**
     * Sends a message to GroupMe with a POST request.
     *
     * @static
     * @param {string} messageText A message to send to chat
     * @return {undefined}
     */
    static sendMessage(messageText) {
        // Get the GroupMe bot id saved in `.env`
        const botId = process.env.BOT_ID;

        const options = {
            hostname: 'api.groupme.com',
            path: '/v3/bots/post',
            method: 'POST'
        };

        const body = {
            bot_id: botId,
            text: messageText
        };

        // Make the POST request to GroupMe with the http module
        const botRequest = https.request(options, function(response) {
            if (response.statusCode !== 202) {
                console.log('Rejecting bad status code ' + response.statusCode);
            }
        });

        // On error
        botRequest.on('error', function(error) {
            console.log('Error posting message ' + JSON.stringify(error));
        });

        // On timeout
        botRequest.on('timeout', function(error) {
            console.log('Timeout posting message ' + JSON.stringify(error));
        });
        console.log(JSON.stringify(body));
        // Finally, send the body to GroupMe as a string
        botRequest.end(JSON.stringify(body));
    };

    static sendMessageAlert(messageText, ids) {
        // Get the GroupMe bot id saved in `.env`
        const botId = process.env.BOT_ID;

        const options = {
            hostname: 'api.groupme.com',
            path: '/v3/bots/post',
            method: 'POST'
        };

        const body = {
            bot_id: botId,
            attachments: [{
                loci: [],
                type: "mentions",
                user_ids: ids, 
            }],
            text: messageText

        };

        var x;
        for (x = 0; x < ids.length; x++)
        {
            body.attachments[0].loci.push([0, 4]);
        }

        // Make the POST request to GroupMe with the http module
        const botRequest = https.request(options, function(response) {
            if (response.statusCode !== 202) {
                console.log('Rejecting bad status code ' + response.statusCode);
            }
        });

        // On error
        botRequest.on('error', function(error) {
            console.log('Error posting message ' + JSON.stringify(error));
        });

        // On timeout
        botRequest.on('timeout', function(error) {
            console.log('Timeout posting message ' + JSON.stringify(error));
        });
        console.log(JSON.stringify(body));
        // Finally, send the body to GroupMe as a string
        botRequest.end(JSON.stringify(body));
    };

    static rateEnter(id, name, rate, d, daterate, arr)
    {

        require('dotenv').config({silent: true});

        const SPREADSHEET_ID = process.env.SPREADSHEET_ID; 

        googleAuth.authorize()
            .then((auth) => {

                var sheets = google.sheets('v4');
                sheets.spreadsheets.values.get({
                    auth: auth,
                    spreadsheetId: SPREADSHEET_ID,
                    range: RANGE

                }, function(err, response) {
                    if (err) {
                        console.log('The API returned an error: ' + err);
                        return;
                    }
                    var rows = response.values;
                    var x;
                    for (x = 0; rows[0][x] != undefined && rows[0][x] != id; x++);

                    rows[0][x] = id;
                    if (rows[1][x] == undefined || rows[1][x] == "")
                    {
                        rows[1][x] = name;
                        rows[2][x] = "nag";
                        rows[3][x] = "rem";
                    }
                    else
                    {
                        name = rows[1][x];
                    }
                    var y;
                    var points = 1;
                    var date = d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getYear() - 100;
                    for (y = 2; rows[y][0] != undefined; y++)
                    {
                        var sheetdate = rows[y][0].split("/");
                        if (d.getMonth() + 1 == sheetdate[0] && d.getDate() == sheetdate[1] && d.getYear() - 100 == sheetdate[2])
                        {
                            break;
                        }
                    }

                    if (rows[4][x] == undefined || rows[4][x] == "")
                        rows[4][x] = y;

                    var w;
                    var first = true;
                    for (w = 2; rows[0][w] != undefined && rows[0][w] != ""; w++)
                        if (rows[y][w] != undefined && rows[y][w] != "")
                                first = false;
                    var extra = ""; 
                    if (first == true)
                    {
                        points += 2;
                        extra += "First rate bonus 😎 ";
                    }
                    if (arr[0] == "/rate" && (rows[y - 1][x] == undefined || rows[y - 1][x] == "" || rows[y - 2][x] == undefined || rows[y - 2][x] == "" || rows[y - 3][x] == undefined || rows[y - 3][x] == ""))
                        extra += "You have some missing rates in the past few days, do /missing and /ratedate # mm/dd/yy\n";
                    if (rows[y][x] == undefined || rows[y][x] == "")
                    {
                        Bot.sendMessage(extra + "Logged rate of " + rate + " for " +  name + " for " + daterate); 
                    }
                    else if (rows[y][x] == rate)
                        Bot.sendMessage(name + ", you have already logged " + rate + " for " + daterate);  
                    else
                        Bot.sendMessage("Changed rate from " + rows[y][x] + " to " + rate + " for " + name + " for " + daterate);
                    if (arr[0] == "/rate" && (rows[y][x] == undefined || rows[y][x] == ""))
                        Bot.pointEnter(id, points);

                    rows[y][x] = rate;
                    sheets.spreadsheets.values.update({
                        auth: auth,
                        spreadsheetId: SPREADSHEET_ID,
                        range: RANGE,
                        valueInputOption: 'USER_ENTERED',
                        resource: {range: RANGE,
                            majorDimension: 'ROWS',
                            values: rows}
                    } ,(err, resp) => {

                        if (err) {
                            console.log('Data Error :', err)
                            reject(err);
                        }
                    });

                });
            })
            .catch((err) => {
                console.log('auth error', err);
            });
    }
    static pointEnter(id, points)
    {
        googleAuth.authorize()
            .then((auth) => {

                var sheets = google.sheets('v4');
                sheets.spreadsheets.values.get({
                    auth: auth,
                    spreadsheetId: SPREADSHEET_ID,
                    range: CARD_RANGE

                }, function(err, response) {
                    if (err) {
                        console.log('The API returned an error: ' + err);
                        return;
                    }
                    var rows = response.values;
                    var x;
                    for (x = 0; rows[0][x] != id && rows[0][x] != undefined; x++);
                    rows[2][x] = points + parseInt(rows[2][x]);;
                    Bot.sendMessage("Added " + points + " points for a total of " + parseInt(rows[2][x]));
                    sheets.spreadsheets.values.update({
                        auth: auth,
                        spreadsheetId: SPREADSHEET_ID,
                        range: CARD_RANGE,
                        valueInputOption: 'USER_ENTERED',
                        resource: {range: CARD_RANGE,
                            majorDimension: 'ROWS',
                            values: rows}
                    } ,(err, resp) => {

                        if (err) {
                            console.log('Data Error :', err)
                            reject(err);
                        }
                    });


                });
            })
            .catch((err) => {
                console.log('auth error', err);
            });


    }
    static ratealert()
    {
        googleAuth.authorize()
            .then((auth) => {

                var sheets = google.sheets('v4');
                sheets.spreadsheets.values.get({
                    auth: auth,
                    spreadsheetId: SPREADSHEET_ID,
                    range: RANGE

                }, function(err, response) {
                    if (err) {
                        console.log('The API returned an error: ' + err);
                        return;
                    }
                    var rows = response.values;
                    var x;
                    var names = "";
                    var d = new Date();
                    d.setDate(d.getDate() - 1);
                    d.setHours(d.getHours() - DATE_SHIFT);
                    var y;

                    var date = d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getYear() - 100;
                    for (y = 2; rows[y][0] != undefined; y++)
                    {
                        var sheetdate = rows[y][0].split("/");
                        if (d.getMonth() + 1 == sheetdate[0] && d.getDate() == sheetdate[1] && d.getYear() - 100 == sheetdate[2])
                        {
                            break;
                        }

                    }
                    var ids = [];
                    for (x = 0; rows[0][x] != undefined; x++)
                    {
                        if (rows[3][x] != "norem" && (rows[y][x] == undefined || rows[y][x] == ""))
                        {
                            names += rows[1][x] + ", ";
                            ids.push(parseInt(rows[0][x]));
                        }
                    }
                    names = names.substring(0, names.length - 2);
                    if (names != "")
                    {
                        Bot.sendMessageAlert("Need rates from " + names + "\n/rem to turn off reminders", ids);
                    }
                });
            })
            .catch((err) => {
                console.log('auth error', err);
            });

    }


};
module.exports = Bot;
