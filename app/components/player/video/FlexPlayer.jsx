import MouseTrap from 'mousetrap';

import HTML5AudioPlayer from '../audio/HTML5AudioPlayer';

import HTML5VideoPlayer from './HTML5VideoPlayer';
import VimeoPlayer from './VimeoPlayer';
import JWPlayer from './JWPlayer';
import YouTubePlayer from './YouTubePlayer';

import VideoTimeBar from '../segmentation/SegmentationTimeline';
import SegmentationControls from '../segmentation/SegmentationControls';

import AnnotationTimeline from '../annotation/AnnotationTimeline';
import AnnotationSummary from '../../annotation/AnnotationSummary';

import IDUtil from '../../../util/IDUtil';
import TimeUtil from '../../../util/TimeUtil';
import AnnotationUtil from '../../../util/AnnotationUtil';
import IconUtil from '../../../util/IconUtil';

import FlexBox from '../../FlexBox';

import AppAnnotationStore from '../../../flux/AnnotationStore';
import AnnotationActions from '../../../flux/AnnotationActions';

/*
This class receives a (generic) playerAPI from the implementing player component.
Currently VimeoPlayer, JWPlayer, HTML5VideoPlayer, HTML5AudioPlayer and YouTubePlayer have implemented this API.

It is able to pass the playerAPI to its owner. This is useful e.g. for the current AnnotationRecipe,
who needs to pass on this API to the AnnotationBox (so it's possible to seek the video when clicking on an annotation)

TODO:
	- the annotation buttons must be made logical (just a single button, instead of two. Detect when a segment is active etc)
	- somewhere the annotations made on the media object level must be displayed

Some (older?) B&G videos don't work well: http://lbas2.beeldengeluid.nl:8093/viz/KRO_KINDERTIJ-KN_000093U2

http://localhost:5302/recipe/default-item-details?id=4232174@program&cid=nisv-catalogue-aggr

Raar geskipt naar het einde:

http://localhost:5302/recipe/default-item-details?id=4238372@program&cid=nisv&fq=aanleg
http://localhost:5302/recipe/default-item-details?id=4238372@program&cid=nisv-catalogue-aggr

*/

