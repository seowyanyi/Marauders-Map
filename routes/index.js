var express = require('express');
var router = express.Router();
var request = require('request');

function getEndPoint(buildingName, level) {
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
            console.log(edge);
        }
    }
    return edges;
}

/* GET home page. */
router.get('/', function(req, res, next) {
    var building = 'COM2';
    var level = '2';
    var endpoint = getEndPoint(building, level);
    console.log(endpoint);

    request(endpoint, function (error, response, body) {
        getEdges(JSON.parse(body).map);

        res.render('index',
            {   title:'CG3002 Path Planning',
                building: building,
                level: level
            });
    });
});

module.exports = router;
