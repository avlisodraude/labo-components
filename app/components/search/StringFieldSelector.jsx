import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';

//TODO this component is not used yet and does not have a proper component ID yet
class StringFieldSelector extends React.Component {

	constructor(props) {
		super(props);
		let stringFields = null;
		if(this.props.collectionConfig) {
			stringFields = this.props.collectionConfig.getStringFields();
		}
		this.state = {
			currentStringField : stringFields && stringFields.length > 0 ? stringFields[0] : null
		}
	}

	componentDidMount() {
		//console.debug('TODO something');
	}


	changeStringField(e) {
		this.onOutput(e.target.value);
	}

	//the data looks like this => {start : '' : end : '', dateField : ''}
	onOutput(data) {
		if(this.props.onOutput) {
			this.props.onOutput(this.constructor.name, data);
		}
	}

	render() {
		let stringFieldSelect = null;

		if(this.props.collectionConfig.getStringFields()) {
			let options = this.props.collectionConfig.getStringFields().map((sf) => {
				return (<option value={sf}>{ElasticsearchDataUtil.toPrettyFieldName(sf)}</option>);
			});
			stringFieldSelect = (
				<select className="form-control" value={this.props.stringField} onChange={this.changeStringField.bind(this)}>
					{options}
				</select>
			)
		}

		return stringFieldSelect
	}

}

export default StringFieldSelector;