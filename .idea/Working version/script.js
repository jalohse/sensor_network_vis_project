/*
 * Created by Tim on 11/10/2016.
 */
<!-- Common variables and functions used by all of the example plots -->
var width = 600;          //Width of each plot
var height = 600;         //Height of each plot
var padding = 30;          //Buffer space to ensure points are adequately

var purpleColor = 'mediumpurple';
var anchorOpacity = 0.2;
var extraDataOpacity = 0.1;

//Initialize the data
var filename = 'data.off';
var locationData = [];
var complexType;
var selectedNodes = [];
var newZscale = 1;
var newxScale, newyScale;
var pad = padding;

var cechFaces = [];
var cechEdges = [];
var ripsFaces = [];
var ripsEdges = [];
var dataMin = 0;
var distances = [];

var numSamples = 0;      //Number of points to use
var complexRadius = 20;          //epsilon ball radius
var dataRadius = 10; //radius of uncertainty
var numPoints = 8; //number of possible data locations per node

//background grid information
var cellSize = 50;
var gridWidth = Math.ceil((width + padding * 2) / cellSize);
var gridHeight = Math.ceil((height + padding * 2) / cellSize);
var grid = new Array(gridWidth * gridHeight);
var wasDragged = false;
var zoomOn = false;

//Construct the main plot area and add gridlines
var complexSVG = d3.select("#plotArea").append('svg')
    .attr("class", "cech")
    .attr("id", "complexSVG")
    .attr("width", width + padding * 2)
    .attr("height", height + padding * 2)
    .style("margin", "auto")
    .style("border", "1px solid black");

var xScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, width]);

var xAxis = d3.axisTop()
    .scale(xScale);

var gX = complexSVG.append('g')
    .attr('transform', 'translate(' + padding + ',' + padding + ')')
    .call(xAxis);

var yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, width]);

var yAxis = d3.axisLeft()
    .scale(yScale);

var gY = complexSVG.append('g')
    .attr('transform', 'translate(' + padding + ',' + padding + ')')
    .call(yAxis);

var faceColorScale = d3.scaleLinear().range(["#99ff99", "#006600"]).domain([0.01, 1]);
var edgeOpacityScale = d3.scaleLinear().range([0.2, 1]).domain([0.01, 1]);
var edgeWidthScale = d3.scaleLinear().range([2, 6]).domain([0.01, 1]);


var complexCanvas = complexSVG.append('g')
    .attr('class', 'cech')
    .attr('id', 'complexCanvas');

complexSVG.append('rect')
    .attr('x', padding)
    .attr('y', padding)
    .attr('width', width)
    .attr('height', height)
    .style('fill', 'none')
    .style('stroke', '#000')
    .style('stroke-opacity', 1);

var zoom = d3.zoom()
    .scaleExtent([0.1, 10])
    .on('zoom', zoomed);

var zoombox = complexSVG.append("rect")
    .attr("width", width + padding * 2)
    .attr("height", height + padding * 2)
    .attr('id', 'zoomBox')
    .style("fill", "none")
    .style("pointer-events", "none")
    .style('visibility', 'off')
    .call(zoom);

window.addEventListener('keydown', function (event) {
    if (event.key == 'z') {
        if (zoomOn) {
            d3.select('#zoomBox')
                .attr('cursor', 'auto')
                .style('pointer-events', 'none')
                .style('visibility', 'off');
            zoomOn = false;
        } else {
            d3.select('#zoomBox')
                .attr('cursor', 'move')
                .style('pointer-events', 'all')
                .style('visibilty', 'on')
            zoomOn = true;
        }

    }

});

var edgeState = false;
var faceState = false;
var coverageState = true;
var nodeState = true;

start = performance.now();
appendGroups();
dataLoader('data/data.off')

function appendGroups(){
    complexSVG.append('g')
        .attr('class', 'grid')
        .attr('id', 'xlines');

    complexCanvas.append('g')
        .attr('class', 'circle')
        .attr('id', 'complexCircles')
    complexCanvas.append('g')
        .attr('class', 'point')
        .attr('id', 'complexPoints');
    complexCanvas.append('g')
        .attr('class', 'circle')
        .attr('id', 'complexDataCircles');

    complexSVG.append('g')
        .attr('class', 'grid')
        .attr('id', 'ylines');

    complexCanvas.append('g')
        .attr('id', 'complexFaces')
        .attr('class', 'face')
        .style('visibility', 'hidden');

    complexCanvas.append('g')
        .attr('id', 'complexEdges')
        .attr('class', 'edge')
        .style('visibility', 'hidden');

}

