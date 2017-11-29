// todo: enable when it is live
import ProjectAPI from './api/ProjectAPI';

import IDUtil from './util/IDUtil';

import ProjectTable from './components/workspace/ProjectTable';

class WSProjectsRecipe extends React.Component {

  constructor(props){
    super(props);
    console.log('WSProjectsRecipe', props);
  }

  render(){    
    return (
      <div className={IDUtil.cssClassName('ws-projects-recipe')}>
          
          <div className="info-bar">
            <a href="/workspace/projects/create" className="btn primary add">Create User Project</a>
            <h2>User Projects</h2>
            <p>Store and share Bookmarks & annotations and Tool Sessions</p>
          </div>

          <ProjectTable api={ProjectAPI} user={this.props.user} />

      </div>
    )
  }

}

export default WSProjectsRecipe;