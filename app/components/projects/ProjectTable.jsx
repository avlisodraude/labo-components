import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import IDUtil from '../../util/IDUtil';
import SortTable from './SortTable';
import { Link } from 'react-router-dom';
import { exportDataAsJSON } from '../helpers/Export';


class ProjectTable extends React.PureComponent {

  constructor(props){
    super(props);

    this.state={
      projects: [],
      loading: true,
      filter:{
        keywords: '',
        currentUser: false,
      }
    }

    this.requestDataTimeout = -1;
  }

  /**
   * Call filter callback
   */
  loadData(){

    this.setState({
      loading: true
    });

    this.props.api.list(this.props.user.id, this.state.filter, this.setProjects.bind(this));
  }

  /**
   * Set new list of projects to state
   * @param {array} projects List of projects
   */
  setProjects(projects){
    // decorate the projects
    this.toDummyData(projects || []);

    // we filter the results now on client side
    projects = this.filterProjects(projects);

    this.setState({
      projects: projects,
      loading: false,
    });
  }

  /**
   * Filter projects client side
   * This can later be performed on the server/api side
   */
  filterProjects(projects){
    let userId = this.props.user.id;
    let result = projects.filter((project)=>(project.getAccess(userId)));
    let filter = this.state.filter;

    // filter on keywords
    if (filter.keywords){
      let keywords = filter.keywords.split(" ");
      keywords.forEach((k)=>{
        k = k.toLowerCase();
        result = result.filter((project)=>(project.name.toLowerCase().includes(k) || project.description.toLowerCase().includes(k)))
      });
    }

    // filter on current user
    if (filter.currentUser){
      result = result.filter((project)=>(project.owner.id === userId))
    }

    return result;
  }

  /**
   * Decorate projects data with helper functions
   * (currently placeholders) 
   */
  toDummyData(projects){
    return projects.map((p) => {
      p.getBookmarkCount = function(){ return this.bookmarks.length;}
      p.getAccess = function(){return 'Admin'}
      p.getCollaboratorCount = function(){return this.collaborators.length;}
      p.canDelete = function(){return true;}
      p.canExport = function(){return true;}
      p.canOpen = function(){return true;}
      p.bookmarks = [];
      p.collaborators = [];
      p.owner = {
        id : this.props.user.id,
        name : this.props.user.name
      }
      return p
    })
  }

  /**
   * Keywords filter changes
   * @param {SyntheticEvent} e Event
   */
  keywordsChange(e){
    this.setState({
        filter: Object.assign({}, this.state.filter, {
        keywords: e.target.value
      })
    });
  }

  /**
   * Keywords filter changes
   * @param {SyntheticEvent} e Event
   */
  currentUserChange(e){
    this.setState({
        filter: Object.assign({}, this.state.filter, {
        currentUser: e.target.checked
      })
    });
  }

  /**
   * After mounting, retrieve project data
   */
  componentDidMount(){
    this.loadData();
  }

  /**
   * Listen for update, request new data if filter has been changed
   */
  componentDidUpdate(){
    if (this.lastFilter !== this.state.filter){
      this.lastFilter = this.state.filter;

      // throttle data requests
      clearTimeout(this.requestDataTimeout);
      this.requestDataTimeout = setTimeout(this.loadData.bind(this), 500);
    }
  }

  /**
   * Delete project if confirmed
   * @param {object} project Project to delete
   */
  deleteProject(project){
    if (window.confirm('Are you sure you want to delete project ' + project.name)){
      this.props.api.delete(this.props.user.id, project.id, (status) => {
        if (status && status.success){

          // just retrieve the latest data
          this.loadData();
        }
      });
    }
  }

  /**
   * Delete *multiple* projects if confirmed
   * @param {object} projects Projects to delete
   */
  deleteProjects(projects){
    if (window.confirm('Are you sure you want to delete ' + projects.length + ' projects?')){
      var calls = projects.length;

      // after each return calls is decreased
      // when calls is 0, data is reloaded
      // this is async safe      
      projects.forEach((project, index)=>{
        this.props.api.delete(this.props.user.id, project.id, (status) => {          
            calls--;
            if (calls == 0){
              // after the last delete just retrieve the latest data
              this.loadData();  
            }            
          }          
        );  
      });      
    }
  }


