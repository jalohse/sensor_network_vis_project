/**
 * Created by tsodergren on 6/5/17.
 */


function constructEdges() {


    var radiusChange = arguments.length ? arguments[0] : 0;

    //squared coverage diameter and annulus of uncertainty
    var sqDiameter = 4 * Math.pow(complexRadius, 2);
    var sqDiameterMin = 4 * Math.pow(complexRadius-dataRadius, 2);
    var sqDiameterMax = 4 * Math.pow(complexRadius+dataRadius, 2);


    if (!a_edges) {
        var x=math.zeros(numSamples, numSamples,'sparse');
        a_edges = {edgeProb: x.clone(), edgeAnchorDist: x.clone(), edgeDist: x.clone(), edgeFlag: x.clone(),
            edgeInd: x.clone() };
    }

    var iEdgeDist, iEdgeFlag, tempEdges;

    if ( radiusChange==1 ) {
        tempEdges = JSON.parse(JSON.stringify(ripsEdges));
    } else {
        tempEdges = [];
        allEdges = []; // separate out all individual edges for easier rendering
    }

    var x1, y1, x2, y2, x1_i, y1_i, x2_i, y2_i, d12, p, e12_i;

    //recursively compare every node against every other node
    for (i = 0; i < numSamples - 1; i++) {
        x1 = locationData[i].anchor.x;
        y1 = locationData[i].anchor.y;
        for (j = i + 1; j < numSamples; j++) {

            if (radiusChange==1 && a_edges.edgeProb.subset(math.index(i,j))==1) {
                //edge prob already 1 so skip this pair if radius increased
                continue
            }

            edgeInd = a_edges.edgeInd.subset(math.index(i,j));
            newEdgeInd = !edgeInd ? tempEdges.length+1 : edgeInd;

            // check if anchor to anchor distance has already been computed and compute if necessary
            d12 = a_edges.edgeAnchorDist.subset(math.index(i,j));
            if (!d12) {
                x2 = locationData[j].anchor.x;
                y2 = locationData[j].anchor.y;
                d12 = sqEuclidDist([x1, y1], [x2, y2]);
                a_edges.edgeAnchorDist.subset(math.index(i, j), d12);
            }

            //if radius has increased, extract edge flags
            tmp = a_edges.edgeFlag.subset(math.index(i, j));
            if ( radiusChange==1 && tmp!=0) {
                iEdgeFlag = a_edges.edgeFlag.subset(math.index(i, j)).iEdgeFlag;
            } else {
                iEdgeFlag = math.zeros(numPoints,numPoints).valueOf(); //reset individual edge flags
            }


            // check for existence of individual edge distances and initialize if necessary
            e12_i = false;
            if (!a_edges.edgeDist.subset(math.index(i,j))) {
                iEdgeDist = math.zeros(numPoints,numPoints).valueOf();
            } else {
                iEdgeDist = a_edges.edgeDist.subset(math.index(i,j)).iEdgeDist;
            }

            // now start comparing distances to coverage radii
            if (d12 > sqDiameterMax){
                //node pair outside coverage radius + uncertainty, do nothing
                continue
            } else  if (d12 <= sqDiameterMin) {
                //node pair inside coverage radius - uncertainty, coverage guaranteed, prob=1
                p = 1;


                for (m=0; m<numPoints; m++) {
                    x1_i = locationData[i].points[m].x;
                    y1_i = locationData[i].points[m].y;
                    for (n=0; n<numPoints; n++) {
                        if ( !radiusChange || (radiusChange==1 && !iEdgeFlag[m][n]) ) {
                            x2_i = locationData[j].points[n].x;
                            y2_i = locationData[j].points[n].y;
                            allEdges.push( { x1: x1_i, y1: y1_i, x2: x2_i, y2: y2_i, d: iEdgeDist[m][n],
                                ind: [i, j, m, n, newEdgeInd] } )
                        }
                    }
                }
                iEdgeFlag = math.ones(numPoints, numPoints).valueOf();

            } else {
                //node pair within uncertainty range, need to evaluate all possible node pairs

                for (m=0; m<numPoints; m++) {
                    x1_i = locationData[i].points[m].x;
                    y1_i = locationData[i].points[m].y;
                    for (n=0; n<numPoints; n++) {

                        if ( !radiusChange || (radiusChange==1 && !iEdgeFlag[m][n]) ) {
                            x2_i = locationData[j].points[n].x;
                            y2_i = locationData[j].points[n].y;
                            if (!iEdgeDist[m][n]) {
                                iEdgeDist[m][n] = sqEuclidDist([x1_i, y1_i], [x2_i, y2_i]);
                                e12_i = true;
                            }
                            if (iEdgeDist[m][n] <= sqDiameter) {
                                iEdgeFlag[m][n] = 1;
                                allEdges.push( { x1: x1_i, y1: y1_i, x2: x2_i, y2: y2_i, d: iEdgeDist[m][n],
                                    ind: [i, j, m, n, newEdgeInd] } )
                            }
                        }
                    }
                }
                p =  math.sum(iEdgeFlag) / (numPoints*numPoints);
            }

            if ( p > 0 ) {
                // if edge already exists just update probability
                if ( edgeInd && radiusChange==1 ) {
                    tempEdges[edgeInd-1].Pedge = p;
                } else {
                    tempEdges.push({Pt1: i, Pt2: j, Pedge: p})
                    a_edges.edgeInd.subset(math.index(i, j), newEdgeInd);
                }
            }

            //update edge prob, distance, and flag matrices
            a_edges.edgeProb.subset(math.index(i,j), p)
            if ( !a_edges.edgeFlag.subset(math.index(i,j)) ) {
                a_edges.edgeFlag.subset(math.index(i,j), {iEdgeFlag})
            } else {
                a_edges.edgeFlag.subset(math.index(i, j)).iEdgeFlag = iEdgeFlag;
            }
            if (e12_i) {
                if ( !a_edges.edgeDist.subset(math.index(i,j)) ) {
                    a_edges.edgeDist.subset(math.index(i,j), {iEdgeDist})
                } else {
                    a_edges.edgeDist.subset(math.index(i, j)).iEdgeDist = iEdgeDist;
                }
            }
        }
    }



    // sort allEdges (just a reminder that this may be helpful later)
    // console.log(tempEdges)

    return tempEdges

}

