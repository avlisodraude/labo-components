import CollectionConfig from './CollectionConfig';

export class EYEConfig extends CollectionConfig {

	constructor(collectionId, stats, info) {
		super(collectionId, stats, info);
	}

	getItemDetailData(result, currentDateField) {
		result = this.formatSearchResult(result);
		let formattedResult = {}

		//then add the most basic top level data
		formattedResult.resourceId = result._id;
		formattedResult.index = result._index;
		formattedResult.docType = result._type;

		formattedResult.rawData = result;

		if(currentDateField && result[currentDateField]) {
			formattedResult.date = result[currentDateField];
		} else if(result.hasOwnProperty('dc:date')) {
			formattedResult.date = result['dc:date'];
		}
		if(result.hasOwnProperty('dcterms:title')) {
			if(result['dcterms:title'].hasOwnProperty('@value')) {
				formattedResult.title = result['dcterms:title']['@value'];
			}
		}
		if(result.hasOwnProperty('dcterms:abstract')) {
			let descs = [];
			let altDescs = [];
			let abs = result['dcterms:abstract'];
			//in case the value is a {}
			if(abs.hasOwnProperty('@language') && abs.hasOwnProperty('@value')) {
				if(abs['@language'] == 'NL' || abs['@language'] == 'EN') {
					descs.push(abs['@value'])
				} else {
					altDescs.push(abs['@value'])
				}
			} else if(abs.length > 0) {//otherwise it's a list
				result['dcterms:abstract'].forEach((d) => {
					if(d.hasOwnProperty('@language') && d.hasOwnProperty('@value')) {
						if(d['@language'] == 'NL' || d['@language'] == 'EN') {
							descs.push(d['@value'])
						} else {
							altDescs.push(d['@value'])
						}
					}
				});
			}
			//finally set the description, sheesh
			formattedResult.description = descs.join('\n\n');
			if(result.description == '') {
				formattedResult.description = altDescs.join('\n\n');
			}
		}
		if(result.hasOwnProperty('dcterms:hasVersion')) {
			let url = result['dcterms:hasVersion'];
			let mimeType = url.indexOf('youtu') == -1 ? 'application/x-shockwave-flash' : 'video/mp4';
			if(url.indexOf('youtu.be') != -1) {
				url = 'https://www.youtube.com/watch?v=' + url.substring(url.lastIndexOf('/'));
			}
			formattedResult.playableContent = [{
				url : url,
				mimeType : mimeType,
				assetId : result['_id']
			}];
			formattedResult.mediaTypes = ['video'];
		}
		return formattedResult;
	}

}

export default EYEConfig;