import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ProjectAPI from './api/ProjectAPI';
import IDUtil from './util/IDUtil';
import ProjectsOverview from './components/projects/ProjectsOverview';
import ProjectBookmarks from './components/projects/ProjectBookmarks';
import ProjectSessions from './components/projects/ProjectSessions';
import ProjectCreate from './components/projects/ProjectCreate';
import ProjectEdit from './components/projects/ProjectEdit';

import {
  Switch,
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'

class WorkspaceProjects extends Component {
  constructor(props){
    super(props);

    this.state={}
  }

  getPropsRenderer(RenderComponent, props){
    return (routeProps) => (
       <RenderComponent {...routeProps} {...props} />
     )
  }

  render() {
    console.log(this.props);
    return(
      <Router>
        <Switch>
          <Route exact path="/workspace/projects" render={this.getPropsRenderer(ProjectsOverview, this.props)} />
          <Route exact path="/workspace/projects/create" render={this.getPropsRenderer(ProjectCreate, this.props)} />
          <Route exact path="/workspace/projects/:id/edit" render={this.getPropsRenderer(ProjectEdit, this.props)} />
          <Route path="/workspace/projects/:id" component={ProjectBookmarks} {...this.props} />
          <Route path="/workspace/projects/:id/bookmarks" component={ProjectBookmarks} {...this.props} />
          <Route path="/workspace/projects/:id/sessions" component={ProjectSessions} {...this.props} />
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
