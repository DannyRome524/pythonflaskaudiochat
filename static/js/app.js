$(document).ready(function() {
  $(".messages").animate({ scrollTop: $(document).height() }, "fast");

  $("#profile-img").click(function() {
    $("#status-options").toggleClass("active");
  });

  $(".expand-button").click(function() {
    $("#profile").toggleClass("expanded");
    $("#contacts").toggleClass("expanded");
  });

  $("#status-options ul li").click(function() {
    $("#profile-img").removeClass();
    $("#status-online").removeClass("active");
    $("#status-away").removeClass("active");
    $("#status-busy").removeClass("active");
    $("#status-offline").removeClass("active");
    $(this).addClass("active");

    if ($("#status-online").hasClass("active")) {
      $("#profile-img").addClass("online");
    } else if ($("#status-away").hasClass("active")) {
      $("#profile-img").addClass("away");
    } else if ($("#status-busy").hasClass("active")) {
      $("#profile-img").addClass("busy");
    } else if ($("#status-offline").hasClass("active")) {
      $("#profile-img").addClass("offline");
    } else {
      $("#profile-img").removeClass();
    }

    $("#status-options").removeClass("active");
  });
  var docHeight = $(document).height();

  function newMessage() {
    message = $(".messagetext").val();
    if ($.trim(message) == "") {
      return false;
    }
    var messagetext = {
      message: $(".messagetext").val()
    };
    $(
      '<li class="sent"><img src="static/image/user_icon.png" alt="" /><p>' +
        message +
        "</p></li>"
    ).appendTo($(".messages ul"));
    $(".messagetext").val(null);
    $(".contact.active .preview").html("<span>You: </span>" + message);
    $(".messages").animate({ scrollTop: docHeight }, "fast");
    docHeight += 128;

    var xhr = new XMLHttpRequest();
    xhr.onload = function(e) {
      if (this.readyState === 4) {
        $(".messages ul").append(e.target.responseText);
      }
    };
    var data = new FormData();

    data.append("message", message);
    xhr.open("POST", "/get_response/", true);
    xhr.setRequestHeader(
      "content-type",
      "application/x-www-form-urlencoded;charset=UTF-8"
    );
    xhr.send("message=" + message);
  }

  $(".submit").click(function() {
    console.log("infinitive");
    newMessage();
  });

  $(window).on("keydown", function(e) {
    if (e.which == 13) {
      newMessage();
      return false;
    }
  });

  //webkitURL is deprecated but nevertheless
  URL = window.URL || window.webkitURL;

  $(".holdButton").css("display", "none");
  var isVoice = $(".holdButton").css("display");

  $("#recordButton").on("mousedown", handleHold);
  function handleHold() {
    if (isVoice == "block") {
      $(".messagetext").css("display", "block");
      $(".holdButton").css("display", "none");
      $("#recordButton").attr("src", "static/image/button.png");
      isVoice = "none";
    } else if (isVoice == "none") {
      $(".messagetext").css("display", "none");
      $(".holdButton").css("display", "block");
      $("#recordButton").attr("src", "static/image/button_blue.png");
      isVoice = "block";
    }
  }

  var gumStream; //stream from getUserMedia()
  var rec; //Recorder.js object
  var input; //MediaStreamAudioSourceNode we'll be recording

  // shim for AudioContext when it's not avb.
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var audioContext; //audio context to help us record

  $("#holdButton")
    .on("mousedown", function(e) {
      startRecording();
    })
    .on("mouseup", function() {
      stopRecording();
    });

  function startRecording() {
    console.log("recordButton clicked");

    /*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/

    var constraints = { audio: true, video: false };

    $("#holdButton").attr("value", "Release to send.");
    /*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function(stream) {
        console.log(
          "getUserMedia() success, stream created, initializing Recorder.js ..."
        );

        /*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
        audioContext = new AudioContext();
        /*  assign to gumStream for later use  */
        gumStream = stream;

        /* use the stream */
        input = audioContext.createMediaStreamSource(stream);

        /* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
        rec = new Recorder(input, { numChannels: 1 });

        //start the recording process
        rec.record();

        console.log("Recording started");
      })
      .catch(function(err) {});
  }

  function stopRecording() {
    console.log("stopButton clicked");

    $("#holdButton").attr("value", "Press hold to speak.");

    //tell the recorder to stop the recording
    rec.stop();

    //stop microphone access
    gumStream.getAudioTracks()[0].stop();

    //create the wav blob and pass it on to createDownloadLink
    rec.exportWAV(createDownloadLink);
  }

  function createDownloadLink(blob) {
    var url = URL.createObjectURL(blob);
    var au = document.createElement("audio");
    au.controlsList = "nodownload";

    var li = document.createElement("li");
    var link = document.createElement("a");

    //name of .mp3 file to use during upload and download (without extendion)
    var filename = new Date().toISOString();

    //add controls to the <audio> element
    au.controls = true;
    au.src = url;

    li.classList.add("sent");

    //add the new audio element to li
    var img = document.createElement("IMG");
    img.src = "static/image/user_icon.png";
    li.appendChild(img);

    li.appendChild(au);

    var xhr = new XMLHttpRequest();
    xhr.onload = function(e) {
      if (this.readyState === 4) {
        $(".messages ul").append(e.target.responseText);
        $(".messages").animate({ scrollTop: docHeight }, "fast");
        docHeight += 128;
      }
    };
    var fd = new FormData();
    fd.append("audio_data", blob, filename);
    xhr.open("POST", "/get_response/", true);
    xhr.send(fd);

    li.appendChild(document.createTextNode(" ")); //add a space in between

    //add the li element to the ol
    $(".messages ul").append(li);
  }
});
