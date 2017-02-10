#!/usr/bin/env node

/* eslint-env node*/
/* eslint no-console:0*/

var fs = require("fs"),
    https = require("https"),
    lti = require('ims-lti'),
    qs = require('querystring'),
    chalk = require('chalk'),
    Learnosity = require('learnosity-sdk-nodejs'),
    port = 8080,
    url = 'https://localhost:' + port,
    options = {
        key: fs.readFileSync(__dirname + "/keys/server.key"),
        cert: fs.readFileSync(__dirname + "/keys/server.crt")
    },
    requestHtml = fs.readFileSync("./index.html", "utf8"),
    creds = JSON.parse(fs.readFileSync("../dev.json", "utf8")),
    provider = new lti.Provider("my_cool_key", "my_cool_secret");


/*
    helper function to make a console.log() also write to data.log
*/
function writeLog() {
    var argString = Array.from(arguments).map(function (arg) {
        if (typeof arg === "object") {
            return JSON.stringify(arg, null, 2);
        }
        return arg.toString();
    }).join(' ');
    argString += "\n------------------------------------------\n"

    fs.appendFile("data.log", argString, function () {});
    console.log(...arguments);
}

function sendHTMLBack(res) {


    // Instantiate the SDK
    var learnositySdk = new Learnosity();

    var request = learnositySdk.init(
        'items', {
            'consumer_key': creds.key,
            'domain': 'localhost',
            'user_id': 'finchd@byui.edu'
        },
        creds.secret, {
            'type': 'local_practice',
            'state': 'initial',
            "rendering_type": "assess",
            "user_id": "finchd@byui.edu",
            "session_id": Object.keys(provider.nonceStore.used)[0],
            "items": [
             "4a54ff38-1d69-4a92-80b5-a12b33bf406c"
            ],
            "config": {
                "subtitle": "By Ben (H)",
                "navigation": {
                    "show_intro": true,
                    "show_itemcount": true
                }
            }
        }
    );

    res.end(html.replace(/{{request}}/, JSON.stringify(request, null, 4)));
}

function processRequest(request, response) {
    if (request.method == 'POST') {
        var bodyString = '';

        request.on('data', function (data) {
            bodyString += data;
            if (bodyString.length > 1e6) {
                request.connection.destroy();
            }
        });

        request.on('end', function () {
            var body = qs.parse(bodyString)
                //console.log("body from qs:", body);

            provider.valid_request(request, body, function (err, isValid) {
                writeLog("provider:", provider);
                //                console.log("request:", request);
                //                console.log("response:", response);

                if (err || !isValid) {
                    console.log(chalk.red("Not valid LTI"));
                    return;
                }

                console.log(chalk.green("Yay! Valid LTI"));

                console.log(chalk.yellow(("provider.ext_content:" + provider.ext_content.toString())));
                sendHTMLBack(response, provider);

            });

        });
    }
}


https.createServer(options, processRequest).listen(port)
console.log(chalk.blue("Server is active at " + url));
