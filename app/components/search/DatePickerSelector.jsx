import IDUtil from '../../util/IDUtil';
import DatePicker from 'react-datepicker';
import TimeUtil from '../../util/TimeUtil';
import moment from 'moment';

class DatePickerSelector extends React.Component {

    constructor(props) {
        super(props);
        console.log('props ', props);
        let startDate = moment(this.props.range.min) || null;
        let endDate = moment(this.props.range.max) || null;

        this.state = {
            date: moment(),
            startDate: startDate,
            endDate: endDate
        };
        this.startingDateChanged = this.startingDateChanged.bind(this);
        this.endDateChanged = this.endDateChanged.bind(this);

        console.log('startDate', moment(startDate));
    }

    startingDateChanged(d) {
        console.log('change start date');
        this.setState({startDate: d});
    }

    endDateChanged(d) {
        console.log('change end date');
        this.setState({date: d});
    }

    //the data looks like this => {start : '' : end : '', dateField : ''}
    // check whic one is called since it is already defined before in daterangeselector
    onOutput(data) {
        console.log('on ouput from datepickerselector');
        if (this.props.onOutput) {
            this.props.onOutput(this.constructor.name, data);
        }
    }

    //updates only when the date field has changed or whenever there is a completely new search
    componentDidUpdate() {
        console.log('component did update', this);
        // if (this.state.fieldUpdate || (this.props.dateRange.start == -1 && this.props.dateRange.end == -1)) {
        //     let range = this.getDateRange(this.props.dateRange.field);
        //     this.updateSliderRange(range);
        //     this.setState({fieldUpdate: false});
        //
    }

    //whenever you you change a date in the date picker
    onDatePickerUpdate(values, handle, unencoded, tap, positions) {

        console.log('date changed',values, handle, unencoded, tap, positions );
        console.log('this', this);
        let df = this.props.dateField;
        if (this.props.aggregations) {
            if (this.props.aggregations[df]) {
                this.onOutput({
                    field: this.props.dateField,
                    start: TimeUtil.yearToUNIXTime(parseInt(values[0])),
                    end: TimeUtil.yearToUNIXTime(parseInt(values[1]))
                });
                console.log('all good!!!');
            }
        }
        this.setState({startDate: values});
    }

    render() {
        return (
            <div className="col-md-7">
                <div className="row pull-left ">
                    <div className="col-md-6">
                        <DatePicker
                            selected={this.state.startDate}
                            selectsStart
                            startDate={this.state.startDate}
                            endDate={this.state.endDate}
                            minDate={this.state.startDate}
                            maxDate={this.state.endDate}
                            onChange={this.onDatePickerUpdate.bind(this)}
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                            className="form-control"
                        />
                    </div>
                    <div className="col-md-6">
                        <DatePicker
                            selected={this.state.endDate}
                            selectsEnd
                            startDate={this.state.startDate}
                            endDate={this.state.endDate}
                            minDate={this.state.startDate}
                            maxDate={this.state.endDate}
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                            className="form-control"
                            onChange={this.onDatePickerUpdate.bind(this)}
                        />
                    </div>
                </div>
            </div>
        );
    }
}


export default DatePickerSelector;