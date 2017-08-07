import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';
import IDUtil from '../../util/IDUtil';

/*
	INPUT:
		- an instance of CollectionConfig.jsx (for determining the available fields)
		- an onOutput function (for emitting the created aggregation)

	OUTPUT:
		- a new aggregation

	HTML markup & CSS attributes:
		- regular div ==> .bg__aggregation-creator
*/
class AggregationCreator extends React.Component {
	constructor(props) {
		super(props);
		let fieldList = this.getFieldList();
		this.state = {
			selectedField : fieldList ? fieldList[0] : null
		}
	}

	onOutput(selectedField, label) {
		var aggregation = {
			field: selectedField,
			title : label,
			id : selectedField,
			operator : 'AND',
			size : 10,
			type : 'string',
			display: true
		}

		if(this.props.onOutput) {
			this.props.onOutput(this.constructor.name, aggregation);
		}
	}

	save(e) {
		e.preventDefault();
		if(this.state.selectedField) {
			this.onOutput(this.state.selectedField, this.refs.label.value);
		}
	}

	getFieldList() {
		let fields = this.props.collectionConfig.getNonAnalyzedFields();
		if(!fields) {
			fields = this.props.collectionConfig.getStringFields();
		}
		return fields;
	}

	selectField(e) {
		this.setState({selectedField : e.target.value});
	}

	//TODO do something in case no fields could be retrieved in the config
	render() {
		let stringSelect = null;
		let stringOptions = [];
		let fieldList = this.getFieldList();

		if(fieldList) {
			stringOptions = fieldList.map((sf) => {
				return (
					<option value={sf}>{ElasticsearchDataUtil.toPrettyFieldName(sf)}</option>
				)
			});

			if(stringOptions.length > 0) {
				stringSelect = (
					<div className="form-group">
						<label className="col-sm-3">Fields of type: string</label>
						<div className="col-sm-9">
							<select className="form-control" onChange={this.selectField.bind(this)} value={this.state.selectedField}>
								{stringOptions}
							</select>
						</div>
					</div>
				)
			}
		}

		return (
			<div className={IDUtil.cssClassName('aggregation-creator')}>
				<form className="form-horizontal" onSubmit={this.save.bind(this)}>
					{stringSelect}
					<div className="form-group">
    					<label className="col-sm-3" htmlFor="label">Label</label>
    					<div className="col-sm-9">
    						<input ref="label" type="text" className="form-control" id="label"/>
    					</div>
  					</div>
  					<button type="submit" className="btn btn-default">Add</button>
				</form>
			</div>
		)
	}
}


export default AggregationCreator;