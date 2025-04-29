// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_PointSize;
  uniform mat4 u_ModelMatrix;   
  uniform mat4 u_GlobalRotateMatrix;

  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;  // 
    gl_PointSize = u_PointSize;
  }
`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float; 
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  } `
let canvas;
let gl;
let a_Position;
let u_FragColor;
let g_selectedSize = 10.0;           // current selected size
                   // array to hold size per point
let u_PointSize; 
let shapesList = [];
let g_shapeType = "point";
let g_segmentCount = 20;
let gAnimalGlobalRotation = 0;  // degrees
let u_GlobalRotateMatrix;
let g_drawScene = true; 
let g_upperArmAngle = 0;   // degrees
let g_lowerArmAngle = 0;   // degrees
let g_thighAngle = 0; // Thigh rotation (hip)
let g_calfAngle = 0;  // Calf rotation (knee)
let g_footAngle = 0;  // Foot rotation (ankle)
let g_time = 0;
let g_startTime = performance.now() / 1000.0;
let g_seconds = 0;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_yellowAnimation = false;
let g_magentaAnimation = false;
let g_legAngle = 0;
let g_legAnimation = false;
let gAnimalGlobalRotationX = 0;
let gAnimalGlobalRotationY = 0;
let g_lastX = 0;
let g_lastY = 0;
let g_dragging = false;
let g_frameCount = 0;
let g_fps = 0;
let g_lastFpsTime = performance.now();

let g_waveAnimation = false;
let g_waveAngle = 0;
let g_pokeAnimation = false;
let g_pokeTime = 0;
let g_pokeRotation = 0;

function syncSlidersToColor() {
    document.getElementById("redSlider").value = g_selectedColor[0] * 100;
    document.getElementById("greenSlider").value = g_selectedColor[1] * 100;
    document.getElementById("blueSlider").value = g_selectedColor[2] * 100;
  }
function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST); 
}



function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_PointSize
  u_PointSize = gl.getUniformLocation(gl.program, 'u_PointSize');
  if (!u_PointSize && u_PointSize !== 0) {
    console.log('Failed to get the storage location of u_PointSize');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
if (!u_GlobalRotateMatrix) {
  console.log('Failed to get the storage location of u_GlobalRotateMatrix');
  return;
}
}




let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; // default to white

function addingAllActions() {
  document.getElementById("white").onclick = function() {
    g_selectedColor = [1.0, 1.0, 1.0, 1.0]; // white
  }
  // Update red component
document.getElementById("redSlider").addEventListener("mouseup", function() {
    g_selectedColor[0] = this.value / 100;
  });
  
  // Update green component
  document.getElementById("greenSlider").addEventListener("mouseup", function() {
    g_selectedColor[1] = this.value / 100;
  });
  
  // Update blue component
  document.getElementById("blueSlider").addEventListener("mouseup", function() {
    g_selectedColor[2] = this.value / 100;
  });
  
  document.getElementById("sizeSlider").addEventListener("input", function() {
    g_selectedSize = this.value;
  });

  document.getElementById("clear").onclick = function() {
    shapesList = [];
    g_drawScene = false; 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
  };

  document.getElementById("pointMode").onclick = function () {
    g_shapeType = "point";
  };
  
  document.getElementById("triangleMode").onclick = function () {
    g_shapeType = "triangle";
  };
  document.getElementById("circleMode").onclick = function () {
    g_shapeType = "circle";
  };
  document.getElementById("cubeMode").onclick = function() {
    g_shapeType = "cube";
  };
  
  document.getElementById("segmentSlider").addEventListener("input", function () {
    g_segmentCount = parseInt(this.value);
  });

  document.getElementById("angleSlider").addEventListener("input", function() {
    gAnimalGlobalRotation = this.value;
    renderScene(); 
  });
  document.getElementById("upperArmSlider").addEventListener("input", function() {
    g_upperArmAngle = this.value;
    renderScene();
  });
  
  document.getElementById("lowerArmSlider").addEventListener("input", function() {
    g_lowerArmAngle = this.value;
    renderScene();
  });
  document.getElementById("thighSlider").addEventListener("input", function() {
    g_thighAngle = this.value;
    renderScene();
});

document.getElementById("calfSlider").addEventListener("input", function() {
    g_calfAngle = this.value;
    renderScene();
});

document.getElementById("footSlider").addEventListener("input", function() {
    g_footAngle = this.value;
    renderScene();
});
document.getElementById("yellowOn").onclick = function() {
  g_yellowAnimation = true;
};

document.getElementById("yellowOff").onclick = function() {
  g_yellowAnimation = false;
};
document.getElementById("legOn").onclick = function() {
  g_legAnimation = true;
};
document.getElementById("legOff").onclick = function() {
  g_legAnimation = false;
};
document.getElementById("waveOn").onclick = function() {
  g_waveAnimation = true;
};
document.getElementById("waveOff").onclick = function() {
  g_waveAnimation = false;
};

}


