import DatePicker from 'react-datepicker';
import moment from 'moment';

class DatePickerSelector extends React.Component {

    constructor(props) {
        super(props);
        let startDate = null;
        let endDate = null;
        if(this.props.range) {
            startDate = moment(this.props.range.min);
            endDate = moment(this.props.range.max);
        }
        this.state = {
            startDate: startDate,
            endDate: endDate,
            minDate: startDate,
            maxDate: endDate
        };

        this.startingDateChanged = this.startingDateChanged.bind(this);
        this.endDateChanged = this.endDateChanged.bind(this);
    }

    startingDateChanged(d) {
        this.props.getNewDate(d, this.state.endDate);
        this.setState({startDate: d});
    }

    endDateChanged(d) {
        this.props.getNewDate(this.state.startDate, d);
        this.setState({endDate: d});
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
                            minDate={this.state.minDate}
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
                            maxDate={this.state.maxDate}
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