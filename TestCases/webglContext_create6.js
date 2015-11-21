gl=canvas.getContext("webgl", { antialias: true, stencil: true })||canvas.getContext("experimental-webgl", { antialias: true, stencil: true });
gl.clearColor(0.0, 0.0, 0.0, 1.0); 
gl.clearDepth(1.0);                
gl.enable(gl.DEPTH_TEST);           
gl.depthFunc(gl.LEQUAL); 
gl.bindBuffer(gl.ARRAY_BUFFER, b = gl.createBuffer());

