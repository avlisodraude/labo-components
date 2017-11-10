import IDUtil from '../../util/IDUtil';

class FieldAnalysisStats extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		const stats = [];
		if(this.props.data && this.props.data.doc_stats) {
			stats.push(
				<tr>
					<td>Total number of records in the collection</td>
					<td>{this.props.data.doc_stats.total}</td>
				</tr>
			);
            stats.push(
				<tr>
					<td>Records which contain   {this.props.data.date_field}</td>
					<td>{this.props.data.doc_stats.date_field} </td>
				</tr>
            );
			stats.push(
				<tr>
					<td>Of which records with analysis field {this.props.data.analysis_field}</td>
					<td>{this.props.data.doc_stats.analysis_field} </td>
				</tr>
			);
			stats.push(
				<tr>
					<td>Date range ({this.props.data.field_stats.date_field_scope.unit}s)</td>
					<td>{this.props.data.field_stats.date_field_scope.start} - {this.props.data.field_stats.date_field_scope.end}</td>
				</tr>
			)
			stats.push(
				<tr>
					<td>Dates outside range</td>
					<td>{this.props.data.field_stats.date_field_out_of_scope}</td>
				</tr>
			);
		}

		return (
			<div className={IDUtil.cssClassName('field-analysis-stats')}>
				<table className="table table-condensed">
					<tbody>
						{stats}
					</tbody>
				</table>
			</div>
		);
	}
}

export default FieldAnalysisStats;