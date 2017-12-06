import ProjectAPI from '../../api/ProjectAPI';
import IDUtil from '../../util/IDUtil';
import ProjectWrapper from './ProjectWrapper';
import BookmarkView from './BookmarkView';


class ProjectBookmarks extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      annotations : [],
      loading : true,      
      view: 'bookmark-centric', // bookmark-centric, annotation-centric
    }
  }
  
   /**
   * View changes
   * @param {SyntheticEvent} e Event
   */
  viewChange(e){
    console.log(e.target.value);
    this.setState({
        view: e.target.value
    });
  }


  render(){
    const annotationList = this.state.annotations.map((a) => {
      return <div>{a.id}</div>
    })


    console.log(this.state.view);
    return (
      <div className={IDUtil.cssClassName('project-bookmarks')}>
        <div className="tools">
        
          <div className="view">
            <h3>View</h3>
            <div className="radiogroup" onChange={this.viewChange.bind(this)}>
            
              <input type="radio" 
                     name="view" 
                     value="bookmark-centric" 
                     id="view-bookmark" 
                     defaultChecked={this.state.view==='bookmark-centric'}
                     />
              <label htmlFor="view-bookmark">Bookmark-centric</label>

              <input type="radio" 
                     name="view" 
                     value="annotation-centric" 
                     id="view-annotation" 
                     defaultChecked={this.state.view==='annotation-centric'}
                     />
              <label htmlFor="view-annotation">Annotation-centric</label>

            </div>
          </div>

        </div>
        { this.state.view === 'bookmark-centric' ? 
          <BookmarkView />
        : 
          <h2>Todo: annotation table</h2>
        }
</div>
  )
  }
}

class WrappedProjectBookmarks extends React.PureComponent{
  render(){
    return(
      <ProjectWrapper renderComponent={ProjectBookmarks} {...this.props}  />
    )
  }
}

export default WrappedProjectBookmarks;