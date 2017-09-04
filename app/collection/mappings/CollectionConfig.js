import CollectionAPI from '../../api/CollectionAPI';
import MetadataSchemaUtil from '../../util/MetadataSchemaUtil';
import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';

/*
TODO:
- nadenken hoe automatisch facets te genereren
- apart component maken voor zoeken in fragmenten
- component met audio player
- play-out van een fragment goed integreren (b.v. vanuit woordenwolk naar player)
- make sure the config 'knows' which kind of view it should generate data for
*/

//base class for each collection configuration
class CollectionConfig {

	//requires the output of [SEARCH_API]/api/v1/collections/show_stats?collectionId=[ID]
	constructor(collectionId, collectionStats, collectionInfo) {
		this.collectionId = collectionId; //based on the ES index name
		this.collectionStats = collectionStats; //ES stats (mostly about field types)
		this.collectionInfo = collectionInfo; //CKAN metadata

		this.docType = null;
		this.stringFields = null;
		this.textFields = null;
		this.dateFields = null;
		this.nonAnalyzedFields = null;
		this.keywordFields = null;
		this.longFields = null;
		this.doubleFields = null;

		if(collectionStats && collectionStats.collection_statistics) {
			let temp = null;

			//extract the preferred doc type
			if(collectionStats.collection_statistics.document_types) {
				collectionStats.collection_statistics.document_types.forEach(function(dt) {
					if(temp == null) {
						temp = dt;
					} else if(temp.doc_count < dt.doc_count) {
						temp = dt;
					}
				}.bind(this));
				this.docType = temp.doc_type;
			}

			//extract the field info
			if(temp && temp.fields) {
				//merged in getStringFields(). ES5 uses 'text' and older versions only use 'string'
				this.stringFields = temp.fields['string'];
				this.textFields = temp.fields['text'];

				//merged in getNonAnalyzedFields()
				this.nonAnalyzedFields = temp.fields['not_analyzed'];
				this.keywordFields = temp.fields['keyword'];

				this.dateFields = temp.fields['date'];
				this.longFields = temp.fields['long'];
				this.doubleFields = temp.fields['double'];
			}
		}
	}

	//TODO see if this is necessary or we just directly access the global variable
	getCollectionId() {
		return this.collectionId;
	}

	getCollectionStats() {
		return this.collectionStats;
	}

	getCollectionInfo() {
		return this.collectionInfo;
	}

	//TODO this will become a much more important function later on
	getSearchIndex() {
		if(this.collectionInfo) {
			return this.collectionInfo.index;
		}
		return this.collectionId;
	}

	getImageBaseUrl() {
		return null;
	}

	getVideoBaseUrl() {
		return null;
	}

	getAudioBaseUrl() {
		return null;
	}

	getDocumentType() {
		return this.docType;
	}

	getCollectionIndices() {
		const indices = [this.getCollectionId()];
		const stats = this.getCollectionStats();
		if(stats && stats.hasOwnProperty('collection_annotation_indices')) {
			return indices.concat(
				stats['collection_annotation_indices'].map((i) => {
					return i.collection;
				})
			);
		}
		return indices;
	}

	//the nested path used for forming the ES query in the search API
	getFragmentPath() {
		return null;
	}

	//which of the fragment fields are text fields and suitable for match queries?
	getFragmentTextFields() {
		return null;
	}

	getStringFields() {
		let tmp = []
		if(this.stringFields) {
			tmp = tmp.concat(this.stringFields);
		}
		if(this.textFields) {
			tmp = tmp.concat(this.textFields);
		}
		return tmp.length > 0 ? tmp : null;
	}

	getTextFields() {
		return this.textFields;
	}

	getDateFields() {
		return this.dateFields;
	}

	getNonAnalyzedFields() {
		let tmp = []
		if(this.nonAnalyzedFields) {
			tmp = tmp.concat(this.nonAnalyzedFields);
		}
		if(this.keywordFields) {
			tmp = tmp.concat(this.keywordFields);
		}
		return tmp.length > 0 ? tmp : null;
	}

	getKeywordFields() {
		return this.keywordFields;
	}

	//simply return the first date field by default (this function is used by QueryBuilder)
	getPreferredDateField() {
		const dfs = this.getDateFields();
		if(dfs && dfs.length > 0) {
			return dfs[0];
		}
		return null;
	}

