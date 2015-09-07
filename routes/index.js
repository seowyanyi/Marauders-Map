var express = require('express');
var router = express.Router();
var request = require('request');
var mongoose = require('mongoose');
var mongoURI = "mongodb://localhost:27017/test";
var MongoDB = mongoose.connect(mongoURI).connection;
MongoDB.on('error', function(err) { console.log(err.message); });
MongoDB.once('open', function() {
    console.log("mongodb connection open");
});

var DISCONNECTED = 0;
var CONNECTED = 1;
var CONNECTING = 2;
var DISCONNECTING = 3;
var ERROR = "error";
var STATUS = "status";

function getUrl(buildingName, level) {
    return 'http://ShowMyWay.comp.nus.edu.sg/getMapInfo.php?Building='
        + buildingName + '&Level=' + level;
}

function getEndCoordinates(endpointId, nodes) {
    for (var i = 0; i < nodes.length; i++) {
        var currNode = nodes[i];
        if (parseInt(currNode.nodeId) === endpointId) {
            return [parseInt(currNode.x), parseInt(currNode.y)];
        }
    }
    throw endpointId + " not found in the list of nodes";
}

/**
 * Given a string "8, 6"
 * Returns [8, 6]
 */
function parseLinkTo(linkTo) {
    var array = linkTo.split(',');
    for (var i = 0; i < array.length; i++) {
        array[i] = parseInt(array[i]);
    }
    return array;
}

function getEdges(nodes) {
    var edges = [];
    for (var i = 0; i < nodes.length; i++) {
        var currNode = nodes[i];
        var start = [parseInt(currNode.x), parseInt(currNode.y)];
        var endPointIds = parseLinkTo(currNode.linkTo);
        for (var j = 0; j < endPointIds.length; j++) {
            var edge = {};
            edge.start = start;
            edge.end = getEndCoordinates(endPointIds[j], nodes);
            edges.push(edge);
        }
    }
    return edges;
}

router.get('/', function(req, res, next) {
    res.send('Hello :)');
});

router.get('/visualize/:transaction_id', function(req, res, next) {
    var building = 'COM1';
    var level = '2';

    //res.render('index',
    //    {   title:'CG3002 Path Planning',
    //        building: building,
    //        level: level
    //    });
    res.send(req.params.transaction_id);
});

router.get('/draw_path', function(req, res, next) {
    var plannedRoute = JSON.parse(req.query.path);
    var transId = new Date().getTime().toString();
    var schema = mongoose.Schema({
        transaction_id: String,
        stage: Number,
        building: String,
        level: Number,
        path: [Number]
    });

    var errorResponse = {};
    errorResponse["status"] = "fail";

    var readyState = mongoose.connection.readyState;
    if (readyState === CONNECTED) {
        var Stage = mongoose.model('Stage', schema);
        var error = false;

        for (var i = 0; i < plannedRoute.length; ++i) {
            var currStage = plannedRoute[i];
            currStage["transaction_id"] = transId;
            var currentStageModel = new Stage(currStage);
            currentStageModel.save(function (err) {
                if (err) {
                    error = true;
                    errorResponse["error"] = err;
                    res.json(errorResponse);
                }
            });
        }

        if (!error) {
            var response = {};
            response["transaction_id"] = transId;
            response[STATUS] = "OK";
            res.json(response);
        }
    } else if (readyState === DISCONNECTING) {
        errorResponse[ERROR] = "Mongodb disconnecting";
        res.json(errorResponse);
    } else if (readyState === CONNECTING) {
        errorResponse[ERROR] = "Mongodb connecting";
        res.json(errorResponse);
    } else if (readyState === DISCONNECTED) {
        errorResponse[ERROR] = "Mongodb disconnected";
        res.json(errorResponse);
    } else {
        errorResponse[ERROR] = "Error. Ready state is " + readyState;
        res.json(errorResponse);
    }
});

router.get('/map', function(req, res, next) {
    var building = 'COM1';
    var level = '2';
    var url = getUrl(building, level);

    request(url, function (error, response, body) {
        var nodes = JSON.parse(body).map;
        var edges = getEdges(nodes);
        res.send(JSON.stringify({nodes:nodes, edges: edges}));
    });
});

module.exports = router;
