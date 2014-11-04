// Namespacing
new function(){

	var ns = this;
	
	ns.lsname = "cades.videoblacklist";

	ns.getStub = function(vidObj){
		return {
			videoid:vidObj.videoid,
			videotype:vidObj.videotype
		}
	}
	
	ns.scan = function(){
		// Scan playlist
		var elem = PLAYLIST.first;
		do{
			elem = elem.next;
			if(!ns.isOk(ns.getStub(elem))){
				$(elem.domobj).addClass("blacklisted");
			} else {
				$(elem.domobj).removeClass("blacklisted");
			}
		}while(elem != PLAYLIST.first)
	}
	
	ns.load = function(){
		// Load Blacklist
		try{
			ns.videoBlacklist = JSON.parse(localStorage.getItem(ns.lsname));
			if(!ns.videoBlacklist) throw "Bad Cache";
		} catch(e){
			ns.videoBlacklist = [];
		}
		ns.scan();
	}
	
	ns.save = function(){
	
		// Clear Dupes
		var hashtable = {};
		var finalsave = [];
		for(var i in ns.videoBlacklist){
			if(!ns.videoBlacklist[i]) continue;
			var k = JSON.stringify(ns.videoBlacklist[i]);
			hashtable[k] = ns.videoBlacklist[i];		
		}
		for(var i in hashtable){
			finalsave.push(hashtable[i]);	
		}
		
		// Save Blacklist
		localStorage.setItem(ns.lsname,JSON.stringify(finalsave));
	}
	
	ns.isOk = function(vidObj){
		for(var i in ns.videoBlacklist){
			if(!ns.videoBlacklist[i]) continue;
			var a = JSON.stringify(ns.videoBlacklist[i]);
			var b = JSON.stringify(ns.getStub(vidObj));
			if(a == b) return false;	
		}
		return true;
	}
	
	ns.blacklistVideo = function(vidObj){
		ns.videoBlacklist.push(vidObj);
		ns.save();
	}
	
	ns.unBlacklistVideo = function(vidObj){
		for(var i in ns.videoBlacklist){
			if(!ns.videoBlacklist[i]) continue;
			var a = JSON.stringify(ns.videoBlacklist[i]);
			var b = JSON.stringify(ns.getStub(vidObj));
			if(a == b) ns.videoBlacklist.splice(i,1);	
		}
		ns.save();
	}
	
	ns.videoLoadAtTime = function(vidObj, time){
		console.log("Private videoLoadAtTime",vidObj);
			
		if(!ns.isOk(vidObj)){
			var clone = $.extend({},vidObj);
			clone.videotype = "blacklist";
			console.log("This video is blacklisted");
			ns._videoLoadAtTime(clone, time);
			return;
		}
		
		ns._videoLoadAtTime(vidObj, time);
	}
	
	ns.addVideo = function addVideo(data, queue, sanityid){
		ns._addVideo(data, queue, sanityid);
		ns.scan(); 
		// TODO: find a more elegant way to do this. The add function is pretty 
		// self-contained, aside from a rewrite this might be the only good solution.
	}
	
	ns.addVideoControls = function(entry,optionList){
		ns._addVideoControls(entry,optionList);
		
		var stub = ns.getStub($(entry).data("plobject"));
		
		// Blacklist Button
		if(ns.isOk(stub)){
			var blackBtn = $("<div/>").addClass("button").appendTo($("<li/>").appendTo(optionList));
			$("<span/>").text("Blacklist Video").appendTo(blackBtn);
			blackBtn.click(function(){
				$(entry).addClass("blacklisted");
				ns.blacklistVideo(stub);
			});
		} else {
			var whiteBtn = $("<div/>").addClass("button").appendTo($("<li/>").appendTo(optionList));
			$("<span/>").text("Pardon Video").appendTo(whiteBtn);
			whiteBtn.click(function(){
				$(entry).removeClass("blacklisted");
				ns.unBlacklistVideo(stub);
			});
		}
	}
	
	ns.installCSS = function(){
		var styles = [
			//' @font-face { font-family: "Celestia Redux"; src: url("//github.com/GreyMage/BTVideoBlacklist/raw/master/CelestiaMediumRedux1.55.ttf");',
			' .blacklisted * { text-decoration: line-through;	font-style: italic; }',
			' .blacklistmessage { font-family: "Celestia Redux", "Arial"; bottom: 0; display: block; font-size: 1.2em; height: 70px; left: 0; line-height: 70px; margin: auto; position: absolute; right: 0; text-align: center; top: 0; width: 300px;}',
			' .blacklistwrap { background: none repeat scroll 0 0 black; height: 100%; width: 100%; } '
		];
		for(var i in styles){
			$("<style/>").html(styles[i]).appendTo("head");
		}
	}
	
	ns.installBlackListType = function(){
		PLAYERS.blacklist = {
			playVideo: function (id, at) {},
			loadPlayer: function (id, at, volume) {
				var wrap = $("<div/>").appendTo($("#ytapiplayer")).addClass("blacklistwrap");
				$("<div/>").text("[ You have blacklisted this video ]").addClass("blacklistmessage").appendTo(wrap);
			},
			onPlayerStateChange: function (event) {},
			pause: function () {},
			play: function () {},
			getVideoState: function () {},
			seek: function (pos) {},
			getTime: function (callback) {}
		};
	}
	
	ns.init = function(){
		/// Punch Ducks
		//Load Video
		ns._videoLoadAtTime = window.videoLoadAtTime;
		window.videoLoadAtTime = ns.videoLoadAtTime;
		//Controls
		ns._addVideoControls = window.addVideoControls;
		window.addVideoControls = ns.addVideoControls;
		//addVideo
		ns._addVideo = window.addVideo;
		window.addVideo = ns.addVideo;

		// Load Blacklist
		ns.load();
		
		// Install CSS
		ns.installCSS();
		
		// Install Blacklist "type"
		ns.installBlackListType();
	}

	ns.init();
	window.ns = ns;
	
}