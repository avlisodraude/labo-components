import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';
import ReactTooltip from 'react-tooltip'; //https://www.npmjs.com/package/react-tooltip
import IDUtil from '../../util/IDUtil';
import { PowerSelectMultiple } from 'react-power-select';

//TODO this component is not used yet and does not have a proper component ID yet
class FieldCategorySelector extends React.Component {

	constructor(props) {
		super(props);
	}

	onOutput({ options }) {
		if(this.props.onOutput) {
			if(options === null) {
				this.props.onOutput(this.constructor.name, null);
			} else {
                this.props.onOutput(this.constructor.name, options);
			}
		}
	}

    isSelected(selection, selectedFields) {
    	let selected = false;
    	for(let i=0;i<selectedFields.length;i++) {
    		if(selectedFields[i].id == selection.id){
    			selected = true;
    			break;
    		}
    	}
    	return selected;
    }

	render() {
		let fieldCategorySelector = null;
		const includedFields = 'All metadata fields (classified as text field) are included in your search';
		const selectedFields = this.props.fieldCategory || [];
		if(this.props.collectionConfig.getMetadataFieldCategories()) {
			const optionsToSelect = this.props.collectionConfig.getMetadataFieldCategories().filter((fc)=> {
				return !this.isSelected(fc, selectedFields);
			});
			fieldCategorySelector = (
				<div className={IDUtil.cssClassName('field-category-selector')}>
					<PowerSelectMultiple
						options={optionsToSelect}
						selected={selectedFields}
						optionLabelPath="label"
          				optionComponent={<CustomOptionComponent />}
          				selectedOptionComponent={
          					<CustomSelectedOptionComponent
          						queryId={this.props.queryId}
          						collectionConfig={this.props.collectionConfig}/>
          				}
						onChange={this.onOutput.bind(this)}
						placeholder="Search in: all fields"
					/>
				<ReactTooltip id={'__fs__tt' + this.props.queryId} />
			</div>);
		}

		return fieldCategorySelector;
	}
}

export default FieldCategorySelector;


export const CustomOptionComponent = ({ option }) => (
	<div>
		Search in: {option.label}
	</div>
);

export const CustomSelectedOptionComponent = ({ option, optionLabelPath, onCloseClick, select, queryId, collectionConfig }) => (
	<li className="PowerSelectMultiple__SelectedOption">
		<span className="PowerSelectMultiple__SelectedOption__Label"
			data-for={'__fs__tt' + queryId}
			data-tip={
				'The following metadata fields are included in this category:<br/><br/>' +
				option.fields.map((f) => collectionConfig.toPrettyFieldName(f)).join('<br/>')
			}
			data-html={true}>
			{option[optionLabelPath]}
		</span>
		<span
			className="PowerSelectMultiple__SelectedOption__Close"
			onClick={event => {
				event.stopPropagation();
				onCloseClick({ option, select });
			}}
		>
		×
		</span>
	</li>
);