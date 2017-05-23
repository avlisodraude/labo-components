import FlexRouter from '../../util/FlexRouter';
import IDUtil from '../../util/IDUtil';

import SearchSnippet from './SearchSnippet';
import ItemDetails from './ItemDetails';
import FlexModal from '../FlexModal';

class SearchHit extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			showModal : false
		};
		this.CLASS_PREFIX = 'sh';
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
		let classNames = [IDUtil.cssClassName('search-hit')];
		if(snippet.type == 'media_fragment') {
			classNames.push('fragment')
		}
		return (
			<div id={result.resourceId} className={classNames.join(' ')}>
				<div onClick={this.gotoItemDetails.bind(this, result)}>
					<div className={IDUtil.cssClassName('quickview', this.CLASS_PREFIX)}>
						<button className="btn btn-default"
							onClick={this.quickView.bind(this)} title="Quick view">
							<i className="fa fa-eye"></i>
						</button>
					</div>
					<SearchSnippet data={snippet} searchTerm={this.props.searchTerm}/>
				</div>
				{modal}
			</div>

		);
	}
}

export default SearchHit;