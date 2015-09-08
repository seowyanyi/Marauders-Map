var express = require('express');
var router = express.Router();
var request = require('request');
var mongoose = require('mongoose');
var mongoURI = "mongodb://localhost:27017/test";
var MongoDB = mongoose.connect(mongoURI).connection;

/////////// CONSTANTS //////////////
var DISCONNECTED = 0;
var CONNECTED = 1;
var CONNECTING = 2;
var DISCONNECTING = 3;
var ERROR = "error";
var STATUS = "status";
////////////////////////////////////

//////////////// MONGO DB STUFF ////////////////
MongoDB.on('error', function(err) { console.log(err.message); });
MongoDB.once('open', function() {
    console.log("mongodb connection open");
});

var schema = mongoose.Schema({
    transaction_id: String,
    stage: Number,
    building: String,
    level: Number,
    path: [Number]
});

var Stage = mongoose.model('Stage', schema);
/////////////////////////////////////////////////

function getUrl(buildingName, level) {
    return 'http://ShowMyWay.comp.nus.edu.sg/getMapInfo.php?Building='
        + buildingName + '&Level=' + level;
}

function getCoordinates(id, nodes) {
    for (var i = 0; i < nodes.length; i++) {
        var currNode = nodes[i];
        if (parseInt(currNode.nodeId) === id) {
            return [parseInt(currNode.x), parseInt(currNode.y)];
        }
    }
    throw id + " not found in the list of nodes";
}

function getEdgesOfPath(pathArr, nodes) {
    var edges = [];
    for (var i = 0; i < pathArr.length-1; ++i) {
        var edge = {};
        edge.start = getCoordinates(pathArr[i], nodes);
        edge.end = getCoordinates(pathArr[i+1], nodes);
        edges.push(edge);
    }
    return edges;
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
            edge.end = getCoordinates(endPointIds[j], nodes);
            edges.push(edge);
        }
    }
    return edges;
}

router.get('/', function(req, res, next) {
    res.send('Hello :)');
});

router.get('/visualize', function(req, res, next) {
    Stage.find({'transaction_id': req.query.transaction_id}, function(err, stagesArr) {
        if (err) {
            res.send(err);
        } else {
            res.render('index',
                {   title:'CG3002 Path Planning',
                    stagesArr: stagesArr
                });
        }
    });
});

router.get('/draw_path', function(req, res, next) {
    var plannedRoute = JSON.parse(req.query.path);
    var transId = new Date().getTime().toString();
    var errorResponse = {};
    errorResponse["status"] = "fail";
    errorResponse["error"] = "";

    var readyState = mongoose.connection.readyState;
    if (readyState === CONNECTED) {
        var error = false;
        var numOfStages = plannedRoute.length;

        // save the route info
        for (var i = 0; i < numOfStages; ++i) {
            var currStage = plannedRoute[i];
            currStage["transaction_id"] = transId;
            var currentStageModel = new Stage(currStage);

            currentStageModel.save(function (err) {
                if (err) {
                    error = true;
                    errorResponse["error"] += err;
                }
            });
        }

        if (!error) {
            console.log('transaction id: ' + transId);
            var response = {};
            response["transaction_id"] = transId;
            response[STATUS] = "OK";
            res.json(response);
        } else {
            res.json(errorResponse);
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
    Stage.find({'transaction_id': req.query.transaction_id}, function(err, stagesArr) {
        if (err) {
            res.send(err);
        } else {
            var result = [];

            // Get map data and find nodes and edges
            var numStages = stagesArr.length;
            var count = 0;
            for(var j = 0; j < numStages; j++){
                (function(foo){
                    var currentStage = stagesArr[j];
                    request(getUrl(currentStage.building, currentStage.level), function (error, response, body) {
                        var nodes = JSON.parse(body).map;
                        var edges = getEdges(nodes);
                        var pathEdges = getEdgesOfPath(currentStage.path, nodes);
                        var graph = {stage:currentStage.stage, nodes:nodes, edges:edges, pathEdges: pathEdges};
                        result.push(graph);
                        count++;
                        if (count > numStages - 1) done();
                    });
                }(j));
            }

            function done() {
                console.log('All data has been loaded.');
                res.json({graph: result});
            }
        }
    });
});

module.exports = router;
