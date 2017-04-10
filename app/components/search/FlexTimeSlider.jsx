import IDUtil from '../../util/IDUtil';
import TimeUtil from '../../util/TimeUtil';
import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';
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

class FlexTimeSlider extends React.Component {

	constructor(props) {
		super(props);
		let dateFields = null;
		if(this.props.collectionConfig) {
			dateFields = this.props.collectionConfig.getDateFields();
		}
		this.state = {
			currentDateField : dateFields && dateFields.length > 0 ? dateFields[0] : null,
			slider : null
		}
	}

	componentDidMount() {
		if(this.props.dateRange) {
			var range = this.getDateRange(this.props.dateRange.field);
			if(range) {
				var slider = document.getElementById('__slider_' + IDUtil.hashCode(this.props.queryId));
				noUiSlider.create(slider, {
					start: [0, range.max],
					step: 1,
					margin : 1,
					connect: true,
					range: range,
					tooltips: true,
					format: {
						to: function ( value ) {
							return parseInt(value);
						},
						from: function ( value ) {
							return value;
						}
					}
				});

				slider.noUiSlider.on('set', this.onSliderUpdate.bind(this));
				this.setState({
					slider : slider
				})
			}
		}
	}

	//only update on a new search
	shouldComponentUpdate(nextProps, nextState) {
		return nextProps.searchId != this.props.searchId;
	}

	//updates only when the date field has changed or whenever there is a completely new search
	componentDidUpdate() {
		if(this.state.fieldUpdate || (this.props.dateRange.start == -1 && this.props.dateRange.end == -1)) {
			let range = this.getDateRange(this.props.dateRange.field);
			this.updateSliderRange(range);
			this.setState({fieldUpdate : false});
		}
	}

	currentSelectionHasResults() {
		return this.props.aggregations &&
			this.props.aggregations[this.props.dateRange.field] &&
			this.props.aggregations[this.props.dateRange.field].length > 1;
	}

	//whenever you move the slider
	onSliderUpdate(values, handle, unencoded, tap, positions) {
		let df = this.props.dateRange.field;
		if(this.props.aggregations) {
			if(this.props.aggregations[df]) {
				this.onOutput({
					field : this.props.dateRange.field,
					start : TimeUtil.yearToUNIXTime(parseInt(values[0])),
					end : TimeUtil.yearToUNIXTime(parseInt(values[1]))
				});
			}
		}
	}

	changeDateField(e) {
		this.setState(
			{fieldUpdate : true},
			this.onOutput({
				field : e.target.value,
				start : -1,
				end : -1
			})
		)
	}

	updateSliderRange(range) {
		if(range && this.state.slider) {
			this.state.slider.noUiSlider.updateOptions({
				range: range,
				start : [range.min, range.max]
			}, false);
		} else {

		}
	}

	//FIXME This only works if the dateField was already queried as an aggregation!!!
	//So when the user selects a field that is not already queried, a new search should be done
	getDateRange(dateField) {
		if(this.props.aggregations) {
			let aggr = this.props.aggregations[dateField];
			if(aggr && aggr.length > 0) {
				let min = TimeUtil.getYearFromDate(
					aggr[0].date_millis
				);
				let max = TimeUtil.getYearFromDate(
					aggr[aggr.length -1].date_millis
				) + 1;
				if(max > min) {
					return {
						min : min,
						max : max
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
		if(this.props.onOutput) {
			this.props.onOutput(this.constructor.name, data);
		}
	}

	render() {
		let dateFieldSelect = null;
		let hasResults = this.currentSelectionHasResults();
		let noResults = null;
		if(this.props.collectionConfig.getDateFields() && this.props.dateRange) {
			let options = this.props.collectionConfig.getDateFields().map((df) => {
				return (<option value={df}>{ElasticsearchDataUtil.toPrettyFieldName(df)}</option>);
			});
			dateFieldSelect = (
				<select className="form-control" value={this.props.dateRange.field} onChange={this.changeDateField.bind(this)}>
					{options}
				</select>
			)
		}

		if(!hasResults) {
			noResults = (
				<div className="alert alert-warning">Selecting data ranges is only possible when the resulting data spans more than one year</div>
			)
		}

		return (
			<div className="row">
				<div className="col-md-5">
					{dateFieldSelect}
				</div>
				<div className="col-md-7">
					<div id={'__slider_' + IDUtil.hashCode(this.props.queryId)}
						style={{display : hasResults ? 'block' : 'none'}}>
					</div>
					{noResults}
				</div>
			</div>
		)
	}

}

export default FlexTimeSlider;


// FlexTimeSlider.propTypes = {
// 	data : React.PropTypes.object
// }