function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addingAllActions();
  syncSlidersToColor();
  renderScene();

  // Mouse click handlers
  canvas.onmousedown = function(ev) {
    g_lastX = ev.clientX;
    g_lastY = ev.clientY;
    g_dragging = true;
  
    if (ev.shiftKey) {
      g_pokeAnimation = true;
      g_pokeTime = 0;
    }
  };
  
  canvas.onmouseup = function(ev) {
    g_dragging = false;
  };
  
  canvas.onmousemove = function(ev) {
    if (g_dragging) {
      let dx = ev.clientX - g_lastX;
      let dy = ev.clientY - g_lastY;
      gAnimalGlobalRotationX += dy * 0.5;  // y-drag rotates x-axis
      gAnimalGlobalRotationY += dx * 0.5;  // x-drag rotates y-axis
      g_lastX = ev.clientX;
      g_lastY = ev.clientY;
      renderScene();
    }
  };

  // Black background color
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Start animation
  g_startTime = performance.now() / 1000.0;
  requestAnimationFrame(tick);
}


function updateAnimationAngles() {
  if (g_pokeAnimation) {
    g_pokeRotation = 360 * Math.sin(g_pokeTime * (Math.PI / 4)); 
    g_yellowAngle = 20 * Math.sin(g_pokeTime * 2); 
    g_legAngle = 0;
    g_waveAngle = 0;
  } else {
    if (g_yellowAnimation) {
      g_yellowAngle = 45 * Math.sin(g_seconds); 
    }
    if (g_legAnimation) {
      g_legAngle = 20 * Math.sin(g_seconds * 2); 
    }
    if (g_waveAnimation) {
      g_waveAngle = 40 * Math.sin(g_seconds * 3) - 120;
    }
  }
}


function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;

  if (g_pokeAnimation) {
    g_pokeTime += 0.05; 
    if (g_pokeTime > 2) { 
      g_pokeAnimation = false;
      g_pokeTime = 0;
    }
  }

  updateAnimationAngles();
  renderScene();

  
  g_frameCount++;
  let now = performance.now();
  if (now - g_lastFpsTime >= 1000) { 
    g_fps = g_frameCount;
    g_frameCount = 0;
    g_lastFpsTime = now;
    document.getElementById('fpsCounter').innerText = "FPS: " + g_fps;
  }

  requestAnimationFrame(tick); 
}
class Sphere {
  constructor() {
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.segments = 20; 
  }

  render() {
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    
    let step = 360 / this.segments;
    for (let lat = -90; lat < 90; lat += step) {
      for (let lon = 0; lon < 360; lon += step) {
        let v1 = this.getVertex(lat, lon);
        let v2 = this.getVertex(lat + step, lon);
        let v3 = this.getVertex(lat, lon + step);
        let v4 = this.getVertex(lat + step, lon + step);

        drawTriangle3D(v1, v2, v3);
        drawTriangle3D(v2, v3, v4);
      }
    }
  }

  getVertex(lat, lon) {
    let radLat = (Math.PI * lat) / 180;
    let radLon = (Math.PI * lon) / 180;
    let x = Math.cos(radLat) * Math.cos(radLon);
    let y = Math.sin(radLat);
    let z = Math.cos(radLat) * Math.sin(radLon);
    return [x, y, z];
  }
}



function convertCoordinates (ev) {
  var x = ev.clientX; 
  var y = ev.clientY; 
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

return([x,y])
}

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let globalRotMat = new Matrix4();
  globalRotMat.rotate(gAnimalGlobalRotationX, 1, 0, 0);
  globalRotMat.rotate(gAnimalGlobalRotationY, 0, 1, 0);
  globalRotMat.rotate(gAnimalGlobalRotation, 0, 1, 0);

 
  if (g_pokeAnimation) {
    globalRotMat.rotate(g_pokeRotation, 1, 0, 0); 
  }

  
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

