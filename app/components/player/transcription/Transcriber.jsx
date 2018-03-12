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
    }

    componentDidMount() {
        //make sure the user can still scroll through the transcript
        const transcriptWindow = document.getElementById(this.GUID);
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
            line.parentNode.scrollTop = line.offsetTop - 20;
        }
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
                        </span>&nbsp; {obj.words}
                </div>
            );
        })

        //FIXME currently there can only be one transcriber on the screen...
        return (
            <div id={this.GUID} className={IDUtil.cssClassName('transcriber')}>
                {transcriptContainer}
            </div>
        )
    }
}
export default Transcriber;