import CollectionAPI from '../../api/CollectionAPI';
import IDUtil from '../../util/IDUtil';
import CollectionStats from './CollectionStats';
import FieldAnalysisStats from './FieldAnalysisStats';
import QueryComparisonLineChart from '../stats/QueryComparisonLineChart';
import CollectionSelector from './CollectionSelector';
import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';
import FlexBox from '../FlexBox';
import Autosuggest from 'react-autosuggest';

//this component relies on the collection statistics as input
class CollectionAnalyser extends React.Component {

	constructor(props) {
		super(props);
		const stats = this.props.collectionStats ? this.props.collectionStats : null;
		const docStats = stats ? stats.collection_statistics.document_types[0] : null;
		let selectedAnalysisFieldOption = false;

		this.state = {
			//collectionStats : stats,
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

	//only happens on the onchange of a document type
	setFields() {
		const select = document.getElementById("doctype_select");
		const docType = select.options[select.selectedIndex].value;
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
        const analysisSelect = document.getElementsByClassName("react-autosuggest__container");

        if (analysisSelect) {
            const analysisField =
				this.selectedAnalysisFieldOption
					? this.selectedAnalysisFieldOption.suggestion
					: 'null__option';
            const dateSelect = document.getElementById("datefield_select");

            if (dateSelect) {
                const dateField = dateSelect.options[dateSelect.selectedIndex].value;
                const stats = this.state.collectionStats ? this.state.collectionStats : this.props.collectionStats;
                const facets = [];

                CollectionAPI.analyseField(
                    stats.service.collection, //TODO make this safe!
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

	toTimelineData(data) {
		const timelineData = {
			total: {timeline: [], prettyQuery : 'Total'},
			present: {timeline: [], prettyQuery : 'Present'},
			missing: {timeline: [], prettyQuery : 'Missing'}
		};

		if(data) {
			for (const item in data.timeline) {
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

        for (const key in docStats) {
            if (docStats.hasOwnProperty(key)) {
                for (const prop in docStats[key]) {
                    availableSuggestions.push(docStats[key][prop])
                }
            }
        }

        return availableSuggestions;
    }

    getSuggestions(value, callback) {
        const stats = this.state.collectionStats ? this.state.collectionStats : this.props.collectionStats;

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
		this.selectedAnalysisFieldOption = {suggestion};
        //TODO: this fc runs the show after conf
        this.analyseField( {suggestion, suggestionValue, suggestionIndex, sectionIndex});
    }

    getSuggestionValue(suggestion) {
        return ElasticsearchDataUtil.toPrettyFieldName(suggestion);
    }

    //TODO the rendering should be adapted for different vocabularies
    renderSuggestion(suggestion) {
        return (
            <span key={suggestion} value={suggestion}>{ElasticsearchDataUtil.toPrettyFieldName(suggestion)}</span>
        );
    }

    onSuggestionsClearRequested() {
        this.setState({
            suggestions : []
        });
    }

    shouldRenderSuggestions() {
        return true;
    }
    /* ------------------- end of specific react-autosuggest functions ------------------- */

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

        // Autosuggest will pass through all these props to the input.
        const inputProps = {
            placeholder: 'Search a field',
            value: this.state.value,
            onChange: this.onChange.bind(this)
        };

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
			const stats = this.state.collectionStats ? this.state.collectionStats : this.props.collectionStats;

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

				analysisFieldSelect = (
					<div className="form-group">
						<label htmlFor="analysisfield_select" className="col-sm-3">Analysis field</label>
						<div className="col-sm-9 collectionAnalyser-autosuggest">
                            <Autosuggest
                                ref="classifications"
                                suggestions={this.state.suggestions}
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
								<div className="form-horizontal">
									{documentTypeSelect}
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
			</div>
		)
	}
};

export default CollectionAnalyser;