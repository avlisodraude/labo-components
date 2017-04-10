import CollectionConfig from './CollectionConfig';

export class NISVProgramGuideConfig extends CollectionConfig {
	constructor(collectionId, stats, info) {
		super(collectionId, stats, info);
	}

	getDocumentType() {
		return 'page';
	}

	getFacets() {
		return [
			{
				field: 'guideId',
				title: 'Omroep',
				id: 'broadcaster',
				operator: 'AND',
				size:10,
				type : 'string',
				display: true
			},
			{
				field: 'doc_type',
				title: 'Type document',
				id: 'doc_type',
				operator: 'AND',
				size:10,
				type : 'string',
				display: true
			},
			{
				field: 'year',
				title: 'Jaar',
				id: 'jaar',
				size:10,
				type : 'date_histogram',
				display: true
			}
		];
	}

	//TODO if available add the poster URL:
	//http://hugodrax.beeldengeluid.nl:84/fcgi-bin/iipsrv.fcgi?IIIF=BG0261104_0081.tif/108,1876,514,29/full/0/default.jpg
	getItemDetailData(result, currentDateField) {
		//first flatten the pure ES response
		result = this.formatSearchResult(result);
		let formattedResult = {}

		//then add the most basic top level data
		formattedResult.resourceId = result._id;
		formattedResult.index = result._index;
		formattedResult.docType = result._type;

		formattedResult.rawData = result;

		formattedResult.title = result._id;
		if(result.year) {
			formattedResult.title += ' (' + result.year + ')';
		}
		formattedResult.description = result.text;
		if(currentDateField && result[currentDateField]) {
			formattedResult.date = result[currentDateField];
		} else {
			formattedResult.date = result.broadcast_date;
		}
		return formattedResult;
	}

}

export default NISVProgramGuideConfig;