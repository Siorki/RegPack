var stdContext=null, webkitContext=null;
if (typeof webkitAudioContext !== "undefined") {
	webkitContext = new webkitAudioContext()
}
if (typeof AudioContext !== "undefined") {
	stdContext = new AudioContext()
}
stdContext.createBuffer(1, 22050, 22050);
stdContext.createGain();
webkitContext.createChannelMerger(2);
var c=15;
var d=7;