let body = new Cube();
body.color = [0.961, 0.145, 0.196, 1.0];
body.matrix.translate(-0.125, 0, 0.0); 
body.matrix.scale(0.3, 0.45, 0.3);        
body.render();

// --- Head ---
let head = new Cube();
head.color = [1.0, 0.855, 0.631, 1.0]; 
head.matrix.translate(-0.12, 0.4, 0.0);
head.matrix.rotate(g_yellowAngle, 0, 1, 0);
head.matrix.scale(0.3, 0.3, 0.3);
head.render();

// --- Nose ---
let nose = new Sphere();
nose.color = [0.0, 0.0, 0.0, 1.0];  
nose.matrix.set(head.matrix);      
nose.matrix.translate(0, -0.15, 0.5); 
nose.matrix.scale(0.1, 0.1, 0.1);      
nose.render();

// --- Left Eye ---
let leftEye = new Cube();
leftEye.color = [0.0, 0.0, 0.0, 1.0]; 
leftEye.matrix.set(head.matrix);      
leftEye.matrix.translate(-0.15, 0.1, 0.5);  
leftEye.matrix.scale(0.08, 0.2, 0.08);     
leftEye.render();

// --- Right Eye ---
let rightEye = new Cube();
rightEye.color = [0.0, 0.0, 0.0, 1.0];
rightEye.matrix.set(head.matrix);      
rightEye.matrix.translate(0.15, 0.1, 0.5);  
rightEye.matrix.scale(0.08, 0.2, 0.08);
rightEye.render();

// --- Left Ear ---
let leftEar = new Cube();
leftEar.color = [1.0, 0.855, 0.631, 1.0]; 
leftEar.matrix.set(head.matrix); 
leftEar.matrix.translate(-0.6, 0.7, 0.0); 
leftEar.matrix.scale(0.3, 0.3, 0.3);
leftEar.render();

// --- Right Ear ---
let rightEar = new Cube();
rightEar.color = [1.0, 0.855, 0.631, 1.0]; 
rightEar.matrix.set(head.matrix); 
rightEar.matrix.translate(0.6, 0.7, 0.0);   
rightEar.matrix.scale(0.3, 0.3, 0.3);
rightEar.render();
  // --- Left Upper Arm ---
  let leftUpperArm = new Cube();
  leftUpperArm.color = [0.961, 0.145, 0.196, 1.0];
  leftUpperArm.matrix.setTranslate(-0.35, 0.25, 0.0);  
  leftUpperArm.matrix.rotate(g_waveAnimation ? g_waveAngle : g_upperArmAngle, 0, 0, 1);
  leftUpperArm.matrix.translate(0, -0.25, 0.0);
  leftUpperArm.matrix.scale(0.1, 0.5, 0.1);
  leftUpperArm.render();

  // --- Left Lower Arm ---
  let leftLowerArm = new Cube();
  leftLowerArm.color = [1.0, 0.855, 0.631, 1.0];
  leftLowerArm.matrix.set(leftUpperArm.matrix);
  leftLowerArm.matrix.translate(0, -0.5, 0.0);
  leftLowerArm.matrix.rotate(g_lowerArmAngle, 0, 0, 1);
  leftLowerArm.matrix.translate(0, -0.25, 0.0);
  leftLowerArm.matrix.scale(1, .5, 1);
  leftLowerArm.render();

  // --- Right Upper Arm ---
  let rightUpperArm = new Cube();
  rightUpperArm.color = [0.961, 0.145, 0.196, 1.0];
  rightUpperArm.matrix.setTranslate(0.2, 0.25, 0.0);   
  rightUpperArm.matrix.rotate(-g_upperArmAngle, 0, 0, 1);  
  rightUpperArm.matrix.translate(-.10, -0.25, 0.0);
  rightUpperArm.matrix.scale(0.1, 0.5, 0.1);
  rightUpperArm.render();

  // --- Right Lower Arm ---
  let rightLowerArm = new Cube();
  rightLowerArm.color = [1.0, 0.855, 0.631, 1.0];
  rightLowerArm.matrix.set(rightUpperArm.matrix);
  rightLowerArm.matrix.translate(0, -0.5, 0.0);
  rightLowerArm.matrix.rotate(-g_lowerArmAngle, 0, 0, 1);  
  rightLowerArm.matrix.translate(0, -0.25, 0.0);
  rightLowerArm.matrix.scale(1, .5, 1);
  rightLowerArm.render();