function updateGridLines() {
    var xt = xAxis.scale().ticks();

    var xticks = (newxScale) ?
        xt.map(function (d) {
            return newxScale(d) + padding;
        }) :
        xt.map(function (d) {
            return xScale(d) + padding;
        });

    var xLines = d3.select('#xlines').selectAll('line').data(xticks);
    xLines.enter().append('line')
        .attr('id', 'xline')
        .attr('class', 'grid')
        .merge(xLines)
        .attr('x1', function (d) {
            return d
        })
        .attr('y1', padding)
        .attr('x2', function (d) {
            return d
        })
        .attr('y2', height + padding);
    xLines.exit().remove();

    var yt = yAxis.scale().ticks();

    var yticks = (newyScale) ?
        yt.map(function (d) {
            return newyScale(d) + padding;
        }) :
        yt.map(function (d) {
            return yScale(d) + padding;
        });

    var yLines = d3.select('#ylines').selectAll('line').data(yticks);
    yLines.enter().append('line')
        .attr('id', 'yline')
        .attr('class', 'grid')
        .merge(yLines)
        .attr('y1', function (d) {
            return d
        })
        .attr('x1', padding)
        .attr('y2', function (d) {
            return d
        })
        .attr('x2', height + padding);
    yLines.exit().remove();
}

function zoomed() {
    complexCanvas.attr("transform", d3.event.transform)
    newxScale = d3.event.transform.rescaleX(xScale);
    newyScale = d3.event.transform.rescaleY(yScale);
    newZscale = d3.event.transform.k;

    pad = padding / newZscale;

    gX.call(xAxis.scale(newxScale));
    gY.call(yAxis.scale(newyScale));
    if (locationData.length != 0 && d3.event.sourceEvent.type == 'wheel') {
        d3.select('#complexPoints').selectAll('circle')
            .attr('r', 5 / newZscale);
        d3.select('#complexEdges').selectAll('line')
            .style('stroke-width', 4 / newZscale);
        renderPoints();
        changeComplex();
    }
    updateGridLines();
}

//this function is called whenever the data are changed.

function updateComplex(newValue) {
    complexRadius = +newValue;
    d3.select('#complexRadius').node().value = complexRadius;
    d3.select('#complexInput').node().value = complexRadius;
    xMin = xScale.domain()[0];
    screenRadius = xScale(complexRadius + xMin);
    d3.select('#complexCircles').selectAll('circle').attr('r', screenRadius)
    // constructCech();
    constructRips();
    changeComplex();
}

//graphical highlighting
function highlightPoint() {

    d3.select('#complex_Point_' + arguments[1])
        .transition()
        .style('fill', '#c33');

    //highlight the corresponding coverage circle
    d3.select('#complex_Circle_' + arguments[1])
        .transition()
        .style('fill', '#c33')
        .style('fill-opacity', 0.25);
}

function resetPoint() {

    //return point and coverage circle to default view
    d3.select('#complex_Point_' + arguments[1])
        .transition()
        .style('fill', purpleColor);

    var circle = d3.select('#complex_Circle_' + arguments[1]);

    if (document.getElementById('coverCheckbox').checked) {
        circle.transition()
            .style('fill', purpleColor)
            .style('fill-opacity', anchorOpacity);
    } else {
        circle.transition()
            .style('fill', '#fff')
            .style('fill-opacity', 0);
    };
}

//highlight edge and corresponding points
function highlightEdge() {

    if (arguments.length > 1) {
        edge = d3.select(this)
        highlightPoint([], ripsEdges[arguments[1]].Pt1);
        highlightPoint([], ripsEdges[arguments[1]].Pt2);
    } else {
        edge = d3.select(arguments[0]);
    }
    edge.transition()
        .style('stroke', '#c33');
}