class FlexPlayer extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			playerAPI : null,
			curPosition : 0,
			duration : 0,
			start : -1,
			end : -1,
			paused : true,//FIXME call the player API instead (isPaused)?
			fragmentMode : false, //only play the current fragment
			annotations : [], //populated in onLoadAnnotations()
			activeAnnotation : null,
			activeAnnotationIndex : -1,
			mediaObjectAnnotation : null //populated in onLoadAnnotations(), there should only be one per user!
		}
	}

	//TODO make sure to offer support for rendering different players, now it's just Vimeo (ArtTube needs this)
	componentDidMount() {
		if(this.props.active) {
			this.initKeyBindings();
		}
		this.loadAnnotations();

		//then listen to any changes that happen in the API
		AppAnnotationStore.bind(
			AnnotationUtil.removeSourceUrlParams(
				this.props.mediaObject.url
			),
			this.onChange.bind(this)
		);

		AppAnnotationStore.bind('change-project', this.loadAnnotations.bind(this, null));
	}

	onChange(eventType, data, annotation, index) {
		if(eventType == 'change-target') {
			this.initKeyBindings(); //whenever this media object becomes the target, make sure these key bindings take over
			this.loadAnnotations(null);
		} else if(eventType == 'update') {
			this.loadAnnotations(annotation);//after adding or saving an annotation
		} else if(eventType == 'delete') {
			this.loadAnnotations(null);//after deleting an annotation
		} else if(eventType == 'play') {//whenever an annotation within this media object needs to be played
			this.setActiveAnnotation(annotation, true);
		} else if(eventType == 'set') {//whenever an annotation within this media object needs to be set
			this.setActiveAnnotation(annotation, true);//false
		}
	}

	loadAnnotations(annotation) {
		this.setState(
			{activeAnnotation : annotation},
			() => {
				console.debug('flexplayer reloading annotations', this.props.project)
				AppAnnotationStore.getMediaObjectAnnotations(
					this.props.mediaObject.url,
					this.props.user,
					this.props.project,
					this.onLoadAnnotations.bind(this)
				)
			}
		)
	}

	onLoadAnnotations(data) {
		if(data) {
			let temp = data.annotations.filter((a) => {
				return a.target.source === this.props.mediaObject.url && a.target.selector == null;
			});
			temp = temp.length > 0 ? temp[0] : null;//there should be only one media object annotation per user!
			this.setState({
				annotations : data.annotations,
				mediaObjectAnnotation : temp
			});
		}
	}

	onPlayerReady(playerAPI) {
		playerAPI.addObserver(this);
		this.setState(
			{playerAPI : playerAPI}
		);
	}

	checkFocus(f, args) {
		const inputs = document.getElementsByTagName('input');
		for(const i of inputs) {
			if(i == document.activeElement) {
				return true;
			}
		}
	    if(f) {
	        f.call(this, args);
	    }
	}

	//called by the playerAPI (this component is an observer of that. I know it's ugly, will make it pretty later)
	//TODO is this still necessary?
	update() {
		const activeSegment = this.state.playerAPI.getActiveSegment();
		this.setState({
			start : activeSegment.start,
			end : activeSegment.end
		})
	}

	/*************************************** Player event callbacks ***************************************/

	playProgress(data) {
		this.state.playerAPI.getPosition(this.onGetPosition.bind(this));
	}

	onPlay(data) {
        this.state.playerAPI.getDuration(this.onGetDuration.bind(this));
        this.setState({paused : false});
	}

	onGetDuration(value) {
		this.setState({duration : value});
	}

	onPause(paused) {
        this.setState({paused : true});
	}

	onGetPosition(value) {
	    this.setState({curPosition : value});
	}

	loadProgress(data) {
		//TODO do something with this?
	}

	onFinish(data) {
		//TODO do something with this?
	}

	onSeek(data) {
		//TODO do something with this?
	}

	/************************************** Segmentation controls ***************************************/

	setManualStart(start) {
		if(start > 0 && start <= this.state.duration) {
		    this.setState({start : start}, this.state.playerAPI.seek(start));
		}
	}

	setManualEnd(end) {
		if(end > 0 && end <= this.state.duration) {
		    this.setState({end : end}, this.state.playerAPI.seek(end));
		}
	}

	playStart() {
    	this.state.playerAPI.seek(this.state.start);
	}

	playEnd() {
    	this.state.playerAPI.seek(this.state.end);
	}

	setStart(start) {
	    let temp = -1;
	    if(start == undefined) {
	        temp = this.state.curPosition;
	    } else {
	        temp = start;
	    }
	    let ac = this.state.activeAnnotation;
	    if(ac && !ac.target.selector) {
	    	ac = null;
	    }
		this.setState({
			start : temp,
			activeAnnotation : ac
		});
	}

	setEnd(end, skipPause) {
	    let temp = -1;
	    if(end == undefined) {
	        temp = this.state.curPosition;
	    } else {
	        temp = end;
	    }
	    let ac = this.state.activeAnnotation;
	    if(ac && !ac.target.selector) {
	    	ac = null;
	    }
        this.setState({
        	end : temp,
        	activeAnnotation : ac
        });
        if(skipPause == undefined) {
            this.state.playerAPI.pause();
        }
	}

	rw(t) {
		this.state.playerAPI.seek(this.state.curPosition - t);
	}

	ff(t) {
		this.state.playerAPI.seek(this.state.curPosition + t);
	}

	//Note: for now the fragment mode only enables the user to inspect the current
	//fragment in isolation (only the VideoTimeBar is changed to show only the active segment)
	switchMode() {
		if(this.state.start != -1 && this.state.end != -1) {
			if(this.state.fragmentMode === false) {
				this.playStart();
				//TODO make it play after switching!
			}
			this.setState({fragmentMode : !this.state.fragmentMode});
		} else {
			alert('You can only switch to fragment mode when you have an active start & end point set');
		}
	}

	/************************************** Keyboard controls ***************************************/

	initKeyBindings() {
		//Mousetrap.bind(['* k', 'ctrl+r', `up up down down left right left right b a enter`], this.testKey.bind(this));

		Mousetrap.bind('left', function() {
			this.checkFocus.call(this, this.rw, 60);
	    }.bind(this));
	    Mousetrap.bind('right', function() {
	        this.checkFocus.call(this, this.ff, 60);
	    }.bind(this));

	    //pause & play shortcut
	    Mousetrap.bind('p', function() {
	        if(!this.checkFocus.call(this)) {
	            if(this.state.paused === false) {//FIXME, this does not work yet!
	                this.state.playerAPI.pause();
	            } else {
	                this.state.playerAPI.play();
	            }
	        }
	    }.bind(this));

	    //start & end shortcuts
	    Mousetrap.bind('i', function() {
	        this.checkFocus.call(this, this.setStart);
	    }.bind(this));
	    Mousetrap.bind('o', function() {
	        this.checkFocus.call(this, this.setEnd);
	    }.bind(this));
	    Mousetrap.bind('shift+i', function() {
	        this.checkFocus.call(this, this.playStart);
	    }.bind(this));
	    Mousetrap.bind('shift+o', function() {
	        this.checkFocus.call(this, this.playEnd);
	    }.bind(this));

	    //annotation controls for segments
	    if(this.props.annotationSupport.mediaSegment) {
	    	Mousetrap.bind('shift+s', function() {
		    	this.checkFocus.call(this, this.saveSegment);
		    }.bind(this));
		    Mousetrap.bind('shift+n', function() {
		    	this.checkFocus.call(this, this.newSegment);
		    }.bind(this));
		    Mousetrap.bind('ctrl+n', function() {
		    	this.checkFocus.call(this, this.newSegmentFromLast);
		    }.bind(this));
		    Mousetrap.bind('shift+right', function() {
		    	this.checkFocus.call(this, this.nextSegment);
		    }.bind(this));
		    Mousetrap.bind('shift+left', function() {
		    	this.checkFocus.call(this, this.previousSegment);
		    }.bind(this));
		    Mousetrap.bind('shift+e', function() {
		    	this.checkFocus.call(this, this.editAnnotation);
		    }.bind(this));
	    }
	    //annotation controls for the media object
	    if(this.props.annotationSupport.mediaObject) {
	    	Mousetrap.bind('shift+a', function() {
		    	this.checkFocus.call(this, this.editMediaObjectAnnotation);
		    }.bind(this));
	    }

	    //only allow if it is enabled
	    if(this.props.enableFragmentMode) {
		    Mousetrap.bind('shift+z', function() {
		    	this.checkFocus.call(this, this.switchMode);
		    }.bind(this));
		}

	    //fast forward shortcuts (somehow cannot create these in a loop...)
	    Mousetrap.bind('1', function() {
	        this.checkFocus.call(this, this.ff, 1);
	    }.bind(this));
	    Mousetrap.bind('2', function() {
	        this.checkFocus.call(this, this.ff, 2);
	    }.bind(this));
	    Mousetrap.bind('3', function() {
	        this.checkFocus.call(this, this.ff, 3);
	    }.bind(this));
	    Mousetrap.bind('4', function() {
	        this.checkFocus.call(this, this.ff, 4);
	    }.bind(this));
	    Mousetrap.bind('5', function() {
	        this.checkFocus.call(this, this.ff, 5);
	    }.bind(this));
	    Mousetrap.bind('6', function() {
	        this.checkFocus.call(this, this.ff, 6);
	    }.bind(this));
	    Mousetrap.bind('7', function() {
	        this.checkFocus.call(this, this.ff, 7);
	    }.bind(this));
	    Mousetrap.bind('8', function() {
	        this.checkFocus.call(this, this.ff, 8);
	    }.bind(this));
	    Mousetrap.bind('9', function() {
	        this.checkFocus.call(this, this.ff, 9);
	    }.bind(this));

	    //rewind shortcuts
	    Mousetrap.bind('shift+1', function() {
	        this.checkFocus.call(this, this.rw, 1);
	    }.bind(this));
	    Mousetrap.bind('shift+2', function() {
	        this.checkFocus.call(this, this.rw, 2);
	    }.bind(this));
	    Mousetrap.bind('shift+3', function() {
	        this.checkFocus.call(this, this.rw, 3);
	    }.bind(this));
	    Mousetrap.bind('shift+4', function() {
	        this.checkFocus.call(this, this.rw, 4);
	    }.bind(this));
	    Mousetrap.bind('shift+5', function() {
	        this.checkFocus.call(this, this.rw, 5);
	    }.bind(this));
	    Mousetrap.bind('shift+6', function() {
	        this.checkFocus.call(this, this.rw, 6);
	    }.bind(this));
	    Mousetrap.bind('shift+7', function() {
	        this.checkFocus.call(this, this.rw, 7);
	    }.bind(this));
	    Mousetrap.bind('shift+8', function() {
	        this.checkFocus.call(this, this.rw, 8);
	    }.bind(this));
	    Mousetrap.bind('shift+9', function() {
	        this.checkFocus.call(this, this.rw, 9);
	    }.bind(this));
	}

	/* ------------------------------------------------------------------------------
	------------------------------- COMMUNICATION WITH OWNER/RECIPE -----------------
	------------------------------------------------------------------------------- */

	setActiveAnnotation(annotation, play) {
		const index = AnnotationUtil.getSegmentIndex(this.state.annotations, annotation);
		this.setState(
			{
				activeAnnotation : annotation,
				activeAnnotationIndex : index
			},
			play ? this.playAnnotation.call(this, annotation) : null
		);
	}

	//TODO set the active index too
	playAnnotation(annotation) {
		if(annotation && annotation.target) {
			//TODO make sure to check the mimeType and also add support for images/spatial targets!!
			if(annotation.target.source == AnnotationUtil.removeSourceUrlParams(this.props.mediaObject.url)) {
				this.setActiveAnnotation(annotation);
				const frag = AnnotationUtil.extractTemporalFragmentFromAnnotation(annotation);
				if(frag) {
					this.state.playerAPI.setActiveSegment(frag, true, true);
				} else {
					this.state.playerAPI.setActiveSegment(null, true, true);
				}
			}
		}
	}

	editAnnotation() {
		if(this.state.activeAnnotation) {
			AnnotationActions.edit(this.state.activeAnnotation);
		}
	}

	deleteAnnotation() {
		if(this.state.activeAnnotation) {
			AnnotationActions.delete(this.state.activeAnnotation);
		}
	}

	/* ---------------------------- MEDIA OBJECT ANNOTATION SPECIFIC ------------------------- */

	editMediaObjectAnnotation() {
		let annotation = this.state.mediaObjectAnnotation;
		if(!annotation) {
			annotation = AnnotationUtil.generateW3CEmptyAnnotation(
				this.props.user,
				this.props.mediaObject.url,
				this.props.mediaObject.mimeType,
				this.props.project
			);
		}
		AnnotationActions.edit(annotation);
	}

	/* ---------------------------- SEGMENT ANNOTATION SPECIFIC ------------------------- */

	newSegment() {
		this.setState({
			activeAnnotation : null,
			start : -1,
			end : -1
		})
	}

	newSegmentFromLast() {
		if(this.state.end > 0) {
			this.setState({
				activeAnnotation : null,
				start : this.state.end,
				end : -1
			},
			this.state.playerAPI.seek(this.state.end))
		} else {
			this.newSegment();
		}
	}

	saveSegment() {
		AnnotationActions.save(
			AnnotationUtil.toUpdatedAnnotation(
				this.state.activeAnnotation,
				this.props.user,
				this.props.mediaObject,
				this.state.start,
				this.state.end,
				this.props.project
			)
		);
	}

	nextSegment() {
		const segment = AnnotationUtil.getSegment(this.state.annotations, this.state.activeAnnotationIndex + 1);
		if(segment) {
			AnnotationActions.set(segment);
		}
	}

	previousSegment() {
		const segment = AnnotationUtil.getSegment(this.state.annotations, this.state.activeAnnotationIndex - 1);
		if(segment) {
			AnnotationActions.set(segment);
		}
	}

	/* ----------------- just rendering --------------------- */

	render() {
		//update the activeSegment in the playerAPI
		if(this.state.start != -1 && this.state.end != -1 && this.state.playerAPI) {
			this.state.playerAPI.setActiveSegment({
				start : this.state.start,
				end : this.state.end
			});
		}

		let segmentationControls = null;
		let segmentationBar = null;
		let annotationBar = null;
		let annotationControls = null;
		let annotationSummary = null;

		//only draw segmentation controls if configured


		if(this.state.playerAPI) {
			if(this.props.annotationSupport.mediaSegment) {
				const controls = {
					setManualStart : this.setManualStart.bind(this),
					setManualEnd : this.setManualEnd.bind(this)
				}
				segmentationControls = (
					<SegmentationControls
						controls={controls}
						annotation={this.state.activeAnnotation}
						start={this.state.start}
						end={this.state.end}/>
				);
				segmentationBar = (
					<VideoTimeBar
						mediaObject={this.props.mediaObject}
						duration={this.state.duration}
						curPosition={this.state.curPosition}
						start={this.state.start}
						end={this.state.end}
						playerAPI={this.state.playerAPI}
						fragmentMode={this.state.fragmentMode}/>
				);
				annotationBar = (
					<AnnotationTimeline
						mediaObject={this.props.mediaObject}
						annotations={this.state.annotations}
						annotation={this.state.activeAnnotation}
						annotationLayers={this.props.annotationLayers}
						duration={this.state.duration}
						curPosition={this.state.curPosition}
						start={this.state.start}
						end={this.state.end}
						playerAPI={this.state.playerAPI}
						fragmentMode={this.state.fragmentMode}/>
				)
				annotationControls = (<div className="row">
					<div className="col-md-12">
						<div>
							{segmentationBar}
							{annotationBar}
						</div>
					</div>
				</div>);
			}
		}

		if(this.state.activeAnnotation) {
			annotationSummary = (
				<AnnotationSummary
					annotation={this.state.activeAnnotation}
					annotationLayers={this.props.annotationLayers}
					showTitle={false}/>
			);
		}

		const playerEventCallbacks = {
		    playProgress : this.playProgress.bind(this),
		    onPlay : this.onPlay.bind(this),
		    onPause : this.onPause.bind(this),
		    onFinish : this.onFinish.bind(this),
		    loadProgress : this.loadProgress.bind(this),
		    onSeek : this.onSeek.bind(this)
		}

		let player = null;
		if(this.props.mediaObject) {
			if(this.props.mediaObject.mimeType.indexOf('video') != -1) {
				if(this.props.mediaObject.url.indexOf('player.vimeo.com') != -1)  {
					player = (
						<VimeoPlayer mediaObject={this.props.mediaObject}
						eventCallbacks={playerEventCallbacks}
						onPlayerReady={this.onPlayerReady.bind(this)}/>
					);
				} else if (this.props.mediaObject.url.indexOf('.mp4') != -1) {
					player = (
						<JWPlayer mediaObject={this.props.mediaObject}
						eventCallbacks={playerEventCallbacks}
						onPlayerReady={this.onPlayerReady.bind(this)}/>
					);
				} else if (this.props.mediaObject.url.indexOf('youtube.com') != -1 ||
					this.props.mediaObject.url.indexOf('youtu.be') != -1) {
					player = (
						<YouTubePlayer mediaObject={this.props.mediaObject}
						eventCallbacks={playerEventCallbacks}
						onPlayerReady={this.onPlayerReady.bind(this)}/>
					);
				} else if (this.props.mediaObject.mimeType.indexOf('audio') != -1) { //later possibly change the audio player
					player = (
						<JWPlayer mediaObject={this.props.mediaObject}
						eventCallbacks={playerEventCallbacks}
						onPlayerReady={this.onPlayerReady.bind(this)}/>
					);
				} else {
					player = (
						<HTML5VideoPlayer mediaObject={this.props.mediaObject}
						eventCallbacks={playerEventCallbacks}
						onPlayerReady={this.onPlayerReady.bind(this)}/>
					);
				}
			} else if(this.props.mediaObject.mimeType.indexOf('audio') != -1) {
				player = (<HTML5AudioPlayer mediaObject={this.props.mediaObject}
					eventCallbacks={playerEventCallbacks}
					onPlayerReady={this.onPlayerReady.bind(this)}/>
				);
			}
		}

		return (
			<div className={IDUtil.cssClassName('flex-player')}>
				<div className="row">
					<div className="col-md-7" style={{overflowX : 'auto'}}>
						<div>
							{player}
						</div>
						<div className="btn-toolbar" role="toolbar">
							<div className="btn-group" role="group">
								<button className="btn btn-default" type="button"
									title="Add annotation to the whole video (SHIFT+A)"
									onClick={this.editMediaObjectAnnotation.bind(this)}>
									<span className={IconUtil.getUserActionIcon('annotate')}></span>
								</button>
							</div>
							&nbsp;
							<div className="btn-group" role="group">
								<button className="btn btn-default" type="button"
									title="Delete current annotation (SHIFT+D)"
									onClick={this.deleteAnnotation.bind(this)}>
									<span className={IconUtil.getUserActionIcon('remove')}></span>
								</button>
							</div>
							&nbsp;
							<div className="btn-group" role="group">
								<button className="btn btn-default" type="button"
									title="Save segment (SHIFT+S)"
									onClick={this.saveSegment.bind(this)}>
									<span className={IconUtil.getUserActionIcon('save')}></span>
								</button>
								<button className="btn btn-default" type="button"
									title="New segment (SHIFT+N)"
									onClick={this.newSegment.bind(this)}>
									<span className={IconUtil.getUserActionIcon('add')}></span>
								</button>
								<button className="btn btn-default" type="button"
									title="New segment from currently active segment (CTRL+N)"
									onClick={this.newSegmentFromLast.bind(this)}>
									<span className={IconUtil.getUserActionIcon('next')}></span>
								</button>
							</div>
						</div>
					</div>
					<div className="col-md-5">
						{segmentationControls}
						{annotationSummary}
					</div>
				</div>
				{annotationControls}
			</div>
		)
	}

}

export default FlexPlayer;