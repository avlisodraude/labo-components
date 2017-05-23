import TimeUtil from './TimeUtil';

//TODO maybe move this to some other utility class
const ElasticsearchDataUtil = {

	toPrettyFieldName(esFieldName) {
		if(esFieldName) {
			let tmp = esFieldName.split('.');
			if(tmp[tmp.length -1] == 'raw') {
				tmp.pop();
			}
			let fn = tmp[tmp.length-1];
			if(fn.indexOf(':') != -1) {
				fn = fn.substring(fn.indexOf(':') + 1);
			}
			if(tmp.length > 1) {
			 	fn += ' (in: ' + tmp[tmp.length-2] + ')';
			}
			return fn
		}
		return esFieldName;
	},

	//transforms a query from the QueryBuilder into something readable for the user
	toPrettyQuery(query) {
		if(query) {
			//console.debug(query);
			let strList = []
			if(query.term) {
				strList.push('Search term: ' + query.term);
			} else {
				strList.push('No search term');
			}
			if(query.selectedFacets && Object.keys(query.selectedFacets).length > 0) {
				strList.push('# filters: ' + Object.keys(query.selectedFacets).length);
			}
			return strList.join('; ')
		}
		return null;
	},

	/* ----------------------------- Used by: ComparativeSearchRecipe ------------------------------------------------ */

	//TODO make sure the different date formats can be handled!
	searchResultsToTimeLineData : function(data) {
		if(data && data.dateField) {
			var df = data.dateField;
		 	var timelineData = [];
		 	if(data && data.results) {
			 	if(data.aggregations && data.aggregations[df]) {
					data.aggregations[df].forEach((a) => {
						let y = new Date(a.date_millis).getFullYear();
						if (!(isNaN(y))) {
							timelineData.push({
								year: y,
								count: a.doc_count,
								queryId : data.queryId
							});
						}
					});

				}
			}
			return timelineData;
		}
		return null;
	},

	/* ----------------------------- Used by: AggregationBox, AggregationList, DateRangeSelector ------------ */

	getAggregationTitle(aggrId, configuredAggregations) {
		let title = null;
		for(let f of configuredAggregations) {
			if(f.field == aggrId) {
				title = f.title;
				break;
			}
		}
		return title;
	},

	isHistogram(aggrId, configuredAggregations) {
		let h = false;
		for(let f of configuredAggregations) {
			if(f.field == aggrId) {
				h = f.type == 'date_histogram';
				break;
			}
		}
		return h;
	},

	/* ----------------------------- Used by: CollectionConfig -----------------------------------------------  */

	//tries to automatically detect facets based on the Search API's collection statistics
	//See CollectionConfig.jsx for more insight
	//TODO also extend this with autodection based on known schemata
	extractFacetsFromStats : function(dateFields, stringFields, longFields, doubleFields) {
		var facets = [];
		if(dateFields && dateFields.length > 0) {
			//2010-03-15 voor dc:date
			//DIDL 2016-01-12T14:37:36.671Z
			facets.push({
				field: dateFields[0],
				title : 'Date',
				id : 'date',
				operator : 'AND',
				size : 10,
				type : 'date_histogram',
				display: true
			});
		}
		//look for genre, subject, coverage & contributors in the string fields
		if(stringFields && stringFields.length > 0) {
			let genres = stringFields.filter((sf)=>{
				return sf.indexOf('genre') != -1;
			});
			let subjects = stringFields.filter((sf)=>{
				return sf.indexOf('subject') != -1;
			});
			let locations = stringFields.filter((sf)=>{
				return sf.indexOf('coverage') != -1;
			});
			let contributors = stringFields.filter((sf)=>{
				return sf.indexOf('contributor') != -1;
			});
			if(genres.length > 0) {
				facets.push({
					field: genres[0],
					title : 'Genre',
					id : 'genre',
					operator : 'AND',
					size : 10,
					type : 'string',
					display: true
				});
			}
			if(subjects.length > 0) {
				facets.push({
					field: subjects[0],
					title : 'Subject',
					id : 'subject',
					operator : 'AND',
					size : 10,
					type : 'string',
					display: true
				});
			}
			if(locations.length > 0) {
				facets.push({
					field: locations[0],
					title : 'Location',
					id : 'location',
					operator : 'AND',
					size : 10,
					type : 'string',
					display: true
				});
			}
			if(contributors.length > 0) {
				facets.push({
					field: contributors[0],
					title : 'Contributor',
					id : 'contributor',
					operator : 'AND',
					size : 10,
					type : 'string',
					display: true
				});
			}
		}
		return facets.length > 0 ? facets : null;
	}
}

export default ElasticsearchDataUtil;