import IDUtil from '../../util/IDUtil';
/*
See:
	- http://rawgraphs.io/
	- https://bl.ocks.org/mbostock/3048450
	- http://alignedleft.com/tutorials/d3/scales/
	- https://github.com/d3/d3-scale/blob/master/README.md#time-scales
	- http://www.d3noob.org/2012/12/setting-scales-domains-and-ranges-in.html

	- https://github.com/d3/d3-selection/blob/master/README.md#selection_data
	- https://bost.ocks.org/mike/join/

	https://github.com/beeldengeluid/AVResearcherXL/blob/master/avresearcher/static/js/views/search/timeseries.js
*/

class QueryComparisonLineChart extends React.Component {

	constructor(props) {
		super(props);
		this.WIDTH = 1070;
		this.HEIGHT = 365;
		this.state = {
			activeQueries : {}
		}
		this.CLASS_PREFIX = 'qlc';
	}

	componentDidMount() {
		this.repaint()
	}

	//only update if the search id is different
	shouldComponentUpdate(nextProps, nextState) {
		return nextProps.searchId != this.props.searchId;
	}

	componentDidUpdate() {
		this.refreshAndRepaint(
			this.repaint.bind(this)
		);
	}

	refreshAndRepaint(callback) {
		const svg = document.getElementById("qclc_" + IDUtil.hashCode(this.props.comparisonId));
		while (svg.firstChild) {
			svg.removeChild(svg.firstChild);
		}
		callback();
	}

	getGraphData() {
		let graphData = [];
		if(this.props.data) {
			for(const queryId in this.props.data) {
				graphData = graphData.concat(this.props.data[queryId].timeline);
			}
		}
		return graphData
	}

	toggle(queryId) {
		const aqs = this.state.activeQueries;
		if(aqs.hasOwnProperty(queryId)) {
			aqs[queryId] = !aqs[queryId];
		} else {
			aqs[queryId] = false;
		}
		const opacity = aqs[queryId] ? 1 : 0;
        // Hide or show the elements based on the ID
        d3.select("#tag"+queryId.replace(/\s+/g, ''))
            .transition().duration(100)
            .style("opacity", opacity);

		this.setState({activeQueries : aqs});
	}

	repaint() {
		const data = this.getGraphData();

		//first define the dimensions of the graph
		const svg = d3.select('#qclc_' + IDUtil.hashCode(this.props.comparisonId));
		const margin = {top: 10, right: 30, bottom: 30, left: 50};
		const width = +svg.attr("width") - margin.left - margin.right;
    	const height = +svg.attr("height") - margin.top - margin.bottom;

    	const g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		//define the x scaling function
		const x = d3.scaleLinear()
			.domain(d3.extent(data, function(d) { return d.year; }))
			.range([0, width]) //scale to the width of the svg

		//define the y scaling function
		const y = d3.scaleLinear()
			.domain(d3.extent(data, function(d) { return d.count }))
			.range([height, 0]);

		const xAxis = d3.axisBottom()
			.scale(x)
			.tickSize(-height, 0)

		const yAxis = d3.axisLeft()
			.scale(y)
			.tickSize(-width, 0)
			.tickFormat(function(tick) {return tick; });

		// Define the line
		const lineFunc = d3.line()
		    .x(function(d) { return x(d.year); })
		    .y(function(d) { return y(d.count); });

	    // Nest the entries by symbol
	    const dataNest = d3.nest()
	        .key(function(d) {return d.queryId;})
	        .entries(data);

	    const color = d3.scaleOrdinal(d3.schemeCategory10);

	    // Add the X Axis
	    g.append("g")
	        .attr("class", "axis axis--x")
	        .attr("transform", "translate(0," + height + ")")
	        .transition()
	        .call(xAxis);

	    // Add the Y Axis
	    g.append("g")
	        .attr("class", "axis axis--y")
	        .transition()
	        .call(yAxis);

	    // Loop through each symbol / key
	    dataNest.forEach(function(d,i) {
	        g.append("path")
	            .attr("class", IDUtil.cssClassName('line', this.CLASS_PREFIX))
	            .style("stroke", function() { // Add the colours dynamically
	                return d.color = color(d.key); })
	            .attr("id", 'tag'+d.key.replace(/\s+/g, '')) // assign ID
	            .attr("d", lineFunc(d.values));
	    }, this);

	    if(this.props.data) {
		    Object.keys(this.props.data).forEach((queryId, index) => {
		    	const btn = document.getElementById('btn__' + queryId);
		    	if(btn) {
		    		btn.style.color = color(queryId);
		    	}
		    }, this);
		}

	}

	//TODO better ID!! (include some unique part based on the query)
	render() {
		const buttons = Object.keys(this.props.data).map((queryId, index) => {
			const classNames = ['btn', 'btn-default']
			return (
				<button id={'btn__' + queryId} type="button" className={classNames.join(' ')}
					onClick={this.toggle.bind(this, queryId)}>
					{this.props.data[queryId].prettyQuery}
				</button>
			)
		}, this);
		return (
			<div className={IDUtil.cssClassName('query-line-chart')}>
				<svg id={'qclc_' + IDUtil.hashCode(this.props.comparisonId)} width={this.WIDTH} height={this.HEIGHT}></svg>
				<div className="btn-group" role="group" aria-label="...">
					{buttons}
				</div>
			</div>
		)
	}

}

export default QueryComparisonLineChart;