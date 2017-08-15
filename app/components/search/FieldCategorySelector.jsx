import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';

//TODO this component is not used yet and does not have a proper component ID yet
class FieldCategorySelector extends React.Component {

	constructor(props) {
		super(props);
	}

	changeStringField(e) {
		this.onOutput(e.target.value);
	}

	onOutput(data) {
		if(this.props.onOutput) {
			const fieldCategories = this.props.collectionConfig.getMetadataFieldCategories();
			const fc = fieldCategories.filter((c) => {
				return c.id == data;
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
			const options = this.props.collectionConfig.getMetadataFieldCategories().map((fc) => {
				return (<option value={fc.id}>{fc.label}</option>);
			});
			options.splice(0,0, <option value="null_option">Search in: all fields</option>)
			fieldCategorySelector = (
				<select className="form-control"
					value={this.props.fieldCategory ? this.props.fieldCategory.id : null}
					onChange={this.changeStringField.bind(this)}>
					{options}
				</select>
			)
		}

		return fieldCategorySelector
	}

}

export default FieldCategorySelector;