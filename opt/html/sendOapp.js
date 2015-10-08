/**
 * Created by siegenth on 9/23/15.
 */
// fork getUserMedia for multiple browser versions, for those
// that need prefixes

navigator.getUserMedia = (navigator.getUserMedia ||
navigator.webkitGetUserMedia ||
navigator.mozGetUserMedia ||
navigator.msGetUserMedia);

// set up forked web audio context, for multiple browsers
// window. is needed otherwise Safari explodes

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var source;
var stream;

// grab the transmit button to use below

var transmit = document.querySelector('.transmit');

//set up the different audio nodes we will use for the app

var analyser = audioCtx.createAnalyser();
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.85;

var distortion = audioCtx.createWaveShaper();
var gainNode = audioCtx.createGain();
var biquadFilter = audioCtx.createBiquadFilter();
var convolver = audioCtx.createConvolver();

// how to send data.....
        function SndWebSocket() {
            var sndMsg;
            if ("WebSocket" in window) {

		sndMsg = document.getElementById('sndMsg');
                //alert("WebSocket is supported by your Browser!");
                // Let us open a web socket
                var wsSoc = "ws://" + document.getElementById("outWSsnd").value.trim();
                wsSnd = new WebSocket(wsSoc)
                wsSnd.onopen = function () {
                    // Web Socket is connected, send data using send()
                    wsSnd.send("<CONTROL>ID "+ document.getElementById("formID").value  + " STARTING</CONTROL>");
		    sndMsg.innerHTML = "Transmitting on port : " + portIDSnd;
                    //alert("Message is sent...");
                };
                wsSnd.onmessage = function (evt) {
                    var received_msg = evt.data;
                    sndMsg.innerHTML = "Alert:<b>" + received_msg + "</b>";
                };
                wsSnd.onclose = function () {
                    alert("Connection is closed...");
                    sndMsg.innerHTML = "Connection closed....";
                    wsSnd = null;
                };
                // setInterval(buildMessage, 100);
            }
            else {
                // The browser doesn't support WebSocket
                alert("WebSocket NOT supported by your Browser!");
            }
        }

var soundSource, concertHallBuffer;
var canvas = document.querySelector('.visualizer');
var canvasCtx = canvas.getContext("2d");
var intendedWidth = document.querySelector('.wrapper').clientWidth;

canvas.setAttribute('width',intendedWidth);

var visualSelect = document.getElementById("visual");


var drawVisual;

//main block for doing the audio recording

if (navigator.getUserMedia) {
    console.log('getUserMedia supported.');
    navigator.getUserMedia (
        // constraints - only audio needed for this app
        {
            audio: true
        },
        // Success callback
        function(stream) {
            source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            visualize();
            //voiceChange();
        },

        // Error callback
        function(err) {
            console.log('The following gUM error occured: ' + err);
        }
    );
} else {
    console.log('getUserMedia not supported on your browser!');
}
var wsSnd = null;
function visualize() {
        function sendMessage(audioBuffer) {
            var actDate = new Date();
            var currentTimeValue = actDate.getTime();
            currentTime.innerHTML = currentTimeValue;
            currentTransmit.innerHTML = audioBuffer;
			var expandAudio = "";
			for (var i = 0; i != audioBuffer.length; i++) { 
				expandAudio +=  audioBuffer[i] +  ",";
			}	    
            msg =   "{\"I\":"  + "\"" + document.getElementById("formID").value  + "\"," + 
                    "\"T\":" + currentTimeValue + "," +
	            "\"A\":[" + expandAudio +  "]}";
            if (wsSnd != null) {
	            // $('#transmitting').text(msg);
                wsSnd.send(msg)
            }
        }
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
    var visualSetting = visualSelect.value;
    console.log(visualSetting);

    if(visualSetting != "off") {
        analyser.fftSize = 256;
        var bufferLength = analyser.frequencyBinCount;
        console.log(bufferLength);

        var dataArray = new Uint8Array(bufferLength);

        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        function draw() {
            drawVisual = requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);

            canvasCtx.fillStyle = 'rgb(0, 0, 0)';
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            var barWidth = (WIDTH / bufferLength) * 2.5;
            var barHeight;
            var x = 0;
	    if (wsSnd != null) {
	      sendMessage(dataArray);
	    }
            for(var i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];

                canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
                canvasCtx.fillRect(x,HEIGHT-barHeight/2,barWidth,barHeight/2);

                x += barWidth + 1;
            }
        };

        draw();

    } else {
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        canvasCtx.fillStyle = "red";
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    }

}

transmit.onclick = voiceTransmit;

function voiceTransmit() {
  if (wsSnd == null) {
    SndWebSocket();
        transmitid = "activated";
        transmit.innerHTML = "Stop Transitting";
  } else {
    wsSnd = null;
        transmit.id = "";
        transmit.innerHTML = "Start Transmitting";
  }
}