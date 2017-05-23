import CollectionAPI from '../../api/CollectionAPI';
import CollectionUtil from '../../util/CollectionUtil';
import IDUtil from '../../util/IDUtil';

/*

TODO:
	In general this needs to be made fit for both CKAN and other collection lists (e.g. for MotU and ARTtube)

OUTPUT:
	an instance of CollectionConfig

*/

class CollectionSelector extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			activeCollection: '',
			collectionList : null
		}
		this.CLASS_PREFIX = 'cls';
	}

	componentDidMount() {
		//load the collections
		CollectionAPI.listCollections((collections) => {
			this.setState({collectionList :  collections});
		});
	}

	//only works if a collection has been properly indexed!
	selectCollection(collectionId, event) {
		if(!collectionId) {
			collectionId = event.target.value;
		}
		if(collectionId) {
			this.setState(
				{activeCollection : collectionId},
				CollectionAPI.getCollectionStats(collectionId, (stats) => {
					this.onOutput(collectionId, stats, this.getCollectionInfo(collectionId));
				})
			);
		}
	}

	getCollectionInfo(collectionId) {
		if(this.state.collectionList) {
			let tmp = this.state.collectionList.filter((c) => {
				return c.index == collectionId;
			});
			if(tmp.length == 1) {
				return tmp[0];
			}
		}
		return null;
	}

	/* ------------------------------------------------------------------------------
	------------------------------- COMMUNICATION WITH OWNER/RECIPE -----------------
	------------------------------------------------------------------------------- */

	onOutput(collectionId, collectionStats, collectionInfo) {
		var collectionConfig = CollectionUtil.createCollectionConfig(collectionId, collectionStats, collectionInfo);
		if(this.props.onOutput) {
			if(collectionId) {
				this.props.onOutput(this.constructor.name, collectionConfig);
			} else {
				console.debug('No collection selected...');
			}
		}
	}

	render() {
		let markup = null;

		if(this.state.collectionList) {
			let collectionSelect = null;
			let collectionBrowser = null;

			//the collection selection part
			if(this.props.showSelect) {
				let collectionOptions = this.state.collectionList.map((collection) => {
					return (
						<option key={collection.index + '__option'} value={collection.index}>
							{collection.title}
						</option>
					)
				});
				collectionOptions.splice(0, 0, <option key="null__option" value="">-- Select a collection --</option>);

				collectionSelect = (
					<form className="form-horizontal">
						<div className="form-group">
							<label className="col-sm-2">Collection</label>
							<div className="col-sm-10">
								<select className="form-control"
									value={this.state.activeCollection}
									onChange={this.selectCollection.bind(this, null)}>
									{collectionOptions}
								</select>
							</div>
						</div>
					</form>
				);
			}

			if(this.props.showBrowser) {

				//the collections visualized as blocks
				let collectionBlocks = this.state.collectionList.map((collection) => {
					let tmp = collection.organization.image_url;
					let image = null;
					if(tmp && tmp.indexOf('http:') != -1) {
						image = <img src={tmp}/>
					}
					return (
						<div className={IDUtil.cssClassName('collection', this.CLASS_PREFIX)}
							onClick={this.selectCollection.bind(this, collection.index)}>
							{image}
							<div className={IDUtil.cssClassName('caption', this.CLASS_PREFIX)}>
								<h4>{collection.title}</h4>
								<p>{collection.organization.title}</p>
							</div>
						</div>
					)
				});

				collectionBrowser = (
					<div className="collection-browser">
						{collectionBlocks}
					</div>
				)
			}

			markup =(
				<div className="row">
					<div className="col-md-12">
						{collectionSelect}
						{collectionBrowser}
					</div>
				</div>
			)
		} else {
			markup = (<h3>Loading collection list...</h3>)
		}

		//always return everything wrapped in an identifyable div
		return (
			<div className={IDUtil.cssClassName('collection-selector')}>
				{markup}
			</div>
		)
	}

};

export default CollectionSelector;
