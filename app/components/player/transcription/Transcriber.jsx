import IDUtil from '../../../util/IDUtil';
import IconUtil from "../../../util/IconUtil";
import TimeUtil from "../../../util/TimeUtil";

class Transcriber extends React.PureComponent {

    constructor(props) {
        super(props);
        //when we implement editing it's useful to have the transcript in the state
        this.state = {
            transcript : this.props.transcript
        }
        this.userHasScrolled = false;
        this.alertTimerId = null;
        this.GUID = IDUtil.guid();
        this.prevSearchLength = 0;
    }

    componentDidMount() {
        //make sure the user can still scroll through the transcript
        const transcriptWindow = document.getElementById(this.GUID),
            searchHitscontainer = $('.numberOfMatches');
        if(transcriptWindow) {
            transcriptWindow.onscroll = (e) => {
                if(this.alertTimerId == null) {
                    this.alertTimerId = setTimeout(() => {
                        this.userHasScrolled = false;
                    }, 2000 );
                } else {
                    this.userHasScrolled = true;
                    clearTimeout(this.alertTimerId)
                    this.alertTimerId = setTimeout(() => {
                        this.userHasScrolled = false;
                    }, 2000 );
                }
            }
        }
        if(searchHitscontainer) {
            searchHitscontainer.css("display", "none");
        }
    }

    gotoLine(index) {
        this.userHasScrolled = false;
        this.props.playerAPI.seek(this.state.transcript[index].start / 1000);
    }

    getSegmentByStartTime(time) {
        const lines = this.state.transcript.filter(function (obj) {
            return obj.start === time;
        });
        if(lines.length > 0) {
            return lines[0]
        }
        return null;
    }

    //FIXME make this one faster
    findClosestSegment(currentTime) {
        let index = this.state.transcript.findIndex(function (a) {
            return a.start >= currentTime;
        });
        //adjust the index to the previous item when the start time is larger than the current time
        if(this.state.transcript[index] && this.state.transcript[index].start > currentTime) {
            index = index <= 0 ? 0 : index -1;
        }
        const segment = this.getSegmentByStartTime(this.state.transcript[index].start);
        if(segment) {
            return segment.sequenceNr || 0
        }
        return 0
    }

    componentDidUpdate() {
        const segmentId = this.findClosestSegment(Math.trunc(this.props.curPosition * 1000))
        const line = document.getElementById(segmentId);
        if(line && !this.userHasScrolled) {
            line.parentNode.scrollTop = line.offsetTop - 26;
        }
    }

    filterList(event) {
        const searchedTerm = event.target.value;
        if (searchedTerm.length > 3 || (this.prevSearchLength > searchedTerm.length)) {
            const updatedList = this.props.transcript.filter(function (item) {
                return item.words.toLowerCase().search(
                    searchedTerm.toLowerCase()) !== -1;
            });
            //     .map(x => {
            //     var regexstring = searchedTerm;
            //     var regexp = new RegExp(regexstring, "gi");
            //     var str = x.words;
            //     console.log(str.replace(regexp, "<i>" + searchedTerm + "</i>"))
            //     x.words = str.replace(regexp, "<span class='matchedTerm'>" + searchedTerm + "</span>");
            //     return x
            // });
            if (updatedList.length === 0) {
                this.setState({transcript: this.props.transcript},
                    console.log('update to full list and display message for no matches!'))
                $(".numberOfMatches").css("display", "none");

            } else {
                this.setState({transcript: updatedList},
                    () => {
                        this.prevSearchLength = searchedTerm.length;
                        if ((updatedList.length === 0) || (updatedList.length === this.props.transcript.length)) {
                            $(".numberOfMatches").css("display", "none");
                        } else {
                            $(".numberOfMatches").css("display", "inline");
                            $('.numberOfHits').html(updatedList.length);
                        }
                    });
            }

        }
        // console.log('not enough characters typed ...')
    }

    /* ----------------- Rendering --------------------- */
    render() {
        const segmentId = this.findClosestSegment(Math.trunc(this.props.curPosition * 1000))
        const transcriptContainer = this.state.transcript.map((obj) => {
            let className = obj.sequenceNr == segmentId ? 'sub currentLine' : 'sub';
            return (
                <div
                    id={obj.sequenceNr} className={className}
                    onClick={this.gotoLine.bind(this, obj.sequenceNr)}>
                    <span className="data line-start-time">
                        {TimeUtil.formatMillisToTime(obj.start)}
                        </span>
                    <span dangerouslySetInnerHTML={{__html : obj.words}}></span>
                </div>
            );
        });

        //FIXME currently there can only be one transcriber on the screen...
        return (
            <div id={this.GUID} className={IDUtil.cssClassName('transcriber')}>
                <div className="transcript_search_box">
                    <span className="glyphicon glyphicon-search"></span>
                    <input type="text" onChange={this.filterList.bind(this)} name="search-transcriptLine" placeholder="Zoek.." />
                    <span className="numberOfMatches"><span className="numberOfHits"></span> HITS</span>
                </div>
                <div className="transcriptsList">{transcriptContainer}</div>
            </div>
        )
    }
}
export default Transcriber;