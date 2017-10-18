import DatePicker from 'react-datepicker';
import moment from 'moment';

class DatePickerSelector extends React.Component {

    constructor(props) {
        super(props);
    }

    getStartDate() {
        if (this.props.dateRange) {
            if(this.props.dateRange.start) {
                return moment(this.props.dateRange.start);
            }
        }
        return null;
    }

    getEndDate() {
        if (this.props.dateRange) {
            if(this.props.dateRange.end) {
                return moment(this.props.dateRange.end);
            }
        }
        return null;
    }

    startDateChanged(d) {
        console.debug('start date changed', d);
        this.props.onOutput(this.constructor.name, {
            start : d,
            end: this.getEndDate()
        });
    }

    endDateChanged(d) {
        console.debug('end date changed', d);
        this.props.onOutput(this.constructor.name, {
            start : this.getStartDate(),
            end : d
        });
    }

    render() {
        const startDate = this.getStartDate();
        const endDate = this.getEndDate();
        return (
            <div className="col-md-7">
                <div className="row pull-left ">
                    <div className="col-md-6">
                        <DatePicker
                            selected={startDate}
                            selectsStart
                            startDate={startDate}
                            minDate={this.props.minDate}
                            maxDate={this.props.maxDate}
                            onChange={this.startDateChanged.bind(this)}
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                            className="form-control"
                        />
                    </div>
                    <div className="col-md-6">
                        <DatePicker
                            selected={endDate}
                            selectsEnd
                            startDate={startDate}
                            minDate={this.props.minDate}
                            maxDate={this.props.maxDate}
                            onChange={this.endDateChanged.bind(this)}
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