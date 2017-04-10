import CollectionConfig from './CollectionConfig';

export class MotUConfig extends CollectionConfig {
	//requires the output of [SEARCH_API]/api/v1/collections/show_stats?collectionId=[ID]
	constructor(collectionId, stats, info) {
		super(collectionId, stats, info);
	}

	getImageBaseUrl() {
		return 'http://rdbg.tuxic.nl/mindoftheuniverse';
	}

	getFacets() {
		return [
			{
				field : 'name',
				title : 'Researchers'
			},
			{
				field : 'body.value.tags_raw',
				title : 'Segment tags',
				type : 'nested'
			},
			{
				field : 'body.value.keyMoments',
				title : 'Key moments',
				type : 'nested'
			},
			{
				field : 'tags_raw',
				title : 'Interview tags'
			},
			{
				field : 'placeOfResidence',
				title : 'Place of residence'
			},
			{
				field : 'nationality',
				title : 'Nationality'
			}
		]
	}

	//mild override
	getItemDetailData(result, currentDateField) {
		result = this.formatSearchResult(result);
		let formattedResult = {}

		//then add the most basic top level data
		formattedResult.resourceId = result._id;
		formattedResult.index = result._index;
		formattedResult.docType = result._type;

		formattedResult.title = result.title;
		formattedResult.description = result.description;
		formattedResult.posterURL = result.posterURL;
		formattedResult.tags = result.tags;
		formattedResult.playableContent = result.playableContent;

		formattedResult.rawData = result;

		formattedResult.mediaTypes = ['video']; //all items have video
		return formattedResult
	}

}

export default MotUConfig;