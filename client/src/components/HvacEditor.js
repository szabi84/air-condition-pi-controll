import React from 'react';
import {
  withStyles,
  FormControlLabel,
  Button,
  TextField,
  Switch,
  Grid, FormControl, FormLabel, RadioGroup, Radio
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
})

const HvacEditor = ({ hvac, onSave, history }) => (
  <Form initialValues={hvac} onSubmit={onSave}>
    {({handleSubmit, form}) => (
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Field name="updatedAt">
                {({ input }) => <TextField label="Last update" autoFocus {...input} disabled={true}/>}
              </Field>
            </Grid>
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
              <Field name="hvacPower" type="checkbox">
                {({ input }) => <FormControlLabel control={<Switch />} label="HVAC power" autoFocus {...input} disabled={true}/>}
              </Field>
            </Grid>
            <Grid item xs={6}>
              <Field name="timeRemaining">
                {({ input }) => <TextField label="Time remaining" autoFocus {...input} disabled={true}/>}
              </Field>
            </Grid>
            <Grid item xs={6}>
              <Field name="controllerMode">
                {({ input }) => <FormControl>
                  <FormLabel id="demo-radio-buttons-group-label">Mode</FormLabel>
                  <RadioGroup
                    aria-labelledby="demo-radio-buttons-group-label"
                    defaultValue="normal"
                    value={input.value}
                    name="radio-buttons-group"
                  >
                    <FormControlLabel value="standby" control={<Radio onClick={() => {
                      form.change('controllerMode', 'standby')
                    }}/>} label="standby" />
                    <FormControlLabel value="normal" control={<Radio onClick={() => {
                      form.change('controllerMode', 'normal')
                    }}/>} label="normal" />
                  </RadioGroup>
                </FormControl>}
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
)

export default compose(
  withRouter,
  withStyles(styles),
)(HvacEditor)
