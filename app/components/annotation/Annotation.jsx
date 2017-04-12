import TimeUtil from '../../util/TimeUtil';
import AnnotationActions from '../../flux/AnnotationActions';
import AnnotationUtil from '../../util/AnnotationUtil';
import IconUtil from '../../util/IconUtil';
/*
Input:
	- Annotation ID
	- Annotation Label (if any, otherwise use ID)
	- User ID

Output/emits:
	- 'set active annotation' (for letting the page know, which annotation is active)
	- 'edit annotation' (for letting the page know, which annotation to edit)
	- 'play annotation' (for letting the page know, which annotation to play)
	- 'delete annotation' (for letting the page know, which annotation to delete)
*/

class Annotation extends React.Component {

	constructor(props) {
		super(props);
	}

	computeClass() {
		var className = 'list-group-item';
		if(this.props.active) {
			className += ' active';
		}
		className += ' annotation';
		return className;
	}

	//The following AnnotationActions are linked here: set, edit, play, delete
	render() {
		let icon = null;
		let fragInfo = null;

		//determine the fragment information (and the asset ID so it can be possibly used for the label)
		let ad = AnnotationUtil.extractAnnotationTargetDetails(this.props.annotation);
		switch(ad.type) {
			case 'temporal' :
				icon = (<span className={IconUtil.getMimeTypeIcon('video')}></span>);break;
			case 'spatial' :
				icon = (<span className={IconUtil.getMimeTypeIcon('image')}></span>);break;
			default :
				icon = null;
		}
		if(ad.type == 'temporal') {
			fragInfo = (
				<span className="fragment-info">
					{'[' + TimeUtil.formatTime(ad.frag.start) + ' - ' + TimeUtil.formatTime(ad.frag.end) + ']'}
				</span>
			)
		}

		//determine the label of the annotation
		let label = AnnotationUtil.extractAnnotationCardTitle(this.props.annotation);
		if(!label) {
			label = ad.assetId ? ad.assetId : this.props.annotation.id
		}

		return (
			<li
				className={this.computeClass()}
				onClick={() => {AnnotationActions.set(this.props.annotation)}}
				onDoubleClick={() => {AnnotationActions.edit(this.props.annotation)}}
				title={this.props.annotation.id}
			>
				<span className={IconUtil.getUserActionIcon('remove', false, false, true)}
					onClick={() => {AnnotationActions.delete(this.props.annotation)}}>
				</span>
				<span className="asset-id">{label}</span>
				{fragInfo}
				<span className="user-info">
					(annotations:
						{this.props.annotation.body ? this.props.annotation.body.length : 0}
					, by:
						{this.props.annotation.user})
				</span>
				{icon}
				<span className={IconUtil.getUserActionIcon('play', false, false, true)}
					onClick={() => AnnotationActions.play(this.props.annotation)}>
				</span>
			</li>
		);
	}
};

export default Annotation;