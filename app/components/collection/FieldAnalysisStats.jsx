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
					<td>Document with/without date</td>
					<td>{this.props.data.doc_stats.date_field} / {this.props.data.doc_stats.no_date_field}</td>
				</tr>
			);
			stats.push(
				<tr>
					<td>Document with/without analysis field</td>
					<td>{this.props.data.doc_stats.analysis_field} / {this.props.data.doc_stats.no_analysis_field}</td>
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