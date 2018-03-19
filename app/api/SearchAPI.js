import ElasticsearchDataUtil from '../util/ElasticsearchDataUtil';
import IDUtil from '../util/IDUtil';

const SearchAPI = {

	//TODO define some sort of query object holding these parameters
	//TODO properly handle null results in each component
	search(query, collectionConfig, callback, updateUrl = false) {

		//queryId, searchLayers, searchString, fieldCategory, desiredFacets, selectedFacets, dateRange,
		//sortParams, offset, pageSize, innerHitsSize=5, innerHitsOffset=0

		if(query.offset + query.size <= 10000) {
			SearchAPI.__fragmentSearch(
				query.collectionId,
				query.term,
				query.fieldCategory,
				query.searchLayers,
				query.selectedFacets,
				SearchAPI.__formatDateRange(query.dateRange), //format just before calling the API
				query.sort,
				query.desiredFacets,
				function(data) { //send the results to the component output (see onOutput())
					if(data && data.params) {
						//calculate the current page
						const pageNumber = Math.ceil(query.offset / query.size) + 1;
						data.currentPage = data.results ? pageNumber : -1;

						//add the currently selected date field
						data.dateField = collectionConfig.getPreferredDateField();
						if(query.dateRange && query.dateRange.field) {
							data.dateField = query.dateRange.field;
						}
						//add default sort when no sort was defined
						if(!data.params.sort) {
							data.params.sort = {
								field  :'_score',
								order : 'desc'
							}
						}
						//FIXME these things should also be present in data.params, so they are redundant
						data.searchLayers = query.searchLayers;
						data.fieldCategory = query.fieldCategory;
						data.selectedDateRange = query.dateRange;
						data.selectedFacets = query.selectedFacets;
						data.desiredFacets = query.desiredFacets;

						data.queryId = query.id; //to uniquely relate this query to interested components
						data.searchId = IDUtil.guid(); //still a bit weird, has to go probably
						data.collectionConfig = collectionConfig;
						data.updateUrl = updateUrl; //this one is still a bit weird to add here
					}
					//no data means an internal server error (TODO check API to make sure)
					callback(data);
				},
				query.offset,
				query.size,
				query.innerHitsSize,
				query.innerHitsOffset,
				query.fragmentPath,
				query.fragmentFields
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
		//url += '?cid=' + _clientId + '&at=' + _chickenStock;
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
			fragmentFields : fragmentFields,
			includeMediaObjects : true //TODO needs to be configurable
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
	}

}

export default SearchAPI;