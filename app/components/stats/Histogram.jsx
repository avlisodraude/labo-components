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
		var svg = document.getElementById("histogram_" + IDUtil.hashCode(this.props.queryId));
		while (svg.firstChild) {
			svg.removeChild(svg.firstChild);
		}
		callback();
	}

	getGraphData() {
		return this.props.data.map((aggr, index) => {
			return {
				year : new Date(aggr.date_millis).getFullYear(),
				count : aggr.doc_count
			}
		});
	}

	toggle(selectedBar) {
		console.debug(selectedBar);
	}

	repaint() {
		//get the new data
		var years = this.getGraphData();
		var minYear = d3.min(years, function(d) {return d.year;});
    	var maxYear = d3.max(years, function(d) {return d.year;});
    	var maxCount = d3.max(years, function(d) {return d.count;});

		//first define the dimensions of the graph
		var svg = d3.select('#histogram_' + IDUtil.hashCode(this.props.queryId));
		var margin = {top: 10, right: 30, bottom: 30, left: 30};
		var width = +svg.attr("width") - margin.left - margin.right;
    	var height = +svg.attr("height") - margin.top - margin.bottom;

    	var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		//define the x scaling function
		var x = d3.scaleLinear()
			.domain([minYear, maxYear + 1]) //the x scale from lowest to highest year
			.range([0, width]) //scale to the width of the svg

		//define the y scaling function
		var y = d3.scaleLinear()
			.domain([0, maxCount]) //the highest count is the max of the y domain
			.range([height, 0]);

		var xAxis = d3.axisBottom()
			.scale(x) //set scaling function defined by x as the scale
			//.ticks(2) --> TODO fix this only show full years
			.tickFormat(function(d) { return d + '';})

		var yAxis = d3.axisLeft()
			.scale(y) //set scaling function defined by x as the scale
			//.ticks(2) --> TODO fix this only show full years
			.tickFormat(function(d) { return d + '';})

		//draw the bars for each year
		var bar = g.selectAll(".bar")
			.data(years)

		//create new bars
		var barEnter = bar.enter()
			.append("g")
				.attr("class", "bar")
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
			<svg id={'histogram_' + IDUtil.hashCode(this.props.queryId)} width={this.WIDTH} height={this.HEIGHT}></svg>
		)
	}

}

export default Histogram;