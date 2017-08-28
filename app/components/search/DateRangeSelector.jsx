import IDUtil from '../../util/IDUtil';
import TimeUtil from '../../util/TimeUtil';
import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';
import DatePickerSelector from './DatePickerSelector';
//https://facebook.github.io/react/blog/2013/07/11/react-v0-4-prop-validation-and-default-values.html
/*
	Currently based on noUIslider.js

	TODO:
		- create another component based on either:
			https://www.npmjs.com/package/react-bootstrap-date-picker
			https://bootstrap-datepicker.readthedocs.io/en/latest/

	PLAN (9 mrt 2017):
		- first implement it without a date selector
		- then implement a string field selector for the regular search
		- then implement the date field selector here

	component output:
		- a certain date field
		- a certain date range based on years
*/
class DateRangeSelector extends React.Component {

    constructor(props) {
        super(props);
        let dateFields = null;
        if (this.props.collectionConfig) {
            dateFields = this.props.collectionConfig.getDateFields();
        }
        this.state = {
            currentDateField: dateFields && dateFields.length > 0 ? dateFields[0] : null,
            slider: null
        };
    }

    //only update on a new search
    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.searchId != this.props.searchId;
    }

    //updates only when the date field has changed or whenever there is a completely new search
    componentDidUpdate() {
        if (this.state.fieldUpdate ||
            ( this.props.dateRange.start === -1 && this.props.dateRange.end === -1)
        ) {
            const range = this.getDateRange(this.props.dateRange.field);
            // this.updateDatePickerRange(range);
            this.setState({fieldUpdate: false});
        }
    }

    currentSelectionHasResults() {
        return this.props.aggregations &&
            this.props.aggregations[this.props.dateRange.field] &&
            this.props.aggregations[this.props.dateRange.field].length > 1;
    }

    changeDateField(e) {
        this.setState(
            {fieldUpdate: true},
            this.onOutput({
                field: e.target.value,
                start: -1,
                end: -1
            })
        )
    }

    //FIXME This only works if the dateField was already queried as an aggregation!!!
    //So when the user selects a field that is not already queried, a new search should be done
    getDateRange(dateField) {
        if (this.props.aggregations) {
            const aggr = this.props.aggregations[dateField];
            if (aggr && aggr.length > 0) {
                const min = TimeUtil.getYearFromDate(
                    aggr[0].date_millis
                );
                const fullMin = aggr[0].date_millis;
                const max = TimeUtil.getYearFromDate(
                    aggr[aggr.length - 1].date_millis) + 1;
                const fullMax = aggr[aggr.length - 1].date_millis + 1;

                if (max > min) {
                    return {
                        min: min,
                        max: max,
                        fullMin: fullMin,
                        fullMax: fullMax
                    }
                }
            } else {
                console.debug(dateField + ' is currently not part of the configured facets');
            }
        }
        return null;
    }

    //the data looks like this => {start : '' : end : '', dateField : ''}
    onOutput(data) {
        if (this.props.onOutput) {
            this.props.onOutput(this.constructor.name, data);
        }
    }

    getNewDate(start, end) {
        const df = this.props.dateRange.field;
        if (this.props.aggregations) {
            if (this.props.aggregations[df]) {
                this.onOutput({
                    field: this.props.dateRange.field,
                    start: start.valueOf(),
                    end: end.valueOf()
                });
            }
        }
    }

    render() {
        let dateFieldSelect = null;
        const hasResults = this.currentSelectionHasResults();
        let noResults = null;

        if (this.props.collectionConfig.getDateFields() && this.props.dateRange) {
            const options = this.props.collectionConfig.getDateFields().map((df, index) => {
                return (<option key={'df__' + index} value={df}>{this.props.collectionConfig.toPrettyFieldName(df)}</option>);
            });
            dateFieldSelect = (
                <select className="form-control" value={this.props.dateRange.field}
                        onChange={this.changeDateField.bind(this)}>
                    {options}
                </select>
            )
        }

        if (!hasResults) {
            noResults = (
                <div className="alert alert-warning">Selecting data ranges is only possible when the resulting data
                    spans more than one year</div>
            )
        }

        if (this.props.selectorType === 'date-picker') {
            return (
                <div className="datePickerSelector">
                    <div className={IDUtil.cssClassName('date-range-select')}>
                        <div className="row">
                            <div className="col-md-5">
                                {dateFieldSelect}
                            </div>
                            <DatePickerSelector
                                dateField={this.props.dateRange.field}
                                dataForDatePicker={this.props}
                                collectionConfig={this.props.collectionConfig}
                                aggregations={this.props.aggregations}
                                range={this.getDateRange(this.props.dateRange.field)}
                                getNewDate={this.getNewDate.bind(this)}
                            />
                        </div>
                    </div>
                </div>
            )
        } else {
            return (
                <div className={IDUtil.cssClassName('date-range-select')}>
                    <div className="row">
                        <div className="col-md-5">
                            {dateFieldSelect}
                        </div>
                        <div className="col-md-7">
                            <div id={'__slider_' + IDUtil.hashCode(this.props.queryId)}
                                 style={{display: hasResults ? 'block' : 'none'}}>
                            </div>
                            {noResults}
                        </div>
                    </div>
                </div>
            )
        }
    }
}

export default DateRangeSelector;