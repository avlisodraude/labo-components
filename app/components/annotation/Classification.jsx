class Classification extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		let csClass = 'label label-success tag';
		switch(this.props.classification.vocabulary) {
			case 'DBpedia':
				csClass = 'label label-danger tag';
				break;
			case 'UNESCO':
				csClass = 'label label-warning tag';
				break;
			case 'custom':
				csClass = 'label label-primary tag';
				break;
			default:
				csClass = 'label label-default tag';
				break;
		}
		return (
			<span
				className={csClass}
				title={this.props.classification.id ? this.props.classification.id : 'Custom annotation'}>
				{this.props.classification.label}
				{this.props.children}
			</span>
		);
	}
};

export default Classification;