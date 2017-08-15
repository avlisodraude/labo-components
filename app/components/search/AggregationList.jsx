import IDUtil from '../../util/IDUtil';
import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';

//this component draws the aggregations (a.k.a. facets) and merely outputs the user selections to the parent component
class AggregationList extends React.Component {
	constructor(props) {
		super(props);
		this.CLASS_PREFIX = 'agl';
	}

	//communicates the selected facets back to the parent component
	//TODO update later!!
	onOutput(e) {
		const facets = this.props.selectedFacets;
		if(facets[e.target.id]) {
			delete facets[e.target.id];
		} else {
			facets[e.target.id] = true;
		}

		//output to the parent component
		if(this.props.onOutput) {
			this.props.onOutput(
				this.constructor.name,
				ElasticsearchDataUtil.formatSelectedFacets(facets) //format suitable for the query object consumed by the Search API
			)
		}
	}

	//now all types of aggregations are drawn as simple lists of checkboxes. This should be updated
	render() {
		const facets = [];
		Object.keys(this.props.aggregations).forEach((key, index) => {
			const options = this.props.aggregations[key].map((facet, fIndex) => {
				const value = facet.date_millis ? facet.date_millis : facet.key
				const facetId = key + '|' + value;
				return (
					<li key={'facet__' + index + '__' + fIndex}
						className={IDUtil.cssClassName('facet-item', this.CLASS_PREFIX)}>
						<div className="checkbox inline">
							<label>
								<input id={facetId}
									type="checkbox"
									checked={this.props.selectedFacets[facetId] ? true : false}
									onChange={this.onOutput.bind(this)}/>
									{facet.key}&nbsp;({facet.doc_count})
							</label>
						</div>
					</li>
				)
			});
			if(options.length > 0) {
				facets.push((
					<div key={'facet__' + index}>
						<h5>{ElasticsearchDataUtil.getAggregationTitle(key, this.props.facets)}</h5>
						<ul className={IDUtil.cssClassName('facet-group', this.CLASS_PREFIX)}>
							{options}
						</ul>
					</div>
				))
			}
		});

		return (
			<div className={IDUtil.cssClassName('aggregation-list')}>
				{facets}
			</div>
		)
	}
}

export default AggregationList;