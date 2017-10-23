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
            <div className="row">
                <div className="col-md-12">
                    <table>
                        <tr>
                            <td>
                                <DatePicker
                                    disabled={this.props.disabled}
                                    selected={startDate}
                                    selectsStart={true}
                                    minDate={this.props.minDate}
                                    maxDate={this.props.maxDate}
                                    onChange={this.startDateChanged.bind(this)}
                                    showMonthDropdown={true}
                                    showYearDropdown={true}
                                    dropdownMode="select"
                                    className="form-control"
                                    placeholderText="Start date"/>
                            </td>
                            <td>
                                &nbsp;
                                <i className="fa fa-calendar" ariaHidden="true"></i>
                                &nbsp;
                            </td>
                            <td>
                                <DatePicker
                                    disabled={this.props.disabled}
                                    selected={endDate}
                                    selectsEnd={true}
                                    minDate={this.props.minDate}
                                    maxDate={this.props.maxDate}
                                    onChange={this.endDateChanged.bind(this)}
                                    showMonthDropdown={true}
                                    showYearDropdown={true}
                                    dropdownMode="select"
                                    className="form-control"
                                    placeholderText="End date"/>
                            </td>
                            <td>
                                &nbsp;
                                <i className="fa fa-calendar" ariaHidden="true"></i>
                                &nbsp;
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

        );
    }
}

export default DatePickerSelector;