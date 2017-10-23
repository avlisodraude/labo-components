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
*/

class Histogram extends React.Component {

	constructor(props) {
		super(props);
		this.WIDTH = 860;
		this.HEIGHT = 220;
		this.CLASS_PREFIX = 'hg';
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
		const svg = document.getElementById("histogram_" + IDUtil.hashCode(this.props.queryId));
		while (svg.firstChild) {
			svg.removeChild(svg.firstChild);
		}
		callback();
	}

	//this also checks if the retrieved dates are outside of the user's range selection
	getGraphData() {
		let startMillis = null;
		let endMillis = null;
		if(this.props.dateRange) {
			startMillis = this.props.dateRange.start
			endMillis = this.props.dateRange.end
		}
		return this.props.data.map((aggr, index) => {
			let inRange = true;
			if ((startMillis != null && aggr.date_millis < startMillis) ||
				endMillis != null && aggr.date_millis > endMillis) {
				inRange = false;
			}
			return {
				year : new Date(aggr.date_millis).getFullYear(),
				count : aggr.doc_count,
				inRange : inRange
			}
		});
	}

	toggle(selectedBar) {
		console.debug(selectedBar);
	}

	getBarClass(inRange) {
		let cssClass = IDUtil.cssClassName('bar', this.CLASS_PREFIX);
		if(!inRange) {
			cssClass += ' out-of-range';
		}
		return cssClass;
	}

	repaint() {
		//get the new data
		const years = this.getGraphData();
		const minYear = d3.min(years, function(d) {return d.year;});
    	const maxYear = d3.max(years, function(d) {return d.year;});
    	const maxCount = d3.max(years, function(d) {return d.count;});

		//first define the dimensions of the graph
		const svg = d3.select('#histogram_' + IDUtil.hashCode(this.props.queryId));
		const margin = {top: 10, right: 30, bottom: 30, left: 30};
		const width = +svg.attr("width") - margin.left - margin.right;
    	const height = +svg.attr("height") - margin.top - margin.bottom;

    	const g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		//define the x scaling function
		const x = d3.scaleLinear()
			.domain([minYear, maxYear + 1]) //the x scale from lowest to highest year
			.range([0, width]) //scale to the width of the svg

		//define the y scaling function
		const y = d3.scaleLinear()
			.domain([0, maxCount]) //the highest count is the max of the y domain
			.range([height, 0]);

		const xAxis = d3.axisBottom()
			.scale(x) //set scaling function defined by x as the scale
			//.ticks(2) --> TODO fix this only show full years
			.tickFormat(function(d) { return d + '';})

		const yAxis = d3.axisLeft()
			.scale(y) //set scaling function defined by x as the scale
			//.ticks(2) --> TODO fix this only show full years
			.tickFormat(function(d) { return d + '';})

		//draw the bars for each year
		const bar = g.selectAll("." + IDUtil.cssClassName('bar', this.CLASS_PREFIX))
			.data(years)

		//create new bars
		const barEnter = bar.enter()
			.append("g")
				.attr("class", function(d) { return this.getBarClass(d.inRange)}.bind(this))
				.attr("transform", function(d) { return "translate(" + x(d.year) + "," + y(d.count) + ")"; })//set the correct pos

		//add a rectange and a text element to new bars
		barEnter.append("rect")
			.on("click", function(d) {
				this.toggle(d);
				d3.event.stopPropagation();
			}.bind(this))
			.attr("x", 1)
			.attr("width", x(minYear + 1))
			.attr("height", 0)
			.transition() //transition on the height
			.attr("height", function(d) { return height - y(d.count); })
		// barEnter.append("text")
		// 	.attr("dy", ".75em")
		// 	.attr("y", 2)
		// 	.attr("x", x(minYear + 1) / 2)
		// 	.attr("text-anchor", "middle")
		// 	.text(function(d) { return d.count == 0 ? '' : d.count ; })

		//whenever data is removed, remove the graphic representations as well
		bar.exit().remove()

		//draw the x-axis
		g.append("g")
			.attr("class", "axis axis--x")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);

		//draw the y-axis
		g.append("g")
			.attr("class", "axis axis--y")
			//.attr("transform", "translate(" + width + ", 0)")
			.call(yAxis);

	}

	//TODO better ID!! (include some unique part based on the query)
	render() {
		return (
			<svg
				id={'histogram_' + IDUtil.hashCode(this.props.queryId)}
				className={IDUtil.cssClassName('histogram')}
				width={this.WIDTH}
				height={this.HEIGHT}>
			</svg>
		)
	}

}

export default Histogram;