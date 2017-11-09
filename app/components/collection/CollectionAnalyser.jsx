import CollectionAPI from '../../api/CollectionAPI';
import IDUtil from '../../util/IDUtil';
import CollectionStats from './CollectionStats';
import FieldAnalysisStats from './FieldAnalysisStats';
import QueryComparisonLineChart from '../stats/QueryComparisonLineChart';
import CollectionSelector from './CollectionSelector';
import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';
import Autosuggest from 'react-autosuggest';

//this component relies on the collection statistics as input
class CollectionAnalyser extends React.Component {
	constructor(props) {
		super(props);
		const collectionConfig = this.props.collectionConfig ? this.props.collectionConfig : null;
		const stats = collectionConfig ? collectionConfig.collectionStats : null;
		const docStats = stats ? stats.collection_statistics.document_types[0] : null;
		let selectedAnalysisFieldOption = false;

		this.state = {
			collectionConfig : collectionConfig,
			activeDocumentType: docStats ? docStats.doc_type : null,
            value : '', //the label of the selected classification (autocomplete)
            suggestionId : null, //stores the id/uri of the selected classification (e.g. GTAA URI)
            suggestions : [], //current list of suggestions shown
            isLoading : false, //loading the suggestions from the server
			fieldAnalysisStats : null, //contains the results of the field analysis
			fieldAnalysisTimeline: null //contains the timeline data
		}
        this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this)
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
        const analysisSelect = document.getElementsByClassName("react-autosuggest__container");

