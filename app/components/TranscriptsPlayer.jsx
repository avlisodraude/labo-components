import IDUtil from '../util/IDUtil';
import FlexPlayer from './player/video/FlexPlayer';
import IconUtil from "../util/IconUtil";
import TimeUtil from "../util/TimeUtil";
import HTML5AudioPlayer from './player/audio/HTML5AudioPlayer'; // split player into a separated class
import HTML5VideoPlayer from './player/video/HTML5VideoPlayer';
import SegmentationControls from './player/segmentation/SegmentationControls';
import VideoTimeBar from './player/segmentation/SegmentationTimeline';
import AnnotationTimeline from './player/annotation/AnnotationTimeline';
import AnnotationSummary from './annotation/AnnotationSummary';

function TranscriptsPlayer(WrappedComponent) {
    return class extends WrappedComponent {
        constructor(props) {
            super(props);
            this.state = {
                ...props,
                start: this.__getQueryParams()['s'] || -1,
                end: -1,
                sequenceNr: this.__getQueryParams()['sn'] || -1
            }
        }

        componentDidMount() {
            if (this.state.transcript) {
                this.highlightLine(false, this.state.sequenceNr);
            }
        }

        playProgress() {
            if (this.state.playerAPI) {
                this.state.playerAPI.getPosition(this.findClosestSegment.bind(this));
            }
        }

        gotoLine(index) {
            if (this.state.transcript[index]) {
                const previousSequenceNr = this.state.sequenceNr || 0;
                this.setState({
                    start: this.state.transcript[index].start,
                    sequenceNr: this.state.transcript[index].sequenceNr || 0
                }, () => {
                    if (this.state.start !== -1) {
                        this.state.playerAPI.seek(this.state.start / 1000);
                        // should we autoplay ?
                        // this.state.playerAPI.play();
                    }
                    this.updateHistory(this.state);
                    this.highlightLine(previousSequenceNr, this.state.sequenceNr);
                });
            }
        }

        loadTranscripts(transcript) {
            return transcript.map((obj) => {
                return (
                    <div
                        id={obj.sequenceNr} className="sub "
                        onClick={this.gotoLine.bind(this, obj.sequenceNr)}>
                        <span className="data line-start-time">
                            {TimeUtil.formatMillisToTime(obj.start)}
                            </span>&nbsp; {obj.words}
                    </div>
                );
            })
        }

        __getQueryParams() {
            const qs = document.location.search.split('+').join(' '),
                params = {},
                re = /[?&]?([^=]+)=([^&]*)/g;
            let tokens;
            while (tokens = re.exec(qs)) {
                params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
            }
            return params;
        }

        // Helper method to update url params
        updateHistory(clickedLine) {
            const query = this.__getQueryParams(),
                url = '?id=' + query.id + '&cid=' + query.cid + '&st=' + query.st +
                    '&s=' + clickedLine.start + '&sn=' + (clickedLine.sequenceNr || 0);
            window.history.pushState('play', 'Play', url);
        }

        highlightLine(previousSequenceNr, clickedLine) {
            clickedLine = (clickedLine !== -1 ? clickedLine : 0);
            previousSequenceNr = (previousSequenceNr !== -1) ? previousSequenceNr : 0;

            const previousSequence = previousSequenceNr || 0,
                previous = document.getElementById(previousSequence),
                clickedLineID = document.getElementById(clickedLine || 0);
            clickedLineID.parentNode.scrollTop = clickedLineID.offsetTop;
            previous.classList.remove("currentLine");
            if (clickedLineID) {
                clickedLineID.classList.add('currentLine')
            }
        }

        __getTranscriptByStartTime(transcript, time) {
            return transcript.filter(function (obj) {
                return obj.start === time;
            });
        }

        findClosestSegment(currentTime) {
            if (this) {
                const transcript = this.state.transcript,
                    goal = currentTime * 1000,
                    closest = transcript.reduce(function (prev, curr, index) {
                        const st = (index === 1) ? prev.start : prev;
                        return (Math.abs(curr.start - goal) < Math.abs(st - goal) ? curr.start : st);
                    });
                this.highlightLine(this.state.sequenceNr, this.__getTranscriptByStartTime(transcript, closest)[0]["sequenceNr"]);
                this.setState({
                    start: this.__getTranscriptByStartTime(transcript, closest)[0]["start"],
                    sequenceNr: this.__getTranscriptByStartTime(transcript, closest)[0]["sequenceNr"] || null
                }, () => {
                    this.updateHistory(this.state);
                });
            }
        }

        /* ----------------- Rendering --------------------- */
        render() {
            const playerEventCallbacks = {
                playProgress: this.playProgress.bind(this),
                onPlay: super.onPlay.bind(this),
                onPause: super.onPause.bind(this),
                onFinish: super.onFinish.bind(this),
                loadProgress: super.loadProgress.bind(this),
                onSeek: super.onSeek.bind(this)
            };
            let transcriptContainer = null,
                player = null;

            if (this.state.transcript) {
                transcriptContainer = this.loadTranscripts(this.state.transcript);
            } else {
                console.log('No transcript, then render the parent ...');
                return super.render();
            }

            let segmentationControls = null;
            let segmentationBar = null;
            let annotationBar = null;
            let annotationSummary = null;
            let annotationControls = null;
            //only draw segmentation controls if configured
            if (this.state.playerAPI) {
                if (this.props.annotationSupport.mediaSegment) {
                    const controls = {
                        setManualStart: this.setManualStart.bind(this),
                        setManualEnd: this.setManualEnd.bind(this)
                    };
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
                    );
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

            if (this.state.activeAnnotation) {
                annotationSummary = (
                    <AnnotationSummary
                        annotation={this.state.activeAnnotation}
                        annotationLayers={this.props.annotationLayers}
                        showTitle={false}/>
                );
            }

            if (this.props.mediaObject) {
                if (this.props.mediaObject.mimeType.indexOf('video') !== -1) {
                    const query = this.__getQueryParams();
                    if (!query['fragmentUrl'] && query['s']) {
                        //TODO: validate number
                        this.state.mediaObject.start = query['s'] || null;
                        this.state.mediaObject.end = query['e'] || null;
                    }

                    if (this.props.mediaObject.url.indexOf('player.vimeo.com') !== -1) {
                        player = (
                            <VimeoPlayer mediaObject={this.props.mediaObject}
                                         eventCallbacks={playerEventCallbacks}
                                         onPlayerReady={super.onPlayerReady.bind(this)}/>
                        );
                    } else if (this.props.mediaObject.url.indexOf('.mp4') !== -1) {
                        player = (
                            <JWPlayer mediaObject={this.props.mediaObject}
                                      eventCallbacks={playerEventCallbacks}
                                      onPlayerReady={super.onPlayerReady.bind(this)}/>
                        );
                    } else if (this.props.mediaObject.url.indexOf('youtube.com') !== -1 ||
                        this.props.mediaObject.url.indexOf('youtu.be') !== -1) {
                        player = (
                            <YouTubePlayer mediaObject={this.props.mediaObject}
                                           eventCallbacks={playerEventCallbacks}
                                           onPlayerReady={super.onPlayerReady.bind(this)}/>
                        );
                    } else if (this.props.mediaObject.mimeType.indexOf('audio') !== -1) { //later possibly change the audio player
                        player = (
                            <JWPlayer mediaObject={this.props.mediaObject}
                                      eventCallbacks={playerEventCallbacks}
                                      onPlayerReady={super.onPlayerReady.bind(this)}/>
                        );
                    } else {
                        player = (
                            <HTML5VideoPlayer mediaObject={this.props.mediaObject}
                                              eventCallbacks={playerEventCallbacks}
                                              onPlayerReady={super.onPlayerReady.bind(this)}
                            />
                        );
                    }
                } else if (this.props.mediaObject.mimeType.indexOf('audio') !== -1) {
                    player = (<HTML5AudioPlayer mediaObject={this.state.mediaObject}
                                                eventCallbacks={playerEventCallbacks}
                                                onPlayerReady={super.onPlayerReady(this)}/>
                    );
                }
            }

            return (

                <div className={IDUtil.cssClassName('flex-player')}>
                    <div className="row">
                        <div className="col-md-7" style={{overflowX: 'auto'}}>
                            <div>
                                {player}
                                <div id="player_translation">{transcriptContainer}</div>
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
    };
}

const Transcript = TranscriptsPlayer(FlexPlayer);
export default Transcript;