function intersection(a, b, c) {

    let d = new Set([...a].filter(x => b.has(x)));
    if (!d.length) {
        return d
    } else {
        let e = new Set([...d]).filter(x => c.has(x));
        return e
    }

}


function constructRips() {

    var radiusChange = arguments.length ? arguments[0] : 0;
    // console.log(radiusChange)

    ripsEdges = JSON.parse(JSON.stringify(constructEdges(radiusChange)));

    var tempFaces = [];
    ripsFaces = [];

    var p12, p23, p13, p, e12, e23, e13, f12, f13, f23, count, faceFlag, ind, face;


    //recursively check every possible permutation of n choose 3 nodes
    for (i=0; i<numSamples-2; i++) {
        for (j=i+1; j<numSamples-1; j++) {
            p12 = a_edges.edgeProb.subset(math.index(i,j));
            if (p12) {

                for (k=j+1; k<numSamples; k++) {

                    if (radiusChange==1) {
                    }
                    p13 = a_edges.edgeProb.subset(math.index(i,k));
                    if (p13) {


                        p23 = a_edges.edgeProb.subset(math.index(j, k));
                        if (p23) {


                            count = 0;
                            faceFlag = [];

                            if ( p12==1 && p23==1 && p13==1 ){
                                // all pEdges=1 so pFace=1, no iteration needed
                                p = 1;
                                // if 2 edges have pEdge=1 then pFace will be equal to prob of remaining edge
                            } else if ( p12==1 && p23==1) {
                                p = p13;
                                // type = '2 edges'
                            } else if ( p12==1 && p13==1 ) {
                                p = p23;
                                // type = '2 edges'
                            } else if ( p23==1 && p13==1 ) {
                                p = p12;
                                // type = '2 edges'
                            } else {
                                // edge probs <1 so must iterate through all permutations
                                e12 = a_edges.edgeFlag.subset(math.index(i,j)).iEdgeFlag;
                                e13 = a_edges.edgeFlag.subset(math.index(i,k)).iEdgeFlag;
                                e23 = a_edges.edgeFlag.subset(math.index(j,k)).iEdgeFlag;
                                for (ii=0; ii<numPoints; ii++) {
                                    for (jj=0; jj<numPoints; jj++) {
                                        for (kk=0; kk<numPoints; kk++) {
                                            if ( e12[ii][jj] && e13[ii][kk] && e23[jj][kk]) {
                                                faceFlag.push([ii, jj, kk])
                                                count++
                                            }
                                        }
                                    }
                                }
                                p = count/Math.pow(numPoints,3);
                                // type = 'computed'
                            }

                            // if prob is >0 add a new face and proceed to next iteration
                            if (p) {
                                tempFaces.push({Pt1: i, Pt2: j, Pt3: k, Pface: p, iFaceFlag: faceFlag.slice()})
                            }

                        }
                    }
                }


            }
        }
    }


    var mapped = tempFaces.map( function (d,i) {
        return { index: i, value: d.Pface }
    })

    mapped.sort( function(a, b) {
        return +(a.value > b.value) || +(a.value === b.value) - 1;
    })

    ripsFaces = mapped.map( function (d, i) {
        return tempFaces[d.index]
    })

    constructCech()

}


