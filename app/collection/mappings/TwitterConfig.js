import CollectionConfig from './CollectionConfig';

export class TwitterConfig extends CollectionConfig {
	constructor(collectionId, stats, info) {
		super(collectionId, stats, info);
	}

	getFacets() {
		return [
			{
				//searckit fields
				field: 'filter_level',
				title: 'Filter level',
				id: 'filter_level',
				operator: 'AND',
				size:10,

				//custom fields
				type : 'string',
				display: true
			},
			{
				//searckit fields
				field: 'lang',
				title: 'Language',
				id: 'lang',
				operator: 'AND',
				size:10,

				//custom fields
				type : 'string',
				display: true
			}
		];
	}

	getItemDetailData(result, currentDateField) {
		result.title = result.id;
		result.description = result.text;
		if(currentDateField && result[currentDateField]) {
			result.date = result[currentDateField];
		}
		return result;
	}

}

export default TwitterConfig;