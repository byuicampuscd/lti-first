/* eslint-env node*/
/* eslint no-console:0*/

module.exports = function getReqData(id, sessionId, htmlFiles) {
    var reqData1, reqData2, linkMap;

    reqData1 = {
        html: htmlFiles.items,
        service: 'items',
        request: {
            'type': 'local_practice',
            'state': 'initial',
            "rendering_type": "assess",
            "user_id": "finchd@byui.edu",
            "session_id": sessionId,
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
    };

    reqData2 = {
        html: htmlFiles.author,
        service: 'author',
        request: {
            "user_id": "finchd@byui.edu",
            "session_id": sessionId,
            "mode": "item_list",
            "config": {
                "item_list": {
                    "item": {
                        "status": true
                    },
                    "filter": {
                        "restricted": {
                            "current_user": false
                        }
                    },
                }
            },
            "user": {
                "id": "finchd@byui.edu",
                "firstname": "ted",
                "lastname": "f"
            }
        }
    };



    //these are from the resource_link_id
    linkMap = {
        "989231091": reqData1,
        "901042951": reqData2
    };

    //get the one off the list or defalut 
    if (typeof linkMap[id] === 'undefined') {
        return reqData1;
    } else {
        return linkMap[id];
    }

}
