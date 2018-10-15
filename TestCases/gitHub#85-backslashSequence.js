var s="\\";
s=s+s;
var z=s;
var s="abcdefghijklmnopqrstuvwxyz";
var k=s+z;
var w=k+"aab\\xyz";
var d=[];
for (var i=0; i<10; ++i) { d.push(i); d.push(i+"\\"); }