  /**
  * Sort projects based on sort
  * @param {Array} projects List of bookmarks to be sorted
  * @param {object} sort Sort field and order
  */
  sortProjects(projects, sort){
   let sorted = projects;
   switch(sort.field){
    case 'name':
      sorted.sort((a,b) => (a.name > b.name));
    break;
    case 'bookmarks':
      sorted.sort((a,b) => (a.bookmarks.length - b.bookmarks.length));
    break;
    case 'owner':
      sorted.sort((a,b) => (a.owner.name > b.owner.name));
    break;
    case 'access':
      sorted.sort((a,b) => (a.getAccess(this.props.user.id) > b.getAccess(this.props.user.id)));
    break;
    case 'created':
      sorted.sort((a,b) => (a.created > b.created));
    break;
    default:
      // no sorting,just return
      return sorted;
   }

   return sort.order === 'desc' ? sorted.reverse() : sorted;

  }

  render() {
    let projects = this.state.projects;
    let currentUser = this.props.user;
    let currentUserId = currentUser.id;

    return (
      <div className={IDUtil.cssClassName('project-table')}>
        <div className="tools">
          <div className="left">
            <h3>Filters</h3>
            <input className="search"
                   type="text"
                   placeholder="Search"
                   value={this.state.filter.keywords}
                   onChange={this.keywordsChange.bind(this)}
                   />
            <input type="checkbox"
                   id="current-user"
                   checked={this.state.filter.currentUser}
                   onChange={this.currentUserChange.bind(this)}
                   />
            <label htmlFor="current-user">Show only my projects</label>
          </div>
        </div>

        <SortTable
            items={projects}
            head={[
                {field: 'name', content: 'Name', sortable: true},
                {field: 'bookmarks', content: <i className="bookmark-icon"/>, sortable: true},
                {field: 'owner', content: 'Owner', sortable: true},
                {field: 'access', content: 'Access', sortable: true},
                {field: 'created', content: 'Created', sortable: true},
                {field: '', content: '', sortable: false},
                {field: '', content: '', sortable: false},
                {field: '', content: '', sortable: false},
              ]}
            row={(project) =>([
                { props:{className:"primary"}, content: <Link to={"/workspace/projects/" + project.id}>{project.name}</Link> },
                { props:{className:"number"}, content: project.getBookmarkCount()},
                { content: <span>{project.owner.name} {project.getCollaboratorCount() ? <span className="collaborators">{project.getCollaboratorCount()} Collaborator{project.getCollaboratorCount() !== 1 ? 's' : ''}</span> : ''}</span> },
                { props: { className: "access"}, content: project.getAccess(currentUserId) },
                { props: {className: "smaller"}, content: project.created.substring(0,10) },
                { content: project.canDelete(currentUserId) ? <a className="btn blank warning" onClick={this.deleteProject.bind(this,project)}>Delete</a> : ''},
                { content: project.canExport(currentUserId) ? <a className="btn blank" onClick={exportDataAsJSON.bind(this,project)}>Export</a> : ''},
                { content: project.canOpen(currentUserId) ? <Link to={"/workspace/projects/" + project.id} className="btn">Open</Link> : ''}
              ])}           

            sort={this.sortProjects.bind(this)}
            loading={this.state.loading}
            bulkActions={[
              {title: 'Delete', onApply: this.deleteProjects.bind(this) },
              {title: 'Export', onApply: exportDataAsJSON.bind(this) }
              ]}
           />
      </div>
    );
  }
}

ProjectTable.propTypes = {

  // project api
  api: PropTypes.shape({
    list: PropTypes.func.isRequired
  }),

  // current user object used for defining access roles per project
  user: PropTypes.shape({
    id: PropTypes.number.isRequired
  }).isRequired,
}

export default ProjectTable;
