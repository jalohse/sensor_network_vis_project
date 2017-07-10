/*
 * Created by Tim on 11/10/2016.
 */
<!-- Common variables and functions used by all of the example plots -->
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
var a_edges = 0;

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


var yellowRedScale = ["#ffffb2", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026"];
var yellowBlueScale = ["#ffffcc", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#0c2c84"];
var bluePurpleScale = ["#edf8fb", "#bfd3e6", "#9ebcda", "#8c96c6", "#8c6bb1", "#88419d", "#6e016b"];
var redScale = ["#fef0d9", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#990000"];
var greenScale = ["#edf8fb", "#ccece6", "#99d8c9", "#66c2a4", "#41ae76", "#238b45", "#005824"];

var redEdgeScale = ["#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#990000"];
var blueGreenEdgeScale = ["#a6bddb", "#67a9cf", "#3690c0", "#02818a", "#016450"];
var pinkPurpleEdgeScale = ["#feebe2", "#fcc5c0", "#fa9fb5", "#f768a1", "#dd3497"];
var greenBlueEdgeScale = ["#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#0c2c84"];
var pinkEdgeScale = ["#c994c7", "#df65b0", "#e7298a", "#ce1256", "#91003f"];


var faceYellowBlueScale = d3.scaleOrdinal().range(yellowBlueScale).domain([0.01, 0.17, 0.34, .51, .68, .85, 1]);
var faceYellowRedScale = d3.scaleOrdinal().range(yellowRedScale).domain([0.01, 0.17, 0.34, .51, .68, .85, 1]);
var faceBluePurpleScale = d3.scaleOrdinal().range(bluePurpleScale).domain([0.01, 0.17, 0.34, .51, .68, .85, 1]);
var faceRedScale = d3.scaleOrdinal().range(redScale).domain([0.01, 0.17, 0.34, .51, .68, .85, 1]);
var faceGreenScale = d3.scaleOrdinal().range(greenScale).domain([0.01, 0.17, 0.34, .51, .68, .85, 1]);


var faceColorScale = faceYellowBlueScale;


var edgeRedScale = d3.scaleOrdinal().range(redEdgeScale).domain([0.01, 0.25, 0.5, 0.75, 1]);
var edgeBlueGreenScale = d3.scaleOrdinal().range(blueGreenEdgeScale).domain([0.01, 0.25, 0.5, 0.75, 1]);
var edgePinkPurpleScale = d3.scaleOrdinal().range(pinkPurpleEdgeScale).domain([0.01, 0.25, 0.5, 0.75, 1]);
var edgeGreenBlueScale = d3.scaleOrdinal().range(greenBlueEdgeScale).domain([0.01, 0.25, 0.5, 0.75, 1]);
var edgePinkScale = d3.scaleOrdinal().range(pinkEdgeScale).domain([0.01, 0.25, 0.5, 0.75, 1]);

var edgeColorScale = edgeRedScale;

var edgeWidthScale = d3.scaleLinear().range([6, 6]).domain([0.01, 1]);

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

createLegends();

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

function createLegends() {
    createFaceLengend();
    createEdgeLegend();
}

function createEdgeLegend() {
    var edgeLegend = d3.select('#edge_legend');
    edgeLegend.append("g")
        .attr("class", "legendSizeLine")
        .attr("transform", "translate(0, 20)");

    var legendSizeLine = d3.legendSize()
        .scale(edgeWidthScale)
        .shape("line")
        .orient("horizontal").labels(["0.01",
            "0.25", "0.50", "0.75", "1.00"])
        .labelWrap(30)
        .shapeWidth(40)
        .labelAlign("start")
        .shapePadding(10);

    edgeLegend.select(".legendSizeLine")
        .call(legendSizeLine);

    var lines = edgeLegend.selectAll("line");
    lines.attr('stroke', function (d, i) {
        if (i == 0) {
            return edgeColorScale(0.01);
        }
        if (i == 1) {
            return edgeColorScale(0.25);
        }
        if (i == 2) {
            return edgeColorScale(0.5);
        }
        if (i == 3) {
            return edgeColorScale(0.75);
        }
        if (i == 4) {
            return edgeColorScale(1);
        }
    });
}

function createFaceLengend() {
    var legend = d3.select("#face_legend");

    var legendAxis = d3.legendColor()
        .shapeWidth(50)
        .orient("horizontal")
        .scale(faceColorScale);

    legend.select(".legendSequential").call(legendAxis);
}

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
    renderEdges();
    renderAllEdges();
    renderFaces();
    renderView();
    createFaceLengend();
    createEdgeLegend();
}


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

//this function is called whenever the data are changed.

function updateComplex(newValue) {

    complexSVG.attr('cursor', 'wait')

    //update coverage radius and recompute complexes
    newValue = +newValue;

    //determine if radius has increased or decreased
    var radiusChange = 0;
    if (newValue > complexRadius) {
        radiusChange = 1;
    } else if (newValue < complexRadius) {
        radiusChange = -1;
    }

    //update slider value and/or text value
    complexRadius = newValue;
    d3.select('#complexRadius').node().value =  complexRadius;
    d3.select('#complexInput').node().value = complexRadius;


    //recompute complexes
    var t = Date.now();


    if (radiusChange == 1) {
        constructRips(radiusChange)
    } else {
        constructRips();
    }

    var t2 = Date.now() - t;
    console.log('compute: ' + t2);


    //adjust inner and outer coverage disks
    var innerRadius = xScale(complexRadius - dataRadius + xScale.domain()[0]);
    var outerRadius = xScale(complexRadius + dataRadius + xScale.domain()[0]);
    d3.select('#complexCircles').selectAll('circle').attr('r', innerRadius);
    d3.select('#complexDataCircle').selectAll('circle').attr('r', outerRadius);
    changeComplex();
    var t3 = Date.now() - t - t2;
    console.log('render: ' + t3)

    complexSVG.attr('cursor', null)
}

//graphical highlighting
function highlightPoint() {

    var pt = (arguments.length == 3) ? arguments[1] : arguments[0]


    d3.select('#complex_Point_' + pt)
        .transition()
        .style('fill', '#c33');

    if (document.getElementById('coverCheckbox').checked) {

        //highlight the corresponding coverage circle
        d3.select('#complex_Circle_' + pt)
            .transition()
            .style('fill', '#c33')
            .style('fill-opacity', 0.25);

        d3.select('#complex_Circle_' + pt).moveToFront();

        d3.select('#data_Circle_' + pt)
            .transition()
            .style('fill', '#c33')
            .style('fill-opacity', 0.1);

        d3.select('#data_Circle_' + pt).moveToFront();
    }

}

function resetPoint() {

    var pt = ( arguments.length == 3) ? arguments[1] : arguments[0];


    d3.select('#complex_Point_' + pt)
        .transition()
        .style('fill', '#9370db');

    if (document.getElementById('coverCheckbox').checked) {
        d3.select('#complex_Circle_' + pt)
            .transition()
            .style('fill', '#9370db')
            .style('fill-opacity', 0.25);
        d3.select('#data_Circle_' + pt)
            .transition()
            .style('fill', '#9370db')
            .style('fill-opacity', 0.1);
    }


}

function showToolTip(type, data){
    tooltip.transition()
        .style("opacity", 0.9);
    tooltip.html(type + " probability of " + data.toFixed(3))
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
}

function hideToolTip(){
    tooltip.transition()
        .style("opacity", 0);
}

//highlight edge and corresponding points
function highlightEdge() {

    var data = arguments[0];

    if(this.className != "individual_edge" && data.hasOwnProperty("Pedge")){
        showToolTip('Edge', data.Pedge);
    }


    if (arguments.length == 3) {
        d3.select(this)
            .transition()
            .style('stroke','#c33');
        highlightPoint(data.Pt1);
        highlightPoint(data.Pt2);
    } else {
        d3.select(arguments[0])
            .transition()
            .style('stroke','#c33');
    }


}

//restore default view
function resetEdge() {
    hideToolTip();
    var data;

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

//highlight faces
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
function resetFace() {
    hideToolTip();

    if ( arguments.length > 1) {
        d3.select(this)
            .transition()
            .style('fill', faceColorScale(arguments[0].Pface));

        resetEdge('#complex_Edge_' + arguments[0].Pt1 + '_' + arguments[0].Pt2);
        resetEdge('#complex_Edge_' + arguments[0].Pt1 + '_' + arguments[0].Pt3);
        resetEdge('#complex_Edge_' + arguments[0].Pt2 + '_' + arguments[0].Pt3);

        resetPoint(arguments[0].Pt1);
        resetPoint(arguments[0].Pt2);
        resetPoint(arguments[0].Pt3);
    } else {
        faces = complexType == 'Cech' ? cechFaces : ripsFaces;
        d3.select('#complex_Face_'+faces[arguments[0]].Pt1+'_'+faces[arguments[0]].Pt2+'_'+faces[arguments[0]].Pt3)
            .transition()
            .style('fill', faceColorScale(faces[arguments[0]].Pface));

        faces.forEach( function (d) {
            d3.select('#complex_Face_'+d.Pt1+'_'+d.Pt2+'_'+d.Pt3)
                .moveToFront()
        })
    }

}


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

function renderEdges(){
    var edges;
    if (complexType=='Cech') {
        edges = cechEdges;
    } else if (complexType=='Vietoris-Rips') {
        edges = ripsEdges;
    }
    complexCanvas.selectAll('.edge').remove();
    var complexEdges = complexCanvas.select('g#complexEdges');
    complexEdges.selectAll('line').data(edges)
        .enter().append('line')
        .attr('class', 'edge')
        .style('stroke-width', function(d){
            return edgeWidthScale(d.Pedge)/newZscale;
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

function renderFaces(){
    var faces;
    if (complexType=='Cech') {
        faces = cechFaces;
    } else if (complexType=='Vietoris-Rips') {
        faces = ripsFaces;
    }
    faces.sort( function (a, b) { return a.Pface - b.Pface } )

    complexCanvas.selectAll('.face').remove();
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
            return 'complex_Face_'+d.Pt1+'_'+d.Pt2+'_'+d.Pt3;
        })
        .attr('fill', function (d) {
            return faceColorScale(d.Pface);
        })
        .on('mouseover',highlightFace)
        .on('mouseout', resetFace);
}

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
                .attr('id', function (d, i) {5
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
    // r = xScale(dataRadius + xScale.domain()[0])+5;
    // textOffset = -r * Math.cos( 3*Math.PI/4 );
    //
    // complexPoints.selectAll('text')
    //     .data(locationData)
    //     .enter().append('text')
    //     .text( function (d, i) {
    //         return i.toString();
    //     })
    //     .attr('x', function (d) {
    //         return xScale(d.anchor.x) + padding/newZscale;
    //     })
    //     .attr('y', function (d) {
    //         return yScale(d.anchor.y) + padding/newZscale;
    //     })
    //     .attr('dx',textOffset)
    //     .attr('dy',textOffset);

    renderView()

}

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

function updateScales(xMin, xMax, yMin, yMax){
    var aspectMin = Math.min(width, height);
    var aspect, yScaleMax, xScaleMax;


    if(aspectMin == height){
        aspect = width / height;
        yScaleMax = yMax;
        xScaleMax = yScaleMax * aspect;
        xScale.domain([xMin, xScaleMax]);
        yScale.domain([yMin, yScaleMax]);

    } else {
        aspect = height / width;
        xScaleMax = xMax;
        yScaleMax = xScaleMax * aspect;
        xScale.domain([xMin, xScaleMax]);
        yScale.domain([yMin, yScaleMax]);
    }

}


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
    a_edges = 0;
    // console.log(a_edges)

    for (i=0; i<numSamples; i++) {
        var xi = Math.random() * (xmax - xmin + 1)  + xmin;
        var yi = Math.random() * (ymax - ymin + 1)  + ymin;
        locationData.push({ anchor: {x: xi, y: yi}});
    };

    perturbData();

    // dataRange = d3.max([xd[1]-xd[0], yd[1]-yd[0]]);
    // dataPadding = 0.1*dataRange;
    //
    // d3.select('#complexInput')
    //     .attr('min', 0.05*dataRange)
    //     .attr('max', 0.5*dataRange)
    //     .attr('value', 0.2*dataRange);

    resetCheckboxes();

    renderPoints();
    updateComplex(document.getElementById('complexInput').value);
}

function saveData() {

    var data = {
        n: numSamples, k: numPoints, r: complexRadius, eps: dataRadius, sensors: locationData,
        allEdges: allEdges, cechComplex: [cechEdges, cechFaces], ripsComplex: [ripsEdges, ripsFaces],
        edgeProb: a_edges.edgeProb.toJSON(), edgeAnchorDist: a_edges.edgeAnchorDist.toJSON(),
        edgeFlag: a_edges.edgeFlag.toJSON(), edgeDist: a_edges.edgeDist.toJSON(),
        edgeInd: a_edges.edgeInd.toJSON()
    };

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


function loadData() {

    //allow user to select file
    var selectedFile = document.getElementById('openButton');
    var fReader = new FileReader();
    fReader.readAsDataURL(selectedFile.files[0]);
    fReader.onloadend = function(event) {
        dataLoader(event.target.result)
    }

}

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

        a_edges = {edgeProb: JSON.parse(JSON.stringify(data.edgeProb),math.json.reviver),
            edgeAnchorDist: JSON.parse(JSON.stringify(data.edgeAnchorDist),math.json.reviver),
            edgeFlag: JSON.parse(JSON.stringify(data.edgeFlag),math.json.reviver),
            edgeDist: JSON.parse(JSON.stringify(data.edgeDist),math.json.reviver),
            edgeInd: JSON.parse(JSON.stringify(data.edgeInd),math.json.reviver)};

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
        //console.log(complexRadius)
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

        d3.select('#complexRadius').node().value =  complexRadius;
        d3.select('#complexInput').node().value = complexRadius;

        resetCheckboxes();

        addSampleSensors();

    })

}

function changeNumberSampleSensors(){
    var numSamplesSensors = parseInt(document.getElementById('numSampleSensors').value);
    if(numPoints != numSamplesSensors) {
        numPoints = +numSamplesSensors;
    }
    perturbData();
    addSampleSensors();
}

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

function addSampleSensors(){

    renderPoints();

    // if (complexType=='Cech') {
    //     constructCech();
    // } else if (complexType=='Vietoris-Rips') {
    //     constructRips();
    // }
    changeComplex();
}

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

function updateNode(coords) {
    console.log("update radius:"+complexRadius)

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

function queryNode() {
    complexSVG.attr('cursor','crosshair')
        .on('click', function () {


        })
}

// function updateLocation(coords) {
//     locationData[selectedNode].anchor.x = coords[0];
//     locationData[selectedNode].anchor.y = coords[1];
//     updateCech(document.getElementById('complexInput').value);
//     window.addEventListener('keypress', function (evt) {
//         complexCanvas.attr('cursor',null)
//             .on('click',null);
//     });
// }

function myMap() {
    var mapCanvas = document.getElementById('map');
    var mapOptions = {
        center: new google.maps.LatLng(40.762,-111.839),
        zoom: 16
    };
    var map = new google.maps.Map(mapCanvas, mapOptions);
}

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

function show(state, type) {
    if (state) {str='visible'} else {str='hidden'};
    complexCanvas.selectAll(type)
        .style('visibility', str);
}

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

function nodeSelector() {
    if (event.code=='Delete' || event.code=='Backspace') {
        console.log(event.code)
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

function sqEuclidDist(pt1, pt2) {
    return Math.pow(pt2[0]-pt1[0],2) + Math.pow(pt2[1]-pt1[1],2);
}

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

    complexRadius = 10;
    numSamples = 0;
    dataRadius = 5

    d3.select('#complexInput')
        .attr('min', 1)
        .attr('max', 50);
    d3.select('#complexInput').node().value = complexRadius;
    d3.select('#complexRadius').node().value = complexRadius;
}

function setMax() {

    var rmax = d3.select('#complexInput').node().max.toString();
    var maxval = prompt('Enter maximum radius value',rmax)
    d3.select('#complexInput').attr('max', maxval);
    d3.select('#complexRadius').attr('max', maxval);
}