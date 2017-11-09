import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';
import ReactTooltip from 'react-tooltip'; //https://www.npmjs.com/package/react-tooltip
import IDUtil from '../../util/IDUtil';
import { PowerSelectMultiple } from 'react-power-select';

//TODO this component is not used yet and does not have a proper component ID yet
class FieldCategorySelector extends React.Component {

	constructor(props) {
		super(props);
	}

	onOutput(data) {
		if(this.props.onOutput) {
			if(data === null) {
				this.props.onOutput(this.constructor.name, null);
			} else {
				const fieldCategories = this.props.collectionConfig.getMetadataFieldCategories();
				let selectedObjects = []
				data.forEach(function(fc) {
                    selectedObjects = selectedObjects.concat(fieldCategories.filter(function (obj) {
                    	return obj.id === fc.id;
                    }));
				});
                this.props.onOutput(this.constructor.name, selectedObjects);
			}
		}
	}

    handleChange ({ options }) {
    	let found = false;
    	let tmp = {}
    	for(let i=0;i<options.length;i++) {
    		let fc = options[i]
    		if(tmp[fc.id]) {
    			found = true;
    			break;
    		}
    		tmp[fc.id] = true;
    	}
		if(!found) {
			this.onOutput(options);
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
			}).map((ffc) => {
				return {label : ffc.label, id : ffc.id}
			});
			//console.debug('selected fields: ', selectedFields);
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
						onChange={this.handleChange.bind(this)}
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