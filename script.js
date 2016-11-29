
var points = [];
var centroids = [];
var lastCentroids = [];
var relationLines = [];

areaX = 600;
areaY = 500;

svg = d3.select("#vis").append("svg")
					   .attr("width", areaX)
					   .attr("height", areaY)
											 .attr("class", "active")
					   .on("mousedown", createDot);

function createDot(){
	// Ignore the click event if it was suppressed
	if (d3.event.defaultPrevented) return;

	// Extract the click location\
	var point = d3.mouse(this)
	var p = {x: point[0], y: point[1], idp: window.points.length };

	window.points[window.points.length] = p;

	established = false;

	processControls()
	updateDots();
}

function updateDots(){
	var dots = svg.selectAll("circle.dot").data(window.points);
	dots.enter().append("circle");
	dots.attr("transform", function(d){return "translate("+d.x+","+d.y+")"})
	.attr("r", "3")
	.attr("class", "dot");
	dots.exit().remove();
}
function updateRelationLines(){
	var lines = svg.selectAll("line.relation").data(window.relationLines);
	lines.enter().append("line");
	lines.attr({
		x1: function(d){return d.x1},
		y1: function(d){return d.y1},
		x2: function(d){return d.x1},
		y2: function(d){return d.y1}
	})
	.transition()
	.duration(500)
	.attr({
		x2: function(d){return d.x2},
		y2: function(d){return d.y2}
	})
	.attr("class", "relation");
	lines.exit().remove();
}
function updateCentroids(){
	var cents = svg.selectAll("circle.centroid").data(window.centroids);
	cents.enter().append("circle");
	cents.transition().duration(500)
	.attr("transform", function(d){return "translate("+d.x+","+d.y+")"})
	.attr("r", "5")
	.attr("class", "centroid");
	cents.exit().remove();

	setTimeout(function(){
		updateRelationLines();
	}, 1000);
	
}

var hasStarted = false;
var established = false;

function stepAlgorithm(){
	if(!window.hasStarted){
		generateRandomCentroids();
		window.hasStarted = true;
		processControls();
		updateCentroids();
	} else {
		finished = kMeansLoop();
		processControls();	
	}
}


function resetAlgorithm(){
	window.hasStarted = false;
	window.points = [];
	window.centroids = [];
	window.lastCentroids = [];
	window.relationLines = [];
	d3.select("#clustersAmount").property("value","2");

	updateDots();
	updateCentroids();

	processControls();
}

function processControls(){
	if (window.hasStarted) {
			d3.select("#clustersAmount").attr("disabled","true");
	} else {
			d3.select("#clustersAmount").attr("disabled", null);
	}
	if (window.isPlaying) {
			d3.select("#stepBtn").attr("disabled","true");
			d3.select("#resetBtn").attr("disabled","true");
			d3.select("#playBtn").text("Pause");
	} else {
			d3.select("#stepBtn").attr("disabled", null);
			d3.select("#resetBtn").attr("disabled", null);
			d3.select("#playBtn").text("Play");
	}
  if (established) {
	d3.select("#established").attr("class", null);
	d3.select("#established").text("Established!");
  } else {
	d3.select("#established").attr("class", "not");
	d3.select("#established").text("Not Established!");
  }
}

function generateRandomCentroids(){
	window.centroids = [];
	amount = d3.select("#clustersAmount").property("value");
	for (var i = 0; i < amount; i++) {
		coordX = Math.floor(Math.random() * window.areaX);
		coordY = Math.floor(Math.random() * window.areaY);
		p = {x: coordX, y: coordY, idc: i, points:[] }
		window.centroids[i] = p;
	}
}


function kMeansLoop(){

	// Limpa a lista de pontos de cada centroide
	// Guarda os ultimos centroides antes de serem alterados, para calcular se houve dieferenca depois
	for (var i = 0; i < window.centroids.length; i++) {
		window.centroids[i].points = [];
		window.lastCentroids[i] = { x:window.centroids[i].x, y:window.centroids[i].y };
	}

	// Coloca os individuos no cluster mais proximo
	for (var i = 0; i < window.points.length; i++) {
		var closer = 0; var minDist = 99999;
		for (var c = 0; c < window.centroids.length; c++) {
			var distance = distanceBetween(window.points[i], window.centroids[c]);
			if (distance < minDist) {
				minDist = distance;
				closer = c;
			}
		}
		window.centroids[closer].points.push(window.points[i]);
	}

	// Calcula novos centroides.
	for (var c = 0; c < window.centroids.length; c++) {

		var amountOfIndividuals = window.centroids[c].points.length;
		if(amountOfIndividuals > 0){
			var sumX = 0;
			var sumY = 0;
			for (var i = 0; i < amountOfIndividuals; i++) {
				sumX += window.centroids[c].points[i].x;
				sumY += window.centroids[c].points[i].y;
			}
			window.centroids[c].x = sumX / amountOfIndividuals;
			window.centroids[c].y = sumY / amountOfIndividuals;
		}
	}


	// Calcula a distancia total entre os centroides novos e os antigos.
	var distance = 0;
	for (var c = 0; c < window.centroids.length; c++) {
		var between = distanceBetween(window.lastCentroids[c], window.centroids[c]);
		distance += between;
	}


	// Se for zero, os centroides estao no lugar certo e final.
	if (distance == 0) {
		window.established = true;
		return true;
	} else {
		window.established = false;
		window.relationLines = [];

		for (var c = 0; c < window.centroids.length; c++) {
			for (var i = 0; i < window.centroids[c].points.length; i++) {
				window.relationLines.push({
					x1 : window.centroids[c].x,
					y1 : window.centroids[c].y,
					x2 : window.centroids[c].points[i].x,
					y2 : window.centroids[c].points[i].y
				});
			}
		}

		updateCentroids();
			
		return false;
	}
}

function distanceBetween(point, another){
	return Math.sqrt(Math.pow(another.y - point.y,2) +
			Math.pow(another.x - point.x,2));
}
