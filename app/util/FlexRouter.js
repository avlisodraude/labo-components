/*
Check this out later: https://zhirzh.github.io/2017/01/30/browser-history-functioning-&-loopback-gotcha/
*/
const FlexRouter = {

	//this is typically called from a search recipe after clicking a search result
	gotoItemDetails : function(itemDetailsRecipePath, searchResult, searchTerm) {
		let url = FlexRouter.__getBaseUrl() + '/' + itemDetailsRecipePath + '?id=' + searchResult.resourceId;
		url += '&cid=' + searchResult.index;
		if(searchTerm) {
			url += '&st=' + searchTerm;
		}
		if(searchResult._type == 'media_fragment') {
			url += '&s=' + searchResult.start;
			url += '&e=' + searchResult.end;
		}
		document.location.href = url;
	},

	//this is typically called from a collection browsing recipe after selecting a collection for closer study
	gotoSearch : function(searchRecipePath, collectionIds) {
		let url = FlexRouter.__getBaseUrl() + '/' + searchRecipePath + '?cids=' + collectionIds.join(',');
		document.location.href =  url;
	},

	__getBaseUrl : function() {
		let temp = window.location.href;
		let arr = temp.split("/");
		return arr[0] + "//" + arr[2];
	},

	setBrowserHistory : function(baseUrl, params, stateTitle) {
		let url = baseUrl;
		if(params && typeof(params) == 'object' && Object.keys(params).length > 0) {
			let paramList = [];
			for(let p in params) {
				paramList.push(p + '=' + params[p]);
			}
			url += '?' + paramList.join('&');
		}
		window.history.pushState(params, stateTitle, url);

	}

}

export default FlexRouter;