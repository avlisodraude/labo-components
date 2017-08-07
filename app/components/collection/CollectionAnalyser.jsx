import CollectionAPI from '../../api/CollectionAPI';
import IDUtil from '../../util/IDUtil';
import CollectionStats from './CollectionStats';
import FieldAnalysisStats from './FieldAnalysisStats';
import QueryComparisonLineChart from '../stats/QueryComparisonLineChart';
import CollectionSelector from './CollectionSelector';
import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';
import FlexBox from '../FlexBox';

//this component relies on the collection statistics as input
class CollectionAnalyser extends React.Component {

	constructor(props) {
		super(props);
		let stats = this.props.collectionStats ? this.props.collectionStats : null;
		let docStats = stats ? stats.collection_statistics.document_types[0] : null;
		this.state = {
			//collectionStats : stats,
			activeDocumentType: docStats ? docStats.doc_type : null,

			fieldAnalysisStats : null, //contains the results of the field analysis
			fieldAnalysisTimeline: null //contains the timeline data
		}
	}

	//only happens on the onchange of a document type
	setFields() {
		let select = document.getElementById("doctype_select");
		let docType = select.options[select.selectedIndex].value;
		this.setState({activeDocumentType : docType});
	}

	analyseField() {
		this.setState({
			fieldAnalysisStats : null,
			fieldAnalysisTimeline : null
		}, this.loadAnalysis((data, timelineData) => {
			this.setState(
				{
					fieldAnalysisStats : data,
					fieldAnalysisTimeline : timelineData
				},
				this.onOutput({
					fieldAnalysisStats : data,
					fieldAnalysisTimeline : timelineData
				})
			);
		}));
	}

	loadAnalysis(callback) {
		let analysisSelect = document.getElementById("analysisfield_select");
		if(analysisSelect) {
			let analysisField = analysisSelect.options[analysisSelect.selectedIndex].value;
			let dateSelect = document.getElementById("datefield_select");
			if(dateSelect) {
				let dateField = dateSelect.options[dateSelect.selectedIndex].value;
				let stats = this.state.collectionStats ? this.state.collectionStats : this.props.collectionStats;
				var facets = [];

				CollectionAPI.analyseField(
					stats.service.collection, //TODO make this safe!
					this.state.activeDocumentType, // can be changed here
					dateField,
					analysisField,
					facets,
					(data) => {
						let timelineData = this.toTimelineData(data);
						callback(data, timelineData);
					}
				);
			}
		} else {
			console.debug('No analysis select field available yet!');
		}
	}

	toTimelineData(data) {
		let timelineData = {
			total: {timeline: [], prettyQuery : 'Total'},
			present: {timeline: [], prettyQuery : 'Present'},
			missing: {timeline: [], prettyQuery : 'Missing'}
		};
		if(data) {
			for (let item in data.timeline) {
				timelineData.total.timeline.push({
					year: data.timeline[item].year,
					count: data.timeline[item].background_count,
					queryId: 'total'
				});
				timelineData.present.timeline.push({
					year: data.timeline[item].year,
					count: data.timeline[item].field_count,
					queryId: 'present'
				});
				timelineData.missing.timeline.push({
					year: data.timeline[item].year,
					count: data.timeline[item].background_count - data.timeline[item].field_count,
					queryId: 'missing'
				});
			}
		}
		return timelineData;
	}

	/* --------------------------------- ON OUTPUT -------------------------------- */

	onOutput(data) {
		if(this.props.onOutput) {
			this.props.onOutput(this.constructor.name, data);
		}
	}

	//redeives data from child components
	onComponentOutput(componentClass, data) {
		if(componentClass == 'CollectionSelector') {
			this.setState({
				collectionStats : data ? data.collectionStats : null,
				fieldAnalysisStats : null,
				fieldAnalysisTimeline : null
			});
		}
	}

