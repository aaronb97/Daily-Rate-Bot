
'use strict';

require('dotenv').config({silent: true});

const https = require('https');

const RANGE = 'Rates and Daily Stats!A1:ZZ1000';
const FORTUNE_RANGE = 'Rates and Daily Stats!AA1:AF1000';
const CARD_RANGE = 'Cards!A1:AE1000';
const TRADE_INDEX = 25;
const PUZ_INDEX = 26;
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


        console.log(message.name + " " + message.user_id);
        var arr = messageText.split(" ");
        var bot = false;
        if (message.user_id == 582983 || message.user_id == 378465)
            bot = true;
        if (arr[0].charAt(0) == '/')
        {
            arr[0] = arr[0].toLowerCase();
        }
        var daterate;
        var date = new Date();
        date.setHours(date.getHours() - DATE_SHIFT);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - 1);
        var dateend = "th";

        daterate = Bot.getDateFormat(date);
        var returnmessage = "";

        if (arr.length >= 2 && arr.length <= 5 && messageText.length < 30 && arr[0] == "/rate") {
            if (arr.length >= 3)
                arr[1] = arr[1].toLowerCase();

            var rate = parseInt(arr[1]);
            var aDate;
            arr[1] = arr[1].trim();
            if (arr.length >= 3)
                var dateTest = arr[2].split("/");
            if (dateTest != undefined && dateTest.length == 3) 
                return "You probably meant to use /ratedate";
            if ((isNaN(rate) || rate != parseFloat(arr[1]) || rate < 0 || rate > 10 || arr[1].length > 2) && arr[1] != "abstain")
                return "You are not allowed to rate " + messageText.substring(5); 
            else
            {
                if (arr[1] != "abstain")
                    Bot.rateEnter(message.user_id, name, rate, date, daterate, arr);
                else
                    Bot.rateEnter(message.user_id, name, "abstain", date, daterate, arr);
                console.log("Logged rate of " + arr[1] + " for " +  name + " for " + daterate)
            }
        }

        else if (arr[0] == "/ratedate" || arr[0] == "/daterate")
        {
            if (arr.length < 3)
                return "Incorrect format do /ratedate mm/dd/yy #";
            var dateTest = arr[1].split("/");
            if (dateTest != undefined && dateTest.length == 3)
            {
                var temp = arr[1];
                arr[1] = arr[2];
                arr[2] = temp;
            }
            var rate = parseInt(arr[1]);
            if ((isNaN(rate) || rate != parseFloat(arr[1]) || rate < 0 || rate > 10 || arr[1].length > 2) && arr[1] != "abstain")
                return "You are not allowed to rate " + messageText.subString(5);
            var datesplit = arr[2].split("/");
            if (parseInt(datesplit[2]) < 100)
            {
                datesplit[2] = "" + (parseInt(datesplit[2]) + 2000);
                arr[2] = datesplit[0] + "/" + datesplit[1] + "/" + datesplit[2];
            }
            var aDate = moment(arr[2], ["MM/DD/YYYY", "M/DD/YYYY", "M/D/YYYY", "MM/D/YYYY"], true);

            if (!aDate.isValid())
                return arr[2] + " is not a valid date";
            if (aDate.year() < 2018)
                return arr[2] + " predates the chart";

            var date2 = new Date(aDate.year(), aDate.month(), aDate.date());
            daterate = Bot.getDateFormat(date2);
            if (date2 > date)
            {
                return "You may not rate into the future";
            }
            if (date2.getYear() == date.getYear() && date.getMonth() == date2.getMonth() && date.getDate() == date2.getDate())
            {
                return "Why do you do this. Stop, just use /rate. Please";
            }
            if (arr[1] != "abstain")
                Bot.rateEnter(message.user_id, name, rate, date2, daterate, arr);
            else
                Bot.rateEnter(message.user_id, name, arr[1], date2, daterate, arr);
            console.log("Logged rate of " + arr[1] + " for " +  name + " on " + daterate)
        }
        //else if (arr.length >= 2 && messageText && arr[0] == "/missing" && arr[1] == "all")
        //{
        //    googleAuth.authorize()
        //        .then((auth) => {

        //            var sheets = google.sheets('v4');
        //            sheets.spreadsheets.values.get({
        //                auth: auth,
        //                spreadsheetId: SPREADSHEET_ID,
        //                range: RANGE
        //            }, function(err, response) {
        //                if (err) {
        //                    console.log('The API returned an error: ' + err);
        //                    Bot.sendMessage("Sheets API error (get) " + err.code);
        //                    return;
        //                }
        //                var rows = response.values;
        //                var x;
        //                for (x = 0; rows[0][x] != undefined; x++)
        //                    var y;
        //                var d = new Date();
        //                d.setDate(d.getDate() - 1);
        //                d.setHours(d.getHours() - DATE_SHIFT);
        //                var date = d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getYear() - 100;
        //                for (y = 4; rows[y][0] != undefined; y++)
        //                {
        //                    var sheetdate = rows[y][0].split("/");
        //                    if (d.getMonth() + 1 == sheetdate[0] && d.getDate() == sheetdate[1] && d.getYear() - 100 == sheetdate[2])
        //                    {
        //                        break;
        //                    }
        //                }

        //                var tempmessage = ""; 
        //                var w;
        //                for (w = y; w > 4; w--)
        //                {
        //                    var z;
        //                    for (z = 1; z < x; z++)
        //                    {
        //                        if ((rows[w][z] == undefined || rows[w][z] == "") && w > parseInt(rows[4][x]))
        //                        {
        //                            tempmessage += rows[1][z] + "\n";
        //                        }
        //                    }
        //                    var arr = rows[w][0].split("/");
        //                    var date = arr[0] + "/" + arr[1] + "/20" + arr[2];
        //                    if (tempmessage.length > 0)
        //                    {
        //                        tempmessage = "Missing rates for " + date + ": \n" + tempmessage;
        //                        returnmessage += tempmessage + "\n";
        //                    }
        //                    tempmessage = "";
        //                }
        //                Bot.sendMessage(returnmessage);

        //            });

        //        })
        //        .catch((err) => {
        //            console.log('auth error', err);
        //        });

        //}
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
                            Bot.sendMessage("Error with sheets API (get) " + err.code);
                            return;
                        }
                        var rows = response.values;
                        var x;
                        for (x = 0; rows[0][x] != undefined && rows[0][x] != message.user_id; x++)

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
            return "/rate #\n/ratedate # mm/dd/yy\n/link\n/missing\n/speak\n/fortune\n/nag\n/rem\n/buy\n/buy #\n/buy rare #\n/powerball\n/powerball pick # # # # # #\n/truedailydouble (or /tdd)\n/cards\n/points\n/slots #\n/trade # Name of your card, # Name of your other card; Person's name (spelled as in the chart); # Name of their card, # Name of their other card\n/trades\n/accept #\n/decline #\n/puzzle\n/solve";
        }

        else if (arr.length == 1 && arr[0] == "/speak")
        {
            var speaks = process.env.SPEAKS.split("/");
            var i = Math.floor(Math.random() * speaks.length);
            return speaks[i];
        }    

        else if (arr.length >= 1 && (arr[0] == "/link" || arr[0] == "/chart")) {
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
                            Bot.sendMessage("Error with sheets API (get) " + err.code);
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
                        do {
                            numbers[0] = Math.floor(Math.random() * 69 + 1);
                            numbers[1] = Math.floor(Math.random() * 69 + 1);
                            numbers[2] = Math.floor(Math.random() * 69 + 1);
                            numbers[3] = Math.floor(Math.random() * 69 + 1);
                            numbers[4] = Math.floor(Math.random() * 69 + 1);
                        } while (!isUnique(numbers));
                        numbers.sort(function(a, b){return a-b});
                        var powerball = Math.floor(Math.random() * 26) + 1;

                        if (x != 0)
                            Bot.sendMessage(rows[z][1] + "\n\nLearn Chinese: " + rows[w][3] + "\nLucky numbers: " + numbers[0] + " " + numbers[1] + " " + numbers[2] + " " + numbers[3] + " " + numbers[4] + " " + powerball + " ");
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
                                Bot.sendMessage("Error with sheets API (update) " + err.code);
                            }
                        });

                    });
                })
                .catch((err) => {
                    console.log('auth error', err);
                });
        }
        else if (arr[0] == "/slots")
        {
            var odds = 1;
            if (arr.length >= 2)
            {
                odds = parseInt(arr[1]);
            }

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
                            Bot.sendMessage("Error with sheets API (get)");
                            return;
                        }
                        var rows = response.values;
                        var x;
                        for (x = 0; rows[0][x] != message.user_id && rows[0][x] != undefined; x++);
                        if (isNaN(parseInt(rows[2][x])) || parseInt(rows[2][x]) - odds < 0)
                            Bot.sendMessage("Not enough points");
                        else if (isNaN(parseInt(arr[1])) || odds <= 0 || odds > 3)
                            Bot.sendMessage("Invalid amount to play slots with. Pick from 1 - 3");
                        else
                        {
                            var returnmessage = "Current points: " + rows[2][x];
                            var arrows1left = "➡️";
                            var arrows1right = "⬅️";
                            var arrows2left = "⬛️";
                            var arrows2right = "⬛️";
                            var arrows3topleft = "⬛️";
                            var arrows3topright = "⬛️";
                            var arrows3botleft = "⬛️";
                            var arrows3botright = "⬛️";

                            if (odds == 2)
                            {
                                arrows2left = "➡️";
                                arrows2right = "⬅️";

                            }
                            if (odds == 3)
                            {
                                arrows2left = "➡️";
                                arrows2right = "⬅️";
                                arrows3topleft = "↘️";
                                arrows3topright = "↙️";
                                arrows3botleft = "↗️";
                                arrows3botright = "↖️";

                            }


                            var points = odds * -1;
                            var draws = [];
                            var choices = [];
                            choices.push("😂");
                            choices.push("👻");
                            choices.push("👌");
                            choices.push("💮");
                            choices.push("7️⃣");
                            var prizes = [3, 5, 10, 25, 100];
                            var i;
                            for (i = 0; i < 9; i++)
                            {
                                var r = Math.floor(Math.random() * 20) + 1;
                                if (r <= 6)
                                    draws.push(choices[0]);
                                else if (r <= 11)
                                    draws.push(choices[1]);
                                else if (r <= 15)
                                    draws.push(choices[2]);
                                else if (r <= 18)
                                    draws.push(choices[3]);
                                else if (r <= 20)
                                    draws.push(choices[4]);
                            }
                            returnmessage += "\nPlaying slots with " + odds + " points \n" + arrows3topleft + "⬛️⬛️⬛️" + arrows3topright + "\n" + arrows2left + draws[0] + draws[1] + draws[2] + arrows2right + "\n" + arrows1left + draws[3] + draws[4] + draws[5] + arrows1right + "\n" + arrows2left + draws[6] + draws[7] + draws[8] + arrows2right + "\n" +  arrows3botleft + "⬛️⬛️⬛️" + arrows3botright;
                            var wonpoints = 0;
                            if (draws[3] == draws[4] && draws[4] == draws[5])
                            {
                                returnmessage += "\nMatching middle row: ";
                                if (draws[4] == choices[0])
                                    wonpoints += prizes[0];
                                if (draws[4] == choices[1])
                                    wonpoints += prizes[1];
                                if (draws[4] == choices[2])
                                    wonpoints += prizes[2];
                                if (draws[4] == choices[3])
                                    wonpoints += prizes[3];
                                if (draws[4] == choices[4])
                                    wonpoints += prizes[4];
                                returnmessage += wonpoints + " points";
                                points += wonpoints;
                            }

                            if (odds >= 2 && draws[0] == draws[1] && draws[1] == draws[2])
                            {
                                returnmessage += "\nMatching top row: ";
                                if (draws[0] == choices[0])
                                    wonpoints += prizes[0];
                                if (draws[0] == choices[1])
                                    wonpoints += prizes[1];
                                if (draws[0] == choices[2])
                                    wonpoints += prizes[2];
                                if (draws[0] == choices[3])
                                    wonpoints += prizes[3];
                                if (draws[0] == choices[4])
                                    wonpoints += prizes[4];
                                returnmessage += wonpoints + " points";
                                points += wonpoints;
                            }
                            if (odds >= 2 && draws[6] == draws[7] && draws[7] == draws[8])
                            {
                                returnmessage += "\nMatching bottom row: ";
                                if (draws[6] == choices[0])
                                    wonpoints += prizes[0];
                                if (draws[6] == choices[1])
                                    wonpoints += prizes[1];
                                if (draws[6] == choices[2])
                                    wonpoints += prizes[2];
                                if (draws[6] == choices[3])
                                    wonpoints += prizes[3];
                                if (draws[6] == choices[4])
                                    wonpoints += prizes[4];
                                returnmessage += wonpoints + " points";
                                points += wonpoints;
                            }
                            if (odds >= 3 && draws[0] == draws[4] && draws[4] == draws[8])
                            {
                                returnmessage += "\nMatching top left to bottom right diagonal: ";
                                if (draws[0] == choices[0])
                                    wonpoints += prizes[0];
                                if (draws[0] == choices[1])
                                    wonpoints += prizes[1];
                                if (draws[0] == choices[2])
                                    wonpoints += prizes[2];
                                if (draws[0] == choices[3])
                                    wonpoints += prizes[3];
                                if (draws[0] == choices[4])
                                    wonpoints += prizes[4];
                                returnmessage += wonpoints + " points";
                                points += wonpoints;
                            }
                            if (odds >= 3 && draws[2] == draws[4] && draws[4] == draws[6])
                            {
                                returnmessage += "\nMatching top right to bottom left diagonal: ";
                                if (draws[2] == choices[0])
                                    wonpoints += prizes[0];
                                if (draws[2] == choices[1])
                                    wonpoints += prizes[1];
                                if (draws[2] == choices[2])
                                    wonpoints += prizes[2];
                                if (draws[2] == choices[3])
                                    wonpoints += prizes[3];
                                if (draws[2] == choices[4])
                                    wonpoints += prizes[4];
                                returnmessage += wonpoints + " points";
                                points += wonpoints;
                            }
                            rows[2][x] = parseInt(rows[2][x]) + points;
                            returnmessage += "\nYou have won " + wonpoints + " and now have " + rows[2][x];
                            Bot.sendMessage(returnmessage);
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
                                Bot.sendMessage("Error with sheets API (update) " + err.code);
                            }
                        });


                    });
                })
                .catch((err) => {
                    console.log('auth error', err);
                });

        }
        else if (arr[0] == "/trade")
        {
            var tradestring = messageText.substring(7);
            console.log(tradestring);
            var split = tradestring.split(";");
            if (split.length != 3)
                return "Trade error, incorrect number of semicolons";
            var user1 = split[0];
            var user2name = split[1];
            var user2 = split[2];
            var user1cards = user1.split(",");
            var user2cards = user2.split(",");
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
                            Bot.sendMessage("Error with sheets API (get)");
                            return;
                        }
                        var valid = true;
                        user2name = user2name.trim();
                        var rows = response.values;
                        var x;
                        for (x = 0; rows[0][x] != message.user_id && rows[0][x] != undefined; x++);
                        var y;
                        for (y = 3; user2name != rows[1][y] && rows[1][y] != undefined; y++)
                            console.log(rows[1][y]);

                        if (rows[1][y] == undefined || rows[1][y] == "")
                        {
                            valid = false;
                            Bot.sendMessage("User specified does not exist in chart");
                        }
                        var z;
                        for (z = 0; z < user1cards.length; z++)
                        {
                            user1cards[z] = user1cards[z].trim();
                            var q;
                            var cardamount = parseInt(user1cards[z]);
                            console.log("Card amount:" + cardamount);
                            var cardamountstring = "" + cardamount;
                            var card = user1cards[z].substring(cardamountstring.length);
                            card = card.trim();
                            console.log("Trimmed card: " + card);
                            for (q = 0; rows[q][0] != card && rows[q][0] != "end"; q++);

                            if (rows[q][0] == "end")
                            {
                                valid = false;
                                Bot.sendMessage(card + " is not a card");
                            }
                        }

                        for (z = 0; z < user2cards.length; z++)
                        {
                            user2cards[z] = user2cards[z].trim();
                            var q;
                            var cardamount = parseInt(user2cards[z]);
                            if (isNaN(cardamount) || cardamount < 0)
                            {
                                Bot.sendMessage("Invalid card amount");
                                valid = false;
                            }
                            var cardamountstring = "" + cardamount;
                            var card = user2cards[z].substring(cardamountstring.length);
                            card = card.trim();
                            console.log("Trimmed card: " + card);
                            for (q = 0; rows[q][0] != card && rows[q][0] != "end"; q++);

                            if (rows[q][0] == "end")
                            {
                                valid = false;
                                Bot.sendMessage(card + " is not a card");
                            }
                        }

                        if (valid == true)
                        {
                            Bot.sendMessage("Trade pending, waiting on " + user2name + " approval. Do /trades and /accept # or /decline #"); 
                            var x;
                            for (x = 0; rows[x][25] != undefined && rows[x][TRADE_INDEX] != ""; x++)
                                console.log(x + " " + rows[x][TRADE_INDEX]);
                            rows[x][TRADE_INDEX] = rows[0][y] + ";" + user2 + ";" + message.user_id + ";" + user1; 


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
                                    Bot.sendMessage("Error with sheets API (update) " + err.code);
                                }
                            });
                        }

                    });
                })
                .catch((err) => {
                    console.log('auth error', err);
                });
        }
        else if (arr[0] == "/trades")
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
                            Bot.sendMessage("Error with sheets API (get)");
                            return;
                        }
                        var valid = true;
                        var rows = response.values;
                        var x;
                        for (x = 0; rows[0][x] != message.user_id && rows[0][x] != undefined; x++);
                        var y;
                        var count = 1;
                        var returnmessage = "";
                        for (y = 0; rows[y][TRADE_INDEX] != undefined && rows[y][TRADE_INDEX] != ""; y++)
                        {
                            if (parseInt(rows[y][TRADE_INDEX]) == message.user_id)
                            {
                                var split = rows[y][TRADE_INDEX].split(";");
                                var user2id = split[2];
                                var z;
                                for (z = 4; rows[0][z] != user2id; z++);
                                returnmessage += "Trade " + count + ": " + rows[1][z] + "'s " + split[3] + " for your " + split[1] + "\n";
                                count++;
                            }
                        }
                        if (returnmessage == "")
                            Bot.sendMessage("No pending trades");
                        else
                            Bot.sendMessage("Trades: \n" + returnmessage);

                    });
                })
                .catch((err) => {
                    console.log('auth error', err);
                });
        }

        else if (arr[0] == "/accept")
        {
            if (arr.length == 1 || isNaN(parseInt(arr[1])))
                return "Invalid trade to accept";

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
                            Bot.sendMessage("Error with sheets API (get)");
                            return;
                        }
                        var valid = true;
                        var rows = response.values;
                        for (x = 0; rows[0][x] != message.user_id && rows[0][x] != undefined; x++);
                        var count = 0;
                        var y;
                        var target = parseInt(arr[1]);
                        if (target < 1)
                        {
                            Bot.sendMessage("Invalid trade to accept");
                            return;
                        }
                        for (y = 0; count < target && (y == 0 || rows[y - 1][TRADE_INDEX]) != undefined; y++)
                        {
                            if (parseInt(rows[y][TRADE_INDEX]) == message.user_id)
                                count++;
                            console.log(y + " " + count + " " + target + " " + parseInt(rows[y][TRADE_INDEX]));
                        }
                        y--;
                        console.log(rows[y][TRADE_INDEX]);
                        if (rows[y][TRADE_INDEX] == undefined || rows[y][TRADE_INDEX] == "")
                        {
                            Bot.sendMessage("Invalid trade to accept");
                            return;
                        }

                        var split = rows[y][TRADE_INDEX].split(";");
                        var id1 = parseInt(split[0]);
                        var cards1 = split[1].split(",");
                        var id2 = parseInt(split[2]);
                        var cards2 = split[3].split(",");

                        var user1index;
                        var user2index;
                        var card1indexes = [];
                        var card1amounts = [];
                        var card2indexes = [];
                        var card2amounts = [];
                        for (user1index = 3; parseInt(rows[0][user1index]) != id1; user1index++); 
                        for (user2index = 3; parseInt(rows[0][user2index]) != id2; user2index++); 
                        var z;
                        for (z = 0; z < cards1.length && valid == true; z++)
                        {
                            var q;
                            var cardamount = parseInt(cards1[z]);
                            var cardamountstring = "" + cardamount;
                            console.log("Card amount length: " + cardamountstring);
                            var card = cards1[z];
                            card = card.trim();
                            card = card.substring(cardamountstring.length);
                            card = card.trim();
                            console.log(card);
                            for (q = 3; rows[q][0] != card; q++);
                            if (parseInt(rows[q][user1index]) < cardamount)
                            {
                                valid = false;
                                Bot.sendMessage(rows[1][user1index] + " does not have " + cardamount + " " + rows[q][0] + ". Deleting trade");

                                var r;
                                for (r = y; rows[r][TRADE_INDEX] != undefined && rows[r][TRADE_INDEX] != ""; r++)
                                {
                                    rows[r][TRADE_INDEX] = rows[r + 1][TRADE_INDEX];
                                }
                                rows[r - 1][TRADE_INDEX] = "";

                            }
                            card1indexes.push(q);
                            card1amounts.push(cardamount);

                        }
                        for (z = 0; z < cards2.length && valid == true; z++)
                        {
                            var q;
                            var cardamount = parseInt(cards2[z]);
                            var cardamountstring = "" + cardamount;
                            console.log("Card amount length: " + cardamountstring);
                            var card = cards2[z];
                            card = card.trim();
                            card = card.substring(cardamountstring.length);
                            card = card.trim();
                            console.log(card);
                            for (q = 2; rows[q][0] != card; q++);
                            if (parseInt(rows[q][user2index]) < cardamount)
                            {
                                valid = false;
                                Bot.sendMessage(rows[1][user2index] + " does not have " + cardamount + " " + rows[q][0] + ". Deleting trade");

                                var r;
                                for (r = y; rows[r][TRADE_INDEX] != undefined && rows[r][TRADE_INDEX] != ""; r++)
                                {
                                    rows[r][TRADE_INDEX] = rows[r + 1][TRADE_INDEX];
                                }
                                rows[r - 1][TRADE_INDEX] = "";

                            }
                            card2indexes.push(q);
                            card2amounts.push(cardamount);
                        }

                        if (valid == true)
                        {
                            var t;
                            for (t = 0; t < card1indexes.length; t++)
                            {
                                rows[card1indexes[t]][user1index] = parseInt(rows[card1indexes[t]][user1index]) - card1amounts[t];
                                rows[card1indexes[t]][user2index] = parseInt(rows[card1indexes[t]][user2index]) + card1amounts[t];
                            }
                            for (t = 0; t < card2indexes.length; t++)
                            {
                                rows[card2indexes[t]][user2index] = parseInt(rows[card2indexes[t]][user2index]) - card2amounts[t];
                                rows[card2indexes[t]][user1index] = parseInt(rows[card2indexes[t]][user1index]) + card2amounts[t];
                            }
                            var r;
                            for (r = y; rows[r][TRADE_INDEX] != undefined && rows[r][TRADE_INDEX] != ""; r++)
                            {
                                rows[r][TRADE_INDEX] = rows[r + 1][TRADE_INDEX];
                            }
                            rows[r - 1][TRADE_INDEX] = "";
                            Bot.sendMessage(rows[1][user1index] + " <---> " + rows[1][user2index] + " ✅");
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
                                Bot.sendMessage("Error with sheets API (update) " + err.code);
                            }
                        });
                    });
                })
                .catch((err) => {
                    console.log('auth error', err);
                });
        }
        else if (arr[0] == "/decline")
        {
            if (arr.length == 1 || isNaN(parseInt(arr[1])))
                return "Invalid trade to decline";

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
                            Bot.sendMessage("Error with sheets API (get)");
                            return;
                        }
                        var valid = true;
                        var rows = response.values;
                        for (x = 0; rows[0][x] != message.user_id && rows[0][x] != undefined; x++);
                        var count = 0;
                        var y;
                        var target = parseInt(arr[1]);
                        if (target < 1)
                        {
                            Bot.sendMessage("Invalid trade to decline");
                            return;
                        }
                        for (y = 0; count < target && (y == 0 || rows[y - 1][TRADE_INDEX]) != undefined; y++)
                        {
                            if (parseInt(rows[y][TRADE_INDEX]) == message.user_id)
                                count++;
                            console.log(y + " " + count + " " + target + " " + parseInt(rows[y][TRADE_INDEX]));
                        }
                        y--;
                        if (rows[y][TRADE_INDEX] == undefined || rows[y][TRADE_INDEX] == "")
                        {
                            Bot.sendMessage("Invalid trade to decline");
                            return;
                        }


                        var r;
                        for (r = y; rows[r][TRADE_INDEX] != undefined && rows[r][TRADE_INDEX] != ""; r++)
                        {
                            rows[r][TRADE_INDEX] = rows[r + 1][TRADE_INDEX];
                        }
                        rows[r - 1][TRADE_INDEX] = "";
                        Bot.sendMessage("Declined trade");

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
                                Bot.sendMessage("Error with sheets API (update) " + err.code);
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
            var extra = "";
            if (arr.length >= 8 && arr[1] == "pick" && parseInt(arr[2]) != NaN && parseInt(arr[3]) != NaN && parseInt(arr[4]) != NaN && parseInt(arr[5]) != NaN && parseInt(arr[6]) != NaN && parseInt(arr[7]) != NaN)
            {
                var extra = " with picked numbers";
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
            else if (arr.length < 8 && arr.length >= 1 && arr[1] == "pick")
                return "You didn't pick enough numbers";
            else
            {
                var extra = " with random numbers";
                p2 = Math.floor(Math.random() * 26 + 1);
                do 
                {
                    numbers2[0] = Math.floor(Math.random() * 69 + 1);
                    numbers2[1] = Math.floor(Math.random() * 69 + 1);
                    numbers2[2] = Math.floor(Math.random() * 69 + 1);
                    numbers2[3] = Math.floor(Math.random() * 69 + 1);
                    numbers2[4] = Math.floor(Math.random() * 69 + 1);
                } while (!isUnique(numbers2));
            }
            p1 = Math.floor(Math.random() * 26 + 1);
            var pSame = false;
            var points = 0;
            if (p1 == p2)
                pSame = true;
            do
            {
                numbers1[0] = Math.floor(Math.random() * 69 + 1);
                numbers1[1] = Math.floor(Math.random() * 69 + 1);
                numbers1[2] = Math.floor(Math.random() * 69 + 1);
                numbers1[3] = Math.floor(Math.random() * 69 + 1);
                numbers1[4] = Math.floor(Math.random() * 69 + 1);

            } while (!isUnique(numbers1));
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
                            Bot.sendMessage("Error with sheets API (get)");
                            return;
                        }
                        var rows = response.values;
                        var x;
                        for (x = 0; rows[0][x] != message.user_id && rows[0][x] != undefined; x++);
                        var not = "No";
                        if (pSame)
                            not = "Yes";
                        if (parseInt(rows[2][x]) == NaN || parseInt(rows[2][x]) <= 0)
                            Bot.sendMessage("You need 1 point to play the powerball and you have no points.");
                        else
                        {
                            var old = rows[2][x];
                            rows[2][x] = points + parseInt(rows[2][x]) - 1;
                            Bot.sendMessage("Playing powerball for " + message.name + extra + ". Current points: " + old + "\n" + "Powerball numbers: " + numbers1[0] + ", " + numbers1[1] + ", " + numbers1[2] + ", " + numbers1[3] + ", " + numbers1[4] + ", " + p1 + "\nYour numbers . . . . . :" + numbers2[0] + ", " + numbers2[1] + ", " + numbers2[2] + ", " + numbers2[3] + ", " + numbers2[4] + ", " + p2 + "\nMatching white balls: " + same + "\nPowerballs matched: " + not + "\nYou have won " + points + " points. You now have " + rows[2][x] + " points.");
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
                                Bot.sendMessage("Error with sheets API (update) " + err.code);
                            }
                        });


                    });
                })
                .catch((err) => {
                    console.log('auth error', err);
                });

        }
        else if (arr[0] == "/truedailydouble" || arr[0] == "/tdd")
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
                            Bot.sendMessage("Error with sheets API (get)");
                            return;
                        }
                        var rows = response.values;
                        var x;
                        for (x = 0; rows[0][x] != message.user_id && rows[0][x] != undefined; x++);
                        var points = parseInt(rows[2][x]);
                        if (parseInt(points) <= 0)
                        {
                            Bot.sendMessage("You have nothing to wager");
                        }
                        else
                        {
                            var r = Math.floor(Math.random() * 2);
                            var r = Math.random() * 2;
                            var r2 = Math.floor(r);
                            if (r2 == 1)
                            {
                                Bot.sendMessage("You have doubled your points from " + points + " to " + points * 2 + "! *applause*");
                                points *= 2;
                            }
                            else
                            {
                                Bot.sendMessage("So sorry, you lost everything. You went from " + points + " down to 0. Pick again");
                                points = 0;
                            }
                            rows[2][x] = points;
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
                                    Bot.sendMessage("Error with sheets API (update) " + err.code);
                                }
                            });
                        }


                    });
                })
                .catch((err) => {
                    console.log('auth error', err);
                });
        }
        else if (arr[0] == "/puzzle")
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
                            Bot.sendMessage("Error with sheets API (get)");
                            return;
                        }
                        var rows = response.values;
                        if (rows[0][PUZ_INDEX] == "" || rows[0][PUZ_INDEX] == undefined)
                            Bot.sendMessage("No puzzle right now");
                        else
                            Bot.sendMessage(rows[0][PUZ_INDEX]);


                    });
                })
                .catch((err) => {
                    console.log('auth error', err);
                });
        }
        else if (arr[0] == "/solve")
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
                            Bot.sendMessage("Error with sheets API (get)");
                            return;
                        }
                        var rows = response.values;
                        var x;
                        for (x = 0; rows[0][x] != message.user_id && rows[0][x] != undefined; x++);
                        var points = parseInt(rows[2][x]);

                        var solveString = messageText.substring(6).toLowerCase().trim().replace(/\s/g, '');
                        console.log(solveString);

                        if (rows[0][PUZ_INDEX] == "" || rows[0][PUZ_INDEX] == undefined)
                            Bot.sendMessage("No puzzle right now");
                        else if (arr.length <= 1 || solveString != rows[0][PUZ_INDEX + 1])
                            Bot.sendMessage("❌");
                        else 
                        {
                            points += parseInt(rows[0][PUZ_INDEX + 2]);
                            Bot.sendMessage("Solved puzzle. Added " + rows[0][PUZ_INDEX + 2] + " points for a total of " + points);
                            var y;
                            for (y = 0; rows[y][PUZ_INDEX] != undefined && rows[y][PUZ_INDEX] != ""; y++)
                            {
                                rows[y][PUZ_INDEX] = rows[y + 1][PUZ_INDEX];
                                rows[y][PUZ_INDEX + 1] = rows[y + 1][PUZ_INDEX + 1];
                                rows[y][PUZ_INDEX + 2] = rows[y + 1][PUZ_INDEX + 2];
                            }
                            rows[y - 1][PUZ_INDEX] = "";
                            rows[y - 1][PUZ_INDEX + 1] = "";
                            rows[y - 1][PUZ_INDEX + 2] = "";

                        }
                        rows[2][x] = points;
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
                                Bot.sendMessage("Error with sheets API (update) " + err.code);
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
        //else if (arr[0] == "/calc")
        //{
        //    var query = messageText.substring(5);
        //    Bot.sendMessage("Calculating " + query + "...");
        //    var wolfram = require('wolfram').createClient(process.env.WOLF_ID);
        //    wolfram.query(query, function(err, result) {
        //        if(err) throw err
        //        console.log("Result: %j", result[1].subpods[0].value)
        //        console.log("Result: %j", result[0].subpods[0].value)
        //        var res = result[1].subpods[0].value;
        //        if (res== "")
        //            res= result[0].subpods[0].value;
        //        Bot.sendMessage("Result: " + res);
        //    })
        //}
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
                            Bot.sendMessage("Error with sheets API (get) " + err.code);
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
                            Bot.sendMessage("Turned off nagging for " + rows[1][x]);
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
                                Bot.sendMessage("Error with sheets API (update) " + err.code);
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
                            Bot.sendMessage("Error with sheets API (get) " + err.code);
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
                            Bot.sendMessage("Turned off reminders for " + rows[1][x]);
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
                                Bot.sendMessage("Error with sheets API (update) " + err.code);
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
                            Bot.sendMessage("Error with sheets API (get) " + err.code);
                            return;
                        }
                        var cardCost = 1;
                        var rarity = 1; 
                        var extra = "";
                        if (arr.length >= 3 && arr[1] == "rare")
                        {
                            rarity = parseInt(arr[2]);
                            cardCost = parseInt(arr[2]);
                            extra = " with rarity multiplier of " + rarity;
                        }
                        var cardPicks = 1;
                        if (arr.length > 1 && arr[1] != "rare" && !isNaN(parseInt(arr[1])))
                            cardPicks = parseInt(arr[1]);
                        console.log("Card picks: " + cardPicks);
                        var rows = response.values;
                        var x, y;
                        for (x = 0; rows[0][x] != message.user_id && rows[0][x] != undefined; x++);
                        var returnmessage = "";
                        if (parseInt(rows[2][x]) - cardPicks * cardCost  < 0 || rows[2][x] == undefined || rows[2][x] == "")
                            Bot.sendMessage(message.name + ", you do not have enough points");
                        else if (arr.length >= 3 && arr[1] == "rare" && (parseInt(arr[2]) <= 0 || isNaN(parseInt(arr[2]))))
                            Bot.sendMessage("Invalid rarity to buy");
                        else
                        {
                            var z;
                            returnmessage += rows[1][x] + " drew " + cardPicks + " cards " + extra +":\n";
                            for (z = 0; z < cardPicks; z++)
                            {
                                var r = Math.floor(Math.random() * parseInt(rows[1][3]));
                                console.log(r);
                                r = Math.pow(r / parseInt(rows[1][3]), 1 / Math.pow(rarity, 1.4)) * parseInt(rows[1][3]);
                                console.log(r);
                                for (y = 3; parseInt(rows[y][2]) < r; y++);
                                rows[2][x] = parseInt(rows[2][x]) - cardCost;
                                rows[y][x] = parseInt(rows[y][x]) + 1;
                                returnmessage += rows[y][0] + "\n"; 
                            }
                            returnmessage += "Points remaining: " + rows[2][x];
                            Bot.sendMessage(returnmessage);
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
                                Bot.sendMessage("Error with sheets API (update) " + err.code);
                            }
                        });


                    });
                })
                .catch((err) => {
                    console.log('auth error', err);
                });
        }
        else if (arr[0] == "/cards" || arr[0] == "/points")
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
                            Bot.sendMessage("Error with sheets API (get) " + err.code);
                            return;
                        }
                        var rows = response.values;
                        var x, y;
                        for (x = 0; rows[0][x] != message.user_id && rows[0][x] != undefined; x++);
                        var returnmessage = rows[1][x] + " has " + rows[2][x] + " points. ";
                        var cardcount = 0;
                        var totalcards = 0;
                        var cardarray = [];
                        if (arr[0] == "/cards")
                        {
                            returnmessage += "You have the following cards:\n";
                            for (y = 3; rows[y][x] != "end"; y++)
                            {
                                if (parseInt(rows[y][x]) > 0)
                                {
                                    cardarray.push("" + rows[y][x] + " " + rows[y][0] + "\n");
                                    cardcount++;
                                }
                                totalcards++;
                            }

                            cardarray.reverse();
                            for (y = cardarray.length - 1; y >= 0; y--)
                                returnmessage += cardarray[y];  
                            returnmessage += "You have collected " + cardcount + "/" + totalcards + " cards.";
                        }
                        Bot.sendMessage(returnmessage);
                    });
                })

        }

        //else if (arr[0] == "/watchsamlistentomusic")
        //{
        //    const API = require('last.fm.api'),
        //        api = new API({ 
        //            apiKey: '0c636368e41c768ae83b9fa349de4103', 
        //            apiSecret: '1b59c38f3add4b76412bd40a881be2f1'
        //        });
        //    api.user.getRecentTracks({
        //        //user: 'fourfourbuilder',
        //        user: 'fourfourbuilder',
        //    })
        //    .then(json => { 
        //        api.artist.getInfo({
        //            artist: json.recenttracks.track[0].artist["#text"],
        //            username: 'fourfourbuilder',
        //        })
        //        .then(json2 => {
        //            if ( json.recenttracks.track[0]["@attr"] != undefined && json.recenttracks.track[0]["@attr"].nowplaying == "true")
        //                Bot.sendMessage("Sam is currently listening to " + json.recenttracks.track[0].name + " by " + json.recenttracks.track[0].artist["#text"] + ". He has listened to this artist " + json2.artist.stats.userplaycount + " times"); 
        //            else
        //            {
        //                Bot.sendMessage("Sam is not listening to anything right now but he listened to " + json.recenttracks.track[0].name + " by " + json.recenttracks.track[0].artist["#text"] + " on " + json.recenttracks.track[0].date["#text"] + ". He has listened to this artist " + json2.artist.stats.userplaycount + " times");
        //            }
        //        })
        //        .catch(err => { console.log(err); })
        //    })

        //    .catch(err => { console.log(err); })

        //}
        //else if (arr[0] == "/watchcorbettlistentomusic")
        //{
        //    const API = require('last.fm.api'),
        //        api = new API({ 
        //            apiKey: '0c636368e41c768ae83b9fa349de4103', 
        //            apiSecret: '1b59c38f3add4b76412bd40a881be2f1'
        //        });
        //    api.user.getRecentTracks({
        //        //user: 'fourfourbuilder',
        //        user: 'corbmr',
        //    })
        //    .then(json => { 
        //        api.artist.getInfo({
        //            artist: json.recenttracks.track[0].artist["#text"],
        //            username: 'corbmr',
        //        })
        //        .then(json2 => {
        //            if ( json.recenttracks.track[0]["@attr"] != undefined && json.recenttracks.track[0]["@attr"].nowplaying == "true")
        //                Bot.sendMessage("Corbett is currently listening to " + json.recenttracks.track[0].name + " by " + json.recenttracks.track[0].artist["#text"] + ". He has listened to this artist " + json2.artist.stats.userplaycount + " times"); 
        //            else
        //            {
        //                Bot.sendMessage("Corbett is not listening to anything right now but he listened to " + json.recenttracks.track[0].name + " by " + json.recenttracks.track[0].artist["#text"] + " on " + json.recenttracks.track[0].date["#text"] + ". He has listened to this artist " + json2.artist.stats.userplaycount + " times");
        //            }
        //        })
        //        .catch(err => { console.log(err); })
        //    })

        //    .catch(err => { console.log(err); })

        //}
        //else if (arr[0] == "/watchaaronlistentomusic")
        //{
        //    const API = require('last.fm.api'),
        //        api = new API({ 
        //            apiKey: '0c636368e41c768ae83b9fa349de4103', 
        //            apiSecret: '1b59c38f3add4b76412bd40a881be2f1'
        //        });
        //    api.user.getRecentTracks({
        //        //user: 'fourfourbuilder',
        //        user: 'John_Lawn',
        //    })
        //    .then(json => { 
        //        api.artist.getInfo({
        //            artist: json.recenttracks.track[0].artist["#text"],
        //            username: 'John_Lawn',
        //        })
        //        .then(json2 => {
        //            if ( json.recenttracks.track[0]["@attr"] != undefined && json.recenttracks.track[0]["@attr"].nowplaying == "true")
        //                Bot.sendMessage("Aaron is currently listening to " + json.recenttracks.track[0].name + " by " + json.recenttracks.track[0].artist["#text"] + ". He has listened to this artist " + json2.artist.stats.userplaycount + " times"); 
        //            else
        //            {
        //                Bot.sendMessage("Aaron is not listening to anything right now but he listened to " + json.recenttracks.track[0].name + " by " + json.recenttracks.track[0].artist["#text"] + " on " + json.recenttracks.track[0].date["#text"] + ". He has listened to this artist " + json2.artist.stats.userplaycount + " times");
        //            }
        //        })
        //        .catch(err => { console.log(err); })
        //    })

        //    .catch(err => { console.log(err); })

        //}
        else if (arr[0] == "/fillabstain")
        {
            googleAuth.authorize()
                .then((auth) => {

                    var sheets = google.sheets('v4');
                    sheets.spreadsheets.values.get({
                        auth: auth,
                        spreadsheetId: SPREADSHEET_ID,
                        range: RANGE,
                        valueRenderOption: 'FORMATTED_VALUE'

                    }, function(err, response) {
                        if (err) {
                            console.log('The API returned an error: ' + err);
                            Bot.sendMessage("Error with sheets API (get) " + err.code);
                            return;
                        }
                        var rows = response.values;
                        var x;
                        var id = message.user_id;
                        for (x = 0; rows[0][x] != undefined && rows[0][x] != id; x++);
                        if (rows[5][x] == "yes")
                        {
                            Bot.sendMessage(rows[1][x] + ", your account is suspended, please consult the rate chart administrator for further details");
                            return;
                        }

                        var extra = ""; 
                        rows[0][x] = id;
                        if (rows[1][x] == undefined || rows[1][x] == "")
                        {
                           Bot.sendMessage("You are not in the chart"); 
                            return;
                        }
                        
                        var y;
                        var points = 1;
                        var d = new Date();
                        d.setHours(d.getHours() - DATE_SHIFT);
                        d.setHours(0, 0, 0, 0);
                        d.setDate(d.getDate() - 1);
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
                        var abstaincount = 0;
                        for (var g = parseInt(rows[4][x]); g <= y; g++)
                        {
                            if (rows[g][x] == "" || rows[g][x] == undefined)
                            {
                                abstaincount++;
                                rows[g][x] = "abstain";
                            }
                        }

                        Bot.sendMessage("Filled abstain for " + abstaincount + " missing rates");

                        rows[1][0] = rows[0][0].substring(1);
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
                                Bot.sendMessage("Error with sheets API (update) " + err.code);
                            }
                        });

                    });
                })
                .catch((err) => {
                    console.log('auth error', err);
                });
        }
        else if (arr[0] == "/alert" && message.user_id == 34102858)
        {
            Bot.ratealert(); 
        }
        else if (arr[0].charAt(0) == '/' && bot == false)
        {
            Bot.sendMessage("'" + arr[0].substring(1) + "' is not a valid command. Do /help to see commands");
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
                            Bot.sendMessage(rows[1][x] + ", please rate :(");
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
            body.attachments[0].loci.push([0, 9]);
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
                    range: RANGE,
                    valueRenderOption: 'FORMATTED_VALUE'

                }, function(err, response) {
                    if (err) {
                        console.log('The API returned an error: ' + err);
                        Bot.sendMessage("Error with sheets API (get) " + err.code);
                        return;
                    }
                    var rows = response.values;
                    var x;
                    for (x = 0; rows[0][x] != undefined && rows[0][x] != id; x++);
                    if (rows[5][x] == "yes")
                    {
                        Bot.sendMessage(rows[1][x] + ", your account is suspended, please consult the rate chart administrator for further details");
                        return;
                    }

                    var extra = ""; 
                    rows[0][x] = id;
                    if (rows[1][x] == undefined || rows[1][x] == "")
                    {
                        rows[1][x] = name;
                        rows[2][x] = "nag";
                        rows[3][x] = "rem";
                        rows[5][x] = "no";
                        extra += "\nWelcome new rater!";
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
                        {
                            console.log(y + " " + w);
                            first = false;
                        }
                    var mysTest = new Date();
                    mysTest.setHours(mysTest.getHours() - DATE_SHIFT);
                    if (first == true)
                    {
                        points += 2;
                        extra += "\nFirst rate bonus 😎 ";
                        if (rows[1][1] == id)
                        {
                            extra += "\nFirst-rate streak of " + rows[2][1] + "!";
                            points += parseInt(rows[2][1]) - 1;
                            rows[2][1] = parseInt(rows[2][1]) + 1;
                        }
                        else
                        {
                            rows[1][1] = id;
                            rows[2][1] = 2;
                        }

                    }
                    var mysTest = new Date();
                    mysTest.setHours(mysTest.getHours() - DATE_SHIFT);
                    var hours = mysTest.getHours();
                    var mins = mysTest.getMinutes();
                    if (hours == 0)
                        hours = 12;
                    if (hours > 12)
                        hours %= 12;
                    if (hours * 11 == mins || (hours == mins && mins > 9))
                    {
                        points += 1;
                        extra += "\nMystery bonus 👀 ";
                    }
                    console.log("Hours:" + hours);
                    console.log("Minutes:" + mins);
                    var q;
                    var sameCount = 1;
                    for (q = y - 1; parseInt(rows[q][x]) == rate; q--)
                        sameCount++;

                    if (rate > 5 && sameCount >= 3 && arr[0] == "/rate")
                    {
                        extra += "\n" + sameCount + "-day streak of of " + rate + "!";
                    }
                    console.log("Streak: " + sameCount);

                    if (parseInt(rows[4][x]) + 3 < y && arr[0] == "/rate")
                    {
                        var ratemessage = false;
                        for (var g = 1; g <= 3; g++) 
                        {
                            if (rows[y - g][x] == undefined || rows[y - g][x] == "")
                            {
                                if (!ratemessage)
                                {
                                    extra += "\nRecent missing rates:";
                                    ratemessage = true;
                                }
                                extra += "\n" + rows[y - g][0];
                            }
                        }
                        var missingcount = 0;
                        for (var g = parseInt(rows[4][x]); g < y - 3; g++) 
                        {
                            if (rows[g][x] == "" || rows[g][x] == undefined)
                            {
                                missingcount++; 
                            }
                        }
                        if (missingcount > 0)
                        {
                            if (missingcount > 1)
                                extra += "\nYou have " + missingcount + " non-recent missing rates, ";
                            else if (missingcount == 1)
                                extra += "\nYou have" + missingcount + " non-recent missing rate, ";
                            
                            extra += "Do /missing or /fillabstain";
                        }

                    }
                    if (rate == "abstain")
                    {
                        points = 0;
                    }

                    if (rows[y][x] == undefined || rows[y][x] == "")
                    {
                        if (arr[0] == "/rate")
                        {
                            if ((parseInt(rows[1][0]) + 1) % 500 == 0)
                            {
                                extra += "\nCongrats on being the " + (parseInt(rows[1][0]) + 1) + "th rate in the chart! Enjoy " + (parseInt(rows[1][0]) + 1) / 100 + " extra points";
                                points += (parseInt(rows[1][0]) + 1) /  100;
                            }
                            extra += "\nAdded " + points + " points";
                            Bot.pointEnter(id, points);
                        }
                        Bot.sendMessage("Logged rate of " + rate + " for " +  name + " for " + daterate + extra); 
                    }
                    else if (rows[y][x] == rate)
                        Bot.sendMessage(name + ", you have already logged " + rate + " for " + daterate);  
                    else
                        Bot.sendMessage("Changed rate from " + rows[y][x] + " to " + rate + " for " + name + " for " + daterate);

                    rows[y][x] = rate;

                    rows[1][0] = rows[0][0].substring(1);
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
                            Bot.sendMessage("Error with sheets API (update) " + err.code);
                        }
                    });

                });
            })
            .catch((err) => {
                console.log('auth error', err);
            });
    }

static getDateFormat(date)
{
    return (date.getMonth() + 1) + "/" + date.getDate() + "/" + (date.getYear() - 100);
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
                    Bot.sendMessage("Point entering error " + err.code);
                    return;
                }
                var rows = response.values;
                var x;
                for (x = 0; rows[0][x] != id && rows[0][x] != undefined; x++);
                rows[2][x] = points + parseInt(rows[2][x]);;
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
                        console.log('Data Error :', err);
                        Bot.sendMessage("Point entering error " + err.code);
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
                    Bot.sendMessage("Error with rate alert " + err.code + " please just rate");
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
                    Bot.sendMessageAlert("Bing bong it's your daily 5PM EST rate reminder\n"
                        + "Need yesterday rates from " + names + "\n/rem to turn off reminders", ids);
                }
            });
        })
        .catch((err) => {
            console.log('auth error', err);
        });

}


};
module.exports = Bot;
