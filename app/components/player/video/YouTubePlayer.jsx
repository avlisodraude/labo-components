import PlayerAPI from '../PlayerAPI';
import IDUtil from '../../../util/IDUtil';

//See https://developers.google.com/youtube/iframe_api_reference

class YouTubePlayer extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			player : null
		}
	}

	componentDidMount() {
		if(!document.getElementById('youtubeiframeapi')) {
			var tag = document.createElement('script');
			tag.id = 'youtubeiframeapi';
			tag.src = "https://www.youtube.com/iframe_api";
			var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
			window.onYouTubeIframeAPIReady = this.onYouTubeIframeAPIReady.bind(this);
		} else {
			this.onYouTubeIframeAPIReady();
		}
	}

	componentDidUpdate() {
		if(!this.state.player) {
			this.onYouTubeIframeAPIReady();
		}
	}

	componentWillUnmount() {
		if(this.state.player) {
			this.state.player.destroy();
			clearInterval(this.updateInterval);
		}
	}

	//TODO add support for playing a certain fragment on start
	onYouTubeIframeAPIReady() {
		console.debug('called')
		var loaded = false;
		try {
    		if (YT && YT.loaded == 1) {
    			loaded = true;
    		}
		} catch(e) {
			loaded = false;
		}
		if(loaded) {
			let player = new YT.Player('video_player__' + this.props.mediaObject.id, {
				height: '320',
				width: '480',
				videoId: this.getVideoId(),//M7lc1UVf-VE
				events: {
					'onReady': this.onPlayerReady.bind(this),
					'onStateChange': this.onPlayerStateChange.bind(this)
				}
			});
			this.setState({player: player});
		} else {
			console.debug('got here too soon');
		}
	}

	getVideoId() {
		if(!this.props.mediaObject) return null;
		return this.props.mediaObject.url.substring(this.props.mediaObject.url.indexOf('v=') + 2);

	}

	onPlayerReady(event) {
		if(this.props.onPlayerReady) {
			//send back the api to the owning component
			this.props.onPlayerReady(new YouTubeAPI(this.state.player));
		}

		//the youtube iframe API does not have an equivalent of onTime or onProgress.
		this.videotime = 0;
  		this.updateInterval = setInterval(this.updateTime.bind(this), 100);
	}

	updateTime() {
		var oldTime = this.videotime;
		if(this.state.player && this.state.player.getCurrentTime) {
			this.videotime = this.state.player.getCurrentTime();
		}
		if(this.videotime !== oldTime) {
			this.onProgress(this.videotime);
		}
	}

	onProgress(currentTime) {
		if(this.props.eventCallbacks) {
			this.props.eventCallbacks.playProgress(currentTime);
		}
	}

	onPlayerStateChange(event) {
		if(this.props.eventCallbacks) {
			switch (event.data) {
				case YT.PlayerState.BUFFERING : this.props.eventCallbacks.loadProgress(event);break;
				case YT.PlayerState.PLAYING : this.props.eventCallbacks.onPlay(event);break;
				case YT.PlayerState.PAUSED : this.props.eventCallbacks.onPause(event);break;
				case YT.PlayerState.ENDED : this.props.eventCallbacks.onFinish(event);break;
			}
		}
	}

	render() {
		return (
			<div id={'video_player__' + this.props.mediaObject.id} className={IDUtil.cssClassName('youtube-player')}/>
		)
	}
}

class YouTubeAPI extends PlayerAPI {

	constructor(playerAPI) {
		super(playerAPI);
	}

	/* ------------ Implemented API calls ------------- */

	play() {
		this.playerAPI.playVideo();
	}

	pause() {
		this.playerAPI.pauseVideo();
	}

	seek(secs) {
		this.playerAPI.seekTo(secs);
	}

	getPosition(callback) {
		callback(this.playerAPI.getCurrentTime());
	}

	getDuration(callback) {
		callback(this.playerAPI.getDuration());
	}

	isPaused(callback) {
		callback(this.playerAPI.getPlayerState() == 2);
	}

}

export default YouTubePlayer;