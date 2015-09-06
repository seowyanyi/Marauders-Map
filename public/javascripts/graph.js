var w = 1500;
var h = 900;


$(window).bind("load", function() {

    $.get('http://localhost:3456/map', function(data) {
        var graphData = JSON.parse(data);
        var edgeData = graphData.edges;
        var nodeData = graphData.nodes;
        var RADIUS = 15;

        var xScale = d3.scale.linear()
            .domain([d3.min(edgeData, function(d) { return d.start[0]; }),
                d3.max(edgeData, function(d) { return d.start[0]; })])
            .range([50, w-100]);

        var yScale = d3.scale.linear()
            .domain([d3.min(edgeData, function(d) { return d.start[1]; }),
                d3.max(edgeData, function(d) { return d.start[1]; })])
            .range([50, h-100]);

        var rScale = d3.scale.linear()
            .domain([0, d3.max(edgeData, function(d) { return d.start[1]; })])
            .range([14, 17]);

        var svg = d3.select("#container").append("svg")
            .attr({"width": w, "height": h})
            .style("border", "1px solid black");

        var elemEdge = svg.selectAll("line")
            .data(edgeData)
            .enter();

        var edges = elemEdge.append("line")
            .attr("x1", function (d) { return xScale(d.start[0]); })
            .attr("y1", function (d) { return yScale(d.start[1]); })
            .attr("x2", function (d) { return xScale(d.end[0]); })
            .attr("y2", function (d) { return yScale(d.end[1]); })
            .attr("stroke-width", 2)
            .attr("stroke", "black");

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
                return xScale(parseInt(d.x)) - rScale(RADIUS)/2;
            })
            .attr("y", function (d) {
                return yScale(parseInt(d.y)) + rScale(RADIUS)/2;
            })
            .text(function (d) {
                return d.nodeId;
            });
    });
});