//construct the Cech complex
function constructCech() {


    cechEdges = JSON.parse(JSON.stringify(ripsEdges));
    cechFaces = [];
    var newFaces = [];
    var tempFaces = JSON.parse(JSON.stringify(ripsFaces))
    var iEdgeDist_12, iEdgeDist_23, iEdgeDist_13;

    var sqDist;
    //calculate the squared diameter to compare each pair to. Use square diameter to compare to squared euclidean distance
    //of each pair so save computation.
    sqDiameter = 4 * Math.pow(complexRadius, 2);

    var e12, e13, e23;

    tempFaces.forEach( function(d) {

        e12 = e13 = e23 = false;

        //extract individual edge distance matrices
        //if they don't exist, initialize a distance array of zeros

        if ( !a_edges.edgeDist.subset(math.index(d.Pt1, d.Pt2)) ) {
            iEdgeDist = math.zeros(numPoints, numPoints).valueOf();
            a_edges.edgeDist.subset(math.index(d.Pt1, d.Pt2), {iEdgeDist})
        }
        iEdgeDist_12 = a_edges.edgeDist.subset(math.index(d.Pt1, d.Pt2)).iEdgeDist;

        if ( !a_edges.edgeDist.subset(math.index(d.Pt1,d.Pt3)) ) {
            iEdgeDist = math.zeros(numPoints,numPoints).valueOf();
            a_edges.edgeDist.subset(math.index(d.Pt1, d.Pt3), {iEdgeDist})
        }
        iEdgeDist_13 = a_edges.edgeDist.subset(math.index(d.Pt1,d.Pt3)).iEdgeDist;

        if ( !a_edges.edgeDist.subset(math.index(d.Pt2,d.Pt3)) ) {
            iEdgeDist_23 = math.zeros(numPoints,numPoints).valueOf();
        } else {
            iEdgeDist_23 = a_edges.edgeDist.subset(math.index(d.Pt2,d.Pt3)).iEdgeDist;
        }

        count = 0;

        if (d.iFaceFlag.length) {
            d.iFaceFlag.forEach( function (ifaces) {

                tmp = testCech(d.Pt1, d.Pt2, d.Pt3, ifaces[0], ifaces[1], ifaces[2],
                    iEdgeDist_12, iEdgeDist_13, iEdgeDist_23);
                if (tmp.test) {count++}
                e12 = tmp.e12 ? tmp.e12 : e12;
                e13 = tmp.e13 ? tmp.e13 : e13;
                e23 = tmp.e23 ? tmp.e23 : e23;

            })
        } else {
            for (i=0; i<numPoints; i++) {
                for (j=0; j<numPoints; j++) {
                    for (k=0; k<numPoints; k++) {
                        //iterate through all triples
                        tmp = testCech(d.Pt1, d.Pt2, d.Pt3, i, j, k,
                        iEdgeDist_12, iEdgeDist_13, iEdgeDist_23);
                        if (tmp.test) {count++};
                        e12 = tmp.e12 ? tmp.e12 : e12;
                        e13 = tmp.e13 ? tmp.e13 : e13;
                        e23 = tmp.e23 ? tmp.e23 : e23;
                    }
                }
            }
        }

        if (e12) {
            if (!a_edges.edgeDist.subset(math.index(d.Pt1, d.Pt2))) {
                a_edges.edgeDist.subset( math.index(d.Pt1, d.Pt2), {iEdgeDist: iEdgeDist_12} )
            } else {
                a_edges.edgeDist.subset(math.index(d.Pt1, d.Pt2)).iEdgeDist = iEdgeDist_12;
            }
        }
        if (e13) {
            if (!a_edges.edgeDist.subset(math.index(d.Pt1, d.Pt3))) {
                a_edges.edgeDist.subset( math.index(d.Pt1, d.Pt3), {iEdgeDist: iEdgeDist_13} )
            } else {
                a_edges.edgeDist.subset(math.index(d.Pt1, d.Pt3)).iEdgeDist = iEdgeDist_13;
            }
        }
        if (e23) {
            if (!a_edges.edgeDist.subset(math.index(d.Pt2, d.Pt3))) {
                a_edges.edgeDist.subset( math.index(d.Pt2, d.Pt3), {iEdgeDist: iEdgeDist_23} )
            } else {
                a_edges.edgeDist.subset(math.index(d.Pt2, d.Pt3)).iEdgeDist = iEdgeDist_23;
            }
        }


        p = count/Math.pow(numPoints,3);
        if (p) {
            d.Pface = p;
            newFaces.push(d);
        }
    })

    var mapped = tempFaces.map( function (d,i) {
        return { index: i, value: d.Pface }
    })

    mapped.sort( function(a, b) {
        return +(a.value > b.value) || +(a.value === b.value) - 1;
    })

    cechFaces = mapped.map( function (d, i) {
        return tempFaces[d.index]
    })


}

