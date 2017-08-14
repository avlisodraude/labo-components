import SearchAPI from '../../api/SearchAPI';

//data utilities
import CollectionUtil from '../../util/CollectionUtil';
import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';
import IDUtil from '../../util/IDUtil';

//ui controls for assembling queries
import FieldCategorySelector from './FieldCategorySelector';
import DateRangeSelector from './DateRangeSelector';
import AggregationBox from './AggregationBox';
import AggregationList from './AggregationList';

/*
Notes about this component:

- Now this component ONLY takes care of forming a query and running it against the Search API (no search results are shown anymore)
- Ties in with SearchAPI.fragmentSearch, which in turn uses the multi-layered search endpoint of the search API
- Next to faceting, this component enables selecting different layers of annotations tied to a single collection


INPUT:
	queryId: 					To identify the unique output of this component
	user: 						Authenticated user
	collection: 				collection ID
	pageSize: 					page size for the query to be formed
	header:						Show header with collection name: yes/no
	searchAPI: 					The search API instance to call
	aggregationView: 			Show aggregations as a list or a box
	dateRangeSelector:  		Show a date/time range selector for forming date range queries
	searchParams: 				Provided initial search parameters to form the initial query
	onOutput: 					Function to call when generating output

OUTPUT:
	data.queryId: 				Unique GUID related to the complete output of this component
	data.searchId: 				Unique GUID, the owner can use for its rendering strategy
	data.collectionId: 			The collection ID

	data.dateField: 			The currently selected date field
	data.sortParams: 			The currently selected sorting mode (field name + asc/desc)
	data.searchTerm: 			The search term that was entered
	data.currentPage: 			The current page number

	data.sortResults: 			Sorting function for owning component
	data.gotoPage: 				Paging function for owning component

	data.collectionConfig: 		The collection config that was loaded right after mounting this component

*/

