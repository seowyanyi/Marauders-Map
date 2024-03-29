var w = 1500;
var h = 900;
var d3 = require('d3');
var $ = require('jquery');

// from http://stackoverflow.com/questions/4656843/jquery-get-querystring-from-url
function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function isSameEdge(edge1, edge2) {
    var start1x = edge1.start[0];
    var start1y = edge1.start[1];
    var start2x = edge2.start[0];
    var start2y = edge2.start[1];

    var end1x = edge1.end[0];
    var end1y = edge1.end[1];
    var end2x = edge2.end[0];
    var end2y = edge2.end[1];
    return  start1x == start2x && start1y == start2y &&
        end1x == end2x && end1y == end2y;
}

function containsEdge(edge, edgeArr) {
    for (var i = 0; i < edgeArr.length; i++) {
        if (isSameEdge(edge, edgeArr[i])) return true;
    }
    return false;
}

$(window).bind("load", function() {
    var transId = getUrlVars().transaction_id;
    $.get('http://localhost:3000/map?transaction_id='+transId, function(data) {
        var graphData = data.graph;
        var RADIUS = 15;
        for (var x = 0; x < graphData.length; ++x) {

            var edgeData = graphData[x].edges;
            var nodeData = graphData[x].nodes;
            var stageNum = graphData[x].stage;
            var pathEdgesData = graphData[x].pathEdges;

            var xScale = d3.scale.linear()
                .domain([d3.min(edgeData, function (d) {
                    return d.start[0];
                }),
                    d3.max(edgeData, function (d) {
                        return d.start[0];
                    })])
                .range([50, w - 100]);

            var yScale = d3.scale.linear()
                .domain([d3.min(edgeData, function (d) {
                    return d.start[1];
                }),
                    d3.max(edgeData, function (d) {
                        return d.start[1];
                    })])
                .range([50, h - 100]);

            var rScale = d3.scale.linear()
                .domain([0, d3.max(edgeData, function (d) {
                    return d.start[1];
                })])
                .range([14, 17]);

            var svg = d3.select(".stage" + stageNum).append("svg")
                .attr({"width": w, "height": h})
                .style("border", "1px solid black");

            var elemEdge = svg.selectAll("line")
                .data(edgeData)
                .enter();

            var edges = elemEdge.append("line")
                .attr("x1", function (d) {
                    return xScale(d.start[0]);
                })
                .attr("y1", function (d) {
                    return yScale(d.start[1]);
                })
                .attr("x2", function (d) {
                    return xScale(d.end[0]);
                })
                .attr("y2", function (d) {
                    return yScale(d.end[1]);
                })
                .attr("stroke-width", function (d) {
                    if (containsEdge(d, pathEdgesData)) {
                        return 5;
                    }
                    return 1;
                })
                .attr("stroke", function (d) {
                    if (containsEdge(d, pathEdgesData)) {
                        return "red";
                    }
                    return "black";
                });


            var elemNode = svg.selectAll("circle")
                .data(nodeData)
                .enter();

            var nodes = elemNode.append("circle")
                .attr("cx", function (d) {
                    return xScale(parseInt(d.x));
                })
                .attr("cy", function (d) {
                    return yScale(parseInt(d.y));
                })
                .attr({"r": rScale(RADIUS)})
                .style("fill", "yellow")
                .style("stroke", "black");

            var nodeNames = elemNode.append("text")
                .attr("x", function (d) {
                    return xScale(parseInt(d.x)) + 5;
                })
                .attr("y", function (d) {
                    return yScale(parseInt(d.y)) - 15;
                })
                .text(function (d) {
                    return d.nodeName;
                });

            var nodeId = elemNode.append("text")
                .attr("x", function (d) {
                    return xScale(parseInt(d.x)) - rScale(RADIUS) / 2;
                })
                .attr("y", function (d) {
                    return yScale(parseInt(d.y)) + rScale(RADIUS) / 2;
                })
                .text(function (d) {
                    return d.nodeId;
                });
        }

    });

});