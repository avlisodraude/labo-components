import IDUtil from '../../util/IDUtil';

/*
HTML markup & CSS attributes:
	- regular span => .bg__classification
*/

class Classification extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		const classNames = ['label'];
		switch(this.props.classification.vocabulary) {
			case 'DBpedia':
				classNames.push('label-danger');
				break;
			case 'UNESCO':
				classNames.push('label-warning');
				break;
			case 'custom':
				classNames.push('label-primary');
				break;
			default:
				classNames.push('label-success');
				break;
		}
		classNames.push(IDUtil.cssClassName('classification'));

		return (
			<span
				className={classNames.join(' ')}
				title={this.props.classification.id ? this.props.classification.id : 'Custom annotation'}>
				{this.props.classification.label}
				{this.props.children}
			</span>
		);
	}
};

export default Classification;