class QueryBuilder extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			searchLayers : null, //filled in onLoadCollectionConfig()
			displayFacets : false, //filled in onLoadCollectionConfig()
			aggregations : {},
			selectedFacets : this.props.searchParams ? this.props.searchParams.selectedFacets : {},
			desiredFacets : null, //these will now be more dynamic than just taken from a config!
			selectedDateRange : null,
			fieldCategory : this.props.searchParams ? this.props.searchParams.fieldCategory : null,
			currentPage : -1
		}
		this.CLASS_PREFIX = 'qb'
	}

	/*---------------------------------- COMPONENT INIT --------------------------------------*/

	//TODO also provide an option to directly pass a config, this is pretty annoying with respect to reusability
	componentDidMount() {
		this.init(this.props.collectionConfig);
		//make sure the search is done again when flipping back through the history (a bit weird, but it seems ok for now)
		//TODO make sure how the browse history works outside of the recipes
		if(this.props.searchParams) {
			window.onpopstate = function(event) {
	  			//console.debug("location: " + document.location + ", state: " + JSON.stringify(event.state));
	  			document.location.href=document.location;
			};
		}
	}

	//TODO
	init(config) {
		let searchLayers = null;
		if(config.getCollectionIndices()) {
			searchLayers = {};
			config.getCollectionIndices().forEach((layer) => {
				if(this.props.searchParams && this.props.searchParams.layers && this.props.searchParams.layers.length > 0) {
					searchLayers[layer] = this.props.searchParams.layers.indexOf(layer) != -1;
				} else {
					searchLayers[layer] = true;
				}
			});
		}
		//TODO setting the state here is a bit weird. Let's redo this by looking at the URL params first
		this.setState({
			searchLayers: searchLayers,
			desiredFacets : config.getFacets(),
			displayFacets: config.facets ? true : false,
			selectedDateRange : {
				field : config.getPreferredDateField(),
				start : -1,
				end : -1
			},
			selectedSortParams : {
				field : '_score',
				order : 'desc'
			} //by default sort by relevance
		}, () => {
			//do an initial search (only if there is a search term or a facet selected)
			if(this.props.searchParams && this.refs.searchTerm) {
				this.refs.searchTerm.value = this.props.searchParams.searchTerm;
				SearchAPI.search(
					this.props.queryId,
					this.props.collectionConfig,
					this.state.searchLayers,
					this.props.searchParams.searchTerm,
					this.props.fieldCategory,
					this.state.desiredFacets,
					this.props.searchParams.selectedFacets,
					this.props.searchParams.dateRange,
					this.props.searchParams.sortParams,
					this.props.searchParams.from,
					this.props.searchParams.pageSize,
					this.onOutput.bind(this),
					false
				);
			}
		});
	}

	/*---------------------------------- SEARCH --------------------------------------*/

	//this resets the paging
	newSearch(e) {
		if(e) {
			e.preventDefault();
		}
		//reset the date range
		let dr = this.state.selectedDateRange;
		if(dr) {
			dr.start = -1;
			dr.end = -1;
		}
		this.setState(
			{
				selectedFacets : {},
				fieldCategory : null,
				selectedDateRange : {
					field : dr.field, //reset the range, but keep the date field selected
					start : -1,
					end : -1
				}
			},
			SearchAPI.search(
				this.props.queryId,
				this.props.collectionConfig,
				this.state.searchLayers,
				this.refs.searchTerm.value,
				this.state.fieldCategory,
				this.state.desiredFacets,
				{}, //no selected facets
				null, //no date range selected
				this.state.selectedSortParams,
				0, //offset zero, start on the first page
				this.props.pageSize,
				this.onOutput.bind(this),
				true
			)
		)
	}

	//this resets the paging
	toggleSearchLayer(e) {
		let searchLayers = this.state.searchLayers;
		searchLayers[e.target.id] = !searchLayers[e.target.id];
		this.setState(
			{searchLayers : searchLayers},
			SearchAPI.search(
				this.props.queryId,
				this.props.collectionConfig,
				searchLayers,
				this.refs.searchTerm.value,
				this.state.fieldCategory,
				this.state.desiredFacets,
				this.state.selectedFacets, //no selected facets
				this.state.selectedDateRange, //no date range selected
				this.state.selectedSortParams,
				0, //offset zero, start on the first page
				this.props.pageSize,
				this.onOutput.bind(this),
				true
			)
		);
	}

	/*---------------------------------- FUNCTION THAT RECEIVES DATA FROM CHILD COMPONENTS --------------------------------------*/

	onComponentOutput(componentClass, data) {
		if(componentClass == 'AggregationList' || componentClass == 'AggregationBox') {
			//TODO update the selected facets
			this.setState(
				{selectedFacets : data.selectedFacets, desiredFacets : data.desiredFacets},
				SearchAPI.search(
					this.props.queryId,
					this.props.collectionConfig,
					this.state.searchLayers,
					this.refs.searchTerm.value,
					this.state.fieldCategory,
					data.desiredFacets, //use the just obtained data for the desired facets
					data.selectedFacets, //use the just obtained data for the selected facets
					this.state.selectedDateRange, //no date range selected
					this.state.selectedSortParams,
					0, //offset zero, start on the first page
					this.props.pageSize,
					this.onOutput.bind(this),
					true
				)
			)
		} else if(componentClass == 'DateRangeSelector') {
			let df = this.state.desiredFacets;
			if(this.state.selectedDateRange) {

				//first check if the date field has changed for updating the desiredFacet
				if(this.state.selectedDateRange.field != data.field) {
					let index = 0;
					for(var i=0;i<df.length;i++) {
						if(df[i].type == 'date_histogram') {
							index = i;
							break;
						}
					}
					//update the desired date aggregation (of the type date_histogram)
					df.splice(index,1);
					df.push({
						field: data.field,
						title : ElasticsearchDataUtil.toPrettyFieldName(data.field),
						id : data.field,
						operator : 'AND',
						size : 10,
						type : 'date_histogram',
						display: true
					});
				}

				//do a new query based on the datefield and date range
				this.setState(
					{
						desiredFacets : df,
						selectedDateRange : data
					},
					SearchAPI.search(
						this.props.queryId,
						this.props.collectionConfig,
						this.state.searchLayers,
						this.refs.searchTerm.value,
						this.state.fieldCategory,
						df, //make sure to use the just obtained desired facets
						this.state.selectedFacets,
						data, //use the just obtained data as the date range
						this.state.selectedSortParams,
						0, //offset zero, start on the first page
						this.props.pageSize,
						this.onOutput.bind(this),
						true
					)
				)
			} else {
				console.debug('this is not supposed to happen! (no date range...)');
			}
		} else if(componentClass == 'FieldCategorySelector') {
			this.setState(
				{
					fieldCategory : data
				},
				SearchAPI.search(
					this.props.queryId,
					this.props.collectionConfig,
					this.state.searchLayers,
					this.refs.searchTerm.value,
					data,
					this.state.desiredFacets,
					this.state.selectedFacets,
					this.state.selectedDateRange,
					this.state.selectedSortParams,
					0, //offset zero, start on the first page
					this.props.pageSize,
					this.onOutput.bind(this),
					true
				)
			)
		}
	}

	/*---------------------------------- FUNCTIONS THAT COMMINICATE TO THE PARENT --------------------------------------*/

	//this function is piped back to the owner via onOutput()
	gotoPage(pageNumber) {
		SearchAPI.search(
			this.props.queryId,
			this.props.collectionConfig,
			this.state.searchLayers,
			this.refs.searchTerm.value,
			this.state.fieldCategory,
			this.state.desiredFacets,
			this.state.selectedFacets,
			this.state.selectedDateRange,
			this.state.selectedSortParams,
			(pageNumber-1) * this.props.pageSize, //adjust the offset to reflect the intended page
			this.props.pageSize,
			this.onOutput.bind(this),
			true
		)
	}

	//this function is piped back to the owner via onOutput()
	sortResults(sortParams) {
		SearchAPI.search(
			this.props.queryId,
			this.props.collectionConfig,
			this.state.searchLayers,
			this.refs.searchTerm.value,
			this.state.fieldCategory,
			this.state.desiredFacets,
			this.state.selectedFacets,
			this.state.selectedDateRange,
			sortParams, //use the new sort params
			0,
			this.props.pageSize,
			this.onOutput.bind(this),
			true
		)
	}

	//communicates all that is required for a parent component to draw hits & statistics
	onOutput(data) {
		//this propagates the query output back to the recipe, who will delegate it further to any configured visualisation
		if(this.props.onOutput) {
	  		this.props.onOutput(this.constructor.name, data);
		}
		if(data) {
			this.setState({
				aggregations : data.aggregations, //for drawing the AggregationBox/List
				totalHits : data.totalHits, //shown in the stats
				totalUniqueHits : data.totalUniqueHits, //shown in the stats
				currentPage : data.currentPage, //remembering the page we're at
				selectedSortParams : data.params.sort, //remembering the sort settings
				searchId : data.searchId //so involved components know that a new search was done
			});
		} else {
			this.setState({
				aggregations : null,
				totalHits : 0,
				totalUniqueHits : 0,
				currentPage : -1,
				searchId : null
			});
		}
	}

	render() {
		if(this.props.collectionConfig) {
			let heading = null;
			let layerOptions = null;
			let resultBlock = null;
			let fieldCategorySelector = null;

			//draw a heading with the name of the collection (if configured that way)
			if(this.props.header) {
				heading = (<h3>Search through:&nbsp;{this.props.collectionConfig.getSearchIndex()}</h3>)
			}

			//draw the field category selector
			fieldCategorySelector = (
				<FieldCategorySelector
					fieldCategory={this.state.fieldCategory}
					collectionConfig={this.props.collectionConfig}
					onOutput={this.onComponentOutput.bind(this)}
				/>
			)

			//draw the checkboxes for selecting layers
			if(this.state.searchLayers) {
				let layers = Object.keys(this.state.searchLayers).map((layer, index) => {
					return (
						<label key={'layer__' + index} className="checkbox-inline">
							<input id={layer} type="checkbox" checked={this.state.searchLayers[layer]}
								onChange={this.toggleSearchLayer.bind(this)}/>
								{CollectionUtil.getSearchLayerName(this.props.collectionConfig.getSearchIndex(), layer)}
						</label>
					)
				})
				if(layers) {
					layerOptions = (
						<div className={IDUtil.cssClassName('search-layers', this.CLASS_PREFIX)}>
							{layers}
						</div>
					)
				}
			}

			//only draw this when there are search results
			if(this.state.totalHits > 0) {
				let resultStats = null;
				let aggrView = null; //either a box or list (TODO the list might not work properly anymore!)
				let aggregationBox = null;
				let dateRangeSelector = null;

				//populate the aggregation/facet selection area/box
				if(this.state.aggregations) {
					if(this.props.aggregationView == 'box') {
						aggrView = (
							<AggregationBox
								queryId={this.props.queryId}
								aggregations={this.state.aggregations} //part of the search results
								desiredFacets={this.state.desiredFacets} //as obtained from the collection config
								selectedFacets={this.state.selectedFacets} //via AggregationBox or AggregationList
								collectionConfig={this.props.collectionConfig} //for the aggregation creator only
								searchId={this.state.searchId} //for determining when the component should rerender
								onOutput={this.onComponentOutput.bind(this)} //for communicating output to the  parent component
								/>
						)
					} else { //just show them as a conservative list
						aggrView = (
							<AggregationList
								queryId={this.props.queryId} //TODO implement in the list component
								aggregations={this.state.aggregations} //part of the search results
								facets={this.state.desiredFacets} //as obtained from the collection config
								selectedFacets={this.state.selectedFacets} //via AggregationBox or AggregationList
								onOutput={this.onComponentOutput.bind(this)} //for communicating output to the  parent component
								/>
						)
					}


					if(aggrView) {
						aggregationBox = (
							<div className="row">
								<div className="col-md-12">
									{aggrView}
								</div>
							</div>
						)
					}

					//draw the time slider
					//FIXME it will disappear when there are no results!
					if(this.props.dateRangeSelector && this.state.selectedDateRange) {
						console.debug(this.state.selectedDateRange);
						dateRangeSelector = (
							<DateRangeSelector
								queryId={this.props.queryId}
								searchId={this.state.searchId} //for determining when the component should rerender
								collection={this.props.collectionConfig.getSearchIndex()} //for creating a guid
								collectionConfig={this.props.collectionConfig} //for determining available date fields & aggregations
								dateRange={this.state.selectedDateRange} //for activating the selected date field
								selectorType={this.props.dateRangeSelector} //the type of selector: a slider or two date pickers
								aggregations={this.state.aggregations} //to fetch the date aggregations
								onOutput={this.onComponentOutput.bind(this)} //for communicating output to the  parent component
							/>
						);
					}
				}

				//populate the result stats
				resultStats = (<h6>Found media objects: {this.state.totalHits}</h6>);

				resultBlock = (
					<div>
						{resultStats}
						<div className="separator"></div>
						<div className="row">
							<div className="col-md-12">
								{dateRangeSelector}
							</div>
						</div>
						<div className="separator"></div>
						<div className="separator"></div>
						<div>
							<div className="col-md-12">
								{aggregationBox}
								<br/>
							</div>
						</div>
					</div>
				)
			} else if(this.state.searchId != null) {
				resultBlock = (
					<div className="alert alert-danger">No results found</div>
				)
			}

			//render the stuff on screen
			return (
				<div className={IDUtil.cssClassName('query-builder')}>
					{heading}
					<div className="separator"></div>
					<div className="row">
						<div className="col-md-12">
							<form className="form-horizontal" onSubmit={this.newSearch.bind(this)}>
								<div className="form-group">
									<div className="col-sm-6">
										<div className="input-group">
											<input type="text" className="form-control"
												id="search_term" ref="searchTerm" placeholder="Search"/>
											<span className="input-group-addon"><i className="fa fa-search"></i></span>
										</div>
									</div>
									<div className="col-sm-6">
										{fieldCategorySelector}
									</div>
								</div>
							</form>
						</div>
					</div>
					<div className="separator"></div>
					{layerOptions}
					<div className="separator"></div>
					{resultBlock}
				</div>
			)
		} else {
			return (<div>Loading collection configuration...</div>);
		}

	}

}

export default QueryBuilder;