	//if the data has translations within its metadata
	getPreferredLanguage() {
		return null;
	}

	//Try to generate at least some date facets to be able to draw a timeline
	//TODO the queryDataFormat can be detected from a retrieved date (implement this somewhere)
	getFacets() {
		return ElasticsearchDataUtil.extractFacetsFromStats(this.dateFields, this.stringFields);
	}

	//enables the user to narrow down full-text search to certain parts of the top-level metadata (e.g. search only in titles)
	getMetadataFieldCategories() {
		return null;
	}

	//TODO also fetch some data if there is no structured data
	getItemDetailData(result, currentDateField) {
		//first flatten the pure ES response
		result = this.formatSearchResult(result);

		//initiate the formatted result with the most basic data from ES
		let formattedResult = {
			resourceId : result._id,
			index : result._index,
			docType : result._type
		}

		//then fetch any data that can be fetched from known schemas (DIDL, DC, ...)
		const structuredData = MetadataSchemaUtil.extractStructuredData(result);
		if(structuredData) {
			formattedResult = Object.assign(structuredData, formattedResult);
		}

		//if there are no title and date try to fetch them via the ES stats or the raw data itself
		if(formattedResult.title == null) {
			if(result.title) {
				formattedResult.title = result.title;
			} else if(this.stringFields != null && this.stringFields.length > 0) {
				formattedResult.title = result[this.stringFields[0]];
			} else {
				formattedResult.title = '<No title available>';
			}
		}
		if(formattedResult.description == null && result.description) {
			formattedResult.description = result.description;
		}
		if(formattedResult.posterURL == null && result.posterURL) {
			formattedResult.posterURL = result.posterURL;
		}
		if(formattedResult.playableContent == null && result.playableContent) {
			formattedResult.playableContent = result.playableContent;
		}
		if(formattedResult.date == null) {
			if(currentDateField && result[currentDateField]) {
				formattedResult.date = result[currentDateField];//TODO nested fields can't be found in this way!! fix this
			} else if(this.dateFields != null && this.dateFields.length > 0) {
				formattedResult.date = result[this.dateFields[0]];
			} else {
				formattedResult.date = '<No date available>'
			}
		}

		//then add the raw data
		formattedResult.rawData = result;

		return formattedResult
	}

	//the result object passed here was passed through getItemDetailData, so all possible data has already been extracted (bit ugly)
	getResultSnippetData(result) {
		const snippet = {
			id : result.resourceId,
			type : result.docType,
			title: result.title || 'No title for: ' + result.resourceId + '',
			date: result.date,
			description: result.description,
			posterURL : result.posterURL,
			tags : result.tags ? result.tags : [],
			mediaTypes : result.mediaTypes ? result.mediaTypes : []
		}
		if(result.docType == 'media_fragment' && result._source) {
			result.start = result._source.start ? result._source.start : 0;
			result.end = result._source.end ? result._source.end : -1;
		}
		return snippet;
	}

	//TODO change this to a more index/db agnostic function. Also change the name
	formatSearchResult(result) {
		if(result && result._source) {
			const formattedResult = JSON.parse(JSON.stringify(result._source));
			formattedResult._id = result._id;
			formattedResult._score = result._score;
			formattedResult._type = result._type;
			formattedResult._index = result._index;

			return formattedResult;
		}
		return null;
	}

	//e.g. a field could be "bga:segment.bg:recordings.bg:recording.bg:startdate"
	toPrettyFieldName(esFieldName) {
		if(esFieldName) {
			//first split the field based on a dot
			const tmp = esFieldName.split('.');

			//if the last field is called raw or keyword (ES reserved names), drop it
			if(tmp[tmp.length -1] == 'raw' || tmp[tmp.length -1] == 'keyword') {
				tmp.pop();
			}
			//take the leaf field and make it the first in the pretty name
			let fn = tmp[tmp.length-1];

			//remove any prefix particle separated by ':'
			if(fn.indexOf(':') != -1) {
				fn = fn.substring(fn.indexOf(':') + 1);
			}

			//add between brackets the parent of the leaf field
			if(tmp.length > 1) {
			 	fn += ' (in: ' + tmp[tmp.length-2] + ')';
			}
			return fn
		}
		return esFieldName;
	}

}

export default CollectionConfig;