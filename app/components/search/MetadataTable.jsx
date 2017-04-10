import JSONFormatter from 'json-formatter-js'
import IDUtil from '../../util/IDUtil';

//See: https://github.com/mohsen1/json-formatter-js

class MetadataTable extends React.Component {

	constructor(props) {
		super(props);
	}

	componentDidMount() {
		let formatter = new JSONFormatter(this.props.data.rawData);
		formatter.openAtDepth(Infinity);
		document.getElementById('__rawdata_' + IDUtil.hashCode(this.props.data.resourceId)).appendChild(formatter.render());
	}

	//if this ever happens, the code from componentDidMount should be called here as well
	componentDidUpdate() {
		//console.debug('updated');
	}

	render() {
		let poster = null;
		let source = null;
		let specialProperties = null;
		//get the special properties that are important to show for this collection
		if(this.props.data.specialProperties) {
			specialProperties = Object.keys(this.props.data.specialProperties).map((key, index)=> {
				return (
					<tr key={'props__' + index}>
						<td><strong>{key}:</strong></td>
						<td>{this.props.data.specialProperties[key]}</td>
					</tr>
				);
			});
		}

		//get the poster if any
		if(this.props.data.posterURL) {
			poster = (<tr>
				<td><strong>Poster</strong></td>
				<td><img src={this.props.data.posterURL} alt="poster" style={{height:'100px'}}/></td>
			</tr>);
		}

		//get the source URL if any
		if(this.props.data.sourceURL) {
			source = (<tr>
				<td><strong>Source</strong></td>
				<td><a href={this.props.data.sourceURL} target="_source">View in catalogue</a></td>
			</tr>)
		}

		return (
			<table className="table flex-table">
				<tbody>
					{poster}
					<tr>
						<td><strong>ID</strong></td>
						<td>{this.props.data.resourceId}</td>
					</tr>
					<tr>
						<td><strong>Index</strong></td>
						<td>{this.props.data.index}&nbsp;(type: {this.props.data.docType})</td>
					</tr>
					<tr>
						<td><strong>Title</strong></td>
						<td>{this.props.data.title ? this.props.title : 'No title available'}</td>
					</tr>
					<tr>
						<td><strong>Date</strong></td>
						<td>{this.props.data.date}</td>
					</tr>
					<tr>
						<td><strong>Description</strong></td>
						<td>{this.props.data.description ? this.props.data.description : 'No description available'}</td>
					</tr>
					{source}
					{specialProperties}
					<tr>
						<td><strong>All data</strong></td>
						<td>
							<div className="raw-data" id={'__rawdata_' + IDUtil.hashCode(this.props.data.resourceId)}></div>
						</td>
					</tr>
				</tbody>
			</table>
		);
	}

}

export default MetadataTable;