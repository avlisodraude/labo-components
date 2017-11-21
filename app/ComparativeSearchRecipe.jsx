import QueryFactory from './components/search/QueryFactory';

import SearchAPI from './api/SearchAPI';

import FlexBox from './components/FlexBox';
import SearchHit from './components/search/SearchHit';
import Paging from './components/search/Paging';
import Sorting from './components/search/Sorting';

import IDUtil from './util/IDUtil';
import ElasticsearchDataUtil from './util/ElasticsearchDataUtil';
import QueryComparisonLineChart from './components/stats/QueryComparisonLineChart';

/*
Notes about this component:

- Top component receiving the URL parameters
- Generates search components based on the configured search recipe
- Passes the URL parameters to search components, who already have implemented the search history
	- Each search component (e.g. facet search, fragment search) implements its own way of persisting search history
- FIXME temporarily draws an 'Export' button that hooks up to the annotation export functionality of the recipe
	- This should be in the user space
- Holds the annotation box that can be triggered from underlying (search) components
- Holds the line chart that can be triggered from underlying components
*/

class ComparativeSearchRecipe extends React.Component {
	constructor(props) {
		super(props);
		let collections = null;
		if(this.props.params.cids) {
			collections = this.props.params.cids.split(',');
		} else if(this.props.recipe.ingredients.collections) {
			collections = this.props.recipe.ingredients.collections;
		}
		this.state = {
			user : this.props.user || {id : 'testuser', name : 'Test user', attributes : []},
			lineChartData: {},
			collections : collections,
			pageSize : 10,
			combinedSearchResults : {}
		};
	}

	//this function receives all output of components that generate output and orchestrates where
	//to pass it to based on the ingredients of the recipe
	//TODO change this, so it knows what to do based on the recipe
	onComponentOutput(componentClass, data) {
		if(componentClass == 'QueryFactory') {
			this.onSearched(data);
		}
	}

	onSearched(data) {
		if(!data) { //if there are no results
			alert('Your query did not yield any results');
		} else if(data.pagingOutOfBounds) { //due to ES limitations
			alert('The last page cannot be retrieved, please refine your search');
		} else { //there is a normal response from the search API
			const csr = this.state.combinedSearchResults;
			const lineChartData = this.state.lineChartData;
			if(!data.deleted) {
				const newData = ElasticsearchDataUtil.searchResultsToTimeLineData(data);
				if(newData) {
					//TODO add more information about the query
					lineChartData[data.queryId] = {
						label : 'Query #', //+ Object.keys(lineChartData).length,
					 	dateField : data.dateField,
					 	prettyQuery : ElasticsearchDataUtil.toPrettyQuery(data.params),
					 	data : newData,
					 	queryId : data.queryId
					}
				}
				csr[data.queryId] = data;
			} else { //the query factory deleted a query
				delete csr[data.queryId];
				delete lineChartData[data.queryId];
			}
			this.setState({
				combinedSearchResults : csr,
				lineChartData : lineChartData,
				comparisonId : IDUtil.guid() //for updating the line chart
			});
		}
	}

	//TODO move this stuff to some utility that can transform query data in other formats suitable for other components
	//The timeline is drawn based on the configured date field facet
	prepareTimeline(queryId, queryOutput, dateField) {
		const timelineData = [];
		for (const key in queryOutput.aggregations) {
			if (key.indexOf(dateField) != -1) {
				const buckets = queryOutput.aggregations[key][dateField].buckets;
				buckets.forEach((bucket) => {
					const year = parseInt(bucket.key);
					if (!(isNaN(year))) {
						timelineData.push({"year": year, "count": bucket.doc_count, "query": queryId});
					}
				});
			}
		}
		return timelineData;
	}

	/* ------------------------------------------------------------------------------
	------------------------------- SEARCH RELATED FUNCTIONS --------------------
	------------------------------------------------------------------------------- */

