import React, { Component, Fragment } from 'react';
import { withRouter } from 'react-router-dom';
import {
  withStyles,
  Typography,
} from '@material-ui/core';
import { compose } from 'recompose';

import ErrorSnackbar from '../components/ErrorSnackbar';
import HvacEditor from "../components/HvacEditor";

const styles = theme => ({
  hvac: {
    marginTop: theme.spacing(2),
  }
});

const API = process.env.REACT_APP_API || 'http://localhost:9000';

class HvacManager extends Component {
  state = {
    loading: true,
    hvac: null,
    error: null,
  };

  componentDidMount() {
    this.getHvac();
  }

  async fetch(method, endpoint, body) {
    try {
      console.log(`Endpoint: ${API}${endpoint}`);
      const response = await fetch(`${API}${endpoint}`, {
        method,
        body: body && JSON.stringify(body),
        headers: {
          'content-type': 'application/json',
          accept: 'application/json'
        },
      });
      return await response.json();
    } catch (error) {
      console.error(error);

      this.setState({ error });
    }
  }

  async getHvac() {
    this.setState({ loading: false, hvac: (await this.fetch('get', '/settings/1')) || null });
  }

  saveHvac = async (hvac) => {
    if (hvac.id) {
      await this.fetch('put', `/settings/${hvac.id}`, hvac);
    }

    this.props.history.push('/');
    await this.getHvac();
  }

  render() {
    const { hvac } = this.state;

    return (
      <Fragment>
        {hvac ? (
          <HvacEditor hvac={hvac} onSave={this.saveHvac} />
        ) : (
          !this.state.loading && <Typography variant="subtitle1">No hvac to display</Typography>
        )}
        {this.state.error && (
          <ErrorSnackbar
            onClose={() => this.setState({ error: null })}
            message={this.state.error.message}
          />
        )}
      </Fragment>
    );
  }
}

export default compose(
  withRouter,
  withStyles(styles),
)(HvacManager);
