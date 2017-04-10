//for the collection selector in a modal
import CollectionSelector from '../collection/CollectionSelector';
import FlexModal from '../FlexModal';

//for search
import QueryBuilder from './QueryBuilder';
import IDUtil from '../../util/IDUtil';
import ComponentUtil from '../../util/ComponentUtil';
import FlexBox from '../FlexBox';

/*
NOTES:
	- this component only is used to draw the tabbed query/collection panel with a way to add/remove tabs
*/

class ComparativeSearch extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			user : this.props.user,
			collections : this.props.collections,
			activeCollection: this.props.collections.length > 0 ? this.props.collections[0] : null,
		}
	}

	/* ------------------------ COLLECTION CRUD --------------------- */

	removeCollection(collectionId) {
		let cs = this.state.collections;
		let index = cs.indexOf(collectionId);
		if(index != -1) {
			cs.splice(index, 1);
			this.setState({
				collections : cs,
				activeCollection : cs.length > 0 ? cs[0] : null
			});
		}
	}

	/* ------------------------------------------------------------------------------
	------------------------------- COMMUNICATION WITH OWNER/RECIPE -----------------
	------------------------------------------------------------------------------- */

	//the output of this component is whatever comes back from a QueryBuilder component
	onOutput(componentClass, data) {
		//passes along the output to the owner (if specified in the props)
		if(this.props.onOutput) {
			this.props.onOutput(componentClass, data);
		}

	}

	//connected to the onOutput of the CollectionSelector & each QueryBuilder component
	onComponentOutput(componentClass, data) {
		if(componentClass == 'CollectionSelector') {
			let cs = this.state.collections;
			if(cs.indexOf(data.collectionId) == -1) {
				cs.push(data.collectionId);
				this.setState(
					{
						collections : cs,
						activeCollection : data.collectionId
					},
					ComponentUtil.hideModal(this, 'showModal', 'collection__modal', true)
				);
			}
		} else if(componentClass == 'QueryBuilder') {
			//output the data to the parent component
			this.onOutput(componentClass, data);
		}
	}

	/* ---------------------- RENDER ------------------- */

	render() {
		let collectionModal = null;

		//collection modal
		if(this.state.showModal) {
			collectionModal = (
				<FlexModal
					elementId="collection__modal"
					stateVariable="showModal"
					owner={this}
					title="Select a collection">
						<CollectionSelector
							onOutput={this.onComponentOutput.bind(this)}
							showSelect={true}
							showBrowser={true}
							showStats={false}/>
				</FlexModal>
			)
		}

		//for drawing the tabs
		let searchTabs = this.state.collections.map(function(c) {
			let className = this.state.activeCollection === c ? 'active' : '';
			return (
				<li key={c + '__tab_option'}
					className={className}>
					<a data-toggle="tab" href={'#' + c}>
						{c}
						<i className="fa fa-close" onClick={this.removeCollection.bind(this, c)}></i>
					</a>
				</li>)
		}, this)

		//add a button for opening the collection selector last
		searchTabs.push(
			<li className="tab-new">
				<a href="javascript:void(0);" onClick={ComponentUtil.showModal.bind(this, this, 'showModal')}>
					NEW&nbsp;<i className="fa fa-plus"></i>
				</a>
			</li>
		);

		//these are the facet search UI blocks put into different tabs
		const searchTabContents = this.state.collections.map(function(c) {
			//determine the search component (so far there is only one...)
			let searchComponent = null;
			searchComponent = (
				<QueryBuilder
					key={c + '__fs'} //IDUtil.guid()} TODO this id is used elsewhere too
					user={this.props.user}
					collection={c}
					pageSize={this.props.pageSize ? this.props.pageSize : 10}
					header={false}
					searchAPI={_config.SEARCH_API_BASE}
					itemDetailsPath={this.props.itemDetailsPath}
					aggregationView={this.props.aggregationView}
					timeSlider={this.props.timeSlider}
					searchParams={null} //TODO when ComparativeSearchRecipe knows how to store all q's in the URL
					onOutput={this.onComponentOutput.bind(this)}/>

			)

			//populate the tab contents with the search component
			let className = this.state.activeCollection === c ? 'tab-pane active' : 'tab-pane';
			return (
				<div key={c + '__tab_content'}
					id={c}
					className={className}>
					<h3>{c}</h3>
					{searchComponent}
				</div>
				);
		}, this);

		return (
			<div className="row">
				{collectionModal}
				<div className="col-md-12">
					<ul className="nav nav-tabs">
						{searchTabs}
					</ul>
					<div className="tab-content">
						{searchTabContents}
					</div>
				</div>
			</div>
		)
	}
}

export default ComparativeSearch;