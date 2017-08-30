//
//Created by Tim on 11/10/2016.
//
// Common variables and functions used by all of the example plots
//

var yellowRedScale = ["#ffffb2", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026"];
var yellowBlueScale = ["#ffffcc", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#0c2c84"];
var bluePurpleScale = ["#edf8fb", "#bfd3e6", "#9ebcda", "#8c96c6", "#8c6bb1", "#88419d", "#6e016b"];
var redScale = ["#fef0d9", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#990000"];
var greenScale = ["#edf8fb", "#ccece6", "#99d8c9", "#66c2a4", "#41ae76", "#238b45", "#005824"];

var redEdgeScale = ['#fee5d9','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d','#99000d'];
var blueGreenEdgeScale = ["#f6eff7","#d0d1e6","#a6bddb", "#67a9cf", "#3690c0", "#02818a", "#016450"];
var pinkPurpleEdgeScale = ['#feebe2','#fcc5c0','#fa9fb5','#f768a1','#dd3497','#ae017e','#7a0177'];
var greenBlueEdgeScale = ['#ffffcc','#c7e9b4','#7fcdbb','#41b6c4','#1d91c0','#225ea8','#0c2c84'];
var pinkEdgeScale = ['#f1eef6','#d4b9da','#c994c7','#df65b0','#e7298a','#ce1256','#91003f']


var faceYellowBlueScale = d3.scaleQuantize().range(yellowBlueScale).domain([0, 1]);
var faceYellowRedScale = d3.scaleQuantize().range(yellowRedScale).domain([0, 1]);
var faceBluePurpleScale = d3.scaleQuantize().range(bluePurpleScale).domain([0, 1]);
var faceRedScale = d3.scaleQuantize().range(redScale).domain([0, 1]);
var faceGreenScale = d3.scaleQuantize().range(greenScale).domain([0, 1]);


var faceColorScale = faceYellowBlueScale;


var edgeRedScale = d3.scaleQuantize().range(redEdgeScale).domain([0, 1]);
var edgeBlueGreenScale = d3.scaleQuantize().range(blueGreenEdgeScale).domain([0, 1]);
var edgePinkPurpleScale = d3.scaleQuantize().range(pinkPurpleEdgeScale).domain([0, 1]);
var edgeGreenBlueScale = d3.scaleQuantize().range(greenBlueEdgeScale).domain([0, 1]);
var edgePinkScale = d3.scaleQuantize().range(pinkEdgeScale).domain([0, 1]);

var edgeColorScale = edgeRedScale;

var edgeWidthScale = d3.scaleLinear().range([6, 6]).domain([0.01, 1]);

createLegends();

var width = document.getElementById('plotArea').offsetWidth;          //Width of each plot
var height = document.getElementById('plotArea').offsetHeight;         //Height of each plot
var padding = 30;          //Buffer space to ensure points are adequately


//Initialize the data
var filename = 'data.json';
var locationData = [];
var complexType;
var selectedNodes = [];
var newZscale = 1;
var newxScale, newyScale;
var linew = 4;
var pad = padding;

var cechFaces = [];
var cechEdges = [];
var ripsFaces = [];
var ripsEdges = [];
var allEdges = [];
var dataMin = 0;
var distances = [];

var numSamples = 0;      //Number of points to use
var complexRadius = 20;          //epsilon ball radius
var dataRadius = 10; //radius of uncertainty
var numPoints = 8; //number of possible data locations per node
var originalDataRadius = 10;

//background grid information
var cellSize = 50;
var gridWidth = Math.ceil( (width+padding*2) / cellSize);
var gridHeight = Math.ceil( (height+padding*2) / cellSize);
var grid = new Array(gridWidth * gridHeight);
var wasDragged = false;
var zoomOn = false;

//Construct the main plot area and add gridlines
var complexSVG = d3.select("#plotArea").append('svg')
    .attr("class", "cech")
    .attr("id", "complexSVG")
    .attr("width", width+padding*2)
    .attr("height", height+padding*2)
    .style("margin", "auto")
    .style("border", "1px solid black");

var xScale = d3.scaleLinear()
    .domain([0,100])
    .range([0, width]);

var xAxis = d3.axisTop()
    .scale(xScale);

var gX = complexSVG.append('g')
    .attr('transform','translate('+padding+','+padding+')')
    .call(xAxis);

var yScale = d3.scaleLinear()
    .domain([0,100])
    .range([0, height]);

var yAxis = d3.axisLeft()
    .scale(yScale);

var gY = complexSVG.append('g')
    .attr('transform','translate('+padding+','+padding+')')
    .call(yAxis);




var complexCanvas = complexSVG.append('g')
    .attr('class','cech')
    .attr('id','complexCanvas');

complexSVG.append('rect')
    .attr('x', padding)
    .attr('y', padding)
    .attr('width', width)
    .attr('height', height)
    .style('fill','none')
    .style('stroke','#000')
    .style('stroke-opacity',1);

var zoom = d3.zoom()
    .scaleExtent([0.1, 10])
    .on('zoom', zoomed);

var zoombox = complexSVG.append("rect")
    .attr("width", width+padding*2)
    .attr("height", height+padding*2)
    .attr('id','zoomBox')
    .style("fill", "none")
    .style("pointer-events", "none")
    .style('visibility','off')
    .call(zoom);

var tooltip = d3.select("#plotArea").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

window.addEventListener('keydown', function (event) {
    if (event.key=='z') {
        if (zoomOn) {
            d3.select('#zoomBox')
                .attr('cursor','auto')
                .style('pointer-events','none')
                .style('visibility','off');
            zoomOn = false;
        } else {
            d3.select('#zoomBox')
                .attr('cursor','move')
                .style('pointer-events','all')
                .style('visibilty','on')
            zoomOn = true;
        }

    }
});

renderGrid();

dataLoader('data/data.json')


d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

function createLegends() {
    /**
     * Creates the legends for selecting colors. Calls createFaceLegend() and createEdgeLegend()
     */
    createFaceLengend();
    createEdgeLegend();
}

function createEdgeLegend() {
    /**
     * Creates edge legend based on selected color scale
     *
     */

    var legend = d3.select("#legend");
    legend.select('#legendEdge').remove()
    legend.append("g")
        .attr("id", "legendEdge")
        .attr('transform','translate(20,100)')
    var legendAxis = d3.legendColor()
        .scale(edgeColorScale)
        .orient('horizontal')
        .labelFormat(d3.format('.2f'))
        .labels(["0.14", "0.29", "0.43", "0.57", "0.71", "0.86", "1.00"])
        .title('Edge probability:')
        .shapeWidth(30)
        .shapeHeight(6)
        .labelAlign('center')
        .shapePadding(10);

    legend.select("#legendEdge").call(legendAxis);

    // var edgeLegend = d3.select('#edge_legend');
    // edgeLegend.append("g")
    //     .attr("class", "legendSizeLine")
    //     .attr("transform", "translate(0, 20)");
    //
    // var legendSizeLine = d3.legendSize()
    //     .scale(edgeWidthScale)
    //     .shape("line")
    //     .orient("horizontal").labels(["0.14", "0.29", "0.43", "0.57", "0.71", "0.86", "1.00"])
    //     .labelWrap(30)
    //     .shapeWidth(40)
    //     .labelAlign("start")
    //     .shapePadding(10);
    //
    // edgeLegend.select(".legendSizeLine")
    //     .call(legendSizeLine);

    // var lines = edgeLegend.selectAll("line");
    // lines.attr('stroke', function (d, i) {
    //     if (i == 0) {
    //         return edgeColorScale(0.14);
    //     }
    //     if (i == 1) {
    //         return edgeColorScale(0.29);
    //     }
    //     if (i == 2) {
    //         return edgeColorScale(0.43);
    //     }
    //     if (i == 3) {
    //         return edgeColorScale(0.57);
    //     }
    //     if (i == 4) {
    //         return edgeColorScale(0.71);
    //     }
    //     if (i == 5) {
    //         return edgeColorScale(0.86);
    //     }
    // });
}

/**
 * Create face legend based on selected color scale.
 */
function createFaceLengend() {

    // var quantize = d3.scaleQuantize()
    //     .domain([0,1])
    //     .range(["#ffffcc", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#0c2c84"]);
    //
    // console.log(quantize(0.5))
    //
    // var legend = d3.select('#face_legend');
    //
    // legend.select('.legendSequential').remove()
    // legend.append('g')
    //     .attr('class','legendSequential')
    //     .attr('transform','translate(20,20)')
    //
    // var legendAxis = d3.legendColor()
    //     .labelFormat(d3.format(".2f"))
    //     .useClass(true)
    //     .title('Face probability:')
    //     .titleWidth(100)
    //     .scale(quantize);
    //
    // legend.select('.legendSequential').call(legendAxis);

    var legend = d3.select("#legend");
    legend.select('#legendFace').remove()
    legend.append("g")
        .attr('id','legendFace')
        .attr('transform','translate(20,20)')
    var legendAxis = d3.legendColor()
        .scale(faceColorScale)
        .title('Face probability:')
        .orient('horizontal')
        .labelFormat(d3.format('.2f'))
        .labels(["0.14", "0.29", "0.43", "0.57", "0.71", "0.86", "1.00"])
        .shapeWidth(30)
        .labelAlign('center')
        .shapePadding(10);

    legend.select("#legendFace").call(legendAxis);
}

/**
 * Change the edge or face color scale
 * @param {string} selected Which color scale to use.
 */
function changeColorScale(selected) {
    switch (selected) {
        case "yellowBlue" :
            faceColorScale = faceYellowBlueScale;
            edgeColorScale = edgeRedScale;
            break;
        case "yellowRed" :
            faceColorScale = faceYellowRedScale;
            edgeColorScale = edgeBlueGreenScale;
            break;
        case "bluePurple" :
            faceColorScale = faceBluePurpleScale;
            edgeColorScale = edgePinkPurpleScale;
            break;
        case "red" :
            faceColorScale = faceRedScale;
            edgeColorScale = edgeGreenBlueScale;
            break;
        case "green" :
            faceColorScale = faceGreenScale;
            edgeColorScale = edgePinkScale;
            break;
    }
    changeComplex();
    renderView();
    createFaceLengend();
    createEdgeLegend();
}


/**
 * Render gridlines for every tick mark on axes.
 */
function renderGrid() {

    d3.select('#xlines').remove();
    d3.select('#ylines').remove();

    var xt = xAxis.scale().ticks();

    var xticks = (newxScale) ?
        xt.map( function (d) {
            return newxScale(d) + padding;
        }) :
        xt.map( function (d) {
            return xScale(d) + padding;
        });

    var xlines = complexSVG.append('g')
        .attr('class','grid')
        .attr('id','xlines');


    xlines.selectAll('line').data(xticks)
        .enter().append('line')
        .attr('id','xline')
        .attr('class','grid')
        .attr('x1', function (d) { return d })
        .attr('y1', padding)
        .attr('x2', function (d) { return d })
        .attr('y2', height+padding);

    var yt = yAxis.scale().ticks();

    var yticks = (newyScale) ?
        yt.map( function (d) {
            return newyScale(d) + padding;
        }) :
        yt.map( function (d) {
            return yScale(d) + padding;
        });

    var ylines = complexSVG.append('g')
        .attr('class','grid')
        .attr('id','ylines');


    ylines.selectAll('line').data(yticks)
        .enter().append('line')
        .attr('id','yline')
        .attr('class','grid')
        .attr('y1', function (d) { return d })
        .attr('x1', padding)
        .attr('y2', function (d) { return d })
        .attr('x2', width+padding);
}

/**
 * Change scales and zoom plot area.
 */
function zoomed() {
    complexCanvas.attr("transform", d3.event.transform)
    newxScale = d3.event.transform.rescaleX(xScale);
    newyScale = d3.event.transform.rescaleY(yScale);
    newZscale = d3.event.transform.k;

    linew = 4/newZscale;
    pad = padding/newZscale;

    gX.call(xAxis.scale(newxScale));
    gY.call(yAxis.scale(newyScale));
    if (locationData.length != 0) {
        if (d3.event.sourceEvent.type == 'wheel') {
            d3.select('#complexPoints').selectAll('circle')
                .attr('r', 5 / newZscale);
            d3.select('#complexEdges').selectAll('line')
                .style('stroke-width', 4 / newZscale);
        }
        if (d3.event.sourceEvent.type == 'wheel') {
            renderPoints();
            changeComplex();
        }
    }
    renderGrid();
}


/**
 * Called whenever the data are changed. Updates the coverage radius and recomputes simplicial complexes.
 * @param newValue {number} The new coverage radius.
 */
function updateComplex(newValue) {
    //update coverage radius and recompute complexes


    //update slider value and/or tex value
    complexRadius=+newValue;
    d3.select('#complexRadius').node().value =  complexRadius;
    d3.select('#complexInput').node().value = complexRadius;

    //adjust inner and outer coverage disks
    var innerRadius = xScale(complexRadius - dataRadius + xScale.domain()[0]);
    var outerRadius = xScale(complexRadius + dataRadius + xScale.domain()[0]);
    d3.select('#complexCircles').selectAll('circle').attr('r', innerRadius);
    d3.select('#complexDataCircle').selectAll('circle').attr('r', outerRadius);

    //recompute complexes
    var t = Date.now();
    constructRips();
    var t2 = Date.now() - t;
    console.log('compute: ' + t2);


    changeComplex();
    var t3 = Date.now() - t - t2;
    console.log('render: ' + t3)
}

//graphical highlighting

/**
 * Highlights a data point on mouseover or when corresponding edge or face is highlighted.
 */
function highlightPoint() {

    var n = (arguments.length == 3) ? arguments[1] : arguments[0]
    var pt = '#complex_Point_'+n;
    var cir = '#complex_Circle_'+n;
    var d_cir = '#data_Circle_'+n;

    d3.select(pt)
        .transition()
        .style('fill', '#c33');

    d3.select(pt).moveToFront();
    for (i=0; i<numPoints; i++) {
        d3.select('#complex_small_Point_'+n+'_'+i).moveToFront()
    }

    if (document.getElementById('coverCheckbox').checked) {

        //highlight the corresponding coverage circle
        d3.select(cir)
            .transition()
            .style('fill', '#c33')
            .style('fill-opacity', 0.25);

        d3.select(cir).moveToFront();

        d3.select(d_cir)
            .transition()
            .style('fill', '#c33')
            .style('fill-opacity', 0.1);

        d3.select(d_cir).moveToFront();
    }

}

/**
 * Resets data point to default color as defined by current color scale.
 */
function resetPoint() {

    var n = (arguments.length == 3) ? arguments[1] : arguments[0]
      if(selectedNodes.includes(n)) {
        return
      }
    var pt = '#complex_Point_'+n;
    var cir = '#complex_Circle_'+n;
    var d_cir = '#data_Circle_'+n;

    d3.select(pt)
        .transition()
        .style('fill', '#9370db');

    var parNode = d3.select('#complexPoints').node();
    var newNode = d3.select(pt).node();
    var str = (n == numSamples-1) ? '#complex_small_Point_0_0' : '#complex_Point_'+(n+1);
    var refNode = d3.select(str).node();

    parNode.insertBefore(newNode, refNode)
    if (n<numSamples) {
        refNode = d3.select('#complex_small_Point_'+(n+1)+'_0').node();
        for (i=0; i<numPoints; i++) {
            newNode = d3.select('#complex_small_Point_'+n+'_'+i).node();
            parNode.insertBefore(newNode, refNode)
        }
    }

    if (document.getElementById('coverCheckbox').checked) {
        d3.select(cir)
            .transition()
            .style('fill', '#9370db')
            .style('fill-opacity', 0.25);
        d3.select(d_cir)
            .transition()
            .style('fill', '#9370db')
            .style('fill-opacity', 0.1);
    }


}

/**
 * Displays probability of selected edge or face
 * @param type {string} Must be 'Edge' or 'Face'
 * @param data {number} The probability of the object.
 */
function showToolTip(type, data){
    tooltip.transition()
        .style("opacity", 0.9);
    tooltip.html(type + " probability of " + data.toFixed(3))
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
}

/**
 * Hides object probability.
 */
function hideToolTip(){
    tooltip.transition()
        .style("opacity", 0);
}

/**
 * Highlight edge and it's corresponding points.
 */
function highlightEdge() {

    var data = arguments[0];
    var edge;

    if(this.className != "individual_edge" && data.hasOwnProperty("Pedge")){
        showToolTip('Edge', data.Pedge);
        highlightPoint(data.Pt1);
        highlightPoint(data.Pt2);
        edge = this;
    } else {
        edge = data;
    }

    d3.select(edge)
        .transition()
        .style('stroke','#c33');

    d3.select(edge).moveToFront()


}

/**
 * Reset edge to default color based on selected color scale.
 */
function resetEdge() {
    hideToolTip();
    var data;

    edges = complexType == 'Cech' ? cechEdges : ripsEdges;

    edges.forEach( function (d) {
        d3.select('#complex_Edge_'+d.Pt1+'_'+d.Pt2)
            .moveToFront()
    })

    if (arguments.length == 3) {
        edge = d3.select(this)
        data = arguments[0]
        resetPoint(data.Pt1);
        resetPoint(data.Pt2);
        edge.transition()
            .style('stroke', edgeColorScale(arguments[0].Pedge));
    } else {
        edge = d3.select(arguments[0]);
        var points = arguments[0].replace(/#complex_Edge_/, '');
        for (i = 0; i < ripsEdges.length; i++){
            var possibleEdge = ripsEdges[i];
            if(points == possibleEdge.Pt1 + "_" + possibleEdge.Pt2){
                edge.transition()
                    .style('stroke', edgeColorScale(possibleEdge.Pedge));
                return;
            }
        }


    }

}

/**
 * Highlight face along with it's corresponding edges and points.
 */
function highlightFace() {

    var data = arguments[0];
    if(data.hasOwnProperty("Pface")){
        showToolTip('Face', data["Pface"]);
    }


    d3.select(this)
        .transition()
        .style('fill','#969696');

    d3.select(this).moveToFront();

    //highlight corresponding edges
    highlightEdge('#complex_Edge_' + arguments[0].Pt1 + '_' + arguments[0].Pt2);
    highlightEdge('#complex_Edge_' + arguments[0].Pt1 + '_' + arguments[0].Pt3);
    highlightEdge('#complex_Edge_' + arguments[0].Pt2 + '_' + arguments[0].Pt3);

    //highlight corresponding points
    highlightPoint(arguments[0].Pt1);
    highlightPoint(arguments[0].Pt2);
    highlightPoint(arguments[0].Pt3);


}


//reset to default view
/**
 * Reset face to default color based on selected color scale.
 */
function resetFace() {
    hideToolTip();

    faces = complexType == 'Cech' ? cechFaces : ripsFaces;

    faces.forEach( function (d) {
        d3.select('#complex_Face_'+d.Pt1+'_'+d.Pt2+'_'+d.Pt3)
            .moveToFront()
    })

    d3.select(this)
        .transition()
        .style('fill', faceColorScale(arguments[0].Pface));

    resetEdge('#complex_Edge_' + arguments[0].Pt1 + '_' + arguments[0].Pt2);
    resetEdge('#complex_Edge_' + arguments[0].Pt1 + '_' + arguments[0].Pt3);
    resetEdge('#complex_Edge_' + arguments[0].Pt2 + '_' + arguments[0].Pt3);

    resetPoint(arguments[0].Pt1);
    resetPoint(arguments[0].Pt2);
    resetPoint(arguments[0].Pt3);

}

/**
 * Compute probability of edge (lines) for all n choose 2 permutations of locations.
 * @returns {{edges: Array, edgeProb: Array}}
 */
function constructEdges() {

    /**
     *
     * Test distance to determine if edge exists, squared to save computation time.
     * @type {number}
     */
    var sqDiameter = 4 * Math.pow(complexRadius, 2);
    /**
     *
     * Minimum distance between nodes for which coverage can be guaranteed equal to the coverage radius minus the radius of uncertainty.
     * @type {number}
     */
    var sqDiameterMin = 4 * Math.pow(complexRadius-dataRadius, 2);
    /**
     *
     * Maximum distance between nodes for which coverage is possible, equal to the coverage radius plus the radius of uncertainty.
     * @type {number}
     */
    var sqDiameterMax = 4 * Math.pow(complexRadius+dataRadius, 2);
    var edgeProb = [];
    var tempEdges = [];
    var count, p, pFlag;

    locationData.forEach( function (d) {
        d.star = {edges: [], faces: []};
        d.link = {points: [], edges: []}
    })


    for (i = 0; i < numSamples - 1; i++) {
        x1 = locationData[i].anchor.x;
        y1 = locationData[i].anchor.y;
        edgeProb.push([0]);
        for (j = i + 1; j < numSamples; j++) {
            x2 = locationData[j].anchor.x;
            y2 = locationData[j].anchor.y;
            d12 = sqEuclidDist([x1, y1], [x2, y2]);
            if (d12 <= sqDiameterMin) {
                edgeProb[i].push({p: 1, edgeInd: tempEdges.length})
                locationData[i].star.edges.push(tempEdges.length)
                locationData[i].link.points.push([j])
                locationData[j].star.edges.push(tempEdges.length)
                locationData[j].link.points.push([i])
                tempEdges.push({Pt1: i, Pt2: j, Pedge: 1})
            } else if (d12 > sqDiameterMax){
                edgeProb[i].push({p: 0})
            } else {
                count = 0;
                pFlag = [];
                iEdges = [];
                for (m=0; m<numPoints; m++) {
                    x1 = locationData[i].points[m].x;
                    y1 = locationData[i].points[m].y;
                    for (n=0; n<numPoints; n++) {
                        x2 = locationData[j].points[n].x;
                        y2 = locationData[j].points[n].y;
                        d12 = sqEuclidDist([x1, y1],[x2,y2]);
                        if (d12 <= sqDiameter) {
                            count++
                            pFlag.push(true)
                            iEdges.push({Pt1: m, Pt2: n})
                        } else {
                            pFlag.push(false)
                        }
                    }
                }
                p = count/(numPoints*numPoints);
                edgeProb[i].push({p: p, pFlag: pFlag, edgeInd: tempEdges.length})
                if (p>0) {
                    locationData[i].star.edges.push(tempEdges.length)
                    locationData[i].link.points.push([j])
                    locationData[j].star.edges.push(tempEdges.length)
                    locationData[j].link.points.push([i])
                    tempEdges.push({Pt1: i, Pt2: j, Pedge: p, iEdges: iEdges})
                }
            }
        }
    }


    /**
     *
     * Stores all individual edges for ease of rendering
     * @type {Array}
     */
    allEdges = [];
    tempEdges.forEach( function(d) {
        if (d.Pedge == 1) {
            for (i=0; i<numPoints; i++) {
                for (j=0; j<numPoints; j++) {
                    x1 = locationData[d.Pt1].points[i].x;
                    y1 = locationData[d.Pt1].points[i].y;
                    x2 = locationData[d.Pt2].points[j].x;
                    y2 = locationData[d.Pt2].points[j].y;
                    allEdges.push({x1: x1, y1: y1, x2: x2, y2: y2})
                }
            }
        } else {
            for (i=0; i<d.iEdges.length; i++) {
                x1 = locationData[d.Pt1].points[d.iEdges[i].Pt1].x;
                y1 = locationData[d.Pt1].points[d.iEdges[i].Pt1].y;
                x2 = locationData[d.Pt2].points[d.iEdges[i].Pt2].x;
                y2 = locationData[d.Pt2].points[d.iEdges[i].Pt2].y;
                allEdges.push({x1: x1, y1: y1, x2: x2, y2: y2})
            }
        }
    })

    return {edges: tempEdges, edgeProb: edgeProb}

}

/**
 * Compute Vietoris-Rips complex. Determine 2-faces (triangles) from location data. Computes a probability for each face.
 * A face exists for each n choose 3 permutation of points for which each point is pairwise connected by an edge.
 */
function constructRips() {

    var tempFaces = [];
    ripsFaces = [];
    var tmp = constructEdges();
    ripsEdges = tmp.edges.slice();
    var edgeProb = tmp.edgeProb.slice();


    var faceProb = [];
    for (i=0; i<numSamples-2; i++) {
        for (j=i+1; j<numSamples-1; j++) {
            if (edgeProb[i][j-i].p > 0) {
                for (k=j+1; k<numSamples; k++) {
                    if (edgeProb[j][k-j].p == 1 && edgeProb[i][k-i].p == 1 && edgeProb[i][j-i].p == 1){
                        tempFaces.push({Pt1: i, Pt2: j, Pt3: k, Pface: 1})
                        faceProb.push(1)
                    } else if (edgeProb[j][k-j].p > 0 && edgeProb[i][k-i].p > 0){
                        tempFaces.push({Pt1: i, Pt2: j, Pt3: k, p12: edgeProb[i][j-i], p13: edgeProb[i][k-i], p23: edgeProb[j][k-j]})
                        faceProb.push(0)
                    }
                }
            }
        }
    }

    tempFaces.forEach( function (d, ind) {
        var count = 0;
        var allFaces = [];
        for (i=0; i<numPoints; i++) {
            for (j=0; j<numPoints; j++) {
                for (k=0; k<numPoints; k++) {
                    isEdge = [true, true, true];
                    if (faceProb[ind] == 0) {
                        if (d.p12.p < 1) {
                            isEdge[0] = d.p12.pFlag[i * numPoints + j] ? true : false;
                        }
                        if (d.p13.p < 1) {
                            isEdge[1] = d.p13.pFlag[i * numPoints + k] ? true : false;
                        }
                        if (d.p23.p < 1) {
                            isEdge[2] = d.p23.pFlag[j * numPoints + k] ? true : false;
                        }
                    }
                    if (isEdge[0] && isEdge[1] && isEdge[2]) {
                        allFaces.push([i, j, k])
                        count++
                    }
                }
            }
        }
        p = count/Math.pow(numPoints,3);
        d.allFaces = allFaces;

        if (p>0) {
            d.Pface = p;
            ripsFaces.push(d);
        }
    })

    constructCech()

}

/**
 * Construct the &#268;ech complex. For each face determined from the Vietoris-Rips complex, test whether all three points
 * have a common intersection. Computes a probability for each face.
 */
function constructCech() {

    cechEdges = ripsEdges.slice();
    var tempFaces = JSON.parse(JSON.stringify(ripsFaces));
    cechFaces = [];

    var sqDist;
    //calculate the squared diameter to compare each pair to. Use square diameter to compare to squared euclidean distanct
    //of each pair so save computation.
    sqDiameter = 4 * Math.pow(complexRadius, 2);

    tempFaces.forEach( function(d, i) {
        d.Pface = 0;
        count = 0;
        for (j=0; j<d.allFaces.length; j++) {
            x1 = locationData[d.Pt1].points[d.allFaces[j][0]].x;
            y1 = locationData[d.Pt1].points[d.allFaces[j][0]].y;
            x2 = locationData[d.Pt2].points[d.allFaces[j][1]].x;
            y2 = locationData[d.Pt2].points[d.allFaces[j][1]].y;
            x3 = locationData[d.Pt3].points[d.allFaces[j][2]].x;
            y3 = locationData[d.Pt3].points[d.allFaces[j][2]].y;
            d12 = sqEuclidDist([x1, y1], [x2, y2]);
            d23 = sqEuclidDist([x2, y2], [x3, y3]);
            d13 = sqEuclidDist([x1, y1], [x3, y3]);

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
                count++
            } else {
                //otherwise determine if circumcircle radius is smaller than the coverage radius
                a = Math.sqrt(d12);
                b = Math.sqrt(d13);
                c = Math.sqrt(d23);
                testRadius = (a * b * c) / Math.sqrt((a + b + c) * (b + c - a) * (a + c - b) * (a + b - c));
                if (testRadius <= complexRadius) {
                    count++
                }
            }
        }
        p = count/Math.pow(numPoints,3);
        if (p > 0) {
            d.Pface = p;
            cechFaces.push(d)
        }
    })


}


/**
 * Renders the probabilistic simplicial complexes generated by constructCech() or constructRips
 * @param {array} edges - An object array containing the edges, must contain the following fields: Pt1, Pt2, Pedge
 * @param {array} faces - An object array containing the faces, must contain the following fields: Pt1, Pt2, Pt3, Pface
 */
function renderComplex(edges,faces) {

    if (edges.length==0) {
        constructRips();
    };

    // edges.forEach( function (d,i) {
    //     d.star = {points: [], faces: []};
    //     d.link = {points: [], edges: [], faces: []}
    //     t = locationData[d.Pt1].star.faces.forEach( function (e) {
    //         var testArray = [faces[e].Pt1, faces[e].Pt2, faces[e].Pt3];
    //         if (testArray.indexOf(d.Pt2) != -1) {
    //             d.star.faces.push(e)
    //         } else {
    //             d.link.faces.push(e)
    //         }
    //         return
    //     })
    //
    //     locationData[d.Pt2].star.faces.forEach( function (e) {
    //         if (d.star.faces.indexOf(e) == -1 && d.link.faces.indexOf(e) == -1) {
    //             d.link.faces.push(e)
    //         }
    //     })
    // })


    //remove existing canvas elements
    complexCanvas.select('#complexFaces').remove();
    complexCanvas.append('g')
        .attr('id','complexFaces')
        .style('visibility','hidden');
    renderFaces();

    complexCanvas.selectAll('#complexEdges').remove();
    complexCanvas.append('g')
        .attr('id','complexEdges')
        .style('visibility','hidden');
    renderEdges();



//render faces, give each an id with corresponding vertex indices. This makes it easier to find and highlight the corresponding
    //points and edges, do the same for each edge. Start with everything hidden then render view according to what the user
    //has selected



    //Make sure points stay on top
    pts = d3.select('#complexPoints').node();
    pts.parentNode.appendChild(pts);

    renderAllEdges();
    renderView();


}

/**
 * Renders edges for selected simplicial complex. Colors bundled edges based on probability.
 */
function renderEdges(){
    var edges;
    if (complexType=='Cech') {
        edges = cechEdges.sort( function (a, b) { return a.Pedge - b.Pedge } );
    } else if (complexType=='Rips') {
        edges = ripsEdges.sort( function (a, b) { return a.Pedge - b.Pedge } );
    }
    complexCanvas.selectAll('.edge').remove();
    var complexEdges = complexCanvas.select('g#complexEdges');
    complexEdges.selectAll('line').data(edges)
        .enter().append('line')
        .attr('class', 'edge')
        .style('stroke-width', function(d){
            return 6/newZscale;
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
            return 'complex_Edge_'+d.Pt1+'_'+d.Pt2;
        })
        .attr('stroke', function (d) {
            return edgeColorScale(d.Pedge);
        })
        .on('mouseover', highlightEdge)
        .on('mouseout', resetEdge);
}

/**
 * Renders faces for selected simplicial complex. Colors faces based on probability.
 */
function renderFaces(){
    var faces;
    if (complexType=='Cech') {
        faces = cechFaces.sort( function (a, b) { return a.Pface - b.Pface } );
    } else if (complexType=='Rips') {
        faces = ripsFaces.sort( function (a, b) { return a.Pface - b.Pface } );
    }

    // console.log(faces)
    complexCanvas.select('.face').remove();
    var complexFaces = complexCanvas.select('g#complexFaces');
    complexFaces.selectAll('polygon').data(faces)
        .enter().append('polygon')
        .attr('class','face')
        .attr('points',function (d, i) {
                return  (xScale(locationData[d.Pt1].anchor.x)+padding/newZscale)+','+(yScale(locationData[d.Pt1].anchor.y)+padding/newZscale)+
                    ' '+(xScale(locationData[d.Pt2].anchor.x)+padding/newZscale)+','+(yScale(locationData[d.Pt2].anchor.y)+padding/newZscale)+
                    ' '+(xScale(locationData[d.Pt3].anchor.x)+padding/newZscale)+','+(yScale(locationData[d.Pt3].anchor.y)+padding/newZscale);
            }
        )
        .attr('id', function (d, i) {
            fc = faceColorScale(d.Pface)
            // console.log(d.Pt1+' '+d.Pt2+' '+d.Pt3+' p='+d.Pface+', color='+fc)
            return 'complex_Face_'+d.Pt1+'_'+d.Pt2+'_'+d.Pt3;
        })
        .attr('fill', function (d) {
            return faceColorScale(d.Pface);
        })
        .on('mouseover',highlightFace)
        .on('mouseout', resetFace);
}

/**
 * Render individual edges. These are the actual data points for each location that meet the coverage criteria (i.e. have overlapping coverage circles).
 */
function renderAllEdges(){
    complexCanvas.selectAll('#allEdges').remove();
    var allEdgesGroup = complexCanvas.append('g')
        .attr('id','allEdges')
        .attr('class', 'all_edges');
    allEdgesGroup.selectAll('line').data(allEdges)
        .enter().append('line')
        .attr('class', 'individual_edge')
        .attr('x1', function (d) {
            return xScale(d.x1) + pad;
        })
        .attr('y1', function (d) {
            return yScale(d.y1) + pad;
        })
        .attr('x2', function (d) {
            return xScale(d.x2) + pad;
        })
        .attr('y2', function (d) {
            return yScale(d.y2) + pad;
        })
        .attr('id', function (d) {
            return 'complex_individual_Edge_'+d.x1+'_'+d.x2+d.y1+'_'+d.y2;
        })
        .attr('stroke',  'black');
}

/**
 * Render all anchor points, individual points, coverage circles and radius of uncertainty.
 */
function renderPoints() {

    //render each point and coverage circle. The id simply corresponds to its index within locationData

    complexCanvas.selectAll('.circle').remove();
    complexCanvas.selectAll('.point').remove();
    var complexCircles = complexCanvas.append('g')
        .attr('class','circle')
        .attr('id','complexCircles')
    var complexPoints = complexCanvas.append('g')
        .attr('class', 'point')
        .attr('id','complexPoints');
    var complexAndDataCircle = complexCanvas.append('g')
        .attr('class', 'circle')
        .attr('id', 'complexDataCircle');

    var pts = complexPoints.selectAll('circle').data(locationData)
        .enter()
        .append('circle')
        .style('visibility','hidden')
        .attr('class', 'point')
        .attr('cx', function (d) {
            if (newxScale && newyScale) {
                return xScale(d.anchor.x) + padding/newZscale;
            }
            else {
                return xScale(d.anchor.x) + padding;
            }
        })
        .attr('cy', function (d) {
            if (newxScale && newyScale) {
                return yScale(d.anchor.y) + padding/newZscale;
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
        .each(function(d, j){
            complexPoints.selectAll('small_circle').data(d.points)
                .enter()
                .append('circle')
                .attr('class', 'small_circle')
                .attr('cx', function (d) {
                    if (newxScale && newyScale) {
                        return xScale(d.x) + padding/newZscale;
                    }
                    else {
                        return xScale(d.x) + padding;
                    }
                })
                .attr('cy', function (d) {
                    if (newxScale && newyScale) {
                        return yScale(d.y) + padding/newZscale;
                    }
                    else {
                        return yScale(d.y) + padding / newZscale;
                    }
                })
                .attr('id', function (d, i) {
                    return 'complex_small_Point_' + j.toString() + '_' + i.toString();
                })
                .attr('r', 2/newZscale);
        });

    complexCircles.selectAll('circle').data(locationData)
        .enter()
        .append('circle')
        .style('visibility','hidden')
        .attr('class', 'circle')
        .attr('cx', function (d) {
            return xScale(d.anchor.x) + padding/newZscale;
        })
        .attr('cy', function (d) {
            return yScale(d.anchor.y) + padding/newZscale;
        })
        .attr('id', function (d, i) {
            return 'complex_Circle_' + i.toString();
        })
        .attr('r', xScale(complexRadius-dataRadius + xScale.domain()[0]));



    complexAndDataCircle.selectAll('circle').data(locationData)
        .enter()
        .append('circle')
        .attr('class', 'circle')
        .attr('cx', function (d) {
            return xScale(d.anchor.x) + padding/newZscale;
        })
        .attr('cy', function (d) {
            return yScale(d.anchor.y) + padding/newZscale;
        })
        .attr('id', function (d, i) {
            return 'data_Circle_' + i.toString();
        })
        .attr('fill', '#9370db')
        .attr('fill-opacity', 0.1)
        .attr('r', xScale(dataRadius + complexRadius + xScale.domain()[0]));

    // For plotting node labels (disable, only for troubleshooting)
   //
   //  r = xScale(dataRadius + xScale.domain()[0])+5;
   //  textOffset = -r * Math.cos( 3*Math.PI/4 );
   //
   // complexCanvas.selectAll('.text').remove();
   //  var labels = complexCanvas.append('g')
   //     .attr('id','labels')
   //
   //  labels.selectAll('text')
   //      .data(locationData)
   //      .enter().append('text')
   //      .text( function (d, i) {
   //          return i.toString();
   //      })
   //      .attr('x', function (d) {
   //          return xScale(d.anchor.x) + padding/newZscale;
   //      })
   //      .attr('y', function (d) {
   //          return yScale(d.anchor.y) + padding/newZscale;
   //      })
   //      .attr('dx',textOffset)
   //      .attr('dy',textOffset)
   //      .style('stroke','#000');

    renderView()

}

/**
 * Render data. Checks the interface for which layers are to be displayed and calls the appropriate rendering functions.
 */
function renderView() {
    //query the various view options toggle visibility of each "g" element accordingly
    f = document.getElementById('coverCheckbox');
    showCoverage(f.checked);
    f = document.getElementById('nodeCheckbox');
    show(f.checked,'.small_circle');
    f = document.getElementById('nodeRadiusCheckbox');
    show(f.checked,'.point');
    f = document.getElementById('edgeCheckbox');
    show(f.checked,'.edge');
    f = document.getElementById('allEdgeCheckbox');
    show(f.checked,'.individual_edge');
    f = document.getElementById('faceCheckbox');
    show(f.checked,'.face');
}

/**
 * Update the display limits.
 * @param xMin {number} The minimum x-value to display.
 * @param xMax {number} The maximum x-value to display.
 * @param yMin {number} The minimum y-value to display.
 * @param yMax {number} The maximum y-value to display.
 */
function updateScales(xMin, xMax, yMin, yMax){

    var aspect = width/height;
    var xRange = xMax-xMin;
    var yRange = yMax-yMin;
    var dataAspect = xRange/yRange;

    if (dataAspect>1) {
        xScaleMax = xMax;
        yScaleMax = yMin + xRange/aspect;
    } else {
        xScaleMax = xMin = yRange*aspect;
        yScaleMax = yMax;
    }

    xScale.domain([xMin, xScaleMax])
    yScale.domain([yMin, yScaleMax])

    // var aspect, yScaleMax, xScaleMax;
    //
    //
    // if(aspectMin == height){
    //     aspect = width / height;
    //     yScaleMax = yMax;
    //     xScaleMax = yScaleMax * aspect;
    //     xScale.domain([xMin, xScaleMax]);
    //     yScale.domain([yMin, yScaleMax]);
    //
    // } else {
    //     aspect = height / width;
    //     xScaleMax = xMax;
    //     yScaleMax = xScaleMax * aspect;
    //     xScale.domain([xMin, xScaleMax]);
    //     yScale.domain([yMin, yScaleMax]);
    //     console.log('here')
    // }

}

/**
 * Import anchor locations from a CSV file.
 * <br><br>
 * Files must contain, at a minimum, a column labeled "xf" and a column labeled "yf" with scalar values corresponding
 * to the anchor coordinates.
 */
function importData() {

    //allow user to select file
    var selectedFile = document.getElementById('fileSelector');
    var fReader = new FileReader();
    fReader.readAsDataURL(selectedFile.files[0]);
    fReader.onloadend = function(event) {

        d3.csv(event.target.result, function (csv) {

            //read data into locationData array and update number of samples
            locationData = [];
            csv.forEach(function (d) {

                // Convert numeric values to 'numbers'
                locationData.push({anchor: {x: +d.xf, y: +d.yf} });
            });
            numSamples = locationData.length;
            perturbData();

            //set data scale
            xMin = d3.min(locationData.map( function (d) {
                return d.anchor.x;
            }));
            xMax = d3.max(locationData.map( function (d) {
                return d.anchor.x;
            }));
            xRange = xMax-xMin;
            yMin = d3.min(locationData.map( function (d) {
                return d.anchor.y;
            }));
            yMax = d3.max(locationData.map( function (d) {
                return d.anchor.y;
            }));
            yRange = yMax-yMin;

            dataRange = d3.max([xRange, yRange]);
            updateScales(xMin, xMax, yMin, yMax);

            d3.select('#complexInput')
                .attr('min', 0.05*dataRange)
                .attr('max', 0.5*dataRange)
                .attr('value', 0.2*dataRange);



            complexCanvas.attr("transform", d3.zoomIdentity)
            newxScale = false;
            newyScale = false;
            newZscale = 1;

            gX.call(xAxis.scale(xScale));
            gY.call(yAxis.scale(yScale));
            renderGrid()

            //reset to default view and calculate complexes
            resetCheckboxes();
            renderPoints();
            updateComplex(document.getElementById('complexInput').value);
        });
    }
}

/**
 * Resets display checkboxes to their default values.
 */
function resetCheckboxes(){
    c = document.getElementById('coverCheckbox');
    c.disabled = false;
    c.checked = true;
    r = document.getElementById('nodeRadiusCheckbox');
    r.disabled = false;
    r.checked = true;
    n = document.getElementById('nodeCheckbox');
    n.disabled = false;
    n.checked = true;
    document.getElementById('edgeCheckbox').disabled = 0;
    document.getElementById('faceCheckbox').disabled = 0;
}

/**
 * Generate uniform random anchor locations.
 */
function randomData() {
//generate uniform random data points

    var xd = (newxScale) ? newxScale.domain() : xScale.domain();
    var xmin = xd[0] + 0.1*(xd[1]-xd[0]);
    var xmax = xd[1] - 0.1*(xd[1]-xd[0]);

    var yd = (newyScale) ? newyScale.domain() : yScale.domain();
    var ymin = yd[0] + 0.1*(yd[1]-yd[0]);
    var ymax = yd[1] - 0.1*(yd[1]-yd[0]);


    numSamples = +document.getElementById('numSensors').value;

    locationData = [];

    for (i=0; i<numSamples; i++) {
        var xi = Math.random() * (xmax - xmin + 1)  + xmin;
        var yi = Math.random() * (ymax - ymin + 1)  + ymin;
        locationData.push({ anchor: {x: xi, y: yi}});
    };

    perturbData();

    dataRange = d3.max([xd[1]-xd[0], yd[1]-yd[0]]);
    dataPadding = 0.1*dataRange;

    d3.select('#complexInput')
        .attr('min', 0.05*dataRange)
        .attr('max', 0.5*dataRange)
        .attr('value', 0.2*dataRange);

    resetCheckboxes();

    renderPoints();
    updateComplex(document.getElementById('complexInput').value);
}

/**
 * Save data to a JSON file.
 */
function saveData() {

    var data = {n: numSamples, k: numPoints, r: complexRadius, eps: dataRadius, sensors: locationData,
        allEdges: allEdges, cechComplex: [cechEdges, cechFaces], ripsComplex: [ripsEdges, ripsFaces]};
    var tempData = JSON.stringify(data, null, 2);


    var blob = new Blob([tempData], { type: 'text/plain;charset=utf-8;' });
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


/**
 * Allow user to select file from local system and load data.
 */
function loadData() {

    //allow user to select file
    var selectedFile = document.getElementById('openButton');
    var fReader = new FileReader();
    fReader.readAsDataURL(selectedFile.files[0]);
    fReader.onloadend = function(event) {
        dataLoader(event.target.result)
    }

}

/**
 * Load formatted JSON data from local file system
 *
 * @param file {string} The path to the local file
 */
function dataLoader(file){
    d3.json(file, function(data) {


        dataRadius = data.eps;
        numPoints = data.k;
        numSamples = data.n;
        complexRadius = data.r;
        locationData = data.sensors;
        allEdges = data.allEdges;
        ripsEdges = data.ripsComplex[0];
        ripsFaces = data.ripsComplex[1];
        cechEdges = data.cechComplex[0];
        cechFaces = data.cechComplex[1];


        //set data scale

        var dataPadding = complexRadius+dataRadius;

        var xMin = d3.min(locationData.map( function (d) {
                return d.anchor.x;
            })) - dataPadding;
        var xMax = d3.max(locationData.map( function (d) {
                return d.anchor.x;
            })) + dataPadding;
        var yMin = d3.min(locationData.map( function (d) {
                return d.anchor.y;
            })) - dataPadding;
        var yMax = d3.max(locationData.map( function (d) {
                return d.anchor.y;
            })) + dataPadding;
        var yRange = yMax-yMin;


        var rmax = d3.max([complexRadius, Math.ceil(0.5*yRange)]);


        updateScales(xMin, xMax, yMin, yMax);

        complexCanvas.attr("transform", d3.zoomIdentity)
        newxScale = false;
        newyScale = false;
        newZscale = 1;

        gX.call(xAxis.scale(xScale));
        gY.call(yAxis.scale(yScale));
        renderGrid()

        //adjust radius slider
        d3.select('#complexInput')
            .attr('min', 1)
            .attr('max', rmax);
        d3.select('#complexRadius')
            .attr('min', 1)
            .attr('max', rmax);

      d3.select('#complexInput').node().value = complexRadius;
      d3.select('#complexRadius').node().value = complexRadius;
      d3.select('#numSensors').node().value = numSamples;
      d3.select('#numSampleSensors').node().value = numPoints;
      d3.select('#complexDataRadius').node().value = dataRadius;

        resetCheckboxes();

        addSampleSensors();

    })

}

/**
 * Allow user to change the number of sensors.
 */
function changeNumberSampleSensors(){
    var numSamplesSensors = parseInt(document.getElementById('numSampleSensors').value);
    if(numPoints != numSamplesSensors) {
        numPoints = +numSamplesSensors;
    }
    perturbData();
    addSampleSensors();
}

/**
 * Change the radius of uncertainty and update display. Also update coverage circles and update display.
 * @param val {number} The new radius of uncertainty.
 */
function changeDataRadius(val){
    dataRadius = parseInt(val);
    d3.select('#complexRadiusInput').node().value =  dataRadius;
    d3.select('#complexDataRadius').node().value = dataRadius;
    if(dataRadius < originalDataRadius) {
        perturbData();
        originalDataRadius = dataRadius;
        addSampleSensors();
    } else {
        d3.select('#complexDataCircle').selectAll('circle')
            .attr('r', xScale(dataRadius + complexRadius + xScale.domain()[0]));
        d3.select('#complexPoints').selectAll('.point')
            .attr('r', xScale(dataRadius + xScale.domain()[0]));

    }
}

/**
 * Add additional sensors to data.
 */
function addSampleSensors(){

    renderPoints();

    if (complexType=='Cech') {
        constructCech();
    } else if (complexType=='Rips') {
        constructRips();
    }
    changeComplex();
}

/**
 * Create random points for each data location. Points are uniform random within the radius of uncertainty from anchor.
 * @param d {Object} An object with the fields x and y containing the anchor location.
 * @returns {Array} An array of objects with the fields x and y containing the location of each random point.
 */
function createRandomPoints(d){
  var r, theta, xj, yj;
  var tmp = [];
  for (j=0; j<numPoints; j++) {
    r = math.random(dataRadius);
    theta = math.random(2*math.pi);
    xj = d.anchor.x + r * math.cos(theta);
    yj = d.anchor.y + r * math.sin(theta);
    tmp.push({x: xj, y: yj})
  }
  return tmp;
}

/**
 * Calls the createRandomPoints function on each anchor location in locationData.
 */
function perturbData() {
    if (arguments.length == 0) {
        locationData.forEach( function (d) {
            d.points = createRandomPoints(d);
        })
    } else {
        data = arguments[0]
        data.points = createRandomPoints(data);
    }
}

/**
 * Toggle between Vietoris-Rips and &#268;ech complexes.
 */
function changeComplex() {

    d = document.getElementsByName('complexType');
    if (d[0].checked) {
        complexType = 'Cech'
        renderComplex(cechEdges, cechFaces);
    } else {
        complexType = 'Rips'
        renderComplex(ripsEdges, ripsFaces);
    }
}

/**
 * Adds a node and generates random points around it. Creates an event listener for the plot area. If event is left-click,
 * add node. If event is "escape", cancel.
 *
 */
function addNode() {

    complexSVG.attr('cursor','crosshair')
        .on('click',function () {
            coords = d3.mouse(d3.select('#complexSVG').node());
            updateNode(coords);
        });

    window.addEventListener('keydown', function(event) {
        if (event.code=='Escape') {
            complexSVG.attr('cursor', null)
                .on('click', null);
        }
    });
}

/**
 * Update node location after drag and drop. Update anchor location and individual points.
 * @param coords {array} 2-element array with new node coordinates.
 */
function updateNode(coords) {

    if (locationData.length==0) {
        resetCheckboxes();
    };

    i = locationData.length;
    var x,y;
    if (newxScale && newyScale) {
        x = newxScale.invert(coords[0] - padding);
        y = newyScale.invert(coords[1] - padding);
    } else {
        x = xScale.invert(coords[0] - padding);
        y = yScale.invert(coords[1] - padding);
    };


    var newPoint = {anchor: {x: x, y: y}};
    newpoint = perturbData(newPoint)
    locationData.push(newPoint);
    numSamples++;
    renderPoints();
    updateComplex(document.getElementById('complexInput').value);
}

// function queryNode() {
//     complexSVG.attr('cursor','crosshair')
//         .on('click', function () {
//
//
//         })
// }
// function updateLocation(coords) {
//     locationData[selectedNode].anchor.x = coords[0];
//     locationData[selectedNode].anchor.y = coords[1];
//     updateCech(document.getElementById('complexInput').value);
//     window.addEventListener('keypress', function (evt) {
//         complexCanvas.attr('cursor',null)
//             .on('click',null);
//     });
// }
//
// function myMap() {
//     var mapCanvas = document.getElementById('map');
//     var mapOptions = {
//         center: new google.maps.LatLng(40.762,-111.839),
//         zoom: 16
//     };
//     var map = new google.maps.Map(mapCanvas, mapOptions);
// }

/**
 * Display or hide coverage circles.
 * @param d {Boolean} Show if true, hide if false.
 */
function showCoverage(d) {
    if (d) {
        fillColor = '#9370db';
        fillOpacity = '0.1';
        d3.select('#complexCircles').selectAll('circle')
            .transition()
            .style('visibility','visible')
            .style('fill', fillColor)
            .style('fill-opacity', 0.2);
        d3.select('#complexDataCircle').selectAll('circle')
            .transition()
            .style('visibility','visible')
            .style('fill', fillColor)
            .style('fill-opacity', 0.1);
    } else {
        d3.select('#complexCircles').selectAll('circle')
            .transition()
            .style('fill', 'none');
        d3.select('#complexDataCircle').selectAll('circle')
            .transition()
            .style('fill', 'none');
    }
}

/**
 * Toggle display
 * @param state {Boolean} Show if true, hide if false.
 * @param type {String} Which type of object to display: circle, line, or polygon
 */
function show(state, type) {
    if (state) {str='visible'} else {str='hidden'};
    complexCanvas.selectAll(type)
        .style('visibility', str);
}

/**
 * Drag a node location. Individual points, if displayed, will move along with anchor.
 */
function dragNode() {
    coords = d3.mouse(this)
    i = this.id.match(/\d+/g);
    str = '#complex_Circle_'+i;
    str2 = '#data_Circle_'+i;

    dx = locationData[i].anchor.x - coords[0];
    dy = locationData[i].anchor.y - coords[1];


    d3.selectAll(".small_circle").filter( function () {
        var re = new RegExp('complex_small_Point_'+i+'_\d*');
        return re.test(this.id)
    })
        .attr('cx', function(d) {
            return d.x - dx
        })
        .attr('cy', function(d) {
            return d.y - dy
        })


    d3.select(str)
        .attr('cx', coords[0])
        .attr('cy', coords[1]);
    d3.select(str2)
        .attr('cx', coords[0])
        .attr('cy', coords[1]);
    d3.select(this)
        .attr('cx', coords[0])
        .attr('cy', coords[1]);

    wasDragged = true;
}

/**
 * Called after a point is dragged. Updates locations and recomputes simplicial complex.
 */
function dragEnd() {
    if (wasDragged) {
        coords = d3.mouse(d3.select('#complexSVG').node());
        i = this.id.match(/\d+/g);
        var x,y;
        if (newxScale && newyScale) {
            x = newxScale.invert(coords[0] - padding);
            y = newyScale.invert(coords[1] - padding);
        } else {
            x = xScale.invert(coords[0] - padding);
            y = yScale.invert(coords[1] - padding);
        };


        dx = locationData[i].anchor.x - x;
        dy = locationData[i].anchor.y - y;

        locationData[i].anchor.x = x;
        locationData[i].anchor.y = y;

        locationData[i].points.forEach( function (d) {
            d.x = d.x - dx;
            d.y = d.y - dy;
        })

        renderPoints();
        updateComplex(document.getElementById('complexInput').value);
    }
    wasDragged = false;
    for (i=0; i<selectedNodes.length; i++) {
        highlightPoint([],selectedNodes[i])
    }
}

/**
 * Select and highlight a node for possible deletion.
 */
function selectNode() {
    if (d3.event.defaultPrevented) {
        return;
    }
    i = +this.id.match(/\d+/g);

    selectedNodes.push(i);
    highlightPoint([],i);

    d3.select('#complex_Point_'+i)
        .on('mouseover',null)
        .on('mouseout',null)
        .on('click',null);


    highlightPoint([],i);

    if (selectedNodes.length==1) {
        window.addEventListener('keydown', nodeSelector);
    }
}

/**
 * Delete selected nodes, recompute simplicial complexes and re-render or, if escape pressed, unselect points.
 */
function nodeSelector() {
    if (event.code=='Delete' || event.code=='Backspace') {
        window.removeEventListener('keydown', nodeSelector)
        selectedNodes = selectedNodes.sort(function(a, b){return a-b});
        for (j = 0; j < selectedNodes.length; j++) {
            locationData.splice(selectedNodes[j]-j, 1);
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

/**
 * Calculate squared euclidean distance between 2 data points.
 * @param pt1 {Array} 2-element array with coordinates of first data point.
 * @param pt2 {Array} 2-element array with coordinates of second data point.
 * @returns {number}
 */
function sqEuclidDist(pt1, pt2) {
    return Math.pow(pt2[0]-pt1[0],2) + Math.pow(pt2[1]-pt1[1],2);
}

/**
 * Clear canvas and reset all variables to their default values.
 */
function clearScreen() {
    complexCanvas.selectAll('.face').remove();
    complexCanvas.selectAll('.edge').remove();
    complexCanvas.selectAll('.circle').remove();
    complexCanvas.selectAll('.point').remove();
    locationData = [];
    selectedNodes = [];
    newZscale = 1;
    updateScales(0, 100, 0, 100);
    gX.call(xAxis.scale(xScale));
    gY.call(yAxis.scale(yScale));
    newxScale = false;
    newyScale = false;
    renderGrid();

    complexRadius = 5;
    numSamples = 0;

    d3.select('#complexInput')
        .attr('min', 1)
        .attr('max', 50);
    d3.select('#complexInput').node().value = complexRadius;
    d3.select('#complexRadius').node().value = complexRadius;
}

/**
 * Allows user to manually set maximum coverage radius.
 */
function setMax() {

    var rmax = d3.select('#complexInput').node().max.toString();
    var maxval = prompt('Enter maximum radius value',rmax)
    d3.select('#complexInput').attr('max', maxval);
    d3.select('#complexRadius').attr('max', maxval);
}