function testCech(pt1, pt2, pt3, i, j, k, iEdgeDist_12, iEdgeDist_13, iEdgeDist_23) {

    //the individual points for comparison
    var x1 = locationData[pt1].points[i].x,
        y1 = locationData[pt1].points[i].y,
        x2 = locationData[pt2].points[j].x,
        y2 = locationData[pt2].points[j].y,
        x3 = locationData[pt3].points[k].x,
        y3 = locationData[pt3].points[k].y,

        //a flag to determine if new distances have been computed
        e12 = false, e13 = false, e23 = false,

        //variables used for computation
        a, b, c, xc, yc, dist, testRadius, test;


    //extract individual distances
    //if they don't exist, calculate and store

    if (!iEdgeDist_12[i][j]) {
        iEdgeDist_12[i][j] = sqEuclidDist([x1, y1], [x2, y2]);
        e12 = true;
    }
    a = Math.sqrt(iEdgeDist_12[i][j]);

    if (!iEdgeDist_13[i][k]) {
        iEdgeDist_13[i][k] = sqEuclidDist([x1, y1], [x3, y3]);
        e13 = true;
    }
    b = Math.sqrt(iEdgeDist_13[i][k]);

    if (!iEdgeDist_23[j][k]) {
        iEdgeDist_23[j][k] = sqEuclidDist([x2, y2], [x3, y3]);
        e23 = true;
    }
    c = Math.sqrt(iEdgeDist_23[j][k]);

    //determine longest edge
    if (a >= b && a >= c) {
        xc = (x2 + x1) / 2;
        yc = (y2 + y1) / 2;
        dist = Math.sqrt(sqEuclidDist([x3, y3], [xc, yc]));
        testRadius = a / 2;
    } else if (b >= a && b >= c) {
        xc = (x3 + x1) / 2;
        yc = (y3 + y1) / 2;
        dist = Math.sqrt(sqEuclidDist([x2, y2], [xc, yc]));
        testRadius = b / 2;
    } else {
        xc = (x3 + x2) / 2;
        yc = (y3 + y2) / 2;
        dist = Math.sqrt(sqEuclidDist([x1, y1], [xc, yc]));
        testRadius = c / 2;
    }

    if ( dist > testRadius) {
        // check if third point falls within circumcircle of longest edge
        //otherwise determine if circumcircle radius is smaller than the coverage radius
        testRadius = (a * b * c) / Math.sqrt((a + b + c) * (b + c - a) * (a + c - b) * (a + b - c));
    }

    test = testRadius <= complexRadius ? true : false

    return {test: test, e12: e12, e13: e13, e23: e23};

}

function updateRips() {

    //squared coverage diameter and annulus of uncertainty
    var sqDiameter = 4 * Math.pow(complexRadius, 2);
    var sqDiameterMin = 4 * Math.pow(complexRadius-dataRadius, 2);
    var sqDiameterMax = 4 * Math.pow(complexRadius+dataRadius, 2);

    a_edges.edgeProb.forEach( function (d, index) {
        if (d<1) {
            if (d) {
                console.log(a_edges.edgeInd.subset(math.index(index[0], index[1])))
            }
        } else if (d==1) {
            console.log(a_edges.edgeInd.subset(math.index(index[0], index[1])))
        }
    })


}