o={ antialias: true, stencil: true };
gl=canvas.getContext("webgl", o)||canvas.getContext("experimental-webgl", o);
gl.clearColor(0.0, 0.0, 0.0, 1.0); 
gl.clearDepth(1.0);                
gl.enable(gl.DEPTH_TEST);           
gl.depthFunc(gl.LEQUAL); 
gl.bindBuffer(gl.ARRAY_BUFFER, b = gl.createBuffer());

