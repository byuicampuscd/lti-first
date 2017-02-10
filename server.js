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
    htmlFiles = require('./htmlFilesToObject.js')(),
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

function makeErrorHtml(message) {
    return htmlFiles.error
        .replace(/{{message}}/g, message);
}

function makeRequestHtml(request, apiScriptName) {
    return htmlFiles.request
        //add in the request JSON
        .replace(/{{request}}/, JSON.stringify(request, null, 4))
        //add in the apiScriptName
        .replace(/{{apiScriptName}}/, apiScriptName);
}

function sendLearnosityBack(res) {
    // Instantiate the SDK
    var learnositySdk = new Learnosity();
    var apiScriptName = 'items';

    var request = learnositySdk.init(
        apiScriptName, {
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

    res.end(makeRequestHtml(request, apiScriptName));
}

function processRequest(request, response) {
    if (request.method === 'POST') {
        var bodyString = '';

        request.on('data', function (data) {
            bodyString += data;
            if (bodyString.length > 1e6) {
                request.connection.destroy();
            }
        });

        request.on('end', function () {
            var body = qs.parse(bodyString)

            provider.valid_request(request, body, function (err, isValid) {
                writeLog("provider:", provider);

                //check if the lti is valid
                if (err || !isValid) {
                    console.log(chalk.red("Invalid LTI Launch"));
                    response.end(makeErrorHtml("Invalid LTI Launch"));
                    return;
                }

                console.log(chalk.green("Yay! Valid LTI"));

                sendLearnosityBack(response, provider);

            });

        });
    } else {
        //no post
        response.end(makeErrorHtml("Did not send Post for LTI Launch"));
    }
}


https.createServer(options, processRequest).listen(port)
console.log(chalk.blue("Server is active at " + url));
