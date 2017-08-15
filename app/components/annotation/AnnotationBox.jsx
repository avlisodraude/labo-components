import CommentingForm from './CommentingForm';
import ClassifyingForm from './ClassifyingForm';
import LinkingForm from './LinkingForm';
import MetadataForm from './MetadataForm';

import AnnotationActions from '../../flux/AnnotationActions';
import AnnotationUtil from '../../util/AnnotationUtil';
import IDUtil from '../../util/IDUtil';

//TODO this should all be changed: instead of one annotation with multiple bodies (comments, classifications, links)
//this class should load multiple annotations related to the current target... pff lots of work...

//TODO make sure to update the date modified of changed annotations

/*
Input:
	- TODO

Output/emits:
	- TODO

HTML markup & CSS attributes:
	- regular div => .bg__annotation-box
*/

class AnnotationBox extends React.Component {

	constructor(props) {
		super(props);
		let activeTab = this.props.activeSubAnnotation ? this.props.activeSubAnnotation.annotationType : null;
		if(!activeTab) {
			for(let i=0;i<Object.keys(this.props.annotationModes).length;i++) {
				if(Object.keys(this.props.annotationModes)[i] != 'bookmark') {
					activeTab = Object.keys(this.props.annotationModes)[i];
					break;
				}
			}
		}
		this.state = {
			activeTab : activeTab,
			annotationData : this.props.annotation.body || []
		}
	}

	//receives all the data output by child components
	onComponentOutput(mode, values) {
		const ad = this.state.annotationData.filter((a) => {
			return a.annotationType != mode;
		});
		values.forEach((a) => {
			a.annotationType = mode;
			a.user = this.props.user;
			ad.push(a);
		}, this)
		this.setState({annotationData : ad});
	}

	//TODO this function looks like it could be more optimized
	gatherDataAndSave() {
		const annotation = this.props.annotation;
		annotation.body = this.state.annotationData;
		AnnotationActions.save(annotation);
	}

	deleteAnnotation() {
		AnnotationActions.delete(this.props.annotation);
	}

	render() {
		//generate the tabs from the configured modes
		const tabs = Object.keys(this.props.annotationModes).map(function(mode) {
			if(mode == 'bookmark') return null;
			return (
				<li
					key={mode + '__tab_option'}
					className={this.state.activeTab == mode ? 'active' : ''}
				>
					<a data-toggle="tab" href={'#' + mode}>
						{mode}
					</a>
				</li>
				)
		}, this)

		//generate the content of each tab (a form based on a annotation mode/motivation)
		const tabContents = Object.keys(this.props.annotationModes).map(function(mode) {
			if(mode == 'bookmark') return null;
			let form = '';
			switch(mode) {
				case 'comment' : form = (
					<CommentingForm
						data={this.state.annotationData.filter((a) => {return a.annotationType === 'comment'})}
						config={this.props.annotationModes[mode]}
						onOutput={this.onComponentOutput.bind(this)}
					/>
				);break;
				case 'classification' : form = (
					<ClassifyingForm
						data={this.state.annotationData.filter((a) => {return a.annotationType === 'classification'})}
						config={this.props.annotationModes[mode]}
						onOutput={this.onComponentOutput.bind(this)}
					/>
				);break;
				case 'link' : form = (
					<LinkingForm
						data={this.state.annotationData.filter((a) => {return a.annotationType === 'link'})}
						config={this.props.annotationModes[mode]}
						onOutput={this.onComponentOutput.bind(this)}
					/>
				);break;
				case 'metadata' : form = (
					<MetadataForm
						data={this.state.annotationData.filter((a) => {return a.annotationType === 'metadata'})}
						annotationTarget={this.props.annotation.target}
						activeSubAnnotation={this.props.activeSubAnnotation} //temporary?
						config={this.props.annotationModes[mode]}
						onOutput={this.onComponentOutput.bind(this)}
					/>
				);break;
			}
			return (
				<div
					key={mode + '__tab_content'}
					id={mode}
					className={this.state.activeTab == mode ? 'tab-pane active' : 'tab-pane'}>
						{form}
				</div>
				);
		}, this);

		return (
			<div className={IDUtil.cssClassName('annotation-box')}>
				<ul className="nav nav-tabs">
					{tabs}
				</ul>
				<div className="tab-content">
					{tabContents}
				</div>
				<div className="text-right">
					<button
						type="button"
						className="btn btn-primary"
						onClick={this.gatherDataAndSave.bind(this)}>
						Save
					</button>
					&nbsp;
					<button
						type="button"
						className="btn btn-danger"
						onClick={this.deleteAnnotation.bind(this)}>
						Delete
					</button>
				</div>
			</div>
		)
	}
}

export default AnnotationBox;