import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ProjectAPI from './api/ProjectAPI';
import IDUtil from './util/IDUtil';
import ProjectsOverview from './components/projects/ProjectsOverview';
import ProjectBookmarks from './components/projects/ProjectBookmarks';
import ProjectSessions from './components/projects/ProjectSessions';
import ProjectCreate from './components/projects/ProjectCreate';
import ProjectDetails from './components/projects/ProjectDetails';
import ProjectEdit from './components/projects/ProjectEdit';


import {
  Switch,
  BrowserRouter as Router,
  Route,
  Link,
  Redirect
} from 'react-router-dom'

class WorkspaceProjects extends Component {
  constructor(props){
    super(props);

    this.state={}
  }

  getPropsRenderer(RenderComponent, props, extraProps={}){
    return (routeProps) => (
       <RenderComponent {...routeProps} {...props} {...extraProps} />
     )
  }

  render() {
    return(
      <Router>
        <Switch>
          <Route exact path="/workspace/projects" render={this.getPropsRenderer(ProjectsOverview, this.props, {api: ProjectAPI} )} />
          <Route exact path="/workspace/projects/create" render={this.getPropsRenderer(ProjectCreate, this.props, {api: ProjectAPI} )} />

          <Route exact path="/workspace/projects/:id" render={({ match }) => (
                  <Redirect to={`/workspace/projects/${match.params.id}/bookmarks`} />
                )} />

          <Route path="/workspace/projects/:id/bookmarks" render={this.getPropsRenderer(ProjectBookmarks, this.props, {api: ProjectAPI})} />
          <Route path="/workspace/projects/:id/sessions" render={this.getPropsRenderer(ProjectSessions, this.props, {api: ProjectAPI})} />
          <Route path="/workspace/projects/:id/details" render={this.getPropsRenderer(ProjectDetails, this.props, {api: ProjectAPI})} />
          <Route path="/workspace/projects/:id/edit" render={this.getPropsRenderer(ProjectEdit, this.props, {api: ProjectAPI})} />
        </Switch>
      </Router>
    );
  }
}

WorkspaceProjects.propTypes = {

  // project api
  api: PropTypes.shape({
    list: PropTypes.func.isRequired
  }),

  // current user object used for defining access roles per project
  user: PropTypes.shape({
    id: PropTypes.number.isRequired
  }).isRequired,
}

export default WorkspaceProjects;