// --- Left Thigh ---
let thigh = new Cube();
thigh.color = [1.0, 0.855, 0.631, 1.0];
thigh.matrix.setTranslate(-0.25, -0.3, 0.0);


if (g_legAnimation) {
  thigh.matrix.rotate(g_legAngle, 1, 0, 0);
} else {
  thigh.matrix.rotate(g_thighAngle, 1, 0, 0);
}
thigh.matrix.scale(0.1, 0.25, 0.1);
thigh.render();

// --- Left Calf ---
let calf = new Cube();
calf.color = [1.0, 0.855, 0.631, 1.0];
calf.matrix.set(thigh.matrix);
calf.matrix.translate(0, -1.0, 0.0);


if (g_legAnimation) {
  calf.matrix.rotate(g_legAngle / 2, 1, 0, 0);
} else {
  calf.matrix.rotate(g_calfAngle, 1, 0, 0);
}

calf.matrix.scale(1, 1.2, 1);
calf.render();

// --- Left Foot ---
let foot = new Cube();
foot.color = [1.0, 0.855, 0.631, 1.0];
foot.matrix.set(calf.matrix);
foot.matrix.translate(0, -1.2, 0.0);


if (g_legAnimation) {
  foot.matrix.rotate(g_legAngle / 4, 1, 0, 0);
} else {
  foot.matrix.rotate(g_footAngle, 1, 0, 0);
}

foot.matrix.translate(0, 0.55, 0.0);
foot.matrix.scale(1.5, 0.2, 2.0);
foot.render();

// --- Right Thigh ---
let rightThigh = new Cube();
rightThigh.color = [1.0, 0.855, 0.631, 1.0];
rightThigh.matrix.setTranslate(0.00, -0.3, 0.0);


if (g_legAnimation) {
  rightThigh.matrix.rotate(-g_legAngle, 1, 0, 0);
} else {
  rightThigh.matrix.rotate(-g_thighAngle, 1, 0, 0);
}

rightThigh.matrix.scale(0.1, 0.25, 0.1);
rightThigh.render();

// --- Right Calf ---
let rightCalf = new Cube();
rightCalf.color = [1.0, 0.855, 0.631, 1.0];
rightCalf.matrix.set(rightThigh.matrix);
rightCalf.matrix.translate(0, -1.0, 0.0);


if (g_legAnimation) {
  rightCalf.matrix.rotate(-g_legAngle / 2, 1, 0, 0); 
} else {
  rightCalf.matrix.rotate(-g_calfAngle, 1, 0, 0);
}

rightCalf.matrix.scale(1, 1.2, 1);
rightCalf.render();

// --- Right Foot ---
let rightFoot = new Cube();
rightFoot.color = [1.0, 0.855, 0.631, 1.0];
rightFoot.matrix.set(rightCalf.matrix);
rightFoot.matrix.translate(0, -1.0, 0.0);


if (g_legAnimation) {
  rightFoot.matrix.rotate(-g_legAngle / 4, 1, 0, 0);
} else {
  rightFoot.matrix.rotate(-g_footAngle, 1, 0, 0);
}

rightFoot.matrix.translate(0, 0.35, 0.15);
rightFoot.matrix.scale(1.5, 0.2, 2.0);
rightFoot.render();


}




