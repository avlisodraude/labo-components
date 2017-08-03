import DatePicker from 'react-datepicker';
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

        console.log('start date' , startDate);
        console.log('startDate', moment(startDate));

        this.startingDateChanged = this.startingDateChanged.bind(this);
        this.endDateChanged = this.endDateChanged.bind(this);
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
    }

    startingDateChanged(d) {
        console.log('change start date');
        this.setState({startDate: d});
        this.props.parentToggle(d, this.state.endDate);
    }

    endDateChanged(d) {
        console.log('change end date');
        this.setState({endDate: d});
        this.props.parentToggle(this.state.startDate, d);
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
                            onChange={this.startingDateChanged}
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
                            onChange={this.endDateChanged}
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                            className="form-control"
                        />
                    </div>
                </div>
            </div>
        );
    }
}


export default DatePickerSelector;