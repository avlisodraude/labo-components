import IDUtil from '../util/IDUtil';

const QueryModel = {

	/*----------------------------------------------------------------------
	*---------------------------- QUERY -----------------------------------
	----------------------------------------------------------------------*/

	/*
		queryId, NON SEARCH API PARAM
		collectionConfig, NON SEARCH API PARAM
		callback, NON SEARCH API PARAM
		updateUrl, NON SEARCH API PARAM

		√ searchLayers,

		√ term,

		√ dateRange,

		√ fieldCategory,

		√ selectedFacets,

		x desiredFacets,

		√ sortParams,

		√ offset,
		√ pageSize,

		x innerHitsSize=5,
		x innerHitsOffset=0

		x collectionConfig.getFragmentPath(), SET IN THE SEARCH API
		x collectionConfig.getFragmentTextFields() SET IN THE SEARCH API

		x includeFragmentChildren: SET ON THE SERVER! --> default to same on server for now

		x includeMediaObjects: SET IN THE SEARCH API --> default to same on search API


		//TAKEN FROM URL
		'searchLayers' : searchLayers,
		'searchTerm' : searchTerm,
		'dateRange' : dateRange,
		'fieldCategory' : fieldCategory,
		'selectedFacets' : selectedFacets,
		'sortParams' : sortParams
		'from' : parseInt(fr),
		'pageSize' : parseInt(size),
		'recipeId' : this.props.recipe.id,


	*/

	//when a collectionConfig is provided, it means that defaults from this should be used to populate the query object
	ensureQuery : function(obj, collectionConfig) {
		obj = obj || {};
		return {
			//give the query an ID for internal reference (e.g. for components that can handle multiple queries)
			id : obj.id || IDUtil.guid(),

			//the collection to search through TODO validate that this is always filled in!!!!
			collectionId : (collectionConfig ? collectionConfig.getSearchIndex() : obj.collectionId) || null,

			//what layers to search through (always check them with the collection config)
			searchLayers: QueryModel.getInitialSearchLayers(obj, collectionConfig),

			//the search term entered by the user
			term: obj.term || '',

			//the selected date field and range (start/end dates)
			dateRange: obj.dateRange || null, //not looking at collecitonConfig

			//currently only clusters of fields are supported for field-specific search (both in the UI and search API)
			//field clusters can be defined by subclassing CollectionConfig and implementing getMetadataFieldCategories()
			fieldCategory: obj.fieldCategory || null,

			//filters selected by the user (by selecting certain values from the desiredFacets)
			selectedFacets: obj.selectedFacets || null,

			//which aggregations should be included next to the search results
			desiredFacets: obj.desiredFacets || QueryModel.getInitialDesiredFacets(obj, collectionConfig),

			//sort by a certain field and order (asc/desc)
			sort: obj.sort || { "field": "_score", "order": "desc"},

			//used for paging
			offset: obj.offset || 0,
			size: obj.size || 20,

			//(fragment search only) define the path to the desired nested document, e.g. document.page.paragraph
			fragmentPath: obj.fragmentPath || collectionConfig ? collectionConfig.getFragmentPath() : null,

			//(fragment search only) define which fields of the indicated nested document to retrieve
			fragmentFields: obj.fragmentFields || collectionConfig ? collectionConfig.getFragmentTextFields() : null,

			//(fragment search only) decide whether to return sub fragments as well
			//(e.g. when retrieving a paragraph it's possible to exclude the list of sentences)
			includeFragmentChildren: obj.includeFragmentChildren === true || false,

			//(fragment search only) decide whether to search/retrieve the document level as well
			includeMediaObjects: obj.includeMediaObjects === false || true,

			//paging within inner hits is not really supported/reflected by the UI (yet)
			innerHitsOffset: obj.innerHitsOffset || 0,
			innerHitsSize: obj.innerHitsSize || 5
		}
	},

	getInitialSearchLayers(query, config) {
		let searchLayers = null;
		if(config && config.getCollectionIndices()) {
			searchLayers = {};
			config.getCollectionIndices().forEach((layer) => {
				if(query && query.searchLayers && query.searchLayers.length > 0) {
					searchLayers[layer] = query.searchLayers.indexOf(layer) != -1;
				} else {
					searchLayers[layer] = true;
				}
			});
		}
		return searchLayers;
	},

	getInitialDesiredFacets(query, config) {
		let df = config ? config.getFacets() : null || [];
		if(query.dateRange && query.dateRange.field) {
			df.push({
				field: query.dateRange.field,
				title : config.toPrettyFieldName(query.dateRange.field),
				id : query.dateRange.field,
				type : 'date_histogram'
			});
		}
		return df
	},

	//TODO add support for missing params such as: desiredFacets
	toUrlParams(query) {
		const params = {
			fr : query.offset,
			sz : query.size,
			cids : query.collectionId
		}

		if(query.searchLayers) {
			const sl = Object.keys(query.searchLayers).filter((l) => {
				return query.searchLayers[l];
			});
			if(sl.length > 0) {
				params['sl'] = sl.join(',');
			}
		}

		if(query.term) {
			params['st'] = query.term;
		}

		if(query.dateRange) {
			let dr = query.dateRange.field + '__';
			dr += query.dateRange.start + '__';
			dr += query.dateRange.end;
			params['dr'] = dr;
		}

		if(query.fieldCategory) {
            params['fc'] ='';
            query.fieldCategory.map(function(item){
                params['fc'] += item.id + '|';
			});
            params['fc'] = params['fc'].slice(0, -1);
		}

		let sf = []
		if(query.selectedFacets) {
			sf = Object.keys(query.selectedFacets).map((key) => {
				return query.selectedFacets[key].map((value) => {
					return key + '|' + value;
				})
			});
			params['sf'] = sf.join(',');
		}

		if(query.sort) {
			let s = query.sort.field + '__';
			s += query.sort.order;
			params['s'] = s;
		}
		return params;
	},

	/*----------------------------------------------------------------------
	*---------------------------- NOT USED YET ------------------------------
	----------------------------------------------------------------------*/

	//e.g. { "nisv-catalogue-aggr": true}
	validateSearchLayers : function(obj) {

	},

	validateDateRange : function(obj) {
		return {
			field : obj.field || null,
			start : obj.start || -1,
			end : obj.end || -1
		}
	},

	validateFieldCategories : function(list) {
		return {
			id : obj.id,
			label : obj.label,
			fields : obj.fields || []
		}
	},

	//e.g. {bg:publications.bg:publication.bg:broadcasters.bg:broadcaster: ["VARA"]}
	validateSelectedFacets : function(obj) {

	},

	validateDesiredFacets : function(list) {
		return {
			id : obj.id || null, //"broadcaster",
			title : obj.title || null, //"Broadcaster",
			field : obj.field || null, //"bg:publications.bg:publication.bg:broadcasters.bg:broadcaster",
			type : obj.type || null, // "string" | "date_histogram"
		}
	}
}

export default QueryModel;