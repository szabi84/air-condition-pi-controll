import React from 'react';
import {
  withStyles,
  FormControlLabel,
  Button,
  TextField,
  Switch,
  Grid
} from '@material-ui/core';
import { compose } from 'recompose';
import { withRouter } from 'react-router-dom';
import { Form, Field } from 'react-final-form';

const styles = theme => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '90%',
    maxWidth: 500,
  },
  modalCardContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  marginTop: {
    marginTop: theme.spacing(2),
  },
});

const HvacEditor = ({ classes, hvac, onSave, history }) => (
  <Form initialValues={hvac} onSubmit={onSave}>
    {({ handleSubmit }) => (
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Field name="roomTemperature">
                {({ input }) => <TextField label="Room temperature" autoFocus {...input} disabled={true}/>}
              </Field>
            </Grid>
            <Grid item xs={6}>
              <Field name="hvacActualTemperature">
                {({ input }) => <TextField label="HVAC actual temperature" autoFocus {...input} disabled={true}/>}
              </Field>
            </Grid>
            <Grid item xs={6}>
              <Field name="hvacPower">
                {({ input }) => <FormControlLabel control={<Switch />} label="HVAC power" autoFocus {...input} disabled={true}/>}
              </Field>
            </Grid>
            <Grid item xs={6}>
              <Field name="timeRemaining">
                {({ input }) => <TextField label="Time remaining" autoFocus {...input} disabled={true}/>}
              </Field>
            </Grid>
            <Grid item xs={6}>
              <Field name="setOnlyMonitoring" type="checkbox">
                {({ input }) => <FormControlLabel control={<Switch />} label="Set only monitoring" autoFocus {...input}/>}
              </Field>
            </Grid>
            <Grid item xs={6}>
              <Field name="setRoomTemperature">
                {({ input }) => <TextField label="Set room temperature" autoFocus {...input}/>}
              </Field>
            </Grid>
            <Grid item xs={12}>
              <Button size="small" color="primary" type="submit">Save</Button>
              <Button size="small" onClick={() => history.push('/')}>Cancel</Button>
            </Grid>
          </Grid>
        </form>
    )}
  </Form>
);

export default compose(
  withRouter,
  withStyles(styles),
)(HvacEditor);
