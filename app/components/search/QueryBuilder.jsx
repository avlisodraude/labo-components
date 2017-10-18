import SearchAPI from '../../api/SearchAPI';

//data utilities
import CollectionUtil from '../../util/CollectionUtil';
import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';
import IDUtil from '../../util/IDUtil';
import TimeUtil from '../../util/TimeUtil';

//ui controls for assembling queries
import FieldCategorySelector from './FieldCategorySelector';
import DateRangeSelector from './DateRangeSelector';
import AggregationBox from './AggregationBox';
import AggregationList from './AggregationList';
import Histogram from '../stats/Histogram';
import CollectionConfig from '../../collection/mappings/CollectionConfig';
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
			searchLayers : this.getInitialSearchLayers(this.props.collectionConfig),
			displayFacets : this.props.collectionConfig.facets ? true : false,
			aggregations : {},
			selectedFacets : this.props.searchParams ? this.props.searchParams.selectedFacets : {},
			desiredFacets : this.props.collectionConfig.getFacets(),
			selectedDateRange : this.getInitialDateRange(this.props.collectionConfig),
			fieldCategory : this.props.searchParams ? this.props.searchParams.fieldCategory : null,
			selectedSortParams : this.getInitialSortParams(this.props.collectionConfig),
			currentPage : -1,
            currentCollectionHits: this.getCollectionHits(this.props.collectionConfig),
            isSearching : false
        }
        this.CLASS_PREFIX = 'qb';
	}

	/*---------------------------------- COMPONENT INIT --------------------------------------*/

	//TODO also provide an option to directly pass a config, this is pretty annoying with respect to reusability
	componentDidMount() {
		//do an initial search in case there are search params in the URL
        if(this.props.searchParams && this.refs.searchTerm) {
			this.refs.searchTerm.value = this.props.searchParams.searchTerm;
			this.doSearch([
				this.props.queryId,
				this.props.collectionConfig,
				this.state.searchLayers,
				this.props.searchParams.searchTerm,
				this.state.fieldCategory,
				this.state.desiredFacets,
				this.state.selectedFacets,
				this.state.selectedDateRange,
				this.state.selectedSortParams,
				this.props.searchParams.from,
				this.props.searchParams.pageSize,
				this.onOutput.bind(this),
				false
			]);
		}
		//make sure the search is done again when flipping back through the history (a bit weird, but it seems ok for now)
		//TODO make sure how the browse history works outside of the recipes
		if(this.props.searchParams) {
			window.onpopstate = function(event) {
	  			document.location.href=document.location;
			};
		}
	}

	//checks the initial sort params based on the URL params and the config (called only by the constructor)
	getInitialSortParams() {
		let sortParams = {
			field : '_score',
			order : 'desc'
		}
		if(this.props.searchParams && this.props.searchParams.sortParams) {
			sortParams = this.props.searchParams.sortParams;
		}
		return sortParams;
	}

	//checks the search layers based on the URL params and the config (called only by the constructor)
	getInitialSearchLayers(config) {
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
		return searchLayers;
	}

	//determine the initial date range based on the URL params and config (called only by the constructor)
	getInitialDateRange() {
		let selectedDateRange = {
			field : this.props.collectionConfig.getPreferredDateField(),
			start : null,
			end : null
		}
		if(this.props.searchParams && this.props.searchParams.dateRange) {
			selectedDateRange= this.props.searchParams.dateRange;
		}
		return selectedDateRange;
	}

	//called by the constructor once to get the amount of documents in the entire collection
	getCollectionHits(config) {
		let collectionHits = -1;
		if(config && config.collectionStats) {
			let stats = config.collectionStats;
			if(stats && stats.collection_statistics && stats.collection_statistics.document_types) {
				let docTypes = stats.collection_statistics.document_types;
				if(docTypes.length > 0) {
					collectionHits = docTypes[0].doc_count;
				}
			}
		}
		return collectionHits;
	}

	/*---------------------------------- SEARCH --------------------------------------*/

	doSearch(args) {
		this.setState(
			{
				isSearching : true
			},
			SearchAPI.search(...args)
		)
	}

	//this resets the paging
	newSearch(e) {
		if(e) {
			e.preventDefault();
		}
		//reset the date range
		const dr = this.state.selectedDateRange;
		if(dr) {
			dr.start = null;
			dr.end = null;
		}
		this.setState(
			{
				selectedFacets : {},
				fieldCategory : null,
				selectedDateRange : dr
			},
			this.doSearch([
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
			])
		)
	}

	//this resets the paging
	toggleSearchLayer(e) {
		const searchLayers = this.state.searchLayers;
		searchLayers[e.target.id] = !searchLayers[e.target.id];
		this.setState(
			{searchLayers : searchLayers},
			this.doSearch([
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
			])
		);
	}

	/*---------------------------------- FUNCTION THAT RECEIVES DATA FROM CHILD COMPONENTS --------------------------------------*/

	onComponentOutput(componentClass, data) {
		if(componentClass == 'AggregationList' || componentClass == 'AggregationBox') {
			//TODO update the selected facets
			this.setState(
				{selectedFacets : data.selectedFacets, desiredFacets : data.desiredFacets},
				this.doSearch([
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
				])
			)
		} else if(componentClass == 'DateRangeSelector') {
			const df = this.state.desiredFacets;
			if(this.state.selectedDateRange) {

				//first check if the date field has changed for updating the desiredFacet
				if(this.state.selectedDateRange.field != data.field) {
					let index = 0;
					for(let i=0;i<df.length;i++) {
						if(df[i].type == 'date_histogram') {
							index = i;
							break;
						}
					}
					//update the desired date aggregation (of the type date_histogram)
					df.splice(index,1);
					df.push({
						field: data.field,
						title : this.props.collectionConfig.toPrettyFieldName(data.field),
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
					this.doSearch([
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
					])
				)
			} else {
				console.debug('this is not supposed to happen! (no date range...)');
			}
		} else if(componentClass == 'FieldCategorySelector') {
			this.setState(
				{
					fieldCategory : data
				},
				this.doSearch([
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
				])
			)
		}
	}

	/*---------------------------------- FUNCTIONS THAT COMMINICATE TO THE PARENT --------------------------------------*/

	//this function is piped back to the owner via onOutput()
	gotoPage(pageNumber) {
		this.doSearch([
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
		])
	}

	//this function is piped back to the owner via onOutput()
	sortResults(sortParams) {
		this.doSearch([
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
		])
	}

	resetDateRange() {
		this.setState({
			selectedDateRange : {
				field : this.props.collectionConfig.getPreferredDateField(),
				start : null,
				end : null
			}
		},
		this.doSearch([
			this.props.queryId,
			this.props.collectionConfig,
			this.state.searchLayers,
			this.refs.searchTerm.value,
			this.state.fieldCategory,
			this.state.desiredFacets,
			this.state.selectedFacets,
			null, //reset the date range
			this.state.selectedSortParams,
			0,
			this.props.pageSize,
			this.onOutput.bind(this),
			true
		]))
	}

    // Returns the total amount of 'aggregations' per date field selected
    totalNumberByDateField(data) {
        let bucketCounts = 0;
        /*
        if(data.aggregations && data.aggregations[data.dateField]) {
        	bucketCounts = data.aggregations[data.dateField].map(x => x.doc_count).filter(x => x != null);
        	if(bucketCounts.length > 0 ) {
	        	return bucketCounts.reduce(function(accumulator, currentValue) {
	                return accumulator + currentValue;
	            });
	        }
        }*/
        return bucketCounts;
    }

    //communicates all that is required for a parent component to draw hits & statistics
    onOutput(data) {
        //this propagates the query output back to the recipe, who will delegate it further to any configured visualisation
        if (this.props.onOutput) {
            this.props.onOutput(this.constructor.name, data);
        }

        if (data && !data.error) {
            this.setState({
                aggregations: data.aggregations, //for drawing the AggregationBox/List
                totalHits: data.totalHits, //shown in the stats
                totalUniqueHits: data.totalUniqueHits, //shown in the stats
                currentPage: data.currentPage, //remembering the page we're at
                selectedSortParams: data.params.sort, //remembering the sort settings
                searchId: data.searchId, //so involved components know that a new search was done
                hitsBasedOnDateField: this.totalNumberByDateField(data) || 0,
                isSearching: false
            });
        } else {
            this.setState({
                aggregations: null,
                totalHits: 0,
                totalUniqueHits: 0,
                currentPage: -1,
                searchId: null,
                isSearching: false
            });
        }

        if(data && data.error == 'access denied') {
        	alert('The system is not allowed to search through this collection');
        }
    }

    render() {
        if (this.props.collectionConfig) {
            let heading = null;
            let searchIcon = null;
            let layerOptions = null;
            let resultBlock = null;
            let fieldCategorySelector = null;
            let currentCollectionTitle = this.props.collectionConfig.collectionId;
            let histo = null;

            //collectionInfo comes from CKAN, which can be empty
            if(this.props.collectionConfig.collectionInfo) {
            	currentCollectionTitle = this.props.collectionConfig.collectionInfo.title || null;
            }

            if (this.props.header) {
                heading = (<div>
                        <h3>Searching in :&nbsp;{currentCollectionTitle}</h3>
                        <h4>Total amount of records in this collection: {this.state.currentCollectionHits}</h4>
                    </div>
                )
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
				const layers = Object.keys(this.state.searchLayers).map((layer, index) => {
					return (
						<label key={'layer__' + index} className="checkbox-inline">
							<input id={layer} type="checkbox" checked={this.state.searchLayers[layer]}
								onChange={this.toggleSearchLayer.bind(this)}/>
								{CollectionUtil.getSearchLayerName(this.props.collectionConfig.getSearchIndex(), layer)}
						</label>
					)
				})
				// Hide collection metada tickbox from current search interface.
				//https://github.com/CLARIAH/wp5_mediasuite/issues/130
				// it could be enabled once we have more options to provide.
				// if(layers) {
				// 	layerOptions = (
				// 		<div className={IDUtil.cssClassName('search-layers', this.CLASS_PREFIX)}>
				// 			{layers}
				// 		</div>
				// 	)
				// }
			}

			//only draw this when there are search results
			if(this.state.totalHits > 0) {
				let resultStats = null;
				let aggrView = null; //either a box or list (TODO the list might not work properly anymore!)
				let aggregationBox = null;
				let dateRangeSelector = null;
				let dateRangeCrumb = null;
                let visualisation = null;

                //let countsBasedOnDateRange = null;
                let currentSearchTerm = this.refs.searchTerm.value || null;

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

					// Display the histogram only if an option other than the default is selected
					// and the length of the data is greater than 0.
					 if (this.state.selectedDateRange.field !== 'null_option'  &&
						 this.state.aggregations[this.state.selectedDateRange.field] !== undefined &&
                         this.state.aggregations[this.state.selectedDateRange.field].length !== 0) {

                        histo = (
							<Histogram
								queryId={this.props.queryId}
								data={this.state.aggregations[this.state.selectedDateRange.field]}
								title={this.props.collectionConfig.toPrettyFieldName(this.state.selectedDateRange.field)}
								searchId={this.state.searchId}/>
                        )
                     } else {
                         //if there is no data found within the desired aggregation/facet
                         if (this.state.aggregations[this.state.selectedDateRange.field] !== undefined &&
                             this.state.aggregations[this.state.selectedDateRange.field].length === 0 &&
                             this.state.selectedDateRange.field !== 'null_option') {

                             visualisation = (
								 <div>
									 <br/>
									 <div className="alert alert-danger">No data found for this Date Type Field</div>
								 </div>
                             )
                         }
					 }

                    //FIXME it will disappear when there are no results!
                    if (this.props.dateRangeSelector && this.state.selectedDateRange) {
                        //let selectedDateField = null;
                        //let info = null;
                        if(this.state.selectedDateRange.field) {
	                        /*selectedDateField = this.props.collectionConfig.toPrettyFieldName(
	                        	this.state.selectedDateRange.field
	                        )
	                        info = 'Selected date field: "' + selectedDateField + '"';
	                        let tmp = []
	                        if(this.state.selectedDateRange.start) {
	                        	tmp.push(TimeUtil.UNIXTimeToPrettyDate(this.state.selectedDateRange.start));
	                        }
	                        if(this.state.selectedDateRange.end) {
	                        	tmp.push(TimeUtil.UNIXTimeToPrettyDate(this.state.selectedDateRange.end));
	                        }
	                        if(tmp.length > 0) {
	                        	info += '\nSelected date range: ' + tmp.join(' - ');
	                        }
	                        countsBasedOnDateRange = (
	                        	<li>
	                        		{this.state.hitsBasedOnDateField} hits based on your
	                        		<span className="tooltip-info" title={info}>
	                        			&nbsp;current selection
	                        		</span>
	                        	</li>
	                        )*/
	                    }

	                    if(this.state.selectedDateRange.start || this.state.selectedDateRange.end) {
	                    	let info = '';
	                    	let tmp = []
	                        if(this.state.selectedDateRange.start) {
	                        	tmp.push(TimeUtil.UNIXTimeToPrettyDate(this.state.selectedDateRange.start));
	                        } else {
	                        	tmp.push('everything before');
	                        }
	                        if(this.state.selectedDateRange.end) {
	                        	tmp.push(TimeUtil.UNIXTimeToPrettyDate(this.state.selectedDateRange.end));
	                        } else {
	                        	tmp.push('up until now');
	                        }
	                        if(tmp.length > 0) {
	                        	info = tmp.join(' - ');
	                        	info += ' (using: '+this.state.selectedDateRange.field+')';
	                        }
	                    	dateRangeCrumb = (
	                    		<div className={IDUtil.cssClassName('breadcrumbs', this.CLASS_PREFIX)}>
									<div key="date_crumb" className={IDUtil.cssClassName('crumb', this.CLASS_PREFIX)}
										title="current date range">
										<em>Selected date range:&nbsp;</em>
										{info}
										&nbsp;
										<i className="fa fa-close" onClick={this.resetDateRange.bind(this)}></i>
									</div>
								</div>
	                    	)
	                    }

                        dateRangeSelector = (
                            <DateRangeSelector
                            	queryId={this.props.queryId} //used for the guid (is it still needed?)
                                searchId={this.state.searchId} //for determining when the component should rerender
                                collectionConfig={this.props.collectionConfig} //for determining available date fields & aggregations
                                dateRange={this.state.selectedDateRange} //for activating the selected date field
                                aggregations={this.state.aggregations} //to fetch the date aggregations
                                onOutput={this.onComponentOutput.bind(this)} //for communicating output to the  parent component
                            />
                        );
                    }
                }

                //populate the result stats
                resultStats = (
                    <div>
                        <div>
                            Total number of results based on <em>"{currentSearchTerm}"</em>
                            and selected filters: <b>{this.state.totalHits}</b>
                        </div>
                    </div>
                );

				resultBlock = (
					<div>
						{resultStats}
						<div className="separator"></div>
						{dateRangeCrumb}
						<div className="row">
							<div className="col-md-12">
								{dateRangeSelector}
								{histo}
                                {visualisation}
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

			//determine which icon to show after the search input
			if(this.state.isSearching) {
				searchIcon = (<span className="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>)
			} else {
				searchIcon = (<i className="fa fa-search"></i>)
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
											<span className="input-group-addon btn-effect" onClick={this.newSearch.bind(this)}>
												{searchIcon}
											</span>
										</div>
									</div>
									<div className="col-sm-6">
										{fieldCategorySelector}
									</div>
								</div>
							</form>
						</div>
					</div>
					{/*{layerOptions}*/}
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