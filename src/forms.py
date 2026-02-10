from flask_wtf import FlaskForm
from wtforms import SelectField,StringField,PasswordField,IntegerField,SubmitField,DecimalField,TextAreaField,validators,BooleanField,RadioField
from wtforms.validators import InputRequired, EqualTo, NumberRange,optional,DataRequired

class RegistrationForm(FlaskForm):
    user_id = StringField('Username: ', validators=
    [InputRequired(),validators.Length(max=15)])
    password = StringField('Type in a password: ', validators = 
    [InputRequired(),validators.Length(min=5,max=25)])
    passwordRepeat = StringField('Repeat the password: ', validators = 
    [InputRequired(),EqualTo('password')])
    submit = SubmitField('Register')

class LoginForm(FlaskForm):
    user_id = StringField('Username: ', validators=
    [InputRequired(),validators.Length(max=15)])
    password = StringField('Type in a password: ', validators = 
    [InputRequired(),validators.Length(min=5,max=25)])
    submit = SubmitField('Log In')


class gameSearchForm(FlaskForm):
    game_title = StringField('Game Title or ID: ')
    submit=SubmitField('Search')