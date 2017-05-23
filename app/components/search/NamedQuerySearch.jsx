import CollectionUtil from '../../util/CollectionUtil';
import SearchHit from './SearchHit';
import NamedQuerySelector from '../collection/NamedQuerySelector';
import SearchPluginAPI from '../../api/SearchPluginAPI';
import SPARQLPluginResultMapper from '../../util/SPARQLPluginResultMapper';

//TODO this component hasn't been used in a very long time, so it's probably outdated (May 23 2017)
//this component therefore does not have a proper ID yet
class NamedQuerySearch extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			user : this.props.user,
			plugin : this.props.plugin,
			queryName: this.props.queryName,
			activeNamedQuery: this.props.namedQuery,
			currentOutput: null //could also be a default state value for components which implement onOutput

		}
	}

	componentDidMount() {
		CollectionUtil.generateCollectionConfig(this.props.collection, this.onLoadCollectionConfig.bind(this));
	}

	onLoadCollectionConfig(config) {
		console.debug('got the config');
		this.setState({
			collectionConfig: config
		}, function() {
			console.debug('now loading the named query params');
			SearchPluginAPI.getNamedQuery(this.state.plugin, this.state.user, this.state.queryName, (plugin) => {
				console.debug(plugin);
				this.setState({activeNamedQuery :  plugin});
			});
		}.bind(this));
	}

	getQueryParams() {
		let matches = this.state.activeNamedQuery.query.match(/___(.*?)___/g);
		return [...new Set(matches)];
	}

	submitNamedQuery(e) {
		e.preventDefault();
		console.debug(this.state.activeNamedQuery);

		let params = this.getQueryParams();
		let values = {};
		params.forEach((p)=>{
			let key = p.replace(/___/g, '');
			values[key] = this.refs[key].value;
		})
		SearchPluginAPI.executeNamedQuery(
			this.state.activeNamedQuery.plugin,
			this.state.activeNamedQuery.user,
			this.state.activeNamedQuery.queryName,
			values,
			(data) => {
				this.onOutput.call(this, this.constructor.name, SPARQLPluginResultMapper.formatResultData(data));
			}
		);
	}

	/* ------------------------------------------------------------------------------
	------------------------------- COMMUNICATION WITH OWNER/RECIPE -----------------
	------------------------------------------------------------------------------- */

	onOutput(componentClass, data) {
		console.debug(componentClass);
		//passes along the output to the owner (if specified in the props)
		if(this.props.onOutput) {
			this.props.onOutput(componentClass, data);
		}
		//stores the current output of the last search in the state (for bookmarking)
		if(componentClass == 'NamedQuerySearch') {
			this.setState({currentOutput: data});
		}
	}


	/* ---------------------- RENDER ------------------- */

	render() {
		if(this.state.collectionConfig) {
			let queryForm = null;
			let resultList = null;
			//generates the query form
			if(this.state.activeNamedQuery) {
				let queryFormFields = this.getQueryParams().map((key) => {
					key = key.replace(/___/g, '');
					return (
						<div key={'__qf__' + key} className="form-group">
							<label htmlFor={'__qfi__' + key}>{key}</label>
							<input ref={key} type="text" className="form-control" id={'__qfi__' + key}/>
						</div>
					)
				});
				if(queryFormFields.length > 0) {
					queryForm = (
						<form key="query_form" onSubmit={this.submitNamedQuery.bind(this)}>
							{queryFormFields}
							<button className="btn btn-default">
								Submit query
							</button>
						</form>
					)
				}
			}

			//TODO make this better (check for empty stuff)
			if(this.state.currentOutput) {
				let items = this.state.currentOutput.map((result, index) => {
					console.debug(result);
					return (
						<SearchHit
							key={'__' + index}
							result={result}
							collectionConfig={this.state.collectionConfig}
							itemDetailsPath={this.props.itemDetailsPath}/>
					)
				}, this);
				if(items) {
					resultList = (
						<div>
							Found: {this.state.currentOutput.length}
							{items}
						</div>
					)
				}
			}

			return (
				<div>
					<div className="row">
						<div className="col-md-12">
							{queryForm}
							{resultList}
						</div>
					</div>
				</div>
			)
		} else {
			return (<div>Loading collection configuration...</div>);
		}
	}
}

export default NamedQuerySearch;