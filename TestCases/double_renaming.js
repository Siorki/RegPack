a.fillRect(0,0,91,91);

setInterval( function () {	
	k = 2+2*Math.cos(3.1416*t/64);
	i=0;
	while(i<300) {
		a.strokeStyle = "hsl(20,0%,"+(k*x.charCodeAt(i+300)+(4-k)*x.charCodeAt(i++)-140)/4+"%)";
		a.lineWidth=0|(k*x.charCodeAt(i+300)+(4-k)*x.charCodeAt(i++)-140);
		a.beginPath();
		a.moveTo(k*x.charCodeAt(i+300)+(4-k)*x.charCodeAt(i++)-140,
				 k*x.charCodeAt(i+300)+(4-k)*x.charCodeAt(i++)-140);
		a.lineTo(k*x.charCodeAt(i+300)+(4-k)*x.charCodeAt(i++)-140,
				 k*x.charCodeAt(i+300)+(4-k)*x.charCodeAt(i++)-140);
		a.stroke();
	}
	w=w?--w:(++t&63)?w:64;	
		
}, 40);