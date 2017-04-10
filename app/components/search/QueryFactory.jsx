//for the collection selector in a modal
import CollectionSelector from '../collection/CollectionSelector';
import FlexModal from '../FlexModal';

//for search
import QueryBuilder from './QueryBuilder';
import IDUtil from '../../util/IDUtil';
import ComponentUtil from '../../util/ComponentUtil';
import CollectionUtil from '../../util/CollectionUtil';
import FlexBox from '../FlexBox';

import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';

/*

OUTPUT:
	which queries have been selected

*/

class QueryFactory extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			user : this.props.user,
			openQueries : [], //TODO this should listen to something like: loadedQueries
			openQueryData : {}
		}
	}

	//this loads default queries for the this.props.initialCollections
	//TODO probably move this to the comparative search recipe, components should not load data. Recipes should
	componentDidMount() {
		if(this.props.initialCollections) {
			CollectionUtil.generateCollectionConfigs(this.props.initialCollections, this.onConfigsLoaded.bind(this));
		}
	}

	onConfigsLoaded(configs) {
		let openQueries = []
		let openQueryData = {}
		configs.forEach((conf) => {
			let queryId = IDUtil.guid();
			openQueries.push(queryId)
			openQueryData[queryId] = {
				queryId : queryId,
				collectionConfig : conf
			}
		});
		this.setState({
			openQueries : openQueries,
			openQueryData : openQueryData
		});
	}

	/* ------------------------------------------------------------------------------
	------------------------------- COMMUNICATION WITH OWNER/RECIPE -----------------
	------------------------------------------------------------------------------- */

	//the output of this component is whatever comes back from a QueryBuilder component
	onOutput(data) {
		//passes along the output to the owner (if specified in the props)
		if(this.props.onOutput) {
			this.props.onOutput(this.constructor.name, data);
		}
	}

	//connected to the onOutput of the CollectionSelector & each QueryBuilder component
	onComponentOutput(componentClass, data) {
		if(componentClass == 'CollectionSelector') {
			let oq = this.state.openQueries;
			let queryId = IDUtil.guid();
			oq.push(queryId)

			let oqd = this.state.openQueryData;
			oqd[queryId] = {
				queryId : queryId,
				collectionConfig : data
			}

			this.setState(
				{openQueries : oq, openQueryData : oqd},
				ComponentUtil.hideModal(this, 'showModal', 'collection__modal', true)
			);
		} else if(componentClass == 'QueryBuilder') {
			//output the data to the parent component
			this.onOutput(data);

			//store the just executed query, so the user can save it later
			let oqd = this.state.openQueryData;
			if(data.queryId && oqd[data.queryId]) {
				oqd[data.queryId]['queryParams'] = data.params;
				this.setState({
					openQueryData : oqd
				});
			}

		}
	}

	closeQuery(queryId) {
		let oq = this.state.openQueries;
		let index = oq.indexOf(queryId);

		let oqd = this.state.openQueryData;
		delete oqd[queryId]
		if(index != -1) {
			oq.splice(index, 1);
			this.setState(
				{
					openQueries : oq,
					openQueryData : oqd
				},
				this.onOutput({queryId : queryId, deleted : true})
			);
		}
	}

	saveQuery(queryId) {
		let query = this.state.openQueryData[queryId];
		console.debug('saving query');
		console.debug(query.queryParams);

		console.debug(ElasticsearchDataUtil.toPrettyQuery(query.queryParams))
	}

	getEmptyCell() {
		return (
			<div className="cell" style={{textAlign : 'center', height : 'inherit'}}>
				<button className="btn btn-primary" onClick={ComponentUtil.showModal.bind(this, this, 'showModal')}>
					Add query&nbsp;<i className="fa fa-plus"></i>
				</button>
			</div>
		)
	}

	/* ---------------------- RENDER ------------------- */

	render() {
		let queryGrid = null;
		let collectionModal = null;

		//collection modal
		if(this.state.showModal) {
			collectionModal = (
				<FlexModal
					elementId="collection__modal"
					stateVariable="showModal"
					owner={this}
					size="large"
					title="Select a collection">
						<CollectionSelector
							onOutput={this.onComponentOutput.bind(this)}
							showSelect={true}
							showBrowser={true}/>
				</FlexModal>
			)
		}

		//for drawing the tabs
		let cells = this.state.openQueries.map(function(queryId, index) {
			//TODO draw some stuff
			let queryData = this.state.openQueryData[queryId];
			let title = queryData.collectionConfig.collectionId;
			if(queryData.collectionConfig.collectionInfo) {
				title = queryData.collectionConfig.collectionInfo.title;
			}
			return (
				<div className="cell">
					<h5>
						{'Query #' + (index + 1) + ' (' + queryData.collectionConfig.collectionInfo.title + ')'}
						&nbsp;
						<i className="fa fa-close" style={{float : 'right'}}
							onClick={this.closeQuery.bind(this, queryId)}>
						</i>
					</h5>
					<QueryBuilder
						key={queryId + '__qb'}
						queryId={queryId}
						user={this.props.user}
						collectionConfig={queryData.collectionConfig}
						pageSize={this.props.pageSize ? this.props.pageSize : 10}
						header={false}
						searchAPI={_config.SEARCH_API_BASE}
						itemDetailsPath={this.props.itemDetailsPath}
						aggregationView={this.props.aggregationView}
						timeSlider={this.props.timeSlider}
						searchParams={null} //TODO when ComparativeSearchRecipe knows how to store all q's in the URL
						onOutput={this.onComponentOutput.bind(this)}/>
				</div>
			)
		}, this);

		//always add an empty cell
		cells.push(this.getEmptyCell())


		queryGrid = (
			<div className="query-grid">
				{cells}
			</div>
		)

		return (
			<div className="row">
				{collectionModal}
				<div className="col-md-12">
					{queryGrid}
				</div>
			</div>
		)
	}
}

export default QueryFactory;