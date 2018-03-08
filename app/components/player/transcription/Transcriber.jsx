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
        return this.state.transcript.filter(function (obj) {
            return obj.start === time;
        });
    }

    findClosestSegment(currentTime) {
        let closest = 0;
        this.state.transcript.some(function (a) {
            if (a.start >= currentTime) {
                return true;
            }
            closest = a.start;
        });
        return this.getSegmentByStartTime(closest)[0]["sequenceNr"];
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