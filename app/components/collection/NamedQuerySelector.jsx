import SearchPluginAPI from '../../api/SearchPluginAPI.js';

class NamedQuerySelector extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			activeNamedQuery: '',
			namedQueryList : []
		}
		SearchPluginAPI.listRegisteredPlugins((plugins) => {
			console.debug(plugins)
			this.setState({namedQueryList :  plugins});
		});
	}

	generateQueryForm(event) {
		console.debug(event.target.value);
		let arr = event.target.value.split('__')
		let query = this.state.namedQueryList[arr[0]]['queries'].filter((a) => {
			return a.user == arr[1] && a.queryName == arr[2];
		})[0];
		console.debug(query);
		this.setState({activeNamedQuery : query});
	}

	//TODO get the params from this.state.activeNamedQuery.query
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
				console.debug(data)
			}
		);
	}

	/* ------------------------------------------------------------------------------
	------------------------------- COMMUNICATION WITH OWNER/RECIPE -----------------
	------------------------------------------------------------------------------- */

	onOutput(e) {
		e.preventDefault();
		if(this.props.onOutput) {
			this.props.onOutput(this.constructor.name, this.state.activeNamedQuery);
		}
	}

	render() {
		let namedQuerySelect = null;
		let queryForm = null;

		if(this.state.namedQueryList) {

			//generates the named query selection box
			let namedQueryOptions = Object.keys(this.state.namedQueryList).map((plugin) => {
				return this.state.namedQueryList[plugin]['queries'].map((query) => {
					let optionId = plugin + '__' + query.user + '__' + query.queryName;
					return (
						<option key={optionId} value={optionId}>
							{query.queryName} (user: {query.user},&nbsp;
							query: {plugin}, instance of: {this.state.namedQueryList[plugin]['class']})
						</option>
					)
				})

			});
			namedQueryOptions.splice(0, 0, <option key="null__option" value="">Select a named query</option>);

			namedQuerySelect = (
				<fieldset className="form-group">
					<label>Select named query</label>
					<select className="form-control"
						value={this.state.activeCNamedQuery}
						onChange={this.generateQueryForm.bind(this)}>
						{namedQueryOptions}
					</select>
				</fieldset>
			);


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

			return (
				<div className="row">
					<div className="col-md-12">
						<form key="collection_selector" onSubmit={this.onOutput.bind(this)}>
							{namedQuerySelect}
							<button className="btn btn-default">
								Select
							</button>
						</form>
						{queryForm}
					</div>
				</div>
			)
		} else {
			console.debug('Loading list of named queries');
			return (<h3 key="collection_list_loading">Loading list of registered named queries...</h3>)
		}
	}

};

export default NamedQuerySelector;