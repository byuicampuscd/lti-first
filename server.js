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
    getReqData = require('./getRequestData.js'),
    creds = JSON.parse(fs.readFileSync("../dev.json", "utf8")),
    provider = new lti.Provider("my_cool_key", "my_cool_secret");

console.log("htmlFiles:", Object.keys(htmlFiles));
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
    console.log.apply(null, arguments);
}

function makeErrorHtml(message) {
    return htmlFiles.error
        .replace(/{{message}}/g, message);
}

function makeRequestHtml(html, request) {
    //add in the request JSON
    return html.replace(/{{request}}/, JSON.stringify(request, null, 4));
}


function sendLearnosityBack(res, provider) {
    // Instantiate the SDK
    var requestOut, requestData,
        learnositySdk = new Learnosity(),
        security = {
            'consumer_key': creds.key,
            'domain': 'localhost',
            'user_id': 'finchd@byui.edu'
        };

    //get the right data
    requestData = getReqData(provider.body.resource_link_id,
        Object.keys(provider.nonceStore.used)[0],
        htmlFiles);

    //make request with correct data
    requestOut = learnositySdk.init(requestData.service, security, creds.secret, requestData.request);

    //make and send the html
    res.end(makeRequestHtml(requestData.html, requestOut));
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
