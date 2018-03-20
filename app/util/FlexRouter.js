/*
Check this out later: https://zhirzh.github.io/2017/01/30/browser-history-functioning-&-loopback-gotcha/
*/
import QueryModel from '../model/QueryModel';

const FlexRouter = {

	//TODO probably better to return a default query instead of null whenever the urlParams are null
	generateInitialQueryFromURL : function(urlParams, collectionConfig) {
		if(urlParams) {
			const numParams = Object.keys(urlParams).length;
			if(numParams == 0) {
				return null;
			} else if(numParams == 1 && urlParams.cids) {
				return null;
			}
		} else {
			return null;
		}
		const searchTerm = urlParams.st ? urlParams.st : '';
		const fc = urlParams.fc;
		const fr = urlParams.fr ? urlParams.fr : 0;
		const size = urlParams.sz ? urlParams.sz : 10;
		const sf = urlParams.sf;
		const sl = urlParams.sl;
		const dr = urlParams.dr;
		const s = urlParams.s;

		//populate the field category
		let fieldCategory = [];

		if(fc) {
            // split field selected parameters.
            let selectedFields = [];
            fc.split('|').forEach(function(field){
                selectedFields.push(field);
            });

			const tmp = collectionConfig.getMetadataFieldCategories();
			let currentSelectedfields= [];

            selectedFields.map(selField => {
				tmp.map(fieldsArray => {
					if( fieldsArray.id == selField){
                        currentSelectedfields.push(fieldsArray)
					}
				})
            });
            fieldCategory = currentSelectedfields;
		}

		//populate the facets
		const selectedFacets = {};
		if(sf) {
			const tmp = sf.split(',');
			tmp.forEach((aggr) => {
				const a = aggr.split('|');
				const key = a[0];
				const value = a[1];
				if(selectedFacets[key]) {
					selectedFacets[key].push(value);
				} else {
					selectedFacets[key] = [value];
				}
			});
		}

		//populate the search layers
		let searchLayers = []
		if(sl) {
			searchLayers = sl.split(',');
		}

		//populate the date range TODO think of a way to include min/max :s
		let dateRange = null;
		if(dr) {
			const tmp = dr.split('__');
			if(tmp.length == 3) {
				dateRange = {
					field : tmp[0],
					start : parseInt(tmp[1]),
					end : parseInt(tmp[2])
				}
			}
		}

		//populate the sort
		let sortParams = null;
		if(s) {
			const tmp = s.split('__');
			if(tmp.length == 2) {
				sortParams = {
					field : tmp[0],
					order : tmp[1]
				}
			}
		}

		return QueryModel.ensureQuery (
			{
				searchLayers : searchLayers,
				term : searchTerm,
				dateRange : dateRange,
				fieldCategory : fieldCategory,
				selectedFacets : selectedFacets,
				sortParams : sortParams,
				offset : parseInt(fr),
				size : parseInt(size)
			},
			collectionConfig
		)
	},

	//this is typically called from a search recipe after clicking a search result
	gotoItemDetails : function(itemDetailsRecipePath, searchResult, searchTerm) {
		let url = FlexRouter.__getBaseUrl() + '/' + itemDetailsRecipePath + '?id=' + searchResult.resourceId;
		url += '&cid=' + searchResult.index;
		if(searchTerm) {
			url += '&st=' + searchTerm;
		}
		//check the collection config to see how the mediaFragment was added to the result object
		if(searchResult.mediaFragment) {
			/*
				FIXME the URL should be a "safe" URL, so for B&G only the safe play-out link should be shown.
				Also the resource viewer must be able to identify the right media object using this safe URL
			*/
			if(searchResult.mediaFragment.hasOwnProperty('url')) { url += '&fragmentUrl=' + searchResult.mediaFragment.url; }
			if(searchResult.mediaFragment.hasOwnProperty('start')) { url += '&s=' + searchResult.mediaFragment.start; }
			if(searchResult.mediaFragment.hasOwnProperty('end')) { url += '&e=' + searchResult.mediaFragment.end; }
			if(searchResult.mediaFragment.hasOwnProperty('x')) { url += '&x=' + searchResult.mediaFragment.x; }
			if(searchResult.mediaFragment.hasOwnProperty('y')) { url += '&y=' + searchResult.mediaFragment.y; }
			if(searchResult.mediaFragment.hasOwnProperty('w')) { url += '&w=' + searchResult.mediaFragment.w; }
			if(searchResult.mediaFragment.hasOwnProperty('h')) { url += '&h=' + searchResult.mediaFragment.h; }
			if(searchResult.mediaFragment.hasOwnProperty('layer')) { url += '&l=' + searchResult.mediaFragment.layer; }
		}
		document.location.href = url;
	},

	//this is typically called from a collection browsing recipe after selecting a collection for closer study
	gotoSearch : function(searchRecipePath, collectionIds) {
		const url = FlexRouter.__getBaseUrl() + '/' + searchRecipePath + '?cids=' + collectionIds.join(',');
		document.location.href =  url;
	},

	__getBaseUrl : function() {
		const temp = window.location.href;
		const arr = temp.split("/");
		return arr[0] + "//" + arr[2];
	},

	//TODO extend this function so it is optional to put the params in the URL
	setBrowserHistory : function(params, stateTitle) {
		let url = document.location.pathname;
		if(params && typeof(params) == 'object' && Object.keys(params).length > 0) {
			const paramList = [];
			for(const p in params) {
				paramList.push(p + '=' + params[p]);
			}
			url += '?' + paramList.join('&');
		}
		window.history.pushState(params, stateTitle, url);

	}

}

export default FlexRouter;