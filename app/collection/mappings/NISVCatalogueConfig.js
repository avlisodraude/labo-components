import CollectionConfig from './CollectionConfig';

class NISVCatalogueConfig extends CollectionConfig {
	constructor(collectionId, stats, info) {
		super(collectionId, stats, info);
	}

	getVideoBaseUrl() {
		return 'http://lbas2.beeldengeluid.nl:8093/viz';
	}

	//Note: This endpoint does not support-pseudo streaming yet
	getAudioBaseUrl() {
		return 'http://lbas2.beeldengeluid.nl:8093/avid';
	}

	getPreferredDateField() {
		return 'bg:publications.bg:publication.bg:sortdate';
	}

	getFacets() {
		return [
			{
				field: 'bg:publications.bg:publication.bg:broadcasters.bg:broadcaster.raw',
				title : 'Broadcaster',
				id : 'broadcaster',
				operator : 'AND',
				size : 10,
				type : 'string',
				display: true
			},
			{
				field: 'bg:genres.bg:genre.raw',
				title : 'Genre',
				id : 'genre',
				operator : 'AND',
				size : 10,
				type : 'string',
				display: true
			},
			{
				field: 'bg:keywords.bg:keyword.raw',
				title : 'Keyword',
				id : 'keyword',
				operator : 'AND',
				size : 10,
				type : 'string',
				display: true
			},
			{
				field: 'bg:publications.bg:publication.bg:sortdate',
				title : 'Uitzenddatum',
				id : 'sortdate',
				operator : 'AND',
				size : 10,
				type : 'date_histogram',
				display: true
			}
		];
	}

	getItemDetailData(result, currentDateField) {
		result = this.formatSearchResult(result);
		let formattedResult = {}
		formattedResult.resourceId = result._id;
		formattedResult.index = result._index;
		formattedResult.docType = result._type;
		formattedResult.title = this.__extractTitle(result);
		formattedResult.description = this.__extractDescription(result);
		formattedResult.date = this.__extractDate(result, currentDateField);
		formattedResult.sourceURL = this.__extractSourceURL(result);
		formattedResult.specialProperties = this.__extractSpecialProperties(result);

		let content = this.__extractPlayableContent(result);
		formattedResult.playableContent = content.playableContent;
		formattedResult.mediaTypes = content.mediaTypes;
		formattedResult.rawData = result;
		return formattedResult;
	}

	__extractTitle(result) {
		let title = null;
		//first check the series title
		if (result.hasOwnProperty('bga:series')) {
			let series = result['bga:series'];
			if (series.hasOwnProperty('bg:maintitles') && series['bg:maintitles'].hasOwnProperty('bg:title')) {
				title = series['bg:maintitles']['bg:title'].join(' / ');
			}
		}
		//then check the season title
		if (result.hasOwnProperty('bga:season')) {
			let season = result['bga:season'];
			if (season.hasOwnProperty('bg:maintitles') && season['bg:maintitles'].hasOwnProperty('bg:title')) {
				title = title ? title + '; ' : '';
				title += season['bg:maintitles']['bg:title'].join(' / ');
			}
		}
		//then check the expression title
		if (result.hasOwnProperty('bg:maintitles') && result['bg:maintitles'].hasOwnProperty('bg:title')) {
			title = title ? title + ': ' : '';
			title += result['bg:maintitles']['bg:title'].join(' / ');
			if (result.hasOwnProperty('bg:subtitles') && result['bg:subtitles'].hasOwnProperty('bg:title')) {
				title += ' - ' + result['bg:subtitles']['bg:title'].join('; ');
			}
		}
		return title;
	}

	__extractDescription(result) {
		if (result.hasOwnProperty('bg:summary')) {
			return result['bg:summary'];
		} else {
			let temp = [result.broadcaster, result.genre]
			return temp.filter((d) => {return d ? true : false}).join(' ');
		}
		return null;
	}

	__extractDate(result, currentDateField) {
		if (result.hasOwnProperty('bg:publications') && result['bg:publications'].hasOwnProperty('bg:publication')) {
			if(currentDateField && result[currentDateField]) {
				return result[currentDateField]; //TODO make sure this works for nested fields
			} else if (result['bg:publications']['bg:publication'].hasOwnProperty('bg:sortdate')) {
				return result['bg:publications']['bg:publication']['bg:sortdate'];
			}
		}
		return null;
	}

	__extractPlayableContent(result) {
		let playableContent = null;
		let mediaTypes = null;

		let guci = null;
		let dmguid = null;
		let mimeType = 'video/mp4';

		//determine whether the content is radio or not
		if(result.hasOwnProperty('bga:series')) {
			let series = result['bga:series'];
			if(series.hasOwnProperty('bg:distributionchannel') &&
				result['bga:series']['bg:distributionchannel'].toLowerCase() == 'radio') {
				mimeType = 'audio/mp3';
			} else if (series.hasOwnProperty('bg:catalog') && series['bg:catalog'] == 'Foto') {
				mimeType = 'image/jpeg';
			}
		}

		//look through the carriers	to fetch the dmguid / guci needed to build the play-out URL
		if(result.hasOwnProperty('bg:carriers')) {
			let temp = result['bg:carriers'];
			if(temp.hasOwnProperty('bg:carrier')) {
				let carriers = temp['bg:carrier'];
				if(carriers.hasOwnProperty('bg:carriertype')) {
					carriers = [carriers];
				}
				carriers = carriers.filter((c) => {
					if(c.hasOwnProperty('bg:carriertype')) {
						return c['bg:carriertype'] == 'media archive';
					}
				});

				guci = carriers.length > 0 ? carriers[0]['bg:carrierreference'] : null;
				dmguid = carriers.length > 0 ? carriers[0]['bg:dmguid'] : null;
			}
		}

		//finall assign the results to the playableContent (also fill in the found media types)
		if(mimeType == 'audio/mp3' && dmguid) {
			playableContent = [{
				url : this.getAudioBaseUrl() + '/' + dmguid,
				mimeType : mimeType,
				assetId : dmguid
			}];
			mediaTypes = ['audio'];
		} else if(mimeType == 'video/mp4' && guci) {
			playableContent = [{
				url : this.getVideoBaseUrl() + '/' + guci,
				mimeType : mimeType,
				assetId : guci
			}];
			mediaTypes = ['video'];
		} else if(mimeType == 'image/jpeg') {
			mediaTypes = ['image'];
		}
		return {
			playableContent : playableContent,
			mediaTypes : mediaTypes
		}
	}

	__extractSourceURL(result) {
		if(result.hasOwnProperty('dc:relation')) {
			return result['dc:relation'];
		}
		return null;
	}

	//these are the properties that will be shown in the regular item details table
	__extractSpecialProperties(result) {
		let specialProperties = {};
		//broadcaster
		if (result.hasOwnProperty('bg:publications') && result['bg:publications'].hasOwnProperty('bg:publication')) {
			if (result['bg:publications']['bg:publication'].hasOwnProperty('bg:broadcasters')) {
				specialProperties['Broadcaster'] = result['bg:publications']['bg:publication']['bg:broadcasters']['bg:broadcaster'];
			}
		}
		//genre
		if (result.hasOwnProperty('bg:genres') && result['bg:genres'].hasOwnProperty('bg:genre')) {
			specialProperties['Genre'] = result['bg:genres']['bg:genre'];
		}
		return specialProperties;
	}

}

export default NISVCatalogueConfig;