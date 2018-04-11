import AggregationCreator from './AggregationCreator';
import FlexModal from '../FlexModal';
import IDUtil from '../../util/IDUtil';
import ElasticsearchDataUtil from '../../util/ElasticsearchDataUtil';
import ComponentUtil from "../../util/ComponentUtil";
import ReactTooltip from 'react-tooltip';
import {
    LineChart,
    PieChart,
    Cell,
    COLORS,
    Line,
    Pie,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Label,
    ResponsiveContainer,
    BarChart,
    Legend,
    Bar
} from 'recharts';
import TimeUtil from "../../util/TimeUtil";

//this component draws the aggregations (a.k.a. facets) and merely outputs the user selections to the parent component
class AggregationList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showModal: false
        }
        this.CLASS_PREFIX = 'agl';
        this.minToShow = 2;
    }

    //communicates the selected facets back to the parent component
    //TODO update later!!
    onOutput(desiredFacets, selectedFacets) {
        // console.log(desiredFacets, selectedFacets);
        if (this.props.onOutput) {
            this.props.onOutput(this.constructor.name, {
                desiredFacets: desiredFacets,
                selectedFacets: selectedFacets
            })
        }
    }

    onComponentOutput(componentClass, data) {
        if (componentClass == 'AggregationCreator' && data) {
            const desiredFacets = this.props.desiredFacets;
            desiredFacets.push(data);
            this.onOutput(desiredFacets, this.props.selectedFacets);
            ComponentUtil.hideModal(this, 'showModal', 'field_select__modal', true);
        }
    }

    componentDidMount() {
        this.setFacetsFolding();
    }

    setFacetsFolding() {
        let min = this.minToShow,
            selectedOpts = 0;
        Array.from(document.getElementsByClassName("checkboxGroup")).map((item, index) => {
            selectedOpts = document.querySelectorAll('#index__' + index + ' input[type="checkbox"]:checked').length;
            item.querySelectorAll("ul>li").forEach(
                function (currentValue, currentIndex, listObj) {
                    selectedOpts = min > selectedOpts ? min : selectedOpts;
                    if (currentIndex >= selectedOpts) {
                        currentValue.hidden = true;
                    }
                }
            )
        });
    }

    toggleSelectedFacet(key, value, e) {
        console.log(key, value)
        const facets = this.props.selectedFacets;
        if (facets) {
            if (facets[key]) {
                const index = facets[key].indexOf(value);
                if (index == -1) {
                    facets[key].push(value); //add the value
                } else {
                    facets[key].splice(index, 1); // remove the value
                    if (facets[key].length == 0) {
                        delete facets[key];
                    }
                }
            } else {
                facets[key] = [value]
            }

            //output to the parent component
            this.onOutput(this.props.desiredFacets, facets);
        }
    }

    __changeBtnContext(t) {
        document.querySelector("#index__" + t.index + " .switchIcon").classList.remove(t.classToRemove);
        document.querySelector("#index__" + t.index + " .switchIcon").classList.add(t.classToAdd);
        document.querySelector("#index__" + t.index + " .switchViewText").textContent = t.text;
    }

    switchListView(index) {
        let btnText = document.querySelectorAll("#index__" + index + " .switchViewText")[0].textContent,
            jCurrentList = Array.from(document.querySelectorAll("#index__" + index + " ul>li")),
            currentlyChecked = 0;

        if (btnText === "Show More") {
            this.__changeBtnContext({
                index: index,
                text: "Show Less",
                classToRemove: "glyphicon-plus",
                classToAdd: "glyphicon-minus"
            });
            jCurrentList.map((item) => {
                item.hidden = false;
            });
        } else {
            // hide elements after clicking Show Less based on min already set or the current number of selected opts.
            currentlyChecked = document.querySelectorAll("#index__" + index + ' input[type="checkbox"]:checked').length;
            currentlyChecked = currentlyChecked > this.minToShow ? currentlyChecked : this.minToShow;
            jCurrentList.map((item, index) => {
                if (index >= currentlyChecked) {
                    item.hidden = true;
                }
            });
            this.__changeBtnContext({
                index: index,
                text: "Show More",
                classToRemove: "glyphicon-minus",
                classToAdd: "glyphicon-plus"
            });
        }
    }

    toggleDesiredFacet(key) {
        const desiredFacets = this.props.desiredFacets;
        for (let i = desiredFacets.length - 1; i >= 0; i--) {
            if (desiredFacets[i].field == key) {
                desiredFacets.splice(i, 1);
                break;
            }
        }
        this.onOutput(desiredFacets, this.props.selectedFacets);
    }

    toggleViewMode(key) {
        return false;
    }

    pieFacetsOpt(val, selected) {
        console.log('pie facets opts', selected, selected.key, selected.doc_count, val);
        this.toggleSelectedFacet(val, selected.key);
    }


    //now all types of aggregations are drawn as simple lists of checkboxes. This should be updated
    render() {
        const facets = [];
        let aggregationCreatorModal = null,
            pieChart = null;
        //collection modal
        if (this.state.showModal) {
            aggregationCreatorModal = (
                <FlexModal
                    elementId="field_select__modal"
                    stateVariable="showModal"
                    owner={this}
                    title="Create a new aggregation">
                    <AggregationCreator
                        collectionConfig={this.props.collectionConfig}
                        onOutput={this.onComponentOutput.bind(this)}/>
                </FlexModal>
            )
        }
        //TODO: add a condition to load a list or the pie chart based on the current set options
        Object.keys(this.props.aggregations).forEach((key, index) => {
            let sortedOpts = [];

            const options = this.props.aggregations[key].map((facet, fIndex) => {
                const value = facet.date_millis ? facet.date_millis : facet.key,
                    facetId = key + '|' + value;

                let checkedOpt = false;

                if (this.props.selectedFacets[key]) {
                    checkedOpt = this.props.selectedFacets[key].indexOf(value) > -1;
                }
                return (
                    <li key={'facet__' + index + '__' + fIndex}
                        className={IDUtil.cssClassName('facet-item', this.CLASS_PREFIX)}>
                        <div className="checkbox">
                            <input id={facetId}
                                   type="checkbox"
                                   checked={checkedOpt}
                                   onClick={this.toggleSelectedFacet.bind(this, key, facet.key)}/>
                            <label>
                                <span> </span>
                                {facet.key}&nbsp;({facet.doc_count})
                            </label>
                        </div>
                    </li>
                )
            });

            // placing checked options on top of list.
            options.forEach(function (item) {
                if (item.props.children.props.children[0].props.checked) {
                    sortedOpts.unshift(item)
                } else {
                    sortedOpts.push(item)
                }
            });

            if (sortedOpts.length > 0) {
                let changeViewItems = null;

                if (sortedOpts.length > this.minToShow) {
                    changeViewItems = (
                        <a className="switchView" onClick={this.switchListView.bind(this, index)}>
                            <span className="switchViewText">Show More</span>
                            <span className="switchIcon glyphicon glyphicon-plus" aria-hidden="true"/>
                        </a>
                    );
                }
                facets.push((
                    <div className="checkboxGroup" key={'facet__' + index} id={'index__' + index}>
                        <h4>{ElasticsearchDataUtil.getAggregationTitle(key, this.props.facets)}
                            <span data-for={'__ci_tooltip'} data-tip={key} data-html={true}>
							    <i className="fa fa-info-circle"/>
						    </span>
                            <span className="fa fa-remove" onClick={this.toggleDesiredFacet.bind(this, key)}/>
                            <span className="glyphicon glyphicon-modal-window"
                                  onClick={this.toggleViewMode.bind(this, key)}/>

                        </h4>
                        <ul className={IDUtil.cssClassName('facet-group', this.CLASS_PREFIX)}>
                            {sortedOpts}
                        </ul>
                        {changeViewItems}
                        <ReactTooltip id={'__ci_tooltip'}/>
                    </div>
                ))
            }

            const mrg = {"top": 0, "right": 0, "bottom": 0, "top": 0};
            const COLORS = [
                '#468dcb',
                '#00C49F',
                '#F0C873',
                '#EC622D',
                '#AEB7A4'
            ];

            pieChart = (
                <div className={IDUtil.cssClassName('query-pie-chart')}>
                    <h3>{ElasticsearchDataUtil.getAggregationTitle(key, this.props.facets)}</h3>
                    <ResponsiveContainer width="100%" height="40%">

                        <PieChart>
                            <Pie
                                onClick={this.pieFacetsOpt.bind(this, 'bg:keywords.bg:keyword.keyword')}
                                data={this.props.aggregations['bg:keywords.bg:keyword.keyword']}
                                isAnimationActive={true}
                                margin={mrg}
                                dataKey="doc_count"
                                nameKey="key"
                                outerRadius={110}
                                fill="#8884d8"
                            >
                                {
                                    this.props.aggregations[key].map((entry, index) => <Cell
                                        fill={COLORS[index % COLORS.length]}/>)
                                }
                            </Pie>
                            <Tooltip/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            );
        });

        return (
            <div className={IDUtil.cssClassName('aggregation-list checkboxes')}>
                {aggregationCreatorModal}
                <li key={'new__tab'} className={IDUtil.cssClassName('tab-new', this.CLASS_PREFIX)}>
                    <a href="javascript:void(0);" onClick={ComponentUtil.showModal.bind(this, this, 'showModal')}>
                        NEW&nbsp;<i className="fa fa-plus"></i>
                    </a>
                </li>
                {pieChart}
                {facets}
            </div>
        )
    }
}

export default AggregationList;