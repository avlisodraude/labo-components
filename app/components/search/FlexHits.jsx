import FlexRouter from '../../util/FlexRouter';
import SearchSnippet from './SearchSnippet';
import ItemDetails from './ItemDetails';
import FlexModal from '../FlexModal';

class FlexHits extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			showModal : false
		};
	}

	//BIG TODO: there must be an overarching persistent ID system to load individual records
	//eventually this should simply handle persistent (media fragment) URIs, instead of these silly params

	//this function works with search snippet data (consulted the related config.getResultSnippetData())
	gotoItemDetails(result, e) {
		if(this.props.itemDetailsPath && result.resourceId) {
			FlexRouter.gotoItemDetails(this.props.itemDetailsPath, result, this.props.searchTerm);
		} else {
			this.setState({showModal: true})
		}
	}

	quickView(e) {
		e.stopPropagation();
		this.setState({showModal: true});
	}

	render() {
		const result = this.props.collectionConfig.getItemDetailData(this.props.result, this.props.dateField);
		//TODO get rid of this separate piece of data
		const snippet = this.props.collectionConfig.getResultSnippetData(result);
		const modalID = result.resourceId.replace('@', '_') + '__modal';
		let modal = null;
		if(this.state.showModal) {
			modal = (
				<FlexModal
					elementId={modalID}
					stateVariable="showModal"
					key={result.resourceId + '__modal'}
					owner={this}
					size="large"
					title={result.title}>
					<ItemDetails data={result}/>
				</FlexModal>
			)
		}
		return (
			<div key={result.resourceId} className={snippet.type == 'media_fragment' ? 'flex-hit fragment' : 'flex-hit'}>
				<div onClick={this.gotoItemDetails.bind(this, result)}>
					<button className="btn btn-default fh-quickview"
						onClick={this.quickView.bind(this)} title="Quick view">
						<i className="fa fa-eye"></i>
					</button>
					<SearchSnippet data={snippet} searchTerm={this.props.searchTerm}/>
				</div>
				{modal}
			</div>

		);
	}
}

export default FlexHits;