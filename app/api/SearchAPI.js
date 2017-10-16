import ElasticsearchDataUtil from '../util/ElasticsearchDataUtil';
import IDUtil from '../util/IDUtil';

const SearchAPI = {

	//TODO define some sort of query object holding these parameters
	//TODO properly handle null results in each component
	search(queryId, collectionConfig, searchLayers, searchString, fieldCategory, desiredFacets, selectedFacets, dateRange,
		sortParams, offset, pageSize, callback, updateUrl, innerHitsSize=5, innerHitsOffset=0) {
		if(offset + pageSize <= 10000) {
			SearchAPI.__fragmentSearch(
				collectionConfig.getSearchIndex(),
				searchString,
				fieldCategory,
				searchLayers,
				selectedFacets,
				SearchAPI.__formatDateRange(dateRange), //format just before calling the API
				sortParams,
				desiredFacets,
				function(data) { //send the results to the component output (see onOutput())
					if(data && data.params) {
						//calculate the current page
						const pageNumber = Math.ceil(offset / pageSize) + 1;
						data.currentPage = data.results ? pageNumber : -1;

						//add the currently selected date field
						data.dateField = collectionConfig.getPreferredDateField();
						if(dateRange && dateRange.field) {
							data.dateField = dateRange.field;
						}
						//add default sort when no sort was defined
						if(!data.params.sort) {
							data.params.sort = {
								field  :'_score',
								order : 'desc'
							}
						}

						data.queryId = queryId; //to uniquely relate this query to interested components
						data.searchId = IDUtil.guid(); //still a bit weird, has to go probably
						data.collectionConfig = collectionConfig;
						data.updateUrl = updateUrl; //this one is still a bit weird to add here
					}
					//no data means an internal server error (TODO check API to make sure)
					callback(data);
				},
				offset,
				pageSize,
				innerHitsSize,
				innerHitsOffset,
				collectionConfig.getFragmentPath(),
				collectionConfig.getFragmentTextFields()
			);
		} else {
			console.debug('Currently the search engine cannot look beyond this point, please narrow your search terms');
			callback({pagingOutOfBounds : true})
		}
	},

	//returns null if the dateRange has -1 for start & end times
	__formatDateRange(dateRange) {
		const dr = null
		if(dateRange) {
			//then create the dateRange object for the Search API
			if(dateRange.start != -1 && dateRange.end != -1) {
				return dateRange
			}
		}
		return dr;
	},

	//Calls the layered search function in the Search API, used by the MultiLayeredSearchComponent
	//TODO (maandag) add the sorting stuff
	__fragmentSearch :function(collectionId, term, fieldCategory, searchLayers, selectedFacets, dateRange, sortParams, desiredFacets,
		callback, offset=0 , size=10, innerHitsSize=3, innerHitsOffset=0, fragmentPath=null, fragmentFields=null) {
		let url = _config.SEARCH_API_BASE + '/layered_search/' + collectionId
		url += '?cid=' + _clientId + '&at=' + _chickenStock;
		const params = {
			term : term,
			fieldCategory : fieldCategory,
			searchLayers : searchLayers,
			selectedFacets : selectedFacets,
			offset : offset,
			size : size,
			desiredFacets : desiredFacets,
			dateRange : dateRange,
			sort : sortParams,
			innerHitsSize : innerHitsSize,
			innerHitsOffset : innerHitsOffset,
			fragmentPath : fragmentPath,
			fragmentFields : fragmentFields
		}
		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if(xhr.status == 200) {
					callback(JSON.parse(xhr.responseText));
				} else {
					callback(null);
				}
			}
		}
		xhr.open("POST", url);
		xhr.timeout = 50000;
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send(JSON.stringify(params));
	},

	//Primarily called by the ItemDetailsRecipe for fetching all metadata of a single collection item (ES document)
	getItemDetails :function(collectionId, itemId, callback) {
		const url = _config.SEARCH_API_BASE + '/document/get_doc/' + collectionId + '/' + itemId;
		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if(xhr.status == 200) {
					callback(collectionId, itemId, JSON.parse(xhr.responseText));
				} else {
					callback(null);
				}
			}
		}
		xhr.open("GET", url);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send();
	},

	//Sends your ES query to the Search API. Not used by any component at the moment
	elasticSearch :function(collectionId, query, callback) {
		let url = _config.SEARCH_API_BASE + "/search/";
		if(collectionId) {
			url += collectionId;
		}
		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				if(xhr.status == 200) {
					callback(JSON.parse(xhr.responseText));
				} else {
					callback(null);
				}
			}
		}
		xhr.open("POST", url);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.send(JSON.stringify(query));
	}

}

export default SearchAPI;