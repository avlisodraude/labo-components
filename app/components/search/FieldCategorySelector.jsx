import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';

//TODO this component is not used yet and does not have a proper component ID yet
class FieldCategorySelector extends React.Component {

	constructor(props) {
		super(props);
	}

	componentDidMount() {
		//console.debug('TODO something');
	}


	changeStringField(e) {
		this.onOutput(e.target.value);
	}

	onOutput(data) {
		if(this.props.onOutput) {
			let fieldCategories = this.props.collectionConfig.getMetadataFieldCategories();
			let fc = fieldCategories.filter((c) => {
				return c.label == data;
			})
			if(fc.length == 1) {
				this.props.onOutput(this.constructor.name, fc[0]);
			} else if (data == 'null_option') {
				this.props.onOutput(this.constructor.name, null);
			}
		}
	}

	render() {
		let fieldCategorySelector = null;
		if(this.props.collectionConfig.getMetadataFieldCategories()) {
			let options = this.props.collectionConfig.getMetadataFieldCategories().map((fc) => {
				return (<option value={fc.label}>{fc.label}</option>);
			});
			options.splice(0,0, <option value="null_option">Search in: all fields</option>)
			fieldCategorySelector = (
				<select className="form-control" style={{width: '300px', marginLeft: '10px'}}
					value={this.props.fieldCategory ? this.props.fieldCategory.label : null}
					onChange={this.changeStringField.bind(this)}>
					{options}
				</select>
			)
		}

		return fieldCategorySelector
	}

}

export default FieldCategorySelector;