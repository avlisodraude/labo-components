import FlexRouter from './util/FlexRouter';
import IDUtil from './util/IDUtil';
import ComponentUtil from './util/ComponentUtil';
import CollectionUtil from './util/CollectionUtil';
import FlexBox from './components/FlexBox';
import FlexModal from './components/FlexModal';
import CollectionAnalyser from './components/collection/CollectionAnalyser';
import CollectionSelector from './components/collection/CollectionSelector';
import CollectionStats from './components/collection/CollectionStats';
import FieldAnalysisStats from './components/collection/FieldAnalysisStats';
import QueryComparisonLineChart from './components/stats/QueryComparisonLineChart';

class CollectionsRecipe extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			selectedCollections : {},
			activeCollection : null,
			collectionStats : null, //output from the collectionSelector
			fieldAnalysisStats : null, //output from the CollectionAnalyser
			fieldAnalysisTimeline : null //output from the CollectionAnalyser
		}
	}

	componentDidMount() {
		if(this.props.params.cids) {
			CollectionUtil.generateCollectionConfigs(this.props.params.cids.split(','), this.onConfigsLoaded.bind(this));
		}
	}

	onConfigsLoaded(configs) {
		let selectedCollections = {}
		configs.forEach((conf) => {
			selectedCollections[conf.collectionId] = conf;
		});
		this.setState({
			selectedCollections : selectedCollections
		});
	}

	//redeives data from child components
	onComponentOutput(componentClass, data) {
		if(componentClass == 'CollectionSelector') {
			if(data) {
				let sc = this.state.selectedCollections;
				sc[data.collectionId] = data;
				this.setState(
					{
						selectedCollections : sc,
						activeCollection : data.collectionId,
						fieldAnalysisStats : null,
						fieldAnalysisTimeline : null
					},
					this.onCollectionAdded.bind(this)
				);

			}
		} else if(componentClass == 'CollectionAnalyser') {
			this.setState({
				fieldAnalysisStats : data.fieldAnalysisStats,
				fieldAnalysisTimeline : data.fieldAnalysisTimeline
			})
		}
	}

	onCollectionAdded() {
		ComponentUtil.hideModal(this, 'showModal', 'collection__modal', true)
		this.updateBrowserHistory();
	}

	removeCollection(collectionId) {
		let collections = this.state.selectedCollections;
		let ac = this.state.activeCollection;
		delete collections[collectionId];

		let newStateObj = {
			selectedCollections : collections
		}
		//if you remove the selected collection also reset the active stats/visuals
		if(ac == collectionId) {
			newStateObj['activeCollection'] = null;
			newStateObj['fieldAnalysisStats'] = null;
			newStateObj['fieldAnalysisTimeline'] = null;
		}
		this.setState(newStateObj, this.updateBrowserHistory.bind(this))
	}

	setActiveCollection(e) {
		let collectionId = e.target.id;
		this.setState({
			activeCollection : collectionId,
			fieldAnalysisStats : null, //reset the field stats
			fieldAnalysisTimeline : null //reset the analysis timeline
		})
	}

	updateBrowserHistory() {
		let params = null;
		if(Object.keys(this.state.selectedCollections).length > 0) {
			params = {cids : Object.keys(this.state.selectedCollections).join(',')};
		}
		FlexRouter.setBrowserHistory(
			params,
			this.constructor.name
		);
	}

	submitToRecipe(e) {
		e.preventDefault();
		let recipeId = this.refs.recipe.value;
		var cids = Object.keys(this.state.selectedCollections);
		var recipe = this.getRecipe(recipeId);
		if(cids && recipe) {
			FlexRouter.gotoSearch(recipe.path, cids);
		}
	}

	getRecipe(recipeId) {
		if(this.props.recipe.ingredients.recipes) {
			let tmp = this.props.recipe.ingredients.recipes.filter((r) => {
				return r.id == recipeId;
			});
			if(tmp.length == 1) {
				return tmp[0]
			}
		}
		return null;
	}

	showCollectionStats(collectionId, e) {
		e.stopPropagation();
		let collectionData = this.getCollectionData(collectionId);
		if(collectionData) {
			this.setState({
				showStatsModal : true,
				activeCollectionStats : collectionData.collectionStats
			});
		}
	}

	getCollectionData(collectionId) {
		if(this.state.selectedCollections) {
			return this.state.selectedCollections[collectionId];
		}
		return null;
	}

	render() {
		let activeData = this.getCollectionData(this.state.activeCollection);

		let collectionModal = null; //for selecting collections for the list
		let collectionBlock = null; //shows all selected collections

		let statsModal = null; //for selecting collections for the list

		let analysisBlock = null; //only shown after a collection has been selected

		let fieldAnalysisTimeline = null; //show the timeline at the bottom

		if(this.state.selectedCollections) {
			let items = Object.keys(this.state.selectedCollections).map((key) => {
				let c = this.state.selectedCollections[key];
				let classNames = ['list-group-item'];
				if(key == this.state.activeCollection) {
					classNames.push('active');
				}
				return (
					<li key={key} id={key} className={classNames.join(' ')} onClick={this.setActiveCollection.bind(this)}>
						<span className="fa fa-remove" onClick={this.removeCollection.bind(this, key)}></span>
						&nbsp;
						{c.collectionInfo.title}
						<button className="btn btn-default" style={{float : 'right', marginTop : '-5px'}}
							onClick={this.showCollectionStats.bind(this, key)} title="Inspect collection">
							<span className="fa fa-bar-chart text-muted"></span>
						</button>
					</li>
				)
			});

			let recipes = this.props.recipe.ingredients.recipes.map((r) => {
				return (<option id={r.id} value={r.id}>{r.label}</option>);
			});
			collectionBlock = (
				<FlexBox title="Selected collections">
					<div className="flex-input-area">
						<div className="text-right">
							<button className="btn btn-primary"	onClick={ComponentUtil.showModal.bind(this, this, 'showModal')}>
								Add collection&nbsp;<i className="fa fa-plus"></i>
							</button>
						</div>
						<br/>
						<ul className="list-group">
							{items}
						</ul>
						<form onSubmit={this.submitToRecipe.bind(this)}>
							<select ref="recipe" className="form-control">
								{recipes}
							</select>
							<br/>
							<div className="text-right">
								<button type="submit" className="btn btn-default">
									Submit collections to  recipe
								</button>
							</div>
						</form>
					</div>
				</FlexBox>
			)
		}

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

		//showing the (Elasticsearch) stats of the selected collection
		if(this.state.showStatsModal) {
			statsModal = (
				<FlexModal
					elementId="stats__modal"
					stateVariable="showStatsModal"
					owner={this}
					size="large"
					title="Collection stats">
						<CollectionStats data={this.state.activeCollectionStats}/>
				</FlexModal>
			)
		}

		//TODO make sure that this is only shown when a collection has been selected
		if(activeData) {
			let collectionAnalyser = null;
			let fieldAnalysisStats = null;

			//the collection analyser outputs the field analysis & timeline stats in onComponentOutput
			collectionAnalyser = (
				<CollectionAnalyser
					params={this.props.recipe.ingredients.collectionAnalyser}
					collectionStats={activeData.collectionStats}
					onOutput={this.onComponentOutput.bind(this)}
				/>
			);

			if(this.state.fieldAnalysisStats) {
				fieldAnalysisStats = (<FieldAnalysisStats data={this.state.fieldAnalysisStats}/>);
			}

			if(this.state.fieldAnalysisTimeline) {
				fieldAnalysisTimeline = (
					<QueryComparisonLineChart
						data={this.state.fieldAnalysisTimeline}
						comparisonId="1"
						searchId={IDUtil.guid()}/>
				);
			}

			analysisBlock = (
				<FlexBox title="Collection analysis">
					<div className="flex-input-area">
						<div className="row">
							<div className="col-md-12">
								{collectionAnalyser}
							</div>
						</div>
						<div className="row">
							<div className="col-md-12">
								{fieldAnalysisStats}
							</div>
						</div>
					</div>
				</FlexBox>
			)
		}

		return (
			<div className="row">
				{collectionModal}
				{statsModal}
				<div className="col-md-12">
					<div className="row">
						<div className="col-md-6">
							{collectionBlock}
						</div>
						<div className="col-md-6">
							{analysisBlock}
						</div>
					</div>
					<div className="row">
						<div className="col-md-12">
							{fieldAnalysisTimeline}
						</div>
					</div>
				</div>

			</div>
		)
	}

}

export default CollectionsRecipe;