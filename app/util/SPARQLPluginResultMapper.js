const SPARQLPluginResultMapper = {

	//TODO this function only works for the outcome of SearchAPI.mediaFragmentSearch()
	formatResultData : function(data) {
		let formattedData = data.hits.hits.map((hit) => {
			return hit;
		});
		return formattedData;
	}
}

export default SPARQLPluginResultMapper;