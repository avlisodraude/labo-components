import IDUtil from '../../util/IDUtil';
import {LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Legend, Bar} from 'recharts';

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
		this.state = {
			activeQueries : {},
            opacity: {
                present: 1,
                missing: 1,
                total: 1
            }
		}
        this.selectLine = this.selectLine.bind(this);
	}

	//only update if the search id is different
	shouldComponentUpdate(nextProps, nextState) {
		return nextProps.comparisonId != this.props.comparisonId ||
            nextState.opacity !==this.state.opacity;
	}

    selectLine(event) {
        const dataKey = event.dataKey;
        let currentKeyValue = this.state.opacity[dataKey],
            opacity = Object.assign({}, this.state.opacity);

        if (currentKeyValue === 1) {
            currentKeyValue = 0
        } else {
            currentKeyValue = 1
        }
        opacity[dataKey] = currentKeyValue;

        this.setState({
            opacity
        });
    }
	//TODO better ID!! (include some unique part based on the query)
	render() {
        const presentOp = this.state.opacity.present,
            missingOp = this.state.opacity.missing,
            totalOp = this.state.opacity.total,
            total = this.props.data.joinedData.timeline;

		return (
			<div className={IDUtil.cssClassName('query-line-chart')}>
				<ResponsiveContainer width="100%" height="40%">
					<LineChart width={1200} height={200} data={total} margin={{top: 5, right: 20, bottom: 5, left: 0}}>
						<Line name="Total" type="lineal" dataKey="total" stroke="#468dcb" strokeOpacity={totalOp}
							  dot={{stroke: '#468dcb', strokeWidth: 1}} activeDot={{stroke: '#468dcb', strokeWidth: 2, r: 1}}
							  onClick={this.selectLine}
						/>
						<Line type="lineal" dataKey="present" stroke="rgb(255, 127, 14)" strokeWidth={2} strokeOpacity={presentOp}
							  dot={{stroke: 'rgb(255, 127, 14)'}} activeDot={{stroke: 'rgb(255, 127, 14)', strokeWidth: 1, r: 3}}
						/>
						<Line type="lineal" dataKey="missing" stroke="rgba(44, 160, 44, 14)" strokeOpacity={missingOp}
							  dot={{stroke: 'rgba(44, 160, 44, 14)', strokeWidth: 1}} activeDot={{stroke: 'rgba(44, 160, 44, 14)', strokeWidth: 1, r: 1}}
						/>
						<CartesianGrid stroke="#cacaca"/>
						<XAxis dataKey="year"/>
						<YAxis/>
						<Tooltip/>
						<Legend verticalAlign="top" onClick={this.selectLine} height={36}/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		)
	}

}

export default QueryComparisonLineChart;