        if (analysisSelect) {
            const analysisField =
				this.selectedAnalysisFieldOption
					? this.selectedAnalysisFieldOption
					: 'null__option';
            const dateSelect = document.getElementById("datefield_select");

            if (dateSelect) {
                const dateField = dateSelect.options[dateSelect.selectedIndex].value;
                const facets = [];

                CollectionAPI.analyseField(
                    this.state.collectionConfig.collectionId, //TODO make this safe!
                    this.state.activeDocumentType, // can be changed here
                    dateField,
                    analysisField,
                    facets,
                    (data) => {
                        const timelineData = this.toTimelineData(data);
                        callback(data, timelineData);
                    }
                );
            }
        } else {
            console.debug('No analysis select field available yet!');
        }
    }

    //TODO optimize this.
	toTimelineData(data) {
		const timelineData = {};
		if(data) {
			let totalChart = [];
			let missingChart = [];
			let presentChart = [];
			for (const item in data.timeline) {
				totalChart.push({
					year: data.timeline[item].year, //y-axis
                    total: data.timeline[item].background_count, //different line on graph
				})
				presentChart.push({
					year : data.timeline[item].year, //y-axis
					present: data.timeline[item].field_count, //different line on graph
				})
				missingChart.push({
					year : data.timeline[item].year, //y-axis
					missing:data.timeline[item].background_count - data.timeline[item].field_count //different line on graph
				})
			}

			timelineData['total'] = {
				label : 'Total',
			 	dateField : null, //what to do here?
			 	prettyQuery : null, //what to do here?
			 	data : totalChart,
			 	queryId : 'total_chart'
			}

			timelineData['missing'] = {
				label : 'Missing',
			 	dateField : null, //what to do here?
			 	prettyQuery : null, //what to do here?
			 	data : missingChart,
			 	queryId : 'missing_chart'
			}

			timelineData['present'] = {
				label : 'Present',
			 	dateField : null,
			 	prettyQuery : null, //what to do here?
			 	data : presentChart,
			 	queryId : 'present_chart'
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

	//receives data from child components
	onComponentOutput(componentClass, data) {
		if(componentClass === 'CollectionSelector') {
			this.setState({
				collectionStats : data ? data.collectionStats : null,
				fieldAnalysisStats : null,
				fieldAnalysisTimeline : null
			});
		}
	}

    /* ------------------- functions specifically needed for react-autosuggest ------------------- */
    onChange(event, { newValue }) {
        this.setState({
            chosenValue: newValue,
            value: newValue
        });
    }

    onSuggestionsFetchRequested({value}) {
        this.setState({
            suggestions: this.getSuggestions(value)
        });
    };

    getAnalysisFieldsListNames(docStats) {
        const availableSuggestions = [];

        for (const fieldType in docStats) {
            if (docStats.hasOwnProperty(fieldType)) {
                for (const fieldName in docStats[fieldType]) {
                	//each field can have multiple fieldTypes so make sure it's not already added
                	if(availableSuggestions.indexOf(docStats[fieldType][fieldName]) == -1) {
                    	availableSuggestions.push(docStats[fieldType][fieldName])
                    }
                }
            }
        }

        return availableSuggestions;
    }

    getSuggestions(value, callback) {
        const stats = this.state.collectionConfig.collectionStats;

        let docStats = null;
        for (let i = 0; i < stats.collection_statistics.document_types.length; i++) {
            if (stats.collection_statistics.document_types[i].doc_type === this.state.activeDocumentType) {
                docStats = stats.collection_statistics.document_types[i];
                break;
            }
        }

        const analysisFieldSelectionList =  this.getAnalysisFieldsListNames(docStats.fields) || [];
        const inputValue = value.trim().toLowerCase();
        const inputLength = inputValue.length;

        return inputLength <  0 ? [] : analysisFieldSelectionList.filter(analysisFieldName =>
            analysisFieldName.toLowerCase().includes(inputValue)
        );
    }

    onSuggestionSelected(event, {suggestion, suggestionValue, suggestionIndex, sectionIndex}) {
		this.selectedAnalysisFieldOption = suggestion.value;
        //TODO: this fc runs the show after conf
        this.analyseField();
    }

    getSuggestionValue(suggestion) {
        return suggestion.beautifiedValue;
    }

    //TODO the rendering should be adapted for different vocabularies
    renderSuggestion(suggestion) {
        return (
            <span key={suggestion.value} value={suggestion.value}>{suggestion.beautifiedValue}</span>
        );
    }

    onSuggestionsClearRequested() {
        this.setState({
            suggestions : []
        });
    }

    // Necessary "return true" to enable autosuggestion on input field so the user gets the
	// complete list of options without having to start typing.
    shouldRenderSuggestions() {
        return true;
    }
    /* ------------------- end of specific react-autosuggest functions ------------------- */

	render() {
		//input fields
		let collectionSelector = null;
		let analysisBlock = null;

		//draw the collection selector
		if(this.props.params.collectionSelector === true) {
			collectionSelector = (
				<div className="row">
					<div className="col-md-12">
						<form className="form-horizontal">
							<CollectionSelector onOutput={this.onComponentOutput.bind(this)} showSelect={true}
								showBrowser={false}/>
						</form>
					</div>
				</div>
			)
		}

		//only draw the rest when a collection is selected (either using the selector or via the props)
		if(this.state.collectionConfig && this.state.collectionConfig.collectionStats) {
			let documentTypeSelect = null;
			let dateFieldSelect = null;
			let analysisFieldSelect = null;

			//output components
			let collectionStats = null;
			let fieldAnalysisStats = null;
			let collectionTimeline = null;

	        // Autosuggest will pass through all these props to the input.
	        const inputProps = {
	            placeholder: 'Search a field',
	            value: this.state.value,
	            onChange: this.onChange.bind(this)
	        };

			//the state take precedence over the props, since it is possible to pass stats,
			//but also allow for selecting a different collection
			const stats = this.state.collectionConfig.collectionStats;

			//then determine the active document type stats for drawing the datefield and analysis field pull downs
			let docStats = null;
			for(let i=0;i<stats.collection_statistics.document_types.length;i++) {
				if(stats.collection_statistics.document_types[i].doc_type == this.state.activeDocumentType) {
					docStats = stats.collection_statistics.document_types[i];
					break;
				}
			}

			//the document type selection part
			const docTypeOptions = stats.collection_statistics.document_types.map((docType) => {
				return (
					<option key={docType.doc_type} value={docType.doc_type}>{docType.doc_type}</option>
				)
			});

			docTypeOptions.splice(0,0,<option key='null__option' value='null__option'>-- Select --</option>);

			//the analysis and date field selection part
			if(docStats) {
				let dateFieldOptions = null;
				if(docStats.fields.date) { //only if there are date fields available
					const sortedDateFields = ElasticsearchDataUtil.sortAndBeautifyArray(
						docStats.fields.date,
						this.props.collectionConfig
					);

					dateFieldOptions = sortedDateFields.map((dateField) => {
						return (
							<option key={dateField.value} value={dateField.value}>{dateField.beautifiedValue}</option>
						)
					});

					dateFieldOptions.splice(0,0,<option key='null__option' value='null__option'>-- Select --</option>);

					dateFieldSelect = (
						<div className="form-group">
							<label htmlFor="datefield_select" className="col-sm-3">Metadata field for date (X-axis)</label>
							<div className="col-sm-9">
								<select className="form-control" id="datefield_select" onChange={this.analyseField.bind(this)}>
									{dateFieldOptions}
								</select>
							</div>
						</div>
					);
				}

				//sort suggestions with original and beautified values.
				const sortedAndBeautified = ElasticsearchDataUtil.sortAndBeautifyArray(
					this.state.suggestions,
					this.state.collectionConfig
				);

				analysisFieldSelect = (
					<div className="form-group">
						<label htmlFor="analysisfield_select" className="col-sm-3">Metadata field to inspect (Y-axis)</label>
						<div className="col-sm-9 collectionAnalyser-autosuggest">
                            <Autosuggest
                                ref="classifications"
                                suggestions={sortedAndBeautified}
                                onSuggestionsFetchRequested={this.onSuggestionsFetchRequested.bind(this)}
                                onSuggestionsClearRequested={this.onSuggestionsClearRequested.bind(this)}
                                onSuggestionSelected={this.onSuggestionSelected.bind(this)}
                                getSuggestionValue={this.getSuggestionValue.bind(this)}
                                renderSuggestion={this.renderSuggestion.bind(this)}
								shouldRenderSuggestions={this.shouldRenderSuggestions.bind(this)}
                                inputProps={inputProps}
                            />

						</div>
					</div>
				);
			}

			if(this.props.params.collectionStats === true) {
				collectionStats = (<CollectionStats collectionConfig={this.state.collectionConfig}/>);
			}

			//draw the field analysis stats (if configured this way)
			if(this.props.params && this.props.params.fieldAnalysisStats === true) {
				if(this.state.fieldAnalysisStats) {
					fieldAnalysisStats = (<FieldAnalysisStats data={this.state.fieldAnalysisStats}/>);
				}
			}

			//draw the timeline
			if(this.props.params && this.props.params.timeline === true) {
				if(this.state.fieldAnalysisTimeline) {
					collectionTimeline = (
						<QueryComparisonLineChart
							data={this.state.fieldAnalysisTimeline}
							comparisonId={IDUtil.guid()}/>
					);
				}
			}

			analysisBlock = (
				<div className="row">
					<div className="col-md-12">
						<div className="row">
							<div className="col-md-12">
								<div className="form-horizontal">
									{dateFieldSelect}
									{analysisFieldSelect}
								</div>
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
			)
		} else {
			//if there are no stats available
			analysisBlock = (
				<div className="row">
					<div className="col-md-12">
						<h5>
							This collection is available in the registry, but is absent in the media suite index
						</h5>
					</div>
				</div>
			)
		}

		return (
			<div className={IDUtil.cssClassName('collection-analyser')}>
				<div className="row">
					<div className="col-md-12">
						{collectionSelector}
						{analysisBlock}
					</div>
				</div>
			</div>
		)
	}
};

export default CollectionAnalyser;