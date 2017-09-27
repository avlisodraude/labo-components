import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';
import ReactTooltip from 'react-tooltip'; //https://www.npmjs.com/package/react-tooltip
import IDUtil from '../../util/IDUtil';

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
		let includedFields = 'All metadata fields (classified as text field) are included in your search';
		if(this.props.fieldCategory) {
			includedFields = 'The following metadata fields are included in this category:<br/><br/>';
			includedFields += this.props.fieldCategory.fields.map(
				(f) => this.props.collectionConfig.toPrettyFieldName(f)
			).join('<br/>');
		}
		if(this.props.collectionConfig.getMetadataFieldCategories()) {
			const options = this.props.collectionConfig.getMetadataFieldCategories().map((fc) => {
				return (<option value={fc.id}>{fc.label}</option>);
			});
			options.splice(0,0, <option value="null_option">Search in: all fields</option>)
			fieldCategorySelector = (
				<div className={IDUtil.cssClassName('field-category-selector')}>
				<div className="input-group">
					<span className="input-group-addon btn-effect" data-tip={includedFields} data-html={true}>
						<i className="fa fa-info"></i>
					</span>
					<select className="form-control"
						value={this.props.fieldCategory ? this.props.fieldCategory.id : null}
						onChange={this.changeStringField.bind(this)}>
						{options}
					</select>
				</div>
				<ReactTooltip />
			</div>);
		}

		return fieldCategorySelector;
	}

}

export default FieldCategorySelector;