import SearchAPI from '../api/SearchAPI';
import SearchHit from './search/SearchHit';

export default class LabelAsAPoint extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showModal: false,
            modalData: null
        }
    }

    toTimestamp(strDate) {
        return Date.parse(strDate);
    }

    onClick(query, url) {
        let numbersPerYear = this.props.dataKey[this.props.index].date;
        query.dateRange.start = this.toTimestamp(numbersPerYear);
        query.dateRange.end = this.toTimestamp(numbersPerYear + 1);
        this.doSearch(query, false)

    }

    doSearch(query, updateUrl = false) {
        // query.offset = 23;  // checking paging
        this.setState(
            {isSearching: true},
            SearchAPI.search(
                query,
                this.props.collectionConfig,
                this.onOutput.bind(this),
                updateUrl
            )
        )
    }

    processOutput() {
        console.log(this)
    }

    //communicates all that is required for a parent component to draw hits & statistics
    onOutput(data) {
        //this propagates the query output back to the recipe, who will delegate it further to any configured visualisation

        console.log(data);
        if (data) {
            // //populate the list of search results
            const items = data.results.map((result, index) => {
                console.log(result)
                return (
                    <SearchHit
                        key={'__' + index}
                        result={result}
                        searchTerm={this.props.content.props.query.term} //for highlighting the search term
                        dateField={
                            this.props.content.props.query.dateRange ?
                                this.props.content.props.query.dateRange.field : null
                        } //for displaying the right date field in the hits
                        collectionConfig={this.state.collectionConfig}
                        itemDetailsPath={null}
                        isSelected={false} //is the result selected
                        onOutput={this.processOutput()}/>
                )
            }, this);
            let elemDiv = document.createElement('div');
            elemDiv.className += " modal";
            elemDiv.id = "blibli";
            elemDiv.innerHTML = JSON.stringify(items)
            elemDiv.style.cssText = 'position:absolute;top:0; width:100vw;height:100vh;opacity:0.5;z-index:100;background:#000;';
            document.body.appendChild(elemDiv);
        }
    }

    render() {
        const {x, y} = this.props;
        // //collection modal
        if (this.state.modalData) {
            console.log(this.state.modalData)
        }

        return (
            <circle
                className="custom-circle"
                onClick={this.onClick.bind(this, this.props.query, false)}
                cx={x}
                cy={y}
                r={8}
                fill="transparent"/>
        );
    }
}
