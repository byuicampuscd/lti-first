#!/usr/bin/env node

/* eslint-env node*/
/* eslint no-console:0*/

var fs = require("fs");
var https = require("https");
var port = getPort();
var lti = require('ims-lti');
var ltiContent = require('./node_modules/ims-lti/lib/extensions/content.js');
var provider = new lti.Provider("my_cool_key", "my_cool_secret");
var chalk = require('chalk');
var Learnosity = require('learnosity-sdk-nodejs');
var html = fs.readFileSync("./index.html", "utf8");
var creds = fs.readFileSync("../dev.json", "utf8");
var qs = require('querystring');

function writeLog(data) {
    fs.appendFile("data.log", data, function () {});
    console.log(data);
}

function getPort() {
    return 8080;
}

function getScript(port) {
    var url = 'https://localhost:' + port + '/path-2-file';
    return '<script src="' + url + '"></script>';
}

function sendHTMLBack(res) {


    // Instantiate the SDK
    var learnositySdk = new Learnosity();

    var request = learnositySdk.init(
        'questions', {
            'consumer_key': creds.key,
            'domain': 'localhost',
            'user_id': 'finchd@byui.edu'
        },
        creds.secret, {
            'type': 'local_practice',
            'state': 'initial',
            'questions': [
                {
                    'response_id': '60005',
                    'type': 'association',
                    'stimulus': 'Match the cities to the parent nation.',
                    'stimulus_list': ['London', 'Dublin', 'Paris', 'Sydney'],
                    'possible_responses': ['Australia', 'France', 'Ireland', 'England'],
                    'validation': {
                        'valid_responses': [
                            ["England"],["Ireland"],["France"],["Australia"]
                        ],
                    }
            }
            ]
        }
    );

    res.end(html.replace(/{{request}}/, JSON.stringify(request, null, 4)));
//    html.on("error", function () {
//        res.writeHead(404);
//        res.write("404");
//        res.end();
//    });

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
                //body.ext_content_return_types = body.custom_ext_content_return_types;

            provider.valid_request(request, body, function (err, isValid) {
                ltiContent.init(provider);
                writeLog("provider:" + JSON.stringify(provider, null, 4));
                //                console.log("request:", request);
                //                console.log("response:", response);

                if (err || !isValid) {
                    console.log(chalk.red("Not valid LTI"));
                    return;
                }

                console.log(chalk.green("Yay! Valid LTI"));

                console.log(chalk.yellow(("provider.ext_content:" + provider.ext_content.toString())));
                sendHTMLBack(response);

            });

        });
    }
}

var options = {
    key: fs.readFileSync(__dirname + "/keys/server.key"), // __dirname to find directory
    cert: fs.readFileSync(__dirname + "/keys/server.crt")
}

https.createServer(options, processRequest).listen(port) // port dynamic
console.log(chalk.blue("Server is active on port " + port));
console.log(chalk.green(getScript(port))); // also diaplay the script tag with data...