	render() {
		//input fields
		let collectionSelector = null;
		let documentTypeSelect = null;
		let dateFieldSelect = null;
		let analysisFieldSelect = null;

		//output components
		let collectionStats = null;
		let fieldAnalysisStats = null;
		let collectionTimeline = null;


		//draw the collection selector
		if(this.props.params.collectionSelector === true) {
			collectionSelector = (
				<CollectionSelector onOutput={this.onComponentOutput.bind(this)} showSelect={true}
							showBrowser={false}/>
			)
		}

		//only draw the rest when a collection is selected (either using the selector or via the props)
		if(this.props.collectionStats || this.state.collectionStats) {
			//the state take precedence over the props, since it is possible to pass stats,
			//but also allow for selecting a different collection
			let stats = this.state.collectionStats ? this.state.collectionStats : this.props.collectionStats;

			//then determine the active document type stats for drawing the datefield and analysis field pull downs
			let docStats = null;
			for(var i=0;i<stats.collection_statistics.document_types.length;i++) {
				if(stats.collection_statistics.document_types[i].doc_type == this.state.activeDocumentType) {
					docStats = stats.collection_statistics.document_types[i];
					break;
				}
			}

			//the document type selection part
			let docTypeOptions = stats.collection_statistics.document_types.map((docType) => {
				return (
					<option key={docType.doc_type} value={docType.doc_type}>{docType.doc_type}</option>
				)
			});

			docTypeOptions.splice(0,0,<option key='null__option' value='null__option'>-- Select --</option>);

			documentTypeSelect = (
				<div className="form-group">
					<label htmlFor="doctype_select" className="col-sm-3">Document type</label>
					<div className="col-sm-9">
						<select className="form-control" id="doctype_select" onChange={this.setFields.bind(this)}>
							{docTypeOptions}
						</select>
					</div>
				</div>
			);


			//the analysis and date field selection part
			if(docStats) {
				let dateFieldOptions = null;
				if(docStats.fields.date) { //only if there are date fields available
					dateFieldOptions = docStats.fields.date.map((dateField) => {
						return (
							<option key={dateField} value={dateField}>{ElasticsearchDataUtil.toPrettyFieldName(dateField)}</option>
						)
					});
					dateFieldOptions.splice(0,0,<option key='null__option' value='null__option'>-- Select --</option>);

					dateFieldSelect = (
						<div className="form-group">
							<label htmlFor="datefield_select" className="col-sm-3">Date field</label>
							<div className="col-sm-9">
								<select className="form-control" id="datefield_select" onChange={this.analyseField.bind(this)}>
									{dateFieldOptions}
								</select>
							</div>
						</div>
					);
				}


				let fieldTypes = Object.keys(docStats.fields);
				let analysisFieldOptions = [];
				fieldTypes.forEach((fieldType) => {
					docStats.fields[fieldType].forEach((fieldName) => {
						analysisFieldOptions.push(
							<option key={fieldName} value={fieldName}>{ElasticsearchDataUtil.toPrettyFieldName(fieldName)}</option>
						)
					});
				});

				analysisFieldOptions.splice(0,0,<option key='null__option' value='null__option'>-- Select --</option>);

				analysisFieldSelect = (
					<div className="form-group">
						<label htmlFor="analysisfield_select" className="col-sm-3">Analysis field</label>
						<div className="col-sm-9">
							<select className="form-control" id="analysisfield_select" onChange={this.analyseField.bind(this)}>
								{analysisFieldOptions}
							</select>
						</div>
					</div>
				);
			}

			if(this.props.params.collectionStats == true) {
				collectionStats = (<CollectionStats data={stats}/>);
			}

			//draw the field analysis stats (if configured this way)
			if(this.props.params && this.props.params.fieldAnalysisStats == true) {
				if(this.state.fieldAnalysisStats) {
					fieldAnalysisStats = (<FieldAnalysisStats data={this.state.fieldAnalysisStats}/>);
				}
			}

			//draw the timeline
			if(this.props.params && this.props.params.timeline == true) {
				if(this.state.fieldAnalysisTimeline) {
					collectionTimeline = (
						<QueryComparisonLineChart
							data={this.state.fieldAnalysisTimeline}
							comparisonId="1"
							searchId={IDUtil.guid()}/>
					);
				}
			}
		}
		return (
			<div className={IDUtil.cssClassName('collection-analyser')}>
				<div className="row">
					<div className="col-md-12">
						<div className="row">
							<div className="col-md-12">
								<form className="form-horizontal">
									{collectionSelector}
								</form>
							</div>
						</div>
						<div className="row">
							<div className="col-md-12">
								<form className="form-horizontal">
									{documentTypeSelect}
									{dateFieldSelect}
									{analysisFieldSelect}
								</form>
							</div>
						</div>
						<div className="row">
							<div className="col-md-6">
								{collectionStats}
							</div>
							<div className="col-md-6">
								{fieldAnalysisStats}
							</div>
						</div>
						<div className="row">
							<div className="col-md-12">
								{collectionTimeline}
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}

};

export default CollectionAnalyser;