function click(ev) {
    let [x, y] = convertCoordinates(ev);
  
    if (g_shapeType === "point") {
      let newPoint = new Point([x, y], g_selectedColor.slice(), parseFloat(g_selectedSize));
      shapesList.push(newPoint);
    } else if (g_shapeType === "triangle") {
    let size = parseFloat(g_selectedSize) / 300;

      let vertices = [
        x, y + size,
        x - size, y - size,
        x + size, y - size
      ];
      let newTriangle = new Triangle(vertices, g_selectedColor.slice());
      shapesList.push(newTriangle);
    } else if (g_shapeType === "circle") {
        let radius = parseFloat(g_selectedSize) / 300; 
        let newCircle = new Circle([x, y], radius, g_selectedColor.slice(), g_segmentCount);
        shapesList.push(newCircle);
      }
      else if (g_shapeType === "cube") {
        let newCube = new Cube(); 
        shapesList.push(newCube);
      }
      
      console.log('clicked', g_shapeType, shapesList.length);
    renderScene()
  }
  class Cube {
    constructor() {
      this.color = [1.0, 1.0, 1.0, 1.0]; 
      this.matrix = new Matrix4();
    }
  
    render() {
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
      drawCube(this.color);
    }
  }
  
  
  function drawCube(color = [1, 1, 1, 1]) {
    const s = 0.5;
  
    let baseR = color[0];
    let baseG = color[1];
    let baseB = color[2];
    let baseA = color[3];
  
    // Front face (normal color)
    gl.uniform4f(u_FragColor, baseR, baseG, baseB, baseA);
    drawTriangle3D([-s, -s,  s], [ s, -s,  s], [-s,  s,  s]);
    drawTriangle3D([-s,  s,  s], [ s, -s,  s], [ s,  s,  s]);
  
    // Back face (slightly darker)
    let shade = 0.9;
    gl.uniform4f(u_FragColor, baseR * shade, baseG * shade, baseB * shade, baseA);
    drawTriangle3D([-s, -s, -s], [-s,  s, -s], [ s, -s, -s]);
    drawTriangle3D([ s, -s, -s], [-s,  s, -s], [ s,  s, -s]);
  
    // Top face (lighter)
    shade = 1.1;
    gl.uniform4f(u_FragColor, Math.min(baseR * shade,1.0), Math.min(baseG * shade,1.0), Math.min(baseB * shade,1.0), baseA);
    drawTriangle3D([-s,  s, -s], [-s,  s,  s], [ s,  s, -s]);
    drawTriangle3D([ s,  s, -s], [-s,  s,  s], [ s,  s,  s]);
  
    // Bottom face (darker)
    shade = 0.7;
    gl.uniform4f(u_FragColor, baseR * shade, baseG * shade, baseB * shade, baseA);
    drawTriangle3D([-s, -s, -s], [ s, -s, -s], [-s, -s,  s]);
    drawTriangle3D([-s, -s,  s], [ s, -s, -s], [ s, -s,  s]);
  
    // Right face (medium dark)
    shade = 0.85;
    gl.uniform4f(u_FragColor, baseR * shade, baseG * shade, baseB * shade, baseA);
    drawTriangle3D([ s, -s, -s], [ s,  s, -s], [ s, -s,  s]);
    drawTriangle3D([ s, -s,  s], [ s,  s, -s], [ s,  s,  s]);
  
    // Left face (medium dark)
    shade = 0.85;
    gl.uniform4f(u_FragColor, baseR * shade, baseG * shade, baseB * shade, baseA);
    drawTriangle3D([-s, -s, -s], [-s, -s,  s], [-s,  s, -s]);
    drawTriangle3D([-s, -s,  s], [-s,  s,  s], [-s,  s, -s]);
  }
  
  
  
  
  
  function drawTriangle3D(v1, v2, v3) {
    let vertices = new Float32Array([...v1, ...v2, ...v3]);
  
    let vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
  
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }



class Point {
    constructor(position, color, size) {
      this.position = position; // [x, y]
      this.color = color;       // [r, g, b, a]
      this.size = size;         // float
    }
  
    render() {
        
        gl.disableVertexAttribArray(a_Position);
      
        
        gl.vertexAttrib3f(a_Position, this.position[0], this.position[1], 0.0);
      
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        gl.uniform1f(u_PointSize, this.size);
        gl.drawArrays(gl.POINTS, 0, 1);
      }
      
  }
  class Triangle {
    constructor(vertices, color) {
      this.vertices = vertices;
      this.color = color;
  
     
      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    }
  
    render() {
        
        let vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
      
        
        gl.enableVertexAttribArray(a_Position);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
      
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
      
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      
        
        gl.disableVertexAttribArray(a_Position);
      }      
  }
  class Circle {
    constructor(center, radius, color, segments) {
      this.center = center;
      this.radius = radius;
      this.color = color;
      this.segments = segments;
      this.vertices = this.computeVertices();
    }
  
    computeVertices() {
      let [cx, cy] = this.center;
      let verts = [cx, cy]; // center vertex (once)
  
      for (let i = 0; i <= this.segments; i++) {
        let angle = (i * 2 * Math.PI) / this.segments;
        let x = cx + this.radius * Math.cos(angle);
        let y = cy + this.radius * Math.sin(angle);
        verts.push(x, y);
      }
  
      return new Float32Array(verts);
    }
  
    render() {
      let buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
  
      gl.enableVertexAttribArray(a_Position);
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
  
    
      gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vertices.length / 2);
  
      gl.disableVertexAttribArray(a_Position);
    }
  }
  
