const MetadataSchemaUtil = {

	//this is only called whenever the item details need to be extracted and displayed
	extractStructuredData : function(result) {
		let data = null;

		//try to extract different formats if the data is unknown
		data = MetadataSchemaUtil.extractDIDLData(result);
		if(data == null) {
			data = MetadataSchemaUtil.extractCMDData(result);
			if(data == null) {
				data = MetadataSchemaUtil.extractDCData(result);
			}
		}
		return data;
	},

	//verteld verleden collecties hebben veelal DIDL
	//FIXME this function is really unsafe!! (existenceo of properties should be checked!)
	extractDIDLData: function(result) {
		if(result['oaipmh:metadata'] && result['oaipmh:metadata']['didl:DIDL']) {
			return {
				title : result['oaipmh:metadata']['didl:DIDL']['didl:Item']['didl:Item'][0]['didl:Component']['didl:Resource']['mods:mods']['mods:titleInfo']['mods:title'],
				date : result['oaipmh:metadata']['didl:DIDL']['didl:Item']['didl:Item'][0]['didl:Component']['didl:Resource']['mods:mods']['mods:originInfo']['mods:dateCreated'],
				description : result['oaipmh:metadata']['didl:DIDL']['didl:Item']['didl:Item'][0]['didl:Component']['didl:Resource']['mods:mods']['mods:abstract'],
				playableContent : null //TODO
			}
		}
		return null;
	},

	//Formaat voor o.a.(?) de soundbites collectie (NB: zoeken door de Soundbites collectie werkt niet!)
	//FIXME this function is really unsafe!! (existenceo of properties should be checked!)
	extractCMDData: function(result) {
		if(result['cmd:CMD']) {
			let resourceList = [];
			let rl = result['cmd:CMD']['cmd:Resources']['cmd:ResourceProxyList']['cmd:ResourceProxy'];
			if(rl.length && rl.length > 0) {
				resourceList = rl.map((value) => {
					return {
						url : value['cmd:ResourceRef'],
						mimeType : value['cmd:ResourceType']['@mimetype']
					}
				});
			} else {
				resourceList.push({
					url : rl['cmd:ResourceRef'],
					mimeType : rl['cmd:ResourceType']['@mimetype']
				})
			}
			return {
				title : result['cmd:CMD']['cmd:Components']['cmd:Soundbites-recording']['cmd:SESSION']['cmd:Name'],
				date : result['cmd:CMD']['cmd:Header']['cmd:MdCreationDate'],
				sourceURL : result['cmd:CMD']['cmd:Header']['cmd:MdSelfLink'],
				specialProperties : {
					'Creator' : result['cmd:CMD']['cmd:Header']['cmd:MdCreator']
				},
				playableContent : resourceList
			}
		}
		return null;
	},

	extractDCData: function(result) {
		if(result['dc:title']) {
			let title = typeof(result['dc:title']) == 'object' ? result['dc:title'].join('; ') : result['dc:title'];
			let date = result['dc:date'];
			if(date) {
				date = typeof(result['dc:date']) == 'object' ? result['dc:date'].join('; ') : result['dc:date'];
			}
			let creator = result['dc:creator'];
			if(creator) {
				creator = typeof(result['dc:creator']) == 'object' ? result['dc:creator'].join('; ') : result['dc:creator'];
			}
			let description = result['dc:description'];
			if(description) {
				description = typeof(result['dc:description']) == 'object' ? result['dc:description'].join('; ') : result['dc:description'];
			}
			return {
				title : title,
				date : date,
				creator : creator,
				description : description
			}

		}
		return null;
	}

}

export default MetadataSchemaUtil;