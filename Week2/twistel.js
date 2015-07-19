"use strict";

// based on "gasket" examples by Edward Angel
// http://www.cs.unm.edu/~angel/COURSERA/CODE/EXAMPLES/

var canvas;
var gl;

var points = [];

var numTimesToSubdivide = 0;
var angle = 0.0;
var angleLoc;

var color = [ 0.0, 1.0, 0.5, 1.0 ];
var colorLoc;

var bufferId;
var bufferSize;

var drawFilled = false;

function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

	angleLoc = gl.getUniformLocation(program, "angle");
	colorLoc = gl.getUniformLocation(program, "color");

    // Load the data into the GPU

    bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    // number of triangles is 4^level
    // for lines, need 6 points per triangle = 12 floats
    //		(however, we always remove one of the 4 triangles, so it's really 8
    // for triangle, need 3 points per triangle = 6 floats
    // pick max (8) and convert to bytes
    bufferSize = 4 * 12 * Math.pow(4, 8);
    gl.bufferData( gl.ARRAY_BUFFER, bufferSize, gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    document.getElementById("depth").oninput = function(event) {
        numTimesToSubdivide = parseInt(event.target.value);
        render();
    };
    document.getElementById("angle").oninput = function(event) {
        var degrees = parseInt(event.target.value);
        angle = 3.14159 * degrees / 180.0;
        render();
    };
    document.getElementById("filled").onchange = function(event) {
    	drawFilled = document.getElementById("filled").checked;
        render();
    };

	numTimesToSubdivide = parseInt(document.getElementById("depth").value);
	var degrees = parseInt(document.getElementById("angle").value);
	angle = 3.14159 * degrees / 180.0;
	drawFilled = document.getElementById("filled").checked;
    render();
};

function triangle( a, b, c )
{
	if (drawFilled) {
	    points.push( a, b, c );
	}
	else {
		points.push(a, b, b, c, c, a);
	}
}

function divideTriangle( a, b, c, count, suppress )
{

    // check for end of recursion

    if ( count == 0 ) {
    	if (!suppress)
	        triangle( a, b, c );
    }
    else {

        //bisect the sides

        var ab = mix( a, b, 0.5 );
        var ac = mix( a, c, 0.5 );
        var bc = mix( b, c, 0.5 );

        --count;

        // three new triangles

		if (drawFilled) {
			divideTriangle( a, ab, ac, count );
			divideTriangle( c, ac, bc, count );
			divideTriangle( b, bc, ab, count );
			divideTriangle( ab, bc, ac, count );
        }
        else {
			divideTriangle( a, ab, ac, count, false );
			divideTriangle( c, ac, bc, count, false );
			divideTriangle( b, bc, ab, count, false );
			divideTriangle( ab, bc, ac, count, true );	// avoid overdraw
        }
    }
}

window.onload = init;

function render()
{
    var vertices = [
        vec2(-Math.sqrt(3) / 2.2, -.45),
        vec2(0,  0.9),
        vec2(Math.sqrt(3) / 2.2, -.45)
    ];
    points = [];
    divideTriangle( vertices[0], vertices[1], vertices[2],
                    numTimesToSubdivide);

    gl.uniform1f(angleLoc, angle);
    gl.uniform4fv(colorLoc, color);
    
    var flat = flatten(points);
//     console.log("buffer size = " + bufferSize + ", num points = " + points.length + ", data = " + flat.length);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flat);
    gl.clear( gl.COLOR_BUFFER_BIT );
    if (drawFilled)
	    gl.drawArrays( gl.TRIANGLES, 0, points.length );
	else
		gl.drawArrays( gl.LINES, 0, points.length );
    points = [];
}
