import React, { Fragment } from 'react'
import { Route } from 'react-router-dom'
import {
  CssBaseline,
  withStyles
} from '@material-ui/core'

import AppHeader from './components/AppHeader'
import HvacManager from './pages/HvacManager'

const styles = theme => ({
  main: {
    padding: theme.spacing(3),
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(2)
    }
  }
})

const App = ({ classes }) => (
  <Fragment>
    <CssBaseline />
    <AppHeader />
    <main className={classes.main}>
      <Route path="/" component={HvacManager} />
    </main>
  </Fragment>
)

export default withStyles(styles)(App)
