import ComponentUtil from '../util/ComponentUtil';

class FlexModal extends React.Component {

	constructor(props) {
		super(props);
	}

	componentDidMount() {
		var instance = $('#' + this.props.elementId).modal({
			keyboard : true,
			backdrop : true,
			show : true
		})
		.on('hidden.bs.modal', this.close.bind(this, false))
	}

	close(manualCloseRequired, e) {
		if(e) {
			e.stopPropagation();
		}
		if(this.props.owner) {
			//let the owner hide the modal
			ComponentUtil.hideModal(this.props.owner, this.props.stateVariable, this.props.elementId, manualCloseRequired);
		} else if(manualCloseRequired) { //otherwise hide it here
			$('#' + this.props.elementId).modal('hide');
		}

	}

	render() {
		let classNames = ['modal-dialog'];
		if(this.props.size == 'large') {
			classNames.push('modal-lg');
		} else if(this.props.size == 'small') {
			classNames.push('modal-sm');
		} else { // the default is a custom class, which is actually only used in combination with float 'right'
			classNames.push('flex-modal');
		}
		return (
			<div id={this.props.elementId} className="modal fade">
				<div className={classNames.join(' ')} style={{'float' : this.props.float ? this.props.float : 'none'}}>
					<div className="modal-content">
						<div className="modal-header">
							<button type="button" className="close" onClick={this.close.bind(this, true)}>x</button>
							<h4 className="modal-title">{this.props.title}</h4>
						</div>
						<div className="modal-body">
							{this.props.children}
						</div>
					</div>
				</div>
			</div>
		)
	}
}

export default FlexModal;