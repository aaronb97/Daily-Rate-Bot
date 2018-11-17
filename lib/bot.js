'use strict';

require('dotenv').config({silent: true});

const https = require('https');

const RANGE = 'Rates and Daily Stats!A1:ZZ1000';
const CARD_RANGE = 'Cards!A1:AE1000';
const TRADE_INDEX = 25;
const google = require('googleapis');
const sheetsApi = google.sheets('v4');
const googleAuth = require('../auth');
require('dotenv').config({silent: true});
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
        const moment = require('moment-timezone');

        var splitMessage = messageText.split(" ");

        //return if sender isn't a human
        if (message.sender_type != 'user')
            return;

        //case insensitive commands
        if (splitMessage[0].charAt(0) == '/')
        {
            splitMessage[0] = splitMessage[0].toLowerCase();
        }

        var returnmessage = "";

        if (splitMessage.length >= 2 && splitMessage.length <= 5 && messageText.length < 30 && splitMessage[0] == "/rate") {
            if (splitMessage.length >= 3)
                splitMessage[1] = splitMessage[1].toLowerCase();

            let rate = parseInt(splitMessage[1]);
            splitMessage[1] = splitMessage[1].trim();

            if (splitMessage.length >= 3)
                var dateTest = splitMessage[2].split("/");

            if (dateTest != undefined && dateTest.length == 3) 
                return "You probably meant to use /ratedate";

            if (!isValidRate(splitMessage[1]))
                return "You are not allowed to rate " + messageText.substring(5); 
            else
            {
                let dateString =  moment().add(-1, 'days').tz("America/New_York").format("MM/DD/YY");
                Bot.rateEnter(message.user_id, name, splitMessage[1], dateString, splitMessage);

                console.log("Logged rate of " + splitMessage[1] + " for " +  name + " for " + dateString);
            }
        }
        else if (splitMessage[0] == "/ratedate" || splitMessage[0] == "/daterate")
        {
            if (splitMessage.length < 3)
                return "Incorrect format do /ratedate mm/dd/yy #";

            //swap arguments if 2nd argument has date format
            let dateTest = splitMessage[1].split("/");
            if (dateTest != undefined && dateTest.length == 3)
            {
                var temp = splitMessage[1];
                splitMessage[1] = splitMessage[2];
                splitMessage[2] = temp;
            }

            let rate = parseInt(splitMessage[1]);

            if (!isValidRate(splitMessage[1]))
                return "You are not allowed to rate " + messageText.subString(5);

            var datesplit = splitMessage[2].split("/");
            if (parseInt(datesplit[2]) < 100)
            {
                datesplit[2] = "" + (parseInt(datesplit[2]) + 2000);
                splitMessage[2] = datesplit[0] + "/" + datesplit[1] + "/" + datesplit[2];
            }

            let parsedDateObject = moment(splitMessage[2], ["MM/DD/YYYY", "M/DD/YYYY", "M/D/YYYY", "MM/D/YYYY"], true);

            if (!parsedDateObject.isValid())
                return splitMessage[2] + " is not a valid date";
            if (parsedDateObject.year() < 2018)
                return splitMessage[2] + " predates the chart";

            let currentDateObject = moment();

            if (parsedDateObject > currentDateObject)
            {
                return "You may not rate into the future";
            }

            let dateString = parsedDateObject.format("M/D/YY");

            Bot.rateEnter(message.user_id, name, splitMessage[1], dateString, splitMessage);
            console.log("Logged rate of " + splitMessage[1] + " for " +  name + " on " + dateString)
        }
        else if (splitMessage[0] == "/missing")
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

                        let dateString =  moment().add(-1, 'days').tz("America/New_York").format("MM/DD/YY");
                        let rateRow = findRateRow(rows, dateString);

                        var z;
                        for (z = 4; z <= rateRow; z++)
                        {
                            if (isEmpty(rows[z][x]) && z >= rows[4][x])
                            {
                                returnmessage += rows[z][0] + "\n";
                            }
                        }

                        if (rows[0][x] == "" || rows[0][x] == undefined)
                            Bot.sendMessage("You are not in the chart");
                        else if (returnmessage != "")
                            Bot.sendMessage("Missing rates for " + rows[1][x] + ":\n" + returnmessage + "\nUse /ratedate # mm/dd/yy");
                        else
                            Bot.sendMessage(rows[1][x] + ", you are up to date");
                    });

                })
                .catch((err) => {
                    console.log('auth error', err);
                });
        }
        else if (splitMessage[0] == "/help")
        {
            if (splitMessage[1] == "trade")
                return "/trade # Name of your card, # Name of your other card; Person's name (spelled as in the chart); # Name of their card, # Name of their other card\n/trades\n/accept #\n/decline #";
            return "/rate #\n/ratedate # mm/dd/yy\n/link\n/missing\n/speak\n/fortune\n/rem\n/buy\n/buy #\n/buy rare #\n/powerball\n/powerball pick # # # # # #\n/truedailydouble (or /tdd)\n/cards\n/points\n\nDo '/help trade' for trade help";
        }

        else if (splitMessage.length == 1 && splitMessage[0] == "/speak")
        {
            var speaks = process.env.SPEAKS.split("/");
            var i = Math.floor(Math.random() * speaks.length);
            return speaks[i];
        }    

        else if (splitMessage.length >= 1 && (splitMessage[0] == "/link" || splitMessage[0] == "/chart")) {
            return "https://docs.google.com/spreadsheets/d/" + SPREADSHEET_ID;
        }
        else if (splitMessage[0] == "/trade")
        {
            var tradestring = messageText.substring(7);
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
                            var cardamountstring = "" + cardamount;
                            var card = user1cards[z].substring(cardamountstring.length);
                            card = card.trim();
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
        else if (splitMessage[0] == "/trades")
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

        else if (splitMessage[0] == "/accept")
        {
            if (splitMessage.length == 1 || isNaN(parseInt(splitMessage[1])))
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
                        var target = parseInt(splitMessage[1]);
                        if (target < 1)
                        {
                            Bot.sendMessage("Invalid trade to accept");
                            return;
                        }
                        for (y = 0; count < target && (y == 0 || rows[y - 1][TRADE_INDEX]) != undefined; y++)
                        {
                            if (parseInt(rows[y][TRADE_INDEX]) == message.user_id)
                                count++;
                        }
                        y--;
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
                            var card = cards1[z];
                            card = card.trim();
                            card = card.substring(cardamountstring.length);
                            card = card.trim();
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
                            var card = cards2[z];
                            card = card.trim();
                            card = card.substring(cardamountstring.length);
                            card = card.trim();
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
        else if (splitMessage[0] == "/decline")
        {
            if (splitMessage.length == 1 || isNaN(parseInt(splitMessage[1])))
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
                        var target = parseInt(splitMessage[1]);
                        if (target < 1)
                        {
                            Bot.sendMessage("Invalid trade to decline");
                            return;
                        }
                        for (y = 0; count < target && (y == 0 || rows[y - 1][TRADE_INDEX]) != undefined; y++)
                        {
                            if (parseInt(rows[y][TRADE_INDEX]) == message.user_id)
                                count++;
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
        else if (splitMessage[0] == "/powerball")
        {
            var numbers1 = [];
            var numbers2 = [];
            var p1, p2;
            var extra = "";
            if (splitMessage.length >= 8 && splitMessage[1] == "pick" && parseInt(splitMessage[2]) != NaN && parseInt(splitMessage[3]) != NaN && parseInt(splitMessage[4]) != NaN && parseInt(splitMessage[5]) != NaN && parseInt(splitMessage[6]) != NaN && parseInt(splitMessage[7]) != NaN)
            {
                var extra = " with picked numbers";
                numbers2.push(parseInt(splitMessage[2]));
                numbers2.push(parseInt(splitMessage[3]));
                numbers2.push(parseInt(splitMessage[4]));
                numbers2.push(parseInt(splitMessage[5]));
                numbers2.push(parseInt(splitMessage[6]));
                p2 = parseInt(splitMessage[7]);
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
            else if (splitMessage.length < 8 && splitMessage.length >= 1 && splitMessage[1] == "pick")
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
        else if (splitMessage[0] == "/truedailydouble" || splitMessage[0] == "/tdd")
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
                            var t = 0;
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
        else if (splitMessage[0] == "/nag")
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
        else if (splitMessage[0] == "/rem")
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
        else if (splitMessage[0] == "/buy")
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
                        if (splitMessage.length >= 3 && splitMessage[1] == "rare")
                        {
                            rarity = parseInt(splitMessage[2]);
                            cardCost = parseInt(splitMessage[2]);
                            extra = " with rarity multiplier of " + rarity;
                        }
                        var cardPicks = 1;
                        if (splitMessage.length > 1 && splitMessage[1] != "rare" && !isNaN(parseInt(splitMessage[1])))
                            cardPicks = parseInt(splitMessage[1]);
                        var rows = response.values;
                        var x, y;
                        for (x = 0; rows[0][x] != message.user_id && rows[0][x] != undefined; x++);
                        var returnmessage = "";
                        if (parseInt(rows[2][x]) - cardPicks * cardCost  < 0 || rows[2][x] == undefined || rows[2][x] == "")
                            Bot.sendMessage(message.name + ", you do not have enough points");
                        else if (splitMessage.length >= 3 && splitMessage[1] == "rare" && (parseInt(splitMessage[2]) <= 0 || isNaN(parseInt(splitMessage[2]))))
                            Bot.sendMessage("Invalid rarity to buy");
                        else
                        {
                            var z;
                            returnmessage += rows[1][x] + " drew " + cardPicks + " cards " + extra +":\n";
                            for (z = 0; z < cardPicks; z++)
                            {
                                var r = Math.floor(Math.random() * parseInt(rows[1][3]));
                                r = Math.pow(r / parseInt(rows[1][3]), 1 / Math.pow(rarity, 1.4)) * parseInt(rows[1][3]);
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
        else if (splitMessage[0] == "/cards" || splitMessage[0] == "/points")
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
                        var cardsplitMessageay = [];
                        if (splitMessage[0] == "/cards")
                        {
                            returnmessage += "You have the following cards:\n";
                            for (y = 3; rows[y][x] != "end"; y++)
                            {
                                if (parseInt(rows[y][x]) > 0)
                                {
                                    cardsplitMessageay.push("" + rows[y][x] + " " + rows[y][0] + "\n");
                                    cardcount++;
                                }
                                totalcards++;
                            }

                            cardsplitMessageay.reverse();
                            for (y = cardsplitMessageay.length - 1; y >= 0; y--)
                                returnmessage += cardsplitMessageay[y];  
                            returnmessage += "You have collected " + cardcount + "/" + totalcards + " cards.";
                        }
                        Bot.sendMessage(returnmessage);
                    });
                })

        }

        else if (splitMessage[0] == "/fillabstain")
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
                        
                        let dateString =  moment().add(-1, 'days').tz("America/New_York").format("MM/DD/YY");
                        let rateRow = findRateRow(rows, dateString);

                        var abstaincount = 0;
                        for (var g = parseInt(rows[4][x]); g <= rateRow; g++)
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
        else if (splitMessage[0].charAt(0) == '/')
        {
            Bot.sendMessage("'" + splitMessage[0].substring(1) + "' is not a valid command. Do /help to see commands");
        }
        

        return returnmessage;
        function isUnique(splitMessage) {
            for(var i = 0; i < splitMessage.length; i++) {
                if (splitMessage.indexOf(splitMessage[i]) != i) return false;
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

    static rateEnter(id, name, rate, dateString, splitMessage)
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
                    if (isEmpty(rows[1][x]))
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
                    
                    let rateRow = findRateRow(rows, dateString);

                    if (rows[4][x] == undefined || rows[4][x] == "")
                        rows[4][x] = rateRow;

                    var w;
                    var first = true;
                    var points = 1;
                    for (w = 2; !isEmpty(rows[0][w]); w++)
                    {
                        if (!isEmpty(rows[rateRow][w]))
                        {
                            first = false;
                        }
                    }

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
                    
                    var q;
                    var sameCount = 1;
                    for (q = rateRow - 1; parseInt(rows[q][x]) == rate; q--)
                        sameCount++;

                    if (parseInt(rows[4][x]) + 3 < rateRow && splitMessage[0] == "/rate")
                    {
                        var ratemessage = false;
                        for (var g = 1; g <= 3; g++) 
                        {
                            if (rows[rateRow - g][x] == undefined || rows[rateRow - g][x] == "")
                            {
                                if (!ratemessage)
                                {
                                    extra += "\nRecent missing rates:";
                                    ratemessage = true;
                                }
                                extra += "\n" + rows[rateRow - g][0];
                            }
                        }
                        if (ratemessage)
                        {
                            extra += "\nUse /ratedate # mm/dd/yy";
                        }
                        var missingcount = 0;
                        for (var g = parseInt(rows[4][x]); g < rateRow - 3; g++) 
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

                    if (rows[rateRow][x] == undefined || rows[rateRow][x] == "")
                    {
                        if (splitMessage[0] == "/rate")
                        {
                            if ((parseInt(rows[1][0]) + 1) % 500 == 0)
                            {
                                extra += "\nCongrats on being the " + (parseInt(rows[1][0]) + 1) + "th rate in the chart! Enjoy " + (parseInt(rows[1][0]) + 1) / 100 + " extra points";
                                points += (parseInt(rows[1][0]) + 1) /  100;
                            }
                            extra += "\nAdded " + points + " points";
                            Bot.pointEnter(id, points);
                        }
                        Bot.sendMessage("Logged rate of " + rate + " for " +  name + " for " + dateString + extra); 
                    }
                    else if (rows[rateRow][x] == rate)
                        Bot.sendMessage(name + ", you have already logged " + rate + " for " + dateString);  
                    else
                        Bot.sendMessage("Changed rate from " + rows[rateRow][x] + " to " + rate + " for " + name + " for " + dateString);

                    rows[rateRow][x] = rate;

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
                var names2 = "";
                var d = new Date();
                d.setDate(d.getDate() - 1);
                d.setHours(d.getHours() - DATE_SHIFT);

                let dateString =  moment().add(-1, 'days').tz("America/New_York").format("MM/DD/YY");
                let rateRow = findRateRow(rows, dateString);

                var ids = [];
                for (x = 0; rows[0][x] != undefined; x++)
                {
                    if (rows[3][x] != "norem" && isEmpty(rows[rateRow][x]))
                    {
                        names += rows[1][x] + ", ";
                        ids.push(parseInt(rows[0][x]));
                    }
                    if (rows[3][x] != "norem")
                    {
                        var z;
                        for (z = y - 1; z >= parseInt(rows[4][x]); z--)
                        {
                            if (isEmpty(rows[z][x]))
                            {
                                names2 += rows[1][x] + ", ";
                                ids.push(parseInt(rows[0][x]));
                                z = parseInt(rows[4][x]);
                            }
                        }
                    }
                }
                names = names.substring(0, names.length - 2);
                names2 = names2.substring(0, names2.length - 2);
                var message = "Bing bong it's your daily 5PM EST rate reminder\n";
               
                if (names != "")
                    message += "Need yesterday rates from " + names + "\n"; 
                if (names2 != "")
                    message += "Need other rates from " + names2 + ". Do /missing\n";
                if (names != "" || names2 != "")
                {
                    Bot.sendMessageAlert(message + "\n/rem to turn off reminders", ids);
                }
            });
        })
        .catch((err) => {
            console.log('auth error', err);
        });

}


};
module.exports = Bot;

function isEmpty(cell)
{
    return cell == undefined || cell == "" || cell == " ";
}

function isValidRate(rate)
{
    var rateInt = parseInt(rate);
    var rateFloat = parseFloat(rate);
    return (rateInt >= 0 && rate <= 10 && rateInt == rateFloat) || rate == "abstain";
}   

function findRateRow(rows, dateString)
{
    var rateRow;
    for (rateRow = 2; !isEmpty(rows[rateRow][0]); rateRow++)
    {
        if (dateString == rows[rateRow][0])
        {
            break;
        }
    }
    return rateRow;
}
