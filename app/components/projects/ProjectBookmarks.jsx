import ProjectAPI from '../../api/ProjectAPI';
import IDUtil from '../../util/IDUtil';
import ProjectWrapper from './ProjectWrapper';
import AnnotationStore from '../../flux/AnnotationStore'

class ProjectBookmarks extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      annotations : [],
      loading : true
    }
  }

  componentDidMount() {
    this.loadAnnotations()
  }

  loadAnnotations() {
    AnnotationStore.getUserProjectAnnotations(
      this.props.user,
      this.props.project,
      this.onLoadAnnotations.bind(this)
    )
  }

  onLoadAnnotations(data) {
    this.setState({
      annotations : data.annotations || [],
      loading : false
    })
  }

  render(){
    const annotationList = this.state.annotations.map((a) => {
      return <div>{a.id}</div>
    })
    return (
       <div className={IDUtil.cssClassName('project-annotations')}>
       {annotationList}
      </div>
    )
  }
}

class WrappedProjectBookmarks extends React.PureComponent{
  render(){
    return(
      <ProjectWrapper {...this.props} renderComponent={ProjectBookmarks} />
    )
  }
}

export default WrappedProjectBookmarks;