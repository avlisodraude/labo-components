import CollectionSelector from './collection/CollectionSelector';
import FlexBox from './FlexBox';
import IDUtil from '../util/IDUtil';

class FlexComponentInfo extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			componentConfig : null
		}
	}

	generateComponentConfig() {

	}

	toList(list) {
		if(!list || typeof(list) != 'object') {
			return '';
		}
		return list.join('; ');
	}

	render() {
		let childrenWithProps = null;
		if(this.props.config) {//this.state.componentConfig
			let config = {
				key : "testbox",
				blockId : "labs-catalogue-aggr",
				searchAPI: _config.SEARCH_API_BASE,
				indexPath: '/search/labs-catalogue-aggr',
				prefixQueryFields: this.props.config.getStringFields(),
				dateFields: this.props.config.getDateFields(),
				facets: this.props.config.getFacets(),
			}
			childrenWithProps = React.Children.map(this.props.children,
				(child) => React.cloneElement(child, config)//this.state.componentConfig
			);
		}
		return (
			<FlexBox title="Component info">
				<div className={IDUtil.cssClassName('flex-component-info')}>
					<table className="table table-condensed">
						<tbody>
						<tr>
							<th scope="row">Composed based on these components: </th>
							<td>{this.toList(this.props.consistsOf) || '-'}</td>
						</tr>
						<tr>
							<th scope="row">Required input:</th>
							<td>{this.props.input || '-'}</td>
						</tr>
						<tr>
							<th scope="row">Generates output:</th>
							<td>{this.props.output || '-'}</td>
						</tr>
						<tr>
							<th scope="row">Components that generate the required input: </th>
							<td>{this.toList(this.props.inputComponents) || 'N/A'}</td>
						</tr>
						<tr>
							<th scope="row">Components that support the generated output: </th>
							<td>{this.toList(this.props.outputComponents) || 'N/A'}</td>
						</tr>
						<tr>
							<th scope="row">Current input:</th>
							<td>{this.toList(this.props.currentInput) || 'N/A'}</td>
						</tr>
						<tr>
							<th scope="row">Current configuration:</th>
							<td>{this.toList(this.props.config) || 'N/A'}</td>
						</tr>
						</tbody>
					</table>
					{childrenWithProps ? childrenWithProps : this.props.children}
				</div>
			</FlexBox>
		)
	}
}

export default FlexComponentInfo;