//restore default view
function resetEdge() {

    if (arguments.length > 1) {
        edge = d3.select(this)
        resetPoint([], ripsEdges[arguments[1]].Pt1);
        resetPoint([], ripsEdges[arguments[1]].Pt2);
        edge.transition()
            .style('stroke', "black")
            .style('opacity', edgeOpacityScale(arguments[0].Pedge));
    } else {
        edge = d3.select(arguments[0]);
        var points = arguments[0].replace(/#complex_Edge_/, '');
        for (i = 0; i < ripsEdges.length; i++) {
            var possibleEdge = ripsEdges[i];
            if (points == possibleEdge.Pt1 + "_" + possibleEdge.Pt2) {
                edge.transition()
                    .style('stroke', "black")
                    .style('opacity', edgeOpacityScale(possibleEdge.Pedge));
                return;
            }
        }
    }

}

//highlight faces
function highlightFace() {

    d3.select(this).transition()
        .style('fill', '#c33');

//highlight corresponding edges
    highlightEdge('#complex_Edge_' + arguments[0].Pt1 + '_' + arguments[0].Pt2);
    highlightEdge('#complex_Edge_' + arguments[0].Pt1 + '_' + arguments[0].Pt3);
    highlightEdge('#complex_Edge_' + arguments[0].Pt2 + '_' + arguments[0].Pt3);

    //highlight corresponding points
    highlightPoint([], arguments[0].Pt1);
    highlightPoint([], arguments[0].Pt2);
    highlightPoint([], arguments[0].Pt3);

}

//reset to default view
function resetFace() {

    d3.select(this)
        .transition()
        .style('fill', faceColorScale(arguments[0].Pface));

    resetEdge('#complex_Edge_' + arguments[0].Pt1 + '_' + arguments[0].Pt2);
    resetEdge('#complex_Edge_' + arguments[0].Pt1 + '_' + arguments[0].Pt3);
    resetEdge('#complex_Edge_' + arguments[0].Pt2 + '_' + arguments[0].Pt3);

    resetPoint([], arguments[0].Pt1);
    resetPoint([], arguments[0].Pt2);
    resetPoint([], arguments[0].Pt3);

}

//construct the Cech complex
function constructCech() {

    cechEdges = [];
    cechFaces = [];
    var sqDist;
    //calculate the squared diameter to compare each pair to. Use square diameter to compare to squared euclidean distanct
    //of each pair so save computation.
    sqDiameter = 4 * Math.pow(complexRadius, 2);

    //interate over all possible permutations (n-choose-3) of the location data.
    for (i = 0; i < numSamples; i++) {
        x1 = locationData[i].anchor.x;
        y1 = locationData[i].anchor.y;
        for (j = i + 1; j < numSamples; j++) {
            x2 = locationData[j].anchor.x;
            y2 = locationData[j].anchor.y;
            d12 = sqEuclidDist([x1, y1], [x2, y2]);
            if (d12 <= sqDiameter) {
                //save the edge
                cechEdges.push({Pt1: i, Pt2: j});
                //compute distance to third point only if first 2 points are within coverage ball
                for (k = j + 1; k < numSamples; k++) {
                    x3 = locationData[k].anchor.x;
                    y3 = locationData[k].anchor.y;
                    d23 = sqEuclidDist([x2, y2], [x3, y3]);
                    // only continue computation if third point is pairwise within coverage ball of other 2 points
                    if (d23 <= sqDiameter) {
                        d13 = sqEuclidDist([x1, y1], [x3, y3]);

                        if (d13 <= sqDiameter) {

                            //determine longest edge
                            if (d12 >= d13 && d12 >= d23) {
                                xc = (x2 + x1) / 2;
                                yc = (y2 + y1) / 2;
                                dist = Math.sqrt(sqEuclidDist([x3, y3], [xc, yc]));
                                testRadius = Math.sqrt(d12) / 2;
                            } else if (d13 >= d12 && d13 >= d23) {
                                xc = (x3 + x1) / 2;
                                yc = (y3 + y1) / 2;
                                dist = Math.sqrt(sqEuclidDist([x2, y2], [xc, yc]));
                                testRadius = Math.sqrt(d13) / 2;
                            } else {
                                xc = (x3 + x2) / 2;
                                yc = (y3 + y2) / 2;
                                dist = Math.sqrt(sqEuclidDist([x1, y1], [xc, yc]));
                                testRadius = Math.sqrt(d23) / 2;
                            }

                            if (dist <= testRadius) {
                                //determine if third point is within circumcircle of longest edge
                                cechFaces.push({Pt1: i, Pt2: j, Pt3: k});
                            } else {
                                //otherwise determine triangle circumcircle radius is smaller than the coverage radius
                                a = Math.sqrt(d12);
                                b = Math.sqrt(d13);
                                c = Math.sqrt(d23);
                                testRadius = (a * b * c) / Math.sqrt((a + b + c) * (b + c - a) * (a + c - b) * (a + b - c));
                                if (testRadius <= complexRadius) {
                                    cechFaces.push({Pt1: i, Pt2: j, Pt3: k})
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function constructEdges() {

    var sqDiameter = 4 * Math.pow(complexRadius, 2);
    var sqDiameterMin = 4 * Math.pow(complexRadius - dataRadius, 2);
    var sqDiameterMax = 4 * Math.pow(complexRadius + dataRadius, 2);
    distances = [];
    var tempEdges = [];
    var count, p;

    for (i = 0; i < numSamples - 1; i++) {
        x1 = locationData[i].anchor.x;
        y1 = locationData[i].anchor.y;
        distances.push([0]);
        for (j = i + 1; j < numSamples; j++) {
            x2 = locationData[j].anchor.x;
            y2 = locationData[j].anchor.y;
            d12 = sqEuclidDist([x1, y1], [x2, y2]);
            if (d12 <= sqDiameterMin) {
                tempEdges.push({Pt1: i, Pt2: j, Pedge: 1})
                distances[i].push(1)
            } else if (d12 > sqDiameterMax) {
                distances[i].push(0)
            } else {
                count = 0;
                for (m = 0; m < numPoints; m++) {
                    x1 = locationData[i].points[m].x;
                    y1 = locationData[i].points[m].y;
                    for (n = 0; n < numPoints; n++) {
                        x2 = locationData[j].points[n].x;
                        y2 = locationData[j].points[n].y;
                        d12 = sqEuclidDist([x1, y1], [x2, y2]);
                        if (d12 <= sqDiameter) {
                            count++
                        }
                    }
                }
                p = count / (numPoints * numPoints);
                tempEdges.push({Pt1: i, Pt2: j, Pedge: p})
                distances[i].push(p)
            }
        }
    }

    return tempEdges

}

function constructRips() {

    ripsEdges = constructEdges();
    ripsFaces = [];

    for (i = 0; i < numSamples - 2; i++) {
        for (j = i; j < numSamples - 1; j++) {
            if (distances[i][j - i] > 0) {
                for (k = j; k < numSamples; k++) {
                    if (distances[j][k - j] > 0 && distances[i][k - i] > 0) {
                        ripsFaces.push({Pt1: i, Pt2: j, Pt3: k, Pface: 0})
                    } else if (distances[j][k - j] == 1 && distances[i][k - i] == 1) {
                        ripsFaces.push({Pt1: i, Pt2: j, Pt3: k, Pface: 1})
                    }
                }
            }
        }
    }

    ripsFaces.forEach(function (d) {
        if (d.Pface == 0) {
            d.Pface = comparePoints(d.Pt1, d.Pt2, d.Pt3);
        }
    })

}

function comparePoints(p1, p2, p3) {
    var sqDiameter = 4 * Math.pow(complexRadius, 2);
    var count = 0;
    var x1, y1, x2, y2, x3, y3;
    for (i = 0; i < numPoints; i++) {
        x1 = locationData[p1].points[i].x;
        y1 = locationData[p1].points[i].y;
        for (j = 0; j < numPoints; j++) {
            x2 = locationData[p2].points[j].x;
            y2 = locationData[p2].points[j].y;
            d12 = sqEuclidDist([x1, y1], [x2, y2]);
            if (d12 <= sqDiameter) {
                for (k = 0; k < numPoints; k++) {
                    x3 = locationData[p3].points[k].x;
                    y3 = locationData[p3].points[k].y;
                    d23 = sqEuclidDist([x2, y2], [x3, y3]);
                    if (d23 <= sqDiameter) {
                        count++
                    }
                }
            }
        }
    }
    return count / Math.pow(numPoints, 3)
}


function renderComplex(edges, faces) {

    if (edges.length == 0) {
        if (complexType == 'Cech') {
            constructCech();
            edges = cechEdges
            faces = cechFaces
        } else if (complexType == 'Vietoris-Rips') {
            constructRips();
            edges = ripsEdges;
            faces = ripsFaces;
        }
    };


//render faces, give each an id with corresponding vertex indices. This makes it easier to find and highlight the corresponding
    //points and edges, do the same for each edge. Start with everything hidden then render view according to what the user
    //has selected


    var complexFaces = d3.select('#complexFaces').selectAll('polygon').data(faces);
    complexFaces.enter().append('polygon')
        .attr('class', 'face')
        .merge(complexFaces)
        .attr('points', function (d, i) {
                return (xScale(locationData[d.Pt1].anchor.x) + padding / newZscale) + ',' + (yScale(locationData[d.Pt1].anchor.y) + padding / newZscale) +
                    ' ' + (xScale(locationData[d.Pt2].anchor.x) + padding / newZscale) + ',' + (yScale(locationData[d.Pt2].anchor.y) + padding / newZscale) +
                    ' ' + (xScale(locationData[d.Pt3].anchor.x) + padding / newZscale) + ',' + (yScale(locationData[d.Pt3].anchor.y) + padding / newZscale);
            }
        )
        .attr('id', function (d, i) {
            return 'complex_Face_' + d.Pt1 + '_' + d.Pt2 + '_' + d.Pt3;
        })
        .attr('fill', function (d) {
            return faceColorScale(d.Pface);
        })
        .on('mouseover', highlightFace)
        .on('mouseout', resetFace);
    complexFaces.exit().remove();


    var complexEdges = d3.select('#complexEdges').selectAll('line').data(edges);
    complexEdges.enter().append('line')
        .attr('class', 'edge')
        .merge(complexEdges)
        .style('stroke-width', function (d) {
            return edgeWidthScale(d.Pedge);
        })
        .attr('x1', function (d) {
            return xScale(locationData[d.Pt1].anchor.x) + pad;
        })
        .attr('y1', function (d) {
            return yScale(locationData[d.Pt1].anchor.y) + pad;
        })
        .attr('x2', function (d) {
            return xScale(locationData[d.Pt2].anchor.x) + pad;
        })
        .attr('y2', function (d) {
            return yScale(locationData[d.Pt2].anchor.y) + pad;
        })
        .attr('id', function (d) {
            return 'complex_Edge_' + d.Pt1 + '_' + d.Pt2;
        })
        .attr('stroke', 'black')
        .attr('opacity', function (d) {
            return edgeOpacityScale(d.Pedge);
        })
        .on('mouseover', highlightEdge)
        .on('mouseout', resetEdge);
    complexEdges.exit().remove();


    //Make sure points stay on top
    pts = d3.select('#complexPoints').node();
    pts.parentNode.appendChild(pts);

    renderView();

}

function renderPoints() {

    //render each point and coverage circle. The id simply corresponds to its index within locationData
    var pts = d3.select('#complexPoints').selectAll('circle').data(locationData);
    pts.enter()
        .append('circle')
        .style('visibility', 'hidden')
        .merge(pts)
        .attr('class', 'point')
        .attr('cx', function (d) {
            if (newxScale && newyScale) {
                return xScale(d.anchor.x) + padding / newZscale;
            }
            else {
                return xScale(d.anchor.x) + padding;
            }
        })
        .attr('cy', function (d) {
            if (newxScale && newyScale) {
                return yScale(d.anchor.y) + padding / newZscale;
            }
            else {
                return yScale(d.anchor.y) + padding / newZscale;
            }
        })
        .attr('id', function (d, i) {
            return 'complex_Point_' + i.toString();
        })
        .attr('r', xScale(dataRadius + xScale.domain()[0]))
        .on('click', selectNode)
        .on('mouseover', highlightPoint)
        .on('mouseout', resetPoint)
        .call(d3.drag()
            .on('drag', dragNode)
            .on('end', dragEnd))
        .each(function (d) {
            var smallData = d3.select('#complexPoints').selectAll('small_circle').data(d.points);
            smallData
                .enter()
                .append('circle')
                .attr('class', 'small_circle')
                .merge(smallData)
                .attr('cx', function (d) {
                    if (newxScale && newyScale) {
                        return xScale(d.x) + padding / newZscale;
                    }
                    else {
                        return xScale(d.x) + padding;
                    }
                })
                .attr('cy', function (d) {
                    if (newxScale && newyScale) {
                        return yScale(d.y) + padding / newZscale;
                    }
                    else {
                        return yScale(d.y) + padding / newZscale;
                    }
                })
                .attr('id', function (d, i) {
                    return 'complex_small_Point_' + i.toString();
                })
                .attr('r', 2 / newZscale);
            smallData.exit().remove();
        });
    pts.exit().remove();

    var complexCircles = d3.select('#complexCircles').selectAll('circle').data(locationData);
    complexCircles.enter()
        .append('circle')
        .style('visibility', 'hidden')
        .attr('class', 'circle')
        .merge(complexCircles)
        .attr('cx', function (d) {
            return xScale(d.anchor.x) + padding / newZscale;
        })
        .attr('cy', function (d) {
            return yScale(d.anchor.y) + padding / newZscale;
        })
        .attr('id', function (d, i) {
            return 'complex_Circle_' + i.toString();
        })
        .attr('r', xScale(complexRadius + xScale.domain()[0]));
    complexCircles.exit().remove();


    var complexAndDataCircle = d3.select('#complexDataCircles').selectAll('circle').data(locationData);
    complexAndDataCircle
        .enter()
        .append('circle')
        .attr('class', 'circle')
        .merge(complexAndDataCircle)
        .attr('cx', function (d) {
            return xScale(d.anchor.x) + padding / newZscale;
        })
        .attr('cy', function (d) {
            return yScale(d.anchor.y) + padding / newZscale;
        })
        .attr('id', function (d, i) {
            return 'data_Circle_' + i.toString();
        })
        .attr('fill', 'mediumpurple')
        .attr('fill-opacity', 0.1)
        .attr('r', xScale(dataRadius + complexRadius + xScale.domain()[0]));
    complexAndDataCircle.exit().remove();

    renderView()

}

function renderView() {
    //query the various view options toggle visibility of each "g" element accordingly
    if(document.getElementById('coverCheckbox') != coverageState){
        f = document.getElementById('coverCheckbox').checked;
        coverageState = f;
        showCoverage(f);
    }
    if(document.getElementById('nodeCheckbox') != nodeState){
        f = document.getElementById('nodeCheckbox').checked;
        nodeState = f;
        show(f, '.point');
    }
    if(document.getElementById('edgeCheckbox') != edgeState){
        f = document.getElementById('edgeCheckbox').checked;
        edgeState = f;
        show(f, '.edge');
    }
    if(document.getElementById('faceCheckbox') != faceState){
        f = document.getElementById('faceCheckbox').checked;
        faceState = f;
        show(f, '.face');
    }
    var t1 = performance.now();
    console.log("Call to doSomething took " + (t1 - start) + " milliseconds.");
}


function importData() {

    //allow user to select file
    var selectedFile = document.getElementById('fileSelector');
    var fReader = new FileReader();
    fReader.readAsDataURL(selectedFile.files[0]);
    fReader.onloadend = function (event) {

        d3.csv(event.target.result, function (csv) {

            //read data into locationData array and update number of samples
            locationData = [];
            csv.forEach(function (d) {

                // Convert numeric values to 'numbers'
                locationData.push({anchor: {x: +d.xf, y: +d.yf}});
            });
            numSamples = locationData.length;
            perturbData();

           calculateRange();

            complexCanvas.attr("transform", d3.zoomIdentity)
            newxScale = false;
            newyScale = false;
            newZscale = 1;

            gX.call(xAxis.scale(xScale));
            gY.call(yAxis.scale(yScale));
            updateGridLines()

            resetToDefaultView();
        });
    }
}

function resetToDefaultView(){
    c = document.getElementById('coverCheckbox');
    c.disabled = false;
    c.checked = coverageState;
    n = document.getElementById('nodeCheckbox');
    n.disabled = false;
    n.checked = nodeState;
    document.getElementById('edgeCheckbox').disabled = edgeState;
    document.getElementById('faceCheckbox').disabled = faceState;
    renderPoints();
    updateComplex(document.getElementById('complexInput').value);
}

function calculateRange(){
    xMin = d3.min(locationData.map(function (d) {
        return d.anchor.x;
    }));
    xMax = d3.max(locationData.map(function (d) {
        return d.anchor.x;
    }));
    xRange = xMax - xMin;
    yMin = d3.min(locationData.map(function (d) {
        return d.anchor.y;
    }));
    yMax = d3.max(locationData.map(function (d) {
        return d.anchor.y;
    }));
    yRange = yMax - yMin;
    dataVals = setDataRange(xRange, yRange);
    xScale.domain([xMin - dataVals[1], xMin + dataVals[0] + dataVals[1]]);
    yScale.domain([yMin - dataVals[1], yMin + dataVals[0] + dataVals[1]]);
}

function setDataRange(xRange, yRange){
    dataRange = d3.max([xRange, yRange]);
    dataPadding = 0.1 * dataRange;

    d3.select('#complexInput')
        .attr('min', 0.05 * dataRange)
        .attr('max', 0.5 * dataRange)
        .attr('value', 0.2 * dataRange);
    return [dataRange, dataPadding];
}

function randomData() {
//generate uniform random data points
    console.log('random data');
    start = performance.now();
    var xd = (newxScale) ? newxScale.domain() : xScale.domain();
    var xmin = xd[0] + 0.1 * (xd[1] - xd[0]);
    var xmax = xd[1] - 0.1 * (xd[1] - xd[0]);

    var yd = (newyScale) ? newyScale.domain() : yScale.domain();
    var ymin = yd[0] + 0.1 * (yd[1] - yd[0]);
    var ymax = yd[1] - 0.1 * (yd[1] - yd[0]);


    numSamples = +document.getElementById('numSensors').value;

    locationData = [];

    for (i = 0; i < numSamples; i++) {
        var xi = Math.random() * (xmax - xmin + 1) + xmin;
        var yi = Math.random() * (ymax - ymin + 1) + ymin;
        locationData.push({anchor: {x: xi, y: yi}});
    }
    ;

    perturbData();

    setDataRange(xd[1] - xd[0], yd[1] - yd[0]);

    resetToDefaultView();
}

function saveData() {

    //save nodes

    var header = 'OFF\n' +
        '#\n' +
        '# Simplicial complex of 2-D location data\n' +
        '# Generated on ' + Date() + '\n' +
        '# Complex type: ' + complexType + '\n' +
        '# Coverage radius: ' + complexRadius + '\n' +
        '#\n' +
        numSamples + ' ' + (cechFaces.length + cechEdges.length) + ' 0';


    var tempData = JSON.parse(JSON.stringify(locationData));
    tempData.forEach(function (d) {
        d.z = 0;
    });
    var verticesStr = d3.dsvFormat(' ').format(tempData, ['xf', 'yf', 'z']);
    verticesStr = verticesStr.replace('xf yf z', []);

    if (complexType == 'Cech') {
        faces = cechFaces;
        edges = cechEdges;
    } else {
        faces = ripsFaces;
        edges = ripsEdges;
    }
    ;

    var edgesStr = d3.dsvFormat(' ').format(edges, ['Pt1', 'Pt2']);
    edgesStr = edgesStr.replace(/\n/g, '\n2 ')
    edgesStr = edgesStr.replace('Pt1 Pt2', []);
    var facesStr = d3.dsvFormat(' ').format(faces, ['Pt1', 'Pt2', 'Pt3']);
    facesStr = facesStr.replace(/\n/g, '\n3 ')
    facesStr = facesStr.replace('Pt1 Pt2 Pt3', []);

    dsvContent = header + verticesStr + edgesStr + facesStr;
    dsvContent = dsvContent.replace(/\n/g, '\r\n');

    var blob = new Blob([dsvContent], {type: 'text/csv;charset=utf-8;'});
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

function loadData() {

    //allow user to select file
    var selectedFile = document.getElementById('openButton');
    var fReader = new FileReader();
    fReader.readAsDataURL(selectedFile.files[0]);
    fReader.onloadend = function (event) {
        dataLoader(event.target.result)
    }

}

function dataLoader(file) {
    d3.text(file, function (txt) {

        str = txt.match(/Complex type: (\w*)/);
        complexType = str[1];
        str = txt.match(/Coverage radius: (\w*)/);
        complexRadius = +str[1];

        str = txt.replace(/#[^\n]*\n/g, []);
        str = str.replace(/OFF\r\n/i, []);

        re = /([^\r\n]*)\r\n/;
        line1 = str.match(re);
        line1 = line1[1];
        line1 = line1.match(/(\d*)\w/g);
        numSamples = +line1[0];
        numFaces = +line1[1];
        numEdges = +line1[2];

        str = str.replace(re, []);

        var edges = [];
        var faces = [];
        locationData = [];

        d3.dsvFormat(' ').parseRows(str, function (d, i) {
            if (i < numSamples) {
                locationData.push({anchor: {x: +d[0], y: +d[1]}});
            } else {
                if (d[0] == 3) {
                    faces.push({Pt1: +d[1], Pt2: +d[2], Pt3: +d[3]});
                } else if (d[0] == 2) {
                    edges.push({Pt1: +d[1], Pt2: +d[2]});
                }

            }
            ;
        });

        complexSelector = document.getElementsByName('complexType');
        if (complexType == 'Cech') {
            cechFaces = faces;
            cechEdges = edges;
            ripsFaces = [];
            ripsEdges = [];
            complexSelector[0].checked = true;
        } else if (complexType == 'Vietoris-Rips') {
            ripsFaces = faces;
            ripsEdges = edges;
            cechFaces = [];
            cechEdges = [];
            complexSelector[1].checked = true;
        }


        calculateRange();

        complexCanvas.attr("transform", d3.zoomIdentity)
        newxScale = false;
        newyScale = false;
        newZscale = 1;
        var rmax = d3.max([complexRadius, Math.ceil(0.5 * dataRange)]);


        gX.call(xAxis.scale(xScale));
        gY.call(yAxis.scale(yScale));
        updateGridLines();

        //adjust radius slider
        d3.select('#complexInput').node().value = complexRadius;
        d3.select('#complexRadius')
            .attr('min', 1)
            .attr('max', rmax);
        d3.select('#complexRadius').attr('value', complexRadius)

        perturbData();

       resetToDefaultView();
    });

}

function perturbData() {

    var r, theta, xj, yj, tmp;

    locationData.forEach(function (d) {
        tmp = [];
        for (j = 0; j < numPoints; j++) {
            r = Math.random() * dataRadius;
            theta = Math.random() * 2 * Math.PI;
            xj = d.anchor.x + Math.floor(r * Math.cos(theta));
            yj = d.anchor.y + Math.floor(r * Math.sin(theta));
            tmp.push({x: xj, y: yj})
        }
        d.points = tmp;
    })

}

function changeComplex() {

    d = document.getElementsByName('complexType');
    if (d[0].checked) {
        complexType = 'Cech'
        renderComplex(cechEdges, cechFaces);
    } else {
        complexType = 'Vietoris-Rips'
        renderComplex(ripsEdges, ripsFaces);
    }
}

function addNode() {

    complexSVG.attr('cursor', 'crosshair')
        .on('click', function () {
            coords = d3.mouse(d3.select('#complexSVG').node());
            updateNode(coords);
        });

    window.addEventListener('keydown', function (event) {
        if (event.code == 'Escape') {
            complexSVG.attr('cursor', null)
                .on('click', null);
        }
    });
}

function updateNode(coords) {
    console.log("update radius:" + complexRadius)

    if (locationData.length == 0) {
        resetToDefaultView();
    }
    ;

    i = locationData.length;
    var x, y;
    if (newxScale && newyScale) {
        x = newxScale.invert(coords[0] - padding);
        y = newyScale.invert(coords[1] - padding);
    } else {
        x = xScale.invert(coords[0] - padding);
        y = yScale.invert(coords[1] - padding);
    }
    ;

    var newPoint = {LocationID: i, xf: x, yf: y};
    locationData.push(newPoint);
    numSamples++;
    renderPoints();
    updateComplex(document.getElementById('complexInput').value);
}

function showCoverage(d) {
    if (d) {
        d3.select('#complexCircles').selectAll('circle')
            .transition()
            .style('visibility', 'visible')
            .style('fill', purpleColor)
            .style('fill-opacity',anchorOpacity);
        d3.select('#complexDataCircles').selectAll('circle')
            .transition()
            .style('visibility', 'visible')
            .style('fill', purpleColor)
            .style('fill-opacity', extraDataOpacity);
    } else {
        d3.select('#complexCircles').selectAll('circle')
            .transition()
            .style('fill', 'none');
        d3.select('#complexDataCircles').selectAll('circle')
            .transition()
            .style('fill', 'none');
    }
}

function show(state, type) {
    if (state) {
        str = 'visible'
    } else {
        str = 'hidden'
    }
    ;
    complexCanvas.selectAll(type)
        .style('visibility', str);
}

function dragNode() {
    coords = d3.mouse(this)
    i = this.id.match(/\d+/g);
    str = '#complex_Circle_' + i;
    d3.select(str)
        .attr('cx', coords[0])
        .attr('cy', coords[1]);
    d3.select(this)
        .attr('cx', coords[0])
        .attr('cy', coords[1]);

    wasDragged = true;
}

function dragEnd() {
    if (wasDragged) {
        coords = d3.mouse(d3.select('#complexSVG').node());
        i = this.id.match(/\d+/g);
        var x, y;
        if (newxScale && newyScale) {
            x = newxScale.invert(coords[0] - padding);
            y = newyScale.invert(coords[1] - padding);
        } else {
            x = xScale.invert(coords[0] - padding);
            y = yScale.invert(coords[1] - padding);
        }
        ;

        locationData[i].anchor.x = x;
        locationData[i].anchor.y = y;

        renderPoints();
        updateComplex(document.getElementById('complexInput').value);
    }
    wasDragged = false;
    for (i = 0; i < selectedNodes.length; i++) {
        highlightPoint([], selectedNodes[i])
    }
}

function selectNode() {
    if (d3.event.defaultPrevented) {
        return;
    }
    i = +this.id.match(/\d+/g);

    selectedNodes.push(i);
    highlightPoint([], i);

    d3.select('#complex_Point_' + i)
        .on('mouseover', null)
        .on('mouseout', null)
        .on('click', null);


    highlightPoint([], i);

    if (selectedNodes.length == 1) {
        window.addEventListener('keydown', nodeSelector);
    }
}

function nodeSelector() {
    if (event.code == 'Delete' || event.code == 'Backspace') {
        console.log(event.code)
        window.removeEventListener('keydown', nodeSelector)
        selectedNodes = selectedNodes.sort(function (a, b) {
            return a - b
        });
        for (j = 0; j < selectedNodes.length; j++) {
            locationData.splice(selectedNodes[j] - j, 1);
        }
        numSamples = locationData.length;
        selectedNodes = [];
        renderPoints();
        updateComplex(document.getElementById('complexInput').value);
    } else if (event.code == 'Escape') {
        window.removeEventListener('keydown', nodeSelector)
        selectedNodes = [];
        renderPoints();
        changeComplex();
    }

}

function sqEuclidDist(pt1, pt2) {
    return Math.pow(pt2[0] - pt1[0], 2) + Math.pow(pt2[1] - pt1[1], 2);
}

function clearScreen() {
    complexCanvas.selectAll('.face').remove();
    complexCanvas.selectAll('.edge').remove();
    complexCanvas.selectAll('.circle').remove();
    complexCanvas.selectAll('.point').remove();
    locationData = [];
    selectedNodes = [];
    newZscale = 1;
    xScale.domain([0, 100]);
    yScale.domain([0, 100]);
    gX.call(xAxis.scale(xScale));
    gY.call(yAxis.scale(yScale));
    newxScale = false;
    newyScale = false;
    updateGridLines();

    complexRadius = 10;
    numSamples = 0;

    d3.select('#complexInput')
        .attr('min', 1)
        .attr('max', 50);
    d3.select('#complexInput').node().value = complexRadius;
    document.getElementById('complexRadius').innerHTML = complexRadius.toString();
}

function setMax() {

    var rmax = d3.select('#complexInput').node().max.toString();
    var maxval = prompt('Enter maximum radius value', rmax)
    d3.select('#complexInput').attr('max', maxval);
    d3.select('#complexRadius').attr('max', maxval);
}