	//TODO figure out how to call this without needing the QueryBuilder
	gotoPage(queryId, pageNumber) {
		if(this.state.combinedSearchResults[queryId]) {
			const sr = this.state.combinedSearchResults[queryId];
			SearchAPI.search(
				queryId,
				sr.collectionConfig,
				sr.params.searchLayers,
				sr.params.term,
				sr.params.fieldCategory,
				sr.params.desiredFacets,
				sr.params.selectedFacets,
				sr.params.dateRange,
				sr.params.sort,
				(pageNumber-1) * this.state.pageSize, //adjust the offset to reflect the intended page
				this.state.pageSize,
				this.onSearched.bind(this),
				false
			)
		}
	}

	sortResults(queryId, sortParams) {
		if(this.state.combinedSearchResults[queryId]) {
			const sr = this.state.combinedSearchResults[queryId];
			SearchAPI.search(
				queryId,
				sr.collectionConfig,
				sr.params.searchLayers,
				sr.params.term,
				sr.params.fieldCategory,
				sr.params.desiredFacets,
				sr.params.selectedFacets,
				sr.params.dateRange,
				sortParams, //use the new sort params
				0,
				this.state.pageSize,
				this.onSearched.bind(this),
				false
			)
		}
	}

	render() {
		let searchComponent = null;
		let lineChart = null;
		let paging = null;
		let sortButtons = null;

		//generates a tabbed pane with a search component for each collection + a collection browser
		searchComponent = (
			<FlexBox title="Search multiple collections">
				<QueryFactory
					user={this.state.user}
					pageSize={this.state.pageSize}
					initialCollections={this.state.collections}
					itemDetailsPath={this.props.recipe.ingredients.itemDetailsPath}
					aggregationView={this.props.recipe.ingredients.aggregationView}
					dateRangeSelector={this.props.recipe.ingredients.dateRangeSelector}
					onOutput={this.onComponentOutput.bind(this)}/>
			</FlexBox>);

		//TODO only render when there is linechart data
		if(this.props.recipe.ingredients.output == 'lineChart') {
			if(Object.keys(this.state.lineChartData).length > 0) {
				lineChart = (
					<FlexBox title="Search results plotted on a time line">
						<QueryComparisonLineChart
							data={this.state.lineChartData}
							comparisonId={this.state.comparisonId}/>
					</FlexBox>
				);
			}
		}

		//TODO put this in a Comerda Component
		const aggregatedHits = Object.keys(this.state.combinedSearchResults).map((queryId, index) => {

			const searchResults = this.state.combinedSearchResults[queryId];
			const collectionTitle = searchResults.collectionConfig.collectionInfo.title;

			//draw the search hits in here, so it's possible to put the linechart in between the search box and the results
			if(searchResults && searchResults.results && searchResults.results.length > 0) {
				//draw the paging buttons
				if(searchResults.currentPage > 0) {
					paging = <Paging
						queryId={queryId}
						currentPage={searchResults.currentPage}
						numPages={Math.ceil(searchResults.totalHits / this.state.pageSize)}
						gotoPage={this.gotoPage.bind(this)}/>
				}

				//draw the sorting buttons
				if(searchResults.params.sort) {
					sortButtons = <Sorting
						queryId={queryId}
						collectionConfig={searchResults.collectionConfig}
						sortResults={this.sortResults.bind(this)}
						sortParams={searchResults.params.sort}
						dateField={searchResults.dateField}/>
				}

				//draw the list of search results
				const items = searchResults.results.map((result, index) => {
					return (
						<SearchHit
							key={'__' + index}
							result={result}
							searchTerm={searchResults.params.term}
							collectionConfig={searchResults.collectionConfig}
							itemDetailsPath={this.props.recipe.ingredients.itemDetailsPath}/>
					)
				}, this);
				return (
					<FlexBox title={'Results for query #' + (index + 1) + ' ('+collectionTitle+')'}>
						<div className="row">
							<div className="col-md-12">
								{paging}&nbsp;{sortButtons}
								{items}
								{paging}
							</div>
						</div>
					</FlexBox>
				)
			}
		});


		return (
			<div className={IDUtil.cssClassName('comparative-search-recipe')}>
				<div className="row">
					<div className="col-md-12">
						{searchComponent}
						{lineChart}
					</div>
				</div>
				{aggregatedHits}
			</div>
		);
	}
}

export default ComparativeSearchRecipe;