import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';
import ReactTooltip from 'react-tooltip'; //https://www.npmjs.com/package/react-tooltip
import IDUtil from '../../util/IDUtil';
import { PowerSelectMultiple } from 'react-power-select';

//TODO this component is not used yet and does not have a proper component ID yet
class FieldCategorySelector extends React.Component {

	constructor(props) {
		super(props);
        this.state = {
            selectedFields: [],
        };
        this.handleChange = this.handleChange.bind(this)
	}

	onOutput(data) {
		if(this.props.onOutput) {
			if(data === null) {
				this.props.onOutput(this.constructor.name, null);
			} else {
				const fieldCategories = this.props.collectionConfig.getMetadataFieldCategories();
                const selectedObjects = [];

				data.map(function(current) {
                    fieldCategories.map(function (obj) {
						if (obj.label === current) {
                            selectedObjects.push(obj);
						}
						return selectedObjects;
                    });
				});
                this.props.onOutput(this.constructor.name, selectedObjects);
			}
		}
	}

    handleChange ({ options }) {
		const optionsSelected = options;

		this.onOutput(optionsSelected);
        this.setState({
            selectedFields: options
        });
    }

	render() {
		let fieldCategorySelector = null;
		const includedFields = 'All metadata fields (classified as text field) are included in your search';

		// TODO: Assign tooltip info per selected item instead of the whole selection field now that we are dealing with multiple selections
		// if(this.props.fieldCategory) {
        //
		// 	includedFields = 'The following metadata fields are included in this category:<br/><br/>';
        //
        //
		// 	includedFields += this.props.fieldCategory.fields.map(
		// 		(f) => this.props.collectionConfig.toPrettyFieldName(f)
		// 	).join('<br/>');
		// }
		if(this.props.collectionConfig.getMetadataFieldCategories()) {
			const optionsToSelect = this.props.collectionConfig.getMetadataFieldCategories().map((fc) => {
				return fc.label
			});

			fieldCategorySelector = (
				<div className={IDUtil.cssClassName('field-category-selector')}>
				<div className="input-group">
					<span className="input-group-addon btn-effect"
						data-for={'__fs__tt' + this.props.queryId}
						data-tip={includedFields}
						data-html={true}>
						<i className="fa fa-info"></i>
					</span>
					<PowerSelectMultiple
						options={optionsToSelect}
						selected={this.state.selectedFields}
						onChange={this.handleChange}
						placeholder="Search in: all fields"
					/>

				</div>
					{/* TODO: re-locate tooltip on selection multi selection list*/}
				<ReactTooltip id={'__fs__tt' + this.props.queryId} />
			</div>);
		}

		return fieldCategorySelector;
	}
}

export default FieldCategorySelector;